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
require_once __DIR__ . '/../utils/email_functions_real.php'; // Usar la versión real con PHPMailer

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

if (!isset($input['email'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Email es requerido'
    ]);
    exit();
}

$email = trim($input['email']);

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Formato de email inválido'
    ]);
    exit();
}

try {
    // Verificar si el email existe en la base de datos
    $stmt = $pdo->prepare("SELECT id, nombre, email, aprobado FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // No revelar si el email existe o no por seguridad
        echo json_encode([
            'status' => 'success',
            'message' => 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña',
            'email_exists' => false
        ]);
        exit();
    }

    // Si el usuario existe pero no está aprobado, no permitir recuperación
    if (!$user['aprobado']) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Tu cuenta aún no ha sido aprobada por un administrador'
        ]);
        exit();
    }

    // Generar token único
    $token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token válido por 1 hora

    // Verificar si la tabla existe, si no, crearla
    try {
        $stmt = $pdo->prepare("SELECT 1 FROM password_reset_tokens LIMIT 1");
        $stmt->execute();
    } catch (Exception $e) {
        // Crear la tabla si no existe
        $create_table_sql = "CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100),
            token VARCHAR(255),
            expires_at DATETIME,
            used INT DEFAULT 0
        )";
        
        $pdo->exec($create_table_sql);
    }

    // Verificar si ya existe un token válido para este email
    $stmt = $pdo->prepare("
        SELECT id, expires_at 
        FROM password_reset_tokens 
        WHERE email = ? 
        AND used = 0 
        AND expires_at > NOW()
    ");
    $stmt->execute([$email]);
    $existing_token = $stmt->fetch();

    if ($existing_token) {
        // Ya existe un token válido pendiente
        echo json_encode([
            'status' => 'warning',
            'message' => 'Ya existe un token pendiente para restablecer la contraseña de este email',
            'email_exists' => true,
            'token_pending' => true,
            'expires_at' => $existing_token['expires_at']
        ]);
        exit();
    }

    // Limpiar tokens expirados para este email
    $stmt = $pdo->prepare("DELETE FROM password_reset_tokens WHERE email = ? AND expires_at <= NOW()");
    $stmt->execute([$email]);

    // Insertar nuevo token
    $stmt = $pdo->prepare("INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$email, $token, $expires_at]);

    // Enviar email con el enlace de recuperación
    $reset_link = "http://localhost/pmo/reset-password.html?token=" . $token;
    
    // Intentar enviar email real
    $email_enviado = enviarEmailRecuperacion($email, $user['nombre'], $token);
    
    // Log del envío
    $log_entry = date('Y-m-d H:i:s') . " - " . ($email_enviado ? "✅ EMAIL ENVIADO" : "❌ ERROR EMAIL") . "\n";
    $log_entry .= "Destinatario: $email ($user[nombre])\n";
    $log_entry .= "Enlace: $reset_link\n";
    $log_entry .= "Token: $token\n";
    $log_entry .= "Estado: " . ($email_enviado ? "Enviado correctamente" : "Error en envío") . "\n";
    $log_entry .= "---\n\n";

    file_put_contents('emails_enviados.log', $log_entry, FILE_APPEND);

    // Si el email no se pudo enviar, mostrar el enlace directamente
    if (!$email_enviado) {
        echo json_encode([
            'status' => 'success',
            'message' => 'El email no se pudo enviar, pero puedes usar este enlace para restablecer tu contraseña',
            'email_exists' => true,
            'email_sent' => false,
            'reset_link' => $reset_link,
            'token' => $token,
            'show_link' => true
        ]);
    } else {
        echo json_encode([
            'status' => 'success',
            'message' => 'Se ha enviado un enlace a tu email para restablecer tu contraseña',
            'email_exists' => true,
            'email_sent' => true,
            'reset_link' => $reset_link, // Para desarrollo
            'token' => $token // Para desarrollo
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
