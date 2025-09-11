<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

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
require 'db.php';

try {
    $stmt = $pdo->query("SELECT r.region_id, r.nombre, r.capital, COUNT(p.proyecto_id) AS cantidad_proyectos
FROM regiones r
LEFT JOIN proyectos p ON p.region_id = r.region_id
GROUP BY r.region_id, r.nombre, r.capital
ORDER BY r.region_id");
    $regiones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Asegurar que los IDs sean números
    foreach ($regiones as &$region) {
        $region['region_id'] = (int)$region['region_id'];
        $region['cantidad_proyectos'] = (int)$region['cantidad_proyectos'];
    }
    
    header('Content-Type: application/json');
    echo json_encode($regiones);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en la consulta de regiones: ' . $e->getMessage()]);
}
