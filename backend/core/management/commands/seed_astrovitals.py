import csv
import copy
from datetime import datetime, date, timedelta, timezone as dt_timezone
from pathlib import Path
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Astronaut, VitalReading, MedicalAlert, HistoricalRollup30D
from core.protocols_data import ASTRONAUTS_SEED_DATA, STANDARD_CHECKLIST_TEMPLATE, PROTOCOLS_DEFINITIONS
from core.alert_engine import calculate_z_score

class Command(BaseCommand):
    help = 'Seeds Astronaut profiles, ingests 24h CSV vitals, generates 30d history, and initializes alert states'

    def handle(self, *args, **options):
        self.stdout.write("--> Seeding 3 Astronauts with Personal Baselines...")

        astronaut_objs = {}
        for data in ASTRONAUTS_SEED_DATA:
            b = data["baselines"]
            sb = data["secondary_baselines"]
            ast, created = Astronaut.objects.update_or_create(
                id=data["id"],
                defaults={
                    "name": data["name"],
                    "name_ar": data["name_ar"],
                    "age": data["age"],
                    "gender": data["gender"],
                    "role": data["role"],
                    "role_ar": data["role_ar"],
                    "current_activity": data["current_activity"],
                    "mission_location": data["mission_location"],
                    "hr_mean": b["heart_rate"]["mean"],
                    "hr_sd": b["heart_rate"]["sd"],
                    "sys_bp_mean": b["systolic_bp"]["mean"],
                    "sys_bp_sd": b["systolic_bp"]["sd"],
                    "dia_bp_mean": b["diastolic_bp"]["mean"],
                    "dia_bp_sd": b["diastolic_bp"]["sd"],
                    "spo2_mean": b["spo2"]["mean"],
                    "spo2_sd": b["spo2"]["sd"],
                    "resp_rate_mean": b["respiratory_rate"]["mean"],
                    "resp_rate_sd": b["respiratory_rate"]["sd"],
                    "body_temp_mean": b["body_temperature"]["mean"],
                    "body_temp_sd": b["body_temperature"]["sd"],
                    "ecg_pr": sb["ecg_pr"],
                    "ecg_qrs": sb["ecg_qrs"],
                    "ecg_qtc": sb["ecg_qtc"],
                    "hrv_rmssd": sb["hrv_rmssd"],
                    "daily_radiation": sb["daily_radiation"],
                    "sleep_duration": sb["sleep_duration"],
                    "exercise_hours": sb["exercise_hours"],
                }
            )
            astronaut_objs[ast.id] = ast
            self.stdout.write(f"   [+] Seeded {ast.id}: {ast.name} ({ast.role})")

        # Ingest 24h CSV
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        csv_path = base_dir / 'data' / 'astronaut_vitals_sample_24h.csv'

        if not csv_path.exists():
            from core.generate_sample_csv import generate_csv_data
            generate_csv_data(csv_path)

        self.stdout.write(f"--> Ingesting 24h CSV from {csv_path}...")
        VitalReading.objects.filter(source='csv_24h').delete()

        vitals_to_create = []
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                ast = astronaut_objs.get(row['astronaut_id'])
                if not ast:
                    continue

                ts = datetime.fromisoformat(row['timestamp'])
                # Make timezone-aware
                ts = timezone.make_aware(ts, dt_timezone.utc)

                hr = float(row['heart_rate'])
                sys = float(row['systolic_bp'])
                dia = float(row['diastolic_bp'])
                spo2 = float(row['spo2'])
                rr = float(row['respiratory_rate'])
                temp = float(row['body_temperature'])

                hr_z = calculate_z_score(hr, ast.hr_mean, ast.hr_sd)
                sys_z = calculate_z_score(sys, ast.sys_bp_mean, ast.sys_bp_sd)
                dia_z = calculate_z_score(dia, ast.dia_bp_mean, ast.dia_bp_sd)
                spo2_z = calculate_z_score(spo2, ast.spo2_mean, ast.spo2_sd)
                rr_z = calculate_z_score(rr, ast.resp_rate_mean, ast.resp_rate_sd)
                temp_z = calculate_z_score(temp, ast.body_temp_mean, ast.body_temp_sd)

                max_z = max(abs(hr_z), abs(sys_z), abs(dia_z), abs(spo2_z), abs(rr_z), abs(temp_z))

                # Secondary metrics variations
                cabin_co2 = 3.2
                hrv = ast.hrv_rmssd
                if row['status'] in ['warning', 'critical']:
                    cabin_co2 = 3.8
                    hrv = max(22.0, ast.hrv_rmssd - 18.0)

                vitals_to_create.append(VitalReading(
                    astronaut=ast,
                    timestamp=ts,
                    activity=row['activity'],
                    heart_rate=hr,
                    systolic_bp=sys,
                    diastolic_bp=dia,
                    spo2=spo2,
                    respiratory_rate=rr,
                    body_temperature=temp,
                    status=row['status'],
                    hr_z_score=hr_z,
                    sys_z_score=sys_z,
                    dia_z_score=dia_z,
                    spo2_z_score=spo2_z,
                    rr_z_score=rr_z,
                    temp_z_score=temp_z,
                    max_abs_z=max_z,
                    cabin_co2=cabin_co2,
                    hrv_rmssd=round(hrv, 1),
                    radiation_rate=ast.daily_radiation,
                    source='csv_24h'
                ))

        VitalReading.objects.bulk_create(vitals_to_create, batch_size=1000)
        self.stdout.write(f"   [+] Successfully imported {len(vitals_to_create)} vital readings.")

        # Generate 30-Day Historical Rollups
        self.stdout.write("--> Generating 30-day historical rollup table per astronaut...")
        HistoricalRollup30D.objects.all().delete()

        today = date(2026, 1, 15)
        history_objs = []

        for ast_id, ast in astronaut_objs.items():
            for day_offset in range(30, 0, -1):
                day_date = today - timedelta(days=day_offset)

                # Small day-to-day variance around personal baseline
                daily_hr = round(ast.hr_mean + (day_offset % 3 - 1) * 0.8, 1)
                daily_sys = round(ast.sys_bp_mean + (day_offset % 4 - 1.5) * 1.0, 1)
                daily_dia = round(ast.dia_bp_mean + (day_offset % 3 - 1) * 0.7, 1)
                daily_spo2 = round(ast.spo2_mean + (day_offset % 2 - 0.5) * 0.2, 1)
                daily_rr = round(ast.resp_rate_mean + (day_offset % 3 - 1) * 0.3, 1)
                daily_temp = round(ast.body_temp_mean + (day_offset % 4 - 1.5) * 0.04, 2)

                sleep_h = round(6.0 + (day_offset % 5) * 0.25, 1)
                exercise_h = 2.5 if day_offset % 7 != 0 else 1.5 # Sunday light day

                # Occasional alert count
                alerts = 1 if (day_offset in [3, 11, 24]) else 0
                crit_alerts = 1 if (day_offset == 11 and ast_id == 'AST-02') else 0

                history_objs.append(HistoricalRollup30D(
                    astronaut=ast,
                    date=day_date,
                    avg_heart_rate=daily_hr,
                    min_heart_rate=round(daily_hr - 14.0, 1),
                    max_heart_rate=round(daily_hr + 65.0, 1), # exercise peak
                    avg_systolic_bp=daily_sys,
                    avg_diastolic_bp=daily_dia,
                    avg_spo2=daily_spo2,
                    avg_respiratory_rate=daily_rr,
                    avg_body_temperature=daily_temp,
                    sleep_hours=sleep_h,
                    exercise_hours=exercise_h,
                    hrv_rmssd=round(ast.hrv_rmssd + (day_offset % 5 - 2) * 2.0, 1),
                    daily_radiation=round(ast.daily_radiation + (day_offset % 4) * 0.02, 2),
                    alerts_count=alerts,
                    critical_alerts_count=crit_alerts
                ))

        HistoricalRollup30D.objects.bulk_create(history_objs)
        self.stdout.write(f"   [+] Created {len(history_objs)} daily historical records.")

        # Seed Active Baseline Alerts with 8-Step Interactive Checklist
        self.stdout.write("--> Initializing Active Medical Alerts...")
        MedicalAlert.objects.all().delete()

        # Alert 1 for AST-02: Tachycardia + Hypoxia Event (from CSV at 14:20)
        ast2 = astronaut_objs["AST-02"]
        chk1 = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk1[0]["completed"] = True
        chk1[0]["completed_at"] = "14:04:12 UTC"
        chk1[1]["completed"] = True
        chk1[1]["completed_at"] = "14:06:45 UTC"
        chk1[1]["note"] = "Sensor inspected. No mechanical error. Astronaut reports mild air hunger & palpitations."

        MedicalAlert.objects.create(
            astronaut=ast2,
            timestamp=timezone.now() - timedelta(minutes=18),
            level='critical',
            primary_metric='multi_signal',
            title_en="Compound Tachycardia + Hypoxia Crisis",
            title_ar="أزمة مركبة: تسارع ضربات القلب ونقص الأكسجين",
            summary_en="Concurrent acute rise in Heart Rate (+45 bpm over baseline to 131 bpm) with SpO2 desaturation (down to 90.0%) and elevated respiratory rate (27 bpm) during light activity.",
            summary_ar="ارتفاع حاد متزامن في نبضات القلب (+45 نبضة فوق الأساس ليصل إلى 131) مع هبوط تشبع الأكسجين (إلى 90.0%) وزيادة معدل التنفس (27 نفساً) أثناء النشاط الخفيف.",
            probable_cause_en="Microgravity fluid shift compounding transient ventilation-perfusion mismatch or localized cabin air stagnation.",
            probable_cause_ar="انتقال السوائل نحو الرأس مترافقاً مع اختلال عابر في التروية الرئوية أو ركود موضعي لهواء الكابينة.",
            current_reading_value="HR: 131 bpm, SpO2: 90.0%, RR: 27 bpm",
            baseline_reference="Mean HR: 68.0 bpm, SpO2: 97.0%, RR: 15.0 bpm",
            normal_limit_reference="Space Normal: HR 50-90, SpO2 95-100%, RR 12-20",
            z_score=3.85,
            protocol_code="PROT-01",
            protocol_title_en="Tachycardia & Hypoxia Dual Protocol",
            protocol_title_ar="بروتوكول تسارع القلب ونقص الأكسجين المزدوج",
            is_active=True,
            elapsed_seconds=1080, # 18 mins
            checklist_steps=chk1,
            action_logs=[
                {"timestamp": "14:04:12", "action_en": "System triggered Rule 4 Multi-Signal Compound Escalation -> Critical Red.", "action_ar": "تفعيل القاعدة 4 للتصعيد المركب متعدد الإشارات -> حالة حرجة حمراء."},
                {"timestamp": "14:06:45", "action_en": "CMO Dr. Sara verified biosensors. Palpitations confirmed.", "action_ar": "تحقق مسؤول الطاقم الطبي د. سارة من المستشعرات وتأكيد خفقان القلب."},
                {"timestamp": "14:08:30", "action_en": "Astronaut secured in seated restraint; administered medical O2 mask at 4 L/min.", "action_ar": "تثبيت الرائد في وضعية الجلوس وارتداء قناع أكسجين طبي بمعدل 4 لتر/دقيقة."}
            ]
        )

        # Alert 2 for AST-03: Gradual Hyperthermia Event (from CSV at 21:52)
        ast3 = astronaut_objs["AST-03"]
        chk2 = copy.deepcopy(STANDARD_CHECKLIST_TEMPLATE)
        chk2[0]["completed"] = True
        chk2[0]["completed_at"] = "21:52:00 UTC"

        MedicalAlert.objects.create(
            astronaut=ast3,
            timestamp=timezone.now() - timedelta(minutes=4),
            level='critical',
            primary_metric='body_temperature',
            title_en="Critical Core Hyperthermia ('Space Fever')",
            title_ar="ارتفاع حرج في حرارة الجسم ('حمى الفضاء')",
            summary_en="Core temperature elevated to 38.33 °C (deviation Z = +12.75 SD from personal baseline mean of 36.8 °C) post-exercise with inadequate cooling.",
            summary_ar="ارتفعت حرارة الجسم المركزية إلى 38.33 °م (انحراف Z = +12.75 عن خط الأساس 36.8 °م) بعد التمرين مع تعطل التبريد التبخيري.",
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
            elapsed_seconds=240, # 4 mins
            checklist_steps=chk2,
            action_logs=[
                {"timestamp": "21:52:00", "action_en": "Core temperature crossed 38.30 °C critical threshold.", "action_ar": "تجاوزت حرارة الجسم المركزية الحد الحرج 38.30 °م."},
                {"timestamp": "21:53:15", "action_en": "Active evaporative cooling towels and direct personal ventilation deployed.", "action_ar": "تطبيق مناشف التبريد التبخيري وتوجيه مروحة التهوية الشخصية مباشرة."}
            ]
        )

        self.stdout.write(self.style.SUCCESS("=== AstroVitals AI Database Successfully Initialized & Seeded! ==="))
