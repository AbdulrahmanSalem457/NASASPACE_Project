import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, XCircle, Rocket, Plus, Trash2,
  Users, Gauge, Wind, Zap, RefreshCw
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';
import { apiClient } from '../api/client';

export const MissionReadinessTab = () => {
  const {
    lang, astronauts, selectedAstronaut, selectedAstronautId, changeAstronaut,
    riskScore, readinessStatus, globalStatus, localGlobal, evaluation,
    evaPlans, addEvaPlan, removeEvaPlan
  } = useAstro();

  const [crewData, setCrewData] = useState(null);
  const [loadingCrew, setLoadingCrew] = useState(false);

  // EVA Planner Form State
  const [evaAstId, setEvaAstId] = useState(selectedAstronautId || 'AST-01');
  const [evaTitle, setEvaTitle] = useState('External Cooling Loop Valve Inspection');
  const [evaDuration, setEvaDuration] = useState(4.5);
  const [suitO2, setSuitO2] = useState(96);
  const [suitCo2, setSuitCo2] = useState(94);
  const [suitPress, setSuitPress] = useState(4.3);
  const [radForecast, setRadForecast] = useState(0.6);
  const [submitting, setSubmitting] = useState(false);

  const loadReadiness = async () => {
    setLoadingCrew(true);
    try {
      const res = await apiClient.getReadiness();
      setCrewData(res);
    } catch (e) {
      console.warn('Could not load crew readiness:', e);
    } finally {
      setLoadingCrew(false);
    }
  };

  useEffect(() => {
    loadReadiness();
    setEvaAstId(selectedAstronautId || 'AST-01');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAstronautId, globalStatus, riskScore]);

  const handleCreateEva = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addEvaPlan({
        astronaut_id: evaAstId,
        title: evaTitle,
        title_ar: evaTitle,
        duration_hours: Number(evaDuration),
        oxygen_reserve_pct: Number(suitO2),
        co2_scrubber_pct: Number(suitCo2),
        suit_pressure_psi: Number(suitPress),
        radiation_forecast_msv: Number(radForecast),
      });
      await loadReadiness();
    } finally {
      setSubmitting(false);
    }
  };

  const decisionBadge = (dec) => {
    if (dec === 'HOLD') {
      return {
        cls: 'bg-red-600 text-white border-red-400',
        icon: XCircle,
        text: lang === 'ar' ? 'إيقاف (HOLD)' : 'HOLD'
      };
    }
    if (dec === 'GO_WITH_CAUTION') {
      return {
        cls: 'bg-amber-500 text-slate-950 border-amber-400',
        icon: AlertTriangle,
        text: lang === 'ar' ? 'GO بحذر' : 'GO WITH CAUTION'
      };
    }
    return {
      cls: 'bg-emerald-500 text-slate-950 border-emerald-400',
      icon: ShieldCheck,
      text: lang === 'ar' ? 'جاهز (GO)' : 'GO'
    };
  };

  const currentDecision = decisionBadge(readinessStatus);
  const DecIcon = currentDecision.icon;
  const factors = evaluation?.risk_factors || localGlobal?.findings || [];
  const forecastText = lang === 'ar'
    ? (evaluation?.forecast_ar || (readinessStatus === 'GO' ? 'مسار مستقر متوقع للـ 4 ساعات القادمة.' : 'يتطلب مراقبة طبية فورية لمنع تصاعد المخاطر.'))
    : (evaluation?.forecast_en || (readinessStatus === 'GO' ? 'Stable trajectory projected for next 4 hours.' : 'Enhanced medical monitoring recommended to prevent escalation.'));

  return (
    <div className="space-y-6">
      {/* 1. Executive Risk Score (0-100) + Readiness Verdict Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              {lang === 'ar' ? 'مؤشر المخاطرة والجاهزية التنفيذي' : 'Executive Risk & Readiness Score'}
            </span>
            <button onClick={loadReadiness} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCrew ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <div className="text-5xl font-black font-mono text-white">
                {riskScore}<span className="text-lg text-slate-400 font-normal">/100</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedAstronaut?.id} — {lang === 'ar' ? selectedAstronaut?.name_ar : selectedAstronaut?.name}
              </p>
            </div>

            <div className={`px-4 py-2.5 rounded-2xl border font-mono font-extrabold text-sm flex items-center gap-2 shadow-lg ${currentDecision.cls}`}>
              <DecIcon className="w-5 h-5" />
              <span>{currentDecision.text}</span>
            </div>
          </div>

          {/* Risk Meter Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  riskScore >= 60 ? 'bg-red-500' : riskScore >= 30 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(4, riskScore)}%` }}
              />
            </div>
            <p className="text-xs text-cyan-300 font-sans leading-relaxed bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <strong className="font-mono">{lang === 'ar' ? 'التوقع القريب: ' : 'Near-Term Forecast: '}</strong>
              {forecastText}
            </p>
          </div>
        </div>

        {/* Risk Factors Breakdown */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold font-mono text-white border-b border-slate-800 pb-2">
            {lang === 'ar' ? 'تحليل عوامل المخاطرة الحية (Risk Factors Breakdown)' : 'Contributing Risk Factors Breakdown'}
          </h3>
          {factors.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'لا توجد عوامل خطر مسجلة حالياً. جميع المؤشرات الستة وقياسات الكابينة ضمن النطاق الطبيعي.'
                  : 'Zero elevated risk factors. All 6 vitals and cabin parameters are within nominal clearance ranges.'}
              </span>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {factors.map((f, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    f.severity === 'critical' || f.severity === 'emergency'
                      ? 'bg-red-950/40 border-red-500/50 text-red-200'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <span>{lang === 'ar' ? (f.label_ar || f.msg_ar) : (f.label_en || f.msg_en)}</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-950/60 shrink-0">+{f.points || 12} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. All 6 Crew Members Fleet Readiness Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold font-mono text-white">
              {lang === 'ar' ? 'جاهزية الطاقم الكامل (6 أفراد)' : 'Full Crew Readiness Fleet Overview (6 Crew)'}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {lang === 'ar' ? 'اضغط على أي رائد لمتابعة مؤشراته المباشرة' : 'Click any crew member to inspect live telemetry'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(crewData?.crew || astronauts.map(a => ({
            astronaut: a,
            risk_score: a.id === selectedAstronautId ? riskScore : 5,
            readiness_status: a.id === selectedAstronautId ? readinessStatus : 'GO',
            global_status: a.id === selectedAstronautId ? globalStatus : 'normal',
            radiation_budget: { cumulative_msv: a.cumulative_radiation_msv || 24.5 }
          }))).map((item) => {
            const ast = item.astronaut;
            const dec = decisionBadge(item.readiness_status);
            const Icon = dec.icon;
            const isSel = ast.id === selectedAstronautId;
            return (
              <button
                key={ast.id}
                onClick={() => changeAstronaut(ast.id)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 block">{ast.id} • {ast.mission_location}</span>
                    <h4 className="text-sm font-bold text-white">{lang === 'ar' ? ast.name_ar : ast.name}</h4>
                    <span className="text-[11px] text-slate-400">{lang === 'ar' ? ast.role_ar : ast.role}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 ${dec.cls}`}>
                    <Icon className="w-3 h-3" />
                    {item.readiness_status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80 text-slate-300">
                  <span>Risk: <strong>{item.risk_score}/100</strong></span>
                  <span>Rad: <strong>{item.radiation_budget?.cumulative_msv ?? ast.cumulative_radiation_msv} mSv</strong></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. EVA Spacewalk Planner (Backed by POST /api/eva-plans/) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <form onSubmit={handleCreateEva} className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Rocket className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono text-white">
              {lang === 'ar' ? 'مخطط السير الفضائي (EVA Planner)' : 'EVA Spacewalk Readiness Planner'}
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الرائد المكلف:' : 'Assigned Crew Member:'}</label>
              <select
                value={evaAstId}
                onChange={(e) => setEvaAstId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
              >
                {astronauts.map(a => (
                  <option key={a.id} value={a.id}>{a.id} — {lang === 'ar' ? a.name_ar : a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'اسم مهمة الخروج:' : 'EVA Objective:'}</label>
              <input
                type="text"
                value={evaTitle}
                onChange={(e) => setEvaTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'المدة (ساعات):' : 'Duration (hrs):'}</label>
                <input type="number" step="0.5" min="1" max="10" value={evaDuration} onChange={(e) => setEvaDuration(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'أكسجين البدلة (%):' : 'Suit O2 (%):'}</label>
                <input type="number" step="1" min="0" max="100" value={suitO2} onChange={(e) => setSuitO2(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'منقي CO2 (%):' : 'CO2 Scrubber (%):'}</label>
                <input type="number" step="1" min="0" max="100" value={suitCo2} onChange={(e) => setSuitCo2(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'ضغط البدلة (psi):' : 'Suit Pressure (psi):'}</label>
                <input type="number" step="0.1" min="2" max="15" value={suitPress} onChange={(e) => setSuitPress(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'توقع الإشعاع (mSv/day):' : 'Solar Radiation Forecast (mSv/d):'}</label>
              <input type="number" step="0.1" min="0.2" max="5" value={radForecast} onChange={(e) => setRadForecast(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تقييم الجاهزية وإضافة خطة EVA' : 'Evaluate GO/HOLD & Save EVA Plan'}</span>
            </button>
          </div>
        </form>

        {/* Saved EVA Clearances List */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold font-mono text-white border-b border-slate-800 pb-2">
            {lang === 'ar' ? 'جدول تصاريح السير الفضائي (GO / HOLD Log)' : 'EVA Mission Clearances Log'}
          </h3>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {evaPlans.map((plan) => {
              const dec = decisionBadge(plan.readiness_decision);
              const Icon = dec.icon;
              return (
                <div key={plan.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400 font-bold">
                          {plan.astronaut} — {lang === 'ar' ? plan.astronaut_name_ar : plan.astronaut_name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-extrabold flex items-center gap-1 ${dec.cls}`}>
                          <Icon className="w-3 h-3" />
                          {plan.readiness_decision}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5">{plan.title}</h4>
                    </div>

                    <button
                      onClick={() => removeEvaPlan(plan.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 cursor-pointer"
                      title="Delete plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-slate-400">
                    <span><Wind className="w-3 h-3 inline mr-1 text-emerald-400" />O2: {plan.oxygen_reserve_pct}%</span>
                    <span>CO2 Scrub: {plan.co2_scrubber_pct}%</span>
                    <span>Suit: {plan.suit_pressure_psi} psi</span>
                    <span><Zap className="w-3 h-3 inline mr-1 text-amber-400" />Rad: {plan.radiation_forecast_msv} mSv</span>
                    <span>Duration: {plan.duration_hours}h</span>
                  </div>

                  {plan.decision_reasons && plan.decision_reasons.length > 0 && (
                    <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-slate-800/70">
                      {plan.decision_reasons.map((r, idx) => (
                        <div key={idx}>• {lang === 'ar' ? (r.ar || r.en) : (r.en || r.ar)}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
