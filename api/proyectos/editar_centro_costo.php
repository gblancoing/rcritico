<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['id'], $data['nombre'], $data['descripcion'], $data['proyecto_id'])) {
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE centros_costo SET nombre = ?, descripcion = ?, proyecto_id = ? WHERE id = ?");
    $ok = $stmt->execute([
        $data['nombre'],
        $data['descripcion'],
        $data['proyecto_id'],
        $data['id']
    ]);
    if ($ok) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'No se pudo editar']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} 