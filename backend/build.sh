#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Applying database migrations..."
python manage.py migrate --no-input

echo "==> Seeding initial space telemetry & astronaut baselines..."
python manage.py seed_astrovitals

echo "==> Collecting static assets for WhiteNoise..."
python manage.py collectstatic --no-input

echo "==> Backend build completed successfully!"
