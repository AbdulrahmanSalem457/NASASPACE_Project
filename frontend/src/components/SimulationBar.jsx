import React, { useState } from 'react';
import { 
  CheckCircle2, Flame, Moon, Wind, HeartPulse, 
  Sparkles, Activity, ShieldCheck, Sun
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const SimulationBar = () => {
  const { lang, t, triggerScenario, activeScenario } = useAstro();
  const [speMode, setSpeMode] = useState('cardiac_arrest');

  const scenarios = [
    {
      id: "0",
      title_ar: "الحالة الطبيعية المستقرة",
      title_en: "Nominal State (All Normal)",
      desc_ar: "جميع المؤشرات طبيعية تماماً (0 إنذارات)",
      desc_en: "All vitals nominal, zero alerts",
      icon: CheckCircle2,
      baseColor: "border-emerald-500/50 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40",
      activeColor: "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400"
    },
    {
      id: "1",
      title_ar: "سيناريو 1: تسارع ونقص أكسجين",
      title_en: "Scenario 1: Tachycardia + Hypoxia",
      desc_ar: "المهندس عمر: نبض 131، أكسجين 90%",
      desc_en: "Omar: HR 131, SpO2 90%, RR 27",
      icon: Activity,
      baseColor: "border-red-500/50 bg-red-950/20 text-red-300 hover:bg-red-950/40",
      activeColor: "bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30 ring-2 ring-red-400 animate-pulse-fast"
    },
    {
      id: "2",
      title_ar: "سيناريو 2: حمى الفضاء (38.33°م)",
      title_en: "Scenario 2: Space Fever (+1.4°C)",
      desc_ar: "د. سارة: حرارة مركزية 38.33°م",
      desc_en: "Sara: Core Temp 38.33°C",
      icon: Flame,
      baseColor: "border-amber-500/50 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40",
      activeColor: "bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30 ring-2 ring-amber-400"
    },
    {
      id: "3",
      title_ar: "سيناريو 3: حرمان النوم وإرهاق",
      title_en: "Scenario 3: Sleep Deprivation",
      desc_ar: "القائدة ليلى: نوم 4.2 س، وهبوط HRV",
      desc_en: "Layla: Sleep 4.2h, Low HRV (22ms)",
      icon: Moon,
      baseColor: "border-blue-500/50 bg-blue-950/20 text-blue-300 hover:bg-blue-950/40",
      activeColor: "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
    },
    {
      id: "4",
      title_ar: "سيناريو 4: ارتفاع غاز CO2",
      title_en: "Scenario 4: Cabin CO2 Spike",
      desc_ar: "ارتفاع إلى 5.8 ملم زئبق وصداع",
      desc_en: "Cabin CO2: 5.8 mmHg with headache",
      icon: Wind,
      baseColor: "border-yellow-500/50 bg-yellow-950/20 text-yellow-300 hover:bg-yellow-950/40",
      activeColor: "bg-yellow-600 text-slate-950 border-yellow-300 shadow-lg shadow-yellow-600/30 ring-2 ring-yellow-400 font-bold"
    },
    {
      id: "5",
      title_ar: "سيناريو 5: طوارئ إنعاش القلب (CPR)",
      title_en: "Scenario 5: Cardiac Emergency",
      desc_ar: "توقف القلب وصفارة الإنذار القصوى",
      desc_en: "Zero-G CPR & AED Emergency Siren",
      icon: HeartPulse,
      baseColor: "border-rose-500/50 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40",
      activeColor: "bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30 ring-2 ring-rose-400 animate-pulse-fast"
    }
  ];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 py-3 px-4 shadow-md">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Title Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs sm:text-sm font-bold font-mono text-white">
              {lang === 'ar' ? 'اختر سيناريو لتجربة استجابة النظام الفورية:' : 'Select a Test Scenario to Trigger Instant Biometric Response:'}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            {lang === 'ar' ? 'القيم في البطاقات أدناه ستتغير فوراً حسب السيناريو' : 'Cards below will update immediately upon selection'}
          </span>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isSelected = activeScenario === sc.id;

            return (
              <button
                key={sc.id}
                onClick={() => triggerScenario(sc.id, sc.id === "5" ? speMode : undefined)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected ? sc.activeColor : sc.baseColor
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold font-mono">
                    {lang === 'ar' ? sc.title_ar : sc.title_en}
                  </span>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <span className={`text-[11px] leading-tight font-sans ${isSelected ? 'text-white/90' : 'opacity-75'}`}>
                  {lang === 'ar' ? sc.desc_ar : sc.desc_en}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
