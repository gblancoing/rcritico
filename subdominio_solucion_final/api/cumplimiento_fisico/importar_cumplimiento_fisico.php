<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['rows']) || !is_array($data['rows'])) {
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit;
}

// Obtener proyecto_id y centro_costo_id del contexto
$proyecto_id = isset($data['proyecto_id']) ? (int)$data['proyecto_id'] : null;
$centro_costo_id = isset($data['centro_costo_id']) ? (int)$data['centro_costo_id'] : null;

if (!$proyecto_id) {
    echo json_encode(['success' => false, 'error' => 'ID del proyecto no proporcionado']);
    exit;
}

if (!$centro_costo_id) {
    echo json_encode(['success' => false, 'error' => 'ID del centro de costo no proporcionado']);
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

// Verificar que el centro de costo existe y obtener su nombre
$stmt = $pdo->prepare("SELECT id, nombre FROM centros_costo WHERE id = ?");
$stmt->execute([$centro_costo_id]);
$centro_costo = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$centro_costo) {
    echo json_encode(['success' => false, 'error' => "Centro de costo ID $centro_costo_id no existe"]);
    exit;
}

$rows = $data['rows'];
$inserted = 0;
$errors = [];

// Eliminar datos existentes del proyecto y centro de costo antes de importar
try {
    $stmt = $pdo->prepare("DELETE FROM cumplimiento_fisico WHERE proyecto_id = ? AND id = ?");
    $stmt->execute([$proyecto_id, $centro_costo_id]);
    $deleted = $stmt->rowCount();
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'error' => 'Error al eliminar datos existentes: ' . $e->getMessage()
    ]);
    exit;
}

foreach ($rows as $index => $row) {
    try {
        // Extraer datos de la fila
        $vector = trim($row['vector'] ?? '');
        $periodo = trim($row['periodo'] ?? '');
        $parcial_periodo = trim($row['parcial_periodo'] ?? '');
        $porcentaje_periodo = trim($row['porcentaje_periodo'] ?? '');

        // Validaciones
        if (empty($vector) || !in_array(strtoupper($vector), ['REAL', 'V0', 'NPC', 'API'])) {
            throw new Exception("Vector inválido en fila " . ($index + 1) . ". Debe ser: REAL, V0, NPC, API");
        }

        if (empty($periodo)) {
            throw new Exception("Fecha vacía en fila " . ($index + 1));
        }

        // Validar y convertir formato de fecha DD-MM-YYYY a YYYY-MM-DD
        if (preg_match('/^\d{2}-\d{2}-\d{4}$/', $periodo)) {
            // Convertir de DD-MM-YYYY a YYYY-MM-DD
            $fecha_parts = explode('-', $periodo);
            $periodo = $fecha_parts[2] . '-' . $fecha_parts[1] . '-' . $fecha_parts[0];
        } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $periodo)) {
            throw new Exception("Formato de fecha inválido en fila " . ($index + 1) . ". Debe ser DD-MM-YYYY o YYYY-MM-DD");
        }

        // Procesar parcial_periodo (remover símbolo % y convertir coma a punto)
        $parcial_limpio = $parcial_periodo;
        if (empty($parcial_limpio)) {
            // Si está vacío, establecer como 0
            $parcial_periodo = 0.0;
        } else {
            // Si es un número pequeño (menor a 1), probablemente es un porcentaje en formato decimal
            if (is_numeric($parcial_limpio) && $parcial_limpio < 1 && $parcial_limpio > 0) {
                // Convertir de decimal a porcentaje (ej: 0.0023 -> 0.23)
                $parcial_periodo = $parcial_limpio * 100;
            } else {
                // Procesar como string (remover % y convertir coma a punto)
                if (strpos($parcial_limpio, '%') !== false) {
                    $parcial_limpio = str_replace('%', '', $parcial_limpio);
                }
                $parcial_limpio = str_replace(',', '.', $parcial_limpio);
                
                if (!is_numeric($parcial_limpio)) {
                    throw new Exception("Parcial período inválido en fila " . ($index + 1) . ". Formato esperado: 12,25% o 12.25");
                }

                $parcial_periodo = floatval($parcial_limpio);
            }
            
            if ($parcial_periodo < 0 || $parcial_periodo > 100) {
                throw new Exception("Parcial período fuera de rango (0-100) en fila " . ($index + 1));
            }
        }

        // Procesar porcentaje_periodo (remover símbolo % y convertir coma a punto)
        $porcentaje_limpio = $porcentaje_periodo;
        if (empty($porcentaje_limpio)) {
            $porcentaje_periodo = 0.0;
        } else {
            // Si es un número pequeño (menor a 1), probablemente es un porcentaje en formato decimal
            if (is_numeric($porcentaje_limpio) && $porcentaje_limpio < 1 && $porcentaje_limpio > 0) {
                // Convertir de decimal a porcentaje (ej: 0.0023 -> 0.23)
                $porcentaje_periodo = $porcentaje_limpio * 100;
            } else {
                // Procesar como string (remover % y convertir coma a punto)
                if (strpos($porcentaje_limpio, '%') !== false) {
                    $porcentaje_limpio = str_replace('%', '', $porcentaje_limpio);
                }
                $porcentaje_limpio = str_replace(',', '.', $porcentaje_limpio);
                
                if (!is_numeric($porcentaje_limpio)) {
                    throw new Exception("Porcentaje período inválido en fila " . ($index + 1) . ". Formato esperado: 12,25% o 12.25");
                }

                $porcentaje_periodo = floatval($porcentaje_limpio);
            }
            
            if ($porcentaje_periodo < 0 || $porcentaje_periodo > 100) {
                throw new Exception("Porcentaje período fuera de rango (0-100) en fila " . ($index + 1));
            }
        }

        // Insertar registro usando los datos del contexto
        $stmt = $pdo->prepare("INSERT INTO cumplimiento_fisico (proyecto_id, id, nombre, vector, periodo, parcial_periodo, porcentaje_periodo) 
                VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        if ($stmt->execute([
            $proyecto_id,
            $centro_costo_id,
            $centro_costo['nombre'], // Usar el nombre del centro de costo obtenido
            strtoupper($vector),
            $periodo,
            $parcial_periodo,
            $porcentaje_periodo
        ])) {
            $inserted++;
        }

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
        'message' => "Importación exitosa. $deleted registros eliminados, $inserted registros insertados.",
        'inserted' => $inserted,
        'deleted' => $deleted
    ]);
}
?> 