# =====================================================
# Script de Deploy - Sistema Control de Riesgos Críticos
# Codelco - SSO
# =====================================================

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  PREPARANDO DEPLOY PARA PRODUCCION" -ForegroundColor Cyan
Write-Host "  Sistema Control de Riesgos Criticos" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$projectDir = "C:\xampp\htdocs\rcritico"
$deployDir = "$projectDir\deploy_rcritico"
$zipFile = "$projectDir\deploy_rcritico.zip"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$zipFileTimestamp = "$projectDir\deploy_rcritico_$timestamp.zip"

# Cambiar al directorio del proyecto
Set-Location $projectDir

# Paso 1: Build de React
Write-Host "[1/6] Ejecutando npm run build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo el build de React" -ForegroundColor Red
    exit 1
}
Write-Host "     Build completado exitosamente" -ForegroundColor Green

# Paso 2: Limpiar deploy anterior
Write-Host "[2/6] Limpiando deploy anterior..." -ForegroundColor Yellow
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
}
Write-Host "     Limpieza completada" -ForegroundColor Green

# Paso 3: Crear estructura de deploy
Write-Host "[3/6] Creando estructura de deploy..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null
Write-Host "     Estructura creada" -ForegroundColor Green

# Paso 4: Copiar archivos del build
Write-Host "[4/6] Copiando archivos del build..." -ForegroundColor Yellow
Copy-Item -Recurse "$projectDir\build\*" $deployDir
Write-Host "     Archivos del build copiados" -ForegroundColor Green

# Paso 5: Copiar API (SIN uploads para no sobrescribir archivos en producción)
Write-Host "[5/6] Copiando API y recursos..." -ForegroundColor Yellow

# Copiar API
Copy-Item -Recurse "$projectDir\api" "$deployDir\api"
Write-Host "     - API copiada" -ForegroundColor Green

# NOTA: NO copiamos uploads para no sobrescribir archivos existentes en producción
# Solo creamos la estructura de carpetas vacía (por si es instalación nueva)
New-Item -ItemType Directory -Path "$deployDir\uploads\respaldos" -Force | Out-Null
New-Item -ItemType Directory -Path "$deployDir\uploads\documentos_linea_base" -Force | Out-Null
New-Item -ItemType Directory -Path "$deployDir\uploads\archivos" -Force | Out-Null
Write-Host "     - Estructura uploads creada (vacia - NO sobrescribe produccion)" -ForegroundColor Yellow

# Crear .htaccess para React Router (si no existe)
$htaccessContent = @"
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api
  RewriteRule . /index.html [L]
</IfModule>
"@
$htaccessContent | Out-File -FilePath "$deployDir\.htaccess" -Encoding UTF8
Write-Host "     - .htaccess creado" -ForegroundColor Green

# Paso 6: Crear ZIP
Write-Host "[6/6] Creando archivo ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipFile -Force
Write-Host "     ZIP creado exitosamente" -ForegroundColor Green

# También crear una copia con timestamp
Copy-Item $zipFile $zipFileTimestamp
Write-Host "     Backup con timestamp creado" -ForegroundColor Green

# Resumen
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  DEPLOY COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Archivos generados:" -ForegroundColor White
Write-Host "  - $zipFile" -ForegroundColor Cyan
Write-Host "  - $zipFileTimestamp" -ForegroundColor Cyan
Write-Host ""
Write-Host "Carpeta de deploy:" -ForegroundColor White
Write-Host "  - $deployDir" -ForegroundColor Cyan
Write-Host ""

# Mostrar contenido del deploy
Write-Host "Contenido del deploy:" -ForegroundColor White
Get-ChildItem $deployDir | ForEach-Object {
    if ($_.PSIsContainer) {
        Write-Host "  [DIR]  $($_.Name)" -ForegroundColor Yellow
    } else {
        Write-Host "  [FILE] $($_.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "  RECORDATORIO PARA PRODUCCION" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "1. Sube el ZIP al servidor de produccion" -ForegroundColor White
Write-Host "2. Descomprime en la carpeta publica" -ForegroundColor White
Write-Host "3. Ejecuta este SQL en la base de datos:" -ForegroundColor White
Write-Host ""
Write-Host "   ALTER TABLE carpeta_linea_base" -ForegroundColor Yellow
Write-Host "     ADD COLUMN comentario_trabajador TEXT," -ForegroundColor Yellow
Write-Host "     ADD COLUMN archivos_respaldo TEXT," -ForegroundColor Yellow
Write-Host "     ADD COLUMN conversacion_seguimiento LONGTEXT;" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ALTER TABLE carpeta_linea_base_mitigadores" -ForegroundColor Yellow
Write-Host "     ADD COLUMN comentario_trabajador TEXT," -ForegroundColor Yellow
Write-Host "     ADD COLUMN archivos_respaldo TEXT," -ForegroundColor Yellow
Write-Host "     ADD COLUMN conversacion_seguimiento LONGTEXT;" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Verifica permisos de escritura en /uploads/" -ForegroundColor White
Write-Host ""
