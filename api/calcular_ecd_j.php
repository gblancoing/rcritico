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

    // Consulta SQL completa para calcular ECD(j) con AC3m
    $sql = "SELECT
    (
        SELECT COUNT(DISTINCT DATE_FORMAT(periodo, '%Y-%m')) 
        FROM av_fisico_api 
        WHERE proyecto_id = ?
          AND DATE_FORMAT(periodo, '%Y-%m') <= ?
    ) 
    + 
    (
        (
            (
                SELECT COALESCE(SUM(monto), 0) 
                FROM api_parcial 
                WHERE proyecto_id = ?
            )
            - 
            (
                (
                    SELECT COALESCE(SUM(monto), 0) 
                    FROM api_parcial 
                    WHERE proyecto_id = ?
                ) 
                * 
                (
                    SELECT COALESCE(api_acum, 0)
                    FROM (
                        SELECT api_acum
                        FROM av_fisico_real
                        WHERE proyecto_id = ?
                          AND DATE_FORMAT(periodo, '%Y-%m') <= ?
                        ORDER BY periodo DESC
                        LIMIT 1
                    ) AS ultima_api
                )
            )
        )
        / 
        (
            SELECT COALESCE(AVG(monto_mensual), 0)
            FROM (
                SELECT SUM(monto) AS monto_mensual
                FROM real_parcial 
                WHERE proyecto_id = ?
                  AND DATE_FORMAT(periodo, '%Y-%m') <= ?
                GROUP BY DATE_FORMAT(periodo, '%Y-%m')
                ORDER BY DATE_FORMAT(periodo, '%Y-%m') DESC
                LIMIT 3
            ) AS ultimos_3_meses
        )
    ) AS ecd_j";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    
    try {
        $stmt->execute([
            $proyecto_id, $fecha_filtro,  // plazo_control
            $proyecto_id,                 // BAC primera vez
            $proyecto_id,                 // BAC segunda vez
            $proyecto_id, $fecha_filtro,  // avance_fisico
            $proyecto_id, $fecha_filtro   // ac3m (promedio últimos 3 meses únicos de costo real)
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Debug detallado
        error_log("🔍 ECD(j) Debug - Proyecto: $proyecto_id, Fecha: $fecha_filtro");
        error_log("🔍 ECD(j) Resultado SQL completo: " . json_encode($result));
        
        if ($result) {
            $ecd_j = $result['ecd_j'] ? round($result['ecd_j']) : 0;
            
            error_log("🔍 ECD(j) Valor calculado por SQL: " . $result['ecd_j']);
            error_log("🔍 ECD(j) Valor redondeado: $ecd_j");
        } else {
            $ecd_j = 0;
            error_log("❌ ECD(j) No se obtuvo resultado de la consulta");
        }
        
    } catch (PDOException $e) {
        error_log("❌ Error ejecutando consulta ECD(j): " . $e->getMessage());
        $ecd_j = 0;
        $result = null;
    }

    echo json_encode([
        'success' => true,
        'ecd_j' => $ecd_j,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => [
            'resultado_sql' => $result,
            'valor_original' => $result['ecd_j'] ?? 'NULL',
            'valor_redondeado' => $ecd_j
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
