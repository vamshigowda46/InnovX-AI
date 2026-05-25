@echo off
echo ============================================
echo   InnovX AI - Frontend Setup
echo ============================================

cd frontend

echo [1/2] Installing Node.js dependencies...
npm install

echo [2/2] Starting Vite dev server...
echo.
echo Frontend will run at: http://localhost:5173
echo.
npm run dev

pause
