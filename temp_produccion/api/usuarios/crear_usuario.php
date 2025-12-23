<?php
// Limpiar cualquier output previo
if (ob_get_level()) {
    ob_clean();
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// Log para debugging en producción
error_log('[CREAR_USUARIO] Iniciando proceso de creación de usuario');
error_log('[CREAR_USUARIO] Método: ' . $_SERVER['REQUEST_METHOD']);
error_log('[CREAR_USUARIO] Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'no definido'));

$raw_input = file_get_contents('php://input');
error_log('[CREAR_USUARIO] Raw input length: ' . strlen($raw_input));
error_log('[CREAR_USUARIO] Raw input (primeros 500 chars): ' . substr($raw_input, 0, 500));

$data = json_decode($raw_input, true);

// Validar que los datos fueron recibidos correctamente
if (!$data) {
    $json_error = json_last_error_msg();
    error_log('[CREAR_USUARIO] Error al decodificar JSON: ' . $json_error);
    error_log('[CREAR_USUARIO] Raw input completo: ' . $raw_input);
    echo json_encode(['success' => false, 'error' => 'No se recibieron datos válidos. Error JSON: ' . $json_error]);
    exit;
}

error_log('[CREAR_USUARIO] Datos recibidos correctamente: ' . json_encode(array_keys($data)));

// Validar campos requeridos
if (!isset($data['nombre']) || empty(trim($data['nombre']))) {
    echo json_encode(['success' => false, 'error' => 'El nombre es requerido']);
    exit;
}

if (!isset($data['email']) || empty(trim($data['email']))) {
    echo json_encode(['success' => false, 'error' => 'El email es requerido']);
    exit;
}

if (!isset($data['password']) || empty(trim($data['password']))) {
    echo json_encode(['success' => false, 'error' => 'La contraseña es requerida']);
    exit;
}

if (!isset($data['rol']) || empty(trim($data['rol']))) {
    echo json_encode(['success' => false, 'error' => 'El rol es requerido']);
    exit;
}

$nombre = trim($data['nombre']);
$email = trim($data['email']);
$password = trim($data['password']); // Recibida en texto plano
$rol = trim($data['rol']);
$centro_costo_id = isset($data['centro_costo_id']) && $data['centro_costo_id'] !== '' ? intval($data['centro_costo_id']) : null;

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

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'El formato del email no es válido']);
    exit;
}

// Verificar si el email ya existe
try {
    $stmt_check_email = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt_check_email->execute([$email]);
    if ($stmt_check_email->fetch()) {
        echo json_encode(['success' => false, 'error' => 'El email ya está registrado']);
        exit;
    }
} catch (PDOException $e) {
    error_log('Error verificando email: ' . $e->getMessage());
}

try {
    error_log('[CREAR_USUARIO] Intentando INSERT con datos: nombre=' . $nombre . ', email=' . $email . ', rol=' . $rol . ', centro_costo_id=' . ($centro_costo_id ?? 'NULL') . ', aprobado=' . $aprobado);
    
    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password, rol, centro_costo_id, aprobado) VALUES (?, ?, ?, ?, ?, ?)");
    $ok = $stmt->execute([$nombre, $email, $password_hash, $rol, $centro_costo_id, $aprobado]);

    if ($ok) {
        $usuario_id = $pdo->lastInsertId();
        error_log('[CREAR_USUARIO] Usuario creado exitosamente con ID: ' . $usuario_id);

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
        error_log('[CREAR_USUARIO] Error en execute: ' . json_encode($error));
        echo json_encode(['success' => false, 'error' => 'No se pudo crear el usuario: ' . ($error[2] ?? 'Error desconocido'), 'debug' => $error]);
    }
} catch (PDOException $e) {
    error_log('[CREAR_USUARIO] Excepción PDO: ' . $e->getMessage());
    error_log('[CREAR_USUARIO] Código SQL: ' . $e->getCode());
    error_log('[CREAR_USUARIO] Stack trace: ' . $e->getTraceAsString());
    echo json_encode([
        'success' => false, 
        'error' => 'Error de base de datos: ' . $e->getMessage(),
        'code' => $e->getCode(),
        'sqlstate' => $e->errorInfo[0] ?? null
    ]);
} catch (Exception $e) {
    error_log('[CREAR_USUARIO] Excepción general: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Error inesperado: ' . $e->getMessage()]);
}
?>
