<?php
/**
 * Router Definitivo para Subdominio pmo.jej664caren.cl
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
    // Buscar archivos estáticos en múltiples ubicaciones (producción y desarrollo)
    $static_paths = [
        __DIR__ . '/' . $path,  // Producción: archivos en la raíz
        __DIR__ . '/static/' . $path,  // Producción: archivos en static/
        __DIR__ . '/static/css/' . $path,  // Producción: CSS en static/css/
        __DIR__ . '/static/js/' . $path,  // Producción: JS en static/js/
        __DIR__ . '/build/' . $path,  // Desarrollo: archivos en build/
        __DIR__ . '/build/static/' . $path,  // Desarrollo: archivos en build/static/
        __DIR__ . '/build/static/css/' . $path,  // Desarrollo: CSS en build/static/css/
        __DIR__ . '/build/static/js/' . $path  // Desarrollo: JS en build/static/js/
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
// Buscar index.html en la raíz primero (producción), luego en build/ (desarrollo)
$index_file = null;
$possible_paths = [
    __DIR__ . '/index.html',  // Producción: archivos en la raíz
    __DIR__ . '/build/index.html'  // Desarrollo: archivos en build/
];

foreach ($possible_paths as $possible_path) {
    if (file_exists($possible_path)) {
        $index_file = $possible_path;
        break;
    }
}

error_log("React route detected: " . $path . " - Serving index.html");
error_log("Index file path: " . ($index_file ? $index_file : 'NOT FOUND'));
error_log("Index file exists: " . ($index_file ? 'YES' : 'NO'));

if ($index_file && file_exists($index_file)) {
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
    
    // Mostrar contenido del directorio raíz y build si existen
    echo '<h2>Contenido del directorio raíz:</h2>';
    echo '<ul>';
    $root_files = scandir(__DIR__);
    foreach ($root_files as $file) {
        if ($file != '.' && $file != '..' && $file != 'api') {
            $file_path = __DIR__ . '/' . $file;
            $is_dir = is_dir($file_path) ? ' (carpeta)' : ' (archivo)';
            echo '<li>' . htmlspecialchars($file) . $is_dir . '</li>';
        }
    }
    echo '</ul>';
    
    // Mostrar contenido de static si existe (producción)
    if (is_dir(__DIR__ . '/static')) {
        echo '<h2>Contenido del directorio static:</h2>';
        echo '<ul>';
        $static_files = scandir(__DIR__ . '/static');
        foreach ($static_files as $file) {
            if ($file != '.' && $file != '..') {
                $file_path = __DIR__ . '/static/' . $file;
                $is_dir = is_dir($file_path) ? ' (carpeta)' : ' (archivo)';
                echo '<li>' . htmlspecialchars($file) . $is_dir . '</li>';
            }
        }
        echo '</ul>';
    }
    
    // Mostrar contenido del directorio build si existe (desarrollo)
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
    }
}
