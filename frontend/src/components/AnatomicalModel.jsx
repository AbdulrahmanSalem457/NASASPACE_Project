import React, { useState, useEffect } from 'react';
import {
  Heart, Wind, Thermometer, Activity, Eye,
  ShieldCheck, Sparkles, AlertTriangle, AlertOctagon
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const AnatomicalModel = () => {
  const { lang, selectedAstronaut, currentVitals } = useAstro();
  const [activeSystem, setActiveSystem] = useState('cardiovascular');

  const live = currentVitals || {};
  const hr = Number(live.heart_rate ?? selectedAstronaut?.hr_mean ?? 68);
  const sys = Number(live.systolic_bp ?? selectedAstronaut?.sys_bp_mean ?? 116);
  const dia = Number(live.diastolic_bp ?? selectedAstronaut?.dia_bp_mean ?? 72);
  const qtc = Number(live.ecg_qtc ?? selectedAstronaut?.ecg_qtc ?? 415);
  const spo2 = Number(live.spo2 ?? selectedAstronaut?.spo2_mean ?? 97.5);
  const rr = Number(live.respiratory_rate ?? selectedAstronaut?.resp_rate_mean ?? 15);
  const co2 = Number(live.cabin_co2 ?? selectedAstronaut?.cabin_co2 ?? 3.2);
  const pressure = Number(live.cabin_pressure ?? selectedAstronaut?.cabin_pressure ?? 14.7);
  const temp = Number(live.body_temperature ?? selectedAstronaut?.body_temp_mean ?? 36.8);
  const sleep = Number(live.sleep_duration ?? selectedAstronaut?.sleep_duration ?? 6.8);
  const hrv = Number(live.hrv_rmssd ?? selectedAstronaut?.hrv_rmssd ?? 52);
  const rad = Number(live.daily_radiation ?? selectedAstronaut?.daily_radiation ?? 0.55);
  const exercise = Number(live.exercise_hours ?? selectedAstronaut?.exercise_hours ?? 2.5);

  // Live organ health assessment directly tied to vitals & environment
  const getSystemStatus = (id) => {
    if (id === 'cardiovascular') {
      if (hr < 25 || hr > 110 || hr < 40 || qtc > 500 || sys >= 145 || sys < 85) {
        return {
          level: 'critical',
          badge: `${Math.round(hr)} bpm | ${Math.round(sys)}/${Math.round(dia)}`,
          note_ar: `تنبيه قلبي حرج: النبض ${hr}، الضغط ${sys}/${dia}، QTc ${qtc} ms`,
          note_en: `Critical Cardiac Anomaly: HR ${hr} bpm, BP ${sys}/${dia}, QTc ${qtc} ms`
        };
      }
      if (hr > 90 || hr < 50 || qtc >= 450 || sys > 130 || sys < 95) {
        return {
          level: 'warning',
          badge: `${Math.round(hr)} bpm`,
          note_ar: `مؤشر تحذير: النبض ${hr} أو QTc ${qtc} ms`,
          note_en: `Warning: HR ${hr} bpm / QTc ${qtc} ms`
        };
      }
      return { level: 'normal', badge: `${Math.round(hr)} bpm` };
    }

    if (id === 'respiratory') {
      if (spo2 <= 90 || rr >= 25 || rr < 10 || co2 > 7.5 || pressure < 13.5) {
        return {
          level: 'critical',
          badge: `SpO2 ${spo2}% | CO2 ${co2}`,
          note_ar: `خطر تنفسي/بيئي: SpO2 ${spo2}%، التنفس ${rr}/د، CO2 ${co2} مم زئبق`,
          note_en: `Critical Pulmonary/Air: SpO2 ${spo2}%, RR ${rr}/min, CO2 ${co2} mmHg`
        };
      }
      if (spo2 < 95 || rr > 20 || co2 > 5.3 || pressure < 14.2) {
        return {
          level: 'warning',
          badge: `SpO2 ${spo2}% | CO2 ${co2}`,
          note_ar: `تحذير تنفسي: SpO2 ${spo2}% أو ارتفاع CO2 (${co2})`,
          note_en: `Warning: SpO2 ${spo2}% / Cabin CO2 ${co2} mmHg`
        };
      }
      return { level: 'normal', badge: `${spo2}% O2` };
    }

    if (id === 'thermoregulation') {
      if (temp >= 38.3 || temp < 35.5) {
        return {
          level: 'critical',
          badge: `${temp}°C`,
          note_ar: `حمى الفضاء (حرج): الحرارة المركزية ${temp}°م`,
          note_en: `Critical Space Fever: Core Temp ${temp}°C`
        };
      }
      if (temp > 37.5 || temp < 36.1) {
        return {
          level: 'warning',
          badge: `${temp}°C`,
          note_ar: `ارتفاع حرارة الجسم: ${temp}°م`,
          note_en: `Elevated Core Temp: ${temp}°C`
        };
      }
      return { level: 'normal', badge: `${temp}°C` };
    }

    if (id === 'neuro_ocular') {
      if (rad > 2.5 || hrv < 15) {
        return {
          level: 'critical',
          badge: `Rad ${rad} | HRV ${hrv}`,
          note_ar: `إجهاد عصبي/إشعاعي حرج: إشعاع ${rad} mSv، HRV ${hrv} ms`,
          note_en: `Critical Neuro/Radiation Risk: ${rad} mSv/d, HRV ${hrv} ms`
        };
      }
      if (sleep < 5.0 || hrv < 25 || rad > 1.2) {
        return {
          level: 'warning',
          badge: `Sleep ${sleep}h | HRV ${hrv}`,
          note_ar: `إجهاد عصبي/قلة نوم: نوم ${sleep} ساعة، HRV ${hrv} ms`,
          note_en: `Neuro/Circadian Stress: Sleep ${sleep}h, HRV ${hrv} ms`
        };
      }
      return { level: 'normal', badge: `${sleep}h | ${hrv}ms` };
    }

    if (id === 'musculoskeletal') {
      if (exercise < 1.5) {
        return {
          level: 'warning',
          badge: `${exercise}h ARED`,
          note_ar: `انخفاض التمارين المقاومة: ${exercise} ساعة (الهدف 2.5)`,
          note_en: `Low Countermeasure Exercise: ${exercise}h / 2.5h target`
        };
      }
      return { level: 'normal', badge: `${exercise}h ARED` };
    }

    return { level: 'normal', badge: 'Nominal' };
  };

  // Auto-focus highest severity organ when live telemetry alerts occur
  useEffect(() => {
    const order = ['respiratory', 'cardiovascular', 'thermoregulation', 'neuro_ocular', 'musculoskeletal'];
    const crit = order.find(id => getSystemStatus(id).level === 'critical');
    if (crit) {
      setActiveSystem(crit);
      return;
    }
    const warn = order.find(id => getSystemStatus(id).level === 'warning');
    if (warn) setActiveSystem(warn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hr, spo2, co2, temp, sleep, hrv, rad, qtc, pressure]);

  const systems = [
    {
      id: 'cardiovascular',
      name_en: 'Cardiovascular & Fluid Shift',
      name_ar: 'الجهاز القلبي الوعائي وانتقال السوائل',
      icon: Heart,
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      activeColor: 'bg-red-500/20 border-red-500 text-white',
      headline_en: 'Cephalad Fluid Shift & 10–15% Plasma Volume Depletion',
      headline_ar: 'انتقال السوائل الرأسي وفقدان 10-15% من بلازما الدم',
      mechanisms_en: [
        'Absence of hydrostatic pressure shifts ~1.5 to 2.0 Liters of fluid from legs toward head/chest ("Puffy face & bird legs").',
        'Central baroreceptors trigger diuresis, reducing circulating plasma volume by 10-15% within days.',
        'Left ventricular mass undergoes ~8-10% atrophy over long flights, elevating arrhythmia and orthostatic syncope risks.'
      ],
      mechanisms_ar: [
        'غياب الضغط الهيدروستاتيكي ينقل 1.5 إلى 2 لتر من السوائل من الساقين نحو الصدر والرأس ("وجه منتفخ وسيقان نحيلة").',
        'تستشعر مستقبلات الضغط زيادة السوائل العلوية فتسبب إدرار البول وفقدان 10-15% من بلازما الدم.',
        'ضمور تدريجي في كتلة البطين الأيسر بنسبة 8-10% مما يزيد عرضة اضطرابات النظم والهبوط الانتصابي.'
      ],
      countermeasures_en: 'Prescribed: Daily 2.5h resistive (ARED) & aerobic exercise, ORS fluid-electrolyte loading, LBNP.',
      countermeasures_ar: 'المواجهة المتبعة: 2.5 ساعة تمارين مقاومة يومياً، تعويض السوائل والكهارل (KIT-05)، وحزام CMRS عند الطوارئ.'
    },
    {
      id: 'neuro_ocular',
      name_en: 'Neuro-Ocular & SANS / Radiation',
      name_ar: 'الجهاز العصبي البصري (SANS) والنوم',
      icon: Eye,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      activeColor: 'bg-purple-500/20 border-purple-500 text-white',
      headline_en: 'SANS Syndrome, Circadian Disruption & Cosmic Radiation',
      headline_ar: 'متلازمة SANS البصرية، اضطراب النوم، والإشعاع الفضائي',
      mechanisms_en: [
        'Persistent intracranial venous engorgement raises CSF pressure around optic nerves (papilledema & globe flattening).',
        '16 orbital sunrises/sunsets per 24h impair endogenous melatonin, fragmenting REM sleep and depressing HRV.',
        'Solar Particle Events (SPE) elevate ionizing dose rate rapidly outside the magnetosphere.'
      ],
      mechanisms_ar: [
        'الاحتقان الوريدي الرأسي يرفع ضغط السائل حول العصب البصري ويسبب وذمة الشبكية وتشوش الرؤية القريبة.',
        'مشاهدة 16 شروقاً وغروباً يومياً تعطل الميلاتونين وتسبب عجز النوم وتراجع مؤشر HRV.',
        'العواصف الشمسية (SPE) ترفع معدل الإشعاع المؤين سريعاً خارج الدرع المغناطيسي.'
      ],
      countermeasures_en: 'Prescribed: OCT retinal scans, circadian blue-depleted lighting (KIT-12), Storm Shelter shielding (KIT-10).',
      countermeasures_ar: 'المواجهة المتبعة: فحص الشبكية OCT، قناع الإضاءة اليوماوية (KIT-12)، والمأوى المصفح وقت العواصف (KIT-10).'
    },
    {
      id: 'respiratory',
      name_en: 'Respiratory & Cabin Air / CO2',
      name_ar: 'الجهاز التنفسي وغازات الكابينة',
      icon: Wind,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      activeColor: 'bg-cyan-500/20 border-cyan-500 text-white',
      headline_en: 'No Natural Buoyant Convection & Stagnant CO2 Pockets',
      headline_ar: 'غياب الحمل الحراري وركود جيوب ثاني أكسيد الكربون',
      mechanisms_en: [
        'Without gravity, warm exhaled CO2 does not rise away from the face.',
        'Without active circulation fans, a toxic CO2 dome forms around the head causing hypercapnia and hypoxia.',
        'Suspended particulates never settle to the floor, posing continuous airway irritation.'
      ],
      mechanisms_ar: [
        'في انعدام الوزن لا يرتفع هواء الزفير الدافئ بعيداً عن وجه الرائد.',
        'بدون مراوح التهوية، يتكون جيب راكد من CO2 يسبب الصداع ونقص الأكسجين.',
        'تبقى الجسيمات والغبار معلقة في هواء المركبة مما يهدد الشعب الهوائية.'
      ],
      countermeasures_en: 'Prescribed: CDRA scrubbers & portable circulation fan (KIT-08), HEPA filtration, emergency O2 mask (KIT-01).',
      countermeasures_ar: 'المواجهة المتبعة: منظومة CDRA ومراوح التهوية (KIT-08)، وقناع الأكسجين الطبي للطوارئ (KIT-01).'
    },
    {
      id: 'thermoregulation',
      name_en: 'Thermoregulation & "Space Fever"',
      name_ar: 'التنظيم الحراري وظاهرة "حمى الفضاء"',
      icon: Thermometer,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      activeColor: 'bg-amber-500/20 border-amber-500 text-white',
      headline_en: 'Impaired Evaporative Cooling ("Space Fever")',
      headline_ar: 'تعطل التبريد بالتبخير وظاهرة "حمى الفضاء"',
      mechanisms_en: [
        'Perspiration cannot drip in microgravity; surface tension forms an insulating liquid sweat sheet over skin.',
        'Core body temperature climbs rapidly (+1.0 to +1.5°C) during exercise without active cooling airflow.'
      ],
      mechanisms_ar: [
        'لا يتقاطر العرق عن الجلد في الفضاء بل يشكل طبقة مائية عازلة تمنع التبخير.',
        'ترتفع الحرارة المركزية سريعاً بنحو +1.0 إلى +1.5°م أثناء التمارين إذا تعطل التبريد القسري.'
      ],
      countermeasures_en: 'Prescribed: Evaporative cooling gel towels & personal fan (KIT-07), chilled ORS fluids (KIT-05).',
      countermeasures_ar: 'المواجهة المتبعة: كمادات التبريد التبخيري ومروحة التبريد (KIT-07) وترطيب بالسوائل الباردة (KIT-05).'
    },
    {
      id: 'musculoskeletal',
      name_en: 'Musculoskeletal Integrity',
      name_ar: 'الجهاز العضلي الهيكلي',
      icon: Activity,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      activeColor: 'bg-emerald-500/20 border-emerald-500 text-white',
      headline_en: '1%/Month Bone Demineralization & Extensor Atrophy',
      headline_ar: 'فقدان 1% من كثافة العظام شهرياً وضمور العضلات',
      mechanisms_en: [
        'Zero-G mechanical unloading halts osteoblast bone formation while resorption releases urinary calcium (renal stone risk).',
        'Anti-gravity calf and spinal muscles lose up to 20% mass within 2-3 weeks without resistance loading.'
      ],
      mechanisms_ar: [
        'غياب الجاذبية يوقف بناء العظام ويزيد طرح الكالسيوم بالدم ويرفع خطر حصوات الكلى.',
        'تفقد عضلات الساق والظهر 20% من كتلتها خلال أسابيع ما لم تواجه بتدريب المقاومة.'
      ],
      countermeasures_en: 'Prescribed: Advanced Resistive Exercise Device (ARED, 2.5h/day), Vitamin D & hydration.',
      countermeasures_ar: 'المواجهة المتبعة: جهاز تمارين المقاومة المتقدم ARED لمدة 2.5 ساعة يومياً مع فيتامين D.'
    }
  ];

  const current = systems.find(s => s.id === activeSystem) || systems[0];
  const currentLive = getSystemStatus(current.id);
  const CurrentIcon = current.icon;

  const hotspotClasses = (id, baseColor) => {
    const st = getSystemStatus(id);
    const isSel = activeSystem === id;
    if (st.level === 'critical') {
      return `bg-red-600 text-white ring-4 ring-red-400/70 animate-pulse shadow-lg shadow-red-600/60 ${isSel ? 'scale-125' : 'scale-110'}`;
    }
    if (st.level === 'warning') {
      return `bg-amber-500 text-slate-950 ring-4 ring-amber-400/60 animate-pulse shadow-lg shadow-amber-500/50 ${isSel ? 'scale-125' : 'scale-110'}`;
    }
    return isSel ? `${baseColor} scale-125` : 'bg-slate-800/80 text-slate-300 border border-slate-600 hover:scale-110';
  };

  return (
    <div className="bg-space-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-cyan-400 border border-blue-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              {lang === 'ar'
                ? 'النموذج التشريحي الحي المرتبط بالقياسات (Live Anatomy Link)'
                : 'Live Telemetry-Linked Space Physiology Anatomy'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'تضيء الأعضاء تلقائياً بالأحمر أو الأصفر فور تجاوز القراءات الحية للحدود الآمنة مع إظهار القراءة الحية عليها.'
                : 'Organs automatically illuminate red/amber when live biometrics or cabin metrics cross thresholds.'}
            </p>
          </div>
        </div>
        {selectedAstronaut && (
          <span className="text-xs font-mono text-cyan-300 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl">
            {selectedAstronaut.id} — {lang === 'ar' ? selectedAstronaut.name_ar : selectedAstronaut.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Interactive Live Body Silhouette */}
        <div className="lg:col-span-5 bg-space-850/70 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-between relative">
          <div className="relative w-56 h-80 flex items-center justify-center my-2">
            <svg viewBox="0 0 100 200" className="w-full h-full text-slate-700 drop-shadow-md">
              <circle cx="50" cy="22" r="14" fill="currentColor" opacity="0.65" />
              <path d="M 36 38 C 30 45, 26 58, 28 95 L 72 95 C 74 58, 70 45, 64 38 Z" fill="currentColor" opacity="0.72" />
              <path d="M 28 42 L 15 85 C 13 92, 16 95, 20 92 L 28 65 Z" fill="currentColor" opacity="0.52" />
              <path d="M 72 42 L 85 85 C 87 92, 84 95, 80 92 L 72 65 Z" fill="currentColor" opacity="0.52" />
              <path d="M 33 96 L 31 160 C 30 175, 26 190, 36 190 C 44 190, 42 170, 46 120 L 50 100 Z" fill="currentColor" opacity="0.65" />
              <path d="M 67 96 L 69 160 C 70 175, 74 190, 64 190 C 56 190, 58 170, 54 120 L 50 100 Z" fill="currentColor" opacity="0.65" />
            </svg>

            {/* Head: Neuro-Ocular */}
            <button
              onClick={() => setActiveSystem('neuro_ocular')}
              className={`absolute top-3 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${hotspotClasses('neuro_ocular', 'bg-purple-600 text-white ring-4 ring-purple-400/30')}`}
              title="Neuro-Ocular, Sleep & Radiation"
            >
              <Eye className="w-4 h-4" />
            </button>
            <span className="absolute top-2 right-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-slate-200">
              {getSystemStatus('neuro_ocular').badge}
            </span>

            {/* Heart: Cardiovascular */}
            <button
              onClick={() => setActiveSystem('cardiovascular')}
              className={`absolute top-16 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${hotspotClasses('cardiovascular', 'bg-red-600 text-white ring-4 ring-red-400/30')}`}
              title="Cardiovascular & Blood Pressure"
            >
              <Heart className="w-4 h-4" />
            </button>
            <span className="absolute top-16 left-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-slate-200">
              {getSystemStatus('cardiovascular').badge}
            </span>

            {/* Lungs: Respiratory */}
            <button
              onClick={() => setActiveSystem('respiratory')}
              className={`absolute top-28 left-[24%] w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${hotspotClasses('respiratory', 'bg-cyan-600 text-white ring-4 ring-cyan-400/30')}`}
              title="Lungs, SpO2 & Cabin CO2"
            >
              <Wind className="w-4 h-4" />
            </button>
            <span className="absolute top-[148px] left-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-slate-200">
              {getSystemStatus('respiratory').badge}
            </span>

            {/* Skin/Core: Thermoregulation */}
            <button
              onClick={() => setActiveSystem('thermoregulation')}
              className={`absolute top-28 right-[24%] w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${hotspotClasses('thermoregulation', 'bg-amber-600 text-white ring-4 ring-amber-400/30')}`}
              title="Core Temp & Space Fever"
            >
              <Thermometer className="w-4 h-4" />
            </button>
            <span className="absolute top-[148px] right-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-slate-200">
              {getSystemStatus('thermoregulation').badge}
            </span>

            {/* Legs: Musculoskeletal */}
            <button
              onClick={() => setActiveSystem('musculoskeletal')}
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${hotspotClasses('musculoskeletal', 'bg-emerald-600 text-white ring-4 ring-emerald-400/30')}`}
              title="Musculoskeletal"
            >
              <Activity className="w-4 h-4" />
            </button>
            <span className="absolute bottom-2 right-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-slate-200">
              {getSystemStatus('musculoskeletal').badge}
            </span>
          </div>

          {/* System Selector Pills with Live Status Dot */}
          <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
            {systems.map((s) => {
              const Icon = s.icon;
              const st = getSystemStatus(s.id);
              const isSel = activeSystem === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSystem(s.id)}
                  className={`flex items-center justify-between gap-1.5 p-2 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                    isSel ? s.activeColor : 'bg-space-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lang === 'ar' ? s.name_ar.split(' ')[0] : s.name_en.split(' ')[0]}</span>
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    st.level === 'critical' ? 'bg-red-500 animate-ping' : st.level === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Space Physiology & Live Anomaly Diagnostic */}
        <div className="lg:col-span-7 bg-space-850/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg border ${current.color}`}>
                  <CurrentIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    {lang === 'ar' ? current.name_ar : current.name_en}
                  </h3>
                  <p className="text-xs font-semibold text-cyan-400">
                    {lang === 'ar' ? current.headline_ar : current.headline_en}
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full ${
                currentLive.level === 'critical'
                  ? 'bg-red-600 text-white animate-pulse'
                  : currentLive.level === 'warning'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {currentLive.badge}
              </span>
            </div>

            {currentLive.level !== 'normal' && (
              <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                currentLive.level === 'critical'
                  ? 'bg-red-950/60 border-red-500 text-red-200'
                  : 'bg-amber-950/50 border-amber-500 text-amber-200'
              }`}>
                {currentLive.level === 'critical'
                  ? <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>{lang === 'ar' ? currentLive.note_ar : currentLive.note_en}</span>
              </div>
            )}

            <div className="bg-space-900 border border-slate-800 rounded-lg p-3 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                {lang === 'ar' ? 'الآليات الفسيولوجية في انعدام الجاذبية:' : 'Microgravity Pathophysiological Mechanisms:'}
              </span>
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                {(lang === 'ar' ? current.mechanisms_ar : current.mechanisms_en).map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold font-mono">›</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono text-[11px] uppercase mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'ar' ? 'بروتوكولات الوقاية والمقاومة:' : 'Countermeasures & Clinical Directives:'}</span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              {lang === 'ar' ? current.countermeasures_ar : current.countermeasures_en}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
