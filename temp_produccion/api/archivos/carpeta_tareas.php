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

// GET: Listar tareas de una carpeta
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    $estado = isset($_GET['estado']) ? $_GET['estado'] : null;
    
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
        $sql = "SELECT t.*, 
                       u_creador.nombre as creador_nombre,
                       u_creador.email as creador_email,
                       u_validador.nombre as validador_nombre,
                       u_validador.email as validador_email,
                       COUNT(DISTINCT c.id) as cantidad_comentarios
                FROM carpeta_tareas t
                LEFT JOIN usuarios u_creador ON t.creado_por = u_creador.id
                LEFT JOIN usuarios u_validador ON t.validada_por = u_validador.id
                LEFT JOIN carpeta_tarea_comentarios c ON c.tarea_id = t.id AND c.activo = 1
                WHERE t.carpeta_id = ? AND t.activo = 1";
        
        $params = [$carpeta_id];
        
        // Filtrar por usuario asignado si se proporciona (usando la nueva tabla de asignaciones)
        if ($usuario_id) {
            $sql .= " AND (t.creado_por = ? OR EXISTS (
                SELECT 1 FROM carpeta_tarea_asignaciones ta 
                WHERE ta.tarea_id = t.id 
                AND ta.usuario_id = ? 
                AND ta.activo = 1
            ))";
            $params[] = $usuario_id;
            $params[] = $usuario_id;
        }
        
        // Filtrar por estado si se proporciona
        if ($estado && in_array($estado, ['pendiente', 'en_progreso', 'completada', 'cancelada'])) {
            $sql .= " AND t.estado = ?";
            $params[] = $estado;
        }
        
        $sql .= " GROUP BY t.id ORDER BY 
                  CASE t.prioridad 
                    WHEN 'urgente' THEN 1 
                    WHEN 'alta' THEN 2 
                    WHEN 'media' THEN 3 
                    WHEN 'baja' THEN 4 
                  END,
                  t.fecha_vencimiento ASC,
                  t.creado_en DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener comentarios y asignaciones para cada tarea
        foreach ($tareas as &$tarea) {
            // Obtener comentarios
            $sqlComentarios = "SELECT c.*, 
                                      u.nombre as usuario_nombre,
                                      u.email as usuario_email,
                                      u.rol as usuario_rol
                               FROM carpeta_tarea_comentarios c
                               LEFT JOIN usuarios u ON c.usuario_id = u.id
                               WHERE c.tarea_id = ? AND c.activo = 1
                               ORDER BY c.creado_en ASC";
            
            $stmtComentarios = $pdo->prepare($sqlComentarios);
            $stmtComentarios->execute([$tarea['id']]);
            $tarea['comentarios'] = $stmtComentarios->fetchAll(PDO::FETCH_ASSOC);
            
            // Obtener asignaciones múltiples
            $sqlAsignaciones = "SELECT ta.*, 
                                       u.nombre as usuario_nombre,
                                       u.email as usuario_email
                                FROM carpeta_tarea_asignaciones ta
                                LEFT JOIN usuarios u ON ta.usuario_id = u.id
                                WHERE ta.tarea_id = ? AND ta.activo = 1
                                ORDER BY ta.asignado_en ASC";
            
            $stmtAsignaciones = $pdo->prepare($sqlAsignaciones);
            $stmtAsignaciones->execute([$tarea['id']]);
            $tarea['asignados'] = $stmtAsignaciones->fetchAll(PDO::FETCH_ASSOC);
            
            // Mantener compatibilidad con asignado_a (para tareas antiguas)
            if (empty($tarea['asignados']) && $tarea['asignado_a']) {
                $tarea['asignados'] = [[
                    'usuario_id' => $tarea['asignado_a'],
                    'usuario_nombre' => $tarea['asignado_nombre'] ?? null,
                    'usuario_email' => $tarea['asignado_email'] ?? null
                ]];
            }
        }
        
        echo json_encode($tareas, JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener tareas: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// POST: Crear nueva tarea
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $carpeta_id = intval($data['carpeta_id'] ?? 0);
    $titulo = trim($data['titulo'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $creado_por = intval($data['creado_por'] ?? 0);
    // Soporte para múltiples asignaciones (array) o asignación única (compatibilidad)
    $asignados_a = isset($data['asignados_a']) && is_array($data['asignados_a']) ? $data['asignados_a'] : 
                   (isset($data['asignado_a']) && $data['asignado_a'] ? [intval($data['asignado_a'])] : []);
    $fecha_vencimiento = isset($data['fecha_vencimiento']) && $data['fecha_vencimiento'] ? $data['fecha_vencimiento'] : null;
    $prioridad = isset($data['prioridad']) && in_array($data['prioridad'], ['baja', 'media', 'alta', 'urgente']) 
                 ? $data['prioridad'] : 'media';
    $recordatorio_en = isset($data['recordatorio_en']) && $data['recordatorio_en'] ? $data['recordatorio_en'] : null;
    
    if (!$carpeta_id || empty($titulo) || !$creado_por) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar permisos para trabajadores y admin
        $stmt_rol = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
        $stmt_rol->execute([$creado_por]);
        $usuario_data = $stmt_rol->fetch();
        
        if ($usuario_data && in_array($usuario_data['rol'], ['trabajador', 'admin'])) {
            // Verificar que el trabajador o admin tiene acceso a esta carpeta o a algún ancestro
            $stmt_asignadas = $pdo->prepare("SELECT carpeta_id FROM carpeta_usuarios WHERE usuario_id = ? AND puede_ver = 1");
            $stmt_asignadas->execute([$creado_por]);
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
        
        // Crear la tarea (asignado_a se mantiene para compatibilidad, pero será NULL si hay múltiples asignaciones)
        $asignado_a_legacy = !empty($asignados_a) && count($asignados_a) === 1 ? $asignados_a[0] : null;
        $sql = "INSERT INTO carpeta_tareas (carpeta_id, titulo, descripcion, creado_por, asignado_a, fecha_vencimiento, prioridad, recordatorio_en) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $carpeta_id, 
            $titulo, 
            $descripcion, 
            $creado_por, 
            $asignado_a_legacy, 
            $fecha_vencimiento, 
            $prioridad, 
            $recordatorio_en
        ]);
        
        $tarea_id = $pdo->lastInsertId();
        
        // Crear asignaciones múltiples
        if (!empty($asignados_a)) {
            $sqlAsignacion = "INSERT INTO carpeta_tarea_asignaciones (tarea_id, usuario_id) VALUES (?, ?)";
            $stmtAsignacion = $pdo->prepare($sqlAsignacion);
            foreach ($asignados_a as $usuario_asignado_id) {
                $usuario_asignado_id = intval($usuario_asignado_id);
                if ($usuario_asignado_id > 0) {
                    try {
                        $stmtAsignacion->execute([$tarea_id, $usuario_asignado_id]);
                    } catch (PDOException $e) {
                        // Ignorar errores de duplicados (ya asignado)
                    }
                }
            }
        }
        
        // Obtener la tarea creada con información completa
        $sqlTarea = "SELECT t.*, 
                            u_creador.nombre as creador_nombre,
                            u_creador.email as creador_email
                     FROM carpeta_tareas t
                     LEFT JOIN usuarios u_creador ON t.creado_por = u_creador.id
                     WHERE t.id = ?";
        $stmtTarea = $pdo->prepare($sqlTarea);
        $stmtTarea->execute([$tarea_id]);
        $tareaCreada = $stmtTarea->fetch(PDO::FETCH_ASSOC);
        $tareaCreada['comentarios'] = [];
        $tareaCreada['cantidad_comentarios'] = 0;
        
        // Obtener asignaciones múltiples
        $sqlAsignaciones = "SELECT ta.*, 
                                   u.nombre as usuario_nombre,
                                   u.email as usuario_email
                            FROM carpeta_tarea_asignaciones ta
                            LEFT JOIN usuarios u ON ta.usuario_id = u.id
                            WHERE ta.tarea_id = ? AND ta.activo = 1
                            ORDER BY ta.asignado_en ASC";
        $stmtAsignaciones = $pdo->prepare($sqlAsignaciones);
        $stmtAsignaciones->execute([$tarea_id]);
        $tareaCreada['asignados'] = $stmtAsignaciones->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'tarea' => $tareaCreada], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear tarea: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// PUT: Actualizar tarea
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $tarea_id = intval($data['id'] ?? 0);
    $titulo = isset($data['titulo']) ? trim($data['titulo']) : null;
    $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : null;
    $asignado_a = isset($data['asignado_a']) && $data['asignado_a'] ? intval($data['asignado_a']) : null;
    $fecha_vencimiento = isset($data['fecha_vencimiento']) && $data['fecha_vencimiento'] ? $data['fecha_vencimiento'] : null;
    $prioridad = isset($data['prioridad']) && in_array($data['prioridad'], ['baja', 'media', 'alta', 'urgente']) 
                 ? $data['prioridad'] : null;
    $estado = isset($data['estado']) && in_array($data['estado'], ['pendiente', 'en_progreso', 'completada', 'cancelada']) 
              ? $data['estado'] : null;
    $recordatorio_en = isset($data['recordatorio_en']) && $data['recordatorio_en'] ? $data['recordatorio_en'] : null;
    
    if (!$tarea_id) {
        http_response_code(400);
        echo json_encode(['error' => 'tarea_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        $campos = [];
        $valores = [];
        
        // Solo actualizar campos que se proporcionan
        if ($titulo !== null) {
            $campos[] = 'titulo = ?';
            $valores[] = $titulo;
        }
        
        if ($descripcion !== null) {
            $campos[] = 'descripcion = ?';
            $valores[] = $descripcion;
        }
        
        if ($asignado_a !== null) {
            $campos[] = 'asignado_a = ?';
            $valores[] = $asignado_a;
        }
        
        if ($fecha_vencimiento !== null) {
            $campos[] = 'fecha_vencimiento = ?';
            $valores[] = $fecha_vencimiento;
        }
        
        if ($prioridad !== null) {
            $campos[] = 'prioridad = ?';
            $valores[] = $prioridad;
        }
        
        if ($estado !== null) {
            $campos[] = 'estado = ?';
            $valores[] = $estado;
            
            if ($estado === 'completada') {
                $campos[] = 'completado_en = NOW()';
                // Si la tarea se marca como completada, verificar si necesita validación
                // Obtener información de la tarea para verificar si tiene creador diferente
                $sqlTarea = "SELECT creado_por FROM carpeta_tareas WHERE id = ?";
                $stmtTarea = $pdo->prepare($sqlTarea);
                $stmtTarea->execute([$tarea_id]);
                $tareaInfo = $stmtTarea->fetch(PDO::FETCH_ASSOC);
                
                // Si la tarea fue completada por alguien diferente al creador,
                // establecer estado de validación como pendiente
                if ($tareaInfo) {
                    $usuario_actual = isset($data['usuario_id']) ? intval($data['usuario_id']) : null;
                    if ($usuario_actual && $tareaInfo['creado_por'] != $usuario_actual) {
                        // Solo si el que completa no es el creador, requiere validación
                        $campos[] = 'estado_validacion = ?';
                        $valores[] = 'pendiente';
                    } else if ($usuario_actual && $tareaInfo['creado_por'] == $usuario_actual) {
                        // Si el creador completa su propia tarea, validar automáticamente
                        $campos[] = 'estado_validacion = ?';
                        $valores[] = 'validada';
                        $campos[] = 'validada_por = ?';
                        $valores[] = $usuario_actual;
                        $campos[] = 'validada_en = NOW()';
                    }
                }
            } else {
                $campos[] = 'completado_en = NULL';
                // Si se cambia de completada a otro estado, resetear validación
                if ($estado !== 'completada') {
                    $campos[] = 'estado_validacion = ?';
                    $valores[] = 'pendiente';
                    $campos[] = 'validada_por = NULL';
                    $campos[] = 'validada_en = NULL';
                    $campos[] = 'motivo_rechazo = NULL';
                }
            }
        }
        
        // Manejar validación/rechazo de tareas
        $estado_validacion = isset($data['estado_validacion']) ? $data['estado_validacion'] : null;
        $usuario_validador = isset($data['usuario_validador_id']) ? intval($data['usuario_validador_id']) : null;
        $motivo_rechazo = isset($data['motivo_rechazo']) ? trim($data['motivo_rechazo']) : null;
        
        if ($estado_validacion !== null && in_array($estado_validacion, ['pendiente', 'validada', 'rechazada'])) {
            // Verificar que el usuario es el creador de la tarea
            $sqlVerificar = "SELECT creado_por FROM carpeta_tareas WHERE id = ?";
            $stmtVerificar = $pdo->prepare($sqlVerificar);
            $stmtVerificar->execute([$tarea_id]);
            $tareaActual = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
            
            if ($tareaActual && $usuario_validador) {
                // Verificar rol del usuario
                $sqlUsuario = "SELECT rol FROM usuarios WHERE id = ?";
                $stmtUsuario = $pdo->prepare($sqlUsuario);
                $stmtUsuario->execute([$usuario_validador]);
                $usuario = $stmtUsuario->fetch();
                
                // Solo el creador o admin puede validar
                if ($tareaActual['creado_por'] == $usuario_validador || ($usuario && in_array($usuario['rol'], ['super_admin', 'admin']))) {
                    $campos[] = 'estado_validacion = ?';
                    $valores[] = $estado_validacion;
                    
                    if ($estado_validacion === 'validada') {
                        $campos[] = 'validada_por = ?';
                        $valores[] = $usuario_validador;
                        $campos[] = 'validada_en = NOW()';
                        $campos[] = 'motivo_rechazo = NULL';
                    } else if ($estado_validacion === 'rechazada') {
                        $campos[] = 'validada_por = ?';
                        $valores[] = $usuario_validador;
                        $campos[] = 'validada_en = NOW()';
                        if ($motivo_rechazo) {
                            $campos[] = 'motivo_rechazo = ?';
                            $valores[] = $motivo_rechazo;
                        } else {
                            $campos[] = 'motivo_rechazo = NULL';
                        }
                        // Si se rechaza, volver a estado "en_progreso"
                        $campos[] = 'estado = ?';
                        $valores[] = 'en_progreso';
                        $campos[] = 'completado_en = NULL';
                    } else {
                        // Pendiente: resetear validación
                        $campos[] = 'validada_por = NULL';
                        $campos[] = 'validada_en = NULL';
                        $campos[] = 'motivo_rechazo = NULL';
                    }
                } else {
                    http_response_code(403);
                    echo json_encode(['error' => 'Solo el creador de la tarea puede validarla'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }
        }
        
        if ($recordatorio_en !== null) {
            $campos[] = 'recordatorio_en = ?';
            $valores[] = $recordatorio_en;
        }
        
        if (empty($campos)) {
            http_response_code(400);
            echo json_encode(['error' => 'No se proporcionaron campos para actualizar'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $campos[] = 'actualizado_en = NOW()';
        $valores[] = $tarea_id;
        
        $sql = "UPDATE carpeta_tareas SET " . implode(', ', $campos) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($valores);
        
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar tarea: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE: Eliminar tarea (soft delete)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $tarea_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    
    if (!$tarea_id || !$usuario_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que el usuario es el creador o es admin
        $sqlVerificar = "SELECT creado_por FROM carpeta_tareas WHERE id = ?";
        $stmtVerificar = $pdo->prepare($sqlVerificar);
        $stmtVerificar->execute([$tarea_id]);
        $tareaActual = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
        
        if (!$tareaActual) {
            http_response_code(404);
            echo json_encode(['error' => 'Tarea no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar rol del usuario
        $sqlUsuario = "SELECT rol FROM usuarios WHERE id = ?";
        $stmtUsuario = $pdo->prepare($sqlUsuario);
        $stmtUsuario->execute([$usuario_id]);
        $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario || ($tareaActual['creado_por'] != $usuario_id && !in_array($usuario['rol'], ['super_admin', 'admin']))) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permiso para eliminar esta tarea'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $sql = "UPDATE carpeta_tareas SET activo = 0 WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tarea_id]);
        
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar tarea: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
