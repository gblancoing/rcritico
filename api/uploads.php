<?php
// Script para servir archivos subidos
// Este archivo permite acceder a los archivos desde /api/uploads/...

// CRÍTICO: Eliminar X-Frame-Options lo más temprano posible
// Esto permite que los PDFs se muestren en iframes
// Usar @ para suprimir errores si el header no existe
@header_remove('X-Frame-Options');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Range');
    header('Access-Control-Expose-Headers: Content-Length, Content-Range');
    // Asegurar que no haya X-Frame-Options
    @header_remove('X-Frame-Options');
    http_response_code(200);
    exit;
}

// Desactivar output buffering para archivos binarios
if (ob_get_level()) {
    ob_end_clean();
}

// Eliminar X-Frame-Options nuevamente después de limpiar el buffer
@header_remove('X-Frame-Options');

// Obtener la ruta del archivo solicitado
// PRIORIDAD 1: Verificar si viene como parámetro GET (desde .htaccess)
$file_path = null;

if (isset($_GET['file']) && !empty($_GET['file'])) {
    $file_path = $_GET['file'];
} else {
    // PRIORIDAD 2: Extraer de la URL
    $request_uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($request_uri, PHP_URL_PATH);
    
    // Manejar diferentes formatos de URL
    // Puede venir como /rcritico/api/uploads/... o /ssocaren/api/uploads/... o /api/uploads/...
    $base_paths = ['/rcritico/api/uploads/', '/ssocaren/api/uploads/', '/api/uploads/'];
    
    foreach ($base_paths as $base_path) {
        if (strpos($path, $base_path) !== false) {
            $file_path = substr($path, strpos($path, $base_path) + strlen($base_path));
            break;
        }
    }
    
    // Si no se encontró con los paths estándar, intentar extraer manualmente
    if (!$file_path) {
        // Buscar /uploads/ en la ruta (cualquier ocurrencia)
        $uploads_pos = strpos($path, '/uploads/');
        if ($uploads_pos !== false) {
            $file_path = substr($path, $uploads_pos + strlen('/uploads/'));
        }
    }
}

if ($file_path) {
    // Limpiar la ruta del archivo (prevenir directory traversal)
    $file_path = str_replace('..', '', $file_path);
    $file_path = ltrim($file_path, '/');
    
    // Construir la ruta física del archivo
    // Los archivos están en api/archivos/uploads/proyecto_X/nombre_archivo
    $physical_path = __DIR__ . '/archivos/uploads/' . $file_path;
    
    // Debug en desarrollo - también enviar headers CORS temprano
    $is_localhost = (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);
    if ($is_localhost) {
        error_log("DEBUG uploads.php - file_path recibido: " . $file_path);
        error_log("DEBUG uploads.php - Ruta física buscada: " . $physical_path);
        error_log("DEBUG uploads.php - Archivo existe: " . (file_exists($physical_path) ? 'Sí' : 'No'));
        error_log("DEBUG uploads.php - REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'N/A'));
        error_log("DEBUG uploads.php - __DIR__: " . __DIR__);
    }
    
    // Verificar que el archivo existe
    if (file_exists($physical_path) && is_file($physical_path)) {
        // Obtener información del archivo
        $file_size = filesize($physical_path);
        
        // Verificar que el archivo no esté vacío
        if ($file_size === 0 || $file_size === false) {
            http_response_code(500);
            header('Content-Type: text/plain');
            echo 'El archivo está vacío o no se puede leer';
            exit;
        }
        
        // Detectar tipo MIME
        $mime_type = mime_content_type($physical_path);
        if (!$mime_type || $mime_type === 'application/octet-stream') {
            // Intentar detectar por extensión
            $extension = strtolower(pathinfo($physical_path, PATHINFO_EXTENSION));
            $mime_types = [
                'pdf' => 'application/pdf',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls' => 'application/vnd.ms-excel',
                'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'ppt' => 'application/vnd.ms-powerpoint',
                'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ];
            $mime_type = $mime_types[$extension] ?? 'application/octet-stream';
        }
        
        $file_name = basename($physical_path);
        
        // Headers para servir el archivo
        // CRÍTICO: Remover X-Frame-Options para permitir visualización en iframe
        // Esto debe hacerse justo antes de establecer los headers de respuesta
        @header_remove('X-Frame-Options');
        
        // Para PDFs, asegurar headers específicos para visualización en iframe
        if ($mime_type === 'application/pdf') {
            // Headers específicos para PDFs
            header('Content-Type: application/pdf');
            header('Content-Disposition: inline; filename="' . $file_name . '"');
            header('Content-Length: ' . $file_size);
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Range');
            header('Access-Control-Expose-Headers: Content-Length, Content-Range');
            header('Cache-Control: public, max-age=3600');
            header('Accept-Ranges: bytes');
            header('X-Content-Type-Options: nosniff');
            // NO establecer X-Frame-Options para permitir visualización en iframe desde cualquier origen
        } else {
            header('Content-Type: ' . $mime_type);
            header('Content-Disposition: inline; filename="' . $file_name . '"');
            header('Content-Length: ' . $file_size);
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Range');
            header('Access-Control-Expose-Headers: Content-Length, Content-Range');
            header('Cache-Control: public, max-age=3600');
            header('Accept-Ranges: bytes');
        }
        
        // Manejar Range requests para PDFs (necesario para algunos navegadores)
        if ($mime_type === 'application/pdf' && isset($_SERVER['HTTP_RANGE'])) {
            $range = $_SERVER['HTTP_RANGE'];
            if (preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
                $start = intval($matches[1]);
                $end = $matches[2] ? intval($matches[2]) : $file_size - 1;
                $length = $end - $start + 1;
                
                http_response_code(206);
                header('Content-Range: bytes ' . $start . '-' . $end . '/' . $file_size);
                header('Content-Length: ' . $length);
                
                $handle = fopen($physical_path, 'rb');
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
        
        // Leer y enviar el archivo en chunks para archivos grandes
        $chunk_size = 8192; // 8KB chunks
        $handle = fopen($physical_path, 'rb');
        
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
    } else {
        // Archivo no encontrado - mostrar información de debug en desarrollo
        http_response_code(404);
        header('Content-Type: text/plain');
        header('Access-Control-Allow-Origin: *'); // Permitir CORS incluso en errores
        if (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false) {
            $debug_info = "Archivo no encontrado\n";
            $debug_info .= "Ruta buscada: " . $physical_path . "\n";
            $debug_info .= "Ruta relativa: " . $file_path . "\n";
            $debug_info .= "Directorio existe: " . (file_exists(dirname($physical_path)) ? 'Sí' : 'No') . "\n";
            $debug_info .= "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'N/A') . "\n";
            $debug_info .= "GET file: " . (isset($_GET['file']) ? $_GET['file'] : 'N/A') . "\n";
            $debug_info .= "__DIR__: " . __DIR__ . "\n";
            
            // Intentar listar archivos en el directorio padre
            $parent_dir = dirname($physical_path);
            if (is_dir($parent_dir)) {
                $files = array_slice(scandir($parent_dir), 2);
                $debug_info .= "Archivos en directorio padre (" . $parent_dir . "): " . implode(', ', $files) . "\n";
            } else {
                $debug_info .= "El directorio padre NO existe: " . $parent_dir . "\n";
            }
            
            echo $debug_info;
        } else {
            echo 'Archivo no encontrado';
        }
        exit;
    }
} else {
    // Ruta inválida
    http_response_code(400);
    header('Content-Type: text/plain');
    echo 'Ruta inválida';
    exit;
}
?>

