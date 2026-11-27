from django.urls import path
from .views import (
    BootstrapView,
    AstronautVitalsView,
    LogVitalReadingView,
    MedicalAlertListView,
    ChecklistStepUpdateView,
    ContactFlightSurgeonView,
    ActivateScenarioView,
    AIAdvisorView,
    IncidentAssistantView,
    MissionReadinessView,
    EVAPlanListCreateView,
    EVAPlanDeleteView,
    MedicalKitListView,
    MedicalKitUseView,
    RadiationOverviewView,
    SBARReportView,
    ExportCSVReportView,
    ReportsView,
    UploadCSVVitalsView,
    UpdateAstronautSettingsView,
)

urlpatterns = [
    # Bootstrap payload (Astronauts, baselines, locations, protocols, medical kit, radiation)
    path('bootstrap/', BootstrapView.as_view(), name='bootstrap'),

    # Astronaut vitals time-series & settings
    path('astronauts/<str:astronaut_id>/vitals/', AstronautVitalsView.as_view(), name='astronaut-vitals'),
    path('astronauts/<str:astronaut_id>/settings/', UpdateAstronautSettingsView.as_view(), name='astronaut-settings'),

    # Live Vitals & Contextual Sliders Ingestion + CSV Upload
    path('vitals/', LogVitalReadingView.as_view(), name='log-vital'),
    path('vitals/upload-csv/', UploadCSVVitalsView.as_view(), name='upload-csv-vitals'),

    # Medical Alerts & Emergency Response Checklist
    path('alerts/', MedicalAlertListView.as_view(), name='alerts-list'),
    path('alerts/<int:alert_id>/checklist/', ChecklistStepUpdateView.as_view(), name='alert-checklist-update'),
    path('alerts/<int:alert_id>/contact-surgeon/', ContactFlightSurgeonView.as_view(), name='alert-contact-surgeon'),

    # Prototype Simulation Scenarios (0 to 5)
    path('scenarios/<str:scenario_id>/activate/', ActivateScenarioView.as_view(), name='activate-scenario'),

    # AI Clinical Decision Support & Interactive Incident Assistant
    path('ai-advisor/', AIAdvisorView.as_view(), name='ai-advisor'),
    path('incident-assistant/', IncidentAssistantView.as_view(), name='incident-assistant'),

    # Mission Readiness (Risk 0-100, GO/HOLD) & EVA Planner
    path('readiness/', MissionReadinessView.as_view(), name='mission-readiness'),
    path('eva-plans/', EVAPlanListCreateView.as_view(), name='eva-plans-list-create'),
    path('eva-plans/<int:plan_id>/', EVAPlanDeleteView.as_view(), name='eva-plan-delete'),

    # Smart Medical Kit Inventory (12 Items)
    path('medical-kit/', MedicalKitListView.as_view(), name='medical-kit-list'),
    path('medical-kit/<int:item_id>/use/', MedicalKitUseView.as_view(), name='medical-kit-use'),

    # Cumulative Radiation Dose Tracker
    path('radiation/', RadiationOverviewView.as_view(), name='radiation-overview'),

    # Health Reports, Dynamic SBAR Handoff, & CSV Export
    path('reports/<str:astronaut_id>/', ReportsView.as_view(), name='reports'),
    path('reports/<str:astronaut_id>/sbar/', SBARReportView.as_view(), name='reports-sbar'),
    path('reports/<str:astronaut_id>/export-csv/', ExportCSVReportView.as_view(), name='reports-export-csv'),
]
