<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['nombre'], $data['region_id'])) {
        echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
        exit;
    }
    $nombre = $data['nombre'];
    $descripcion = isset($data['descripcion']) ? $data['descripcion'] : '';
    $region_id = $data['region_id'];
    try {
        $stmt = $pdo->prepare("INSERT INTO proyectos (nombre, descripcion, region_id) VALUES (?, ?, ?)");
        $ok = $stmt->execute([$nombre, $descripcion, $region_id]);
        if ($ok) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'No se pudo agregar el proyecto']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

try {
    $stmt = $pdo->query("SELECT proyecto_id, nombre, descripcion, region_id FROM proyectos");
    $proyectos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Asegurar que los IDs sean números
    foreach ($proyectos as &$proyecto) {
        $proyecto['proyecto_id'] = (int)$proyecto['proyecto_id'];
        $proyecto['region_id'] = (int)$proyecto['region_id'];
    }
    
    echo json_encode($proyectos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en la consulta de proyectos: ' . $e->getMessage()]);
}
