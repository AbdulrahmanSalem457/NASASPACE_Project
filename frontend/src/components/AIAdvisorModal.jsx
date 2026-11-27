import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Brain, Sparkles, ShieldCheck, Activity,
  CheckCircle2, RefreshCw, Mic, MicOff, Send, ShieldAlert, BriefcaseMedical, Lock
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';
import { apiClient } from '../api/client';

export const AIAdvisorModal = ({ isOpen, onClose }) => {
  const { lang, selectedAstronaut, activity, currentVitals } = useAstro();
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Interactive Incident Assistant State + Voice Input
  const [complaint, setComplaint] = useState('');
  const [assistantResult, setAssistantResult] = useState(null);
  const [askingAssistant, setAskingAssistant] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedAstronaut) return;
    setLoading(true);
    try {
      const vitalsToSend = currentVitals || {
        heart_rate: selectedAstronaut.hr_mean,
        systolic_bp: selectedAstronaut.sys_bp_mean,
        diastolic_bp: selectedAstronaut.dia_bp_mean,
        spo2: selectedAstronaut.spo2_mean,
        respiratory_rate: selectedAstronaut.resp_rate_mean,
        body_temperature: selectedAstronaut.body_temp_mean,
      };

      const res = await apiClient.getAiAdvice({
        astronaut_id: selectedAstronaut.id,
        heart_rate: vitalsToSend.heart_rate,
        systolic_bp: vitalsToSend.systolic_bp,
        diastolic_bp: vitalsToSend.diastolic_bp,
        spo2: vitalsToSend.spo2,
        respiratory_rate: vitalsToSend.respiratory_rate,
        body_temperature: vitalsToSend.body_temperature,
        cabin_co2: vitalsToSend.cabin_co2,
        daily_radiation: vitalsToSend.daily_radiation,
        ecg_qtc: vitalsToSend.ecg_qtc,
        hrv_rmssd: vitalsToSend.hrv_rmssd,
        sleep_duration: vitalsToSend.sleep_duration,
        cabin_pressure: vitalsToSend.cabin_pressure,
        activity
      });
      setAdvice(res.clinical_guidance);
    } catch (err) {
      console.error('AI Advisor error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAstronaut, currentVitals, activity]);

  useEffect(() => {
    if (isOpen && selectedAstronaut) {
      runAnalysis();
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, [isOpen, selectedAstronaut?.id, currentVitals?.heart_rate, currentVitals?.spo2, currentVitals?.body_temperature]);

  const handleToggleVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert(lang === 'ar'
        ? 'المتصفح الحالي لا يدعم الإدخال الصوتي المباشر (جرب Chrome أو Edge).'
        : 'Browser Web Speech Recognition not supported here (try Chrome/Edge).');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setComplaint(prev => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  };

  const handleAskIncident = async (mode) => {
    if (!complaint.trim() || !selectedAstronaut) return;
    setAskingAssistant(true);
    try {
      const res = await apiClient.askIncidentAssistant({
        astronaut_id: selectedAstronaut.id,
        description: complaint.trim(),
        language: lang,
        mode,
        vitals: currentVitals || {}
      });
      setAssistantResult(res);
    } catch (err) {
      console.error('Incident Assistant failed:', err);
    } finally {
      setAskingAssistant(false);
    }
  };

  if (!isOpen || !selectedAstronaut) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-backdrop-fade">
      <div className="w-full max-w-4xl my-auto bg-space-950 border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden animate-modal-pop">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950/60 via-space-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-cyan-400 border border-blue-500/40">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                {lang === 'ar' ? 'مساعد الحوادث التفاعلي + المستشار السريري' : 'Interactive Incident Assistant & Clinical Support'}
              </span>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                {lang === 'ar' ? 'المساعد الطبي الذكي في الطب الفضائي' : 'AstroVitals AI — Incident & Clinical Assistant'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* 1. INTERACTIVE INCIDENT ASSISTANT + VOICE INPUT */}
          <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>{lang === 'ar' ? 'مساعد الحوادث والأعراض التفاعلي (بالكتابة أو الصوت)' : 'Interactive Symptom & Incident Assistant (Text or Voice)'}</span>
              </h3>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {lang === 'ar' ? 'الوضع الأوفلاين لا يرسل بيانات خارجياً' : 'Offline Mode sends zero external traffic'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskIncident('offline')}
                  placeholder={lang === 'ar'
                    ? 'اكتب الشكوى أو اضغط الميكروفون... (مثال: عنده صداع شديد ودوخة أو خفقان في القلب أو تسريب ضغط)'
                    : 'Describe symptom/incident or tap mic... (e.g., severe headache CO2, chest palpitations, fever)'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleToggleVoice}
                className={`px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                  isListening
                    ? 'bg-red-600 text-white border-red-400 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                }`}
                title={lang === 'ar' ? 'إدخال صوتي بالميكروفون' : 'Voice Microphone Input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isListening ? (lang === 'ar' ? 'يستمع...' : 'Listening...') : (lang === 'ar' ? 'مايك' : 'Voice')}</span>
              </button>

              <button
                type="button"
                disabled={askingAssistant || !complaint.trim()}
                onClick={() => handleAskIncident('offline')}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تحليل فوري (أوفلاين)' : 'Instant Offline Match'}</span>
              </button>

              <button
                type="button"
                disabled={askingAssistant || !complaint.trim()}
                onClick={() => handleAskIncident('ai')}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'اسأل الذكاء الاصطناعي أونلاين' : 'Ask Online AI'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              {lang === 'ar'
                ? 'ملاحظة الخصوصية: الضغط على "اسأل الذكاء الاصطناعي أونلاين" فقط هو ما يرسل وصف الحادثة والقراءات الحية للتحليل السحابي عند توفره.'
                : 'Privacy Notice: Cloud AI synthesis runs ONLY when you explicitly click "Ask Online AI".'}
            </p>

            {/* Assistant Output Card */}
            {assistantResult && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 mt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-cyan-400 block">
                      {lang === 'ar' ? 'كارت أقرب حالة مطابقة:' : 'Closest Matched Scenario:'}
                    </span>
                    <h4 className="text-sm font-bold text-white font-mono">
                      {assistantResult.closest_match.protocol_code} — {lang === 'ar' ? assistantResult.closest_match.title_ar : assistantResult.closest_match.title_en}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {Math.round(assistantResult.closest_match.confidence * 100)}% Match
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {assistantResult.engine_used}
                    </span>
                  </div>
                </div>

                {assistantResult.ai_summary && (
                  <p className="text-xs text-cyan-200 bg-blue-950/40 border border-blue-500/30 rounded-lg p-2.5 leading-relaxed">
                    {assistantResult.ai_summary}
                  </p>
                )}

                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-emerald-400 block">
                    {lang === 'ar' ? `خطوات التعامل الفورية لـ ${assistantResult.astronaut_name_ar} (حد أقصى 5 خطوات):` : `Concise Response Steps for ${assistantResult.astronaut_name}:`}
                  </span>
                  <ol className="space-y-1.5 text-xs text-slate-200 list-decimal list-inside">
                    {(assistantResult.steps || []).map((st, idx) => (
                      <li key={idx} className="leading-relaxed">{st}</li>
                    ))}
                  </ol>
                </div>

                {assistantResult.emergency_procedure && (
                  <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500 text-xs text-red-200 font-bold flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{assistantResult.emergency_procedure}</span>
                  </div>
                )}

                {assistantResult.required_kit_items?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                    <span className="text-amber-300 flex items-center gap-1 font-bold">
                      <BriefcaseMedical className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'أدوات الصندوق المطلوبة:' : 'Required Kit:'}
                    </span>
                    {assistantResult.required_kit_items.map(k => (
                      <span key={k.code} className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30">
                        {k.code}: {lang === 'ar' ? k.name_ar : k.name_en} ({k.quantity})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. AUTOMATIC CLINICAL BASELINE & PHYSIOLOGY SYNTHESIS */}
          <div className="flex flex-wrap items-center justify-between bg-space-900 border border-slate-800 rounded-xl p-3.5 text-xs font-mono">
            <div>
              <span className="text-slate-400">{lang === 'ar' ? 'التقييم التلقائي للرائد: ' : 'Target Astronaut Assessment: '}</span>
              <strong className="text-white">
                {selectedAstronaut.id} — {lang === 'ar' ? selectedAstronaut.name_ar : selectedAstronaut.name}
              </strong>
            </div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="mt-2 sm:mt-0 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{lang === 'ar' ? 'تحديث التحليل' : 'Refresh Assessment'}</span>
            </button>
          </div>

          {advice && (
            <div className="space-y-3">
              <div className="bg-space-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  {lang === 'ar' ? 'التقييم السريري للقياسات الحالية:' : 'Live Biometric Clinical Assessment:'}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {lang === 'ar' ? advice.summary_ar : advice.summary_en}
                </p>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {lang === 'ar' ? 'التوجيهات والخطوات المباشرة:' : 'Actionable Directives:'}
                </span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {(lang === 'ar' ? advice.recommendations_ar : advice.recommendations_en).map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
