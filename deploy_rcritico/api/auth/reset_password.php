<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método no permitido'
    ]);
    exit();
}

// Obtener datos del body
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['token']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Token y contraseña son requeridos'
    ]);
    exit();
}

$token = trim($input['token']);
$password = trim($input['password']);

// Validar contraseña (mínimo 6 caracteres)
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'La contraseña debe tener al menos 6 caracteres'
    ]);
    exit();
}

try {
    // Verificar si la tabla existe, si no, crear un error
    try {
        $stmt = $pdo->prepare("SELECT 1 FROM password_reset_tokens LIMIT 1");
        $stmt->execute();
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Sistema de recuperación no configurado'
        ]);
        exit();
    }

    // Verificar token válido y no expirado
    $stmt = $pdo->prepare("
        SELECT prt.email, prt.expires_at 
        FROM password_reset_tokens prt 
        WHERE prt.token = ? 
        AND prt.used = 0 
        AND prt.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    $token_data = $stmt->fetch();

    if (!$token_data) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Token inválido o expirado'
        ]);
        exit();
    }

    // Verificar que el usuario existe y está aprobado
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? AND aprobado = 1");
    $stmt->execute([$token_data['email']]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Usuario no encontrado o no aprobado'
        ]);
        exit();
    }

    // Hash de la nueva contraseña
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Actualizar contraseña del usuario
    $stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE email = ?");
    $stmt->execute([$hashed_password, $token_data['email']]);

    // Marcar token como usado
    $stmt = $pdo->prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?");
    $stmt->execute([$token]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Contraseña restablecida exitosamente'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
