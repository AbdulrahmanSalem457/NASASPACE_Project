#!/usr/bin/env bash
set -e

echo "========================================================================="
echo "   ASTROVITALS AI — SETUP, VERIFICATION & SYSTEM LAUNCHER"
echo "   NASA Space Apps Challenge"
echo "========================================================================="

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed!"
    exit 1
fi
echo "[OK] Found $(python3 --version)"

# 2. Check Node & NPM
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "[ERROR] Node.js or NPM is not installed!"
    exit 1
fi
echo "[OK] Found Node $(node --version) | NPM v$(npm --version)"

# 3. Setup Virtualenv
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
fi

source backend/venv/bin/activate
pip install --upgrade pip --quiet
pip install -r backend/requirements.txt --quiet
echo "[OK] Python dependencies verified."

# 4. Install NPM deps
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    npm install --prefer-offline --no-audit
fi
cd ..
echo "[OK] Frontend NPM dependencies verified."

# 5. Migrate and Seed
cd backend
python manage.py makemigrations core --noinput > /dev/null 2>&1 || true
python manage.py migrate --noinput > /dev/null 2>&1
python manage.py seed_astrovitals
cd ..
echo "[OK] Database migrated and seeded."

# 6. Launch Applications
echo "========================================================================="
echo "   LAUNCHING ASTROVITALS AI APPLICATION..."
echo "========================================================================="

cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 3

echo ""
echo "========================================================================="
echo "   ASTROVITALS AI IS NOW LIVE AND RUNNING!"
echo "========================================================================="
echo "   [1] 🌐 Web App:         http://localhost:5173"
echo "   [2] 📚 Swagger UI API:  http://localhost:8000/swagger/"
echo "   [3] 🗄️ Database/Admin:  http://localhost:8000/admin/"
echo "   [4] 📖 ReDoc View:      http://localhost:8000/redoc/"
echo "========================================================================="
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
