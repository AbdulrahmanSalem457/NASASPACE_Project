import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { TRANSLATIONS } from '../utils/translations';

const AstroContext = createContext(null);

export const AstroProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('astrovitals_lang') || 'ar'); // Default to Arabic for user comfort
  const [bootstrap, setBootstrap] = useState(null);
  const [astronauts, setAstronauts] = useState([]);
  const [selectedAstronautId, setSelectedAstronautId] = useState('AST-02'); // Eng. Omar
  const [location, setLocation] = useState('ISS');
  const [activity, setActivity] = useState('light');
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [activeScenario, setActiveScenario] = useState('0'); // Default to Nominal scenario!
  const [currentVitals, setCurrentVitals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commCountdown, setCommCountdown] = useState(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // Translation accessor
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    localStorage.setItem('astrovitals_lang', next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Load bootstrap on mount
  const loadBootstrap = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getBootstrap();
      setBootstrap(data);
      setAstronauts(data.astronauts || []);

      // Initialize with Eng. Omar (AST-02) nominal baselines
      const defaultAst = (data.astronauts || []).find(a => a.id === 'AST-02') || data.astronauts?.[0];
      if (defaultAst) {
        setCurrentVitals({
          heart_rate: defaultAst.hr_mean,
          systolic_bp: defaultAst.sys_bp_mean,
          diastolic_bp: defaultAst.dia_bp_mean,
          spo2: defaultAst.spo2_mean,
          respiratory_rate: defaultAst.resp_rate_mean,
          body_temperature: defaultAst.body_temp_mean,
          cabin_co2: defaultAst.cabin_co2 || 3.2,
          hrv_rmssd: defaultAst.hrv_rmssd || 48.0,
          daily_radiation: defaultAst.daily_radiation || 0.58,
          status: 'normal'
        });
      }

      // In initial nominal mode, start with 0 alerts
      setAlerts([]);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load bootstrap data:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const selectedAstronaut = astronauts.find(a => a.id === selectedAstronautId) || astronauts[0] || null;

  // Whenever astronaut changes, update currentVitals if in nominal mode
  useEffect(() => {
    if (selectedAstronaut && (activeScenario === '0' || !activeScenario)) {
      setCurrentVitals({
        heart_rate: selectedAstronaut.hr_mean,
        systolic_bp: selectedAstronaut.sys_bp_mean,
        diastolic_bp: selectedAstronaut.dia_bp_mean,
        spo2: selectedAstronaut.spo2_mean,
        respiratory_rate: selectedAstronaut.resp_rate_mean,
        body_temperature: selectedAstronaut.body_temp_mean,
        cabin_co2: selectedAstronaut.cabin_co2 || 3.2,
        hrv_rmssd: selectedAstronaut.hrv_rmssd || 50.0,
        daily_radiation: selectedAstronaut.daily_radiation || 0.55,
        status: 'normal'
      });
      setAlerts([]);
    }
  }, [selectedAstronautId]);

  // Sync activity & location changes
  const changeActivity = async (newAct) => {
    setActivity(newAct);
    if (selectedAstronautId) {
      try {
        await apiClient.updateAstronautSettings(selectedAstronautId, { activity: newAct });
      } catch (e) {
        console.warn('Could not sync activity:', e);
      }
    }
  };

  const changeLocation = async (newLoc) => {
    setLocation(newLoc);
    if (selectedAstronautId) {
      try {
        await apiClient.updateAstronautSettings(selectedAstronautId, { mission_location: newLoc });
      } catch (e) {
        console.warn('Could not sync location:', e);
      }
    }
  };

  const refreshAlerts = async () => {
    try {
      const data = await apiClient.getAlerts();
      setAlerts(data);
      if (selectedAlert) {
        const updated = data.find(a => a.id === selectedAlert.id);
        if (updated) setSelectedAlert(updated);
      }
    } catch (e) {
      console.warn('Could not refresh alerts:', e);
    }
  };

  const openAlertModal = (alert) => {
    setSelectedAlert(alert || alerts[0]);
    setIsAlertModalOpen(true);
  };

  const closeAlertModal = () => {
    setIsAlertModalOpen(false);
  };

  const toggleSirenSound = () => {};

  const updateChecklistStep = async (stepNum, completed, note = '') => {
    if (!selectedAlert) return;
    try {
      const updatedAlert = await apiClient.updateChecklistStep(selectedAlert.id, stepNum, completed, note);
      setSelectedAlert(updatedAlert);
      refreshAlerts();
    } catch (e) {
      console.error('Error updating checklist:', e);
    }
  };

  const contactFlightSurgeon = async () => {
    if (!selectedAlert) return;
    setIsTransmitting(true);

    const locCfg = bootstrap?.mission_locations?.[location] || { comm_delay_seconds: 1 };
    let secondsToSimulate = Math.min(5, Math.max(1, Math.round(locCfg.comm_delay_seconds)));
    if (location === 'Mars') secondsToSimulate = 5;

    setCommCountdown(secondsToSimulate);

    const interval = setInterval(() => {
      setCommCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          finishTransmission();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    const finishTransmission = async () => {
      try {
        const res = await apiClient.contactSurgeon(selectedAlert.id);
        setSelectedAlert(res.alert);
        refreshAlerts();
      } catch (e) {
        console.error('Failed to contact surgeon:', e);
      } finally {
        setIsTransmitting(false);
      }
    };
  };

  const triggerScenario = async (scenarioId, mode = 'cardiac_arrest') => {
    try {
      setActiveScenario(scenarioId);

      // SCENARIO 0: NOMINAL / ALL NORMAL
      if (scenarioId === '0' || scenarioId === 'nominal') {
        setIsAlertModalOpen(false);

        await apiClient.activateScenario('0');
        const ast = selectedAstronaut || astronauts[0];
        if (ast) {
          setCurrentVitals({
            heart_rate: ast.hr_mean,
            systolic_bp: ast.sys_bp_mean,
            diastolic_bp: ast.dia_bp_mean,
            spo2: ast.spo2_mean,
            respiratory_rate: ast.resp_rate_mean,
            body_temperature: ast.body_temp_mean,
            cabin_co2: ast.cabin_co2 || 3.2,
            hrv_rmssd: ast.hrv_rmssd || 50.0,
            daily_radiation: ast.daily_radiation || 0.55,
            status: 'normal'
          });
        }
        setAlerts([]);
        setSelectedAlert(null);
        return;
      }

      // NON-NOMINAL SCENARIOS
      const res = await apiClient.activateScenario(scenarioId, mode);

      if (res.astronaut) {
        setSelectedAstronautId(res.astronaut.id);
        if (res.astronaut.current_activity) setActivity(res.astronaut.current_activity);
      }

      // VITAL READINGS UPDATE DIRECTLY ON THE CARDS!
      if (res.current_reading) {
        setCurrentVitals(prev => ({
          ...prev,
          ...res.current_reading
        }));
      }

      await refreshAlerts();

      if (res.alert) {
        setSelectedAlert(res.alert);
      }
    } catch (e) {
      console.error(`Error activating scenario ${scenarioId}:`, e);
    }
  };

  const resetNominal = () => triggerScenario('0');

  return (
    <AstroContext.Provider
      value={{
        lang,
        t,
        toggleLanguage,
        bootstrap,
        astronauts,
        selectedAstronaut,
        selectedAstronautId,
        setSelectedAstronautId,
        location,
        changeLocation,
        activity,
        changeActivity,
        alerts,
        refreshAlerts,
        selectedAlert,
        isAlertModalOpen,
        openAlertModal,
        closeAlertModal,
        isSirenActive,
        toggleSirenSound,
        activeScenario,
        triggerScenario,
        resetNominal,
        currentVitals,
        setCurrentVitals,
        updateChecklistStep,
        contactFlightSurgeon,
        isTransmitting,
        commCountdown,
        isLoading,
        error
      }}
    >
      {children}
    </AstroContext.Provider>
  );
};

export const useAstro = () => {
  const context = useContext(AstroContext);
  if (!context) throw new Error('useAstro must be used within an AstroProvider');
  return context;
};
