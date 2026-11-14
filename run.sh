#!/usr/bin/env bash

echo "========================================================================="
echo "   ASTROVITALS AI — LAUNCHING SYSTEM"
echo "========================================================================="

# Start backend
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 2

echo ""
echo "========================================================================="
echo "   ASTROVITALS AI IS NOW RUNNING!"
echo "========================================================================="
echo "   [1] 🌐 Web App:         http://localhost:5173"
echo "   [2] 📚 Swagger UI API:  http://localhost:8000/swagger/"
echo "   [3] 🗄️ Database/Admin:  http://localhost:8000/admin/"
echo "   [4] 📖 ReDoc View:      http://localhost:8000/redoc/"
echo "========================================================================="
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
