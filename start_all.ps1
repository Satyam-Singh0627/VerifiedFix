# VerifiedFix - Start Backend & Frontend
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting VerifiedFix — Team ByteForce" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Start backend in a background process
Write-Host "[1/2] Starting Backend on http://localhost:8000..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; .venv\Scripts\python backend\run_backend.py" -PassThru

# Wait 2 seconds for backend to initialize
Start-Sleep -Seconds 2

# Start frontend
Write-Host "[2/2] Starting Frontend on http://localhost:5173..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\frontend"
npm run dev
