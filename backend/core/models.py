import json
from django.db import models
from django.utils import timezone
from .protocols_data import STANDARD_CHECKLIST_TEMPLATE


class Astronaut(models.Model):
    id = models.CharField(max_length=20, primary_key=True)  # e.g. AST-01
    name = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=20)
    role = models.CharField(max_length=100)
    role_ar = models.CharField(max_length=100)
    current_activity = models.CharField(max_length=30, default='rest')
    mission_location = models.CharField(max_length=30, default='ISS')

    # Personal Baseline (Mean & SD)
    hr_mean = models.FloatField(default=62.0)
    hr_sd = models.FloatField(default=4.0)

    sys_bp_mean = models.FloatField(default=108.0)
    sys_bp_sd = models.FloatField(default=5.0)

    dia_bp_mean = models.FloatField(default=68.0)
    dia_bp_sd = models.FloatField(default=4.0)

    spo2_mean = models.FloatField(default=97.5)
    spo2_sd = models.FloatField(default=0.6)

    resp_rate_mean = models.FloatField(default=14.0)
    resp_rate_sd = models.FloatField(default=1.0)

    body_temp_mean = models.FloatField(default=36.8)
    body_temp_sd = models.FloatField(default=0.12)

    # Secondary Indicators & Radiation Budget
    ecg_pr = models.IntegerField(default=155)  # ms
    ecg_qrs = models.IntegerField(default=85)  # ms
    ecg_qtc = models.IntegerField(default=415)  # ms
    ecg_rhythm = models.CharField(max_length=50, default='Normal Sinus')
    hrv_rmssd = models.FloatField(default=52.0)  # ms
    daily_radiation = models.FloatField(default=0.55)  # mSv/day
    cumulative_radiation_msv = models.FloatField(default=24.8)  # Total mission cumulative mSv
    mission_day = models.IntegerField(default=45)
    sleep_duration = models.FloatField(default=6.8)  # hours
    exercise_hours = models.FloatField(default=2.5)  # hours/day
    cabin_co2 = models.FloatField(default=3.2)  # mmHg
    cabin_pressure = models.FloatField(default=14.7)  # psi

    def get_baselines_dict(self):
        return {
            "heart_rate": {"mean": self.hr_mean, "sd": self.hr_sd, "unit": "bpm"},
            "systolic_bp": {"mean": self.sys_bp_mean, "sd": self.sys_bp_sd, "unit": "mmHg"},
            "diastolic_bp": {"mean": self.dia_bp_mean, "sd": self.dia_bp_sd, "unit": "mmHg"},
            "spo2": {"mean": self.spo2_mean, "sd": self.spo2_sd, "unit": "%"},
            "respiratory_rate": {"mean": self.resp_rate_mean, "sd": self.resp_rate_sd, "unit": "breaths/min"},
            "body_temperature": {"mean": self.body_temp_mean, "sd": self.body_temp_sd, "unit": "°C"},
        }

    def __str__(self):
        return f"{self.id} - {self.name}"


class VitalReading(models.Model):
    astronaut = models.ForeignKey(Astronaut, on_delete=models.CASCADE, related_name='vitals')
    timestamp = models.DateTimeField(db_index=True)
    activity = models.CharField(max_length=30, default='rest')

    heart_rate = models.FloatField()
    systolic_bp = models.FloatField()
    diastolic_bp = models.FloatField()
    spo2 = models.FloatField()
    respiratory_rate = models.FloatField()
    body_temperature = models.FloatField()

    status = models.CharField(max_length=20, default='normal')  # normal, notice, warning, critical, emergency

    # Z-scores vs Personal Baseline
    hr_z_score = models.FloatField(default=0.0)
    sys_z_score = models.FloatField(default=0.0)
    dia_z_score = models.FloatField(default=0.0)
    spo2_z_score = models.FloatField(default=0.0)
    rr_z_score = models.FloatField(default=0.0)
    temp_z_score = models.FloatField(default=0.0)
    max_abs_z = models.FloatField(default=0.0)

    # Spaceflight Contextual Metrics
    ecg_pr = models.IntegerField(default=155)
    ecg_qrs = models.IntegerField(default=85)
    ecg_qtc = models.IntegerField(default=415)
    ecg_rhythm = models.CharField(max_length=50, default='Normal Sinus')
    hrv_rmssd = models.FloatField(default=50.0)
    cabin_co2 = models.FloatField(default=3.2)
    cabin_pressure = models.FloatField(default=14.7)
    sleep_duration = models.FloatField(default=6.8)
    radiation_rate = models.FloatField(default=0.55)

    source = models.CharField(max_length=50, default='live')  # csv_24h, live, scenario

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['astronaut', '-timestamp']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.astronaut_id} @ {self.timestamp} [{self.status}]"


class MedicalAlert(models.Model):
    LEVEL_CHOICES = [
        ('notice', 'Notice (Blue)'),
        ('warning', 'Warning (Yellow)'),
        ('critical', 'Critical (Red)'),
        ('emergency', 'Emergency (Flashing Red + Siren)'),
    ]

    astronaut = models.ForeignKey(Astronaut, on_delete=models.CASCADE, related_name='alerts')
    vital_reading = models.ForeignKey(VitalReading, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='warning')
    primary_metric = models.CharField(max_length=50, default='heart_rate')

    title_en = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255)
    summary_en = models.TextField()
    summary_ar = models.TextField()
    probable_cause_en = models.TextField(blank=True, default='')
    probable_cause_ar = models.TextField(blank=True, default='')

    current_reading_value = models.CharField(max_length=100, default='')
    baseline_reference = models.CharField(max_length=100, default='')
    normal_limit_reference = models.CharField(max_length=100, default='')
    z_score = models.FloatField(null=True, blank=True)

    protocol_code = models.CharField(max_length=30, default='PROT-01')
    protocol_title_en = models.CharField(max_length=255, default='Tachycardia Protocol')
    protocol_title_ar = models.CharField(max_length=255, default='بروتوكول تسارع نبضات القلب')

    is_active = models.BooleanField(default=True)
    elapsed_seconds = models.IntegerField(default=0)
    checklist_steps = models.JSONField(default=list)

    surgeon_contacted = models.BooleanField(default=False)
    surgeon_contacted_at = models.DateTimeField(null=True, blank=True)
    telemetry_sent = models.BooleanField(default=False)
    action_logs = models.JSONField(default=list)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.level.upper()}] {self.astronaut_id} - {self.title_en}"


class HistoricalRollup30D(models.Model):
    astronaut = models.ForeignKey(Astronaut, on_delete=models.CASCADE, related_name='historical_30d')
    date = models.DateField(db_index=True)

    avg_heart_rate = models.FloatField()
    min_heart_rate = models.FloatField()
    max_heart_rate = models.FloatField()

    avg_systolic_bp = models.FloatField()
    avg_diastolic_bp = models.FloatField()

    avg_spo2 = models.FloatField()
    avg_respiratory_rate = models.FloatField()
    avg_body_temperature = models.FloatField()

    sleep_hours = models.FloatField(default=6.5)
    exercise_hours = models.FloatField(default=2.5)
    hrv_rmssd = models.FloatField(default=50.0)
    daily_radiation = models.FloatField(default=0.55)

    alerts_count = models.IntegerField(default=0)
    critical_alerts_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['date']
        unique_together = ('astronaut', 'date')

    def __str__(self):
        return f"{self.astronaut_id} Historical {self.date}"


class MedicalKitItem(models.Model):
    code = models.CharField(max_length=30, unique=True)
    name_en = models.CharField(max_length=150)
    name_ar = models.CharField(max_length=150)
    category = models.CharField(max_length=80)
    category_ar = models.CharField(max_length=80)
    quantity = models.IntegerField(default=1)
    max_quantity = models.IntegerField(default=5)
    unit = models.CharField(max_length=40, default='units')
    unit_ar = models.CharField(max_length=40, default='وحدة')
    expiry_date = models.DateField()
    location_bay = models.CharField(max_length=80, default='Bay A-1 (Medical Locker)')
    related_protocols = models.JSONField(default=list)
    usage_notes_en = models.TextField(blank=True, default='')
    usage_notes_ar = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name_en} ({self.quantity}/{self.max_quantity})"


class EVAPlan(models.Model):
    DECISION_CHOICES = [
        ('GO', 'GO'),
        ('GO_WITH_CAUTION', 'GO WITH CAUTION'),
        ('HOLD', 'HOLD'),
    ]

    astronaut = models.ForeignKey(Astronaut, on_delete=models.CASCADE, related_name='eva_plans')
    title = models.CharField(max_length=200)
    title_ar = models.CharField(max_length=200, blank=True, default='')
    scheduled_start = models.DateTimeField(default=timezone.now)
    duration_hours = models.FloatField(default=4.5)
    oxygen_reserve_pct = models.FloatField(default=98.0)
    co2_scrubber_pct = models.FloatField(default=95.0)
    suit_pressure_psi = models.FloatField(default=4.3)
    radiation_forecast_msv = models.FloatField(default=0.6)
    readiness_decision = models.CharField(max_length=30, choices=DECISION_CHOICES, default='GO')
    risk_score_snapshot = models.IntegerField(default=10)
    decision_reasons = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"EVA [{self.readiness_decision}] {self.astronaut_id} - {self.title}"
