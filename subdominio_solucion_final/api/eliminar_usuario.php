<?php
header('Content-Type: application/json');
require_once 'db.php'; // Asegúrate de tener la conexión a la base de datos

// Recibe el ID del usuario por POST (o puedes usar email)
$data = json_decode(file_get_contents('php://input'), true);
$id = isset($data['id']) ? intval($data['id']) : 0;

if ($id > 0) {
    $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
    if ($stmt->execute([$id])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'No se pudo eliminar el usuario.']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'ID inválido.']);
}
?>
