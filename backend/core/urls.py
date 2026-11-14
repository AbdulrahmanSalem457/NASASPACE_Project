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
    ReportsView,
    UploadCSVVitalsView,
    UpdateAstronautSettingsView,
)

urlpatterns = [
    # Bootstrap payload (Astronauts, baselines, locations, protocols)
    path('bootstrap/', BootstrapView.as_view(), name='bootstrap'),

    # Astronaut vitals time-series & settings
    path('astronauts/<str:astronaut_id>/vitals/', AstronautVitalsView.as_view(), name='astronaut-vitals'),
    path('astronauts/<str:astronaut_id>/settings/', UpdateAstronautSettingsView.as_view(), name='astronaut-settings'),

    # Live Vitals Logging & CSV Ingestion
    path('vitals/', LogVitalReadingView.as_view(), name='log-vital'),
    path('vitals/upload-csv/', UploadCSVVitalsView.as_view(), name='upload-csv-vitals'),

    # Medical Alerts & Emergency Response Checklist
    path('alerts/', MedicalAlertListView.as_view(), name='alerts-list'),
    path('alerts/<int:alert_id>/checklist/', ChecklistStepUpdateView.as_view(), name='alert-checklist-update'),
    path('alerts/<int:alert_id>/contact-surgeon/', ContactFlightSurgeonView.as_view(), name='alert-contact-surgeon'),

    # Prototype Simulation Scenarios (1 to 5)
    path('scenarios/<str:scenario_id>/activate/', ActivateScenarioView.as_view(), name='activate-scenario'),

    # AI Clinical Decision Support
    path('ai-advisor/', AIAdvisorView.as_view(), name='ai-advisor'),

    # Health & Compliance Reports
    path('reports/<str:astronaut_id>/', ReportsView.as_view(), name='reports'),
]
