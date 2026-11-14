import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { TRANSLATIONS } from '../utils/translations';

const AstroContext = createContext(null);

// Deterministic NASA Reference Scenario Presets for Instant Reactive UI
const SCENARIO_PRESETS = {
  '0': {
    vitals: {
      heart_rate: 68.0,
      systolic_bp: 116.0,
      diastolic_bp: 72.0,
      spo2: 97.0,
      respiratory_rate: 15.0,
      body_temperature: 36.9,
      cabin_co2: 3.2,
      hrv_rmssd: 50.0,
      daily_radiation: 0.55,
      sleep_duration: 6.8,
      exercise_hours: 2.5,
      status: 'normal'
    }
  },
  '1': {
    vitals: {
      heart_rate: 131.0,
      systolic_bp: 138.0,
      diastolic_bp: 82.0,
      spo2: 90.0,
      respiratory_rate: 27.0,
      body_temperature: 36.9,
      cabin_co2: 3.2,
      hrv_rmssd: 45.0,
      daily_radiation: 0.55,
      sleep_duration: 6.8,
      exercise_hours: 2.5,
      status: 'critical'
    }
  },
  '2': {
    vitals: {
      heart_rate: 84.0,
      systolic_bp: 112.0,
      diastolic_bp: 71.0,
      spo2: 98.0,
      respiratory_rate: 16.0,
      body_temperature: 38.33,
      cabin_co2: 3.2,
      hrv_rmssd: 48.0,
      daily_radiation: 0.55,
      sleep_duration: 6.8,
      exercise_hours: 2.5,
      status: 'critical'
    }
  },
  '3': {
    vitals: {
      heart_rate: 74.0,
      systolic_bp: 115.0,
      diastolic_bp: 72.0,
      spo2: 97.2,
      respiratory_rate: 16.0,
      body_temperature: 36.8,
      sleep_duration: 4.2,
      hrv_rmssd: 22.0,
      cabin_co2: 3.2,
      daily_radiation: 0.55,
      exercise_hours: 2.5,
      status: 'warning'
    }
  },
  '4': {
    vitals: {
      heart_rate: 76.0,
      systolic_bp: 120.0,
      diastolic_bp: 75.0,
      spo2: 96.5,
      respiratory_rate: 18.0,
      body_temperature: 36.9,
      cabin_co2: 5.8,
      hrv_rmssd: 40.0,
      daily_radiation: 0.55,
      sleep_duration: 6.8,
      exercise_hours: 2.5,
      status: 'warning'
    }
  },
  '5': {
    vitals: {
      heart_rate: 0.0,
      systolic_bp: 0.0,
      diastolic_bp: 0.0,
      spo2: 60.0,
      respiratory_rate: 0.0,
      body_temperature: 36.5,
      cabin_co2: 3.2,
      hrv_rmssd: 0.0,
      daily_radiation: 0.55,
      sleep_duration: 6.8,
      exercise_hours: 2.5,
      status: 'emergency'
    }
  }
};

export const AstroProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('astrovitals_lang') || 'ar');
  const [bootstrap, setBootstrap] = useState(null);
  const [astronauts, setAstronauts] = useState([]);
  const [selectedAstronautId, setSelectedAstronautId] = useState('AST-02'); // Eng. Omar
  const [location, setLocation] = useState('ISS');
  const [activity, setActivity] = useState('light');
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState('0'); // Default to Nominal scenario!
  const [currentVitals, setCurrentVitals] = useState(SCENARIO_PRESETS['0'].vitals);
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
  };

  // Load bootstrap on mount
  const loadBootstrap = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getBootstrap();
      setBootstrap(data);
      setAstronauts(data.astronauts || []);

      // In initial nominal mode, start with 0 alerts and nominal vitals
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

  // Change astronaut handler
  const changeAstronaut = (id) => {
    setSelectedAstronautId(id);
    const ast = astronauts.find(a => a.id === id);
    if (ast && (activeScenario === '0' || !activeScenario)) {
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
      setAlerts([]);
    }
  };

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

  // IMMEDIATE DETERMINISTIC SCENARIO TRIGGER (Zero-Latency UI Reaction)
  // Astronaut and Activity remain strictly fixed on the user's manual selection
  const triggerScenario = async (scenarioId, mode = 'cardiac_arrest') => {
    const scKey = String(scenarioId);
    setActiveScenario(scKey);

    // 1. INSTANT OPTIMISTIC STATE UPDATE
    const preset = SCENARIO_PRESETS[scKey];
    if (preset) {
      if (scKey === '0') {
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
            sleep_duration: ast.sleep_duration || 6.8,
            exercise_hours: ast.exercise_hours || 2.5,
            status: 'normal'
          });
        }
        setAlerts([]);
        setSelectedAlert(null);
        setIsAlertModalOpen(false);
      } else if (preset.vitals) {
        setCurrentVitals({
          ...preset.vitals
        });
      }
    }

    // 2. BACKEND SYNC (Persist to SQLite with the user's chosen astronaut and activity)
    try {
      const res = await apiClient.activateScenario(scKey, mode, selectedAstronautId, activity);
      if (res.current_reading) {
        setCurrentVitals(prev => ({
          ...prev,
          ...res.current_reading
        }));
      }
      if (scKey === '0') {
        setAlerts([]);
        setSelectedAlert(null);
      } else {
        await refreshAlerts();
        if (res.alert) {
          setSelectedAlert(res.alert);
        }
      }
    } catch (e) {
      console.warn(`Backend sync for scenario ${scKey} failed (using local reference preset):`, e);
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
        changeAstronaut,
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
        isSirenActive: false,
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
