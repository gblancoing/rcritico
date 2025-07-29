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

    // Obtener el ID del centro de costo del proyecto
    $stmt = $pdo->prepare("SELECT id FROM centros_costo WHERE proyecto_id = ? LIMIT 1");
    $stmt->execute([$proyecto_id]);
    $centro_costo = $stmt->fetch();

    $centro_costo_id = $centro_costo ? $centro_costo['id'] : null;

    if (!$centro_costo_id) {
        echo json_encode(['success' => false, 'error' => 'No se encontró centro de costo para el proyecto especificado']);
        exit;
    }

    // Eliminar datos existentes del proyecto antes de importar
    $stmt = $pdo->prepare("DELETE FROM predictividad WHERE proyecto_id = ?");
    $stmt->execute([$proyecto_id]);
    $deleted = $stmt->rowCount();

    $inserted = 0;
    $errors = [];
    
    foreach ($rows as $index => $row) {
        try {
            // Extraer datos de la fila
            $periodo_prediccion = trim($row['periodo_prediccion'] ?? '');
            $porcentaje_predicido = trim($row['porcentaje_predicido'] ?? '');
            $periodo_cierre_real = trim($row['periodo_cierre_real'] ?? '');
            $valor_real_porcentaje = trim($row['valor_real_porcentaje'] ?? '');

            error_log("🔍 PHP - PROCESANDO FILA $index:");
            error_log("  📅 periodo_prediccion recibido: '$periodo_prediccion'");
            error_log("  📅 periodo_cierre_real recibido: '$periodo_cierre_real'");
            error_log("  📊 porcentaje_predicido recibido: '$porcentaje_predicido'");
            error_log("  📊 valor_real_porcentaje recibido: '$valor_real_porcentaje'");

            // Procesar fechas
            if (empty($periodo_prediccion)) {
                $periodo_prediccion = '2024-01-01';
                error_log("  ⚠️ periodo_prediccion vacío, usando default: $periodo_prediccion");
            } else {
                // Convertir de DD-MM-YYYY a YYYY-MM-DD
                if (preg_match('/^\d{2}-\d{2}-\d{4}$/', $periodo_prediccion)) {
                    $fecha_parts = explode('-', $periodo_prediccion);
                    $periodo_prediccion = $fecha_parts[2] . '-' . $fecha_parts[1] . '-' . $fecha_parts[0];
                    error_log("  ✅ periodo_prediccion convertido: '$periodo_prediccion'");
                } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $periodo_prediccion)) {
                    $periodo_prediccion = '2024-01-01';
                    error_log("  ⚠️ periodo_prediccion formato inválido, usando default: $periodo_prediccion");
                }
            }

            if (empty($periodo_cierre_real)) {
                $periodo_cierre_real = '2024-01-01';
                error_log("  ⚠️ periodo_cierre_real vacío, usando default: $periodo_cierre_real");
            } else {
                // Convertir de DD-MM-YYYY a YYYY-MM-DD
                if (preg_match('/^\d{2}-\d{2}-\d{4}$/', $periodo_cierre_real)) {
                    $fecha_parts = explode('-', $periodo_cierre_real);
                    $periodo_cierre_real = $fecha_parts[2] . '-' . $fecha_parts[1] . '-' . $fecha_parts[0];
                    error_log("  ✅ periodo_cierre_real convertido: '$periodo_cierre_real'");
                } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $periodo_cierre_real)) {
                    $periodo_cierre_real = '2024-01-01';
                    error_log("  ⚠️ periodo_cierre_real formato inválido, usando default: $periodo_cierre_real");
                }
            }

            // Procesar porcentajes
            $porcentaje_predicido_limpio = $porcentaje_predicido;
            if (empty($porcentaje_predicido_limpio)) {
                $porcentaje_predicido = 0.0;
            } else {
                // Si es un número pequeño (menor a 1), probablemente es un porcentaje en formato decimal
                if (is_numeric($porcentaje_predicido_limpio) && $porcentaje_predicido_limpio < 1 && $porcentaje_predicido_limpio > 0) {
                    // Convertir de decimal a porcentaje (ej: 0.0023 -> 0.23)
                    $porcentaje_predicido = $porcentaje_predicido_limpio * 100;
                } else {
                    // Procesar como string (remover % y convertir coma a punto)
                    if (strpos($porcentaje_predicido_limpio, '%') !== false) {
                        $porcentaje_predicido_limpio = str_replace('%', '', $porcentaje_predicido_limpio);
                    }
                    $porcentaje_predicido_limpio = str_replace(',', '.', $porcentaje_predicido_limpio);
                    
                    if (!is_numeric($porcentaje_predicido_limpio)) {
                        $porcentaje_predicido = 0.0;
                    } else {
                        $porcentaje_predicido = floatval($porcentaje_predicido_limpio);
                    }
                }
            }

            $valor_real_limpio = $valor_real_porcentaje;
            if (empty($valor_real_limpio)) {
                $valor_real_porcentaje = 0.0;
            } else {
                // Si es un número pequeño (menor a 1), probablemente es un porcentaje en formato decimal
                if (is_numeric($valor_real_limpio) && $valor_real_limpio < 1 && $valor_real_limpio > 0) {
                    // Convertir de decimal a porcentaje (ej: 0.0023 -> 0.23)
                    $valor_real_porcentaje = $valor_real_limpio * 100;
                } else {
                    // Procesar como string (remover % y convertir coma a punto)
                    if (strpos($valor_real_limpio, '%') !== false) {
                        $valor_real_limpio = str_replace('%', '', $valor_real_limpio);
                    }
                    $valor_real_limpio = str_replace(',', '.', $valor_real_limpio);
                    
                    if (!is_numeric($valor_real_limpio)) {
                        $valor_real_porcentaje = 0.0;
                    } else {
                        $valor_real_porcentaje = floatval($valor_real_limpio);
                    }
                }
            }

            // Insertar registro
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
            }

        } catch (Exception $e) {
            $errors[] = "Error procesando fila $index: " . $e->getMessage();
        }
    }

    $response = [
        'success' => true,
        'inserted' => $inserted,
        'deleted' => $deleted,
        'message' => "Importación exitosa. $deleted registros eliminados, $inserted registros insertados."
    ];

    if (!empty($errors)) {
        $response['success'] = false;
        $response['error'] = 'Errores en la importación';
        $response['errores'] = $errors;
    }

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error general: ' . $e->getMessage()
    ]);
}
?> 