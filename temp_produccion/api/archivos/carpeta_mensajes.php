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

// GET: Listar mensajes de una carpeta
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    
    if (!$carpeta_id) {
        http_response_code(400);
        echo json_encode(['error' => 'carpeta_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Si se proporciona usuario_id, verificar permisos para trabajadores y admin
        if ($usuario_id) {
            $stmt_rol = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
            $stmt_rol->execute([$usuario_id]);
            $usuario_data = $stmt_rol->fetch();
            
            if ($usuario_data && in_array($usuario_data['rol'], ['trabajador', 'admin'])) {
                // Verificar que el trabajador o admin tiene acceso a esta carpeta o a algún ancestro
                $stmt_asignadas = $pdo->prepare("SELECT carpeta_id FROM carpeta_usuarios WHERE usuario_id = ? AND puede_ver = 1");
                $stmt_asignadas->execute([$usuario_id]);
                $carpetas_asignadas_ids = array_column($stmt_asignadas->fetchAll(PDO::FETCH_ASSOC), 'carpeta_id');
                
                if (!empty($carpetas_asignadas_ids)) {
                    // Verificar si la carpeta actual o alguno de sus ancestros está asignada
                    $tiene_acceso = false;
                    $carpeta_actual_id = $carpeta_id;
                    
                    // Recorrer la jerarquía hacia arriba
                    while ($carpeta_actual_id !== null) {
                        if (in_array($carpeta_actual_id, $carpetas_asignadas_ids)) {
                            $tiene_acceso = true;
                            break;
                        }
                        
                        // Obtener el padre de la carpeta actual
                        $stmt_padre = $pdo->prepare("SELECT carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
                        $stmt_padre->execute([$carpeta_actual_id]);
                        $padre = $stmt_padre->fetch();
                        $carpeta_actual_id = $padre ? $padre['carpeta_padre_id'] : null;
                    }
                    
                    if (!$tiene_acceso) {
                        http_response_code(403);
                        echo json_encode(['error' => 'No tienes permiso para acceder a esta carpeta'], JSON_UNESCAPED_UNICODE);
                        exit;
                    }
                } else {
                    // Usuario sin carpetas asignadas
                    http_response_code(403);
                    echo json_encode(['error' => 'No tienes permiso para acceder a esta carpeta'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }
        }
        // Obtener mensajes principales y sus respuestas
        $sql = "SELECT m.*, 
                       u.nombre as usuario_nombre,
                       u.email as usuario_email,
                       u.rol as usuario_rol,
                       COUNT(r.id) as cantidad_respuestas
                FROM carpeta_mensajes m
                LEFT JOIN usuarios u ON m.usuario_id = u.id
                LEFT JOIN carpeta_mensajes r ON r.mensaje_padre_id = m.id AND r.activo = 1
                WHERE m.carpeta_id = ? AND m.activo = 1 AND m.mensaje_padre_id IS NULL
                GROUP BY m.id
                ORDER BY m.creado_en DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$carpeta_id]);
        $mensajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Para cada mensaje, obtener sus respuestas
        foreach ($mensajes as &$mensaje) {
            $sqlRespuestas = "SELECT r.*, 
                                     u.nombre as usuario_nombre,
                                     u.email as usuario_email,
                                     u.rol as usuario_rol
                              FROM carpeta_mensajes r
                              LEFT JOIN usuarios u ON r.usuario_id = u.id
                              WHERE r.mensaje_padre_id = ? AND r.activo = 1
                              ORDER BY r.creado_en DESC";
            
            $stmtRespuestas = $pdo->prepare($sqlRespuestas);
            $stmtRespuestas->execute([$mensaje['id']]);
            $mensaje['respuestas'] = $stmtRespuestas->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode($mensajes, JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener mensajes: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// POST: Crear nuevo mensaje
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $carpeta_id = intval($data['carpeta_id'] ?? 0);
    $usuario_id = intval($data['usuario_id'] ?? 0);
    $mensaje = trim($data['mensaje'] ?? '');
    $mensaje_padre_id = isset($data['mensaje_padre_id']) ? intval($data['mensaje_padre_id']) : null;
    
    if (!$carpeta_id || !$usuario_id || empty($mensaje)) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar permisos para trabajadores y admin
        $stmt_rol = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
        $stmt_rol->execute([$usuario_id]);
        $usuario_data = $stmt_rol->fetch();
        
        if ($usuario_data && in_array($usuario_data['rol'], ['trabajador', 'admin'])) {
            // Verificar que el trabajador o admin tiene acceso a esta carpeta o a algún ancestro
            $stmt_asignadas = $pdo->prepare("SELECT carpeta_id FROM carpeta_usuarios WHERE usuario_id = ? AND puede_ver = 1");
            $stmt_asignadas->execute([$usuario_id]);
            $carpetas_asignadas_ids = array_column($stmt_asignadas->fetchAll(PDO::FETCH_ASSOC), 'carpeta_id');
            
            if (!empty($carpetas_asignadas_ids)) {
                // Verificar si la carpeta actual o alguno de sus ancestros está asignada
                $tiene_acceso = false;
                $carpeta_actual_id = $carpeta_id;
                
                // Recorrer la jerarquía hacia arriba
                while ($carpeta_actual_id !== null) {
                    if (in_array($carpeta_actual_id, $carpetas_asignadas_ids)) {
                        $tiene_acceso = true;
                        break;
                    }
                    
                    // Obtener el padre de la carpeta actual
                    $stmt_padre = $pdo->prepare("SELECT carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
                    $stmt_padre->execute([$carpeta_actual_id]);
                    $padre = $stmt_padre->fetch();
                    $carpeta_actual_id = $padre ? $padre['carpeta_padre_id'] : null;
                }
                
                if (!$tiene_acceso) {
                    http_response_code(403);
                    echo json_encode(['error' => 'No tienes permiso para acceder a esta carpeta'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            } else {
                // Usuario sin carpetas asignadas
                http_response_code(403);
                echo json_encode(['error' => 'No tienes permiso para acceder a esta carpeta'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        $sql = "INSERT INTO carpeta_mensajes (carpeta_id, usuario_id, mensaje, mensaje_padre_id) 
                VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$carpeta_id, $usuario_id, $mensaje, $mensaje_padre_id]);
        
        $mensaje_id = $pdo->lastInsertId();
        
        // Obtener el mensaje creado con información del usuario
        $sqlMensaje = "SELECT m.*, 
                              u.nombre as usuario_nombre,
                              u.email as usuario_email,
                              u.rol as usuario_rol
                       FROM carpeta_mensajes m
                       LEFT JOIN usuarios u ON m.usuario_id = u.id
                       WHERE m.id = ?";
        $stmtMensaje = $pdo->prepare($sqlMensaje);
        $stmtMensaje->execute([$mensaje_id]);
        $mensajeCreado = $stmtMensaje->fetch(PDO::FETCH_ASSOC);
        
        if ($mensaje_padre_id) {
            $mensajeCreado['respuestas'] = [];
        }
        
        echo json_encode(['success' => true, 'mensaje' => $mensajeCreado], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear mensaje: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// PUT: Actualizar mensaje
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $mensaje_id = intval($data['id'] ?? 0);
    $mensaje = trim($data['mensaje'] ?? '');
    $usuario_id = intval($data['usuario_id'] ?? 0);
    
    if (!$mensaje_id || empty($mensaje) || !$usuario_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que el usuario es el autor del mensaje
        $sqlVerificar = "SELECT usuario_id FROM carpeta_mensajes WHERE id = ?";
        $stmtVerificar = $pdo->prepare($sqlVerificar);
        $stmtVerificar->execute([$mensaje_id]);
        $mensajeActual = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
        
        if (!$mensajeActual || $mensajeActual['usuario_id'] != $usuario_id) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permiso para editar este mensaje'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $sql = "UPDATE carpeta_mensajes SET mensaje = ?, actualizado_en = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$mensaje, $mensaje_id]);
        
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar mensaje: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE: Eliminar mensaje (soft delete)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $mensaje_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    
    if (!$mensaje_id || !$usuario_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que el usuario es el autor del mensaje o es admin
        $sqlVerificar = "SELECT usuario_id FROM carpeta_mensajes WHERE id = ?";
        $stmtVerificar = $pdo->prepare($sqlVerificar);
        $stmtVerificar->execute([$mensaje_id]);
        $mensajeActual = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
        
        if (!$mensajeActual) {
            http_response_code(404);
            echo json_encode(['error' => 'Mensaje no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar rol del usuario
        $sqlUsuario = "SELECT rol FROM usuarios WHERE id = ?";
        $stmtUsuario = $pdo->prepare($sqlUsuario);
        $stmtUsuario->execute([$usuario_id]);
        $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario || ($mensajeActual['usuario_id'] != $usuario_id && !in_array($usuario['rol'], ['super_admin', 'admin']))) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permiso para eliminar este mensaje'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $sql = "UPDATE carpeta_mensajes SET activo = 0 WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$mensaje_id]);
        
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar mensaje: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
