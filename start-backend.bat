@echo off
echo ============================================
echo   InnovX AI - Backend Setup
echo ============================================

cd backend

echo [1/4] Creating Python virtual environment...
python -m venv venv

echo [2/4] Activating virtual environment...
call venv\Scripts\activate

echo [3/4] Installing dependencies...
pip install -r requirements.txt

echo [4/4] Starting Flask server...
echo.
echo Backend will run at: http://localhost:5000
echo.
echo IMPORTANT: Make sure to:
echo   1. Update backend\.env with your MySQL password
echo   2. Run schema.sql in MySQL first
echo   3. Add your GEMINI_API_KEY to backend\.env
echo.
python run.py

pause
