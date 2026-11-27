"""
Deterministic & AI-Assisted Global Alert & Risk Engine for AstroVitals AI
Evaluates 6 Core Vitals + 6 Contextual/Environmental Metrics, computes Z-scores,
unified Global Status, Risk Score (0-100), and Mission Readiness (GO / HOLD).
"""

from .protocols_data import ACTIVITY_RANGES, PROTOCOLS_DEFINITIONS, RADIATION_LIMITS

METRIC_LABELS = {
    "heart_rate": {"en": "Heart Rate", "ar": "معدل ضربات القلب", "unit": "bpm"},
    "systolic_bp": {"en": "Systolic BP", "ar": "الضغط الانقباضي", "unit": "mmHg"},
    "diastolic_bp": {"en": "Diastolic BP", "ar": "الضغط الانبساطي", "unit": "mmHg"},
    "spo2": {"en": "SpO2 (Oxygen Saturation)", "ar": "تشبع الأكسجين (SpO2)", "unit": "%"},
    "respiratory_rate": {"en": "Respiratory Rate", "ar": "معدل التنفس", "unit": "breaths/min"},
    "body_temperature": {"en": "Body Temperature", "ar": "درجة حرارة الجسم", "unit": "°C"},
    "cabin_co2": {"en": "Cabin CO2", "ar": "ثاني أكسيد الكربون بالكابينة", "unit": "mmHg"},
    "daily_radiation": {"en": "Daily Radiation", "ar": "الإشعاع اليومي", "unit": "mSv/day"},
    "ecg_qtc": {"en": "ECG QTc", "ar": "فترة QTc في تخطيط القلب", "unit": "ms"},
    "hrv_rmssd": {"en": "HRV (RMSSD)", "ar": "تقلب ضربات القلب (HRV)", "unit": "ms"},
    "sleep_duration": {"en": "Sleep Duration", "ar": "ساعات النوم", "unit": "hrs"},
    "cabin_pressure": {"en": "Cabin Pressure", "ar": "ضغط الكابينة", "unit": "psi"},
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
    act_key = (activity or 'rest').lower()
    if act_key not in ACTIVITY_RANGES:
        act_key = 'rest'

    ranges = ACTIVITY_RANGES[act_key].get(metric_name)
    if not ranges:
        return 'normal', '', ''

    crit_low = ranges.get('crit_low')
    crit_high = ranges.get('crit_high')
    warn_low = ranges.get('warning_low')
    warn_high = ranges.get('warning_high')

    if crit_low is not None and value < crit_low:
        return (
            'critical',
            f"{METRIC_LABELS[metric_name]['en']} dropped below critical limit ({crit_low}) for {act_key}",
            f"{METRIC_LABELS[metric_name]['ar']} انخفض دون الحد الحرج ({crit_low}) أثناء {act_key}"
        )
    if crit_high is not None and value > crit_high:
        return (
            'critical',
            f"{METRIC_LABELS[metric_name]['en']} exceeded critical limit ({crit_high}) for {act_key}",
            f"{METRIC_LABELS[metric_name]['ar']} تجاوز الحد الحرج ({crit_high}) أثناء {act_key}"
        )

    if warn_low and (warn_low[0] <= value <= warn_low[1]):
        return (
            'warning',
            f"{METRIC_LABELS[metric_name]['en']} in low warning band ({warn_low[0]}-{warn_low[1]}) for {act_key}",
            f"{METRIC_LABELS[metric_name]['ar']} في نطاق التحذير المنخفض ({warn_low[0]}-{warn_low[1]}) أثناء {act_key}"
        )
    if warn_high and (warn_high[0] <= value <= warn_high[1]):
        return (
            'warning',
            f"{METRIC_LABELS[metric_name]['en']} in high warning band ({warn_high[0]}-{warn_high[1]}) for {act_key}",
            f"{METRIC_LABELS[metric_name]['ar']} في نطاق التحذير المرتفع ({warn_high[0]}-{warn_high[1]}) أثناء {act_key}"
        )

    return 'normal', 'Within nominal activity range', 'ضمن النطاق الطبيعي للنشاط'


def map_anomaly_to_protocol(primary_metric, reading, z_score):
    """
    Maps an alert to one of the 14 condition-specific medical protocols.
    """
    code = "PROT-01"
    if primary_metric == "heart_rate":
        if reading.get("heart_rate", 0) > 100 or z_score >= 2.0:
            code = "PROT-01"  # Tachycardia
        else:
            code = "PROT-02"  # Bradycardia
    elif primary_metric in ("systolic_bp", "diastolic_bp"):
        if reading.get("systolic_bp", 0) > 130 or reading.get("diastolic_bp", 0) > 85:
            code = "PROT-03"  # Hypertension
        else:
            code = "PROT-04"  # Hypotension
    elif primary_metric == "spo2":
        code = "PROT-05"  # Hypoxia
    elif primary_metric == "respiratory_rate":
        code = "PROT-06"  # Dyspnea
    elif primary_metric == "body_temperature":
        code = "PROT-07"  # Hyperthermia
    elif primary_metric == "cabin_co2":
        code = "PROT-08"  # High Cabin CO2
    elif primary_metric in ("cardiac_arrhythmia", "ecg", "ecg_qtc"):
        code = "PROT-09"  # Arrhythmia
    elif primary_metric == "cardiac_arrest":
        code = "PROT-10"  # Cardiac / Respiratory Arrest
    elif primary_metric in ("spe", "daily_radiation"):
        code = "PROT-11"  # Solar Particle Event
    elif primary_metric in ("sleep_deprivation", "sleep_duration", "hrv_rmssd"):
        code = "PROT-12"  # Sleep Deprivation & Fatigue
    elif primary_metric == "psych_stress":
        code = "PROT-13"  # Psychological Stress
    elif primary_metric in ("trauma_eva", "cabin_pressure"):
        code = "PROT-14"  # Trauma / EVA / Cabin Leak Emergency
    elif primary_metric == "multi_signal":
        code = "PROT-01"  # Tachycardia + Hypoxia compound

    for p in PROTOCOLS_DEFINITIONS:
        if p["code"] == code:
            return p
    return PROTOCOLS_DEFINITIONS[0]


def evaluate_contextual_metrics(reading_data, level_rank):
    """
    Global Status Engine addition:
    Evaluates contextual & environmental telemetry (CO2, Radiation, QTc, HRV, Sleep, Cabin Pressure)
    so the global status NEVER reads Nominal while contextual metrics are in warning/critical.
    """
    contextual_findings = []
    highest_ctx_level = 'normal'
    ctx_primary = None

    co2 = float(reading_data.get('cabin_co2', 3.2))
    rad = float(reading_data.get('daily_radiation', reading_data.get('radiation_rate', 0.55)))
    qtc = float(reading_data.get('ecg_qtc', 415))
    hrv = float(reading_data.get('hrv_rmssd', 50.0))
    sleep = float(reading_data.get('sleep_duration', 6.8))
    pressure = float(reading_data.get('cabin_pressure', 14.7))

    def record(metric, lvl, val, en, ar):
        nonlocal highest_ctx_level, ctx_primary
        contextual_findings.append({
            "metric": metric,
            "level": lvl,
            "value": val,
            "reason_en": en,
            "reason_ar": ar,
        })
        if level_rank[lvl] > level_rank[highest_ctx_level]:
            highest_ctx_level = lvl
            ctx_primary = metric

    # Cabin CO2
    if co2 > 7.5:
        record('cabin_co2', 'critical', co2,
               f"Critical Cabin CO2 concentration: {co2} mmHg (> 7.5 mmHg hazard)",
               f"ارتفاع حرج في CO2 بالكابينة: {co2} ملم زئبق (> 7.5 خطر فوري)")
    elif co2 > 5.3:
        record('cabin_co2', 'warning', co2,
               f"Elevated Cabin CO2: {co2} mmHg (limit < 5.3 mmHg)",
               f"ارتفاع CO2 بالكابينة: {co2} ملم زئبق (الحد الآمن < 5.3)")

    # Daily Radiation / SPE
    if rad > RADIATION_LIMITS["daily_critical_spe_msv"]:
        record('spe', 'critical', rad,
               f"Solar Particle Event Radiation Storm: {rad} mSv/day (> 2.5 mSv/day)",
               f"عاصفة إشعاعية شمسية حرجة: {rad} ملي سيفرت/يوم (> 2.5)")
    elif rad > RADIATION_LIMITS["daily_warning_msv"]:
        record('spe', 'warning', rad,
               f"Elevated Radiation Dose Rate: {rad} mSv/day (normal 0.4-0.8)",
               f"ارتفاع معدل الإشعاع اليومي: {rad} ملي سيفرت/يوم (الطبيعي 0.4-0.8)")

    # ECG QTc
    if qtc > 500:
        record('ecg', 'critical', qtc,
               f"Critical QTc Prolongation: {int(qtc)} ms (> 500 ms arrhythmia risk)",
               f"استطالة حرجة في QTc: {int(qtc)} مللي ثانية (> 500 خطر اضطراب نظم)")
    elif qtc >= 450:
        record('ecg', 'warning', qtc,
               f"Borderline Prolonged QTc: {int(qtc)} ms (normal < 450 ms)",
               f"استطالة تحذيرية في QTc: {int(qtc)} مللي ثانية (الطبيعي < 450)")

    # HRV RMSSD
    if 0 < hrv < 15.0:
        record('psych_stress', 'critical', hrv,
               f"Severely depressed HRV RMSSD: {hrv} ms (< 15 ms acute autonomic stress)",
               f"هبوط حرج في تقلب النبض HRV: {hrv} مللي ثانية (< 15 إجهاد عصبي حاد)")
    elif 0 < hrv < 25.0:
        record('sleep_deprivation', 'warning', hrv,
               f"Low HRV RMSSD: {hrv} ms (< 25 ms autonomic fatigue)",
               f"انخفاض مؤشر HRV: {hrv} مللي ثانية (< 25 مؤشر إرهاق)")

    # Sleep Duration
    if sleep < 4.0:
        record('sleep_deprivation', 'warning', sleep,
               f"Severe Sleep Deficit: {sleep} hrs (< 4.0 hrs cognitive impairment risk)",
               f"عجز نوم شديد: {sleep} ساعة (< 4 ساعات خطر أخطاء إدراكية)")
    elif sleep < 5.0:
        record('sleep_deprivation', 'warning', sleep,
               f"Sleep Deprivation Warning: {sleep} hrs (< 5.0 hrs target)",
               f"تحذير قلة النوم: {sleep} ساعة (أقل من 5 ساعات)")

    # Cabin Pressure
    if pressure < 13.5 or pressure > 15.5:
        record('cabin_pressure', 'critical', pressure,
               f"Critical Cabin Pressure Anomaly: {pressure} psi (nominal 14.7 psi)",
               f"خلل حرج في ضغط الكابينة: {pressure} psi (الطبيعي 14.7 psi)")
    elif pressure < 14.2:
        record('cabin_pressure', 'warning', pressure,
               f"Cabin Pressure Drop Warning: {pressure} psi (nominal 14.7 psi)",
               f"انخفاض تحذيري في ضغط الكابينة: {pressure} psi")

    return highest_ctx_level, ctx_primary, contextual_findings


def compute_risk_and_readiness(highest_level, evaluations, contextual_findings, max_abs_z, reading_data):
    """
    Computes deterministic Risk Score (0-100), risk factor breakdown, near-term forecast,
    and operational Mission/EVA Readiness decision (GO / GO_WITH_CAUTION / HOLD).
    """
    risk = 5  # Baseline nominal spaceflight operational risk
    factors = []

    for m, ev in evaluations.items():
        lvl = ev['level']
        abs_z = abs(ev['z_score'])
        if lvl == 'critical':
            pts = min(35, 22 + int(abs_z * 2))
            risk += pts
            factors.append({
                "metric": m,
                "severity": "critical",
                "points": pts,
                "label_en": f"{METRIC_LABELS[m]['en']} critical ({ev['value']} {METRIC_LABELS[m]['unit']}, Z={ev['z_score']})",
                "label_ar": f"{METRIC_LABELS[m]['ar']} في مستوى حرج ({ev['value']}، Z={ev['z_score']})"
            })
        elif lvl == 'warning':
            pts = min(20, 10 + int(abs_z * 2))
            risk += pts
            factors.append({
                "metric": m,
                "severity": "warning",
                "points": pts,
                "label_en": f"{METRIC_LABELS[m]['en']} elevated warning ({ev['value']} {METRIC_LABELS[m]['unit']})",
                "label_ar": f"{METRIC_LABELS[m]['ar']} في نطاق التحذير ({ev['value']})"
            })

    for cf in contextual_findings:
        pts = 24 if cf['level'] == 'critical' else 12
        risk += pts
        factors.append({
            "metric": cf['metric'],
            "severity": cf['level'],
            "points": pts,
            "label_en": cf['reason_en'],
            "label_ar": cf['reason_ar']
        })

    if highest_level == 'emergency':
        risk = 99
        factors.insert(0, {
            "metric": "cardiac_arrest",
            "severity": "emergency",
            "points": 95,
            "label_en": "ALL-CREW LIFE SUPPORT EMERGENCY",
            "label_ar": "طوارئ إنقاذ حياة قصوى للطاقم"
        })
    elif highest_level == 'notice':
        risk = max(risk, 22)

    risk_score = max(0, min(100, int(risk)))

    # Mission & EVA Readiness Decision
    if highest_level in ('critical', 'emergency') or risk_score >= 60:
        readiness = 'HOLD'
        readiness_label_en = 'HOLD — Medical/Environmental Hold (EVA Prohibited)'
        readiness_label_ar = 'إيقاف (HOLD) — حظر المهام الخارجية لحين الاستقرار الطبي'
    elif highest_level in ('warning', 'notice') or risk_score >= 30:
        readiness = 'GO_WITH_CAUTION'
        readiness_label_en = 'GO WITH CAUTION — Enhanced Monitoring Required'
        readiness_label_ar = 'موافقة مشروطة (GO بحذر) — مراقبة مشددة مطلوبة'
    else:
        readiness = 'GO'
        readiness_label_en = 'GO — Full Medical & Environmental Clearance'
        readiness_label_ar = 'جاهز (GO) — تصريح طبي وبيئي كامل للمهمة'

    # Rule-based near-term forecast (not ML)
    if highest_level == 'emergency':
        forecast_en = "Immediate escalation active: continuous life-support intervention required within 60 seconds."
        forecast_ar = "تصعيد فوري نشط: مطلوب تدخل دعم الحياة المتواصل خلال 60 ثانية."
    elif highest_level == 'critical':
        forecast_en = "High probability of systemic decompensation over next 15-30 min without active protocol intervention."
        forecast_ar = "احتمالية عالية لتدهور القياسات خلال 15-30 دقيقة ما لم يُنفذ البروتوكول العلاجي فوراً."
    elif highest_level == 'warning':
        forecast_en = "Moderate upward risk trend: may escalate to Critical within 30-60 min if stressor persists."
        forecast_ar = "مؤشر خطر متوسط قابل للتصاعد إلى حرج خلال 30-60 دقيقة إذا استمر المؤثر البيئي أو الفسيولوجي."
    else:
        forecast_en = "Stable trajectory projected for next 4 hours under current activity & ECLSS parameters."
        forecast_ar = "مسار مستقر متوقع للـ 4 ساعات القادمة ضمن النشاط ومعايير الكابينة الحالية."

    return {
        "risk_score": risk_score,
        "readiness_status": readiness,
        "readiness_label_en": readiness_label_en,
        "readiness_label_ar": readiness_label_ar,
        "risk_factors": factors,
        "forecast_en": forecast_en,
        "forecast_ar": forecast_ar,
    }


def evaluate_vital_reading(reading_data, astronaut_baselines, moving_avg_6h=None):
    """
    Executes Unified Global Evaluation (Rules 1-5 + Contextual Environment + Risk Score + Readiness):
    1. Activity-Adjusted Range Check
    2. Personal Baseline Z-Score Check (|Z| >= 2.0 -> Warning, |Z| >= 3.0 -> Critical)
    3. 6-Hour Moving Average Trend Check (shift > 10% -> Notice)
    4. Multi-Signal Compound Escalation (HR high + SpO2 low + RR high at rest/light -> Critical)
    5. Emergency Check (cardiac arrest / respiratory collapse)
    6. Contextual Environment & Secondary Check (CO2, Radiation, QTc, HRV, Sleep, Cabin Pressure)
    """
    activity = (reading_data.get('activity') or 'rest').lower()
    metrics = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2', 'respiratory_rate', 'body_temperature']

    evaluations = {}
    z_scores = {}
    max_z = 0.0
    highest_level = 'normal'
    alert_causes_en = []
    alert_causes_ar = []
    primary_metric = 'heart_rate'

    level_rank = {'normal': 0, 'notice': 1, 'warning': 2, 'critical': 3, 'emergency': 4}

    # Evaluate 6 core vitals (Rule 1 & Rule 2)
    for m in metrics:
        val = float(reading_data.get(m, 0.0))
        base = astronaut_baselines.get(m, {})
        mean = base.get('mean', val)
        sd = base.get('sd', 1.0)

        z = calculate_z_score(val, mean, sd)
        z_scores[f"{m}_z"] = z
        abs_z = abs(z)
        if abs_z > max_z:
            max_z = abs_z
            primary_metric = m

        range_status, r_en, r_ar = evaluate_activity_range(m, val, activity)

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

    # Rule 6 (Global Status Engine): Contextual & Environmental Check
    ctx_level, ctx_primary, contextual_findings = evaluate_contextual_metrics(reading_data, level_rank)
    for cf in contextual_findings:
        alert_causes_en.append(cf['reason_en'])
        alert_causes_ar.append(cf['reason_ar'])
    if level_rank[ctx_level] > level_rank[highest_level]:
        highest_level = ctx_level
        if ctx_primary:
            primary_metric = ctx_primary
    elif highest_level == 'normal' and ctx_level != 'normal':
        highest_level = ctx_level
        primary_metric = ctx_primary

    # Rule 5: Emergency Check
    if hr < 25 or rr < 5 or reading_data.get('is_emergency', False):
        highest_level = 'emergency'
        primary_metric = 'cardiac_arrest'
        alert_causes_en = ["CRITICAL LIFE SUPPORT: Unresponsive vitals / impending cardiac or respiratory arrest."]
        alert_causes_ar = ["دعم حياة حرج: قياسات منهارة / توقف وشيك للقلب أو التنفس."]

    protocol = map_anomaly_to_protocol(primary_metric, reading_data, z_scores.get(f"{primary_metric}_z", 0.0))
    risk_bundle = compute_risk_and_readiness(highest_level, evaluations, contextual_findings, max_z, reading_data)

    return {
        'status': highest_level,
        'primary_metric': primary_metric,
        'max_abs_z': max_z,
        'evaluations': evaluations,
        'contextual_findings': contextual_findings,
        'z_scores': z_scores,
        'protocol': protocol,
        'reasons_en': alert_causes_en,
        'reasons_ar': alert_causes_ar,
        **risk_bundle,
    }
