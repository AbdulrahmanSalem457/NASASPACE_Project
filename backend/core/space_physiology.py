"""
Space Physiology Knowledge Base & AI Clinical Decision Support Engine
Explains Space vs Earth physiological differences and generates bilingual clinical advice.
"""

PHYSIOLOGICAL_SYSTEMS = {
    "cardiovascular": {
        "title_en": "Cardiovascular System & Fluid Shift",
        "title_ar": "الجهاز القلبي الوعائي وانتقال السوائل",
        "icon": "Heart",
        "mechanisms": [
            {
                "name_en": "Cephalad Fluid Shift",
                "name_ar": "انتقال السوائل الرأسي",
                "detail_en": "In microgravity, hydrostatic pressure gradients disappear, shifting ~1.5 to 2 liters of venous fluid from lower limbs toward the chest, head, and neck ('Puffy-head, bird-legs' syndrome).",
                "detail_ar": "في انعدام الجاذبية، يتلاشى الضغط الهيدروستاتيكي، مما ينقل 1.5 إلى 2 لتر من السوائل من الأطراف السفلية نحو الصدر والرقبة والرأس ('وجه منتفخ وسيقان نحيلة')."
            },
            {
                "name_en": "Intravascular Plasma Volume Loss",
                "name_ar": "فقدان حجم بلازما الدم",
                "detail_en": "Central baroreceptors perceive upper fluid overload as hypervolemia, triggering diuresis (Gauer-Henry reflex) and suppressing renin-aldosterone, causing a 10-15% reduction in circulating plasma within 48-72 hours.",
                "detail_ar": "تستشعر مستقبلات الضغط المركزية زيادة السوائل العلوية كفرط حجم، مما يسبب إدرار البول وتثبيط نظام الرينين، فتنخفض البلازما بنسبة 10-15% خلال 48-72 ساعة."
            },
            {
                "name_en": "Cardiac Deconditioning & Left Ventricular Remodeling",
                "name_ar": "تراجع كفاءة عضلة القلب وإعادة التكيف",
                "detail_en": "Decreased cardiac work and venous filling reduce myocardial stroke volume. Over months, left ventricular mass decreases by 8-10%, predisposing astronauts to severe orthostatic intolerance upon return to Earth or Lunar gravity.",
                "detail_ar": "يؤدي انخفاض الجهد القلبي لضمور تدريجي في كتلة البطين الأيسر بنسبة 8-10%، مما يسبب عدم تحمل الوقوف وهبوط الضغط الحاد عند العودة لجاذبية الأرض أو القمر."
            }
        ]
    },
    "respiratory": {
        "title_en": "Respiratory Mechanics & Gas Exchange",
        "title_ar": "ميكانيكا الجهاز التنفسي والتبادل الغازي",
        "icon": "Wind",
        "mechanisms": [
            {
                "name_en": "Ventilation-Perfusion Matching in Zero-G",
                "name_ar": "توافق التهوية والتروية في انعدام الجاذبية",
                "detail_en": "Without gravity, lung perfusion and ventilation become more uniform across apical and basal zones, but total lung capacity and functional residual capacity decrease due to upward diaphragmatic displacement from abdominal organs.",
                "detail_ar": "تصبح التروية الدموية وتوزيع الهواء أكثر تجانساً بالرئتين لغياب الجاذبية، لكن السعة الحيوية للرئتين تنخفض لاندفاع الحجاب الحاجز لأعلى بفعل أعضاء البطن."
            },
            {
                "name_en": "Absence of Thermal Convection & Stagnant CO2 Pockets",
                "name_ar": "غياب الحمل الحراري وجيوب CO2 الراكدة",
                "detail_en": "Warm exhaled breath does not rise. Without continuous cabin forced ventilation, an invisible dome of exhaled CO2 forms around a sleeping or resting astronaut's head, inducing localized hypercapnia and hypoxia.",
                "detail_ar": "لا يرتفع هواء الزفير الدافئ لأعلى؛ فبدون مراوح التهوية المستمرة تتشكل قبة غير مرئية من غاز CO2 الراكد حول رأس الرائد مسببة نقص أكسجين واختناقاً موضعياً."
            }
        ]
    },
    "thermoregulation": {
        "title_en": "Thermoregulation & 'Space Fever'",
        "title_ar": "التنظيم الحراري و'حمى الفضاء'",
        "icon": "Thermometer",
        "mechanisms": [
            {
                "name_en": "Impaired Evaporative Heat Dissipation",
                "name_ar": "تعطل التبريد بالتبخير وتراكم العرق",
                "detail_en": "In weightlessness, perspiration does not bead, drip, or roll off the skin. Sweat coalesces into an insulating liquid layer over the epidermis, trapping heat and causing core temperature to spike rapidly during exercise (up to 1-1.5 °C higher than on Earth).",
                "detail_ar": "في الفضاء لا يتقاطر العرق بل يتجمع في طبقة مائية عازلة تغطي سطح الجلد وتمنع التبخر، مما يحبس الحرارة ويرفع حرارة الجسم الداخلية سريعاً أثناء التمارين بنحو 1 إلى 1.5 °م."
            }
        ]
    },
    "neuro_ocular": {
        "title_en": "Neuro-Ocular & Circadian Health",
        "title_ar": "الجهاز العصبي البصري واليقظة اليومية",
        "icon": "Brain",
        "mechanisms": [
            {
                "name_en": "Spaceflight-Associated Neuro-ocular Syndrome (SANS)",
                "name_ar": "متلازمة SANS العصبية العينية الفضائية",
                "detail_en": "Chronic cephalad venous pressure elevates optic nerve sheath diameter, causes posterior globe flattening, optic disc edema (papilledema), and hyperopic visual shifts.",
                "detail_ar": "الضغط الوريدي الرأسي المستمر يزيد قطر غمد العصب البصري ويفلطح مؤخرة مقلة العين ويسبب وذمة حليمة العصب البصري وتشوش الرؤية القريبة."
            },
            {
                "name_en": "Circadian Phase Disruption & Microgravity Sleep Loss",
                "name_ar": "اختلال الساعة البيولوجية واضطراب النوم",
                "detail_en": "Experiencing 16 sunrises and sunsets every 24 hours on the ISS impairs endogenous melatonin production, causing fragmented REM sleep and progressive cognitive fatigue.",
                "detail_ar": "معايشة 16 شروقاً وغروباً كل 24 ساعة بمحطة الفضاء يعطل إفراز الميلاتونين الطبيعي ويجعل النوم مجزءاً ويزيد الإرهاق الذهني ومعدل الخطأ."
            }
        ]
    },
    "musculoskeletal": {
        "title_en": "Musculoskeletal Deconditioning",
        "title_ar": "تآكل العظام والضمور العضلي",
        "icon": "Activity",
        "mechanisms": [
            {
                "name_en": "Bone Demineralization (1% / Month)",
                "name_ar": "فقدان كثافة العظام (1% شهرياً)",
                "detail_en": "Absence of gravitational skeletal loading suppresses osteoblast activity while maintaining osteoclast resorption, discharging up to 250 mg of calcium daily into bloodstream (elevating renal stone risk).",
                "detail_ar": "غياب الوزن الميكانيكي يثبط بناء العظام بينما يستمر ارتشاف الكالسيوم، مما يفقد الهيكل العظمي 1% من كثافته شهرياً ويرفع خطر تشكل حصوات الكلى."
            },
            {
                "name_en": "Extensor Muscle Atrophy",
                "name_ar": "ضمور العضلات المضادة للجاذبية",
                "detail_en": "Postural calf and back muscles lose up to 20% mass within 2-3 weeks unless countered by mandatory 2.5 hours/day resistive and aerobic exercise.",
                "detail_ar": "تفقد عضلات الساق والظهر الداعمة للقامة ما يصل إلى 20% من كتلتها خلال 2-3 أسابيع ما لم تواجه بالتدريب الإلزامي لمدة 2.5 ساعة يومياً."
            }
        ]
    }
}

def generate_ai_clinical_guidance(astronaut, reading_data, evaluation):
    """
    Synthesizes an expert Clinical Decision Support report comparing personal baseline,
    activity context, and spaceflight pathophysiology.
    """
    primary = evaluation.get('primary_metric', 'heart_rate')
    level = evaluation.get('status', 'normal')
    z_scores = evaluation.get('z_scores', {})
    activity = reading_data.get('activity', 'rest')
    protocol = evaluation.get('protocol', {})

    summary_en = []
    summary_ar = []
    recommendations_en = []
    recommendations_ar = []
    space_factors_en = []
    space_factors_ar = []

    # Astronaut context
    hr_z = z_scores.get('heart_rate_z', 0)
    spo2_z = z_scores.get('spo2_z', 0)
    temp_z = z_scores.get('body_temperature_z', 0)

    if level == 'normal':
        summary_en.append(f"All vital signs for {astronaut.name} are currently concordant with both spaceflight reference ranges and the astronaut's Personal Baseline (max |Z| < 2.0).")
        summary_ar.append(f"جميع المؤشرات الحيوية لـ {astronaut.name_ar} متوافقة تماماً مع النطاقات المرجعية في الفضاء ومع خط الأساس الشخصي (أقصى انحراف |Z| < 2.0).")
        recommendations_en.extend([
            "Continue continuous passive telemetry monitoring.",
            "Maintain prescribed daily 2.5-hour countermeasure exercise regimen (ARED resistive + T2 treadmill / CEVIS cycle).",
            "Monitor hydration intake: maintain urine specific gravity < 1.020."
        ])
        recommendations_ar.extend([
            "الاستمرار في المراقبة اللاسلكية المستمرة للقياسات الحيوية.",
            "الالتزام ببرنامج التمارين اليومي الإلزامي لمدة 2.5 ساعة لمقاومة ضمور العضلات والعظام.",
            "مراقبة مستوى ترطيب الجسم وتناول السوائل بانتظام."
        ])

    elif level == 'notice':
        summary_en.append(f"Notice alert: Physiological telemetry indicates an insidious trend or 6-hour moving average shift (> 10%) from {astronaut.name}'s Personal Baseline.")
        summary_ar.append(f"تنبيه ملاحظة: تشير القياسات إلى انحراف تدريجي أو تغير في المتوسط المتحرك لـ 6 ساعات بأكثر من 10% عن خط الأساس لـ {astronaut.name_ar}.")
        recommendations_en.extend([
            "Log biometric drift for daily Flight Surgeon clinical rounds.",
            "Review astronaut recent sleep logs and cumulative radiation dose.",
            "Ensure wearable biosensors are snug and calibrated."
        ])
        recommendations_ar.extend([
            "تسجيل هذا الانحراف لمراجعته في الجولة الطبية اليومية لطبيب الرحلة.",
            "مراجعة ساعات نوم الرائد ومستوى التعرض الإشعاعي التراكمي.",
            "التأكد من دقة تثبيت أجهزة الاستشعار على الجلد ومعايرتها."
        ])

    elif level == 'warning':
        summary_en.append(f"Warning Level anomaly detected on {primary.upper()}. Reading exhibits |Z| >= 2.0 deviation from personal baseline or exceeds activity warning boundaries.")
        summary_ar.append(f"تم رصد شذوذ بمستوى تحذيري (Warning) في مؤشر {primary}. القراءة تنحرف بمقدار |Z| >= 2.0 عن خط الأساس أو تتجاوز حدود التحذير للنشاط.")
        recommendations_en.extend([
            "CMO: Verify physical sensor contact and inspect for motion artifacts.",
            "Interview astronaut regarding subjective dizziness, chest heaviness, or headache.",
            "If anomaly persists for 10-15 minutes, initiate private medical comm with Flight Surgeon."
        ])
        recommendations_ar.extend([
            "مسؤول الطاقم الطبي (CMO): فحص موضع المستشعرات واستبعاد التشويش الحركي.",
            "سؤال الرائد عن أي أعراض ذاتية مثل الدوار، ثقل الصدر، أو الصداع.",
            "إذا استمر هذا التحذير لمدة 10-15 دقيقة، يتم فتح قناة اتصال طبية خاصة مع طبيب الرحلة."
        ])

    elif level in ['critical', 'emergency']:
        summary_en.append(f"CRITICAL / EMERGENCY ALERT ON {primary.upper()}! Significant pathological deviation detected (|Z| >= 3.0 or compound distress criteria met).")
        summary_ar.append(f"إنذار حرج / طارئ (CRITICAL / EMERGENCY) في مؤشر {primary}! تم رصد انحراف مرضي كبير (|Z| >= 3.0 أو استيفاء معايير التدهور المركب).")
        recommendations_en.extend([
            "IMMEDIATE ACTION: Cease exertion and secure astronaut in medical restraint harness.",
            "Deploy Onboard Medical Kit and attach high-frequency 12-lead ECG monitor.",
            "Auto-transmit 24-hour telemetry bundle and trend vectors to Ground Flight Surgeon.",
            "Execute standard 8-step response protocol: " + protocol.get('title_en', 'Protocol')
        ])
        recommendations_ar.extend([
            "إجراء فوري: إيقاف المجهود فوراً وتثبيت الرائد في أحزمة التثبيت الطبية لمنع الطفو.",
            "فتح الحقيبة الطبية وتوصيل جهاز تخطيط القلب عالي التردد.",
            "بث حزمة القياسات الحيوية وسجل الـ 24 ساعة تلقائياً لطبيب الرحلة الأرضي.",
            "تطبيق قائمة التدخل السريع ذات الـ 8 خطوات: " + protocol.get('title_ar', 'البروتوكول')
        ])

    # Add space physiology factors
    if primary in ['heart_rate', 'multi_signal'] or hr_z > 2.0:
        space_factors_en.append("Microgravity Cephalad Fluid Shift & Hypovolemia: Reduced circulating plasma volume (10-15% loss) increases vulnerability to resting tachycardia and diminished cardiac reserve.")
        space_factors_ar.append("انتقال السوائل نحو الرأس ونقص حجم البلازما: انخفاض حجم السوائل الدائرية بنسبة 10-15% يقلل احتياطي عضلة القلب ويسرّع النبض استجابياً.")

    if primary == 'spo2' or spo2_z < -2.0:
        space_factors_en.append("Cabin Atmosphere & Microgravity Air Stagnation: Absence of buoyant convection can cause local pocketing of exhaled CO2 and reduced alveolar O2 exchange.")
        space_factors_ar.append("بيئة الكابينة وركود الهواء: غياب تيارات الحمل الحراري قد يؤدي لتجمع غاز ثاني أكسيد الكربون حول وجه الرائد وخفض الأكسجين.")

    if primary == 'body_temperature' or temp_z > 2.5:
        space_factors_en.append("Space Fever & Impaired Evaporation: Weightless sweat films trap heat against skin; core temperature rises more rapidly and dissipates much slower than on Earth.")
        space_factors_ar.append("حمى الفضاء وتراجع تبخر العرق: تشكل طبقة العرق العازلة في انعدام الوزن تحبس الحرارة مما يرفع درجة الحرارة الداخلية أسرع وبكفاءة تبريد أضعف بكثير من الأرض.")

    return {
        "status": level,
        "primary_metric": primary,
        "summary_en": " ".join(summary_en),
        "summary_ar": " ".join(summary_ar),
        "recommendations_en": recommendations_en,
        "recommendations_ar": recommendations_ar,
        "space_physiology_factors_en": space_factors_en,
        "space_physiology_factors_ar": space_factors_ar,
        "protocol": protocol,
    }
