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
// CONTEXTO DEL SISTEMA PARA EL CHATBOT
// =====================================================
$SYSTEM_CONTEXT = "
Eres un asistente experto en Gestión de Riesgos Críticos y la metodología Bowtie para el sistema SSO (Seguridad y Salud Ocupacional) de Codelco.

## TU CONOCIMIENTO INCLUYE:

### 1. METODOLOGÍA BOWTIE
El análisis Bowtie es una herramienta visual de gestión de riesgos que muestra:
- **Causas** (lado izquierdo): Factores que pueden provocar el evento no deseado
- **Controles Preventivos**: Barreras que previenen que las causas lleguen al evento central
- **Evento Central**: El peligro o evento no deseado principal
- **Controles Mitigadores**: Barreras que reducen las consecuencias si ocurre el evento
- **Consecuencias** (lado derecho): Resultados potenciales si el evento ocurre

### 2. CONTROLES CRÍTICOS
Los controles se clasifican en:
- **Controles Críticos Preventivos (CCP)**: Evitan que ocurra el evento no deseado
- **Controles Críticos Mitigadores (CCM)**: Reducen el impacto si el evento ocurre

Cada control tiene:
- Código (ej: CCP1, CCM2)
- Descripción del control
- Criticidad (Crítico, No crítico)
- Jerarquía (Eliminación, Sustitución, Ingeniería, Administrativo, EPP)

### 3. DIMENSIONES DE VERIFICACIÓN
Cada control crítico se evalúa en tres dimensiones:
- **DISEÑO**: ¿El control está correctamente diseñado para prevenir/mitigar el riesgo?
- **IMPLEMENTACIÓN**: ¿El control está correctamente implementado en terreno?
- **ENTRENAMIENTO**: ¿El personal está capacitado para operar el control?

### 4. PREGUNTAS Y EVIDENCIAS
- Cada dimensión tiene preguntas de verificación
- Las preguntas requieren evidencias documentadas
- Las evidencias demuestran el cumplimiento del control

### 5. LÍNEA BASE
La Línea Base es el registro del estado de implementación de los controles:
- % de avance de implementación
- Estado de validación
- Responsables y fechas
- Foro de seguimiento para comentarios

### 6. ROLES DEL SISTEMA
- **Super Admin**: Control total del sistema
- **Admin**: Gestiona proyectos y valida controles
- **Trabajador**: Reporta avances y comentarios
- **Visita**: Solo visualización

Responde siempre en español, de forma clara y profesional. Si te preguntan por datos específicos de riesgos o Bowtie, consulta la base de datos del sistema.
";

// =====================================================
// FUNCIONES DE CONSULTA A BASE DE DATOS
// =====================================================

/**
 * Obtener lista de riesgos críticos (carpetas con evento_no_deseado)
 */
function obtenerRiesgosCriticos($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT c.id, c.nombre, c.evento_no_deseado, c.evento_riesgo, 
                   c.informacion_riesgo, c.color_primario, c.icono_url,
                   p.nombre as proyecto_nombre, cc.nombre as centro_costo_nombre
            FROM carpetas c
            LEFT JOIN proyectos p ON c.proyecto_id = p.proyecto_id
            LEFT JOIN centros_costo cc ON c.centro_costo_id = cc.id
            WHERE c.activo = 1 AND (c.evento_no_deseado IS NOT NULL OR c.evento_riesgo IS NOT NULL)
            ORDER BY c.nombre
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}

/**
 * Obtener información completa de un Bowtie por carpeta
 */
function obtenerBowtieCompleto($pdo, $carpetaId) {
    try {
        // Obtener Bowtie principal
        $stmt = $pdo->prepare("SELECT * FROM carpeta_bowtie WHERE carpeta_id = ? AND activo = 1");
        $stmt->execute([$carpetaId]);
        $bowtie = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$bowtie) return null;
        
        $bowtieId = $bowtie['id'];
        
        // Obtener causas
        $stmt = $pdo->prepare("SELECT * FROM bowtie_causas WHERE bowtie_id = ? AND activo = 1 ORDER BY orden");
        $stmt->execute([$bowtieId]);
        $bowtie['causas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener consecuencias
        $stmt = $pdo->prepare("SELECT * FROM bowtie_consecuencias WHERE bowtie_id = ? AND activo = 1 ORDER BY orden");
        $stmt->execute([$bowtieId]);
        $bowtie['consecuencias'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener controles preventivos con dimensiones y preguntas
        $stmt = $pdo->prepare("
            SELECT cp.*, 
                   GROUP_CONCAT(DISTINCT d.nombre SEPARATOR '|') as dimensiones
            FROM bowtie_controles_preventivos cp
            LEFT JOIN bowtie_dimensiones d ON d.control_preventivo_id = cp.id AND d.activo = 1
            WHERE cp.bowtie_id = ? AND cp.activo = 1
            GROUP BY cp.id
            ORDER BY cp.orden
        ");
        $stmt->execute([$bowtieId]);
        $bowtie['controles_preventivos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener controles mitigadores con dimensiones
        $stmt = $pdo->prepare("
            SELECT cm.*, 
                   GROUP_CONCAT(DISTINCT d.nombre SEPARATOR '|') as dimensiones
            FROM bowtie_controles_mitigadores cm
            LEFT JOIN bowtie_dimensiones d ON d.control_mitigador_id = cm.id AND d.activo = 1
            WHERE cm.bowtie_id = ? AND cm.activo = 1
            GROUP BY cm.id
            ORDER BY cm.orden
        ");
        $stmt->execute([$bowtieId]);
        $bowtie['controles_mitigadores'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $bowtie;
    } catch (PDOException $e) {
        return null;
    }
}

/**
 * Obtener estadísticas de línea base de una carpeta
 */
function obtenerEstadisticasLineaBase($pdo, $carpetaId) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_controles,
                AVG(COALESCE(porcentaje_avance, 0)) as promedio_avance,
                SUM(CASE WHEN estado_validacion = 'validado' THEN 1 ELSE 0 END) as validados,
                SUM(CASE WHEN estado_validacion = 'con_observaciones' THEN 1 ELSE 0 END) as con_observaciones
            FROM carpeta_linea_base
            WHERE carpeta_id = ? AND activo = 1
        ");
        $stmt->execute([$carpetaId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return null;
    }
}

/**
 * Buscar carpeta por nombre o evento de riesgo
 */
function buscarCarpeta($pdo, $busqueda) {
    try {
        $busqueda = "%$busqueda%";
        $stmt = $pdo->prepare("
            SELECT c.id, c.nombre, c.evento_no_deseado, c.evento_riesgo
            FROM carpetas c
            WHERE c.activo = 1 AND (
                c.nombre LIKE ? OR 
                c.evento_no_deseado LIKE ? OR 
                c.evento_riesgo LIKE ?
            )
            ORDER BY c.nombre
            LIMIT 5
        ");
        $stmt->execute([$busqueda, $busqueda, $busqueda]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}

// =====================================================
// PROCESAR MENSAJE DEL CHAT
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
        $messageLower = mb_strtolower($message, 'UTF-8');
        $response = '';
        $sugerencias = [];
        
        // =====================================================
        // DETECCIÓN DE INTENCIÓN Y GENERACIÓN DE RESPUESTA
        // =====================================================
        
        // Saludo
        if (preg_match('/(hola|buenos días|buenas tardes|buenas noches|hey|hi)/i', $message)) {
            $response = "¡Hola! 👋 Soy tu asistente de Riesgos Críticos y Análisis Bowtie.\n\n";
            $response .= "Puedo ayudarte con:\n";
            $response .= "• 📊 Información sobre riesgos críticos\n";
            $response .= "• 🎯 Análisis Bowtie (causas, controles, consecuencias)\n";
            $response .= "• ✅ Controles preventivos y mitigadores\n";
            $response .= "• 📋 Estado de la línea base\n";
            $response .= "• 🔍 Dimensiones y preguntas de verificación\n\n";
            $response .= "¿Sobre qué te gustaría saber más?";
            
            $sugerencias = [
                "¿Qué riesgos críticos hay en el sistema?",
                "Explícame qué es el análisis Bowtie",
                "¿Qué son los controles críticos?",
                "¿Cuáles son las dimensiones de verificación?"
            ];
        }
        
        // Listar riesgos críticos
        elseif (preg_match('/(riesgos críticos|riesgos criticos|listar riesgos|qué riesgos|que riesgos|todos los riesgos)/i', $message)) {
            $riesgos = obtenerRiesgosCriticos($pdo);
            
            if (count($riesgos) > 0) {
                $response = "📊 **Riesgos Críticos en el Sistema:**\n\n";
                foreach ($riesgos as $i => $riesgo) {
                    $response .= ($i + 1) . ". **" . $riesgo['nombre'] . "**\n";
                    if ($riesgo['evento_no_deseado']) {
                        $response .= "   ⚠️ Evento: " . $riesgo['evento_no_deseado'] . "\n";
                    }
                    if ($riesgo['proyecto_nombre']) {
                        $response .= "   📁 Proyecto: " . $riesgo['proyecto_nombre'] . "\n";
                    }
                    $response .= "\n";
                }
                $response .= "¿Quieres más información sobre algún riesgo específico?";
            } else {
                $response = "No encontré riesgos críticos configurados en el sistema.\n\n";
                $response .= "Los riesgos críticos se configuran en las carpetas, definiendo el evento no deseado y creando el análisis Bowtie correspondiente.";
            }
            
            $sugerencias = [
                "Dame más detalles del primer riesgo",
                "¿Cómo se crea un análisis Bowtie?",
                "Explícame la estructura del Bowtie"
            ];
        }
        
        // Explicar Bowtie
        elseif (preg_match('/(qué es (el )?bowtie|que es (el )?bowtie|explicar bowtie|análisis bowtie|analisis bowtie|metodología bowtie|metodologia bowtie)/i', $message)) {
            $response = "🎯 **Análisis Bowtie - Metodología de Gestión de Riesgos**\n\n";
            $response .= "El Bowtie es una herramienta visual que representa los riesgos de forma estructurada:\n\n";
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
            $response .= "**Componentes:**\n";
            $response .= "• 🔴 **Causas**: Factores que pueden desencadenar el evento\n";
            $response .= "• 🛡️ **Controles Preventivos**: Barreras que evitan el evento\n";
            $response .= "• ⚠️ **Evento Central**: El peligro o incidente potencial\n";
            $response .= "• 🛡️ **Controles Mitigadores**: Barreras que reducen consecuencias\n";
            $response .= "• 🔵 **Consecuencias**: Resultados si ocurre el evento\n";
            
            $sugerencias = [
                "¿Qué son los controles críticos?",
                "¿Cuáles son las dimensiones de verificación?",
                "Dame un ejemplo de Bowtie"
            ];
        }
        
        // Controles críticos
        elseif (preg_match('/(controles críticos|controles criticos|qué son los controles|que son los controles|CCP|CCM|preventivos|mitigadores)/i', $message)) {
            $response = "🛡️ **Controles Críticos**\n\n";
            $response .= "Son las barreras más importantes para gestionar un riesgo crítico:\n\n";
            $response .= "**Controles Críticos Preventivos (CCP):**\n";
            $response .= "• Evitan que ocurra el evento no deseado\n";
            $response .= "• Se ubican entre las causas y el evento central\n";
            $response .= "• Ejemplo: Bloqueo y etiquetado (LOTO), permisos de trabajo\n\n";
            $response .= "**Controles Críticos Mitigadores (CCM):**\n";
            $response .= "• Reducen las consecuencias si el evento ocurre\n";
            $response .= "• Se ubican entre el evento central y las consecuencias\n";
            $response .= "• Ejemplo: EPP, sistemas de supresión, planes de emergencia\n\n";
            $response .= "**Jerarquía de Controles:**\n";
            $response .= "1. Eliminación del peligro\n";
            $response .= "2. Sustitución por algo menos peligroso\n";
            $response .= "3. Controles de ingeniería\n";
            $response .= "4. Controles administrativos\n";
            $response .= "5. Equipos de Protección Personal (EPP)\n";
            
            $sugerencias = [
                "¿Qué son las dimensiones de verificación?",
                "¿Cómo se evalúan los controles?",
                "Dame ejemplos de controles preventivos"
            ];
        }
        
        // Dimensiones
        elseif (preg_match('/(dimensiones|dimensión|dimension|diseño|implementación|implementacion|entrenamiento)/i', $message)) {
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
        }
        
        // Línea Base
        elseif (preg_match('/(línea base|linea base|avance|porcentaje|estado de implementación|estado de implementacion)/i', $message)) {
            $response = "📋 **Línea Base de Controles**\n\n";
            $response .= "La Línea Base registra el estado de implementación de cada control:\n\n";
            $response .= "**Información que contiene:**\n";
            $response .= "• 📊 % de avance de implementación\n";
            $response .= "• ✅ Estado de validación\n";
            $response .= "• 👤 Verificador responsable\n";
            $response .= "• 📅 Fechas de verificación y cierre\n";
            $response .= "• 🎯 Criticidad del control\n";
            $response .= "• 💬 Foro de seguimiento\n\n";
            $response .= "**Estados de validación:**\n";
            $response .= "• 🟢 Validado: Control cumple al 100%\n";
            $response .= "• 🟡 Con observaciones: Requiere mejoras\n";
            $response .= "• ⚪ Pendiente: Sin validar\n";
            
            if ($carpetaId) {
                $stats = obtenerEstadisticasLineaBase($pdo, $carpetaId);
                if ($stats && $stats['total_controles'] > 0) {
                    $response .= "\n\n**📊 Estadísticas de esta carpeta:**\n";
                    $response .= "• Total controles: " . $stats['total_controles'] . "\n";
                    $response .= "• Promedio avance: " . round($stats['promedio_avance'], 1) . "%\n";
                    $response .= "• Validados: " . $stats['validados'] . "\n";
                    $response .= "• Con observaciones: " . $stats['con_observaciones'] . "\n";
                }
            }
            
            $sugerencias = [
                "¿Quién puede editar la línea base?",
                "¿Cómo funciona el foro de seguimiento?",
                "¿Cómo se valida un control?"
            ];
        }
        
        // Foro de seguimiento
        elseif (preg_match('/(foro|seguimiento|comentarios|mensajes|respaldos)/i', $message)) {
            $response = "💬 **Foro de Seguimiento**\n\n";
            $response .= "Cada control en la Línea Base tiene un foro para:\n\n";
            $response .= "• 📝 Agregar comentarios de avance\n";
            $response .= "• 📎 Adjuntar archivos de respaldo\n";
            $response .= "• 💬 Mantener conversaciones sobre el control\n";
            $response .= "• 📋 Registrar historial de cambios\n\n";
            $response .= "**Permisos por rol:**\n";
            $response .= "• 👷 Trabajador: Agrega mensajes y elimina los propios\n";
            $response .= "• 👔 Admin: Elimina mensajes de trabajadores + propios\n";
            $response .= "• ⭐ Super Admin: Elimina todos excepto de otros super admins\n";
            
            $sugerencias = [
                "¿Qué archivos puedo adjuntar?",
                "¿Cómo elimino un mensaje?",
                "¿Quién puede validar controles?"
            ];
        }
        
        // Permisos y roles
        elseif (preg_match('/(permisos|roles|privilegios|quién puede|quien puede|acceso)/i', $message)) {
            $response = "👥 **Roles y Permisos del Sistema**\n\n";
            $response .= "**⭐ Super Admin:**\n";
            $response .= "• Acceso total al sistema\n";
            $response .= "• Gestiona usuarios, proyectos, empresas\n";
            $response .= "• Edita y valida en todos los niveles\n\n";
            $response .= "**👔 Administrador:**\n";
            $response .= "• Acceso a ajustes limitado\n";
            $response .= "• Edita y valida en nivel 2 (subcarpetas)\n";
            $response .= "• Gestiona usuarios de su proyecto\n\n";
            $response .= "**👷 Trabajador:**\n";
            $response .= "• Solo edita % de avance en nivel 2\n";
            $response .= "• Puede comentar en el foro\n";
            $response .= "• No puede validar controles\n\n";
            $response .= "**👁️ Visita:**\n";
            $response .= "• Solo puede visualizar información\n";
            $response .= "• Sin permisos de edición\n";
            
            $sugerencias = [
                "¿Cómo cambio el rol de un usuario?",
                "¿Qué puede hacer un trabajador?",
                "Ver matriz completa de permisos"
            ];
        }
        
        // Buscar información de un Bowtie específico
        elseif (preg_match('/(bowtie de|análisis de|analisis de|información de|informacion de|detalles de)/i', $message)) {
            // Extraer el nombre del riesgo buscado
            preg_match('/(bowtie de|análisis de|analisis de|información de|informacion de|detalles de)\s+(.+)/i', $message, $matches);
            $busqueda = $matches[2] ?? '';
            
            if ($busqueda) {
                $carpetas = buscarCarpeta($pdo, $busqueda);
                
                if (count($carpetas) > 0) {
                    $carpeta = $carpetas[0];
                    $bowtie = obtenerBowtieCompleto($pdo, $carpeta['id']);
                    
                    if ($bowtie) {
                        $response = "🎯 **Bowtie: " . $carpeta['nombre'] . "**\n\n";
                        
                        if ($bowtie['evento_central']) {
                            $response .= "⚠️ **Evento Central:**\n" . $bowtie['evento_central'] . "\n\n";
                        }
                        
                        if (count($bowtie['causas']) > 0) {
                            $response .= "🔴 **Causas (" . count($bowtie['causas']) . "):**\n";
                            foreach ($bowtie['causas'] as $causa) {
                                $response .= "• " . $causa['descripcion'] . "\n";
                            }
                            $response .= "\n";
                        }
                        
                        if (count($bowtie['controles_preventivos']) > 0) {
                            $response .= "🛡️ **Controles Preventivos (" . count($bowtie['controles_preventivos']) . "):**\n";
                            foreach ($bowtie['controles_preventivos'] as $cp) {
                                $codigo = $cp['codigo'] ?? '';
                                $response .= "• " . ($codigo ? "[$codigo] " : "") . $cp['descripcion'] . "\n";
                            }
                            $response .= "\n";
                        }
                        
                        if (count($bowtie['controles_mitigadores']) > 0) {
                            $response .= "🛡️ **Controles Mitigadores (" . count($bowtie['controles_mitigadores']) . "):**\n";
                            foreach ($bowtie['controles_mitigadores'] as $cm) {
                                $codigo = $cm['codigo'] ?? '';
                                $response .= "• " . ($codigo ? "[$codigo] " : "") . $cm['descripcion'] . "\n";
                            }
                            $response .= "\n";
                        }
                        
                        if (count($bowtie['consecuencias']) > 0) {
                            $response .= "🔵 **Consecuencias (" . count($bowtie['consecuencias']) . "):**\n";
                            foreach ($bowtie['consecuencias'] as $cons) {
                                $response .= "• " . $cons['descripcion'] . "\n";
                            }
                        }
                    } else {
                        $response = "Encontré la carpeta **" . $carpeta['nombre'] . "** pero no tiene un análisis Bowtie configurado aún.";
                    }
                } else {
                    $response = "No encontré un riesgo o carpeta que coincida con \"$busqueda\".\n\n";
                    $response .= "Intenta con términos como:\n• Nombre del riesgo\n• Evento no deseado\n• Tipo de energía";
                }
            } else {
                $response = "Por favor, indica el nombre del riesgo. Por ejemplo:\n• \"Bowtie de Energía Eléctrica\"\n• \"Análisis de caída de altura\"";
            }
            
            $sugerencias = [
                "¿Qué riesgos críticos hay en el sistema?",
                "Explícame los controles preventivos",
                "¿Cómo se validan los controles?"
            ];
        }
        
        // Ayuda general
        elseif (preg_match('/(ayuda|help|qué puedes|que puedes|cómo funciona|como funciona)/i', $message)) {
            $response = "🤖 **Soy tu Asistente de Riesgos Críticos**\n\n";
            $response .= "Puedo ayudarte con:\n\n";
            $response .= "📊 **Riesgos y Bowtie:**\n";
            $response .= "• Listar riesgos críticos del sistema\n";
            $response .= "• Explicar la metodología Bowtie\n";
            $response .= "• Mostrar detalles de un Bowtie específico\n\n";
            $response .= "🛡️ **Controles:**\n";
            $response .= "• Explicar controles preventivos y mitigadores\n";
            $response .= "• Describir las dimensiones de verificación\n";
            $response .= "• Informar sobre la jerarquía de controles\n\n";
            $response .= "📋 **Sistema:**\n";
            $response .= "• Roles y permisos de usuarios\n";
            $response .= "• Línea base y su funcionamiento\n";
            $response .= "• Foro de seguimiento\n\n";
            $response .= "**Ejemplos de preguntas:**\n";
            $response .= "• \"¿Qué riesgos críticos hay?\"\n";
            $response .= "• \"Explícame el Bowtie\"\n";
            $response .= "• \"Bowtie de Energía Eléctrica\"\n";
            $response .= "• \"¿Qué son las dimensiones?\"";
            
            $sugerencias = [
                "¿Qué riesgos críticos hay?",
                "Explícame el análisis Bowtie",
                "¿Qué son los controles críticos?"
            ];
        }
        
        // Respuesta por defecto
        else {
            // Intentar buscar si menciona algún riesgo
            $carpetas = buscarCarpeta($pdo, $message);
            
            if (count($carpetas) > 0) {
                $response = "🔍 Encontré estos riesgos relacionados con tu búsqueda:\n\n";
                foreach ($carpetas as $i => $carpeta) {
                    $response .= ($i + 1) . ". **" . $carpeta['nombre'] . "**\n";
                    if ($carpeta['evento_no_deseado']) {
                        $response .= "   ⚠️ " . $carpeta['evento_no_deseado'] . "\n";
                    }
                }
                $response .= "\n¿Quieres que te muestre el Bowtie de alguno?";
                
                $sugerencias = array_map(function($c) {
                    return "Bowtie de " . $c['nombre'];
                }, array_slice($carpetas, 0, 3));
        } else {
                $response = "No estoy seguro de entender tu pregunta sobre: \"$message\"\n\n";
                $response .= "Puedo ayudarte con:\n";
                $response .= "• 📊 Riesgos críticos y Bowtie\n";
                $response .= "• 🛡️ Controles preventivos y mitigadores\n";
                $response .= "• 📐 Dimensiones de verificación\n";
                $response .= "• 📋 Línea base y seguimiento\n";
                $response .= "• 👥 Roles y permisos\n\n";
                $response .= "Intenta preguntar de otra forma o usa una de las sugerencias.";
                
                $sugerencias = [
                    "¿Qué riesgos críticos hay?",
                    "Explícame el análisis Bowtie",
                    "¿Qué son los controles críticos?",
                    "¿Cuáles son las dimensiones?"
                ];
            }
        }

    echo json_encode([
        'success' => true,
            'response' => $response,
            'sugerencias' => $sugerencias
        ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
            'error' => 'Error al procesar el mensaje: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
}
    exit;
}

// GET: Obtener sugerencias iniciales
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sugerencias = [
        "¿Qué riesgos críticos hay en el sistema?",
        "Explícame qué es el análisis Bowtie",
        "¿Qué son los controles críticos preventivos?",
        "¿Cuáles son las dimensiones de verificación?",
        "¿Cómo funciona la línea base?",
        "¿Qué roles hay en el sistema?"
    ];
    
    echo json_encode([
        'success' => true,
        'sugerencias' => $sugerencias,
        'mensaje_bienvenida' => "¡Hola! Soy tu asistente de Riesgos Críticos. ¿En qué puedo ayudarte?"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
