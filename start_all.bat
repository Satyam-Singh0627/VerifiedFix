@echo off
echo ==========================================================
echo  Starting VerifiedFix — Team ByteForce
echo ==========================================================

echo [1/2] Launching Backend on http://localhost:8000...
start "VerifiedFix Backend" powershell -NoExit -Command "cd '%~dp0'; .venv\Scripts\python backend\run_backend.py"

timeout /t 2 /nobreak > nul

echo [2/2] Launching Frontend on http://localhost:5173...
cd /d "%~dp0frontend"
npm run dev
