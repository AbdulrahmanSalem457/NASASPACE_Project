from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import (
    Astronaut, VitalReading, MedicalAlert,
    HistoricalRollup30D, MedicalKitItem, EVAPlan
)


class AstronautSerializer(serializers.ModelSerializer):
    baselines = serializers.SerializerMethodField()

    class Meta:
        model = Astronaut
        fields = [
            'id', 'name', 'name_ar', 'age', 'gender', 'role', 'role_ar',
            'current_activity', 'mission_location',
            'hr_mean', 'hr_sd', 'sys_bp_mean', 'sys_bp_sd',
            'dia_bp_mean', 'dia_bp_sd', 'spo2_mean', 'spo2_sd',
            'resp_rate_mean', 'resp_rate_sd', 'body_temp_mean', 'body_temp_sd',
            'ecg_pr', 'ecg_qrs', 'ecg_qtc', 'ecg_rhythm', 'hrv_rmssd',
            'daily_radiation', 'cumulative_radiation_msv', 'mission_day',
            'sleep_duration', 'exercise_hours',
            'cabin_co2', 'cabin_pressure', 'baselines'
        ]

    @extend_schema_field(serializers.DictField)
    def get_baselines(self, obj):
        return obj.get_baselines_dict()


class VitalReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalReading
        fields = [
            'id', 'astronaut', 'timestamp', 'activity',
            'heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2',
            'respiratory_rate', 'body_temperature', 'status',
            'hr_z_score', 'sys_z_score', 'dia_z_score', 'spo2_z_score',
            'rr_z_score', 'temp_z_score', 'max_abs_z',
            'ecg_pr', 'ecg_qrs', 'ecg_qtc', 'ecg_rhythm',
            'cabin_co2', 'cabin_pressure', 'sleep_duration',
            'hrv_rmssd', 'radiation_rate', 'source'
        ]


class MedicalAlertSerializer(serializers.ModelSerializer):
    astronaut_name = serializers.ReadOnlyField(source='astronaut.name')
    astronaut_name_ar = serializers.ReadOnlyField(source='astronaut.name_ar')

    class Meta:
        model = MedicalAlert
        fields = [
            'id', 'astronaut', 'astronaut_name', 'astronaut_name_ar',
            'vital_reading', 'timestamp', 'level', 'primary_metric',
            'title_en', 'title_ar', 'summary_en', 'summary_ar',
            'probable_cause_en', 'probable_cause_ar',
            'current_reading_value', 'baseline_reference', 'normal_limit_reference',
            'z_score', 'protocol_code', 'protocol_title_en', 'protocol_title_ar',
            'is_active', 'elapsed_seconds', 'checklist_steps',
            'surgeon_contacted', 'surgeon_contacted_at', 'telemetry_sent',
            'action_logs'
        ]


class HistoricalRollup30DSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalRollup30D
        fields = '__all__'


class MedicalKitItemSerializer(serializers.ModelSerializer):
    is_required = serializers.SerializerMethodField()

    class Meta:
        model = MedicalKitItem
        fields = [
            'id', 'code', 'name_en', 'name_ar', 'category', 'category_ar',
            'quantity', 'max_quantity', 'unit', 'unit_ar',
            'expiry_date', 'location_bay', 'related_protocols',
            'usage_notes_en', 'usage_notes_ar', 'is_required'
        ]

    @extend_schema_field(serializers.BooleanField)
    def get_is_required(self, obj):
        active_protocols = self.context.get('active_protocols', set())
        if not active_protocols:
            return False
        return bool(set(obj.related_protocols or []) & active_protocols)


class MedicalKitUseSerializer(serializers.Serializer):
    amount = serializers.IntegerField(required=False, default=1, min_value=1, max_value=10)
    restock = serializers.BooleanField(required=False, default=False)


class EVAPlanSerializer(serializers.ModelSerializer):
    astronaut_name = serializers.ReadOnlyField(source='astronaut.name')
    astronaut_name_ar = serializers.ReadOnlyField(source='astronaut.name_ar')

    class Meta:
        model = EVAPlan
        fields = [
            'id', 'astronaut', 'astronaut_name', 'astronaut_name_ar',
            'title', 'title_ar', 'scheduled_start', 'duration_hours',
            'oxygen_reserve_pct', 'co2_scrubber_pct', 'suit_pressure_psi',
            'radiation_forecast_msv', 'readiness_decision', 'risk_score_snapshot',
            'decision_reasons', 'created_at'
        ]


class EVAPlanCreateSerializer(serializers.Serializer):
    astronaut_id = serializers.CharField(required=True)
    title = serializers.CharField(required=True, max_length=200)
    title_ar = serializers.CharField(required=False, allow_blank=True, default='')
    duration_hours = serializers.FloatField(required=False, default=4.5, min_value=0.5, max_value=12.0)
    oxygen_reserve_pct = serializers.FloatField(required=False, default=98.0, min_value=0.0, max_value=100.0)
    co2_scrubber_pct = serializers.FloatField(required=False, default=95.0, min_value=0.0, max_value=100.0)
    suit_pressure_psi = serializers.FloatField(required=False, default=4.3, min_value=0.0, max_value=15.0)
    radiation_forecast_msv = serializers.FloatField(required=False, default=0.6, min_value=0.0, max_value=10.0)


class ChecklistStepUpdateSerializer(serializers.Serializer):
    step_num = serializers.IntegerField(required=True, help_text="Step number (1 through 8)")
    completed = serializers.BooleanField(required=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')


class ContactSurgeonSerializer(serializers.Serializer):
    message = serializers.CharField(required=False, allow_blank=True)
    attach_telemetry = serializers.BooleanField(default=True)


class ScenarioActivateSerializer(serializers.Serializer):
    mode = serializers.CharField(required=False, allow_blank=True, default='cardiac_arrest', help_text="Used for Scenario 5: 'cardiac_arrest' or 'spe'")
    astronaut_id = serializers.CharField(required=False, allow_blank=True)
    activity = serializers.CharField(required=False, allow_blank=True)


class AIAdvisorRequestSerializer(serializers.Serializer):
    astronaut_id = serializers.CharField(required=True)
    heart_rate = serializers.FloatField(required=False)
    systolic_bp = serializers.FloatField(required=False)
    diastolic_bp = serializers.FloatField(required=False)
    spo2 = serializers.FloatField(required=False)
    respiratory_rate = serializers.FloatField(required=False)
    body_temperature = serializers.FloatField(required=False)
    cabin_co2 = serializers.FloatField(required=False)
    daily_radiation = serializers.FloatField(required=False)
    ecg_qtc = serializers.FloatField(required=False)
    hrv_rmssd = serializers.FloatField(required=False)
    sleep_duration = serializers.FloatField(required=False)
    cabin_pressure = serializers.FloatField(required=False)
    activity = serializers.CharField(required=False, default='rest')


class IncidentAssistantRequestSerializer(serializers.Serializer):
    astronaut_id = serializers.CharField(required=True)
    description = serializers.CharField(required=True)
    language = serializers.CharField(required=False, default='ar')
    mode = serializers.ChoiceField(choices=['offline', 'ai'], required=False, default='offline')
    vitals = serializers.DictField(required=False)


class UpdateAstronautSettingsSerializer(serializers.Serializer):
    activity = serializers.CharField(required=False, help_text="rest, light, sleep, exercise, or eva")
    mission_location = serializers.CharField(required=False, help_text="ISS, Moon, or Mars")


class UploadCSVResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    records_imported = serializers.IntegerField()


class ReportResponseSerializer(serializers.Serializer):
    period = serializers.CharField()
    title_en = serializers.CharField()
    title_ar = serializers.CharField()
    generated_at = serializers.CharField()
    astronaut = AstronautSerializer()
    vitals_statistics = serializers.DictField()
    alerts_summary = serializers.DictField()
    countermeasures = serializers.DictField()
