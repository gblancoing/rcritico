<?php
/**
 * API para duplicar una carpeta y todas sus subcarpetas (sin archivos)
 * Crea una copia exacta de la estructura de carpetas incluyendo:
 * - Subcarpetas (tabla carpetas)
 * - Carpetas de archivos (tabla archivos_carpetas)
 * - Registros de línea base preventivos (tabla carpeta_linea_base)
 * - Registros de línea base mitigadores (tabla carpeta_linea_base_mitigadores)
 * - Carpetas de documentos de línea base (tabla linea_base_carpetas)
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$carpeta_id = isset($data['carpeta_id']) ? intval($data['carpeta_id']) : 0;
$usuario_id = isset($data['usuario_id']) ? intval($data['usuario_id']) : 0;
$nuevo_nombre = isset($data['nuevo_nombre']) ? trim($data['nuevo_nombre']) : null;

if (!$carpeta_id || !$usuario_id) {
    http_response_code(400);
    echo json_encode(['error' => 'carpeta_id y usuario_id son requeridos'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Obtener información de la carpeta original
    $stmt = $pdo->prepare("SELECT * FROM carpetas WHERE id = ? AND activo = 1");
    $stmt->execute([$carpeta_id]);
    $carpetaOriginal = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$carpetaOriginal) {
        http_response_code(404);
        echo json_encode(['error' => 'Carpeta no encontrada'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Generar nombre para la copia si no se proporciona
    if (!$nuevo_nombre) {
        $nuevo_nombre = $carpetaOriginal['nombre'] . ' (Copia)';
        
        // Verificar si ya existe una copia y agregar número
        $contador = 1;
        $nombreBase = $nuevo_nombre;
        while (true) {
            $stmt_check = $pdo->prepare("SELECT id FROM carpetas WHERE nombre = ? AND proyecto_id = ? AND carpeta_padre_id IS NULL AND activo = 1");
            $stmt_check->execute([$nuevo_nombre, $carpetaOriginal['proyecto_id']]);
            if (!$stmt_check->fetch()) {
                break;
            }
            $contador++;
            $nuevo_nombre = $nombreBase . ' ' . $contador;
        }
    }
    
    // Iniciar transacción
    $pdo->beginTransaction();
    
    // Función recursiva para duplicar carpetas
    function duplicarCarpetaRecursivo($pdo, $carpetaId, $nuevoPadreId, $usuarioId, $nuevoNombre = null) {
        // Obtener datos de la carpeta
        $stmt = $pdo->prepare("SELECT * FROM carpetas WHERE id = ? AND activo = 1");
        $stmt->execute([$carpetaId]);
        $carpeta = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$carpeta) {
            return null;
        }
        
        // Crear la nueva carpeta
        $nombre = $nuevoNombre ?: $carpeta['nombre'];
        
        $stmt_insert = $pdo->prepare("
            INSERT INTO carpetas (
                nombre, descripcion, proyecto_id, centro_costo_id, carpeta_padre_id, 
                creado_por, color_primario, color_secundario, icono_url,
                evento_no_deseado, evento_riesgo, controles_supervisor, 
                controles_trabajador, informacion_riesgo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt_insert->execute([
            $nombre,
            $carpeta['descripcion'],
            $carpeta['proyecto_id'],
            $carpeta['centro_costo_id'],
            $nuevoPadreId,
            $usuarioId,
            $carpeta['color_primario'],
            $carpeta['color_secundario'],
            $carpeta['icono_url'],
            $carpeta['evento_no_deseado'],
            $carpeta['evento_riesgo'],
            $carpeta['controles_supervisor'],
            $carpeta['controles_trabajador'],
            $carpeta['informacion_riesgo']
        ]);
        
        $nuevaCarpetaId = $pdo->lastInsertId();
        
        // Duplicar subcarpetas recursivamente
        $stmt_hijos = $pdo->prepare("SELECT id FROM carpetas WHERE carpeta_padre_id = ? AND activo = 1");
        $stmt_hijos->execute([$carpetaId]);
        $hijos = $stmt_hijos->fetchAll(PDO::FETCH_COLUMN);
        
        $subcarpetasDuplicadas = 0;
        foreach ($hijos as $hijoId) {
            $resultado = duplicarCarpetaRecursivo($pdo, $hijoId, $nuevaCarpetaId, $usuarioId);
            if ($resultado) {
                $subcarpetasDuplicadas += $resultado['total'];
            }
        }
        
        // Duplicar carpetas de archivos (archivos_carpetas) si existen
        try {
            $stmt_check = $pdo->query("SHOW TABLES LIKE 'archivos_carpetas'");
            if ($stmt_check->rowCount() > 0) {
                duplicarArchivosCarpetasRecursivo($pdo, $carpetaId, $nuevaCarpetaId, $usuarioId, null);
            }
        } catch (Exception $e) {
            // Tabla no existe, continuar
        }
        
        // Duplicar línea base (controles preventivos) y sus carpetas de documentos
        try {
            duplicarLineaBase($pdo, $carpetaId, $nuevaCarpetaId, $usuarioId);
        } catch (Exception $e) {
            // Tabla no existe o error, continuar
        }
        
        // Duplicar línea base mitigadores
        try {
            duplicarLineaBaseMitigadores($pdo, $carpetaId, $nuevaCarpetaId, $usuarioId);
        } catch (Exception $e) {
            // Tabla no existe o error, continuar
        }
        
        return [
            'id' => $nuevaCarpetaId,
            'nombre' => $nombre,
            'total' => 1 + $subcarpetasDuplicadas
        ];
    }
    
    // Función para duplicar carpetas de archivos
    function duplicarArchivosCarpetasRecursivo($pdo, $carpetaOriginalId, $nuevaCarpetaId, $usuarioId, $padreArchivosCarpetaId) {
        // Obtener carpetas de archivos en este nivel
        if ($padreArchivosCarpetaId === null) {
            $stmt = $pdo->prepare("SELECT * FROM archivos_carpetas WHERE carpeta_id = ? AND carpeta_padre_id IS NULL AND activo = 1");
            $stmt->execute([$carpetaOriginalId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM archivos_carpetas WHERE carpeta_padre_id = ? AND activo = 1");
            $stmt->execute([$padreArchivosCarpetaId]);
        }
        
        $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($carpetas as $carpeta) {
            // Crear copia de la carpeta
            $stmt_insert = $pdo->prepare("
                INSERT INTO archivos_carpetas (nombre, descripcion, carpeta_id, carpeta_padre_id, creado_por, color, icono)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $nuevoPadreId = $padreArchivosCarpetaId === null ? null : $padreArchivosCarpetaId;
            
            $stmt_insert->execute([
                $carpeta['nombre'],
                $carpeta['descripcion'],
                $nuevaCarpetaId,
                $nuevoPadreId,
                $usuarioId,
                $carpeta['color'],
                $carpeta['icono']
            ]);
            
            $nuevaArchivosCarpetaId = $pdo->lastInsertId();
            
            // Duplicar subcarpetas de archivos recursivamente
            duplicarArchivosCarpetasRecursivo($pdo, $carpetaOriginalId, $nuevaCarpetaId, $usuarioId, $carpeta['id']);
        }
    }
    
    // Función para duplicar registros de línea base (controles preventivos)
    // SOLO copia la estructura básica (código, dimensión, pregunta, evidencia) y las carpetas de documentos
    // NO copia los datos de seguimiento (porcentaje, fechas, responsables, etc.)
    function duplicarLineaBase($pdo, $carpetaOriginalId, $nuevaCarpetaId, $usuarioId) {
        // Verificar si existe la tabla
        $stmt_check = $pdo->query("SHOW TABLES LIKE 'carpeta_linea_base'");
        if ($stmt_check->rowCount() === 0) {
            return; // Tabla no existe
        }
        
        // Obtener registros de línea base de la carpeta original
        $stmt = $pdo->prepare("SELECT * FROM carpeta_linea_base WHERE carpeta_id = ? AND activo = 1");
        $stmt->execute([$carpetaOriginalId]);
        $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($registros as $registro) {
            $lineaBaseOriginalId = $registro['id'];
            
            // Insertar copia del registro de línea base SOLO con estructura básica
            // Los campos de seguimiento quedan en NULL o vacíos
            $stmt_insert = $pdo->prepare("
                INSERT INTO carpeta_linea_base (
                    carpeta_id, control_preventivo_id, codigo, dimension, pregunta,
                    evidencia, verificador_responsable, fecha_verificacion,
                    implementado_estandar, accion_ejecutar, responsable_cierre,
                    fecha_cierre, criticidad, porcentaje_avance, nombre_dueno_control,
                    ultimo_usuario_edito, estado_validacion, comentario_validacion,
                    usuario_validacion, fecha_validacion, ponderacion, orden, activo
                ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, 1)
            ");
            
            // Solo copiar: carpeta_id, control_preventivo_id, codigo, dimension, pregunta, evidencia, orden
            $stmt_insert->execute([
                $nuevaCarpetaId,
                $registro['control_preventivo_id'],
                $registro['codigo'],
                $registro['dimension'],
                $registro['pregunta'],
                $registro['evidencia'],
                $registro['orden']
            ]);
            
            $nuevaLineaBaseId = $pdo->lastInsertId();
            
            // Duplicar carpetas de documentos de línea base
            duplicarLineaBaseCarpetasRecursivo($pdo, $lineaBaseOriginalId, $nuevaLineaBaseId, $usuarioId, null, null);
        }
    }
    
    // Función para duplicar registros de línea base mitigadores
    // SOLO copia la estructura básica (código, dimensión, pregunta, evidencia)
    // NO copia los datos de seguimiento (porcentaje, fechas, responsables, etc.)
    function duplicarLineaBaseMitigadores($pdo, $carpetaOriginalId, $nuevaCarpetaId, $usuarioId) {
        // Verificar si existe la tabla
        $stmt_check = $pdo->query("SHOW TABLES LIKE 'carpeta_linea_base_mitigadores'");
        if ($stmt_check->rowCount() === 0) {
            return; // Tabla no existe
        }
        
        // Obtener registros de línea base mitigadores de la carpeta original
        $stmt = $pdo->prepare("SELECT * FROM carpeta_linea_base_mitigadores WHERE carpeta_id = ? AND activo = 1");
        $stmt->execute([$carpetaOriginalId]);
        $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($registros as $registro) {
            // Insertar copia del registro SOLO con estructura básica
            // Los campos de seguimiento quedan en NULL o vacíos
            $stmt_insert = $pdo->prepare("
                INSERT INTO carpeta_linea_base_mitigadores (
                    carpeta_id, control_mitigador_id, codigo, dimension, pregunta,
                    evidencia, verificador_responsable, fecha_verificacion,
                    implementado_estandar, accion_ejecutar, responsable_cierre,
                    fecha_cierre, criticidad, porcentaje_avance, nombre_dueno_control,
                    ultimo_usuario_edito, estado_validacion, comentario_validacion,
                    usuario_validacion, fecha_validacion, ponderacion, orden, activo
                ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, 1)
            ");
            
            // Solo copiar: carpeta_id, control_mitigador_id, codigo, dimension, pregunta, evidencia, orden
            $stmt_insert->execute([
                $nuevaCarpetaId,
                $registro['control_mitigador_id'],
                $registro['codigo'],
                $registro['dimension'],
                $registro['pregunta'],
                $registro['evidencia'],
                $registro['orden']
            ]);
        }
    }
    
    // Función recursiva para duplicar carpetas de documentos de línea base
    function duplicarLineaBaseCarpetasRecursivo($pdo, $lineaBaseOriginalId, $nuevaLineaBaseId, $usuarioId, $carpetaPadreOriginalId, $nuevaCarpetaPadreId) {
        // Verificar si existe la tabla
        $stmt_check = $pdo->query("SHOW TABLES LIKE 'linea_base_carpetas'");
        if ($stmt_check->rowCount() === 0) {
            return; // Tabla no existe
        }
        
        // Obtener carpetas en este nivel
        if ($carpetaPadreOriginalId === null) {
            $stmt = $pdo->prepare("SELECT * FROM linea_base_carpetas WHERE linea_base_id = ? AND carpeta_padre_id IS NULL AND activo = 1");
            $stmt->execute([$lineaBaseOriginalId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM linea_base_carpetas WHERE carpeta_padre_id = ? AND activo = 1");
            $stmt->execute([$carpetaPadreOriginalId]);
        }
        
        $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($carpetas as $carpeta) {
            $carpetaOriginalId = $carpeta['id'];
            
            // Crear copia de la carpeta
            $stmt_insert = $pdo->prepare("
                INSERT INTO linea_base_carpetas (linea_base_id, carpeta_padre_id, nombre, descripcion, color, creado_por, creado_por_nombre, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            ");
            
            $stmt_insert->execute([
                $nuevaLineaBaseId,
                $nuevaCarpetaPadreId,
                $carpeta['nombre'],
                $carpeta['descripcion'],
                $carpeta['color'],
                $usuarioId,
                $carpeta['creado_por_nombre']
            ]);
            
            $nuevaCarpetaId = $pdo->lastInsertId();
            
            // Duplicar subcarpetas recursivamente
            duplicarLineaBaseCarpetasRecursivo($pdo, $lineaBaseOriginalId, $nuevaLineaBaseId, $usuarioId, $carpetaOriginalId, $nuevaCarpetaId);
        }
    }
    
    // Ejecutar duplicación
    $resultado = duplicarCarpetaRecursivo($pdo, $carpeta_id, $carpetaOriginal['carpeta_padre_id'], $usuario_id, $nuevo_nombre);
    
    if (!$resultado) {
        $pdo->rollBack();
        throw new Exception("Error al duplicar la carpeta");
    }
    
    // Confirmar transacción
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'mensaje' => 'Carpeta duplicada exitosamente',
        'nueva_carpeta_id' => $resultado['id'],
        'nuevo_nombre' => $resultado['nombre'],
        'subcarpetas_duplicadas' => $resultado['total'] - 1
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Error al duplicar carpeta: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>

