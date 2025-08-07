<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';
require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['rows']) || !is_array($data['rows'])) {
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit;
}

// Obtener parámetros
$tabla = isset($data['tabla']) ? $data['tabla'] : '';
$proyecto_id = isset($data['proyecto_id']) ? (int)$data['proyecto_id'] : null;

// Validar parámetros
if (empty($tabla) || !$proyecto_id) {
    echo json_encode(['success' => false, 'error' => 'Faltan parámetros requeridos: tabla o proyecto_id']);
    exit;
}

// Validar que la tabla sea una de las permitidas
$tablasPermitidas = [
    'av_fisico_real',
    'av_fisico_npc', 
    'av_fisico_poa',
    'av_fisico_v0',
    'av_fisico_api'
];

if (!in_array($tabla, $tablasPermitidas)) {
    echo json_encode(['success' => false, 'error' => 'Tabla no permitida']);
    exit;
}

// Verificar que el proyecto existe
$stmt = $pdo->prepare("SELECT proyecto_id, nombre FROM proyectos WHERE proyecto_id = ?");
$stmt->execute([$proyecto_id]);
$proyecto = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$proyecto) {
    echo json_encode(['success' => false, 'error' => "Proyecto ID $proyecto_id no existe"]);
    exit;
}

$rows = $data['rows'];
$inserted = 0;
$errors = [];

// Crear tabla si no existe
$createTableSQL = "";
switch ($tabla) {
    case 'av_fisico_real':
        $createTableSQL = "CREATE TABLE IF NOT EXISTS av_fisico_real (
            id_av_real VARCHAR(20) NOT NULL PRIMARY KEY,
            proyecto_id INT(11) NOT NULL,
            periodo DATE NOT NULL,
            vector VARCHAR(10) NOT NULL,
            ie_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            ie_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            em_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            em_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            api_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            api_acum DECIMAL(5,2) NULL DEFAULT 0.00,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_proyecto_periodo (proyecto_id, periodo),
            INDEX idx_periodo (periodo),
            INDEX idx_vector (vector),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id) ON DELETE CASCADE
        ) COLLATE=utf8mb4_unicode_ci";
        break;
    case 'av_fisico_npc':
        $createTableSQL = "CREATE TABLE IF NOT EXISTS av_fisico_npc (
            id_av_npc VARCHAR(20) NOT NULL PRIMARY KEY,
            proyecto_id INT(11) NOT NULL,
            periodo DATE NOT NULL,
            vector VARCHAR(10) NOT NULL,
            ie_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            ie_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            em_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            em_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            api_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            api_acum DECIMAL(5,2) NULL DEFAULT 0.00,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_proyecto_periodo (proyecto_id, periodo),
            INDEX idx_periodo (periodo),
            INDEX idx_vector (vector),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id) ON DELETE CASCADE
        ) COLLATE=utf8mb4_unicode_ci";
        break;
    case 'av_fisico_poa':
        $createTableSQL = "CREATE TABLE IF NOT EXISTS av_fisico_poa (
            id_av_poa VARCHAR(20) NOT NULL PRIMARY KEY,
            proyecto_id INT(11) NOT NULL,
            periodo DATE NOT NULL,
            vector VARCHAR(10) NOT NULL,
            ie_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            ie_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            em_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            em_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            api_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            api_acum DECIMAL(5,2) NULL DEFAULT 0.00,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_proyecto_periodo (proyecto_id, periodo),
            INDEX idx_periodo (periodo),
            INDEX idx_vector (vector),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id) ON DELETE CASCADE
        ) COLLATE=utf8mb4_unicode_ci";
        break;
    case 'av_fisico_v0':
        $createTableSQL = "CREATE TABLE IF NOT EXISTS av_fisico_v0 (
            id_av_v0 VARCHAR(20) NOT NULL PRIMARY KEY,
            proyecto_id INT(11) NOT NULL,
            periodo DATE NOT NULL,
            vector VARCHAR(10) NOT NULL,
            ie_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            ie_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            em_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            em_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            api_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            api_acum DECIMAL(5,2) NULL DEFAULT 0.00,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_proyecto_periodo (proyecto_id, periodo),
            INDEX idx_periodo (periodo),
            INDEX idx_vector (vector),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id) ON DELETE CASCADE
        ) COLLATE=utf8mb4_unicode_ci";
        break;
    case 'av_fisico_api':
        $createTableSQL = "CREATE TABLE IF NOT EXISTS av_fisico_api (
            id_av_api VARCHAR(20) NOT NULL PRIMARY KEY,
            proyecto_id INT(11) NOT NULL,
            periodo DATE NOT NULL,
            vector VARCHAR(10) NOT NULL,
            ie_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            ie_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            em_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            em_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            mo_acumulado DECIMAL(5,2) NULL DEFAULT 0.00,
            api_parcial DECIMAL(5,2) NULL DEFAULT 0.00,
            api_acum DECIMAL(5,2) NULL DEFAULT 0.00,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_proyecto_periodo (proyecto_id, periodo),
            INDEX idx_periodo (periodo),
            INDEX idx_vector (vector),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id) ON DELETE CASCADE
        ) COLLATE=utf8mb4_unicode_ci";
        break;
}

if (!empty($createTableSQL)) {
    try {
        $pdo->exec($createTableSQL);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Error al crear tabla: ' . $e->getMessage()]);
        exit;
    }
}

// Eliminar datos existentes para el proyecto_id
try {
    $deleteSQL = "DELETE FROM $tabla WHERE proyecto_id = ?";
    $deleteStmt = $pdo->prepare($deleteSQL);
    $deleteStmt->execute([$proyecto_id]);
    $deleted = $deleteStmt->rowCount();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al eliminar datos existentes: ' . $e->getMessage()]);
    exit;
}

// Función para limpiar valores numéricos (porcentajes)
function cleanNumericValue($value) {
    if (is_numeric($value)) {
        return floatval($value);
    }
    if (is_string($value)) {
        $value = trim($value);
        
        // Si está vacío o es un guión
        if ($value === '-' || $value === '' || $value === null) {
            return 0.00;
        }
        
        // Remover el símbolo de porcentaje si existe
        $value = str_replace('%', '', $value);
        $value = trim($value);
        
        // Si después de remover % está vacío
        if ($value === '') {
            return 0.00;
        }
        
        // Limpiar caracteres no numéricos excepto puntos y comas
        $cleaned = preg_replace('/[^0-9.,-]/', '', $value);
        
        // Si no hay números
        if (!preg_match('/[0-9]/', $cleaned)) {
            return 0.00;
        }
        
        // Manejar separadores de miles (puntos) y decimales (comas)
        $dotCount = substr_count($cleaned, '.');
        $commaCount = substr_count($cleaned, ',');
        
        // Si hay múltiples puntos, probablemente son separadores de miles
        if ($dotCount > 1) {
            $parts = explode('.', $cleaned);
            $decimalPart = array_pop($parts);
            $integerPart = implode('', $parts);
            
            // Si la parte decimal tiene más de 2 dígitos, truncar
            if (strlen($decimalPart) > 2) {
                $decimalPart = substr($decimalPart, 0, 2);
            }
            
            $cleaned = $integerPart . '.' . $decimalPart;
        } 
        // Si hay una coma, probablemente es el separador decimal
        else if ($commaCount > 0) {
            $cleaned = str_replace(',', '.', $cleaned);
        }
        // Si hay un solo punto, verificar si es decimal o separador de miles
        else if ($dotCount === 1) {
            $parts = explode('.', $cleaned);
            // Si la parte después del punto tiene más de 2 dígitos, es separador de miles
            if (strlen($parts[1]) > 2) {
                $cleaned = implode('', $parts);
            }
        }
        
        // Convertir a float
        if (is_numeric($cleaned)) {
            $result = floatval($cleaned);
            // Asegurar que no exceda 100% si es un porcentaje
            return min($result, 100.00);
        }
    }
    return 0.00;
}

// Función para convertir fecha de Excel a MySQL
function convertExcelDate($excelDate) {
    if (empty($excelDate)) {
        return null;
    }
    
    // Si ya es una fecha en formato string (DD-MM-YYYY)
    if (is_string($excelDate) && preg_match('/^\d{2}-\d{2}-\d{4}$/', $excelDate)) {
        $parts = explode('-', $excelDate);
        return $parts[2] . '-' . $parts[1] . '-' . $parts[0];
    }
    
    // Si es un número (fecha de Excel)
    if (is_numeric($excelDate)) {
        $date = new DateTime();
        $date->setTimestamp(($excelDate - 25569) * 86400);
        return $date->format('Y-m-d');
    }
    
    // Si es una fecha en formato string estándar
    if (is_string($excelDate)) {
        $date = new DateTime($excelDate);
        return $date->format('Y-m-d');
    }
    
    return null;
}

foreach ($rows as $index => $row) {
    try {
        // Extraer datos de la fila
        $id = trim($row['id'] ?? '');
        $periodo = trim($row['periodo'] ?? '');
        $vector = trim($row['vector'] ?? '');
        $ie_parcial = trim($row['ie_parcial'] ?? '');
        $ie_acumulado = trim($row['ie_acumulado'] ?? '');
        $em_parcial = trim($row['em_parcial'] ?? '');
        $em_acumulado = trim($row['em_acumulado'] ?? '');
        $mo_parcial = trim($row['mo_parcial'] ?? '');
        $mo_acumulado = trim($row['mo_acumulado'] ?? '');
        $api_parcial = trim($row['api_parcial'] ?? '');
        $api_acum = trim($row['api_acum'] ?? '');

        // Validaciones
        if (empty($id)) {
            throw new Exception("ID vacío en fila " . ($index + 1));
        }

        if (empty($periodo)) {
            throw new Exception("Fecha vacía en fila " . ($index + 1));
        }

        if (empty($vector)) {
            throw new Exception("Vector vacío en fila " . ($index + 1));
        }

        // Validar y convertir formato de fecha DD-MM-YYYY a YYYY-MM-DD
        $periodo_convertido = convertExcelDate($periodo);
        if (!$periodo_convertido) {
            throw new Exception("Formato de fecha inválido en fila " . ($index + 1) . ". Debe ser DD-MM-YYYY o YYYY-MM-DD");
        }

        // Procesar valores numéricos
        $ie_parcial_limpio = cleanNumericValue($ie_parcial);
        $ie_acumulado_limpio = cleanNumericValue($ie_acumulado);
        $em_parcial_limpio = cleanNumericValue($em_parcial);
        $em_acumulado_limpio = cleanNumericValue($em_acumulado);
        $mo_parcial_limpio = cleanNumericValue($mo_parcial);
        $mo_acumulado_limpio = cleanNumericValue($mo_acumulado);
        $api_parcial_limpio = cleanNumericValue($api_parcial);
        $api_acum_limpio = cleanNumericValue($api_acum);

        // Preparar statement para inserción según la tabla
        switch ($tabla) {
            case 'av_fisico_real':
                $stmt = $pdo->prepare("INSERT INTO av_fisico_real (id_av_real, proyecto_id, periodo, vector, ie_parcial, ie_acumulado, em_parcial, em_acumulado, mo_parcial, mo_acumulado, api_parcial, api_acum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$id, $proyecto_id, $periodo_convertido, $vector, $ie_parcial_limpio, $ie_acumulado_limpio, $em_parcial_limpio, $em_acumulado_limpio, $mo_parcial_limpio, $mo_acumulado_limpio, $api_parcial_limpio, $api_acum_limpio]);
                break;
            case 'av_fisico_npc':
                $stmt = $pdo->prepare("INSERT INTO av_fisico_npc (id_av_npc, proyecto_id, periodo, vector, ie_parcial, ie_acumulado, em_parcial, em_acumulado, mo_parcial, mo_acumulado, api_parcial, api_acum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$id, $proyecto_id, $periodo_convertido, $vector, $ie_parcial_limpio, $ie_acumulado_limpio, $em_parcial_limpio, $em_acumulado_limpio, $mo_parcial_limpio, $mo_acumulado_limpio, $api_parcial_limpio, $api_acum_limpio]);
                break;
            case 'av_fisico_poa':
                $stmt = $pdo->prepare("INSERT INTO av_fisico_poa (id_av_poa, proyecto_id, periodo, vector, ie_parcial, ie_acumulado, em_parcial, em_acumulado, mo_parcial, mo_acumulado, api_parcial, api_acum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$id, $proyecto_id, $periodo_convertido, $vector, $ie_parcial_limpio, $ie_acumulado_limpio, $em_parcial_limpio, $em_acumulado_limpio, $mo_parcial_limpio, $mo_acumulado_limpio, $api_parcial_limpio, $api_acum_limpio]);
                break;
            case 'av_fisico_v0':
                $stmt = $pdo->prepare("INSERT INTO av_fisico_v0 (id_av_v0, proyecto_id, periodo, vector, ie_parcial, ie_acumulado, em_parcial, em_acumulado, mo_parcial, mo_acumulado, api_parcial, api_acum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$id, $proyecto_id, $periodo_convertido, $vector, $ie_parcial_limpio, $ie_acumulado_limpio, $em_parcial_limpio, $em_acumulado_limpio, $mo_parcial_limpio, $mo_acumulado_limpio, $api_parcial_limpio, $api_acum_limpio]);
                break;
            case 'av_fisico_api':
                $stmt = $pdo->prepare("INSERT INTO av_fisico_api (id_av_api, proyecto_id, periodo, vector, ie_parcial, ie_acumulado, em_parcial, em_acumulado, mo_parcial, mo_acumulado, api_parcial, api_acum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$id, $proyecto_id, $periodo_convertido, $vector, $ie_parcial_limpio, $ie_acumulado_limpio, $em_parcial_limpio, $em_acumulado_limpio, $mo_parcial_limpio, $mo_acumulado_limpio, $api_parcial_limpio, $api_acum_limpio]);
                break;
        }
        
        $inserted++;

    } catch (Exception $e) {
        $errors[] = "Fila " . ($index + 1) . ": " . $e->getMessage();
    }
}

if (!empty($errors)) {
    echo json_encode([
        'success' => false,
        'error' => 'Errores en la importación',
        'errores' => $errors,
        'inserted' => $inserted,
        'deleted' => $deleted
    ]);
} else {
    echo json_encode([
        'success' => true,
        'message' => "Importación exitosa para la tabla $tabla. $deleted registros eliminados, $inserted registros insertados.",
        'inserted' => $inserted,
        'deleted' => $deleted
    ]);
}
?> 