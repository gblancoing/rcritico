<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);

// Log para debugging
error_log("Datos recibidos para predictividad: " . print_r($data, true));

if (!isset($data['rows']) || !is_array($data['rows'])) {
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit;
}

$rows = $data['rows'];
$proyecto_id = $data['proyecto_id'] ?? null;

if (!$proyecto_id) {
    echo json_encode(['success' => false, 'error' => 'proyecto_id is required']);
    exit;
}

try {
    // Verificar que el proyecto existe
    $stmt = $pdo->prepare("SELECT proyecto_id FROM proyectos WHERE proyecto_id = ?");
    $stmt->execute([$proyecto_id]);
    $proyecto = $stmt->fetch();

    if (!$proyecto) {
        echo json_encode(['success' => false, 'error' => 'El proyecto_id especificado no existe']);
        exit;
    }

    // Obtener el ID del centro de costo del proyecto (asumiendo que hay uno principal)
    $stmt = $pdo->prepare("SELECT id FROM centros_costo WHERE proyecto_id = ? LIMIT 1");
    $stmt->execute([$proyecto_id]);
    $centro_costo = $stmt->fetch();

    $centro_costo_id = $centro_costo ? $centro_costo['id'] : null;

    if (!$centro_costo_id) {
        echo json_encode(['success' => false, 'error' => 'No se encontró centro de costo para el proyecto especificado']);
        exit;
    }

    // Verificar si la tabla predictividad existe, y crearla si no existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'predictividad'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        // La tabla no existe, crearla con la estructura correcta
        $sql = "CREATE TABLE predictividad (
            id_predictivo INT AUTO_INCREMENT PRIMARY KEY,
            proyecto_id INT NOT NULL,
            id INT NOT NULL,
            periodo_prediccion DATE,
            porcentaje_predicido DECIMAL(15,2) DEFAULT 0.00,
            periodo_cierre_real DATE,
            valor_real_porcentaje DECIMAL(15,2) DEFAULT 0.00,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_proyecto_id (proyecto_id),
            INDEX idx_centro_costo_id (id),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id),
            FOREIGN KEY (id) REFERENCES centros_costo(id)
        )";
        
        $pdo->exec($sql);
        error_log("Tabla predictividad creada exitosamente");
    } else {
        // IMPORTANTE: La tabla existe - NUNCA MODIFICAR SU ESTRUCTURA
        error_log("📋 Tabla predictividad existe - usando estructura actual SIN MODIFICACIONES");
        
        $stmt = $pdo->query("DESCRIBE predictividad");
        $columnDetails = [];
        while ($row = $stmt->fetch()) {
            $columnDetails[$row['Field']] = $row['Type'];
        }
        
        error_log("📋 ESTRUCTURA REAL DE LA TABLA:");
        foreach ($columnDetails as $column => $type) {
            error_log("  - $column ($type)");
        }
        
        error_log("⚠️ USANDO LA ESTRUCTURA EXISTENTE TAL COMO ESTÁ");
    }

    /**
     * Función para convertir fecha de formato Excel a formato DATE de MySQL
     */
    function excelDateToMysqlDate($excelDate) {
        error_log("🔍 PHP - CONVERSIÓN DE FECHA A DATE:");
        error_log("  📅 Valor recibido: " . var_export($excelDate, true));
        error_log("  📅 Tipo: " . gettype($excelDate));
        error_log("  📅 ¿Está vacío? " . (empty($excelDate) ? 'SÍ' : 'NO'));
        
        // Si está vacío o es null, retornar una fecha por defecto
        if (empty($excelDate) || $excelDate === null || $excelDate === '') {
            error_log("❌ PHP - Fecha vacía, retornando fecha por defecto: 2024-01-01");
            return '2024-01-01'; // Fecha por defecto en formato DATE
        }
        
        // Convertir a string para procesamiento
        $dateStr = trim((string)$excelDate);
        error_log("  📅 PHP - Fecha como string: '$dateStr'");
        
        // Si es string tipo fecha con guiones
        if (strpos($dateStr, '-') !== false) {
            error_log("📅 PHP - Procesando como string con guiones");
            $parts = explode('-', $dateStr);
            error_log("  📅 PHP - Partes separadas: " . print_r($parts, true));
            
            if (count($parts) === 3) {
                // Verificar si es DD-MM-YYYY (día de 1-2 dígitos, mes de 1-2 dígitos, año de 4 dígitos)
                if (strlen($parts[2]) === 4 && is_numeric($parts[2])) {
                    // Formato DD-MM-YYYY -> convertir a YYYY-MM-DD
                    $day = str_pad($parts[0], 2, '0', STR_PAD_LEFT);
                    $month = str_pad($parts[1], 2, '0', STR_PAD_LEFT);
                    $year = $parts[2];
                    $converted = $year . '-' . $month . '-' . $day;
                    error_log("✅ PHP - Convertido de DD-MM-YYYY: '$dateStr' -> '$converted'");
                    return $converted;
                } elseif (strlen($parts[0]) === 4 && is_numeric($parts[0])) {
                    // Formato YYYY-MM-DD -> ya está en formato correcto
                    $year = $parts[0];
                    $month = str_pad($parts[1], 2, '0', STR_PAD_LEFT);
                    $day = str_pad($parts[2], 2, '0', STR_PAD_LEFT);
                    $converted = $year . '-' . $month . '-' . $day;
                    error_log("✅ PHP - Convertido de YYYY-MM-DD: '$dateStr' -> '$converted'");
                    return $converted;
                }
            }
            
            error_log("⚠️ PHP - Formato de string con guiones no reconocido: '$dateStr'");
        }
        
        // Si es número (número de serie Excel)
        if (is_numeric($dateStr)) {
            error_log("🔢 PHP - Procesando como número de serie Excel: $dateStr");
            $excelNumber = floatval($dateStr);
            
            // Verificar que sea un número válido de Excel (después de 1900)
            if ($excelNumber > 0 && $excelNumber < 100000) {
                $unixDate = ($excelNumber - 25569) * 86400;
                $converted = date('Y-m-d', $unixDate);
                error_log("✅ PHP - Convertido de número Excel: '$dateStr' -> '$converted'");
                return $converted;
            } else {
                error_log("❌ PHP - Número Excel fuera de rango válido: $excelNumber");
            }
        }
        
        // Si llegamos aquí, intentar extraer año y mes de cualquier string que contenga números
        if (preg_match('/(\d{1,2})-(\d{1,2})-(\d{4})/', $dateStr, $matches)) {
            $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $year = $matches[3];
            $converted = $year . '-' . $month . '-' . $day;
            error_log("✅ PHP - Extraído con regex DD-MM-YYYY: '$dateStr' -> '$converted'");
            return $converted;
        }
        
        error_log("⚠️ PHP - Formato no reconocido, retornando fecha por defecto: '$dateStr' -> '2024-01-01'");
        return '2024-01-01'; // Fallback en formato DATE
    }

    /**
     * Función para convertir porcentaje con formato europeo a decimal(15,2)
     */
    function parsePercentage($value) {
        if (empty($value)) return 0.00;
        
        // Convertir a string si no lo es
        $strValue = (string)$value;
        
        error_log("🔢 ANÁLISIS DE PORCENTAJE:");
        error_log("  Valor original: " . var_export($value, true));
        error_log("  Como string: '$strValue'");
        
        // Remover el símbolo % si existe (pero NO dividir por 100)
        $strValue = str_replace('%', '', $strValue);
        error_log("  Después de quitar %: '$strValue'");
        
        // Reemplazar coma por punto para parseFloat
        $strValue = str_replace(',', '.', $strValue);
        error_log("  Después de coma->punto: '$strValue'");
        
        // Convertir a número y redondear a 2 decimales
        $resultado = round(floatval($strValue), 2);
        
        error_log("🔢 Conversión final: '$value' -> $resultado");
        
        return $resultado;
    }

    $inserted = 0;
    $errores = [];
    
    foreach ($rows as $index => $row) {
        try {
            // Log para debugging - mostrar datos originales de la fila
            error_log("📊 ============ PROCESANDO FILA $index ============");
            error_log("📋 Datos completos recibidos:");
            foreach ($row as $key => $value) {
                error_log("    '$key' => " . var_export($value, true) . " (tipo: " . gettype($value) . ")");
            }
            
            // COMPARACIÓN ESPECÍFICA: periodo_prediccion vs periodo_cierre_real
            error_log("🔍 COMPARACIÓN DE CAMPOS DE FECHA:");
            error_log("  📅 periodo_prediccion:");
            error_log("    - ¿Existe? " . (isset($row['periodo_prediccion']) ? 'SÍ' : 'NO'));
            error_log("    - Valor: " . var_export($row['periodo_prediccion'] ?? 'NO_EXISTE', true));
            error_log("    - Tipo: " . gettype($row['periodo_prediccion'] ?? null));
            
            error_log("  📅 periodo_cierre_real:");
            error_log("    - ¿Existe? " . (isset($row['periodo_cierre_real']) ? 'SÍ' : 'NO'));
            error_log("    - Valor: " . var_export($row['periodo_cierre_real'] ?? 'NO_EXISTE', true));
            error_log("    - Tipo: " . gettype($row['periodo_cierre_real'] ?? null));
            
            // Buscar claves similares para periodo_cierre_real
            error_log("🔍 BUSCANDO CLAVES SIMILARES A 'periodo_cierre_real':");
            foreach (array_keys($row) as $key) {
                if (stripos($key, 'cierre') !== false || stripos($key, 'real') !== false || stripos($key, 'periodo') !== false) {
                    error_log("    - '$key' => " . var_export($row[$key], true));
                }
            }
            
            // Procesar fechas con logging detallado
            error_log("🔄 INICIANDO CONVERSIÓN DE FECHAS:");
            
            error_log("📅 Procesando periodo_prediccion...");
            $periodo_prediccion = excelDateToMysqlDate($row['periodo_prediccion'] ?? '');
            error_log("✅ periodo_prediccion resultado: " . var_export($periodo_prediccion, true));
            
            error_log("📅 Procesando periodo_cierre_real...");
            $periodo_cierre_real = excelDateToMysqlDate($row['periodo_cierre_real'] ?? '');
            error_log("✅ periodo_cierre_real resultado: " . var_export($periodo_cierre_real, true));
            
            // Si periodo_cierre_real está vacío o es la fecha por defecto, usar periodo_prediccion
            if (empty($periodo_cierre_real) || $periodo_cierre_real === '2024-01-01') {
                error_log("🔄 periodo_cierre_real vacío o por defecto, usando periodo_prediccion como fallback");
                $periodo_cierre_real = $periodo_prediccion;
                error_log("✅ periodo_cierre_real actualizado: " . var_export($periodo_cierre_real, true));
            }
            
            $porcentaje_predicido = parsePercentage($row['porcentaje_predicido'] ?? 0);
            $valor_real_porcentaje = parsePercentage($row['valor_real_porcentaje'] ?? 0);

            // Resumen final de datos procesados
            error_log("📋 RESUMEN FINAL DE DATOS PROCESADOS:");
            error_log("  periodo_prediccion: " . var_export($periodo_prediccion, true) . " (formato DATE)");
            error_log("  porcentaje_predicido: " . var_export($porcentaje_predicido, true));
            error_log("  periodo_cierre_real: " . var_export($periodo_cierre_real, true) . " (formato DATE)");
            error_log("  valor_real_porcentaje: " . var_export($valor_real_porcentaje, true));

            // Verificar si periodo_cierre_real está vacío y por qué
            if (empty($periodo_cierre_real)) {
                error_log("🚨 PROBLEMA DETECTADO:");
                error_log("  periodo_cierre_real está vacío después del procesamiento!");
                error_log("  Valor original recibido: " . var_export($row['periodo_cierre_real'] ?? 'NO_EXISTE', true));
                error_log("  Claves disponibles en fila: " . implode(', ', array_keys($row)));
                
                // Buscar claves similares
                foreach (array_keys($row) as $key) {
                    if (stripos($key, 'cierre') !== false || stripos($key, 'real') !== false) {
                        error_log("  Clave similar encontrada: '$key' => " . var_export($row[$key], true));
                    }
                }
            }

            // Insertar en la tabla predictividad
            error_log("💾 PREPARANDO INSERCIÓN EN BASE DE DATOS:");
            
            // VERIFICACIÓN ADICIONAL: Confirmar que las columnas existen justo antes del INSERT
            try {
                $checkStmt = $pdo->query("SHOW COLUMNS FROM predictividad LIKE 'periodo_cierre_real'");
                $columnExists = $checkStmt->rowCount() > 0;
                error_log("🔍 VERIFICACIÓN ÚLTIMA: ¿periodo_cierre_real existe? " . ($columnExists ? 'SÍ' : 'NO'));
                
                if (!$columnExists) {
                    error_log("🚨 PROBLEMA CRÍTICO: La columna periodo_cierre_real NO existe en la tabla actual");
                    throw new Exception("La columna periodo_cierre_real no existe en la tabla predictividad");
                }
            } catch (Exception $e) {
                error_log("❌ Error verificando columna: " . $e->getMessage());
                throw $e;
            }
            
            // Validar datos antes del INSERT
            error_log("🔍 VALIDACIÓN DE DATOS ANTES DEL INSERT:");
            error_log("  - proyecto_id: " . var_export($proyecto_id, true) . " (tipo: " . gettype($proyecto_id) . ")");
            error_log("  - centro_costo_id: " . var_export($centro_costo_id, true) . " (tipo: " . gettype($centro_costo_id) . ")");
            error_log("  - periodo_prediccion: " . var_export($periodo_prediccion, true) . " (tipo: " . gettype($periodo_prediccion) . " | longitud: " . strlen($periodo_prediccion ?? '') . ")");
            error_log("  - porcentaje_predicido: " . var_export($porcentaje_predicido, true) . " (tipo: " . gettype($porcentaje_predicido) . ")");
            error_log("  - periodo_cierre_real: " . var_export($periodo_cierre_real, true) . " (tipo: " . gettype($periodo_cierre_real) . " | longitud: " . strlen($periodo_cierre_real ?? '') . ")");
            error_log("  - valor_real_porcentaje: " . var_export($valor_real_porcentaje, true) . " (tipo: " . gettype($valor_real_porcentaje) . ")");
            
            // Validar que las fechas tengan formato DATE válido (YYYY-MM-DD)
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $periodo_prediccion)) {
                error_log("⚠️ periodo_prediccion no tiene formato DATE válido: '" . $periodo_prediccion . "'");
                $periodo_prediccion = '2024-01-01'; // Fecha por defecto
                error_log("✂️ Cambiado a fecha por defecto: '" . $periodo_prediccion . "'");
            }
            
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $periodo_cierre_real)) {
                error_log("⚠️ periodo_cierre_real no tiene formato DATE válido: '" . $periodo_cierre_real . "'");
                $periodo_cierre_real = '2024-01-01'; // Fecha por defecto
                error_log("✂️ Cambiado a fecha por defecto: '" . $periodo_cierre_real . "'");
            }
            
            $stmt = $pdo->prepare("INSERT INTO predictividad 
                (proyecto_id, id, periodo_prediccion, porcentaje_predicido, periodo_cierre_real, valor_real_porcentaje) 
                VALUES (?, ?, ?, ?, ?, ?)");
            
            $insertData = [
                $proyecto_id,
                $centro_costo_id,
                $periodo_prediccion,
                $porcentaje_predicido,
                $periodo_cierre_real,
                $valor_real_porcentaje
            ];
            
            error_log("💾 DATOS FINALES A INSERTAR:");
            error_log("  Array completo: " . print_r($insertData, true));
            error_log("  SQL: INSERT INTO predictividad (proyecto_id, id, periodo_prediccion, porcentaje_predicido, periodo_cierre_real, valor_real_porcentaje) VALUES (?, ?, ?, ?, ?, ?)");
            
            // LOG ULTRA-ESPECÍFICO PARA DEBUGGING PORCENTAJES
            error_log("🚨 DEBUG PORCENTAJES ESPECÍFICO:");
            error_log("  porcentaje_predicido EXACTO: " . var_export($porcentaje_predicido, true) . " (tipo: " . gettype($porcentaje_predicido) . ")");
            error_log("  valor_real_porcentaje EXACTO: " . var_export($valor_real_porcentaje, true) . " (tipo: " . gettype($valor_real_porcentaje) . ")");
            
            if ($stmt->execute($insertData)) {
                $inserted++;
                error_log("✅ Fila $index insertada exitosamente");
                
                // VERIFICAR QUÉ SE GUARDÓ REALMENTE EN LA BD
                $verifyStmt = $pdo->prepare("SELECT porcentaje_predicido, valor_real_porcentaje FROM predictividad 
                    WHERE proyecto_id = ? AND id = ? ORDER BY id_predictivo DESC LIMIT 1");
                $verifyStmt->execute([$proyecto_id, $centro_costo_id]);
                $verifyResult = $verifyStmt->fetch();
                
                if ($verifyResult) {
                    error_log("🔍 VERIFICACIÓN - Lo que se guardó en BD:");
                    error_log("  BD porcentaje_predicido: " . $verifyResult['porcentaje_predicido']);
                    error_log("  BD valor_real_porcentaje: " . $verifyResult['valor_real_porcentaje']);
                    error_log("  COMPARACIÓN:");
                    error_log("    Enviado: $porcentaje_predicido -> Guardado: " . $verifyResult['porcentaje_predicido']);
                    error_log("    Enviado: $valor_real_porcentaje -> Guardado: " . $verifyResult['valor_real_porcentaje']);
                }
                
            } else {
                $error = implode(', ', $stmt->errorInfo());
                $errores[] = "Error en fila $index: " . $error;
                error_log("❌ Error insertando fila $index: " . $error);
                error_log("❌ Detalles del error SQL:");
                error_log("   SQLSTATE: " . $stmt->errorInfo()[0]);
                error_log("   Error Code: " . $stmt->errorInfo()[1]);
                error_log("   Error Message: " . $stmt->errorInfo()[2]);
            }

        } catch (Exception $e) {
            $errores[] = "Error procesando fila $index: " . $e->getMessage();
            error_log("💥 EXCEPCIÓN en fila $index: " . $e->getMessage());
            error_log("  Trace: " . $e->getTraceAsString());
        }
        
        error_log("📊 ============ FIN FILA $index ============\n");
    }

    $response = [
        'success' => true,
        'inserted' => $inserted,
        'total_rows' => count($rows),
        'proyecto_id' => $proyecto_id,
        'centro_costo_id' => $centro_costo_id,
        'message' => "Se importaron $inserted registros de " . count($rows) . " filas procesadas a la tabla predictividad."
    ];

    if (!empty($errores)) {
        $response['errores'] = $errores;
        $response['success'] = count($errores) < count($rows); // Solo false si todos fallaron
    }

    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error general en importación de predictividad: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Error general: ' . $e->getMessage()
    ]);
}
?> 