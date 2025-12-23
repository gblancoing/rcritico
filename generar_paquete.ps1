# Script para generar paquete de produccion
Write-Host "=== Generando Paquete de Produccion ===" -ForegroundColor Cyan

# Paso 1: Limpiar build anterior
Write-Host ""
Write-Host "[1/4] Limpiando build anterior..." -ForegroundColor Yellow
if (Test-Path "build") {
    Remove-Item -Path "build" -Recurse -Force
    Write-Host "   Build anterior eliminado" -ForegroundColor Green
}

# Paso 2: Generar nuevo build
Write-Host ""
Write-Host "[2/4] Generando build de React..." -ForegroundColor Yellow
Write-Host "   Esto puede tardar varios minutos..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Error al generar build" -ForegroundColor Red
    exit 1
}
Write-Host "   Build generado correctamente" -ForegroundColor Green

# Paso 3: Copiar archivos al directorio de despliegue
Write-Host ""
Write-Host "[3/4] Copiando archivos al directorio de despliegue..." -ForegroundColor Yellow
if (Test-Path "deploy_rcritico\build") {
    Remove-Item -Path "deploy_rcritico\build" -Recurse -Force
}
Copy-Item -Path "build" -Destination "deploy_rcritico\build" -Recurse -Force
Copy-Item -Path "api\archivos\archivos.php" -Destination "deploy_rcritico\api\archivos\" -Force
Write-Host "   Archivos copiados" -ForegroundColor Green

# Paso 4: Generar paquete ZIP (método manual para asegurar que build se incluya)
Write-Host ""
Write-Host "[4/4] Generando paquete ZIP..." -ForegroundColor Yellow
$date = Get-Date -Format 'yyyyMMdd_HHmm'
$zipFile = "deploy_rcritico_$date.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Método manual para asegurar que todos los archivos se incluyan (incluyendo build)
Write-Host "   Comprimiendo archivos manualmente (esto asegura que build se incluya)..." -ForegroundColor Gray
$tempZip = [System.IO.Path]::GetTempFileName()
Remove-Item $tempZip
$zip = [System.IO.Compression.ZipFile]::Open($tempZip, [System.IO.Compression.ZipArchiveMode]::Create)
$basePath = (Resolve-Path "deploy_rcritico").Path
$allFiles = Get-ChildItem "deploy_rcritico" -Recurse -File
$count = 0
foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Substring($basePath.Length + 1).Replace('\', '/')
    try {
        $entry = $zip.CreateEntry($relativePath)
        $entryStream = $entry.Open()
        $fileStream = [System.IO.File]::OpenRead($file.FullName)
        $fileStream.CopyTo($entryStream)
        $fileStream.Close()
        $entryStream.Close()
        $count++
    } catch {
        Write-Host "    Advertencia: Error con $relativePath - $_" -ForegroundColor Yellow
    }
}
$zip.Dispose()
Move-Item $tempZip $zipFile -Force

$fileSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
Write-Host "   Paquete generado: $zipFile ($fileSize MB)" -ForegroundColor Green
Write-Host "   Archivos incluidos: $count" -ForegroundColor Gray

# Verificar que build esté incluido
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipFile)
$buildJs = $zip.Entries | Where-Object { $_.FullName -like "build/static/js/main.*.js" -and $_.FullName -notlike "*.map" }
$zip.Dispose()
if ($buildJs) {
    Write-Host "   Build JS verificado: $($buildJs[0].Name)" -ForegroundColor Green
} else {
    Write-Host "   ADVERTENCIA: Build JS no encontrado en ZIP" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Paquete Listo para Produccion ===" -ForegroundColor Cyan
Write-Host "Archivo: $zipFile" -ForegroundColor White
Write-Host "Tamaño: $fileSize MB" -ForegroundColor White

