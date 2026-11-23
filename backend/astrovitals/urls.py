from django.contrib import admin
from django.urls import path, re_path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from .views import frontend_index

urlpatterns = [
    path('admin/', admin.site.urls),
    # OpenAPI Schema and Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # Core API endpoints
    path('api/', include('core.urls')),
    # Frontend SPA (catch-all for frontend routes)
    re_path(r'^(?!api|swagger|redoc|admin|static|assets).*$', frontend_index, name='frontend-index'),
]
