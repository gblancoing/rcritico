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
        
        // 7. Avance Global por Empresa
        // Usar el mismo cálculo que "AVANCE GENERAL": promedio de los promedios de las carpetas de nivel 1
        // Esto es consistente con el cálculo mostrado en "AVANCE GENERAL: 26.33%"
        
        // Obtener carpetas de nivel 1 (RCs) - misma lógica que carpetas_con_promedios.php
        if ($usuario_rol === 'trabajador' && $usuario_id) {
            $sql_carpetas_nivel1 = "SELECT DISTINCT c.*
                                    FROM carpetas c
                                    INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                                    WHERE c.proyecto_id = ? 
                                    AND c.carpeta_padre_id IS NULL
                                    AND c.activo = 1
                                    AND cu.usuario_id = ? 
                                    AND cu.puede_ver = 1
                                    ORDER BY c.nombre";
            $stmt_carpetas_nivel1 = $pdo->prepare($sql_carpetas_nivel1);
            $stmt_carpetas_nivel1->execute([$proyecto_id, $usuario_id]);
        } else {
            $sql_carpetas_nivel1 = "SELECT c.*
                                    FROM carpetas c
                                    WHERE c.proyecto_id = ? 
                                    AND c.carpeta_padre_id IS NULL
                                    AND c.activo = 1
                                    ORDER BY c.nombre";
            $stmt_carpetas_nivel1 = $pdo->prepare($sql_carpetas_nivel1);
            $stmt_carpetas_nivel1->execute([$proyecto_id]);
        }
        $carpetas_nivel1 = $stmt_carpetas_nivel1->fetchAll(PDO::FETCH_ASSOC);
        
        $suma_promedios_nivel1 = 0;
        $contador_promedios_nivel1 = 0;
        $avance_empresas_data = [];
        $empresas_unicas = [];
        
        foreach ($carpetas_nivel1 as $carpeta_nivel1) {
            // Obtener subcarpetas de nivel 2 (empresas)
            if ($usuario_rol === 'trabajador' && $usuario_id) {
                $sql_subcarpetas = "SELECT DISTINCT c.*
                                    FROM carpetas c
                                    INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                                    WHERE c.carpeta_padre_id = ?
                                    AND c.activo = 1
                                    AND cu.usuario_id = ?
                                    AND cu.puede_ver = 1
                                    ORDER BY c.nombre";
                $stmt_subcarpetas = $pdo->prepare($sql_subcarpetas);
                $stmt_subcarpetas->execute([$carpeta_nivel1['id'], $usuario_id]);
            } else {
                $sql_subcarpetas = "SELECT c.*
                                    FROM carpetas c
                                    WHERE c.carpeta_padre_id = ?
                                    AND c.activo = 1
                                    ORDER BY c.nombre";
                $stmt_subcarpetas = $pdo->prepare($sql_subcarpetas);
                $stmt_subcarpetas->execute([$carpeta_nivel1['id']]);
            }
            $subcarpetas = $stmt_subcarpetas->fetchAll(PDO::FETCH_ASSOC);
            
            $suma_promedios_empresas = 0;
            $contador_empresas = 0;
            
            foreach ($subcarpetas as $subcarpeta) {
                // Calcular promedio de la empresa (solo su carpeta, sin subcarpetas) - igual que carpetas_con_promedios.php
                $carpetas_ids_empresa = [$subcarpeta['id']];
                $placeholders_empresa = '?';
                
                $sql_preventivos_emp = "SELECT 
                                           AVG(COALESCE(ponderacion, 0)) as promedio, 
                                           COUNT(*) as total,
                                           SUM(COALESCE(ponderacion, 0)) as suma_total
                                       FROM carpeta_linea_base
                                       WHERE carpeta_id = ?
                                       AND activo = 1";
                $stmt_preventivos_emp = $pdo->prepare($sql_preventivos_emp);
                $stmt_preventivos_emp->execute([$subcarpeta['id']]);
                $resultado_preventivos_emp = $stmt_preventivos_emp->fetch(PDO::FETCH_ASSOC);
                
                $sql_mitigadores_emp = "SELECT 
                                           AVG(COALESCE(ponderacion, 0)) as promedio, 
                                           COUNT(*) as total,
                                           SUM(COALESCE(ponderacion, 0)) as suma_total
                                        FROM carpeta_linea_base_mitigadores
                                        WHERE carpeta_id = ?
                                        AND activo = 1";
                $stmt_mitigadores_emp = $pdo->prepare($sql_mitigadores_emp);
                $stmt_mitigadores_emp->execute([$subcarpeta['id']]);
                $resultado_mitigadores_emp = $stmt_mitigadores_emp->fetch(PDO::FETCH_ASSOC);
                
                $total_preventivos_emp = intval($resultado_preventivos_emp['total'] ?? 0);
                $total_mitigadores_emp = intval($resultado_mitigadores_emp['total'] ?? 0);
                $total_registros_emp = $total_preventivos_emp + $total_mitigadores_emp;
                
                $promedio_empresa = 0;
                if ($total_registros_emp > 0) {
                    $suma_preventivos_emp = floatval($resultado_preventivos_emp['suma_total'] ?? 0);
                    $suma_mitigadores_emp = floatval($resultado_mitigadores_emp['suma_total'] ?? 0);
                    $suma_total_emp = $suma_preventivos_emp + $suma_mitigadores_emp;
                    $promedio_empresa = round($suma_total_emp / $total_registros_emp, 2);
                }
                
                // Agrupar empresas por nombre
                $nombre_empresa = trim($subcarpeta['nombre']);
                if (!isset($empresas_unicas[$nombre_empresa])) {
                    $empresas_unicas[$nombre_empresa] = [
                        'carpeta_id' => $subcarpeta['id'],
                        'empresa' => $nombre_empresa,
                        'avance_promedio' => $promedio_empresa,
                        'total_controles' => $total_registros_emp,
                        'carpetas_ids' => [$subcarpeta['id']],
                        'rcs' => [[
                            'rc_id' => $carpeta_nivel1['id'],
                            'rc_nombre' => $carpeta_nivel1['nombre'],
                            'avance_promedio' => 0, // Se calculará después
                            'total_controles' => 0
                        ]]
                    ];
                } else {
                    // Consolidar empresa duplicada
                    $empresas_unicas[$nombre_empresa]['carpetas_ids'][] = $subcarpeta['id'];
                    $empresas_unicas[$nombre_empresa]['total_controles'] += $total_registros_emp;
                    // Recalcular promedio consolidado
                    $carpetas_ids_consolidado = $empresas_unicas[$nombre_empresa]['carpetas_ids'];
                    $placeholders_consolidado = implode(',', array_fill(0, count($carpetas_ids_consolidado), '?'));
                    
                    $sql_preventivos_cons = "SELECT 
                                               AVG(COALESCE(ponderacion, 0)) as promedio, 
                                               COUNT(*) as total,
                                               SUM(COALESCE(ponderacion, 0)) as suma_total
                                           FROM carpeta_linea_base
                                           WHERE carpeta_id IN ($placeholders_consolidado)
                                           AND activo = 1";
                    $stmt_preventivos_cons = $pdo->prepare($sql_preventivos_cons);
                    $stmt_preventivos_cons->execute($carpetas_ids_consolidado);
                    $resultado_preventivos_cons = $stmt_preventivos_cons->fetch(PDO::FETCH_ASSOC);
                    
                    $sql_mitigadores_cons = "SELECT 
                                               AVG(COALESCE(ponderacion, 0)) as promedio, 
                                               COUNT(*) as total,
                                               SUM(COALESCE(ponderacion, 0)) as suma_total
                                            FROM carpeta_linea_base_mitigadores
                                            WHERE carpeta_id IN ($placeholders_consolidado)
                                            AND activo = 1";
                    $stmt_mitigadores_cons = $pdo->prepare($sql_mitigadores_cons);
                    $stmt_mitigadores_cons->execute($carpetas_ids_consolidado);
                    $resultado_mitigadores_cons = $stmt_mitigadores_cons->fetch(PDO::FETCH_ASSOC);
                    
                    $total_preventivos_cons = intval($resultado_preventivos_cons['total'] ?? 0);
                    $total_mitigadores_cons = intval($resultado_mitigadores_cons['total'] ?? 0);
                    $total_registros_cons = $total_preventivos_cons + $total_mitigadores_cons;
                    
                    if ($total_registros_cons > 0) {
                        $suma_preventivos_cons = floatval($resultado_preventivos_cons['suma_total'] ?? 0);
                        $suma_mitigadores_cons = floatval($resultado_mitigadores_cons['suma_total'] ?? 0);
                        $suma_total_cons = $suma_preventivos_cons + $suma_mitigadores_cons;
                        $empresas_unicas[$nombre_empresa]['avance_promedio'] = round($suma_total_cons / $total_registros_cons, 2);
                    }
                    
                    // Agregar RC si no existe
                    $rc_existe = false;
                    foreach ($empresas_unicas[$nombre_empresa]['rcs'] as &$rc_existente) {
                        if ($rc_existente['rc_id'] == $carpeta_nivel1['id']) {
                            $rc_existe = true;
                            break;
                        }
                    }
                    if (!$rc_existe) {
                        $empresas_unicas[$nombre_empresa]['rcs'][] = [
                            'rc_id' => $carpeta_nivel1['id'],
                            'rc_nombre' => $carpeta_nivel1['nombre'],
                            'avance_promedio' => 0,
                            'total_controles' => 0
                        ];
                    }
                }
                
                $suma_promedios_empresas += $promedio_empresa;
                $contador_empresas++;
            }
            
            // Calcular promedio de nivel 1: promedio de los promedios de sus empresas (igual que carpetas_con_promedios.php)
            $promedio_nivel1 = null;
            if ($contador_empresas > 0) {
                $promedio_nivel1 = round($suma_promedios_empresas / $contador_empresas, 2);
            }
            // Si no tiene empresas, el promedio será null (no se incluye en el cálculo global)
            
            // Acumular para el promedio global (igual que AVANCE GENERAL)
            if ($promedio_nivel1 !== null) {
                $suma_promedios_nivel1 += $promedio_nivel1;
                $contador_promedios_nivel1++;
            }
        }
        
        // Obtener RCs para cada empresa
        foreach ($empresas_unicas as &$empresa) {
            if (empty($empresa['carpetas_ids'])) {
                $empresa['rcs'] = [];
                continue;
            }
            
            // Calcular avance de cada RC para esta empresa
            foreach ($empresa['rcs'] as &$rc) {
                $placeholders = implode(',', array_fill(0, count($empresa['carpetas_ids']), '?'));
                
                $sql_rc_avance = "SELECT 
                                     AVG(COALESCE(lb.ponderacion, 0)) as avance_promedio,
                                     COUNT(lb.id) as total_controles
                                  FROM carpetas c
                                  INNER JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
                                  WHERE c.id IN ($placeholders)
                                  AND c.carpeta_padre_id = ?
                                  AND c.activo = 1";
                $params_rc = array_merge($empresa['carpetas_ids'], [$rc['rc_id']]);
                $stmt_rc_avance = $pdo->prepare($sql_rc_avance);
                $stmt_rc_avance->execute($params_rc);
                $rc_avance = $stmt_rc_avance->fetch(PDO::FETCH_ASSOC);
                
                $rc['avance_promedio'] = floatval($rc_avance['avance_promedio'] ?? 0);
                $rc['total_controles'] = intval($rc_avance['total_controles'] ?? 0);
            }
            unset($rc);
        }
        unset($empresa);
        
        $avance_empresas_data = array_values($empresas_unicas);
        
        // Obtener carpetas de nivel 1 (RCs)
        if ($usuario_rol === 'trabajador' && $usuario_id) {
            $sql_carpetas_nivel1 = "SELECT DISTINCT c.*
                                    FROM carpetas c
                                    INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                                    WHERE c.proyecto_id = ? 
                                    AND c.carpeta_padre_id IS NULL
                                    AND c.activo = 1
                                    AND cu.usuario_id = ? 
                                    AND cu.puede_ver = 1
                                    ORDER BY c.nombre";
            $stmt_carpetas_nivel1 = $pdo->prepare($sql_carpetas_nivel1);
            $stmt_carpetas_nivel1->execute([$proyecto_id, $usuario_id]);
        } else {
            $sql_carpetas_nivel1 = "SELECT c.*
                                    FROM carpetas c
                                    WHERE c.proyecto_id = ? 
                                    AND c.carpeta_padre_id IS NULL
                                    AND c.activo = 1
                                    ORDER BY c.nombre";
            $stmt_carpetas_nivel1 = $pdo->prepare($sql_carpetas_nivel1);
            $stmt_carpetas_nivel1->execute([$proyecto_id]);
        }
        $carpetas_nivel1 = $stmt_carpetas_nivel1->fetchAll(PDO::FETCH_ASSOC);
        
        // Función para calcular promedio de una carpeta (igual que en carpetas_con_promedios.php)
        function calcularPromedioCarpeta($pdo, $carpeta_id) {
            // Obtener todas las carpetas a incluir (la carpeta y sus subcarpetas recursivas)
            $carpetas_ids = [$carpeta_id];
            $stmt_sub = $pdo->prepare("SELECT id FROM carpetas WHERE carpeta_padre_id = ? AND activo = 1");
            $stmt_sub->execute([$carpeta_id]);
            $subcarpetas = $stmt_sub->fetchAll(PDO::FETCH_ASSOC);
            foreach ($subcarpetas as $sub) {
                $carpetas_ids[] = $sub['id'];
                // Recursivamente obtener subcarpetas
                $stmt_sub2 = $pdo->prepare("SELECT id FROM carpetas WHERE carpeta_padre_id = ? AND activo = 1");
                $stmt_sub2->execute([$sub['id']]);
                $sub2 = $stmt_sub2->fetchAll(PDO::FETCH_ASSOC);
                foreach ($sub2 as $s) {
                    $carpetas_ids[] = $s['id'];
                }
            }
            $carpetas_ids = array_unique($carpetas_ids);
            
            if (empty($carpetas_ids)) {
                return null;
            }
            
            $placeholders = implode(',', array_fill(0, count($carpetas_ids), '?'));
            
            // Calcular promedio de preventivos
            $sql_preventivos = "SELECT 
                                   AVG(COALESCE(ponderacion, 0)) as promedio, 
                                   COUNT(*) as total,
                                   SUM(COALESCE(ponderacion, 0)) as suma_total
                               FROM carpeta_linea_base
                               WHERE carpeta_id IN ($placeholders)
                               AND activo = 1";
            $stmt_preventivos = $pdo->prepare($sql_preventivos);
            $stmt_preventivos->execute($carpetas_ids);
            $resultado_preventivos = $stmt_preventivos->fetch(PDO::FETCH_ASSOC);
            
            // Calcular promedio de mitigadores
            $sql_mitigadores = "SELECT 
                                   AVG(COALESCE(ponderacion, 0)) as promedio, 
                                   COUNT(*) as total,
                                   SUM(COALESCE(ponderacion, 0)) as suma_total
                                FROM carpeta_linea_base_mitigadores
                                WHERE carpeta_id IN ($placeholders)
                                AND activo = 1";
            $stmt_mitigadores = $pdo->prepare($sql_mitigadores);
            $stmt_mitigadores->execute($carpetas_ids);
            $resultado_mitigadores = $stmt_mitigadores->fetch(PDO::FETCH_ASSOC);
            
            $total_preventivos = intval($resultado_preventivos['total'] ?? 0);
            $total_mitigadores = intval($resultado_mitigadores['total'] ?? 0);
            $total_registros = $total_preventivos + $total_mitigadores;
            
            if ($total_registros === 0) {
                return 0;
            }
            
            $suma_preventivos = floatval($resultado_preventivos['suma_total'] ?? 0);
            $suma_mitigadores = floatval($resultado_mitigadores['suma_total'] ?? 0);
            $suma_total = $suma_preventivos + $suma_mitigadores;
            
            return round($suma_total / $total_registros, 2);
        }
        
        // Calcular promedio de cada carpeta nivel 1 y obtener sus empresas (nivel 2)
        $suma_promedios_nivel1 = 0;
        $contador_promedios_nivel1 = 0;
        $avance_empresas_data = [];
        $empresas_unicas = [];
        
        foreach ($carpetas_nivel1 as $carpeta_nivel1) {
            // Obtener subcarpetas de nivel 2 (empresas)
            if ($usuario_rol === 'trabajador' && $usuario_id) {
                $sql_subcarpetas = "SELECT DISTINCT c.*
                                    FROM carpetas c
                                    INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                                    WHERE c.carpeta_padre_id = ?
                                    AND c.activo = 1
                                    AND cu.usuario_id = ?
                                    AND cu.puede_ver = 1
                                    ORDER BY c.nombre";
                $stmt_subcarpetas = $pdo->prepare($sql_subcarpetas);
                $stmt_subcarpetas->execute([$carpeta_nivel1['id'], $usuario_id]);
            } else {
                $sql_subcarpetas = "SELECT c.*
                                    FROM carpetas c
                                    WHERE c.carpeta_padre_id = ?
                                    AND c.activo = 1
                                    ORDER BY c.nombre";
                $stmt_subcarpetas = $pdo->prepare($sql_subcarpetas);
                $stmt_subcarpetas->execute([$carpeta_nivel1['id']]);
            }
            $subcarpetas = $stmt_subcarpetas->fetchAll(PDO::FETCH_ASSOC);
            
            $suma_promedios_empresas = 0;
            $contador_empresas = 0;
            
            foreach ($subcarpetas as $subcarpeta) {
                // Calcular promedio de la empresa (solo su carpeta, sin subcarpetas)
                $carpetas_ids_empresa = [$subcarpeta['id']];
                $placeholders_empresa = '?';
                
                $sql_preventivos_emp = "SELECT 
                                           AVG(COALESCE(ponderacion, 0)) as promedio, 
                                           COUNT(*) as total,
                                           SUM(COALESCE(ponderacion, 0)) as suma_total
                                       FROM carpeta_linea_base
                                       WHERE carpeta_id = ?
                                       AND activo = 1";
                $stmt_preventivos_emp = $pdo->prepare($sql_preventivos_emp);
                $stmt_preventivos_emp->execute([$subcarpeta['id']]);
                $resultado_preventivos_emp = $stmt_preventivos_emp->fetch(PDO::FETCH_ASSOC);
                
                $sql_mitigadores_emp = "SELECT 
                                           AVG(COALESCE(ponderacion, 0)) as promedio, 
                                           COUNT(*) as total,
                                           SUM(COALESCE(ponderacion, 0)) as suma_total
                                        FROM carpeta_linea_base_mitigadores
                                        WHERE carpeta_id = ?
                                        AND activo = 1";
                $stmt_mitigadores_emp = $pdo->prepare($sql_mitigadores_emp);
                $stmt_mitigadores_emp->execute([$subcarpeta['id']]);
                $resultado_mitigadores_emp = $stmt_mitigadores_emp->fetch(PDO::FETCH_ASSOC);
                
                $total_preventivos_emp = intval($resultado_preventivos_emp['total'] ?? 0);
                $total_mitigadores_emp = intval($resultado_mitigadores_emp['total'] ?? 0);
                $total_registros_emp = $total_preventivos_emp + $total_mitigadores_emp;
                
                $promedio_empresa = 0;
                if ($total_registros_emp > 0) {
                    $suma_preventivos_emp = floatval($resultado_preventivos_emp['suma_total'] ?? 0);
                    $suma_mitigadores_emp = floatval($resultado_mitigadores_emp['suma_total'] ?? 0);
                    $suma_total_emp = $suma_preventivos_emp + $suma_mitigadores_emp;
                    $promedio_empresa = round($suma_total_emp / $total_registros_emp, 2);
                }
                
                // Agrupar empresas por nombre
                $nombre_empresa = trim($subcarpeta['nombre']);
                if (!isset($empresas_unicas[$nombre_empresa])) {
                    $empresas_unicas[$nombre_empresa] = [
                        'carpeta_id' => $subcarpeta['id'],
                        'empresa' => $nombre_empresa,
                        'avance_promedio' => $promedio_empresa,
                        'total_controles' => $total_registros_emp,
                        'carpetas_ids' => [$subcarpeta['id']],
                        'rcs' => []
                    ];
                } else {
                    // Si ya existe, consolidar
                    $empresas_unicas[$nombre_empresa]['carpetas_ids'][] = $subcarpeta['id'];
                    $empresas_unicas[$nombre_empresa]['total_controles'] += $total_registros_emp;
                    // Recalcular promedio consolidado
                    $carpetas_ids_consolidado = $empresas_unicas[$nombre_empresa]['carpetas_ids'];
                    $placeholders_consolidado = implode(',', array_fill(0, count($carpetas_ids_consolidado), '?'));
                    
                    $sql_preventivos_cons = "SELECT 
                                               AVG(COALESCE(ponderacion, 0)) as promedio, 
                                               COUNT(*) as total,
                                               SUM(COALESCE(ponderacion, 0)) as suma_total
                                           FROM carpeta_linea_base
                                           WHERE carpeta_id IN ($placeholders_consolidado)
                                           AND activo = 1";
                    $stmt_preventivos_cons = $pdo->prepare($sql_preventivos_cons);
                    $stmt_preventivos_cons->execute($carpetas_ids_consolidado);
                    $resultado_preventivos_cons = $stmt_preventivos_cons->fetch(PDO::FETCH_ASSOC);
                    
                    $sql_mitigadores_cons = "SELECT 
                                               AVG(COALESCE(ponderacion, 0)) as promedio, 
                                               COUNT(*) as total,
                                               SUM(COALESCE(ponderacion, 0)) as suma_total
                                            FROM carpeta_linea_base_mitigadores
                                            WHERE carpeta_id IN ($placeholders_consolidado)
                                            AND activo = 1";
                    $stmt_mitigadores_cons = $pdo->prepare($sql_mitigadores_cons);
                    $stmt_mitigadores_cons->execute($carpetas_ids_consolidado);
                    $resultado_mitigadores_cons = $stmt_mitigadores_cons->fetch(PDO::FETCH_ASSOC);
                    
                    $total_preventivos_cons = intval($resultado_preventivos_cons['total'] ?? 0);
                    $total_mitigadores_cons = intval($resultado_mitigadores_cons['total'] ?? 0);
                    $total_registros_cons = $total_preventivos_cons + $total_mitigadores_cons;
                    
                    if ($total_registros_cons > 0) {
                        $suma_preventivos_cons = floatval($resultado_preventivos_cons['suma_total'] ?? 0);
                        $suma_mitigadores_cons = floatval($resultado_mitigadores_cons['suma_total'] ?? 0);
                        $suma_total_cons = $suma_preventivos_cons + $suma_mitigadores_cons;
                        $empresas_unicas[$nombre_empresa]['avance_promedio'] = round($suma_total_cons / $total_registros_cons, 2);
                    }
                }
                
                $suma_promedios_empresas += $promedio_empresa;
                $contador_empresas++;
            }
            
            // Calcular promedio de nivel 1: promedio de los promedios de sus empresas
            $promedio_nivel1 = null;
            if ($contador_empresas > 0) {
                $promedio_nivel1 = round($suma_promedios_empresas / $contador_empresas, 2);
            } else {
                $promedio_nivel1 = calcularPromedioCarpeta($pdo, $carpeta_nivel1['id']);
            }
            
            // Acumular para el promedio global
            if ($promedio_nivel1 !== null) {
                $suma_promedios_nivel1 += $promedio_nivel1;
                $contador_promedios_nivel1++;
            }
        }
        
        // Obtener RCs para cada empresa
        foreach ($empresas_unicas as &$empresa) {
            if (empty($empresa['carpetas_ids'])) {
                $empresa['rcs'] = [];
                continue;
            }
            
            $placeholders = implode(',', array_fill(0, count($empresa['carpetas_ids']), '?'));
            
            $sql_rcs = "SELECT DISTINCT
                           cp.id as rc_id,
                           cp.nombre as rc_nombre,
                           AVG(COALESCE(lb.ponderacion, 0)) as avance_promedio,
                           COUNT(lb.id) as total_controles
                        FROM carpetas c
                        INNER JOIN carpetas cp ON c.carpeta_padre_id = cp.id
                        LEFT JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
                        WHERE c.id IN ($placeholders)
                        AND cp.carpeta_padre_id IS NULL
                        AND cp.activo = 1
                        AND c.activo = 1
                        GROUP BY cp.id, cp.nombre
                        HAVING total_controles > 0";
            $stmt_rcs = $pdo->prepare($sql_rcs);
            $stmt_rcs->execute($empresa['carpetas_ids']);
            $rcs = $stmt_rcs->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($rcs)) {
                $sql_rcs_sub = "SELECT DISTINCT
                                   cp.id as rc_id,
                                   cp.nombre as rc_nombre,
                                   AVG(COALESCE(lb.ponderacion, 0)) as avance_promedio,
                                   COUNT(lb.id) as total_controles
                                FROM carpetas c
                                INNER JOIN carpetas cp ON c.carpeta_padre_id = cp.id
                                LEFT JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
                                WHERE c.carpeta_padre_id IN ($placeholders)
                                AND cp.carpeta_padre_id IS NULL
                                AND cp.activo = 1
                                AND c.activo = 1
                                GROUP BY cp.id, cp.nombre
                                HAVING total_controles > 0";
                $stmt_rcs_sub = $pdo->prepare($sql_rcs_sub);
                $stmt_rcs_sub->execute($empresa['carpetas_ids']);
                $rcs = $stmt_rcs_sub->fetchAll(PDO::FETCH_ASSOC);
            }
            
            $empresa['rcs'] = $rcs;
        }
        unset($empresa);
        
        $avance_empresas_data = array_values($empresas_unicas);
        
        // Agrupar empresas por nombre para evitar duplicados
        // Si hay múltiples carpetas con el mismo nombre, consolidarlas en una sola entrada
        $empresas_agrupadas = [];
        foreach ($avance_empresas_data as $empresa) {
            $nombre_empresa = trim($empresa['empresa']);
            if (!isset($empresas_agrupadas[$nombre_empresa])) {
                $empresas_agrupadas[$nombre_empresa] = [
                    'carpeta_id' => $empresa['carpeta_id'],
                    'empresa' => $nombre_empresa,
                    'avance_promedio' => 0,
                    'total_controles' => 0,
                    'carpetas_ids' => [],
                    'rcs' => []
                ];
            }
            // Acumular datos
            $empresas_agrupadas[$nombre_empresa]['carpetas_ids'][] = $empresa['carpeta_id'];
            $empresas_agrupadas[$nombre_empresa]['total_controles'] += intval($empresa['total_controles'] || 0);
        }
        
        // Recalcular el promedio de avance considerando todas las carpetas de la empresa
        foreach ($empresas_agrupadas as $nombre_empresa => &$empresa_agrupada) {
            if (empty($empresa_agrupada['carpetas_ids'])) {
                continue;
            }
            
            $placeholders = implode(',', array_fill(0, count($empresa_agrupada['carpetas_ids']), '?'));
            
            // Calcular promedio de avance consolidado
            $sql_avance_consolidado = "SELECT 
                                         AVG(COALESCE(lb.ponderacion, 0)) as avance_promedio,
                                         COUNT(lb.id) as total_controles
                                      FROM carpeta_linea_base lb
                                      WHERE lb.carpeta_id IN ($placeholders)
                                      AND lb.activo = 1";
            $stmt_avance_consolidado = $pdo->prepare($sql_avance_consolidado);
            $stmt_avance_consolidado->execute($empresa_agrupada['carpetas_ids']);
            $avance_consolidado = $stmt_avance_consolidado->fetch(PDO::FETCH_ASSOC);
            
            $empresa_agrupada['avance_promedio'] = floatval($avance_consolidado['avance_promedio'] ?? 0);
            $empresa_agrupada['total_controles'] = intval($avance_consolidado['total_controles'] ?? 0);
        }
        unset($empresa_agrupada);
        
        // Para cada empresa agrupada, obtener los RCs (carpetas nivel 1) asociados
        // La estructura es: RC (nivel 1, carpeta_padre_id IS NULL) -> Empresa (nivel 2) -> Subcarpetas (nivel 3+)
        foreach ($empresas_agrupadas as &$empresa) {
            if (empty($empresa['carpetas_ids'])) {
                $empresa['rcs'] = [];
                continue;
            }
            
            $placeholders = implode(',', array_fill(0, count($empresa['carpetas_ids']), '?'));
            
            // Obtener todos los RCs asociados a las carpetas de esta empresa
            $sql_rcs = "SELECT DISTINCT
                           cp.id as rc_id,
                           cp.nombre as rc_nombre,
                           AVG(COALESCE(lb.ponderacion, 0)) as avance_promedio,
                           COUNT(lb.id) as total_controles
                        FROM carpetas c
                        INNER JOIN carpetas cp ON c.carpeta_padre_id = cp.id
                        LEFT JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
                        WHERE c.id IN ($placeholders)
                        AND cp.carpeta_padre_id IS NULL
                        AND cp.activo = 1
                        AND c.activo = 1
                        GROUP BY cp.id, cp.nombre
                        HAVING total_controles > 0";
            $stmt_rcs = $pdo->prepare($sql_rcs);
            $stmt_rcs->execute($empresa['carpetas_ids']);
            $rcs = $stmt_rcs->fetchAll(PDO::FETCH_ASSOC);
            
            // Si no hay RCs directos, buscar en subcarpetas
            if (empty($rcs)) {
                $sql_rcs_sub = "SELECT DISTINCT
                                   cp.id as rc_id,
                                   cp.nombre as rc_nombre,
                                   AVG(COALESCE(lb.ponderacion, 0)) as avance_promedio,
                                   COUNT(lb.id) as total_controles
                                FROM carpetas c
                                INNER JOIN carpetas cp ON c.carpeta_padre_id = cp.id
                                LEFT JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
                                WHERE c.carpeta_padre_id IN ($placeholders)
                                AND cp.carpeta_padre_id IS NULL
                                AND cp.activo = 1
                                AND c.activo = 1
                                GROUP BY cp.id, cp.nombre
                                HAVING total_controles > 0";
                $stmt_rcs_sub = $pdo->prepare($sql_rcs_sub);
                $stmt_rcs_sub->execute($empresa['carpetas_ids']);
                $rcs = $stmt_rcs_sub->fetchAll(PDO::FETCH_ASSOC);
            }
            
            $empresa['rcs'] = $rcs;
        }
        unset($empresa); // Liberar referencia
        
        // Convertir el array asociativo a array indexado
        $avance_empresas_data = array_values($empresas_agrupadas);
        
        // Calcular el promedio global: promedio de los promedios de las carpetas de nivel 1
        // Esto es igual al cálculo de "AVANCE GENERAL"
        $kpis['avance_global_empresas'] = $contador_promedios_nivel1 > 0 ? round($suma_promedios_nivel1 / $contador_promedios_nivel1, 2) : 0;
        $kpis['total_empresas'] = count($avance_empresas_data);
        $kpis['avance_por_empresa'] = $avance_empresas_data; // Detalle por empresa con RCs
        
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

