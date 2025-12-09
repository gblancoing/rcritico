<?php
// Configuración de la base de datos según el entorno
function getDbConfig() {
    // Detectar si estamos en desarrollo local o producción
    $isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']) || 
               strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
               strpos($_SERVER['HTTP_HOST'], 'xampp') !== false;
    
    if ($isLocal) {
        // Configuración para desarrollo local (XAMPP)
        return [
            'host' => 'localhost',
            'user' => 'root',
            'pass' => '',
            'dbname' => 'rcritico'
        ];
    } else {
        // Configuración para producción (cPanel)
        // TODO: Ajustar credenciales de producción cuando sea necesario
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