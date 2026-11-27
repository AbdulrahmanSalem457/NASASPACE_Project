import React from 'react';
import { 
  Heart, Activity, Gauge, Wind, Thermometer, ShieldCheck, 
  AlertTriangle, Flame, ArrowUpRight, ArrowDownRight, Minus,
  CheckCircle2, AlertOctagon
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const VitalsCardGrid = () => {
  const { lang, t, selectedAstronaut, activity, currentVitals, openAlertModal, activeScenario } = useAstro();

  if (!selectedAstronaut) return null;

  const baselines = selectedAstronaut.baselines || {};

  // Consume live vitals from context, falling back to astronaut baselines
  const vitals = currentVitals || {
    heart_rate: selectedAstronaut.hr_mean,
    systolic_bp: selectedAstronaut.sys_bp_mean,
    diastolic_bp: selectedAstronaut.dia_bp_mean,
    spo2: selectedAstronaut.spo2_mean,
    respiratory_rate: selectedAstronaut.resp_rate_mean,
    body_temperature: selectedAstronaut.body_temp_mean,
  };

  const calculateZ = (val, mean, sd) => {
    if (!sd || sd === 0) return 0;
    return Number(((val - mean) / sd).toFixed(2));
  };

  const getStatus = (metricKey, val, base) => {
    const mean = base.mean || val;
    const sd = base.sd || 1;
    const z = calculateZ(val, mean, sd);
    const absZ = Math.abs(z);

    // Rule 2 & Range checks
    if (metricKey === 'heart_rate') {
      if (val >= 115 || val < 40 || absZ >= 3.0) {
        return {
          level: 'critical',
          warning_ar: `⚠️ تسارع نبض حرج: ${val} نبضة (+${Math.round(val - mean)} عن الأساس)`,
          warning_en: `⚠️ Critical Tachycardia: ${val} bpm (+${Math.round(val - mean)} over baseline)`,
          z
        };
      }
      if (val > 90 || val < 50 || absZ >= 2.0) {
        return {
          level: 'warning',
          warning_ar: `⚠️ تنبيه: نبض مرتفع (${val} نبضة/دقيقة)`,
          warning_en: `⚠️ Warning: Elevated HR (${val} bpm)`,
          z
        };
      }
    }

    if (metricKey === 'spo2') {
      if (val <= 90.0 || absZ >= 3.0) {
        return {
          level: 'critical',
          warning_ar: `⚠️ هبوط أكسجين خطير: ${val}% (الحد الأدنى 95%)`,
          warning_en: `⚠️ Critical Hypoxia: SpO2 dropped to ${val}%`,
          z
        };
      }
      if (val < 95.0 || absZ >= 2.0) {
        return {
          level: 'warning',
          warning_ar: `⚠️ تحذير: تشبع أكسجين منخفض (${val}%)`,
          warning_en: `⚠️ Warning: Low SpO2 (${val}%)`,
          z
        };
      }
    }

    if (metricKey === 'respiratory_rate') {
      if (val >= 25 || val < 10 || absZ >= 3.0) {
        return {
          level: 'critical',
          warning_ar: `⚠️ تسرع تنفس حاد: ${val} نفس/دقيقة`,
          warning_en: `⚠️ Critical Tachypnea: ${val} breaths/min`,
          z
        };
      }
      if (val > 20 || val < 12 || absZ >= 2.0) {
        return {
          level: 'warning',
          warning_ar: `⚠️ تنبيه: زيادة في معدل التنفس (${val})`,
          warning_en: `⚠️ Warning: Elevated RR (${val})`,
          z
        };
      }
    }

    if (metricKey === 'body_temperature') {
      if (val >= 38.3 || val < 35.5 || absZ >= 3.0) {
        return {
          level: 'critical',
          warning_ar: `⚠️ حمى الفضاء: حرارة مركزية مرتفعة ${val}°م`,
          warning_en: `⚠️ Space Fever: Core Temp elevated to ${val}°C`,
          z
        };
      }
      if (val > 37.5 || val < 36.1 || absZ >= 2.0) {
        return {
          level: 'warning',
          warning_ar: `⚠️ تنبيه: ارتفاع في درجة الحرارة (${val}°م)`,
          warning_en: `⚠️ Warning: Elevated Temp (${val}°C)`,
          z
        };
      }
    }

    if (metricKey === 'systolic_bp') {
      if (val >= 145 || val < 85 || absZ >= 3.0) {
        return {
          level: 'critical',
          warning_ar: `⚠️ ضغط دم انقباضي حرج: ${val} ملم زئبق`,
          warning_en: `⚠️ Critical Systolic BP: ${val} mmHg`,
          z
        };
      }
      if (val > 130 || val < 95 || absZ >= 2.0) {
        return {
          level: 'warning',
          warning_ar: `⚠️ تحذير: ضغط انقباضي غير مستقر (${val})`,
          warning_en: `⚠️ Warning: Unstable Systolic BP (${val})`,
          z
        };
      }
    }

    if (metricKey === 'diastolic_bp') {
      if (val >= 95 || val < 50 || absZ >= 3.0) {
        return {
          level: 'critical',
          warning_ar: `⚠️ ضغط انبساطي حرج: ${val} ملم زئبق`,
          warning_en: `⚠️ Critical Diastolic BP: ${val} mmHg`,
          z
        };
      }
      if (val > 85 || val < 55 || absZ >= 2.0) {
        return {
          level: 'warning',
          warning_ar: `⚠️ تحذير: ضغط انبساطي مرتفع (${val})`,
          warning_en: `⚠️ Warning: Elevated Diastolic BP (${val})`,
          z
        };
      }
    }

    return {
      level: 'normal',
      warning_ar: `✅ قياس طبيعي ومستقر`,
      warning_en: `✅ Nominal reading concordant with baseline`,
      z
    };
  };

  const cards = [
    {
      key: 'heart_rate',
      name_en: 'Heart Rate',
      name_ar: 'معدل ضربات القلب',
      unit: 'bpm',
      icon: Heart,
      val: vitals.heart_rate,
      base: baselines.heart_rate || { mean: 68.0, sd: 4.0 },
      spaceNominal: '50 – 90'
    },
    {
      key: 'systolic_bp',
      name_en: 'Systolic Blood Pressure',
      name_ar: 'الضغط الانقباضي',
      unit: 'mmHg',
      icon: Gauge,
      val: vitals.systolic_bp,
      base: baselines.systolic_bp || { mean: 116.0, sd: 5.0 },
      spaceNominal: '95 – 130'
    },
    {
      key: 'diastolic_bp',
      name_en: 'Diastolic Blood Pressure',
      name_ar: 'الضغط الانبساطي',
      unit: 'mmHg',
      icon: Activity,
      val: vitals.diastolic_bp,
      base: baselines.diastolic_bp || { mean: 72.0, sd: 4.0 },
      spaceNominal: '55 – 85'
    },
    {
      key: 'spo2',
      name_en: 'SpO2 Oxygen Saturation',
      name_ar: 'تشبع الأكسجين (SpO2)',
      unit: '%',
      icon: Wind,
      val: vitals.spo2,
      base: baselines.spo2 || { mean: 97.0, sd: 0.6 },
      spaceNominal: '95 – 100'
    },
    {
      key: 'respiratory_rate',
      name_en: 'Respiratory Rate',
      name_ar: 'معدل التنفس',
      unit: 'breaths/min',
      icon: Wind,
      val: vitals.respiratory_rate,
      base: baselines.respiratory_rate || { mean: 15.0, sd: 1.0 },
      spaceNominal: '12 – 20'
    },
    {
      key: 'body_temperature',
      name_en: 'Core Body Temperature',
      name_ar: 'حرارة الجسم المركزية',
      unit: '°C',
      icon: Thermometer,
      val: vitals.body_temperature,
      base: baselines.body_temperature || { mean: 36.9, sd: 0.12 },
      spaceNominal: '36.1 – 37.5'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold font-mono text-white">
            {lang === 'ar' ? 'المؤشرات الحيوية الستة ومقارنتها بخط الأساس' : '6 Core Vital Signs Telemetry'}
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {lang === 'ar' ? 'الرائد الحالي:' : 'Astronaut:'}{' '}
          <strong className="text-cyan-400">{selectedAstronaut.id} — {lang === 'ar' ? selectedAstronaut.name_ar : selectedAstronaut.name}</strong>
        </div>
      </div>

      {/* 6 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          const status = getStatus(c.key, c.val, c.base);
          const isCrit = status.level === 'critical';
          const isWarn = status.level === 'warning';

          let cardStyle = 'bg-slate-900/80 border-slate-800 text-slate-100 hover:border-slate-700';
          let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
          let numberStyle = 'text-white';
          let warningBoxStyle = 'bg-emerald-950/20 text-emerald-300 border-emerald-500/20';

          if (isCrit) {
            cardStyle = 'bg-red-950/40 border-red-500 shadow-xl shadow-red-600/20 ring-2 ring-red-500/60 animate-pulse-fast';
            badgeStyle = 'bg-red-600 text-white font-extrabold shadow-md';
            numberStyle = 'text-red-400 font-black';
            warningBoxStyle = 'bg-red-950/80 text-red-200 border-red-500/60 font-semibold';
          } else if (isWarn) {
            cardStyle = 'bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-600/10 ring-1 ring-amber-500/50';
            badgeStyle = 'bg-amber-500 text-slate-950 font-bold';
            numberStyle = 'text-amber-300 font-bold';
            warningBoxStyle = 'bg-amber-950/70 text-amber-200 border-amber-500/50';
          }

          return (
            <div
              key={c.key}
              className={`rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex flex-col justify-between ${cardStyle}`}
            >
              {/* Top Row: Metric Name & Level Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl border ${
                    isCrit ? 'bg-red-600 text-white border-red-400' : isWarn ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-cyan-400 border-slate-700'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {lang === 'ar' ? c.name_ar : c.name_en}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {lang === 'ar' ? 'المعدل الطبيعي:' : 'Space Normal:'} {c.spaceNominal} {c.unit}
                    </span>
                  </div>
                </div>

                <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border uppercase tracking-wider ${badgeStyle}`}>
                  {isCrit ? (lang === 'ar' ? 'خطر حرج' : 'CRITICAL') : isWarn ? (lang === 'ar' ? 'تحذير' : 'WARNING') : (lang === 'ar' ? 'طبيعي' : 'NORMAL')}
                </span>
              </div>

              {/* Big Reading Value & Z-Score */}
              <div className="my-4 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl sm:text-5xl font-mono tracking-tight ${numberStyle}`}>
                    {c.val}
                  </span>
                  <span className="text-sm font-mono text-slate-400">{c.unit}</span>
                </div>

                {/* Z-Score badge */}
                <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                  isCrit ? 'bg-red-600 text-white border-red-400' : isWarn ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-cyan-300 border-slate-700'
                }`}>
                  Z = {status.z > 0 ? `+${status.z}` : status.z}
                </div>
              </div>

              {/* LIVE WARNING BOX - Directly explains what's happening! */}
              <div className={`p-2.5 rounded-xl border text-xs leading-relaxed flex items-center gap-2 mb-3 ${warningBoxStyle}`}>
                {isCrit ? (
                  <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
                ) : isWarn ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>
                  {lang === 'ar' ? status.warning_ar : status.warning_en}
                </span>
              </div>

              {/* Baseline Reference Footer */}
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{lang === 'ar' ? 'خط الأساس الشخصي:' : 'Personal Baseline:'}</span>
                <strong className="text-slate-200">{c.base.mean} ± {c.base.sd} {c.unit}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
