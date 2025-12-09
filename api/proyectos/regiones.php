<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

// SOLO PARA DESARROLLO: mostrar errores
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

try {
    // Verificar que la conexión funciona
    if (!isset($pdo)) {
        throw new Exception('No se pudo establecer conexión con la base de datos');
    }
    
    // Verificar si existe la columna 'activo' en la tabla proyectos
    $stmt_check_proyectos = $pdo->query("SHOW COLUMNS FROM proyectos LIKE 'activo'");
    $tiene_activo_proyectos = $stmt_check_proyectos->rowCount() > 0;
    
    // Construir la consulta según si existe la columna activo
    if ($tiene_activo_proyectos) {
        $sql = "SELECT r.region_id, r.nombre, r.capital, COUNT(p.proyecto_id) AS cantidad_proyectos
                FROM regiones r
                LEFT JOIN proyectos p ON p.region_id = r.region_id AND p.activo = 1
                GROUP BY r.region_id, r.nombre, r.capital
                ORDER BY r.region_id";
    } else {
        $sql = "SELECT r.region_id, r.nombre, r.capital, COUNT(p.proyecto_id) AS cantidad_proyectos
                FROM regiones r
                LEFT JOIN proyectos p ON p.region_id = r.region_id
                GROUP BY r.region_id, r.nombre, r.capital
                ORDER BY r.region_id";
    }
    
    $stmt = $pdo->query($sql);
    $regiones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Log para debugging (solo en desarrollo)
    $isLocal = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) || 
               strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;
    if ($isLocal) {
        error_log('Regiones cargadas: ' . count($regiones));
        error_log('Base de datos usada: ' . ($pdo->query("SELECT DATABASE()")->fetchColumn() ?? 'desconocida'));
    }
    
    // Asegurar que los IDs sean números
    foreach ($regiones as &$region) {
        $region['region_id'] = (int)$region['region_id'];
        $region['cantidad_proyectos'] = (int)$region['cantidad_proyectos'];
    }
    
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($regiones, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Error en regiones.php: ' . $e->getMessage());
    echo json_encode(['error' => 'Error en la consulta de regiones: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    error_log('Error general en regiones.php: ' . $e->getMessage());
    echo json_encode(['error' => 'Error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
