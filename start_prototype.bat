@echo off
setlocal
echo =====================================================================
echo  AI Food Packaging Material Recommendation System (SIH 26236)
echo =====================================================================

REM Ensure python directory is in PATH for this session if installed in user local
if exist "C:\Users\anush\AppData\Local\Programs\Python\python\python.exe" (
    set "PATH=C:\Users\anush\AppData\Local\Programs\Python\python;C:\Users\anush\AppData\Local\Programs\Python\python\Scripts;%PATH%"
)

echo Starting Backend (FastAPI on Port 8000)...
start "Food Packaging Backend" cmd /k "cd /d %~dp0backend && set PATH=C:\Users\anush\AppData\Local\Programs\Python\python;C:\Users\anush\AppData\Local\Programs\Python\python\Scripts;%%PATH%% && python run.py"

echo Starting Frontend (Vite on Port 5173)...
start "Food Packaging Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://127.0.0.1:5173...
start http://127.0.0.1:5173

echo =====================================================================
echo Prototype is now running!
echo Frontend: http://127.0.0.1:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo Close the respective terminal windows to stop the servers.
echo =====================================================================
