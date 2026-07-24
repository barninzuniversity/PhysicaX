@echo off
setlocal

echo.
echo ================================
echo  PhysicaX Windows Setup
echo ================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js is required but not found.
  echo Install it from https://nodejs.org and re-run this script.
  pause
  exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] npm is required but not found.
  echo Reinstall Node.js and ensure npm is included.
  pause
  exit /b 1
)

echo [1/2] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo.
echo [2/2] Verifying Electron install...
call npx electron --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Electron verification failed.
  pause
  exit /b 1
)

echo.
echo ================================
echo  Setup complete.
echo ================================
echo.
echo Next steps:
echo   - Run app:  npm start
echo   - Build EXE: npm run build
echo.

pause
