<?php
// Endpoint específico para visualizar PDFs en iframe
// Este archivo evita las restricciones de X-Frame-Options establecidas en .htaccess

// CRÍTICO: Manejar preflight OPTIONS request PRIMERO
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Range, X-Requested-With, Accept');
    header('Access-Control-Expose-Headers: Content-Length, Content-Range');
    header('Access-Control-Max-Age: 3600');
    @header_remove('X-Frame-Options');
    http_response_code(200);
    exit;
}

// CRÍTICO: Headers CORS al inicio para permitir acceso desde cualquier origen
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Range, X-Requested-With, Accept');
header('Access-Control-Expose-Headers: Content-Length, Content-Range');
header('Access-Control-Max-Age: 3600');

// CRÍTICO: Eliminar X-Frame-Options lo más temprano posible
// Esto debe hacerse ANTES de cualquier otra operación
@header_remove('X-Frame-Options');

// Desactivar output buffering para archivos binarios
if (ob_get_level()) {
    ob_end_clean();
}

// Eliminar X-Frame-Options nuevamente después de limpiar el buffer
@header_remove('X-Frame-Options');

// Obtener el ID del archivo desde la URL
$archivo_id = isset($_GET['id']) ? intval($_GET['id']) : null;

if (!$archivo_id) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'ID de archivo requerido'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Conectar a la base de datos
require_once __DIR__ . '/config/db.php';

try {
    // Obtener información del archivo
    $stmt = $pdo->prepare("SELECT ruta_archivo, nombre_original, tipo_mime FROM archivos WHERE id = ? AND activo = 1");
    $stmt->execute([$archivo_id]);
    $archivo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$archivo) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Archivo no encontrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Construir la ruta física del archivo (manejar formatos legados)
    $ruta_relativa = $archivo['ruta_archivo'] ?? '';

    // Si viene como URL absoluta, quedarnos solo con la ruta
    if (preg_match('#^https?://#i', $ruta_relativa)) {
        $parsed = parse_url($ruta_relativa);
        $ruta_relativa = $parsed['path'] ?? '';
    }

    $ruta_relativa = str_replace('\\', '/', trim($ruta_relativa));
    $ruta_relativa = preg_replace('#/+#', '/', $ruta_relativa);
    $ruta_relativa = str_replace('..', '', $ruta_relativa); // Sanitizar traversal

    $ruta_fisica = null;
    $candidatas = [];
    $candidatasEvaluadas = [];

    $agregarRuta = function ($ruta) use (&$candidatas) {
        if ($ruta && !in_array($ruta, $candidatas, true)) {
            $candidatas[] = $ruta;
        }
    };

    if ($ruta_relativa !== '') {
        // Rutas típicas guardadas como /api/uploads/proyecto_X/archivo.pdf
        if (strpos($ruta_relativa, '/api/uploads/') === 0) {
            $subruta = substr($ruta_relativa, strlen('/api/uploads/'));
            $agregarRuta(__DIR__ . '/archivos/uploads/' . $subruta);
            $agregarRuta(dirname(__DIR__) . '/api/uploads/' . $subruta);
        }

        // Cuando se almacena sin el prefijo /api
        if (strpos($ruta_relativa, 'api/uploads/') === 0) {
            $subruta = substr($ruta_relativa, strlen('api/uploads/'));
            $agregarRuta(__DIR__ . '/archivos/uploads/' . $subruta);
            $agregarRuta(dirname(__DIR__) . '/api/uploads/' . $subruta);
        }

        // Si la ruta ya apunta a archivos/uploads/...
        if (strpos($ruta_relativa, 'archivos/uploads/') !== false) {
            $desdeArchivos = substr($ruta_relativa, strpos($ruta_relativa, 'archivos/uploads/') + strlen('archivos/uploads/'));
            $agregarRuta(__DIR__ . '/archivos/uploads/' . $desdeArchivos);
        }

        // Cuando se almacena sin prefijo (uploads/proyecto_X/...)
        if (strpos($ruta_relativa, 'uploads/') === 0) {
            $subruta = substr($ruta_relativa, strlen('uploads/'));
            $agregarRuta(__DIR__ . '/archivos/uploads/' . $subruta);
            $agregarRuta(dirname(__DIR__) . '/uploads/' . $subruta);
        }

        if (strpos($ruta_relativa, '/uploads/') === 0) {
            $subruta = ltrim(substr($ruta_relativa, strlen('/uploads/')), '/');
            $agregarRuta(__DIR__ . '/archivos/uploads/' . $subruta);
            $agregarRuta(dirname(__DIR__) . '/uploads/' . $subruta);
        }

        // Cuando la ruta ya tiene /archivos/uploads...
        if (strpos($ruta_relativa, '/archivos/uploads/') === 0) {
            $subruta = substr($ruta_relativa, strlen('/archivos/uploads/'));
            $agregarRuta(__DIR__ . '/archivos/uploads/' . $subruta);
        }

        if (strpos($ruta_relativa, 'archivos/uploads/') === 0) {
            $subruta = substr($ruta_relativa, strlen('archivos/uploads/'));
            $agregarRuta(__DIR__ . '/archivos/uploads/' . $subruta);
        }

        // Fallback: tratar la ruta completa como relativa al proyecto y al directorio actual
        $agregarRuta(__DIR__ . '/' . ltrim($ruta_relativa, '/'));
        $agregarRuta(dirname(__DIR__) . '/' . ltrim($ruta_relativa, '/'));

        // Último recurso: buscar solo por el nombre dentro de uploads conservando subcarpetas si existen
        $agregarRuta(__DIR__ . '/archivos/uploads/' . ltrim($ruta_relativa, '/'));
    }

    // Si la ruta almacenada ya es absoluta (Windows o Unix), probarla tal cual
    if (preg_match('#^[A-Za-z]:/#', $ruta_relativa) || strpos($ruta_relativa, '/') === 0) {
        $agregarRuta($ruta_relativa);
    }
    if (preg_match('#^[A-Za-z]:\\\\#', $archivo['ruta_archivo'] ?? '')) {
        $agregarRuta(str_replace('\\', '/', $archivo['ruta_archivo']));
    }

    foreach ($candidatas as $ruta_posible) {
        $candidatasEvaluadas[] = $ruta_posible;
        if (file_exists($ruta_posible) && is_file($ruta_posible)) {
            $ruta_fisica = $ruta_posible;
            break;
        }
    }
    
    // Verificar que el archivo existe
    if (!$ruta_fisica || !file_exists($ruta_fisica) || !is_file($ruta_fisica)) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Archivo físico no encontrado',
            'ruta_relativa' => $ruta_relativa,
            'candidatas' => $candidatasEvaluadas
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Verificar que es un PDF
    $extension = strtolower(pathinfo($ruta_fisica, PATHINFO_EXTENSION));
    if ($extension !== 'pdf') {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Este endpoint solo sirve archivos PDF'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Obtener información del archivo
    $file_size = filesize($ruta_fisica);
    $file_name = $archivo['nombre_original'];
    
    // CRÍTICO: Remover X-Frame-Options justo antes de establecer headers de respuesta
    @header_remove('X-Frame-Options');
    
    // Headers específicos para PDFs (SIN X-Frame-Options para permitir iframe)
    // Asegurar headers CORS explícitamente
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Range, X-Requested-With');
    header('Access-Control-Expose-Headers: Content-Length, Content-Range');
    
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . $file_name . '"');
    header('Content-Length: ' . $file_size);
    header('Cache-Control: public, max-age=3600');
    header('Accept-Ranges: bytes');
    header('X-Content-Type-Options: nosniff');
    // NO establecer X-Frame-Options para permitir visualización en iframe
    
    // Manejar Range requests para PDFs (necesario para algunos navegadores)
    if (isset($_SERVER['HTTP_RANGE'])) {
        $range = $_SERVER['HTTP_RANGE'];
        if (preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
            $start = intval($matches[1]);
            $end = $matches[2] ? intval($matches[2]) : $file_size - 1;
            $length = $end - $start + 1;
            
            http_response_code(206);
            header('Content-Range: bytes ' . $start . '-' . $end . '/' . $file_size);
            header('Content-Length: ' . $length);
            
            $handle = fopen($ruta_fisica, 'rb');
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
    
    // Leer y enviar el archivo en chunks
    $chunk_size = 8192;
    $handle = fopen($ruta_fisica, 'rb');
    
    if ($handle === false) {
        http_response_code(500);
        header('Content-Type: text/plain');
        echo 'Error al abrir el archivo';
        exit;
    }
    
    // Enviar el archivo en chunks
    while (!feof($handle)) {
        echo fread($handle, $chunk_size);
        flush();
    }
    
    fclose($handle);
    exit;
    
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}
?>

