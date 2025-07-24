<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Incluir configuración centralizada
require_once 'config.php';

// Obtener configuración de la base de datos
$dbConfig = getDbConfig();

$host = $dbConfig['host'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$dbname = $dbConfig['dbname'];

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die('Error de conexión: ' . $conn->connect_error);
}
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
    http_response_code(500);
    echo json_encode([
        'error' => 'Error de conexión a la base de datos: ' . $e->getMessage()
    ]);
    exit;
}
?>
