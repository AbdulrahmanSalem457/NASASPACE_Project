# AstroVitals AI — PowerShell Runner
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "   ASTROVITALS AI — LAUNCHING FULL-STACK APPLICATION" -ForegroundColor Cyan
Write-Host "   NASA Space Apps Challenge" -ForegroundColor White
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if setup was done
if (-not (Test-Path "backend\venv\Scripts\python.exe")) {
    Write-Host "Virtual environment not detected. Running setup.ps1 first..." -ForegroundColor Yellow
    & ".\setup.ps1"
}

Write-Host "Starting Django Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; python manage.py runserver 0.0.0.0:8000"

Start-Sleep -Seconds 2

Write-Host "Starting React Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Start-Sleep -Seconds 3

Clear-Host
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "   ASTROVITALS AI IS NOW RUNNING!" -ForegroundColor Green
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
Write-Host "   Keep the server windows open while running the application." -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Green
