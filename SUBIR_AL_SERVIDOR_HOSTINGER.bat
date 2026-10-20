@echo off
title Publicar Multibrand en el VPS
cd /d "%~dp0"

echo ======================================================
echo   PUBLICAR MULTIBRAND EN EL VPS
echo ======================================================
echo.
echo Antes de continuar, confirma que los cambios ya tienen
echo un commit y que hiciste push a GitHub.
echo Este paso no sube archivos desde esta PC: actualiza el
echo codigo en el VPS y compila /var/www/multibrand.
echo.
set /p CONFIRM=Escribi S para continuar:
if /I not "%CONFIRM%"=="S" (
    echo Publicacion cancelada.
    exit /b 1
)

echo.
echo Conectando al VPS como tienda...
ssh -o ConnectTimeout=10 tienda@76.13.234.137 "cd /var/www/multibrand && git pull && npm run build"
if errorlevel 1 (
    echo.
    echo ERROR: La actualizacion o compilacion fallo.
    echo Si git pull informa cambios locales, detenete y solicita ayuda.
    echo No uses reset, force ni borres cambios del servidor.
    pause
    exit /b 1
)

echo.
echo Publicacion compilada. Verifica https://multibrandrosario.com
echo con Ctrl+F5 o en una ventana de incognito.
echo No hace falta reiniciar el servicio.
pause
