<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
require_once '../db.php';

try {
    // Obtener parámetros de filtro
    $fechaDesde = $_GET['fecha_desde'] ?? null;
    $fechaHasta = $_GET['fecha_hasta'] ?? null;
    $proyectoId = $_GET['proyecto_id'] ?? null;
    
    // Construir la consulta base
    $query = "SELECT SUM(monto) as total_real FROM real_parcial WHERE 1=1";
    $params = [];
    
    // Agregar filtro de proyecto si se proporciona
    if ($proyectoId) {
        $query .= " AND proyecto_id = ?";
        $params[] = $proyectoId;
    }
    
    // Agregar filtro de fecha desde
    if ($fechaDesde) {
        $query .= " AND periodo >= ?";
        $params[] = $fechaDesde;
    }
    
    // Agregar filtro de fecha hasta
    if ($fechaHasta) {
        $query .= " AND periodo <= ?";
        $params[] = $fechaHasta;
    }
    
    // Preparar y ejecutar la consulta
    $stmt = $conn->prepare($query);
    if (!empty($params)) {
        $stmt->bind_param(str_repeat('s', count($params)), ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result) {
        $row = $result->fetch_assoc();
        $total_real = $row['total_real'] ?? 0;
    } else {
        $total_real = 0;
    }
    
    // Formatear el número con separadores de miles
    $total_formateado = number_format($total_real, 0, ',', '.');
    
    $response = [
        'success' => true,
        'total_real' => $total_real,
        'total_formateado' => $total_formateado,
        'mensaje' => 'Consulta de real financiero realizada exitosamente'
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => 'Error general: ' . $e->getMessage(),
        'total_real' => 0,
        'total_formateado' => '0'
    ];
    
    echo json_encode($response);
}
?> 