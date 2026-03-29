@echo off
title SHAMS - Sistema de Backup Automatico
cd /d %~dp0

:loop
cls
echo ======================================================
echo      SISTEMA DE BACKUP AUTOMATICO - SHAMS ONLINE
echo ======================================================
echo.
echo [%DATE% %TIME%] Iniciando respaldo programado...
echo.

:: Ejecutamos el script de Node que ya tienes para respaldar app y db
node scripts/backup-app.js

echo.
echo ======================================================
echo   BACKUP COMPLETADO CON EXITO. Proximo en 60 minutos.
echo   (No cierres esta ventana para mantener el ciclo)
echo ======================================================
echo.

:: Espera 3600 segundos (1 hora)
timeout /t 3600 /nobreak

goto loop
