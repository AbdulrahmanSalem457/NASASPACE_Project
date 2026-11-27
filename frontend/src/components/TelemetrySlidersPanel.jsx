import React, { useState, useRef } from 'react';
import { Sliders, RotateCcw, Send, ChevronDown, ChevronUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const TelemetrySlidersPanel = () => {
  const {
    lang,
    selectedAstronaut,
    currentVitals,
    applyLiveSliders,
    resetNominal,
    isSyncingSliders,
    globalStatus,
    riskScore,
    readinessStatus,
    openAlertModal,
    alerts,
  } = useAstro();

  const [isExpanded, setIsExpanded] = useState(true);
  const debounceRef = useRef(null);

  if (!selectedAstronaut || !currentVitals) return null;

  const sliderGroups = [
    {
      key: 'heart_rate',
      label_ar: 'معدل ضربات القلب',
      label_en: 'Heart Rate',
      unit: 'bpm',
      min: 0,
      max: 180,
      step: 1,
      warnText: '50 – 90',
    },
    {
      key: 'systolic_bp',
      label_ar: 'الضغط الانقباضي',
      label_en: 'Systolic BP',
      unit: 'mmHg',
      min: 60,
      max: 190,
      step: 1,
      warnText: '95 – 130',
    },
    {
      key: 'diastolic_bp',
      label_ar: 'الضغط الانبساطي',
      label_en: 'Diastolic BP',
      unit: 'mmHg',
      min: 40,
      max: 120,
      step: 1,
      warnText: '55 – 85',
    },
    {
      key: 'spo2',
      label_ar: 'تشبع الأكسجين SpO2',
      label_en: 'SpO2 Oxygen',
      unit: '%',
      min: 60,
      max: 100,
      step: 0.5,
      warnText: '95 – 100',
    },
    {
      key: 'respiratory_rate',
      label_ar: 'معدل التنفس',
      label_en: 'Respiratory Rate',
      unit: '/min',
      min: 0,
      max: 45,
      step: 1,
      warnText: '12 – 20',
    },
    {
      key: 'body_temperature',
      label_ar: 'درجة حرارة الجسم',
      label_en: 'Core Temperature',
      unit: '°C',
      min: 35.0,
      max: 40.5,
      step: 0.1,
      warnText: '36.1 – 37.5',
    },
    {
      key: 'cabin_co2',
      label_ar: 'ثاني أكسيد الكربون CO2',
      label_en: 'Cabin CO2',
      unit: 'mmHg',
      min: 1.0,
      max: 10.0,
      step: 0.1,
      warnText: '< 5.3',
    },
    {
      key: 'daily_radiation',
      label_ar: 'الإشعاع اليومي',
      label_en: 'Daily Radiation',
      unit: 'mSv/d',
      min: 0.2,
      max: 5.0,
      step: 0.05,
      warnText: '0.4 – 0.8',
    },
    {
      key: 'ecg_qtc',
      label_ar: 'فترة QTc بالقلب',
      label_en: 'ECG QTc',
      unit: 'ms',
      min: 350,
      max: 580,
      step: 5,
      warnText: '< 450',
    },
    {
      key: 'hrv_rmssd',
      label_ar: 'تقلب النبض HRV',
      label_en: 'HRV (RMSSD)',
      unit: 'ms',
      min: 5,
      max: 90,
      step: 1,
      warnText: '≥ 25',
    },
    {
      key: 'sleep_duration',
      label_ar: 'ساعات النوم',
      label_en: 'Sleep Rest',
      unit: 'hrs',
      min: 2.0,
      max: 9.0,
      step: 0.1,
      warnText: '≥ 6.5',
    },
    {
      key: 'cabin_pressure',
      label_ar: 'ضغط الكابينة',
      label_en: 'Cabin Pressure',
      unit: 'psi',
      min: 10.0,
      max: 15.5,
      step: 0.1,
      warnText: '14.2 – 15.2',
    },
  ];

  const handleSliderChange = (key, val) => {
    const numVal = Number(val);
    const updated = { ...currentVitals, [key]: numVal };

    // Update UI immediately without waiting for network
    applyLiveSliders(updated, { syncBackend: false });

    // Debounce real backend evaluation + DB persistence + Alert creation
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyLiveSliders(updated, { syncBackend: true });
    }, 350);
  };

  return (
    <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-lg no-print">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              {lang === 'ar'
                ? 'لوحة التحكم التفاعلية الحية بالمؤشرات (Live Vitals Sliders)'
                : 'Interactive Telemetry & Environment Sliders'}
              {isSyncingSliders && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 animate-pulse">
                  {lang === 'ar' ? 'جاري التحليل...' : 'Evaluating...'}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'حرّك أي مؤشر لاختبار رد الفعل الفوري، تخطيط القلب، التشريح، وإطلاق البروتوكول الطبي من السيرفر.'
                : 'Adjust any slider to test real-time Global Status evaluation, ECG waveform, Anatomy highlights & Medical Protocol dispatch.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${
            globalStatus === 'normal'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : globalStatus === 'warning' || globalStatus === 'notice'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-red-600 text-white border-red-400 animate-pulse'
          }`}>
            {globalStatus.toUpperCase()} • Risk {riskScore}/100 • {readinessStatus}
          </span>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); resetNominal(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'إرجاع للطبيعي' : 'Reset'}</span>
          </button>

          {alerts.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openAlertModal(alerts[0]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'فتح البروتوكول' : 'Protocol'}</span>
            </button>
          )}

          <div className="p-1.5 text-slate-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sliderGroups.map((s) => {
              const currentVal = Number(currentVitals[s.key] ?? 0);
              return (
                <div key={s.key} className="bg-space-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {lang === 'ar' ? s.label_ar : s.label_en}
                    </span>
                    <span className="font-mono font-bold text-cyan-400">
                      {currentVal} <span className="text-[10px] text-slate-400">{s.unit}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={currentVal}
                    onChange={(e) => handleSliderChange(s.key, e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>{s.min}</span>
                    <span className="text-slate-400">{lang === 'ar' ? 'الآمن:' : 'Safe:'} {s.warnText}</span>
                    <span>{s.max}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'ar'
                ? 'التغيير يتزامن تلقائياً مع الـ API (/api/vitals/) لإطلاق الإنذار والبروتوكول وتحديث الـ SBAR ودرجة المخاطر.'
                : 'Changes sync automatically to POST /api/vitals/ to evaluate alerts, protocols, SBAR, and Risk Score.'}
            </span>
            <button
              type="button"
              onClick={() => applyLiveSliders(currentVitals, { syncBackend: true })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تطبيق وتوثيق القراءة الآن' : 'Log & Evaluate Now'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
