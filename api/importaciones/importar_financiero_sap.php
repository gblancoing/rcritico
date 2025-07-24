<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);

// Log para debugging
error_log("Datos recibidos: " . print_r($data, true));

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

// Verificar que el proyecto existe
$stmt = $pdo->prepare("SELECT proyecto_id FROM proyectos WHERE proyecto_id = ?");
$stmt->execute([$proyecto_id]);
$proyecto = $stmt->fetch();

if (!$proyecto) {
    echo json_encode(['success' => false, 'error' => 'El proyecto_id especificado no existe']);
    exit;
}

// Obtener el centro de costo del proyecto
$stmt = $pdo->prepare("SELECT nombre FROM centros_costo WHERE proyecto_id = ? LIMIT 1");
$stmt->execute([$proyecto_id]);
$centro_costo = $stmt->fetch();

$centro_costo_nombre = $centro_costo ? $centro_costo['nombre'] : 'SAP';

// Verificar si la tabla financiero_sap existe, y crearla si no existe
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'financiero_sap'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        $sql = "CREATE TABLE financiero_sap (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_sap VARCHAR(30) NOT NULL,
            proyecto_id INT NOT NULL,
            centro_costo_nombre VARCHAR(100),
            version_sap VARCHAR(50),
            descripcion VARCHAR(50),
            grupo_version VARCHAR(50),
            periodo DATE,
            MO DECIMAL(15,2) DEFAULT 0.00,
            IC DECIMAL(15,2) DEFAULT 0.00,
            EM DECIMAL(15,2) DEFAULT 0.00,
            IE DECIMAL(15,2) DEFAULT 0.00,
            SC DECIMAL(15,2) DEFAULT 0.00,
            AD DECIMAL(15,2) DEFAULT 0.00,
            CL DECIMAL(15,2) DEFAULT 0.00,
            CT DECIMAL(15,2) DEFAULT 0.00,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_id_sap_proyecto (id_sap, proyecto_id),
            INDEX idx_proyecto_id (proyecto_id),
            INDEX idx_periodo (periodo),
            INDEX idx_version_sap (version_sap)
        )";
        
        $pdo->exec($sql);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al verificar/crear tabla financiero_sap: ' . $e->getMessage()]);
    exit;
}

/**
 * Función para limpiar y convertir números con formato europeo
 */
function limpiarNumero($valor) {
    if (empty($valor) || $valor === '-' || $valor === '') {
        return 0.00;
    }
    
    // Convertir a string si no lo es
    $valor = (string)$valor;
    
    // Remover espacios
    $valor = trim($valor);
    
    // Si está vacío después de limpiar, retornar 0
    if (empty($valor)) {
        return 0.00;
    }
    
    // Reemplazar comas por puntos para decimales
    $valor = str_replace(',', '.', $valor);
    
    // Remover puntos de miles (mantener solo el último punto como decimal)
    if (substr_count($valor, '.') > 1) {
        $partes = explode('.', $valor);
        $decimal = array_pop($partes); // Última parte es decimal
        $entero = implode('', $partes); // Resto es entero
        $valor = $entero . '.' . $decimal;
    }
    
    // Convertir a float y validar
    $numero = floatval($valor);
    return is_numeric($numero) ? $numero : 0.00;
}

/**
 * Función para convertir fecha de formato DD-MM-YYYY a YYYY-MM-DD
 */
function convertirFecha($fecha) {
    if (empty($fecha) || $fecha === '-' || $fecha === '') {
        return null;
    }
    
    // Convertir a string si no lo es
    $fecha = (string)$fecha;
    
    // Remover espacios
    $fecha = trim($fecha);
    
    // Si está vacío después de limpiar, retornar null
    if (empty($fecha)) {
        return null;
    }
    
    // Verificar si ya está en formato YYYY-MM-DD
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        return $fecha;
    }
    
    // Convertir de DD-MM-YYYY a YYYY-MM-DD
    if (preg_match('/^(\d{1,2})-(\d{1,2})-(\d{4})$/', $fecha, $matches)) {
        $dia = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $mes = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
        $anio = $matches[3];
        return "$anio-$mes-$dia";
    }
    
    // Si no coincide con ningún formato, retornar null
    return null;
}

/**
 * Función para limpiar texto
 */
function limpiarTexto($texto) {
    if (empty($texto) || $texto === '-') {
        return '';
    }
    return trim((string)$texto);
}

$inserted = 0;
$updated = 0;
$errors = [];

foreach ($rows as $index => $row) {
    try {
        // Log para debugging
        error_log("Procesando fila " . ($index + 1) . ": " . print_r($row, true));
        
        // Limpiar y validar los datos del Excel
        $id_sap = limpiarTexto($row['id_sap'] ?? '');
        $version_sap = limpiarTexto($row['version_sap'] ?? '');
        $descripcion = limpiarTexto($row['descripcion'] ?? '');
        $grupo_version = limpiarTexto($row['grupo_version'] ?? '');
        $periodo = convertirFecha($row['periodo'] ?? '');
        
        // Limpiar valores numéricos
        $mo = limpiarNumero($row['MO'] ?? 0);
        $ic = limpiarNumero($row['IC'] ?? 0);
        $em = limpiarNumero($row['EM'] ?? 0);
        $ie = limpiarNumero($row['IE'] ?? 0);
        $sc = limpiarNumero($row['SC'] ?? 0);
        $ad = limpiarNumero($row['AD'] ?? 0);
        $cl = limpiarNumero($row['CL'] ?? 0);
        $ct = limpiarNumero($row['CT'] ?? 0);

        // Validar que el id_sap no esté vacío
        if (empty($id_sap)) {
            $errors[] = "Fila " . ($index + 1) . ": id_sap no puede estar vacío";
            continue;
        }

        // Verificar si ya existe un registro con el mismo id_sap y proyecto_id
        $stmt = $pdo->prepare("SELECT id_sap FROM financiero_sap WHERE id_sap = ? AND proyecto_id = ?");
        $stmt->execute([$id_sap, $proyecto_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Actualizar registro existente
            $stmt = $pdo->prepare("UPDATE financiero_sap SET 
                centro_costo_nombre = ?, version_sap = ?, descripcion = ?, grupo_version = ?, 
                periodo = ?, MO = ?, IC = ?, EM = ?, IE = ?, SC = ?, AD = ?, CL = ?, CT = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_sap = ? AND proyecto_id = ?");
            
            try {
                if ($stmt->execute([
                    $centro_costo_nombre, $version_sap, $descripcion, $grupo_version,
                    $periodo, $mo, $ic, $em, $ie, $sc, $ad, $cl, $ct,
                    $id_sap, $proyecto_id
                ])) {
                    $updated++;
                } else {
                    $errorInfo = $stmt->errorInfo();
                    $errors[] = "Fila " . ($index + 1) . ": Error al actualizar registro - " . $errorInfo[2];
                }
            } catch (PDOException $e) {
                $errors[] = "Fila " . ($index + 1) . ": Error de base de datos - " . $e->getMessage();
            }
        } else {
            // Insertar nuevo registro
            $stmt = $pdo->prepare("INSERT INTO financiero_sap 
                (proyecto_id, centro_costo_nombre, id_sap, version_sap, descripcion, grupo_version, 
                periodo, MO, IC, EM, IE, SC, AD, CL, CT)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            try {
                if ($stmt->execute([
                    $proyecto_id, $centro_costo_nombre, $id_sap, $version_sap, $descripcion, $grupo_version,
                    $periodo, $mo, $ic, $em, $ie, $sc, $ad, $cl, $ct
                ])) {
                    $inserted++;
                } else {
                    $errorInfo = $stmt->errorInfo();
                    $errors[] = "Fila " . ($index + 1) . ": Error al insertar registro - " . $errorInfo[2];
                }
            } catch (PDOException $e) {
                $errors[] = "Fila " . ($index + 1) . ": Error de base de datos - " . $e->getMessage();
            }
        }
    } catch (Exception $e) {
        $errors[] = "Fila " . ($index + 1) . ": " . $e->getMessage();
    }
}

$total_processed = $inserted + $updated;

if (!empty($errors)) {
    echo json_encode([
        'success' => false, 
        'error' => 'Errores durante la importación',
        'errors' => $errors,
        'inserted' => $inserted,
        'updated' => $updated,
        'total_processed' => $total_processed
    ]);
} else {
    echo json_encode([
        'success' => true, 
        'inserted' => $inserted,
        'updated' => $updated,
        'total_processed' => $total_processed,
        'message' => "Procesamiento completado: $inserted nuevos registros, $updated actualizados"
    ]);
}
?> 