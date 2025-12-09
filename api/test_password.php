<?php
// Script para probar si una contraseña coincide con el hash almacenado
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/db.php';

$email = isset($_GET['email']) ? trim($_GET['email']) : null;
$password = isset($_GET['password']) ? trim($_GET['password']) : null;

if (!$email) {
    echo json_encode([
        'error' => 'Proporciona email y password como parámetros: ?email=sso@jej.cl&password=tu_password'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Buscar usuario
    $stmt = $pdo->prepare("SELECT id, nombre, email, password FROM usuarios WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'encontrado' => false,
            'mensaje' => 'Usuario no encontrado'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $resultado = [
        'usuario' => [
            'id' => $user['id'],
            'nombre' => $user['nombre'],
            'email' => $user['email']
        ],
        'password_hash_preview' => substr($user['password'], 0, 30) . '...',
        'password_length' => strlen($user['password'])
    ];
    
    if ($password) {
        // Probar con password_verify
        $verifica_hash = password_verify($password, $user['password']);
        
        // Probar comparación directa (por si acaso está en texto plano)
        $verifica_texto = ($password === $user['password']);
        
        $resultado['prueba_password'] = [
            'password_recibida' => str_repeat('*', strlen($password)),
            'password_length' => strlen($password),
            'password_verify' => $verifica_hash,
            'password_texto_plano' => $verifica_texto,
            'coincide' => $verifica_hash || $verifica_texto
        ];
        
        if ($verifica_hash) {
            $resultado['mensaje'] = '✓ La contraseña COINCIDE con el hash almacenado';
        } else if ($verifica_texto) {
            $resultado['mensaje'] = '⚠ La contraseña coincide en texto plano (debe ser hasheada)';
        } else {
            $resultado['mensaje'] = '✗ La contraseña NO coincide';
        }
    } else {
        $resultado['mensaje'] = 'Proporciona el parámetro password para probar: ?email=sso@jej.cl&password=tu_password';
    }
    
    echo json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode([
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

