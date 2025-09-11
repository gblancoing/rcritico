<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// SOLO PARA DESARROLLO: mostrar errores// Configuración de errores solo para desarrollo
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Obtener todas las tablas de la base de datos
        $stmt = $pdo->query("SHOW TABLES");
        $tablas = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Filtrar solo las tablas que contienen datos financieros
        $tablas_financieras = array_filter($tablas, function($tabla) {
            return strpos($tabla, 'real') !== false || 
                   strpos($tabla, 'v0') !== false || 
                   strpos($tabla, 'npc') !== false || 
                   strpos($tabla, 'api') !== false;
        });
        
        echo json_encode([
            'success' => true,
            'todas_las_tablas' => $tablas,
            'tablas_financieras' => array_values($tablas_financieras)
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error en la consulta: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
?> 