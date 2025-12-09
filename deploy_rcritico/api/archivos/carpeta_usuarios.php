<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// GET: Obtener usuarios asignados a una carpeta
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : null;
    
    if (!$carpeta_id) {
        http_response_code(400);
        echo json_encode(['error' => 'carpeta_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        $sql = "SELECT cu.*, 
                       u.nombre as usuario_nombre,
                       u.email as usuario_email,
                       u.rol as usuario_rol,
                       asignador.nombre as asignador_nombre
                FROM carpeta_usuarios cu
                JOIN usuarios u ON cu.usuario_id = u.id
                LEFT JOIN usuarios asignador ON cu.asignado_por = asignador.id
                WHERE cu.carpeta_id = ?
                ORDER BY u.nombre";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$carpeta_id]);
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($usuarios, JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener usuarios: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// POST: Asignar usuario a carpeta
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $carpeta_id = intval($data['carpeta_id'] ?? 0);
    $usuario_id = intval($data['usuario_id'] ?? 0);
    $puede_ver = isset($data['puede_ver']) ? intval($data['puede_ver']) : 1;
    $puede_subir = isset($data['puede_subir']) ? intval($data['puede_subir']) : 0;
    $puede_editar = isset($data['puede_editar']) ? intval($data['puede_editar']) : 0;
    $puede_eliminar = isset($data['puede_eliminar']) ? intval($data['puede_eliminar']) : 0;
    $asignado_por = intval($data['asignado_por'] ?? 0);
    
    if (!$carpeta_id || !$usuario_id || !$asignado_por) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que la carpeta existe
        $stmt_check = $pdo->prepare("SELECT id FROM carpetas WHERE id = ? AND activo = 1");
        $stmt_check->execute([$carpeta_id]);
        if (!$stmt_check->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Carpeta no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar que el usuario a asignar existe y obtener su rol
        $stmt_check = $pdo->prepare("SELECT id, nombre, rol FROM usuarios WHERE id = ?");
        $stmt_check->execute([$usuario_id]);
        $usuario = $stmt_check->fetch();
        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Usuario no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar el rol del usuario que está asignando
        $stmt_asignador = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
        $stmt_asignador->execute([$asignado_por]);
        $asignador = $stmt_asignador->fetch();
        
        if (!$asignador) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Usuario asignador no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $rol_asignador = $asignador['rol'];
        
        // Solo super_admin puede asignar usuarios
        if ($rol_asignador !== 'super_admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo el super administrador puede asignar usuarios a carpetas'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Insertar o actualizar asignación
        $stmt = $pdo->prepare("INSERT INTO carpeta_usuarios (carpeta_id, usuario_id, puede_ver, puede_subir, puede_editar, puede_eliminar, asignado_por) 
                               VALUES (?, ?, ?, ?, ?, ?, ?)
                               ON DUPLICATE KEY UPDATE 
                               puede_ver = VALUES(puede_ver),
                               puede_subir = VALUES(puede_subir),
                               puede_editar = VALUES(puede_editar),
                               puede_eliminar = VALUES(puede_eliminar),
                               asignado_por = VALUES(asignado_por)");
        $stmt->execute([$carpeta_id, $usuario_id, $puede_ver, $puede_subir, $puede_editar, $puede_eliminar, $asignado_por]);
        
        // Registrar actividad (solo si la tabla existe)
        try {
        $stmt_act = $pdo->prepare("INSERT INTO actividad_carpetas (carpeta_id, usuario_id, tipo_actividad, descripcion, ip_address) VALUES (?, ?, 'asignar_usuario', ?, ?)");
        $stmt_act->execute([$carpeta_id, $asignado_por, "Usuario asignado: " . $usuario['nombre'], $_SERVER['REMOTE_ADDR'] ?? '']);
        } catch (PDOException $e) {
            // Si la tabla de actividad no existe, continuar sin registrar
        }
        
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al asignar usuario: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE: Quitar usuario de carpeta
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : 0;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : 0;
    $quita_por = isset($_GET['quita_por']) ? intval($_GET['quita_por']) : 0;
    
    if (!$carpeta_id || !$usuario_id || !$quita_por) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Obtener nombre del usuario antes de quitar
        $stmt_get = $pdo->prepare("SELECT nombre FROM usuarios WHERE id = ?");
        $stmt_get->execute([$usuario_id]);
        $usuario = $stmt_get->fetch();
        
        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Usuario no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar el rol del usuario que está quitando
        $stmt_quita = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
        $stmt_quita->execute([$quita_por]);
        $quita_usuario = $stmt_quita->fetch();
        
        if (!$quita_usuario) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Usuario que quita no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $rol_quita = $quita_usuario['rol'];
        
        // Solo super_admin puede quitar usuarios de carpetas
        if ($rol_quita !== 'super_admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo el super administrador puede quitar usuarios de carpetas'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Eliminar asignación
        $stmt = $pdo->prepare("DELETE FROM carpeta_usuarios WHERE carpeta_id = ? AND usuario_id = ?");
        $stmt->execute([$carpeta_id, $usuario_id]);
        
        // Registrar actividad (solo si la tabla existe)
        try {
        $stmt_act = $pdo->prepare("INSERT INTO actividad_carpetas (carpeta_id, usuario_id, tipo_actividad, descripcion, ip_address) VALUES (?, ?, 'quitar_usuario', ?, ?)");
        $stmt_act->execute([$carpeta_id, $quita_por, "Usuario removido: " . $usuario['nombre'], $_SERVER['REMOTE_ADDR'] ?? '']);
        } catch (PDOException $e) {
            // Si la tabla de actividad no existe, continuar sin registrar
        }
        
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al quitar usuario: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
