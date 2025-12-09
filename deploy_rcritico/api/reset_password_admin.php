<?php
// Script para resetear contraseña de usuario (solo para administradores)
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/db.php';

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido. Use POST.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$email = isset($data['email']) ? trim($data['email']) : null;
$nueva_password = isset($data['nueva_password']) ? trim($data['nueva_password']) : null;

if (!$email || !$nueva_password) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Se requieren email y nueva_password'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strlen($nueva_password) < 6) {
    http_response_code(400);
    echo json_encode([
        'error' => 'La contraseña debe tener al menos 6 caracteres'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Buscar usuario
    $stmt = $pdo->prepare("SELECT id, nombre, email FROM usuarios WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'error' => 'Usuario no encontrado'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Hash de la nueva contraseña
    $password_hash = password_hash($nueva_password, PASSWORD_DEFAULT);
    
    // Actualizar contraseña
    $stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
    $stmt->execute([$password_hash, $user['id']]);
    
    echo json_encode([
        'success' => true,
        'mensaje' => "Contraseña actualizada exitosamente para {$user['nombre']} ({$user['email']})",
        'usuario' => [
            'id' => $user['id'],
            'nombre' => $user['nombre'],
            'email' => $user['email']
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

