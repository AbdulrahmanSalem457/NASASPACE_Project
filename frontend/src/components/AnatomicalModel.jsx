import React, { useState } from 'react';
import { 
  Heart, Brain, Wind, Thermometer, Activity, Eye, 
  ShieldCheck, Info, ChevronRight, Layers, Sparkles 
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const AnatomicalModel = () => {
  const { lang, t, bootstrap } = useAstro();
  const [activeSystem, setActiveSystem] = useState('cardiovascular');

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
        'Absence of hydrostatic pressure shifts ~1.5 to 2.0 Liters of blood and interstitial fluid from legs towards head/chest ("Puffy face & bird legs").',
        'Central baroreceptors perceive headward fluid engorgement as systemic volume overload, triggering rapid diuresis (Gauer-Henry reflex) and losing 10-15% intravascular plasma.',
        'Left ventricular muscle mass undergoes ~8-10% atrophy over long-duration flight due to reduced mechanical stroke work, predisposing to orthostatic syncope.'
      ],
      mechanisms_ar: [
        'غياب الضغط الهيدروستاتيكي ينقل ما بين 1.5 إلى 2 لتر من السوائل من الساقين نحو الصدر والرأس ("وجه منتفخ وسيقان نحيلة").',
        'تستشعر مستقبلات الضغط زيادة السوائل العلوية كفرط حجم، مما يسبب إدرار البول السريع وفقدان 10-15% من بلازما الدم الدائرية.',
        'ضمور تدريجي في كتلة البطين الأيسر بنسبة 8-10% لقلة الجهد الميكانيكي، مما يسبب دواراً وإغماءً انتصابياً عند مواجهة الجاذبية مجدداً.'
      ],
      countermeasures_en: 'Prescribed: Daily 2.5h resistive (ARED) & aerobic exercise, fluid-electrolyte loading (salt tablets + water) before re-entry, Lower Body Negative Pressure (LBNP).',
      countermeasures_ar: 'المواجهة المتبعة: 2.5 ساعة تمارين مقاومة وهوائية يومياً، شرب محاليل متوازنة كهرلياً قبل العودة، وأجهزة الضغط السلبي السفلي (LBNP).'
    },
    {
      id: 'neuro_ocular',
      name_en: 'Neuro-Ocular & SANS',
      name_ar: 'الجهاز العصبي ومتلازمة SANS العينية',
      icon: Eye,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      activeColor: 'bg-purple-500/20 border-purple-500 text-white',
      headline_en: 'Spaceflight-Associated Neuro-ocular Syndrome (SANS)',
      headline_ar: 'متلازمة SANS البصرية العصبية الفضائية',
      mechanisms_en: [
        'Persistent jugular and intracranial venous engorgement increases cerebrospinal fluid pressure around optic nerves.',
        'Causes optic disc edema (papilledema), optic nerve sheath enlargement, choroidal folds, and posterior globe flattening with hyperopic visual shift.',
        '16 sunrises/sunsets per 24 hours on ISS disrupt circadian clock, fragmenting deep slow-wave and REM sleep architecture.'
      ],
      mechanisms_ar: [
        'الاحتقان الوريدي الرأسي المستمر يرفع ضغط السائل الدماغي الشوكي حول أغشية العصب البصري.',
        'يسبب وذمة حليمة العصب البصري، وفلطحة مؤخرة مقلة العين، وتشوش الرؤية القريبة (Hyperopic shift).',
        'مشاهدة 16 شروقاً وغروباً يومياً تعطل إفراز الميلاتونين وتجزئ مراحل النوم العميق.'
      ],
      countermeasures_en: 'Prescribed: Regular Optical Coherence Tomography (OCT) retinal scans, circadian lighting control (blue-depleted spectrum in evening), strict 8.5h sleep opportunity.',
      countermeasures_ar: 'المواجهة المتبعة: تصوير مقطعي دوري للشبكية (OCT)، إضاءة الكابينة المتوافقة مع النظم اليوماوي، وجدولة 8.5 ساعة نوم إلزامية.'
    },
    {
      id: 'respiratory',
      name_en: 'Respiratory & Ventilation',
      name_ar: 'الجهاز التنفسي وغازات الكابينة',
      icon: Wind,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      activeColor: 'bg-cyan-500/20 border-cyan-500 text-white',
      headline_en: 'Lack of Natural Buoyant Convection & Gas Stratification',
      headline_ar: 'غياب تيارات الحمل الحراري وركود الغازات',
      mechanisms_en: [
        'Without gravity, exhaled warm carbon dioxide does not rise away from the human body.',
        'Without active mechanical air fans, exhaled CO2 forms a stationary toxic pocket around the face, causing progressive hypercapnia, throbbing headaches, and hypoxia.',
        'Microgravity aerosol suspension: dust, skin flakes, and pathogens never settle on the floor, posing persistent airway and ocular hazards.'
      ],
      mechanisms_ar: [
        'في انعدام الوزن لا يرتفع غاز ثاني أكسيد الكربون الدافئ بعيداً عن وجه الرائد لغياب الحمل الحراري.',
        'بدون مراوح التهوية الإجبارية، يتشكل جيب راكد من غاز CO2 السام يسبب صداعاً نابضاً ونقص أكسجين.',
        'تبقى الجسيمات والغبار معلقة في هواء المحطة إلى الأبد دون أن تستقر على الأرض، مما يهدد القصبات الهوائية.'
      ],
      countermeasures_en: 'Prescribed: Multi-stage HEPA cabin scrubbers, continuous personal air circulation fans inside crew quarters, real-time CO2 partial pressure monitoring.',
      countermeasures_ar: 'المواجهة المتبعة: فلاتر تنقية الهواء HEPA متعددة المراحل، مراوح تهوية شخصية داخل كبائن النوم، ومراقبة مستمرة لـ CO2.'
    },
    {
      id: 'thermoregulation',
      name_en: 'Thermoregulation & "Space Fever"',
      name_ar: 'التنظيم الحراري و"حمى الفضاء"',
      icon: Thermometer,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      activeColor: 'bg-amber-500/20 border-amber-500 text-white',
      headline_en: 'Impaired Evaporative Cooling ("Space Fever" Phenomenon)',
      headline_ar: 'تعطل التبريد بالتبخير وظاهرة "حمى الفضاء"',
      mechanisms_en: [
        'Perspiration does not roll off or drip away from skin in microgravity. Instead, surface tension forms a continuous liquid sweat coat.',
        'This liquid sweat blanket acts as a thermal insulator, preventing ambient airflow from dissipating heat and causing core temperature to climb faster during exercise.',
        'Resting core body temperature in long-duration astronauts averages ~1.0°C higher than on Earth (resting ~38.0°C).'
      ],
      mechanisms_ar: [
        'لا يتقاطر العرق عن الجلد في انعدام الوزن؛ بل تجمع قوى التوتر السطحي طبقة مائية متصلة فوق البشرة.',
        'تعمل طبقة العرق العازلة كحاجز حراري يمنع التبريد التبخيري مما يرفع الحرارة الداخلية سريعاً مع التمارين.',
        'ترتفع حرارة الراحة المركزية لرواد الفضاء بنحو 1.0°م في المتوسط مقارنة بالأرض (تصل لـ 38.0°م بالراحة).'
      ],
      countermeasures_en: 'Prescribed: Dedicated exercise cooling blowers, absorbent micro-fiber towels to periodically strip away sweat layer, cool electrolyte fluid rehydration.',
      countermeasures_ar: 'المواجهة المتبعة: مراوح تبريد عالية التدفق موجهة لجهاز التمرين، مناشف ألياف فائقة الامتصاص لإزالة العرق، وترطيب بالسوائل الباردة.'
    },
    {
      id: 'musculoskeletal',
      name_en: 'Musculoskeletal Integrity',
      name_ar: 'الجهاز العضلي الهيكلي',
      icon: Activity,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      activeColor: 'bg-emerald-500/20 border-emerald-500 text-white',
      headline_en: '1%/Month Bone Demineralization & Anti-Gravity Extensor Muscle Atrophy',
      headline_ar: 'فقدان 1% من كثافة العظام شهرياً وضمور عضلات الساق والظهر',
      mechanisms_en: [
        'Absence of gravitational skeleton loading halts osteoblast remodeling while osteoclasts continue bone resorption, releasing excess calcium into bloodstream (hypercalciuria & renal stone risk).',
        'Astronauts lose up to 1.0 to 1.5% bone mineral density in weight-bearing bones (calcaneus, femur, pelvis) every single month without countermeasures.',
        'Postural calf soleus and lumbar extensor muscles lose up to 20% mass within 2-3 weeks.'
      ],
      mechanisms_ar: [
        'غياب الوزن الميكانيكي يوقف نشاط خلايا بناء العظام بينما يستمر تآكلها، مفرزاً الكالسيوم بالدم (مخاطر حصوات الكلى).',
        'يفقد الرواد 1.0 إلى 1.5% من كثافة عظام الحوض والفخذ والقدم شهرياً في حال عدم ممارسة التمارين المكثفة.',
        'تفقد العضلات المضادة للجاذبية في الساقين والظهر 20% من حجمها وقوتها خلال أسبوعين إلى 3 أسابيع.'
      ],
      countermeasures_en: 'Prescribed: Advanced Resistive Exercise Device (ARED) delivering up to 600 lbs of simulated gravitational load, Vitamin D supplementation, bisphosphonates if indicated.',
      countermeasures_ar: 'المواجهة المتبعة: جهاز التمارين المتقدم ARED الذي يولد ما يصل لـ 600 رطل من المقاومة لمحاكاة الجاذبية، وفيتامين D، ومكملات الحماية.'
    }
  ];

  const current = systems.find(s => s.id === activeSystem) || systems[0];
  const CurrentIcon = current.icon;

  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-cyan-400 border border-blue-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              {lang === 'ar' ? 'تشريح وظائف الأعضاء في الفضاء: الفضاء مقابل الأرض' : 'Space Physiology Anatomical Model: Space vs Earth'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ar' ? 'اضغط على أي نظام لاكتشاف التغيرات الفسيولوجية في انعدام الوزن' : 'Click any anatomical system to inspect physiological adaptation & countermeasures'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Silhouette Figure & Hotspot Buttons */}
        <div className="lg:col-span-5 bg-space-850/70 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-between relative overflow-hidden">
          {/* Astronaut Stylized Silhouette */}
          <div className="relative w-44 h-72 flex items-center justify-center my-2">
            {/* SVG Human Figure */}
            <svg viewBox="0 0 100 200" className="w-full h-full text-slate-700 drop-shadow-md">
              {/* Head */}
              <circle cx="50" cy="22" r="14" fill="currentColor" opacity="0.6" />
              {/* Neck & Torso */}
              <path d="M 36 38 C 30 45, 26 58, 28 95 L 72 95 C 74 58, 70 45, 64 38 Z" fill="currentColor" opacity="0.7" />
              {/* Arms */}
              <path d="M 28 42 L 15 85 C 13 92, 16 95, 20 92 L 28 65 Z" fill="currentColor" opacity="0.5" />
              <path d="M 72 42 L 85 85 C 87 92, 84 95, 80 92 L 72 65 Z" fill="currentColor" opacity="0.5" />
              {/* Legs */}
              <path d="M 33 96 L 31 160 C 30 175, 26 190, 36 190 C 44 190, 42 170, 46 120 L 50 100 Z" fill="currentColor" opacity="0.65" />
              <path d="M 67 96 L 69 160 C 70 175, 74 190, 64 190 C 56 190, 58 170, 54 120 L 50 100 Z" fill="currentColor" opacity="0.65" />
            </svg>

            {/* Hotspot 1: Head / Neuro-Ocular */}
            <button
              onClick={() => setActiveSystem('neuro_ocular')}
              className={`absolute top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                activeSystem === 'neuro_ocular' ? 'bg-purple-600 text-white ring-4 ring-purple-400/30 scale-125' : 'bg-purple-500/30 text-purple-300 hover:scale-110'
              }`}
              title="Neuro-Ocular & SANS"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Hotspot 2: Chest / Cardiovascular Fluid Shift */}
            <button
              onClick={() => setActiveSystem('cardiovascular')}
              className={`absolute top-16 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                activeSystem === 'cardiovascular' ? 'bg-red-600 text-white ring-4 ring-red-400/30 scale-125' : 'bg-red-500/30 text-red-300 hover:scale-110'
              }`}
              title="Cardiovascular & Fluid Shift"
            >
              <Heart className="w-4 h-4 animate-pulse" />
            </button>

            {/* Hotspot 3: Lungs / Respiratory */}
            <button
              onClick={() => setActiveSystem('respiratory')}
              className={`absolute top-28 left-[28%] w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                activeSystem === 'respiratory' ? 'bg-cyan-600 text-white ring-4 ring-cyan-400/30 scale-125' : 'bg-cyan-500/30 text-cyan-300 hover:scale-110'
              }`}
              title="Respiratory Mechanics"
            >
              <Wind className="w-3.5 h-3.5" />
            </button>

            {/* Hotspot 4: Skin / Thermoregulation */}
            <button
              onClick={() => setActiveSystem('thermoregulation')}
              className={`absolute top-28 right-[28%] w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                activeSystem === 'thermoregulation' ? 'bg-amber-600 text-white ring-4 ring-amber-400/30 scale-125' : 'bg-amber-500/30 text-amber-300 hover:scale-110'
              }`}
              title="Thermoregulation & Space Fever"
            >
              <Thermometer className="w-3.5 h-3.5" />
            </button>

            {/* Hotspot 5: Legs / Musculoskeletal */}
            <button
              onClick={() => setActiveSystem('musculoskeletal')}
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                activeSystem === 'musculoskeletal' ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/30 scale-125' : 'bg-emerald-500/30 text-emerald-300 hover:scale-110'
              }`}
              title="Musculoskeletal & Bone Loss"
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Select Buttons */}
          <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
            {systems.map((s) => {
              const Icon = s.icon;
              const isSel = activeSystem === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSystem(s.id)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-[11px] font-mono transition-all text-left ${
                    isSel ? s.activeColor : 'bg-space-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{lang === 'ar' ? s.name_ar.split(' ')[0] : s.name_en.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Space Physiology Explainer */}
        <div className="lg:col-span-7 bg-space-850/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
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

          {/* Countermeasures Box */}
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono text-[11px] uppercase mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'ar' ? 'بروتوكولات الوقاية والمقاومة المعتمدة:' : 'NASA Countermeasures & Clinical Directives:'}</span>
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
