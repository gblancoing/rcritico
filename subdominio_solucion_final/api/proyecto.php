<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// SOLO PARA DESARROLLO: mostrar errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $proyecto_id = $_GET['id'] ?? null;
    
    if (!$proyecto_id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de proyecto requerido']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT p.proyecto_id, p.nombre, p.descripcion, p.region_id, r.nombre as region_nombre, r.capital 
                               FROM proyectos p 
                               LEFT JOIN regiones r ON p.region_id = r.region_id 
                               WHERE p.proyecto_id = ?");
        $stmt->execute([$proyecto_id]);
        $proyecto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($proyecto) {
            echo json_encode($proyecto);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Proyecto no encontrado']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error en la consulta: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
?> 