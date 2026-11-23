const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
const API_BASE = `${BACKEND_URL}/api`;

export const apiClient = {
  async getBootstrap() {
    const res = await fetch(`${API_BASE}/bootstrap/`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async getAstronautVitals(astronautId, range = '24h', limit = 1440) {
    const res = await fetch(`${API_BASE}/astronauts/${astronautId}/vitals/?range=${range}&limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async updateAstronautSettings(astronautId, settings) {
    const res = await fetch(`${API_BASE}/astronauts/${astronautId}/settings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async logVital(data) {
    const res = await fetch(`${API_BASE}/vitals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async getAlerts(astronautId = null, activeOnly = true) {
    let url = `${API_BASE}/alerts/?active_only=${activeOnly}`;
    if (astronautId) url += `&astronaut_id=${astronautId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async updateChecklistStep(alertId, stepNum, completed, note = '') {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/checklist/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_num: stepNum, completed, note })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async contactSurgeon(alertId) {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/contact-surgeon/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attach_telemetry: true })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async activateScenario(scenarioId, mode = 'cardiac_arrest', astronautId = null, activity = null) {
    const body = { mode };
    if (astronautId) body.astronaut_id = astronautId;
    if (activity) body.activity = activity;
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/activate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async getAiAdvice(payload) {
    const res = await fetch(`${API_BASE}/ai-advisor/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async getReports(astronautId, period = 'daily') {
    const res = await fetch(`${API_BASE}/reports/${astronautId}/?period=${period}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async uploadCsv(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/vitals/upload-csv/`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }
};
