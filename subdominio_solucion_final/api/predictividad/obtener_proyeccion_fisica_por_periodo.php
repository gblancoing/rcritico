<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
require_once '../db.php';

try {
    $proyecto_id = $_GET['proyecto_id'] ?? null;
    $periodo_prediccion = $_GET['periodo_prediccion'] ?? null;

    if (!$proyecto_id) {
        throw new Exception('proyecto_id es requerido');
    }

    if (!$periodo_prediccion) {
        throw new Exception('periodo_prediccion es requerido');
    }

    // Consultar la tabla predictividad para obtener el porcentaje_predicido del período específico
    $sql = "SELECT 
                porcentaje_predicido,
                valor_real_porcentaje,
                periodo_prediccion,
                periodo_cierre_real
            FROM predictividad 
            WHERE proyecto_id = ? 
            AND periodo_prediccion = ?
            ORDER BY id_predictivo DESC
            LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$proyecto_id, $periodo_prediccion]);
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($resultado) {
        echo json_encode([
            'success' => true,
            'data' => [
                [
                    'porcentaje_predicido' => floatval($resultado['porcentaje_predicido']),
                    'valor_real_porcentaje' => floatval($resultado['valor_real_porcentaje']),
                    'periodo_prediccion' => $resultado['periodo_prediccion'],
                    'periodo_cierre_real' => $resultado['periodo_cierre_real']
                ]
            ],
            'total' => 1
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => [],
            'total' => 0,
            'message' => 'No se encontraron datos para el período especificado'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
