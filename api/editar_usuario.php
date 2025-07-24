<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require 'db.php';

// Recibir datos JSON
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'], $data['nombre'], $data['email'], $data['rol'], $data['centro_costo_id'])) {
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

$aprobado = isset($data['aprobado']) ? $data['aprobado'] : 1;

try {
    $stmt = $pdo->prepare("UPDATE usuarios SET nombre = ?, email = ?, rol = ?, centro_costo_id = ?, aprobado = ? WHERE id = ?");
    $ok = $stmt->execute([
        $data['nombre'],
        $data['email'],
        $data['rol'],
        $data['centro_costo_id'],
        $data['aprobado'],
        $data['id']
    ]);
    if ($ok) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'No se pudo actualizar']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
