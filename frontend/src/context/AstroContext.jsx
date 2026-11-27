import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../api/client';
import { TRANSLATIONS } from '../utils/translations';

const AstroContext = createContext(null);

const SCENARIO_PRESETS = {
  '0': {
    vitals: {
      heart_rate: 68.0, systolic_bp: 116.0, diastolic_bp: 72.0,
      spo2: 97.0, respiratory_rate: 15.0, body_temperature: 36.9,
      cabin_co2: 3.2, hrv_rmssd: 52.0, daily_radiation: 0.55,
      sleep_duration: 6.8, exercise_hours: 2.5, ecg_qtc: 415,
      cabin_pressure: 14.7, ecg_rhythm: 'Normal Sinus', status: 'normal'
    }
  },
  '1': {
    vitals: {
      heart_rate: 131.0, systolic_bp: 138.0, diastolic_bp: 82.0,
      spo2: 90.0, respiratory_rate: 27.0, body_temperature: 36.9,
      cabin_co2: 3.2, hrv_rmssd: 32.0, daily_radiation: 0.55,
      sleep_duration: 6.8, exercise_hours: 2.5, ecg_qtc: 445,
      cabin_pressure: 14.7, ecg_rhythm: 'Sinus Tachycardia', status: 'critical'
    }
  },
  '2': {
    vitals: {
      heart_rate: 84.0, systolic_bp: 112.0, diastolic_bp: 71.0,
      spo2: 98.0, respiratory_rate: 16.0, body_temperature: 38.33,
      cabin_co2: 3.2, hrv_rmssd: 40.0, daily_radiation: 0.55,
      sleep_duration: 6.8, exercise_hours: 2.5, ecg_qtc: 420,
      cabin_pressure: 14.7, ecg_rhythm: 'Normal Sinus', status: 'critical'
    }
  },
  '3': {
    vitals: {
      heart_rate: 74.0, systolic_bp: 115.0, diastolic_bp: 72.0,
      spo2: 97.2, respiratory_rate: 16.0, body_temperature: 36.8,
      sleep_duration: 4.2, hrv_rmssd: 22.0, cabin_co2: 3.2,
      daily_radiation: 0.55, exercise_hours: 2.5, ecg_qtc: 430,
      cabin_pressure: 14.7, ecg_rhythm: 'Normal Sinus', status: 'warning'
    }
  },
  '4': {
    vitals: {
      heart_rate: 76.0, systolic_bp: 120.0, diastolic_bp: 75.0,
      spo2: 96.5, respiratory_rate: 18.0, body_temperature: 36.9,
      cabin_co2: 5.8, hrv_rmssd: 40.0, daily_radiation: 0.55,
      sleep_duration: 6.8, exercise_hours: 2.5, ecg_qtc: 415,
      cabin_pressure: 14.7, ecg_rhythm: 'Normal Sinus', status: 'warning'
    }
  },
  '5': {
    vitals: {
      heart_rate: 0.0, systolic_bp: 0.0, diastolic_bp: 0.0,
      spo2: 60.0, respiratory_rate: 0.0, body_temperature: 36.5,
      cabin_co2: 3.2, hrv_rmssd: 0.0, daily_radiation: 0.55,
      sleep_duration: 6.8, exercise_hours: 2.5, ecg_qtc: 520,
      cabin_pressure: 14.7, ecg_rhythm: 'Ventricular Arrest / Asystole', status: 'emergency'
    }
  }
};

/**
 * Mirrors Backend Global Status Engine on the client for instant 0ms UI reactivity
 * (Never returns 'normal' if CO2, Radiation, QTc, HRV, Sleep, or Cabin Pressure are abnormal)
 */
export const computeLocalGlobalEvaluation = (vitals, astronaut, activity = 'light') => {
  if (!vitals) return { status: 'normal', riskScore: 5, readiness: 'GO', factors: [] };

  const hr = Number(vitals.heart_rate ?? 68);
  const sys = Number(vitals.systolic_bp ?? 116);
  const dia = Number(vitals.diastolic_bp ?? 72);
  const spo2 = Number(vitals.spo2 ?? 97.5);
  const rr = Number(vitals.respiratory_rate ?? 15);
  const temp = Number(vitals.body_temperature ?? 36.8);
  const co2 = Number(vitals.cabin_co2 ?? 3.2);
  const rad = Number(vitals.daily_radiation ?? 0.55);
  const qtc = Number(vitals.ecg_qtc ?? 415);
  const hrv = Number(vitals.hrv_rmssd ?? 50);
  const sleep = Number(vitals.sleep_duration ?? 6.8);
  const pressure = Number(vitals.cabin_pressure ?? 14.7);

  let rank = 0; // 0=normal, 1=notice, 2=warning, 3=critical, 4=emergency
  let risk = 5;
  const factors = [];

  const bump = (lvlRank, pts, label_en, label_ar) => {
    if (lvlRank > rank) rank = lvlRank;
    risk += pts;
    factors.push({ severity: lvlRank >= 3 ? 'critical' : 'warning', points: pts, label_en, label_ar });
  };

  if (hr < 25 || rr < 5) {
    rank = 4;
    risk = 99;
    factors.push({ severity: 'emergency', points: 95, label_en: 'Cardiac / Respiratory Arrest', label_ar: 'توقف القلب أو التنفس' });
  } else {
    const isExercise = activity === 'exercise' || activity === 'eva';
    const hrCritHigh = isExercise ? 175 : 110;
    const hrWarnHigh = isExercise ? 156 : 91;

    if (hr > hrCritHigh || hr < 40) bump(3, 25, `Heart Rate critical (${hr} bpm)`, `نبض القلب حرج (${hr})`);
    else if (hr >= hrWarnHigh || hr < 50) bump(2, 14, `Heart Rate elevated (${hr} bpm)`, `نبض القلب خارج النطاق (${hr})`);

    if (spo2 < 90.0) bump(3, 28, `Critical Hypoxia (SpO2 ${spo2}%)`, `نقص أكسجين حرج (${spo2}%)`);
    else if (spo2 < 95.0) bump(2, 14, `Low SpO2 (${spo2}%)`, `انخفاض SpO2 (${spo2}%)`);

    if (rr > (isExercise ? 40 : 24) || rr < 10) bump(3, 22, `Critical Respiratory Rate (${rr}/min)`, `معدل تنفس حرج (${rr})`);
    else if (rr >= (isExercise ? 36 : 21) || rr < 12) bump(2, 12, `Elevated Respiratory Rate (${rr}/min)`, `ارتفاع معدل التنفس (${rr})`);

    if (temp > 38.3 || temp < 35.5) bump(3, 25, `Space Fever / Critical Temp (${temp}°C)`, `حرارة حرجة (${temp}°م)`);
    else if (temp > 37.5 || temp < 36.1) bump(2, 12, `Elevated Temperature (${temp}°C)`, `ارتفاع حرارة (${temp}°م)`);

    if (sys > 145 || sys < 85) bump(3, 20, `Critical Systolic BP (${sys} mmHg)`, `ضغط انقباضي حرج (${sys})`);
    else if (sys > 130 || sys < 95) bump(2, 10, `Systolic BP warning (${sys} mmHg)`, `تحذير الضغط الانقباضي (${sys})`);

    if (dia > 95 || dia < 50) bump(3, 18, `Critical Diastolic BP (${dia} mmHg)`, `ضغط انبساطي حرج (${dia})`);
    else if (dia > 85 || dia < 55) bump(2, 9, `Diastolic BP warning (${dia} mmHg)`, `تحذير الضغط الانبساطي (${dia})`);
  }

  // Contextual / Environmental metrics ALWAYS contribute to Global Status Engine
  if (co2 > 7.5) bump(3, 24, `Critical Cabin CO2 (${co2} mmHg)`, `ارتفاع حرج لـ CO2 بالكابينة (${co2})`);
  else if (co2 > 5.3) bump(2, 14, `Elevated Cabin CO2 (${co2} mmHg)`, `ارتفاع CO2 بالكابينة (${co2})`);

  if (rad > 2.5) bump(3, 26, `Solar Radiation Storm (${rad} mSv/day)`, `عاصفة إشعاعية حرجة (${rad} mSv)`);
  else if (rad > 1.2) bump(2, 13, `Elevated Radiation (${rad} mSv/day)`, `ارتفاع الإشعاع (${rad} mSv)`);

  if (qtc > 500) bump(3, 24, `Critical QTc (${qtc} ms)`, `استطالة QTc حرجة (${qtc} ms)`);
  else if (qtc >= 450) bump(2, 12, `Borderline QTc (${qtc} ms)`, `تحذير QTc (${qtc} ms)`);

  if (hrv > 0 && hrv < 15) bump(3, 20, `Acute Low HRV (${hrv} ms)`, `هبوط حرج في HRV (${hrv} ms)`);
  else if (hrv > 0 && hrv < 25) bump(2, 11, `Fatigue Low HRV (${hrv} ms)`, `انخفاض HRV (${hrv} ms)`);

  if (sleep < 5.0) bump(2, 12, `Sleep Deficit (${sleep} hrs)`, `نقص نوم (${sleep} ساعة)`);

  if (pressure < 13.5 || pressure > 15.5) bump(3, 30, `Critical Cabin Pressure (${pressure} psi)`, `خلل ضغط الكابينة (${pressure} psi)`);
  else if (pressure < 14.2) bump(2, 14, `Low Cabin Pressure (${pressure} psi)`, `انخفاض ضغط الكابينة (${pressure} psi)`);

  const statusNames = ['normal', 'notice', 'warning', 'critical', 'emergency'];
  const status = statusNames[rank] || 'normal';
  const riskScore = Math.max(0, Math.min(100, risk));
  const readiness = rank >= 3 || riskScore >= 60 ? 'HOLD' : rank >= 1 || riskScore >= 30 ? 'GO_WITH_CAUTION' : 'GO';

  return { status, riskScore, readiness, factors };
};

export const AstroProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('astrovitals_lang') || 'ar');
  const [bootstrap, setBootstrap] = useState(null);
  const [astronauts, setAstronauts] = useState([]);
  const [selectedAstronautId, setSelectedAstronautId] = useState('AST-02');
  const [location, setLocation] = useState('ISS');
  const [activity, setActivity] = useState('light');
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState('0');
  const [currentVitals, setCurrentVitals] = useState(SCENARIO_PRESETS['0'].vitals);
  const [evaluation, setEvaluation] = useState(null);
  const [medicalKit, setMedicalKit] = useState([]);
  const [evaPlans, setEvaPlans] = useState([]);
  const [radiationBudgets, setRadiationBudgets] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingSliders, setIsSyncingSliders] = useState(false);
  const [error, setError] = useState(null);
  const [commCountdown, setCommCountdown] = useState(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem('astrovitals_notify') === 'true'
  );
  const lastNotifiedRef = useRef({ key: '', time: 0 });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    localStorage.setItem('astrovitals_lang', next);
  };

  // Browser Notifications Handler (rate-limited)
  const toggleNotifications = async () => {
    if (!('Notification' in window)) return;
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem('astrovitals_notify', 'false');
      return;
    }
    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }
    if (perm === 'granted') {
      setNotificationsEnabled(true);
      localStorage.setItem('astrovitals_notify', 'true');
      new Notification('AstroVitals AI', {
        body: lang === 'ar'
          ? 'تم تفعيل تنبيهات المتصفح الطبية بنجاح.'
          : 'Browser medical notifications enabled.',
      });
    }
  };

  const fireBrowserNotification = useCallback((alertObj, globalLvl) => {
    if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    if (!alertObj || globalLvl === 'normal') return;

    const now = Date.now();
    const alertKey = `${alertObj.astronaut || alertObj.astronaut_id}-${alertObj.protocol_code}-${globalLvl}`;
    if (lastNotifiedRef.current.key === alertKey && (now - lastNotifiedRef.current.time) < 15000) {
      return;
    }
    lastNotifiedRef.current = { key: alertKey, time: now };

    const title = lang === 'ar'
      ? `[${globalLvl.toUpperCase()}] ${alertObj.title_ar}`
      : `[${globalLvl.toUpperCase()}] ${alertObj.title_en}`;
    const body = lang === 'ar' ? alertObj.summary_ar : alertObj.summary_en;

    try {
      const n = new Notification(title, { body });
      n.onclick = () => {
        window.focus();
        setSelectedAlert(alertObj);
        setIsAlertModalOpen(true);
      };
    } catch {
      // Ignore Notification constructor failures in restricted browser panes
    }
  }, [notificationsEnabled, lang]);

  const loadBootstrap = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getBootstrap();
      setBootstrap(data);
      const crew = data.astronauts || [];
      setAstronauts(crew);
      setMedicalKit(data.medical_kit || []);
      setEvaPlans(data.eva_plans || []);
      setRadiationBudgets(data.radiation_budgets || {});
      const initialAlerts = data.active_alerts || [];
      setAlerts(initialAlerts);

      const defaultAst = crew.find(a => a.id === 'AST-02') || crew[0];
      if (defaultAst && (!initialAlerts || initialAlerts.length === 0)) {
        setCurrentVitals({
          heart_rate: defaultAst.hr_mean,
          systolic_bp: defaultAst.sys_bp_mean,
          diastolic_bp: defaultAst.dia_bp_mean,
          spo2: defaultAst.spo2_mean,
          respiratory_rate: defaultAst.resp_rate_mean,
          body_temperature: defaultAst.body_temp_mean,
          cabin_co2: defaultAst.cabin_co2 || 3.2,
          hrv_rmssd: defaultAst.hrv_rmssd || 52.0,
          daily_radiation: defaultAst.daily_radiation || 0.55,
          sleep_duration: defaultAst.sleep_duration || 6.8,
          exercise_hours: defaultAst.exercise_hours || 2.5,
          ecg_qtc: defaultAst.ecg_qtc || 415,
          cabin_pressure: defaultAst.cabin_pressure || 14.7,
          ecg_rhythm: defaultAst.ecg_rhythm || 'Normal Sinus',
          status: 'normal'
        });
      }
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
  const localGlobal = computeLocalGlobalEvaluation(currentVitals, selectedAstronaut, activity);
  const globalStatus = evaluation?.status || localGlobal.status;
  const riskScore = evaluation?.risk_score ?? localGlobal.riskScore;
  const readinessStatus = evaluation?.readiness_status || localGlobal.readiness;

  const refreshMedicalKit = useCallback(async (protocolCode = null) => {
    try {
      const items = await apiClient.getMedicalKit(protocolCode);
      setMedicalKit(items);
    } catch (e) {
      console.warn('Could not refresh medical kit:', e);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      const data = await apiClient.getAlerts();
      setAlerts(data);
      if (selectedAlert) {
        const updated = data.find(a => a.id === selectedAlert.id);
        if (updated) setSelectedAlert(updated);
      }
      refreshMedicalKit(data[0]?.protocol_code || null);
    } catch (e) {
      console.warn('Could not refresh alerts:', e);
    }
  }, [selectedAlert, refreshMedicalKit]);

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
        hrv_rmssd: ast.hrv_rmssd || 52.0,
        daily_radiation: ast.daily_radiation || 0.55,
        sleep_duration: ast.sleep_duration || 6.8,
        exercise_hours: ast.exercise_hours || 2.5,
        ecg_qtc: ast.ecg_qtc || 415,
        cabin_pressure: ast.cabin_pressure || 14.7,
        ecg_rhythm: ast.ecg_rhythm || 'Normal Sinus',
        status: 'normal'
      });
      setEvaluation(null);
    }
  };

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

  const openAlertModal = (alert) => {
    setSelectedAlert(alert || alerts[0]);
    setIsAlertModalOpen(true);
  };

  const closeAlertModal = () => {
    setIsAlertModalOpen(false);
  };

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

  // Interactive Live Sliders Sync (Frontend + Real Backend Global Status Engine)
  const applyLiveSliders = async (nextVitals, { syncBackend = true } = {}) => {
    setActiveScenario('custom');
    const merged = { ...currentVitals, ...nextVitals };
    setCurrentVitals(merged);

    if (!syncBackend || !selectedAstronautId) return;

    try {
      setIsSyncingSliders(true);
      const res = await apiClient.logVital({
        astronaut_id: selectedAstronautId,
        activity,
        heart_rate: Number(merged.heart_rate),
        systolic_bp: Number(merged.systolic_bp),
        diastolic_bp: Number(merged.diastolic_bp),
        spo2: Number(merged.spo2),
        respiratory_rate: Number(merged.respiratory_rate),
        body_temperature: Number(merged.body_temperature),
        cabin_co2: Number(merged.cabin_co2 ?? 3.2),
        daily_radiation: Number(merged.daily_radiation ?? 0.55),
        ecg_qtc: Number(merged.ecg_qtc ?? 415),
        hrv_rmssd: Number(merged.hrv_rmssd ?? 52.0),
        sleep_duration: Number(merged.sleep_duration ?? 6.8),
        cabin_pressure: Number(merged.cabin_pressure ?? 14.7),
        replace_active: true,
        source: 'live_slider',
      });

      if (res.evaluation) setEvaluation(res.evaluation);
      if (res.radiation_budget) {
        setRadiationBudgets(prev => ({ ...prev, [selectedAstronautId]: res.radiation_budget }));
      }
      if (res.astronaut_profile) {
        setAstronauts(prev => prev.map(a => (a.id === selectedAstronautId ? res.astronaut_profile : a)));
      }
      if (res.alert) {
        setAlerts([res.alert]);
        setSelectedAlert(res.alert);
        fireBrowserNotification(res.alert, res.evaluation?.status);
        refreshMedicalKit(res.alert.protocol_code);
      } else {
        setAlerts([]);
        setSelectedAlert(null);
        refreshMedicalKit(null);
      }
    } catch (e) {
      console.warn('Live slider sync warning:', e);
    } finally {
      setIsSyncingSliders(false);
    }
  };

  const triggerScenario = async (scenarioId, mode = 'cardiac_arrest') => {
    const scKey = String(scenarioId);
    setActiveScenario(scKey);

    const preset = SCENARIO_PRESETS[scKey];
    if (preset) {
      if (scKey === '0') {
        const ast = selectedAstronaut || astronauts[0];
        if (ast) {
          setCurrentVitals({
            heart_rate: ast.hr_mean, systolic_bp: ast.sys_bp_mean, diastolic_bp: ast.dia_bp_mean,
            spo2: ast.spo2_mean, respiratory_rate: ast.resp_rate_mean, body_temperature: ast.body_temp_mean,
            cabin_co2: 3.2, hrv_rmssd: 52.0, daily_radiation: 0.55,
            sleep_duration: 6.8, exercise_hours: ast.exercise_hours || 2.5,
            ecg_qtc: 415, cabin_pressure: 14.7, ecg_rhythm: 'Normal Sinus', status: 'normal'
          });
        }
        setAlerts([]);
        setSelectedAlert(null);
        setEvaluation(null);
        setIsAlertModalOpen(false);
      } else if (preset.vitals) {
        setCurrentVitals({ ...preset.vitals });
      }
    }

    try {
      const res = await apiClient.activateScenario(scKey, mode, selectedAstronautId, activity);
      if (res.current_reading) {
        setCurrentVitals(prev => ({ ...prev, ...res.current_reading }));
      }
      if (res.evaluation) setEvaluation(res.evaluation);
      if (res.radiation_budget) {
        setRadiationBudgets(prev => ({ ...prev, [selectedAstronautId]: res.radiation_budget }));
      }
      if (res.astronaut) {
        setAstronauts(prev => prev.map(a => (a.id === res.astronaut.id ? res.astronaut : a)));
      }
      if (scKey === '0') {
        setAlerts([]);
        setSelectedAlert(null);
        refreshMedicalKit(null);
      } else if (res.alert) {
        setAlerts([res.alert]);
        setSelectedAlert(res.alert);
        fireBrowserNotification(res.alert, res.evaluation?.status || res.alert.level);
        refreshMedicalKit(res.alert.protocol_code);
      }
    } catch (e) {
      console.warn(`Backend sync for scenario ${scKey} failed:`, e);
    }
  };

  const resetNominal = () => triggerScenario('0');

  const dispenseMedicalKitItem = async (itemId, restock = false) => {
    try {
      const updated = await apiClient.useMedicalKitItem(itemId, 1, restock);
      setMedicalKit(prev => prev.map(i => (i.id === itemId ? updated : i)));
    } catch (e) {
      console.error('Failed to update medical kit item:', e);
    }
  };

  const addEvaPlan = async (payload) => {
    const plan = await apiClient.createEvaPlan(payload);
    setEvaPlans(prev => [plan, ...prev]);
    return plan;
  };

  const removeEvaPlan = async (planId) => {
    await apiClient.deleteEvaPlan(planId);
    setEvaPlans(prev => prev.filter(p => p.id !== planId));
  };

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
        activeScenario,
        triggerScenario,
        resetNominal,
        currentVitals,
        setCurrentVitals,
        applyLiveSliders,
        isSyncingSliders,
        evaluation,
        globalStatus,
        riskScore,
        readinessStatus,
        localGlobal,
        medicalKit,
        refreshMedicalKit,
        dispenseMedicalKitItem,
        evaPlans,
        addEvaPlan,
        removeEvaPlan,
        radiationBudgets,
        updateChecklistStep,
        contactFlightSurgeon,
        isTransmitting,
        commCountdown,
        notificationsEnabled,
        toggleNotifications,
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
