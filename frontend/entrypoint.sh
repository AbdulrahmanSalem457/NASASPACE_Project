#!/bin/sh
set -e

echo ""
echo "========================================================================="
echo "   ASTROVITALS AI — FRONTEND READY (DOCKER)"
echo "========================================================================="
echo "   --> Web App Dashboard: http://localhost:5173"
echo "   --> Swagger UI Docs:   http://localhost:8000/swagger/"
echo "   --> Django Admin:      http://localhost:8000/admin/"
echo "========================================================================="
echo ""

exec npm run dev -- --host 0.0.0.0 --port 5173
