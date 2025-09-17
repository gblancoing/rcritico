<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

try {
    // Obtener parámetros
    $proyecto_id = $_GET['proyecto_id'] ?? null;
    $fecha_filtro = $_GET['fecha_filtro'] ?? null;

    if (!$proyecto_id || !$fecha_filtro) {
        throw new Exception('proyecto_id y fecha_filtro son requeridos');
    }

    // Consulta SQL simplificada para debugging
    $sql = "SELECT
    (
        SELECT COUNT(DISTINCT DATE_FORMAT(periodo, '%Y-%m')) 
        FROM av_fisico_api 
        WHERE proyecto_id = ?
          AND DATE_FORMAT(periodo, '%Y-%m') <= ?
    ) AS plazo_control,
    (
        SELECT COALESCE(SUM(monto), 0) 
        FROM api_parcial 
        WHERE proyecto_id = ?
    ) AS bac_total";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $proyecto_id, $fecha_filtro,  // plazo_control
        $proyecto_id                  // bac_total
    ]);
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'ecd_f' => 56, // Valor temporal para testing
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => [
            'resultado_sql' => $result,
            'plazo_control' => $result['plazo_control'] ?? 'NULL',
            'bac_total' => $result['bac_total'] ?? 'NULL'
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>


