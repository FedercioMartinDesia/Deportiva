@echo off
chcp 65001 >nul
title Actualizar IP - Deportiva
color 0E

echo.
echo ========================================
echo   ACTUALIZADOR DE IP - DEPORTIVA
echo ========================================
echo.

REM Obtener la IP actual de la red WiFi
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set IP=%%a
    goto :found
)

:found
REM Quitar espacios en blanco
set IP=%IP: =%

if "%IP%"=="" (
    echo [ERROR] No se pudo detectar la IP.
    echo Verifica que estes conectado a WiFi.
    pause
    exit /b 1
)

echo [INFO] Tu IP actual es: %IP%
echo.

REM Archivo a modificar
set ARCHIVO=c:\Users\PC\Documents\backCancha\appCancha-mobile\src\constants\index.js

REM Crear archivo temporal con la nueva IP
echo [1/2] Actualizando configuracion...

powershell -Command "(Get-Content '%ARCHIVO%') -replace 'http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:5000/api', 'http://%IP%:5000/api' | Set-Content '%ARCHIVO%'"

echo [2/2] Verificando...

REM Mostrar la linea actualizada
findstr /C:"API_URL" "%ARCHIVO%"

echo.
echo ========================================
echo   IP ACTUALIZADA CORRECTAMENTE
echo ========================================
echo.
echo Nueva API_URL: http://%IP%:5000/api
echo.
echo Ahora ejecuta: iniciar-todo.bat
echo.
pause
