<?php
// Habilitar errores para depuración (comentar en producción)
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Limpiar cualquier salida previa antes de enviar headers
if (ob_get_level() > 0) {
    ob_end_clean();
}
ob_start();

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Incluir db.php - puede limpiar el buffer, así que lo manejamos
require_once __DIR__ . '/../config/db.php';

// Asegurar que tenemos PDO
if (!isset($pdo)) {
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body>';
    echo '<h1 style="color: #dc3545;">Error: No se pudo conectar a la base de datos</h1>';
    echo '<p><a href="javascript:window.close()">Cerrar</a></p>';
    echo '</body></html>';
    exit;
}

// Funciones auxiliares definidas ANTES del try para evitar errores
function obtenerKPIsMinimos($pdo, $proyecto_id) {
    $kpis = [
        'total_carpetas' => 0,
        'total_controles' => 0,
        'controles_validados' => 0,
        'controles_observaciones' => 0,
        'usuarios_activos' => 0,
        'avance_global_empresas' => 0,
        'avance_por_empresa' => []
    ];
    
    try {
        // Total carpetas
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM carpetas WHERE proyecto_id = ? AND activo = 1");
        $stmt->execute([$proyecto_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $kpis['total_carpetas'] = intval($result['total'] ?? 0);
        
        // Total controles
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM carpeta_linea_base WHERE carpeta_id IN (SELECT id FROM carpetas WHERE proyecto_id = ? AND activo = 1) AND activo = 1");
        $stmt->execute([$proyecto_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $kpis['total_controles'] = intval($result['total'] ?? 0);
        
        // Controles validados
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM carpeta_linea_base WHERE carpeta_id IN (SELECT id FROM carpetas WHERE proyecto_id = ? AND activo = 1) AND estado_validacion = 'validado' AND activo = 1");
        $stmt->execute([$proyecto_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $kpis['controles_validados'] = intval($result['total'] ?? 0);
        
        // Controles con observaciones
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM carpeta_linea_base WHERE carpeta_id IN (SELECT id FROM carpetas WHERE proyecto_id = ? AND activo = 1) AND estado_validacion = 'con_observaciones' AND activo = 1");
        $stmt->execute([$proyecto_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $kpis['controles_observaciones'] = intval($result['total'] ?? 0);
        
        // Usuarios activos
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT usuario_id) as total FROM carpeta_usuarios WHERE carpeta_id IN (SELECT id FROM carpetas WHERE proyecto_id = ? AND activo = 1)");
        $stmt->execute([$proyecto_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $kpis['usuarios_activos'] = intval($result['total'] ?? 0);
    } catch (Exception $e) {
        error_log('Error obteniendo KPIs mínimos: ' . $e->getMessage());
    }
    
    return $kpis;
}

function calcularPromedioGeneralBasico($pdo, $proyecto_id) {
    try {
        $stmt = $pdo->prepare("SELECT AVG(COALESCE(ponderacion, 0)) as promedio FROM carpeta_linea_base WHERE carpeta_id IN (SELECT id FROM carpetas WHERE proyecto_id = ? AND activo = 1) AND activo = 1");
        $stmt->execute([$proyecto_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return floatval($result['promedio'] ?? 0);
    } catch (Exception $e) {
        error_log('Error calculando promedio general: ' . $e->getMessage());
        return 0;
    }
}

// Verificar que se proporcionó proyecto_id
$proyecto_id = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : null;

if (!$proyecto_id) {
    http_response_code(400);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body>';
    echo '<h1 style="color: #dc3545;">Error: proyecto_id es requerido</h1>';
    echo '<p><a href="javascript:window.close()">Cerrar</a></p>';
    echo '</body></html>';
    exit;
}

try {
    // Obtener información del proyecto
    $stmt_proyecto = $pdo->prepare("SELECT * FROM proyectos WHERE proyecto_id = ?");
    $stmt_proyecto->execute([$proyecto_id]);
    $proyecto = $stmt_proyecto->fetch(PDO::FETCH_ASSOC);
    
    if (!$proyecto) {
        http_response_code(404);
        echo json_encode(['error' => 'Proyecto no encontrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Obtener KPIs - Intentar obtener desde endpoint, si falla usar datos mínimos de BD
    $kpis = [];
    $promedio_general = 0;
    $carpetas_data = [];
    
    // Intentar obtener KPIs usando file_get_contents con contexto local
    // Si falla, usar datos mínimos de la base de datos
    try {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $base_path = dirname(dirname($_SERVER['PHP_SELF'] ?? ''));
        $url_kpis = $protocol . '://' . $host . $base_path . '/dashboard/kpis.php?proyecto_id=' . $proyecto_id;
        
        // Usar file_get_contents con contexto para evitar problemas de SSL
        $context = stream_context_create([
            'http' => [
                'timeout' => 10,
                'ignore_errors' => true,
                'method' => 'GET'
            ]
        ]);
        
        $response_kpis = @file_get_contents($url_kpis, false, $context);
        if ($response_kpis !== false && !empty($response_kpis)) {
            $kpis = json_decode($response_kpis, true);
            if (!is_array($kpis)) {
                $kpis = [];
            }
        } else {
            // Si falla, obtener datos mínimos directamente de la BD
            $kpis = obtenerKPIsMinimos($pdo, $proyecto_id);
        }
    } catch (Exception $e) {
        error_log('Error obteniendo KPIs: ' . $e->getMessage());
        // Si falla, obtener datos mínimos directamente de la BD
        $kpis = obtenerKPIsMinimos($pdo, $proyecto_id);
    }
    
    // Intentar obtener carpetas con promedios
    try {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $base_path = dirname(dirname($_SERVER['PHP_SELF'] ?? ''));
        $url_carpetas = $protocol . '://' . $host . $base_path . '/dashboard/carpetas_con_promedios.php?proyecto_id=' . $proyecto_id;
        
        $context = stream_context_create([
            'http' => [
                'timeout' => 10,
                'ignore_errors' => true,
                'method' => 'GET'
            ]
        ]);
        
        $response_carpetas = @file_get_contents($url_carpetas, false, $context);
        if ($response_carpetas !== false && !empty($response_carpetas)) {
            $carpetas_data = json_decode($response_carpetas, true);
            if (!is_array($carpetas_data)) {
                $carpetas_data = [];
            }
            $promedio_general = floatval($carpetas_data['promedio_general'] ?? 0);
        } else {
            // Si falla, calcular promedio general básico
            $promedio_general = calcularPromedioGeneralBasico($pdo, $proyecto_id);
            $carpetas_data = ['carpetas' => [], 'promedio_general' => $promedio_general];
        }
    } catch (Exception $e) {
        error_log('Error obteniendo carpetas: ' . $e->getMessage());
        $promedio_general = calcularPromedioGeneralBasico($pdo, $proyecto_id);
        $carpetas_data = ['carpetas' => [], 'promedio_general' => $promedio_general];
    }
    
    // Intentar cargar TCPDF, si no está disponible, generar HTML que se puede imprimir como PDF
    $tcpdf_available = false;
    $tcpdf_paths = [
        __DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php',
        __DIR__ . '/../../tcpdf/tcpdf.php',
        __DIR__ . '/../../../tcpdf/tcpdf.php'
    ];
    
    foreach ($tcpdf_paths as $path) {
        if (file_exists($path)) {
            try {
                require_once($path);
                // Verificar que la clase TCPDF existe
                if (class_exists('TCPDF')) {
                    $tcpdf_available = true;
                    break;
                }
            } catch (Exception $e) {
                error_log('Error cargando TCPDF: ' . $e->getMessage());
            }
        }
    }
    
    // Si TCPDF no está disponible, generar HTML que se puede imprimir como PDF
    if (!$tcpdf_available) {
        // Limpiar cualquier salida previa y enviar headers
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-cache, must-revalidate');
        header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
        
        $html_file = __DIR__ . '/generar_reporte_html.php';
        if (file_exists($html_file)) {
            // Las variables $proyecto, $kpis, $carpetas_data, $promedio_general ya están disponibles
            include($html_file);
        } else {
            // HTML básico si el archivo no existe
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte del Proyecto</title></head><body>';
            echo '<h1>Reporte del Proyecto: ' . htmlspecialchars($proyecto['nombre']) . '</h1>';
            echo '<p>Para generar un PDF completo, use la función de impresión del navegador (Ctrl+P o Cmd+P).</p>';
            echo '<p>Fecha: ' . date('d/m/Y H:i:s') . '</p>';
            if (!empty($kpis)) {
                echo '<h2>KPIs</h2><pre>' . print_r($kpis, true) . '</pre>';
            }
            echo '</body></html>';
        }
        exit;
    }
    
    // Crear PDF con TCPDF
    try {
        // Definir constantes si no están definidas
        if (!defined('PDF_PAGE_ORIENTATION')) {
            define('PDF_PAGE_ORIENTATION', 'P'); // Portrait
        }
        if (!defined('PDF_UNIT')) {
            define('PDF_UNIT', 'mm');
        }
        if (!defined('PDF_PAGE_FORMAT')) {
            define('PDF_PAGE_FORMAT', 'A4');
        }
        
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    } catch (Exception $e) {
        // Si falla la creación del PDF, usar HTML
        header('Content-Type: text/html; charset=utf-8');
        $html_file = __DIR__ . '/generar_reporte_html.php';
        if (file_exists($html_file)) {
            include($html_file);
        } else {
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte del Proyecto</title></head><body>';
            echo '<h1>Error generando PDF</h1><p>' . htmlspecialchars($e->getMessage()) . '</p>';
            echo '</body></html>';
        }
        exit;
    }
    
    // Configuración del documento
    $pdf->SetCreator('Sistema Control de Riesgos Críticos - Codelco');
    $pdf->SetAuthor('Codelco SSO');
    $pdf->SetTitle('Reporte del Proyecto: ' . $proyecto['nombre']);
    $pdf->SetSubject('Reporte Completo del Proyecto');
    $pdf->SetKeywords('Riesgos Críticos, Codelco, Reporte, Proyecto');
    
    // Eliminar header y footer por defecto
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    
    // Márgenes
    $pdf->SetMargins(15, 15, 15);
    $pdf->SetAutoPageBreak(TRUE, 15);
    
    // Agregar primera página
    $pdf->AddPage();
    
    // Colores personalizados
    $color_azul = array(10, 110, 189);
    $color_naranja = array(242, 169, 0);
    $color_gris = array(108, 117, 125);
    $color_verde = array(40, 167, 69);
    $color_rojo = array(220, 53, 69);
    
    // ===== PORTADA =====
    // Fondo con gradiente (simulado con rectángulos)
    $pdf->SetFillColor(10, 110, 189);
    $pdf->Rect(0, 0, 210, 297, 'F');
    
    // Logo/Icono (simulado con texto)
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', 'B', 48);
    $pdf->SetXY(15, 80);
    $pdf->Cell(180, 20, 'CODELCO', 0, 1, 'C');
    $pdf->SetFont('helvetica', 'B', 24);
    $pdf->SetXY(15, 110);
    $pdf->Cell(180, 15, 'Sistema de Control de Riesgos Críticos', 0, 1, 'C');
    
    // Título del reporte
    $pdf->SetFont('helvetica', 'B', 28);
    $pdf->SetXY(15, 150);
    $pdf->Cell(180, 20, 'REPORTE COMPLETO DEL PROYECTO', 0, 1, 'C');
    
    // Nombre del proyecto
    $pdf->SetFont('helvetica', 'B', 20);
    $pdf->SetXY(15, 180);
    $pdf->Cell(180, 15, $proyecto['nombre'], 0, 1, 'C');
    
    // Fecha de generación
    $pdf->SetFont('helvetica', '', 12);
    $pdf->SetXY(15, 220);
    $pdf->Cell(180, 10, 'Generado el: ' . date('d/m/Y H:i:s'), 0, 1, 'C');
    
    // Información del proyecto
    $pdf->SetFont('helvetica', '', 11);
    $pdf->SetXY(15, 240);
    $pdf->Cell(180, 8, 'ID Proyecto: ' . $proyecto['proyecto_id'], 0, 1, 'C');
    if (isset($proyecto['region_id'])) {
        $pdf->SetXY(15, 250);
        $pdf->Cell(180, 8, 'Región: ' . $proyecto['region_id'], 0, 1, 'C');
    }
    
    // ===== PÁGINA 1: RESUMEN EJECUTIVO =====
    $pdf->AddPage();
    $pdf->SetTextColor(0, 0, 0);
    
    // Título de sección
    $pdf->SetFillColor(10, 110, 189);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->Cell(180, 10, 'RESUMEN EJECUTIVO', 0, 1, 'L', true);
    $pdf->Ln(5);
    
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetFont('helvetica', '', 11);
    
    // Información del proyecto
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(180, 8, 'Información del Proyecto', 0, 1, 'L');
    $pdf->SetFont('helvetica', '', 10);
    $pdf->Cell(90, 6, 'Nombre: ' . $proyecto['nombre'], 0, 0, 'L');
    $pdf->Cell(90, 6, 'ID: ' . $proyecto['proyecto_id'], 0, 1, 'L');
    if (isset($proyecto['descripcion']) && $proyecto['descripcion']) {
        $pdf->Cell(180, 6, 'Descripción: ' . $proyecto['descripcion'], 0, 1, 'L');
    }
    $pdf->Ln(5);
    
    // KPIs Principales
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(180, 8, 'Indicadores Clave de Desempeño (KPIs)', 0, 1, 'L');
    $pdf->SetFont('helvetica', '', 10);
    
    if (!empty($kpis)) {
        $kpi_data = [
            ['Avance General', $promedio_general . '%', $color_azul],
            ['Total Carpetas', ($kpis['total_carpetas'] ?? 0), $color_gris],
            ['Total Controles', ($kpis['total_controles'] ?? 0), $color_gris],
            ['Controles Validados', ($kpis['controles_validados'] ?? 0), $color_verde],
            ['Controles con Observaciones', ($kpis['controles_observaciones'] ?? 0), $color_rojo],
            ['Usuarios Activos', ($kpis['usuarios_activos'] ?? 0), $color_azul],
            ['Avance Global por Empresa', ($kpis['avance_global_empresas'] ?? 0) . '%', $color_naranja]
        ];
        
        foreach ($kpi_data as $kpi) {
            $pdf->SetFillColor($kpi[2][0], $kpi[2][1], $kpi[2][2]);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->Cell(120, 8, $kpi[0], 0, 0, 'L', true);
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFillColor(240, 240, 240);
            $pdf->Cell(60, 8, $kpi[1], 0, 1, 'R', true);
        }
    }
    
    // ===== PÁGINA 2: AVANCE POR EMPRESA =====
    if (!empty($kpis['avance_por_empresa']) && is_array($kpis['avance_por_empresa'])) {
        $pdf->AddPage();
        
        // Título de sección
        $pdf->SetFillColor(242, 169, 0);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('helvetica', 'B', 16);
        $pdf->Cell(180, 10, 'AVANCE POR EMPRESA', 0, 1, 'L', true);
        $pdf->Ln(5);
        
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetFont('helvetica', 'B', 10);
        
        // Encabezado de tabla
        $pdf->SetFillColor(240, 240, 240);
        $pdf->Cell(90, 8, 'Empresa', 1, 0, 'L', true);
        $pdf->Cell(45, 8, 'Avance', 1, 0, 'C', true);
        $pdf->Cell(45, 8, 'Controles', 1, 1, 'C', true);
        
        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetFillColor(255, 255, 255);
        
        foreach ($kpis['avance_por_empresa'] as $empresa) {
            $avance = floatval($empresa['avance_promedio'] ?? 0);
            $color_fila = $avance >= 80 ? array(232, 245, 233) : ($avance >= 50 ? array(255, 249, 196) : array(255, 235, 238));
            
            $pdf->SetFillColor($color_fila[0], $color_fila[1], $color_fila[2]);
            $pdf->Cell(90, 7, $empresa['empresa'] ?? 'Sin nombre', 1, 0, 'L', true);
            $pdf->Cell(45, 7, number_format($avance, 1) . '%', 1, 0, 'C', true);
            $pdf->Cell(45, 7, ($empresa['total_controles'] ?? 0), 1, 1, 'C', true);
        }
    }
    
    // ===== PÁGINAS 3+: AVANCE POR RC =====
    if (!empty($carpetas_data['carpetas']) && is_array($carpetas_data['carpetas'])) {
        foreach ($carpetas_data['carpetas'] as $carpeta_nivel1) {
            $pdf->AddPage();
            
            // Título de sección
            $pdf->SetFillColor(10, 110, 189);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->SetFont('helvetica', 'B', 16);
            $pdf->Cell(180, 10, 'RIESGO CRÍTICO: ' . strtoupper($carpeta_nivel1['nombre']), 0, 1, 'L', true);
            $pdf->Ln(3);
            
            // Promedio del RC
            $promedio_rc = floatval($carpeta_nivel1['promedio_ponderacion'] ?? 0);
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(90, 8, 'Avance del Riesgo Crítico:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 14);
            $color_avance = $promedio_rc >= 80 ? $color_verde : ($promedio_rc >= 50 ? $color_naranja : $color_rojo);
            $pdf->SetTextColor($color_avance[0], $color_avance[1], $color_avance[2]);
            $pdf->Cell(90, 8, number_format($promedio_rc, 2) . '%', 0, 1, 'L');
            $pdf->Ln(3);
            
            // Tabla de empresas del RC
            if (!empty($carpeta_nivel1['subcarpetas']) && is_array($carpeta_nivel1['subcarpetas'])) {
                $pdf->SetTextColor(0, 0, 0);
                $pdf->SetFont('helvetica', 'B', 11);
                $pdf->Cell(180, 8, 'Empresas Asociadas:', 0, 1, 'L');
                $pdf->Ln(2);
                
                // Encabezado de tabla
                $pdf->SetFillColor(240, 240, 240);
                $pdf->SetFont('helvetica', 'B', 9);
                $pdf->Cell(120, 7, 'Empresa', 1, 0, 'L', true);
                $pdf->Cell(60, 7, 'Avance', 1, 1, 'C', true);
                
                $pdf->SetFont('helvetica', '', 9);
                $pdf->SetFillColor(255, 255, 255);
                
                foreach ($carpeta_nivel1['subcarpetas'] as $subcarpeta) {
                    $avance_emp = floatval($subcarpeta['promedio_ponderacion'] ?? 0);
                    $color_fila = $avance_emp >= 80 ? array(232, 245, 233) : ($avance_emp >= 50 ? array(255, 249, 196) : array(255, 235, 238));
                    
                    $pdf->SetFillColor($color_fila[0], $color_fila[1], $color_fila[2]);
                    $pdf->Cell(120, 6, $subcarpeta['nombre'] ?? 'Sin nombre', 1, 0, 'L', true);
                    $pdf->Cell(60, 6, number_format($avance_emp, 2) . '%', 1, 1, 'C', true);
                }
            }
        }
    }
    
    // ===== ÚLTIMA PÁGINA: PIE DE PÁGINA =====
    $pdf->AddPage();
    $pdf->SetTextColor(108, 117, 125);
    $pdf->SetFont('helvetica', '', 9);
    $pdf->SetXY(15, 140);
    $pdf->Cell(180, 8, 'Este reporte fue generado automáticamente por el Sistema de Control de Riesgos Críticos de Codelco.', 0, 1, 'C');
    $pdf->SetXY(15, 150);
    $pdf->Cell(180, 8, 'Para más información, contacte al administrador del sistema.', 0, 1, 'C');
    $pdf->SetXY(15, 160);
    $pdf->Cell(180, 8, 'Fecha de generación: ' . date('d/m/Y H:i:s'), 0, 1, 'C');
    
    // Generar y descargar PDF
    $nombre_archivo = 'Reporte_Proyecto_' . $proyecto_id . '_' . date('Ymd_His') . '.pdf';
    $pdf->Output($nombre_archivo, 'D');
    
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Error generando reporte PDF (PDO): ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    // Intentar mostrar HTML de error en lugar de JSON
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body>';
    echo '<h1 style="color: #dc3545;">Error al generar el reporte PDF</h1>';
    echo '<p>Ocurrió un error al generar el reporte. Por favor, intente nuevamente.</p>';
    echo '<p><small>Error: ' . htmlspecialchars($e->getMessage()) . '</small></p>';
    echo '<p><a href="javascript:window.close()">Cerrar</a></p>';
    echo '</body></html>';
} catch (Exception $e) {
    http_response_code(500);
    error_log('Error general generando reporte PDF: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    // Intentar mostrar HTML de error en lugar de JSON
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body>';
    echo '<h1 style="color: #dc3545;">Error al generar el reporte PDF</h1>';
    echo '<p>Ocurrió un error al generar el reporte. Por favor, intente nuevamente.</p>';
    echo '<p><small>Error: ' . htmlspecialchars($e->getMessage()) . '</small></p>';
    echo '<p><a href="javascript:window.close()">Cerrar</a></p>';
    echo '</body></html>';
}
?>

