# Script de verificacion del paquete de produccion
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION COMPLETA DEL PAQUETE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Lista de archivos a verificar
$archivos = @(
    @{Nombre="api/dashboard/generar_reporte_pdf.php"; Descripcion="Generador PDF mejorado"},
    @{Nombre="api/dashboard/generar_reporte_html.php"; Descripcion="Reporte HTML profesional"},
    @{Nombre="api/view_office.php"; Descripcion="Visualizador de archivos Office"},
    @{Nombre="api/stockholders/informes.php"; Descripcion="API CRUD de informes"},
    @{Nombre="api/stockholders/asociar_reporte.php"; Descripcion="Asociar reportes"},
    @{Nombre="api/stockholders/crear_tabla.php"; Descripcion="Script creacion tabla"},
    @{Nombre="api/stockholders/agregar_columna_parametros.php"; Descripcion="Script agregar columna"},
    @{Nombre="api/database/create_informes_stockholders_table.sql"; Descripcion="SQL crear tabla"},
    @{Nombre="api/database/add_parametros_informes.sql"; Descripcion="SQL agregar columna"},
    @{Nombre="public/img/muro.jpg"; Descripcion="Imagen fondo header"},
    @{Nombre="public/img/logo-codelco.png"; Descripcion="Logo CODELCO"},
    @{Nombre="composer.json"; Descripcion="Dependencias PHP"}
)

Write-Host "1. VERIFICANDO ARCHIVOS PHP/SQL/IMAGENES..." -ForegroundColor Yellow
Write-Host ""

$todosOK = $true
foreach ($archivo in $archivos) {
    $origen = $archivo.Nombre
    $destino = "deploy_rcritico/$origen"
    
    if (Test-Path $origen) {
        if (Test-Path $destino) {
            $hashOrigen = (Get-FileHash $origen).Hash
            $hashDestino = (Get-FileHash $destino).Hash
            if ($hashOrigen -eq $hashDestino) {
                Write-Host "  [OK] $($archivo.Descripcion)" -ForegroundColor Green
            } else {
                Write-Host "  [ERROR] $($archivo.Descripcion) - ARCHIVOS DIFERENTES" -ForegroundColor Red
                $todosOK = $false
            }
        } else {
            Write-Host "  [ERROR] $($archivo.Descripcion) - NO ENCONTRADO EN DEPLOY" -ForegroundColor Red
            $todosOK = $false
        }
    } else {
        Write-Host "  [ADVERTENCIA] $($archivo.Descripcion) - NO EXISTE EN ORIGEN" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "2. VERIFICANDO BUILD DE REACT..." -ForegroundColor Yellow
Write-Host ""

$buildFile = Get-ChildItem "build/static/js/main.*.js" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($buildFile) {
    $content = Get-Content $buildFile.FullName -Raw
    $checks = @{
        "InformesStockholders" = $content -match "InformesStockholders"
        "GestorArchivos" = $content -match "GestorArchivos"
        "window.open" = $content -match "window\.open"
        "Ver Informe" = $content -match "Ver Informe"
    }
    
    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Host "  [OK] Build incluye: $($check.Key)" -ForegroundColor Green
        } else {
            Write-Host "  [ADVERTENCIA] Build NO incluye: $($check.Key)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  [ERROR] Build no encontrado" -ForegroundColor Red
    $todosOK = $false
}

Write-Host ""
Write-Host "3. VERIFICANDO CARPETA PUBLIC/IMG..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "deploy_rcritico/public/img") {
    $imagenes = Get-ChildItem "deploy_rcritico/public/img" -File
    Write-Host "  Imagenes encontradas: $($imagenes.Count)" -ForegroundColor Green
    
    if (Test-Path "deploy_rcritico/public/img/muro.jpg") {
        $size = (Get-Item "deploy_rcritico/public/img/muro.jpg").Length / 1KB
        Write-Host "  [OK] muro.jpg ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] muro.jpg NO presente" -ForegroundColor Red
        $todosOK = $false
    }
    
    if (Test-Path "deploy_rcritico/public/img/logo-codelco.png") {
        $size = (Get-Item "deploy_rcritico/public/img/logo-codelco.png").Length / 1KB
        Write-Host "  [OK] logo-codelco.png ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] logo-codelco.png NO presente" -ForegroundColor Red
        $todosOK = $false
    }
} else {
    Write-Host "  [ERROR] Carpeta public/img no existe" -ForegroundColor Red
    $todosOK = $false
}

Write-Host ""
Write-Host "4. VERIFICANDO CONTENIDO DE ARCHIVOS CLAVE..." -ForegroundColor Yellow
Write-Host ""

# Verificar generar_reporte_html.php tiene muro.jpg
$htmlContent = Get-Content "deploy_rcritico/api/dashboard/generar_reporte_html.php" -Raw
if ($htmlContent -match "muro\.jpg") {
    Write-Host "  [OK] generar_reporte_html.php referencia muro.jpg" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] generar_reporte_html.php NO referencia muro.jpg" -ForegroundColor Red
    $todosOK = $false
}

if ($htmlContent -match "logo-codelco") {
    Write-Host "  [OK] generar_reporte_html.php referencia logo-codelco" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] generar_reporte_html.php NO referencia logo-codelco" -ForegroundColor Red
    $todosOK = $false
}

if ($htmlContent -match "RESUMEN EJECUTIVO") {
    Write-Host "  [OK] generar_reporte_html.php tiene seccion RESUMEN EJECUTIVO" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] generar_reporte_html.php NO tiene RESUMEN EJECUTIVO" -ForegroundColor Red
    $todosOK = $false
}

# Verificar view_office.php
$officeContent = Get-Content "deploy_rcritico/api/view_office.php" -Raw
if ($officeContent -match "Office|Word|Excel|PowerPoint") {
    Write-Host "  [OK] view_office.php tiene soporte para Office" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] view_office.php NO tiene soporte Office" -ForegroundColor Red
    $todosOK = $false
}

# Verificar informes.php
$informesContent = Get-Content "deploy_rcritico/api/stockholders/informes.php" -Raw
if ($informesContent -match "parametros_reporte") {
    Write-Host "  [OK] informes.php maneja parametros_reporte" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] informes.php NO maneja parametros_reporte" -ForegroundColor Red
    $todosOK = $false
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
if ($todosOK) {
    Write-Host "  VERIFICACION COMPLETA: TODO OK" -ForegroundColor Green
} else {
    Write-Host "  VERIFICACION COMPLETA: HAY ERRORES" -ForegroundColor Red
}
Write-Host "=========================================" -ForegroundColor Cyan

