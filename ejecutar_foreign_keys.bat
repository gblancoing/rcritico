@echo off
REM Script batch para ejecutar el SQL desde CMD
REM Ejecutar desde CMD: ejecutar_foreign_keys.bat

echo Ejecutando script SQL...
echo.

cd /d "%~dp0"
C:\xampp\mysql\bin\mysql.exe -u root rcritico < api\database\reparar_foreign_keys_simple.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Script ejecutado correctamente!
    echo Verifica en: http://localhost/rcritico/api/verificar_foreign_keys.php
) else (
    echo.
    echo Error al ejecutar el script
    echo Codigo de salida: %ERRORLEVEL%
)

pause

