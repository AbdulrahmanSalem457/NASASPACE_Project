import copy
from datetime import datetime, timedelta, date, timezone as dt_timezone
from django.utils import timezone
from django.db.models import Avg, Min, Max, Count
from rest_framework import status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Astronaut, VitalReading, MedicalAlert, HistoricalRollup30D
from .serializers import (
    AstronautSerializer, VitalReadingSerializer, MedicalAlertSerializer,
    HistoricalRollup30DSerializer, ChecklistStepUpdateSerializer,
    ContactSurgeonSerializer, ScenarioActivateSerializer, AIAdvisorRequestSerializer,
    UpdateAstronautSettingsSerializer, UploadCSVResponseSerializer, ReportResponseSerializer
)
from .protocols_data import (
    ASTRONAUTS_SEED_DATA, PROTOCOLS_DEFINITIONS, ACTIVITY_RANGES,
    MISSION_LOCATIONS, CREW_RESPONSIBILITY_MATRIX, STANDARD_CHECKLIST_TEMPLATE
)
from .alert_engine import evaluate_vital_reading, calculate_z_score
from .space_physiology import PHYSIOLOGICAL_SYSTEMS, generate_ai_clinical_guidance


class BootstrapView(APIView):
    """
    Returns initial application payload:
    - 3 Astronaut profiles with Personal Baselines
    - Mission Locations (ISS, Moon, Mars) & delay models
    - 14 Medical Emergency Protocols
    - Activity Range Tables
    - Space Physiology Systems data
    - Crew Responsibility Matrix
    - Active alerts count & list
    """
    @extend_schema(responses={200: AstronautSerializer(many=True)})
    def get(self, request):
        astronauts = Astronaut.objects.all()
        if not astronauts.exists():
            # If not yet seeded, trigger seeder command
            from django.core.management import call_command
            call_command('seed_astrovitals')
            astronauts = Astronaut.objects.all()

        ast_data = AstronautSerializer(astronauts, many=True).data
        active_alerts = MedicalAlert.objects.filter(is_active=True).order_by('-timestamp')
        alerts_data = MedicalAlertSerializer(active_alerts, many=True).data

        payload = {
            "disclaimer": {
                "en": "Synthetic / Simulated Data & Procedures: Built on general space physiology principles for NASA Space Apps Challenge demonstration only — not official NASA protocols or medical advice. Final medical decisions belong to the Crew Medical Officer (CMO) and Flight Surgeon.",
                "ar": "تنبيه: البيانات والإجراءات تجريبية (Synthetic / Simulated Data) ومبنية على مبادئ عامة في الطب الفضائي لأغراض العرض التجريبي فقط، وليست بروتوكولات رسمية من ناسا أو نصيحة طبية."
            },
            "astronauts": ast_data,
            "mission_locations": MISSION_LOCATIONS,
            "protocols": PROTOCOLS_DEFINITIONS,
            "activity_ranges": ACTIVITY_RANGES,
            "crew_matrix": CREW_RESPONSIBILITY_MATRIX,
            "physiology_systems": PHYSIOLOGICAL_SYSTEMS,
            "active_alerts": alerts_data,
            "active_alerts_count": active_alerts.count()
        }
        return Response(payload)


class AstronautVitalsView(APIView):
    """
    Retrieves time-series vitals for an astronaut:
    - range=24h: Returns the minute-by-minute 24-hour telemetry (from sample CSV or live)
    - range=30d: Returns the 30-day daily historical rollup
    """
    @extend_schema(
        parameters=[
            OpenApiParameter(name='range', description='Time range: 24h or 30d', required=False, type=str),
            OpenApiParameter(name='limit', description='Max points to return (defaults to 1440 for 24h)', required=False, type=int),
        ],
        responses={200: VitalReadingSerializer(many=True)}
    )
    def get(self, request, astronaut_id):
        try:
            ast = Astronaut.objects.get(id=astronaut_id)
        except Astronaut.DoesNotExist:
            return Response({"error": "Astronaut not found"}, status=status.HTTP_404_NOT_FOUND)

        range_param = request.query_params.get('range', '24h')

        if range_param == '30d':
            rollups = HistoricalRollup30D.objects.filter(astronaut=ast).order_by('date')
            data = HistoricalRollup30DSerializer(rollups, many=True).data
            return Response({
                "range": "30d",
                "astronaut_id": ast.id,
                "count": len(data),
                "data": data
            })

        # 24-hour minute-by-minute telemetry
        # Sample down if requested, or return points for chart
        readings = VitalReading.objects.filter(astronaut=ast).order_by('timestamp')
        limit = int(request.query_params.get('limit', 1440))
        if limit < readings.count():
            # sample every Nth point to optimize frontend render
            step = max(1, readings.count() // limit)
            sampled_ids = readings.values_list('id', flat=True)[::step]
            readings = VitalReading.objects.filter(id__in=sampled_ids).order_by('timestamp')

        serializer = VitalReadingSerializer(readings, many=True)
        return Response({
            "range": "24h",
            "astronaut_id": ast.id,
            "count": len(serializer.data),
            "data": serializer.data
        })


class LogVitalReadingView(APIView):
    """
    POST /api/vitals/
    Logs a new vital reading, automatically runs the Alert Engine (Rules 1-5),
    calculates Z-scores, and raises a MedicalAlert if warning or critical.
    """
    @extend_schema(request=VitalReadingSerializer, responses={201: VitalReadingSerializer})
    @extend_schema(responses={200: UploadCSVResponseSerializer})
    def post(self, request):
        ast_id = request.data.get('astronaut') or request.data.get('astronaut_id')
        try:
            ast = Astronaut.objects.get(id=ast_id)
        except Astronaut.DoesNotExist:
            return Response({"error": f"Astronaut '{ast_id}' not found"}, status=status.HTTP_404_NOT_FOUND)

        reading_dict = {
            'heart_rate': float(request.data.get('heart_rate', ast.hr_mean)),
            'systolic_bp': float(request.data.get('systolic_bp', ast.sys_bp_mean)),
            'diastolic_bp': float(request.data.get('diastolic_bp', ast.dia_bp_mean)),
            'spo2': float(request.data.get('spo2', ast.spo2_mean)),
            'respiratory_rate': float(request.data.get('respiratory_rate', ast.resp_rate_mean)),
            'body_temperature': float(request.data.get('body_temperature', ast.body_temp_mean)),
            'activity': request.data.get('activity', ast.current_activity),
        }

        # Calculate 6-hour moving average for Rule 3
        now = timezone.now()
        six_hours_ago = now - timedelta(hours=6)
        ma_qs = VitalReading.objects.filter(astronaut=ast, timestamp__gte=six_hours_ago)
        moving_avg_6h = None
        if ma_qs.count() >= 10:
            agg = ma_qs.aggregate(
                hr=Avg('heart_rate'), sys=Avg('systolic_bp'), dia=Avg('diastolic_bp'),
                spo2=Avg('spo2'), rr=Avg('respiratory_rate'), temp=Avg('body_temperature')
            )
            moving_avg_6h = {
                'heart_rate': agg['hr'], 'systolic_bp': agg['sys'], 'diastolic_bp': agg['dia'],
                'spo2': agg['spo2'], 'respiratory_rate': agg['rr'], 'body_temperature': agg['temp']
            }

        # Run Alert Engine
        evaluation = evaluate_vital_reading(reading_dict, ast.get_baselines_dict(), moving_avg_6h)

        z_scores = evaluation['z_scores']
        vital_reading = VitalReading.objects.create(
            astronaut=ast,
            timestamp=now,
            activity=reading_dict['activity'],
            heart_rate=reading_dict['heart_rate'],
            systolic_bp=reading_dict['systolic_bp'],
            diastolic_bp=reading_dict['diastolic_bp'],
            spo2=reading_dict['spo2'],
            respiratory_rate=reading_dict['respiratory_rate'],
            body_temperature=reading_dict['body_temperature'],
            status=evaluation['status'],
            hr_z_score=z_scores.get('heart_rate_z', 0.0),
            sys_z_score=z_scores.get('systolic_bp_z', 0.0),
            dia_z_score=z_scores.get('diastolic_bp_z', 0.0),
            spo2_z_score=z_scores.get('spo2_z', 0.0),
            rr_z_score=z_scores.get('respiratory_rate_z', 0.0),
            temp_z_score=z_scores.get('body_temperature_z', 0.0),
            max_abs_z=evaluation['max_abs_z'],
            cabin_co2=float(request.data.get('cabin_co2', ast.cabin_co2)),
            hrv_rmssd=float(request.data.get('hrv_rmssd', ast.hrv_rmssd)),
            radiation_rate=float(request.data.get('radiation_rate', ast.daily_radiation)),
            source='live'
        )

        alert_created = None
        if evaluation['status'] in ['notice', 'warning', 'critical', 'emergency']:
            protocol = evaluation['protocol']
            primary_m = evaluation['primary_metric']
            
            # Format display strings
            val_str = f"{reading_dict.get(primary_m, '')}"
            base_dict = ast.get_baselines_dict().get(primary_m, {})
            base_str = f"Mean: {base_dict.get('mean', 'N/A')} (SD: {base_dict.get('sd', 'N/A')})"

            chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
            chk[0]["completed"] = True
            chk[0]["completed_at"] = now.strftime("%H:%M:%S UTC")

            alert_created = MedicalAlert.objects.create(
                astronaut=ast,
                vital_reading=vital_reading,
                timestamp=now,
                level=evaluation['status'],
                primary_metric=primary_m,
                title_en=f"Alert: {protocol.get('title_en', 'Biometric Anomaly')}",
                title_ar=f"إنذار: {protocol.get('title_ar', 'شذوذ حيوي')}",
                summary_en=" | ".join(evaluation['reasons_en']),
                summary_ar=" | ".join(evaluation['reasons_ar']),
                probable_cause_en=protocol.get('space_considerations_en', ''),
                probable_cause_ar=protocol.get('space_considerations_ar', ''),
                current_reading_value=val_str,
                baseline_reference=base_str,
                normal_limit_reference=f"Activity: {reading_dict['activity']}",
                z_score=evaluation['max_abs_z'],
                protocol_code=protocol.get('code', 'PROT-01'),
                protocol_title_en=protocol.get('title_en', ''),
                protocol_title_ar=protocol.get('title_ar', ''),
                is_active=True,
                elapsed_seconds=0,
                checklist_steps=chk,
                action_logs=[{
                    "timestamp": now.strftime("%H:%M:%S"),
                    "action_en": f"Alert triggered with severity: {evaluation['status'].upper()}.",
                    "action_ar": f"تم إطلاق الإنذار بدرجة خطورة: {evaluation['status'].upper()}."
                }]
            )

        resp_data = VitalReadingSerializer(vital_reading).data
        resp_data['evaluation'] = evaluation
        if alert_created:
            resp_data['alert'] = MedicalAlertSerializer(alert_created).data

        return Response(resp_data, status=status.HTTP_201_CREATED)


class MedicalAlertListView(APIView):
    """
    GET /api/alerts/ — Returns list of sorted alerts (newest & most severe first)
    """
    @extend_schema(
        parameters=[
            OpenApiParameter(name='astronaut_id', required=False, type=str),
            OpenApiParameter(name='active_only', required=False, type=bool),
        ],
        responses={200: MedicalAlertSerializer(many=True)}
    )
    def get(self, request):
        qs = MedicalAlert.objects.all()
        ast_id = request.query_params.get('astronaut_id')
        if ast_id:
            qs = qs.filter(astronaut_id=ast_id)

        active_only = request.query_params.get('active_only')
        if active_only in ['true', '1', True]:
            qs = qs.filter(is_active=True)

        # Sort order: emergency first, then critical, warning, notice; newest first
        alerts = list(qs)
        severity_map = {'emergency': 4, 'critical': 3, 'warning': 2, 'notice': 1, 'normal': 0}
        alerts.sort(key=lambda a: (severity_map.get(a.level, 0), a.timestamp), reverse=True)

        data = MedicalAlertSerializer(alerts, many=True).data
        return Response(data)


class ChecklistStepUpdateView(APIView):
    """
    POST /api/alerts/{id}/checklist/
    Updates an interactive step (1 through 8) in the alert's emergency checklist.
    """
    @extend_schema(request=ChecklistStepUpdateSerializer, responses={200: MedicalAlertSerializer})
    def post(self, request, alert_id):
        try:
            alert = MedicalAlert.objects.get(id=alert_id)
        except MedicalAlert.DoesNotExist:
            return Response({"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ChecklistStepUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        step_num = serializer.validated_data['step_num']
        completed = serializer.validated_data['completed']
        note = serializer.validated_data.get('note', '')

        steps = alert.checklist_steps or []
        updated = False
        now_str = timezone.now().strftime("%H:%M:%S UTC")

        for s in steps:
            if s.get('step') == step_num:
                s['completed'] = completed
                s['completed_at'] = now_str if completed else None
                if note:
                    s['note'] = note
                updated = True
                break

        if updated:
            alert.checklist_steps = steps
            alert.action_logs.append({
                "timestamp": timezone.now().strftime("%H:%M:%S"),
                "action_en": f"Step {step_num} marked as {'Completed' if completed else 'Incomplete'}.",
                "action_ar": f"تم تحديث الخطوة {step_num} إلى: {'مكتملة' if completed else 'غير مكتملة'}."
            })
            alert.save()

        return Response(MedicalAlertSerializer(alert).data)


class ContactFlightSurgeonView(APIView):
    """
    POST /api/alerts/{id}/contact-surgeon/
    Simulates contacting Ground Flight Surgeon and transmitting telemetry.
    Takes into account mission location comm delay (ISS: instant, Moon: 1.5s, Mars: 3-22m).
    """
    @extend_schema(request=ContactSurgeonSerializer, responses={200: MedicalAlertSerializer})
    def post(self, request, alert_id):
        try:
            alert = MedicalAlert.objects.get(id=alert_id)
        except MedicalAlert.DoesNotExist:
            return Response({"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

        loc = alert.astronaut.mission_location
        loc_cfg = MISSION_LOCATIONS.get(loc, MISSION_LOCATIONS["ISS"])

        now = timezone.now()
        alert.surgeon_contacted = True
        alert.surgeon_contacted_at = now
        alert.telemetry_sent = True

        # Complete Step 5 if present
        steps = alert.checklist_steps or []
        for s in steps:
            if s.get('step') == 5:
                s['completed'] = True
                s['completed_at'] = now.strftime("%H:%M:%S UTC")
                s['note'] = f"Telemetry bundle auto-transmitted. Comm delay: {loc_cfg['comm_delay_display']}."

        alert.checklist_steps = steps
        alert.action_logs.append({
            "timestamp": now.strftime("%H:%M:%S"),
            "action_en": f"Secure medical channel opened with Flight Surgeon. Telemetry auto-transmitted (Comm delay: {loc_cfg['comm_delay_display']}).",
            "action_ar": f"تم فتح قناة طبية مشفرة مع طبيب الرحلة وبث القياسات (زمن التأخير: {loc_cfg['comm_delay_display_ar']})."
        })
        alert.save()

        return Response({
            "alert": MedicalAlertSerializer(alert).data,
            "transmission": {
                "status": "Transmitted",
                "location": loc,
                "delay_display": loc_cfg['comm_delay_display'],
                "delay_display_ar": loc_cfg['comm_delay_display_ar'],
                "packets_sent": 1440,
                "ecg_strip_sent": True
            }
        })


class ActivateScenarioView(APIView):
    """
    POST /api/scenarios/{id}/activate/
    Activates any of the 5 prototype test scenarios for judges:
    1: Tachycardia + Hypoxia Episode (AST-02 Eng. Omar - CSV 14:04-14:37 Event)
    2: Gradual Hyperthermia (AST-03 Dr. Sara - CSV 18:00-22:00 Event)
    3: Cumulative Sleep Deprivation (<5 hrs/night + Low HRV)
    4: Cabin CO2 Spike (>5.3 mmHg + Headache & Drowsiness)
    5: Solar Particle Event (SPE) / EVA Cardiac Emergency
    """
    @extend_schema(request=ScenarioActivateSerializer, responses={200: serializers.DictField()})
    def post(self, request, scenario_id):
        scenarios_map = {
            "0": self.activate_scenario_0,
            "scenario-0": self.activate_scenario_0,
            "nominal": self.activate_scenario_0,
            "reset": self.activate_scenario_0,
            "1": self.activate_scenario_1,
            "scenario-1": self.activate_scenario_1,
            "2": self.activate_scenario_2,
            "scenario-2": self.activate_scenario_2,
            "3": self.activate_scenario_3,
            "scenario-3": self.activate_scenario_3,
            "4": self.activate_scenario_4,
            "scenario-4": self.activate_scenario_4,
            "5": self.activate_scenario_5,
            "scenario-5": self.activate_scenario_5,
        }

        handler = scenarios_map.get(str(scenario_id).lower())
        if not handler:
            return Response(
                {"error": f"Scenario '{scenario_id}' not found. Valid IDs: 1, 2, 3, 4, 5."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return handler(request)

    def get_target_astronaut(self, request, default_id='AST-02'):
        ast_id = request.data.get('astronaut_id')
        if ast_id:
            try:
                return Astronaut.objects.get(id=ast_id)
            except Astronaut.DoesNotExist:
                pass
        try:
            return Astronaut.objects.get(id=default_id)
        except Astronaut.DoesNotExist:
            return Astronaut.objects.first()

    def activate_scenario_0(self, request):
        # Scenario 0: Nominal State (All vitals normal, 0 alerts)
        ast = self.get_target_astronaut(request, 'AST-02')
        MedicalAlert.objects.filter(is_active=True).update(is_active=False)
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
            ast.save()

        reading = VitalReading.objects.create(
            astronaut=ast,
            timestamp=timezone.now(),
            heart_rate=ast.hr_mean,
            systolic_bp=ast.sys_bp_mean,
            diastolic_bp=ast.dia_bp_mean,
            spo2=ast.spo2_mean,
            respiratory_rate=ast.resp_rate_mean,
            body_temperature=ast.body_temp_mean,
            activity=ast.current_activity,
            status='normal',
            cabin_co2=3.2,
            hrv_rmssd=ast.hrv_rmssd,
            radiation_rate=ast.daily_radiation
        )

        return Response({
            "message": "Nominal Mission Scenario: All vitals normal, 0 alerts",
            "message_ar": "الوضع الاسمي الطبيعي: جميع المؤشرات طبيعية تماماً، ولا توجد أي إنذارات",
            "astronaut": AstronautSerializer(ast).data,
            "alert": None,
            "current_reading": {
                "heart_rate": ast.hr_mean,
                "systolic_bp": ast.sys_bp_mean,
                "diastolic_bp": ast.dia_bp_mean,
                "spo2": ast.spo2_mean,
                "respiratory_rate": ast.resp_rate_mean,
                "body_temperature": ast.body_temp_mean,
                "activity": ast.current_activity,
                "status": "normal",
                "cabin_co2": 3.2,
                "hrv_rmssd": ast.hrv_rmssd,
                "daily_radiation": ast.daily_radiation
            }
        })

    def activate_scenario_1(self, request):
        # Scenario 1: Tachycardia + Hypoxia Episode
        ast = self.get_target_astronaut(request, 'AST-02')
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
            ast.save()

        VitalReading.objects.create(
            astronaut=ast,
            timestamp=timezone.now(),
            heart_rate=131.0,
            systolic_bp=138.0,
            diastolic_bp=82.0,
            spo2=90.0,
            respiratory_rate=27.0,
            body_temperature=36.9,
            activity=ast.current_activity,
            status='critical',
            cabin_co2=3.2,
            hrv_rmssd=45.0,
            radiation_rate=0.55
        )
            activity=ast.current_activity,
            status='critical',
            cabin_co2=3.2,
            hrv_rmssd=45.0,
            radiation_rate=0.55
        )

        chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk[0]["completed"] = True
        chk[0]["completed_at"] = timezone.now().strftime("%H:%M:%S UTC")

        alert = MedicalAlert.objects.create(
            astronaut=ast,
            timestamp=timezone.now(),
            level='critical',
            primary_metric='multi_signal',
            title_en="Scenario 1: Compound Tachycardia + Hypoxia Crisis",
            title_ar="السيناريو 1: أزمة مركبة - تسارع ضربات القلب ونقص الأكسجين",
            summary_en="Eng. Omar HR peaked at 131 bpm (+45 bpm), SpO2 dropped to 90.0% (-6%), Respiratory Rate jumped to 27 bpm during light maintenance work.",
            summary_ar="ارتفع نبض المهندس عمر إلى 131 (+45)، ونقص SpO2 إلى 90.0% (-6%)، وقفز التنفس إلى 27 نفساً أثناء أعمال الصيانة الخفيفة.",
            probable_cause_en="Microgravity fluid shift compounding transient ventilation-perfusion mismatch and high physical load.",
            probable_cause_ar="انتقال السوائل الرأسي مع عدم تطابق التروية الرئوية والإجهاد.",
            current_reading_value="HR: 131 bpm | SpO2: 90.0% | RR: 27 bpm",
            baseline_reference="Mean HR: 68.0 bpm | SpO2: 97.0% | RR: 15.0 bpm",
            normal_limit_reference="Space Normal: HR 50-90, SpO2 95-100%, RR 12-20",
            z_score=3.85,
            protocol_code="PROT-01",
            protocol_title_en="Tachycardia & Hypoxia Dual Protocol",
            protocol_title_ar="بروتوكول تسارع القلب ونقص الأكسجين المزدوج",
            is_active=True,
            elapsed_seconds=0,
            checklist_steps=chk,
            action_logs=[{
                "timestamp": timezone.now().strftime("%H:%M:%S"),
                "action_en": "Scenario 1 triggered: Multi-Signal Compound Rule activated -> Critical Red.",
                "action_ar": "تشغيل السيناريو 1: تفعيل قاعدة التصعيد المركب -> حالة حرجة حمراء."
            }]
        )

        return Response({
            "message": "Scenario 1 Activated: Tachycardia + Hypoxia (AST-02)",
            "astronaut": AstronautSerializer(ast).data,
            "alert": MedicalAlertSerializer(alert).data,
            "current_reading": {
                "heart_rate": 131.0, "spo2": 90.0, "respiratory_rate": 27.0,
                "systolic_bp": 138.0, "diastolic_bp": 82.0, "body_temperature": 36.9
            }
        })

    def activate_scenario_2(self, request):
        # Scenario 2: Gradual Hyperthermia
        ast = self.get_target_astronaut(request, 'AST-03')
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
            ast.save()

        VitalReading.objects.create(
            astronaut=ast,
            timestamp=timezone.now(),
            heart_rate=84.0,
            systolic_bp=112.0,
            diastolic_bp=71.0,
            spo2=98.0,
            respiratory_rate=16.0,
            body_temperature=38.33,
            activity=ast.current_activity,
            status='critical',
            cabin_co2=3.2,
            hrv_rmssd=48.0,
            radiation_rate=0.55
        )

        chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk[0]["completed"] = True
        chk[0]["completed_at"] = timezone.now().strftime("%H:%M:%S UTC")

        alert = MedicalAlert.objects.create(
            astronaut=ast,
            timestamp=timezone.now(),
            level='critical',
            primary_metric='body_temperature',
            title_en="Scenario 2: Critical Core Hyperthermia ('Space Fever')",
            title_ar="السيناريو 2: ارتفاع حرج في حرارة الجسم ('حمى الفضاء')",
            summary_en="Dr. Sara's core temperature rose gradually by +1.4°C over 4 hours, peaking at 38.33°C (baseline: 36.8°C, Z = +12.75).",
            summary_ar="ارتفعت حرارة د. سارة تدريجياً بمقدار +1.4°م خلال 4 ساعات لتبلغ ذروتها عند 38.33°م (خط الأساس: 36.8°م، Z = +12.75).",
            probable_cause_en="Space Fever: Microgravity liquid sweat film insulating skin, completely impairing evaporative heat dissipation.",
            probable_cause_ar="حمى الفضاء: احتباس طبقة العرق السائلة العازلة على الجلد مما عطل فقدان الحرارة التبخيري تماماً.",
            current_reading_value="38.33 °C",
            baseline_reference="Mean: 36.80 °C (SD: 0.12)",
            normal_limit_reference="Space Normal: 36.1 - 37.5 °C (Critical > 38.30 °C)",
            z_score=12.75,
            protocol_code="PROT-07",
            protocol_title_en="Hyperthermia Active Cooling Protocol",
            protocol_title_ar="بروتوكول التبريد النشط لارتفاع الحرارة",
            is_active=True,
            elapsed_seconds=0,
            checklist_steps=chk,
            action_logs=[{
                "timestamp": timezone.now().strftime("%H:%M:%S"),
                "action_en": "Scenario 2 triggered: Core Temp crossed 38.30°C -> Critical Red.",
                "action_ar": "تشغيل السيناريو 2: تجاوز الحرارة المركزية 38.30°م -> حالة حرجة حمراء."
            }]
        )

        return Response({
            "message": "Scenario 2 Activated: Gradual Hyperthermia (AST-03)",
            "astronaut": AstronautSerializer(ast).data,
            "alert": MedicalAlertSerializer(alert).data,
            "current_reading": {
                "body_temperature": 38.33, "heart_rate": 84.0, "systolic_bp": 112.0,
                "diastolic_bp": 71.0, "spo2": 98.0, "respiratory_rate": 16.0
            }
        })

    def activate_scenario_3(self, request):
        # Scenario 3: Cumulative Sleep Deprivation
        ast = self.get_target_astronaut(request, 'AST-01')
        ast.sleep_duration = 4.2
        ast.hrv_rmssd = 22.0
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
        ast.save()

        VitalReading.objects.create(
            astronaut=ast,
            timestamp=timezone.now(),
            heart_rate=74.0,
            systolic_bp=115.0,
            diastolic_bp=72.0,
            spo2=97.2,
            respiratory_rate=16.0,
            body_temperature=36.8,
            activity=ast.current_activity,
            status='warning',
            cabin_co2=3.2,
            hrv_rmssd=22.0,
            radiation_rate=0.55
        )

        chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk[0]["completed"] = True
        chk[0]["completed_at"] = timezone.now().strftime("%H:%M:%S UTC")

        alert = MedicalAlert.objects.create(
            astronaut=ast,
            timestamp=timezone.now(),
            level='warning',
            primary_metric='sleep_deprivation',
            title_en="Scenario 3: Cumulative Sleep Deprivation & Autonomic Fatigue",
            title_ar="السيناريو 3: حرمان تراكمي من النوم وتدهور التوازن العصبي",
            summary_en="Cmdr. Layla recorded < 4.5 hours of sleep for 3 consecutive nights. HRV (RMSSD) plummeted from 52 ms baseline down to 22 ms (elevated error risk).",
            summary_ar="سجلت القائدة ليلى أقل من 4.5 ساعة نوم لـ 3 ليالٍ متتالية. وهبط مؤشر HRV من 52 مللي ثانية إلى 22 مللي ثانية (خطر خطأ معرفي مرتفع).",
            probable_cause_en="Circadian misalignment from 16 daily orbital sunsets/sunrises + high mission workload.",
            probable_cause_ar="اضطراب النظم اليوماوي بسبب 16 شروقاً وغروباً يومياً مع ضغط العمل.",
            current_reading_value="Sleep: 4.2 hrs | HRV RMSSD: 22.0 ms",
            baseline_reference="Normal Sleep: 6.8 hrs | Baseline HRV: 52.0 ms",
            normal_limit_reference="Threshold: < 5.0 hrs + HRV < 25 ms",
            z_score=-3.1,
            protocol_code="PROT-12",
            protocol_title_en="Sleep Deprivation & Fatigue Protocol",
            protocol_title_ar="بروتوكول الحرمان من النوم والإرهاق التراكمي",
            is_active=True,
            elapsed_seconds=0,
            checklist_steps=chk,
            action_logs=[{
                "timestamp": timezone.now().strftime("%H:%M:%S"),
                "action_en": "Scenario 3 triggered: Cognitive error risk alert -> Warning Amber.",
                "action_ar": "تشغيل السيناريو 3: إنذار مخاطر الخطأ الإدراكي -> تحذير أصفر."
            }]
        )

        return Response({
            "message": "Scenario 3 Activated: Sleep Deprivation & Low HRV (AST-01)",
            "astronaut": AstronautSerializer(ast).data,
            "alert": MedicalAlertSerializer(alert).data,
            "current_reading": {
                "sleep_duration": 4.2, "hrv_rmssd": 22.0, "heart_rate": 74.0,
                "systolic_bp": 115.0, "diastolic_bp": 72.0, "spo2": 97.2, "respiratory_rate": 16.0,
                "body_temperature": 36.8, "status": "warning"
            }
        })

    def activate_scenario_4(self, request):
        # Scenario 4: Cabin CO2 Spike (> 5.3 mmHg + Headache)
        ast = self.get_target_astronaut(request, 'AST-02')
        ast.cabin_co2 = 5.8
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
        ast.save()

        VitalReading.objects.create(
            astronaut=ast,
            timestamp=timezone.now(),
            heart_rate=76.0,
            systolic_bp=120.0,
            diastolic_bp=75.0,
            spo2=96.5,
            respiratory_rate=18.0,
            body_temperature=36.9,
            activity=ast.current_activity,
            status='warning',
            cabin_co2=5.8,
            hrv_rmssd=40.0,
            radiation_rate=0.55
        )

        chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk[0]["completed"] = True
        chk[0]["completed_at"] = timezone.now().strftime("%H:%M:%S UTC")

        alert = MedicalAlert.objects.create(
            astronaut=ast,
            timestamp=timezone.now(),
            level='warning',
            primary_metric='cabin_co2',
            title_en="Scenario 4: Cabin CO2 Partial Pressure Spike",
            title_ar="السيناريو 4: ارتفاع الضغط الجزئي لثاني أكسيد الكربون بالكابينة",
            summary_en="Environmental sensors detect cabin CO2 elevation to 5.8 mmHg (normal: 2.0-5.0 mmHg). Astronaut reports frontal headache and mild drowsiness.",
            summary_ar="رصدت مجسات البيئة ارتفاع CO2 إلى 5.8 ملم زئبق (الطبيعي: 2.0-5.0). ويشكو الرائد من صداع أمامي ونعاس خفيف.",
            probable_cause_en="Carbon Dioxide Removal Assembly (CDRA) scrubber bed saturation or impaired module air mixing.",
            probable_cause_ar="تشبع وسائد امتصاص جهاز تنقية ثاني أكسيد الكربون (CDRA) أو ضعف خلط الهواء بين الوحدات.",
            current_reading_value="Cabin CO2: 5.8 mmHg",
            baseline_reference="Space Nominal: 2.0 - 5.0 mmHg (Earth: 0.3 mmHg)",
            normal_limit_reference="Warning Threshold: > 5.3 mmHg",
            z_score=2.6,
            protocol_code="PROT-08",
            protocol_title_en="High Cabin CO2 Protocol",
            protocol_title_ar="بروتوكول ارتفاع ثاني أكسيد الكربون في الكابينة",
            is_active=True,
            elapsed_seconds=0,
            checklist_steps=chk,
            action_logs=[{
                "timestamp": timezone.now().strftime("%H:%M:%S"),
                "action_en": "Scenario 4 triggered: Cabin CO2 crossed 5.3 mmHg -> Warning Amber.",
                "action_ar": "تشغيل السيناريو 4: تجاوز ثاني أكسيد الكربون 5.3 ملم زئبق -> تحذير أصفر."
            }]
        )

        return Response({
            "message": "Scenario 4 Activated: Cabin CO2 Spike (5.8 mmHg)",
            "astronaut": AstronautSerializer(ast).data,
            "alert": MedicalAlertSerializer(alert).data,
            "current_reading": {
                "cabin_co2": 5.8, "respiratory_rate": 18.0, "heart_rate": 76.0,
                "systolic_bp": 120.0, "diastolic_bp": 75.0, "spo2": 96.5,
                "body_temperature": 36.9, "status": "warning"
            }
        })

    def activate_scenario_5(self, request):
        # Scenario 5: Solar Particle Event (SPE) / EVA Cardiac Emergency
        mode = request.data.get('mode', 'cardiac_arrest') # or 'spe'
        ast = self.get_target_astronaut(request, 'AST-01')
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
            ast.save()

        chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk[0]["completed"] = True
        chk[0]["completed_at"] = timezone.now().strftime("%H:%M:%S UTC")

        if mode == 'spe':
            ast.daily_radiation = 3.2
            ast.save()

            VitalReading.objects.create(
                astronaut=ast,
                timestamp=timezone.now(),
                heart_rate=105.0,
                systolic_bp=135.0,
                diastolic_bp=88.0,
                spo2=96.0,
                respiratory_rate=20.0,
                body_temperature=37.2,
                activity='light',
                status='critical',
                cabin_co2=3.2,
                hrv_rmssd=30.0,
                radiation_rate=3.2
            )

            alert = MedicalAlert.objects.create(
                astronaut=ast,
                timestamp=timezone.now(),
                level='critical',
                primary_metric='spe',
                title_en="Scenario 5: Solar Particle Event (SPE) Radiation Storm",
                title_ar="السيناريو 5: عاصفة إشعاعية شمسية (SPE)",
                summary_en="Solar flare event detected. Radiation dose rate spiked to 3.2 mSv/day (normal: 0.4-0.8 mSv/day). Mandatory crew evacuation to Storm Shelter.",
                summary_ar="رصد توهج شمسي حاد. قفزت الجرعة الإشعاعية إلى 3.2 ملي سيفرت/يوم (الطبيعي: 0.4-0.8). إخلاء إلزامي لكافة الطاقم للمأوى المصفح.",
                probable_cause_en="Coronal Mass Ejection (CME) directed toward orbital plane.",
                probable_cause_ar="انبعاث كتلي إكليلي شمسي متجه نحو المسار المداري.",
                current_reading_value="Radiation: 3.2 mSv/day",
                baseline_reference="Nominal ISS: 0.4 - 0.8 mSv/day",
                normal_limit_reference="Evacuation Threshold: > 2.5 mSv/day",
                z_score=5.5,
                protocol_code="PROT-11",
                protocol_title_en="Solar Particle Event (SPE) Protocol",
                protocol_title_ar="بروتوكول العاصفة الإشعاعية الشمسية (SPE)",
                is_active=True,
                elapsed_seconds=0,
                checklist_steps=chk,
                action_logs=[{
                    "timestamp": timezone.now().strftime("%H:%M:%S"),
                    "action_en": "Scenario 5 (SPE) triggered -> Radiation Storm Shelter Protocol.",
                    "action_ar": "تشغيل السيناريو 5 (عاصفة إشعاعية) -> تفعيل بروتوكول المأوى المصفح."
                }]
            )

            curr_reading = {
                "heart_rate": 105.0, "systolic_bp": 135.0, "diastolic_bp": 88.0,
                "spo2": 96.0, "respiratory_rate": 20.0, "body_temperature": 37.2,
                "daily_radiation": 3.2, "status": "critical"
            }
        else: # cardiac_arrest / Emergency
            VitalReading.objects.create(
                astronaut=ast,
                timestamp=timezone.now(),
                heart_rate=0.0,
                systolic_bp=0.0,
                diastolic_bp=0.0,
                spo2=60.0,
                respiratory_rate=0.0,
                body_temperature=36.5,
                activity='rest',
                status='emergency',
                cabin_co2=3.2,
                hrv_rmssd=0.0,
                radiation_rate=0.55
            )

            alert = MedicalAlert.objects.create(
                astronaut=ast,
                timestamp=timezone.now(),
                level='emergency',
                primary_metric='cardiac_arrest',
                title_en="Scenario 5: ALL-CREW EMERGENCY — Cardiac / Respiratory Collapse",
                title_ar="السيناريو 5: طوارئ قصوى للطاقم — انهيار قلبي وتنفسي مفاجئ",
                summary_en="CRITICAL EMERGENCY: Sudden loss of consciousness during extravehicular activity prep. Absence of pulse, agonal respirations, telemetry flatline.",
                summary_ar="طوارئ قصوى: فقدان مفاجئ للوعي أثناء التجهيز للسير الفضائي. غياب النبض وتوقف التنفس والقياسات الحيوية منهارة.",
                probable_cause_en="Microgravity malignant dysrhythmia or acute neurovascular syncope.",
                probable_cause_ar="اضطراب نظم قلبي خبيث في انعدام الوزن أو هبوط وعائي حاد.",
                current_reading_value="HR: 0 bpm | RR: 0 breaths/min | SpO2: 60%",
                baseline_reference="Mean HR: 62.0 bpm | Resp: 14.0 breaths/min",
                normal_limit_reference="Emergency Life Support Rule 5",
                z_score=-15.0,
                protocol_code="PROT-10",
                protocol_title_en="Cardiac or Respiratory Arrest Protocol (Microgravity CPR)",
                protocol_title_ar="بروتوكول إنعاش القلب والتنفس في انعدام الجاذبية (CPR & AED)",
                is_active=True,
                elapsed_seconds=0,
                checklist_steps=chk,
                action_logs=[{
                    "timestamp": timezone.now().strftime("%H:%M:%S"),
                    "action_en": "Rule 5 ALL-CREW EMERGENCY SIREN ACTIVATED. Deploy CMRS Board and AED.",
                    "action_ar": "إطلاق صفارات الإنذار القصوى للطاقم (القاعدة 5). نشر لوح التثبيت CMRS وجهاز الصدمات AED."
                }]
            )

            curr_reading = {
                "heart_rate": 0.0, "systolic_bp": 0.0, "diastolic_bp": 0.0,
                "spo2": 60.0, "respiratory_rate": 0.0, "body_temperature": 36.5,
                "status": "emergency"
            }

        return Response({
            "message": f"Scenario 5 Activated ({mode.upper()})",
            "astronaut": AstronautSerializer(ast).data,
            "alert": MedicalAlertSerializer(alert).data,
            "is_emergency": (mode != 'spe'),
            "current_reading": curr_reading
        })


class AIAdvisorView(APIView):
    """
    POST /api/ai-advisor/
    Clinical Decision Support Endpoint:
    Analyzes astronaut telemetry vs Personal Baseline (Z-scores), identifies
    space physiology mechanisms (Fluid Shift, Plasma Loss, Space Fever, SANS),
    and returns comprehensive bilingual clinical guidance.
    """
    @extend_schema(request=AIAdvisorRequestSerializer, responses={200: serializers.DictField()})
    @extend_schema(responses={200: UploadCSVResponseSerializer})
    def post(self, request):
        serializer = AIAdvisorRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ast_id = serializer.validated_data['astronaut_id']
        try:
            ast = Astronaut.objects.get(id=ast_id)
        except Astronaut.DoesNotExist:
            return Response({"error": "Astronaut not found"}, status=status.HTTP_404_NOT_FOUND)

        reading_dict = {
            'heart_rate': serializer.validated_data.get('heart_rate', ast.hr_mean),
            'systolic_bp': serializer.validated_data.get('systolic_bp', ast.sys_bp_mean),
            'diastolic_bp': serializer.validated_data.get('diastolic_bp', ast.dia_bp_mean),
            'spo2': serializer.validated_data.get('spo2', ast.spo2_mean),
            'respiratory_rate': serializer.validated_data.get('respiratory_rate', ast.resp_rate_mean),
            'body_temperature': serializer.validated_data.get('body_temperature', ast.body_temp_mean),
            'activity': serializer.validated_data.get('activity', ast.current_activity),
        }

        evaluation = evaluate_vital_reading(reading_dict, ast.get_baselines_dict())
        guidance = generate_ai_clinical_guidance(ast, reading_dict, evaluation)

        return Response({
            "astronaut_id": ast.id,
            "astronaut_name": ast.name,
            "astronaut_name_ar": ast.name_ar,
            "timestamp": timezone.now().isoformat(),
            "evaluation": evaluation,
            "clinical_guidance": guidance
        })


class ReportsView(APIView):
    """
    GET /api/reports/{astronaut_id}/?period=daily|weekly
    Generates statistical health summaries:
    - Daily & Weekly averages, min/max readings
    - Alert counts by severity level
    - Sleep hours & Exercise hours compliance (target: 2.5 hrs/day)
    """
    @extend_schema(
        parameters=[OpenApiParameter(name='period', description='daily or weekly', required=False, type=str)],
        responses={200: ReportResponseSerializer}
    )
    def get(self, request, astronaut_id):
        try:
            ast = Astronaut.objects.get(id=astronaut_id)
        except Astronaut.DoesNotExist:
            return Response({"error": "Astronaut not found"}, status=status.HTTP_404_NOT_FOUND)

        period = request.query_params.get('period', 'daily').lower()
        now = timezone.now()

        if period == 'weekly':
            start_date = now - timedelta(days=7)
            title = f"7-Day Health & Compliance Summary — {ast.name}"
            title_ar = f"تقرير الملخص الأسبوعي والامتثال الصحي (7 أيام) — {ast.name_ar}"
        else:
            start_date = now - timedelta(days=1)
            title = f"24-Hour Telemetry Report — {ast.name}"
            title_ar = f"تقرير القياسات الحيوية لـ 24 ساعة — {ast.name_ar}"

        vitals_qs = VitalReading.objects.filter(astronaut=ast, timestamp__gte=start_date)
        if not vitals_qs.exists():
            vitals_qs = VitalReading.objects.filter(astronaut=ast)[:1440]

        agg = vitals_qs.aggregate(
            avg_hr=Avg('heart_rate'), min_hr=Min('heart_rate'), max_hr=Max('heart_rate'),
            avg_sys=Avg('systolic_bp'), min_sys=Min('systolic_bp'), max_sys=Max('systolic_bp'),
            avg_dia=Avg('diastolic_bp'), min_dia=Min('diastolic_bp'), max_dia=Max('diastolic_bp'),
            avg_spo2=Avg('spo2'), min_spo2=Min('spo2'), max_spo2=Max('spo2'),
            avg_rr=Avg('respiratory_rate'), min_rr=Min('respiratory_rate'), max_rr=Max('respiratory_rate'),
            avg_temp=Avg('body_temperature'), min_temp=Min('body_temperature'), max_temp=Max('body_temperature'),
            avg_hrv=Avg('hrv_rmssd')
        )

        alerts_qs = MedicalAlert.objects.filter(astronaut=ast, timestamp__gte=start_date)
        alert_breakdown = {
            "notice": alerts_qs.filter(level='notice').count(),
            "warning": alerts_qs.filter(level='warning').count(),
            "critical": alerts_qs.filter(level='critical').count(),
            "emergency": alerts_qs.filter(level='emergency').count(),
            "total": alerts_qs.count()
        }

        # Compliance metrics
        exercise_target = 2.5
        actual_exercise = ast.exercise_hours
        exercise_compliance = min(100.0, round((actual_exercise / exercise_target) * 100.0, 1))

        sleep_target = 6.5
        actual_sleep = ast.sleep_duration
        sleep_compliance = min(100.0, round((actual_sleep / sleep_target) * 100.0, 1))

        report_data = {
            "period": period,
            "title_en": title,
            "title_ar": title_ar,
            "generated_at": now.isoformat(),
            "astronaut": AstronautSerializer(ast).data,
            "vitals_statistics": {
                "heart_rate": {"avg": round(agg['avg_hr'] or ast.hr_mean, 1), "min": round(agg['min_hr'] or ast.hr_mean-10, 1), "max": round(agg['max_hr'] or ast.hr_mean+60, 1), "unit": "bpm"},
                "systolic_bp": {"avg": round(agg['avg_sys'] or ast.sys_bp_mean, 1), "min": round(agg['min_sys'] or ast.sys_bp_mean-15, 1), "max": round(agg['max_sys'] or ast.sys_bp_mean+30, 1), "unit": "mmHg"},
                "diastolic_bp": {"avg": round(agg['avg_dia'] or ast.dia_bp_mean, 1), "min": round(agg['min_dia'] or ast.dia_bp_mean-10, 1), "max": round(agg['max_dia'] or ast.dia_bp_mean+15, 1), "unit": "mmHg"},
                "spo2": {"avg": round(agg['avg_spo2'] or ast.spo2_mean, 1), "min": round(agg['min_spo2'] or 90.0, 1), "max": round(agg['max_spo2'] or 100.0, 1), "unit": "%"},
                "respiratory_rate": {"avg": round(agg['avg_rr'] or ast.resp_rate_mean, 1), "min": round(agg['min_rr'] or 10.0, 1), "max": round(agg['max_rr'] or 28.0, 1), "unit": "breaths/min"},
                "body_temperature": {"avg": round(agg['avg_temp'] or ast.body_temp_mean, 2), "min": round(agg['min_temp'] or 36.4, 2), "max": round(agg['max_temp'] or 38.33, 2), "unit": "°C"},
                "hrv_rmssd": {"avg": round(agg['avg_hrv'] or ast.hrv_rmssd, 1), "unit": "ms"}
            },
            "alerts_summary": alert_breakdown,
            "countermeasures": {
                "exercise_hours_completed": actual_exercise,
                "exercise_hours_target": exercise_target,
                "exercise_compliance_pct": exercise_compliance,
                "sleep_hours_actual": actual_sleep,
                "sleep_hours_target": sleep_target,
                "sleep_compliance_pct": sleep_compliance,
                "daily_radiation_dose_msv": ast.daily_radiation,
                "radiation_career_limit_msv": 600.0
            }
        }
        return Response(report_data)


class UploadCSVVitalsView(APIView):
    """
    POST /api/vitals/upload-csv/
    Dynamically uploads and ingests a vitals CSV file (such as astronaut_vitals_sample_24h.csv).
    """
    @extend_schema(
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {
                        'type': 'string',
                        'format': 'binary'
                    }
                }
            }
        },
        responses={200: UploadCSVResponseSerializer}
    )
    def post(self, request):
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({"error": "No file uploaded. Expected 'file' multipart form field."}, status=status.HTTP_400_BAD_REQUEST)

        import csv
        import io

        decoded = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded)
        reader = csv.DictReader(io_string)

        astronauts = {a.id: a for a in Astronaut.objects.all()}
        created_count = 0
        vitals_batch = []

        for row in reader:
            ast = astronauts.get(row.get('astronaut_id'))
            if not ast:
                continue

            try:
                ts = datetime.fromisoformat(row['timestamp'])
                ts = timezone.make_aware(ts, dt_timezone.utc)
            except Exception:
                ts = timezone.now()

            hr = float(row.get('heart_rate', ast.hr_mean))
            sys = float(row.get('systolic_bp', ast.sys_bp_mean))
            dia = float(row.get('diastolic_bp', ast.dia_bp_mean))
            spo2 = float(row.get('spo2', ast.spo2_mean))
            rr = float(row.get('respiratory_rate', ast.resp_rate_mean))
            temp = float(row.get('body_temperature', ast.body_temp_mean))

            hr_z = calculate_z_score(hr, ast.hr_mean, ast.hr_sd)
            sys_z = calculate_z_score(sys, ast.sys_bp_mean, ast.sys_bp_sd)
            dia_z = calculate_z_score(dia, ast.dia_bp_mean, ast.dia_bp_sd)
            spo2_z = calculate_z_score(spo2, ast.spo2_mean, ast.spo2_sd)
            rr_z = calculate_z_score(rr, ast.resp_rate_mean, ast.resp_rate_sd)
            temp_z = calculate_z_score(temp, ast.body_temp_mean, ast.body_temp_sd)

            vitals_batch.append(VitalReading(
                astronaut=ast,
                timestamp=ts,
                activity=row.get('activity', 'rest'),
                heart_rate=hr,
                systolic_bp=sys,
                diastolic_bp=dia,
                spo2=spo2,
                respiratory_rate=rr,
                body_temperature=temp,
                status=row.get('status', 'normal'),
                hr_z_score=hr_z,
                sys_z_score=sys_z,
                dia_z_score=dia_z,
                spo2_z_score=spo2_z,
                rr_z_score=rr_z,
                temp_z_score=temp_z,
                max_abs_z=max(abs(hr_z), abs(sys_z), abs(dia_z), abs(spo2_z), abs(rr_z), abs(temp_z)),
                source='uploaded_csv'
            ))

        if vitals_batch:
            VitalReading.objects.bulk_create(vitals_batch, batch_size=1000)
            created_count = len(vitals_batch)

        return Response({
            "message": f"Successfully parsed and ingested {created_count} vital records.",
            "records_imported": created_count
        })


class UpdateAstronautSettingsView(APIView):
    """
    POST /api/astronauts/{id}/settings/
    Updates current activity (rest, light, sleep, exercise) or mission location (ISS, Moon, Mars).
    """
    @extend_schema(request=UpdateAstronautSettingsSerializer, responses={200: AstronautSerializer})
    def post(self, request, astronaut_id):
        try:
            ast = Astronaut.objects.get(id=astronaut_id)
        except Astronaut.DoesNotExist:
            return Response({"error": "Astronaut not found"}, status=status.HTTP_404_NOT_FOUND)

        if 'activity' in request.data:
            ast.current_activity = request.data['activity']
        if 'mission_location' in request.data:
            ast.mission_location = request.data['mission_location']

        ast.save()
        return Response(AstronautSerializer(ast).data)
