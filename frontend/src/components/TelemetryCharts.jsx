import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, ReferenceLine, ReferenceArea, CartesianGrid, Legend 
} from 'recharts';
import { 
  Calendar, Clock, Activity, Heart, Gauge, Wind, 
  Thermometer, Zap, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';
import { apiClient } from '../api/client';

export const TelemetryCharts = () => {
  const { lang, t, selectedAstronaut, selectedAstronautId, activity, currentVitals, activeScenario } = useAstro();
  const [range, setRange] = useState('24h'); // '24h' or '30d'
  const [metric, setMetric] = useState('heart_rate'); // 'heart_rate', 'blood_pressure', 'spo2', 'respiratory_rate', 'body_temperature', 'secondary'
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      if (!selectedAstronautId) return;
      setIsLoading(true);
      try {
        const res = await apiClient.getAstronautVitals(selectedAstronautId, range, range === '24h' ? 288 : 30);
        if (isMounted) {
          if (range === '24h') {
            // Format 24h data
            const formatted = (res.data || []).map((d) => ({
              time: d.timestamp ? d.timestamp.substring(11, 16) : '',
              fullTime: d.timestamp,
              heart_rate: d.heart_rate,
              systolic_bp: d.systolic_bp,
              diastolic_bp: d.diastolic_bp,
              spo2: d.spo2,
              respiratory_rate: d.respiratory_rate,
              body_temperature: d.body_temperature,
              activity: d.activity,
              status: d.status,
              cabin_co2: d.cabin_co2 || 3.2,
              hrv_rmssd: d.hrv_rmssd || 50.0,
              radiation_rate: d.radiation_rate || 0.55
            }));
            setChartData(formatted);
          } else {
            // Format 30d rollup data
            const formatted = (res.data || []).map((d) => ({
              time: d.date ? d.date.substring(5) : '',
              fullTime: d.date,
              heart_rate: d.avg_heart_rate,
              min_hr: d.min_heart_rate,
              max_hr: d.max_heart_rate,
              systolic_bp: d.avg_systolic_bp,
              diastolic_bp: d.avg_diastolic_bp,
              spo2: d.avg_spo2,
              respiratory_rate: d.avg_respiratory_rate,
              body_temperature: d.avg_body_temperature,
              sleep_hours: d.sleep_hours,
              exercise_hours: d.exercise_hours,
              hrv_rmssd: d.hrv_rmssd,
              daily_radiation: d.daily_radiation
            }));
            setChartData(formatted);
          }
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTelemetry();
    return () => { isMounted = false; };
  }, [selectedAstronautId, range, activeScenario]);

  if (!selectedAstronaut) return null;

  const baselines = selectedAstronaut.baselines || {};

  // Compute reference thresholds based on selected metric
  const getMetricConfig = () => {
    switch (metric) {
      case 'blood_pressure':
        return {
          title: lang === 'ar' ? 'ضغط الدم (انقباضي / انبساطي)' : 'Blood Pressure (Systolic & Diastolic)',
          unit: 'mmHg',
          dataKey1: 'systolic_bp',
          name1: lang === 'ar' ? 'انقباضي' : 'Systolic BP',
          color1: '#38BDF8',
          dataKey2: 'diastolic_bp',
          name2: lang === 'ar' ? 'انبساطي' : 'Diastolic BP',
          color2: '#818CF8',
          yDomain: [40, 180],
          mean1: baselines.systolic_bp?.mean || 108,
          sd1: baselines.systolic_bp?.sd || 5,
          warnHigh: 131,
          critHigh: 145,
          warnLow: 85,
          critLow: 80,
          liveVal1: currentVitals?.systolic_bp ?? (baselines.systolic_bp?.mean || 108),
          liveVal2: currentVitals?.diastolic_bp ?? (baselines.diastolic_bp?.mean || 68),
        };
      case 'spo2':
        return {
          title: lang === 'ar' ? 'تشبع الأكسجين في الدم (SpO2)' : 'Oxygen Saturation (SpO2)',
          unit: '%',
          dataKey1: 'spo2',
          name1: 'SpO2',
          color1: '#34D399',
          yDomain: [85, 100],
          mean1: baselines.spo2?.mean || 97.5,
          sd1: baselines.spo2?.sd || 0.6,
          warnLow: 94.9,
          critLow: 90.0,
          liveVal1: currentVitals?.spo2 ?? (baselines.spo2?.mean || 97.5),
        };
      case 'respiratory_rate':
        return {
          title: lang === 'ar' ? 'معدل التنفس' : 'Respiratory Rate',
          unit: 'breaths/min',
          dataKey1: 'respiratory_rate',
          name1: lang === 'ar' ? 'التنفس' : 'Resp Rate',
          color1: '#F472B6',
          yDomain: [8, 35],
          mean1: baselines.respiratory_rate?.mean || 14.0,
          sd1: baselines.respiratory_rate?.sd || 1.0,
          warnHigh: 21,
          critHigh: 24,
          warnLow: 10,
          critLow: 8,
          liveVal1: currentVitals?.respiratory_rate ?? (baselines.respiratory_rate?.mean || 14.0),
        };
      case 'body_temperature':
        return {
          title: lang === 'ar' ? 'درجة حرارة الجسم المركزية' : 'Core Body Temperature',
          unit: '°C',
          dataKey1: 'body_temperature',
          name1: lang === 'ar' ? 'الحرارة' : 'Body Temp',
          color1: '#F59E0B',
          yDomain: [35.0, 39.0],
          mean1: baselines.body_temperature?.mean || 36.8,
          sd1: baselines.body_temperature?.sd || 0.12,
          warnHigh: 37.51,
          critHigh: 38.3,
          warnLow: 35.5,
          critLow: 35.3,
          liveVal1: currentVitals?.body_temperature ?? (baselines.body_temperature?.mean || 36.8),
        };
      case 'secondary':
        return {
          title: lang === 'ar' ? 'المؤشرات البيئية والتوتر (HRV & CO2)' : 'HRV Stress & Cabin CO2',
          unit: '',
          dataKey1: 'hrv_rmssd',
          name1: 'HRV (ms)',
          color1: '#A78BFA',
          dataKey2: 'cabin_co2',
          name2: 'Cabin CO2 (mmHg)',
          color2: '#F87171',
          yDomain: [0, 80],
          mean1: 52,
          sd1: 8,
          liveVal1: currentVitals?.hrv_rmssd ?? 50.0,
          liveVal2: currentVitals?.cabin_co2 ?? 3.2,
        };
      case 'heart_rate':
      default:
        return {
          title: lang === 'ar' ? 'معدل ضربات القلب' : 'Heart Rate Telemetry',
          unit: 'bpm',
          dataKey1: 'heart_rate',
          name1: lang === 'ar' ? 'النبض' : 'Heart Rate',
          color1: '#EF4444',
          yDomain: [30, 160],
          mean1: baselines.heart_rate?.mean || 68,
          sd1: baselines.heart_rate?.sd || 4,
          warnHigh: 91,
          critHigh: 110,
          warnLow: 40,
          critLow: 35,
          liveVal1: currentVitals?.heart_rate ?? (baselines.heart_rate?.mean || 68),
        };
    }
  };

  const cfg = getMetricConfig();
  const baselineLow = Number((cfg.mean1 - cfg.sd1).toFixed(2));
  const baselineHigh = Number((cfg.mean1 + cfg.sd1).toFixed(2));

  // Determine Live Status & Z-Score
  const liveVal = cfg.liveVal1;
  const zScore = cfg.sd1 ? ((liveVal - cfg.mean1) / cfg.sd1).toFixed(2) : 0;
  const isCriticalLive = 
    (cfg.critHigh && liveVal >= cfg.critHigh) || 
    (cfg.critLow && liveVal <= cfg.critLow) || 
    Math.abs(Number(zScore)) >= 3.0;

  const isWarningLive = 
    !isCriticalLive && (
      (cfg.warnHigh && liveVal >= cfg.warnHigh) || 
      (cfg.warnLow && liveVal <= cfg.warnLow) || 
      Math.abs(Number(zScore)) >= 2.0
    );

  const isNominalLive = !isCriticalLive && !isWarningLive;

  // Append live reading to chart data so the curve visibly connects to NOW
  const displayChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    if (range !== '24h') return chartData;

    const livePoint = {
      time: lang === 'ar' ? 'الآن' : 'NOW',
      fullTime: 'Live Active Scenario',
      heart_rate: currentVitals?.heart_rate ?? baselines.heart_rate?.mean,
      systolic_bp: currentVitals?.systolic_bp ?? baselines.systolic_bp?.mean,
      diastolic_bp: currentVitals?.diastolic_bp ?? baselines.diastolic_bp?.mean,
      spo2: currentVitals?.spo2 ?? baselines.spo2?.mean,
      respiratory_rate: currentVitals?.respiratory_rate ?? baselines.respiratory_rate?.mean,
      body_temperature: currentVitals?.body_temperature ?? baselines.body_temperature?.mean,
      cabin_co2: currentVitals?.cabin_co2 ?? 3.2,
      hrv_rmssd: currentVitals?.hrv_rmssd ?? 50.0,
      isLivePoint: true
    };

    // Return the slice plus the dynamic live point
    const recent = chartData.slice(-40);
    return [...recent, livePoint];
  }, [chartData, currentVitals, range, lang, baselines]);

  return (
    <div className="bg-space-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* 1. DYNAMIC LIVE SCENARIO TELEMETRY BANNER */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all duration-300 ${
        isCriticalLive 
          ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500/50 shadow-lg shadow-red-500/10' 
          : isWarningLive 
          ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10' 
          : 'bg-emerald-950/30 border-emerald-500/40'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border flex items-center justify-center ${
            isCriticalLive 
              ? 'bg-red-600 text-white border-red-400 animate-pulse' 
              : isWarningLive 
              ? 'bg-amber-500 text-slate-950 border-amber-400' 
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            {isCriticalLive ? <ShieldAlert className="w-5 h-5 animate-bounce" /> : isWarningLive ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-300">
                {lang === 'ar' ? 'القراءة اللحظية الحالية (السيناريو النشط):' : 'Current Live Reading (Active Scenario):'}
              </span>
              <span className={`text-base font-mono font-extrabold px-2.5 py-0.5 rounded-md ${
                isCriticalLive 
                  ? 'bg-red-600 text-white' 
                  : isWarningLive 
                  ? 'bg-amber-500 text-slate-950' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {liveVal} {cfg.unit}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {lang === 'ar' 
                ? `خط الأساس المعتمد للرائد: ${cfg.mean1} ± ${cfg.sd1} ${cfg.unit} | الانحراف المعياري: Z = ${zScore}`
                : `Astronaut Baseline: ${cfg.mean1} ± ${cfg.sd1} ${cfg.unit} | Standard Deviation: Z = ${zScore}`}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className={`px-3 py-1 rounded-lg border font-bold ${
            isCriticalLive 
              ? 'bg-red-950 border-red-500 text-red-300 animate-pulse' 
              : isWarningLive 
              ? 'bg-amber-950 border-amber-500 text-amber-300' 
              : 'bg-emerald-950 border-emerald-500 text-emerald-300'
          }`}>
            {isCriticalLive 
              ? (lang === 'ar' ? '🔴 حالة حرجة - تتطلب تدخل فوري' : '🔴 CRITICAL ALERT') 
              : isWarningLive 
              ? (lang === 'ar' ? '⚠️ تحذير طبي - مراقبة مكثفة' : '⚠️ WARNING ALERT') 
              : (lang === 'ar' ? '🟢 وضع اسمي مستقر وطبيعي' : '🟢 NOMINAL STABLE')}
          </span>
        </div>
      </div>

      {/* 2. Chart Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 pt-1">
        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'heart_rate', label: lang === 'ar' ? 'القلب' : 'Heart Rate', icon: Heart },
            { id: 'blood_pressure', label: lang === 'ar' ? 'الضغط' : 'Blood Pressure', icon: Gauge },
            { id: 'spo2', label: 'SpO2', icon: Wind },
            { id: 'respiratory_rate', label: lang === 'ar' ? 'التنفس' : 'Respiration', icon: Activity },
            { id: 'body_temperature', label: lang === 'ar' ? 'الحرارة' : 'Temperature', icon: Thermometer },
            { id: 'secondary', label: lang === 'ar' ? 'HRV & CO2' : 'HRV & CO2', icon: Zap },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = metric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-md shadow-cyan-500/10'
                    : 'bg-space-850 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Range Toggle (24h vs 30d) */}
        <div className="flex items-center bg-space-850 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setRange('24h')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              range === '24h'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>24h CSV + Live</span>
          </button>
          <button
            onClick={() => setRange('30d')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              range === '30d'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>30-Day Trend</span>
          </button>
        </div>
      </div>

      {/* 3. Chart Legend & Baseline Band Info */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono gap-2">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-200">{cfg.title}</span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-400/60 inline-block"></span>
            <span>Personal Baseline Band: {baselineLow} – {baselineHigh} {cfg.unit} (Mean ± 1 SD)</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {cfg.warnHigh && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-0.5 bg-amber-400 inline-block"></span>
              <span>Warn High: {cfg.warnHigh}</span>
            </span>
          )}
          {cfg.critHigh && (
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2.5 h-0.5 bg-red-500 inline-block"></span>
              <span>Crit High: {cfg.critHigh}</span>
            </span>
          )}
        </div>
      </div>

      {/* 4. Chart Canvas */}
      <div className="h-80 w-full pt-2">
        {isLoading && chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
            Loading telemetry points...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayChartData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis domain={cfg.yDomain} stroke="#64748B" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B0F19',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

              {/* Shaded Personal Baseline Area (Mean ± SD) */}
              {cfg.mean1 && cfg.sd1 && (
                <ReferenceArea
                  y1={baselineLow}
                  y2={baselineHigh}
                  fill="#38BDF8"
                  fillOpacity={0.08}
                  stroke="#38BDF8"
                  strokeOpacity={0.3}
                  strokeDasharray="2 2"
                />
              )}

              {/* Threshold Lines */}
              {cfg.warnHigh && (
                <ReferenceLine y={cfg.warnHigh} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Warn High', fill: '#F59E0B', fontSize: 10 }} />
              )}
              {cfg.critHigh && (
                <ReferenceLine y={cfg.critHigh} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Crit High', fill: '#EF4444', fontSize: 10 }} />
              )}
              {cfg.warnLow && (
                <ReferenceLine y={cfg.warnLow} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Warn Low', fill: '#F59E0B', fontSize: 10 }} />
              )}
              {cfg.critLow && (
                <ReferenceLine y={cfg.critLow} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Crit Low', fill: '#EF4444', fontSize: 10 }} />
              )}

              {/* DYNAMIC LIVE SCENARIO REFERENCE LINE */}
              <ReferenceLine 
                y={liveVal} 
                stroke={isCriticalLive ? "#EF4444" : isWarningLive ? "#F59E0B" : "#10B981"} 
                strokeWidth={2.5} 
                strokeDasharray="4 4" 
                label={{ 
                  value: `🔴 LIVE NOW: ${liveVal} ${cfg.unit}`, 
                  fill: isCriticalLive ? "#EF4444" : isWarningLive ? "#F59E0B" : "#10B981", 
                  position: 'insideTopRight',
                  fontSize: 11,
                  fontWeight: 'bold'
                }} 
              />

              {/* Primary Line */}
              <Line
                type="monotone"
                dataKey={cfg.dataKey1}
                name={cfg.name1}
                stroke={cfg.color1}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />

              {/* Secondary Line (if BP or secondary) */}
              {cfg.dataKey2 && (
                <Line
                  type="monotone"
                  dataKey={cfg.dataKey2}
                  name={cfg.name2}
                  stroke={cfg.color2}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
