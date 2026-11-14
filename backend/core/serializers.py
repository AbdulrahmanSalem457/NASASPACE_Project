from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Astronaut, VitalReading, MedicalAlert, HistoricalRollup30D

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
            'daily_radiation', 'sleep_duration', 'exercise_hours',
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
            'cabin_co2', 'hrv_rmssd', 'radiation_rate', 'source'
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


class ChecklistStepUpdateSerializer(serializers.Serializer):
    step_num = serializers.IntegerField(required=True, help_text="Step number (1 through 8)")
    completed = serializers.BooleanField(required=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')


class ContactSurgeonSerializer(serializers.Serializer):
    message = serializers.CharField(required=False, allow_blank=True)
    attach_telemetry = serializers.BooleanField(default=True)


class ScenarioActivateSerializer(serializers.Serializer):
    mode = serializers.CharField(required=False, allow_blank=True, default='cardiac_arrest', help_text="Used for Scenario 5: 'cardiac_arrest' or 'spe'")


class AIAdvisorRequestSerializer(serializers.Serializer):
    astronaut_id = serializers.CharField(required=True)
    heart_rate = serializers.FloatField(required=False)
    systolic_bp = serializers.FloatField(required=False)
    diastolic_bp = serializers.FloatField(required=False)
    spo2 = serializers.FloatField(required=False)
    respiratory_rate = serializers.FloatField(required=False)
    body_temperature = serializers.FloatField(required=False)
    activity = serializers.CharField(required=False, default='rest')


class UpdateAstronautSettingsSerializer(serializers.Serializer):
    activity = serializers.CharField(required=False, help_text="rest, light, sleep, or exercise")
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
