"""
Official Reference Protocols, Ranges, and Astronaut Data for AstroVitals AI
NASA Space Apps Challenge: Astronaut Health Monitoring & Medical Emergency Response System
"""

STANDARD_CHECKLIST_TEMPLATE = [
    {
        "step": 1,
        "name_en": "Detection",
        "name_ar": "الاكتشاف",
        "description_en": "System detects out-of-range reading or deviation from Personal Baseline (|Z| >= 2.0 or threshold violation).",
        "description_ar": "اكتشاف قراءة خارج النطاق أو انحراف عن خط الأساس الشخصي (|Z| >= 2.0 أو تجاوز الحدود).",
        "completed": True,
        "completed_at": None,
        "note": "Automated system detection logged."
    },
    {
        "step": 2,
        "name_en": "Verification",
        "name_ar": "التأكد والتحقق",
        "description_en": "Verify sensor contact, rule out sensor artifact, verify no unlogged exercise or physical exertion, ask astronaut for symptoms.",
        "description_ar": "التحقق من موضع المستشعر، استبعاد القراءات الخاطئة، التأكد من عدم وجود تمارين غير مسجلة، وسؤال الرائد عن الأعراض.",
        "completed": False,
        "completed_at": None,
        "note": ""
    },
    {
        "step": 3,
        "name_en": "Notification",
        "name_ar": "التنبيه والإخطار",
        "description_en": "Alert affected Astronaut and Crew Medical Officer (CMO); notify Ground Flight Surgeon immediately if Critical or if Warning persists 10-15 mins.",
        "description_ar": "تنبيه الرائد المتأثر ومسؤول الطاقم الطبي (CMO)؛ وإخطار طبيب الرحلة الأرضي فوراً إذا كانت حرجة أو استمر التحذير 10-15 دقيقة.",
        "completed": False,
        "completed_at": None,
        "note": ""
    },
    {
        "step": 4,
        "name_en": "First Aid & Microgravity Restraint",
        "name_ar": "الإسعاف الأولي وتثبيت انعدام الجاذبية",
        "description_en": "Cease physical exertion. Secure astronaut in zero-g medical restraint straps (mandatory in microgravity). Assess airway, breathing, circulation.",
        "description_ar": "إيقاف المجهود فوراً. تثبيت الرائد بأحزمة التثبيت الطبية لانعدام الجاذبية (إلزامية). فحص مجرى الهواء والتنفس والوعي.",
        "completed": False,
        "completed_at": None,
        "note": ""
    },
    {
        "step": 5,
        "name_en": "Flight Surgeon Comm & Telemetry",
        "name_ar": "التواصل مع طبيب الرحلة وبث القياسات",
        "description_en": "Initiate secure private medical comm channel with Ground Flight Surgeon. Auto-transmit 24h vital telemetry, trends, and ECG strip.",
        "description_ar": "فتح قناة اتصال طبية خاصة ومشفرة مع طبيب الرحلة الأرضي وإرسال بيانات القياسات الحيوية والمخططات وشريط ECG تلقائياً.",
        "completed": False,
        "completed_at": None,
        "note": ""
    },
    {
        "step": 6,
        "name_en": "Treatment & Intensive Monitoring",
        "name_ar": "العلاج والمراقبة المكثفة",
        "description_en": "Administer protocol-specific intervention via Onboard Medical Kit under Flight Surgeon/AI guidance. Re-measure vitals every 2-5 minutes.",
        "description_ar": "بدء العلاج المخصص من الحقيبة الطبية على متن المركبة بتوجيه طبيب الرحلة والذكاء الاصطناعي. إعادة قياس المؤشرات كل 2-5 دقائق.",
        "completed": False,
        "completed_at": None,
        "note": ""
    },
    {
        "step": 7,
        "name_en": "Mission Decision",
        "name_ar": "قرار المهمة والعودة",
        "description_en": "Determine course of action: Continue nominal mission, treat and observe on spacecraft, or execute emergency Earth return checklist.",
        "description_ar": "اتخاذ القرار: استئناف المهام الاعتيادية، العلاج والملاحظة بالمركبة، أو تفعيل إجراءات العودة الطارئة للأرض.",
        "completed": False,
        "completed_at": None,
        "note": ""
    },
    {
        "step": 8,
        "name_en": "Post-Incident Documentation",
        "name_ar": "التوثيق والمراجعة بعد الحادث",
        "description_en": "Log timestamps, medications administered, vital trajectories, false-alarm analysis, and evaluate baseline recalculation if shift is permanent.",
        "description_ar": "توثيق التوقيتات والأدوية المعطاة ومسار القياسات، وتحليل الإنذارات الكاذبة، وتقييم تحديث خط الأساس في حال حدوث تغير دائم.",
        "completed": False,
        "completed_at": None,
        "note": ""
    }
]

PROTOCOLS_DEFINITIONS = [
    {
        "code": "PROT-01",
        "title_en": "Tachycardia Protocol",
        "title_ar": "بروتوكول تسارع نبضات القلب",
        "category": "Cardiovascular",
        "trigger_criteria_en": "Heart Rate > 110 bpm at rest or light activity, or Z-score >= +2.5.",
        "trigger_criteria_ar": "معدل ضربات القلب > 110 نبضة/دقيقة أثناء الراحة أو النشاط الخفيف، أو Z-score >= +2.5.",
        "immediate_actions_en": [
            "Stop all physical exertion immediately.",
            "Place astronaut in seated posture and secure with zero-g chest restraint straps.",
            "Guide astronaut through paced slow diaphragmatic breathing (4s in, 6s out).",
            "Verify sensor contact and rule out motion artifact.",
            "Assess for dehydration, hyperthermia, psychological stress, or elevated cabin CO2.",
            "Initiate 12-lead ECG capture and continuous rhythm monitoring."
        ],
        "immediate_actions_ar": [
            "إيقاف جميع الأنشطة البدنية فوراً.",
            "تثبيت الرائد في وضعية الجلوس بأحزمة التثبيت الطبية لمنع الطفو.",
            "توجيه الرائد للتنفس البطني العميق والبطيء (4 ثوانٍ شهيق، 6 زفير).",
            "التأكد من سلامة اتصال المستشعرات واستبعاد التشويش الحركي.",
            "فحص علامات الجفاف، وارتفاع الحرارة، والضغط النفسي، ومستوى ثاني أكسيد الكربون.",
            "تشغيل مخطط كهربية القلب (ECG) والمراقبة المستمرة للنظم."
        ],
        "escalation_rules_en": "Escalate to Ground Flight Surgeon immediately if HR > 110 bpm persists for > 10-15 minutes, or is accompanied by chest pain, shortness of breath, dizziness, or irregular rhythm.",
        "escalation_rules_ar": "تصعيد فوري لطبيب الرحلة الأرضي إذا استمر التسارع > 110 لأكثر من 10-15 دقيقة، أو رافقه ألم في الصدر أو ضيق تنفس أو دوخة أو اضطراب بالنظم.",
        "space_considerations_en": "Microgravity induces cephalad fluid shifts and decreased cardiac workload. Fluid loss and hypovolemia can predispose astronauts to resting tachycardia.",
        "space_considerations_ar": "تسبب الجاذبية الصغرى انتقال السوائل نحو الرأس وانخفاض حجم البلازما ونقص السوائل، مما يزيد احتمالية تسارع القلب الاستجابي."
    },
    {
        "code": "PROT-02",
        "title_en": "Bradycardia Protocol",
        "title_ar": "بروتوكول بطء نبضات القلب",
        "category": "Cardiovascular",
        "trigger_criteria_en": "Heart Rate < 40 bpm at rest, or < 35 bpm during sleep, or Z-score <= -2.5.",
        "trigger_criteria_ar": "معدل ضربات القلب < 40 نبضة/دقيقة في الراحة، أو < 35 أثناء النوم، أو Z-score <= -2.5.",
        "immediate_actions_en": [
            "Inquire immediately about dizziness, lightheadedness, or syncope (fainting).",
            "Secure astronaut to sleep restraint or medical couch to prevent uncontrolled drift.",
            "Verify pulse oximeter and ECG electrode attachment.",
            "Check blood pressure and skin perfusion."
        ],
        "immediate_actions_ar": [
            "سؤال الرائد فوراً عن الدوخة أو خفة الرأس أو نوبات الإغماء.",
            "تثبيت الرائد في مقعد الراحة الطبي لتفادي الارتطام والطفو.",
            "التحقق من تثبيت مجس النبض وأقطاب تخطيط القلب.",
            "قياس ضغط الدم وملاحظة التروية الجلدية ومستوى الوعي."
        ],
        "escalation_rules_en": "Escalate to Critical status and initiate emergency Flight Surgeon contact if HR < 40 bpm is accompanied by hypotension, dizziness, confusion, or syncopal episode.",
        "escalation_rules_ar": "تصعيد للحالة الحرجة والاتصال العاجل بطبيب الرحلة إذا ترافق بطء القلب مع انخفاض الضغط أو دوخة أو تشوش ذهني أو إغماء.",
        "space_considerations_en": "Highly fit astronauts may exhibit athletic resting bradycardia; always correlate with personal baseline mean and symptoms.",
        "space_considerations_ar": "رواد الفضاء ذوو اللياقة العالية قد تظهر لديهم براديكارديا فسيولوجية؛ يجب دائماً المقارنة بخط الأساس الشخصي والأعراض."
    },
    {
        "code": "PROT-03",
        "title_en": "Hypertension Protocol",
        "title_ar": "بروتوكول ارتفاع ضغط الدم",
        "category": "Cardiovascular",
        "trigger_criteria_en": "Systolic BP > 145 mmHg or Diastolic BP > 95 mmHg during rest/light activity.",
        "trigger_criteria_ar": "الضغط الانقباضي > 145 ملم زئبق أو الانبساطي > 95 ملم زئبق أثناء الراحة أو النشاط الخفيف.",
        "immediate_actions_en": [
            "Have astronaut rest calmly for 5 minutes without talking.",
            "Re-measure blood pressure on both arms with zero-g calibrated cuff.",
            "Assess for acute stressors, acute pain, high sodium intake, or caffeine consumption.",
            "Examine for neurological signs: severe occipital headache, blurred vision, or visual scotoma (Spaceflight-Associated Neuro-ocular Syndrome - SANS screening)."
        ],
        "immediate_actions_ar": [
            "طلب استرخاء تام للرائد لمدة 5 دقائق دون كلام.",
            "إعادة قياس الضغط بالذراعين بجهاز معاير لبيئة الجاذبية الصغرى.",
            "تقييم مسببات التوتر، الألم الحاد، أو تناول الصوديوم والكافيين.",
            "فحص الأعراض العصبية والبصرية: صداع شديد خلفي، تشوش رؤية (فحص متلازمة SANS المرتبطة بالرحلات الفضائية)."
        ],
        "escalation_rules_en": "Contact Flight Surgeon if Systolic BP persists > 145 mmHg across 3 serial measurements or if accompanied by visual changes, severe headache, or chest discomfort.",
        "escalation_rules_ar": "الاتصال بطبيب الرحلة إذا استمر الضغط الانقباضي > 145 عبر 3 قياسات متتالية أو رافقته اضطرابات بصرية أو صداع حاد أو ألم صدري.",
        "space_considerations_en": "Cephalad fluid redistribution causes venous engorgement in upper body and head, increasing intracranial and ocular pressures.",
        "space_considerations_ar": "إعادة توزيع السوائل نحو الرأس تزيد الاحتقان الوريدي العلوي وضغط قاع العين والدماغ."
    },
    {
        "code": "PROT-04",
        "title_en": "Hypotension & Orthostatic Shock Protocol",
        "title_ar": "بروتوكول هبوط ضغط الدم والصدمة الانتصابية",
        "category": "Cardiovascular",
        "trigger_criteria_en": "Systolic BP < 85 mmHg or Diastolic BP < 50 mmHg.",
        "trigger_criteria_ar": "الضغط الانقباضي < 85 ملم زئبق أو الانبساطي < 50 ملم زئبق.",
        "immediate_actions_en": [
            "Secure astronaut horizontally or with slight leg elevation using medical harness.",
            "Administer 500-1000 mL electrolyte-balanced oral rehydration solution (or IV saline if oral intake is impaired).",
            "Prevent sudden body re-orientation or abrupt accelerations.",
            "Check for concealed bleeding, acute infection, or severe dehydration."
        ],
        "immediate_actions_ar": [
            "تثبيت الرائد أفقياً أو مع رفع القدمين قليلاً باستخدام حمالة التثبيت.",
            "إعطاء 500-1000 مل من محاليل الإمهاء الفموية المتوازنة كهرلياً (أو وريدياً إذا تعذر الشرب).",
            "منع الحركات الدورانية المفاجئة أو التغيرات السريعة في الوضعية.",
            "استبعاد النزيف الخفي، العدوى الحادة، أو الجفاف الشديد."
        ],
        "escalation_rules_en": "Escalate to Critical status immediately if accompanied by syncope, altered mental status, cold extremities, or Systolic BP < 75 mmHg.",
        "escalation_rules_ar": "تصعيد فوري للحالة الحرجة إذا رافقه إغماء أو تشوش إدراكي أو برودة أطراف أو انخفض الانقباضي دون 75 ملم زئبق.",
        "space_considerations_en": "Microgravity reduces intravascular plasma volume by 10-15% within days, leaving astronauts highly susceptible to profound hypotension.",
        "space_considerations_ar": "تفقد الدورة الدموية 10-15% من حجم البلازما خلال أيام في الفضاء، مما يجعل الرواد عرضة لهبوط الضغط الحاد."
    },
    {
        "code": "PROT-05",
        "title_en": "Hypoxia Protocol",
        "title_ar": "بروتوكول نقص الأكسجين (Hypoxia)",
        "category": "Respiratory",
        "trigger_criteria_en": "SpO2 < 90.0% at rest or sleep, or compound drop with high heart rate.",
        "trigger_criteria_ar": "نسبة تشبع الأكسجين SpO2 < 90.0% في الراحة أو النوم، أو انخفاض مركب مع تسارع النبض.",
        "immediate_actions_en": [
            "Check pulse oximeter placement; clean sensor optical window and warm fingers if hypothermic.",
            "Instruct astronaut to perform deep, steady ventilations.",
            "Verify Environmental Control and Life Support System (ECLSS) cabin parameters (Cabin O2 partial pressure & pressure).",
            "Don emergency quick-don oxygen mask from onboard emergency supply if SpO2 fails to recover within 60 seconds."
        ],
        "immediate_actions_ar": [
            "التحقق من تثبيت مجس الأكسجين، وتنظيف النافذة الضوئية وتدفئة الأصابع إذا كانت باردة.",
            "توجيه الرائد للشهيق والزفير العميق والمنتظم.",
            "فحص قراءات نظام دعم الحياة وتوليد الأكسجين بالكابينة (ECLSS وضغط الكابينة).",
            "ارتداء قناع الأكسجين الطبي للطوارئ فوراً إذا لم يرتفع SpO2 خلال 60 ثانية."
        ],
        "escalation_rules_en": "Escalate to Emergency if SpO2 drops < 85% or is accompanied by cyanosis, confusion, or loss of consciousness.",
        "escalation_rules_ar": "إعلان حالة طوارئ قصوى إذا انخفض SpO2 دون 85% أو رافقه ازرقاق بالشفاه أو تشوش ذهني أو فقدان وعي.",
        "space_considerations_en": "Absence of natural thermal convection in microgravity can cause stagnant exhaled CO2 pockets; verify local cabin airflow.",
        "space_considerations_ar": "غياب الحمل الحراري في انعدام الجاذبية يكوّن جيوباً راكدة من غاز الزفير؛ تأكد من عمل مراوح التهوية المحيطة بالرائد."
    },
    {
        "code": "PROT-06",
        "title_en": "Dyspnea / Respiratory Distress Protocol",
        "title_ar": "بروتوكول ضيق وصعوبة التنفس (Dyspnea)",
        "category": "Respiratory",
        "trigger_criteria_en": "Respiratory Rate > 24 or < 10 breaths/min at rest, or acute astronaut complaint of air hunger.",
        "trigger_criteria_ar": "معدل التنفس > 24 أو < 10 أنفاس/دقيقة في الراحة، أو شكوى حادة من ضيق واختناق تنفسي.",
        "immediate_actions_en": [
            "Assist astronaut into semi-upright restrained position facing ventilation intake.",
            "Check cabin air for smoke, particulate matter, ammonia, or hazardous vapors.",
            "Auscultate lungs with digital stethoscope (listen for wheezing, crackles, or asymmetric breath sounds).",
            "Administer humidified oxygen or bronchodilator inhaler as indicated by CMO."
        ],
        "immediate_actions_ar": [
            "تثبيت الرائد في وضع شبه جالس مقابل فتحة تدفق الهواء النقي.",
            "فحص هواء الكابينة بحثاً عن دخان، حبيبات معلقة، تسرب أمونيا، أو أبخرة سامة.",
            "فحص الرئتين بالسماعة الطبية الرقمية (تحري الأزيز، الحشرجة، أو غياب أصوات التنفس).",
            "إعطاء أكسجين مرطب أو بخاخ موسع للشعب الهوائية بتوجيه مسؤول الطاقم الطبي."
        ],
        "escalation_rules_en": "Escalate to Emergency status if severe retractions, stridor, cyanosis, or respiratory arrest develops.",
        "escalation_rules_ar": "تصعيد للطوارئ القصوى في حال تراجع عضلات القفص الصدري، صرير حاد، ازرقاق، أو بوادر توقف التنفس.",
        "space_considerations_en": "Aerosols and dust remain suspended indefinitely in microgravity; air filtration and scrubber status must be reviewed.",
        "space_considerations_ar": "تبقى الرذاذ والغبار معلقة في هواء المحطة دون استقرار؛ يجب مراجعة فلاتر تنقية الهواء ومصائد العوالق."
    },
    {
        "code": "PROT-07",
        "title_en": "Hyperthermia Protocol",
        "title_ar": "بروتوكول ارتفاع درجة حرارة الجسم (Hyperthermia)",
        "category": "Thermoregulation",
        "trigger_criteria_en": "Core Body Temperature > 38.3 °C at rest or > 39.0 °C during/after exercise, or Z-score >= +3.0.",
        "trigger_criteria_ar": "درجة حرارة الجسم > 38.3 °م في الراحة أو > 39.0 °م أثناء/بعد التمرين، أو Z-score >= +3.0.",
        "immediate_actions_en": [
            "Immediately terminate physical exercise and remove heavy or non-breathable garments.",
            "Apply active evaporative cooling: moist cool towels to neck, axillae, and groin; direct personal ventilation fan onto astronaut.",
            "Provide oral sips of cool electrolyte fluids (or cold IV saline if heat stroke is suspected).",
            "Monitor core temperature continuously every 5 minutes until below 37.5 °C."
        ],
        "immediate_actions_ar": [
            "إيقاف التمارين فوراً ونزع الملابس الثقيلة أو غير المنفذة للحرارة.",
            "بدء التبريد النشط: مناشف مبللة باردة حول العنق والإبطين وتوجيه مروحة تبريد مباشرة.",
            "رشفات متكررة من السوائل الباردة الغنية بالكهارل (أو محلول ملحي وريدي مبرد عند الاشتباه بضربة حرارة).",
            "مراقبة الحرارة المركزية باستمرار كل 5 دقائق حتى تنخفض دون 37.5 °م."
        ],
        "escalation_rules_en": "Contact Flight Surgeon and alert CMO immediately if temperature reaches > 38.5 °C, fails to decline within 20 minutes, or is accompanied by delirium, hot dry skin, or vomiting.",
        "escalation_rules_ar": "الاتصال بطبيب الرحلة وتنبيه CMO فوراً إذا بلغت الحرارة > 38.5 °م أو لم تنخفض خلال 20 دقيقة، أو رافقها هذيان أو جفاف جلد أو قيء.",
        "space_considerations_en": "In microgravity, sweat does not drip away but forms an insulating blanket film over the skin, drastically impairing evaporative heat loss ('Space Fever' phenomenon).",
        "space_considerations_ar": "في الفضاء لا يتساقط العرق بل يتراكم كطبقة عازلة فوق الجلد تعيق فقدان الحرارة التبخيري (ظاهرة حمى الفضاء Space Fever)."
    },
    {
        "code": "PROT-08",
        "title_en": "High Cabin CO2 Protocol",
        "title_ar": "بروتوكول ارتفاع ثاني أكسيد الكربون في الكابينة",
        "category": "Environmental",
        "trigger_criteria_en": "Cabin CO2 partial pressure > 5.3 mmHg accompanied by astronaut headache, drowsiness, nausea, or hyperventilation.",
        "trigger_criteria_ar": "الضغط الجزئي لـ CO2 في الكابينة > 5.3 ملم زئبق مترافقاً مع صداع، نعاس، غثيان، أو سرعة تنفس.",
        "immediate_actions_en": [
            "Check ISS / spacecraft Carbon Dioxide Removal Assembly (CDRA) / scrubber bed performance.",
            "Direct astronaut to relocate to a module with confirmed high ventilation and active circulation fans.",
            "Suspend rigorous exercise for all crew members to reduce metabolic CO2 production.",
            "Increase cabin ventilation fan speeds and verify inter-module air diffusers."
        ],
        "immediate_actions_ar": [
            "فحص كفاءة أجهزة امتصاص وتنقية ثاني أكسيد الكربون (CDRA) ومصائد الليثيوم.",
            "نقل الرائد إلى وحدة أخرى ذات تدفق هواء عالٍ ومراوح تهوية نشطة.",
            "تعليق التمارين الرياضية الشاقة لكافة أفراد الطاقم لتقليل إنتاج CO2 الأيضي.",
            "رفع سرعة مراوح تدوير الهواء بين الوحدات والتأكد من فتحات التهوية."
        ],
        "escalation_rules_en": "If CO2 levels remain > 5.5 mmHg or multiple astronauts develop symptoms, declare Environmental Alert and coordinate scrubber maintenance with Mission Control.",
        "escalation_rules_ar": "إذا بقي تركيز CO2 > 5.5 ملم زئبق أو ظهرت الأعراض على أكثر من رائد، تعلن حالة طوارئ بيئية وتنسيق صيانة أجهزة التنقية مع مركز التحكم.",
        "space_considerations_en": "Astronauts have heightened cerebral vascular sensitivity to CO2 in space, suffering symptoms at concentrations much lower than Earth thresholds.",
        "space_considerations_ar": "أدمغة الرواد في الفضاء تظهر حساسية شديدة لـ CO2 وتظهر الأعراض عند تراكيز أقل بكثير من حدود التحمل الأرضية."
    },
    {
        "code": "PROT-09",
        "title_en": "Cardiac Arrhythmia / ECG Anomaly Protocol",
        "title_ar": "بروتوكول اضطراب نظم القلب والشذوذ التخطيطي",
        "category": "Cardiovascular",
        "trigger_criteria_en": "QTc > 470 ms, QRS > 120 ms, PR > 200 ms, or irregular rhythm detected on telemetry.",
        "trigger_criteria_ar": "فترة QTc > 470 مللي ثانية، QRS > 120 مللي ثانية، أو عدم انتظام النبض على مخطط القلب.",
        "immediate_actions_en": [
            "Enforce immediate rest in medical restraint harness.",
            "Transmit 10-second high-resolution ECG strip directly to Ground Flight Surgeon.",
            "Check serum electrolyte status (potassium and magnesium levels via finger-stick blood analyzer).",
            "Prepare onboard Automated External Defibrillator (AED) on standby."
        ],
        "immediate_actions_ar": [
            "إلزام الرائد بالراحة الفورية في حزام التثبيت الطبي.",
            "إرسال شريط تخطيط قلب عالي الدقة لمدة 10 ثوانٍ مباشرة إلى طبيب الرحلة الأرضي.",
            "تحليل كهارل الدم (البوتاسيوم والمغنيسيوم عبر جهاز فحص وخز الإصبع السريع).",
            "تجهيز جهاز مزيل الرجفان الآلي (AED) في وضع الاستعداد الفوري."
        ],
        "escalation_rules_en": "Escalate to Critical/Emergency if QTc > 500 ms, polymorphic ventricular ectopy, ventricular tachycardia, or symptomatic hypotension occurs.",
        "escalation_rules_ar": "تصعيد فوري للحالة الحرجة/القصوى إذا تجاوز QTc > 500 مللي ثانية أو ظهر تسارع بطيني أو انخفاض حاد بالضغط.",
        "space_considerations_en": "Cardiac mass reduction and autonomic remodeling in long-duration spaceflight predispose to rhythm disturbances and QT prolongation.",
        "space_considerations_ar": "ضمور الكتلة العضلية للقلب وإعادة تكيّف الجهاز العصبي الذاتي في الفضاء يزيدان من عرضة اضطرابات النظم واستطالة QT."
    },
    {
        "code": "PROT-10",
        "title_en": "Cardiac or Respiratory Arrest Protocol",
        "title_ar": "بروتوكول توقف القلب أو التنفس (CPR في انعدام الجاذبية)",
        "category": "Critical Life Support",
        "trigger_criteria_en": "Loss of consciousness, absence of normal breathing, and no palpable pulse / flatline telemetry.",
        "trigger_criteria_ar": "فقدان الوعي، توقف التنفس الطبيعي، انعدام النبض، أو خط مستقيم في القياسات الحيوية.",
        "immediate_actions_en": [
            "Sound All-Crew Emergency Alarm immediately.",
            "Deploy Crew Medical Restraint System (CMRS): Restrain patient back-flat on board with torso straps.",
            "Rescuer secures own feet into foot restraints or utilizes the 'Handstand CPR' or 'Evetts-Russomano' reverse straddle technique.",
            "Deliver high-quality chest compressions at 100-120 bpm, depth 5-6 cm.",
            "Apply AED pads: Clear crew before shock delivery; resume compressions immediately post-shock.",
            "Secure supraglottic airway and provide positive pressure ventilation with 100% O2."
        ],
        "immediate_actions_ar": [
            "إطلاق صفارات الإنذار القصوى لكافة أفراد الطاقم فوراً.",
            "نشر لوح التثبيت الطبي (CMRS): ربط ظهر الرائد باللوح بأحزمة الصدر بإحكام.",
            "تثبيت المسعف لقدميه في مثبتات الأرضية أو استخدام تقنية Evetts-Russomano المعكوسة لتوليد القوة الضاغطة.",
            "بدء الضغط الصدري بمعدل 100-120 ضغطة/دقيقة وعمق 5-6 سم.",
            "تركيب أقطاب جهاز الصدمات (AED): إبعاد الطاقم قبل تفريغ الصدمة، واستئناف الإنعاش فوراً.",
            "تأمين مجرى تنفسي فوق الحنجرة والتهوية بالضغط الإيجابي مع أكسجين 100%."
        ],
        "escalation_rules_en": "Notify Mission Control and Flight Surgeon immediately; initiate abort / emergency de-orbit timeline preparation in parallel.",
        "escalation_rules_ar": "إخطار مركز التحكم وطبيب الرحلة فوراً؛ والبدء المتوازي بتجهيز مسار الهبوط الاضطراري للأرض.",
        "space_considerations_en": "Microgravity eliminates body weight contribution to chest compressions; physical restraint of BOTH patient and rescuer is strictly vital to generate adequate perfusion pressure.",
        "space_considerations_ar": "في انعدام الوزن لا يساهم وزن الجسم بالضغط؛ التثبيت الميكانيكي للرائد والمسعف معاً هو الشرط الوحيد لضمان تدفق الدم للأعضاء الحيوية."
    },
    {
        "code": "PROT-11",
        "title_en": "Solar Particle Event (SPE) Radiation Protocol",
        "title_ar": "بروتوكول العاصفة الإشعاعية الشمسية (SPE)",
        "category": "Environmental & Space Weather",
        "trigger_criteria_en": "Space weather sensor warning or sudden radiation dose rate > 2.5 mSv/day (normal ISS 0.4-0.8 mSv/day).",
        "trigger_criteria_ar": "تحذير مجسات طقس الفضاء أو ارتفاع مفاجئ في معدل الجرعة الإشعاعية > 2.5 ملي سيفرت/يوم.",
        "immediate_actions_en": [
            "Announce Radiation Storm alert across spacecraft intercom.",
            "Entire crew immediately evacuates to designated heavily shielded Storm Shelter module (e.g. Service Module aft or crew quarters surrounded by water/polyethylene tanks).",
            "Power down non-essential electronics and position food/water containers along module hull walls as biological shielding.",
            "Wear personal radiation dosimeters and log hourly cumulative dose."
        ],
        "immediate_actions_ar": [
            "إعلان إنذار عاصفة إشعاعية عبر الإذاعة الداخلية للمركبة.",
            "إخلاء الطاقم فوراً إلى وحدة المأوى المصفح والمحمي (Storm Shelter) المحاط بخزانات المياه ومصفوفات البولي إيثيلين.",
            "إطفاء الأجهزة الإلكترونية غير الضرورية ورصف حاويات المؤن والمياه على الجدران الخارجية لتدعيم التدريع البيولوجي.",
            "ارتداء مقاييس الجرعات الإشعاعية الشخصية وتسجيل الجرعة التراكمية بالساعة."
        ],
        "escalation_rules_en": "Remain inside storm shelter until Ground Mission Control and space weather observatories give the official All-Clear signal.",
        "escalation_rules_ar": "البقاء الإلزامي داخل المأوى المصفح حتى صدور إشارة زوال الخطر الرسمية من مركز التحكم ومراصد طقس الفضاء.",
        "space_considerations_en": "Beyond Earth's magnetosphere (Lunar & Mars missions), SPEs can cause acute radiation sickness (nausea, lymphopenia, burns) without heavy prompt shielding.",
        "space_considerations_ar": "خارج الغلاف المغناطيسي للأرض (القمر والمريخ)، يمكن للعواصف الشمسية إحداث متلازمة إشعاعية حادة ما لم يتم الاحتماء فوراً بالمأوى المعزز."
    },
    {
        "code": "PROT-12",
        "title_en": "Sleep Deprivation & Fatigue Protocol",
        "title_ar": "بروتوكول الحرمان من النوم والإرهاق التراكمي",
        "category": "Neurocognitive & Rest",
        "trigger_criteria_en": "Sleep duration < 5 hours for 2+ consecutive nights combined with HRV (RMSSD) drop < 25 ms or 6-hour baseline drift > 10%.",
        "trigger_criteria_ar": "نوم أقل من 5 ساعات لليلتين متتاليتين مع هبوط HRV دون 25 مللي ثانية أو انحراف المعدل 6 ساعات بأكثر من 10%.",
        "immediate_actions_en": [
            "Flag astronaut profile as 'Fatigued - Elevated Cognitive Error Risk'.",
            "Adjust spacecraft timeline to enforce mandatory 8.5-hour sleep opportunity block.",
            "Reassign critical robotic, docking, or EVA operations to alternate rested crew members.",
            "Review sleep hygiene: cabin lighting spectrum (switch to blue-depleted circadian lighting), sleep pod acoustics, temperature.",
            "Administer short-acting sleep aid (e.g., zolpidem or melatonin) only under Flight Surgeon authorization."
        ],
        "immediate_actions_ar": [
            "تصنيف ملف الرائد كـ 'مجهد - مخاطر خطأ إدراكي مرتفعة'.",
            "تعديل الجدول الزمني للمهمة لفرض فترة راحة ونوم إلزامية لا تقل عن 8.5 ساعات.",
            "إعادة تعيين المهام الحرجة (التحكم بالذراع الروبوتية، الالتحام، أو الخروج للفضاء) لرائد آخر مرتاح.",
            "تحسين بيئة النوم: خفض الضوء الأزرق بالكابينة، عزل الضوضاء، وضبط درجة الحرارة.",
            "صرف مساعد نوم قصير المفعول (مثل الميلاتونين أو الزولبيدم) بموافقة طبيب الرحلة فقط."
        ],
        "escalation_rules_en": "If psychomotor vigilance testing (PVT) shows persistent slow reaction times > 48 hours, conduct comprehensive psychological review with Ground Team.",
        "escalation_rules_ar": "إذا أظهرت اختبارات اليقظة الحركية النفسية (PVT) تباطؤاً مستمراً لأكثر من 48 ساعة، يتم إجراء مراجعة نفسية شاملة مع الفريق الأرضي.",
        "space_considerations_en": "Circadian rhythm disruption occurs due to 16 sunrises/sunsets every 24 hours in LEO; strict sleep entrainment is vital.",
        "space_considerations_ar": "يحدث اضطراب النظم اليوماوي بسبب رؤية 16 شروقاً وغروباً كل 24 ساعة في مدار الأرض؛ الانضباط الصارم لبيئة النوم أمر حيوي."
    },
    {
        "code": "PROT-13",
        "title_en": "Psychological Stress & Crew Isolation Protocol",
        "title_ar": "بروتوكول الضغط النفسي والعزلة الفضائية",
        "category": "Behavioral Health",
        "trigger_criteria_en": "Declining HRV RMSSD (< 20 ms), elevated resting heart rate without physical cause, social withdrawal, or mood degradation.",
        "trigger_criteria_ar": "انخفاض مؤشر HRV دون 20 مللي ثانية، تسارع نبض الراحة دون سبب جسدي، الانطواء، أو تراجع المزاج.",
        "immediate_actions_en": [
            "Schedule private encrypted 1-on-1 psychological video conference with Ground Flight Psychiatrist.",
            "Facilitate high-bandwidth family video comm link and private audio session.",
            "Incorporate structured crew social dinner and recreational VR relaxation exercises.",
            "Review astronaut task workload and relieve high-pressure non-essential mission tasks."
        ],
        "immediate_actions_ar": [
            "جدولة جلسة استشارية مرئية خاصة ومشفرة مع الطبيب النفسي للرحلة على الأرض.",
            "توفير اتصال مرئي عالي الجودة مع العائلة ومحادثة خاصة.",
            "تنظيم عشاء جماعي للطاقم وجلسات استرخاء بتقنية الواقع الافتراضي (VR).",
            "مراجعة أعباء العمل وتخفيف المهام الثانوية ذات الضغط الذهني العالي."
        ],
        "escalation_rules_en": "Escalate to Mission Commander and Chief Flight Surgeon if interpersonal conflict, acute depressive signs, or behavioral non-compliance emerges.",
        "escalation_rules_ar": "إخطار قائد المهمة وكبير أطباء الرحلة في حال ظهور خلافات حادة بين الطاقم، أو أعراض اكتئاب أو رفض للتعليمات.",
        "space_considerations_en": "Extreme confinement, sensory monotony, and distance from Earth require active psychological countermeasures, especially on deep space Mars transits.",
        "space_considerations_ar": "العزلة الشديدة ورتابة المحيط والبعد عن كوكب الأرض تتطلب دعماً نفسياً استباقياً، لا سيما في رحلات المريخ السحيقة."
    },
    {
        "code": "PROT-14",
        "title_en": "Trauma, Wound, Burn & EVA Emergency Protocol",
        "title_ar": "بروتوكول الإصابات والجروح والحروق وطوارئ بدلة الفضاء (EVA)",
        "category": "Trauma & Operational Emergency",
        "trigger_criteria_en": "Physical impact, laceration, thermal/chemical burn, or vital sign crash / suit telemetry alert during Extravehicular Activity (EVA Spacewalk).",
        "trigger_criteria_ar": "إصابة ميكانيكية، جرح نازف، حرق حراري/كيميائي، أو اضطراب حاد في العلامات الحيوية أثناء السير في الفضاء (EVA).",
        "immediate_actions_en": [
            "For EVA Emergency: Immediately terminate spacewalk, buddy crewmate assists astronaut into airlock, initiate rapid airlock repressurization.",
            "For Microgravity Bleeding: Apply direct localized pressure with hemostatic gauze; immediately cover wound with transparent occlusive dressing to prevent free-floating blood droplets.",
            "For Burns: Irrigate with sterile water from onboard eyewash/medical supply, apply sterile hydrogel dressing, avoid uncontained liquids.",
            "Secure injured limb with vacuum splint and anchor astronaut with medical restraint straps."
        ],
        "immediate_actions_ar": [
            "لطوارئ بدلة الفضاء (EVA): إنهاء السير الفضائي فوراً، مساعدة الزميل للعودة لغرفة معادلة الضغط (Airlock) وبدء إعادة الضغط السريع.",
            "للنزيف في انعدام الجاذبية: ضغط مباشر بشاش وقف النزيف المرقئ، وإغلاق الجرح بضمادة شفافة محكمة فوراً لمنع تطاير قطرات الدم في الهواء.",
            "للحروق: غسيل بمحلول معقم مغلق، وضع ضمادة هيدروجيل مبردة مع منع تطاير السوائل في الكابينة.",
            "تثبيت الطرف المصاب بجبيرة تفريغ الهواء وربط الرائد بأحزمة التثبيت الطبية لمنع الإيذاء العرضي."
        ],
        "escalation_rules_en": "Declare Medical Emergency if arterial hemorrhage, penetrating ocular injury, severe suit depressurization, or uncontained biohazard occurs.",
        "escalation_rules_ar": "إعلان حالة طوارئ طبية قصوى في حال النزيف الشرياني، إصابات العين النافذة، انخفاض ضغط البدلة، أو التلوث الحيوي غير المحتوى.",
        "space_considerations_en": "Uncontained blood or liquids in microgravity form floating droplets that pose severe contamination, ocular, and electrical hazards; rigorous droplet containment is mandatory.",
        "space_considerations_ar": "تشكل السوائل والدم المتطاير في انعدام الجاذبية خطراً جسيماً على تنفس الطاقم ومعدات المحطة الكهربائية؛ الاحتواء الفوري للقطرات إلزامي."
    }
]

ASTRONAUTS_SEED_DATA = [
    {
        "id": "AST-01",
        "name": "Cmdr. Layla",
        "name_ar": "القائدة ليلى",
        "age": 42,
        "gender": "Female",
        "role": "Mission Commander",
        "role_ar": "قائد المهمة",
        "current_activity": "rest",
        "mission_location": "ISS",
        "baselines": {
            "heart_rate": {"mean": 62.0, "sd": 4.0, "unit": "bpm"},
            "systolic_bp": {"mean": 108.0, "sd": 5.0, "unit": "mmHg"},
            "diastolic_bp": {"mean": 68.0, "sd": 4.0, "unit": "mmHg"},
            "spo2": {"mean": 97.5, "sd": 0.6, "unit": "%"},
            "respiratory_rate": {"mean": 14.0, "sd": 1.0, "unit": "breaths/min"},
            "body_temperature": {"mean": 36.8, "sd": 0.12, "unit": "°C"}
        },
        "secondary_baselines": {
            "ecg_pr": 155,
            "ecg_qrs": 85,
            "ecg_qtc": 415,
            "hrv_rmssd": 52.0,
            "daily_radiation": 0.55,
            "sleep_duration": 6.8,
            "exercise_hours": 2.5
        }
    },
    {
        "id": "AST-02",
        "name": "Eng. Omar",
        "name_ar": "المهندس عمر",
        "age": 38,
        "gender": "Male",
        "role": "Flight Engineer & Systems Specialist",
        "role_ar": "مهندس الرحلة وخبير الأنظمة",
        "current_activity": "light",
        "mission_location": "ISS",
        "baselines": {
            "heart_rate": {"mean": 68.0, "sd": 4.0, "unit": "bpm"},
            "systolic_bp": {"mean": 116.0, "sd": 5.0, "unit": "mmHg"},
            "diastolic_bp": {"mean": 72.0, "sd": 4.0, "unit": "mmHg"},
            "spo2": {"mean": 97.0, "sd": 0.6, "unit": "%"},
            "respiratory_rate": {"mean": 15.0, "sd": 1.0, "unit": "breaths/min"},
            "body_temperature": {"mean": 36.9, "sd": 0.12, "unit": "°C"}
        },
        "secondary_baselines": {
            "ecg_pr": 160,
            "ecg_qrs": 90,
            "ecg_qtc": 420,
            "hrv_rmssd": 48.0,
            "daily_radiation": 0.58,
            "sleep_duration": 6.2,
            "exercise_hours": 2.4
        }
    },
    {
        "id": "AST-03",
        "name": "Dr. Sara",
        "name_ar": "د. سارة",
        "age": 45,
        "gender": "Female",
        "role": "Chief Medical Officer (CMO)",
        "role_ar": "مسؤول الطاقم الطبي",
        "current_activity": "rest",
        "mission_location": "ISS",
        "baselines": {
            "heart_rate": {"mean": 64.0, "sd": 4.0, "unit": "bpm"},
            "systolic_bp": {"mean": 110.0, "sd": 5.0, "unit": "mmHg"},
            "diastolic_bp": {"mean": 70.0, "sd": 4.0, "unit": "mmHg"},
            "spo2": {"mean": 98.0, "sd": 0.5, "unit": "%"},
            "respiratory_rate": {"mean": 13.0, "sd": 1.0, "unit": "breaths/min"},
            "body_temperature": {"mean": 36.8, "sd": 0.12, "unit": "°C"}
        },
        "secondary_baselines": {
            "ecg_pr": 150,
            "ecg_qrs": 82,
            "ecg_qtc": 410,
            "hrv_rmssd": 58.0,
            "daily_radiation": 0.52,
            "sleep_duration": 7.0,
            "exercise_hours": 2.6
        }
    }
]

# Activity Ranges
ACTIVITY_RANGES = {
    "rest": {
        "heart_rate": {"earth_normal": [60, 100], "space_normal": [50, 90], "warning_low": [40, 49], "warning_high": [91, 110], "crit_low": 40, "crit_high": 110},
        "systolic_bp": {"earth_normal": [90, 120], "space_normal": [95, 130], "warning_low": [85, 94], "warning_high": [131, 145], "crit_low": 85, "crit_high": 145},
        "diastolic_bp": {"earth_normal": [60, 80], "space_normal": [55, 85], "warning_low": [50, 54], "warning_high": [86, 95], "crit_low": 50, "crit_high": 95},
        "spo2": {"earth_normal": [95.0, 100.0], "space_normal": [95.0, 100.0], "warning_low": [90.0, 94.9], "warning_high": None, "crit_low": 90.0, "crit_high": None},
        "respiratory_rate": {"earth_normal": [12, 20], "space_normal": [12, 20], "warning_low": [10, 11], "warning_high": [21, 24], "crit_low": 10, "crit_high": 24},
        "body_temperature": {"earth_normal": [36.1, 37.2], "space_normal": [36.1, 37.5], "warning_low": [35.5, 36.09], "warning_high": [37.51, 38.3], "crit_low": 35.5, "crit_high": 38.3}
    },
    "light": {
        "heart_rate": {"earth_normal": [60, 100], "space_normal": [50, 90], "warning_low": [40, 49], "warning_high": [91, 110], "crit_low": 40, "crit_high": 110},
        "systolic_bp": {"earth_normal": [90, 120], "space_normal": [95, 130], "warning_low": [85, 94], "warning_high": [131, 145], "crit_low": 85, "crit_high": 145},
        "diastolic_bp": {"earth_normal": [60, 80], "space_normal": [55, 85], "warning_low": [50, 54], "warning_high": [86, 95], "crit_low": 50, "crit_high": 95},
        "spo2": {"earth_normal": [95.0, 100.0], "space_normal": [95.0, 100.0], "warning_low": [90.0, 94.9], "warning_high": None, "crit_low": 90.0, "crit_high": None},
        "respiratory_rate": {"earth_normal": [12, 20], "space_normal": [12, 20], "warning_low": [10, 11], "warning_high": [21, 24], "crit_low": 10, "crit_high": 24},
        "body_temperature": {"earth_normal": [36.1, 37.2], "space_normal": [36.1, 37.5], "warning_low": [35.5, 36.09], "warning_high": [37.51, 38.3], "crit_low": 35.5, "crit_high": 38.3}
    },
    "sleep": {
        "heart_rate": {"normal": [40, 80], "warning_low": [35, 39], "warning_high": [81, 100], "crit_low": 35, "crit_high": 100},
        "systolic_bp": {"normal": [85, 120], "warning_low": [80, 84], "warning_high": [121, 135], "crit_low": 80, "crit_high": 135},
        "diastolic_bp": {"normal": [50, 80], "warning_low": [45, 49], "warning_high": [81, 90], "crit_low": 45, "crit_high": 90},
        "spo2": {"normal": [93.0, 100.0], "warning_low": [88.0, 92.9], "warning_high": None, "crit_low": 88.0, "crit_high": None},
        "respiratory_rate": {"normal": [10, 18], "warning_low": [8, 9], "warning_high": [19, 22], "crit_low": 8, "crit_high": 22},
        "body_temperature": {"normal": [35.8, 37.2], "warning_low": [35.3, 35.79], "warning_high": [37.21, 38.0], "crit_low": 35.3, "crit_high": 38.0}
    },
    "exercise": {
        "heart_rate": {"normal": [90, 155], "warning_low": [70, 89], "warning_high": [156, 175], "crit_low": 70, "crit_high": 175},
        "systolic_bp": {"normal": [120, 170], "warning_low": [105, 119], "warning_high": [171, 185], "crit_low": 105, "crit_high": 185},
        "diastolic_bp": {"normal": [65, 90], "warning_low": [55, 64], "warning_high": [91, 100], "crit_low": 55, "crit_high": 100},
        "spo2": {"normal": [94.0, 100.0], "warning_low": [90.0, 93.9], "warning_high": None, "crit_low": 90.0, "crit_high": None},
        "respiratory_rate": {"normal": [18, 35], "warning_low": [14, 17], "warning_high": [36, 40], "crit_low": 14, "crit_high": 40},
        "body_temperature": {"normal": [37.0, 38.3], "warning_low": [36.5, 36.99], "warning_high": [38.31, 39.0], "crit_low": 36.5, "crit_high": 39.0}
    }
}

# Means & Jitter for Generator
ACTIVITY_GENERATOR_MEANS = {
    "rest": {"heart_rate": (66.0, 3.0), "systolic_bp": (112.0, 4.0), "diastolic_bp": (70.0, 3.0), "spo2": (97.5, 0.5), "respiratory_rate": (14.0, 1.0), "body_temperature": (36.9, 0.1)},
    "sleep": {"heart_rate": (54.0, 3.0), "systolic_bp": (100.0, 4.0), "diastolic_bp": (60.0, 3.0), "spo2": (96.5, 0.5), "respiratory_rate": (12.0, 1.0), "body_temperature": (36.5, 0.1)},
    "light": {"heart_rate": (80.0, 3.0), "systolic_bp": (115.0, 4.0), "diastolic_bp": (72.0, 3.0), "spo2": (97.5, 0.5), "respiratory_rate": (15.0, 1.0), "body_temperature": (36.9, 0.1)},
    "exercise": {"heart_rate": (135.0, 3.0), "systolic_bp": (145.0, 4.0), "diastolic_bp": (78.0, 3.0), "spo2": (97.0, 0.5), "respiratory_rate": (24.0, 1.0), "body_temperature": (37.8, 0.1)}
}

# Mission Location Configuration
MISSION_LOCATIONS = {
    "ISS": {
        "name_en": "Low Earth Orbit (ISS)",
        "name_ar": "مدار الأرض المنخفض (محطة الفضاء الدولية)",
        "comm_delay_seconds": 0.5,
        "comm_delay_display": "< 1 second (Near-Continuous)",
        "comm_delay_display_ar": "أقل من ثانية (شبه فوري)",
        "autonomy_level": "Medium",
        "autonomy_level_ar": "متوسطة",
        "return_timeline": "Hours (via docked Soyuz / Crew Dragon)",
        "return_timeline_ar": "ساعات معدودة (عبر مركبات سويوز أو كرو دراجون الملتحمة)",
        "radiation_rate_range": [0.4, 0.8]
    },
    "Moon": {
        "name_en": "Lunar Mission (Artemis)",
        "name_ar": "مهمة القمر (برنامج أرتميس)",
        "comm_delay_seconds": 1.5,
        "comm_delay_display": "1.3 - 2.0 seconds",
        "comm_delay_display_ar": "1.3 - 2.0 ثانية",
        "autonomy_level": "High",
        "autonomy_level_ar": "عالية",
        "return_timeline": "3 to 5 Days (Orion return trajectory)",
        "return_timeline_ar": "3 إلى 5 أيام (مسار عودة مركبة أوريون)",
        "radiation_rate_range": [1.2, 2.0]
    },
    "Mars": {
        "name_en": "Deep Space / Mars Mission",
        "name_ar": "الفضاء السحيق / مهمة المريخ",
        "comm_delay_seconds": 720, # 12 mins average (range 3 to 22 mins)
        "comm_delay_display": "3 to 22 minutes (Planetary delay)",
        "comm_delay_display_ar": "3 إلى 22 دقيقة (تأخير كوكبي)",
        "autonomy_level": "Near-Complete",
        "autonomy_level_ar": "شبه كاملة (الذكاء الاصطناعي وCMO يتخذان القرارات الفورية دون انتظار الأرض)",
        "return_timeline": "Impossible for months (Orbital transfer window)",
        "return_timeline_ar": "مستحيلة لعدة أشهر (نافذة الانتقال المداري)",
        "radiation_rate_range": [1.8, 3.5]
    }
}

# Crew Responsibility Matrix
CREW_RESPONSIBILITY_MATRIX = [
    {
        "role_key": "injured",
        "title_en": "Injured Astronaut",
        "title_ar": "الرائد المصاب",
        "responsibilities_en": "Reports immediate subjective symptoms, stays calm, cooperates with medical directives, secures biosensors.",
        "responsibilities_ar": "الإبلاغ الفوري عن الأعراض الذاتية، الحفاظ على الهدوء، الامتثال للتوجيهات، والتأكد من تثبيت المجسات."
    },
    {
        "role_key": "first_responder",
        "title_en": "Nearest Crewmate / First Responder",
        "title_ar": "زميل الطاقم الأقرب",
        "responsibilities_en": "Verifies astronaut consciousness, secures physical microgravity restraint, initiates primary life support / first aid.",
        "responsibilities_ar": "فحص وعي الرائد، تثبيته بأحزمة انعدام الجاذبية فوراً، والبدء بالإسعافات الأولية ودعم الحياة الأساسي."
    },
    {
        "role_key": "cmo",
        "title_en": "Crew Medical Officer (CMO)",
        "title_ar": "مسؤول الطاقم الطبي (CMO)",
        "responsibilities_en": "Leads onboard clinical diagnosis, operates medical hardware, administers pharmaceuticals, liaises directly with Flight Surgeon.",
        "responsibilities_ar": "قيادة التشخيص السريري، تشغيل المعدات الطبية والـ AED، إعطاء الأدوية، والتنسيق المباشر مع طبيب الرحلة."
    },
    {
        "role_key": "flight_surgeon",
        "title_en": "Ground Flight Surgeon",
        "title_ar": "طبيب الرحلة على الأرض",
        "responsibilities_en": "Reviews live telemetry trends, conducts private medical conferences, guides specialized clinical differential and final Rx.",
        "responsibilities_ar": "مراجعة القياسات الحيوية وتاريخ المريض، إدارة القناة الطبية الخاصة، تقديم التوجيه العلاجي الحاسم."
    },
    {
        "role_key": "mission_control",
        "title_en": "Mission Control (MCC)",
        "title_ar": "مركز التحكم بالمهمة",
        "responsibilities_en": "Coordinates spacecraft systems, environmental scrubbers, orbital trajectory, and readies emergency return assets.",
        "responsibilities_ar": "تنسيق أنظمة المركبة وتدوير الهواء ومسار المركبة وتجهيز فرق الإنقاذ الأرضية في حال العودة الاضطرارية."
    },
    {
        "role_key": "commander",
        "title_en": "Mission Commander",
        "title_ar": "قائد المهمة",
        "responsibilities_en": "Authorizes timeline modifications, EVA aborts, re-allocates crew duties, and authorizes emergency abort/return.",
        "responsibilities_ar": "المصادقة على تعديل خطط المهمة، إلغاء السير الفضائي، إعادة توزيع المهام، وإصدار قرار الإخلاء والعودة."
    }
]
