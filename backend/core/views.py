import copy
import csv
import io
from datetime import datetime, timedelta, timezone as dt_timezone
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Avg, Min, Max
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import (
    Astronaut, VitalReading, MedicalAlert,
    HistoricalRollup30D, MedicalKitItem, EVAPlan
)
from .serializers import (
    AstronautSerializer, VitalReadingSerializer, MedicalAlertSerializer,
    HistoricalRollup30DSerializer, MedicalKitItemSerializer, MedicalKitUseSerializer,
    EVAPlanSerializer, EVAPlanCreateSerializer,
    ChecklistStepUpdateSerializer, ContactSurgeonSerializer,
    ScenarioActivateSerializer, AIAdvisorRequestSerializer,
    IncidentAssistantRequestSerializer, UpdateAstronautSettingsSerializer,
    UploadCSVResponseSerializer, ReportResponseSerializer
)
from .protocols_data import (
    PROTOCOLS_DEFINITIONS, ACTIVITY_RANGES, RADIATION_LIMITS,
    MISSION_LOCATIONS, CREW_RESPONSIBILITY_MATRIX, STANDARD_CHECKLIST_TEMPLATE
)
from .alert_engine import evaluate_vital_reading, calculate_z_score
from .space_physiology import PHYSIOLOGICAL_SYSTEMS, generate_ai_clinical_guidance
from .clinical_ops import (
    compute_radiation_budget, generate_sbar_report,
    evaluate_eva_readiness, run_incident_assistant
)


def _astronaut_to_reading_dict(ast):
    latest_live = VitalReading.objects.filter(
        astronaut=ast,
        source__in=['live', 'live_slider', 'scenario']
    ).order_by('-timestamp').first()

    if latest_live:
        return {
            'heart_rate': latest_live.heart_rate,
            'systolic_bp': latest_live.systolic_bp,
            'diastolic_bp': latest_live.diastolic_bp,
            'spo2': latest_live.spo2,
            'respiratory_rate': latest_live.respiratory_rate,
            'body_temperature': latest_live.body_temperature,
            'cabin_co2': ast.cabin_co2,
            'daily_radiation': ast.daily_radiation,
            'ecg_qtc': ast.ecg_qtc,
            'hrv_rmssd': ast.hrv_rmssd,
            'sleep_duration': ast.sleep_duration,
            'cabin_pressure': ast.cabin_pressure,
            'activity': latest_live.activity or ast.current_activity,
        }

    return {
        'heart_rate': ast.hr_mean,
        'systolic_bp': ast.sys_bp_mean,
        'diastolic_bp': ast.dia_bp_mean,
        'spo2': ast.spo2_mean,
        'respiratory_rate': ast.resp_rate_mean,
        'body_temperature': ast.body_temp_mean,
        'cabin_co2': ast.cabin_co2,
        'daily_radiation': ast.daily_radiation,
        'ecg_qtc': ast.ecg_qtc,
        'hrv_rmssd': ast.hrv_rmssd,
        'sleep_duration': ast.sleep_duration,
        'cabin_pressure': ast.cabin_pressure,
        'activity': ast.current_activity,
    }


class BootstrapView(APIView):
    """
    Returns initial application payload:
    - 6 Crew profiles with Personal Baselines & Radiation Budgets
    - Mission Locations (ISS, Moon, Mars) & delay models
    - 14 Medical Emergency Protocols
    - Activity Range Tables (including EVA)
    - Smart Medical Kit (12 items) & Saved EVA Plans
    - Active alerts count & list
    """
    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        astronauts = Astronaut.objects.all()
        if not astronauts.exists():
            from django.core.management import call_command
            call_command('seed_astrovitals')
            astronauts = Astronaut.objects.all()

        ast_data = AstronautSerializer(astronauts, many=True).data
        active_alerts = MedicalAlert.objects.filter(is_active=True).order_by('-timestamp')
        alerts_data = MedicalAlertSerializer(active_alerts, many=True).data
        active_protocols = {a.protocol_code for a in active_alerts}

        med_kit = MedicalKitItem.objects.all()
        med_kit_data = MedicalKitItemSerializer(
            med_kit, many=True, context={'active_protocols': active_protocols}
        ).data

        eva_plans = EVAPlan.objects.all()[:20]
        eva_data = EVAPlanSerializer(eva_plans, many=True).data

        radiation_budgets = {
            ast.id: compute_radiation_budget(ast) for ast in astronauts
        }

        payload = {
            "disclaimer": {
                "en": "Synthetic / Simulated Data & Procedures: Built on general space physiology principles for NASA Space Apps Challenge demonstration only — not official NASA protocols or medical advice.",
                "ar": "تنبيه: البيانات والإجراءات تجريبية ومبنية على مبادئ عامة في الطب الفضائي لأغراض العرض التجريبي فقط، وليست نصيحة طبية رسمية."
            },
            "astronauts": ast_data,
            "mission_locations": MISSION_LOCATIONS,
            "protocols": PROTOCOLS_DEFINITIONS,
            "activity_ranges": ACTIVITY_RANGES,
            "crew_matrix": CREW_RESPONSIBILITY_MATRIX,
            "physiology_systems": PHYSIOLOGICAL_SYSTEMS,
            "active_alerts": alerts_data,
            "active_alerts_count": active_alerts.count(),
            "medical_kit": med_kit_data,
            "eva_plans": eva_data,
            "radiation_limits": RADIATION_LIMITS,
            "radiation_budgets": radiation_budgets,
        }
        return Response(payload)


class AstronautVitalsView(APIView):
    """
    Retrieves time-series vitals for an astronaut:
    - range=24h: Returns the minute-by-minute 24-hour telemetry
    - range=30d: Returns the 30-day daily historical rollup
    """
    @extend_schema(
        parameters=[
            OpenApiParameter(name='range', description='Time range: 24h or 30d', required=False, type=str),
            OpenApiParameter(name='limit', description='Max points to return (defaults to 1440 for 24h)', required=False, type=int),
        ],
        responses={200: OpenApiTypes.OBJECT}
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

        readings = VitalReading.objects.filter(astronaut=ast).order_by('timestamp')
        limit = int(request.query_params.get('limit', 1440))
        if limit < readings.count():
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
    Logs a live vital + environmental reading (including from interactive sliders),
    runs the Unified Global Alert & Risk Engine (6 Core + 6 Contextual Metrics),
    updates readiness & radiation budget, and raises/clears MedicalAlert accordingly.
    """
    @extend_schema(request=VitalReadingSerializer, responses={201: OpenApiTypes.OBJECT})
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
            'cabin_co2': float(request.data.get('cabin_co2', ast.cabin_co2)),
            'daily_radiation': float(request.data.get('daily_radiation', request.data.get('radiation_rate', ast.daily_radiation))),
            'ecg_qtc': int(float(request.data.get('ecg_qtc', ast.ecg_qtc))),
            'hrv_rmssd': float(request.data.get('hrv_rmssd', ast.hrv_rmssd)),
            'sleep_duration': float(request.data.get('sleep_duration', ast.sleep_duration)),
            'cabin_pressure': float(request.data.get('cabin_pressure', ast.cabin_pressure)),
            'activity': request.data.get('activity', ast.current_activity),
            'is_emergency': bool(request.data.get('is_emergency', False)),
        }

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

        evaluation = evaluate_vital_reading(reading_dict, ast.get_baselines_dict(), moving_avg_6h)
        z_scores = evaluation['z_scores']

        # Persist contextual updates onto astronaut state
        ast.current_activity = reading_dict['activity']
        ast.cabin_co2 = reading_dict['cabin_co2']
        ast.daily_radiation = reading_dict['daily_radiation']
        ast.ecg_qtc = reading_dict['ecg_qtc']
        ast.hrv_rmssd = reading_dict['hrv_rmssd']
        ast.sleep_duration = reading_dict['sleep_duration']
        ast.cabin_pressure = reading_dict['cabin_pressure']
        if reading_dict['heart_rate'] < 25:
            ast.ecg_rhythm = 'Ventricular Arrest / Asystole'
        elif reading_dict['ecg_qtc'] >= 450:
            ast.ecg_rhythm = 'Prolonged QTc / Ectopy'
        elif reading_dict['heart_rate'] > 105:
            ast.ecg_rhythm = 'Sinus Tachycardia'
        else:
            ast.ecg_rhythm = 'Normal Sinus'
        ast.save()

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
            ecg_qtc=reading_dict['ecg_qtc'],
            ecg_rhythm=ast.ecg_rhythm,
            cabin_co2=reading_dict['cabin_co2'],
            cabin_pressure=reading_dict['cabin_pressure'],
            sleep_duration=reading_dict['sleep_duration'],
            hrv_rmssd=reading_dict['hrv_rmssd'],
            radiation_rate=reading_dict['daily_radiation'],
            source=request.data.get('source', 'live_slider')
        )

        replace_active = request.data.get('replace_active', True)
        if replace_active:
            MedicalAlert.objects.filter(is_active=True).update(is_active=False)

        alert_created = None
        if evaluation['status'] in ['notice', 'warning', 'critical', 'emergency']:
            protocol = evaluation['protocol']
            primary_m = evaluation['primary_metric']

            if primary_m in reading_dict:
                val_str = f"{primary_m}: {reading_dict.get(primary_m)}"
            else:
                val_str = f"HR: {reading_dict['heart_rate']} bpm | SpO2: {reading_dict['spo2']}% | CO2: {reading_dict['cabin_co2']} mmHg"

            base_dict = ast.get_baselines_dict().get(primary_m, {})
            base_str = f"Mean: {base_dict.get('mean', 'Nominal')} (SD: {base_dict.get('sd', '-')})"

            chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
            chk[0]["completed"] = True
            chk[0]["completed_at"] = now.strftime("%H:%M:%S UTC")

            alert_created = MedicalAlert.objects.create(
                astronaut=ast,
                vital_reading=vital_reading,
                timestamp=now,
                level=evaluation['status'],
                primary_metric=primary_m,
                title_en=f"Live Alert: {protocol.get('title_en', 'Biometric Anomaly')}",
                title_ar=f"إنذار حي: {protocol.get('title_ar', 'شذوذ حيوي')}",
                summary_en=" | ".join(evaluation['reasons_en']) or "Out-of-range telemetry detected.",
                summary_ar=" | ".join(evaluation['reasons_ar']) or "تم رصد قراءة خارج النطاق الآمن.",
                probable_cause_en=protocol.get('space_considerations_en', ''),
                probable_cause_ar=protocol.get('space_considerations_ar', ''),
                current_reading_value=val_str,
                baseline_reference=base_str,
                normal_limit_reference=f"Activity: {reading_dict['activity']} | Risk: {evaluation['risk_score']}/100",
                z_score=evaluation['max_abs_z'],
                protocol_code=protocol.get('code', 'PROT-01'),
                protocol_title_en=protocol.get('title_en', ''),
                protocol_title_ar=protocol.get('title_ar', ''),
                is_active=True,
                elapsed_seconds=0,
                checklist_steps=chk,
                action_logs=[{
                    "timestamp": now.strftime("%H:%M:%S"),
                    "action_en": f"Global Engine triggered {evaluation['status'].upper()} alert (Protocol {protocol.get('code')}, Risk {evaluation['risk_score']}/100).",
                    "action_ar": f"أطلق المحرك إنذاراً بدرجة {evaluation['status'].upper()} (بروتوكول {protocol.get('code')}، مخاطرة {evaluation['risk_score']}/100)."
                }]
            )

        rad_budget = compute_radiation_budget(ast, reading_dict['daily_radiation'])
        required_kit_codes = []
        if alert_created:
            required_kit_codes = [
                k.code for k in MedicalKitItem.objects.all()
                if alert_created.protocol_code in (k.related_protocols or [])
            ]

        resp_data = VitalReadingSerializer(vital_reading).data
        resp_data['evaluation'] = evaluation
        resp_data['astronaut_profile'] = AstronautSerializer(ast).data
        resp_data['radiation_budget'] = rad_budget
        resp_data['required_kit_codes'] = required_kit_codes
        resp_data['alert'] = MedicalAlertSerializer(alert_created).data if alert_created else None

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

        alerts = list(qs)
        severity_map = {'emergency': 4, 'critical': 3, 'warning': 2, 'notice': 1, 'normal': 0}
        alerts.sort(key=lambda a: (1 if a.is_active else 0, a.timestamp, severity_map.get(a.level, 0)), reverse=True)

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
    """
    @extend_schema(request=ContactSurgeonSerializer, responses={200: OpenApiTypes.OBJECT})
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
    Activates any of the prototype test scenarios (0 to 5) with unified Global Status & Risk output.
    """
    @extend_schema(request=ScenarioActivateSerializer, responses={200: OpenApiTypes.OBJECT})
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
                {"error": f"Scenario '{scenario_id}' not found. Valid IDs: 0, 1, 2, 3, 4, 5."},
                status=status.HTTP_400_BAD_REQUEST
            )

        MedicalAlert.objects.filter(is_active=True).update(is_active=False)
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

    def _package_response(self, message, ast, alert, curr_reading):
        eval_res = evaluate_vital_reading(curr_reading, ast.get_baselines_dict())
        return Response({
            "message": message,
            "astronaut": AstronautSerializer(ast).data,
            "alert": MedicalAlertSerializer(alert).data if alert else None,
            "evaluation": eval_res,
            "radiation_budget": compute_radiation_budget(ast, curr_reading.get("daily_radiation", ast.daily_radiation)),
            "current_reading": curr_reading,
            "is_emergency": eval_res["status"] == "emergency",
        })

    def activate_scenario_0(self, request):
        ast = self.get_target_astronaut(request, 'AST-02')
        MedicalAlert.objects.filter(is_active=True).update(is_active=False)
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
        ast.cabin_co2 = 3.2
        ast.cabin_pressure = 14.7
        ast.daily_radiation = 0.55
        ast.ecg_qtc = 415
        ast.ecg_rhythm = 'Normal Sinus'
        ast.hrv_rmssd = 52.0
        ast.sleep_duration = 6.8
        ast.save()

        curr = {
            "heart_rate": ast.hr_mean, "systolic_bp": ast.sys_bp_mean,
            "diastolic_bp": ast.dia_bp_mean, "spo2": ast.spo2_mean,
            "respiratory_rate": ast.resp_rate_mean, "body_temperature": ast.body_temp_mean,
            "activity": ast.current_activity, "status": "normal",
            "cabin_co2": 3.2, "cabin_pressure": 14.7, "ecg_qtc": 415,
            "hrv_rmssd": 52.0, "daily_radiation": 0.55, "sleep_duration": 6.8
        }
        VitalReading.objects.create(
            astronaut=ast, timestamp=timezone.now(),
            heart_rate=curr["heart_rate"], systolic_bp=curr["systolic_bp"],
            diastolic_bp=curr["diastolic_bp"], spo2=curr["spo2"],
            respiratory_rate=curr["respiratory_rate"], body_temperature=curr["body_temperature"],
            activity=ast.current_activity, status='normal',
            cabin_co2=3.2, hrv_rmssd=52.0, radiation_rate=0.55
        )
        return self._package_response("Nominal Mission Scenario: All vitals normal, 0 alerts", ast, None, curr)

    def activate_scenario_1(self, request):
        ast = self.get_target_astronaut(request, 'AST-02')
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
        ast.cabin_co2 = 3.2
        ast.ecg_qtc = 445
        ast.ecg_rhythm = 'Sinus Tachycardia'
        ast.hrv_rmssd = 32.0
        ast.daily_radiation = 0.55
        ast.save()

        curr = {
            "heart_rate": 131.0, "systolic_bp": 138.0, "diastolic_bp": 82.0,
            "spo2": 90.0, "respiratory_rate": 27.0, "body_temperature": 36.9,
            "cabin_co2": 3.2, "ecg_qtc": 445, "hrv_rmssd": 32.0,
            "daily_radiation": 0.55, "sleep_duration": ast.sleep_duration,
            "cabin_pressure": 14.7, "activity": ast.current_activity, "status": "critical"
        }
        VitalReading.objects.create(
            astronaut=ast, timestamp=timezone.now(),
            heart_rate=131.0, systolic_bp=138.0, diastolic_bp=82.0,
            spo2=90.0, respiratory_rate=27.0, body_temperature=36.9,
            activity=ast.current_activity, status='critical',
            cabin_co2=3.2, ecg_qtc=445, ecg_rhythm='Sinus Tachycardia', hrv_rmssd=32.0, radiation_rate=0.55
        )

        chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk[0]["completed"] = True
        chk[0]["completed_at"] = timezone.now().strftime("%H:%M:%S UTC")

        alert = MedicalAlert.objects.create(
            astronaut=ast, timestamp=timezone.now(), level='critical', primary_metric='multi_signal',
            title_en="Scenario 1: Compound Tachycardia + Hypoxia Crisis",
            title_ar="السيناريو 1: أزمة مركبة - تسارع ضربات القلب ونقص الأكسجين",
            summary_en=f"{ast.name} HR peaked at 131 bpm, SpO2 dropped to 90.0%, Respiratory Rate jumped to 27 bpm during {ast.current_activity}.",
            summary_ar=f"ارتفع نبض {ast.name_ar} إلى 131 نبضة، ونقص SpO2 إلى 90.0%، وقفز التنفس إلى 27 نفساً أثناء {ast.current_activity}.",
            probable_cause_en="Microgravity fluid shift compounding transient ventilation-perfusion mismatch and high physical load.",
            probable_cause_ar="انتقال السوائل الرأسي مترافقاً مع عدم تطابق التروية الرئوية والإجهاد.",
            current_reading_value="HR: 131 bpm | SpO2: 90.0% | RR: 27 bpm",
            baseline_reference=f"Mean HR: {ast.hr_mean} bpm | SpO2: {ast.spo2_mean}% | RR: {ast.resp_rate_mean} bpm",
            normal_limit_reference="Space Normal: HR 50-90, SpO2 95-100%, RR 12-20",
            z_score=3.85, protocol_code="PROT-01",
            protocol_title_en="Tachycardia & Hypoxia Dual Protocol",
            protocol_title_ar="بروتوكول تسارع القلب ونقص الأكسجين المزدوج",
            is_active=True, elapsed_seconds=0, checklist_steps=chk,
            action_logs=[{
                "timestamp": timezone.now().strftime("%H:%M:%S"),
                "action_en": "Scenario 1 triggered: Multi-Signal Compound Rule activated -> Critical Red.",
                "action_ar": "تشغيل السيناريو 1: تفعيل قاعدة التصعيد المركب -> حالة حرجة حمراء."
            }]
        )
        return self._package_response(f"Scenario 1 Activated: Tachycardia + Hypoxia ({ast.id})", ast, alert, curr)

    def activate_scenario_2(self, request):
        ast = self.get_target_astronaut(request, 'AST-03')
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
        ast.cabin_co2 = 3.2
        ast.hrv_rmssd = 40.0
        ast.ecg_qtc = 420
        ast.ecg_rhythm = 'Normal Sinus'
        ast.save()

        curr = {
            "body_temperature": 38.33, "heart_rate": 84.0, "systolic_bp": 112.0,
            "diastolic_bp": 71.0, "spo2": 98.0, "respiratory_rate": 16.0,
            "cabin_co2": 3.2, "ecg_qtc": 420, "hrv_rmssd": 40.0,
            "daily_radiation": ast.daily_radiation, "sleep_duration": ast.sleep_duration,
            "cabin_pressure": 14.7, "activity": ast.current_activity, "status": "critical"
        }
        VitalReading.objects.create(
            astronaut=ast, timestamp=timezone.now(),
            heart_rate=84.0, systolic_bp=112.0, diastolic_bp=71.0,
            spo2=98.0, respiratory_rate=16.0, body_temperature=38.33,
            activity=ast.current_activity, status='critical',
            cabin_co2=3.2, hrv_rmssd=40.0, radiation_rate=ast.daily_radiation
        )

        chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk[0]["completed"] = True
        chk[0]["completed_at"] = timezone.now().strftime("%H:%M:%S UTC")

        alert = MedicalAlert.objects.create(
            astronaut=ast, timestamp=timezone.now(), level='critical', primary_metric='body_temperature',
            title_en="Scenario 2: Critical Core Hyperthermia ('Space Fever')",
            title_ar="السيناريو 2: ارتفاع حرج في حرارة الجسم ('حمى الفضاء')",
            summary_en=f"{ast.name}'s core temperature rose gradually to 38.33°C (baseline: {ast.body_temp_mean}°C).",
            summary_ar=f"ارتفعت حرارة {ast.name_ar} المركزية تدريجياً إلى 38.33°م (خط الأساس: {ast.body_temp_mean}°م).",
            probable_cause_en="Space Fever: Microgravity liquid sweat film insulating skin, completely impairing evaporative heat dissipation.",
            probable_cause_ar="حمى الفضاء: احتباس طبقة العرق السائلة العازلة على الجلد مما عطل فقدان الحرارة التبخيري تماماً.",
            current_reading_value="38.33 °C",
            baseline_reference=f"Mean: {ast.body_temp_mean} °C (SD: {ast.body_temp_sd})",
            normal_limit_reference="Space Normal: 36.1 - 37.5 °C (Critical > 38.30 °C)",
            z_score=12.75, protocol_code="PROT-07",
            protocol_title_en="Hyperthermia Active Cooling Protocol",
            protocol_title_ar="بروتوكول التبريد النشط لارتفاع الحرارة",
            is_active=True, elapsed_seconds=0, checklist_steps=chk,
            action_logs=[{
                "timestamp": timezone.now().strftime("%H:%M:%S"),
                "action_en": "Scenario 2 triggered: Core Temp crossed 38.30°C -> Critical Red.",
                "action_ar": "تشغيل السيناريو 2: تجاوز الحرارة المركزية 38.30°م -> حالة حرجة حمراء."
            }]
        )
        return self._package_response(f"Scenario 2 Activated: Gradual Hyperthermia ({ast.id})", ast, alert, curr)

    def activate_scenario_3(self, request):
        ast = self.get_target_astronaut(request, 'AST-01')
        ast.sleep_duration = 4.2
        ast.hrv_rmssd = 22.0
        ast.ecg_qtc = 430
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
        ast.save()

        curr = {
            "sleep_duration": 4.2, "hrv_rmssd": 22.0, "heart_rate": 74.0,
            "systolic_bp": 115.0, "diastolic_bp": 72.0, "spo2": 97.2,
            "respiratory_rate": 16.0, "body_temperature": 36.8,
            "cabin_co2": 3.2, "ecg_qtc": 430, "daily_radiation": ast.daily_radiation,
            "cabin_pressure": 14.7, "activity": ast.current_activity, "status": "warning"
        }
        VitalReading.objects.create(
            astronaut=ast, timestamp=timezone.now(),
            heart_rate=74.0, systolic_bp=115.0, diastolic_bp=72.0,
            spo2=97.2, respiratory_rate=16.0, body_temperature=36.8,
            activity=ast.current_activity, status='warning',
            cabin_co2=3.2, hrv_rmssd=22.0, sleep_duration=4.2, radiation_rate=ast.daily_radiation
        )

        chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk[0]["completed"] = True
        chk[0]["completed_at"] = timezone.now().strftime("%H:%M:%S UTC")

        alert = MedicalAlert.objects.create(
            astronaut=ast, timestamp=timezone.now(), level='warning', primary_metric='sleep_deprivation',
            title_en="Scenario 3: Cumulative Sleep Deprivation & Autonomic Fatigue",
            title_ar="السيناريو 3: حرمان تراكمي من النوم وتدهور التوازن العصبي",
            summary_en=f"{ast.name} recorded 4.2 hrs sleep with HRV RMSSD drop to 22.0 ms (elevated cognitive error risk).",
            summary_ar=f"سجل {ast.name_ar} 4.2 ساعة نوم فقط وهبوط مؤشر HRV إلى 22.0 مللي ثانية (خطر خطأ إدراكي مرتفع).",
            probable_cause_en="Circadian misalignment from 16 daily orbital sunrises/sunsets + high workload.",
            probable_cause_ar="اضطراب النظم اليوماوي بسبب 16 شروقاً وغروباً يومياً مع ضغط العمل.",
            current_reading_value="Sleep: 4.2 hrs | HRV RMSSD: 22.0 ms",
            baseline_reference="Normal Sleep: >= 6.5 hrs | HRV >= 25 ms",
            normal_limit_reference="Threshold: < 5.0 hrs + HRV < 25 ms",
            z_score=-3.1, protocol_code="PROT-12",
            protocol_title_en="Sleep Deprivation & Fatigue Protocol",
            protocol_title_ar="بروتوكول الحرمان من النوم والإرهاق التراكمي",
            is_active=True, elapsed_seconds=0, checklist_steps=chk,
            action_logs=[{
                "timestamp": timezone.now().strftime("%H:%M:%S"),
                "action_en": "Scenario 3 triggered: Cognitive error risk alert -> Warning Amber.",
                "action_ar": "تشغيل السيناريو 3: إنذار مخاطر الخطأ الإدراكي -> تحذير أصفر."
            }]
        )
        return self._package_response(f"Scenario 3 Activated: Sleep Deprivation & Low HRV ({ast.id})", ast, alert, curr)

    def activate_scenario_4(self, request):
        ast = self.get_target_astronaut(request, 'AST-02')
        ast.cabin_co2 = 5.8
        user_activity = request.data.get('activity')
        if user_activity:
            ast.current_activity = user_activity
        ast.save()

        curr = {
            "cabin_co2": 5.8, "respiratory_rate": 18.0, "heart_rate": 76.0,
            "systolic_bp": 120.0, "diastolic_bp": 75.0, "spo2": 96.5,
            "body_temperature": 36.9, "hrv_rmssd": 40.0, "ecg_qtc": ast.ecg_qtc,
            "daily_radiation": ast.daily_radiation, "sleep_duration": ast.sleep_duration,
            "cabin_pressure": 14.7, "activity": ast.current_activity, "status": "warning"
        }
        VitalReading.objects.create(
            astronaut=ast, timestamp=timezone.now(),
            heart_rate=76.0, systolic_bp=120.0, diastolic_bp=75.0,
            spo2=96.5, respiratory_rate=18.0, body_temperature=36.9,
            activity=ast.current_activity, status='warning',
            cabin_co2=5.8, hrv_rmssd=40.0, radiation_rate=ast.daily_radiation
        )

        chk = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk[0]["completed"] = True
        chk[0]["completed_at"] = timezone.now().strftime("%H:%M:%S UTC")

        alert = MedicalAlert.objects.create(
            astronaut=ast, timestamp=timezone.now(), level='warning', primary_metric='cabin_co2',
            title_en="Scenario 4: Cabin CO2 Partial Pressure Spike",
            title_ar="السيناريو 4: ارتفاع الضغط الجزئي لثاني أكسيد الكربون بالكابينة",
            summary_en="Environmental sensors detect cabin CO2 elevation to 5.8 mmHg (limit < 5.3 mmHg). Headache & drowsiness reported.",
            summary_ar="رصدت مجسات البيئة ارتفاع CO2 إلى 5.8 ملم زئبق (الحد < 5.3) مع صداع أمامي ونعاس.",
            probable_cause_en="Carbon Dioxide Removal Assembly (CDRA) scrubber saturation or impaired module air mixing.",
            probable_cause_ar="تشبع وسائد امتصاص جهاز تنقية CO2 (CDRA) أو ضعف خلط الهواء بين الوحدات.",
            current_reading_value="Cabin CO2: 5.8 mmHg",
            baseline_reference="Space Nominal: 2.0 - 5.0 mmHg",
            normal_limit_reference="Warning Threshold: > 5.3 mmHg",
            z_score=2.6, protocol_code="PROT-08",
            protocol_title_en="High Cabin CO2 Protocol",
            protocol_title_ar="بروتوكول ارتفاع ثاني أكسيد الكربون في الكابينة",
            is_active=True, elapsed_seconds=0, checklist_steps=chk,
            action_logs=[{
                "timestamp": timezone.now().strftime("%H:%M:%S"),
                "action_en": "Scenario 4 triggered: Cabin CO2 crossed 5.3 mmHg -> Warning Amber.",
                "action_ar": "تشغيل السيناريو 4: تجاوز ثاني أكسيد الكربون 5.3 ملم زئبق -> تحذير أصفر."
            }]
        )
        return self._package_response("Scenario 4 Activated: Cabin CO2 Spike (5.8 mmHg)", ast, alert, curr)

    def activate_scenario_5(self, request):
        mode = request.data.get('mode', 'cardiac_arrest')
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
            ast.ecg_rhythm = 'Sinus Tachycardia'
            ast.save()
            curr = {
                "heart_rate": 105.0, "systolic_bp": 135.0, "diastolic_bp": 88.0,
                "spo2": 96.0, "respiratory_rate": 20.0, "body_temperature": 37.2,
                "daily_radiation": 3.2, "cabin_co2": 3.2, "ecg_qtc": 430,
                "hrv_rmssd": 30.0, "sleep_duration": ast.sleep_duration,
                "cabin_pressure": 14.7, "activity": ast.current_activity, "status": "critical"
            }
            VitalReading.objects.create(
                astronaut=ast, timestamp=timezone.now(),
                heart_rate=105.0, systolic_bp=135.0, diastolic_bp=88.0,
                spo2=96.0, respiratory_rate=20.0, body_temperature=37.2,
                activity='light', status='critical',
                cabin_co2=3.2, hrv_rmssd=30.0, radiation_rate=3.2
            )
            alert = MedicalAlert.objects.create(
                astronaut=ast, timestamp=timezone.now(), level='critical', primary_metric='spe',
                title_en="Scenario 5: Solar Particle Event (SPE) Radiation Storm",
                title_ar="السيناريو 5: عاصفة إشعاعية شمسية (SPE)",
                summary_en="Radiation dose rate spiked to 3.2 mSv/day (normal: 0.4-0.8). Mandatory crew evacuation to Storm Shelter.",
                summary_ar="قفزت الجرعة الإشعاعية إلى 3.2 ملي سيفرت/يوم (الطبيعي: 0.4-0.8). إخلاء إلزامي لكافة الطاقم للمأوى المصفح.",
                probable_cause_en="Coronal Mass Ejection (CME) directed toward orbital plane.",
                probable_cause_ar="انبعاث كتلي إكليلي شمسي متجه نحو المسار المداري.",
                current_reading_value="Radiation: 3.2 mSv/day",
                baseline_reference="Nominal ISS: 0.4 - 0.8 mSv/day",
                normal_limit_reference="Evacuation Threshold: > 2.5 mSv/day",
                z_score=5.5, protocol_code="PROT-11",
                protocol_title_en="Solar Particle Event (SPE) Protocol",
                protocol_title_ar="بروتوكول العاصفة الإشعاعية الشمسية (SPE)",
                is_active=True, elapsed_seconds=0, checklist_steps=chk,
                action_logs=[{
                    "timestamp": timezone.now().strftime("%H:%M:%S"),
                    "action_en": "Scenario 5 (SPE) triggered -> Radiation Storm Shelter Protocol.",
                    "action_ar": "تشغيل السيناريو 5 (عاصفة إشعاعية) -> تفعيل بروتوكول المأوى المصفح."
                }]
            )
        else:
            ast.ecg_rhythm = 'Ventricular Arrest / Asystole'
            ast.ecg_qtc = 520
            ast.hrv_rmssd = 0.0
            ast.save()
            curr = {
                "heart_rate": 0.0, "systolic_bp": 0.0, "diastolic_bp": 0.0,
                "spo2": 60.0, "respiratory_rate": 0.0, "body_temperature": 36.5,
                "cabin_co2": 3.2, "ecg_qtc": 520, "hrv_rmssd": 0.0,
                "daily_radiation": 0.55, "sleep_duration": ast.sleep_duration,
                "cabin_pressure": 14.7, "activity": ast.current_activity, "status": "emergency"
            }
            VitalReading.objects.create(
                astronaut=ast, timestamp=timezone.now(),
                heart_rate=0.0, systolic_bp=0.0, diastolic_bp=0.0,
                spo2=60.0, respiratory_rate=0.0, body_temperature=36.5,
                activity='rest', status='emergency',
                cabin_co2=3.2, ecg_qtc=520, ecg_rhythm='Ventricular Arrest / Asystole', hrv_rmssd=0.0, radiation_rate=0.55
            )
            alert = MedicalAlert.objects.create(
                astronaut=ast, timestamp=timezone.now(), level='emergency', primary_metric='cardiac_arrest',
                title_en="Scenario 5: ALL-CREW EMERGENCY — Cardiac / Respiratory Collapse",
                title_ar="السيناريو 5: طوارئ قصوى للطاقم — انهيار قلبي وتنفسي مفاجئ",
                summary_en="CRITICAL EMERGENCY: Sudden loss of consciousness, absent pulse, telemetry flatline.",
                summary_ar="طوارئ قصوى: فقدان مفاجئ للوعي مع غياب النبض وتوقف التنفس والقياسات الحيوية.",
                probable_cause_en="Microgravity malignant dysrhythmia or acute neurovascular syncope.",
                probable_cause_ar="اضطراب نظم قلبي خبيث في انعدام الوزن أو هبوط وعائي حاد.",
                current_reading_value="HR: 0 bpm | RR: 0 breaths/min | SpO2: 60%",
                baseline_reference=f"Mean HR: {ast.hr_mean} bpm | Resp: {ast.resp_rate_mean} breaths/min",
                normal_limit_reference="Emergency Life Support Rule 5",
                z_score=-15.0, protocol_code="PROT-10",
                protocol_title_en="Cardiac or Respiratory Arrest Protocol (Microgravity CPR)",
                protocol_title_ar="بروتوكول إنعاش القلب والتنفس في انعدام الجاذبية (CPR & AED)",
                is_active=True, elapsed_seconds=0, checklist_steps=chk,
                action_logs=[{
                    "timestamp": timezone.now().strftime("%H:%M:%S"),
                    "action_en": "Rule 5 ALL-CREW EMERGENCY SIREN ACTIVATED. Deploy CMRS Board and AED.",
                    "action_ar": "إطلاق صفارات الإنذار القصوى للطاقم (القاعدة 5). نشر لوح التثبيت CMRS وجهاز الصدمات AED."
                }]
            )

        return self._package_response(f"Scenario 5 Activated ({mode.upper()})", ast, alert, curr)


class AIAdvisorView(APIView):
    """
    POST /api/ai-advisor/
    Clinical Decision Support Endpoint combining live vitals, Z-scores, & space physiology.
    """
    @extend_schema(request=AIAdvisorRequestSerializer, responses={200: OpenApiTypes.OBJECT})
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
            'cabin_co2': serializer.validated_data.get('cabin_co2', ast.cabin_co2),
            'daily_radiation': serializer.validated_data.get('daily_radiation', ast.daily_radiation),
            'ecg_qtc': serializer.validated_data.get('ecg_qtc', ast.ecg_qtc),
            'hrv_rmssd': serializer.validated_data.get('hrv_rmssd', ast.hrv_rmssd),
            'sleep_duration': serializer.validated_data.get('sleep_duration', ast.sleep_duration),
            'cabin_pressure': serializer.validated_data.get('cabin_pressure', ast.cabin_pressure),
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


class IncidentAssistantView(APIView):
    """
    POST /api/incident-assistant/
    Interactive Incident Assistant supporting Offline Smart Dialect/Typo Matching
    and explicit Online AI Synthesis with server-side clinical guardrails.
    """
    @extend_schema(request=IncidentAssistantRequestSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        serializer = IncidentAssistantRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ast_id = serializer.validated_data['astronaut_id']
        try:
            ast = Astronaut.objects.get(id=ast_id)
        except Astronaut.DoesNotExist:
            return Response({"error": "Astronaut not found"}, status=status.HTTP_404_NOT_FOUND)

        description = serializer.validated_data['description']
        language = serializer.validated_data.get('language', 'ar')
        mode = serializer.validated_data.get('mode', 'offline')
        live_vitals = serializer.validated_data.get('vitals') or _astronaut_to_reading_dict(ast)

        evaluation = evaluate_vital_reading(live_vitals, ast.get_baselines_dict())
        result = run_incident_assistant(ast, description, language, mode, live_vitals, evaluation)
        return Response(result)


class MissionReadinessView(APIView):
    """
    GET /api/readiness/
    Returns Crew-Wide Risk Score (0-100), risk factors, short-term forecast,
    Mission Readiness (GO / GO_WITH_CAUTION / HOLD), and Radiation Budgets.
    """
    @extend_schema(
        parameters=[OpenApiParameter(name='astronaut_id', required=False, type=str)],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        ast_id = request.query_params.get('astronaut_id')
        qs = Astronaut.objects.filter(id=ast_id) if ast_id else Astronaut.objects.all()

        crew_readiness = []
        highest_risk = 0
        overall_decision = 'GO'
        decision_rank = {'GO': 0, 'GO_WITH_CAUTION': 1, 'HOLD': 2}

        for ast in qs:
            reading_dict = _astronaut_to_reading_dict(ast)
            ev = evaluate_vital_reading(reading_dict, ast.get_baselines_dict())
            rad = compute_radiation_budget(ast, reading_dict['daily_radiation'])

            if ev['risk_score'] > highest_risk:
                highest_risk = ev['risk_score']
            if decision_rank[ev['readiness_status']] > decision_rank[overall_decision]:
                overall_decision = ev['readiness_status']

            crew_readiness.append({
                "astronaut": AstronautSerializer(ast).data,
                "global_status": ev['status'],
                "risk_score": ev['risk_score'],
                "readiness_status": ev['readiness_status'],
                "readiness_label_en": ev['readiness_label_en'],
                "readiness_label_ar": ev['readiness_label_ar'],
                "risk_factors": ev['risk_factors'],
                "forecast_en": ev['forecast_en'],
                "forecast_ar": ev['forecast_ar'],
                "radiation_budget": rad,
                "latest_vitals": reading_dict,
            })

        return Response({
            "crew_readiness_decision": overall_decision,
            "highest_risk_score": highest_risk,
            "crew_count": len(crew_readiness),
            "crew": crew_readiness,
        })


class EVAPlanListCreateView(APIView):
    """
    GET /api/eva-plans/ — Lists EVA mission plans
    POST /api/eva-plans/ — Evaluates astronaut & suit parameters and creates a new EVA plan with GO/HOLD verdict
    """
    @extend_schema(responses={200: EVAPlanSerializer(many=True)})
    def get(self, request):
        plans = EVAPlan.objects.all()
        return Response(EVAPlanSerializer(plans, many=True).data)

    @extend_schema(request=EVAPlanCreateSerializer, responses={201: EVAPlanSerializer})
    def post(self, request):
        serializer = EVAPlanCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            ast = Astronaut.objects.get(id=data['astronaut_id'])
        except Astronaut.DoesNotExist:
            return Response({"error": "Astronaut not found"}, status=status.HTTP_404_NOT_FOUND)

        reading_dict = _astronaut_to_reading_dict(ast)
        ev = evaluate_vital_reading(reading_dict, ast.get_baselines_dict())
        decision, reasons = evaluate_eva_readiness(
            ast, ev,
            data['duration_hours'], data['oxygen_reserve_pct'],
            data['co2_scrubber_pct'], data['suit_pressure_psi'],
            data['radiation_forecast_msv']
        )

        plan = EVAPlan.objects.create(
            astronaut=ast,
            title=data['title'],
            title_ar=data.get('title_ar') or data['title'],
            duration_hours=data['duration_hours'],
            oxygen_reserve_pct=data['oxygen_reserve_pct'],
            co2_scrubber_pct=data['co2_scrubber_pct'],
            suit_pressure_psi=data['suit_pressure_psi'],
            radiation_forecast_msv=data['radiation_forecast_msv'],
            readiness_decision=decision,
            risk_score_snapshot=ev['risk_score'],
            decision_reasons=reasons,
        )
        return Response(EVAPlanSerializer(plan).data, status=status.HTTP_201_CREATED)


class EVAPlanDeleteView(APIView):
    """DELETE /api/eva-plans/{id}/"""
    @extend_schema(responses={204: OpenApiTypes.NONE})
    def delete(self, request, plan_id):
        try:
            plan = EVAPlan.objects.get(id=plan_id)
            plan.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except EVAPlan.DoesNotExist:
            return Response({"error": "EVA Plan not found"}, status=status.HTTP_404_NOT_FOUND)


class MedicalKitListView(APIView):
    """
    GET /api/medical-kit/ — Lists all 12 Smart Medical Kit items, highlighting items needed for active alerts.
    """
    @extend_schema(
        parameters=[OpenApiParameter(name='protocol_code', required=False, type=str)],
        responses={200: MedicalKitItemSerializer(many=True)}
    )
    def get(self, request):
        protocol_param = request.query_params.get('protocol_code')
        if protocol_param:
            active_protocols = {protocol_param}
        else:
            active_protocols = set(
                MedicalAlert.objects.filter(is_active=True).values_list('protocol_code', flat=True)
            )
        items = MedicalKitItem.objects.all()
        data = MedicalKitItemSerializer(
            items, many=True, context={'active_protocols': active_protocols}
        ).data
        return Response(data)


class MedicalKitUseView(APIView):
    """
    POST /api/medical-kit/{id}/use/ — Consumes or restocks an item from the Onboard Medical Kit.
    """
    @extend_schema(request=MedicalKitUseSerializer, responses={200: MedicalKitItemSerializer})
    def post(self, request, item_id):
        try:
            item = MedicalKitItem.objects.get(id=item_id)
        except MedicalKitItem.DoesNotExist:
            return Response({"error": "Medical kit item not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = MedicalKitUseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data.get('amount', 1)
        restock = serializer.validated_data.get('restock', False)

        if restock:
            item.quantity = min(item.max_quantity, item.quantity + amount)
        else:
            item.quantity = max(0, item.quantity - amount)
        item.save()

        active_protocols = set(
            MedicalAlert.objects.filter(is_active=True).values_list('protocol_code', flat=True)
        )
        return Response(MedicalKitItemSerializer(item, context={'active_protocols': active_protocols}).data)


class RadiationOverviewView(APIView):
    """
    GET /api/radiation/ — Returns Crew-Wide Cumulative Radiation Dose Budgets & NASA Safety Limits.
    """
    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        budgets = [compute_radiation_budget(ast) for ast in Astronaut.objects.all()]
        storm_active = any(b['storm_shelter_required'] for b in budgets)
        return Response({
            "limits": RADIATION_LIMITS,
            "storm_shelter_required": storm_active,
            "crew_budgets": budgets
        })


class SBARReportView(APIView):
    """
    GET /api/reports/{astronaut_id}/sbar/ — Generates dynamic bilingual SBAR handoff report.
    """
    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request, astronaut_id):
        try:
            ast = Astronaut.objects.get(id=astronaut_id)
        except Astronaut.DoesNotExist:
            return Response({"error": "Astronaut not found"}, status=status.HTTP_404_NOT_FOUND)

        reading_dict = _astronaut_to_reading_dict(ast)
        active_alert = MedicalAlert.objects.filter(astronaut=ast, is_active=True).order_by('-timestamp').first()
        evaluation = evaluate_vital_reading(reading_dict, ast.get_baselines_dict())
        sbar = generate_sbar_report(ast, reading_dict, evaluation, active_alert)
        return Response(sbar)


class ExportCSVReportView(APIView):
    """
    GET /api/reports/{astronaut_id}/export-csv/ — Downloads astronaut telemetry as CSV file.
    """
    @extend_schema(responses={200: OpenApiTypes.STR})
    def get(self, request, astronaut_id):
        try:
            ast = Astronaut.objects.get(id=astronaut_id)
        except Astronaut.DoesNotExist:
            return Response({"error": "Astronaut not found"}, status=status.HTTP_404_NOT_FOUND)

        readings = VitalReading.objects.filter(astronaut=ast).order_by('-timestamp')[:500]
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="astrovitals_{ast.id}_telemetry.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'astronaut_id', 'timestamp', 'activity', 'heart_rate', 'systolic_bp', 'diastolic_bp',
            'spo2', 'respiratory_rate', 'body_temperature', 'cabin_co2', 'ecg_qtc',
            'hrv_rmssd', 'radiation_rate', 'status', 'max_abs_z', 'source'
        ])
        for r in readings:
            writer.writerow([
                ast.id, r.timestamp.isoformat(), r.activity, r.heart_rate, r.systolic_bp,
                r.diastolic_bp, r.spo2, r.respiratory_rate, r.body_temperature,
                r.cabin_co2, r.ecg_qtc, r.hrv_rmssd, r.radiation_rate,
                r.status, r.max_abs_z, r.source
            ])
        return response


class ReportsView(APIView):
    """
    GET /api/reports/{astronaut_id}/?period=daily|weekly
    Generates statistical health summaries, SBAR preview, and radiation budget.
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

        exercise_target = 2.5
        actual_exercise = ast.exercise_hours
        exercise_compliance = min(100.0, round((actual_exercise / exercise_target) * 100.0, 1))

        sleep_target = 6.5
        actual_sleep = ast.sleep_duration
        sleep_compliance = min(100.0, round((actual_sleep / sleep_target) * 100.0, 1))

        reading_dict = _astronaut_to_reading_dict(ast)
        active_alert = MedicalAlert.objects.filter(astronaut=ast, is_active=True).order_by('-timestamp').first()
        evaluation = evaluate_vital_reading(reading_dict, ast.get_baselines_dict())

        report_data = {
            "period": period,
            "title_en": title,
            "title_ar": title_ar,
            "generated_at": now.isoformat(),
            "astronaut": AstronautSerializer(ast).data,
            "vitals_statistics": {
                "heart_rate": {"avg": round(agg['avg_hr'] or ast.hr_mean, 1), "min": round(agg['min_hr'] or ast.hr_mean - 10, 1), "max": round(agg['max_hr'] or ast.hr_mean + 60, 1), "unit": "bpm"},
                "systolic_bp": {"avg": round(agg['avg_sys'] or ast.sys_bp_mean, 1), "min": round(agg['min_sys'] or ast.sys_bp_mean - 15, 1), "max": round(agg['max_sys'] or ast.sys_bp_mean + 30, 1), "unit": "mmHg"},
                "diastolic_bp": {"avg": round(agg['avg_dia'] or ast.dia_bp_mean, 1), "min": round(agg['min_dia'] or ast.dia_bp_mean - 10, 1), "max": round(agg['max_dia'] or ast.dia_bp_mean + 15, 1), "unit": "mmHg"},
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
                "cumulative_radiation_msv": ast.cumulative_radiation_msv,
                "radiation_career_limit_msv": 600.0
            },
            "radiation_budget": compute_radiation_budget(ast),
            "sbar": generate_sbar_report(ast, reading_dict, evaluation, active_alert),
        }
        return Response(report_data)


class UploadCSVVitalsView(APIView):
    """
    POST /api/vitals/upload-csv/
    Dynamically uploads and ingests a vitals CSV file.
    """
    @extend_schema(
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary'}
                }
            }
        },
        responses={200: UploadCSVResponseSerializer}
    )
    def post(self, request):
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({"error": "No file uploaded. Expected 'file' multipart form field."}, status=status.HTTP_400_BAD_REQUEST)

        decoded = csv_file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))

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
    Updates current activity (rest, light, sleep, exercise, eva) or mission location (ISS, Moon, Mars).
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
