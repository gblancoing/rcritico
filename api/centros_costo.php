<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['nombre'], $data['proyecto_id'])) {
        echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
        exit;
    }
    $nombre = $data['nombre'];
    $descripcion = isset($data['descripcion']) ? $data['descripcion'] : '';
    $proyecto_id = $data['proyecto_id'];
    try {
        $stmt = $pdo->prepare("INSERT INTO centros_costo (nombre, descripcion, proyecto_id) VALUES (?, ?, ?)");
        $ok = $stmt->execute([$nombre, $descripcion, $proyecto_id]);
        if ($ok) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'No se pudo agregar el centro de costo']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// Consulta con JOIN a proyectos y regiones (la región se obtiene desde el proyecto)
$sql = "SELECT cc.id, cc.nombre, cc.descripcion, cc.proyecto_id, 
               p.nombre AS proyecto_nombre, r.nombre AS region_nombre
        FROM centros_costo cc
        LEFT JOIN proyectos p ON cc.proyecto_id = p.proyecto_id
        LEFT JOIN regiones r ON p.region_id = r.region_id
        ORDER BY cc.id";

try {
    $stmt = $pdo->query($sql);
    $centros = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Verificar si existe un centro de costo para "Proyecto Embalse Carén"
    $stmt2 = $pdo->prepare("SELECT p.proyecto_id FROM proyectos p WHERE p.nombre LIKE '%Embalse Carén%' OR p.nombre LIKE '%Carén%'");
    $stmt2->execute();
    $proyectoCarem = $stmt2->fetch(PDO::FETCH_ASSOC);
    
    if ($proyectoCarem) {
        // Verificar si ya existe un centro de costo para este proyecto
        $stmt3 = $pdo->prepare("SELECT id FROM centros_costo WHERE proyecto_id = ?");
        $stmt3->execute([$proyectoCarem['proyecto_id']]);
        $centroExistente = $stmt3->fetch(PDO::FETCH_ASSOC);
        
        if (!$centroExistente) {
            // Agregar automáticamente un centro de costo para Embalse Carén
            $stmt4 = $pdo->prepare("INSERT INTO centros_costo (nombre, descripcion, proyecto_id) VALUES (?, ?, ?)");
            $stmt4->execute(['Centro Embalse Carén', 'Centro de costo para el Proyecto Embalse Carén', $proyectoCarem['proyecto_id']]);
        }
        
        // Recargar los centros de costo
        $stmt = $pdo->query($sql);
        $centros = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Asegurar que los IDs sean números
    foreach ($centros as &$centro) {
        $centro['id'] = (int)$centro['id'];
        $centro['proyecto_id'] = (int)$centro['proyecto_id'];
    }
    
    echo json_encode($centros);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en la consulta de centros de costo: ' . $e->getMessage()]);
}
