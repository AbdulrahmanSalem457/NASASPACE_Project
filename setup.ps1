# AstroVitals AI — Automatic Setup, Environment Verification & Full-Stack Launcher
# NASA Space Apps Challenge

Clear-Host
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "   ASTROVITALS AI — NASA SPACE APPS CHALLENGE" -ForegroundColor Cyan
Write-Host "   Automated Environment Checker, Setup & System Launcher" -ForegroundColor White
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Python
Write-Host "[1/6] Checking Python installation..." -ForegroundColor Yellow
try {
    $pyVer = python --version
    Write-Host "   [OK] Detected: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Python is not installed or not in PATH." -ForegroundColor Red
    Write-Host "   Please install Python 3.10+ from https://www.python.org/" -ForegroundColor Red
    exit 1
}

# 2. Check Node & NPM
Write-Host ""
Write-Host "[2/6] Checking Node.js and NPM..." -ForegroundColor Yellow
try {
    $nodeVer = node --version
    $npmVer = npm --version
    Write-Host "   [OK] Detected Node.js: $nodeVer | NPM: v$npmVer" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "   Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 3. Python Virtualenv & Backend Requirements
Write-Host ""
Write-Host "[3/6] Verifying and installing Python backend packages..." -ForegroundColor Yellow
if (-not (Test-Path "backend\venv\Scripts\python.exe")) {
    Write-Host "   Creating virtual environment in backend\venv..." -ForegroundColor Gray
    python -m venv backend\venv
}
& "backend\venv\Scripts\pip.exe" install --upgrade pip --quiet
& "backend\venv\Scripts\pip.exe" install -r backend\requirements.txt --quiet
Write-Host "   [OK] Backend dependencies (Django, DRF, Swagger Spectacular) ready." -ForegroundColor Green

# 4. Frontend NPM Packages
Write-Host ""
Write-Host "[4/6] Verifying and installing Frontend NPM packages..." -ForegroundColor Yellow
Set-Location frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing npm dependencies (React, Vite, Tailwind, Recharts)..." -ForegroundColor Gray
    npm install
} else {
    Write-Host "   node_modules exists. Verifying packages..." -ForegroundColor Gray
    npm install --prefer-offline --no-audit
}
Set-Location ..
Write-Host "   [OK] Frontend dependencies ready." -ForegroundColor Green

# 5. Database Migrations & Seeding
Write-Host ""
Write-Host "[5/6] Initializing Database & Seeding 24h CSV Telemetry & Astronauts..." -ForegroundColor Yellow
Set-Location backend
& "venv\Scripts\python.exe" manage.py makemigrations core --noinput | Out-Null
& "venv\Scripts\python.exe" manage.py migrate --noinput | Out-Null
& "venv\Scripts\python.exe" manage.py seed_astrovitals
Set-Location ..
Write-Host "   [OK] Database migrated and seeded with 4,320 rows CSV and 3 astronauts." -ForegroundColor Green

# 6. Launch Applications
Write-Host ""
Write-Host "[6/6] Launching Full-Stack Application..." -ForegroundColor Yellow
Write-Host "   Starting Django Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; python manage.py runserver 0.0.0.0:8000"

Start-Sleep -Seconds 2

Write-Host "   Starting React Frontend on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Start-Sleep -Seconds 3

# Automatically open browser
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8000/swagger/"

Clear-Host
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "   ASTROVITALS AI IS NOW LIVE AND RUNNING!" -ForegroundColor Green
Write-Host "   NASA Space Apps Challenge Demonstration" -ForegroundColor White
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   [1] 🌐 Web Application Dashboard:" -ForegroundColor White
Write-Host "       --> http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "   [2] 📚 Classic Swagger UI API Documentation:" -ForegroundColor White
Write-Host "       --> http://localhost:8000/swagger/" -ForegroundColor Cyan
Write-Host ""
Write-Host "   [3] 🗄️ Database & Django Administration:" -ForegroundColor White
Write-Host "       --> http://localhost:8000/admin/" -ForegroundColor Cyan
Write-Host ""
Write-Host "   [4] 📖 ReDoc Alternative API View:" -ForegroundColor White
Write-Host "       --> http://localhost:8000/redoc/" -ForegroundColor Cyan
Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "   [INFO] Your default web browser has been opened automatically." -ForegroundColor Yellow
Write-Host "   Keep the server windows open while testing the application." -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Green
