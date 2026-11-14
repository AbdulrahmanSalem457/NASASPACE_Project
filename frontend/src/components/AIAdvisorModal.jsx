import React, { useState } from 'react';
import { 
  X, Brain, Sparkles, ShieldCheck, Activity, Send, 
  CheckCircle2, RefreshCw, AlertCircle, FileText 
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';
import { apiClient } from '../api/client';

export const AIAdvisorModal = ({ isOpen, onClose }) => {
  const { lang, t, selectedAstronaut, activity } = useAstro();
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !selectedAstronaut) return null;

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getAiAdvice({
        astronaut_id: selectedAstronaut.id,
        heart_rate: selectedAstronaut.hr_mean,
        systolic_bp: selectedAstronaut.sys_bp_mean,
        diastolic_bp: selectedAstronaut.dia_bp_mean,
        spo2: selectedAstronaut.spo2_mean,
        respiratory_rate: selectedAstronaut.resp_rate_mean,
        body_temperature: selectedAstronaut.body_temp_mean,
        activity: activity
      });
      setAdvice(res.clinical_guidance);
    } catch (err) {
      console.error('AI Advisor error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl my-auto bg-space-950 border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950/60 via-space-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-cyan-400 border border-blue-500/40">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                  NASA Clinical Decision Support
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                {lang === 'ar' ? 'المستشار السريري الذكي في الطب الفضائي' : 'AstroVitals AI — Clinical Decision Support'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Astronaut Details Banner */}
          <div className="flex flex-wrap items-center justify-between bg-space-900 border border-slate-800 rounded-xl p-3.5 text-xs font-mono">
            <div>
              <span className="text-slate-400">Target Astronaut: </span>
              <strong className="text-white">{selectedAstronaut.id} — {lang === 'ar' ? selectedAstronaut.name_ar : selectedAstronaut.name}</strong>
              <span className="text-slate-400 ml-2">({selectedAstronaut.role})</span>
            </div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="mt-2 sm:mt-0 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{loading ? 'Analyzing...' : (lang === 'ar' ? 'تحديث التحليل السريري' : 'Generate AI Clinical Synthesis')}</span>
            </button>
          </div>

          {/* Advice Output */}
          {advice ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-space-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  {lang === 'ar' ? 'الملخص والتقييم السريري الذكي:' : 'Clinical Assessment Summary:'}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {lang === 'ar' ? advice.summary_ar : advice.summary_en}
                </p>
              </div>

              {/* Space Physiology Factors */}
              {advice.space_physiology_factors_en && advice.space_physiology_factors_en.length > 0 && (
                <div className="bg-space-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-400" />
                    {lang === 'ar' ? 'الآليات الفسيولوجية المرتبطة بالفضاء:' : 'Underlying Space Physiology Mechanisms:'}
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {(lang === 'ar' ? advice.space_physiology_factors_ar : advice.space_physiology_factors_en).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">›</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {lang === 'ar' ? 'التوجيهات والخطوات العلاجية المباشرة:' : 'Actionable Treatment Directives:'}
                </span>
                <ul className="space-y-2 text-xs text-slate-200">
                  {(lang === 'ar' ? advice.recommendations_ar : advice.recommendations_en).map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-space-900/50 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <Brain className="w-10 h-10 text-cyan-400/60 mx-auto" />
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {lang === 'ar' 
                  ? 'يقوم المستشار السريري بمقارنة قياسات الرائد الحالية مع خط الأساس الشخصي Z-Score وتحليل تأثير الجاذبية الصغرى على الدورة الدموية والرئتين والحرارة.' 
                  : 'The AI Clinical Advisor evaluates current vitals against the astronaut\'s Personal Baseline Z-Score and correlates microgravity pathophysiology.'}
              </p>
              <button
                onClick={runAnalysis}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تشغيل التحليل السريري الآن' : 'Run Clinical Analysis Now'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
