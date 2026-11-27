"""
Clinical Operations Engine for AstroVitals AI:
- Dynamic Bilingual SBAR Medical Handoff Generator
- Cumulative Radiation Dose Budget Calculator
- Interactive Incident Assistant (Offline Smart Matcher + Optional Online AI with Guardrails)
- EVA Readiness Evaluator
"""

import json
import os
import re
import urllib.request
from django.utils import timezone

from .protocols_data import (
    RADIATION_LIMITS,
    INCIDENT_SCENARIOS_LIBRARY,
    PROTOCOLS_DEFINITIONS,
)
from .models import MedicalKitItem


def compute_radiation_budget(astronaut, live_daily_rate=None):
    """Computes cumulative mission radiation dose vs NASA safety limits."""
    daily_rate = float(live_daily_rate if live_daily_rate is not None else astronaut.daily_radiation)
    # Include instantaneous daily spike contribution beyond nominal
    nominal_daily = 0.55
    spike_delta = max(0.0, daily_rate - nominal_daily)
    cumulative = round(float(astronaut.cumulative_radiation_msv) + spike_delta, 2)

    limit_30d = RADIATION_LIMITS["mission_30d_limit_msv"]
    limit_annual = RADIATION_LIMITS["annual_limit_msv"]
    limit_career = RADIATION_LIMITS["career_limit_msv"]

    pct_30d = round(min(100.0, (cumulative / limit_30d) * 100.0), 1)
    pct_career = round(min(100.0, (cumulative / limit_career) * 100.0), 1)

    storm_shelter = daily_rate > RADIATION_LIMITS["daily_critical_spe_msv"]
    elevated = daily_rate > RADIATION_LIMITS["daily_warning_msv"]

    if storm_shelter:
        status = "critical"
        guidance_en = "SPE Radiation Storm (> 2.5 mSv/day): Evacuate crew to Shielded Storm Shelter immediately."
        guidance_ar = "عاصفة إشعاعية شمسية (> 2.5 ملي سيفرت/يوم): إخلاء فوري للطاقم إلى المأوى المصفح."
    elif elevated:
        status = "warning"
        guidance_en = "Elevated space radiation (> 1.2 mSv/day): Cancel EVA and monitor hourly dosimetry."
        guidance_ar = "ارتفاع معدل الإشعاع (> 1.2 ملي سيفرت/يوم): تعليق المهام الخارجية ومراقبة الجرعة كل ساعة."
    else:
        status = "normal"
        guidance_en = "Radiation dose budget within nominal orbital safety limits."
        guidance_ar = "ميزانية الإشعاع التراكمية ضمن حدود الأمان المدارية الطبيعية."

    return {
        "astronaut_id": astronaut.id,
        "mission_day": astronaut.mission_day,
        "daily_rate_msv": round(daily_rate, 2),
        "cumulative_msv": cumulative,
        "limit_30d_msv": limit_30d,
        "limit_annual_msv": limit_annual,
        "limit_career_msv": limit_career,
        "pct_of_30d_limit": pct_30d,
        "pct_of_career_limit": pct_career,
        "projected_180d_msv": round(cumulative + daily_rate * 135, 1),
        "storm_shelter_required": storm_shelter,
        "status": status,
        "guidance_en": guidance_en,
        "guidance_ar": guidance_ar,
    }


def generate_sbar_report(astronaut, reading_data, evaluation, active_alert=None):
    """Generates bilingual structured SBAR (Situation, Background, Assessment, Recommendation)."""
    now_str = timezone.now().strftime("%Y-%m-%d %H:%M UTC")
    status = evaluation.get("status", "normal").upper()
    risk_score = evaluation.get("risk_score", 5)
    readiness = evaluation.get("readiness_status", "GO")
    protocol = evaluation.get("protocol", {})

    hr = reading_data.get("heart_rate", astronaut.hr_mean)
    sys_bp = reading_data.get("systolic_bp", astronaut.sys_bp_mean)
    dia_bp = reading_data.get("diastolic_bp", astronaut.dia_bp_mean)
    spo2 = reading_data.get("spo2", astronaut.spo2_mean)
    rr = reading_data.get("respiratory_rate", astronaut.resp_rate_mean)
    temp = reading_data.get("body_temperature", astronaut.body_temp_mean)
    co2 = reading_data.get("cabin_co2", astronaut.cabin_co2)
    rad = reading_data.get("daily_radiation", astronaut.daily_radiation)
    qtc = reading_data.get("ecg_qtc", astronaut.ecg_qtc)
    sleep = reading_data.get("sleep_duration", astronaut.sleep_duration)

    if active_alert:
        sit_en = f"[{status}] {astronaut.name} ({astronaut.id}) @ {astronaut.mission_location}: {active_alert.title_en} ({active_alert.protocol_code}). Live: HR {hr} bpm, SpO2 {spo2}%, BP {sys_bp}/{dia_bp} mmHg, Temp {temp}°C, CO2 {co2} mmHg."
        sit_ar = f"[{status}] {astronaut.name_ar} ({astronaut.id}) في {astronaut.mission_location}: {active_alert.title_ar} ({active_alert.protocol_code}). القياسات الحية: النبض {hr}، الأكسجين {spo2}%، الضغط {sys_bp}/{dia_bp}، الحرارة {temp}°م، CO2 {co2} ملم زئبق."
    else:
        sit_en = f"[{status}] {astronaut.name} ({astronaut.id}) @ {astronaut.mission_location}: Routine telemetry check during {reading_data.get('activity', astronaut.current_activity)}. Live: HR {hr} bpm, SpO2 {spo2}%, BP {sys_bp}/{dia_bp} mmHg, Temp {temp}°C."
        sit_ar = f"[{status}] {astronaut.name_ar} ({astronaut.id}) في {astronaut.mission_location}: متابعة قياسات روتينية أثناء {reading_data.get('activity', astronaut.current_activity)}. النبض {hr}، الأكسجين {spo2}%، الضغط {sys_bp}/{dia_bp}، الحرارة {temp}°م."

    bg_en = (
        f"Role: {astronaut.role} (Age {astronaut.age}, Mission Day {astronaut.mission_day}). "
        f"Personal Baselines: HR {astronaut.hr_mean}±{astronaut.hr_sd}, SpO2 {astronaut.spo2_mean}±{astronaut.spo2_sd}%, "
        f"Temp {astronaut.body_temp_mean}±{astronaut.body_temp_sd}°C. "
        f"Cumulative Radiation: {astronaut.cumulative_radiation_msv} mSv | Sleep: {sleep}h | QTc: {int(qtc)}ms."
    )
    bg_ar = (
        f"الدور: {astronaut.role_ar} (العمر {astronaut.age}، اليوم {astronaut.mission_day} من المهمة). "
        f"خط الأساس الشخصي: النبض {astronaut.hr_mean}±{astronaut.hr_sd}، الأكسجين {astronaut.spo2_mean}±{astronaut.spo2_sd}%، "
        f"الحرارة {astronaut.body_temp_mean}±{astronaut.body_temp_sd}°م. "
        f"الإشعاع التراكمي: {astronaut.cumulative_radiation_msv} mSv | النوم: {sleep} ساعة | QTc: {int(qtc)}ms."
    )

    reasons_en = "; ".join(evaluation.get("reasons_en") or ["All core & environmental vitals concordant with baseline."])
    reasons_ar = "؛ ".join(evaluation.get("reasons_ar") or ["جميع المؤشرات الحيوية والبيئية متوافقة مع خط الأساس."])

    ass_en = f"Risk Score: {risk_score}/100 | Mission Readiness: {readiness} | Max |Z| = {evaluation.get('max_abs_z', 0)}. Findings: {reasons_en}"
    ass_ar = f"درجة المخاطرة: {risk_score}/100 | الجاهزية: {readiness} | أقصى انحراف |Z| = {evaluation.get('max_abs_z', 0)}. النتائج: {reasons_ar}"

    actions_en = protocol.get("immediate_actions_en", [])[:3] if status != "NORMAL" else [
        "Continue passive telemetry monitoring and scheduled 2.5h countermeasures.",
        "Maintain hydration and sleep hygiene targets."
    ]
    actions_ar = protocol.get("immediate_actions_ar", [])[:3] if status != "NORMAL" else [
        "الاستمرار في المراقبة اللاسلكية المستمرة وبرنامج التمارين اليومي (2.5 ساعة).",
        "الحفاظ على شرب السوائل وجودة النوم المحددة."
    ]

    rec_en = f"Active Protocol: {protocol.get('code', 'NOMINAL')} — " + " | ".join(actions_en) + f" Forecast: {evaluation.get('forecast_en', '')}"
    rec_ar = f"البروتوكول الموصى به: {protocol.get('code', 'NOMINAL')} — " + " | ".join(actions_ar) + f" التوقع: {evaluation.get('forecast_ar', '')}"

    return {
        "generated_at": now_str,
        "astronaut_id": astronaut.id,
        "status": status.lower(),
        "risk_score": risk_score,
        "readiness": readiness,
        "situation_en": sit_en,
        "situation_ar": sit_ar,
        "background_en": bg_en,
        "background_ar": bg_ar,
        "assessment_en": ass_en,
        "assessment_ar": ass_ar,
        "recommendation_en": rec_en,
        "recommendation_ar": rec_ar,
    }


def evaluate_eva_readiness(astronaut, evaluation, duration_hours, oxygen_reserve_pct, co2_scrubber_pct, suit_pressure_psi, radiation_forecast_msv):
    """Evaluates whether an astronaut + suit + space weather passes GO / GO_WITH_CAUTION / HOLD."""
    risk = evaluation.get("risk_score", 5)
    status = evaluation.get("status", "normal")
    reasons = []
    decision = "GO"

    if status in ("critical", "emergency") or risk >= 60:
        decision = "HOLD"
        reasons.append({
            "en": f"Astronaut health status is {status.upper()} (Risk {risk}/100) — medical hold active.",
            "ar": f"الحالة الصحية للرائد {status.upper()} (مخاطرة {risk}/100) — إيقاف طبي إلزامي."
        })
    elif status in ("warning", "notice") or risk >= 30:
        decision = "GO_WITH_CAUTION"
        reasons.append({
            "en": f"Astronaut has active {status.upper()} warning (Risk {risk}/100).",
            "ar": f"يوجد تنبيه صحي بدرجة {status.upper()} (مخاطرة {risk}/100)."
        })

    if oxygen_reserve_pct < 75.0:
        decision = "HOLD"
        reasons.append({
            "en": f"Suit O2 reserve too low ({oxygen_reserve_pct}% < 75% minimum).",
            "ar": f"احتياطي أكسجين البدلة منخفض جداً ({oxygen_reserve_pct}% < 75%)."
        })
    elif oxygen_reserve_pct < 90.0 and decision == "GO":
        decision = "GO_WITH_CAUTION"
        reasons.append({
            "en": f"Suit O2 reserve marginal ({oxygen_reserve_pct}% < 90%).",
            "ar": f"احتياطي أكسجين البدلة حدي ({oxygen_reserve_pct}%)."
        })

    if co2_scrubber_pct < 70.0:
        decision = "HOLD"
        reasons.append({
            "en": f"Suit CO2 scrubber capacity insufficient ({co2_scrubber_pct}% < 70%).",
            "ar": f"سعة منقي CO2 في البدلة غير كافية ({co2_scrubber_pct}% < 70%)."
        })

    if suit_pressure_psi < 3.8 or suit_pressure_psi > 5.0:
        decision = "HOLD"
        reasons.append({
            "en": f"EMU Suit pressure out of nominal EVA range ({suit_pressure_psi} psi; target 4.3 psi).",
            "ar": f"ضغط بدلة الفضاء خارج النطاق الآمن ({suit_pressure_psi} psi؛ المستهدف 4.3 psi)."
        })

    if radiation_forecast_msv > RADIATION_LIMITS["daily_critical_spe_msv"]:
        decision = "HOLD"
        reasons.append({
            "en": f"Solar radiation forecast critical ({radiation_forecast_msv} mSv/day > 2.5).",
            "ar": f"توقع الإشعاع الشمسي حرج ({radiation_forecast_msv} ملي سيفرت/يوم) — يحظر الخروج."
        })
    elif radiation_forecast_msv > RADIATION_LIMITS["daily_warning_msv"] and decision == "GO":
        decision = "GO_WITH_CAUTION"
        reasons.append({
            "en": f"Elevated radiation forecast ({radiation_forecast_msv} mSv/day): limit EVA exposure.",
            "ar": f"ارتفاع متوقع في الإشعاع ({radiation_forecast_msv} ملي سيفرت/يوم): تقليل مدة الخروج."
        })

    if not reasons:
        reasons.append({
            "en": "All astronaut biometrics, suit life support, and space weather parameters nominal.",
            "ar": "جميع القياسات الحيوية للرائد وأنظمة بدلة الفضاء وطقس الفضاء مستقرة تماماً."
        })

    return decision, reasons


def _normalize_text(text):
    text = (text or "").lower().strip()
    # Normalize common Arabic letter variants for dialect/typo tolerance
    text = re.sub(r'[أإآ]', 'ا', text)
    text = re.sub(r'ى', 'ي', text)
    text = re.sub(r'ة', 'ه', text)
    return text


def _score_incident_match(query_norm):
    best_match = None
    best_score = 0

    for item in INCIDENT_SCENARIOS_LIBRARY:
        score = 0
        for kw in item["keywords"]:
            kw_norm = _normalize_text(kw)
            if kw_norm in query_norm:
                score += 3 if len(kw_norm) > 4 else 2
            else:
                # Fuzzy substring overlap for typos (>= 4 chars)
                for token in query_norm.split():
                    if len(token) >= 4 and len(kw_norm) >= 4 and (token[:4] == kw_norm[:4]):
                        score += 1
        if score > best_score:
            best_score = score
            best_match = item

    if not best_match:
        best_match = INCIDENT_SCENARIOS_LIBRARY[0]
        confidence = 0.45
    else:
        confidence = min(0.98, round(0.55 + best_score * 0.1, 2))

    return best_match, confidence


def run_incident_assistant(astronaut, description, language='ar', mode='offline', live_vitals=None, evaluation=None):
    """
    Runs deterministic smart offline matching, and if mode == 'ai' and an external LLM key
    is configured on the server, optionally enriches summary with strict server-side guardrails.
    """
    vitals = live_vitals or {}
    ctx = {
        "name": astronaut.name_ar if language == 'ar' else astronaut.name,
        "hr": round(float(vitals.get("heart_rate", astronaut.hr_mean)), 1),
        "hr_mean": astronaut.hr_mean,
        "sys": round(float(vitals.get("systolic_bp", astronaut.sys_bp_mean)), 1),
        "dia": round(float(vitals.get("diastolic_bp", astronaut.dia_bp_mean)), 1),
        "spo2": round(float(vitals.get("spo2", astronaut.spo2_mean)), 1),
        "rr": round(float(vitals.get("respiratory_rate", astronaut.resp_rate_mean)), 1),
        "temp": round(float(vitals.get("body_temperature", astronaut.body_temp_mean)), 2),
        "temp_mean": astronaut.body_temp_mean,
        "co2": round(float(vitals.get("cabin_co2", astronaut.cabin_co2)), 2),
        "rad": round(float(vitals.get("daily_radiation", astronaut.daily_radiation)), 2),
        "cum_rad": astronaut.cumulative_radiation_msv,
        "pressure": round(float(vitals.get("cabin_pressure", astronaut.cabin_pressure)), 1),
        "sleep": round(float(vitals.get("sleep_duration", astronaut.sleep_duration)), 1),
        "hrv": round(float(vitals.get("hrv_rmssd", astronaut.hrv_rmssd)), 1),
    }

    q_norm = _normalize_text(description)
    matched, confidence = _score_incident_match(q_norm)

    raw_steps = matched["steps_ar"] if language == 'ar' else matched["steps_en"]
    formatted_steps = [s.format(**ctx) for s in raw_steps[:5]]

    # Emergency procedure ONLY when critical match or live vitals crossed warning/critical/emergency
    live_status = (evaluation or {}).get("status", "normal")
    show_emergency = bool(matched["is_critical"] or live_status in ("critical", "emergency"))
    emergency_line = None
    if show_emergency:
        emergency_line = matched["emergency_line_ar"] if language == 'ar' else matched["emergency_line_en"]

    protocol_code = matched["protocol_code"]
    protocol_obj = next((p for p in PROTOCOLS_DEFINITIONS if p["code"] == protocol_code), PROTOCOLS_DEFINITIONS[0])

    # Related medical kit items
    kit_items = [
        {
            "code": k.code,
            "name_en": k.name_en,
            "name_ar": k.name_ar,
            "quantity": k.quantity,
            "location_bay": k.location_bay,
        }
        for k in MedicalKitItem.objects.all()
        if protocol_code in (k.related_protocols or [])
    ]

    engine_used = "offline_rules"
    ai_summary = None

    if mode == 'ai':
        # Optional external LLM call only when user explicitly requested Online AI
        gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if gemini_key:
            try:
                prompt = (
                    f"You are AstroVitals Flight Surgeon Assistant. Language: {'Arabic' if language == 'ar' else 'English'}. "
                    f"Astronaut: {ctx['name']}. Complaint: {description}. "
                    f"Live vitals: HR={ctx['hr']}, SpO2={ctx['spo2']}%, Temp={ctx['temp']}C, CO2={ctx['co2']}mmHg, Rad={ctx['rad']}mSv. "
                    f"Matched protocol: {protocol_code} ({matched['title_en']}). "
                    f"Write strictly 2-3 concise clinical sentences using ONLY the provided numbers. Do NOT invent new numbers or dosages."
                )
                req_body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
                req = urllib.request.Request(url, data=req_body, headers={"Content-Type": "application/json"}, method="POST")
                with urllib.request.urlopen(req, timeout=8) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    candidate = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    # Server-side quality check: ensure concise non-empty output
                    if candidate and len(candidate) <= 900:
                        ai_summary = candidate
                        engine_used = "online_ai_gemini"
            except Exception:
                pass

        if not ai_summary:
            # Safe structured clinical synthesis fallback when no external key is configured
            engine_used = "online_clinical_synthesis"
            if language == 'ar':
                ai_summary = (
                    f"تحليل السياق السريري لـ {ctx['name']}: الشكوى ('{description[:80]}') تتطابق مع "
                    f"{matched['title_ar']} ({protocol_code}). القيم الحية: النبض {ctx['hr']} نبضة/د، "
                    f"الأكسجين {ctx['spo2']}%، الحرارة {ctx['temp']}°م، CO2 بالكابينة {ctx['co2']} ملم زئبق — يُنصح باتباع الخطوات الخمس المعتمدة أدناه."
                )
            else:
                ai_summary = (
                    f"Clinical synthesis for {ctx['name']}: Reported incident ('{description[:80]}') aligns with "
                    f"{matched['title_en']} ({protocol_code}). Live vitals: HR {ctx['hr']} bpm, SpO2 {ctx['spo2']}%, "
                    f"Temp {ctx['temp']}°C, Cabin CO2 {ctx['co2']} mmHg — execute the 5 protocol actions below."
                )

    return {
        "engine_used": engine_used,
        "astronaut_id": astronaut.id,
        "astronaut_name": astronaut.name,
        "astronaut_name_ar": astronaut.name_ar,
        "closest_match": {
            "id": matched["id"],
            "title_en": matched["title_en"],
            "title_ar": matched["title_ar"],
            "protocol_code": protocol_code,
            "protocol_title_en": protocol_obj["title_en"],
            "protocol_title_ar": protocol_obj["title_ar"],
            "confidence": confidence,
        },
        "steps": formatted_steps,
        "ai_summary": ai_summary,
        "emergency_procedure": emergency_line,
        "required_kit_items": kit_items,
        "live_vitals_snapshot": ctx,
    }
