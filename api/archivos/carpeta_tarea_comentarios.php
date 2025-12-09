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

// GET: Obtener comentarios de una tarea
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $tarea_id = isset($_GET['tarea_id']) ? intval($_GET['tarea_id']) : null;
    
    if (!$tarea_id) {
        http_response_code(400);
        echo json_encode(['error' => 'tarea_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        $sql = "SELECT c.*, 
                       u.nombre as usuario_nombre,
                       u.email as usuario_email,
                       u.rol as usuario_rol
                FROM carpeta_tarea_comentarios c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.tarea_id = ? AND c.activo = 1
                ORDER BY c.creado_en ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tarea_id]);
        $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($comentarios, JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener comentarios: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// POST: Crear comentario en una tarea
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $tarea_id = intval($data['tarea_id'] ?? 0);
    $usuario_id = intval($data['usuario_id'] ?? 0);
    $comentario = trim($data['comentario'] ?? '');
    
    if (!$tarea_id || !$usuario_id || empty($comentario)) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que el usuario tiene permiso para comentar (debe ser el creador o estar asignado)
        $sqlVerificar = "SELECT t.creado_por, 
                                COUNT(ta.id) as tiene_asignacion
                         FROM carpeta_tareas t
                         LEFT JOIN carpeta_tarea_asignaciones ta ON ta.tarea_id = t.id 
                             AND ta.usuario_id = ? 
                             AND ta.activo = 1
                         WHERE t.id = ? AND t.activo = 1
                         GROUP BY t.id";
        $stmtVerificar = $pdo->prepare($sqlVerificar);
        $stmtVerificar->execute([$usuario_id, $tarea_id]);
        $verificacion = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
        
        if (!$verificacion) {
            http_response_code(404);
            echo json_encode(['error' => 'Tarea no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar permisos: solo el creador o los asignados pueden comentar
        $es_creador = $verificacion['creado_por'] == $usuario_id;
        $esta_asignado = $verificacion['tiene_asignacion'] > 0;
        
        // También permitir a super_admin y admin comentar
        $sqlRol = "SELECT rol FROM usuarios WHERE id = ?";
        $stmtRol = $pdo->prepare($sqlRol);
        $stmtRol->execute([$usuario_id]);
        $usuario = $stmtRol->fetch();
        $es_admin = $usuario && in_array($usuario['rol'], ['super_admin', 'admin']);
        
        if (!$es_creador && !$esta_asignado && !$es_admin) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permiso para comentar en esta tarea'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $sql = "INSERT INTO carpeta_tarea_comentarios (tarea_id, usuario_id, comentario) 
                VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tarea_id, $usuario_id, $comentario]);
        
        $comentario_id = $pdo->lastInsertId();
        
        // Obtener el comentario creado con información del usuario
        $sqlComentario = "SELECT c.*, 
                                 u.nombre as usuario_nombre,
                                 u.email as usuario_email,
                                 u.rol as usuario_rol
                          FROM carpeta_tarea_comentarios c
                          LEFT JOIN usuarios u ON c.usuario_id = u.id
                          WHERE c.id = ?";
        $stmtComentario = $pdo->prepare($sqlComentario);
        $stmtComentario->execute([$comentario_id]);
        $comentarioCreado = $stmtComentario->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'comentario' => $comentarioCreado], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear comentario: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE: Eliminar comentario (soft delete)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $comentario_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    
    if (!$comentario_id || !$usuario_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que el usuario es el autor del comentario o es admin
        $sqlVerificar = "SELECT usuario_id FROM carpeta_tarea_comentarios WHERE id = ?";
        $stmtVerificar = $pdo->prepare($sqlVerificar);
        $stmtVerificar->execute([$comentario_id]);
        $comentarioActual = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
        
        if (!$comentarioActual) {
            http_response_code(404);
            echo json_encode(['error' => 'Comentario no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar rol del usuario
        $sqlUsuario = "SELECT rol FROM usuarios WHERE id = ?";
        $stmtUsuario = $pdo->prepare($sqlUsuario);
        $stmtUsuario->execute([$usuario_id]);
        $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario || ($comentarioActual['usuario_id'] != $usuario_id && !in_array($usuario['rol'], ['super_admin', 'admin']))) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permiso para eliminar este comentario'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $sql = "UPDATE carpeta_tarea_comentarios SET activo = 0 WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$comentario_id]);
        
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar comentario: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);

