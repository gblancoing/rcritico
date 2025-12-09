<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$id = isset($data['id']) ? intval($data['id']) : 0;
$nombre = trim($data['nombre'] ?? '');
$email = trim($data['email'] ?? '');
$rol = $data['rol'] ?? '';
$centro_costo_id = isset($data['centro_costo_id']) ? intval($data['centro_costo_id']) : null;
$aprobado = isset($data['aprobado']) ? intval($data['aprobado']) : 1;
$password = trim($data['password'] ?? '');

if (!$id || $nombre === '' || $email === '' || $rol === '') {
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

$rolesRequierenCentro = ['admin', 'trabajador'];

try {
    $pdo->beginTransaction();

    if (in_array($rol, $rolesRequierenCentro, true)) {
        if (!$centro_costo_id) {
            throw new Exception('El centro de costo es obligatorio para este rol');
        }
        $stmtCheck = $pdo->prepare("SELECT id FROM centros_costo WHERE id = ?");
        $stmtCheck->execute([$centro_costo_id]);
        if (!$stmtCheck->fetch()) {
            throw new Exception("El centro de costo seleccionado no existe");
        }
    } else {
        $centro_costo_id = null;
    }

    $campos = ['nombre = ?', 'email = ?', 'rol = ?', 'aprobado = ?'];
    $params = [$nombre, $email, $rol, $aprobado];

    if ($centro_costo_id) {
        $campos[] = 'centro_costo_id = ?';
        $params[] = $centro_costo_id;
    } else {
        $campos[] = 'centro_costo_id = NULL';
    }

    if ($password !== '') {
        $campos[] = 'password = ?';
        $params[] = password_hash($password, PASSWORD_DEFAULT);
    }

    $params[] = $id;
    $sql = "UPDATE usuarios SET " . implode(', ', $campos) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Actualizar relación usuario-centro
    $pdo->prepare("DELETE FROM usuario_centro_costo WHERE usuario_id = ?")->execute([$id]);
    if ($centro_costo_id && in_array($rol, $rolesRequierenCentro, true)) {
        $stmtRel = $pdo->prepare("INSERT INTO usuario_centro_costo (usuario_id, centro_costo_id) VALUES (?, ?)");
        $stmtRel->execute([$id, $centro_costo_id]);
    }

    // Actualizar relación usuario-empresa
    $pdo->prepare("DELETE FROM usuario_empresa WHERE usuario_id = ?")->execute([$id]);
    if (isset($data['empresa_id']) && !empty($data['empresa_id'])) {
        $empresa_id = trim($data['empresa_id']);
        // Verificar que la empresa existe
        $stmt_check_empresa = $pdo->prepare("SELECT empresa_id FROM empresas WHERE empresa_id = ?");
        $stmt_check_empresa->execute([$empresa_id]);
        if ($stmt_check_empresa->fetch()) {
            try {
                $stmt_empresa = $pdo->prepare("INSERT INTO usuario_empresa (usuario_id, empresa_id) VALUES (?, ?)");
                $stmt_empresa->execute([$id, $empresa_id]);
            } catch (PDOException $e) {
                error_log('Warning: Error al actualizar relación usuario-empresa: ' . $e->getMessage());
            }
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
