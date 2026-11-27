import React from 'react';
import { Package, AlertTriangle, CheckCircle2, MinusCircle, RotateCcw, MapPin, Calendar } from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const MedicalKitTab = () => {
  const { lang, medicalKit, dispenseMedicalKitItem, alerts } = useAstro();

  const activeAlert = alerts?.[0];
  const sortedKit = [...(medicalKit || [])].sort((a, b) => (b.is_required ? 1 : 0) - (a.is_required ? 1 : 0));

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-cyan-400 border border-blue-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-mono text-white">
              {lang === 'ar' ? 'صندوق الإسعافات الأولية الذكي (12 صنفاً)' : 'Smart Onboard Medical Kit Inventory (12 Items)'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'يرتبط تلقائياً بالتنبيهات النشطة لإبراز الأدوات والأجهزة المطلوبة للبروتوكول الطبي.'
                : 'Dynamically highlights required medical hardware & supplies mapped to active alert protocols.'}
            </p>
          </div>
        </div>

        {activeAlert ? (
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            {lang === 'ar'
              ? `مربوط حالياً بالبروتوكول: ${activeAlert.protocol_code}`
              : `Mapped to Active Protocol: ${activeAlert.protocol_code}`}
          </span>
        ) : (
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {lang === 'ar' ? 'كامل المخزون في وضع الاستعداد' : 'All Supplies Standby Nominal'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedKit.map((item) => {
          const pct = item.max_quantity > 0 ? Math.round((item.quantity / item.max_quantity) * 100) : 0;
          const isLow = item.quantity <= 1;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                item.is_required
                  ? 'bg-red-950/35 border-red-500 ring-2 ring-red-500/50 shadow-xl shadow-red-600/15'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                        {item.code}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {lang === 'ar' ? item.category_ar : item.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1.5">
                      {lang === 'ar' ? item.name_ar : item.name_en}
                    </h3>
                  </div>

                  {item.is_required && (
                    <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse shrink-0">
                      {lang === 'ar' ? 'مطلوب الآن' : 'REQUIRED'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  {lang === 'ar' ? item.usage_notes_ar : item.usage_notes_en}
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-400" /> {item.location_bay}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-amber-400" /> Exp: {item.expiry_date}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{lang === 'ar' ? 'المتوفر:' : 'Stock:'}</span>
                  <strong className={isLow ? 'text-red-400' : 'text-emerald-300'}>
                    {item.quantity} / {item.max_quantity} {lang === 'ar' ? item.unit_ar : item.unit}
                  </strong>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${isLow ? 'bg-red-500' : 'bg-cyan-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => dispenseMedicalKitItem(item.id, false)}
                    disabled={item.quantity <= 0}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'ar' ? 'صرف وحدة (-1)' : 'Use (-1)'}</span>
                  </button>
                  <button
                    onClick={() => dispenseMedicalKitItem(item.id, true)}
                    disabled={item.quantity >= item.max_quantity}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-400 text-xs font-mono flex items-center gap-1 cursor-pointer"
                    title="Restock"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
