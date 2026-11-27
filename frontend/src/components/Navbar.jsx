import React from 'react';
import {
  Rocket, Activity, Globe, ShieldAlert, BarChart2,
  User, FileText, Menu, Brain, Users, CheckCircle2,
  Gauge, BriefcaseMedical, Bell, BellOff, AlertTriangle
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
    toggleLanguage,
    selectedAstronaut,
    location,
    globalStatus,
    riskScore,
    readinessStatus,
    alerts,
    notificationsEnabled,
    toggleNotifications
  } = useAstro();

  const criticalCount = alerts.filter(a => a.is_active && (a.level === 'critical' || a.level === 'emergency')).length;

  const tabs = [
    { id: 'vitals', label_ar: 'المؤشرات والـ Sliders', label_en: 'Core Vitals & Sliders', icon: Activity },
    { id: 'readiness', label_ar: 'المخاطرة و EVA', label_en: 'Readiness & EVA', icon: Gauge },
    { id: 'medkit', label_ar: 'صندوق الإسعافات', label_en: 'Medical Kit', icon: BriefcaseMedical },
    { id: 'charts', label_ar: 'مخططات القياسات', label_en: 'Telemetry Charts', icon: BarChart2 },
    { id: 'anatomy', label_ar: 'التشريح الحي', label_en: 'Live Anatomy', icon: User },
    { id: 'protocols', label_ar: 'البروتوكولات الـ 14', label_en: '14 Protocols', icon: ShieldAlert },
    { id: 'reports', label_ar: 'التقارير و SBAR', label_en: 'Reports & SBAR', icon: FileText },
  ];

  const renderGlobalBadge = () => {
    if (globalStatus === 'emergency' || globalStatus === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full animate-pulse">
          <ShieldAlert className="w-3 h-3" />
          {globalStatus === 'emergency'
            ? (lang === 'ar' ? 'طوارئ قصوى' : 'EMERGENCY')
            : `${criticalCount || 1} ${lang === 'ar' ? 'حرج' : 'CRITICAL'}`}
        </span>
      );
    }
    if (globalStatus === 'warning' || globalStatus === 'notice') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          {lang === 'ar' ? 'تحذير نشط' : globalStatus.toUpperCase()}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        {lang === 'ar' ? 'مستقر (NOMINAL)' : 'NOMINAL'}
      </span>
    );
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2.5 space-y-2.5">
        {/* Top Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold transition-all shadow-sm cursor-pointer"
              title={lang === 'ar' ? 'افتح قائمة السيناريوهات، الرائد، والموقع' : 'Open Simulation & Mission Controls'}
            >
              <Menu className="w-4 h-4" />
              <span>{lang === 'ar' ? 'المحاكاة والإعدادات' : 'Controls'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-cyan-400 -rotate-45" />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold font-mono tracking-wider text-white">
                  ASTRO<span className="text-cyan-400">VITALS</span> <span className="text-[10px] text-blue-400 font-sans font-medium px-1.5 py-0.2 bg-blue-500/20 rounded border border-blue-500/40">AI</span>
                </span>
                {renderGlobalBadge()}
                <span className={`hidden sm:inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  readinessStatus === 'HOLD'
                    ? 'bg-red-950/60 text-red-300 border-red-500/50'
                    : readinessStatus === 'GO_WITH_CAUTION'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800 text-cyan-300 border-slate-700'
                }`}>
                  {readinessStatus === 'GO_WITH_CAUTION' ? 'CAUTION' : readinessStatus} • {riskScore}/100
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300">
            <span className="text-slate-400">{lang === 'ar' ? 'الرائد:' : 'Crew:'}</span>
            <span className="text-cyan-300 font-bold">{selectedAstronaut?.id} — {lang === 'ar' ? selectedAstronaut?.name_ar : selectedAstronaut?.name}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{lang === 'ar' ? 'البيئة:' : 'Loc:'}</span>
            <span className="text-indigo-300 font-semibold">
              {lang === 'ar' ? (location === 'ISS' ? 'محطة الفضاء الدولية' : location === 'Moon' ? 'مدار القمر' : 'المريخ') : location}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAiAdvisor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'المستشار ومساعد الحوادث' : 'Incident AI'}</span>
            </button>

            <button
              onClick={onOpenCrewMatrix}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">{lang === 'ar' ? 'مصفوفة الطاقم' : 'Crew Matrix'}</span>
            </button>

            <button
              onClick={toggleNotifications}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                notificationsEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={lang === 'ar' ? 'تشغيل/إيقاف إشعارات المتصفح' : 'Toggle Browser Notifications'}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-200 active:scale-95 shrink-0 cursor-pointer ${
                  isSel
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-slate-950/70 border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 hover:-translate-y-0.5'
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
