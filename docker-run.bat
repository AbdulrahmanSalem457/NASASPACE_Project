@echo off
title AstroVitals AI - Docker Launcher
color 0B

echo =========================================================================
echo    ASTROVITALS AI - DOCKER COMPOSE LAUNCHER
echo    NASA Space Apps Challenge
echo =========================================================================
echo.

echo Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Starting Docker containers (backend and frontend)...
echo.
echo Links will be available at:
echo    * Web App:        http://localhost:5173
echo    * Swagger UI:     http://localhost:8000/swagger/
echo    * Django Admin:   http://localhost:8000/admin/
echo.

:: Automatically open browser after 5 seconds in background
start /b cmd /c "ping 127.0.0.1 -n 6 >nul && start http://localhost:5173 && start http://localhost:8000/swagger/"

docker compose up --build
