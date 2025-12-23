<?php
/**
 * API para obtener notificaciones del usuario
 * Solo muestra notificaciones de carpetas a las que el usuario tiene acceso
 * Incluye mensajes de foro no leídos y tareas asignadas
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : 0;

if (!$usuario_id) {
    echo json_encode(['success' => false, 'error' => 'usuario_id requerido'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $notificaciones = [];
    
    // Obtener información del usuario (para saber si es super_admin)
    $stmt_user = $pdo->prepare("SELECT id, nombre, rol FROM usuarios WHERE id = ?");
    $stmt_user->execute([$usuario_id]);
    $usuario = $stmt_user->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario) {
        echo json_encode(['success' => false, 'error' => 'Usuario no encontrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $es_super_admin = ($usuario['rol'] === 'super_admin');
    
    // Crear tabla de notificaciones leídas si no existe
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS notificaciones_leidas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                referencia_id BIGINT UNSIGNED NOT NULL,
                leido_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_lectura (usuario_id, tipo, referencia_id),
                INDEX idx_usuario (usuario_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (Exception $e) {
        // Ya existe
    }
    
    // 1. Obtener las carpetas a las que el usuario tiene acceso
    $carpetas_acceso = [];
    
    if ($es_super_admin) {
        // Super admin tiene acceso a todas las carpetas
        $stmt = $pdo->query("SELECT id, nombre, proyecto_id FROM carpetas WHERE activo = 1");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $carpetas_acceso[$row['id']] = $row;
        }
    } else {
        // Usuario normal: solo carpetas asignadas
        $stmt = $pdo->prepare("
            SELECT c.id, c.nombre, c.proyecto_id
            FROM carpeta_usuarios cu
            INNER JOIN carpetas c ON cu.carpeta_id = c.id
            WHERE cu.usuario_id = ? AND c.activo = 1
        ");
        $stmt->execute([$usuario_id]);
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $carpetas_acceso[$row['id']] = $row;
        }
    }
    
    // Si no tiene carpetas asignadas, retornar vacío
    if (empty($carpetas_acceso)) {
        echo json_encode([
            'success' => true,
            'notificaciones' => [],
            'total' => 0
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $carpetas_ids = array_keys($carpetas_acceso);
    $placeholders = implode(',', array_fill(0, count($carpetas_ids), '?'));
    
    // 2. Obtener mensajes de foro (línea base preventiva) de las carpetas permitidas
    $stmt = $pdo->prepare("
        SELECT 
            clb.id,
            clb.carpeta_id,
            clb.codigo,
            clb.conversacion_seguimiento,
            c.nombre as carpeta_nombre,
            c.proyecto_id
        FROM carpeta_linea_base clb
        INNER JOIN carpetas c ON clb.carpeta_id = c.id
        WHERE clb.carpeta_id IN ($placeholders)
          AND clb.conversacion_seguimiento IS NOT NULL 
          AND clb.conversacion_seguimiento != ''
          AND clb.conversacion_seguimiento != '[]'
    ");
    $stmt->execute($carpetas_ids);
    $lineasBase = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($lineasBase as $lb) {
        $mensajes = json_decode($lb['conversacion_seguimiento'], true);
        if (!is_array($mensajes)) continue;
        
        foreach ($mensajes as $index => $mensaje) {
            // Solo mostrar mensajes de OTROS usuarios (no los propios)
            $mensaje_usuario_id = isset($mensaje['usuario_id']) ? intval($mensaje['usuario_id']) : 0;
            
            // Obtener el texto del mensaje (puede estar en diferentes campos)
            $mensaje_texto = $mensaje['mensaje'] ?? $mensaje['texto'] ?? $mensaje['contenido'] ?? '';
            $mensaje_texto = trim($mensaje_texto);
            
            // Solo procesar si hay un mensaje válido y es de otro usuario
            if ($mensaje_usuario_id > 0 && $mensaje_usuario_id != $usuario_id && !empty($mensaje_texto)) {
                // Generar ID único para este mensaje (usar sprintf %u para unsigned)
                $ref_id = sprintf('%u', crc32($lb['id'] . '_' . $index . '_' . ($mensaje['fecha'] ?? '')));
                
                // Verificar si ya fue leído
                $stmt_leido = $pdo->prepare("
                    SELECT 1 FROM notificaciones_leidas 
                    WHERE usuario_id = ? AND tipo = 'mensaje_foro' AND referencia_id = ?
                ");
                $stmt_leido->execute([$usuario_id, $ref_id]);
                
                if (!$stmt_leido->fetch()) {
                    // Mensaje no leído - agregar a notificaciones
                    $usuario_nombre = $mensaje['usuario_nombre'] ?? $mensaje['nombre_usuario'] ?? 'Usuario';
                    $mensaje_preview = mb_strlen($mensaje_texto) > 50 
                        ? mb_substr($mensaje_texto, 0, 50) . '...' 
                        : $mensaje_texto;
                    
                    $notificaciones[] = [
                        'id' => 'msg_' . $lb['id'] . '_' . $index,
                        'tipo' => 'mensaje',
                        'mensaje' => $usuario_nombre . ' comentó: "' . $mensaje_preview . '"',
                        'carpeta_id' => $lb['carpeta_id'],
                        'carpeta_nombre' => $lb['carpeta_nombre'],
                        'proyecto_id' => $lb['proyecto_id'],
                        'linea_base_id' => $lb['id'],
                        'codigo' => $lb['codigo'],
                        'fecha' => $mensaje['fecha'] ?? date('Y-m-d H:i:s'),
                        'leida' => false,
                        'ref_id' => $ref_id
                    ];
                }
            }
        }
    }
    
    // 3. También buscar en línea base mitigadores
    try {
        $stmt = $pdo->prepare("
            SELECT 
                clbm.id,
                clbm.carpeta_id,
                clbm.codigo,
                clbm.conversacion_seguimiento,
                c.nombre as carpeta_nombre,
                c.proyecto_id
            FROM carpeta_linea_base_mitigadores clbm
            INNER JOIN carpetas c ON clbm.carpeta_id = c.id
            WHERE clbm.carpeta_id IN ($placeholders)
              AND clbm.conversacion_seguimiento IS NOT NULL 
              AND clbm.conversacion_seguimiento != ''
              AND clbm.conversacion_seguimiento != '[]'
        ");
        $stmt->execute($carpetas_ids);
        $lineasBaseMit = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($lineasBaseMit as $lb) {
            $mensajes = json_decode($lb['conversacion_seguimiento'], true);
            if (!is_array($mensajes)) continue;
            
            foreach ($mensajes as $index => $mensaje) {
                $mensaje_usuario_id = isset($mensaje['usuario_id']) ? intval($mensaje['usuario_id']) : 0;
                
                // Obtener el texto del mensaje
                $mensaje_texto = $mensaje['mensaje'] ?? $mensaje['texto'] ?? $mensaje['contenido'] ?? '';
                $mensaje_texto = trim($mensaje_texto);
                
                // Solo procesar si hay un mensaje válido y es de otro usuario
                if ($mensaje_usuario_id > 0 && $mensaje_usuario_id != $usuario_id && !empty($mensaje_texto)) {
                    // Generar ID único (usar sprintf %u para unsigned)
                    $ref_id = sprintf('%u', crc32('mit_' . $lb['id'] . '_' . $index . '_' . ($mensaje['fecha'] ?? '')));
                    
                    $stmt_leido = $pdo->prepare("
                        SELECT 1 FROM notificaciones_leidas 
                        WHERE usuario_id = ? AND tipo = 'mensaje_foro' AND referencia_id = ?
                    ");
                    $stmt_leido->execute([$usuario_id, $ref_id]);
                    
                    if (!$stmt_leido->fetch()) {
                        $usuario_nombre = $mensaje['usuario_nombre'] ?? $mensaje['nombre_usuario'] ?? 'Usuario';
                        $mensaje_preview = mb_strlen($mensaje_texto) > 50 
                            ? mb_substr($mensaje_texto, 0, 50) . '...' 
                            : $mensaje_texto;
                        
                        $notificaciones[] = [
                            'id' => 'mit_' . $lb['id'] . '_' . $index,
                            'tipo' => 'mensaje',
                            'mensaje' => $usuario_nombre . ' comentó: "' . $mensaje_preview . '"',
                            'carpeta_id' => $lb['carpeta_id'],
                            'carpeta_nombre' => $lb['carpeta_nombre'],
                            'proyecto_id' => $lb['proyecto_id'],
                            'linea_base_id' => $lb['id'],
                            'codigo' => $lb['codigo'],
                            'fecha' => $mensaje['fecha'] ?? date('Y-m-d H:i:s'),
                            'leida' => false,
                            'ref_id' => $ref_id
                        ];
                    }
                }
            }
        }
    } catch (Exception $e) {
        // Tabla no existe, continuar
    }
    
    // 4. Obtener tareas asignadas al usuario (pendientes o próximas a vencer)
    try {
        $stmt = $pdo->prepare("
            SELECT 
                t.id,
                t.titulo,
                t.descripcion,
                t.fecha_vencimiento,
                t.estado,
                t.carpeta_id,
                c.nombre as carpeta_nombre,
                c.proyecto_id,
                u_creador.nombre as creador_nombre
            FROM tareas t
            INNER JOIN carpetas c ON t.carpeta_id = c.id
            LEFT JOIN usuarios u_creador ON t.creado_por = u_creador.id
            WHERE t.asignado_a = ?
              AND t.carpeta_id IN ($placeholders)
              AND t.estado IN ('pendiente', 'en_progreso')
            ORDER BY t.fecha_vencimiento ASC
            LIMIT 15
        ");
        $params = array_merge([$usuario_id], $carpetas_ids);
        $stmt->execute($params);
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tareas as $tarea) {
            $fecha_venc = strtotime($tarea['fecha_vencimiento']);
            $ahora = time();
            $dias_restantes = floor(($fecha_venc - $ahora) / 86400);
            
            $esVencida = $fecha_venc < $ahora;
            $esProxima = $dias_restantes <= 3 && $dias_restantes >= 0;
            
            // Solo mostrar tareas vencidas o próximas a vencer (3 días)
            if ($esVencida || $esProxima) {
                $icono = $esVencida ? '⚠️' : '📋';
                $estado_texto = $esVencida ? 'Vencida' : "Vence en $dias_restantes días";
                
                $notificaciones[] = [
                    'id' => 'tarea_' . $tarea['id'],
                    'tipo' => 'tarea',
                    'mensaje' => "$icono Tarea: " . $tarea['titulo'] . " ($estado_texto)",
                    'carpeta_id' => $tarea['carpeta_id'],
                    'carpeta_nombre' => $tarea['carpeta_nombre'],
                    'proyecto_id' => $tarea['proyecto_id'],
                    'fecha' => $tarea['fecha_vencimiento'],
                    'leida' => false,
                    'ref_id' => $tarea['id'],
                    'vencida' => $esVencida
                ];
            }
        }
    } catch (Exception $e) {
        // Tabla tareas no existe, continuar
        error_log("Error obteniendo tareas: " . $e->getMessage());
    }
    
    // Ordenar por fecha (más recientes primero)
    usort($notificaciones, function($a, $b) {
        return strtotime($b['fecha']) - strtotime($a['fecha']);
    });
    
    // Limitar a 30 notificaciones
    $notificaciones = array_slice($notificaciones, 0, 30);
    
    echo json_encode([
        'success' => true,
        'notificaciones' => $notificaciones,
        'total' => count($notificaciones),
        'carpetas_acceso' => count($carpetas_acceso)
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener notificaciones: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
