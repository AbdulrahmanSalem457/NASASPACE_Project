import React, { useState } from 'react';
import { useAstro } from './context/AstroContext';
import { Navbar } from './components/Navbar';
import { SidebarDrawer } from './components/SidebarDrawer';
import { AlertFeed } from './components/AlertFeed';
import { VitalsCardGrid } from './components/VitalsCardGrid';
import { SecondaryMetricsBar } from './components/SecondaryMetricsBar';
import { TelemetrySlidersPanel } from './components/TelemetrySlidersPanel';
import { MissionReadinessTab } from './components/MissionReadinessTab';
import { MedicalKitTab } from './components/MedicalKitTab';
import { TelemetryCharts } from './components/TelemetryCharts';
import { AnatomicalModel } from './components/AnatomicalModel';
import { ProtocolsBrowser } from './components/ProtocolsBrowser';
import { HealthReportsTab } from './components/HealthReportsTab';
import { AlertModal } from './components/AlertModal';
import { AIAdvisorModal } from './components/AIAdvisorModal';
import { CrewMatrixModal } from './components/CrewMatrixModal';

export const App = () => {
  const { lang, isLoading } = useAstro();
  const [activeTab, setActiveTab] = useState('vitals');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center space-y-4 text-cyan-400 font-mono">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm tracking-widest uppercase">Connecting to Spacecraft Telemetry Bus...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onOpenAiAdvisor={() => setIsAiModalOpen(true)}
        onOpenCrewMatrix={() => setIsCrewModalOpen(true)}
      />

      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <AlertFeed />

        <div className="transition-all duration-300">
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              <TelemetrySlidersPanel />
              <VitalsCardGrid />
              <SecondaryMetricsBar />
            </div>
          )}

          {activeTab === 'readiness' && <MissionReadinessTab />}
          {activeTab === 'medkit' && <MedicalKitTab />}
          {activeTab === 'charts' && <TelemetryCharts />}
          {activeTab === 'anatomy' && <AnatomicalModel />}
          {activeTab === 'protocols' && <ProtocolsBrowser />}
          {activeTab === 'reports' && <HealthReportsTab />}
        </div>
      </main>

      <AlertModal />
      <AIAdvisorModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <CrewMatrixModal isOpen={isCrewModalOpen} onClose={() => setIsCrewModalOpen(false)} />

      <footer className="border-t border-slate-800/80 bg-space-900/60 py-6 px-4 text-xs font-mono text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span>
              {lang === 'ar'
                ? 'محرك القياسات الحيوية الفضائية AstroVitals AI — تحدي تطبيقات الفضاء من ناسا 2026'
                : 'AstroVitals AI Telemetry Engine — NASA Space Apps Challenge 2026'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <a href="/swagger/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
              Swagger API Docs
            </a>
            <span>•</span>
            <span>
              {lang === 'ar'
                ? 'محاكاة طبية تعليمية (ليست نصيحة طبية رسمية)'
                : 'Synthetic Spaceflight Telemetry Simulation'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
