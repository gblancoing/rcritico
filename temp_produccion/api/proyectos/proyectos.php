<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuración de errores solo para desarrollo
if (in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) || 
    strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false) {
    // Solo mostrar errores en desarrollo local
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    // En producción, ocultar errores
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['nombre'], $data['region_id'])) {
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $nombre = $data['nombre'];
    $descripcion = isset($data['descripcion']) ? $data['descripcion'] : '';
    $region_id = $data['region_id'];
    try {
        $stmt = $pdo->prepare("INSERT INTO proyectos (nombre, descripcion, region_id) VALUES (?, ?, ?)");
        $ok = $stmt->execute([$nombre, $descripcion, $region_id]);
        if ($ok) {
            echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'error' => 'No se pudo agregar el proyecto'], JSON_UNESCAPED_UNICODE);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

try {
    // Verificar si existe la columna 'activo' en la tabla proyectos
    $stmt_check = $pdo->query("SHOW COLUMNS FROM proyectos LIKE 'activo'");
    $tiene_activo = $stmt_check->rowCount() > 0;
    
    // Construir la consulta según si existe la columna activo
    if ($tiene_activo) {
        $stmt = $pdo->query("SELECT proyecto_id, nombre, descripcion, region_id FROM proyectos WHERE activo = 1 ORDER BY proyecto_id ASC");
    } else {
        $stmt = $pdo->query("SELECT proyecto_id, nombre, descripcion, region_id FROM proyectos ORDER BY proyecto_id ASC");
    }
    
    $proyectos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Asegurar que los IDs sean números
    foreach ($proyectos as &$proyecto) {
        $proyecto['proyecto_id'] = (int)$proyecto['proyecto_id'];
        $proyecto['region_id'] = (int)$proyecto['region_id'];
    }
    
    // Log para debugging (solo en desarrollo)
    if (in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) || 
        strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false) {
        error_log('Proyectos cargados: ' . count($proyectos));
    }
    
    // Devolver los proyectos en formato JSON
    echo json_encode($proyectos, JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    // Log del error
    error_log('Error en proyectos.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al cargar proyectos: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    // Log del error
    error_log('Error general en proyectos.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error inesperado: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>