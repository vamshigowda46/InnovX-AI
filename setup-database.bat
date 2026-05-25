@echo off
echo ============================================
echo   InnovX AI - Database Setup
echo ============================================
echo.
echo This will create the database and tables.
echo Make sure MySQL is running!
echo.

set /p MYSQL_USER=Enter MySQL username (default: root): 
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASS=Enter MySQL password: 

echo.
echo Creating database and tables...
mysql -u %MYSQL_USER% -p%MYSQL_PASS% < backend\schema.sql

if %ERRORLEVEL% == 0 (
    echo.
    echo [SUCCESS] Database setup complete!
    echo Database: innovx_db
    echo Demo user: alex@demo.com / Demo@1234
) else (
    echo.
    echo [ERROR] Database setup failed. Check your MySQL credentials.
)

pause
