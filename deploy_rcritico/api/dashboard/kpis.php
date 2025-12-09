<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// GET: Obtener KPIs del proyecto
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $proyecto_id = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    
    if (!$proyecto_id) {
        http_response_code(400);
        echo json_encode(['error' => 'proyecto_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Inicializar array de KPIs con valores por defecto
        $kpis = [
            'total_carpetas' => 0,
            'carpetas_activas' => 0,
            'total_archivos' => 0,
            'archivos_recientes' => 0,
            'total_tareas' => 0,
            'tareas_pendientes' => 0,
            'tareas_en_progreso' => 0,
            'tareas_completadas' => 0,
            'tareas_canceladas' => 0,
            'tareas_activas' => 0,
            'tareas_vencidas' => 0,
            'tareas_proximas_vencer' => 0,
            'tareas_validadas' => 0,
            'tareas_urgentes' => 0,
            'tareas_alta' => 0,
            'tareas_media' => 0,
            'tareas_baja' => 0,
            'total_mensajes' => 0,
            'mensajes_recientes' => 0,
            'comentarios_tareas' => 0,
            'adjuntos_tareas' => 0,
            'total_usuarios' => 0,
            'usuarios_activos' => 0
        ];
        
        // Obtener rol del usuario si se proporciona
        $usuario_rol = null;
        if ($usuario_id) {
            try {
                $stmt_rol = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
                $stmt_rol->execute([$usuario_id]);
                $usuario_data = $stmt_rol->fetch();
                if ($usuario_data) {
                    $usuario_rol = $usuario_data['rol'];
                }
            } catch (PDOException $e) {
                error_log('Error obteniendo rol de usuario: ' . $e->getMessage());
            }
        }
        
        // 1. Total de Carpetas
        if ($usuario_rol === 'trabajador' && $usuario_id) {
            $sql_carpetas = "SELECT COUNT(DISTINCT c.id) as total,
                                    SUM(CASE WHEN c.activo = 1 THEN 1 ELSE 0 END) as activas
                             FROM carpetas c
                             INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                             WHERE c.proyecto_id = ? AND cu.usuario_id = ? AND cu.puede_ver = 1";
            $stmt_carpetas = $pdo->prepare($sql_carpetas);
            $stmt_carpetas->execute([$proyecto_id, $usuario_id]);
        } else {
            $sql_carpetas = "SELECT COUNT(*) as total,
                                    SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activas
                             FROM carpetas
                             WHERE proyecto_id = ?";
            $stmt_carpetas = $pdo->prepare($sql_carpetas);
            $stmt_carpetas->execute([$proyecto_id]);
        }
        $carpetas_data = $stmt_carpetas->fetch();
        $kpis['total_carpetas'] = intval($carpetas_data['total'] ?? 0);
        $kpis['carpetas_activas'] = intval($carpetas_data['activas'] ?? 0) ?: 0;
        
        // 2. Total de Archivos
        if ($usuario_rol === 'trabajador' && $usuario_id) {
            $sql_archivos = "SELECT COUNT(DISTINCT a.id) as total,
                                    SUM(CASE WHEN a.subido_en >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recientes
                             FROM archivos a
                             INNER JOIN carpetas c ON a.carpeta_id = c.id
                             INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                             WHERE c.proyecto_id = ? AND a.activo = 1 AND cu.usuario_id = ? AND cu.puede_ver = 1";
            $stmt_archivos = $pdo->prepare($sql_archivos);
            $stmt_archivos->execute([$proyecto_id, $usuario_id]);
        } else {
            $sql_archivos = "SELECT COUNT(*) as total,
                                    SUM(CASE WHEN a.subido_en >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recientes
                             FROM archivos a
                             INNER JOIN carpetas c ON a.carpeta_id = c.id
                             WHERE c.proyecto_id = ? AND a.activo = 1";
            $stmt_archivos = $pdo->prepare($sql_archivos);
            $stmt_archivos->execute([$proyecto_id]);
        }
        $archivos_data = $stmt_archivos->fetch();
        $kpis['total_archivos'] = intval($archivos_data['total'] ?? 0);
        $kpis['archivos_recientes'] = intval($archivos_data['recientes'] ?? 0) ?: 0;
        
        // 3. Tareas
        if ($usuario_rol === 'trabajador' && $usuario_id) {
            $sql_tareas = "SELECT 
                                COUNT(*) as total,
                                SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                                SUM(CASE WHEN t.estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
                                SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
                                SUM(CASE WHEN t.estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
                                SUM(CASE WHEN t.estado IN ('pendiente', 'en_progreso') THEN 1 ELSE 0 END) as activas,
                                SUM(CASE WHEN t.fecha_vencimiento < CURDATE() AND t.estado IN ('pendiente', 'en_progreso') THEN 1 ELSE 0 END) as vencidas,
                                SUM(CASE WHEN t.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND t.estado IN ('pendiente', 'en_progreso') THEN 1 ELSE 0 END) as proximas_vencer,
                                SUM(CASE WHEN COALESCE(t.estado_validacion, '') = 'validada' THEN 1 ELSE 0 END) as validadas,
                                SUM(CASE WHEN t.prioridad = 'urgente' THEN 1 ELSE 0 END) as urgentes,
                                SUM(CASE WHEN t.prioridad = 'alta' THEN 1 ELSE 0 END) as alta,
                                SUM(CASE WHEN t.prioridad = 'media' THEN 1 ELSE 0 END) as media,
                                SUM(CASE WHEN t.prioridad = 'baja' THEN 1 ELSE 0 END) as baja
                           FROM carpeta_tareas t
                           INNER JOIN carpetas c ON t.carpeta_id = c.id
                           INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                           WHERE c.proyecto_id = ? AND t.activo = 1 
                           AND cu.usuario_id = ? AND cu.puede_ver = 1
                           AND (t.creado_por = ? OR EXISTS (
                               SELECT 1 FROM carpeta_tarea_asignaciones ta 
                               WHERE ta.tarea_id = t.id 
                               AND ta.usuario_id = ? 
                               AND ta.activo = 1
                           ))";
            $stmt_tareas = $pdo->prepare($sql_tareas);
            $stmt_tareas->execute([$proyecto_id, $usuario_id, $usuario_id, $usuario_id]);
        } else {
            $sql_tareas = "SELECT 
                                COUNT(*) as total,
                                SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                                SUM(CASE WHEN t.estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
                                SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
                                SUM(CASE WHEN t.estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
                                SUM(CASE WHEN t.estado IN ('pendiente', 'en_progreso') THEN 1 ELSE 0 END) as activas,
                                SUM(CASE WHEN t.fecha_vencimiento < CURDATE() AND t.estado IN ('pendiente', 'en_progreso') THEN 1 ELSE 0 END) as vencidas,
                                SUM(CASE WHEN t.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND t.estado IN ('pendiente', 'en_progreso') THEN 1 ELSE 0 END) as proximas_vencer,
                                SUM(CASE WHEN COALESCE(t.estado_validacion, '') = 'validada' THEN 1 ELSE 0 END) as validadas,
                                SUM(CASE WHEN t.prioridad = 'urgente' THEN 1 ELSE 0 END) as urgentes,
                                SUM(CASE WHEN t.prioridad = 'alta' THEN 1 ELSE 0 END) as alta,
                                SUM(CASE WHEN t.prioridad = 'media' THEN 1 ELSE 0 END) as media,
                                SUM(CASE WHEN t.prioridad = 'baja' THEN 1 ELSE 0 END) as baja
                           FROM carpeta_tareas t
                           INNER JOIN carpetas c ON t.carpeta_id = c.id
                           WHERE c.proyecto_id = ? AND t.activo = 1";
            $stmt_tareas = $pdo->prepare($sql_tareas);
            $stmt_tareas->execute([$proyecto_id]);
        }
        $tareas_data = $stmt_tareas->fetch();
        $kpis['total_tareas'] = intval($tareas_data['total'] ?? 0) ?: 0;
        $kpis['tareas_pendientes'] = intval($tareas_data['pendientes'] ?? 0) ?: 0;
        $kpis['tareas_en_progreso'] = intval($tareas_data['en_progreso'] ?? 0) ?: 0;
        $kpis['tareas_completadas'] = intval($tareas_data['completadas'] ?? 0) ?: 0;
        $kpis['tareas_canceladas'] = intval($tareas_data['canceladas'] ?? 0) ?: 0;
        $kpis['tareas_activas'] = intval($tareas_data['activas'] ?? 0) ?: 0;
        $kpis['tareas_vencidas'] = intval($tareas_data['vencidas'] ?? 0) ?: 0;
        $kpis['tareas_proximas_vencer'] = intval($tareas_data['proximas_vencer'] ?? 0) ?: 0;
        $kpis['tareas_validadas'] = intval($tareas_data['validadas'] ?? 0) ?: 0;
        $kpis['tareas_urgentes'] = intval($tareas_data['urgentes'] ?? 0) ?: 0;
        $kpis['tareas_alta'] = intval($tareas_data['alta'] ?? 0) ?: 0;
        $kpis['tareas_media'] = intval($tareas_data['media'] ?? 0) ?: 0;
        $kpis['tareas_baja'] = intval($tareas_data['baja'] ?? 0) ?: 0;
        
        // 4. Mensajes del Foro
        if ($usuario_rol === 'trabajador' && $usuario_id) {
            $sql_mensajes = "SELECT COUNT(*) as total,
                                    SUM(CASE WHEN m.creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recientes
                             FROM carpeta_mensajes m
                             INNER JOIN carpetas c ON m.carpeta_id = c.id
                             INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                             WHERE c.proyecto_id = ? AND m.activo = 1 AND cu.usuario_id = ? AND cu.puede_ver = 1";
            $stmt_mensajes = $pdo->prepare($sql_mensajes);
            $stmt_mensajes->execute([$proyecto_id, $usuario_id]);
        } else {
            $sql_mensajes = "SELECT COUNT(*) as total,
                                    SUM(CASE WHEN m.creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recientes
                             FROM carpeta_mensajes m
                             INNER JOIN carpetas c ON m.carpeta_id = c.id
                             WHERE c.proyecto_id = ? AND m.activo = 1";
            $stmt_mensajes = $pdo->prepare($sql_mensajes);
            $stmt_mensajes->execute([$proyecto_id]);
        }
        $mensajes_data = $stmt_mensajes->fetch();
        $kpis['total_mensajes'] = intval($mensajes_data['total'] ?? 0) ?: 0;
        $kpis['mensajes_recientes'] = intval($mensajes_data['recientes'] ?? 0) ?: 0;
        
        // 5. Comentarios y Adjuntos de Tareas
        if ($usuario_rol === 'trabajador' && $usuario_id) {
            $sql_comentarios = "SELECT COUNT(*) as total
                               FROM carpeta_tarea_comentarios c
                               INNER JOIN carpeta_tareas t ON c.tarea_id = t.id
                               INNER JOIN carpetas ca ON t.carpeta_id = ca.id
                               INNER JOIN carpeta_usuarios cu ON ca.id = cu.carpeta_id
                               WHERE ca.proyecto_id = ? AND c.activo = 1 
                               AND cu.usuario_id = ? AND cu.puede_ver = 1";
            $stmt_comentarios = $pdo->prepare($sql_comentarios);
            $stmt_comentarios->execute([$proyecto_id, $usuario_id]);
            
            $sql_adjuntos = "SELECT COUNT(*) as total
                            FROM carpeta_tarea_adjuntos a
                            INNER JOIN carpeta_tareas t ON a.tarea_id = t.id
                            INNER JOIN carpetas ca ON t.carpeta_id = ca.id
                            INNER JOIN carpeta_usuarios cu ON ca.id = cu.carpeta_id
                            WHERE ca.proyecto_id = ? AND a.activo = 1 
                            AND cu.usuario_id = ? AND cu.puede_ver = 1";
            $stmt_adjuntos = $pdo->prepare($sql_adjuntos);
            $stmt_adjuntos->execute([$proyecto_id, $usuario_id]);
        } else {
            $sql_comentarios = "SELECT COUNT(*) as total
                               FROM carpeta_tarea_comentarios c
                               INNER JOIN carpeta_tareas t ON c.tarea_id = t.id
                               INNER JOIN carpetas ca ON t.carpeta_id = ca.id
                               WHERE ca.proyecto_id = ? AND c.activo = 1";
            $stmt_comentarios = $pdo->prepare($sql_comentarios);
            $stmt_comentarios->execute([$proyecto_id]);
            
            $sql_adjuntos = "SELECT COUNT(*) as total
                            FROM carpeta_tarea_adjuntos a
                            INNER JOIN carpeta_tareas t ON a.tarea_id = t.id
                            INNER JOIN carpetas ca ON t.carpeta_id = ca.id
                            WHERE ca.proyecto_id = ? AND a.activo = 1";
            $stmt_adjuntos = $pdo->prepare($sql_adjuntos);
            $stmt_adjuntos->execute([$proyecto_id]);
        }
        $comentarios_data = $stmt_comentarios->fetch();
        $adjuntos_data = $stmt_adjuntos->fetch();
        $kpis['comentarios_tareas'] = intval($comentarios_data['total'] ?? 0) ?: 0;
        $kpis['adjuntos_tareas'] = intval($adjuntos_data['total'] ?? 0) ?: 0;
        
        // 6. Usuarios (contar usuarios que tienen acceso a carpetas del proyecto)
        if ($usuario_rol === 'trabajador' && $usuario_id) {
            // Para trabajadores, solo contar usuarios que comparten carpetas con ellos
            $sql_usuarios = "SELECT COUNT(DISTINCT cu2.usuario_id) as total,
                                    COUNT(DISTINCT CASE WHEN u.aprobado = 1 THEN cu2.usuario_id END) as activos
                             FROM carpeta_usuarios cu1
                             INNER JOIN carpetas c1 ON cu1.carpeta_id = c1.id
                             INNER JOIN carpeta_usuarios cu2 ON c1.id = cu2.carpeta_id
                             INNER JOIN usuarios u ON cu2.usuario_id = u.id
                             WHERE c1.proyecto_id = ? AND cu1.usuario_id = ?";
            $stmt_usuarios = $pdo->prepare($sql_usuarios);
            $stmt_usuarios->execute([$proyecto_id, $usuario_id]);
        } else {
            // Para admins, contar usuarios únicos que tienen acceso a carpetas del proyecto
            $sql_usuarios = "SELECT COUNT(DISTINCT cu.usuario_id) as total,
                                    COUNT(DISTINCT CASE WHEN u.aprobado = 1 THEN cu.usuario_id END) as activos
                             FROM carpeta_usuarios cu
                             INNER JOIN carpetas c ON cu.carpeta_id = c.id
                             INNER JOIN usuarios u ON cu.usuario_id = u.id
                             WHERE c.proyecto_id = ?";
            $stmt_usuarios = $pdo->prepare($sql_usuarios);
            $stmt_usuarios->execute([$proyecto_id]);
        }
        $usuarios_data = $stmt_usuarios->fetch();
        $kpis['total_usuarios'] = intval($usuarios_data['total'] ?? 0) ?: 0;
        $kpis['usuarios_activos'] = intval($usuarios_data['activos'] ?? 0) ?: 0;
        
        echo json_encode($kpis, JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        error_log('Error en kpis.php: ' . $e->getMessage());
        error_log('Trace: ' . $e->getTraceAsString());
        echo json_encode([
            'error' => 'Error al obtener KPIs: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Error general en kpis.php: ' . $e->getMessage());
        echo json_encode([
            'error' => 'Error al obtener KPIs: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>

