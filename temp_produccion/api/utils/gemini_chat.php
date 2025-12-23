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
// OBTENER CONTENIDO DE LA GUÍA DE CONTROLES CRÍTICOS
// =====================================================

function obtenerContenidoGuiaControles() {
    return "=== GUÍA DE CONTROLES CRÍTICOS QUE SALVAN VIDAS (SIGO-G-012) ===

CÓDIGO: SIGO-G-012
VERSIÓN: 001
FECHA: 15-04-2024
CONTROLES CRÍTICOS DE TERRENO

--- ¿CUÁNDO Y DÓNDE DEBEMOS UTILIZAR ESTOS CONTROLES? ---

1. Durante la elaboración del Análisis del Riesgo del Trabajo (ART), al momento de identificar los Riesgos Críticos y sus controles respectivos, asociados a las tareas a ejecutar (Rutinarias, No Rutinarias, Críticas y Emergencias).
2. Como elemento de soporte para los procesos de investigación de Eventos Significativos.
3. Apoyo para reforzar los Controles Críticos durante las charlas de seguridad de inicio de turno u otras.
4. Contenido para actividades de capacitación y entrenamiento SSO.
5. Complemento para la elaboración de estándares de proceso, procedimientos y/o instructivos de trabajo.

--- PREGUNTAS TRANSVERSALES PARA TODOS LOS RIESGOS ---

Las siguientes preguntas son TRANSVERSALES. Se deben responder SIEMPRE, independiente del Riesgo Crítico al que se esté expuesto.

SUPERVISOR(A):
1. ¿El trabajo que asignaré cuenta con un estándar, procedimiento y/o instructivo específico?
2. ¿El personal que asignaré para realizar el trabajo, cuenta con las capacitaciones, certificaciones, competencias, salud compatible y/o acreditaciones requeridas?
3. ¿Durante la planificación del trabajo, me aseguro de solicitar los permisos para ingresar a las áreas, intervenir equipos y/o interactuar con energías?
4. ¿Verifiqué que el personal cuenta con los elementos requeridos para realizar la segregación y señalización del área de trabajo, según diseño?
5. ¿El personal que asignaré para realizar el trabajo conoce el protocolo de emergencia del área?
6. ¿El personal a mi cargo cuenta con sistema de comunicación de acuerdo al protocolo de emergencia del área?
7. ¿El personal que asignaré para realizar el trabajo, cuenta con los EPPs definidos en el procedimiento de trabajo?

TRABAJADOR(A):
1. ¿Conozco el estándar, procedimiento y/o instructivo específico del trabajo que ejecutaré?
2. ¿Cuento con las competencias y salud compatible para ejecutar el trabajo?
3. ¿Cuento con la autorización para ingresar al área a ejecutar el trabajo?
4. ¿Segregué y señalicé el área de trabajo con los elementos según diseño?
5. ¿Conozco y estoy entrenado en el procedimiento de emergencia del área de trabajo?
6. ¿Conozco el número de teléfono o frecuencia radial para dar aviso en caso de emergencia, según protocolo del área?
7. ¿Uso los EPPs definidos para el trabajo y se encuentran en buenas condiciones?

--- ÍNDICE DE RIESGOS CRÍTICOS (28 RIESGOS) ---

RC01 - Contacto con energía eléctrica
RC02 - Caída distinto nivel
RC03 - Aplastamiento / Atrapamiento por carga suspendida
RC04 - Liberación descontrolada de energía
RC05 - Caída de roca a cielo abierto
RC06 - Incendio
RC07 - Contacto con sustancias químicas peligrosas
RC08 - Exposición a explosiones (tronadura)
RC09 - Atrapamiento / Aprisionamiento con partes móviles
RC10 - Choque / Colisión / Volcamiento de vehículo
RC11 - Exposición a atmósferas peligrosas en espacios confinados
RC12 - Contacto con material fundido
RC13 - Caída de objetos, herramientas o estructuras de distinto nivel
RC14 - Operaciones Ferroviarias (usa Reglas que Salvan la Vida 2020)
RC15 - Exposición a avalancha (usa Reglas que Salvan la Vida 2020)
RC16 - Caída a piques
RC17 - Exposición a bombeo de agua barro
RC18 - Aplastamiento / Atrapamiento por caída de roca en mina subterránea
RC19 - Estallido de Roca
RC20 - Concentración ambiental peligrosa de polvo y sílice
RC21 - Exposición a arsénico inorgánico
RC22 - Deformación, inestabilidad y colapso de componentes en pasillos, pisos y barandas
RC23 - Colapso estructural en mina subterránea
RC24 - Desprendimiento y caída de talud en mina cielo abierto
RC25 - Choque / Colisión / Volcamiento de maquinarias
RC26 - Choque / Colisión / Volcamiento de equipos autónomos
RC27 - Atropello
RC28 - Airblast (Golpe de aire)

--- ESTRUCTURA DE CONTROLES CRÍTICOS ---

Cada Riesgo Crítico tiene:
- EVENTO NO DESEADO: La consecuencia fatal o catastrófica que se busca evitar
- EVENTO DE RIESGO: La situación peligrosa que puede llevar al evento no deseado
- CONTROLES PREVENTIVOS: Medidas para evitar que ocurra el evento de riesgo (dirigidos a SUPERVISOR y TRABAJADOR)
- CONTROLES MITIGADORES: Medidas para reducir las consecuencias si ocurre el evento de riesgo (dirigidos a SUPERVISOR y TRABAJADOR)

Cada control tiene:
- Número de identificación
- Preguntas de verificación específicas según el rol (SUPERVISOR o TRABAJADOR)
- Algunos controles tienen preguntas diferenciadas por tipo de usuario (Eléctrico, Todos los usuarios, etc.)

--- REGLA IMPORTANTE ---

Si un Control Crítico no está presente, se debe:
1. DETENER la actividad inmediatamente
2. Aplicar tarjeta verde
3. Notificar al supervisor para evaluar la desviación
4. Juntos normalizar el control ausente o fallido

--- EJEMPLO: RC01 - CONTACTO CON ENERGÍA ELÉCTRICA ---

EVENTO NO DESEADO: Arco eléctrico / electrocución
EVENTO DE RIESGO: INTERACCIÓN CON ENERGÍA ELÉCTRICA

CONTROLES PREVENTIVOS (SUPERVISOR):
01 - Identificación y corte efectivo de todas las fuentes de energía
    Pregunta: ¿La identificación y señalización de los puntos para el corte de energía se encuentran definidos en el procedimiento y/o mapa de energías? (Eléctrico)
02 - Aislación y bloqueo de elementos de maniobra eléctrica
    Pregunta: ¿El equipo de trabajo cuenta con las tarjetas y candados personales para realizar el bloqueo de energías? (Eléctrico)
03 - Verificación de ausencia de tensión e instalación de puesta a tierra
    Pregunta: ¿Los dispositivos utilizados para la verificación de energía cero, están certificados por el proveedor y cuentan con su revisión al día? (Eléctrico)
04 - Conexión de equipos portátiles y herramientas eléctricas a tableros eléctricos autorizados
    Pregunta: ¿Los tableros eléctricos portátiles y las herramientas eléctricas se encuentran con sus revisiones de acuerdo a la pauta de mantención? (Todos los usuarios)

CONTROLES MITIGADORES (SUPERVISOR):
05 - Protecciones en sistemas eléctricos de baja, media y alta tensión
    Pregunta: ¿Las protecciones eléctricas de los equipos a intervenir se encuentran con sus mantenciones al día? (Eléctrico)

--- NOTA SOBRE RC14 Y RC15 ---

Los riesgos RC14 (Operaciones Ferroviarias) y RC15 (Exposición a avalancha) utilizan las preguntas de acuerdo a las REGLAS QUE SALVAN LA VIDA 2020, en lugar de las preguntas específicas de la guía.

--- METODOLOGÍA BOWTIE ---

El sistema utiliza la metodología Bowtie para el análisis de riesgos:
- CAUSAS: Factores que pueden llevar al evento de riesgo
- CONTROLES PREVENTIVOS: Medidas para evitar que las causas generen el evento de riesgo
- EVENTO CENTRAL: El evento de riesgo (pérdida de control)
- CONTROLES MITIGADORES: Medidas para reducir las consecuencias si ocurre el evento
- CONSECUENCIAS: Los eventos no deseados que pueden resultar

--- DIMENSIONES DE VERIFICACIÓN ---

Los controles se verifican en tres dimensiones:
1. DISEÑO: ¿El control está bien diseñado y documentado?
2. IMPLEMENTACIÓN: ¿El control está implementado correctamente?
3. ENTRENAMIENTO: ¿El personal está entrenado y capacitado en el control?

--- EJEMPLOS DE RIESGOS CRÍTICOS CON CONTROLES DETALLADOS ---

RC01 - CONTACTO CON ENERGÍA ELÉCTRICA:
Evento No Deseado: Arco eléctrico / electrocución
Evento de Riesgo: INTERACCIÓN CON ENERGÍA ELÉCTRICA
Controles Preventivos Supervisor: 4 controles (01-04)
Controles Mitigadores Supervisor: 1 control (05)
Cada control tiene preguntas específicas para verificación según el rol y tipo de usuario.

RC02 - CAÍDA DISTINTO NIVEL:
Evento No Deseado: Caída desde altura
Evento de Riesgo: Trabajo en altura sin protección adecuada
Incluye controles preventivos y mitigadores para supervisor y trabajador.

RC03 - APLASTAMIENTO / ATRAPAMIENTO POR CARGA SUSPENDIDA:
Evento No Deseado: Lesión grave o fatal por carga suspendida
Evento de Riesgo: Manipulación de cargas suspendidas sin controles adecuados
Incluye controles para operación de grúas, izajes y manipulación de cargas.

RC08 - EXPOSICIÓN A EXPLOSIONES (TRONADURA):
Evento No Deseado: Lesión por explosión o fragmentos
Evento de Riesgo: Trabajo en áreas con riesgo de tronadura
Incluye controles para planificación, ejecución y post-tronadura.

RC14 - OPERACIONES FERROVIARIAS:
Usa las REGLAS QUE SALVAN LA VIDA 2020
Controles: Condiciones de vías, competencias del personal, mantenimiento preventivo, control de tráfico
Tiene preguntas específicas para supervisor y trabajador (maquinista).

RC15 - EXPOSICIÓN A AVALANCHA:
Usa las REGLAS QUE SALVAN LA VIDA 2020
Controles: Monitoreo nívometerológico, capacitación/especialización, protocolo de control de tránsito, plan de evacuación y EPP específico (ARVA, RECCO)
Tiene preguntas específicas para supervisor y trabajador.

--- ESTRUCTURA DE PREGUNTAS DE VERIFICACIÓN ---

Cada control crítico tiene preguntas de verificación que deben responderse ANTES de iniciar la actividad. Las preguntas están diseñadas para:
- Verificar que el control está presente y operativo
- Confirmar que el personal tiene las competencias necesarias
- Asegurar que los equipos y herramientas están en condiciones adecuadas
- Validar que los procedimientos están actualizados y son conocidos

Las preguntas pueden ser:
- Para SUPERVISOR: Enfocadas en planificación, asignación, verificación y coordinación
- Para TRABAJADOR: Enfocadas en conocimiento, preparación, ejecución y uso de EPPs
- Específicas por tipo de usuario: Eléctrico, Todos los usuarios, etc.

--- IMPORTANTE ---

Esta guía es la BASE FUNDAMENTAL de todos los riesgos críticos del sistema. Todas las preguntas sobre controles, verificación, riesgos específicos, o metodología deben responderse basándose en esta guía.

Cuando te pregunten sobre:
- Un riesgo crítico específico (ej: \"¿Qué controles tiene RC01?\"): Proporciona los controles preventivos y mitigadores según la guía
- Preguntas de verificación (ej: \"¿Qué preguntas debo hacer para RC01?\"): Proporciona las preguntas transversales Y las específicas del riesgo
- Eventos no deseados o eventos de riesgo: Explica según la guía
- Metodología: Refiérete a la estructura de controles preventivos/mitigadores y las dimensiones de verificación";
}

// =====================================================
// GENERAR RESPUESTA FORMATEADA
// =====================================================

function generarRespuestaDirecta($pdo, $mensaje) {
    $msg = mb_strtolower($mensaje, 'UTF-8');
    $respuesta = "";
    
    // PREGUNTAS SOBRE LA GUÍA DE CONTROLES CRÍTICOS
    if (preg_match('/(guía|guia|sigo-g-012|sigo g 012|controles críticos que salvan vidas|preguntas transversales|preguntas de verificación)/i', $mensaje)) {
        $respuesta = "## 📘 GUÍA DE CONTROLES CRÍTICOS QUE SALVAN VIDAS (SIGO-G-012)\n\n";
        $respuesta .= "**Código:** SIGO-G-012\n";
        $respuesta .= "**Versión:** 001\n";
        $respuesta .= "**Fecha:** 15-04-2024\n\n";
        
        if (preg_match('/(transversal|transversales)/i', $mensaje)) {
            $respuesta .= "### 🔄 PREGUNTAS TRANSVERSALES\n\n";
            $respuesta .= "Estas preguntas se aplican a **TODOS** los riesgos críticos:\n\n";
            $respuesta .= "**SUPERVISOR(A):**\n";
            $respuesta .= "1. ¿El trabajo que asignaré cuenta con un estándar, procedimiento y/o instructivo específico?\n";
            $respuesta .= "2. ¿El personal que asignaré cuenta con las capacitaciones, certificaciones, competencias, salud compatible y/o acreditaciones requeridas?\n";
            $respuesta .= "3. ¿Durante la planificación del trabajo, me aseguro de solicitar los permisos para ingresar a las áreas, intervenir equipos y/o interactuar con energías?\n";
            $respuesta .= "4. ¿Verifiqué que el personal cuenta con los elementos requeridos para realizar la segregación y señalización del área de trabajo, según diseño?\n";
            $respuesta .= "5. ¿El personal que asignaré conoce el protocolo de emergencia del área?\n";
            $respuesta .= "6. ¿El personal a mi cargo cuenta con sistema de comunicación de acuerdo al protocolo de emergencia del área?\n";
            $respuesta .= "7. ¿El personal que asignaré cuenta con los EPPs definidos en el procedimiento de trabajo?\n\n";
            $respuesta .= "**TRABAJADOR(A):**\n";
            $respuesta .= "1. ¿Conozco el estándar, procedimiento y/o instructivo específico del trabajo que ejecutaré?\n";
            $respuesta .= "2. ¿Cuento con las competencias y salud compatible para ejecutar el trabajo?\n";
            $respuesta .= "3. ¿Cuento con la autorización para ingresar al área a ejecutar el trabajo?\n";
            $respuesta .= "4. ¿Segregué y señalicé el área de trabajo con los elementos según diseño?\n";
            $respuesta .= "5. ¿Conozco y estoy entrenado en el procedimiento de emergencia del área de trabajo?\n";
            $respuesta .= "6. ¿Conozco el número de teléfono o frecuencia radial para dar aviso en caso de emergencia, según protocolo del área?\n";
            $respuesta .= "7. ¿Uso los EPPs definidos para el trabajo y se encuentran en buenas condiciones?\n";
        } elseif (preg_match('/(rc01|energía eléctrica|energia electrica|contacto.*electric)/i', $mensaje)) {
            $respuesta .= "### ⚡ RC01 - CONTACTO CON ENERGÍA ELÉCTRICA\n\n";
            $respuesta .= "**Evento No Deseado:** Arco eléctrico / electrocución\n";
            $respuesta .= "**Evento de Riesgo:** INTERACCIÓN CON ENERGÍA ELÉCTRICA\n\n";
            $respuesta .= "**CONTROLES PREVENTIVOS (Supervisor):**\n";
            $respuesta .= "1. Identificación y corte efectivo de todas las fuentes de energía\n";
            $respuesta .= "2. Aislación y bloqueo de elementos de maniobra eléctrica\n";
            $respuesta .= "3. Verificación de ausencia de tensión e instalación de puesta a tierra\n";
            $respuesta .= "4. Conexión de equipos portátiles y herramientas eléctricas a tableros eléctricos autorizados\n\n";
            $respuesta .= "**CONTROLES MITIGADORES (Supervisor):**\n";
            $respuesta .= "5. Protecciones en sistemas eléctricos de baja, media y alta tensión\n\n";
            $respuesta .= "**⚠️ IMPORTANTE:** Si un control no está presente, DETENER la actividad, aplicar tarjeta verde y notificar al supervisor.\n";
        } elseif (preg_match('/(rc14|ferroviaria|ferroviario)/i', $mensaje)) {
            $respuesta .= "### 🚂 RC14 - OPERACIONES FERROVIARIAS\n\n";
            $respuesta .= "**Usa:** REGLAS QUE SALVAN LA VIDA 2020\n\n";
            $respuesta .= "**CONTROLES CRÍTICOS:**\n";
            $respuesta .= "1. Condiciones de las vías y regulación de cruces\n";
            $respuesta .= "2. Competencias del personal\n";
            $respuesta .= "3. Mantenimiento preventivo de equipos de operación ferroviaria\n";
            $respuesta .= "4. Control de tráfico\n\n";
            $respuesta .= "Tiene preguntas específicas para Supervisor y Trabajador (maquinista).\n";
        } elseif (preg_match('/(rc15|avalancha)/i', $mensaje)) {
            $respuesta .= "### ❄️ RC15 - EXPOSICIÓN A AVALANCHA\n\n";
            $respuesta .= "**Usa:** REGLAS QUE SALVAN LA VIDA 2020\n\n";
            $respuesta .= "**CONTROLES CRÍTICOS:**\n";
            $respuesta .= "1. Monitoreo de variables nívometerológicas\n";
            $respuesta .= "2. Capacitación/especialización\n";
            $respuesta .= "3. Protocolo de control de tránsito y ubicación de instalaciones\n";
            $respuesta .= "4. Plan de evacuación y EPP específico (ARVA, RECCO o equivalente)\n\n";
            $respuesta .= "Tiene preguntas específicas para Supervisor y Trabajador.\n";
        } else {
            $respuesta .= "### 📋 CONTENIDO DE LA GUÍA\n\n";
            $respuesta .= "La guía contiene **28 Riesgos Críticos (RC01 a RC28)** con sus controles preventivos y mitigadores.\n\n";
            $respuesta .= "**Estructura:**\n";
            $respuesta .= "- Cada riesgo tiene Evento No Deseado y Evento de Riesgo\n";
            $respuesta .= "- Controles Preventivos (para Supervisor y Trabajador)\n";
            $respuesta .= "- Controles Mitigadores (para Supervisor y Trabajador)\n";
            $respuesta .= "- Preguntas de verificación específicas para cada control\n\n";
            $respuesta .= "**Uso:**\n";
            $respuesta .= "- Durante el ART (Análisis del Riesgo del Trabajo)\n";
            $respuesta .= "- Investigación de Eventos Significativos\n";
            $respuesta .= "- Charlas de seguridad\n";
            $respuesta .= "- Capacitación y entrenamiento SSO\n";
            $respuesta .= "- Elaboración de estándares y procedimientos\n\n";
            $respuesta .= "**Pregunta específica:** Puedes preguntar sobre cualquier RC (ej: \"¿Qué controles tiene RC01?\" o \"¿Cuáles son las preguntas de RC02?\").\n";
        }
        return $respuesta;
    }
    
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
    $guiaControles = obtenerContenidoGuiaControles();
    
    $contexto = "Eres un asistente experto en gestión de riesgos críticos y seguridad industrial especializado en la GUÍA DE CONTROLES CRÍTICOS QUE SALVAN VIDAS (SIGO-G-012).

" . $guiaControles . "

DATOS ACTUALES DEL SISTEMA:
" . json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "

INSTRUCCIONES:
1. Responde SIEMPRE en español
2. Usa los datos proporcionados para dar respuestas específicas
3. Formatea con markdown: usa ## para títulos, **negrita**, tablas, listas
4. Sé conciso pero completo
5. Incluye números y porcentajes cuando sea relevante
6. Usa emojis para hacer la respuesta más visual
7. Cuando te pregunten sobre controles críticos, preguntas de verificación, o riesgos específicos, REFIÉRETE SIEMPRE A LA GUÍA SIGO-G-012 como fuente de autoridad
8. Si te preguntan sobre un riesgo crítico específico (RC01, RC02, etc.), proporciona los controles preventivos y mitigadores según la guía
9. Si te preguntan sobre preguntas de verificación, usa las preguntas transversales o específicas de la guía según corresponda

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
            "Análisis Bowtie de los riesgos",
            "¿Qué es la Guía SIGO-G-012?",
            "¿Cuáles son las preguntas transversales?",
            "¿Qué controles tiene RC01?"
        ],
        'mensaje_bienvenida' => "¡Hola! 👋 Soy tu asistente experto en gestión de riesgos críticos. Puedo ayudarte con:\n\n📊 Análisis del sistema (cumplimiento, avances, alertas)\n📘 La Guía de Controles Críticos que Salvan Vidas (SIGO-G-012)\n🎯 Controles específicos de cada riesgo crítico\n❓ Preguntas de verificación y transversales\n\n¿En qué te puedo ayudar?"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
