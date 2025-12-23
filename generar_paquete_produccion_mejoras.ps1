# Script para generar paquete de produccion con mejoras
# Fecha: 2025-12-22

$fecha = Get-Date -Format "yyyyMMdd_HHmmss"
$nombrePaquete = "rcritico_produccion_$fecha.zip"
$rutaPaquete = Join-Path $PSScriptRoot $nombrePaquete

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Generando paquete de produccion..." -ForegroundColor Cyan
Write-Host "Nombre: $nombrePaquete" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# Eliminar paquete anterior si existe
if (Test-Path $rutaPaquete) {
    Remove-Item $rutaPaquete -Force
    Write-Host "Paquete anterior eliminado." -ForegroundColor Yellow
}

# Crear directorio temporal
$tempDir = Join-Path $env:TEMP "rcritico_paquete_$fecha"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "`nCopiando archivos..." -ForegroundColor Green

# ============================================
# 1. ARCHIVOS PHP MODIFICADOS/CREADOS
# ============================================
Write-Host "  - Archivos PHP..." -ForegroundColor Gray

# Dashboard - Reportes
$archivosPHP = @(
    "api\dashboard\generar_reporte_pdf.php",
    "api\dashboard\generar_reporte_html.php",
    "api\view_office.php"
)

# Stockholders - Nuevos endpoints
$archivosStockholders = @(
    "api\stockholders\informes.php",
    "api\stockholders\asociar_reporte.php",
    "api\stockholders\crear_tabla.php",
    "api\stockholders\agregar_columna_parametros.php"
)

# Combinar todos los archivos PHP
$todosArchivosPHP = $archivosPHP + $archivosStockholders

foreach ($archivo in $todosArchivosPHP) {
    $rutaOrigen = Join-Path $PSScriptRoot $archivo
    if (Test-Path $rutaOrigen) {
        $rutaDestino = Join-Path $tempDir $archivo
        $dirDestino = Split-Path $rutaDestino -Parent
        if (-not (Test-Path $dirDestino)) {
            New-Item -ItemType Directory -Path $dirDestino -Force | Out-Null
        }
        Copy-Item $rutaOrigen $rutaDestino -Force
        Write-Host "    OK $archivo" -ForegroundColor Green
    } else {
        Write-Host "    ERROR $archivo (NO ENCONTRADO)" -ForegroundColor Red
    }
}

# ============================================
# 2. ARCHIVOS SQL
# ============================================
Write-Host "  - Archivos SQL..." -ForegroundColor Gray

$archivosSQL = @(
    "api\database\create_informes_stockholders_table.sql",
    "api\database\add_parametros_informes.sql"
)

foreach ($archivo in $archivosSQL) {
    $rutaOrigen = Join-Path $PSScriptRoot $archivo
    if (Test-Path $rutaOrigen) {
        $rutaDestino = Join-Path $tempDir $archivo
        $dirDestino = Split-Path $rutaDestino -Parent
        if (-not (Test-Path $dirDestino)) {
            New-Item -ItemType Directory -Path $dirDestino -Force | Out-Null
        }
        Copy-Item $rutaOrigen $rutaDestino -Force
        Write-Host "    OK $archivo" -ForegroundColor Green
    } else {
        Write-Host "    ERROR $archivo (NO ENCONTRADO)" -ForegroundColor Red
    }
}

# ============================================
# 3. ARCHIVOS REACT/JS MODIFICADOS
# ============================================
Write-Host "  - Archivos React/JS..." -ForegroundColor Gray

$archivosJS = @(
    "src\components\GestorArchivos.js",
    "src\analisis\InformesStockholders.js"
)

foreach ($archivo in $archivosJS) {
    $rutaOrigen = Join-Path $PSScriptRoot $archivo
    if (Test-Path $rutaOrigen) {
        $rutaDestino = Join-Path $tempDir $archivo
        $dirDestino = Split-Path $rutaDestino -Parent
        if (-not (Test-Path $dirDestino)) {
            New-Item -ItemType Directory -Path $dirDestino -Force | Out-Null
        }
        Copy-Item $rutaOrigen $rutaDestino -Force
        Write-Host "    OK $archivo" -ForegroundColor Green
    } else {
        Write-Host "    ERROR $archivo (NO ENCONTRADO)" -ForegroundColor Red
    }
}

# ============================================
# 4. ARCHIVOS DE CONFIGURACION
# ============================================
Write-Host "  - Archivos de configuracion..." -ForegroundColor Gray

$archivosConfig = @(
    "composer.json"
)

foreach ($archivo in $archivosConfig) {
    $rutaOrigen = Join-Path $PSScriptRoot $archivo
    if (Test-Path $rutaOrigen) {
        $rutaDestino = Join-Path $tempDir $archivo
        Copy-Item $rutaOrigen $rutaDestino -Force
        Write-Host "    OK $archivo" -ForegroundColor Green
    } else {
        Write-Host "    ERROR $archivo (NO ENCONTRADO)" -ForegroundColor Red
    }
}

# ============================================
# 5. CREAR ARCHIVO README CON INSTRUCCIONES
# ============================================
Write-Host "  - Creando README..." -ForegroundColor Gray

$fechaReadme = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$readmeLines = @()
$readmeLines += "# Paquete de Produccion - Mejoras Reportes Ejecutivos"
$readmeLines += "Fecha: $fechaReadme"
$readmeLines += ""
$readmeLines += "## Contenido del Paquete"
$readmeLines += ""
$readmeLines += "### Nuevas Funcionalidades"
$readmeLines += ""
$readmeLines += "1. Visualizacion de Archivos Office"
$readmeLines += "   - Visualizacion de Word, Excel, PowerPoint mediante visores externos"
$readmeLines += "   - Archivo: api/view_office.php"
$readmeLines += "   - Modificado: src/components/GestorArchivos.js"
$readmeLines += ""
$readmeLines += "2. Sistema de Informes Ejecutivos Personalizables"
$readmeLines += "   - API completa para gestion de informes (CRUD)"
$readmeLines += "   - Personalizacion de reportes con parametros configurables"
$readmeLines += "   - Archivos nuevos en api/stockholders/:"
$readmeLines += "     - informes.php"
$readmeLines += "     - asociar_reporte.php"
$readmeLines += "     - crear_tabla.php"
$readmeLines += "     - agregar_columna_parametros.php"
$readmeLines += "   - Componente React: src/analisis/InformesStockholders.js"
$readmeLines += ""
$readmeLines += "3. Reportes PDF/HTML Profesionales"
$readmeLines += "   - Reporte HTML moderno y ejecutivo (vista previa)"
$readmeLines += "   - Reporte PDF mejorado con diseno profesional"
$readmeLines += "   - Archivos: api/dashboard/generar_reporte_pdf.php y generar_reporte_html.php"
$readmeLines += ""
$readmeLines += "## Instrucciones de Instalacion"
$readmeLines += ""
$readmeLines += "### 1. Base de Datos"
$readmeLines += ""
$readmeLines += "Ejecutar los siguientes scripts SQL en orden:"
$readmeLines += ""
$readmeLines += "1. Crear tabla de informes:"
$readmeLines += "   api/database/create_informes_stockholders_table.sql"
$readmeLines += ""
$readmeLines += "2. Agregar columna de parametros (opcional, si la tabla ya existe):"
$readmeLines += "   api/database/add_parametros_informes.sql"
$readmeLines += ""
$readmeLines += "   O ejecutar el script PHP:"
$readmeLines += "   http://tu-dominio/api/stockholders/crear_tabla.php"
$readmeLines += "   http://tu-dominio/api/stockholders/agregar_columna_parametros.php"
$readmeLines += ""
$readmeLines += "### 2. Archivos PHP"
$readmeLines += ""
$readmeLines += "Copiar todos los archivos PHP a sus respectivas ubicaciones:"
$readmeLines += "- api/dashboard/ -> Copiar archivos de reportes"
$readmeLines += "- api/stockholders/ -> Copiar todos los archivos nuevos"
$readmeLines += "- api/view_office.php -> Copiar a la raiz de api/"
$readmeLines += ""
$readmeLines += "### 3. Archivos React/JS"
$readmeLines += ""
$readmeLines += "Despues de copiar los archivos JS, recompilar la aplicacion:"
$readmeLines += "npm run build"
$readmeLines += ""
$readmeLines += "### 4. Dependencias PHP (Composer)"
$readmeLines += ""
$readmeLines += "Si es necesario, instalar TCPDF:"
$readmeLines += "composer install"
$readmeLines += ""
$readmeLines += "O solo TCPDF:"
$readmeLines += "composer require tecnickcom/tcpdf"
$readmeLines += ""
$readmeLines += "## Verificacion"
$readmeLines += ""
$readmeLines += "1. Verificar que la tabla informes_stockholders existe"
$readmeLines += "2. Verificar que el reporte PDF funciona"
$readmeLines += "3. Probar creacion de informe desde la interfaz"
$readmeLines += ""
$readmeLines += "## Cambios Principales"
$readmeLines += ""
$readmeLines += "- Visualizacion de archivos Office (Word, Excel, PowerPoint)"
$readmeLines += "- Sistema completo de informes ejecutivos personalizables"
$readmeLines += "- Reportes PDF/HTML profesionales con diseno moderno"
$readmeLines += "- API RESTful para gestion de informes"
$readmeLines += "- Integracion frontend-backend completa"
$readmeLines += ""
$readmeLines += "---"
$readmeLines += "Generado automaticamente el $fechaReadme"

$readmePath = Join-Path $tempDir "README_INSTALACION.txt"
$readmeLines | Out-File -FilePath $readmePath -Encoding UTF8
Write-Host "    OK README_INSTALACION.txt" -ForegroundColor Green

# ============================================
# 6. CREAR ZIP
# ============================================
Write-Host "`nCreando archivo ZIP..." -ForegroundColor Green

try {
    Compress-Archive -Path "$tempDir\*" -DestinationPath $rutaPaquete -Force
    Write-Host "OK Paquete creado exitosamente!" -ForegroundColor Green
    Write-Host "`nUbicacion: $rutaPaquete" -ForegroundColor Cyan
    $tamanoMB = [math]::Round((Get-Item $rutaPaquete).Length / 1MB, 2)
    Write-Host "Tamano: $tamanoMB MB" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR al crear el ZIP: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# 7. LIMPIAR
# ============================================
Write-Host "`nLimpiando archivos temporales..." -ForegroundColor Gray
Remove-Item $tempDir -Recurse -Force

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Paquete generado exitosamente!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
