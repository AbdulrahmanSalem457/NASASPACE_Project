# AstroVitals AI — Astronaut Health Monitoring & Medical Emergency Response System
### NASA Space Apps Challenge — "Create Health Monitoring Software for Astronauts on Space Missions"

---

> [!IMPORTANT]
> **Mandatory Research & Simulation Disclaimer (Bilingual):**
> * **EN:** *Synthetic / Simulated Data & Procedures: Built on general space physiology principles for NASA Space Apps Challenge demonstration only — not official NASA protocols or medical advice. Final medical decisions belong to the Crew Medical Officer (CMO) and Flight Surgeon.*
> * **AR:** *تنبيه: البيانات والإجراءات تجريبية (Synthetic / Simulated Data) ومبنية على مبادئ عامة في الطب الفضائي لأغراض العرض التجريبي فقط، وليست بروتوكولات رسمية من ناسا أو نصيحة طبية. القرارات الطبية النهائية تعود لمسؤول الطاقم الطبي (CMO) وطبيب الرحلة الأرضي.*

---

## 🚀 Quick Access Links (When Running)

| Resource | URL | Description |
| :--- | :--- | :--- |
| **🌐 Full-Stack Web App** | [`http://localhost:5173`](http://localhost:5173) | Interactive Mission Control Dashboard (React + Tailwind + Recharts) |
| **📚 Classic Swagger UI** | [`http://localhost:8000/swagger/`](http://localhost:8000/swagger/) | Interactive OpenAPI 3.0 Documentation & API Explorer |
| **🗄️ Database & Admin** | [`http://localhost:8000/admin/`](http://localhost:8000/admin/) | Django Administration & Database State Explorer |
| **📖 ReDoc API View** | [`http://localhost:8000/redoc/`](http://localhost:8000/redoc/) | ReDoc Specification Viewer |

---

## 🛠️ How to Run the Application

You can run AstroVitals AI using **Docker** OR the automated **Setup Scripts** (No Docker required).

### Option A: Using Docker (One Command)
If you have Docker and Docker Compose installed:
```bash
docker compose up --build
```
* The backend will automatically apply migrations, seed the 3 astronauts, ingest all 4,320 rows from `astronaut_vitals_sample_24h.csv`, initialize the 30-day rollup, and launch the server.
* The frontend will start on `http://localhost:5173`.
* Direct access links will appear in your console.

---

### Option B: Without Docker (Automated Setup Script)
If you do not have Docker installed, you only need **Python 3.10+** and **Node.js 18+**.

#### On Windows:
1. **Run Setup (One-Time Dependency Installation & Database Seeding)**:
   ```cmd
   setup.bat
   ```
   *(Or in PowerShell: `.\setup.ps1`)*
   This automatically verifies Python and Node.js, creates the Python virtual environment, installs all Python and NPM packages, applies Django migrations, and seeds the reference database.

2. **Launch the System**:
   ```cmd
   run.bat
   ```
   *(Or in PowerShell: `.\run.ps1`)*
   This starts both the Django backend (`http://localhost:8000`) and the React frontend (`http://localhost:5173`) and prints all links clearly.

#### On Linux / macOS:
```bash
chmod +x setup.sh run.sh
./setup.sh
./run.sh
```

---

## 🧑‍🚀 Reference Astronaut Profiles & Personal Baselines

Comparison against the astronaut's **Personal Baseline** ($Z$-score) is the primary diagnostic rule:

| ID | Astronaut | Age / Gender | Role | Baseline HR (bpm) | Systolic BP (mmHg) | Diastolic BP (mmHg) | SpO2 (%) | Resp Rate (br/min) | Body Temp (°C) |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`AST-01`** | **Cmdr. Layla** | 42, F | Mission Commander | `62.0 ± 4.0` | `108.0 ± 5.0` | `68.0 ± 4.0` | `97.5 ± 0.6` | `14.0 ± 1.0` | `36.80 ± 0.12` |
| **`AST-02`** | **Eng. Omar** | 38, M | Flight Engineer | `68.0 ± 4.0` | `116.0 ± 5.0` | `72.0 ± 4.0` | `97.0 ± 0.6` | `15.0 ± 1.0` | `36.90 ± 0.12` |
| **`AST-03`** | **Dr. Sara** | 45, F | Chief Medical Officer (CMO) | `64.0 ± 4.0` | `110.0 ± 5.0` | `70.0 ± 4.0` | `98.0 ± 0.5` | `13.0 ± 1.0` | `36.80 ± 0.12` |

---

## 📊 Core Vitals & Activity-Specific Reference Ranges

Thresholds dynamically adapt based on the active `activity` (`rest`, `light`, `sleep`, `exercise`):

### 1. Rest / Light Activity (`rest` or `light`)
* **Heart Rate**: Earth `60–100` | Space Normal `50–90` | Warning `40–49` or `91–110` | Critical `< 40` or `> 110`
* **Systolic BP**: Earth `90–120` | Space Normal `95–130` | Warning `85–94` or `131–145` | Critical `< 85` or `> 145`
* **Diastolic BP**: Earth `60–80` | Space Normal `55–85` | Warning `50–54` or `86–95` | Critical `< 50` or `> 95`
* **SpO2**: Earth `95–100` | Space Normal `95–100` | Warning `90.0–94.9` | Critical `< 90.0`
* **Respiratory Rate**: Earth `12–20` | Space Normal `12–20` | Warning `10–11` or `21–24` | Critical `< 10` or `> 24`
* **Body Temperature**: Earth `36.1–37.2` | Space Normal `36.1–37.5` | Warning `35.5–36.09` or `37.51–38.3` | Critical `< 35.5` or `> 38.3`

### 2. During Sleep (`sleep`)
* **Heart Rate**: Normal `40–80` | Warning `35–39` or `81–100` | Critical `< 35` or `> 100`
* **Systolic BP**: Normal `85–120` | Warning `80–84` or `121–135` | Critical `< 80` or `> 135`
* **Diastolic BP**: Normal `50–80` | Warning `45–49` or `81–90` | Critical `< 45` or `> 90`
* **SpO2**: Normal `93–100` | Warning `88.0–92.9` | Critical `< 88.0`
* **Respiratory Rate**: Normal `10–18` | Warning `8–9` or `19–22` | Critical `< 8` or `> 22`
* **Body Temperature**: Normal `35.8–37.2` | Warning `35.3–35.79` or `37.21–38.0` | Critical `< 35.3` or `> 38.0`

### 3. During Exercise (`exercise` — ~2.5 hrs/day countermeasures)
* **Heart Rate**: Normal `90–155` | Warning `70–89` or `156–175` | Critical `< 70` or `> 175`
* **Systolic BP**: Normal `120–170` | Warning `105–119` or `171–185` | Critical `< 105` or `> 185`
* **Diastolic BP**: Normal `65–90` | Warning `55–64` or `91–100` | Critical `< 55` or `> 100`
* **SpO2**: Normal `94–100` | Warning `90.0–93.9` | Critical `< 90.0`
* **Respiratory Rate**: Normal `18–35` | Warning `14–17` or `36–40` | Critical `< 14` or `> 40`
* **Body Temperature**: Normal `37.0–38.3` | Warning `36.5–36.99` or `38.31–39.0` | Critical `< 36.5` or `> 39.0`

---

## ⚡ Alert Engine Rules & Visual Alert Levels

1. **Rule 1 — Activity-Adjusted Range Check**: Evaluates against the active range matrix.
2. **Rule 2 — Personal Baseline Z-Score Check**:
   $$Z = \frac{\text{Reading} - \text{Astronaut Baseline Mean}}{\text{Astronaut Baseline SD}}$$
   * $|Z| \ge 2.0 \rightarrow$ triggers at least **Warning** (Amber `#F59E0B`).
   * $|Z| \ge 3.0 \rightarrow$ triggers **Critical** (Red `#EF4444`).
3. **Rule 3 — 6-Hour Moving Average Trend Check**:
   * If the 6-hour moving average drifts by $> 10\%$ from baseline $\rightarrow$ triggers **Notice** (Blue `#3B82F6`).
4. **Rule 4 — Multi-Signal Compound Escalation**:
   * If `heart_rate` is elevated AND `spo2` is depressed AND `respiratory_rate` is high simultaneously during `rest`/`light` activity $\rightarrow$ immediately escalates to **Critical** (Red `#EF4444`).
5. **Rule 5 — Emergency Life Support Trigger**:
   * Loss of consciousness, respiratory arrest, or flatline $\rightarrow$ **Emergency** (Flashing Red `#DC2626` + Web Audio API Siren).

---

## 📋 Interactive 8-Step Emergency Checklist

Each active alert features a real-time, checkable, timestamped response workflow:
1. **Detection (الاكتشاف)**: System identifies threshold or Z-score violation.
2. **Verification (التأكد)**: Verifies sensor placement, rules out exercise artifact, asks astronaut for symptoms.
3. **Notification (التنبيه)**: Alerts Astronaut, CMO, and Ground Flight Surgeon.
4. **First Aid & Microgravity Restraint (الإسعاف وتثبيت انعدام الجاذبية)**: Stops exertion, secures astronaut in CMRS restraint harness.
5. **Flight Surgeon Comm (التواصل مع طبيب الرحلة)**: Auto-transmits 24h vitals and initiates private medical comm link.
6. **Treatment & Intensive Monitoring (العلاج والمراقبة)**: Protocol-specific pharmaceuticals from medical kit, measures vitals every 2–5 mins.
7. **Mission Decision (قرار المهمة)**: Continue nominal mission, observe in orbit, or initiate emergency Earth return.
8. **Post-Incident Documentation (التوثيق والمراجعة)**: Logs all timestamps, actions, false-alarm analysis, updates baseline if necessary.

---

## 🧪 5 Prototype Test Scenarios (Judges Simulation Bar)

Click any scenario button on the dashboard simulation bar to observe instantaneous system diagnostics:
* **Scenario 1: Tachycardia + Hypoxia (`AST-02` Eng. Omar)**: CSV 14:04–14:37 Event peaking at `131 bpm HR`, `90.0% SpO2`, and `27 breaths/min RR` during light activity $\rightarrow$ Triggers **Multi-Signal Compound Rule + Critical Alert**.
* **Scenario 2: Gradual Hyperthermia (`AST-03` Dr. Sara)**: CSV 18:00–22:00 Event rising `+1.4°C` over 4 hours up to `38.33°C` $\rightarrow$ Triggers **Space Fever Cooling Protocol**.
* **Scenario 3: Sleep Deprivation & Low HRV (`AST-01` Cmdr. Layla)**: Sleep `< 4.5 hrs` for 3 nights + HRV drops to `22 ms` $\rightarrow$ Triggers **Autonomic Fatigue Alert**.
* **Scenario 4: Cabin CO2 Spike**: Cabin CO2 rises to `5.8 mmHg` ($> 5.3$ limit) with headache and drowsiness $\rightarrow$ Triggers **Scrubber Bed / CDRA Protocol**.
* **Scenario 5: Solar Particle Event (SPE) / Cardiac Emergency**: Simulates Radiation Storm Shelter evacuation OR Cardiac Arrest zero-g CPR/AED siren.

---

## 🌐 Mission Locations & Communication Latency

* **ISS (Low Earth Orbit)**: Latency `< 1 second` (Near-continuous comms) | Emergency return: **Hours**.
* **Moon (Artemis Program)**: Latency `1.3 – 2.0 seconds` | Emergency return: **3 to 5 Days**.
* **Mars (Deep Space Mission)**: Latency **`3 to 22 minutes`** | Emergency return: **Impossible for months** | Crew autonomy: **Near-Complete (AI & CMO lead decisions)**.

---

## 📐 Architecture & Technology Stack

* **Backend**: Python 3.11, Django 5.0, Django REST Framework, drf-spectacular (OpenAPI 3.0 & Classic Swagger UI), SQLite3 / PostgreSQL.
* **Frontend**: React 18, Vite 6, Tailwind CSS, Recharts, Lucide Icons, Web Audio API Sound Synthesizer.
* **Localization**: Full English (default) and Arabic (العربية RTL) with persistent user preferences.
* **Dataset**: `astronaut_vitals_sample_24h.csv` (`4,320` rows minute-by-minute across AST-01, AST-02, and AST-03).
