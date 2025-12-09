<?php
/**
 * API para descargar/visualizar archivos
 * Maneja diferentes rutas donde pueden estar los archivos
 */

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/db.php';

// Obtener ID del archivo
$archivo_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$accion = isset($_GET['accion']) ? $_GET['accion'] : 'descargar'; // 'descargar' o 'ver'

if (!$archivo_id) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'ID de archivo requerido'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Obtener información del archivo desde la BD
    $stmt = $pdo->prepare("SELECT * FROM archivos WHERE id = ? AND activo = 1");
    $stmt->execute([$archivo_id]);
    $archivo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$archivo) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Archivo no encontrado en la base de datos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Intentar encontrar el archivo físico en varias ubicaciones posibles
    $ruta_bd = $archivo['ruta_archivo'];
    $nombre_archivo = $archivo['nombre'] ?: basename($ruta_bd);
    $carpeta_id = $archivo['carpeta_id'];
    
    $posibles_rutas = [
        // Ruta 1: PRINCIPAL - uploads/archivos/proyecto_X/ (nueva estructura)
        dirname(__DIR__) . '/' . $ruta_bd,
        // Ruta 2: uploads/archivos/proyecto_X/ directamente
        dirname(__DIR__) . '/uploads/archivos/proyecto_' . $carpeta_id . '/' . $nombre_archivo,
        // Ruta 3: api/archivos/uploads/proyecto_X/ (estructura anterior)
        __DIR__ . '/archivos/uploads/proyecto_' . $carpeta_id . '/' . $nombre_archivo,
        // Ruta 4: uploads/proyecto_X/ (sin archivos/)
        dirname(__DIR__) . '/uploads/proyecto_' . $carpeta_id . '/' . $nombre_archivo,
        // Ruta 5: api/uploads/proyecto_X/
        __DIR__ . '/uploads/proyecto_' . $carpeta_id . '/' . $nombre_archivo,
    ];
    
    $ruta_encontrada = null;
    $rutas_verificadas = [];
    
    foreach ($posibles_rutas as $ruta) {
        $existe = file_exists($ruta);
        $legible = $existe ? is_readable($ruta) : false;
        $rutas_verificadas[] = [
            'ruta' => $ruta,
            'existe' => $existe,
            'legible' => $legible
        ];
        
        if ($existe && $legible) {
            $ruta_encontrada = $ruta;
            break;
        }
    }
    
    if (!$ruta_encontrada) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Archivo no encontrado en el servidor',
            'nombre' => $archivo['nombre_original'],
            'nombre_servidor' => $nombre_archivo,
            'carpeta_id' => $carpeta_id,
            'ruta_bd' => $ruta_bd,
            'directorio_actual' => __DIR__,
            'rutas_intentadas' => $rutas_verificadas
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Determinar tipo MIME
    $tipo_mime = $archivo['tipo_mime'];
    if (!$tipo_mime) {
        $tipo_mime = mime_content_type($ruta_encontrada) ?: 'application/octet-stream';
    }
    
    // Obtener tamaño del archivo
    $tamano = filesize($ruta_encontrada);
    
    // Limpiar cualquier output previo
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    // Headers para descarga o visualización
    header('Content-Type: ' . $tipo_mime);
    header('Content-Length: ' . $tamano);
    
    if ($accion === 'ver') {
        // Para visualización inline (PDFs, imágenes, etc.)
        header('Content-Disposition: inline; filename="' . $archivo['nombre_original'] . '"');
    } else {
        // Para descarga forzada
        header('Content-Disposition: attachment; filename="' . $archivo['nombre_original'] . '"');
    }
    
    // Evitar caché
    header('Cache-Control: private, no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Enviar archivo
    readfile($ruta_encontrada);
    exit;
    
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}
?>

