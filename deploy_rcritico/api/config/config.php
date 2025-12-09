<?php
// Este archivo solo contiene funciones, no debe generar salida
// Limpiar cualquier salida accidental por seguridad
if (ob_get_level()) {
    ob_clean();
}

// Configuración de la base de datos según el entorno
function getDbConfig() {
    // Detectar si estamos en desarrollo local o producción
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $serverName = $_SERVER['SERVER_NAME'] ?? '';
    
    // Verificar si es localhost de múltiples formas
    $isLocal = in_array($host, ['localhost', '127.0.0.1']) || 
               in_array($serverName, ['localhost', '127.0.0.1']) ||
               strpos($host, 'localhost') !== false ||
               strpos($serverName, 'localhost') !== false ||
               strpos($host, 'xampp') !== false ||
               strpos($host, ':3000') !== false ||
               strpos($host, ':3001') !== false ||
               strpos($host, ':3002') !== false ||
               (isset($_SERVER['SERVER_ADDR']) && $_SERVER['SERVER_ADDR'] === '127.0.0.1');
    
    // Si el host contiene 'jejcatvn' o el dominio de producción, forzar producción
    $isProduction = strpos($host, 'jejcatvn') !== false || 
                    strpos($host, 'rcritico') !== false ||
                    strpos($host, '.com') !== false ||
                    strpos($host, '.net') !== false ||
                    strpos($host, '.org') !== false;
    
    // Si es producción explícitamente, usar configuración de producción
    if ($isProduction && !$isLocal) {
        return [
            'host' => 'localhost',
            'user' => 'jejcatvn',
            'pass' => '+T2v9jtSZS',
            'dbname' => 'jejcatvn_rcritico'
        ];
    }
    
    if ($isLocal) {
        // Configuración para desarrollo local (XAMPP)
        return [
            'host' => 'localhost',
            'user' => 'root',
            'pass' => '',
            'dbname' => 'rcritico'
        ];
    } else {
        // Configuración para producción (cPanel) - por defecto
        return [
            'host' => 'localhost',
            'user' => 'jejcatvn',
            'pass' => '+T2v9jtSZS',
            'dbname' => 'jejcatvn_rcritico'
        ];
    }
}

// Configuración global de PDO
$dbConfig = getDbConfig();
$dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4";
$username = $dbConfig['user'];
$password = $dbConfig['pass'];
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

// Función para obtener la configuración de la URL base
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $script_name = $_SERVER['SCRIPT_NAME'];
    $base_path = dirname($script_name);
    
    return $protocol . '://' . $host . $base_path;
}

// Función para obtener la ruta de la API
function getApiUrl() {
    $base_url = getBaseUrl();
    return $base_url . '/api';
}
?> 