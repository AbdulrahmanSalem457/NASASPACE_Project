export const TRANSLATIONS = {
  en: {
    appTitle: "AstroVitals AI",
    appSubtitle: "Astronaut Health Monitoring & Medical Emergency Response System",
    nasaChallenge: "NASA Space Apps Challenge Demonstration",
    disclaimerTitle: "Mandatory Research & Simulation Disclaimer",
    disclaimerText: "Synthetic / Simulated Data & Procedures: Built on general space physiology principles for NASA Space Apps Challenge demonstration only — not official NASA protocols or medical advice. Final medical decisions belong to the Crew Medical Officer (CMO) and Flight Surgeon.",
    
    // Nav & Controls
    astronaut: "Astronaut",
    selectAstronaut: "Select Astronaut",
    missionLocation: "Mission Location",
    currentActivity: "Current Activity",
    commStatus: "Telemetry Comm Link",
    commDelay: "One-Way Delay",
    crewAutonomy: "Crew Autonomy",
    emergencyReturn: "Emergency Return Feasibility",
    
    // Activities
    rest: "Rest",
    light: "Light Work",
    sleep: "Sleep",
    exercise: "Exercise",

    // Vitals
    coreVitals: "Core Vital Telemetry",
    personalBaseline: "Personal Baseline (Mean ± SD)",
    zScore: "Z-Score",
    status: "Status",
    withinNormal: "Nominal Space Range",
    warningShift: "Warning Deviation (|Z| ≥ 2.0)",
    criticalShift: "Critical Deviation (|Z| ≥ 3.0)",
    
    heart_rate: "Heart Rate",
    systolic_bp: "Systolic BP",
    diastolic_bp: "Diastolic BP",
    spo2: "SpO2 (Oxygen Saturation)",
    respiratory_rate: "Respiratory Rate",
    body_temperature: "Core Body Temp",

    // Secondary Indicators
    secondaryIndicators: "Spaceflight Context & Cabin Environmental Metrics",
    ecgSummary: "ECG Telemetry",
    ecgRhythm: "Rhythm",
    hrvRmssd: "HRV (RMSSD)",
    cabinCo2: "Cabin CO2 Pressure",
    cabinPressure: "Cabin Atmospheric Pressure",
    dailyRadiation: "Daily Radiation Dose",
    sleepDuration: "Recent Sleep Duration",
    exerciseHours: "Daily Exercise Countermeasure",

    // Alert Center
    alertCenter: "Active Emergency Alerts & Clinical Response",
    noActiveAlerts: "All telemetry nominal. No active medical alerts.",
    alertOnset: "Alert Onset Elapsed Time",
    contactSurgeonBtn: "Contact Ground Flight Surgeon & Auto-Send Telemetry",
    surgeonContacted: "Telemetry Transmitted to Ground Flight Surgeon",
    transmittingTelemetry: "Transmitting 24h Telemetry Bundle...",
    eightStepChecklist: "Standard 8-Step Emergency Response Protocol",
    probableCause: "Probable Space Physiological / Environmental Cause",
    actionLogs: "Incident Response Audit Log",
    closeModal: "Close Alert Center",
    markStepComplete: "Mark Step Done",
    stepCompleted: "Executed",

    // Simulation Bar
    simulationLab: "Prototype Simulation Lab (Judges Bar)",
    scenario1Title: "Scenario 1: Tachycardia + Hypoxia (AST-02)",
    scenario1Desc: "14:04-14:37 Event: HR 131 bpm, SpO2 90.0%, RR 27 -> Multi-Signal Critical Red",
    scenario2Title: "Scenario 2: Gradual Hyperthermia (AST-03)",
    scenario2Desc: "18:00-22:00 Event: Temp +1.4°C rise up to 38.33°C -> Warning to Critical 'Space Fever'",
    scenario3Title: "Scenario 3: Sleep Deprivation & Low HRV (AST-01)",
    scenario3Desc: "< 4.5 hrs sleep for 3 nights + HRV drops to 22 ms -> Autonomic fatigue alert",
    scenario4Title: "Scenario 4: Cabin CO2 Spike (5.8 mmHg)",
    scenario4Desc: "Cabin CO2 > 5.3 mmHg + headache/drowsiness -> Scrubber bed warning",
    scenario5Title: "Scenario 5: SPE Radiation / EVA Emergency",
    scenario5Desc: "Solar Particle Event storm shelter evacuation or All-Crew Cardiac Arrest siren",
    scenarioActive: "Active Scenario",
    resetNominal: "Reset to Nominal Telemetry",

    // Tabs
    telemetryCharts: "24h & 30d Telemetry Charts",
    anatomicalView: "Anatomical Space Physiology",
    protocolsBrowser: "14 Condition Protocols",
    crewMatrix: "Crew Responsibility Matrix",
    healthReports: "Daily & Weekly Health Reports",
    aiAdvisor: "AI Clinical Decision Support",

    // Chart Controls
    last24Hours: "Last 24 Hours (Minute-by-Minute from CSV)",
    last30Days: "30-Day Historical Trend",
    toggleMetric: "Select Metric to Plot",
    baselineBand: "Personal Baseline Shaded Band (Mean ± SD)",
    warningThreshold: "Warning Boundary",
    criticalThreshold: "Critical Boundary",

    // AI Advisor
    clinicalSummary: "Clinical Assessment Summary",
    actionableDirectives: "Actionable Treatment Directives",
    spacePhysiologyFactors: "Spaceflight Physiological Mechanisms",
    requestAiAnalysis: "Run AI Clinical Synthesis",

    // Reports
    dailyRollup: "24-Hour Telemetry Rollup",
    weeklyRollup: "7-Day Health & Compliance Summary",
    exerciseCompliance: "Exercise Countermeasure Compliance (Target: 2.5 h/day)",
    sleepCompliance: "Circadian Sleep Compliance (Target: 6.5 h/night)",
    careerRadiation: "Radiation Dose Tracking (Career Limit: 600 mSv)",
    alertBreakdown: "Medical Alert Severity Breakdown",

    // Anatomical Hotspots
    exploreAnatomy: "Click Any Anatomical System to Inspect Space vs Earth Physiology",
    whatDiffers: "What Differs in Microgravity vs Earth Gravity?",
    
    // Common
    minutes: "min",
    seconds: "sec",
    hours: "hrs",
    active: "ACTIVE",
    resolved: "RESOLVED",
    severity: "Severity",
  },
  ar: {
    appTitle: "AstroVitals AI — الفضاء الطبي",
    appSubtitle: "نظام مراقبة صحة رواد الفضاء والاستجابة الطبية للطوارئ",
    nasaChallenge: "تحدي ناسا لتطبيقات الفضاء (NASA Space Apps Challenge)",
    disclaimerTitle: "تنبيه إخلاء المسؤولية التجريبي الإلزامي",
    disclaimerText: "تنبيه: البيانات والإجراءات تجريبية (Synthetic / Simulated Data) ومبنية على مبادئ عامة في الطب الفضائي لأغراض العرض التجريبي فقط، وليست بروتوكولات رسمية من ناسا أو نصيحة طبية. القرارات الطبية النهائية تعود لمسؤول الطاقم الطبي (CMO) وطبيب الرحلة الأرضي.",

    // Nav & Controls
    astronaut: "رائد الفضاء",
    selectAstronaut: "اختر رائد الفضاء",
    missionLocation: "موقع المهمة المداري",
    currentActivity: "النشاط الحالي",
    commStatus: "قناة القياسات اللاسلكية",
    commDelay: "زمن التأخير باتجاه واحد",
    crewAutonomy: "درجة استقلالية الطاقم",
    emergencyReturn: "إمكانية العودة الاضطرارية للأرض",

    // Activities
    rest: "راحة",
    light: "نشاط خفيف",
    sleep: "نوم",
    exercise: "تمارين رياضية",

    // Vitals
    coreVitals: "القياسات الحيوية الأساسية الستة",
    personalBaseline: "خط الأساس الشخصي (المتوسط ± الانحراف المعياري)",
    zScore: "معامل الانحراف المعياري (Z-Score)",
    status: "الحالة",
    withinNormal: "ضمن النطاق الفضائي الطبيعي",
    warningShift: "انحراف تحذيري (|Z| ≥ 2.0)",
    criticalShift: "انحراف حرج (|Z| ≥ 3.0)",

    heart_rate: "معدل ضربات القلب",
    systolic_bp: "الضغط الانقباضي",
    diastolic_bp: "الضغط الانبساطي",
    spo2: "تشبع الأكسجين (SpO2)",
    respiratory_rate: "معدل التنفس",
    body_temperature: "درجة حرارة الجسم المركزية",

    // Secondary Indicators
    secondaryIndicators: "مؤشرات بيئة الكابينة ومحددات الفضاء",
    ecgSummary: "تخطيط كهربية القلب (ECG)",
    ecgRhythm: "النظم القلبي",
    hrvRmssd: "تقلب ضربات القلب (HRV)",
    cabinCo2: "ضغط غاز ثاني أكسيد الكربون",
    cabinPressure: "الضغط الجوي للكابينة",
    dailyRadiation: "الجرعة الإشعاعية اليومية",
    sleepDuration: "ساعات النوم الأخيرة",
    exerciseHours: "ساعات التمارين اليومية",

    // Alert Center
    alertCenter: "مركز الإنذار الطبي والاستجابة للطوارئ",
    noActiveAlerts: "جميع القياسات طبيعية. لا توجد إنذارات طبية نشطة حالياً.",
    alertOnset: "الوقت المنقضي منذ إطلاق الإنذار",
    contactSurgeonBtn: "التواصل مع طبيب الرحلة الأرضي وبث القياسات الحيوية",
    surgeonContacted: "تم بث القياسات الحيوية لطبيب الرحلة على الأرض بنجاح",
    transmittingTelemetry: "جاري بث حزمة بيانات الـ 24 ساعة عبر القناة الطبية المشفرة...",
    eightStepChecklist: "قائمة الإجراءات القياسية ذات الـ 8 خطوات للطوارئ",
    probableCause: "السبب الفسيولوجي أو البيئي المحتمل في الفضاء",
    actionLogs: "سجل إجراءات وتدخلات الطاقم الموثق",
    closeModal: "إغلاق نافذة الإنذار",
    markStepComplete: "تأكيد إنجاز الخطوة",
    stepCompleted: "تم التنفيذ",

    // Simulation Bar
    simulationLab: "مختبر محاكاة سيناريوهات الاختبار (شريط لجنة التحكيم)",
    scenario1Title: "السيناريو 1: تسارع ونقص أكسجين (المهندس عمر)",
    scenario1Desc: "حادثة 14:04-14:37: نبض 131، تشبع 90%، تنفس 27 -> تصعيد مركب أحمر",
    scenario2Title: "السيناريو 2: حمى الفضاء التدريجية (د. سارة)",
    scenario2Desc: "حادثة 18:00-22:00: ارتفاع الحرارة +1.4°م لتبلغ 38.33°م -> تحذير ثم حرج",
    scenario3Title: "السيناريو 3: حرمان النوم وانخفاض HRV (القائدة ليلى)",
    scenario3Desc: "أقل من 4.5 ساعة لـ 3 ليالٍ + هبوط HRV إلى 22 مللي ثانية -> إرهاق عصبي",
    scenario4Title: "السيناريو 4: ارتفاع ثاني أكسيد الكربون (5.8 ملم زئبق)",
    scenario4Desc: "تجاوز حد 5.3 ملم زئبق مع صداع -> فحص مصائد CDRA وتدوير الهواء",
    scenario5Title: "السيناريو 5: عاصفة إشعاعية أو انهيار قلبي EVA",
    scenario5Desc: "إخلاء للمأوى المصفح أو صفارات الإنذار القصوى لإنعاش القلب في الفضاء",
    scenarioActive: "السيناريو قيد التشغيل",
    resetNominal: "إعادة تعيين القياسات للطبيعية",

    // Tabs
    telemetryCharts: "مخططات القياسات (24 ساعة و30 يوماً)",
    anatomicalView: "تشريح وظائف الأعضاء في الفضاء",
    protocolsBrowser: "استعراض البروتوكولات الـ 14",
    crewMatrix: "مصفوفة مسؤوليات الطاقم الطبي",
    healthReports: "التقارير الصحية اليومية والأسبوعية",
    aiAdvisor: "المستشار السريري الذكي (AI)",

    // Chart Controls
    last24Hours: "آخر 24 ساعة (دقيقة بدقيقة من ملف CSV)",
    last30Days: "المسار التاريخي لـ 30 يوماً",
    toggleMetric: "اختر المؤشر الحيوي للرسم",
    baselineBand: "نطاق خط الأساس الشخصي المظلل (المتوسط ± الانحراف)",
    warningThreshold: "حد الإنذار التحذيري (Warning)",
    criticalThreshold: "حد الإنذار الحرج (Critical)",

    // AI Advisor
    clinicalSummary: "الملخص والتقييم السريري الذكي",
    actionableDirectives: "التوجيهات والخطوات العلاجية المباشرة",
    spacePhysiologyFactors: "الآليات الفسيولوجية المرتبطة بالفضاء",
    requestAiAnalysis: "تحديث التحليل السريري المتقدم",

    // Reports
    dailyRollup: "ملخص القياسات لـ 24 ساعة",
    weeklyRollup: "ملخص الامتثال الصحي الأسبوعي (7 أيام)",
    exerciseCompliance: "الامتثال لبرنامج التمارين الرياضية (الهدف: 2.5 ساعة/يوم)",
    sleepCompliance: "الامتثال لساعات النوم اليوماوية (الهدف: 6.5 ساعة/ليلة)",
    careerRadiation: "مراقبة الجرعة الإشعاعية (الحد المهني التراكمي: 600 ملي سيفرت)",
    alertBreakdown: "توزيع الإنذارات الطبية حسب درجة الخطورة",

    // Anatomical Hotspots
    exploreAnatomy: "اضغط على أي جهاز حيوي لاكتشاف التغيرات الفسيولوجية بين الفضاء والأرض",
    whatDiffers: "ما الذي يتغير في الجاذبية الصغرى مقارنة بالأرض؟",

    // Common
    minutes: "دقيقة",
    seconds: "ثانية",
    hours: "ساعات",
    active: "نشط",
    resolved: "محلول",
    severity: "درجة الخطورة",
  }
};
