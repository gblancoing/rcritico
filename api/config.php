<?php
// Función para encontrar el nombre real de la base de datos rcritico
function findRcriticoDbName($host, $user, $pass) {
    try {
        $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        $stmt = $pdo->query("SHOW DATABASES");
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $db_name = $row[0];
            // Buscar base de datos que contenga 'rcritico' pero no 'backup'
            if (stripos($db_name, 'rcritico') !== false && 
                stripos($db_name, 'backup') === false) {
                // Verificar que tenga la tabla regiones
                try {
                    $pdo->exec("USE `" . addslashes($db_name) . "`");
                    $stmt_check = $pdo->query("SHOW TABLES LIKE 'regiones'");
                    if ($stmt_check->rowCount() > 0) {
                        return $db_name;
                    }
                } catch (PDOException $e) {
                    continue;
                }
            }
        }
    } catch (PDOException $e) {
        // Si falla, retornar el nombre por defecto
    }
    
    // Fallback: intentar con tab
    return "\trcritico";
}

// Configuración de la base de datos según el entorno
function getDbConfig() {
    // Detectar si estamos en desarrollo local o producción
    // Si se ejecuta desde CLI, asumir que es local
    $isCli = php_sapi_name() === 'cli';
    
    // Si es HTTP, verificar el host
    $httpHost = $_SERVER['HTTP_HOST'] ?? '';
    $isLocalHttp = in_array($httpHost, ['localhost', '127.0.0.1']) || 
                   strpos($httpHost, 'localhost') !== false ||
                   strpos($httpHost, 'xampp') !== false;
    
    if ($isCli || $isLocalHttp) {
        // Configuración para desarrollo local (XAMPP)
        $host = 'localhost';
        $user = 'root';
        $pass = '';
        
        // Buscar el nombre real de la base de datos automáticamente
        $dbname = findRcriticoDbName($host, $user, $pass);
        
        return [
            'host' => $host,
            'user' => $user,
            'pass' => $pass,
            'dbname' => $dbname
        ];
    } else {
        // Configuración para producción (cPanel - rcritico.carenvp.cl)
        return [
            'host' => 'localhost',
            'user' => 'carenvpc_rcritico',
            'pass' => 'O$AR-B5R2v',
            'dbname' => 'carenvpc_rcritico'
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