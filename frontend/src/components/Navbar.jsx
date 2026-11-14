import React from 'react';
import { 
  Rocket, Activity, Globe, ShieldAlert, BarChart2,
  User, FileText, Menu, Brain, Users, CheckCircle2,
  Sparkles, Radio, Clock
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  onToggleSidebar, 
  onOpenAiAdvisor, 
  onOpenCrewMatrix 
}) => {
  const {
    lang,
    t,
    toggleLanguage,
    selectedAstronaut,
    selectedAstronautId,
    location,
    activeScenario,
    alerts
  } = useAstro();

  const criticalCount = alerts.filter(a => a.is_active && (a.level === 'critical' || a.level === 'emergency')).length;
  const isNominal = activeScenario === '0' || !activeScenario;

  const tabs = [
    { 
      id: 'vitals', 
      label_ar: 'المؤشرات الحيوية', 
      label_en: 'Core Vitals', 
      icon: Activity 
    },
    { 
      id: 'charts', 
      label_ar: 'مخططات القياسات (24h/30d)', 
      label_en: 'Telemetry Charts', 
      icon: BarChart2 
    },
    { 
      id: 'anatomy', 
      label_ar: 'تشريح وظائف الأعضاء', 
      label_en: 'Physiology Anatomy', 
      icon: User 
    },
    { 
      id: 'protocols', 
      label_ar: 'البروتوكولات الـ 14', 
      label_en: '14 Protocols', 
      icon: ShieldAlert 
    },
    { 
      id: 'reports', 
      label_ar: 'التقارير الصحية والامتثال', 
      label_en: 'Reports & Stats', 
      icon: FileText 
    },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2.5 space-y-2.5">
        
        {/* Top Row: Hamburger + Brand + Quick Info + Utilities */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left / Start: Hamburger Button & Brand */}
          <div className="flex items-center gap-3">
            {/* Hamburger Button to Open Sidebar */}
            <button
              onClick={onToggleSidebar}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold transition-all shadow-sm cursor-pointer"
              title={lang === 'ar' ? 'افتح قائمة السيناريوهات، الرائد، والموقع' : 'Open Simulation & Mission Controls'}
            >
              <Menu className="w-4 h-4" />
              <span>{lang === 'ar' ? 'المحاكاة والإعدادات' : 'Controls'}</span>
            </button>

            {/* Brand Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-cyan-400 -rotate-45" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono tracking-wider text-white">
                    ASTRO<span className="text-cyan-400">VITALS</span> <span className="text-[10px] text-blue-400 font-sans font-medium px-1.5 py-0.2 bg-blue-500/20 rounded border border-blue-500/40">AI</span>
                  </span>
                  {criticalCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      {criticalCount} {lang === 'ar' ? 'حرج' : 'CRITICAL'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {lang === 'ar' ? 'مستقر' : 'NOMINAL'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Mission Quick Badge */}
          <div className="hidden md:flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300">
            <span className="text-slate-400">{lang === 'ar' ? 'الرائد:' : 'Crew:'}</span>
            <span className="text-cyan-300 font-bold">{selectedAstronaut?.id} — {lang === 'ar' ? selectedAstronaut?.name_ar : selectedAstronaut?.name}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{lang === 'ar' ? 'البيئة:' : 'Loc:'}</span>
            <span className="text-indigo-300 font-semibold">
              {lang === 'ar' 
                ? (location === 'ISS' ? 'محطة الفضاء الدولية' : location === 'Moon' ? 'مدار القمر' : 'المريخ')
                : location
              }
            </span>
          </div>

          {/* Right / End: Utilities & Modals */}
          <div className="flex items-center gap-2">
            {/* AI Advisor Modal Button */}
            <button
              onClick={onOpenAiAdvisor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'المستشار الطبي الذكي' : 'AI Advisor'}</span>
            </button>

            {/* Crew Matrix Button */}
            <button
              onClick={onOpenCrewMatrix}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'مصفوفة الطاقم' : 'Crew Matrix'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: THE WIDGET NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 cursor-pointer ${
                  isSel
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/70 border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{lang === 'ar' ? tab.label_ar : tab.label_en}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
