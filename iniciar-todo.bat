@echo off
chcp 65001 >nul
title Deportiva - Iniciador Automatico
color 0A

echo.
echo ========================================
echo   INICIANDO APPCANCHA
echo ========================================
echo.

REM Detectar IP actual
echo [1/5] Detectando IP de la red...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

if "%IP%"=="" (
    color 0C
    echo [ERROR] No se detecto conexion WiFi!
    echo Conectate a una red y vuelve a intentar.
    pause
    exit /b 1
)

echo     Tu IP actual: %IP%

REM Actualizar IP en la app
set ARCHIVO=c:\Users\PC\Documents\backCancha\appCancha-mobile\src\constants\index.js
powershell -Command "(Get-Content '%ARCHIVO%') -replace 'http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:5000/api', 'http://%IP%:5000/api' | Set-Content '%ARCHIVO%'"
echo     API_URL actualizada automaticamente

REM Limpiar procesos anteriores
echo [2/5] Limpiando procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [3/5] Iniciando Backend...
start "Backend - Deportiva" cmd /k "cd /d c:\Users\PC\Documents\backCancha && npm run dev"
timeout /t 5 /nobreak

echo [4/5] Iniciando App Movil...
start "Frontend - Deportiva" cmd /k "cd /d c:\Users\PC\Documents\backCancha\appCancha-mobile && npm start"

echo [5/5] Listo!
echo.
echo ========================================
echo   TODO INICIADO
echo ========================================
echo.
echo Backend: http://%IP%:5000
echo Frontend: Escanea el QR en la terminal
echo.
echo IMPORTANTE: Tu telefono debe estar en la misma red WiFi
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
