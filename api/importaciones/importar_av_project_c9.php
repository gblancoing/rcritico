<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../db.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar si la tabla existe
    $query = "SHOW TABLES LIKE 'vc_project_9c'";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        // Crear la tabla si no existe
        $createTable = "CREATE TABLE vc_project_9c (
            id_c9 VARCHAR(20) NOT NULL PRIMARY KEY,
            periodo DATE NOT NULL,
            cat_vp VARCHAR(30) NOT NULL,
            moneda_base INT(4) NOT NULL DEFAULT 2025,
            proyecto_id INT(11) NOT NULL,
            base DECIMAL(15,2) NULL DEFAULT 0.00,
            cambio DECIMAL(15,2) NULL DEFAULT 0.00,
            control DECIMAL(15,2) NULL DEFAULT 0.00,
            tendencia DECIMAL(15,2) NULL DEFAULT 0.00,
            eat DECIMAL(15,2) NULL DEFAULT 0.00,
            compromiso DECIMAL(15,2) NULL DEFAULT 0.00,
            incurrido DECIMAL(15,2) NULL DEFAULT 0.00,
            financiero DECIMAL(15,2) NULL DEFAULT 0.00,
            por_comprometer DECIMAL(15,2) NULL DEFAULT 0.00,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_proyecto_periodo (proyecto_id, periodo),
            INDEX idx_periodo (periodo),
            INDEX idx_cat_vp (cat_vp),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id) ON DELETE CASCADE,
            FOREIGN KEY (cat_vp) REFERENCES campo3_fase(cat_vp) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createTable);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['rows']) || !is_array($input['rows'])) {
        throw new Exception('Datos inválidos: se requiere un array de filas');
    }
    
    $proyectoId = isset($input['proyecto_id']) ? intval($input['proyecto_id']) : 1;
    $rows = $input['rows'];
    
    // Limpiar tabla existente para este proyecto
    $deleteStmt = $pdo->prepare("DELETE FROM vc_project_9c WHERE proyecto_id = ?");
    $deleteStmt->execute([$proyectoId]);
    
    // Preparar statement para inserción
    $insertStmt = $pdo->prepare("
        INSERT INTO vc_project_9c (
            id_c9, periodo, cat_vp, moneda_base, proyecto_id, 
            base, cambio, control, tendencia, eat, 
            compromiso, incurrido, financiero, por_comprometer
        ) VALUES (
            ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, 
            ?, ?, ?, ?
        )
    ");
    
    $insertedCount = 0;
    $errors = [];
    
    foreach ($rows as $index => $row) {
        try {
            // Log para depuración (solo las primeras 3 filas)
            if ($index < 3) {
                error_log("DEBUG - Fila $index - Datos originales: " . json_encode($row));
            }
            
            // Validar y limpiar datos
            $id_c9 = isset($row['id_c9']) ? trim($row['id_c9']) : '';
            $periodo = isset($row['periodo']) ? trim($row['periodo']) : '';
            $cat_vp = isset($row['cat_vp']) ? trim($row['cat_vp']) : '';
            $moneda_base = isset($row['moneda_base']) ? intval($row['moneda_base']) : 2025;
            
            // Limpiar valores monetarios
            $base = isset($row['base']) ? cleanNumericValue($row['base']) : 0.00;
            $cambio = isset($row['cambio']) ? cleanNumericValue($row['cambio']) : 0.00;
            $control = isset($row['control']) ? cleanNumericValue($row['control']) : 0.00;
            $tendencia = isset($row['tendencia']) ? cleanNumericValue($row['tendencia']) : 0.00;
            $eat = isset($row['eat']) ? cleanNumericValue($row['eat']) : 0.00;
            $compromiso = isset($row['compromiso']) ? cleanNumericValue($row['compromiso']) : 0.00;
            $incurrido = isset($row['incurrido']) ? cleanNumericValue($row['incurrido']) : 0.00;
            $financiero = isset($row['financiero']) ? cleanNumericValue($row['financiero']) : 0.00;
            $por_comprometer = isset($row['por_comprometer']) ? cleanNumericValue($row['por_comprometer']) : 0.00;
            
            // Log para depuración (solo las primeras 3 filas)
            if ($index < 3) {
                error_log("DEBUG - Fila $index - Valores procesados: base=$base, cambio=$cambio, control=$control, tendencia=$tendencia, eat=$eat, compromiso=$compromiso, incurrido=$incurrido, financiero=$financiero, por_comprometer=$por_comprometer");
            }
            
            // Validaciones básicas
            if (empty($id_c9)) {
                throw new Exception("ID C9 no puede estar vacío");
            }
            
            if (empty($periodo)) {
                throw new Exception("Periodo no puede estar vacío");
            }
            
            if (empty($cat_vp)) {
                throw new Exception("Categoría VP no puede estar vacía");
            }
            
            // Convertir fecha si es necesario
            $periodo = convertExcelDate($periodo);
            
            $insertStmt->execute([
                $id_c9, $periodo, $cat_vp, $moneda_base, $proyectoId,
                $base, $cambio, $control, $tendencia, $eat,
                $compromiso, $incurrido, $financiero, $por_comprometer
            ]);
            
            $insertedCount++;
            
        } catch (Exception $e) {
            $errors[] = "Fila " . ($index + 1) . ": " . $e->getMessage();
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Se importaron $insertedCount registros exitosamente",
        'inserted_count' => $insertedCount,
        'errors' => $errors,
        'details' => [
            'total_rows' => count($rows),
            'successful_imports' => $insertedCount,
            'failed_imports' => count($errors),
            'proyecto_id' => $proyectoId
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'details' => [
            'exception_type' => get_class($e),
            'file' => basename($e->getFile()),
            'line' => $e->getLine()
        ]
    ]);
}

/**
 * Función para limpiar valores numéricos
 */
function cleanNumericValue($value) {
    // Log para depuración
    error_log("DEBUG - cleanNumericValue input: " . var_export($value, true));
    
    // Si es numérico, devolver directamente
    if (is_numeric($value)) {
        $result = floatval($value);
        error_log("DEBUG - cleanNumericValue output (numeric): " . $result);
        return $result;
    }
    
    // Si es string, procesar
    if (is_string($value)) {
        // Si es un guión, devolver 0
        if (trim($value) === '-' || trim($value) === '') {
            error_log("DEBUG - cleanNumericValue output (empty): 0.00");
            return 0.00;
        }
        
        // Remover espacios y caracteres no numéricos excepto punto, coma y guión
        $cleaned = preg_replace('/[^0-9.,-]/', '', trim($value));
        error_log("DEBUG - cleanNumericValue after regex: " . $cleaned);
        
        // Si no hay números, devolver 0
        if (!preg_match('/[0-9]/', $cleaned)) {
            error_log("DEBUG - cleanNumericValue output (no numbers): 0.00");
            return 0.00;
        }
        
        // Contar puntos para determinar si son separadores de miles o decimales
        $dotCount = substr_count($cleaned, '.');
        error_log("DEBUG - cleanNumericValue dot count: " . $dotCount);
        
        if ($dotCount > 1) {
            // Hay múltiples puntos - asumir que el último es decimal y los otros son separadores de miles
            $parts = explode('.', $cleaned);
            $decimalPart = array_pop($parts); // Última parte como decimal
            $integerPart = implode('', $parts); // Resto como parte entera
            
            // Si la parte decimal tiene más de 2 dígitos, truncar
            if (strlen($decimalPart) > 2) {
                $decimalPart = substr($decimalPart, 0, 2);
            }
            
            $cleaned = $integerPart . '.' . $decimalPart;
            error_log("DEBUG - cleanNumericValue multiple dots result: " . $cleaned);
        } else if ($dotCount === 1) {
            // Solo un punto - verificar si es decimal o separador de miles
            $parts = explode('.', $cleaned);
            if (strlen($parts[1]) <= 2) {
                // Probablemente es decimal (máximo 2 dígitos después del punto)
                $cleaned = $cleaned;
                error_log("DEBUG - cleanNumericValue single dot (decimal): " . $cleaned);
            } else {
                // Probablemente es separador de miles, remover el punto
                $cleaned = implode('', $parts);
                error_log("DEBUG - cleanNumericValue single dot (thousands): " . $cleaned);
            }
        }
        
        // Convertir coma decimal a punto si existe
        $cleaned = str_replace(',', '.', $cleaned);
        error_log("DEBUG - cleanNumericValue after comma replacement: " . $cleaned);
        
        // Verificar que sea numérico
        if (is_numeric($cleaned)) {
            $result = floatval($cleaned);
            error_log("DEBUG - cleanNumericValue output (final): " . $result);
            return $result;
        }
    }
    
    error_log("DEBUG - cleanNumericValue output (default): 0.00");
    return 0.00;
}

/**
 * Función para convertir fechas de Excel
 */
function convertExcelDate($date) {
    if (is_numeric($date)) {
        // Fecha de Excel (número de días desde 1900-01-01)
        $unixDate = ($date - 25569) * 86400;
        return date('Y-m-d', $unixDate);
    }
    
    if (is_string($date)) {
        // Intentar diferentes formatos de fecha
        $formats = [
            'Y-m-d',
            'd/m/Y',
            'd-m-Y',
            'm/d/Y',
            'Y/m/d'
        ];
        
        foreach ($formats as $format) {
            $parsed = DateTime::createFromFormat($format, $date);
            if ($parsed !== false) {
                return $parsed->format('Y-m-d');
            }
        }
        
        // Si no se puede parsear, devolver la fecha original
        return $date;
    }
    
    return $date;
}
?> 