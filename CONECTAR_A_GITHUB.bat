@echo off
title SHAMS - Conexion a GitHub
cd /d %~dp0

echo ======================================================
echo      CONFIGURANDO TU CONEXION A GITHUB - SHAMS
echo ======================================================

:: 1. Conectar con el repositorio de Yoli1947
echo 1. Conectando con https://github.com/Yoli1947/shamsonline.git...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Yoli1947/shamsonline.git

:: 2. Configurar usuario por defecto
echo 2. Configurando usuario...
git config user.email "admteruzyolanda@gmail.com"
git config user.name "Yoli1947"

:: 3. Intentar subir por primera vez (esto abrira el navegador para autorizarte)
echo 3. Autorizando tu computadora... (SE ABRIRA TU NAVEGADOR)
echo IMPORTANTE: Hace clic en "Authorize" o "Login" si te pregunta GitHub en Chrome.
git push -u origin master --force

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: No se pudo subir a GitHub. Revisa si abriste la ventana de login en Chrome.
) else (
    echo.
    echo ======================================================
    echo   ¡LISTO! TU COMPUTADORA Y GITHUB ESTAN CONECTADOS.
    echo   A partir de ahora usa siempre 'SUBIR_CAMBIOS.bat'.
    echo ======================================================
)

pause
