<?php
// Script de diagnóstico para verificar usuarios
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/db.php';

$email = isset($_GET['email']) ? trim($_GET['email']) : null;

if (!$email) {
    echo json_encode([
        'error' => 'Proporciona un email como parámetro: ?email=sso@jej.cl'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Buscar usuario
    $stmt = $pdo->prepare("SELECT id, nombre, email, rol, aprobado, centro_costo_id, 
                                  LENGTH(password) as password_length,
                                  SUBSTRING(password, 1, 20) as password_preview
                           FROM usuarios 
                           WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'encontrado' => false,
            'mensaje' => 'Usuario no encontrado en la base de datos'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Verificar relación con centro de costo si aplica
    $centros = [];
    if (in_array($user['rol'], ['admin', 'trabajador'])) {
        $stmt2 = $pdo->prepare("SELECT ucc.centro_costo_id, cc.nombre 
                                FROM usuario_centro_costo ucc
                                JOIN centros_costo cc ON ucc.centro_costo_id = cc.id
                                WHERE ucc.usuario_id = ?");
        $stmt2->execute([$user['id']]);
        $centros = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode([
        'encontrado' => true,
        'usuario' => [
            'id' => $user['id'],
            'nombre' => $user['nombre'],
            'email' => $user['email'],
            'rol' => $user['rol'],
            'aprobado' => (bool)$user['aprobado'],
            'aprobado_valor' => $user['aprobado'],
            'centro_costo_id' => $user['centro_costo_id'],
            'password_length' => $user['password_length'],
            'password_preview' => $user['password_preview'],
            'password_tiene_hash' => strpos($user['password_preview'], '$2y$') === 0 || strpos($user['password_preview'], '$2a$') === 0 || strpos($user['password_preview'], '$2b$') === 0
        ],
        'centros_asignados' => $centros,
        'diagnostico' => [
            'puede_hacer_login' => $user['aprobado'] == 1 && $user['rol'] !== 'visita_sin_permiso',
            'motivo_bloqueo' => !$user['aprobado'] ? 'Usuario no aprobado' : 
                               ($user['rol'] === 'visita_sin_permiso' ? 'Rol visita_sin_permiso' : 'Ninguno'),
            'tiene_centro_costo' => !empty($centros) || $user['centro_costo_id'] !== null,
            'password_valida' => $user['password_length'] > 0
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode([
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

