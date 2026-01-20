# =====================================================
# Script para Generar Paquete de Producción
# Sistema Control de Riesgos Críticos
# =====================================================

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  GENERANDO PAQUETE PARA PRODUCCION" -ForegroundColor Cyan
Write-Host "  Sistema Control de Riesgos Criticos" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$projectDir = Get-Location
$deployDir = "$projectDir\deploy_rcritico"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFile = "$projectDir\rcritico_produccion_$timestamp.zip"

# Cambiar al directorio del proyecto
Set-Location $projectDir

# Paso 1: Verificar y regenerar build de React
Write-Host "[1/7] Verificando y regenerando build de React..." -ForegroundColor Yellow
# Siempre regenerar el build para asegurar que incluya los últimos cambios
Write-Host "   Regenerando build para incluir últimos cambios..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ERROR: Fallo el build de React" -ForegroundColor Red
        exit 1
    }
Write-Host "   Build regenerado exitosamente" -ForegroundColor Green

# Paso 2: Limpiar deploy anterior
Write-Host "[2/7] Limpiando deploy anterior..." -ForegroundColor Yellow
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
Write-Host "   Limpieza completada" -ForegroundColor Green

# Paso 3: Crear estructura de deploy
Write-Host "[3/7] Creando estructura de deploy..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null
Write-Host "   Estructura creada" -ForegroundColor Green

# Paso 4: Copiar build de React
Write-Host "[4/7] Copiando build de React..." -ForegroundColor Yellow
Copy-Item -Recurse "$projectDir\build\*" "$deployDir\" -Force
Write-Host "   Build copiado" -ForegroundColor Green

# Paso 5: Copiar API (excluyendo archivos temporales y backups)
Write-Host "[5/7] Copiando API (excluyendo temporales)..." -ForegroundColor Yellow
Write-Host "   Incluyendo: vendor/PHPMailer, email_functions_real.php y todos los endpoints" -ForegroundColor Gray

# Crear carpeta api en deploy
New-Item -ItemType Directory -Path "$deployDir\api" -Force | Out-Null

# Archivos y carpetas a EXCLUIR
$excludePatterns = @(
    "*.zip",
    "*.log",
    "*.tmp",
    "*test*.php",
    "*debug*.php",
    "*verificar*.php",
    "*limpiar*.php",
    "*migrar*.php",
    "*importar*.php",
    "*exportar*.php",
    "*comparar*.php",
    "*buscar*.php",
    "*analizar*.php",
    "*diagnosticar*.php",
    "*mostrar*.php",
    "*detalle*.php",
    "*actualizar*.php",
    "*completar*.php",
    "*corregir*.php",
    "*crear_sql*.php",
    "*generar_sql*.php",
    "*reactivar*.php",
    "Backup_Anterior_*.sql",
    "importar_*.sql",
    "exportacion_*.sql",
    "reparar_*.sql",
    "solucionar_*.sql",
    "agregar_fk_*.sql",
    "db_combinada.sql",
    "db_combinado_*.sql",
    "ACTUALIZAR_*.sql",
    "EXPORTAR_*.sql",
    "ACTIVAR_*.sql",
    "COPIAR_*.sql",
    "rcritico_produccion_*.zip"
)

# Copiar API recursivamente, excluyendo patrones
$apiFiles = Get-ChildItem "$projectDir\api" -Recurse -File | Where-Object {
    $shouldExclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($_.Name -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude
}

$apiDirs = Get-ChildItem "$projectDir\api" -Recurse -Directory

# Crear estructura de directorios
foreach ($dir in $apiDirs) {
    $relativePath = $dir.FullName.Substring($projectDir.Length + 5) # +5 para "api\"
    $targetDir = "$deployDir\api\$relativePath"
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
}

# Copiar archivos
$copied = 0
foreach ($file in $apiFiles) {
    # Calcular ruta relativa correctamente
    $apiPath = "$projectDir\api"
    $relativePath = $file.FullName.Substring($apiPath.Length + 1)
    $targetFile = "$deployDir\api\$relativePath"
    $targetDir = Split-Path $targetFile -Parent
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    Copy-Item $file.FullName $targetFile -Force
    $copied++
}

Write-Host "   API copiada ($copied archivos)" -ForegroundColor Green

# NO copiar uploads (para no sobrescribir archivos en producción)
# Solo crear estructura vacía
Write-Host "[6/7] Creando estructura de uploads (vacía)..." -ForegroundColor Yellow
$uploadsDirs = @(
    "uploads\respaldos",
    "uploads\documentos_linea_base",
    "uploads\tareas_adjuntos",
    "uploads\archivos"
)
foreach ($dir in $uploadsDirs) {
    $fullPath = "$deployDir\$dir"
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
    }
}
Write-Host "   Estructura uploads creada (vacía - no sobrescribe producción)" -ForegroundColor Green

# Paso 9: Crear archivos de configuración
Write-Host "[9/9] Creando archivos de configuración..." -ForegroundColor Yellow
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
$htaccessContent | Out-File -FilePath "$deployDir\.htaccess" -Encoding UTF8 -NoNewline

# Copiar _redirects si existe
if (Test-Path "$projectDir\_redirects") {
    Copy-Item "$projectDir\_redirects" "$deployDir\_redirects" -Force
}

# Copiar index.php si existe
if (Test-Path "$projectDir\index.php") {
    Copy-Item "$projectDir\index.php" "$deployDir\index.php" -Force
}

# Copiar package.json y package-lock.json si existen (para referencia)
if (Test-Path "$projectDir\package.json") {
    Copy-Item "$projectDir\package.json" "$deployDir\package.json" -Force
}
if (Test-Path "$projectDir\package-lock.json") {
    Copy-Item "$projectDir\package-lock.json" "$deployDir\package-lock.json" -Force
}

# Copiar README si existe
if (Test-Path "$projectDir\README.md") {
    Copy-Item "$projectDir\README.md" "$deployDir\README.md" -Force
}

# Verificar que los archivos de reportes mejorados estén incluidos
$reportFiles = @(
    "api\dashboard\generar_reporte_html.php",
    "api\dashboard\generar_reporte_pdf.php"
)
$missingReports = @()
foreach ($file in $reportFiles) {
    if (-not (Test-Path "$deployDir\$file")) {
        $missingReports += $file
    }
}

if ($missingReports.Count -gt 0) {
    Write-Host "   ADVERTENCIA: Archivos de reportes faltantes:" -ForegroundColor Yellow
    foreach ($file in $missingReports) {
        Write-Host "     - $file" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Archivos de reportes mejorados incluidos" -ForegroundColor Green
}

# Verificar archivos críticos corregidos
$criticalFiles = @(
    "api\archivos\linea_base_carpetas.php",
    "api\archivos\carpetas.php",
    "api\carpetas.php",
    # Nuevos archivos para nivel 2 (bases_controles)
    "api\archivos\bases_controles_carpetas.php",
    "api\archivos\bases_controles_archivos.php",
    # Sistema de tareas
    "api\archivos\carpeta_tareas.php",
    "api\archivos\carpeta_tarea_comentarios.php",
    "api\archivos\carpeta_tarea_asignaciones.php",
    "api\archivos\carpeta_tarea_adjuntos.php",
    # Sistema de correos
    "api\utils\email_functions_real.php",
    # PHPMailer (necesario para envío de correos)
    "api\vendor\autoload.php",
    "api\vendor\phpmailer\phpmailer\src\PHPMailer.php",
    "api\vendor\phpmailer\phpmailer\src\SMTP.php",
    "api\vendor\phpmailer\phpmailer\src\Exception.php",
    # Cálculo de promedios
    "api\archivos\promedio_ponderacion.php",
    # Descarga de ZIP mejorada (nivel 1 con nivel 0 completo, sin límites)
    "api\archivos\descargar_rc.php"
)
$missingCritical = @()
foreach ($file in $criticalFiles) {
    if (-not (Test-Path "$deployDir\$file")) {
        $missingCritical += $file
    }
}

if ($missingCritical.Count -gt 0) {
    Write-Host "   ADVERTENCIA: Archivos críticos faltantes:" -ForegroundColor Yellow
    foreach ($file in $missingCritical) {
        Write-Host "     - $file" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Archivos críticos incluidos (incluyendo nuevas mejoras)" -ForegroundColor Green
}

Write-Host "   Archivos de configuración creados" -ForegroundColor Green

# Generar ZIP
Write-Host ""
Write-Host "Generando archivo ZIP..." -ForegroundColor Yellow
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Esperar un momento para asegurar que no hay archivos bloqueados
Start-Sleep -Seconds 2

# Contar archivos antes de comprimir
$allFiles = Get-ChildItem $deployDir -Recurse -File
$count = $allFiles.Count
Write-Host "   Comprimiendo $count archivos..." -ForegroundColor Gray

# Cambiar al directorio padre para comprimir correctamente
$parentDir = Split-Path $deployDir -Parent
$deployFolderName = Split-Path $deployDir -Leaf
$originalLocation = Get-Location

try {
    Set-Location $parentDir
    # Comprimir desde el directorio padre para que la estructura sea correcta
    Compress-Archive -Path "$deployFolderName\*" -DestinationPath (Join-Path $originalLocation (Split-Path $zipFile -Leaf)) -Force -ErrorAction Stop
} catch {
    Write-Host "   Advertencia: Algunos archivos pueden estar bloqueados, reintentando..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    Compress-Archive -Path "$deployFolderName\*" -DestinationPath (Join-Path $originalLocation (Split-Path $zipFile -Leaf)) -Force
} finally {
    Set-Location $originalLocation
}

if (-not (Test-Path $zipFile)) {
    Write-Host "   ERROR: No se pudo crear el archivo ZIP" -ForegroundColor Red
    exit 1
}

$fileSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
Write-Host "   ZIP generado exitosamente" -ForegroundColor Green

# Resumen
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  PAQUETE GENERADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Archivo ZIP:" -ForegroundColor White
Write-Host "  $zipFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tamaño: $fileSize MB" -ForegroundColor White
Write-Host "Archivos incluidos: $count" -ForegroundColor White
Write-Host ""
Write-Host "Carpeta de deploy:" -ForegroundColor White
Write-Host "  $deployDir" -ForegroundColor Cyan
Write-Host ""

# Verificar contenido importante
Write-Host "Verificando contenido del paquete..." -ForegroundColor Yellow

# Verificar en la carpeta de deploy primero (más confiable)
Write-Host "   Verificando archivos en deploy_rcritico..." -ForegroundColor Gray

$checks = @{
    "Build JS" = (Get-ChildItem "$deployDir\static\js\main.*.js" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*.map" } | Measure-Object).Count -gt 0
    "index.html" = Test-Path "$deployDir\index.html"
    "API PHP" = (Get-ChildItem "$deployDir\api" -Recurse -Filter "*.php" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0
    "Reporte HTML" = Test-Path "$deployDir\api\dashboard\generar_reporte_html.php"
    "Reporte PDF" = Test-Path "$deployDir\api\dashboard\generar_reporte_pdf.php"
    "linea_base_carpetas.php" = Test-Path "$deployDir\api\archivos\linea_base_carpetas.php"
    "carpetas.php" = Test-Path "$deployDir\api\carpetas.php"
    "bases_controles_carpetas.php" = Test-Path "$deployDir\api\archivos\bases_controles_carpetas.php"
    "bases_controles_archivos.php" = Test-Path "$deployDir\api\archivos\bases_controles_archivos.php"
    "carpeta_tareas.php" = Test-Path "$deployDir\api\archivos\carpeta_tareas.php"
    "carpeta_tarea_comentarios.php" = Test-Path "$deployDir\api\archivos\carpeta_tarea_comentarios.php"
    "carpeta_tarea_adjuntos.php" = Test-Path "$deployDir\api\archivos\carpeta_tarea_adjuntos.php"
    "email_functions_real.php" = Test-Path "$deployDir\api\utils\email_functions_real.php"
    "promedio_ponderacion.php" = Test-Path "$deployDir\api\archivos\promedio_ponderacion.php"
    "descargar_rc.php" = Test-Path "$deployDir\api\archivos\descargar_rc.php"
    "vendor/autoload.php" = Test-Path "$deployDir\api\vendor\autoload.php"
    "PHPMailer.php" = Test-Path "$deployDir\api\vendor\phpmailer\phpmailer\src\PHPMailer.php"
    "Archivos públicos" = Test-Path "$deployDir\public"
}

# También verificar en el ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipFile)
$zipEntries = $zip.Entries | ForEach-Object { $_.FullName }
$zip.Dispose()

foreach ($check in $checks.GetEnumerator()) {
    if ($check.Value) {
        Write-Host "   [OK] $($check.Key)" -ForegroundColor Green
} else {
        Write-Host "   [ERROR] $($check.Key) no encontrado" -ForegroundColor Red
}
}

# Verificar también en el ZIP
$zipBuildJs = $zipEntries | Where-Object { $_ -like "static/js/main.*.js" -and $_ -notlike "*.map" }
$zipApiFiles = $zipEntries | Where-Object { $_ -like "api/*.php" }
$zipReportHtml = $zipEntries | Where-Object { $_ -eq "api/dashboard/generar_reporte_html.php" -or $_ -like "*generar_reporte_html.php" }
$zipReportPdf = $zipEntries | Where-Object { $_ -eq "api/dashboard/generar_reporte_pdf.php" -or $_ -like "*generar_reporte_pdf.php" }
$zipLineaBase = $zipEntries | Where-Object { $_ -like "*linea_base_carpetas.php" }
$zipBasesControlesCarpetas = $zipEntries | Where-Object { $_ -like "*bases_controles_carpetas.php" }
$zipBasesControlesArchivos = $zipEntries | Where-Object { $_ -like "*bases_controles_archivos.php" }
$zipCarpetaTareas = $zipEntries | Where-Object { $_ -like "*carpeta_tareas.php" -and $_ -notlike "*backup*" -and $_ -notlike "*nuevo*" }
$zipCarpetaTareaComentarios = $zipEntries | Where-Object { $_ -like "*carpeta_tarea_comentarios.php" }
$zipCarpetaTareaAdjuntos = $zipEntries | Where-Object { $_ -like "*carpeta_tarea_adjuntos.php" }
$zipEmailFunctions = $zipEntries | Where-Object { $_ -like "*email_functions_real.php" }
$zipPromedioPonderacion = $zipEntries | Where-Object { $_ -like "*promedio_ponderacion.php" }
$zipDescargarRc = $zipEntries | Where-Object { $_ -like "*descargar_rc.php" -and $_ -notlike "*backup*" -and $_ -notlike "*temp*" }

if ($zipBuildJs) {
    Write-Host "   [OK] Build JS verificado en ZIP" -ForegroundColor Green
}
if ($zipApiFiles.Count -gt 0) {
    Write-Host "   [OK] API verificada en ZIP ($($zipApiFiles.Count) archivos PHP)" -ForegroundColor Green
}
if ($zipReportHtml) {
    Write-Host "   [OK] Reporte HTML verificado en ZIP" -ForegroundColor Green
}
if ($zipReportPdf) {
    Write-Host "   [OK] Reporte PDF verificado en ZIP" -ForegroundColor Green
}
if ($zipLineaBase) {
    Write-Host "   [OK] linea_base_carpetas.php verificado en ZIP" -ForegroundColor Green
}
if ($zipBasesControlesCarpetas) {
    Write-Host "   [OK] bases_controles_carpetas.php verificado en ZIP" -ForegroundColor Green
}
if ($zipBasesControlesArchivos) {
    Write-Host "   [OK] bases_controles_archivos.php verificado en ZIP" -ForegroundColor Green
}
if ($zipCarpetaTareas) {
    Write-Host "   [OK] carpeta_tareas.php verificado en ZIP" -ForegroundColor Green
}
if ($zipCarpetaTareaComentarios) {
    Write-Host "   [OK] carpeta_tarea_comentarios.php verificado en ZIP" -ForegroundColor Green
}
if ($zipCarpetaTareaAdjuntos) {
    Write-Host "   [OK] carpeta_tarea_adjuntos.php verificado en ZIP" -ForegroundColor Green
}
if ($zipEmailFunctions) {
    Write-Host "   [OK] email_functions_real.php verificado en ZIP" -ForegroundColor Green
}
if ($zipPromedioPonderacion) {
    Write-Host "   [OK] promedio_ponderacion.php verificado en ZIP" -ForegroundColor Green
}
if ($zipDescargarRc) {
    Write-Host "   [OK] descargar_rc.php verificado en ZIP" -ForegroundColor Green
}

# Verificar PHPMailer y vendor
$zipVendorAutoload = $zipEntries | Where-Object { $_ -like "*vendor/autoload.php" -or $_ -like "*api/vendor/autoload.php" }
$zipPHPMailer = $zipEntries | Where-Object { $_ -like "*PHPMailer.php" }
$zipSMTP = $zipEntries | Where-Object { $_ -like "*SMTP.php" }

if ($zipVendorAutoload) {
    Write-Host "   [OK] vendor/autoload.php verificado en ZIP" -ForegroundColor Green
}
if ($zipPHPMailer) {
    Write-Host "   [OK] PHPMailer.php verificado en ZIP" -ForegroundColor Green
}
if ($zipSMTP) {
    Write-Host "   [OK] SMTP.php verificado en ZIP" -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "  INSTRUCCIONES PARA PRODUCCION" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "1. Sube el archivo ZIP al servidor:" -ForegroundColor White
Write-Host "   $zipFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Descomprime en la carpeta del subdominio:" -ForegroundColor White
Write-Host "   rcritico.carenvp.cl" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Verifica permisos de escritura en:" -ForegroundColor White
Write-Host "   - /uploads/respaldos/" -ForegroundColor Yellow
Write-Host "   - /uploads/documentos_linea_base/" -ForegroundColor Yellow
Write-Host "   - /uploads/tareas_adjuntos/" -ForegroundColor Yellow
Write-Host "   - /api/uploads/iconos_carpetas/" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. La base de datos ya está configurada en:" -ForegroundColor White
Write-Host "   api/config/config.php" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. NO se copiaron archivos de uploads para no sobrescribir" -ForegroundColor Yellow
Write-Host "   producción. La estructura de carpetas está vacía." -ForegroundColor Yellow
Write-Host ""
Write-Host "6. NUEVAS MEJORAS INCLUIDAS EN ESTE PAQUETE:" -ForegroundColor White
Write-Host "   [OK] Sistema de Tareas completo (creacion, comentarios, adjuntos)" -ForegroundColor Green
Write-Host "   [OK] Envio de correos electronicos para tareas y avisos" -ForegroundColor Green
Write-Host "   [OK] PHPMailer incluido (biblioteca para envio de correos)" -ForegroundColor Green
Write-Host "   [OK] Gestion de documentos para nivel 2 (bases_controles)" -ForegroundColor Green
Write-Host "   [OK] Calculo de promedios de ponderacion mejorado" -ForegroundColor Green
Write-Host "   [OK] Sistema de programar avisos por correo (nivel 2)" -ForegroundColor Green
Write-Host "   [OK] Foro de observaciones mejorado" -ForegroundColor Green
Write-Host "   [OK] Validacion y observaciones para nivel 2" -ForegroundColor Green
Write-Host "   [OK] Descarga ZIP mejorada (nivel 1 incluye nivel 0 completo)" -ForegroundColor Green
Write-Host "   [OK] Barra de progreso de descarga en tiempo real" -ForegroundColor Green
Write-Host "   [OK] Sin limitaciones de tamaño o tiempo para descargas" -ForegroundColor Green
Write-Host ""
Write-Host "7. VERIFICACION DE DEPENDENCIAS:" -ForegroundColor White
Write-Host "   [OK] PHPMailer (api/vendor/phpmailer/) - Para envio de correos" -ForegroundColor Green
Write-Host "   [OK] Composer autoload (api/vendor/autoload.php)" -ForegroundColor Green
Write-Host ""
Write-Host "8. IMPORTANTE: Verificar que las tablas de tareas existan:" -ForegroundColor White
Write-Host "   - carpeta_tareas" -ForegroundColor Yellow
Write-Host "   - carpeta_tarea_asignaciones" -ForegroundColor Yellow
Write-Host "   - carpeta_tarea_comentarios" -ForegroundColor Yellow
Write-Host "   - carpeta_tarea_adjuntos" -ForegroundColor Yellow
Write-Host "   Si no existen, ejecutar: recrear_tabla_carpeta_tareas.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "9. IMPORTANTE: Verificar que las tablas de bases_controles existan:" -ForegroundColor White
Write-Host "   - bases_controles_carpetas" -ForegroundColor Yellow
Write-Host "   - bases_controles_archivos" -ForegroundColor Yellow
Write-Host "   (Se crean automáticamente al usar las funciones)" -ForegroundColor Yellow
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

