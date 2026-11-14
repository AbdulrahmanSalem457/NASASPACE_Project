import React, { useState } from 'react';
import { useAstro } from './context/AstroContext';
import { Navbar } from './components/Navbar';
import { SidebarDrawer } from './components/SidebarDrawer';
import { AlertFeed } from './components/AlertFeed';
import { VitalsCardGrid } from './components/VitalsCardGrid';
import { SecondaryMetricsBar } from './components/SecondaryMetricsBar';
import { TelemetryCharts } from './components/TelemetryCharts';
import { AnatomicalModel } from './components/AnatomicalModel';
import { ProtocolsBrowser } from './components/ProtocolsBrowser';
import { HealthReportsTab } from './components/HealthReportsTab';
import { AlertModal } from './components/AlertModal';
import { AIAdvisorModal } from './components/AIAdvisorModal';
import { CrewMatrixModal } from './components/CrewMatrixModal';

export const App = () => {
  const { lang, t, isLoading, error } = useAstro();
  const [activeTab, setActiveTab] = useState('vitals'); // 'vitals' | 'charts' | 'anatomy' | 'protocols' | 'reports'
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
      
      {/* 1. TOP NAVBAR WITH WIDGET NAVIGATION TABS */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onOpenAiAdvisor={() => setIsAiModalOpen(true)}
        onOpenCrewMatrix={() => setIsCrewModalOpen(true)}
      />

      {/* 2. SIDEBAR DRAWER (HAMBURGER MENU FOR SCENARIOS, ASTRONAUT, LOCATION, ACTIVITY) */}
      <SidebarDrawer 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 3. MAIN CONTENT AREA - ACTIVE WIDGET DISPLAY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Active Medical Alerts Banner & Notification */}
        <AlertFeed />

        {/* Selected Widget Content */}
        <div className="transition-all duration-300">
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              <VitalsCardGrid />
              <SecondaryMetricsBar />
            </div>
          )}

          {activeTab === 'charts' && (
            <div>
              <TelemetryCharts />
            </div>
          )}

          {activeTab === 'anatomy' && (
            <div>
              <AnatomicalModel />
            </div>
          )}

          {activeTab === 'protocols' && (
            <div>
              <ProtocolsBrowser />
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <HealthReportsTab />
            </div>
          )}
        </div>
      </main>

      {/* Emergency Alert Command Modal */}
      <AlertModal />

      {/* AI Clinical Advisor Modal */}
      <AIAdvisorModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
      />

      {/* Crew Responsibility Matrix Modal */}
      <CrewMatrixModal 
        isOpen={isCrewModalOpen} 
        onClose={() => setIsCrewModalOpen(false)} 
      />

      {/* Footer */}
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
            <span>
              {lang === 'ar'
                ? 'معمارية برمجية منفصلة: دجانجو ريست (الخادم) + رياكت (الواجهة)'
                : 'Decoupled Django REST + React Architecture'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

