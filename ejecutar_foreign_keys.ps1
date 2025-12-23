# Script PowerShell para ejecutar el SQL
# Ejecutar desde PowerShell: .\ejecutar_foreign_keys.ps1

$sqlFile = "api\database\reparar_foreign_keys_simple.sql"
$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
$database = "rcritico"
$user = "root"
$password = ""  # Cambia esto si tienes contraseña

Write-Host "Ejecutando script SQL..." -ForegroundColor Yellow
Write-Host "Archivo: $sqlFile" -ForegroundColor Cyan
Write-Host "Base de datos: $database" -ForegroundColor Cyan
Write-Host ""

# Leer el contenido del archivo SQL
$sqlContent = Get-Content -Path $sqlFile -Raw -Encoding UTF8

# Ejecutar el comando MySQL
if ($password) {
    $sqlContent | & $mysqlPath -u $user -p$password $database
} else {
    $sqlContent | & $mysqlPath -u $user $database
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Script ejecutado correctamente!" -ForegroundColor Green
    Write-Host "Verifica en: http://localhost/rcritico/api/verificar_foreign_keys.php" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Error al ejecutar el script" -ForegroundColor Red
    Write-Host "Código de salida: $LASTEXITCODE" -ForegroundColor Red
}

