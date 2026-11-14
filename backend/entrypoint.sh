#!/bin/sh
set -e

echo "--> Running Database Migrations..."
python manage.py makemigrations core --noinput
python manage.py migrate --noinput

echo "--> Seeding Astronaut Baselines and 24h CSV Telemetry..."
python manage.py seed_astrovitals

echo ""
echo "========================================================================="
echo "   ASTROVITALS AI IS NOW LIVE AND RUNNING! (DOCKER)"
echo "   NASA Space Apps Challenge Demonstration"
echo "========================================================================="
echo ""
echo "   [1] Web Application Dashboard:"
echo "       --> http://localhost:5173"
echo ""
echo "   [2] Classic Swagger UI API Documentation:"
echo "       --> http://localhost:8000/swagger/"
echo ""
echo "   [3] Database & Django Administration:"
echo "       --> http://localhost:8000/admin/"
echo ""
echo "   [4] ReDoc Alternative API View:"
echo "       --> http://localhost:8000/redoc/"
echo ""
echo "========================================================================="
echo "   Ready to receive telemetry and handle mission anomalies."
echo "========================================================================="
echo ""

exec python manage.py runserver 0.0.0.0:8000
