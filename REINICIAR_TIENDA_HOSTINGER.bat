@echo off
title Reinicio opcional de Multibrand
cd /d "%~dp0"

echo ======================================================
echo   REINICIO OPCIONAL DE MULTIBRAND
echo ======================================================
echo.
echo No reinicies normalmente despues de publicar:
echo el servicio sirve automaticamente el nuevo contenido de dist.
echo Usa esto solo si el sitio sigue sin actualizarse despues de
echo verificarlo con Ctrl+F5 o en una ventana de incognito.
echo.
set /p CONFIRM=Escribi S para reiniciar multibrand-web:
if /I not "%CONFIRM%"=="S" (
    echo Reinicio cancelado.
    exit /b 1
)

ssh -o ConnectTimeout=10 tienda@76.13.234.137 "sudo systemctl restart multibrand-web"
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo reiniciar multibrand-web.
    pause
    exit /b 1
)

echo.
echo Servicio multibrand-web reiniciado.
pause
