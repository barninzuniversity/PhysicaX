@echo off
setlocal
title PhysicaX Setup

echo.
echo ================================
echo  PhysicaX Windows Setup
echo ================================
echo.

python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Python is missing.
  echo This installer requires Python 3.10+.
  pause
  exit /b 1
)

echo [1/2] Installing AI backend dependencies...
python ai-backend\install_requirements.py
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Failed to install Python dependencies.
  pause
  exit /b 1
)

echo.
echo [2/2] Installing Node dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo.
echo ================================
echo  Setup complete.
echo ================================
echo.
echo Start the app with:
echo   npm start
echo.
pause
