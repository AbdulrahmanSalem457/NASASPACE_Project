import React from 'react';
import { 
  X, Users, UserCheck, Shield, HeartHandshake, Radio, 
  Crown, Stethoscope 
} from 'lucide-react';
import { useAstro } from '../context/AstroContext';

export const CrewMatrixModal = ({ isOpen, onClose }) => {
  const { lang, t, bootstrap } = useAstro();

  if (!isOpen) return null;

  const matrix = bootstrap?.crew_matrix || [];

  const roleIcons = {
    injured: UserCheck,
    first_responder: HeartHandshake,
    cmo: Stethoscope,
    flight_surgeon: Radio,
    mission_control: Shield,
    commander: Crown
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-backdrop-fade">
      <div className="w-full max-w-3xl my-auto bg-space-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-modal-pop">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-space-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                  NASA Emergency Operations
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                {lang === 'ar' ? 'مصفوفة مسؤوليات الطاقم الطبي في الطوارئ' : 'Crew Medical Emergency Responsibility Matrix'}
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
        <div className="p-4 sm:p-6 space-y-3 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matrix.map((item) => {
              const Icon = roleIcons[item.role_key] || Users;
              return (
                <div
                  key={item.role_key}
                  className="bg-space-900/90 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-space-850 text-cyan-400 border border-slate-700/60">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold font-mono text-white">
                        {lang === 'ar' ? item.title_ar : item.title_en}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {item.role_key.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1 border-t border-slate-800/80">
                    {lang === 'ar' ? item.responsibilities_ar : item.responsibilities_en}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
