<?php
/**
 * API para gestión de carpetas de documentos en Línea Base
 * Permite crear estructura de carpetas tipo OneDrive
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

// Verificar/crear tabla si no existe
function verificarTabla($pdo) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'linea_base_carpetas'");
        if ($stmt->rowCount() === 0) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS linea_base_carpetas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                linea_base_id INT NOT NULL,
                carpeta_padre_id INT DEFAULT NULL,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT DEFAULT NULL,
                color VARCHAR(7) DEFAULT '#17a2b8',
                creado_por INT NOT NULL,
                creado_por_nombre VARCHAR(255) DEFAULT NULL,
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                activo TINYINT(1) DEFAULT 1,
                INDEX idx_linea_base (linea_base_id),
                INDEX idx_carpeta_padre (carpeta_padre_id),
                INDEX idx_activo (activo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
        }
    } catch (PDOException $e) {
        // Tabla ya existe, ignorar
    }
}

verificarTabla($pdo);

// GET: Obtener carpetas de un registro de línea base
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $linea_base_id = isset($_GET['linea_base_id']) ? intval($_GET['linea_base_id']) : null;
    $carpeta_padre_id = isset($_GET['carpeta_padre_id']) ? ($_GET['carpeta_padre_id'] === 'null' ? null : intval($_GET['carpeta_padre_id'])) : null;
    
    if (!$linea_base_id) {
        echo json_encode(['success' => false, 'error' => 'linea_base_id es requerido']);
        exit();
    }
    
    try {
        // Log para debugging
        error_log("[linea_base_carpetas.php] GET - linea_base_id: $linea_base_id, carpeta_padre_id: " . ($carpeta_padre_id ?? 'null'));
        
        // Obtener carpetas - DOBLE VALIDACIÓN para asegurar que solo se devuelvan carpetas del linea_base_id correcto
        if ($carpeta_padre_id === null) {
            $stmt = $pdo->prepare("SELECT * FROM linea_base_carpetas WHERE linea_base_id = ? AND carpeta_padre_id IS NULL AND activo = 1 ORDER BY nombre ASC");
            $stmt->execute([$linea_base_id]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM linea_base_carpetas WHERE linea_base_id = ? AND carpeta_padre_id = ? AND activo = 1 ORDER BY nombre ASC");
            $stmt->execute([$linea_base_id, $carpeta_padre_id]);
        }
        $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // VALIDACIÓN ADICIONAL: Filtrar explícitamente por linea_base_id (por si acaso hay algún problema en la BD)
        $carpetas = array_filter($carpetas, function($c) use ($linea_base_id) {
            return intval($c['linea_base_id']) === intval($linea_base_id);
        });
        $carpetas = array_values($carpetas); // Re-indexar el array
        
        error_log("[linea_base_carpetas.php] GET - Carpetas encontradas: " . count($carpetas) . " para linea_base_id: $linea_base_id");
        
        // Obtener archivos de la carpeta actual
        $stmtArchivos = $pdo->query("SHOW TABLES LIKE 'linea_base_archivos'");
        $archivos = [];
        if ($stmtArchivos->rowCount() > 0) {
            if ($carpeta_padre_id === null) {
                $stmt2 = $pdo->prepare("SELECT * FROM linea_base_archivos WHERE linea_base_id = ? AND carpeta_id IS NULL AND activo = 1 ORDER BY nombre_original ASC");
                $stmt2->execute([$linea_base_id]);
            } else {
                $stmt2 = $pdo->prepare("SELECT * FROM linea_base_archivos WHERE linea_base_id = ? AND carpeta_id = ? AND activo = 1 ORDER BY nombre_original ASC");
                $stmt2->execute([$linea_base_id, $carpeta_padre_id]);
            }
            $archivos = $stmt2->fetchAll(PDO::FETCH_ASSOC);
            
            // VALIDACIÓN ADICIONAL: Filtrar explícitamente por linea_base_id
            $archivos = array_filter($archivos, function($a) use ($linea_base_id) {
                return intval($a['linea_base_id']) === intval($linea_base_id);
            });
            $archivos = array_values($archivos); // Re-indexar el array
        }
        
        // Obtener ruta de navegación (breadcrumbs)
        $breadcrumbs = [];
        if ($carpeta_padre_id !== null) {
            $currentId = $carpeta_padre_id;
            while ($currentId !== null) {
                $stmtBread = $pdo->prepare("SELECT id, nombre, carpeta_padre_id FROM linea_base_carpetas WHERE id = ?");
                $stmtBread->execute([$currentId]);
                $carpeta = $stmtBread->fetch(PDO::FETCH_ASSOC);
                if ($carpeta) {
                    array_unshift($breadcrumbs, ['id' => $carpeta['id'], 'nombre' => $carpeta['nombre']]);
                    $currentId = $carpeta['carpeta_padre_id'];
                } else {
                    break;
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'carpetas' => $carpetas,
            'archivos' => $archivos,
            'breadcrumbs' => $breadcrumbs,
            'carpeta_actual' => $carpeta_padre_id
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

// POST: Crear nueva carpeta
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    
    // Log para debugging
    error_log("[linea_base_carpetas.php] POST recibido - Raw input: " . substr($rawInput, 0, 500));
    error_log("[linea_base_carpetas.php] POST recibido - Data parsed: " . json_encode($data));
    
    $linea_base_id = intval($data['linea_base_id'] ?? 0);
    $carpeta_padre_id = isset($data['carpeta_padre_id']) && $data['carpeta_padre_id'] !== null ? intval($data['carpeta_padre_id']) : null;
    $carpeta_id = intval($data['carpeta_id'] ?? 0); // ID de la carpeta empresa (Nivel 2)
    $tipo = $data['tipo'] ?? 'preventivo'; // 'preventivo' o 'mitigador'
    $control_id = intval($data['control_id'] ?? 0); // ID del control preventivo o mitigador
    $dimension = trim($data['dimension'] ?? '');
    $pregunta = trim($data['pregunta'] ?? '');
    $evidencia = trim($data['evidencia'] ?? '');
    $nombre = trim($data['nombre'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $color = $data['color'] ?? '#17a2b8';
    $creado_por = intval($data['usuario_id'] ?? 0);
    $creado_por_nombre = $data['usuario_nombre'] ?? '';
    
    error_log("[linea_base_carpetas.php] POST - linea_base_id: $linea_base_id, carpeta_id: $carpeta_id, tipo: $tipo, control_id: $control_id, nombre: '$nombre', usuario_id: $creado_por, carpeta_padre_id: " . ($carpeta_padre_id ?? 'null'));
    error_log("[linea_base_carpetas.php] POST - Propiedades para búsqueda: dimension='$dimension', pregunta length=" . strlen($pregunta) . ", evidencia length=" . strlen($evidencia));
    
    if (!$linea_base_id || !$nombre || !$creado_por) {
        $errorMsg = 'linea_base_id, nombre y usuario_id son requeridos';
        error_log("[linea_base_carpetas.php] POST ERROR: $errorMsg - linea_base_id: $linea_base_id, nombre: '$nombre', usuario_id: $creado_por");
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => $errorMsg,
            'debug' => [
                'linea_base_id' => $linea_base_id,
                'nombre' => $nombre,
                'usuario_id' => $creado_por,
                'data_received' => $data
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    try {
        // Verificar que la tabla existe
        verificarTabla($pdo);
        
        // CRÍTICO: Validar que el linea_base_id existe en la base de datos
        // Verificar en ambas tablas: carpeta_linea_base y carpeta_linea_base_mitigadores
        $lineaBaseExiste = false;
        $tablaOrigen = null;
        
        // Verificar en carpeta_linea_base (SIN filtro activo primero para debug)
        $stmt_check = $pdo->prepare("SELECT id, activo FROM carpeta_linea_base WHERE id = ?");
        $stmt_check->execute([$linea_base_id]);
        $resultado_preventivo = $stmt_check->fetch(PDO::FETCH_ASSOC);
        if ($resultado_preventivo) {
            if ($resultado_preventivo['activo'] == 1) {
                $lineaBaseExiste = true;
                $tablaOrigen = 'carpeta_linea_base';
            } else {
                error_log("[linea_base_carpetas.php] POST DEBUG: ID $linea_base_id existe en carpeta_linea_base pero está inactivo (activo=" . $resultado_preventivo['activo'] . ")");
            }
        }
        
        // Si no existe en carpeta_linea_base, verificar en carpeta_linea_base_mitigadores
        if (!$lineaBaseExiste) {
            $stmt_check_mit = $pdo->prepare("SELECT id, activo FROM carpeta_linea_base_mitigadores WHERE id = ?");
            $stmt_check_mit->execute([$linea_base_id]);
            $resultado_mitigadores = $stmt_check_mit->fetch(PDO::FETCH_ASSOC);
            if ($resultado_mitigadores) {
                if ($resultado_mitigadores['activo'] == 1) {
                    $lineaBaseExiste = true;
                    $tablaOrigen = 'carpeta_linea_base_mitigadores';
                } else {
                    error_log("[linea_base_carpetas.php] POST DEBUG: ID $linea_base_id existe en carpeta_linea_base_mitigadores pero está inactivo (activo=" . $resultado_mitigadores['activo'] . ")");
                }
            }
        }
        
        // Si no existe, buscar el registro recién creado usando las propiedades únicas
        if (!$lineaBaseExiste) {
            error_log("[linea_base_carpetas.php] POST WARNING: linea_base_id ($linea_base_id) no existe. Verificando datos para búsqueda...");
            error_log("[linea_base_carpetas.php] POST DEBUG - carpeta_id: $carpeta_id, control_id: $control_id, dimension: '$dimension', pregunta: " . (strlen($pregunta) > 0 ? 'presente (' . strlen($pregunta) . ' chars)' : 'vacía') . ", evidencia: " . (strlen($evidencia) > 0 ? 'presente (' . strlen($evidencia) . ' chars)' : 'vacía'));
            
            // Intentar búsqueda por propiedades únicas si tenemos los datos necesarios
            if ($carpeta_id && $control_id && !empty($dimension) && !empty($pregunta) && !empty($evidencia)) {
                error_log("[linea_base_carpetas.php] POST: Buscando registro por propiedades únicas...");
                
                $tabla_buscar = $tipo === 'mitigador' ? 'carpeta_linea_base_mitigadores' : 'carpeta_linea_base';
                $campo_control = $tipo === 'mitigador' ? 'control_mitigador_id' : 'control_preventivo_id';
                
                error_log("[linea_base_carpetas.php] POST: Buscando en tabla '$tabla_buscar' con campo '$campo_control'");
                
                $stmt_buscar = $pdo->prepare("
                    SELECT id FROM $tabla_buscar 
                    WHERE carpeta_id = ? 
                      AND $campo_control = ? 
                      AND dimension = ? 
                      AND pregunta = ? 
                      AND evidencia = ? 
                      AND activo = 1 
                    ORDER BY id DESC 
                    LIMIT 1
                ");
                $stmt_buscar->execute([$carpeta_id, $control_id, $dimension, $pregunta, $evidencia]);
                $encontrado = $stmt_buscar->fetch(PDO::FETCH_ASSOC);
                
                if ($encontrado && $encontrado['id']) {
                    $id_real = intval($encontrado['id']);
                    error_log("[linea_base_carpetas.php] POST: ✓ Encontrado registro con ID real: $id_real, usando este en lugar de $linea_base_id");
                    $linea_base_id = $id_real;
                    $lineaBaseExiste = true;
                    $tablaOrigen = $tabla_buscar;
                } else {
                    error_log("[linea_base_carpetas.php] POST: ✗ No se encontró registro con esas propiedades únicas");
                }
            } else {
                error_log("[linea_base_carpetas.php] POST: Datos insuficientes para búsqueda por propiedades únicas. Faltantes: " . 
                    (!$carpeta_id ? 'carpeta_id ' : '') .
                    (!$control_id ? 'control_id ' : '') .
                    (empty($dimension) ? 'dimension ' : '') .
                    (empty($pregunta) ? 'pregunta ' : '') .
                    (empty($evidencia) ? 'evidencia ' : ''));
            }
        }
        
        // Si aún no existe, buscar el último ID creado recientemente (último recurso - 60 segundos)
        if (!$lineaBaseExiste) {
            error_log("[linea_base_carpetas.php] POST WARNING: linea_base_id ($linea_base_id) no existe. Buscando último registro reciente (60 seg)...");
            
            // Si tenemos carpeta_id, buscar el último registro para esa carpeta específica
            if ($carpeta_id) {
                $stmt_reciente_carpeta = $pdo->prepare("
                    SELECT id FROM carpeta_linea_base 
                    WHERE carpeta_id = ? 
                      AND activo = 1 
                      AND creado_en >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
                    ORDER BY id DESC 
                    LIMIT 1
                ");
                $stmt_reciente_carpeta->execute([$carpeta_id]);
                $reciente_carpeta = $stmt_reciente_carpeta->fetch(PDO::FETCH_ASSOC);
                
                if ($reciente_carpeta && $reciente_carpeta['id']) {
                    $id_real = intval($reciente_carpeta['id']);
                    error_log("[linea_base_carpetas.php] POST: ✓ Encontrado registro reciente para carpeta_id=$carpeta_id con ID: $id_real, usando este en lugar de $linea_base_id");
                    $linea_base_id = $id_real;
                    $lineaBaseExiste = true;
                    $tablaOrigen = 'carpeta_linea_base';
                }
            }
            
            // Si aún no encontramos, buscar el último registro global (sin filtro de carpeta)
            if (!$lineaBaseExiste) {
                $stmt_reciente = $pdo->prepare("
                    SELECT id FROM carpeta_linea_base 
                    WHERE activo = 1 
                    AND creado_en >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
                    ORDER BY id DESC 
                    LIMIT 1
                ");
                $stmt_reciente->execute();
                $reciente = $stmt_reciente->fetch(PDO::FETCH_ASSOC);
                
                if ($reciente && $reciente['id']) {
                    $id_real = intval($reciente['id']);
                    error_log("[linea_base_carpetas.php] POST: ✓ Encontrado registro reciente global con ID: $id_real, usando este en lugar de $linea_base_id");
                    $linea_base_id = $id_real;
                    $lineaBaseExiste = true;
                    $tablaOrigen = 'carpeta_linea_base';
                } else {
                    // Último recurso: buscar en mitigadores
                    $stmt_reciente_mit = $pdo->prepare("
                        SELECT id FROM carpeta_linea_base_mitigadores 
                        WHERE activo = 1 
                        AND creado_en >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
                        ORDER BY id DESC 
                        LIMIT 1
                    ");
                    $stmt_reciente_mit->execute();
                    $reciente_mit = $stmt_reciente_mit->fetch(PDO::FETCH_ASSOC);
                    
                    if ($reciente_mit && $reciente_mit['id']) {
                        $id_real = intval($reciente_mit['id']);
                        error_log("[linea_base_carpetas.php] POST: ✓ Encontrado registro reciente en mitigadores con ID: $id_real, usando este en lugar de $linea_base_id");
                        $linea_base_id = $id_real;
                        $lineaBaseExiste = true;
                        $tablaOrigen = 'carpeta_linea_base_mitigadores';
                    }
                }
            }
        }
        
        // Si aún no existe, rechazar con error
        if (!$lineaBaseExiste) {
            $errorMsg = "El linea_base_id ($linea_base_id) no existe en la base de datos";
            error_log("[linea_base_carpetas.php] POST ERROR: $errorMsg");
            
            $stmt_debug = $pdo->query("SELECT MAX(id) as max_id FROM carpeta_linea_base");
            $max_preventivo = $stmt_debug->fetch(PDO::FETCH_ASSOC);
            $stmt_debug2 = $pdo->query("SELECT MAX(id) as max_id FROM carpeta_linea_base_mitigadores");
            $max_mitigadores = $stmt_debug2->fetch(PDO::FETCH_ASSOC);
            
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => $errorMsg,
                'debug' => [
                    'linea_base_id' => $linea_base_id,
                    'verificado_en' => ['carpeta_linea_base', 'carpeta_linea_base_mitigadores'],
                    'max_id_preventivo' => $max_preventivo['max_id'] ?? null,
                    'max_id_mitigadores' => $max_mitigadores['max_id'] ?? null,
                    'sugerencia' => 'Por favor, guarde la línea base primero y asegúrese de que se haya guardado correctamente.'
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
        
        error_log("[linea_base_carpetas.php] POST - linea_base_id validado: $linea_base_id existe en tabla: $tablaOrigen");
        
        // Si hay carpeta_padre_id, validar que pertenece al mismo linea_base_id
        if ($carpeta_padre_id !== null) {
            $stmt_check_padre = $pdo->prepare("SELECT linea_base_id FROM linea_base_carpetas WHERE id = ? AND activo = 1");
            $stmt_check_padre->execute([$carpeta_padre_id]);
            $carpetaPadre = $stmt_check_padre->fetch(PDO::FETCH_ASSOC);
            
            if (!$carpetaPadre) {
                $errorMsg = "La carpeta padre (ID: $carpeta_padre_id) no existe o está inactiva";
                error_log("[linea_base_carpetas.php] POST ERROR: $errorMsg");
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $errorMsg,
                    'debug' => [
                        'carpeta_padre_id' => $carpeta_padre_id
                    ]
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }
            
            if (intval($carpetaPadre['linea_base_id']) !== intval($linea_base_id)) {
                $errorMsg = "La carpeta padre pertenece a otro linea_base_id. Carpeta padre: {$carpetaPadre['linea_base_id']}, Solicitado: $linea_base_id";
                error_log("[linea_base_carpetas.php] POST ERROR: $errorMsg");
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $errorMsg,
                    'debug' => [
                        'carpeta_padre_id' => $carpeta_padre_id,
                        'linea_base_id_carpeta_padre' => $carpetaPadre['linea_base_id'],
                        'linea_base_id_solicitado' => $linea_base_id
                    ]
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }
            
            error_log("[linea_base_carpetas.php] POST - carpeta_padre_id validado: $carpeta_padre_id pertenece al mismo linea_base_id: $linea_base_id");
        }
        
        error_log("[linea_base_carpetas.php] POST - Intentando INSERT: linea_base_id=$linea_base_id, nombre='$nombre', carpeta_padre_id=" . ($carpeta_padre_id ?? 'null'));
        $stmt = $pdo->prepare("INSERT INTO linea_base_carpetas (linea_base_id, carpeta_padre_id, nombre, descripcion, color, creado_por, creado_por_nombre) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$linea_base_id, $carpeta_padre_id, $nombre, $descripcion, $color, $creado_por, $creado_por_nombre]);
        
        $nuevaId = $pdo->lastInsertId();
        error_log("[linea_base_carpetas.php] POST - Carpeta creada exitosamente con ID: $nuevaId");
        
        echo json_encode([
            'success' => true,
            'mensaje' => 'Carpeta creada exitosamente',
            'carpeta' => [
                'id' => $nuevaId,
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'color' => $color
            ]
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        $errorMsg = $e->getMessage();
        $errorCode = $e->getCode();
        error_log("[linea_base_carpetas.php] POST ERROR PDO: $errorMsg (Código: $errorCode)");
        error_log("[linea_base_carpetas.php] POST ERROR Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => $errorMsg,
            'error_code' => $errorCode,
            'debug' => [
                'linea_base_id' => $linea_base_id,
                'nombre' => $nombre,
                'usuario_id' => $creado_por
            ]
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        $errorMsg = $e->getMessage();
        error_log("[linea_base_carpetas.php] POST ERROR Exception: $errorMsg");
        error_log("[linea_base_carpetas.php] POST ERROR Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => 'Error inesperado: ' . $errorMsg,
            'error_type' => get_class($e)
        ], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

// PUT: Actualizar carpeta
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = intval($data['id'] ?? 0);
    $nombre = trim($data['nombre'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $color = $data['color'] ?? '#17a2b8';
    
    if (!$id || !$nombre) {
        echo json_encode(['success' => false, 'error' => 'id y nombre son requeridos']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE linea_base_carpetas SET nombre = ?, descripcion = ?, color = ? WHERE id = ?");
        $stmt->execute([$nombre, $descripcion, $color, $id]);
        
        echo json_encode(['success' => true, 'mensaje' => 'Carpeta actualizada'], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

// DELETE: Eliminar carpeta (soft delete)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = intval($data['id'] ?? 0);
    
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'id es requerido']);
        exit();
    }
    
    try {
        // Soft delete de la carpeta y sus subcarpetas recursivamente
        $pdo->beginTransaction();
        
        // Función para eliminar recursivamente
        $eliminarRecursivo = function($carpetaId) use ($pdo, &$eliminarRecursivo) {
            // Obtener subcarpetas
            $stmt = $pdo->prepare("SELECT id FROM linea_base_carpetas WHERE carpeta_padre_id = ? AND activo = 1");
            $stmt->execute([$carpetaId]);
            $subcarpetas = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Eliminar subcarpetas recursivamente
            foreach ($subcarpetas as $subId) {
                $eliminarRecursivo($subId);
            }
            
            // Eliminar archivos de esta carpeta
            $stmtArchivos = $pdo->prepare("UPDATE linea_base_archivos SET activo = 0 WHERE carpeta_id = ?");
            $stmtArchivos->execute([$carpetaId]);
            
            // Eliminar la carpeta
            $stmtCarpeta = $pdo->prepare("UPDATE linea_base_carpetas SET activo = 0 WHERE id = ?");
            $stmtCarpeta->execute([$carpetaId]);
        };
        
        $eliminarRecursivo($id);
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'mensaje' => 'Carpeta eliminada'], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
?>












