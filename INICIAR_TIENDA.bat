@echo off
cd /d %~dp0

echo Actualizando banner de MAXG...
if exist "%USERPROFILE%\Downloads\maxg bannn (1).jpg" (
    copy /y "%USERPROFILE%\Downloads\maxg bannn (1).jpg" "public\maxg\maxg banner.jpg"
    echo Banner actualizado con exito.
) else (
    echo No se encontro el archivo en Descargas, usando el actual.
)

echo Iniciando el servidor de la Tienda Shams...
echo No cierres esta ventana mientras uses la tienda.
start http://localhost:3000
npm run dev
pause
