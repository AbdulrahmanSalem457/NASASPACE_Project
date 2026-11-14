import React from 'react';
import { 
  X, User, Radio, Activity, Sparkles, CheckCircle2, 
  Flame, Moon, Wind, HeartPulse, RefreshCw, ShieldAlert,
  Clock, MapPin, Gauge
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const SidebarDrawer = ({ isOpen, onClose }) => {
  const {
    lang,
    t,
    astronauts,
    selectedAstronaut,
    selectedAstronautId,
    setSelectedAstronautId,
    location,
    changeLocation,
    activity,
    changeActivity,
    bootstrap,
    activeScenario,
    triggerScenario,
    resetNominal
  } = useAstro();

  if (!isOpen) return null;

  const locInfo = bootstrap?.mission_locations?.[location] || {
    comm_delay_display: '< 1 second',
    autonomy_level: 'Medium'
  };

  const scenariosList = [
    {
      id: "0",
      title_ar: "الحالة الطبيعية المستقرة (0 إنذارات)",
      title_en: "Nominal State (0 Alerts)",
      desc_ar: "جميع المؤشرات طبيعية تماماً ومطابقة لخط الأساس",
      badge_ar: "طبيعي مستقر",
      color: "text-emerald-400"
    },
    {
      id: "1",
      title_ar: "سيناريو 1: تسارع القلب ونقص الأكسجين",
      title_en: "Scenario 1: Tachycardia + Hypoxia",
      desc_ar: "المهندس عمر: نبض 131 bpm، أكسجين 90%، تنفس 27",
      badge_ar: "حرج أحمر",
      color: "text-red-400"
    },
    {
      id: "2",
      title_ar: "سيناريو 2: حمى الفضاء وارتفاع الحرارة",
      title_en: "Scenario 2: Space Fever (+1.4°C)",
      desc_ar: "د. سارة: حرارة مركزية 38.33°م بسبب احتباس العرق",
      badge_ar: "حرج أحمر",
      color: "text-red-400"
    },
    {
      id: "3",
      title_ar: "سيناريو 3: حرمان النوم وإرهاق عصبي",
      title_en: "Scenario 3: Sleep Deprivation",
      desc_ar: "القائدة ليلى: نوم 4.2 س/ليلة وهبوط حاد في HRV",
      badge_ar: "تحذير أصفر",
      color: "text-amber-400"
    },
    {
      id: "4",
      title_ar: "سيناريو 4: ارتفاع غاز ثاني أكسيد الكربون",
      title_en: "Scenario 4: Cabin CO2 Spike",
      desc_ar: "ارتفاع CO2 إلى 5.8 ملم زئبق وصداع أمامي ونعاس",
      badge_ar: "تحذير أصفر",
      color: "text-amber-400"
    },
    {
      id: "5",
      title_ar: "سيناريو 5: طوارئ قصوى لإنعاش القلب (CPR)",
      title_en: "Scenario 5: Cardiac Emergency",
      desc_ar: "توقف النبض والتنفس في انعدام الوزن (CMRS & AED)",
      badge_ar: "طوارئ قصوى",
      color: "text-rose-400"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity cursor-pointer animate-fade-in"
      />

      <div className={`fixed inset-y-0 ${lang === 'ar' ? 'right-0' : 'left-0'} max-w-full flex`}>
        <div className="w-screen max-w-md bg-slate-900 border-x border-slate-800 shadow-2xl flex flex-col h-full animate-slide-in">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-mono text-white">
                  {lang === 'ar' ? 'لوحة التحكم والمحاكاة' : 'Mission & Simulation Controls'}
                </h2>
                <p className="text-xs text-slate-400 font-sans">
                  {lang === 'ar' ? 'إدارة السيناريوهات، الطاقم، والموقع' : 'Manage scenarios, crew, and telemetry'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - 4 Distinct Dropdowns */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* 1. SCENARIO SELECTION DROPDOWN */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'ar' ? '1. سيناريو المحاكاة الطبية:' : '1. Medical Simulation Scenario:'}</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {lang === 'ar' ? 'تفاعل فوري' : 'Live Trigger'}
                </span>
              </div>

              <select
                value={activeScenario}
                onChange={(e) => triggerScenario(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer transition-all"
              >
                {scenariosList.map((sc) => (
                  <option key={sc.id} value={sc.id} className="bg-slate-900 text-slate-100 py-2">
                    {lang === 'ar' ? `${sc.id} — ${sc.title_ar}` : `${sc.id} — ${sc.title_en}`}
                  </option>
                ))}
              </select>

              {/* Active Scenario Info Box */}
              {scenariosList.find(s => s.id === activeScenario) && (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-sans text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">
                      {lang === 'ar' ? scenariosList.find(s => s.id === activeScenario).title_ar : scenariosList.find(s => s.id === activeScenario).title_en}
                    </span>
                    <span className={`font-mono text-[10px] font-bold ${scenariosList.find(s => s.id === activeScenario).color}`}>
                      {lang === 'ar' ? scenariosList.find(s => s.id === activeScenario).badge_ar : 'Active'}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {lang === 'ar' ? scenariosList.find(s => s.id === activeScenario).desc_ar : scenariosList.find(s => s.id === activeScenario).desc_en}
                  </p>
                </div>
              )}
            </div>

            {/* 2. ASTRONAUT SELECTION DROPDOWN */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>{lang === 'ar' ? '2. رائد الفضاء المعني:' : '2. Active Astronaut:'}</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedAstronautId}
                </span>
              </div>

              <select
                value={selectedAstronautId}
                onChange={(e) => setSelectedAstronautId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer transition-all"
              >
                {astronauts.map((ast) => (
                  <option key={ast.id} value={ast.id} className="bg-slate-900 text-slate-100 py-2">
                    {ast.id} — {lang === 'ar' ? ast.name_ar : ast.name} ({ast.role})
                  </option>
                ))}
              </select>

              {selectedAstronaut && (
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex justify-between">
                  <span>{lang === 'ar' ? 'العمر / الجنس:' : 'Age/Sex:'} {selectedAstronaut.age} س ({selectedAstronaut.sex})</span>
                  <span>{lang === 'ar' ? 'النبض الأساسي:' : 'Base HR:'} {selectedAstronaut.hr_mean} ± {selectedAstronaut.hr_sd}</span>
                </div>
              )}
            </div>

            {/* 3. MISSION LOCATION DROPDOWN */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'ar' ? '3. الموقع الفضائي وتأخير الاتصال:' : '3. Mission Location & Delay:'}</span>
                </label>
              </div>

              <select
                value={location}
                onChange={(e) => changeLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer transition-all"
              >
                <option value="ISS">
                  ISS — محطة الفضاء الدولية (تأخير الإشارة: أقل من ثانية)
                </option>
                <option value="Moon">
                  Moon Gateway — مدار القمر Artemis (تأخير الإشارة: 1.3 ثانية)
                </option>
                <option value="Mars">
                  Mars Deep Space — مهمة المريخ السحيقة (تأخير الإشارة: 5 إلى 20 دقيقة)
                </option>
              </select>

              <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === 'ar' ? 'تأخير الاتصال بالأرض:' : 'Earth Comm Delay:'}</span>
                </span>
                <span className="font-bold text-cyan-300">{locInfo.comm_delay_display}</span>
              </div>
            </div>

            {/* 4. ACTIVITY CONTEXT DROPDOWN */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'ar' ? '4. النشاط البدني للرائد:' : '4. Astronaut Activity Context:'}</span>
                </label>
              </div>

              <select
                value={activity}
                onChange={(e) => changeActivity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-all"
              >
                <option value="rest">{t.rest || 'راحة واسترخاء (Rest)'}</option>
                <option value="light">{t.light || 'نشاط خفيف وصيانة (Light Work)'}</option>
                <option value="sleep">{t.sleep || 'نوم واسترجاع حيوي (Sleep)'}</option>
                <option value="exercise">{t.exercise || 'تمارين رياضية إجبارية (Exercise)'}</option>
              </select>

              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {lang === 'ar' 
                  ? 'ملاحظة: تتغير عتبات النبض والضغط المقبولة تلقائياً حسب نوع النشاط المختار (مثل النبض حتى 155 في التمارين).'
                  : 'Vital thresholds adjust dynamically based on chosen activity context.'}
              </p>
            </div>

            {/* Reset to Nominal Button */}
            <button
              onClick={() => {
                resetNominal();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إعادة ضبط للوضع الاسمي الطبيعي (0 إنذارات)' : 'Reset to Nominal State (0 Alerts)'}</span>
            </button>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 text-center text-xs font-mono text-slate-400">
            AstroVitals AI Telemetry Bus — NASA Space Apps 2026
          </div>
        </div>
      </div>
    </div>
  );
};
