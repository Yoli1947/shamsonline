@echo off
cd /d %~dp0
echo ============================================
echo      INICIANDO SUBIDA DE CAMBIOS DE SHAMS
echo ============================================

echo 1. Actualizando banner de MAXG...
if exist "%USERPROFILE%\Downloads\maxg bannn (1).jpg" (
    copy /y "%USERPROFILE%\Downloads\maxg bannn (1).jpg" "public\maxg\maxg banner.jpg"
    echo Banner actualizado.
)

echo 2. Generando compilado (npm run build)...
call npm run build

echo 3. Guardando cambios en Git...
git add .
git commit -m "Actualizacion de tienda: Banner MAXG, Menu y Outlet"

echo 4. Subiendo a GitHub para el servidor...
git push

echo ============================================
echo   PROCESO TERMINADO - TIENDA ACTUALIZADA
echo ============================================
pause
