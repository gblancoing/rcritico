<?php
// Configuración de la base de datos según el entorno
function getDbConfig() {
    // Detectar si estamos en desarrollo local o producción
    $isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']) || 
               strpos($_SERVER['HTTP_HOST'], 'localhost') !== false;
    
    if ($isLocal) {
        // Configuración para desarrollo local (XAMPP)
        return [
            'host' => 'localhost',
            'user' => 'root',
            'pass' => '',
            'dbname' => 'pmo'
        ];
    } else {
        // IMPORTANTE: Cambiar estos valores según tu configuración de cPanel
        return [
            'host' => 'localhost',
            'user' => 'jejcatvn', // Cambiar por tu usuario de base de datos
            'pass' => '+T2v9jtSZS', // Cambiar por tu contraseña de base de datos
            'dbname' => 'jejcatvn_pmo' // Cambiar por el nombre de tu base de datos
        ];
    }
}

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