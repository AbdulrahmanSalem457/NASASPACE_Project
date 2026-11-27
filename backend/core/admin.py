from django.contrib import admin
from .models import (
    Astronaut, VitalReading, MedicalAlert,
    HistoricalRollup30D, MedicalKitItem, EVAPlan
)


@admin.register(Astronaut)
class AstronautAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'name_ar', 'role', 'age', 'gender', 'mission_location', 'current_activity', 'hr_mean', 'cumulative_radiation_msv')
    list_filter = ('mission_location', 'current_activity', 'gender')
    search_fields = ('id', 'name', 'name_ar', 'role')


@admin.register(VitalReading)
class VitalReadingAdmin(admin.ModelAdmin):
    list_display = ('id', 'astronaut', 'timestamp', 'heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2', 'respiratory_rate', 'body_temperature', 'activity', 'status')
    list_filter = ('status', 'activity', 'astronaut')
    search_fields = ('astronaut__id', 'astronaut__name')
    date_hierarchy = 'timestamp'
    ordering = ('-timestamp',)


@admin.register(MedicalAlert)
class MedicalAlertAdmin(admin.ModelAdmin):
    list_display = ('id', 'astronaut', 'timestamp', 'level', 'protocol_code', 'primary_metric', 'is_active', 'surgeon_contacted')
    list_filter = ('level', 'is_active', 'surgeon_contacted', 'protocol_code', 'astronaut')
    search_fields = ('title_en', 'title_ar', 'protocol_code', 'protocol_title_en', 'astronaut__name')
    date_hierarchy = 'timestamp'
    ordering = ('-timestamp',)


@admin.register(HistoricalRollup30D)
class HistoricalRollup30DAdmin(admin.ModelAdmin):
    list_display = ('astronaut', 'date', 'avg_heart_rate', 'avg_systolic_bp', 'avg_spo2', 'sleep_hours', 'exercise_hours', 'daily_radiation')
    list_filter = ('astronaut', 'date')
    search_fields = ('astronaut__id', 'astronaut__name')
    date_hierarchy = 'date'
    ordering = ('-date',)


@admin.register(MedicalKitItem)
class MedicalKitItemAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_en', 'category', 'quantity', 'max_quantity', 'expiry_date', 'location_bay')
    list_filter = ('category',)
    search_fields = ('code', 'name_en', 'name_ar')


@admin.register(EVAPlan)
class EVAPlanAdmin(admin.ModelAdmin):
    list_display = ('id', 'astronaut', 'title', 'readiness_decision', 'risk_score_snapshot', 'duration_hours', 'created_at')
    list_filter = ('readiness_decision', 'astronaut')
    search_fields = ('title', 'title_ar', 'astronaut__name')
