<?php
/**
 * API para descargar/visualizar archivos de Línea Base
 * Maneja archivos guardados en la tabla linea_base_archivos
 */

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// Obtener ID del archivo
$archivo_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$accion = isset($_GET['accion']) ? $_GET['accion'] : 'ver'; // 'descargar' o 'ver'

if (!$archivo_id) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'ID de archivo requerido'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Obtener información del archivo desde la tabla linea_base_archivos
    $stmt = $pdo->prepare("SELECT * FROM linea_base_archivos WHERE id = ? AND activo = 1");
    $stmt->execute([$archivo_id]);
    $archivo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$archivo) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Archivo no encontrado en la base de datos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Construir ruta absoluta del archivo
    // La ruta en BD es relativa: uploads/documentos_linea_base/lb_XXX/archivo.pdf
    // __DIR__ es api/archivos/ - necesitamos subir 2 niveles para llegar a la raíz
    $baseDir = dirname(dirname(__DIR__));
    $ruta_relativa = $archivo['ruta'];
    
    // Normalizar la ruta (eliminar barras duplicadas, etc)
    $ruta_relativa = str_replace(['\\', '//'], '/', $ruta_relativa);
    $ruta_relativa = ltrim($ruta_relativa, '/');
    
    // Construir posibles rutas donde puede estar el archivo
    $posibles_rutas = [
        // Ruta 1: Desde la raíz del proyecto (estructura estándar)
        $baseDir . '/' . $ruta_relativa,
        // Ruta 2: Si la ruta ya incluye algo extra
        $baseDir . '/uploads/documentos_linea_base/lb_' . $archivo['linea_base_id'] . '/' . $archivo['nombre_archivo'],
        // Ruta 3: Ruta directa del nombre del archivo
        $baseDir . '/uploads/documentos_linea_base/' . $archivo['nombre_archivo'],
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
            'error' => 'Archivo físico no encontrado en el servidor',
            'nombre' => $archivo['nombre_original'],
            'nombre_servidor' => $archivo['nombre_archivo'],
            'linea_base_id' => $archivo['linea_base_id'],
            'ruta_bd' => $ruta_relativa,
            'baseDir' => $baseDir,
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
    
    // Remover X-Frame-Options para permitir iframe
    @header_remove('X-Frame-Options');
    
    // Headers CORS para la respuesta del archivo
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Expose-Headers: Content-Length, Content-Range');
    
    // Headers para el archivo
    header('Content-Type: ' . $tipo_mime);
    header('Content-Length: ' . $tamano);
    header('Accept-Ranges: bytes');
    
    if ($accion === 'ver') {
        // Para visualización inline (PDFs, imágenes, etc.)
        header('Content-Disposition: inline; filename="' . $archivo['nombre_original'] . '"');
    } else {
        // Para descarga forzada
        header('Content-Disposition: attachment; filename="' . $archivo['nombre_original'] . '"');
    }
    
    // Caché moderado para archivos
    header('Cache-Control: public, max-age=3600');
    header('X-Content-Type-Options: nosniff');
    
    // Manejar Range requests para PDFs (necesario para algunos navegadores)
    if (isset($_SERVER['HTTP_RANGE'])) {
        $range = $_SERVER['HTTP_RANGE'];
        if (preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
            $start = intval($matches[1]);
            $end = $matches[2] !== '' ? intval($matches[2]) : $tamano - 1;
            $length = $end - $start + 1;
            
            http_response_code(206);
            header('Content-Range: bytes ' . $start . '-' . $end . '/' . $tamano);
            header('Content-Length: ' . $length);
            
            $handle = fopen($ruta_encontrada, 'rb');
            fseek($handle, $start);
            $remaining = $length;
            $chunk_size = 8192;
            
            while ($remaining > 0 && !feof($handle)) {
                $read = min($chunk_size, $remaining);
                echo fread($handle, $read);
                $remaining -= $read;
                flush();
            }
            fclose($handle);
            exit;
        }
    }
    
    // Enviar archivo completo
    readfile($ruta_encontrada);
    exit;
    
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}
?>

