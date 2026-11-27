import React, { useState, useEffect } from 'react';
import {
  FileText, Calendar, Clock, Dumbbell, Moon, Zap, RefreshCw,
  Printer, Download, Copy, Check, ShieldAlert, ClipboardList
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';
import { apiClient } from '../api/client';

export const HealthReportsTab = () => {
  const {
    lang, selectedAstronaut, selectedAstronautId,
    currentVitals, activeScenario, alerts, globalStatus, riskScore, readinessStatus
  } = useAstro();

  const [period, setPeriod] = useState('daily');
  const [report, setReport] = useState(null);
  const [sbar, setSbar] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSbar, setCopiedSbar] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      if (!selectedAstronautId) return;
      setIsLoading(true);
      try {
        const [repData, sbarData] = await Promise.all([
          apiClient.getReports(selectedAstronautId, period),
          apiClient.getSbarReport(selectedAstronautId)
        ]);
        if (isMounted) {
          setReport(repData);
          setSbar(sbarData);
        }
      } catch (err) {
        console.error('Error fetching report/SBAR:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchReport();
    return () => { isMounted = false; };
  }, [selectedAstronautId, period, activeScenario, globalStatus, riskScore]);

  if (!selectedAstronaut) return null;

  const live = currentVitals || {
    heart_rate: selectedAstronaut.hr_mean,
    systolic_bp: selectedAstronaut.sys_bp_mean,
    diastolic_bp: selectedAstronaut.dia_bp_mean,
    spo2: selectedAstronaut.spo2_mean,
    respiratory_rate: selectedAstronaut.resp_rate_mean,
    body_temperature: selectedAstronaut.body_temp_mean,
    sleep_duration: selectedAstronaut.sleep_duration,
    daily_radiation: selectedAstronaut.daily_radiation,
    exercise_hours: selectedAstronaut.exercise_hours,
  };

  const liveSleep = Number(live.sleep_duration ?? selectedAstronaut.sleep_duration ?? 6.8);
  const liveRad = Number(live.daily_radiation ?? selectedAstronaut.daily_radiation ?? 0.55);
  const liveExercise = Number(live.exercise_hours ?? selectedAstronaut.exercise_hours ?? 2.5);
  const cumRad = Number((Number(report?.radiation_budget?.cumulative_msv ?? selectedAstronaut.cumulative_radiation_msv ?? 24.8) + Math.max(0, liveRad - 0.55)).toFixed(2));

  const isNominal = globalStatus === 'normal';
  const criticalAlertsCount = alerts.filter(a => a.is_active && (a.level === 'critical' || a.level === 'emergency')).length;
  const warningAlertsCount = alerts.filter(a => a.is_active && a.level === 'warning').length;

  const handleCopySbar = () => {
    if (!sbar) return;
    const text = lang === 'ar'
      ? `تقرير تسليم طبي SBAR — ${selectedAstronaut.name_ar} (${selectedAstronaut.id})\nS (الوضع): ${sbar.situation_ar}\nB (الخلفية): ${sbar.background_ar}\nA (التقييم): ${sbar.assessment_ar}\nR (التوصية): ${sbar.recommendation_ar}`
      : `SBAR Medical Handoff — ${selectedAstronaut.name} (${selectedAstronaut.id})\nS (Situation): ${sbar.situation_en}\nB (Background): ${sbar.background_en}\nA (Assessment): ${sbar.assessment_en}\nR (Recommendation): ${sbar.recommendation_en}`;
    navigator.clipboard.writeText(text);
    setCopiedSbar(true);
    setTimeout(() => setCopiedSbar(false), 2000);
  };

  const handleExportCsv = () => {
    window.open(apiClient.getExportCsvUrl(selectedAstronautId), '_blank');
  };

  const metricsDisplay = [
    {
      key: 'heart_rate',
      name_ar: 'معدل ضربات القلب',
      name_en: 'Heart Rate',
      unit: 'bpm',
      liveVal: live.heart_rate,
      baseline: `${selectedAstronaut.hr_mean} ± ${selectedAstronaut.hr_sd}`,
      isCritical: live.heart_rate >= 115 || live.heart_rate < 40,
      isWarning: live.heart_rate > 90 || live.heart_rate < 50
    },
    {
      key: 'systolic_bp',
      name_ar: 'الضغط الانقباضي',
      name_en: 'Systolic BP',
      unit: 'mmHg',
      liveVal: live.systolic_bp,
      baseline: `${selectedAstronaut.sys_bp_mean} ± ${selectedAstronaut.sys_bp_sd}`,
      isCritical: live.systolic_bp >= 145 || live.systolic_bp < 85,
      isWarning: live.systolic_bp > 130 || live.systolic_bp < 95
    },
    {
      key: 'diastolic_bp',
      name_ar: 'الضغط الانبساطي',
      name_en: 'Diastolic BP',
      unit: 'mmHg',
      liveVal: live.diastolic_bp,
      baseline: `${selectedAstronaut.dia_bp_mean} ± ${selectedAstronaut.dia_bp_sd}`,
      isCritical: live.diastolic_bp >= 95 || live.diastolic_bp < 50,
      isWarning: live.diastolic_bp > 85 || live.diastolic_bp < 55
    },
    {
      key: 'spo2',
      name_ar: 'تشبع الأكسجين (SpO2)',
      name_en: 'SpO2 Saturation',
      unit: '%',
      liveVal: live.spo2,
      baseline: `${selectedAstronaut.spo2_mean} ± ${selectedAstronaut.spo2_sd}`,
      isCritical: live.spo2 <= 90.0,
      isWarning: live.spo2 < 95.0
    },
    {
      key: 'respiratory_rate',
      name_ar: 'معدل التنفس',
      name_en: 'Respiratory Rate',
      unit: 'breaths/min',
      liveVal: live.respiratory_rate,
      baseline: `${selectedAstronaut.resp_rate_mean} ± ${selectedAstronaut.resp_rate_sd}`,
      isCritical: live.respiratory_rate >= 25 || live.respiratory_rate < 10,
      isWarning: live.respiratory_rate > 20 || live.respiratory_rate < 12
    },
    {
      key: 'body_temperature',
      name_ar: 'درجة حرارة الجسم المركزية',
      name_en: 'Core Body Temp',
      unit: '°C',
      liveVal: live.body_temperature,
      baseline: `${selectedAstronaut.body_temp_mean} ± ${selectedAstronaut.body_temp_sd}`,
      isCritical: live.body_temperature >= 38.3 || live.body_temperature < 35.5,
      isWarning: live.body_temperature > 37.5 || live.body_temperature < 36.1
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 print-card">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-mono text-white">
              {lang === 'ar' ? 'التقارير الصحية، تقرير SBAR، والتصدير' : 'Health Reports, SBAR Handoff & CSV/PDF Export'}
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {lang === 'ar'
                ? `${selectedAstronaut.id} — ${selectedAstronaut.name_ar} | درجة المخاطرة: ${riskScore}/100 | الجاهزية: ${readinessStatus}`
                : `${selectedAstronaut.id} — ${selectedAstronaut.name} | Risk: ${riskScore}/100 | Readiness: ${readinessStatus}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Period Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setPeriod('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'daily' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '24 ساعة' : '24h'}</span>
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'weekly' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '7 أيام' : '7d'}</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'طباعة / PDF' : 'Print / PDF'}</span>
          </button>
        </div>
      </div>

      {/* SBAR MEDICAL HANDOFF REPORT CARD */}
      {sbar && (
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold font-mono text-white">
                {lang === 'ar' ? 'تقرير التسليم الطبي القياسي (SBAR Medical Handoff)' : 'Standardized SBAR Medical Handoff Report'}
              </h3>
            </div>
            <button
              onClick={handleCopySbar}
              className="no-print flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono cursor-pointer"
            >
              {copiedSbar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSbar ? (lang === 'ar' ? 'تم النسخ' : 'Copied!') : (lang === 'ar' ? 'نسخ SBAR' : 'Copy SBAR')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-cyan-400 uppercase block">
                S — {lang === 'ar' ? 'الوضع الحالي (Situation)' : 'Situation'}
              </span>
              <p className="text-slate-200 leading-relaxed">{lang === 'ar' ? sbar.situation_ar : sbar.situation_en}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-indigo-400 uppercase block">
                B — {lang === 'ar' ? 'الخلفية الطبية (Background)' : 'Background'}
              </span>
              <p className="text-slate-200 leading-relaxed">{lang === 'ar' ? sbar.background_ar : sbar.background_en}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-amber-400 uppercase block">
                A — {lang === 'ar' ? 'التقييم السريري (Assessment)' : 'Assessment'}
              </span>
              <p className="text-slate-200 leading-relaxed">{lang === 'ar' ? sbar.assessment_ar : sbar.assessment_en}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-emerald-400 uppercase block">
                R — {lang === 'ar' ? 'التوصية والإجراء (Recommendation)' : 'Recommendation'}
              </span>
              <p className="text-slate-200 leading-relaxed">{lang === 'ar' ? sbar.recommendation_ar : sbar.recommendation_en}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading && !report ? (
        <div className="py-12 flex items-center justify-center text-slate-400 font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
          {lang === 'ar' ? 'جاري تحميل الإحصائيات...' : 'Loading statistics...'}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top Compliance & Cumulative Radiation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 font-bold text-slate-200">
                  <Dumbbell className="w-4 h-4 text-teal-400" />
                  {lang === 'ar' ? 'التمارين الرياضية اليومية' : 'Exercise Compliance'}
                </span>
                <span className="text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                  {Math.round((liveExercise / 2.5) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-teal-400 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((liveExercise / 2.5) * 100))}%` }} />
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                <span>{lang === 'ar' ? `المنفذ: ${liveExercise} س/يوم` : `Actual: ${liveExercise} hrs/day`}</span>
                <span>{lang === 'ar' ? 'الهدف: 2.5 س' : 'Target: 2.5 hrs'}</span>
              </div>
            </div>

            <div className={`rounded-xl p-4 space-y-2 border ${liveSleep < 5.0 ? 'bg-amber-950/30 border-amber-500' : 'bg-slate-950/80 border-slate-800'}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 font-bold text-slate-200">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  {lang === 'ar' ? 'معدل ساعات النوم' : 'Sleep Rest Score'}
                </span>
                <span className={`font-bold px-2 py-0.5 rounded border ${liveSleep < 5.0 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'}`}>
                  {liveSleep < 5.0 ? (lang === 'ar' ? 'عجز وإرهاق' : 'Deficit') : (lang === 'ar' ? 'ملائم' : 'Adequate')}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full ${liveSleep < 5.0 ? 'bg-amber-400' : 'bg-indigo-400'}`} style={{ width: `${Math.min(100, Math.round((liveSleep / 6.5) * 100))}%` }} />
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                <span>{lang === 'ar' ? `المسجل: ${liveSleep} س/ليلة` : `Recorded: ${liveSleep} hrs`}</span>
                <span>{lang === 'ar' ? 'الهدف: 6.5 س' : 'Target: 6.5 hrs'}</span>
              </div>
            </div>

            <div className={`rounded-xl p-4 space-y-2 border ${liveRad > 2.5 ? 'bg-red-950/40 border-red-500' : liveRad > 1.2 ? 'bg-amber-950/30 border-amber-500' : 'bg-slate-950/80 border-slate-800'}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 font-bold text-slate-200">
                  <Zap className="w-4 h-4 text-amber-400" />
                  {lang === 'ar' ? 'الإشعاع التراكمي للمهمة' : 'Cumulative Radiation Dose'}
                </span>
                <span className={`font-bold px-2 py-0.5 rounded border ${liveRad > 2.5 ? 'bg-red-600 text-white border-red-400' : liveRad > 1.2 ? 'bg-amber-500 text-slate-950' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'}`}>
                  {cumRad} mSv
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full ${liveRad > 2.5 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, Math.round((cumRad / 250) * 100))}%` }} />
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                <span>{lang === 'ar' ? `يومي: ${liveRad} mSv/d` : `Daily: ${liveRad} mSv/d`}</span>
                <span>{lang === 'ar' ? 'حد 30 يوم: 250 mSv' : '30d Limit: 250 mSv'}</span>
              </div>
            </div>
          </div>

          {/* Reactive Statistics Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200">
                {lang === 'ar' ? 'جدول الإحصائيات والمقارنة الحية اللحظية:' : 'Live vs Statistical Range Rollup Table:'}
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {lang === 'ar' ? '● القيم تتحدث لحظياً مع المحاكاة والـ Sliders' : '● Live column reacts instantly'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className={`py-3 px-4 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'المؤشر الحيوي' : 'Vital Parameter'}</th>
                    <th className="py-3 px-4 text-center bg-cyan-950/40 text-cyan-300 font-bold border-x border-cyan-800/40">{lang === 'ar' ? '🔴 القراءة الحية' : '🔴 Live Reading'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'المتوسط' : 'Avg'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الأدنى' : 'Min'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الأقصى' : 'Max'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'خط الأساس' : 'Baseline'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {metricsDisplay.map((m) => {
                    const stats = report?.vitals_statistics?.[m.key] || { avg: m.liveVal, min: m.liveVal - 10, max: m.liveVal + 30 };
                    const badgeCls = m.isCritical
                      ? 'bg-red-600 text-white font-extrabold'
                      : m.isWarning
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';

                    return (
                      <tr key={m.key} className="hover:bg-slate-900/60">
                        <td className={`py-3 px-4 font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? m.name_ar : m.name_en}</td>
                        <td className="py-3 px-4 text-center bg-cyan-950/20 border-x border-cyan-800/30">
                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${badgeCls}`}>{m.liveVal} {m.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">{stats.avg} {m.unit}</td>
                        <td className="py-3 px-4 text-center text-slate-400">{stats.min} {m.unit}</td>
                        <td className="py-3 px-4 text-center text-slate-400">{Math.max(stats.max, m.liveVal)} {m.unit}</td>
                        <td className="py-3 px-4 text-center text-slate-300 font-semibold" dir="ltr">{m.baseline} {m.unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alert Summary Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono font-bold text-slate-300">
              {lang === 'ar' ? 'ملخص الإنذارات النشطة:' : 'Active Alerts Summary:'}
            </span>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
              <span className={`px-3 py-1 rounded-lg border font-bold ${isNominal ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {isNominal ? (lang === 'ar' ? 'مستقر (Nominal)' : 'Nominal') : (lang === 'ar' ? `حالة عامة: ${globalStatus.toUpperCase()}` : `Status: ${globalStatus.toUpperCase()}`)}
              </span>
              <span className={`px-3 py-1 rounded-lg border font-bold ${warningAlertsCount > 0 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {lang === 'ar' ? `تحذير: ${warningAlertsCount}` : `Warning: ${warningAlertsCount}`}
              </span>
              <span className={`px-3 py-1 rounded-lg border font-bold ${criticalAlertsCount > 0 ? 'bg-red-600 text-white border-red-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {lang === 'ar' ? `حرج/طوارئ: ${criticalAlertsCount}` : `Critical: ${criticalAlertsCount}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
