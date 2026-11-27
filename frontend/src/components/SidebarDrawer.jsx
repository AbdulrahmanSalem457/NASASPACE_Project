import React from 'react';
import { 
  X, User, Radio, Activity, Sparkles, CheckCircle2, 
  Flame, Moon, Wind, HeartPulse, RefreshCw, ShieldAlert,
  Clock, MapPin, Gauge, Check, ArrowRight, Eye
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const SidebarDrawer = ({ isOpen, onClose }) => {
  const {
    lang,
    t,
    astronauts,
    selectedAstronaut,
    selectedAstronautId,
    changeAstronaut,
    location,
    changeLocation,
    activity,
    changeActivity,
    bootstrap,
    activeScenario,
    triggerScenario,
    currentVitals,
    resetNominal
  } = useAstro();

  if (!isOpen) return null;

  const locInfo = bootstrap?.mission_locations?.[location] || {
    comm_delay_display: '< 1 second',
    comm_delay_display_ar: 'أقل من ثانية واحدة',
    autonomy_level: 'Medium'
  };

  const scenariosList = [
    {
      id: "0",
      title_ar: "0: الحالة الطبيعية المستقرة (0 إنذارات)",
      title_en: "0: Nominal State (0 Alerts)",
      desc_ar: "جميع المؤشرات طبيعية (نبض 68، أكسجين 97%، تنفس 15)",
      desc_en: "All vitals normal (HR 68 bpm, SpO2 97%, RR 15 bpm)",
      icon: CheckCircle2,
      badge_ar: "طبيعي مستقر",
      badge_en: "Nominal",
      baseStyle: "border-slate-800 bg-slate-950/60 hover:border-emerald-500/50",
      activeStyle: "border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20"
    },
    {
      id: "1",
      title_ar: "1: تسارع ضربات القلب ونقص الأكسجين",
      title_en: "1: Tachycardia + Hypoxia Crisis",
      desc_ar: "نبض 131، أكسجين 90%، تنفس 27 (تصعيد مركب PROT-01)",
      desc_en: "HR 131 bpm, SpO2 90.0%, RR 27 bpm (PROT-01)",
      icon: Activity,
      badge_ar: "حرج أحمر",
      badge_en: "Critical Red",
      baseStyle: "border-slate-800 bg-slate-950/60 hover:border-red-500/50",
      activeStyle: "border-red-500 bg-red-950/40 text-red-300 ring-2 ring-red-500/50 shadow-lg shadow-red-500/20"
    },
    {
      id: "2",
      title_ar: "2: حمى الفضاء وارتفاع الحرارة",
      title_en: "2: Space Fever (+1.5°C)",
      desc_ar: "حرارة مركزية 38.33°م (احتباس العرق وانعدام التبريد)",
      desc_en: "Core Temp 38.33°C (Sweat film insulation)",
      icon: Flame,
      badge_ar: "حرج أحمر",
      badge_en: "Critical Red",
      baseStyle: "border-slate-800 bg-slate-950/60 hover:border-red-500/50",
      activeStyle: "border-red-500 bg-red-950/40 text-red-300 ring-2 ring-red-500/50 shadow-lg shadow-red-500/20"
    },
    {
      id: "3",
      title_ar: "3: حرمان النوم والإجهاد العصبي",
      title_en: "3: Cumulative Sleep Deprivation",
      desc_ar: "نوم 4.2 ساعة وهبوط تقلب ضربات القلب (HRV 22ms)",
      desc_en: "Sleep 4.2h, Low HRV (22ms)",
      icon: Moon,
      badge_ar: "تحذير أصفر",
      badge_en: "Warning Amber",
      baseStyle: "border-slate-800 bg-slate-950/60 hover:border-amber-500/50",
      activeStyle: "border-amber-500 bg-amber-950/40 text-amber-300 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20"
    },
    {
      id: "4",
      title_ar: "4: ارتفاع تركيز ثاني أكسيد الكربون",
      title_en: "4: Cabin CO2 Elevation",
      desc_ar: "ثاني أكسيد الكربون 5.8 ملم زئبق مع صداع وإجهاد",
      desc_en: "Cabin CO2: 5.8 mmHg with headache & drowsiness",
      icon: Wind,
      badge_ar: "تحذير أصفر",
      badge_en: "Warning Amber",
      baseStyle: "border-slate-800 bg-slate-950/60 hover:border-yellow-500/50",
      activeStyle: "border-yellow-500 bg-yellow-950/40 text-yellow-300 ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/20"
    },
    {
      id: "5",
      title_ar: "5: طوارئ إنعاش القلب في الفضاء",
      title_en: "5: Zero-G Cardiac Emergency",
      desc_ar: "توقف القلب والتنفس (أحزمة التثبيت وجهاز إزالة الرجفان)",
      desc_en: "Cardiac arrest in microgravity (CMRS & Defibrillator)",
      icon: HeartPulse,
      badge_ar: "طوارئ قصوى",
      badge_en: "Emergency",
      baseStyle: "border-slate-800 bg-slate-950/60 hover:border-rose-500/50",
      activeStyle: "border-rose-500 bg-rose-950/40 text-rose-300 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Light semi-transparent Backdrop so the dashboard behind is clearly visible */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity cursor-pointer"
        title={lang === 'ar' ? 'انقر هنا لإغلاق القائمة' : 'Click to close'}
      />

      <div className={`fixed inset-y-0 ${lang === 'ar' ? 'right-0' : 'left-0'} max-w-full flex`}>
        <div className="w-screen max-w-md bg-slate-900 border-x border-slate-800 shadow-2xl flex flex-col h-full z-10">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-mono text-white">
                  {lang === 'ar' ? 'لوحة المحاكاة والتحكم في المهمة' : 'Mission & Simulation Controls'}
                </h2>
                <p className="text-[11px] text-slate-400 font-sans">
                  {lang === 'ar' ? 'اختر أي سيناريو لرؤية التحديث الفوري في الداشبورد' : 'Select any scenario to see instant dashboard updates'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={lang === 'ar' ? 'إغلاق القائمة' : 'Close Drawer'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Live Status Box Inside Drawer */}
          {currentVitals && (
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">{lang === 'ar' ? 'القياسات الحالية:' : 'Live Telemetry:'}</span>
              <div className="flex items-center gap-2 font-bold">
                <span className={currentVitals.heart_rate >= 115 || currentVitals.heart_rate < 40 ? 'text-red-400' : 'text-emerald-400'}>
                  {lang === 'ar' ? `النبض: ${currentVitals.heart_rate} ن/د` : `HR: ${currentVitals.heart_rate} bpm`}
                </span>
                <span className="text-slate-600">|</span>
                <span className={currentVitals.spo2 <= 90.0 ? 'text-red-400' : 'text-cyan-400'}>
                  {lang === 'ar' ? `الأكسجين: ${currentVitals.spo2}%` : `SpO2: ${currentVitals.spo2}%`}
                </span>
                <span className="text-slate-600">|</span>
                <span className={currentVitals.body_temperature >= 38.3 ? 'text-red-400' : 'text-amber-400'}>
                  {lang === 'ar' ? `الحرارة: ${currentVitals.body_temperature}°م` : `${currentVitals.body_temperature}°C`}
                </span>
              </div>
            </div>
          )}

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* 1. INTERACTIVE SCENARIOS SELECTION */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'ar' ? '1. سيناريو المحاكاة الطبي:' : '1. Medical Simulation Scenario:'}</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {lang === 'ar' ? 'تحديث فوري' : 'Instant Trigger'}
                </span>
              </div>

              {/* Direct Clickable Scenario Cards (Fast, Clear, Responsive) */}
              <div className="space-y-2">
                {scenariosList.map((sc) => {
                  const Icon = sc.icon;
                  const isSelected = activeScenario === sc.id;

                  return (
                    <button
                      key={sc.id}
                      onClick={() => triggerScenario(sc.id)}
                      className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected ? sc.activeStyle : sc.baseStyle
                      }`}
                    >
                      <div className="space-y-0.5 text-right flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono">
                            {lang === 'ar' ? sc.title_ar : sc.title_en}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 text-white">
                              ✓ {lang === 'ar' ? 'نشط' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                          {lang === 'ar' ? sc.desc_ar : sc.desc_en}
                        </p>
                      </div>

                      <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                        isSelected ? 'bg-black/30 border-white/30 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. ASTRONAUT SELECTION */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <label className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>{lang === 'ar' ? '2. رائد الفضاء المعني:' : '2. Active Astronaut:'}</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400">{selectedAstronautId}</span>
              </label>

              <select
                value={selectedAstronautId}
                onChange={(e) => changeAstronaut(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl p-2.5 outline-none focus:border-indigo-400 cursor-pointer"
              >
                {astronauts.map((ast) => (
                  <option key={ast.id} value={ast.id}>
                    {lang === 'ar' 
                      ? `${ast.id} — ${ast.name_ar || ast.name} (${ast.role_ar || ast.role})`
                      : `${ast.id} — ${ast.name} (${ast.role})`
                    }
                  </option>
                ))}
              </select>
            </div>

            {/* 3. MISSION LOCATION */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <label className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'ar' ? '3. موقع المهمة وزمن تأخير الإشارة:' : '3. Mission Location & Delay:'}</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {lang === 'ar' ? (locInfo.comm_delay_display_ar || 'أقل من ثانية') : (locInfo.comm_delay_display || '< 1 second')}
                </span>
              </label>

              <select
                value={location}
                onChange={(e) => changeLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl p-2.5 outline-none focus:border-cyan-400 cursor-pointer"
              >
                {lang === 'ar' ? (
                  <>
                    <option value="ISS">محطة الفضاء الدولية (تأخير الإشارة: أقل من ثانية)</option>
                    <option value="Moon">بوابة مدار القمر (تأخير الإشارة: 1.3 ثانية)</option>
                    <option value="Mars">مهمة كوكب المريخ (تأخير الإشارة: 5–20 دقيقة)</option>
                  </>
                ) : (
                  <>
                    <option value="ISS">International Space Station (Comm Delay: &lt; 1 sec)</option>
                    <option value="Moon">Lunar Gateway Orbit (Comm Delay: 1.3 sec)</option>
                    <option value="Mars">Mars Deep Space Mission (Comm Delay: 5–20 min)</option>
                  </>
                )}
              </select>
            </div>

            {/* 4. ACTIVITY CONTEXT */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <label className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'ar' ? '4. النشاط البدني للرائد:' : '4. Astronaut Activity Context:'}</span>
                </span>
              </label>

              <select
                value={activity}
                onChange={(e) => changeActivity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl p-2.5 outline-none focus:border-emerald-400 cursor-pointer"
              >
                {lang === 'ar' ? (
                  <>
                    <option value="rest">راحة واسترخاء</option>
                    <option value="light">نشاط خفيف وصيانة</option>
                    <option value="sleep">نوم واسترجاع حيوي</option>
                    <option value="exercise">تمارين رياضية إجبارية</option>
                    <option value="eva">مهمة سير فضائي (EVA)</option>
                  </>
                ) : (
                  <>
                    <option value="rest">Rest & Relaxation</option>
                    <option value="light">Light Work & Maintenance</option>
                    <option value="sleep">Sleep & Recovery</option>
                    <option value="exercise">Mandatory Exercise Countermeasure</option>
                    <option value="eva">Spacewalk Extravehicular Activity (EVA)</option>
                  </>
                )}
              </select>
            </div>

            {/* View Dashboard Button */}
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إغلاق القائمة والعودة للداشبورد' : 'Close & View Live Dashboard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
