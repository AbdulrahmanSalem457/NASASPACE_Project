"""
Deterministic & AI-Assisted Alert Engine for AstroVitals AI
Implements the 5 strict diagnostic rules and personal baseline Z-score comparisons.
"""

from .protocols_data import ACTIVITY_RANGES, PROTOCOLS_DEFINITIONS

METRIC_LABELS = {
    "heart_rate": {"en": "Heart Rate", "ar": "معدل ضربات القلب", "unit": "bpm"},
    "systolic_bp": {"en": "Systolic BP", "ar": "الضغط الانقباضي", "unit": "mmHg"},
    "diastolic_bp": {"en": "Diastolic BP", "ar": "الضغط الانبساطي", "unit": "mmHg"},
    "spo2": {"en": "SpO2 (Oxygen Saturation)", "ar": "تشبع الأكسجين (SpO2)", "unit": "%"},
    "respiratory_rate": {"en": "Respiratory Rate", "ar": "معدل التنفس", "unit": "breaths/min"},
    "body_temperature": {"en": "Body Temperature", "ar": "درجة حرارة الجسم", "unit": "°C"},
}

def calculate_z_score(value, mean, sd):
    if sd is None or sd == 0:
        return 0.0
    return round((value - mean) / sd, 2)

def evaluate_activity_range(metric_name, value, activity):
    """
    Rule 1: Activity-Adjusted Range Check
    Returns: ('normal' | 'warning' | 'critical', reason_en, reason_ar)
    """
    act_key = activity.lower()
    if act_key not in ACTIVITY_RANGES:
        act_key = 'rest'
    
    ranges = ACTIVITY_RANGES[act_key].get(metric_name)
    if not ranges:
        return 'normal', '', ''

    crit_low = ranges.get('crit_low')
    crit_high = ranges.get('crit_high')
    warn_low = ranges.get('warning_low')
    warn_high = ranges.get('warning_high')

    # Check Critical
    if crit_low is not None and value < crit_low:
        return 'critical', f"{METRIC_LABELS[metric_name]['en']} dropped below critical limit ({crit_low}) for {activity}", f"{METRIC_LABELS[metric_name]['ar']} انخفض دون الحد الحرج ({crit_low}) في نشاط {activity}"
    if crit_high is not None and value > crit_high:
        return 'critical', f"{METRIC_LABELS[metric_name]['en']} exceeded critical limit ({crit_high}) for {activity}", f"{METRIC_LABELS[metric_name]['ar']} تجاوز الحد الحرج ({crit_high}) في نشاط {activity}"

    # Check Warning
    if warn_low and (warn_low[0] <= value <= warn_low[1]):
        return 'warning', f"{METRIC_LABELS[metric_name]['en']} in low warning band ({warn_low[0]}-{warn_low[1]}) for {activity}", f"{METRIC_LABELS[metric_name]['ar']} في نطاق التحذير المنخفض ({warn_low[0]}-{warn_low[1]}) في نشاط {activity}"
    if warn_high and (warn_high[0] <= value <= warn_high[1]):
        return 'warning', f"{METRIC_LABELS[metric_name]['en']} in high warning band ({warn_high[0]}-{warn_high[1]}) for {activity}", f"{METRIC_LABELS[metric_name]['ar']} في نطاق التحذير المرتفع ({warn_high[0]}-{warn_high[1]}) في نشاط {activity}"

    return 'normal', 'Within nominal activity range', 'ضمن النطاق الطبيعي للنشاط'

def map_anomaly_to_protocol(primary_metric, reading, z_score):
    """
    Maps an alert to one of the 14 condition-specific medical protocols.
    """
    code = "PROT-01"
    if primary_metric == "heart_rate":
        if reading.get("heart_rate", 0) > 100 or z_score >= 2.0:
            code = "PROT-01" # Tachycardia
        else:
            code = "PROT-02" # Bradycardia
    elif primary_metric == "systolic_bp" or primary_metric == "diastolic_bp":
        if reading.get("systolic_bp", 0) > 130 or reading.get("diastolic_bp", 0) > 85:
            code = "PROT-03" # Hypertension
        else:
            code = "PROT-04" # Hypotension
    elif primary_metric == "spo2":
        code = "PROT-05" # Hypoxia
    elif primary_metric == "respiratory_rate":
        code = "PROT-06" # Dyspnea
    elif primary_metric == "body_temperature":
        code = "PROT-07" # Hyperthermia
    elif primary_metric == "cabin_co2":
        code = "PROT-08" # High Cabin CO2
    elif primary_metric == "cardiac_arrhythmia" or primary_metric == "ecg":
        code = "PROT-09" # Arrhythmia
    elif primary_metric == "cardiac_arrest":
        code = "PROT-10" # Cardiac / Respiratory Arrest
    elif primary_metric == "spe":
        code = "PROT-11" # Solar Particle Event
    elif primary_metric == "sleep_deprivation":
        code = "PROT-12" # Sleep Deprivation & Fatigue
    elif primary_metric == "psych_stress":
        code = "PROT-13" # Psychological Stress
    elif primary_metric == "trauma_eva":
        code = "PROT-14" # Trauma / EVA Emergency
    elif primary_metric == "multi_signal":
        code = "PROT-01" # Tachycardia + Hypoxia compound

    # Return protocol definition
    for p in PROTOCOLS_DEFINITIONS:
        if p["code"] == code:
            return p
    return PROTOCOLS_DEFINITIONS[0]

def evaluate_vital_reading(reading_data, astronaut_baselines, moving_avg_6h=None):
    """
    Executes Rules 1 to 5:
    1. Activity-Adjusted Range Check
    2. Personal Baseline Z-Score Check (|Z| >= 2.0 -> Warning, |Z| >= 3.0 -> Critical)
    3. 6-Hour Moving Average Trend Check (shift > 10% -> Notice)
    4. Multi-Signal Compound Escalation (HR high + SpO2 low + RR high at rest/light -> Critical)
    5. Final Alert Level & Packaging
    """
    activity = reading_data.get('activity', 'rest').lower()
    metrics = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2', 'respiratory_rate', 'body_temperature']

    evaluations = {}
    z_scores = {}
    max_z = 0.0
    highest_level = 'normal'
    alert_causes_en = []
    alert_causes_ar = []
    primary_metric = 'heart_rate'

    # Level hierarchy
    level_rank = {'normal': 0, 'notice': 1, 'warning': 2, 'critical': 3, 'emergency': 4}

    # Evaluate each metric against Rule 1 & Rule 2
    for m in metrics:
        val = float(reading_data.get(m, 0.0))
        base = astronaut_baselines.get(m, {})
        mean = base.get('mean', val)
        sd = base.get('sd', 1.0)
        
        # Rule 2: Z-Score
        z = calculate_z_score(val, mean, sd)
        z_scores[f"{m}_z"] = z
        abs_z = abs(z)
        if abs_z > max_z:
            max_z = abs_z
            primary_metric = m

        # Rule 1: Activity Range
        range_status, r_en, r_ar = evaluate_activity_range(m, val, activity)

        # Apply Rule 2 Z-score escalation
        metric_level = range_status
        if abs_z >= 3.0:
            if level_rank['critical'] > level_rank[metric_level]:
                metric_level = 'critical'
                r_en = f"Critical deviation from personal baseline (|Z| = {abs_z} >= 3.0, Mean: {mean}, SD: {sd})"
                r_ar = f"انحراف حرج عن خط الأساس الشخصي (|Z| = {abs_z} >= 3.0، المتوسط: {mean}، الانحراف: {sd})"
        elif abs_z >= 2.0:
            if level_rank['warning'] > level_rank[metric_level]:
                metric_level = 'warning'
                r_en = f"Warning deviation from personal baseline (|Z| = {abs_z} >= 2.0, Mean: {mean}, SD: {sd})"
                r_ar = f"انحراف تحذيري عن خط الأساس الشخصي (|Z| = {abs_z} >= 2.0، المتوسط: {mean}، الانحراف: {sd})"

        evaluations[m] = {
            'value': val,
            'mean': mean,
            'sd': sd,
            'z_score': z,
            'level': metric_level,
            'reason_en': r_en,
            'reason_ar': r_ar
        }

        if level_rank[metric_level] > level_rank[highest_level]:
            highest_level = metric_level
            primary_metric = m

        if metric_level in ['warning', 'critical', 'emergency']:
            alert_causes_en.append(f"{METRIC_LABELS[m]['en']}: {val} {METRIC_LABELS[m]['unit']} ({r_en})")
            alert_causes_ar.append(f"{METRIC_LABELS[m]['ar']}: {val} {METRIC_LABELS[m]['unit']} ({r_ar})")

    # Rule 3: 6-Hour Moving Average Trend Check
    if moving_avg_6h and highest_level == 'normal':
        for m in metrics:
            val_6h = moving_avg_6h.get(m)
            base = astronaut_baselines.get(m, {})
            mean = base.get('mean')
            if val_6h is not None and mean:
                pct_drift = abs(val_6h - mean) / mean * 100.0
                if pct_drift > 10.0:
                    if level_rank['notice'] > level_rank[highest_level]:
                        highest_level = 'notice'
                        primary_metric = m
                        alert_causes_en.append(f"6-Hour moving average for {METRIC_LABELS[m]['en']} drifted {pct_drift:.1f}% from Personal Baseline.")
                        alert_causes_ar.append(f"انحرف المتوسط المتحرك لـ 6 ساعات لـ {METRIC_LABELS[m]['ar']} بنسبة {pct_drift:.1f}% عن خط الأساس الشخصي.")

    # Rule 4: Multi-Signal Compound Escalation
    # If heart_rate is high AND spo2 is low AND respiratory_rate is elevated at rest/light -> Critical
    hr = float(reading_data.get('heart_rate', 0.0))
    spo2 = float(reading_data.get('spo2', 100.0))
    rr = float(reading_data.get('respiratory_rate', 0.0))
    
    if activity in ['rest', 'light']:
        hr_elevated = (hr > 90 or z_scores.get('heart_rate_z', 0) >= 1.8)
        spo2_depressed = (spo2 <= 94.9 or z_scores.get('spo2_z', 0) <= -1.8)
        rr_elevated = (rr >= 21 or z_scores.get('respiratory_rate_z', 0) >= 1.8)

        if hr_elevated and spo2_depressed and rr_elevated:
            highest_level = 'critical'
            primary_metric = 'multi_signal'
            alert_causes_en.append("Compound Escalation: Concurrent high HR, depressed SpO2, and elevated respiratory rate during rest/light activity.")
            alert_causes_ar.append("تصعيد مركب: تزامن تسارع ضربات القلب وانخفاض الأكسجين وارتفاع التنفس في الراحة/النشاط الخفيف.")

    # Rule 5: Emergency Check (e.g. cardiac arrest, respiratory collapse)
    if hr < 25 or rr < 5 or reading_data.get('is_emergency', False):
        highest_level = 'emergency'
        primary_metric = 'cardiac_arrest'
        alert_causes_en = ["CRITICAL LIFE SUPPORT: Unresponsive vitals / impending cardiac or respiratory arrest."]
        alert_causes_ar = ["دعم حياة حرج: قياسات منهارة / توقف وشيك للقلب أو التنفس."]

    protocol = map_anomaly_to_protocol(primary_metric, reading_data, z_scores.get(f"{primary_metric}_z", 0.0))

    return {
        'status': highest_level,
        'primary_metric': primary_metric,
        'max_abs_z': max_z,
        'evaluations': evaluations,
        'z_scores': z_scores,
        'protocol': protocol,
        'reasons_en': alert_causes_en,
        'reasons_ar': alert_causes_ar,
    }
