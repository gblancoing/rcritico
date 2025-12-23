<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// GET: Obtener línea base de una carpeta
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : null;
    
    if (!$carpeta_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'carpeta_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar si existe la tabla, si no, crearla
        $stmt_check = $pdo->query("SHOW TABLES LIKE 'carpeta_linea_base'");
        if ($stmt_check->rowCount() === 0) {
            // Crear tabla si no existe
            $pdo->exec("CREATE TABLE IF NOT EXISTS carpeta_linea_base (
                id INT AUTO_INCREMENT PRIMARY KEY,
                carpeta_id INT NOT NULL,
                control_preventivo_id INT NULL,
                codigo VARCHAR(50) NULL,
                dimension TEXT NULL,
                pregunta TEXT NULL,
                evidencia TEXT NULL,
                verificador_responsable TEXT NULL,
                fecha_verificacion DATE NULL,
                implementado_estandar VARCHAR(10) NULL,
                accion_ejecutar TEXT NULL,
                responsable_cierre TEXT NULL,
                fecha_cierre DATE NULL,
                criticidad VARCHAR(50) NULL,
                porcentaje_avance DECIMAL(5,2) NULL,
                nombre_dueno_control TEXT NULL,
                ultimo_usuario_edito VARCHAR(255) NULL,
                estado_validacion VARCHAR(50) NULL,
                comentario_validacion TEXT NULL,
                usuario_validacion VARCHAR(255) NULL,
                fecha_validacion DATETIME NULL,
                ponderacion DECIMAL(5,2) NULL,
                orden INT DEFAULT 0,
                activo TINYINT(1) DEFAULT 1,
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
                INDEX idx_carpeta (carpeta_id),
                INDEX idx_control_preventivo (control_preventivo_id),
                INDEX idx_activo (activo),
                INDEX idx_estado_validacion (estado_validacion),
                INDEX idx_ponderacion (ponderacion)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
        } else {
            // Si la tabla existe, verificar y corregir que el campo 'id' tenga AUTO_INCREMENT
            try {
                $stmt_check_id = $pdo->query("SELECT COLUMN_TYPE, EXTRA FROM information_schema.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'carpeta_linea_base' 
                    AND COLUMN_NAME = 'id'");
                $id_info = $stmt_check_id->fetch(PDO::FETCH_ASSOC);
                
                if ($id_info && strpos($id_info['EXTRA'], 'auto_increment') === false) {
                    // El campo id no tiene AUTO_INCREMENT, corregirlo
                    $pdo->exec("ALTER TABLE carpeta_linea_base MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY");
                    error_log("Corregido: campo 'id' ahora tiene AUTO_INCREMENT en carpeta_linea_base");
                }
            } catch (PDOException $e) {
                error_log("Error al verificar/corregir AUTO_INCREMENT en campo 'id': " . $e->getMessage());
            }
            
            // Si la tabla existe, verificar y agregar columnas si no existen
            $columnas_a_agregar = [
                'estado_validacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN estado_validacion VARCHAR(50) NULL",
                'comentario_validacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN comentario_validacion TEXT NULL",
                'usuario_validacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN usuario_validacion VARCHAR(255) NULL",
                'fecha_validacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN fecha_validacion DATETIME NULL",
                'ponderacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN ponderacion DECIMAL(5,2) NULL"
            ];
            
            foreach ($columnas_a_agregar as $columna => $sql) {
                try {
                    // Verificar si la columna existe usando information_schema
                    $stmt_check_col = $pdo->prepare("SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = DATABASE() 
                        AND TABLE_NAME = 'carpeta_linea_base' 
                        AND COLUMN_NAME = ?");
                    $stmt_check_col->execute([$columna]);
                    $col_exists = $stmt_check_col->fetch(PDO::FETCH_ASSOC);
                    
                    if ($col_exists && $col_exists['cnt'] == 0) {
                        $pdo->exec($sql);
                    }
                } catch (PDOException $e) {
                    // La columna ya existe o error, ignorar
                    error_log("Error al verificar/agregar columna $columna: " . $e->getMessage());
                }
            }
        }
        
        $stmt = $pdo->prepare("SELECT * FROM carpeta_linea_base WHERE carpeta_id = ? AND activo = 1 ORDER BY orden ASC, id ASC");
        $stmt->execute([$carpeta_id]);
        $linea_base = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'linea_base' => $linea_base], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al obtener línea base: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// POST/PUT: Guardar línea base
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $carpeta_id = intval($data['carpeta_id'] ?? 0);
    $linea_base = isset($data['linea_base']) && is_array($data['linea_base']) ? $data['linea_base'] : [];
    $usuario_id = intval($data['usuario_id'] ?? 0);
    
    if (!$carpeta_id || !$usuario_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'carpeta_id y usuario_id son requeridos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar si existe la tabla, si no, crearla
        $stmt_check = $pdo->query("SHOW TABLES LIKE 'carpeta_linea_base'");
        if ($stmt_check->rowCount() === 0) {
            // Crear tabla si no existe
            $pdo->exec("CREATE TABLE IF NOT EXISTS carpeta_linea_base (
                id INT AUTO_INCREMENT PRIMARY KEY,
                carpeta_id INT NOT NULL,
                control_preventivo_id INT NULL,
                codigo VARCHAR(50) NULL,
                dimension TEXT NULL,
                pregunta TEXT NULL,
                evidencia TEXT NULL,
                verificador_responsable TEXT NULL,
                fecha_verificacion DATE NULL,
                implementado_estandar VARCHAR(10) NULL,
                accion_ejecutar TEXT NULL,
                responsable_cierre TEXT NULL,
                fecha_cierre DATE NULL,
                criticidad VARCHAR(50) NULL,
                porcentaje_avance DECIMAL(5,2) NULL,
                nombre_dueno_control TEXT NULL,
                ultimo_usuario_edito VARCHAR(255) NULL,
                estado_validacion VARCHAR(50) NULL,
                comentario_validacion TEXT NULL,
                usuario_validacion VARCHAR(255) NULL,
                fecha_validacion DATETIME NULL,
                ponderacion DECIMAL(5,2) NULL,
                orden INT DEFAULT 0,
                activo TINYINT(1) DEFAULT 1,
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
                INDEX idx_carpeta (carpeta_id),
                INDEX idx_control_preventivo (control_preventivo_id),
                INDEX idx_activo (activo),
                INDEX idx_estado_validacion (estado_validacion),
                INDEX idx_ponderacion (ponderacion)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
        }
        
        // Verificar y corregir que el campo 'id' tenga AUTO_INCREMENT
        try {
            $stmt_check_id = $pdo->query("SELECT COLUMN_TYPE, EXTRA FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'carpeta_linea_base' 
                AND COLUMN_NAME = 'id'");
            $id_info = $stmt_check_id->fetch(PDO::FETCH_ASSOC);
            
            if ($id_info && strpos($id_info['EXTRA'], 'auto_increment') === false) {
                // El campo id no tiene AUTO_INCREMENT, corregirlo
                $pdo->exec("ALTER TABLE carpeta_linea_base MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY");
                error_log("Corregido: campo 'id' ahora tiene AUTO_INCREMENT en carpeta_linea_base");
            }
        } catch (PDOException $e) {
            error_log("Error al verificar/corregir AUTO_INCREMENT en campo 'id': " . $e->getMessage());
        }
        
        // Siempre verificar y agregar columnas si no existen (tanto si la tabla es nueva como existente)
        $columnas_a_agregar = [
            'ultimo_usuario_edito' => "ALTER TABLE carpeta_linea_base ADD COLUMN ultimo_usuario_edito VARCHAR(255) NULL",
            'control_preventivo_id' => "ALTER TABLE carpeta_linea_base ADD COLUMN control_preventivo_id INT NULL",
            'estado_validacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN estado_validacion VARCHAR(50) NULL",
            'comentario_validacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN comentario_validacion TEXT NULL",
            'usuario_validacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN usuario_validacion VARCHAR(255) NULL",
            'fecha_validacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN fecha_validacion DATETIME NULL",
            'ponderacion' => "ALTER TABLE carpeta_linea_base ADD COLUMN ponderacion DECIMAL(5,2) NULL",
            'comentario_trabajador' => "ALTER TABLE carpeta_linea_base ADD COLUMN comentario_trabajador TEXT NULL",
            'archivos_respaldo' => "ALTER TABLE carpeta_linea_base ADD COLUMN archivos_respaldo TEXT NULL",
            'conversacion_seguimiento' => "ALTER TABLE carpeta_linea_base ADD COLUMN conversacion_seguimiento LONGTEXT NULL"
        ];
        
        foreach ($columnas_a_agregar as $columna => $sql) {
            try {
                // Verificar si la columna existe usando information_schema
                $stmt_check_col = $pdo->prepare("SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'carpeta_linea_base' 
                    AND COLUMN_NAME = ?");
                $stmt_check_col->execute([$columna]);
                $col_exists = $stmt_check_col->fetch(PDO::FETCH_ASSOC);
                
                if ($col_exists && $col_exists['cnt'] == 0) {
                    $pdo->exec($sql);
                }
            } catch (PDOException $e) {
                // La columna ya existe o error, ignorar
                error_log("Error al verificar/agregar columna $columna: " . $e->getMessage());
            }
        }
        
        // Crear índices si no existen
        try {
            $pdo->exec("CREATE INDEX IF NOT EXISTS idx_estado_validacion ON carpeta_linea_base(estado_validacion)");
        } catch (PDOException $e) {
            // El índice ya existe, ignorar
        }
        try {
            $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ponderacion ON carpeta_linea_base(ponderacion)");
        } catch (PDOException $e) {
            // El índice ya existe, ignorar
        }
        
        $pdo->beginTransaction();
        
        // Obtener IDs existentes para esta carpeta
        $stmt_existing = $pdo->prepare("SELECT id FROM carpeta_linea_base WHERE carpeta_id = ? AND activo = 1");
        $stmt_existing->execute([$carpeta_id]);
        $existing_ids = $stmt_existing->fetchAll(PDO::FETCH_COLUMN);
        
        // IDs que vienen en la actualización (para saber cuáles mantener)
        $updated_ids = [];
        
        // Insertar o actualizar registros
        foreach ($linea_base as $index => $item) {
            // Si el item tiene ID, actualizar; si no, insertar
            $item_id = isset($item['id']) && !empty($item['id']) ? intval($item['id']) : null;
            
            // Calcular ponderación si no viene en el item
            $ponderacion = $item['ponderacion'] ?? null;
            if ($ponderacion === null && isset($item['estado_validacion'])) {
                $ponderacion = $item['estado_validacion'] === 'validado' ? 100 : 0;
            }
            
            // Convertir cadenas vacías a null para campos de fecha
            $fecha_verificacion = isset($item['fecha_verificacion']) && trim($item['fecha_verificacion']) !== '' ? $item['fecha_verificacion'] : null;
            $fecha_cierre = isset($item['fecha_cierre']) && trim($item['fecha_cierre']) !== '' ? $item['fecha_cierre'] : null;
            $fecha_validacion = isset($item['fecha_validacion']) && trim($item['fecha_validacion']) !== '' ? $item['fecha_validacion'] : null;
            
            // Manejar conversacion_seguimiento como JSON
            $conversacion_seguimiento = null;
            if (isset($item['conversacion_seguimiento'])) {
                if (is_array($item['conversacion_seguimiento'])) {
                    $conversacion_seguimiento = json_encode($item['conversacion_seguimiento'], JSON_UNESCAPED_UNICODE);
                } else {
                    $conversacion_seguimiento = $item['conversacion_seguimiento'];
                }
            }
            
            // Manejar archivos_respaldo como JSON
            $archivos_respaldo = null;
            if (isset($item['archivos_respaldo'])) {
                if (is_array($item['archivos_respaldo'])) {
                    $archivos_respaldo = json_encode($item['archivos_respaldo'], JSON_UNESCAPED_UNICODE);
                } else {
                    $archivos_respaldo = $item['archivos_respaldo'];
                }
            }
            
            // Si el item tiene ID existente, actualizar; si no, insertar
            if ($item_id && in_array($item_id, $existing_ids)) {
                // ACTUALIZAR registro existente (preserva el ID para las carpetas asociadas)
                $stmt_update = $pdo->prepare("UPDATE carpeta_linea_base SET 
                    control_preventivo_id = ?, codigo = ?, dimension = ?, pregunta = ?, evidencia = ?,
                    verificador_responsable = ?, fecha_verificacion = ?, implementado_estandar = ?,
                    accion_ejecutar = ?, responsable_cierre = ?, fecha_cierre = ?, criticidad = ?,
                    porcentaje_avance = ?, nombre_dueno_control = ?, ultimo_usuario_edito = ?,
                    estado_validacion = ?, comentario_validacion = ?, usuario_validacion = ?,
                    fecha_validacion = ?, ponderacion = ?, comentario_trabajador = ?,
                    archivos_respaldo = ?, conversacion_seguimiento = ?, orden = ?, activo = 1
                    WHERE id = ? AND carpeta_id = ?");
                
                $stmt_update->execute([
                $item['control_preventivo_id'] ?? null,
                $item['codigo'] ?? null,
                $item['dimension'] ?? null,
                $item['pregunta'] ?? null,
                $item['evidencia'] ?? null,
                $item['verificador_responsable'] ?? null,
                $fecha_verificacion,
                $item['implementado_estandar'] ?? null,
                $item['accion_ejecutar'] ?? null,
                $item['responsable_cierre'] ?? null,
                $fecha_cierre,
                $item['criticidad'] ?? null,
                $item['porcentaje_avance'] ?? null,
                $item['nombre_dueno_control'] ?? null,
                $item['ultimo_usuario_edito'] ?? null,
                $item['estado_validacion'] ?? null,
                $item['comentario_validacion'] ?? null,
                $item['usuario_validacion'] ?? null,
                $fecha_validacion,
                $ponderacion,
                    $item['comentario_trabajador'] ?? null,
                    $archivos_respaldo,
                    $conversacion_seguimiento,
                $index,
                    $item_id,
                    $carpeta_id
                ]);
                
                $updated_ids[] = $item_id;
        } else {
                // INSERTAR nuevo registro
                // Estrategia robusta: intentar con AUTO_INCREMENT primero, si falla, obtener ID manualmente
                // Log para debugging en producción
                error_log("[carpeta_linea_base] Intentando INSERT para carpeta_id: $carpeta_id, item index: $index");
                try {
                    // Intentar obtener el siguiente ID manualmente como fallback
                    $next_id = null;
                    try {
                        $stmt_max_id = $pdo->query("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM carpeta_linea_base");
                        $max_result = $stmt_max_id->fetch(PDO::FETCH_ASSOC);
                        $next_id = $max_result ? intval($max_result['next_id']) : 1;
                    } catch (PDOException $e) {
                        // Si falla, usar NULL y dejar que AUTO_INCREMENT funcione
                        $next_id = null;
                    }
                    
                    // Desactivar temporalmente el modo SQL estricto solo para este INSERT
                    try {
                        $pdo->exec("SET SESSION sql_mode = ''");
                        error_log("[carpeta_linea_base] Modo SQL estricto desactivado temporalmente");
                    } catch (PDOException $e_mode) {
                        error_log("[carpeta_linea_base] Advertencia: No se pudo desactivar modo SQL estricto: " . $e_mode->getMessage());
                        // Continuar de todas formas
                    }
                    
                    // Intentar INSERT sin especificar id (si tiene AUTO_INCREMENT)
                    $stmt_insert = $pdo->prepare("INSERT INTO carpeta_linea_base (
                        carpeta_id, control_preventivo_id, codigo, dimension, pregunta, evidencia, verificador_responsable,
                        fecha_verificacion, implementado_estandar, accion_ejecutar, responsable_cierre,
                        fecha_cierre, criticidad, porcentaje_avance, nombre_dueno_control, ultimo_usuario_edito,
                        estado_validacion, comentario_validacion, usuario_validacion, fecha_validacion, ponderacion,
                        comentario_trabajador, archivos_respaldo, conversacion_seguimiento,
                        orden, activo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                
                    error_log("[carpeta_linea_base] Ejecutando INSERT para item index: $index, carpeta_id: $carpeta_id");
                    $stmt_insert->execute([
                    $carpeta_id,
                    $item['control_preventivo_id'] ?? null,
                    $item['codigo'] ?? null,
                    $item['dimension'] ?? null,
                    $item['pregunta'] ?? null,
                    $item['evidencia'] ?? null,
                    $item['verificador_responsable'] ?? null,
                    $fecha_verificacion,
                    $item['implementado_estandar'] ?? null,
                    $item['accion_ejecutar'] ?? null,
                    $item['responsable_cierre'] ?? null,
                    $fecha_cierre,
                    $item['criticidad'] ?? null,
                    $item['porcentaje_avance'] ?? null,
                    $item['nombre_dueno_control'] ?? null,
                    $item['ultimo_usuario_edito'] ?? null,
                    $item['estado_validacion'] ?? null,
                    $item['comentario_validacion'] ?? null,
                    $item['usuario_validacion'] ?? null,
                    $fecha_validacion,
                    $ponderacion,
                        $item['comentario_trabajador'] ?? null,
                        $archivos_respaldo,
                        $conversacion_seguimiento,
                    $index,
                    1 // activo
                ]);
                    
                    error_log("[carpeta_linea_base] INSERT ejecutado exitosamente para item index: $index");
                    
                    // Restaurar modo SQL estricto
                    try {
                        $pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");
                    } catch (PDOException $e_restore) {
                        error_log("[carpeta_linea_base] Advertencia: No se pudo restaurar modo SQL estricto: " . $e_restore->getMessage());
                    }
                    
                    // Guardar el nuevo ID - SIMPLE: Si el INSERT fue exitoso, el ID existe
                    $nuevo_id = $pdo->lastInsertId();
                    error_log("[carpeta_linea_base] lastInsertId() devolvió: " . ($nuevo_id ?: 'NULL/0') . ", next_id calculado: " . ($next_id ?: 'NULL'));
                    
                    if (!$nuevo_id && $next_id) {
                        // Si lastInsertId falla pero tenemos el ID calculado, usarlo
                        $nuevo_id = $next_id;
                        error_log("[carpeta_linea_base] Usando next_id calculado: $nuevo_id");
                    }
                    
                    // SIMPLE: Si tenemos un ID, agregarlo directamente (el INSERT confirma que existe)
                    if ($nuevo_id) {
                        $updated_ids[] = intval($nuevo_id);
                        error_log("[carpeta_linea_base] INSERT exitoso, ID agregado a updated_ids: $nuevo_id (total en array: " . count($updated_ids) . ")");
                    } else {
                        error_log("[carpeta_linea_base] ERROR CRÍTICO: No se pudo obtener ID después del INSERT. lastInsertId=" . ($pdo->lastInsertId() ?: 'NULL') . ", next_id=" . ($next_id ?: 'NULL'));
                    }
                    
                } catch (PDOException $e_insert) {
                    // Si el INSERT falla, intentar con ID explícito
                    error_log("[carpeta_linea_base] Primer INSERT falló: " . $e_insert->getMessage() . " - Intentando con ID explícito");
                    try {
                        // Restaurar modo SQL estricto antes del segundo intento
                        try {
                            $pdo->exec("SET SESSION sql_mode = ''");
                        } catch (PDOException $e_mode2) {
                            error_log("[carpeta_linea_base] Advertencia al desactivar modo SQL en segundo intento: " . $e_mode2->getMessage());
                        }
                        
                        if (!$next_id) {
                            $stmt_max_id = $pdo->query("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM carpeta_linea_base");
                            $max_result = $stmt_max_id->fetch(PDO::FETCH_ASSOC);
                            $next_id = $max_result ? intval($max_result['next_id']) : 1;
                        }
                        
                        // INSERT con ID explícito
                        $stmt_insert_id = $pdo->prepare("INSERT INTO carpeta_linea_base (
                            id, carpeta_id, control_preventivo_id, codigo, dimension, pregunta, evidencia, verificador_responsable,
                            fecha_verificacion, implementado_estandar, accion_ejecutar, responsable_cierre,
                            fecha_cierre, criticidad, porcentaje_avance, nombre_dueno_control, ultimo_usuario_edito,
                            estado_validacion, comentario_validacion, usuario_validacion, fecha_validacion, ponderacion,
                            comentario_trabajador, archivos_respaldo, conversacion_seguimiento,
                            orden, activo
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    
                        $stmt_insert_id->execute([
                        $next_id,
                        $carpeta_id,
                        $item['control_preventivo_id'] ?? null,
                        $item['codigo'] ?? null,
                        $item['dimension'] ?? null,
                        $item['pregunta'] ?? null,
                        $item['evidencia'] ?? null,
                        $item['verificador_responsable'] ?? null,
                        $fecha_verificacion,
                        $item['implementado_estandar'] ?? null,
                        $item['accion_ejecutar'] ?? null,
                        $item['responsable_cierre'] ?? null,
                        $fecha_cierre,
                        $item['criticidad'] ?? null,
                        $item['porcentaje_avance'] ?? null,
                        $item['nombre_dueno_control'] ?? null,
                        $item['ultimo_usuario_edito'] ?? null,
                        $item['estado_validacion'] ?? null,
                        $item['comentario_validacion'] ?? null,
                        $item['usuario_validacion'] ?? null,
                        $fecha_validacion,
                        $ponderacion,
                            $item['comentario_trabajador'] ?? null,
                            $archivos_respaldo,
                            $conversacion_seguimiento,
                        $index,
                        1 // activo
                    ]);
                        
                        // Restaurar modo SQL estricto
                        try {
                            $pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");
                        } catch (PDOException $e_restore2) {
                            error_log("[carpeta_linea_base] Advertencia al restaurar modo SQL en segundo intento: " . $e_restore2->getMessage());
                        }
                        
                        $nuevo_id = $next_id;
                        
                        // SIMPLE: Si el INSERT fue exitoso, agregar el ID directamente
                        if ($nuevo_id) {
                            $updated_ids[] = intval($nuevo_id);
                            error_log("[carpeta_linea_base] INSERT con ID explícito exitoso, ID agregado: $nuevo_id");
                        }
                    } catch (PDOException $e_insert_id) {
                        // Restaurar modo SQL estricto incluso si falla
                        try {
                            $pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");
                        } catch (PDOException $e_restore) {
                            error_log("[carpeta_linea_base] Error al restaurar modo SQL después de fallo: " . $e_restore->getMessage());
                        }
                        error_log("[carpeta_linea_base] ERROR CRÍTICO: Ambos intentos de INSERT fallaron. Error: " . $e_insert_id->getMessage());
                        throw $e_insert_id; // Re-lanzar el error original
                    }
                }
                
                // MIGRACIÓN: Si el item tenía un ID anterior que no existía en esta BD,
                // buscar carpetas y archivos huérfanos y migrarlos al nuevo ID
                if ($item_id && $item_id != $nuevo_id) {
                    // Migrar carpetas de documentos del ID antiguo al nuevo
                    try {
                        $stmt_migrar_carpetas = $pdo->prepare("UPDATE linea_base_carpetas SET linea_base_id = ? WHERE linea_base_id = ?");
                        $stmt_migrar_carpetas->execute([$nuevo_id, $item_id]);
                        
                        // Migrar archivos del ID antiguo al nuevo
                        $stmt_migrar_archivos = $pdo->prepare("UPDATE linea_base_archivos SET linea_base_id = ? WHERE linea_base_id = ?");
                        $stmt_migrar_archivos->execute([$nuevo_id, $item_id]);
                        
                        error_log("[Migración Línea Base] Migradas carpetas/archivos de ID $item_id a ID $nuevo_id");
                    } catch (PDOException $e) {
                        // Ignorar errores de migración (las tablas pueden no existir)
                        error_log("[Migración Línea Base] Error migrando: " . $e->getMessage());
                    }
                }
            }
        }
        
        // Soft delete de registros que ya no existen en la actualización
        // (registros que estaban antes pero no vienen en la nueva lista)
        $ids_to_delete = array_diff($existing_ids, $updated_ids);
        if (!empty($ids_to_delete)) {
            $placeholders = implode(',', array_fill(0, count($ids_to_delete), '?'));
            $stmt_soft_delete = $pdo->prepare("UPDATE carpeta_linea_base SET activo = 0 WHERE id IN ($placeholders) AND carpeta_id = ?");
            $params = array_merge(array_values($ids_to_delete), [$carpeta_id]);
            $stmt_soft_delete->execute($params);
        }
        
        $pdo->commit();
        
        // CRÍTICO: Si updated_ids está vacío pero se procesaron items, buscar los IDs reales DESPUÉS del commit
        if (empty($updated_ids) && !empty($linea_base)) {
            error_log("[carpeta_linea_base] ADVERTENCIA CRÍTICA: updated_ids está vacío después del commit. Buscando IDs reales...");
            foreach ($linea_base as $index => $item) {
                $control_id = $item['control_preventivo_id'] ?? null;
                $dimension = $item['dimension'] ?? null;
                $pregunta = $item['pregunta'] ?? null;
                $evidencia = $item['evidencia'] ?? null;
                
                if ($control_id && $dimension && $pregunta && $evidencia) {
                    // Buscar el registro más reciente con estas propiedades
                    $stmt_find = $pdo->prepare("
                        SELECT id FROM carpeta_linea_base 
                        WHERE carpeta_id = ? 
                          AND control_preventivo_id = ? 
                          AND dimension = ? 
                          AND pregunta = ? 
                          AND evidencia = ? 
                          AND activo = 1 
                        ORDER BY id DESC 
                        LIMIT 1
                    ");
                    $stmt_find->execute([$carpeta_id, $control_id, $dimension, $pregunta, $evidencia]);
                    $found = $stmt_find->fetch(PDO::FETCH_ASSOC);
                    if ($found && $found['id']) {
                        $id_encontrado = intval($found['id']);
                        if (!in_array($id_encontrado, $updated_ids)) {
                            $updated_ids[] = $id_encontrado;
                            error_log("[carpeta_linea_base] ID encontrado por propiedades y agregado: $id_encontrado");
                        }
                    } else {
                        error_log("[carpeta_linea_base] ERROR: No se encontró registro con propiedades: carpeta_id=$carpeta_id, control_id=$control_id, dimension=$dimension");
                    }
                }
            }
        }
        
        // Si aún está vacío, obtener el último ID insertado para esta carpeta
        if (empty($updated_ids) && !empty($linea_base)) {
            error_log("[carpeta_linea_base] ADVERTENCIA: updated_ids sigue vacío. Buscando último ID insertado para carpeta_id: $carpeta_id");
            $stmt_last = $pdo->prepare("SELECT id FROM carpeta_linea_base WHERE carpeta_id = ? AND activo = 1 ORDER BY id DESC LIMIT 1");
            $stmt_last->execute([$carpeta_id]);
            $last = $stmt_last->fetch(PDO::FETCH_ASSOC);
            if ($last && $last['id']) {
                $updated_ids[] = intval($last['id']);
                error_log("[carpeta_linea_base] Último ID encontrado y agregado: {$last['id']}");
            }
        }
        
        error_log("[carpeta_linea_base] POST exitoso para carpeta_id: $carpeta_id, items procesados: " . count($linea_base) . ", updated_ids: " . count($updated_ids) . " (" . implode(', ', $updated_ids) . ")");
        echo json_encode(['success' => true, 'message' => 'Línea base guardada exitosamente', 'updated_ids' => $updated_ids], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            try {
                $pdo->rollBack();
            } catch (PDOException $e_rollback) {
                error_log("[carpeta_linea_base] Error al hacer rollback: " . $e_rollback->getMessage());
            }
        }
        $error_message = 'Error al guardar línea base: ' . $e->getMessage();
        $error_code = $e->getCode();
        error_log("[carpeta_linea_base] ERROR en POST: $error_message (Código: $error_code)");
        error_log("[carpeta_linea_base] Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => $error_message,
            'error_code' => $error_code,
            'debug_info' => [
                'carpeta_id' => $carpeta_id ?? null,
                'items_count' => count($linea_base ?? []),
                'php_version' => phpversion()
            ]
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            try {
                $pdo->rollBack();
            } catch (PDOException $e_rollback) {
                error_log("[carpeta_linea_base] Error al hacer rollback: " . $e_rollback->getMessage());
            }
        }
        $error_message = 'Error inesperado al guardar línea base: ' . $e->getMessage();
        error_log("[carpeta_linea_base] EXCEPCIÓN GENERAL en POST: $error_message");
        error_log("[carpeta_linea_base] Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => $error_message,
            'error_type' => get_class($e)
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE: Eliminar un registro específico de línea base
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = isset($data['id']) ? intval($data['id']) : null;
    $carpeta_id = isset($data['carpeta_id']) ? intval($data['carpeta_id']) : null;
    
    if (!$id || !$carpeta_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'id y carpeta_id son requeridos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar si existe la tabla
        $stmt_check = $pdo->query("SHOW TABLES LIKE 'carpeta_linea_base'");
        if ($stmt_check->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Tabla no existe'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Soft delete: marcar como inactivo
        $stmt = $pdo->prepare("UPDATE carpeta_linea_base SET activo = 0 WHERE id = ? AND carpeta_id = ?");
        $stmt->execute([$id, $carpeta_id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Registro eliminado exitosamente'], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Registro no encontrado'], JSON_UNESCAPED_UNICODE);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al eliminar registro: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
