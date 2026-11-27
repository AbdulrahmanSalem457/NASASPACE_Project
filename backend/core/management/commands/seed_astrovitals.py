import csv
import copy
from datetime import datetime, date, timedelta, timezone as dt_timezone
from pathlib import Path
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import (
    Astronaut, VitalReading, MedicalAlert,
    HistoricalRollup30D, MedicalKitItem, EVAPlan
)
from core.protocols_data import (
    ASTRONAUTS_SEED_DATA, STANDARD_CHECKLIST_TEMPLATE,
    PROTOCOLS_DEFINITIONS, MEDICAL_KIT_SEED_DATA
)
from core.alert_engine import calculate_z_score


class Command(BaseCommand):
    help = 'Seeds 6 Crew profiles, 24h CSV vitals, 30d history, Medical Kit (12 items), EVA plans, and initial alert states'

    def handle(self, *args, **options):
        self.stdout.write(f"--> Seeding {len(ASTRONAUTS_SEED_DATA)} Crew Members with Personal Baselines...")

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
                    "cumulative_radiation_msv": sb.get("cumulative_radiation_msv", 24.5),
                    "mission_day": sb.get("mission_day", 45),
                    "sleep_duration": sb["sleep_duration"],
                    "exercise_hours": sb["exercise_hours"],
                }
            )
            astronaut_objs[ast.id] = ast
            self.stdout.write(f"   [+] Seeded {ast.id}: {ast.name} ({ast.role})")

        # Regenerate / Ingest 24h CSV to ensure all 6 crew members have full 24h records
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        csv_path = base_dir / 'data' / 'astronaut_vitals_sample_24h.csv'

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
        self.stdout.write("--> Generating 30-day historical rollup table per crew member...")
        HistoricalRollup30D.objects.all().delete()

        today = date(2026, 1, 15)
        history_objs = []

        for ast_id, ast in astronaut_objs.items():
            for day_offset in range(30, 0, -1):
                day_date = today - timedelta(days=day_offset)

                daily_hr = round(ast.hr_mean + (day_offset % 3 - 1) * 0.8, 1)
                daily_sys = round(ast.sys_bp_mean + (day_offset % 4 - 1.5) * 1.0, 1)
                daily_dia = round(ast.dia_bp_mean + (day_offset % 3 - 1) * 0.7, 1)
                daily_spo2 = round(ast.spo2_mean + (day_offset % 2 - 0.5) * 0.2, 1)
                daily_rr = round(ast.resp_rate_mean + (day_offset % 3 - 1) * 0.3, 1)
                daily_temp = round(ast.body_temp_mean + (day_offset % 4 - 1.5) * 0.04, 2)

                sleep_h = round(6.2 + (day_offset % 5) * 0.22, 1)
                exercise_h = 2.5 if day_offset % 7 != 0 else 1.5

                alerts = 1 if (day_offset in [3, 11, 24]) else 0
                crit_alerts = 1 if (day_offset == 11 and ast_id == 'AST-02') else 0

                history_objs.append(HistoricalRollup30D(
                    astronaut=ast,
                    date=day_date,
                    avg_heart_rate=daily_hr,
                    min_heart_rate=round(daily_hr - 14.0, 1),
                    max_heart_rate=round(daily_hr + 65.0, 1),
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

        # Seed Smart Medical Kit (12 items)
        self.stdout.write("--> Seeding Smart Medical Kit (12 items)...")
        for item in MEDICAL_KIT_SEED_DATA:
            MedicalKitItem.objects.update_or_create(
                code=item["code"],
                defaults={
                    "name_en": item["name_en"],
                    "name_ar": item["name_ar"],
                    "category": item["category"],
                    "category_ar": item["category_ar"],
                    "quantity": item["quantity"],
                    "max_quantity": item["max_quantity"],
                    "unit": item["unit"],
                    "unit_ar": item["unit_ar"],
                    "expiry_date": date.fromisoformat(item["expiry_date"]),
                    "location_bay": item["location_bay"],
                    "related_protocols": item["related_protocols"],
                    "usage_notes_en": item["usage_notes_en"],
                    "usage_notes_ar": item["usage_notes_ar"],
                }
            )

        # Seed Default EVA Plans if none exist
        if not EVAPlan.objects.exists():
            EVAPlan.objects.create(
                astronaut=astronaut_objs["AST-01"],
                title="ISS Truss Thermal Radiator Inspection",
                title_ar="فحص المبرد الحراري على الهيكل الخارجي للمحطة",
                duration_hours=5.0,
                oxygen_reserve_pct=98.0,
                co2_scrubber_pct=96.0,
                suit_pressure_psi=4.3,
                radiation_forecast_msv=0.55,
                readiness_decision="GO",
                risk_score_snapshot=6,
                decision_reasons=[
                    {"en": "Nominal baseline telemetry & suit reserves >= 95%", "ar": "المؤشرات مستقرة واحتياطيات البدلة >= 95%"}
                ]
            )
            EVAPlan.objects.create(
                astronaut=astronaut_objs["AST-04"],
                title="Solar Array Dosimeter Calibration",
                title_ar="معايرة أجهزة قياس الإشعاع على الألواح الشمسية",
                duration_hours=4.0,
                oxygen_reserve_pct=95.0,
                co2_scrubber_pct=92.0,
                suit_pressure_psi=4.3,
                radiation_forecast_msv=0.60,
                readiness_decision="GO",
                risk_score_snapshot=8,
                decision_reasons=[
                    {"en": "Radiation forecast nominal (0.60 mSv/day)", "ar": "التوقع الإشعاعي طبيعي (0.60 ملي سيفرت/يوم)"}
                ]
            )

        # Clear stale alerts on clean seed; scenarios or sliders trigger live alerts
        MedicalAlert.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("=== AstroVitals AI Database Successfully Initialized & Seeded (6 Crew, 12 Med Kit Items)! ==="))
