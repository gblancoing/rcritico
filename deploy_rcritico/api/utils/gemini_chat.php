<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// =====================================================
// CONFIGURACIÓN DE GEMINI API
// =====================================================
$GEMINI_API_KEY = 'AIzaSyD15tuiCmV8A3gCcCkT3RsfLTlwNpdR9ck';
$GEMINI_MODEL = 'gemini-1.5-flash';
$GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{$GEMINI_MODEL}:generateContent";

// =====================================================
// FUNCIONES DE ANÁLISIS AVANZADO
// =====================================================

/**
 * Obtener resumen ejecutivo del sistema
 */
function obtenerResumenEjecutivo($pdo) {
    $resumen = "\n### 📊 RESUMEN EJECUTIVO DEL SISTEMA:\n\n";
    
    try {
        // Totales generales
        $stmt = $pdo->query("
            SELECT 
                (SELECT COUNT(*) FROM carpetas WHERE nivel = 1 AND activo = 1) as total_rc,
                (SELECT COUNT(*) FROM carpetas WHERE nivel = 2 AND activo = 1) as total_empresas,
                (SELECT COUNT(*) FROM carpeta_linea_base WHERE activo = 1) as total_controles_prev,
                (SELECT COUNT(*) FROM carpeta_linea_base_mitigadores WHERE activo = 1) as total_controles_mit,
                (SELECT COUNT(*) FROM usuarios WHERE aprobado = 1) as total_usuarios,
                (SELECT COUNT(*) FROM carpeta_tareas WHERE activo = 1 AND estado != 'completada') as tareas_pendientes
        ");
        $totales = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $resumen .= "**📈 NÚMEROS CLAVE:**\n";
        $resumen .= "- Riesgos Críticos (RC): {$totales['total_rc']}\n";
        $resumen .= "- Empresas/Contratistas: {$totales['total_empresas']}\n";
        $resumen .= "- Controles Preventivos en Línea Base: {$totales['total_controles_prev']}\n";
        $resumen .= "- Controles Mitigadores en Línea Base: {$totales['total_controles_mit']}\n";
        $resumen .= "- Usuarios activos: {$totales['total_usuarios']}\n";
        $resumen .= "- Tareas pendientes: {$totales['tareas_pendientes']}\n";
        
        // Promedios de avance
        $stmt = $pdo->query("
            SELECT 
                ROUND(AVG(COALESCE(porcentaje_avance, 0)), 1) as promedio_prev,
                SUM(CASE WHEN estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados_prev,
                SUM(CASE WHEN estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as observaciones_prev
            FROM carpeta_linea_base WHERE activo = 1
        ");
        $statsPrev = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->query("
            SELECT 
                ROUND(AVG(COALESCE(porcentaje_avance, 0)), 1) as promedio_mit,
                SUM(CASE WHEN estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados_mit,
                SUM(CASE WHEN estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as observaciones_mit
            FROM carpeta_linea_base_mitigadores WHERE activo = 1
        ");
        $statsMit = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $resumen .= "\n**🎯 ESTADO DE IMPLEMENTACIÓN:**\n";
        $resumen .= "- Avance Controles Preventivos: {$statsPrev['promedio_prev']}% (✅{$statsPrev['validados_prev']} validados, 🟡{$statsPrev['observaciones_prev']} con obs)\n";
        $resumen .= "- Avance Controles Mitigadores: {$statsMit['promedio_mit']}% (✅{$statsMit['validados_mit']} validados, 🟡{$statsMit['observaciones_mit']} con obs)\n";
        
    } catch (PDOException $e) {
        $resumen .= "Error obteniendo resumen.\n";
    }
    
    return $resumen;
}

/**
 * Análisis detallado por empresa
 */
function obtenerAnalisisEmpresas($pdo) {
    $info = "\n### 🏢 ANÁLISIS DETALLADO POR EMPRESA:\n\n";
    
    try {
        $stmt = $pdo->query("
            SELECT 
                c.id,
                c.nombre as empresa,
                p.nombre as riesgo_critico,
                -- Controles Preventivos
                COUNT(DISTINCT lb.id) as ctrl_prev_total,
                ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as prev_avance,
                SUM(CASE WHEN lb.estado_validacion = 'validado' THEN 1 ELSE 0 END) as prev_validados,
                SUM(CASE WHEN lb.estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as prev_observaciones,
                SUM(CASE WHEN lb.criticidad = 'Crítico' THEN 1 ELSE 0 END) as prev_criticos,
                -- Controles Mitigadores
                COUNT(DISTINCT lbm.id) as ctrl_mit_total,
                ROUND(AVG(COALESCE(lbm.porcentaje_avance, 0)), 1) as mit_avance,
                SUM(CASE WHEN lbm.estado_validacion = 'validado' THEN 1 ELSE 0 END) as mit_validados,
                SUM(CASE WHEN lbm.estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as mit_observaciones
            FROM carpetas c
            LEFT JOIN carpetas p ON c.carpeta_padre_id = p.id
            LEFT JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
            LEFT JOIN carpeta_linea_base_mitigadores lbm ON lbm.carpeta_id = c.id AND lbm.activo = 1
            WHERE c.nivel = 2 AND c.activo = 1
            GROUP BY c.id, c.nombre, p.nombre
            HAVING ctrl_prev_total > 0 OR ctrl_mit_total > 0
            ORDER BY prev_avance DESC, mit_avance DESC
        ");
        $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($empresas) > 0) {
            foreach ($empresas as $e) {
                $totalAvance = 0;
                $count = 0;
                if ($e['ctrl_prev_total'] > 0) { $totalAvance += $e['prev_avance']; $count++; }
                if ($e['ctrl_mit_total'] > 0) { $totalAvance += $e['mit_avance']; $count++; }
                $promedioGlobal = $count > 0 ? round($totalAvance / $count, 1) : 0;
                
                $barra = str_repeat("█", round($promedioGlobal / 10)) . str_repeat("░", 10 - round($promedioGlobal / 10));
                $emoji = $promedioGlobal >= 80 ? "🟢" : ($promedioGlobal >= 50 ? "🟡" : "🔴");
                
                $info .= "{$emoji} **{$e['empresa']}** ({$e['riesgo_critico']})\n";
                $info .= "   📊 Avance Global: **{$promedioGlobal}%** [{$barra}]\n";
                
                if ($e['ctrl_prev_total'] > 0) {
                    $info .= "   🛡️ Preventivos: {$e['prev_avance']}% | Total: {$e['ctrl_prev_total']} (✅{$e['prev_validados']} 🟡{$e['prev_observaciones']} ⚠️{$e['prev_criticos']} críticos)\n";
                }
                if ($e['ctrl_mit_total'] > 0) {
                    $info .= "   🔧 Mitigadores: {$e['mit_avance']}% | Total: {$e['ctrl_mit_total']} (✅{$e['mit_validados']} 🟡{$e['mit_observaciones']})\n";
                }
                $info .= "\n";
            }
        }
    } catch (PDOException $e) {
        $info .= "Error: " . $e->getMessage() . "\n";
    }
    
    return $info;
}

/**
 * Análisis por dimensión (Diseño, Implementación, Entrenamiento)
 */
function obtenerAnalisisDimensiones($pdo) {
    $info = "\n### 📐 ANÁLISIS POR DIMENSIÓN DE VERIFICACIÓN:\n\n";
    
    try {
        // Análisis de controles preventivos por dimensión
        $stmt = $pdo->query("
            SELECT 
                COALESCE(lb.dimension, 'Sin dimensión') as dimension,
                COUNT(*) as total,
                ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as promedio,
                SUM(CASE WHEN lb.estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados,
                SUM(CASE WHEN lb.estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as observaciones,
                SUM(CASE WHEN lb.implementado_estandar = 'Sí' OR lb.implementado_estandar = 'SI' THEN 1 ELSE 0 END) as implementados
            FROM carpeta_linea_base lb
            WHERE lb.activo = 1 AND lb.dimension IS NOT NULL AND lb.dimension != ''
            GROUP BY lb.dimension
            ORDER BY promedio DESC
        ");
        $dimensiones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $info .= "**🛡️ CONTROLES PREVENTIVOS POR DIMENSIÓN:**\n";
        foreach ($dimensiones as $d) {
            $icono = '';
            $dim = strtoupper($d['dimension']);
            if (strpos($dim, 'DISEÑO') !== false || strpos($dim, 'DISENO') !== false) $icono = '📝';
            elseif (strpos($dim, 'IMPLEMENT') !== false) $icono = '🔧';
            elseif (strpos($dim, 'ENTRENA') !== false || strpos($dim, 'CAPACIT') !== false) $icono = '👨‍🎓';
            else $icono = '📋';
            
            $barra = str_repeat("█", round($d['promedio'] / 10)) . str_repeat("░", 10 - round($d['promedio'] / 10));
            $info .= "{$icono} **{$d['dimension']}**: {$d['promedio']}% [{$barra}]\n";
            $info .= "   Total: {$d['total']} | ✅{$d['validados']} validados | 🟡{$d['observaciones']} obs | 🔧{$d['implementados']} implementados\n";
        }
        
        // Mitigadores por dimensión
        $stmt = $pdo->query("
            SELECT 
                COALESCE(lbm.dimension, 'Sin dimensión') as dimension,
                COUNT(*) as total,
                ROUND(AVG(COALESCE(lbm.porcentaje_avance, 0)), 1) as promedio,
                SUM(CASE WHEN lbm.estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados
            FROM carpeta_linea_base_mitigadores lbm
            WHERE lbm.activo = 1 AND lbm.dimension IS NOT NULL AND lbm.dimension != ''
            GROUP BY lbm.dimension
            ORDER BY promedio DESC
        ");
        $dimMit = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($dimMit) > 0) {
            $info .= "\n**🔧 CONTROLES MITIGADORES POR DIMENSIÓN:**\n";
            foreach ($dimMit as $d) {
                $barra = str_repeat("█", round($d['promedio'] / 10)) . str_repeat("░", 10 - round($d['promedio'] / 10));
                $info .= "📋 **{$d['dimension']}**: {$d['promedio']}% [{$barra}] | Total: {$d['total']} | ✅{$d['validados']}\n";
            }
        }
        
    } catch (PDOException $e) {
        $info .= "Error: " . $e->getMessage() . "\n";
    }
    
    return $info;
}

/**
 * Análisis de criticidad de controles
 */
function obtenerAnalisisCriticidad($pdo) {
    $info = "\n### ⚠️ ANÁLISIS DE CRITICIDAD:\n\n";
    
    try {
        // Preventivos por criticidad
        $stmt = $pdo->query("
            SELECT 
                COALESCE(lb.criticidad, 'Sin definir') as criticidad,
                COUNT(*) as total,
                ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as promedio,
                SUM(CASE WHEN lb.estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados,
                SUM(CASE WHEN COALESCE(lb.porcentaje_avance, 0) < 50 THEN 1 ELSE 0 END) as bajo_avance
            FROM carpeta_linea_base lb
            WHERE lb.activo = 1
            GROUP BY lb.criticidad
            ORDER BY 
                CASE lb.criticidad 
                    WHEN 'Crítico' THEN 1 
                    WHEN 'Alto' THEN 2 
                    WHEN 'Medio' THEN 3 
                    WHEN 'Bajo' THEN 4 
                    ELSE 5 
                END
        ");
        $criticidades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $info .= "**🛡️ CONTROLES PREVENTIVOS POR CRITICIDAD:**\n";
        foreach ($criticidades as $c) {
            $emoji = '';
            $crit = strtolower($c['criticidad']);
            if (strpos($crit, 'crític') !== false || strpos($crit, 'critic') !== false) $emoji = '🔴';
            elseif (strpos($crit, 'alto') !== false) $emoji = '🟠';
            elseif (strpos($crit, 'medio') !== false) $emoji = '🟡';
            else $emoji = '🟢';
            
            $barra = str_repeat("█", round($c['promedio'] / 10)) . str_repeat("░", 10 - round($c['promedio'] / 10));
            $info .= "{$emoji} **{$c['criticidad']}**: {$c['promedio']}% [{$barra}]\n";
            $info .= "   Total: {$c['total']} | ✅{$c['validados']} validados | ⚠️{$c['bajo_avance']} con bajo avance\n";
        }
        
        // Controles críticos con bajo avance (ALERTA)
        $stmt = $pdo->query("
            SELECT 
                lb.codigo,
                lb.pregunta,
                lb.porcentaje_avance,
                lb.criticidad,
                c.nombre as empresa,
                p.nombre as riesgo
            FROM carpeta_linea_base lb
            JOIN carpetas c ON lb.carpeta_id = c.id
            JOIN carpetas p ON c.carpeta_padre_id = p.id
            WHERE lb.activo = 1 
            AND (lb.criticidad LIKE '%Crítico%' OR lb.criticidad LIKE '%crítico%')
            AND COALESCE(lb.porcentaje_avance, 0) < 50
            ORDER BY lb.porcentaje_avance ASC
            LIMIT 10
        ");
        $alertas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($alertas) > 0) {
            $info .= "\n**🚨 ALERTA: CONTROLES CRÍTICOS CON BAJO AVANCE (<50%):**\n";
            foreach ($alertas as $a) {
                $info .= "⚠️ **{$a['codigo']}** ({$a['empresa']}): {$a['porcentaje_avance']}%\n";
            }
        }
        
    } catch (PDOException $e) {
        $info .= "Error: " . $e->getMessage() . "\n";
    }
    
    return $info;
}

/**
 * Análisis de jerarquía de controles
 */
function obtenerAnalisisJerarquia($pdo) {
    $info = "\n### 🔺 ANÁLISIS POR JERARQUÍA DE CONTROLES:\n\n";
    
    try {
        $stmt = $pdo->query("
            SELECT 
                COALESCE(cp.jerarquia, 'Sin definir') as jerarquia,
                COUNT(*) as total,
                SUM(CASE WHEN cp.criticidad LIKE '%Crítico%' THEN 1 ELSE 0 END) as criticos
            FROM bowtie_controles_preventivos cp
            WHERE cp.activo = 1
            GROUP BY cp.jerarquia
            ORDER BY 
                CASE cp.jerarquia 
                    WHEN 'Eliminación' THEN 1 
                    WHEN 'Sustitución' THEN 2 
                    WHEN 'Ingeniería' THEN 3 
                    WHEN 'Administrativo' THEN 4 
                    WHEN 'EPP' THEN 5 
                    ELSE 6 
                END
        ");
        $jerarquias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $info .= "**🛡️ CONTROLES PREVENTIVOS (BOWTIE):**\n";
        $emojis = ['Eliminación' => '🚫', 'Sustitución' => '🔄', 'Ingeniería' => '⚙️', 'Administrativo' => '📋', 'EPP' => '🦺'];
        foreach ($jerarquias as $j) {
            $emoji = $emojis[$j['jerarquia']] ?? '📌';
            $info .= "{$emoji} **{$j['jerarquia']}**: {$j['total']} controles ({$j['criticos']} críticos)\n";
        }
        
        // Mitigadores
        $stmt = $pdo->query("
            SELECT 
                COALESCE(cm.jerarquia, 'Sin definir') as jerarquia,
                COUNT(*) as total
            FROM bowtie_controles_mitigadores cm
            WHERE cm.activo = 1
            GROUP BY cm.jerarquia
        ");
        $jerarquiasMit = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($jerarquiasMit) > 0) {
            $info .= "\n**🔧 CONTROLES MITIGADORES (BOWTIE):**\n";
            foreach ($jerarquiasMit as $j) {
                $emoji = $emojis[$j['jerarquia']] ?? '📌';
                $info .= "{$emoji} **{$j['jerarquia']}**: {$j['total']} controles\n";
            }
        }
        
    } catch (PDOException $e) {
        $info .= "Error: " . $e->getMessage() . "\n";
    }
    
    return $info;
}

/**
 * Análisis de tareas
 */
function obtenerAnalisisTareas($pdo) {
    $info = "\n### 📋 ANÁLISIS DE TAREAS:\n\n";
    
    try {
        // Resumen de tareas
        $stmt = $pdo->query("
            SELECT 
                estado,
                prioridad,
                COUNT(*) as total
            FROM carpeta_tareas
            WHERE activo = 1
            GROUP BY estado, prioridad
            ORDER BY 
                FIELD(estado, 'pendiente', 'en_progreso', 'completada', 'cancelada'),
                FIELD(prioridad, 'urgente', 'alta', 'media', 'baja')
        ");
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $porEstado = [];
        $porPrioridad = [];
        foreach ($tareas as $t) {
            if (!isset($porEstado[$t['estado']])) $porEstado[$t['estado']] = 0;
            $porEstado[$t['estado']] += $t['total'];
            
            if (!isset($porPrioridad[$t['prioridad']])) $porPrioridad[$t['prioridad']] = 0;
            $porPrioridad[$t['prioridad']] += $t['total'];
        }
        
        $emojisEstado = ['pendiente' => '⏳', 'en_progreso' => '🔄', 'completada' => '✅', 'cancelada' => '❌'];
        $emojisPrioridad = ['urgente' => '🔴', 'alta' => '🟠', 'media' => '🟡', 'baja' => '🟢'];
        
        $info .= "**📊 POR ESTADO:**\n";
        foreach ($porEstado as $estado => $total) {
            $emoji = $emojisEstado[$estado] ?? '📌';
            $info .= "{$emoji} " . ucfirst($estado) . ": {$total}\n";
        }
        
        $info .= "\n**🎯 POR PRIORIDAD:**\n";
        foreach ($porPrioridad as $prioridad => $total) {
            $emoji = $emojisPrioridad[$prioridad] ?? '📌';
            $info .= "{$emoji} " . ucfirst($prioridad) . ": {$total}\n";
        }
        
        // Tareas vencidas
        $stmt = $pdo->query("
            SELECT 
                t.titulo,
                t.prioridad,
                t.fecha_vencimiento,
                c.nombre as carpeta,
                u.nombre as asignado
            FROM carpeta_tareas t
            JOIN carpetas c ON t.carpeta_id = c.id
            LEFT JOIN usuarios u ON t.asignado_a = u.id
            WHERE t.activo = 1 
            AND t.estado NOT IN ('completada', 'cancelada')
            AND t.fecha_vencimiento < NOW()
            ORDER BY t.fecha_vencimiento ASC
            LIMIT 10
        ");
        $vencidas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($vencidas) > 0) {
            $info .= "\n**🚨 TAREAS VENCIDAS:**\n";
            foreach ($vencidas as $t) {
                $emoji = $emojisPrioridad[$t['prioridad']] ?? '📌';
                $info .= "{$emoji} **{$t['titulo']}** ({$t['carpeta']})\n";
                $info .= "   Vencida: {$t['fecha_vencimiento']} | Asignado: " . ($t['asignado'] ?? 'Sin asignar') . "\n";
            }
        }
        
        // Tareas urgentes pendientes
        $stmt = $pdo->query("
            SELECT 
                t.titulo,
                t.fecha_vencimiento,
                c.nombre as carpeta,
                u.nombre as asignado
            FROM carpeta_tareas t
            JOIN carpetas c ON t.carpeta_id = c.id
            LEFT JOIN usuarios u ON t.asignado_a = u.id
            WHERE t.activo = 1 
            AND t.estado = 'pendiente'
            AND t.prioridad = 'urgente'
            LIMIT 10
        ");
        $urgentes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($urgentes) > 0) {
            $info .= "\n**⚡ TAREAS URGENTES PENDIENTES:**\n";
            foreach ($urgentes as $t) {
                $info .= "🔴 **{$t['titulo']}** ({$t['carpeta']})\n";
                $info .= "   Vence: " . ($t['fecha_vencimiento'] ?? 'Sin fecha') . " | Asignado: " . ($t['asignado'] ?? 'Sin asignar') . "\n";
            }
        }
        
    } catch (PDOException $e) {
        $info .= "Error: " . $e->getMessage() . "\n";
    }
    
    return $info;
}

/**
 * Análisis de responsables y validadores
 */
function obtenerAnalisisResponsables($pdo) {
    $info = "\n### 👥 ANÁLISIS POR RESPONSABLE:\n\n";
    
    try {
        // Validadores más activos
        $stmt = $pdo->query("
            SELECT 
                COALESCE(lb.usuario_validacion, 'Sin asignar') as validador,
                COUNT(*) as total_validaciones,
                SUM(CASE WHEN lb.estado_validacion = 'validado' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN lb.estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as con_observaciones
            FROM carpeta_linea_base lb
            WHERE lb.activo = 1 AND lb.usuario_validacion IS NOT NULL AND lb.usuario_validacion != ''
            GROUP BY lb.usuario_validacion
            ORDER BY total_validaciones DESC
            LIMIT 10
        ");
        $validadores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($validadores) > 0) {
            $info .= "**✅ VALIDADORES MÁS ACTIVOS (PREVENTIVOS):**\n";
            foreach ($validadores as $v) {
                $info .= "👤 **{$v['validador']}**: {$v['total_validaciones']} validaciones (✅{$v['aprobados']} 🟡{$v['con_observaciones']})\n";
            }
        }
        
        // Verificadores responsables
        $stmt = $pdo->query("
            SELECT 
                COALESCE(lb.verificador_responsable, 'Sin asignar') as verificador,
                COUNT(*) as total,
                ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as promedio_avance
            FROM carpeta_linea_base lb
            WHERE lb.activo = 1 AND lb.verificador_responsable IS NOT NULL AND lb.verificador_responsable != ''
            GROUP BY lb.verificador_responsable
            ORDER BY promedio_avance DESC
            LIMIT 10
        ");
        $verificadores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($verificadores) > 0) {
            $info .= "\n**🔍 VERIFICADORES RESPONSABLES:**\n";
            foreach ($verificadores as $v) {
                $barra = str_repeat("█", round($v['promedio_avance'] / 10)) . str_repeat("░", 10 - round($v['promedio_avance'] / 10));
                $info .= "👤 **{$v['verificador']}**: {$v['total']} controles | Avance: {$v['promedio_avance']}% [{$barra}]\n";
            }
        }
        
        // Dueños de control
        $stmt = $pdo->query("
            SELECT 
                COALESCE(lb.nombre_dueno_control, 'Sin asignar') as dueno,
                COUNT(*) as total,
                ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as promedio
            FROM carpeta_linea_base lb
            WHERE lb.activo = 1 AND lb.nombre_dueno_control IS NOT NULL AND lb.nombre_dueno_control != ''
            GROUP BY lb.nombre_dueno_control
            ORDER BY total DESC
            LIMIT 10
        ");
        $duenos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($duenos) > 0) {
            $info .= "\n**👔 DUEÑOS DE CONTROL:**\n";
            foreach ($duenos as $d) {
                $info .= "👤 **{$d['dueno']}**: {$d['total']} controles | Avance promedio: {$d['promedio']}%\n";
            }
        }
        
    } catch (PDOException $e) {
        $info .= "Error: " . $e->getMessage() . "\n";
    }
    
    return $info;
}

/**
 * Análisis de BOWTIE (causas y consecuencias)
 */
function obtenerAnalisisBowtie($pdo) {
    $info = "\n### 🎯 ANÁLISIS DE BOWTIE:\n\n";
    
    try {
        // Resumen por riesgo crítico
        $stmt = $pdo->query("
            SELECT 
                c.nombre as riesgo,
                c.evento_no_deseado,
                (SELECT COUNT(*) FROM bowtie_causas bc WHERE bc.bowtie_id = cb.id AND bc.activo = 1) as causas,
                (SELECT COUNT(*) FROM bowtie_consecuencias bco WHERE bco.bowtie_id = cb.id AND bco.activo = 1) as consecuencias,
                (SELECT COUNT(*) FROM bowtie_controles_preventivos bcp WHERE bcp.bowtie_id = cb.id AND bcp.activo = 1) as ctrl_prev,
                (SELECT COUNT(*) FROM bowtie_controles_mitigadores bcm WHERE bcm.bowtie_id = cb.id AND bcm.activo = 1) as ctrl_mit
            FROM carpeta_bowtie cb
            JOIN carpetas c ON cb.carpeta_id = c.id
            WHERE cb.activo = 1 AND c.activo = 1
            ORDER BY c.nombre
        ");
        $bowties = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($bowties) > 0) {
            foreach ($bowties as $b) {
                $info .= "**🎯 {$b['riesgo']}**\n";
                if ($b['evento_no_deseado']) {
                    $info .= "   ⚠️ Evento: " . substr($b['evento_no_deseado'], 0, 100) . "\n";
                }
                $info .= "   🔴 Causas: {$b['causas']} | 🛡️ Ctrl Prev: {$b['ctrl_prev']} | 🔧 Ctrl Mit: {$b['ctrl_mit']} | 🔵 Consecuencias: {$b['consecuencias']}\n\n";
            }
        }
        
        // Total de elementos Bowtie
        $stmt = $pdo->query("
            SELECT 
                (SELECT COUNT(*) FROM bowtie_causas WHERE activo = 1) as total_causas,
                (SELECT COUNT(*) FROM bowtie_consecuencias WHERE activo = 1) as total_consecuencias,
                (SELECT COUNT(*) FROM bowtie_controles_preventivos WHERE activo = 1) as total_prev,
                (SELECT COUNT(*) FROM bowtie_controles_mitigadores WHERE activo = 1) as total_mit,
                (SELECT COUNT(*) FROM bowtie_dimensiones WHERE activo = 1) as total_dimensiones,
                (SELECT COUNT(*) FROM bowtie_preguntas WHERE activo = 1) as total_preguntas
        ");
        $totales = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $info .= "**📊 TOTALES GLOBALES BOWTIE:**\n";
        $info .= "- 🔴 Causas identificadas: {$totales['total_causas']}\n";
        $info .= "- 🔵 Consecuencias identificadas: {$totales['total_consecuencias']}\n";
        $info .= "- 🛡️ Controles Preventivos: {$totales['total_prev']}\n";
        $info .= "- 🔧 Controles Mitigadores: {$totales['total_mit']}\n";
        $info .= "- 📐 Dimensiones: {$totales['total_dimensiones']}\n";
        $info .= "- ❓ Preguntas de verificación: {$totales['total_preguntas']}\n";
        
    } catch (PDOException $e) {
        $info .= "Error: " . $e->getMessage() . "\n";
    }
    
    return $info;
}

/**
 * Alertas y problemas detectados
 */
function obtenerAlertas($pdo) {
    $info = "\n### 🚨 ALERTAS Y PROBLEMAS DETECTADOS:\n\n";
    $alertas = [];
    
    try {
        // 1. Controles críticos con bajo avance
        $stmt = $pdo->query("
            SELECT COUNT(*) as total
            FROM carpeta_linea_base 
            WHERE activo = 1 
            AND (criticidad LIKE '%Crítico%' OR criticidad LIKE '%crítico%')
            AND COALESCE(porcentaje_avance, 0) < 50
        ");
        $criticos = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        if ($criticos > 0) {
            $alertas[] = "🔴 **{$criticos} controles CRÍTICOS** con avance menor al 50%";
        }
        
        // 2. Controles con observaciones sin resolver
        $stmt = $pdo->query("
            SELECT COUNT(*) as total
            FROM carpeta_linea_base 
            WHERE activo = 1 AND estado_validacion = 'con_observaciones'
        ");
        $obsTotal = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        if ($obsTotal > 0) {
            $alertas[] = "🟡 **{$obsTotal} controles** con observaciones pendientes de resolver";
        }
        
        // 3. Tareas vencidas
        $stmt = $pdo->query("
            SELECT COUNT(*) as total
            FROM carpeta_tareas 
            WHERE activo = 1 
            AND estado NOT IN ('completada', 'cancelada')
            AND fecha_vencimiento < NOW()
        ");
        $tareasVencidas = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        if ($tareasVencidas > 0) {
            $alertas[] = "⏰ **{$tareasVencidas} tareas vencidas** sin completar";
        }
        
        // 4. Tareas urgentes pendientes
        $stmt = $pdo->query("
            SELECT COUNT(*) as total
            FROM carpeta_tareas 
            WHERE activo = 1 
            AND estado = 'pendiente'
            AND prioridad = 'urgente'
        ");
        $urgentes = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        if ($urgentes > 0) {
            $alertas[] = "⚡ **{$urgentes} tareas URGENTES** pendientes";
        }
        
        // 5. Empresas con bajo cumplimiento
        $stmt = $pdo->query("
            SELECT COUNT(*) as total FROM (
                SELECT c.id
                FROM carpetas c
                LEFT JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
                WHERE c.nivel = 2 AND c.activo = 1
                GROUP BY c.id
                HAVING AVG(COALESCE(lb.porcentaje_avance, 0)) < 30 AND COUNT(lb.id) > 0
            ) as empresas_bajo
        ");
        $empresasBajo = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        if ($empresasBajo > 0) {
            $alertas[] = "📉 **{$empresasBajo} empresas** con cumplimiento menor al 30%";
        }
        
        // 6. Controles sin verificador asignado
        $stmt = $pdo->query("
            SELECT COUNT(*) as total
            FROM carpeta_linea_base 
            WHERE activo = 1 
            AND (verificador_responsable IS NULL OR verificador_responsable = '')
        ");
        $sinVerificador = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        if ($sinVerificador > 0) {
            $alertas[] = "👤 **{$sinVerificador} controles** sin verificador responsable asignado";
        }
        
        if (count($alertas) > 0) {
            foreach ($alertas as $alerta) {
                $info .= "• {$alerta}\n";
            }
        } else {
            $info .= "✅ No se detectaron alertas críticas en este momento.\n";
        }
        
    } catch (PDOException $e) {
        $info .= "Error verificando alertas.\n";
    }
    
    return $info;
}

/**
 * Generar contexto completo del sistema para Gemini
 */
function generarContextoSistema($pdo, $carpetaId = null) {
    $contexto = "
# SISTEMA DE GESTIÓN DE RIESGOS CRÍTICOS - CODELCO

Eres un asistente experto en Gestión de Riesgos Críticos, Seguridad Industrial y la metodología Bowtie. 
Tu rol es analizar datos y proporcionar insights valiosos sobre el estado del sistema SSO.

## 📊 DATOS EN TIEMPO REAL DEL SISTEMA:
";
    
    // Agregar datos reales
    $contexto .= obtenerResumenEjecutivo($pdo);
    $contexto .= obtenerAlertas($pdo);
    
    // Si hay carpeta específica, agregar su contexto
    if ($carpetaId) {
        $contexto .= obtenerContextoCarpetaDetallado($pdo, $carpetaId);
    }
    
    $contexto .= "

## 🎯 INSTRUCCIONES:
1. Responde SIEMPRE en español
2. Usa los datos reales proporcionados arriba
3. Sé específico con números y porcentajes
4. Identifica problemas y sugiere mejoras
5. Usa emojis para hacer las respuestas más claras
6. Si te piden análisis específicos, genera las estadísticas relevantes
7. Prioriza la seguridad en tus recomendaciones
";
    
    return $contexto;
}

/**
 * Obtener contexto detallado de una carpeta
 */
function obtenerContextoCarpetaDetallado($pdo, $carpetaId) {
    $contexto = "\n### 📂 CONTEXTO DE LA CARPETA ACTUAL:\n";
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM carpetas WHERE id = ?");
        $stmt->execute([$carpetaId]);
        $carpeta = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($carpeta) {
            $contexto .= "Nombre: {$carpeta['nombre']}\n";
            $contexto .= "Nivel: {$carpeta['nivel']}\n";
            if ($carpeta['evento_no_deseado']) $contexto .= "Evento No Deseado: {$carpeta['evento_no_deseado']}\n";
            if ($carpeta['evento_riesgo']) $contexto .= "Evento de Riesgo: {$carpeta['evento_riesgo']}\n";
        }
    } catch (PDOException $e) {}
    
    return $contexto;
}

/**
 * Buscar información relevante según la pregunta
 */
function buscarInformacionRelevante($pdo, $mensaje) {
    $info = "";
    $mensajeLower = mb_strtolower($mensaje, 'UTF-8');
    
    // Detectar tipo de análisis solicitado
    if (preg_match('/(resumen|ejecutivo|general|dashboard|overview)/i', $mensaje)) {
        $info .= obtenerResumenEjecutivo($pdo);
    }
    
    if (preg_match('/(empresa|contratista|cumplimiento|ranking|comparar)/i', $mensaje)) {
        $info .= obtenerAnalisisEmpresas($pdo);
    }
    
    if (preg_match('/(dimensión|dimension|diseño|implementación|entrenamiento)/i', $mensaje)) {
        $info .= obtenerAnalisisDimensiones($pdo);
    }
    
    if (preg_match('/(crítico|critico|criticidad|prioridad|riesgo alto)/i', $mensaje)) {
        $info .= obtenerAnalisisCriticidad($pdo);
    }
    
    if (preg_match('/(jerarquía|jerarquia|eliminación|sustitución|ingeniería|epp)/i', $mensaje)) {
        $info .= obtenerAnalisisJerarquia($pdo);
    }
    
    if (preg_match('/(tarea|pendiente|vencida|asignación|urgente)/i', $mensaje)) {
        $info .= obtenerAnalisisTareas($pdo);
    }
    
    if (preg_match('/(responsable|validador|verificador|dueño|quien|quién)/i', $mensaje)) {
        $info .= obtenerAnalisisResponsables($pdo);
    }
    
    if (preg_match('/(bowtie|causa|consecuencia|preventivo|mitigador)/i', $mensaje)) {
        $info .= obtenerAnalisisBowtie($pdo);
    }
    
    if (preg_match('/(alerta|problema|atención|urgente|crítico)/i', $mensaje)) {
        $info .= obtenerAlertas($pdo);
    }
    
    // Si no se detectó nada específico, dar resumen general
    if (empty($info)) {
        $info .= obtenerResumenEjecutivo($pdo);
        $info .= obtenerAlertas($pdo);
    }
    
    return $info;
}

/**
 * Llamar a la API de Gemini
 */
function llamarGeminiAPI($mensaje, $contexto, $apiKey, $apiUrl) {
    if (empty($apiKey) || $apiKey === 'TU_API_KEY_AQUI') {
        return null;
    }
    
    $url = $apiUrl . "?key=" . $apiKey;
    
    $data = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $contexto . "\n\n---\n\n## PREGUNTA DEL USUARIO:\n" . $mensaje]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.7,
            'topK' => 40,
            'topP' => 0.95,
            'maxOutputTokens' => 4096,
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            return $result['candidates'][0]['content']['parts'][0]['text'];
        }
    }
    
    return null;
}

// =====================================================
// PROCESAR SOLICITUDES
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $message = trim($data['message'] ?? '');
    $carpetaId = $data['carpeta_id'] ?? null;
    
    if (empty($message)) {
        http_response_code(400);
        echo json_encode(['error' => 'Mensaje vacío'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Generar contexto base
        $contexto = generarContextoSistema($pdo, $carpetaId);
        
        // Buscar información específica según la pregunta
        $infoRelevante = buscarInformacionRelevante($pdo, $message);
        $contexto .= "\n\n## 📈 DATOS ESPECÍFICOS PARA TU CONSULTA:\n" . $infoRelevante;
        
        // Llamar a Gemini
        $respuesta = llamarGeminiAPI($message, $contexto, $GEMINI_API_KEY, $GEMINI_API_URL);
        
        if ($respuesta) {
            echo json_encode([
                'success' => true,
                'response' => $respuesta,
                'sugerencias' => [
                    "Dame un resumen ejecutivo del sistema",
                    "¿Cuáles empresas tienen menor cumplimiento?",
                    "¿Qué controles críticos necesitan atención?",
                    "Analiza las tareas pendientes",
                    "¿Cómo está el avance por dimensión?",
                    "¿Qué alertas hay en el sistema?"
                ],
                'source' => 'gemini'
            ], JSON_UNESCAPED_UNICODE);
        } else {
            // Fallback: devolver los datos directamente
            echo json_encode([
                'success' => true,
                'response' => "📊 **Análisis del Sistema:**\n" . $infoRelevante,
                'sugerencias' => [
                    "Dame el resumen ejecutivo",
                    "Análisis por empresa",
                    "Ver alertas del sistema"
                ],
                'source' => 'local'
            ], JSON_UNESCAPED_UNICODE);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// GET: Configuración inicial
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'success' => true,
        'sugerencias' => [
            "Dame un resumen ejecutivo del sistema",
            "¿Cuál es el cumplimiento global por empresa?",
            "¿Qué controles críticos tienen bajo avance?",
            "Analiza el avance por dimensión (Diseño, Implementación, Entrenamiento)",
            "¿Qué tareas están vencidas o urgentes?",
            "¿Quiénes son los validadores más activos?",
            "Muéstrame las alertas del sistema",
            "Analiza la jerarquía de controles"
        ],
        'mensaje_bienvenida' => "¡Hola! 👋 Soy tu asistente de análisis de Riesgos Críticos. Tengo acceso a todos los datos del sistema y puedo darte insights sobre cumplimiento, alertas, tareas y más. ¿Qué te gustaría analizar?",
        'gemini_activo' => true
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
