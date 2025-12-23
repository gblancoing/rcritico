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

# Paso 1: Limpiar y regenerar build de React (SIEMPRE para incluir últimas mejoras)
Write-Host "[1/7] Limpiando y regenerando build de React..." -ForegroundColor Yellow
Write-Host "   Esto asegura que todas las mejoras recientes estén incluidas" -ForegroundColor Gray

# Limpiar build anterior para forzar regeneración completa
if (Test-Path "build") {
    Write-Host "   Eliminando build anterior..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "build"
    Write-Host "   Build anterior eliminado" -ForegroundColor Green
}

# Limpiar cache de node_modules si existe
if (Test-Path "node_modules\.cache") {
    Write-Host "   Eliminando cache de node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "   Cache eliminado" -ForegroundColor Green
}

# Regenerar build desde cero
Write-Host "   Ejecutando: npm run build" -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERROR: Fallo el build de React" -ForegroundColor Red
    exit 1
}
Write-Host "   Build regenerado exitosamente desde cero" -ForegroundColor Green

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

# Paso 4.5: Copiar carpeta public (imágenes necesarias para reportes)
Write-Host "[4.5/7] Copiando carpeta public (imágenes)..." -ForegroundColor Yellow
if (Test-Path "$projectDir\public") {
    # Crear directorio destino si no existe
    if (-not (Test-Path "$deployDir\public")) {
        New-Item -ItemType Directory -Path "$deployDir\public" -Force | Out-Null
    }
    # Copiar todo el contenido de public
    Copy-Item -Recurse "$projectDir\public\*" "$deployDir\public\" -Force
    Write-Host "   Carpeta public copiada (incluye muro.jpg y logo-codelco.png)" -ForegroundColor Green
    
    # Verificar que las imágenes críticas estén presentes
    if (Test-Path "$deployDir\public\img\muro.jpg") {
        Write-Host "   OK: muro.jpg encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: muro.jpg NO encontrado" -ForegroundColor Red
    }
    if (Test-Path "$deployDir\public\img\logo-codelco.png") {
        Write-Host "   OK: logo-codelco.png encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: logo-codelco.png NO encontrado" -ForegroundColor Red
    }
} else {
    Write-Host "   ADVERTENCIA: Carpeta public no encontrada" -ForegroundColor Yellow
}

# Paso 5: Copiar API (excluyendo archivos temporales y backups)
Write-Host "[5/7] Copiando API (excluyendo temporales)..." -ForegroundColor Yellow

# Crear carpeta api en deploy
New-Item -ItemType Directory -Path "$deployDir\api" -Force | Out-Null

# Archivos y carpetas a EXCLUIR
# NOTA: NO excluir archivos de stockholders (crear_tabla.php, agregar_columna_parametros.php)
# ya que son necesarios para la instalación en producción
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
    "rcritico_produccion_*.zip",
    # Excluir archivos de prueba específicos, pero NO los de instalación
    "test_archivo_pdf.php",
    "test_pdf_version.php",
    "test_pdf_simple.php",
    "test_reporte_completo.php"
)

# Copiar API recursivamente, excluyendo patrones
# IMPORTANTE: NO excluir archivos de instalación de stockholders
$apiFiles = Get-ChildItem "$projectDir\api" -Recurse -File | Where-Object {
    $shouldExclude = $false
    $fileName = $_.Name
    
    # Excepciones: NO excluir estos archivos aunque coincidan con patrones
    $excepciones = @(
        "crear_tabla.php",
        "agregar_columna_parametros.php",
        "create_informes_stockholders_table.sql",
        "add_parametros_informes.sql"
    )
    
    # Si está en la lista de excepciones, NO excluir
    if ($excepciones -contains $fileName) {
        $shouldExclude = $false
    } else {
        # Aplicar patrones de exclusión
        foreach ($pattern in $excludePatterns) {
            if ($fileName -like $pattern) {
                $shouldExclude = $true
                break
            }
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

# Copiar archivos SQL de base de datos (mejoras recientes)
Write-Host "[5.5/7] Copiando archivos SQL de base de datos..." -ForegroundColor Yellow
$sqlFiles = @(
    "api\database\create_informes_stockholders_table.sql",
    "api\database\add_parametros_informes.sql"
)
$sqlCopied = 0
foreach ($sqlFile in $sqlFiles) {
    $rutaOrigen = Join-Path $projectDir $sqlFile
    if (Test-Path $rutaOrigen) {
        $rutaDestino = Join-Path $deployDir $sqlFile
        $dirDestino = Split-Path $rutaDestino -Parent
        if (-not (Test-Path $dirDestino)) {
            New-Item -ItemType Directory -Path $dirDestino -Force | Out-Null
        }
        Copy-Item $rutaOrigen $rutaDestino -Force
        $sqlCopied++
        Write-Host "   OK $sqlFile" -ForegroundColor Green
    }
}
if ($sqlCopied -gt 0) {
    Write-Host "   SQL copiado ($sqlCopied archivos)" -ForegroundColor Green
}

# Copiar composer.json si existe (para dependencias TCPDF)
Write-Host "[5.6/7] Copiando composer.json..." -ForegroundColor Yellow
if (Test-Path "$projectDir\composer.json") {
    Copy-Item "$projectDir\composer.json" "$deployDir\composer.json" -Force
    Write-Host "   composer.json copiado" -ForegroundColor Green
} else {
    Write-Host "   composer.json no encontrado (opcional)" -ForegroundColor Yellow
}

# Paso 5.7: Copiar carpeta vendor (CRÍTICO para TCPDF)
Write-Host "[5.7/7] Copiando carpeta vendor (TCPDF y dependencias)..." -ForegroundColor Yellow
if (Test-Path "$projectDir\vendor") {
    # Crear directorio destino si no existe
    if (-not (Test-Path "$deployDir\api\vendor")) {
        New-Item -ItemType Directory -Path "$deployDir\api\vendor" -Force | Out-Null
    }
    
    # Esperar un momento para asegurar que no hay archivos bloqueados
    Start-Sleep -Seconds 1
    
    # Copiar todo el contenido de vendor (excluyendo archivos temporales)
    try {
        # Copiar autoload.php primero
        if (Test-Path "$projectDir\vendor\autoload.php") {
            Copy-Item "$projectDir\vendor\autoload.php" "$deployDir\api\vendor\autoload.php" -Force
        }
        
        # Copiar composer/
        if (Test-Path "$projectDir\vendor\composer") {
            Copy-Item -Recurse "$projectDir\vendor\composer" "$deployDir\api\vendor\composer" -Force -ErrorAction SilentlyContinue
        }
        
        # Copiar tecnickcom/tcpdf (lo más importante)
        if (Test-Path "$projectDir\vendor\tecnickcom") {
            Copy-Item -Recurse "$projectDir\vendor\tecnickcom" "$deployDir\api\vendor\tecnickcom" -Force -ErrorAction SilentlyContinue
        }
        
        # Copiar phpmailer si existe
        if (Test-Path "$projectDir\vendor\phpmailer") {
            Copy-Item -Recurse "$projectDir\vendor\phpmailer" "$deployDir\api\vendor\phpmailer" -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "   Carpeta vendor copiada" -ForegroundColor Green
    } catch {
        Write-Host "   ADVERTENCIA: Algunos archivos de vendor pueden estar bloqueados" -ForegroundColor Yellow
        Write-Host "   Reintentando copia completa..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        Copy-Item -Recurse "$projectDir\vendor\*" "$deployDir\api\vendor\" -Force -ErrorAction SilentlyContinue
    }
    
    # Verificar que TCPDF esté presente
    if (Test-Path "$deployDir\api\vendor\tecnickcom\tcpdf") {
        Write-Host "   OK: TCPDF encontrado en vendor" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: TCPDF NO encontrado en vendor" -ForegroundColor Red
    }
    if (Test-Path "$deployDir\api\vendor\autoload.php") {
        Write-Host "   OK: autoload.php encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: autoload.php NO encontrado" -ForegroundColor Red
    }
} else {
    Write-Host "   ADVERTENCIA: Carpeta vendor no encontrada" -ForegroundColor Yellow
    Write-Host "   IMPORTANTE: TCPDF no estara disponible sin vendor/" -ForegroundColor Red
}

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

# Crear .htaccess para React Router
Write-Host "[7/7] Creando archivos de configuración..." -ForegroundColor Yellow
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
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipFile)
# Buscar en la estructura del ZIP (puede tener prefijo deploy_rcritico/)
$buildJs = $zip.Entries | Where-Object { ($_.FullName -like "*/static/js/main.*.js" -or $_.FullName -like "static/js/main.*.js") -and $_.FullName -notlike "*.map" }
$indexHtml = $zip.Entries | Where-Object { $_.FullName -like "*/index.html" -or $_.FullName -eq "index.html" }
$apiFiles = $zip.Entries | Where-Object { ($_.FullName -like "*/api/*.php" -or $_.FullName -like "api/*.php") -and $_.FullName -notlike "*/test*" -and $_.FullName -notlike "*/debug*" }
$stockholdersFiles = $zip.Entries | Where-Object { $_.FullName -like "*/api/stockholders/*.php" -or $_.FullName -like "api/stockholders/*.php" }
$sqlFiles = $zip.Entries | Where-Object { $_.FullName -like "*/api/database/*informes*.sql" -or $_.FullName -like "api/database/*informes*.sql" }
$composerJson = $zip.Entries | Where-Object { $_.FullName -like "*/composer.json" -or $_.FullName -eq "composer.json" }
$zip.Dispose()

if ($buildJs) {
    Write-Host "   [OK] Build JS encontrado" -ForegroundColor Green
} else {
    Write-Host "   [ADVERTENCIA] Build JS no encontrado (puede estar en otra ruta)" -ForegroundColor Yellow
}

if ($indexHtml) {
    Write-Host "   [OK] index.html encontrado" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] ADVERTENCIA: index.html no encontrado" -ForegroundColor Red
}

if ($apiFiles.Count -gt 0) {
    $apiCount = $apiFiles.Count
    Write-Host "   [OK] API encontrada ($apiCount archivos PHP)" -ForegroundColor Green
} else {
    Write-Host "   [ADVERTENCIA] API no encontrada (puede estar en otra ruta)" -ForegroundColor Yellow
}

if ($stockholdersFiles.Count -gt 0) {
    $stockCount = $stockholdersFiles.Count
    Write-Host "   [OK] API Stockholders encontrada ($stockCount archivos)" -ForegroundColor Green
} else {
    Write-Host "   [ADVERTENCIA] API Stockholders no encontrada" -ForegroundColor Yellow
}

if ($sqlFiles.Count -gt 0) {
    $sqlCount = $sqlFiles.Count
    Write-Host "   [OK] Archivos SQL encontrados ($sqlCount archivos)" -ForegroundColor Green
} else {
    Write-Host "   [ADVERTENCIA] Archivos SQL no encontrados" -ForegroundColor Yellow
}

if ($composerJson) {
    Write-Host "   [OK] composer.json encontrado" -ForegroundColor Green
} else {
    Write-Host "   [ADVERTENCIA] composer.json no encontrado (opcional)" -ForegroundColor Yellow
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
Write-Host "5. IMPORTANTE: Ejecutar scripts SQL para nuevas tablas:" -ForegroundColor Yellow
Write-Host "   - api/database/create_informes_stockholders_table.sql" -ForegroundColor Yellow
Write-Host "   - api/database/add_parametros_informes.sql" -ForegroundColor Yellow
Write-Host "   O usar los scripts PHP de instalacion:" -ForegroundColor Yellow
Write-Host "   - http://tu-dominio/api/stockholders/crear_tabla.php" -ForegroundColor Cyan
Write-Host "   - http://tu-dominio/api/stockholders/agregar_columna_parametros.php" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Si usas Composer, instalar dependencias:" -ForegroundColor White
Write-Host "   composer install" -ForegroundColor Cyan
Write-Host "   (Necesario para TCPDF en reportes PDF)" -ForegroundColor Gray
Write-Host ""
Write-Host "7. NO se copiaron archivos de uploads para no sobrescribir" -ForegroundColor Yellow
Write-Host "   producción. La estructura de carpetas está vacía." -ForegroundColor Yellow
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

