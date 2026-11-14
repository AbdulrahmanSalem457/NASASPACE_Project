@echo off
title AstroVitals AI - Launcher
color 0A

echo =========================================================================
echo    ASTROVITALS AI - LAUNCHING FULL-STACK SYSTEM
echo    NASA Space Apps Challenge
echo =========================================================================
echo.

:: Check virtual environment
if not exist "backend\venv\Scripts\python.exe" (
    echo [WARNING] Backend virtualenv not found. Running setup.bat first...
    call setup.bat
    exit /b
)

echo Starting Django Backend at http://127.0.0.1:8000 ...
start "AstroVitals-Backend" cmd /k "cd backend && venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"

ping 127.0.0.1 -n 3 >nul

echo Starting React Frontend at http://localhost:5173 ...
start "AstroVitals-Frontend" cmd /k "cd frontend && call npm run dev"

ping 127.0.0.1 -n 4 >nul

:: Open browser
start http://localhost:5173
start http://localhost:8000/swagger/

cls
echo =========================================================================
echo    ASTROVITALS AI IS NOW RUNNING!
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
echo    Keep this and the other two windows open while using the application.
echo    To stop the servers, simply close the respective command windows.
echo =========================================================================
echo.
pause
