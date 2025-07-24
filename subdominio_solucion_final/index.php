<?php
/**
 * Router Definitivo para Subdominio financiero.jej664caren.cl
 * Solución que funciona sin configuración del servidor
 */

// Configuración de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener la ruta completa
$request_uri = $_SERVER['REQUEST_URI'];

// Debug logging
error_log("=== ROUTER SUBDOMINIO ===");
error_log("Request URI: " . $request_uri);
error_log("Document Root: " . $_SERVER['DOCUMENT_ROOT']);
error_log("Script Filename: " . $_SERVER['SCRIPT_FILENAME']);
error_log("Server Software: " . $_SERVER['SERVER_SOFTWARE']);
error_log("Server Name: " . $_SERVER['SERVER_NAME']);
error_log("HTTP Host: " . $_SERVER['HTTP_HOST']);

// Extraer solo la ruta sin query string
$path = parse_url($request_uri, PHP_URL_PATH);

// Limpiar la ruta
$path = trim($path, '/');

error_log("Clean Path: " . $path);

// Si la petición es para la API
if (strpos($path, 'api/') === 0) {
    $api_path = substr($path, 4); // Remover 'api/'
    $api_file = __DIR__ . '/api/' . $api_path;
    
    error_log("API Request: " . $api_file);
    
    if (file_exists($api_file) && is_file($api_file)) {
        include $api_file;
        exit();
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found: ' . $api_path]);
        exit();
    }
}

// Si la petición es para archivos estáticos (corregido para subdominio)
if (preg_match('/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map|json)$/', $path)) {
    // Para el subdominio, los archivos estáticos están en build/static/
    $static_paths = [
        __DIR__ . '/build/' . $path,
        __DIR__ . '/build/static/' . $path,
        __DIR__ . '/build/static/css/' . $path,
        __DIR__ . '/build/static/js/' . $path,
        __DIR__ . '/' . $path
    ];
    
    $static_file = null;
    foreach ($static_paths as $static_path) {
        if (file_exists($static_path) && is_file($static_path)) {
            $static_file = $static_path;
            break;
        }
    }
    
    error_log("Static file request: " . $path);
    error_log("Static file found: " . ($static_file ? $static_file : 'NOT FOUND'));
    
    if ($static_file) {
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $content_types = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject',
            'map' => 'application/json',
            'json' => 'application/json'
        ];
        
        $content_type = $content_types[$extension] ?? 'application/octet-stream';
        header('Content-Type: ' . $content_type);
        header('Cache-Control: public, max-age=31536000');
        
        readfile($static_file);
        exit();
    } else {
        error_log("Static file not found in any path: " . $path);
        error_log("Searched paths:");
        foreach ($static_paths as $static_path) {
            error_log("  - " . $static_path . " (exists: " . (file_exists($static_path) ? 'YES' : 'NO') . ")");
        }
        http_response_code(404);
        echo 'File not found: ' . $path;
        exit();
    }
}

// Para TODAS las demás rutas, servir index.html de React
$index_file = __DIR__ . '/build/index.html';

error_log("React route detected: " . $path . " - Serving index.html");
error_log("Index file path: " . $index_file);
error_log("Index file exists: " . (file_exists($index_file) ? 'YES' : 'NO'));

if (file_exists($index_file)) {
    $content = file_get_contents($index_file);
    
    // Servir con el tipo de contenido correcto
    header('Content-Type: text/html; charset=utf-8');
    
    // Agregar headers para evitar cache en rutas dinámicas
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    echo $content;
} else {
    // Si no existe el build, mostrar un mensaje de error detallado
    http_response_code(404);
    echo '<h1>Error: Build no encontrado</h1>';
    echo '<p>Por favor, ejecuta <code>npm run build</code> para generar los archivos de producción.</p>';
    echo '<p>Ruta solicitada: ' . htmlspecialchars($path) . '</p>';
    echo '<p>Archivo buscado: ' . htmlspecialchars($index_file) . '</p>';
    echo '<p>Directorio actual: ' . __DIR__ . '</p>';
    echo '<p>Request URI: ' . htmlspecialchars($request_uri) . '</p>';
    echo '<p>Server Software: ' . htmlspecialchars($_SERVER['SERVER_SOFTWARE']) . '</p>';
    echo '<p>Server Name: ' . htmlspecialchars($_SERVER['SERVER_NAME']) . '</p>';
    echo '<p>HTTP Host: ' . htmlspecialchars($_SERVER['HTTP_HOST']) . '</p>';
    
    // Mostrar contenido del directorio build si existe
    if (is_dir(__DIR__ . '/build')) {
        echo '<h2>Contenido del directorio build:</h2>';
        echo '<ul>';
        $build_files = scandir(__DIR__ . '/build');
        foreach ($build_files as $file) {
            if ($file != '.' && $file != '..') {
                $file_path = __DIR__ . '/build/' . $file;
                $is_dir = is_dir($file_path) ? ' (carpeta)' : ' (archivo)';
                echo '<li>' . htmlspecialchars($file) . $is_dir . '</li>';
            }
        }
        echo '</ul>';
        
        // Mostrar contenido de build/static si existe
        if (is_dir(__DIR__ . '/build/static')) {
            echo '<h2>Contenido del directorio build/static:</h2>';
            echo '<ul>';
            $static_files = scandir(__DIR__ . '/build/static');
            foreach ($static_files as $file) {
                if ($file != '.' && $file != '..') {
                    $file_path = __DIR__ . '/build/static/' . $file;
                    $is_dir = is_dir($file_path) ? ' (carpeta)' : ' (archivo)';
                    echo '<li>' . htmlspecialchars($file) . $is_dir . '</li>';
                }
            }
            echo '</ul>';
        }
    }
}
?> 