<?php
/**
 * Script para notificar a usuarios sobre tareas próximas a vencer
 * Este script debe ejecutarse periódicamente mediante cron job
 * 
 * Ejemplo de configuración cron (ejecutar diariamente a las 8:00 AM):
 * 0 8 * * * /usr/bin/php /ruta/completa/api/cron/notificar_tareas_vencimiento.php
 * 
 * O en Windows Task Scheduler:
 * php.exe C:\xampp\htdocs\ssocaren\api\cron\notificar_tareas_vencimiento.php
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../utils/email_functions_real.php';

// Configuración: días antes del vencimiento para enviar notificación
$dias_antes_notificacion = [3, 1, 0]; // Notificar 3 días antes, 1 día antes, y el día del vencimiento

// Días después del vencimiento para notificar tareas vencidas
$dias_despues_vencido = [1, 3]; // Notificar 1 día después y 3 días después si aún está pendiente

try {
    $fecha_hoy = date('Y-m-d');
    $notificaciones_enviadas = 0;
    $errores = 0;
    
    // Obtener todas las tareas activas que están en proceso (no completadas ni canceladas)
    // y que tienen fecha de vencimiento
    $sql = "SELECT t.*, 
                   c.nombre as carpeta_nombre,
                   u_creador.nombre as creador_nombre,
                   u_creador.email as creador_email
            FROM carpeta_tareas t
            LEFT JOIN carpetas c ON t.carpeta_id = c.id
            LEFT JOIN usuarios u_creador ON t.creado_por = u_creador.id
            WHERE t.activo = 1 
            AND t.estado IN ('pendiente', 'en_progreso')
            AND t.fecha_vencimiento IS NOT NULL
            AND t.fecha_vencimiento >= DATE_SUB(?, INTERVAL 3 DAY)
            AND t.fecha_vencimiento <= DATE_ADD(?, INTERVAL 3 DAY)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$fecha_hoy, $fecha_hoy]);
    $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($tareas as $tarea) {
        $fecha_vencimiento = $tarea['fecha_vencimiento'];
        $dias_restantes = (strtotime($fecha_vencimiento) - strtotime($fecha_hoy)) / (60 * 60 * 24);
        $dias_restantes = floor($dias_restantes);
        
        // Determinar tipo de notificación
        $tipo_notificacion = null;
        if ($dias_restantes < 0) {
            // Tarea vencida
            $dias_vencido = abs($dias_restantes);
            if (in_array($dias_vencido, $dias_despues_vencido)) {
                $tipo_notificacion = 'vencido';
            }
        } else if ($dias_restantes == 0) {
            // Vence hoy
            $tipo_notificacion = 'vencimiento_hoy';
        } else if (in_array($dias_restantes, $dias_antes_notificacion)) {
            // Próxima a vencer
            $tipo_notificacion = 'vencimiento_proximo';
        }
        
        // Si no corresponde notificar, continuar con la siguiente tarea
        if (!$tipo_notificacion) {
            continue;
        }
        
        // Obtener todos los usuarios asignados a la tarea
        $sqlAsignados = "SELECT ta.usuario_id, 
                                u.nombre, 
                                u.email
                         FROM carpeta_tarea_asignaciones ta
                         LEFT JOIN usuarios u ON ta.usuario_id = u.id
                         WHERE ta.tarea_id = ? AND ta.activo = 1
                         UNION
                         SELECT t.creado_por as usuario_id,
                                u_creador.nombre,
                                u_creador.email
                         FROM carpeta_tareas t
                         LEFT JOIN usuarios u_creador ON t.creado_por = u_creador.id
                         WHERE t.id = ? AND t.creado_por IS NOT NULL";
        
        $stmtAsignados = $pdo->prepare($sqlAsignados);
        $stmtAsignados->execute([$tarea['id'], $tarea['id']]);
        $usuarios_asignados = $stmtAsignados->fetchAll(PDO::FETCH_ASSOC);
        
        // Enviar notificación a cada usuario asignado
        foreach ($usuarios_asignados as $usuario) {
            if (empty($usuario['email'])) {
                continue; // Saltar si no tiene email
            }
            
            // Verificar si ya se envió notificación hoy para esta tarea y usuario
            $sqlNotificacion = "SELECT id FROM tarea_notificaciones 
                                WHERE tarea_id = ? 
                                AND usuario_id = ? 
                                AND tipo_notificacion = ? 
                                AND fecha_notificacion = ? 
                                AND activo = 1";
            
            $stmtNotificacion = $pdo->prepare($sqlNotificacion);
            $stmtNotificacion->execute([
                $tarea['id'], 
                $usuario['usuario_id'], 
                $tipo_notificacion, 
                $fecha_hoy
            ]);
            
            if ($stmtNotificacion->fetch()) {
                // Ya se envió notificación hoy, continuar
                continue;
            }
            
            // Enviar email
            $dias_mostrar = $dias_restantes < 0 ? abs($dias_restantes) : $dias_restantes;
            $email_enviado = enviarNotificacionTarea(
                $usuario['email'],
                $usuario['nombre'],
                $tarea['titulo'],
                $fecha_vencimiento,
                $tarea['carpeta_nombre'],
                $dias_mostrar,
                $tipo_notificacion
            );
            
            if ($email_enviado) {
                // Registrar notificación enviada
                $sqlInsert = "INSERT INTO tarea_notificaciones 
                             (tarea_id, usuario_id, tipo_notificacion, fecha_notificacion) 
                             VALUES (?, ?, ?, ?)";
                
                $stmtInsert = $pdo->prepare($sqlInsert);
                $stmtInsert->execute([
                    $tarea['id'],
                    $usuario['usuario_id'],
                    $tipo_notificacion,
                    $fecha_hoy
                ]);
                
                $notificaciones_enviadas++;
            } else {
                $errores++;
            }
        }
    }
    
    // Log resumen
    $log_resumen = date('Y-m-d H:i:s') . " - RESUMEN EJECUCIÓN NOTIFICACIONES\n";
    $log_resumen .= "Notificaciones enviadas: {$notificaciones_enviadas}\n";
    $log_resumen .= "Errores: {$errores}\n";
    $log_resumen .= "---\n\n";
    
    file_put_contents(__DIR__ . '/../notificaciones_tareas.log', $log_resumen, FILE_APPEND);
    
    // Si se ejecuta desde línea de comandos, mostrar resultado
    if (php_sapi_name() === 'cli') {
        echo "Proceso completado.\n";
        echo "Notificaciones enviadas: {$notificaciones_enviadas}\n";
        echo "Errores: {$errores}\n";
    }
    
} catch (Exception $e) {
    $error_log = date('Y-m-d H:i:s') . " - ERROR CRÍTICO EN NOTIFICACIONES\n";
    $error_log .= "Error: " . $e->getMessage() . "\n";
    $error_log .= "Trace: " . $e->getTraceAsString() . "\n";
    $error_log .= "---\n\n";
    
    file_put_contents(__DIR__ . '/../notificaciones_tareas.log', $error_log, FILE_APPEND);
    
    if (php_sapi_name() === 'cli') {
        echo "Error: " . $e->getMessage() . "\n";
    }
    
    exit(1);
}
?>

