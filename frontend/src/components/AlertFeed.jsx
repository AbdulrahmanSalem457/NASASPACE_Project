import React from 'react';
import { ShieldAlert, CheckCircle2, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const AlertFeed = () => {
  const { lang, t, alerts, openAlertModal, activeScenario } = useAstro();

  const isNominal = activeScenario === '0' || !alerts || alerts.length === 0;

  if (isNominal) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-emerald-300">
              {lang === 'ar' ? 'الحالة الصحية العامة: مستقرة وطبيعية تماماً (Nominal)' : 'Nominal Flight Status: All Crew Telemetry Stable'}
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {lang === 'ar' 
                ? 'لا توجد أي إنذارات أو انحرافات مسجلة. جميع المؤشرات متوافقة مع خط الأساس الشخصي.' 
                : 'Zero active alerts. All vital metrics concordant with personal astronaut baselines.'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          0 {lang === 'ar' ? 'إنذارات' : 'Alerts'}
        </span>
      </div>
    );
  }

  // Active Alert Display
  const topAlert = alerts[0];
  const isEmergency = topAlert.level === 'emergency';

  return (
    <div className={`rounded-2xl border p-4.5 shadow-xl transition-all ${
      isEmergency 
        ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/80 animate-pulse-fast' 
        : 'bg-red-950/30 border-red-500/70'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 mt-0.5 animate-bounce">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-red-600 text-white">
                {topAlert.level.toUpperCase()}
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {topAlert.astronaut_id} — {lang === 'ar' ? topAlert.astronaut_name_ar : topAlert.astronaut_name}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono">
              {lang === 'ar' ? topAlert.title_ar : topAlert.title_en}
            </h3>
            <p className="text-xs text-red-200/90 font-sans leading-relaxed">
              {topAlert.current_reading_value} — {lang === 'ar' ? topAlert.summary_ar : topAlert.summary_en}
            </p>
          </div>
        </div>

        <button
          onClick={() => openAlertModal(topAlert)}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-600/40 shrink-0 cursor-pointer"
        >
          <span>{lang === 'ar' ? 'عرض بروتوكول التدخل (8 خطوات)' : 'Open 8-Step Emergency Protocol'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
