<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Incluir configuración de base de datos
require_once 'config.php';
require_once 'db.php';

try {
    // Obtener la fecha desde el parámetro GET
    $fecha = isset($_GET['fecha']) ? $_GET['fecha'] : null;
    
    if (!$fecha) {
        throw new Exception('Parámetro fecha es requerido');
    }
    
    // Validar formato de fecha (YYYY-MM-DD)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        throw new Exception('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    
    // Consulta SQL para obtener avance físico ACUMULADO hasta la fecha
    $sql = "SELECT cf.vector, cf.porcentaje_periodo as acumulado_periodo 
            FROM cumplimiento_fisico cf 
            WHERE cf.periodo = ? 
            AND cf.vector IN ('REAL', 'API') 
            ORDER BY cf.vector";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $fecha);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $avanceFisico = [];
    
    while ($row = $result->fetch_assoc()) {
        $avanceFisico[$row['vector']] = floatval($row['acumulado_periodo']);
    }
    
    // Preparar respuesta
    $response = [
        'success' => true,
        'fecha' => $fecha,
        'avance_fisico' => [
            'REAL' => isset($avanceFisico['REAL']) ? $avanceFisico['REAL'] : null,
            'API' => isset($avanceFisico['API']) ? $avanceFisico['API'] : null
        ]
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$stmt->close();
$conn->close();
?> 