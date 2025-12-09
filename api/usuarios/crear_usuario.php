<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$nombre = $data['nombre'];
$email = $data['email'];
$password = $data['password']; // Recibida en texto plano
$rol = $data['rol'];
$centro_costo_id = isset($data['centro_costo_id']) ? $data['centro_costo_id'] : null;

// Los usuarios de tipo "visita" se crean automáticamente sin aprobar
// y no requieren centro de costo asignado
if ($rol === 'visita' || $rol === 'visita_sin_permiso') {
    $aprobado = 0; // Pendiente de aprobación
    $centro_costo_id = null; // No requiere centro de costo
} else {
    $aprobado = isset($data['aprobado']) ? $data['aprobado'] : 1;
    
    // Verificar que el centro_costo_id existe (excepto para visita)
    if (!$centro_costo_id) {
        echo json_encode(['success' => false, 'error' => 'El centro de costo es requerido para este rol']);
        exit;
    }
    
    $stmt_check = $pdo->prepare("SELECT id FROM centros_costo WHERE id = ?");
    $stmt_check->execute([$centro_costo_id]);
    $centro_existe = $stmt_check->fetch();

    if (!$centro_existe) {
        echo json_encode(['success' => false, 'error' => "El centro de costo con ID $centro_costo_id no existe"]);
        exit;
    }
}

// ¡AQUÍ está el cambio importante!
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password, rol, centro_costo_id, aprobado) VALUES (?, ?, ?, ?, ?, ?)");
    $ok = $stmt->execute([$nombre, $email, $password_hash, $rol, $centro_costo_id, $aprobado]);

    if ($ok) {
        $usuario_id = $pdo->lastInsertId();

        // Crear relación usuario_centro_costo solo si tiene centro_costo_id asignado
        // Los usuarios de tipo "visita" no tienen centro de costo asignado
        if ($centro_costo_id && in_array($rol, ['admin', 'trabajador'])) {
            $stmt2 = $pdo->prepare("INSERT INTO usuario_centro_costo (usuario_id, centro_costo_id) VALUES (?, ?)");
            $stmt2->execute([$usuario_id, $centro_costo_id]);
        }

        // Crear relación usuario-empresa si se proporcionó empresa_id
        if (isset($data['empresa_id']) && !empty($data['empresa_id'])) {
            $empresa_id = trim($data['empresa_id']);
            // Verificar que la empresa existe
            $stmt_check_empresa = $pdo->prepare("SELECT empresa_id FROM empresas WHERE empresa_id = ?");
            $stmt_check_empresa->execute([$empresa_id]);
            if ($stmt_check_empresa->fetch()) {
                try {
                    $stmt_empresa = $pdo->prepare("INSERT INTO usuario_empresa (usuario_id, empresa_id) VALUES (?, ?)");
                    $stmt_empresa->execute([$usuario_id, $empresa_id]);
                } catch (PDOException $e) {
                    // Si ya existe la relación, ignorar el error
                    error_log('Warning: Relación usuario-empresa ya existe o error: ' . $e->getMessage());
                }
            }
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
