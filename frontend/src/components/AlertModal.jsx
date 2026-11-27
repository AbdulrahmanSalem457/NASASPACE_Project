import React, { useState, useEffect } from 'react';
import {
  X, ShieldAlert, CheckCircle2, Circle,
  Send, Radio, Activity, BriefcaseMedical
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const AlertModal = () => {
  const {
    lang, isAlertModalOpen, closeAlertModal, selectedAlert,
    updateChecklistStep, contactFlightSurgeon, isTransmitting,
    commCountdown, location, bootstrap, medicalKit, dispenseKitItem
  } = useAstro();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Elapsed Timer counting up from onset
  useEffect(() => {
    if (!isAlertModalOpen || !selectedAlert) return;

    // Calculate initial elapsed from alert timestamp
    const onsetTime = new Date(selectedAlert.timestamp).getTime();
    const calculateElapsed = () => Math.max(0, Math.floor((Date.now() - onsetTime) / 1000));
    setElapsedSeconds(calculateElapsed());

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isAlertModalOpen, selectedAlert]);

  if (!isAlertModalOpen || !selectedAlert) return null;

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const steps = selectedAlert.checklist_steps || [];
  const actionLogs = selectedAlert.action_logs || [];

  const isEmergency = selectedAlert.level === 'emergency';
  const isCritical = selectedAlert.level === 'critical';

  const locCfg = bootstrap?.mission_locations?.[location] || {
    comm_delay_display: '< 1 second',
    autonomy_level: 'Medium'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-backdrop-fade">
      <div 
        className={`w-full max-w-4xl my-auto rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 animate-modal-pop ${
          isEmergency 
            ? 'bg-space-950 border-red-500 shadow-red-600/30 ring-2 ring-red-500 animate-pulse-fast' 
            : isCritical 
            ? 'bg-space-950 border-red-600/80 shadow-red-900/40' 
            : 'bg-space-950 border-amber-500/70 shadow-amber-950/40'
        }`}
      >
        {/* Persistent Alert Header Disclaimer Banner */}
        <div className="bg-amber-950/60 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono text-[11px] font-bold">
              {lang === 'ar' 
                ? 'تنبيه: محاكاة طبية لأغراض المنافسة فقط — القرار النهائي لمسؤول الطاقم (CMO) وطبيب الرحلة.'
                : 'Synthetic Medical Simulation for Space Apps Challenge Only — Final Rx: Flight Surgeon & CMO.'}
            </span>
          </div>
        </div>

        {/* Modal Top Bar */}
        <div className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b ${
          isEmergency ? 'bg-red-950/60 border-red-800' : isCritical ? 'bg-red-950/40 border-red-900' : 'bg-amber-950/30 border-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${
              isEmergency ? 'bg-red-600 text-white border-red-400 animate-bounce' : isCritical ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  isEmergency ? 'bg-red-600 text-white' : isCritical ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                }`}>
                  {selectedAlert.level.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {selectedAlert.protocol_code} — {lang === 'ar' ? selectedAlert.protocol_title_ar : selectedAlert.protocol_title_en}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
                {lang === 'ar' ? selectedAlert.title_ar : selectedAlert.title_en}
              </h2>
            </div>
          </div>

          {/* Live Elapsed Timer & Close */}
          <div className="flex items-center gap-3">
            <div className="bg-space-900 border border-slate-700/80 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                {lang === 'ar' ? 'الوقت المنقضي' : 'Elapsed Time'}
              </span>
              <span className="text-lg font-mono font-bold text-cyan-400 tracking-wider">
                {formatTimer(elapsedSeconds)}
              </span>
            </div>
            <button
              onClick={closeAlertModal}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-space-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">{lang === 'ar' ? 'رائد الفضاء المتأثر' : 'Astronaut Profile'}</span>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {selectedAlert.astronaut_id} — {lang === 'ar' ? selectedAlert.astronaut_name_ar : selectedAlert.astronaut_name}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Location: <strong className="text-cyan-400">{location}</strong> ({locCfg.comm_delay_display})
              </div>
            </div>

            <div className="bg-space-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">{lang === 'ar' ? 'القراءة المسجلة' : 'Current Reading'}</span>
              <div className="text-sm font-bold text-red-400 font-mono mt-0.5">
                {selectedAlert.current_reading_value || 'Out-of-range telemetry'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Z-Score: <strong className="text-amber-400">Z = {selectedAlert.z_score || 'N/A'}</strong>
              </div>
            </div>

            <div className="bg-space-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">{lang === 'ar' ? 'خط الأساس الشخصي' : 'Personal Baseline'}</span>
              <div className="text-xs font-semibold text-slate-200 font-mono mt-0.5">
                {selectedAlert.baseline_reference || 'Nominal baseline'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {selectedAlert.normal_limit_reference}
              </div>
            </div>
          </div>

          {/* Probable Cause / Clinical Context */}
          <div className="bg-space-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-300">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'ar' ? 'السبب الفسيولوجي والبيئي المحتمل في الفضاء:' : 'Probable Space Physiological / Environmental Cause:'}</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {lang === 'ar' ? (selectedAlert.probable_cause_ar || selectedAlert.summary_ar) : (selectedAlert.probable_cause_en || selectedAlert.summary_en)}
            </p>
          </div>

          {/* Contact Flight Surgeon Command Bar */}
          <div className="bg-gradient-to-r from-blue-950/60 via-space-900 to-indigo-950/60 border border-blue-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white font-mono">
                  {lang === 'ar' ? 'قناة التواصل المشفرة مع طبيب الرحلة الأرضي' : 'Ground Flight Surgeon Medical Channel'}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'ar' ? `موقع المهمة: ${location} | زمن التأخير باتجاه واحد: ${locCfg.comm_delay_display}` : `Mission: ${location} | One-way telemetry latency: ${locCfg.comm_delay_display}`}
              </p>
            </div>

            <button
              onClick={contactFlightSurgeon}
              disabled={isTransmitting || selectedAlert.surgeon_contacted}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                selectedAlert.surgeon_contacted
                  ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300 cursor-default'
                  : isTransmitting
                  ? 'bg-blue-600 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer'
              }`}
            >
              <Send className="w-4 h-4" />
              {selectedAlert.surgeon_contacted ? (
                <span>{lang === 'ar' ? 'تم فتح القناة وبث القياسات بنجاح' : 'Telemetry Transmitted to Surgeon'}</span>
              ) : isTransmitting ? (
                <span>
                  {lang === 'ar' ? `جاري البث... (تأخير ${commCountdown} ث)` : `Transmitting... (Latency: ${commCountdown}s)`}
                </span>
              ) : (
                <span>{lang === 'ar' ? 'الاتصال بطبيب الرحلة وبث سجل 24 ساعة' : 'Contact Flight Surgeon & Auto-Send Telemetry'}</span>
              )}
            </button>
          </div>

          {/* Required Smart Medical Kit Items for this Protocol */}
          {(() => {
            const reqKit = (medicalKit || []).filter(
              item => (item.related_protocols || []).includes(selectedAlert.protocol_code)
            );
            if (reqKit.length === 0) return null;
            return (
              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <BriefcaseMedical className="w-4 h-4" />
                    {lang === 'ar'
                      ? `أدوات صندوق الإسعافات المطلوبة لبروتوكول ${selectedAlert.protocol_code}:`
                      : `Required Smart Medical Kit Supplies (${selectedAlert.protocol_code}):`}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reqKit.map(item => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-space-900 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{item.code} — {lang === 'ar' ? item.name_ar : item.name_en}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.location_bay} • Stock: {item.quantity}/{item.max_quantity}</div>
                      </div>
                      <button
                        onClick={() => dispenseKitItem(item.id, false)}
                        disabled={item.quantity <= 0}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-mono text-[10px] font-bold shrink-0 cursor-pointer disabled:opacity-40"
                      >
                        {lang === 'ar' ? 'صرف 1' : 'Dispense'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Interactive 8-Step Emergency Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ar' ? 'قائمة الاستجابة الطارئة القياسية (8 خطوات تفاعلية)' : 'Standard 8-Step Emergency Response Checklist'}</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {steps.filter(s => s.completed).length} / {steps.length} {lang === 'ar' ? 'مكتمل' : 'Completed'}
              </span>
            </div>

            <div className="space-y-2">
              {steps.map((st) => {
                const isCompleted = st.completed;
                return (
                  <div
                    key={st.step}
                    className={`rounded-xl border p-3 transition-all flex items-start gap-3 ${
                      isCompleted 
                        ? 'bg-space-900/40 border-emerald-500/40' 
                        : 'bg-space-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => updateChecklistStep(st.step, !isCompleted)}
                      className={`mt-0.5 p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        isCompleted ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                          <span className="text-cyan-400">Step {st.step}:</span>
                          <span>{lang === 'ar' ? st.name_ar : st.name_en}</span>
                        </div>
                        {st.completed_at && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {st.completed_at}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {lang === 'ar' ? st.description_ar : st.description_en}
                      </p>
                      {st.note && (
                        <div className="text-[11px] text-slate-400 bg-space-950/80 px-2.5 py-1 rounded border border-slate-800 font-mono mt-1">
                          Note: {st.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Logs Box */}
          {actionLogs.length > 0 && (
            <div className="bg-space-900 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                {lang === 'ar' ? 'سجل إجراءات الطاقم الموثق:' : 'Incident Action Audit Log:'}
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {actionLogs.map((log, idx) => (
                  <div key={idx} className="text-xs font-mono text-slate-300 flex items-start gap-2">
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span>{lang === 'ar' ? (log.action_ar || log.action_en) : log.action_en}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
