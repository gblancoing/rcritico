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

    // Consulta SQL para calcular ECD(c) con PV3m (completamente dinámica)
    $sql = "SELECT
        (SELECT COUNT(DISTINCT DATE_FORMAT(periodo, '%Y-%m')) 
         FROM av_fisico_api 
         WHERE proyecto_id = ?
           AND DATE_FORMAT(periodo, '%Y-%m') <= ?) 
        + 
        (
            (
                (SELECT COALESCE(SUM(monto), 0) 
                 FROM api_parcial 
                 WHERE proyecto_id = ?)
                - 
                ((SELECT COALESCE(SUM(monto), 0) 
                  FROM api_parcial 
                  WHERE proyecto_id = ?) 
                 * 
                 (SELECT COALESCE(api_acum, 0)
                  FROM av_fisico_real
                  WHERE proyecto_id = ? 
                    AND periodo <= ?
                  ORDER BY periodo DESC
                  LIMIT 1))
            )
            / 
            (
                SELECT COALESCE(AVG(monto_total), 0)
                FROM (
                    SELECT DATE_FORMAT(periodo, '%Y-%m') as mes, SUM(monto) as monto_total
                    FROM api_parcial
                    WHERE proyecto_id = ?
                      AND DATE_FORMAT(periodo, '%Y-%m') <= ?
                    GROUP BY mes
                    ORDER BY mes DESC
                    LIMIT 3
                ) AS ultimos_tres
            )
        ) AS ecd_c";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $proyecto_id, $fecha_filtro,  // plazo_control
        $proyecto_id,                 // BAC primera vez
        $proyecto_id,                 // BAC segunda vez
        $proyecto_id, $fecha_filtro,  // avance_fisico (periodo <= ?)
        $proyecto_id, $fecha_filtro   // PV3m
    ]);

    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $ecd_c = $result ? round($result['ecd_c']) : 0;

    // Debug: Log del resultado
    error_log("🔍 ECD(c) Debug - Proyecto: $proyecto_id, Fecha: $fecha_filtro");
    error_log("🔍 ECD(c) Resultado SQL: " . json_encode($result));
    error_log("🔍 ECD(c) Valor calculado: $ecd_c");

    echo json_encode([
        'success' => true,
        'ecd_c' => $ecd_c,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => $result // Para debug
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
