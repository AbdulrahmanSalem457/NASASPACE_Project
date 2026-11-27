import React from 'react';
import {
  HeartPulse, Activity, Zap, Moon, Dumbbell, Wind, Radio, ShieldAlert, Gauge
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';
import { LiveECGWaveform } from './LiveECGWaveform';

export const SecondaryMetricsBar = () => {
  const { lang, selectedAstronaut, currentVitals, radiationBudgets, globalStatus } = useAstro();

  if (!selectedAstronaut) return null;

  const liveHr = Number(currentVitals?.heart_rate ?? selectedAstronaut.hr_mean);
  const ecgPr = selectedAstronaut.ecg_pr || 155;
  const ecgQrs = selectedAstronaut.ecg_qrs || 85;
  const ecgQtc = Number(currentVitals?.ecg_qtc ?? selectedAstronaut.ecg_qtc ?? 415);
  const rhythm = currentVitals?.ecg_rhythm || selectedAstronaut.ecg_rhythm || (liveHr < 25 ? 'Ventricular Arrest' : liveHr > 105 ? 'Sinus Tachycardia' : 'Normal Sinus');

  const hrv = Number(currentVitals?.hrv_rmssd ?? selectedAstronaut.hrv_rmssd ?? 52.0);
  const co2 = Number(currentVitals?.cabin_co2 ?? selectedAstronaut.cabin_co2 ?? 3.2);
  const rad = Number(currentVitals?.daily_radiation ?? selectedAstronaut.daily_radiation ?? 0.55);
  const sleep = Number(currentVitals?.sleep_duration ?? selectedAstronaut.sleep_duration ?? 6.8);
  const exercise = Number(currentVitals?.exercise_hours ?? selectedAstronaut.exercise_hours ?? 2.5);
  const pressure = Number(currentVitals?.cabin_pressure ?? selectedAstronaut.cabin_pressure ?? 14.7);

  const qtcStatus = ecgQtc > 500 ? 'critical' : ecgQtc >= 450 ? 'warning' : 'normal';
  const hrvStatus = hrv < 15 ? 'critical' : hrv < 25 ? 'warning' : 'normal';
  const co2Status = co2 > 7.5 ? 'critical' : co2 > 5.3 ? 'warning' : 'normal';
  const radStatus = rad > 2.5 ? 'critical' : rad > 1.2 ? 'warning' : 'normal';
  const sleepStatus = sleep < 5.0 ? 'warning' : 'normal';
  const pressStatus = pressure < 13.5 || pressure > 15.5 ? 'critical' : pressure < 14.2 ? 'warning' : 'normal';

  const radBudget = radiationBudgets?.[selectedAstronaut.id] || {
    cumulative_msv: Number(selectedAstronaut.cumulative_radiation_msv || 24.8),
    limit_30d_msv: 250.0,
    limit_career_msv: 600.0,
    storm_shelter_required: rad > 2.5,
  };
  const liveCumRad = Number((Number(selectedAstronaut.cumulative_radiation_msv || 24.8) + Math.max(0, rad - 0.55)).toFixed(2));
  const pctCareer = Math.min(100, Number(((liveCumRad / 600.0) * 100).toFixed(1)));
  const stormShelterNeeded = rad > 2.5;

  return (
    <div className="bg-space-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 border-b border-slate-800 pb-2.5">
        <span className="font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-blue-400" />
          {lang === 'ar'
            ? 'مراقبة تخطيط القلب الحي، الإشعاع التراكمي، وبيئة المركبة'
            : 'Live ECG Waveform, Radiation Budget & Cabin Telemetry'}
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className={`px-2 py-0.5 rounded border font-bold ${
            pressStatus === 'critical'
              ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
              : pressStatus === 'warning'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            <Gauge className="w-3 h-3 inline mr-1" />
            {lang === 'ar' ? `ضغط الكابينة: ${pressure} psi` : `Cabin: ${pressure} psi (21% O2)`}
          </span>
        </div>
      </div>

      {/* Top Row: Live Animated ECG Waveform Monitor + Cumulative Radiation Budget Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Live ECG Monitor */}
        <div className={`lg:col-span-6 p-3 rounded-xl border ${
          liveHr < 25 || globalStatus === 'emergency'
            ? 'bg-red-950/35 border-red-500 ring-1 ring-red-500/60'
            : qtcStatus !== 'normal' || liveHr > 105
            ? 'bg-amber-950/25 border-amber-500/50'
            : 'bg-space-850 border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-mono">
              <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="font-bold text-white">
                {lang === 'ar' ? 'تخطيط القلب الحي (ECG Monitor)' : 'Live ECG Telemetry Waveform'}
              </span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              liveHr < 25
                ? 'bg-red-600 text-white animate-pulse'
                : qtcStatus !== 'normal' || liveHr > 105
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {rhythm} • {Math.round(liveHr)} BPM
            </span>
          </div>

          <LiveECGWaveform
            heartRate={liveHr}
            ecgQtc={ecgQtc}
            rhythm={rhythm}
            isEmergency={liveHr < 25 || globalStatus === 'emergency'}
            height={62}
          />

          <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-300">
            <span>QTc: <strong className={qtcStatus !== 'normal' ? 'text-amber-400' : 'text-emerald-400'}>{ecgQtc} ms</strong> <span className="text-slate-500">(N &lt; 450)</span></span>
            <span className="text-slate-400">PR: {ecgPr} ms | QRS: {ecgQrs} ms</span>
          </div>
        </div>

        {/* Cumulative Radiation Dose Tracker */}
        <div className={`lg:col-span-6 p-3 rounded-xl border flex flex-col justify-between ${
          stormShelterNeeded
            ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500/60'
            : radStatus === 'warning'
            ? 'bg-amber-950/25 border-amber-500/50'
            : 'bg-space-850 border-slate-800'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">
                {lang === 'ar' ? 'ميزانية الإشعاع التراكمية (Radiation Tracker)' : 'Cumulative Mission Radiation Budget'}
              </span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              stormShelterNeeded
                ? 'bg-red-600 text-white animate-pulse'
                : radStatus === 'warning'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {stormShelterNeeded
                ? (lang === 'ar' ? 'إخلاء للمأوى المصفح (SPE)' : 'STORM SHELTER REQUIRED')
                : radStatus === 'warning'
                ? (lang === 'ar' ? 'إشعاع مرتفع' : 'ELEVATED')
                : (lang === 'ar' ? 'ضمن حد الأمان' : 'SAFE BUDGET')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono bg-slate-950/70 rounded-lg p-2 border border-slate-800/80 mb-2">
            <div>
              <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'المعدل اليومي' : 'Daily Rate'}</span>
              <strong className={`text-sm ${radStatus !== 'normal' ? 'text-red-400' : 'text-cyan-300'}`}>{rad} mSv/d</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'التراكمي للمهمة' : 'Cumulative'}</span>
              <strong className="text-sm text-white">{liveCumRad} mSv</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'الحد المهني' : 'Career Limit'}</span>
              <strong className="text-sm text-slate-300">600 mSv</strong>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>{lang === 'ar' ? `اليوم ${selectedAstronaut.mission_day || 45} من المهمة` : `Mission Day ${selectedAstronaut.mission_day || 45}`}</span>
              <span>{pctCareer}% {lang === 'ar' ? 'من الحد المهني الأقصى' : 'of NASA Career Limit'}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  stormShelterNeeded ? 'bg-red-500 animate-pulse' : pctCareer > 50 ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                }`}
                style={{ width: `${Math.max(4, pctCareer)}%` }}
              />
            </div>
            {stormShelterNeeded && (
              <div className="mt-1.5 text-[11px] font-mono text-red-200 bg-red-900/50 border border-red-500/60 px-2.5 py-1 rounded flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-300 shrink-0" />
                <span>
                  {lang === 'ar'
                    ? 'تنبيه عاصفة شمسية (SPE): يجب إخلاء الطاقم فوراً إلى المأوى المصفح وتعليق أي خروج فضائي.'
                    : 'SPE Storm Alert: Immediate crew shelter in shielded module & EVA suspension required.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Contextual Micro-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* HRV */}
        <div className={`p-2.5 rounded-xl border text-xs ${hrvStatus !== 'normal' ? 'bg-amber-950/30 border-amber-500/50' : 'bg-space-850 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold"><Activity className="w-3.5 h-3.5 text-cyan-400" /> HRV</span>
            <span className={`text-[10px] font-mono px-1 rounded ${hrvStatus !== 'normal' ? 'bg-amber-500/20 text-amber-300' : 'text-emerald-400'}`}>
              {hrvStatus === 'normal' ? 'Nominal' : 'Stress'}
            </span>
          </div>
          <div className="font-mono text-slate-100 text-sm font-bold">{hrv} <span className="text-xs font-normal text-slate-400">ms</span></div>
          <div className="text-[10px] text-slate-400 font-mono">Normal: ≥ 25 ms</div>
        </div>

        {/* Cabin CO2 */}
        <div className={`p-2.5 rounded-xl border text-xs ${co2Status !== 'normal' ? 'bg-amber-950/30 border-amber-500/50' : 'bg-space-850 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold"><Wind className="w-3.5 h-3.5 text-emerald-400" /> Cabin CO2</span>
            <span className={`text-[10px] font-mono px-1 rounded ${co2Status !== 'normal' ? 'bg-amber-500/20 text-amber-300' : 'text-emerald-400'}`}>
              {co2Status === 'normal' ? 'Nominal' : 'High'}
            </span>
          </div>
          <div className="font-mono text-slate-100 text-sm font-bold">{co2} <span className="text-xs font-normal text-slate-400">mmHg</span></div>
          <div className="text-[10px] text-slate-400 font-mono">Limit: &lt; 5.3 mmHg</div>
        </div>

        {/* Daily Radiation */}
        <div className={`p-2.5 rounded-xl border text-xs ${radStatus !== 'normal' ? 'bg-red-950/30 border-red-500/50' : 'bg-space-850 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold"><Zap className="w-3.5 h-3.5 text-amber-400" /> Radiation</span>
            <span className={`text-[10px] font-mono px-1 rounded ${radStatus !== 'normal' ? 'bg-red-500/20 text-red-300' : 'text-emerald-400'}`}>
              {radStatus === 'normal' ? 'Safe' : 'Alert'}
            </span>
          </div>
          <div className="font-mono text-slate-100 text-sm font-bold">{rad} <span className="text-xs font-normal text-slate-400">mSv/d</span></div>
          <div className="text-[10px] text-slate-400 font-mono">ISS: 0.4–0.8</div>
        </div>

        {/* Sleep Rest */}
        <div className={`p-2.5 rounded-xl border text-xs ${sleepStatus !== 'normal' ? 'bg-amber-950/30 border-amber-500/50' : 'bg-space-850 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold"><Moon className="w-3.5 h-3.5 text-indigo-400" /> Sleep</span>
            <span className={`text-[10px] font-mono px-1 rounded ${sleepStatus !== 'normal' ? 'bg-amber-500/20 text-amber-300' : 'text-emerald-400'}`}>
              {sleepStatus === 'normal' ? 'Adequate' : 'Deficit'}
            </span>
          </div>
          <div className="font-mono text-slate-100 text-sm font-bold">{sleep} <span className="text-xs font-normal text-slate-400">hrs</span></div>
          <div className="text-[10px] text-slate-400 font-mono">Target: ≥ 6.5 hrs</div>
        </div>

        {/* Exercise */}
        <div className="p-2.5 rounded-xl border bg-space-850 border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-semibold"><Dumbbell className="w-3.5 h-3.5 text-blue-400" /> Exercise</span>
            <span className="text-[10px] font-mono text-emerald-400">ARED / T2</span>
          </div>
          <div className="font-mono text-slate-100 text-sm font-bold">{exercise} <span className="text-xs font-normal text-slate-400">hrs/d</span></div>
          <div className="text-[10px] text-slate-400 font-mono">NASA Target: 2.5h</div>
        </div>
      </div>
    </div>
  );
};
