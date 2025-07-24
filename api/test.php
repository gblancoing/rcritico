<?php
// Configurar headers para CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Información del servidor
$serverInfo = [
    'status' => 'success',
    'message' => 'Backend PHP funcionando correctamente',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Desconocido',
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Desconocido',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido'
];

// Verificar extensiones PHP importantes
$extensions = [
    'json' => extension_loaded('json'),
    'curl' => extension_loaded('curl'),
    'mbstring' => extension_loaded('mbstring'),
    'openssl' => extension_loaded('openssl')
];

$serverInfo['extensions'] = $extensions;

// Verificar permisos de escritura
$serverInfo['writable'] = [
    'current_dir' => is_writable('.'),
    'temp_dir' => is_writable(sys_get_temp_dir())
];

// Información adicional del sistema
$serverInfo['system'] = [
    'os' => PHP_OS,
    'sapi' => php_sapi_name(),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size')
];

// Respuesta en formato JSON
echo json_encode($serverInfo, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?> 