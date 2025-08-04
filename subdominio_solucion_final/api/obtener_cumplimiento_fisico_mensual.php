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
    // Obtener el proyecto_id desde el parámetro GET
    $proyecto_id = isset($_GET['proyecto_id']) ? $_GET['proyecto_id'] : null;
    
    if (!$proyecto_id) {
        throw new Exception('Parámetro proyecto_id es requerido');
    }
    
    // Consulta SQL para obtener porcentaje de avance físico mensual del vector REAL (parcial y acumulado)
    $sql = "SELECT 
                DATE_FORMAT(cf.periodo, '%Y-%m') as mes,
                cf.parcial_periodo as porcentaje_parcial,
                cf.porcentaje_periodo as porcentaje_acumulado
            FROM cumplimiento_fisico cf 
            WHERE cf.proyecto_id = ? 
            AND cf.vector = 'REAL'
            ORDER BY cf.periodo";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $proyecto_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $cumplimientoMensual = [];
    
    while ($row = $result->fetch_assoc()) {
        $cumplimientoMensual[$row['mes']] = [
            'parcial' => floatval($row['porcentaje_parcial']),
            'acumulado' => floatval($row['porcentaje_acumulado'])
        ];
    }
    
    // Preparar respuesta
    $response = [
        'success' => true,
        'proyecto_id' => $proyecto_id,
        'cumplimiento_fisico_mensual' => $cumplimientoMensual
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