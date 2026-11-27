import React from 'react';
import { ShieldAlert, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const AlertFeed = () => {
  const { lang, alerts, openAlertModal, globalStatus, localGlobal, selectedAstronaut } = useAstro();

  const hasAlerts = alerts && alerts.length > 0;
  const isNominal = globalStatus === 'normal' && !hasAlerts;

  if (isNominal) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-emerald-300">
              {lang === 'ar' ? 'الحالة الصحية والبيئية العامة: مستقرة تماماً (Nominal)' : 'Nominal Global Flight Status: All Crew & Cabin Telemetry Stable'}
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {lang === 'ar'
                ? 'لا توجد أي إنذارات. جميع المؤشرات الحيوية الستة ومؤشرات الكابينة (CO2 والإشعاع وQTc والنوم) طبيعية.'
                : 'Zero active alerts. All 6 vitals and contextual metrics (CO2, Radiation, QTc, Sleep) are within limits.'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          0 {lang === 'ar' ? 'إنذارات' : 'Alerts'}
        </span>
      </div>
    );
  }

  const topAlert = hasAlerts ? alerts[0] : null;
  const effectiveLevel = topAlert?.level || globalStatus;
  const isEmergency = effectiveLevel === 'emergency';
  const isCritical = effectiveLevel === 'critical';

  const cardColor = isEmergency
    ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/80 animate-pulse-fast'
    : isCritical
    ? 'bg-red-950/35 border-red-500/80'
    : 'bg-amber-950/30 border-amber-500/70';

  const badgeColor = isEmergency || isCritical
    ? 'bg-red-600 text-white'
    : 'bg-amber-500 text-slate-950';

  const fallbackFinding = localGlobal?.findings?.[0];

  return (
    <div className={`rounded-2xl border p-4 shadow-xl transition-all ${cardColor}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isEmergency || isCritical ? 'bg-red-600 text-white animate-bounce' : 'bg-amber-500 text-slate-950'}`}>
            {isEmergency || isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                {effectiveLevel.toUpperCase()}
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {topAlert
                  ? `${topAlert.astronaut} — ${lang === 'ar' ? topAlert.astronaut_name_ar : topAlert.astronaut_name}`
                  : `${selectedAstronaut?.id} — ${lang === 'ar' ? selectedAstronaut?.name_ar : selectedAstronaut?.name}`}
              </span>
              {topAlert?.protocol_code && (
                <span className="text-[11px] font-mono text-cyan-300 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-700">
                  {topAlert.protocol_code}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono">
              {topAlert
                ? (lang === 'ar' ? topAlert.title_ar : topAlert.title_en)
                : (lang === 'ar' ? fallbackFinding?.msg_ar : fallbackFinding?.msg_en)}
            </h3>
            <p className={`text-xs font-sans leading-relaxed ${isEmergency || isCritical ? 'text-red-200/90' : 'text-amber-200/90'}`}>
              {topAlert
                ? `${topAlert.current_reading_value} — ${lang === 'ar' ? topAlert.summary_ar : topAlert.summary_en}`
                : (lang === 'ar' ? 'جاري تفعيل البروتوكول الوقائي...' : 'Synchronizing active intervention protocol...')}
            </p>
          </div>
        </div>

        {topAlert && (
          <button
            onClick={() => openAlertModal(topAlert)}
            className={`self-start sm:self-center px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg shrink-0 cursor-pointer ${
              isEmergency || isCritical
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
            }`}
          >
            <span>{lang === 'ar' ? 'عرض البروتوكول (8 خطوات)' : 'Open 8-Step Protocol'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
