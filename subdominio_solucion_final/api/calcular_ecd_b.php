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

    // Consulta SQL para calcular ECD(b)
    $sql = "SELECT 
        (SELECT COUNT(DISTINCT DATE_FORMAT(periodo, '%Y-%m')) as plazo_control
         FROM av_fisico_api 
         WHERE proyecto_id = ?
             AND DATE_FORMAT(periodo, '%Y-%m') <= ?) 
        + 
        (
            (
                (SELECT COALESCE(SUM(monto), 0) as bac 
                 FROM api_parcial 
                 WHERE proyecto_id = ?)
                - 
                ((SELECT COALESCE(SUM(monto), 0) as bac 
                  FROM api_parcial 
                  WHERE proyecto_id = ?) 
                 * 
                 (SELECT COALESCE(api_acum, 0)
                  FROM av_fisico_real avr
                  WHERE avr.proyecto_id = ? 
                      AND DATE_FORMAT(avr.periodo, '%Y-%m') <= ?
                  ORDER BY periodo DESC
                  LIMIT 1))
            )
            / 
            (SELECT COALESCE(SUM(monto), 0) as pv1m
             FROM api_parcial 
             WHERE proyecto_id = ?
                 AND DATE_FORMAT(periodo, '%Y-%m') = 
                     (SELECT DATE_FORMAT(periodo, '%Y-%m') as ultimo_periodo
                      FROM api_parcial 
                      WHERE proyecto_id = ?
                          AND DATE_FORMAT(periodo, '%Y-%m') <= ?
                      ORDER BY periodo DESC
                      LIMIT 1))
        ) as ecd_b";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $proyecto_id, $fecha_filtro,  // plazo_control
        $proyecto_id,                 // BAC primera vez
        $proyecto_id,                 // BAC segunda vez
        $proyecto_id, $fecha_filtro,  // avance_fisico
        $proyecto_id,                 // PV1m primera vez
        $proyecto_id, $fecha_filtro   // PV1m segunda vez
    ]);

    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $ecd_b = $result ? round($result['ecd_b']) : 0;

    echo json_encode([
        'success' => true,
        'ecd_b' => $ecd_b,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>


