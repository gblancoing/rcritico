<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$nombre = $data['nombre'];
$email = $data['email'];
$password = $data['password']; // Recibida en texto plano
$rol = $data['rol'];
$centro_costo_id = $data['centro_costo_id'];
$aprobado = isset($data['aprobado']) ? $data['aprobado'] : 1;

// Verificar que el centro_costo_id existe
$stmt_check = $pdo->prepare("SELECT id FROM centros_costo WHERE id = ?");
$stmt_check->execute([$centro_costo_id]);
$centro_existe = $stmt_check->fetch();

if (!$centro_existe) {
    echo json_encode(['success' => false, 'error' => "El centro de costo con ID $centro_costo_id no existe"]);
    exit;
}

// ¡AQUÍ está el cambio importante!
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password, rol, centro_costo_id, aprobado) VALUES (?, ?, ?, ?, ?, ?)");
    $ok = $stmt->execute([$nombre, $email, $password_hash, $rol, $centro_costo_id, $aprobado]);

    if ($ok) {
        $usuario_id = $pdo->lastInsertId();

        // Si el rol es admin, trabajador, visita o visita_sin_permiso, crea la relación
        if (in_array($rol, ['admin', 'trabajador', 'visita', 'visita_sin_permiso'])) {
            $stmt2 = $pdo->prepare("INSERT INTO usuario_centro_costo (usuario_id, centro_costo_id) VALUES (?, ?)");
            $stmt2->execute([$usuario_id, $centro_costo_id]);
        }

        echo json_encode(['success' => true]);
    } else {
        $error = $stmt->errorInfo();
        echo json_encode(['success' => false, 'error' => 'No se pudo crear el usuario: ' . $error[2]]);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>
