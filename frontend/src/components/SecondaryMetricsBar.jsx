import React from 'react';
import { 
  HeartPulse, Activity, Zap, Radio, Moon, Dumbbell, Shield, Wind
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const SecondaryMetricsBar = () => {
  const { lang, t, selectedAstronaut } = useAstro();

  if (!selectedAstronaut) return null;

  const ecgPr = selectedAstronaut.ecg_pr || 155;
  const ecgQrs = selectedAstronaut.ecg_qrs || 85;
  const ecgQtc = selectedAstronaut.ecg_qtc || 415;
  const rhythm = selectedAstronaut.ecg_rhythm || 'Normal Sinus';

  const hrv = selectedAstronaut.hrv_rmssd || 52.0;
  const co2 = selectedAstronaut.cabin_co2 || 3.2;
  const rad = selectedAstronaut.daily_radiation || 0.55;
  const sleep = selectedAstronaut.sleep_duration || 6.8;
  const exercise = selectedAstronaut.exercise_hours || 2.5;

  // Status checks
  const qtcStatus = ecgQtc > 500 ? 'critical' : ecgQtc >= 450 ? 'warning' : 'normal';
  const hrvStatus = hrv < 25 ? 'warning' : 'normal';
  const co2Status = co2 > 5.3 ? 'warning' : 'normal';
  const radStatus = rad > 2.5 ? 'critical' : rad > 1.2 ? 'warning' : 'normal';
  const sleepStatus = sleep < 5.0 ? 'warning' : 'normal';

  return (
    <div className="bg-space-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
        <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          {lang === 'ar' ? 'مؤشرات الفضاء وتخطيط القلب والبيئة' : 'Spaceflight Context & Environmental Telemetry'}
        </span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Cabin Pressure: 14.7 psi (21% O2)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* ECG Card */}
        <div className={`p-2.5 rounded-lg border text-xs ${qtcStatus !== 'normal' ? 'bg-amber-950/30 border-amber-500/50' : 'bg-space-850 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              ECG Telemetry
            </span>
            <span className={`text-[10px] font-mono px-1 rounded ${qtcStatus !== 'normal' ? 'bg-amber-500/20 text-amber-300' : 'text-emerald-400'}`}>
              {rhythm}
            </span>
          </div>
          <div className="font-mono text-slate-200 space-y-0.5 text-[11px]">
            <div>QTc: <strong className={qtcStatus !== 'normal' ? 'text-amber-400' : 'text-white'}>{ecgQtc} ms</strong> <span className="text-[10px] text-slate-400">(N: &lt;450)</span></div>
            <div className="text-[10px] text-slate-400">PR: {ecgPr}ms | QRS: {ecgQrs}ms</div>
          </div>
        </div>

        {/* HRV Card */}
        <div className={`p-2.5 rounded-lg border text-xs ${hrvStatus !== 'normal' ? 'bg-amber-950/30 border-amber-500/50' : 'bg-space-850 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              HRV (RMSSD)
            </span>
            <span className={`text-[10px] font-mono px-1 rounded ${hrvStatus !== 'normal' ? 'bg-amber-500/20 text-amber-300' : 'text-emerald-400'}`}>
              {hrvStatus === 'normal' ? 'Nominal' : 'Stress'}
            </span>
          </div>
          <div className="font-mono text-slate-200 text-sm font-bold">
            {hrv} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Normal: 20–80 ms</div>
        </div>

        {/* Cabin CO2 Card */}
        <div className={`p-2.5 rounded-lg border text-xs ${co2Status !== 'normal' ? 'bg-amber-950/30 border-amber-500/50' : 'bg-space-850 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold">
              <Wind className="w-3.5 h-3.5 text-emerald-400" />
              Cabin CO2
            </span>
            <span className={`text-[10px] font-mono px-1 rounded ${co2Status !== 'normal' ? 'bg-amber-500/20 text-amber-300' : 'text-emerald-400'}`}>
              {co2Status === 'normal' ? 'Nominal' : 'Elevated'}
            </span>
          </div>
          <div className="font-mono text-slate-200 text-sm font-bold">
            {co2} <span className="text-xs font-normal text-slate-400">mmHg</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Limit: &lt; 5.3 mmHg</div>
        </div>

        {/* Radiation Card */}
        <div className={`p-2.5 rounded-lg border text-xs ${radStatus !== 'normal' ? 'bg-red-950/30 border-red-500/50' : 'bg-space-850 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Daily Radiation
            </span>
            <span className={`text-[10px] font-mono px-1 rounded ${radStatus !== 'normal' ? 'bg-red-500/20 text-red-300' : 'text-emerald-400'}`}>
              {radStatus === 'normal' ? 'Safe' : 'Storm'}
            </span>
          </div>
          <div className="font-mono text-slate-200 text-sm font-bold">
            {rad} <span className="text-xs font-normal text-slate-400">mSv/day</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">ISS Avg: 0.4–0.8</div>
        </div>

        {/* Sleep Duration */}
        <div className={`p-2.5 rounded-lg border text-xs ${sleepStatus !== 'normal' ? 'bg-amber-950/30 border-amber-500/50' : 'bg-space-850 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Sleep Rest
            </span>
            <span className={`text-[10px] font-mono px-1 rounded ${sleepStatus !== 'normal' ? 'bg-amber-500/20 text-amber-300' : 'text-emerald-400'}`}>
              {sleepStatus === 'normal' ? 'Adequate' : 'Deficit'}
            </span>
          </div>
          <div className="font-mono text-slate-200 text-sm font-bold">
            {sleep} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Target: &gt; 6.0 hrs</div>
        </div>

        {/* Exercise Countermeasure */}
        <div className="p-2.5 rounded-lg border bg-space-850 border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold">
              <Dumbbell className="w-3.5 h-3.5 text-teal-400" />
              Exercise Time
            </span>
            <span className="text-[10px] font-mono px-1 rounded text-teal-400">
              100% Target
            </span>
          </div>
          <div className="font-mono text-slate-200 text-sm font-bold">
            {exercise} <span className="text-xs font-normal text-slate-400">hrs/day</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Target: 2.5 hrs/day</div>
        </div>
      </div>
    </div>
  );
};
