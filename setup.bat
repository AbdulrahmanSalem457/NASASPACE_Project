@echo off
title AstroVitals AI - Setup and Launcher
color 0B

echo =========================================================================
echo    ASTROVITALS AI - NASA SPACE APPS CHALLENGE
echo    Automated Environment Checker, Setup and System Launcher
echo =========================================================================
echo.

:: ---------------------------------------------------------------------------
:: STEP 1: Verify Python Environment
:: ---------------------------------------------------------------------------
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Python is not installed or not added to PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)
python --version
echo    [OK] Python verified.

:: ---------------------------------------------------------------------------
:: STEP 2: Verify Node.js and NPM
:: ---------------------------------------------------------------------------
echo.
echo [2/6] Checking Node.js and NPM installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed or not added to PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
node --version
call npm --version
echo    [OK] Node.js and NPM verified.

:: ---------------------------------------------------------------------------
:: STEP 3: Setup Python Virtual Environment and Backend Dependencies
:: ---------------------------------------------------------------------------
echo.
echo [3/6] Verifying and installing Python backend packages...
if not exist "backend\venv\Scripts\python.exe" (
    echo    Creating virtual environment in backend\venv...
    python -m venv backend\venv
)

call backend\venv\Scripts\python.exe -m pip install --upgrade pip --quiet
call backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt --quiet
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install backend dependencies!
    pause
    exit /b 1
)
echo    [OK] Backend dependencies installed and verified.

:: ---------------------------------------------------------------------------
:: STEP 4: Install Frontend NPM Dependencies
:: ---------------------------------------------------------------------------
echo.
echo [4/6] Verifying and installing Frontend NPM packages...
cd frontend
if not exist "node_modules" (
    echo    Installing frontend npm packages: React, Vite, Tailwind, Recharts...
    call npm.cmd install
) else (
    echo    Packages exist in node_modules, verifying dependencies...
    call npm.cmd install --prefer-offline --no-audit
)
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install frontend dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..
echo    [OK] Frontend dependencies ready.

:: ---------------------------------------------------------------------------
:: STEP 5: Database Migrations and Seeding
:: ---------------------------------------------------------------------------
echo.
echo [5/6] Initializing Database and Seeding 24h CSV Telemetry and Astronauts...
cd backend
call venv\Scripts\python.exe manage.py makemigrations core --noinput
call venv\Scripts\python.exe manage.py migrate --noinput
call venv\Scripts\python.exe manage.py seed_astrovitals
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Database setup or seeding encountered an error!
    cd ..
    pause
    exit /b 1
)
cd ..
echo    [OK] Database migrated and seeded successfully.

:: ---------------------------------------------------------------------------
:: STEP 6: Launch Full-Stack Application
:: ---------------------------------------------------------------------------
echo.
echo [6/6] Launching Full-Stack Application Servers...

echo    Starting Django Backend Server on port 8000...
start "AstroVitals-Backend" cmd /k "cd backend && venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"

ping 127.0.0.1 -n 3 >nul

echo    Starting React Frontend Server on port 5173...
start "AstroVitals-Frontend" cmd /k "cd frontend && npm run dev"

ping 127.0.0.1 -n 4 >nul

:: Automatically open browser
start http://localhost:5173
start http://localhost:8000/swagger/

cls
color 0A
echo =========================================================================
echo    ASTROVITALS AI IS NOW LIVE AND RUNNING!
echo    NASA Space Apps Challenge Demonstration
echo =========================================================================
echo.
echo    [1] Web Application Dashboard:
echo        --^> http://localhost:5173
echo.
echo    [2] Classic Swagger UI API Documentation:
echo        --^> http://localhost:8000/swagger/
echo.
echo    [3] Database and Django Administration:
echo        --^> http://localhost:8000/admin/
echo.
echo    [4] ReDoc Alternative API View:
echo        --^> http://localhost:8000/redoc/
echo.
echo =========================================================================
echo    [INFO] Your default web browser has been opened automatically.
echo    Keep the server windows open while testing the application.
echo    To stop the servers, simply close their command windows.
echo =========================================================================
echo.
echo Press any key to exit this launcher window...
pause >nul
