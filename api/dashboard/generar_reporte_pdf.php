<?php
// ============================================
// IDENTIFICADOR ÚNICO: VERSION_FINAL_2025_12_22_17_00
// Si este archivo se ejecuta, deberías ver un banner ROJO/AMARILLO en el PDF
// ============================================

    // LOGGING PARA DEBUG - Verificar que este archivo se ejecuta
    // IMPORTANTE: Usar error_log en lugar de file_put_contents para evitar cualquier output
    error_log("PDF GENERATION: Ejecutando " . __FILE__);
    error_log("PDF GENERATION: Ruta: " . realpath(__FILE__));
    error_log("PDF GENERATION: Iniciando proceso de generación de PDF");

// Habilitar errores para depuración (comentar en producción)
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../error_log_pdf.txt');

// Limpiar cualquier salida previa antes de enviar headers
if (ob_get_level() > 0) {
    ob_end_clean();
}
ob_start();

// HEADERS ANTI-CACHÉ MUY AGRESIVOS
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");

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

// Función para obtener estadísticas detalladas de un RC
function obtenerEstadisticasRC($pdo, $carpeta_id) {
    try {
        // Obtener todas las subcarpetas (empresas) del RC
        $stmt_subcarpetas = $pdo->prepare("SELECT id FROM carpetas WHERE carpeta_padre_id = ? AND activo = 1");
        $stmt_subcarpetas->execute([$carpeta_id]);
        $subcarpetas_ids = $stmt_subcarpetas->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($subcarpetas_ids)) {
            return [
                'total_controles' => 0,
                'total_preventivos' => 0,
                'total_mitigadores' => 0,
                'controles_validados' => 0,
                'controles_observaciones' => 0,
                'controles_pendientes' => 0,
                'num_empresas' => 0
            ];
        }
        
        $ids_placeholders = implode(',', array_fill(0, count($subcarpetas_ids), '?'));
        
        // Total controles
        $stmt_total = $pdo->prepare("SELECT COUNT(*) as total FROM carpeta_linea_base WHERE carpeta_id IN ($ids_placeholders) AND activo = 1");
        $stmt_total->execute($subcarpetas_ids);
        $total_controles = intval($stmt_total->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        
        // Controles preventivos (todos los registros en carpeta_linea_base son preventivos)
        $stmt_prev = $pdo->prepare("SELECT COUNT(*) as total FROM carpeta_linea_base WHERE carpeta_id IN ($ids_placeholders) AND activo = 1");
        $stmt_prev->execute($subcarpetas_ids);
        $total_preventivos = intval($stmt_prev->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        
        // Controles mitigadores
        $stmt_mit = $pdo->prepare("SELECT COUNT(*) as total FROM carpeta_linea_base_mitigadores WHERE carpeta_id IN ($ids_placeholders) AND activo = 1");
        $stmt_mit->execute($subcarpetas_ids);
        $total_mitigadores = intval($stmt_mit->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        
        // Controles validados
        $stmt_val = $pdo->prepare("SELECT COUNT(*) as total FROM carpeta_linea_base WHERE carpeta_id IN ($ids_placeholders) AND estado_validacion = 'validado' AND activo = 1");
        $stmt_val->execute($subcarpetas_ids);
        $controles_validados = intval($stmt_val->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        
        // Controles con observaciones
        $stmt_obs = $pdo->prepare("SELECT COUNT(*) as total FROM carpeta_linea_base WHERE carpeta_id IN ($ids_placeholders) AND estado_validacion = 'con_observaciones' AND activo = 1");
        $stmt_obs->execute($subcarpetas_ids);
        $controles_observaciones = intval($stmt_obs->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        
        // Controles pendientes (sin validar)
        $stmt_pend = $pdo->prepare("SELECT COUNT(*) as total FROM carpeta_linea_base WHERE carpeta_id IN ($ids_placeholders) AND (estado_validacion IS NULL OR estado_validacion = '' OR estado_validacion = 'pendiente') AND activo = 1");
        $stmt_pend->execute($subcarpetas_ids);
        $controles_pendientes = intval($stmt_pend->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        
        return [
            'total_controles' => $total_controles,
            'total_preventivos' => $total_preventivos,
            'total_mitigadores' => $total_mitigadores,
            'controles_validados' => $controles_validados,
            'controles_observaciones' => $controles_observaciones,
            'controles_pendientes' => $controles_pendientes,
            'num_empresas' => count($subcarpetas_ids)
        ];
    } catch (Exception $e) {
        error_log('Error obteniendo estadísticas RC: ' . $e->getMessage());
        return [
            'total_controles' => 0,
            'total_preventivos' => 0,
            'total_mitigadores' => 0,
            'controles_validados' => 0,
            'controles_observaciones' => 0,
            'controles_pendientes' => 0,
            'num_empresas' => 0
        ];
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

// Verificar si se solicita el PDF directamente (con parámetro ?pdf=1)
// IMPORTANTE: Por defecto, SIEMPRE mostrar HTML primero (vista previa profesional)
$generar_pdf_directo = isset($_GET['pdf']) && $_GET['pdf'] == '1';

// Parámetros de personalización del reporte (desde informes stockholders)
$parametros = [
    'incluirPortada' => isset($_GET['incluirPortada']) ? $_GET['incluirPortada'] == '1' : true,
    'incluirResumenEjecutivo' => isset($_GET['incluirResumenEjecutivo']) ? $_GET['incluirResumenEjecutivo'] == '1' : true,
    'incluirKPIs' => isset($_GET['incluirKPIs']) ? $_GET['incluirKPIs'] == '1' : true,
    'incluirAvancePorEmpresa' => isset($_GET['incluirAvancePorEmpresa']) ? $_GET['incluirAvancePorEmpresa'] == '1' : true,
    'incluirResumenRiesgos' => isset($_GET['incluirResumenRiesgos']) ? $_GET['incluirResumenRiesgos'] == '1' : true,
    'incluirInformacionProyecto' => isset($_GET['incluirInformacionProyecto']) ? $_GET['incluirInformacionProyecto'] == '1' : true,
    'nivelDetalle' => $_GET['nivelDetalle'] ?? 'normal'
];

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
    
    // Primero intentar con Composer autoload
    // Intentar múltiples rutas posibles para vendor
    $autoload_paths = [
        __DIR__ . '/../../vendor/autoload.php',  // Desde api/dashboard/ -> raiz/vendor/
        __DIR__ . '/../vendor/autoload.php',      // Desde api/dashboard/ -> api/vendor/
        __DIR__ . '/../../api/vendor/autoload.php', // Alternativa
    ];
    
    $autoload_loaded = false;
    foreach ($autoload_paths as $autoload_path) {
        if (file_exists($autoload_path)) {
            try {
                require_once($autoload_path);
                if (class_exists('TCPDF')) {
                    $tcpdf_available = true;
                    $autoload_loaded = true;
                    $log_file = __DIR__ . '/../../pdf_execution_log.txt';
                    @file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] ✓ TCPDF cargado desde: $autoload_path\n", FILE_APPEND);
                    break;
                }
            } catch (Exception $e) {
                error_log('Error cargando Composer autoload desde ' . $autoload_path . ': ' . $e->getMessage());
            }
        }
    }
    
    // Si no funcionó con autoload, intentar rutas directas
    if (!$tcpdf_available) {
    $tcpdf_paths = [
        __DIR__ . '/../vendor/tecnickcom/tcpdf/tcpdf.php',     // Desde api/dashboard/ -> api/vendor/ (MÁS COMÚN EN PRODUCCIÓN)
        __DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php',  // Desde api/dashboard/ -> raiz/vendor/
        __DIR__ . '/../../api/vendor/tecnickcom/tcpdf/tcpdf.php', // Alternativa
        dirname(dirname(__DIR__)) . '/vendor/tecnickcom/tcpdf/tcpdf.php', // Ruta absoluta alternativa
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
                        $log_file = __DIR__ . '/../../pdf_execution_log.txt';
                        @file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] ✓ TCPDF cargado desde: $path\n", FILE_APPEND);
                    break;
                }
            } catch (Exception $e) {
                error_log('Error cargando TCPDF: ' . $e->getMessage());
                }
            }
        }
    }
    
    // SIEMPRE mostrar HTML primero (vista previa ejecutiva), a menos que se solicite PDF directamente
    if (!$generar_pdf_directo) {
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
    
    // Si se solicita PDF pero TCPDF no está disponible, mostrar error
    if (!$tcpdf_available) {
        $log_file = __DIR__ . '/../../pdf_execution_log.txt';
        @file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] ⚠️ TCPDF NO DISPONIBLE - No se puede generar PDF\n", FILE_APPEND);
        
        http_response_code(500);
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body>';
        echo '<h1 style="color: #dc3545;">Error: TCPDF no está disponible</h1>';
        echo '<p>No se puede generar el PDF. Por favor, contacte al administrador del sistema.</p>';
        echo '<p><a href="?proyecto_id=' . $proyecto_id . '">Volver al reporte HTML</a></p>';
        echo '</body></html>';
        exit;
    }
    
    $log_file = __DIR__ . '/../../pdf_execution_log.txt';
    @file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] ✓ TCPDF disponible - Continuando con generación de PDF\n", FILE_APPEND);
    
    // Crear PDF con TCPDF
    error_log("=== INICIANDO CREACIÓN DE PDF ===");
    error_log("TCPDF disponible: " . (class_exists('TCPDF') ? 'SÍ' : 'NO'));
    
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
        
        error_log("Creando instancia de TCPDF...");
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        error_log("TCPDF creado exitosamente");
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
    
    // Colores personalizados - PROFESIONALES Y VISIBLES PARA IMPRESIÓN
    $color_azul = array(10, 110, 189);        // Azul Codelco #0a6ebd
    $color_naranja = array(245, 158, 11);     // Naranja #f59e0b
    $color_verde = array(16, 185, 129);       // Verde #10b981
    $color_rojo = array(239, 68, 68);         // Rojo #ef4444
    $color_gris = array(60, 60, 60);          // Gris oscuro para mejor contraste
    $color_gris_claro = array(240, 240, 240);  // Gris claro para fondos
    $color_gris_tabla = array(40, 40, 40);    // Gris casi negro para encabezados
    
    // Márgenes estándar
    $pdf->SetMargins(15, 15, 15);
    $pdf->SetAutoPageBreak(TRUE, 15);
    
    // ===== PORTADA (solo si está habilitada) =====
    if ($parametros['incluirPortada']) {
        // Agregar primera página - PORTADA VERTICAL (como HTML)
        $pdf->AddPage('P'); // Portrait (vertical)
        
        // Determinar rutas de imágenes
        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        $base_path = '';
        if (strpos($request_uri, '/rcritico/') !== false) {
            $base_path = '/rcritico';
        }
        
        $logo_path = __DIR__ . '/../../public/img/logo-codelco.png';
        $fondo_path = __DIR__ . '/../../public/img/muro.jpg';
        
        // Dimensiones para portrait (210mm x 297mm)
        $page_width = 210;
        $page_height = 297;
        
        // Fondo con imagen del muro - cover como en HTML (cubrir toda la página)
    if (file_exists($fondo_path)) {
        try {
            // Obtener dimensiones de la imagen
            $img_info = @getimagesize($fondo_path);
            if ($img_info) {
                $img_width = $img_info[0];
                $img_height = $img_info[1];
                $img_ratio = $img_width / $img_height;
                $page_ratio = $page_width / $page_height;
                
                // Calcular para cubrir toda la página (cover)
                if ($img_ratio > $page_ratio) {
                    // Imagen más ancha, ajustar por altura
                    $display_height = $page_height;
                    $display_width = $display_height * $img_ratio;
                    $x_offset = ($page_width - $display_width) / 2;
                    $pdf->Image($fondo_path, $x_offset, 0, $display_width, $display_height, '', '', '', false, 300, '', false, false, 0);
                } else {
                    // Imagen más alta, ajustar por ancho
                    $display_width = $page_width;
                    $display_height = $display_width / $img_ratio;
                    $y_offset = ($page_height - $display_height) / 2;
                    $pdf->Image($fondo_path, 0, $y_offset, $display_width, $display_height, '', '', '', false, 300, '', false, false, 0);
                }
            } else {
                // Fallback: estirar para cubrir
                $pdf->Image($fondo_path, 0, 0, $page_width, $page_height, '', '', '', false, 300, '', false, false, 0);
            }
        } catch (Exception $e) {
            error_log('Error cargando imagen de fondo: ' . $e->getMessage());
        }
    }
    
    // Overlay azul oscuro semitransparente (igual que HTML: rgba(10, 110, 189, 0.45))
    $pdf->SetFillColor(10, 110, 189);
    $pdf->SetAlpha(0.45);
    $pdf->Rect(0, 0, $page_width, $page_height, 'F');
    $pdf->SetAlpha(1.0);
    
    // Logo de CODELCO (centrado)
    $logo_y = 50;
    if (file_exists($logo_path)) {
        try {
            $pdf->Image($logo_path, ($page_width / 2) - 35, $logo_y, 0, 20, '', '', '', false, 300, '', false, false, 0, false, false, true);
            $logo_y = 80;
        } catch (Exception $e) {
            error_log('Error cargando logo: ' . $e->getMessage());
            $pdf->SetTextColor(255, 255, 255);
            $pdf->SetFont('helvetica', 'B', 32);
            $pdf->SetXY(0, $logo_y);
            $pdf->Cell($page_width, 16, 'CODELCO', 0, 1, 'C');
            $logo_y = 75;
        }
    } else {
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('helvetica', 'B', 32);
        $pdf->SetXY(0, $logo_y);
        $pdf->Cell($page_width, 16, 'CODELCO', 0, 1, 'C');
        $logo_y = 75;
    }
    
    // Texto sobre el overlay (más compacto)
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', '', 11);
    $pdf->SetXY(0, $logo_y);
    $pdf->Cell($page_width, 7, 'Sistema de Control de Riesgos Críticos', 0, 1, 'C');
    
    // Nombre del proyecto en naranja (más compacto)
    $pdf->SetTextColor(255, 140, 0);
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->SetXY(0, $logo_y + 10);
    $pdf->Cell($page_width, 10, $proyecto['nombre'], 0, 1, 'C');
    
        // Información del proyecto
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetXY(0, $logo_y + 24);
        $pdf->Cell($page_width, 7, 'ID: ' . $proyecto['proyecto_id'] . ' | Fecha: ' . date('d/m/Y H:i:s'), 0, 1, 'C');
    }
    
    // ===== RESUMEN EJECUTIVO (solo si está habilitado) =====
    if ($parametros['incluirResumenEjecutivo']) {
        $pdf->AddPage('P');
        $pdf->SetTextColor(0, 0, 0);
        
        // Título de sección con línea naranja (más compacto)
        $pdf->SetTextColor(44, 62, 80); // #2c3e50
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->Cell(180, 5, 'RESUMEN EJECUTIVO', 0, 1, 'L');
    // Línea naranja debajo del título (2px)
    $pdf->SetFillColor(255, 140, 0); // #FF8C00
    $pdf->Rect(15, $pdf->GetY() - 1, 180, 2, 'F');
    $pdf->Ln(8); // Espacio reducido
    
        // Información del proyecto en caja azul clara (solo si está habilitada)
        if ($parametros['incluirInformacionProyecto']) {
            $pdf->SetFillColor(227, 242, 253); // #e3f2fd como HTML
            $pdf->SetDrawColor(10, 110, 189);
            $pdf->SetLineWidth(0);
            $start_y = $pdf->GetY();
            $info_height = isset($proyecto['descripcion']) && $proyecto['descripcion'] ? 20 : 16;
            $pdf->Rect(15, $start_y, 180, $info_height, 'F'); // Altura reducida
            
            // Barra vertical azul a la izquierda (border-left: 3px)
            $pdf->SetFillColor(10, 110, 189);
            $pdf->Rect(15, $start_y, 3, $info_height, 'F');
            
            $pdf->SetFont('helvetica', 'B', 13); // Más pequeño
            $pdf->SetTextColor(10, 110, 189);
            $pdf->SetXY(20, $start_y + 2); // Padding reducido
            $pdf->Cell(170, 4, 'Información del Proyecto', 0, 1, 'L');
            
            $pdf->SetFont('helvetica', '', 11); // Más pequeño
            $pdf->SetTextColor(44, 62, 80);
            $pdf->SetXY(20, $start_y + 7);
            $pdf->Cell(170, 4, 'Nombre: ' . $proyecto['nombre'] . ' | ID: ' . $proyecto['proyecto_id'], 0, 1, 'L');
            if (isset($proyecto['descripcion']) && $proyecto['descripcion']) {
                $pdf->SetXY(20, $start_y + 12);
                $pdf->Cell(170, 4, 'Descripción: ' . $proyecto['descripcion'], 0, 1, 'L');
            }
            $pdf->SetY($start_y + $info_height);
            $pdf->Ln(8); // Espacio reducido
        }
        
        // KPIs (solo si está habilitado)
        if ($parametros['incluirKPIs'] && !empty($kpis)) {
        // Encabezado de tabla (más compacto)
        $pdf->SetFillColor(248, 249, 250); // #f8f9fa
        $pdf->SetTextColor(73, 80, 87); // #495057
        $pdf->SetDrawColor(222, 226, 230); // #dee2e6
        $pdf->SetLineWidth(0);
        $pdf->SetFont('helvetica', 'B', 11); // Más pequeño
        // Sin bordes laterales, solo fondo
        $pdf->Cell(90, 6, 'INDICADOR', 0, 0, 'L', true);
        $pdf->Cell(45, 6, 'VALOR', 0, 0, 'C', true);
        $pdf->Cell(45, 6, '% AVANCE', 0, 1, 'C', true);
        
        // Línea inferior del encabezado
        $pdf->SetFillColor(222, 226, 230);
        $pdf->Rect(15, $pdf->GetY() - 6, 180, 0.3, 'F');
        
        $pdf->SetFont('helvetica', '', 11);
        $pdf->SetLineWidth(0);
        
        // Función para dibujar barra de progreso (más compacto)
        function dibujarBarraProgreso($pdf, $x, $y, $ancho, $porcentaje, $color_class) {
            $alto = 4; // Más pequeña
            // Fondo gris claro (#e9ecef)
            $pdf->SetFillColor(233, 236, 239);
            $pdf->Rect($x, $y, $ancho, $alto, 'F');
            
            // Barra de progreso con colores exactos del HTML
            $ancho_barra = ($ancho * $porcentaje) / 100;
            if ($ancho_barra > 0) {
                // Colores exactos del HTML
                if ($color_class == 'blue') {
                    $pdf->SetFillColor(10, 110, 189); // #0a6ebd
                } elseif ($color_class == 'green') {
                    $pdf->SetFillColor(16, 185, 129); // #10b981
                } elseif ($color_class == 'orange') {
                    $pdf->SetFillColor(255, 140, 0); // #FF8C00
                } else { // red
                    $pdf->SetFillColor(239, 68, 68); // #ef4444
                }
                $pdf->Rect($x, $y, $ancho_barra, $alto, 'F');
            }
            // Texto del porcentaje (más pequeño)
            $color_text = $color_class == 'blue' ? array(10, 110, 189) : 
                         ($color_class == 'green' ? array(16, 185, 129) : 
                         ($color_class == 'orange' ? array(255, 140, 0) : array(239, 68, 68)));
            $pdf->SetTextColor($color_text[0], $color_text[1], $color_text[2]);
            $pdf->SetFont('helvetica', 'B', 9);
            $pdf->SetXY($x + $ancho + 2, $y);
            $pdf->Cell(12, $alto, number_format($porcentaje, 1) . '%', 0, 0, 'L');
            $pdf->SetFont('helvetica', '', 11);
        }
        
        $kpi_data = [
            ['Avance General', number_format($promedio_general, 2) . '%', $promedio_general, $color_azul],
            ['Total Carpetas', ($kpis['total_carpetas'] ?? 0), null, $color_azul],
            ['Total Controles', ($kpis['total_controles'] ?? 0), null, $color_azul],
            ['Controles Validados', ($kpis['controles_validados'] ?? 0), null, $color_verde],
            ['Controles con Observaciones', ($kpis['controles_observaciones'] ?? 0), null, $color_rojo],
            ['Usuarios Activos', ($kpis['usuarios_activos'] ?? 0), null, array(108, 117, 125)],
            ['Avance Global por Empresa', number_format($kpis['avance_global_empresas'] ?? 0, 2) . '%', floatval($kpis['avance_global_empresas'] ?? 0), $color_azul]
        ];
        
        // Calcular porcentajes para controles
        $total_controles = $kpis['total_controles'] ?? 0;
        $controles_validados = $kpis['controles_validados'] ?? 0;
        $controles_obs = $kpis['controles_observaciones'] ?? 0;
        $porcentaje_validados = $total_controles > 0 ? ($controles_validados / $total_controles) * 100 : 0;
        $porcentaje_obs = $total_controles > 0 ? ($controles_obs / $total_controles) * 100 : 0;
        
        $row_num = 0;
        foreach ($kpi_data as $idx => $kpi) {
            // Sin bordes laterales, solo línea inferior (igual que HTML: border-bottom: 1px solid #f1f3f5)
            $pdf->SetFillColor(255, 255, 255);
            $pdf->SetDrawColor(241, 243, 245); // #f1f3f5
            $pdf->SetTextColor(44, 62, 80);
            
            // Indicador (más compacto)
            $pdf->SetTextColor(44, 62, 80); // #2c3e50
            $pdf->SetFont('helvetica', 'B', 11); // Más pequeño
            $pdf->SetXY(18, $pdf->GetY()); // Padding reducido
            $pdf->Cell(70, 5, $kpi[0], 0, 0, 'L', false); // Altura reducida
            
            // Valor con color (más compacto)
            $pdf->SetTextColor($kpi[3][0], $kpi[3][1], $kpi[3][2]);
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->SetXY(90, $pdf->GetY());
            $pdf->Cell(45, 5, $kpi[1], 0, 0, 'C', false); // Altura reducida
            $pdf->SetFont('helvetica', '', 11);
            
            // Barra de progreso o guión (más compacto)
            $x_barra = 135;
            $y_barra = $pdf->GetY() + 0.5;
            if ($kpi[2] !== null) {
                // Determinar color según porcentaje
                $color_class = $kpi[2] >= 80 ? 'green' : ($kpi[2] >= 50 ? 'orange' : 'red');
                dibujarBarraProgreso($pdf, $x_barra, $y_barra, 30, $kpi[2], $color_class);
                $pdf->SetXY(135, $pdf->GetY() + 6);
            } else {
                // Casos especiales para controles
                if ($idx == 3) { // Controles Validados
                    dibujarBarraProgreso($pdf, $x_barra, $y_barra, 30, $porcentaje_validados, 'green');
                    $pdf->SetXY(135, $pdf->GetY() + 6);
                } elseif ($idx == 4) { // Controles con Observaciones
                    dibujarBarraProgreso($pdf, $x_barra, $y_barra, 30, $porcentaje_obs, 'orange');
                    $pdf->SetXY(135, $pdf->GetY() + 6);
                } else {
                    $pdf->SetTextColor(156, 163, 175); // #9ca3af
                    $pdf->SetFont('helvetica', '', 11);
                    $pdf->SetXY(135, $pdf->GetY());
                    $pdf->Cell(45, 5, '-', 0, 0, 'C', false); // Altura reducida
                }
            }
            
            // Línea inferior (más sutil)
            $pdf->SetFillColor(241, 243, 245);
            $pdf->Rect(15, $pdf->GetY() + 5, 180, 0.15, 'F');
            
            $pdf->SetY($pdf->GetY() + 5); // Interlineado más ajustado
            $pdf->SetTextColor(0, 0, 0);
            $row_num++;
        }
        }
    }
    
    // ===== PÁGINA 2: AVANCE POR EMPRESA (solo si está habilitado) =====
    if ($parametros['incluirAvancePorEmpresa'] && !empty($kpis['avance_por_empresa']) && is_array($kpis['avance_por_empresa'])) {
        $pdf->AddPage('P');
        
        // Título de sección con línea naranja (más compacto)
        $pdf->SetTextColor(44, 62, 80);
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->Cell(180, 5, 'AVANCE POR EMPRESA', 0, 1, 'L');
        // Línea naranja debajo del título (2px)
        $pdf->SetFillColor(255, 140, 0);
        $pdf->Rect(15, $pdf->GetY() - 1, 180, 2, 'F');
        $pdf->Ln(8); // Espacio reducido
        
        // Encabezado de tabla (más compacto)
        $pdf->SetFillColor(10, 110, 189); // Azul CODELCO
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetDrawColor(0, 0, 0);
        $pdf->SetLineWidth(0);
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(90, 6, 'EMPRESA', 0, 0, 'L', true);
        $pdf->Cell(45, 6, 'AVANCE', 0, 0, 'C', true);
        $pdf->Cell(45, 6, 'CONTROLES', 0, 1, 'C', true);
        
        $pdf->SetFont('helvetica', '', 11);
        $pdf->SetTextColor(0, 0, 0);
        
        foreach ($kpis['avance_por_empresa'] as $empresa) {
            $avance = floatval($empresa['avance_promedio'] ?? 0);
            
            // Badge según avance (igual que HTML)
            $badge_class = $avance >= 80 ? 'badge-success' : ($avance >= 50 ? 'badge-warning' : 'badge-danger');
            if ($badge_class == 'badge-success') {
                $badge_bg = array(212, 237, 218); // #d4edda
                $badge_text = array(21, 87, 36); // #155724
            } elseif ($badge_class == 'badge-warning') {
                $badge_bg = array(255, 243, 205); // #fff3cd
                $badge_text = array(133, 100, 4); // #856404
            } else {
                $badge_bg = array(248, 215, 218); // #f8d7da
                $badge_text = array(114, 28, 36); // #721c24
            }
            
            // Nombre de empresa (más compacto)
            $pdf->SetTextColor(44, 62, 80);
            $pdf->SetFont('helvetica', 'B', 11);
            $pdf->SetXY(15, $pdf->GetY());
            $pdf->Cell(90, 5, $empresa['empresa'] ?? 'Sin nombre', 0, 0, 'L', false);
            
            // Badge de avance (más compacto)
            $badge_x = 105;
            $badge_y = $pdf->GetY() + 0.5;
            $pdf->SetFillColor($badge_bg[0], $badge_bg[1], $badge_bg[2]);
            $pdf->Rect($badge_x, $badge_y, 18, 4, 'F');
            $pdf->SetTextColor($badge_text[0], $badge_text[1], $badge_text[2]);
            $pdf->SetFont('helvetica', 'B', 9);
            $pdf->SetXY($badge_x + 1, $badge_y);
            $pdf->Cell(16, 4, number_format($avance, 1) . '%', 0, 0, 'C', false);
            
            // Controles
            $pdf->SetTextColor(44, 62, 80);
            $pdf->SetFont('helvetica', '', 11);
            $pdf->SetXY(150, $pdf->GetY());
            $pdf->Cell(45, 5, ($empresa['total_controles'] ?? 0), 0, 0, 'C', false);
            
            // Línea inferior (más sutil)
            $pdf->SetFillColor(241, 243, 245);
            $pdf->Rect(15, $pdf->GetY() + 5, 180, 0.15, 'F');
            $pdf->SetY($pdf->GetY() + 5); // Interlineado más ajustado
        }
    }
    
    // ===== PÁGINA 3: RESUMEN POR RIESGO CRÍTICO (solo si está habilitado) =====
    if ($parametros['incluirResumenRiesgos'] && !empty($carpetas_data['carpetas']) && is_array($carpetas_data['carpetas'])) {
        $pdf->AddPage('P');
        
        // Título de sección con línea naranja (más compacto)
        $pdf->SetTextColor(44, 62, 80);
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->Cell(180, 5, 'RESUMEN POR RIESGO CRÍTICO', 0, 1, 'L');
        // Línea naranja debajo del título (2px)
        $pdf->SetFillColor(255, 140, 0);
        $pdf->Rect(15, $pdf->GetY() - 1, 180, 2, 'F');
        $pdf->Ln(8); // Espacio reducido
        
        // Encabezado de tabla (más compacto)
        $pdf->SetFillColor(10, 110, 189);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetDrawColor(0, 0, 0);
        $pdf->SetLineWidth(0);
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(90, 6, 'RIESGO CRÍTICO', 0, 0, 'L', true);
        $pdf->Cell(30, 6, 'AVANCE', 0, 0, 'C', true);
        $pdf->Cell(30, 6, 'EMPRESAS', 0, 0, 'C', true);
        $pdf->Cell(30, 6, 'ESTADO', 0, 1, 'C', true);
        
        $pdf->SetFont('helvetica', '', 11);
        $pdf->SetTextColor(0, 0, 0);
        
        foreach ($carpetas_data['carpetas'] as $carpeta_nivel1) {
            $promedio_rc = floatval($carpeta_nivel1['promedio_ponderacion'] ?? 0);
            $num_empresas = !empty($carpeta_nivel1['subcarpetas']) ? count($carpeta_nivel1['subcarpetas']) : 0;
            $estado_text = $promedio_rc >= 80 ? 'Completo' : ($promedio_rc >= 50 ? 'En Progreso' : 'Pendiente');
            
            // Badge según avance (igual que HTML)
            $badge_class = $promedio_rc >= 80 ? 'badge-success' : ($promedio_rc >= 50 ? 'badge-warning' : 'badge-danger');
            if ($badge_class == 'badge-success') {
                $badge_bg = array(212, 237, 218); // #d4edda
                $badge_text = array(21, 87, 36); // #155724
            } elseif ($badge_class == 'badge-warning') {
                $badge_bg = array(255, 243, 205); // #fff3cd
                $badge_text = array(133, 100, 4); // #856404
            } else {
                $badge_bg = array(248, 215, 218); // #f8d7da
                $badge_text = array(114, 28, 36); // #721c24
            }
            
            // Nombre del RC (más compacto)
            $nombre_rc = $carpeta_nivel1['nombre'] ?? 'Sin nombre';
            $pdf->SetTextColor(44, 62, 80);
                $pdf->SetFont('helvetica', 'B', 11);
            $pdf->SetXY(15, $pdf->GetY());
            $pdf->Cell(90, 5, $nombre_rc, 0, 0, 'L', false);
            
            // Badge de avance (más compacto)
            $badge_x = 105;
            $badge_y = $pdf->GetY() + 0.5;
            $pdf->SetFillColor($badge_bg[0], $badge_bg[1], $badge_bg[2]);
            $pdf->Rect($badge_x, $badge_y, 18, 4, 'F');
            $pdf->SetTextColor($badge_text[0], $badge_text[1], $badge_text[2]);
                $pdf->SetFont('helvetica', 'B', 9);
            $pdf->SetXY($badge_x + 1, $badge_y);
            $pdf->Cell(16, 4, number_format($promedio_rc, 1) . '%', 0, 0, 'C', false);
            
            // Empresas
            $pdf->SetTextColor(44, 62, 80);
            $pdf->SetFont('helvetica', '', 11);
            $pdf->SetXY(135, $pdf->GetY());
            $pdf->Cell(30, 5, $num_empresas, 0, 0, 'C', false);
            
            // Estado (texto simple)
            $pdf->SetTextColor(44, 62, 80);
            $pdf->SetFont('helvetica', '', 11);
            $pdf->SetXY(165, $pdf->GetY());
            $pdf->Cell(30, 5, $estado_text, 0, 0, 'C', false);
            
            // Línea inferior (más sutil)
            $pdf->SetFillColor(241, 243, 245);
            $pdf->Rect(15, $pdf->GetY() + 5, 180, 0.15, 'F');
            $pdf->SetY($pdf->GetY() + 5); // Interlineado más ajustado
        }
    }
    
    // ===== FOOTER PROFESIONAL (más compacto) =====
    $pdf->Ln(4);
    $pdf->SetFillColor(248, 249, 250); // #f8f9fa
    $pdf->Rect(15, $pdf->GetY(), 180, 10, 'F');
    $pdf->SetTextColor(108, 117, 125); // #6c757d
    $pdf->SetFont('helvetica', '', 9);
    $pdf->SetXY(15, $pdf->GetY() + 2);
    $pdf->Cell(180, 3, 'Sistema de Control de Riesgos Críticos - Codelco', 0, 1, 'C');
    $pdf->SetXY(15, $pdf->GetY() + 1);
    $pdf->SetFont('helvetica', '', 9);
    $pdf->Cell(180, 3, 'Reporte generado automáticamente el ' . date('d/m/Y H:i:s'), 0, 1, 'C');
    
    // IMPORTANTE: Limpiar CUALQUIER salida previa ANTES de enviar headers
    // Esto es crítico para que el PDF se genere correctamente
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    
    // Verificar que no haya salida previa
    if (ob_get_length() !== false && ob_get_length() > 0) {
        ob_clean();
    }
    
    // Headers para el PDF (DEBEN enviarse antes de Output)
    $unique_id = time() . '_' . rand(1000, 9999);
    
    // Limpiar cualquier header previo
    if (!headers_sent()) {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
        header('Cache-Control: post-check=0, pre-check=0', false);
        header('Pragma: no-cache');
        header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="reporte_' . $unique_id . '.pdf"');
    } else {
        error_log("ADVERTENCIA: Headers ya fueron enviados antes del PDF");
    }
    
    // Log antes de generar
    error_log("Generando PDF con ID: " . $unique_id);
    error_log("Número de páginas: " . $pdf->getNumPages());
    
    // Generar y mostrar PDF directamente (sin descarga)
    try {
        $pdf->Output('reporte_' . $unique_id . '.pdf', 'I'); // 'I' = inline (mostrar en navegador)
        exit; // Asegurar que no se ejecute nada más después del PDF
    } catch (Exception $e) {
        // Si falla el Output, mostrar error
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body>';
        echo '<h1 style="color: #dc3545;">Error al generar el PDF</h1>';
        echo '<p>Error al generar el archivo PDF: ' . htmlspecialchars($e->getMessage()) . '</p>';
        echo '<p><a href="?proyecto_id=' . $proyecto_id . '">Volver al reporte HTML</a></p>';
        echo '</body></html>';
        exit;
    }
    
} catch (PDOException $e) {
    // Limpiar cualquier salida previa
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code(500);
    error_log('Error generando reporte PDF (PDO): ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    // Intentar mostrar HTML de error en lugar de JSON
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body>';
    echo '<h1 style="color: #dc3545;">Error al generar el reporte PDF</h1>';
    echo '<p>Ocurrió un error al generar el reporte. Por favor, intente nuevamente.</p>';
    echo '<p><small>Error: ' . htmlspecialchars($e->getMessage()) . '</small></p>';
    echo '<p><a href="?proyecto_id=' . ($proyecto_id ?? '') . '">Volver al reporte HTML</a></p>';
    echo '</body></html>';
    exit;
} catch (Exception $e) {
    // Limpiar cualquier salida previa
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code(500);
    error_log('Error general generando reporte PDF: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    // Intentar mostrar HTML de error en lugar de JSON
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body>';
    echo '<h1 style="color: #dc3545;">Error al generar el reporte PDF</h1>';
    echo '<p>Ocurrió un error al generar el reporte. Por favor, intente nuevamente.</p>';
    echo '<p><small>Error: ' . htmlspecialchars($e->getMessage()) . '</small></p>';
    echo '<p><a href="?proyecto_id=' . ($proyecto_id ?? '') . '">Volver al reporte HTML</a></p>';
    echo '</body></html>';
    exit;
} catch (Error $e) {
    // Capturar errores fatales de PHP 7+
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code(500);
    error_log('Error fatal generando reporte PDF: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body>';
    echo '<h1 style="color: #dc3545;">Error fatal al generar el reporte PDF</h1>';
    echo '<p>Ocurrió un error fatal. Por favor, contacte al administrador.</p>';
    echo '<p><small>Error: ' . htmlspecialchars($e->getMessage()) . '</small></p>';
    echo '<p><small>Archivo: ' . htmlspecialchars($e->getFile()) . ' (línea ' . $e->getLine() . ')</small></p>';
    echo '<p><a href="?proyecto_id=' . ($proyecto_id ?? '') . '">Volver al reporte HTML</a></p>';
    echo '</body></html>';
    exit;
}
?>

