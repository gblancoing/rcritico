<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$data = json_decode(file_get_contents('php://input'), true);

// Parámetros requeridos
$proyecto_id = $data['proyecto_id'] ?? null;
$periodo_hasta = $data['periodo_hasta'] ?? null;

echo json_encode([
    'success' => true,
    'data' => [
        'proyeccion_fisica' => -0.85,
        'real_fisico' => 0.19,
        'periodo_prediccion' => '2025-07-31',
        'periodo_cierre_real' => '2025-08-31',
        'periodo_solicitado' => $periodo_hasta,
        'periodo_anterior_usado' => '2025-07-31',
        'debug_info' => [
            'proyecto_id_recibido' => $proyecto_id,
            'periodo_hasta_recibido' => $periodo_hasta,
            'test_mode' => true
        ]
    ],
    'message' => 'Datos de prueba para proyección física'
]);
?>
