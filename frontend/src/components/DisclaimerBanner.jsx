import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const DisclaimerBanner = ({ inline = false }) => {
  const { lang, t } = useAstro();

  return (
    <div className={`w-full border-b ${inline ? 'border-amber-600/30 bg-amber-950/40 rounded-lg p-3 my-3' : 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-amber-500/40 px-4 py-2 sticky top-0 z-50 shadow-md backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3 text-xs sm:text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-semibold shrink-0">
          <ShieldAlert className="w-4 h-4 animate-pulse text-amber-400 shrink-0" />
          <span className="uppercase tracking-wider font-mono text-[11px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
            {lang === 'ar' ? 'تنبيه إلزامي' : 'MANDATORY DISCLAIMER'}
          </span>
        </div>

        <div className="flex-1 text-slate-300 leading-relaxed font-sans text-[11px] sm:text-xs">
          {lang === 'ar' ? (
            <span>
              <strong className="text-amber-300">تنبيه:</strong> البيانات والإجراءات تجريبية (Synthetic / Simulated Data) ومبنية على مبادئ عامة في الطب الفضائي لأغراض العرض التجريبي فقط، وليست بروتوكولات رسمية من ناسا أو نصيحة طبية. القرار الطبي النهائي يعود لمسؤول الطاقم الطبي (CMO) وطبيب الرحلة.
            </span>
          ) : (
            <span>
              <strong className="text-amber-300">Synthetic / Simulated Data & Procedures:</strong> Built on general space physiology principles for NASA Space Apps Challenge demonstration only — not official NASA protocols or medical advice. Final medical decisions belong to the Crew Medical Officer (CMO) and Flight Surgeon.
            </span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700 shrink-0">
          <span>NASA Space Apps 2026</span>
        </div>
      </div>
    </div>
  );
};
