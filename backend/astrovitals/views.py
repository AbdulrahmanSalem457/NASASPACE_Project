import os
from pathlib import Path
from django.http import HttpResponse, Http404
from django.views.generic import View
from django.conf import settings

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR.parent / 'frontend' / 'dist'

def frontend_index(request):
    index_file = FRONTEND_DIST / 'index.html'
    if index_file.exists():
        return HttpResponse(index_file.read_text(encoding='utf-8'), content_type='text/html')
    # Fallback if frontend dist not built yet
    return HttpResponse(
        "<h1>AstroVitals AI Backend is Live!</h1><p>Visit <a href='/swagger/'>/swagger/</a> for API Documentation.</p>",
        content_type='text/html'
    )
