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
        $sql = "CREATE TABLE predictividad (
            id_predictivo INT AUTO_INCREMENT PRIMARY KEY,
            proyecto_id INT NOT NULL,
            id INT NOT NULL,
            periodo_prediccion DATE,
            porcentaje_predicido DECIMAL(8,4) DEFAULT 0.0000,
            periodo_cierre_real DATE,
            valor_real_porcentaje DECIMAL(8,4) DEFAULT 0.0000,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_proyecto_id (proyecto_id),
            INDEX idx_centro_costo_id (id),
            INDEX idx_periodo_prediccion (periodo_prediccion),
            INDEX idx_periodo_cierre_real (periodo_cierre_real),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id),
            FOREIGN KEY (id) REFERENCES centros_costo(id)
        )";
        
        $pdo->exec($sql);
        error_log("Tabla predictividad creada exitosamente");
    }

    /**
     * Función para convertir fecha de formato Excel a MySQL
     */
    function excelDateToMysql($excelDate) {
        if (empty($excelDate)) return null;
        
        // Si es string tipo fecha
        if (is_string($excelDate) && strpos($excelDate, '-') !== false) {
            $parts = explode('-', $excelDate);
            if (count($parts) === 3 && strlen($parts[2]) === 4) {
                // DD-MM-YYYY a YYYY-MM-DD
                return $parts[2] . '-' . str_pad($parts[1], 2, '0', STR_PAD_LEFT) . '-' . str_pad($parts[0], 2, '0', STR_PAD_LEFT);
            }
            return $excelDate;
        }
        
        // Si es número (número de serie Excel)
        if (is_numeric($excelDate)) {
            $unixDate = ($excelDate - 25569) * 86400;
            return date('Y-m-d', $unixDate);
        }
        
        return null;
    }

    /**
     * Función para convertir porcentaje con formato europeo
     */
    function parsePercentage($value) {
        if (empty($value)) return 0;
        
        // Convertir a string si no lo es
        $strValue = (string)$value;
        
        // Remover el símbolo % si existe
        $strValue = str_replace('%', '', $strValue);
        
        // Reemplazar coma por punto para parseFloat
        $strValue = str_replace(',', '.', $strValue);
        
        // Convertir a número
        $numero = floatval($strValue);
        
        // Si el valor original tenía %, mantener el valor tal como está
        // Si no tenía %, asumir que ya es un valor decimal
        return $numero;
    }

    $inserted = 0;
    $errores = [];
    
    foreach ($rows as $index => $row) {
        try {
            // Mapear las columnas del Excel
            $periodo_prediccion = excelDateToMysql($row['periodo_prediccion'] ?? '');
            $porcentaje_predicido = parsePercentage($row['porcentaje_predicido'] ?? 0);
            $periodo_cierre_real = excelDateToMysql($row['periodo_cierre_real'] ?? '');
            $valor_real_porcentaje = parsePercentage($row['valor_real_porcentaje'] ?? 0);

            // Log para debugging
            error_log("Fila $index - Datos procesados:");
            error_log("  periodo_prediccion: $periodo_prediccion");
            error_log("  porcentaje_predicido: $porcentaje_predicido");
            error_log("  periodo_cierre_real: $periodo_cierre_real");
            error_log("  valor_real_porcentaje: $valor_real_porcentaje");

            // Insertar en la tabla predictividad
            $stmt = $pdo->prepare("INSERT INTO predictividad 
                (proyecto_id, id, periodo_prediccion, porcentaje_predicido, periodo_cierre_real, valor_real_porcentaje) 
                VALUES (?, ?, ?, ?, ?, ?)");
            
            if ($stmt->execute([
                $proyecto_id,
                $centro_costo_id,
                $periodo_prediccion,
                $porcentaje_predicido,
                $periodo_cierre_real,
                $valor_real_porcentaje
            ])) {
                $inserted++;
            } else {
                $errores[] = "Error en fila $index: " . implode(', ', $stmt->errorInfo());
            }

        } catch (Exception $e) {
            $errores[] = "Error procesando fila $index: " . $e->getMessage();
            error_log("Error en fila $index: " . $e->getMessage());
        }
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