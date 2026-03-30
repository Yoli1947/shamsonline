@echo off
title SHAMS - Subida Directa a Hostinger
cd /d %~dp0

echo ======================================================
echo    INICIANDO SUBIDA DIRECTA A HOSTINGER - SHAMS
echo ======================================================

echo 1. Preparando banner de MAXG...
if exist "%USERPROFILE%\Downloads\maxg bannn (1).jpg" (
    copy /y "%USERPROFILE%\Downloads\maxg bannn (1).jpg" "public\maxg\maxg banner.jpg"
)

echo 2. Generando compilado (npm run build)...
call npm run build

echo.
echo 3. Enviando archivos al servidor (76.13.234.137)...
echo IMPORTANTE: Si te pide contraseña, escribila y dale ENTER.
echo (La contraseña no se ve mientras escribis)

:: Enviamos la carpeta dist entera al servidor usando scp
:: Segun el guia, el sitio vive en /var/www/shamsonline/dist
scp -o ConnectTimeout=10 -r dist/* root@76.13.234.137:/var/www/shamsonline/dist/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: No se pudo conectar al servidor. Revisa tu conexion o contraseña.
) else (
    echo.
    echo ======================================================
    echo   ¡TIENDA SUBIDA AL SERVIDOR CON EXITO!
    echo   Revisa tu celular en un par de minutos. ✨
    echo ======================================================
)

pause
