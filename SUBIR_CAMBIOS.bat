@echo off
title Enviar commits a GitHub
cd /d "%~dp0"

echo ======================================================
echo   ENVIAR COMMITS A GITHUB
echo ======================================================
echo.
echo Este script solo envia commits ya creados.
echo No agrega archivos ni crea commits automaticamente.
echo Los cambios sin commit no se enviaran.
echo.
git status --short
echo.
git push
if errorlevel 1 (
    echo.
    echo ERROR: No se pudieron enviar los commits a GitHub.
    echo Revisa tu inicio de sesion de GitHub y vuelve a intentar.
    pause
    exit /b 1
)

echo.
echo Commits enviados a GitHub.
echo Para publicar el sitio, ejecuta SUBIR_AL_SERVIDOR_HOSTINGER.bat
echo y verifica https://multibrandrosario.com al finalizar.
pause
