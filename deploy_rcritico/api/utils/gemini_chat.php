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
$GEMINI_MODEL = 'gemini-1.5-flash'; // Modelo a usar (flash es más rápido, pro es más potente)
$GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{$GEMINI_MODEL}:generateContent";

// =====================================================
// CONTEXTO ENRIQUECIDO DEL SISTEMA
// =====================================================
function generarContextoSistema($pdo, $carpetaId = null) {
    $contexto = "
# SISTEMA DE GESTIÓN DE RIESGOS CRÍTICOS - CODELCO

Eres un asistente experto en Gestión de Riesgos Críticos y Seguridad Industrial. Tu rol es ayudar a los usuarios del sistema SSO (Seguridad y Salud Ocupacional) de Codelco.

## 📚 CONOCIMIENTOS BASE

### 1. METODOLOGÍA BOWTIE
El análisis Bowtie es una herramienta visual de gestión de riesgos que muestra:
- **CAUSAS** (lado izquierdo): Factores que pueden provocar el evento no deseado
- **CONTROLES PREVENTIVOS (CCP)**: Barreras que previenen que las causas lleguen al evento central
- **EVENTO CENTRAL/NO DESEADO**: El peligro o evento crítico principal (ejemplo: contacto con energía eléctrica)
- **CONTROLES MITIGADORES (CCM)**: Barreras que reducen las consecuencias si ocurre el evento
- **CONSECUENCIAS** (lado derecho): Resultados potenciales si el evento ocurre (lesiones, fatalidades, daños)

### 2. ESTRUCTURA DE CARPETAS (NIVELES)
- **Nivel 1**: Riesgos Críticos principales (ej: RC01 - Contacto Energía Eléctrica, RC02 - Caída de Altura)
- **Nivel 2**: Subcarpetas por empresa/contratista bajo cada Riesgo Crítico
- Cada subcarpeta tiene: Archivos, Línea Base, Foro, Tareas

### 3. CONTROLES CRÍTICOS
Los controles se clasifican en:
- **CCP (Control Crítico Preventivo)**: Evita que ocurra el evento. Ejemplo: Bloqueo LOTO, Permisos de trabajo
- **CCM (Control Crítico Mitigador)**: Reduce consecuencias. Ejemplo: EPP, sistemas de emergencia

Cada control tiene:
- Código único (CCP1, CCP2, CCM1, etc.)
- Descripción detallada del control
- Criticidad: Crítico / No crítico
- Jerarquía: Eliminación > Sustitución > Ingeniería > Administrativo > EPP
- Responsable del control

### 4. DIMENSIONES DE VERIFICACIÓN
Cada control se evalúa en 3 dimensiones:
- **DISEÑO**: ¿El control está correctamente diseñado? (documentación, especificaciones)
- **IMPLEMENTACIÓN**: ¿El control está implementado en terreno? (instalado, operativo, mantenido)
- **ENTRENAMIENTO**: ¿El personal está capacitado? (competencias, certificaciones)

Cada dimensión tiene preguntas de verificación que requieren evidencias documentadas.

### 5. LÍNEA BASE
La Línea Base registra el estado de implementación de controles por empresa:
- % de avance de implementación (0-100%)
- Estado de validación: Validado ✅ / Con observaciones 🟡 / Pendiente ⚪
- Verificador responsable y fechas
- Ponderación para cálculo de promedios
- Foro de seguimiento con comentarios y archivos adjuntos

### 6. ROLES Y PERMISOS DEL SISTEMA
- **Super Admin**: Control total, gestiona usuarios/proyectos/empresas, valida en todos los niveles
- **Administrador**: Gestiona su proyecto, edita y valida en nivel 2
- **Trabajador**: Edita % de avance en nivel 2, comenta en foro, no puede validar
- **Visita**: Solo visualización, sin permisos de edición

### 7. PESTAÑAS DEL SISTEMA
- **Guía Controles Críticos**: Documentación y guías descargables
- **Riesgo Crítico**: Información del riesgo, evento no deseado, evento de riesgo
- **BOWTIE**: Diagrama visual con causas, controles y consecuencias
- **Diagrama**: Visualización tipo flowchart de toda la estructura
- **Línea Base**: Registro de implementación de controles por empresa
- **Archivos**: Documentos adjuntos organizados en carpetas
- **Foro**: Comunicación y seguimiento entre participantes
- **Tareas**: Gestión de tareas con responsables y fechas

## 📊 DATOS EN TIEMPO REAL DEL SISTEMA
";

    // Agregar estadísticas generales del sistema
    try {
        // Total de riesgos críticos
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM carpetas WHERE nivel = 1 AND activo = 1");
        $totalRC = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Total de empresas/subcarpetas
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM carpetas WHERE nivel = 2 AND activo = 1");
        $totalEmpresas = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Total de controles en línea base
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM carpeta_linea_base WHERE activo = 1");
        $totalControles = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Promedio general de avance
        $stmt = $pdo->query("SELECT AVG(COALESCE(porcentaje_avance, 0)) as promedio FROM carpeta_linea_base WHERE activo = 1");
        $promedioAvance = round($stmt->fetch(PDO::FETCH_ASSOC)['promedio'] ?? 0, 1);
        
        // Controles validados
        $stmt = $pdo->query("SELECT 
            SUM(CASE WHEN estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados,
            SUM(CASE WHEN estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as observaciones
            FROM carpeta_linea_base WHERE activo = 1");
        $estadosVal = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $contexto .= "\n### ESTADÍSTICAS GENERALES ACTUALES:
- Total Riesgos Críticos (Nivel 1): {$totalRC}
- Total Empresas/Subcarpetas (Nivel 2): {$totalEmpresas}
- Total Controles en Línea Base: {$totalControles}
- Promedio General de Avance: {$promedioAvance}%
- Controles Validados: " . ($estadosVal['validados'] ?? 0) . "
- Controles Con Observaciones: " . ($estadosVal['observaciones'] ?? 0) . "
";
    } catch (PDOException $e) {
        // Continuar sin estadísticas si hay error
    }

    // Agregar lista de riesgos críticos
    try {
        $stmt = $pdo->query("
            SELECT c.id, c.nombre, c.evento_no_deseado, c.evento_riesgo
            FROM carpetas c
            WHERE c.nivel = 1 AND c.activo = 1
            ORDER BY c.nombre
            LIMIT 20
        ");
        $riesgos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($riesgos) > 0) {
            $contexto .= "\n### RIESGOS CRÍTICOS REGISTRADOS EN EL SISTEMA:\n";
            foreach ($riesgos as $i => $r) {
                $contexto .= "- **{$r['nombre']}**: ";
                if ($r['evento_no_deseado']) {
                    $contexto .= "Evento No Deseado: {$r['evento_no_deseado']}";
                }
                $contexto .= "\n";
            }
        }
    } catch (PDOException $e) {
        // Continuar sin lista si hay error
    }

    // Si hay una carpeta específica, agregar contexto detallado
    if ($carpetaId) {
        $contexto .= obtenerContextoCarpeta($pdo, $carpetaId);
    }

    $contexto .= "

## 🎯 INSTRUCCIONES PARA RESPONDER

1. **Responde SIEMPRE en español** de forma clara y profesional
2. **Usa los datos reales del sistema** cuando estén disponibles
3. **Sé específico**: Si preguntan por un riesgo, da información detallada si la tienes
4. **Ofrece contexto adicional**: Explica conceptos relacionados cuando sea útil
5. **Sugiere acciones**: Si detectas problemas, sugiere mejoras
6. **Usa emojis** para hacer las respuestas más visuales y claras
7. **Formatea bien**: Usa listas, negritas y estructura clara
8. Si no tienes información específica, indica que el usuario puede consultarla en el sistema
9. Para temas de seguridad industrial, prioriza siempre la prevención y el cumplimiento normativo

## ⚠️ IMPORTANTE
- NO inventes datos específicos que no estén en el contexto
- Si te preguntan algo muy específico que no tienes, indica cómo encontrarlo en el sistema
- Mantén un tono profesional pero accesible
";

    return $contexto;
}

/**
 * Obtener contexto detallado de una carpeta específica
 */
function obtenerContextoCarpeta($pdo, $carpetaId) {
    $contexto = "\n### 📂 CONTEXTO DE LA CARPETA ACTUAL:\n";
    
    try {
        // Información de la carpeta
        $stmt = $pdo->prepare("
            SELECT c.*, p.nombre as proyecto_nombre
            FROM carpetas c
            LEFT JOIN proyectos p ON c.proyecto_id = p.proyecto_id
            WHERE c.id = ?
        ");
        $stmt->execute([$carpetaId]);
        $carpeta = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($carpeta) {
            $contexto .= "**Nombre**: {$carpeta['nombre']}\n";
            $contexto .= "**Nivel**: {$carpeta['nivel']}\n";
            if ($carpeta['evento_no_deseado']) {
                $contexto .= "**Evento No Deseado**: {$carpeta['evento_no_deseado']}\n";
            }
            if ($carpeta['evento_riesgo']) {
                $contexto .= "**Evento de Riesgo**: {$carpeta['evento_riesgo']}\n";
            }
            if ($carpeta['informacion_riesgo']) {
                $contexto .= "**Información del Riesgo**: {$carpeta['informacion_riesgo']}\n";
            }
            
            // Si es nivel 1, obtener Bowtie
            if ($carpeta['nivel'] == 1) {
                $bowtie = obtenerBowtieResumen($pdo, $carpetaId);
                if ($bowtie) {
                    $contexto .= $bowtie;
                }
                
                // Subcarpetas (empresas)
                $stmt = $pdo->prepare("SELECT nombre FROM carpetas WHERE carpeta_padre_id = ? AND activo = 1");
                $stmt->execute([$carpetaId]);
                $subs = $stmt->fetchAll(PDO::FETCH_COLUMN);
                if (count($subs) > 0) {
                    $contexto .= "**Empresas/Subcarpetas**: " . implode(", ", $subs) . "\n";
                }
            }
            
            // Estadísticas de línea base
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total,
                    AVG(COALESCE(porcentaje_avance, 0)) as promedio,
                    SUM(CASE WHEN estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados
                FROM carpeta_linea_base
                WHERE carpeta_id = ? AND activo = 1
            ");
            $stmt->execute([$carpetaId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($stats && $stats['total'] > 0) {
                $contexto .= "\n**📊 Línea Base de esta carpeta:**\n";
                $contexto .= "- Total controles: {$stats['total']}\n";
                $contexto .= "- Promedio avance: " . round($stats['promedio'], 1) . "%\n";
                $contexto .= "- Validados: {$stats['validados']}\n";
            }
        }
    } catch (PDOException $e) {
        // Continuar sin contexto si hay error
    }
    
    return $contexto;
}

/**
 * Obtener resumen del Bowtie
 */
function obtenerBowtieResumen($pdo, $carpetaId) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM carpeta_bowtie WHERE carpeta_id = ? AND activo = 1");
        $stmt->execute([$carpetaId]);
        $bowtie = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$bowtie) return "";
        
        $bowtieId = $bowtie['id'];
        $resumen = "\n**🎯 ANÁLISIS BOWTIE:**\n";
        
        if ($bowtie['evento_central']) {
            $resumen .= "- Evento Central: {$bowtie['evento_central']}\n";
        }
        
        // Contar elementos
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bowtie_causas WHERE bowtie_id = ? AND activo = 1");
        $stmt->execute([$bowtieId]);
        $causas = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bowtie_consecuencias WHERE bowtie_id = ? AND activo = 1");
        $stmt->execute([$bowtieId]);
        $consecuencias = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bowtie_controles_preventivos WHERE bowtie_id = ? AND activo = 1");
        $stmt->execute([$bowtieId]);
        $ccps = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bowtie_controles_mitigadores WHERE bowtie_id = ? AND activo = 1");
        $stmt->execute([$bowtieId]);
        $ccms = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $resumen .= "- Causas identificadas: {$causas}\n";
        $resumen .= "- Controles Preventivos (CCP): {$ccps}\n";
        $resumen .= "- Controles Mitigadores (CCM): {$ccms}\n";
        $resumen .= "- Consecuencias identificadas: {$consecuencias}\n";
        
        // Listar controles preventivos
        if ($ccps > 0) {
            $stmt = $pdo->prepare("SELECT codigo, descripcion FROM bowtie_controles_preventivos WHERE bowtie_id = ? AND activo = 1 ORDER BY orden LIMIT 10");
            $stmt->execute([$bowtieId]);
            $controles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $resumen .= "\n**Controles Preventivos:**\n";
            foreach ($controles as $c) {
                $cod = $c['codigo'] ? "[{$c['codigo']}] " : "";
                $resumen .= "  - {$cod}{$c['descripcion']}\n";
            }
        }
        
        // Listar controles mitigadores
        if ($ccms > 0) {
            $stmt = $pdo->prepare("SELECT codigo, descripcion FROM bowtie_controles_mitigadores WHERE bowtie_id = ? AND activo = 1 ORDER BY orden LIMIT 10");
            $stmt->execute([$bowtieId]);
            $controles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $resumen .= "\n**Controles Mitigadores:**\n";
            foreach ($controles as $c) {
                $cod = $c['codigo'] ? "[{$c['codigo']}] " : "";
                $resumen .= "  - {$cod}{$c['descripcion']}\n";
            }
        }
        
        return $resumen;
    } catch (PDOException $e) {
        return "";
    }
}

/**
 * Buscar información relevante en la base de datos según la pregunta
 */
function buscarInformacionRelevante($pdo, $mensaje) {
    $info = "";
    $mensajeLower = mb_strtolower($mensaje, 'UTF-8');
    
    // Si pregunta por un riesgo específico, buscarlo
    if (preg_match('/(rc\d+|riesgo|energía|eléctrica|altura|caída|vehiculo|explosión|atrapamiento)/i', $mensaje, $matches)) {
        try {
            $busqueda = "%" . str_replace(['rc', 'riesgo'], '', strtolower($matches[0])) . "%";
            $stmt = $pdo->prepare("
                SELECT c.id, c.nombre, c.evento_no_deseado, c.evento_riesgo, c.informacion_riesgo
                FROM carpetas c
                WHERE c.nivel = 1 AND c.activo = 1 
                AND (LOWER(c.nombre) LIKE ? OR LOWER(c.evento_no_deseado) LIKE ? OR LOWER(c.evento_riesgo) LIKE ?)
                LIMIT 3
            ");
            $stmt->execute([$busqueda, $busqueda, $busqueda]);
            $riesgos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($riesgos) > 0) {
                $info .= "\n### 🔍 INFORMACIÓN ENCONTRADA:\n";
                foreach ($riesgos as $r) {
                    $info .= "**{$r['nombre']}**\n";
                    if ($r['evento_no_deseado']) $info .= "- Evento No Deseado: {$r['evento_no_deseado']}\n";
                    if ($r['evento_riesgo']) $info .= "- Evento de Riesgo: {$r['evento_riesgo']}\n";
                    if ($r['informacion_riesgo']) $info .= "- Info: " . substr($r['informacion_riesgo'], 0, 200) . "...\n";
                    
                    // Obtener Bowtie resumido
                    $info .= obtenerBowtieResumen($pdo, $r['id']);
                    $info .= "\n";
                }
            }
        } catch (PDOException $e) {
            // Continuar sin información adicional
        }
    }
    
    // Si pregunta por CUMPLIMIENTO o RANKING de empresas
    if (preg_match('/(cumplimiento|ranking|mejor|peor|comparar|comparativa|todas las empresas|global)/i', $mensaje)) {
        $info .= obtenerAnalisisCumplimientoEmpresas($pdo);
    }
    
    // Si pregunta por empresas/contratistas específicos
    if (preg_match('/(empresa|contratista|subcarpeta)/i', $mensaje)) {
        try {
            // Obtener empresas con sus estadísticas
            $stmt = $pdo->query("
                SELECT 
                    c.id,
                    c.nombre as empresa,
                    p.nombre as riesgo_critico,
                    COUNT(lb.id) as total_controles,
                    ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as promedio_avance,
                    SUM(CASE WHEN lb.estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados,
                    SUM(CASE WHEN lb.estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as observaciones,
                    SUM(CASE WHEN lb.estado_validacion IS NULL OR lb.estado_validacion = '' THEN 1 ELSE 0 END) as pendientes
                FROM carpetas c
                LEFT JOIN carpetas p ON c.carpeta_padre_id = p.id
                LEFT JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
                WHERE c.nivel = 2 AND c.activo = 1
                GROUP BY c.id, c.nombre, p.nombre
                ORDER BY promedio_avance DESC
                LIMIT 30
            ");
            $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($empresas) > 0) {
                $info .= "\n### 🏢 EMPRESAS CON ESTADÍSTICAS:\n";
                foreach ($empresas as $e) {
                    $barra = $e['total_controles'] > 0 ? 
                        str_repeat("█", round($e['promedio_avance'] / 10)) . str_repeat("░", 10 - round($e['promedio_avance'] / 10)) : 
                        "Sin datos";
                    $info .= "**{$e['empresa']}** ({$e['riesgo_critico']})\n";
                    $info .= "  - Avance: {$e['promedio_avance']}% [{$barra}]\n";
                    $info .= "  - Controles: {$e['total_controles']} (✅{$e['validados']} 🟡{$e['observaciones']} ⚪{$e['pendientes']})\n";
                }
            }
        } catch (PDOException $e) {
            // Continuar
        }
    }
    
    // Si pregunta por estadísticas o avance general
    if (preg_match('/(estadística|avance|porcentaje|cuánto|validado|progreso)/i', $mensaje)) {
        try {
            $stmt = $pdo->query("
                SELECT 
                    p.nombre as riesgo,
                    COUNT(*) as total_controles,
                    ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as promedio
                FROM carpeta_linea_base lb
                JOIN carpetas c ON lb.carpeta_id = c.id
                JOIN carpetas p ON c.carpeta_padre_id = p.id
                WHERE lb.activo = 1 AND c.activo = 1
                GROUP BY p.id, p.nombre
                ORDER BY promedio DESC
                LIMIT 10
            ");
            $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($stats) > 0) {
                $info .= "\n### 📊 AVANCE POR RIESGO CRÍTICO:\n";
                foreach ($stats as $s) {
                    $barra = str_repeat("█", round($s['promedio'] / 10)) . str_repeat("░", 10 - round($s['promedio'] / 10));
                    $info .= "- **{$s['riesgo']}**: {$s['promedio']}% [{$barra}] ({$s['total_controles']} controles)\n";
                }
            }
        } catch (PDOException $e) {
            // Continuar
        }
    }
    
    // Si pregunta por controles pendientes o con problemas
    if (preg_match('/(pendiente|observación|problema|crítico|atrasado|sin validar|falta)/i', $mensaje)) {
        $info .= obtenerControlesPendientes($pdo);
    }
    
    // Si pregunta por dimensiones específicas (diseño, implementación, entrenamiento)
    if (preg_match('/(diseño|implementación|implementacion|entrenamiento|capacitación|capacitacion)/i', $mensaje)) {
        $info .= obtenerAnalisisPorDimension($pdo);
    }
    
    return $info;
}

/**
 * Obtener análisis de cumplimiento por empresa a nivel global
 */
function obtenerAnalisisCumplimientoEmpresas($pdo) {
    $info = "\n### 📊 ANÁLISIS DE CUMPLIMIENTO GLOBAL POR EMPRESA:\n\n";
    
    try {
        // Ranking de empresas por cumplimiento
        $stmt = $pdo->query("
            SELECT 
                c.nombre as empresa,
                p.nombre as riesgo_critico,
                COUNT(lb.id) as total_controles,
                ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as cumplimiento,
                SUM(CASE WHEN lb.estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados,
                SUM(CASE WHEN lb.estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as con_observaciones,
                SUM(CASE WHEN lb.estado_validacion IS NULL OR lb.estado_validacion = '' THEN 1 ELSE 0 END) as sin_validar,
                ROUND(SUM(CASE WHEN lb.estado_validacion = 'validado' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(lb.id), 0), 1) as pct_validados
            FROM carpetas c
            LEFT JOIN carpetas p ON c.carpeta_padre_id = p.id
            LEFT JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
            WHERE c.nivel = 2 AND c.activo = 1
            GROUP BY c.id, c.nombre, p.nombre
            HAVING total_controles > 0
            ORDER BY cumplimiento DESC
        ");
        $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($empresas) > 0) {
            // Calcular promedio global
            $totalCumplimiento = 0;
            $totalEmpresas = count($empresas);
            foreach ($empresas as $e) {
                $totalCumplimiento += $e['cumplimiento'];
            }
            $promedioGlobal = round($totalCumplimiento / $totalEmpresas, 1);
            
            $info .= "**🌐 PROMEDIO GLOBAL DE CUMPLIMIENTO: {$promedioGlobal}%**\n\n";
            
            // Top 5 mejores
            $info .= "**🏆 TOP 5 MEJORES EMPRESAS:**\n";
            $top5 = array_slice($empresas, 0, 5);
            foreach ($top5 as $i => $e) {
                $medalla = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][$i];
                $barra = str_repeat("█", round($e['cumplimiento'] / 10)) . str_repeat("░", 10 - round($e['cumplimiento'] / 10));
                $info .= "{$medalla} **{$e['empresa']}**: {$e['cumplimiento']}% [{$barra}]\n";
                $info .= "   📁 {$e['riesgo_critico']} | Controles: {$e['total_controles']} | ✅{$e['validados']} 🟡{$e['con_observaciones']} ⚪{$e['sin_validar']}\n";
            }
            
            // Bottom 5 (si hay más de 5 empresas)
            if (count($empresas) > 5) {
                $info .= "\n**⚠️ EMPRESAS QUE REQUIEREN ATENCIÓN:**\n";
                $bottom5 = array_slice($empresas, -5);
                $bottom5 = array_reverse($bottom5);
                foreach ($bottom5 as $e) {
                    $barra = str_repeat("█", round($e['cumplimiento'] / 10)) . str_repeat("░", 10 - round($e['cumplimiento'] / 10));
                    $info .= "⚠️ **{$e['empresa']}**: {$e['cumplimiento']}% [{$barra}]\n";
                    $info .= "   📁 {$e['riesgo_critico']} | Pendientes: {$e['sin_validar']} | Con obs: {$e['con_observaciones']}\n";
                }
            }
            
            // Resumen estadístico
            $info .= "\n**📈 RESUMEN ESTADÍSTICO:**\n";
            $cumplimientos = array_column($empresas, 'cumplimiento');
            $info .= "- Empresas evaluadas: " . count($empresas) . "\n";
            $info .= "- Cumplimiento máximo: " . max($cumplimientos) . "%\n";
            $info .= "- Cumplimiento mínimo: " . min($cumplimientos) . "%\n";
            $info .= "- Promedio global: {$promedioGlobal}%\n";
            
            // Empresas por rango de cumplimiento
            $excelente = count(array_filter($cumplimientos, fn($c) => $c >= 80));
            $bueno = count(array_filter($cumplimientos, fn($c) => $c >= 60 && $c < 80));
            $regular = count(array_filter($cumplimientos, fn($c) => $c >= 40 && $c < 60));
            $bajo = count(array_filter($cumplimientos, fn($c) => $c < 40));
            
            $info .= "\n**📊 DISTRIBUCIÓN POR NIVEL:**\n";
            $info .= "- 🟢 Excelente (≥80%): {$excelente} empresas\n";
            $info .= "- 🔵 Bueno (60-79%): {$bueno} empresas\n";
            $info .= "- 🟡 Regular (40-59%): {$regular} empresas\n";
            $info .= "- 🔴 Bajo (<40%): {$bajo} empresas\n";
        } else {
            $info .= "No hay datos de cumplimiento disponibles.\n";
        }
    } catch (PDOException $e) {
        $info .= "Error al obtener análisis: " . $e->getMessage() . "\n";
    }
    
    return $info;
}

/**
 * Obtener controles pendientes o con observaciones
 */
function obtenerControlesPendientes($pdo) {
    $info = "\n### ⚠️ CONTROLES QUE REQUIEREN ATENCIÓN:\n\n";
    
    try {
        // Controles con observaciones
        $stmt = $pdo->query("
            SELECT 
                lb.codigo,
                lb.pregunta,
                lb.porcentaje_avance,
                lb.comentario_validacion,
                c.nombre as empresa,
                p.nombre as riesgo
            FROM carpeta_linea_base lb
            JOIN carpetas c ON lb.carpeta_id = c.id
            JOIN carpetas p ON c.carpeta_padre_id = p.id
            WHERE lb.activo = 1 AND lb.estado_validacion = 'con_observaciones'
            ORDER BY lb.porcentaje_avance ASC
            LIMIT 10
        ");
        $conObservaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($conObservaciones) > 0) {
            $info .= "**🟡 CONTROLES CON OBSERVACIONES:**\n";
            foreach ($conObservaciones as $ctrl) {
                $info .= "- **{$ctrl['codigo']}** ({$ctrl['empresa']} - {$ctrl['riesgo']})\n";
                $info .= "  Avance: {$ctrl['porcentaje_avance']}%\n";
                if ($ctrl['comentario_validacion']) {
                    $info .= "  Obs: " . substr($ctrl['comentario_validacion'], 0, 100) . "\n";
                }
            }
        }
        
        // Controles sin validar con bajo avance
        $stmt = $pdo->query("
            SELECT 
                lb.codigo,
                lb.pregunta,
                lb.porcentaje_avance,
                c.nombre as empresa,
                p.nombre as riesgo
            FROM carpeta_linea_base lb
            JOIN carpetas c ON lb.carpeta_id = c.id
            JOIN carpetas p ON c.carpeta_padre_id = p.id
            WHERE lb.activo = 1 
            AND (lb.estado_validacion IS NULL OR lb.estado_validacion = '')
            AND COALESCE(lb.porcentaje_avance, 0) < 50
            ORDER BY lb.porcentaje_avance ASC
            LIMIT 10
        ");
        $sinValidar = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($sinValidar) > 0) {
            $info .= "\n**⚪ CONTROLES SIN VALIDAR CON BAJO AVANCE (<50%):**\n";
            foreach ($sinValidar as $ctrl) {
                $info .= "- **{$ctrl['codigo']}** ({$ctrl['empresa']}): {$ctrl['porcentaje_avance']}%\n";
            }
        }
        
        // Resumen
        $stmt = $pdo->query("
            SELECT 
                SUM(CASE WHEN estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as total_obs,
                SUM(CASE WHEN (estado_validacion IS NULL OR estado_validacion = '') AND COALESCE(porcentaje_avance, 0) < 50 THEN 1 ELSE 0 END) as total_bajo
            FROM carpeta_linea_base WHERE activo = 1
        ");
        $totales = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $info .= "\n**📊 TOTALES:**\n";
        $info .= "- Controles con observaciones: {$totales['total_obs']}\n";
        $info .= "- Controles con bajo avance sin validar: {$totales['total_bajo']}\n";
        
    } catch (PDOException $e) {
        $info .= "Error al obtener controles pendientes.\n";
    }
    
    return $info;
}

/**
 * Obtener análisis por dimensión
 */
function obtenerAnalisisPorDimension($pdo) {
    $info = "\n### 📐 ANÁLISIS POR DIMENSIÓN DE VERIFICACIÓN:\n\n";
    
    try {
        $stmt = $pdo->query("
            SELECT 
                lb.dimension,
                COUNT(*) as total,
                ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as promedio,
                SUM(CASE WHEN lb.estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados
            FROM carpeta_linea_base lb
            WHERE lb.activo = 1 AND lb.dimension IS NOT NULL AND lb.dimension != ''
            GROUP BY lb.dimension
            ORDER BY promedio DESC
        ");
        $dimensiones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($dimensiones) > 0) {
            foreach ($dimensiones as $d) {
                $icono = '';
                $dim = strtoupper($d['dimension']);
                if (strpos($dim, 'DISEÑO') !== false || strpos($dim, 'DISENO') !== false) $icono = '📝';
                elseif (strpos($dim, 'IMPLEMENT') !== false) $icono = '🔧';
                elseif (strpos($dim, 'ENTRENA') !== false || strpos($dim, 'CAPACIT') !== false) $icono = '👨‍🎓';
                else $icono = '📋';
                
                $barra = str_repeat("█", round($d['promedio'] / 10)) . str_repeat("░", 10 - round($d['promedio'] / 10));
                $info .= "{$icono} **{$d['dimension']}**\n";
                $info .= "   Avance: {$d['promedio']}% [{$barra}]\n";
                $info .= "   Controles: {$d['total']} | Validados: {$d['validados']}\n\n";
            }
        } else {
            $info .= "No hay datos de dimensiones disponibles.\n";
        }
    } catch (PDOException $e) {
        $info .= "Error al obtener análisis por dimensión.\n";
    }
    
    return $info;
}

/**
 * Llamar a la API de Gemini
 */
function llamarGeminiAPI($mensaje, $contexto, $apiKey, $apiUrl) {
    // Si no hay API key válida, usar respuesta local
    if (empty($apiKey) || $apiKey === 'TU_API_KEY_AQUI') {
        return null; // Indicar que debe usar respuesta local
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
            'maxOutputTokens' => 2048,
        ],
        'safetySettings' => [
            ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
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
    
    return null; // Error, usar respuesta local
}

/**
 * Generar respuesta local inteligente (fallback)
 */
function generarRespuestaLocal($pdo, $mensaje, $carpetaId = null) {
    $messageLower = mb_strtolower($mensaje, 'UTF-8');
    $response = '';
    $sugerencias = [];
    
    // Saludo
    if (preg_match('/(hola|buenos días|buenas tardes|buenas noches|hey|hi)/i', $mensaje)) {
        $response = "¡Hola! 👋 Soy tu asistente de Riesgos Críticos y Análisis Bowtie.\n\n";
        $response .= "Puedo ayudarte con:\n";
        $response .= "• 📊 Información sobre riesgos críticos del sistema\n";
        $response .= "• 🎯 Análisis Bowtie (causas, controles, consecuencias)\n";
        $response .= "• ✅ Estado de implementación de controles\n";
        $response .= "• 📋 Estadísticas de línea base\n";
        $response .= "• 🔍 Dimensiones y verificación de controles\n";
        $response .= "• 👥 Roles y permisos del sistema\n\n";
        $response .= "¿Sobre qué te gustaría saber más?";
        
        $sugerencias = [
            "¿Qué riesgos críticos hay en el sistema?",
            "Explícame qué es el análisis Bowtie",
            "¿Cuál es el avance general de implementación?",
            "¿Qué empresas están registradas?"
        ];
        
        return ['response' => $response, 'sugerencias' => $sugerencias];
    }
    
    // Listar riesgos críticos
    if (preg_match('/(riesgos críticos|riesgos criticos|listar riesgos|qué riesgos|que riesgos|todos los riesgos)/i', $mensaje)) {
        try {
            $stmt = $pdo->query("
                SELECT c.id, c.nombre, c.evento_no_deseado, c.evento_riesgo
                FROM carpetas c
                WHERE c.nivel = 1 AND c.activo = 1
                ORDER BY c.nombre
            ");
            $riesgos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($riesgos) > 0) {
                $response = "📊 **Riesgos Críticos en el Sistema:**\n\n";
                foreach ($riesgos as $i => $riesgo) {
                    $response .= ($i + 1) . ". **" . $riesgo['nombre'] . "**\n";
                    if ($riesgo['evento_no_deseado']) {
                        $response .= "   ⚠️ Evento: " . $riesgo['evento_no_deseado'] . "\n";
                    }
                    $response .= "\n";
                }
                $response .= "¿Quieres más información sobre algún riesgo específico? Pregúntame por su nombre.";
            } else {
                $response = "No encontré riesgos críticos configurados en el sistema.";
            }
        } catch (PDOException $e) {
            $response = "Error al consultar los riesgos críticos.";
        }
        
        $sugerencias = [
            "Dame detalles del primer riesgo",
            "¿Cuál es el avance de implementación?",
            "Explícame la estructura del Bowtie"
        ];
        
        return ['response' => $response, 'sugerencias' => $sugerencias];
    }
    
    // Estadísticas y avance
    if (preg_match('/(estadística|avance|porcentaje|cuánto|progreso|implementación)/i', $mensaje)) {
        try {
            $stmt = $pdo->query("
                SELECT 
                    COUNT(*) as total_controles,
                    ROUND(AVG(COALESCE(porcentaje_avance, 0)), 1) as promedio,
                    SUM(CASE WHEN estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados,
                    SUM(CASE WHEN estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as observaciones
                FROM carpeta_linea_base WHERE activo = 1
            ");
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $response = "📊 **Estadísticas Generales del Sistema:**\n\n";
            $response .= "• **Total de controles en línea base:** " . $stats['total_controles'] . "\n";
            $response .= "• **Promedio general de avance:** " . $stats['promedio'] . "%\n";
            $response .= "• **Controles validados:** " . $stats['validados'] . " ✅\n";
            $response .= "• **Con observaciones:** " . $stats['observaciones'] . " 🟡\n\n";
            
            // Avance por riesgo crítico
            $stmt = $pdo->query("
                SELECT 
                    p.nombre as riesgo,
                    ROUND(AVG(COALESCE(lb.porcentaje_avance, 0)), 1) as promedio
                FROM carpeta_linea_base lb
                JOIN carpetas c ON lb.carpeta_id = c.id
                JOIN carpetas p ON c.carpeta_padre_id = p.id
                WHERE lb.activo = 1 AND c.activo = 1
                GROUP BY p.id, p.nombre
                ORDER BY promedio DESC
                LIMIT 5
            ");
            $porRiesgo = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($porRiesgo) > 0) {
                $response .= "**📈 Avance por Riesgo Crítico:**\n";
                foreach ($porRiesgo as $r) {
                    $barra = str_repeat("█", round($r['promedio'] / 10)) . str_repeat("░", 10 - round($r['promedio'] / 10));
                    $response .= "• {$r['riesgo']}: **{$r['promedio']}%** [{$barra}]\n";
                }
            }
        } catch (PDOException $e) {
            $response = "Error al obtener estadísticas.";
        }
        
        $sugerencias = [
            "¿Qué controles están pendientes?",
            "¿Cuáles tienen observaciones?",
            "Dame más detalles de un riesgo específico"
        ];
        
        return ['response' => $response, 'sugerencias' => $sugerencias];
    }
    
    // Explicar Bowtie
    if (preg_match('/(qué es (el )?bowtie|que es (el )?bowtie|explicar bowtie|análisis bowtie|metodología bowtie)/i', $mensaje)) {
        $response = "🎯 **Análisis Bowtie - Metodología de Gestión de Riesgos**\n\n";
        $response .= "El Bowtie es una herramienta visual que representa los riesgos de forma estructurada, similar a una corbata de moño:\n\n";
        $response .= "```\n";
        $response .= "  CAUSAS          EVENTO          CONSECUENCIAS\n";
        $response .= "    │             CENTRAL              │\n";
        $response .= "    │    ┌─────────────────────┐       │\n";
        $response .= " ───┼───►│  ⚠️ PELIGRO/RIESGO │───────┼───►\n";
        $response .= "    │    └─────────────────────┘       │\n";
        $response .= "    ▲                                  ▲\n";
        $response .= " CONTROLES                         CONTROLES\n";
        $response .= " PREVENTIVOS                       MITIGADORES\n";
        $response .= "```\n\n";
        $response .= "**📌 Componentes:**\n";
        $response .= "• 🔴 **Causas**: Factores que pueden desencadenar el evento\n";
        $response .= "• 🛡️ **CCP (Controles Preventivos)**: Barreras que evitan el evento\n";
        $response .= "• ⚠️ **Evento Central**: El peligro o incidente potencial\n";
        $response .= "• 🛡️ **CCM (Controles Mitigadores)**: Reducen consecuencias\n";
        $response .= "• 🔵 **Consecuencias**: Resultados si ocurre el evento\n";
        
        $sugerencias = [
            "¿Qué son los controles críticos?",
            "¿Cuáles son las dimensiones de verificación?",
            "Dame un ejemplo de Bowtie del sistema"
        ];
        
        return ['response' => $response, 'sugerencias' => $sugerencias];
    }
    
    // Controles críticos
    if (preg_match('/(controles críticos|controles criticos|qué son los controles|CCP|CCM|preventivos|mitigadores)/i', $mensaje)) {
        $response = "🛡️ **Controles Críticos**\n\n";
        $response .= "Son las barreras más importantes para gestionar un riesgo crítico:\n\n";
        $response .= "**Controles Críticos Preventivos (CCP):**\n";
        $response .= "• ✅ Evitan que ocurra el evento no deseado\n";
        $response .= "• 📍 Se ubican entre las causas y el evento central\n";
        $response .= "• 💡 Ejemplo: Bloqueo y etiquetado (LOTO), permisos de trabajo\n\n";
        $response .= "**Controles Críticos Mitigadores (CCM):**\n";
        $response .= "• ✅ Reducen las consecuencias si el evento ocurre\n";
        $response .= "• 📍 Se ubican entre el evento central y las consecuencias\n";
        $response .= "• 💡 Ejemplo: EPP, sistemas de supresión, planes de emergencia\n\n";
        $response .= "**Jerarquía de Controles (de más a menos efectivo):**\n";
        $response .= "1. 🚫 Eliminación del peligro\n";
        $response .= "2. 🔄 Sustitución por algo menos peligroso\n";
        $response .= "3. ⚙️ Controles de ingeniería\n";
        $response .= "4. 📋 Controles administrativos\n";
        $response .= "5. 🦺 Equipos de Protección Personal (EPP)\n";
        
        $sugerencias = [
            "¿Qué son las dimensiones de verificación?",
            "¿Cómo se evalúan los controles?",
            "¿Cuántos controles hay en el sistema?"
        ];
        
        return ['response' => $response, 'sugerencias' => $sugerencias];
    }
    
    // Dimensiones
    if (preg_match('/(dimensiones|dimensión|diseño|implementación|entrenamiento|verificación)/i', $mensaje)) {
        $response = "📐 **Dimensiones de Verificación de Controles**\n\n";
        $response .= "Cada control crítico se evalúa en 3 dimensiones:\n\n";
        $response .= "**1. DISEÑO** 📝\n";
        $response .= "• ¿El control está correctamente diseñado?\n";
        $response .= "• ¿Existe documentación del control?\n";
        $response .= "• ¿El diseño es adecuado para el riesgo?\n\n";
        $response .= "**2. IMPLEMENTACIÓN** 🔧\n";
        $response .= "• ¿El control está instalado/aplicado en terreno?\n";
        $response .= "• ¿Se mantiene en condiciones operativas?\n";
        $response .= "• ¿Se usa consistentemente?\n\n";
        $response .= "**3. ENTRENAMIENTO** 👨‍🎓\n";
        $response .= "• ¿El personal conoce el control?\n";
        $response .= "• ¿Están capacitados para operarlo?\n";
        $response .= "• ¿Se realizan reentrenamientos periódicos?\n\n";
        $response .= "Cada dimensión tiene preguntas específicas que requieren evidencias documentadas.";
        
        $sugerencias = [
            "¿Qué es la línea base?",
            "¿Cómo se valida un control?",
            "¿Qué evidencias se necesitan?"
        ];
        
        return ['response' => $response, 'sugerencias' => $sugerencias];
    }
    
    // Respuesta genérica con búsqueda
    try {
        $busqueda = "%" . $mensaje . "%";
        $stmt = $pdo->prepare("
            SELECT c.id, c.nombre, c.evento_no_deseado
            FROM carpetas c
            WHERE c.activo = 1 AND (
                LOWER(c.nombre) LIKE LOWER(?) OR 
                LOWER(c.evento_no_deseado) LIKE LOWER(?)
            )
            LIMIT 3
        ");
        $stmt->execute([$busqueda, $busqueda]);
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($resultados) > 0) {
            $response = "🔍 Encontré estos elementos relacionados:\n\n";
            foreach ($resultados as $r) {
                $response .= "• **{$r['nombre']}**";
                if ($r['evento_no_deseado']) {
                    $response .= " - {$r['evento_no_deseado']}";
                }
                $response .= "\n";
            }
            $response .= "\n¿Quieres más detalles de alguno?";
            
            $sugerencias = array_map(function($r) {
                return "Detalles de " . $r['nombre'];
            }, $resultados);
        } else {
            $response = "🤔 No estoy seguro de entender tu pregunta sobre: \"$mensaje\"\n\n";
            $response .= "Puedo ayudarte con:\n";
            $response .= "• 📊 \"¿Qué riesgos críticos hay?\"\n";
            $response .= "• 🎯 \"Explícame el análisis Bowtie\"\n";
            $response .= "• 📈 \"¿Cuál es el avance de implementación?\"\n";
            $response .= "• 🛡️ \"¿Qué son los controles críticos?\"\n";
            $response .= "• 👥 \"¿Qué roles hay en el sistema?\"\n";
            
            $sugerencias = [
                "¿Qué riesgos críticos hay?",
                "Explícame el análisis Bowtie",
                "¿Cuál es el avance general?",
                "¿Qué son los controles críticos?"
            ];
        }
    } catch (PDOException $e) {
        $response = "Hubo un error al procesar tu consulta. Por favor intenta de nuevo.";
        $sugerencias = ["¿Qué riesgos críticos hay?", "Ayuda"];
    }
    
    return ['response' => $response, 'sugerencias' => $sugerencias];
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
        // Generar contexto enriquecido
        $contexto = generarContextoSistema($pdo, $carpetaId);
        
        // Buscar información adicional relevante
        $infoAdicional = buscarInformacionRelevante($pdo, $message);
        if ($infoAdicional) {
            $contexto .= $infoAdicional;
        }
        
        // Intentar usar Gemini API
        $respuestaGemini = llamarGeminiAPI($message, $contexto, $GEMINI_API_KEY, $GEMINI_API_URL);
        
        if ($respuestaGemini) {
            // Respuesta de Gemini exitosa
            echo json_encode([
                'success' => true,
                'response' => $respuestaGemini,
                'sugerencias' => [
                    "Dame más detalles",
                    "¿Qué riesgos críticos hay?",
                    "¿Cuál es el avance de implementación?",
                    "Explícame los controles críticos"
                ],
                'source' => 'gemini'
            ], JSON_UNESCAPED_UNICODE);
        } else {
            // Fallback a respuesta local
            $respuestaLocal = generarRespuestaLocal($pdo, $message, $carpetaId);
            echo json_encode([
                'success' => true,
                'response' => $respuestaLocal['response'],
                'sugerencias' => $respuestaLocal['sugerencias'],
                'source' => 'local'
            ], JSON_UNESCAPED_UNICODE);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error al procesar el mensaje: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// GET: Obtener configuración inicial
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sugerencias = [
        "¿Qué riesgos críticos hay en el sistema?",
        "Explícame qué es el análisis Bowtie",
        "¿Cuál es el avance general de implementación?",
        "¿Qué son los controles críticos preventivos?",
        "¿Cuáles son las dimensiones de verificación?",
        "¿Qué empresas están registradas?",
        "¿Qué roles hay en el sistema?"
    ];
    
    // Verificar si Gemini está configurado
    $geminiActivo = !empty($GEMINI_API_KEY) && $GEMINI_API_KEY !== 'TU_API_KEY_AQUI';
    
    echo json_encode([
        'success' => true,
        'sugerencias' => $sugerencias,
        'mensaje_bienvenida' => "¡Hola! 👋 Soy tu asistente de Riesgos Críticos. Puedo ayudarte con información sobre Bowtie, controles, línea base y más. ¿En qué puedo ayudarte?",
        'gemini_activo' => $geminiActivo
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
