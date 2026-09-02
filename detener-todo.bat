@echo off
title Deportiva - Detener Todo
color 0C

echo.
echo ========================================
echo   DETENIENDO APPCANCHA
echo ========================================
echo.

echo Deteniendo todos los procesos de Node.js...
taskkill /F /IM node.exe >nul 2>&1

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   TODO DETENIDO
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
