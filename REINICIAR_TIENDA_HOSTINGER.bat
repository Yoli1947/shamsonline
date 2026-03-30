@echo off
title SHAMS - Medico del Servidor
cd /d %~dp0

echo ======================================================
echo     INICIANDO MANTENIMIENTO DEL SERVIDOR - SHAMS
echo ======================================================

echo 1. Corrigiendo permisos de archivos en el servidor...
echo (Si te pide la contraseña de root, escribila y dale ENTER)
ssh -o ConnectTimeout=10 root@76.13.234.137 "chown -R www-data:www-data /var/www/shamsonline/dist && chmod -R 755 /var/www/shamsonline/dist"

echo 2. Reiniciando servicio Web (Nginx)...
ssh -o ConnectTimeout=10 root@76.13.234.137 "systemctl restart nginx"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: No se pudo conectar. Revisa tu internet o contraseña.
) else (
    echo.
    echo ======================================================
    echo      ¡SERVICIOS REINICIADOS CON EXITO!
    echo      Probá entrar ahora a shamsonline.com.ar ✨
    echo ======================================================
)

pause
