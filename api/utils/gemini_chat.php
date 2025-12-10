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
// FUNCIONES DE DATOS
// =====================================================

function getDatosResumen($pdo) {
    $data = [];
    
    try {
        // Totales generales
        $stmt = $pdo->query("SELECT COUNT(*) as t FROM carpetas WHERE nivel = 1 AND activo = 1");
        $data['riesgos_criticos'] = $stmt->fetch()['t'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as t FROM carpetas WHERE nivel = 2 AND activo = 1");
        $data['empresas'] = $stmt->fetch()['t'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as t, ROUND(AVG(COALESCE(porcentaje_avance,0)),1) as prom FROM carpeta_linea_base WHERE activo = 1");
        $r = $stmt->fetch();
        $data['ctrl_preventivos'] = $r['t'];
        $data['avance_preventivos'] = $r['prom'] ?? 0;
        
        $stmt = $pdo->query("SELECT COUNT(*) as t, ROUND(AVG(COALESCE(porcentaje_avance,0)),1) as prom FROM carpeta_linea_base_mitigadores WHERE activo = 1");
        $r = $stmt->fetch();
        $data['ctrl_mitigadores'] = $r['t'];
        $data['avance_mitigadores'] = $r['prom'] ?? 0;
        
        // Validaciones
        $stmt = $pdo->query("SELECT 
            SUM(CASE WHEN estado_validacion='validado' THEN 1 ELSE 0 END) as val,
            SUM(CASE WHEN estado_validacion='con_observaciones' THEN 1 ELSE 0 END) as obs
            FROM carpeta_linea_base WHERE activo=1");
        $r = $stmt->fetch();
        $data['validados'] = $r['val'] ?? 0;
        $data['con_observaciones'] = $r['obs'] ?? 0;
        
        // Tareas
        $stmt = $pdo->query("SELECT 
            SUM(CASE WHEN estado='pendiente' THEN 1 ELSE 0 END) as pend,
            SUM(CASE WHEN estado='en_progreso' THEN 1 ELSE 0 END) as prog,
            SUM(CASE WHEN prioridad='urgente' AND estado NOT IN ('completada','cancelada') THEN 1 ELSE 0 END) as urg
            FROM carpeta_tareas WHERE activo=1");
        $r = $stmt->fetch();
        $data['tareas_pendientes'] = $r['pend'] ?? 0;
        $data['tareas_en_progreso'] = $r['prog'] ?? 0;
        $data['tareas_urgentes'] = $r['urg'] ?? 0;
        
    } catch (PDOException $e) {}
    
    return $data;
}

function getEmpresas($pdo) {
    $empresas = [];
    try {
        $stmt = $pdo->query("
            SELECT 
                c.nombre as empresa,
                p.nombre as riesgo,
                COUNT(lb.id) as controles,
                ROUND(AVG(COALESCE(lb.porcentaje_avance,0)),1) as avance,
                SUM(CASE WHEN lb.estado_validacion='validado' THEN 1 ELSE 0 END) as validados,
                SUM(CASE WHEN lb.estado_validacion='con_observaciones' THEN 1 ELSE 0 END) as obs
            FROM carpetas c
            LEFT JOIN carpetas p ON c.carpeta_padre_id = p.id
            LEFT JOIN carpeta_linea_base lb ON lb.carpeta_id = c.id AND lb.activo = 1
            WHERE c.nivel = 2 AND c.activo = 1
            GROUP BY c.id, c.nombre, p.nombre
            HAVING controles > 0
            ORDER BY avance DESC
        ");
        $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {}
    return $empresas;
}

function getDimensiones($pdo) {
    $dims = [];
    try {
        $stmt = $pdo->query("
            SELECT 
                dimension,
                COUNT(*) as total,
                ROUND(AVG(COALESCE(porcentaje_avance,0)),1) as avance,
                SUM(CASE WHEN estado_validacion='validado' THEN 1 ELSE 0 END) as validados
            FROM carpeta_linea_base 
            WHERE activo=1 AND dimension IS NOT NULL AND dimension != ''
            GROUP BY dimension ORDER BY avance DESC
        ");
        $dims = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {}
    return $dims;
}

function getCriticidad($pdo) {
    $crit = [];
    try {
        $stmt = $pdo->query("
            SELECT 
                COALESCE(criticidad,'Sin definir') as criticidad,
                COUNT(*) as total,
                ROUND(AVG(COALESCE(porcentaje_avance,0)),1) as avance,
                SUM(CASE WHEN COALESCE(porcentaje_avance,0) < 50 THEN 1 ELSE 0 END) as bajo_avance
            FROM carpeta_linea_base WHERE activo=1
            GROUP BY criticidad ORDER BY avance ASC
        ");
        $crit = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {}
    return $crit;
}

function getTareas($pdo) {
    $tareas = [];
    try {
        $stmt = $pdo->query("
            SELECT t.titulo, t.estado, t.prioridad, t.fecha_vencimiento, c.nombre as carpeta, u.nombre as asignado
            FROM carpeta_tareas t
            JOIN carpetas c ON t.carpeta_id = c.id
            LEFT JOIN usuarios u ON t.asignado_a = u.id
            WHERE t.activo = 1 AND t.estado NOT IN ('completada','cancelada')
            ORDER BY FIELD(t.prioridad,'urgente','alta','media','baja'), t.fecha_vencimiento
            LIMIT 20
        ");
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {}
    return $tareas;
}

function getAlertas($pdo) {
    $alertas = [];
    try {
        // Críticos con bajo avance
        $stmt = $pdo->query("SELECT COUNT(*) as t FROM carpeta_linea_base WHERE activo=1 AND criticidad LIKE '%rítico%' AND COALESCE(porcentaje_avance,0)<50");
        $n = $stmt->fetch()['t'];
        if ($n > 0) $alertas[] = ['tipo' => 'critico', 'mensaje' => "$n controles CRÍTICOS con avance menor al 50%"];
        
        // Con observaciones
        $stmt = $pdo->query("SELECT COUNT(*) as t FROM carpeta_linea_base WHERE activo=1 AND estado_validacion='con_observaciones'");
        $n = $stmt->fetch()['t'];
        if ($n > 0) $alertas[] = ['tipo' => 'observacion', 'mensaje' => "$n controles con observaciones pendientes"];
        
        // Tareas vencidas
        $stmt = $pdo->query("SELECT COUNT(*) as t FROM carpeta_tareas WHERE activo=1 AND estado NOT IN ('completada','cancelada') AND fecha_vencimiento < NOW()");
        $n = $stmt->fetch()['t'];
        if ($n > 0) $alertas[] = ['tipo' => 'vencida', 'mensaje' => "$n tareas vencidas sin completar"];
        
        // Urgentes
        $stmt = $pdo->query("SELECT COUNT(*) as t FROM carpeta_tareas WHERE activo=1 AND estado='pendiente' AND prioridad='urgente'");
        $n = $stmt->fetch()['t'];
        if ($n > 0) $alertas[] = ['tipo' => 'urgente', 'mensaje' => "$n tareas URGENTES pendientes"];
        
    } catch (PDOException $e) {}
    return $alertas;
}

function getRiesgos($pdo) {
    $riesgos = [];
    try {
        $stmt = $pdo->query("
            SELECT c.nombre, c.evento_no_deseado,
                (SELECT COUNT(*) FROM bowtie_causas bc JOIN carpeta_bowtie cb ON bc.bowtie_id=cb.id WHERE cb.carpeta_id=c.id AND bc.activo=1) as causas,
                (SELECT COUNT(*) FROM bowtie_controles_preventivos bcp JOIN carpeta_bowtie cb ON bcp.bowtie_id=cb.id WHERE cb.carpeta_id=c.id AND bcp.activo=1) as ctrl_prev,
                (SELECT COUNT(*) FROM bowtie_controles_mitigadores bcm JOIN carpeta_bowtie cb ON bcm.bowtie_id=cb.id WHERE cb.carpeta_id=c.id AND bcm.activo=1) as ctrl_mit,
                (SELECT COUNT(*) FROM bowtie_consecuencias bco JOIN carpeta_bowtie cb ON bco.bowtie_id=cb.id WHERE cb.carpeta_id=c.id AND bco.activo=1) as consecuencias
            FROM carpetas c WHERE c.nivel=1 AND c.activo=1 ORDER BY c.nombre
        ");
        $riesgos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {}
    return $riesgos;
}

// =====================================================
// GENERAR RESPUESTA FORMATEADA
// =====================================================

function generarRespuestaDirecta($pdo, $mensaje) {
    $msg = mb_strtolower($mensaje, 'UTF-8');
    $respuesta = "";
    
    // RESUMEN EJECUTIVO
    if (preg_match('/(resumen|ejecutivo|general|dashboard|estado del sistema|cómo está|como esta)/i', $mensaje)) {
        $d = getDatosResumen($pdo);
        $respuesta = "## 📊 RESUMEN EJECUTIVO DEL SISTEMA\n\n";
        $respuesta .= "### 📈 Indicadores Principales\n\n";
        $respuesta .= "| Indicador | Valor |\n";
        $respuesta .= "|-----------|-------|\n";
        $respuesta .= "| Riesgos Críticos | **{$d['riesgos_criticos']}** |\n";
        $respuesta .= "| Empresas/Contratistas | **{$d['empresas']}** |\n";
        $respuesta .= "| Controles Preventivos | **{$d['ctrl_preventivos']}** ({$d['avance_preventivos']}% avance) |\n";
        $respuesta .= "| Controles Mitigadores | **{$d['ctrl_mitigadores']}** ({$d['avance_mitigadores']}% avance) |\n";
        $respuesta .= "| Controles Validados | **{$d['validados']}** ✅ |\n";
        $respuesta .= "| Con Observaciones | **{$d['con_observaciones']}** 🟡 |\n\n";
        
        $respuesta .= "### 📋 Tareas\n\n";
        $respuesta .= "- ⏳ Pendientes: **{$d['tareas_pendientes']}**\n";
        $respuesta .= "- 🔄 En progreso: **{$d['tareas_en_progreso']}**\n";
        $respuesta .= "- 🔴 Urgentes: **{$d['tareas_urgentes']}**\n\n";
        
        $alertas = getAlertas($pdo);
        if (count($alertas) > 0) {
            $respuesta .= "### 🚨 Alertas Activas\n\n";
            foreach ($alertas as $a) {
                $emoji = $a['tipo'] == 'critico' ? '🔴' : ($a['tipo'] == 'urgente' ? '⚡' : '🟡');
                $respuesta .= "- {$emoji} {$a['mensaje']}\n";
            }
        }
        return $respuesta;
    }
    
    // EMPRESAS / CUMPLIMIENTO
    if (preg_match('/(empresa|contratista|cumplimiento|ranking|comparar|quién|quien|mejor|peor)/i', $mensaje)) {
        $empresas = getEmpresas($pdo);
        $respuesta = "## 🏢 CUMPLIMIENTO POR EMPRESA\n\n";
        
        if (count($empresas) > 0) {
            $respuesta .= "| # | Empresa | Riesgo | Avance | Controles | Validados | Obs |\n";
            $respuesta .= "|---|---------|--------|--------|-----------|-----------|-----|\n";
            
            foreach ($empresas as $i => $e) {
                $pos = $i + 1;
                $emoji = $e['avance'] >= 80 ? '🟢' : ($e['avance'] >= 50 ? '🟡' : '🔴');
                $respuesta .= "| {$pos} | **{$e['empresa']}** | {$e['riesgo']} | {$emoji} {$e['avance']}% | {$e['controles']} | {$e['validados']} | {$e['obs']} |\n";
            }
            
            // Calcular promedios
            $totalAvance = array_sum(array_column($empresas, 'avance'));
            $promedio = round($totalAvance / count($empresas), 1);
            $respuesta .= "\n**📊 Promedio Global: {$promedio}%**\n\n";
            
            // Top y Bottom
            $mejor = $empresas[0];
            $peor = end($empresas);
            $respuesta .= "🏆 **Mejor:** {$mejor['empresa']} ({$mejor['avance']}%)\n";
            $respuesta .= "⚠️ **Requiere atención:** {$peor['empresa']} ({$peor['avance']}%)\n";
        } else {
            $respuesta .= "No hay datos de empresas con controles registrados.\n";
        }
        return $respuesta;
    }
    
    // DIMENSIONES
    if (preg_match('/(dimensión|dimension|diseño|implementación|implementacion|entrenamiento)/i', $mensaje)) {
        $dims = getDimensiones($pdo);
        $respuesta = "## 📐 AVANCE POR DIMENSIÓN\n\n";
        
        if (count($dims) > 0) {
            $respuesta .= "| Dimensión | Avance | Total | Validados |\n";
            $respuesta .= "|-----------|--------|-------|----------|\n";
            
            foreach ($dims as $d) {
                $emoji = $d['avance'] >= 80 ? '🟢' : ($d['avance'] >= 50 ? '🟡' : '🔴');
                $icono = '';
                if (stripos($d['dimension'], 'diseño') !== false) $icono = '📝';
                elseif (stripos($d['dimension'], 'implement') !== false) $icono = '🔧';
                elseif (stripos($d['dimension'], 'entrena') !== false) $icono = '👨‍🎓';
                else $icono = '📋';
                
                $respuesta .= "| {$icono} **{$d['dimension']}** | {$emoji} {$d['avance']}% | {$d['total']} | {$d['validados']} ✅ |\n";
            }
        } else {
            $respuesta .= "No hay datos de dimensiones registrados.\n";
        }
        return $respuesta;
    }
    
    // CRITICIDAD
    if (preg_match('/(crítico|critico|criticidad|prioridad|riesgo alto|urgente)/i', $mensaje)) {
        $crit = getCriticidad($pdo);
        $respuesta = "## ⚠️ ANÁLISIS POR CRITICIDAD\n\n";
        
        if (count($crit) > 0) {
            $respuesta .= "| Criticidad | Avance | Total | Bajo Avance (<50%) |\n";
            $respuesta .= "|------------|--------|-------|-------------------|\n";
            
            foreach ($crit as $c) {
                $emoji = '';
                if (stripos($c['criticidad'], 'crítico') !== false) $emoji = '🔴';
                elseif (stripos($c['criticidad'], 'alto') !== false) $emoji = '🟠';
                elseif (stripos($c['criticidad'], 'medio') !== false) $emoji = '🟡';
                else $emoji = '🟢';
                
                $respuesta .= "| {$emoji} **{$c['criticidad']}** | {$c['avance']}% | {$c['total']} | {$c['bajo_avance']} ⚠️ |\n";
            }
        }
        return $respuesta;
    }
    
    // TAREAS
    if (preg_match('/(tarea|pendiente|asignación|asignacion|vencida|urgente)/i', $mensaje)) {
        $tareas = getTareas($pdo);
        $respuesta = "## 📋 TAREAS PENDIENTES\n\n";
        
        if (count($tareas) > 0) {
            $respuesta .= "| Prioridad | Tarea | Carpeta | Asignado | Vence |\n";
            $respuesta .= "|-----------|-------|---------|----------|-------|\n";
            
            foreach ($tareas as $t) {
                $emoji = '';
                if ($t['prioridad'] == 'urgente') $emoji = '🔴';
                elseif ($t['prioridad'] == 'alta') $emoji = '🟠';
                elseif ($t['prioridad'] == 'media') $emoji = '🟡';
                else $emoji = '🟢';
                
                $asig = $t['asignado'] ?? 'Sin asignar';
                $vence = $t['fecha_vencimiento'] ? date('d/m/Y', strtotime($t['fecha_vencimiento'])) : '-';
                $titulo = mb_substr($t['titulo'], 0, 30, 'UTF-8');
                
                $respuesta .= "| {$emoji} {$t['prioridad']} | {$titulo} | {$t['carpeta']} | {$asig} | {$vence} |\n";
            }
        } else {
            $respuesta .= "✅ No hay tareas pendientes.\n";
        }
        return $respuesta;
    }
    
    // ALERTAS
    if (preg_match('/(alerta|problema|atención|atencion|revisar)/i', $mensaje)) {
        $alertas = getAlertas($pdo);
        $respuesta = "## 🚨 ALERTAS DEL SISTEMA\n\n";
        
        if (count($alertas) > 0) {
            foreach ($alertas as $a) {
                $emoji = $a['tipo'] == 'critico' ? '🔴' : ($a['tipo'] == 'urgente' ? '⚡' : ($a['tipo'] == 'vencida' ? '⏰' : '🟡'));
                $respuesta .= "### {$emoji} {$a['mensaje']}\n\n";
            }
        } else {
            $respuesta .= "✅ **No hay alertas activas.** Todo está en orden.\n";
        }
        return $respuesta;
    }
    
    // BOWTIE / RIESGOS
    if (preg_match('/(bowtie|riesgo|causa|consecuencia|preventivo|mitigador)/i', $mensaje)) {
        $riesgos = getRiesgos($pdo);
        $respuesta = "## 🎯 ANÁLISIS BOWTIE POR RIESGO\n\n";
        
        if (count($riesgos) > 0) {
            $respuesta .= "| Riesgo Crítico | Causas | Ctrl Prev | Ctrl Mit | Consec |\n";
            $respuesta .= "|----------------|--------|-----------|----------|--------|\n";
            
            foreach ($riesgos as $r) {
                $nombre = mb_substr($r['nombre'], 0, 25, 'UTF-8');
                $respuesta .= "| **{$nombre}** | {$r['causas']} | {$r['ctrl_prev']} | {$r['ctrl_mit']} | {$r['consecuencias']} |\n";
            }
            
            $respuesta .= "\n**Leyenda:** Ctrl Prev = Controles Preventivos, Ctrl Mit = Controles Mitigadores, Consec = Consecuencias\n";
        }
        return $respuesta;
    }
    
    // AYUDA
    if (preg_match('/(ayuda|help|qué puedes|que puedes|cómo funciona|como funciona)/i', $mensaje)) {
        $respuesta = "## 🤖 ¿Qué puedo hacer?\n\n";
        $respuesta .= "Soy tu asistente de análisis de Riesgos Críticos. Puedo responder:\n\n";
        $respuesta .= "| Pregunta | Qué obtienes |\n";
        $respuesta .= "|----------|-------------|\n";
        $respuesta .= "| \"Dame un resumen ejecutivo\" | Dashboard con todos los indicadores |\n";
        $respuesta .= "| \"¿Cuál es el cumplimiento por empresa?\" | Ranking de empresas con % avance |\n";
        $respuesta .= "| \"Analiza por dimensión\" | Avance en Diseño, Implementación, Entrenamiento |\n";
        $respuesta .= "| \"¿Qué controles críticos hay?\" | Análisis por criticidad |\n";
        $respuesta .= "| \"¿Qué tareas hay pendientes?\" | Lista de tareas con prioridad |\n";
        $respuesta .= "| \"¿Hay alertas?\" | Problemas que requieren atención |\n";
        $respuesta .= "| \"Análisis Bowtie\" | Resumen de riesgos con causas y controles |\n";
        return $respuesta;
    }
    
    return null; // No se detectó intención, usar Gemini
}

// =====================================================
// LLAMAR A GEMINI (solo si no hay respuesta directa)
// =====================================================

function llamarGemini($mensaje, $datos, $apiKey, $apiUrl) {
    $contexto = "Eres un asistente experto en gestión de riesgos críticos y seguridad industrial.
    
DATOS ACTUALES DEL SISTEMA:
" . json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "

INSTRUCCIONES:
1. Responde SIEMPRE en español
2. Usa los datos proporcionados para dar respuestas específicas
3. Formatea con markdown: usa ## para títulos, **negrita**, tablas, listas
4. Sé conciso pero completo
5. Incluye números y porcentajes cuando sea relevante
6. Usa emojis para hacer la respuesta más visual

PREGUNTA DEL USUARIO: " . $mensaje;

    $data = [
        'contents' => [['parts' => [['text' => $contexto]]]],
        'generationConfig' => [
            'temperature' => 0.7,
            'maxOutputTokens' => 2048,
        ]
    ];
    
    $ch = curl_init($apiUrl . "?key=" . $apiKey);
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
// PROCESAR SOLICITUD
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $message = trim($data['message'] ?? '');
    
    if (empty($message)) {
        echo json_encode(['error' => 'Mensaje vacío'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Intentar respuesta directa primero
    $respuestaDirecta = generarRespuestaDirecta($pdo, $message);
    
    if ($respuestaDirecta) {
        echo json_encode([
            'success' => true,
            'response' => $respuestaDirecta,
            'source' => 'sistema'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Si no hay respuesta directa, usar Gemini
    $datos = [
        'resumen' => getDatosResumen($pdo),
        'alertas' => getAlertas($pdo),
        'empresas' => array_slice(getEmpresas($pdo), 0, 10),
        'dimensiones' => getDimensiones($pdo)
    ];
    
    $respuestaGemini = llamarGemini($message, $datos, $GEMINI_API_KEY, $GEMINI_API_URL);
    
    if ($respuestaGemini) {
        echo json_encode([
            'success' => true,
            'response' => $respuestaGemini,
            'source' => 'gemini'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        // Fallback: mostrar resumen
        echo json_encode([
            'success' => true,
            'response' => generarRespuestaDirecta($pdo, 'resumen ejecutivo'),
            'source' => 'fallback'
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// GET: Configuración inicial
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'success' => true,
        'sugerencias' => [
            "Dame un resumen ejecutivo",
            "¿Cuál es el cumplimiento por empresa?",
            "Analiza el avance por dimensión",
            "¿Qué controles críticos tienen problemas?",
            "¿Qué tareas están pendientes?",
            "¿Hay alertas en el sistema?",
            "Análisis Bowtie de los riesgos"
        ],
        'mensaje_bienvenida' => "¡Hola! 👋 Soy tu asistente de análisis. Pregúntame sobre el estado del sistema, cumplimiento, tareas o alertas."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
