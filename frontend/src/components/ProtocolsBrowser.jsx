import React, { useState } from 'react';
import { 
  ShieldAlert, Search, Filter, ChevronDown, ChevronUp, 
  Activity, CheckCircle2, AlertTriangle, Sparkles 
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const ProtocolsBrowser = () => {
  const { lang, t, bootstrap } = useAstro();
  const [search, setSearch] = useState('');
  const [expandedCode, setExpandedCode] = useState('PROT-01');

  const protocols = bootstrap?.protocols || [];

  const filtered = protocols.filter(p => {
    const term = search.toLowerCase();
    const titleMatch = (p.title_en || '').toLowerCase().includes(term) || (p.title_ar || '').includes(term);
    const codeMatch = (p.code || '').toLowerCase().includes(term);
    const catMatch = (p.category || '').toLowerCase().includes(term);
    return titleMatch || codeMatch || catMatch;
  });

  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-cyan-400 border border-blue-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              {lang === 'ar' ? 'دليل البروتوكولات الطبية الـ 14 المعتمدة' : '14 Condition-Specific Emergency Medical Protocols'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ar' ? 'معايير الإطلاق، الخطوات المباشرة، وقواعد التصعيد لطبيب الرحلة' : 'Clinical trigger criteria, immediate actions, and flight surgeon escalation rules'}
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالبروتوكول أو الرمز...' : 'Search protocols or codes...'}
            className="w-full bg-space-850 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono"
          />
        </div>
      </div>

      {/* Protocols Accordion List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((p) => {
          const isExpanded = expandedCode === p.code;
          return (
            <div
              key={p.code}
              className={`rounded-xl border transition-all ${
                isExpanded ? 'bg-space-850/90 border-blue-500/50' : 'bg-space-850/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => setExpandedCode(isExpanded ? null : p.code)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-cyan-400 border border-blue-500/30">
                    {p.code}
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white font-mono">
                      {lang === 'ar' ? p.title_ar : p.title_en}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Category: {p.category}
                    </span>
                  </div>
                </div>

                {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {isExpanded && (
                <div className="p-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs">
                  {/* Trigger Criteria */}
                  <div className="bg-space-900 border border-slate-800 rounded-lg p-3">
                    <span className="font-mono text-[11px] font-bold uppercase text-amber-400 block mb-1">
                      {lang === 'ar' ? 'معايير إطلاق الإنذار (Trigger Criteria):' : 'Trigger Criteria:'}
                    </span>
                    <p className="text-slate-300">
                      {lang === 'ar' ? p.trigger_criteria_ar : p.trigger_criteria_en}
                    </p>
                  </div>

                  {/* Immediate Actions */}
                  <div className="bg-space-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <span className="font-mono text-[11px] font-bold uppercase text-emerald-400 block">
                      {lang === 'ar' ? 'التدخلات والإجراءات الفورية الإلزامية:' : 'Immediate Action Checklist:'}
                    </span>
                    <ul className="space-y-1.5">
                      {(lang === 'ar' ? p.immediate_actions_ar : p.immediate_actions_en).map((act, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Escalation Rules */}
                  <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-3">
                    <span className="font-mono text-[11px] font-bold uppercase text-red-400 block mb-1">
                      {lang === 'ar' ? 'شروط التصعيد لطبيب الرحلة (Escalation Rules):' : 'Ground Flight Surgeon Escalation Rules:'}
                    </span>
                    <p className="text-slate-200">
                      {lang === 'ar' ? p.escalation_rules_ar : p.escalation_rules_en}
                    </p>
                  </div>

                  {/* Space Considerations */}
                  {p.space_considerations_en && (
                    <div className="bg-space-900 border border-slate-800 rounded-lg p-3">
                      <span className="font-mono text-[11px] font-bold uppercase text-cyan-400 block mb-1">
                        {lang === 'ar' ? 'اعتبارات الجاذبية الصغرى وطب الفضاء:' : 'Microgravity Spaceflight Considerations:'}
                      </span>
                      <p className="text-slate-300">
                        {lang === 'ar' ? p.space_considerations_ar : p.space_considerations_en}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
