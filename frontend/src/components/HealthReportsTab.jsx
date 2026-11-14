import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, Clock, Activity, ShieldCheck, 
  Dumbbell, Moon, Zap, AlertTriangle, RefreshCw, CheckCircle2, AlertOctagon 
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';
import { apiClient } from '../api/client';

export const HealthReportsTab = () => {
  const { lang, t, selectedAstronaut, selectedAstronautId, currentVitals, activeScenario, alerts } = useAstro();
  const [period, setPeriod] = useState('daily'); // 'daily' or 'weekly'
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      if (!selectedAstronautId) return;
      setIsLoading(true);
      try {
        const data = await apiClient.getReports(selectedAstronautId, period);
        if (isMounted) setReport(data);
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchReport();
    return () => { isMounted = false; };
  }, [selectedAstronautId, period, activeScenario]);

  if (!selectedAstronaut) return null;

  // Live vitals from context
  const live = currentVitals || {
    heart_rate: selectedAstronaut.hr_mean,
    systolic_bp: selectedAstronaut.sys_bp_mean,
    diastolic_bp: selectedAstronaut.dia_bp_mean,
    spo2: selectedAstronaut.spo2_mean,
    respiratory_rate: selectedAstronaut.resp_rate_mean,
    body_temperature: selectedAstronaut.body_temp_mean,
    sleep_duration: selectedAstronaut.sleep_duration,
    daily_radiation: selectedAstronaut.daily_radiation,
  };

  // Live Scenario Modifications for Compliance Cards
  const liveSleep = activeScenario === '3' ? 4.2 : (selectedAstronaut.sleep_duration || 6.8);
  const liveRad = activeScenario === '5' ? 3.2 : (selectedAstronaut.daily_radiation || 0.55);
  const liveExercise = selectedAstronaut.exercise_hours || 2.5;

  const isNominal = activeScenario === '0' || !activeScenario;
  const criticalAlertsCount = isNominal ? 0 : alerts.filter(a => a.is_active && (a.level === 'critical' || a.level === 'emergency')).length;
  const warningAlertsCount = isNominal ? 0 : alerts.filter(a => a.is_active && a.level === 'warning').length;

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header & Period Toggle */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-mono text-white">
              {lang === 'ar' ? 'التقارير الصحية والإحصائيات التراكمية' : 'Biometric Statistics & Health Compliance Report'}
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {lang === 'ar' 
                ? `الرائد: ${selectedAstronaut.id} — ${selectedAstronaut.name_ar} (تتحدث الإحصائيات والقراءات اللحظية فوراً مع أي سيناريو)`
                : `Astronaut: ${selectedAstronaut.id} — ${selectedAstronaut.name} (Live values and stats update reactively)`}
            </p>
          </div>
        </div>

        {/* Period Selector (Daily vs Weekly) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setPeriod('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              period === 'daily' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تقرير 24 ساعة (يومي)' : '24-Hour Rollup'}</span>
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              period === 'weekly' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تقرير 7 أيام (أسبوعي)' : '7-Day Weekly'}</span>
          </button>
        </div>
      </div>

      {isLoading && !report ? (
        <div className="py-12 flex items-center justify-center text-slate-400 font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
          {lang === 'ar' ? 'جاري تحميل وتحديث الإحصائيات...' : 'Loading & updating statistics...'}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top Countermeasures Live Compliance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Exercise Compliance */}
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
                <div 
                  className="bg-teal-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((liveExercise / 2.5) * 100))}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                <span>{lang === 'ar' ? `المنفذ: ${liveExercise} س/يوم` : `Actual: ${liveExercise} hrs/day`}</span>
                <span>{lang === 'ar' ? 'الهدف الإلزامي: 2.5 س/يوم' : 'Target: 2.5 hrs/day'}</span>
              </div>
            </div>

            {/* Sleep Compliance */}
            <div className={`rounded-xl p-4 space-y-2 border ${
              activeScenario === '3' 
                ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/50' 
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 font-bold text-slate-200">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  {lang === 'ar' ? 'معدل ساعات النوم' : 'Sleep Rest Score'}
                </span>
                <span className={`font-bold px-2 py-0.5 rounded border ${
                  activeScenario === '3' 
                    ? 'bg-amber-500 text-slate-950 border-amber-400' 
                    : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
                }`}>
                  {activeScenario === '3' 
                    ? (lang === 'ar' ? 'عجز وإرهاق' : 'Deficit & Fatigue') 
                    : (lang === 'ar' ? 'ملائم ومستقر' : 'Adequate')}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${activeScenario === '3' ? 'bg-amber-400' : 'bg-indigo-400'}`} 
                  style={{ width: `${Math.min(100, Math.round((liveSleep / 6.5) * 100))}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                <span>{lang === 'ar' ? `المسجل: ${liveSleep} س/ليلة` : `Recorded: ${liveSleep} hrs/night`}</span>
                <span>{lang === 'ar' ? 'الهدف: 6.5 س/ليلة' : 'Target: 6.5 hrs/night'}</span>
              </div>
            </div>

            {/* Cumulative Radiation Dose */}
            <div className={`rounded-xl p-4 space-y-2 border ${
              activeScenario === '5' 
                ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/60 animate-pulse-fast' 
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 font-bold text-slate-200">
                  <Zap className="w-4 h-4 text-amber-400" />
                  {lang === 'ar' ? 'التعرض الإشعاعي' : 'Radiation Tracking'}
                </span>
                <span className={`font-bold px-2 py-0.5 rounded border ${
                  activeScenario === '5' ? 'bg-red-600 text-white border-red-400' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  {activeScenario === '5' 
                    ? (lang === 'ar' ? 'عاصفة إشعاعية (SPE)' : 'Radiation Storm (SPE)') 
                    : (lang === 'ar' ? 'آمن وضمن الحدود' : 'Safe')}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${activeScenario === '5' ? 'bg-red-500' : 'bg-emerald-400'}`} 
                  style={{ width: activeScenario === '5' ? '85%' : '8%' }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                <span>{lang === 'ar' ? `الجرعة: ${liveRad} ملي سيفرت/يوم` : `Dose: ${liveRad} mSv/day`}</span>
                <span>{lang === 'ar' ? 'الحد المهني: 600 ملي سيفرت' : 'Career Limit: 600 mSv'}</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC REACTIVE STATISTICS TABLE */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200">
                {lang === 'ar' ? 'جدول الإحصائيات والمقارنة الحية اللحظية:' : 'Live vs Statistical Range Rollup Table:'}
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {lang === 'ar' ? '● عمود "القراءة الحالية" يتحدث لحظياً مع السيناريو المختار' : '● Live Reading column reacts dynamically to scenario'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className={`py-3 px-4 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      {lang === 'ar' ? 'المؤشر الحيوي' : 'Vital Parameter'}
                    </th>
                    <th className="py-3 px-4 text-center bg-cyan-950/40 text-cyan-300 font-bold border-x border-cyan-800/40">
                      {lang === 'ar' ? '🔴 القراءة اللحظية الحالية' : '🔴 Current Live Reading'}
                    </th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'المتوسط' : 'Average'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الأدنى' : 'Min'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الأقصى' : 'Max'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'خط الأساس المعتمد' : 'Personal Baseline'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {metricsDisplay.map((m) => {
                    const stats = report?.vitals_statistics?.[m.key] || { avg: m.liveVal, min: m.liveVal - 10, max: m.liveVal + 30 };

                    let liveBadgeStyle = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
                    let liveRowBg = 'hover:bg-slate-900/60';

                    if (m.isCritical) {
                      liveBadgeStyle = 'bg-red-600 text-white font-extrabold shadow-md animate-pulse';
                      liveRowBg = 'bg-red-950/20 hover:bg-red-950/30';
                    } else if (m.isWarning) {
                      liveBadgeStyle = 'bg-amber-500 text-slate-950 font-bold';
                      liveRowBg = 'bg-amber-950/20 hover:bg-amber-950/30';
                    }

                    return (
                      <tr key={m.key} className={`transition-colors ${liveRowBg}`}>
                        {/* Name */}
                        <td className={`py-3 px-4 font-semibold text-slate-200 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                          {lang === 'ar' ? m.name_ar : m.name_en}
                        </td>

                        {/* LIVE VALUE COLUMN - REACTS TO SCENARIO */}
                        <td className="py-3 px-4 text-center bg-cyan-950/20 border-x border-cyan-800/30">
                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-mono font-bold ${liveBadgeStyle}`}>
                            {m.liveVal} {m.unit}
                            {m.isCritical 
                              ? (lang === 'ar' ? ' (حرج)' : ' (Critical)') 
                              : m.isWarning 
                              ? (lang === 'ar' ? ' (تحذير)' : ' (Warning)') 
                              : (lang === 'ar' ? ' (طبيعي)' : ' (Normal)')
                            }
                          </span>
                        </td>

                        {/* Average */}
                        <td className="py-3 px-4 text-center font-bold text-slate-300">
                          {stats.avg} {m.unit}
                        </td>

                        {/* Min */}
                        <td className="py-3 px-4 text-center text-slate-400">
                          {stats.min} {m.unit}
                        </td>

                        {/* Max */}
                        <td className="py-3 px-4 text-center text-slate-400">
                          {Math.max(stats.max, m.liveVal)} {m.unit}
                        </td>

                        {/* Baseline */}
                        <td className="py-3 px-4 text-center text-slate-300 font-semibold" dir="ltr">
                          {m.baseline} {m.unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DYNAMIC ALERT SUMMARY BAR */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono font-bold text-slate-300">
              {lang === 'ar' ? 'إجمالي الإنذارات المسجلة خلال الفترة الحالية:' : 'Active & Logged Medical Alerts in this Period:'}
            </span>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
              <span className={`px-3 py-1 rounded-lg border font-bold ${
                isNominal ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isNominal 
                  ? (lang === 'ar' ? 'طبيعي مستقر (0 إنذارات)' : 'Nominal (0 Alerts)') 
                  : (lang === 'ar' ? 'ملاحظة: 0' : 'Notice: 0')}
              </span>

              <span className={`px-3 py-1 rounded-lg border font-bold ${
                warningAlertsCount > 0 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {lang === 'ar' ? `تحذير: ${warningAlertsCount}` : `Warning: ${warningAlertsCount}`}
              </span>

              <span className={`px-3 py-1 rounded-lg border font-bold ${
                criticalAlertsCount > 0 ? 'bg-red-600 text-white border-red-400 shadow-md animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {lang === 'ar' ? `حرج: ${criticalAlertsCount}` : `Critical: ${criticalAlertsCount}`}
              </span>

              <span className={`px-3 py-1 rounded-lg border font-bold ${
                activeScenario === '5' ? 'bg-rose-600 text-white border-rose-400 shadow-lg animate-pulse-fast' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {lang === 'ar' ? `طوارئ: ${activeScenario === '5' ? 1 : 0}` : `Emergency: ${activeScenario === '5' ? 1 : 0}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
