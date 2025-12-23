<?php
// Este archivo es incluido desde otros archivos que ya configuraron los headers
// Solo limpiamos cualquier salida accidental
if (ob_get_level()) {
    ob_clean();
}

// Desactivar display_errors para evitar que se muestren errores HTML
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Incluir configuración centralizada
require_once __DIR__ . '/config.php';

// Obtener configuración de la base de datos
$dbConfig = getDbConfig();

$host = $dbConfig['host'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$dbname = $dbConfig['dbname'];

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    // Limpiar cualquier salida previa
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(500);
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: Content-Type");
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'Error de conexión: ' . $conn->connect_error], JSON_UNESCAPED_UNICODE);
    exit;
}

// Establecer charset UTF-8 para mysqli
$conn->set_charset("utf8mb4");
// echo '¡Conexión exitosa!';

// DSN (Data Source Name)
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

// Opciones para PDO
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Limpiar cualquier salida previa
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(500);
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: Content-Type");
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Error de conexión a la base de datos: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
