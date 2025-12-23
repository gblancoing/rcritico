<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// GET: Listar asignaciones de una tarea
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $tarea_id = isset($_GET['tarea_id']) ? intval($_GET['tarea_id']) : null;
    
    if (!$tarea_id) {
        http_response_code(400);
        echo json_encode(['error' => 'tarea_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        $sql = "SELECT ta.*, 
                       u.nombre as usuario_nombre,
                       u.email as usuario_email
                FROM carpeta_tarea_asignaciones ta
                LEFT JOIN usuarios u ON ta.usuario_id = u.id
                WHERE ta.tarea_id = ? AND ta.activo = 1
                ORDER BY ta.asignado_en ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tarea_id]);
        $asignaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($asignaciones, JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener asignaciones: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// POST: Agregar usuario a una tarea existente
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $tarea_id = intval($data['tarea_id'] ?? 0);
    $usuario_id = intval($data['usuario_id'] ?? 0);
    $usuario_invitador_id = intval($data['usuario_invitador_id'] ?? 0);
    
    if (!$tarea_id || !$usuario_id || !$usuario_invitador_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que el usuario invitador es el creador de la tarea
        $sqlTarea = "SELECT creado_por, carpeta_id FROM carpeta_tareas WHERE id = ? AND activo = 1";
        $stmtTarea = $pdo->prepare($sqlTarea);
        $stmtTarea->execute([$tarea_id]);
        $tarea = $stmtTarea->fetch(PDO::FETCH_ASSOC);
        
        if (!$tarea) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Tarea no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar rol del usuario invitador
        $sqlUsuario = "SELECT rol FROM usuarios WHERE id = ?";
        $stmtUsuario = $pdo->prepare($sqlUsuario);
        $stmtUsuario->execute([$usuario_invitador_id]);
        $usuario = $stmtUsuario->fetch();
        
        // Solo el creador o admin puede agregar usuarios a la tarea
        if ($tarea['creado_por'] != $usuario_invitador_id && (!$usuario || !in_array($usuario['rol'], ['super_admin', 'admin']))) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo el creador de la tarea puede invitar usuarios'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar que el usuario a invitar está asignado a la carpeta
        $sqlCarpetaUsuario = "SELECT usuario_id FROM carpeta_usuarios WHERE carpeta_id = ? AND usuario_id = ? AND puede_ver = 1";
        $stmtCarpetaUsuario = $pdo->prepare($sqlCarpetaUsuario);
        $stmtCarpetaUsuario->execute([$tarea['carpeta_id'], $usuario_id]);
        $usuarioEnCarpeta = $stmtCarpetaUsuario->fetch();
        
        if (!$usuarioEnCarpeta) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'El usuario debe estar asignado a la carpeta antes de poder ser invitado a la tarea'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar que el usuario no está ya asignado a la tarea
        $sqlYaAsignado = "SELECT id FROM carpeta_tarea_asignaciones WHERE tarea_id = ? AND usuario_id = ? AND activo = 1";
        $stmtYaAsignado = $pdo->prepare($sqlYaAsignado);
        $stmtYaAsignado->execute([$tarea_id, $usuario_id]);
        if ($stmtYaAsignado->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'El usuario ya está asignado a esta tarea'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Agregar asignación
        $sqlAsignacion = "INSERT INTO carpeta_tarea_asignaciones (tarea_id, usuario_id) VALUES (?, ?)";
        $stmtAsignacion = $pdo->prepare($sqlAsignacion);
        $stmtAsignacion->execute([$tarea_id, $usuario_id]);
        
        // Obtener la asignación creada con información del usuario
        $sqlAsignacionCreada = "SELECT ta.*, 
                                       u.nombre as usuario_nombre,
                                       u.email as usuario_email
                                FROM carpeta_tarea_asignaciones ta
                                LEFT JOIN usuarios u ON ta.usuario_id = u.id
                                WHERE ta.id = ?";
        $stmtAsignacionCreada = $pdo->prepare($sqlAsignacionCreada);
        $stmtAsignacionCreada->execute([$pdo->lastInsertId()]);
        $asignacionCreada = $stmtAsignacionCreada->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'asignacion' => $asignacionCreada], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al agregar usuario a la tarea: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE: Quitar usuario de una tarea
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $tarea_id = isset($_GET['tarea_id']) ? intval($_GET['tarea_id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    $usuario_quita_id = isset($_GET['usuario_quita_id']) ? intval($_GET['usuario_quita_id']) : null;
    
    if (!$tarea_id || !$usuario_id || !$usuario_quita_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que el usuario que quita es el creador de la tarea
        $sqlTarea = "SELECT creado_por FROM carpeta_tareas WHERE id = ? AND activo = 1";
        $stmtTarea = $pdo->prepare($sqlTarea);
        $stmtTarea->execute([$tarea_id]);
        $tarea = $stmtTarea->fetch(PDO::FETCH_ASSOC);
        
        if (!$tarea) {
            http_response_code(404);
            echo json_encode(['error' => 'Tarea no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar rol del usuario
        $sqlUsuario = "SELECT rol FROM usuarios WHERE id = ?";
        $stmtUsuario = $pdo->prepare($sqlUsuario);
        $stmtUsuario->execute([$usuario_quita_id]);
        $usuario = $stmtUsuario->fetch();
        
        // Solo el creador o admin puede quitar usuarios de la tarea
        if ($tarea['creado_por'] != $usuario_quita_id && (!$usuario || !in_array($usuario['rol'], ['super_admin', 'admin']))) {
            http_response_code(403);
            echo json_encode(['error' => 'Solo el creador de la tarea puede quitar usuarios'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Soft delete de la asignación
        $sql = "UPDATE carpeta_tarea_asignaciones SET activo = 0 WHERE tarea_id = ? AND usuario_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tarea_id, $usuario_id]);
        
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al quitar usuario de la tarea: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);

