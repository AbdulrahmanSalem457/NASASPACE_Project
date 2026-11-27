import csv
import math
import random
from datetime import datetime, timedelta
from pathlib import Path

def generate_csv_data(output_path=None):
    if output_path is None:
        base_dir = Path(__file__).resolve().parent.parent
        output_path = base_dir / 'data' / 'astronaut_vitals_sample_24h.csv'
    else:
        output_path = Path(output_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    astronauts = [
        {
            "id": "AST-01",
            "name": "Eng. Eslam Abuelela",
            "baselines": {
                "heart_rate": 62.0, "systolic_bp": 112.0, "diastolic_bp": 70.0,
                "spo2": 97.5, "respiratory_rate": 14.0, "body_temperature": 36.8
            }
        },
        {
            "id": "AST-02",
            "name": "Eng. Saudi",
            "baselines": {
                "heart_rate": 68.0, "systolic_bp": 116.0, "diastolic_bp": 72.0,
                "spo2": 97.0, "respiratory_rate": 15.0, "body_temperature": 36.9
            }
        },
        {
            "id": "AST-03",
            "name": "Eng. Sherif",
            "baselines": {
                "heart_rate": 64.0, "systolic_bp": 110.0, "diastolic_bp": 70.0,
                "spo2": 98.0, "respiratory_rate": 13.0, "body_temperature": 36.8
            }
        },
        {
            "id": "AST-04",
            "name": "PHY. Nijo",
            "baselines": {
                "heart_rate": 65.0, "systolic_bp": 108.0, "diastolic_bp": 68.0,
                "spo2": 97.8, "respiratory_rate": 14.0, "body_temperature": 36.7
            }
        },
        {
            "id": "AST-05",
            "name": "Eng. Hana",
            "baselines": {
                "heart_rate": 66.0, "systolic_bp": 109.0, "diastolic_bp": 69.0,
                "spo2": 97.6, "respiratory_rate": 14.0, "body_temperature": 36.8
            }
        },
        {
            "id": "AST-06",
            "name": "Eng. Ahmed Aboelela",
            "baselines": {
                "heart_rate": 67.0, "systolic_bp": 115.0, "diastolic_bp": 71.0,
                "spo2": 97.4, "respiratory_rate": 15.0, "body_temperature": 36.85
            }
        }
    ]

    start_time = datetime(2026, 1, 15, 0, 0, 0)
    total_minutes = 24 * 60 # 1440 minutes per astronaut = 4320 rows total

    rows = []

    # Deterministic seed for exact reproducibility across runs
    random.seed(42)

    for ast in astronauts:
        ast_id = ast["id"]
        base = ast["baselines"]

        for m in range(total_minutes):
            dt = start_time + timedelta(minutes=m)
            ts_str = dt.strftime("%Y-%m-%dT%H:%M:%S")

            # Default activity schedule
            hour = dt.hour
            minute = dt.minute

            if 0 <= hour < 6:
                activity = 'sleep'
            elif 6 <= hour < 8:
                activity = 'rest'
            elif 8 <= hour < 11:
                activity = 'light'
            elif 11 <= hour < 13 or (hour == 13 and minute < 30):
                activity = 'exercise' # 2.5 hrs exercise (11:00 to 13:30)
            elif (hour == 13 and minute >= 30) or (14 <= hour < 19):
                activity = 'light'
            elif 19 <= hour < 22:
                activity = 'rest'
            else:
                activity = 'sleep'

            # Activity base modifications & jitter
            if activity == 'sleep':
                target_hr = base["heart_rate"] - 8.0 + random.uniform(-2.0, 2.0)
                target_sys = base["systolic_bp"] - 8.0 + random.uniform(-3.0, 3.0)
                target_dia = base["diastolic_bp"] - 6.0 + random.uniform(-2.0, 2.0)
                target_spo2 = base["spo2"] - 0.5 + random.uniform(-0.3, 0.3)
                target_rr = base["respiratory_rate"] - 2.0 + random.uniform(-1.0, 1.0)
                target_temp = base["body_temperature"] - 0.3 + random.uniform(-0.05, 0.05)
                status = 'normal'

            elif activity == 'exercise':
                target_hr = 135.0 + random.uniform(-6.0, 8.0)
                target_sys = 145.0 + random.uniform(-5.0, 7.0)
                target_dia = 78.0 + random.uniform(-3.0, 4.0)
                target_spo2 = 97.0 + random.uniform(-0.5, 0.5)
                target_rr = 24.0 + random.uniform(-2.0, 3.0)
                target_temp = 37.8 + random.uniform(-0.15, 0.15)
                status = 'normal'

            elif activity == 'light':
                target_hr = base["heart_rate"] + 10.0 + random.uniform(-2.5, 2.5)
                target_sys = base["systolic_bp"] + 2.0 + random.uniform(-3.0, 3.0)
                target_dia = base["diastolic_bp"] + 1.0 + random.uniform(-2.0, 2.0)
                target_spo2 = base["spo2"] + random.uniform(-0.3, 0.3)
                target_rr = base["respiratory_rate"] + 1.0 + random.uniform(-0.8, 0.8)
                target_temp = base["body_temperature"] + random.uniform(-0.06, 0.06)
                status = 'normal'

            else: # rest
                target_hr = base["heart_rate"] + random.uniform(-2.0, 2.0)
                target_sys = base["systolic_bp"] + random.uniform(-2.5, 2.5)
                target_dia = base["diastolic_bp"] + random.uniform(-2.0, 2.0)
                target_spo2 = base["spo2"] + random.uniform(-0.2, 0.2)
                target_rr = base["respiratory_rate"] + random.uniform(-0.6, 0.6)
                target_temp = base["body_temperature"] + random.uniform(-0.05, 0.05)
                status = 'normal'

            # --- SPECIFIC EVENT 1: AST-02 Eng. Omar (14:04 to 14:37) ---
            # Tachycardia + Hypoxia Episode during light activity
            # Peaking at 131 bpm HR, SpO2 90.0%, RR 27 bpm
            if ast_id == "AST-02" and (hour == 14 and 4 <= minute <= 37):
                activity = 'light'
                progress = (minute - 4) / 33.0 # 0.0 to 1.0
                intensity = math.sin(progress * math.pi) # smooth bell curve

                target_hr = 78.0 + (53.0 * intensity) + random.uniform(-1.5, 1.5) # peaks at ~131
                target_spo2 = 97.0 - (7.0 * intensity) + random.uniform(-0.3, 0.3) # dips to ~90.0
                target_rr = 16.0 + (11.0 * intensity) + random.uniform(-0.8, 0.8) # peaks at ~27
                target_sys = 120.0 + (18.0 * intensity) + random.uniform(-2.0, 2.0)
                target_dia = 74.0 + (8.0 * intensity) + random.uniform(-1.5, 1.5)

                if intensity > 0.4:
                    status = 'critical'
                else:
                    status = 'warning'

            # --- SPECIFIC EVENT 2: AST-03 Dr. Sara (18:00 to 22:00) ---
            # Gradual Hyperthermia rising ~1.4°C over 4 hours (peaking at 38.33°C at 21:52)
            if ast_id == "AST-03" and (18 <= hour <= 21):
                minutes_from_18 = (hour - 18) * 60 + minute
                total_event_mins = 4 * 60 # 240 mins
                ratio = min(1.0, minutes_from_18 / 232.0) # peaks around 21:52

                temp_rise = 1.45 * (ratio ** 1.3)
                target_temp = 36.85 + temp_rise + random.uniform(-0.03, 0.03)

                # Secondary mild response to fever
                target_hr = base["heart_rate"] + (18.0 * ratio) + random.uniform(-2.0, 2.0)
                target_rr = base["respiratory_rate"] + (3.0 * ratio) + random.uniform(-0.5, 0.5)

                if target_temp >= 38.3:
                    status = 'critical'
                elif target_temp >= 37.51:
                    status = 'warning'
                else:
                    status = 'normal'

            rows.append({
                "timestamp": ts_str,
                "astronaut_id": ast_id,
                "activity": activity,
                "heart_rate": round(target_hr, 1),
                "systolic_bp": round(target_sys, 1),
                "diastolic_bp": round(target_dia, 1),
                "spo2": round(min(100.0, max(85.0, target_spo2)), 1),
                "respiratory_rate": round(target_rr, 1),
                "body_temperature": round(target_temp, 2),
                "status": status
            })

    # Write to CSV
    fieldnames = [
        "timestamp", "astronaut_id", "activity", "heart_rate",
        "systolic_bp", "diastolic_bp", "spo2", "respiratory_rate",
        "body_temperature", "status"
    ]

    with open(output_path, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} sample rows at {output_path}")
    return len(rows)

if __name__ == "__main__":
    generate_csv_data()
