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

    // Consulta SQL completa para calcular IEAC(g) con CPI3m × SPI
    $sql = "SELECT
        -- 1. Obtener BAC (Budget at Completion)
        (
            SELECT COALESCE(SUM(monto), 0) 
            FROM api_parcial 
            WHERE proyecto_id = ?
        ) AS bac,
        
        -- 2. Obtener AC (Actual Cost) - Costo real acumulado hasta fecha filtro
        (
            SELECT COALESCE(SUM(monto), 0) 
            FROM real_parcial 
            WHERE proyecto_id = ? 
              AND DATE_FORMAT(periodo, '%Y-%m') <= ?
        ) AS ac,
        
        -- 3. Obtener EV (Earned Value) - BAC * % Avance Físico Real
        (
            SELECT COALESCE(SUM(monto), 0) 
            FROM api_parcial 
            WHERE proyecto_id = ?
        ) * 
        (
            SELECT COALESCE(api_acum, 0)
            FROM av_fisico_real
            WHERE proyecto_id = ?
              AND DATE_FORMAT(periodo, '%Y-%m') <= ?
            ORDER BY periodo DESC
            LIMIT 1
        ) AS ev,
        
        -- 4. Calcular CPI(3m) - Promedio de CPI de los últimos 3 meses
        (
            SELECT COALESCE(AVG(cpi_mensual), 1.0)
            FROM (
                SELECT 
                    mes,
                    CASE 
                        WHEN ac_acumulado > 0 THEN 
                            (bac_total * avance_fisico) / ac_acumulado
                        ELSE 1.0
                    END as cpi_mensual
                FROM (
                    SELECT 
                        DATE_FORMAT(rp.periodo, '%Y-%m') as mes,
                        (SELECT COALESCE(SUM(monto), 0) 
                         FROM real_parcial rp2 
                         WHERE rp2.proyecto_id = rp.proyecto_id 
                           AND DATE_FORMAT(rp2.periodo, '%Y-%m') <= DATE_FORMAT(rp.periodo, '%Y-%m')
                        ) as ac_acumulado,
                        (SELECT COALESCE(SUM(monto), 0) FROM api_parcial WHERE proyecto_id = ?) as bac_total,
                        COALESCE(MAX(afr.api_acum), 0) as avance_fisico
                    FROM real_parcial rp
                    LEFT JOIN av_fisico_real afr ON rp.proyecto_id = afr.proyecto_id 
                        AND DATE_FORMAT(rp.periodo, '%Y-%m') = DATE_FORMAT(afr.periodo, '%Y-%m')
                    WHERE rp.proyecto_id = ?
                      AND DATE_FORMAT(rp.periodo, '%Y-%m') <= ?
                    GROUP BY DATE_FORMAT(rp.periodo, '%Y-%m')
                    ORDER BY DATE_FORMAT(rp.periodo, '%Y-%m') DESC
                    LIMIT 3
                ) AS meses_con_datos
            ) AS cpi_ultimos_3_meses
        ) AS cpi_3m,
        
        -- 5. Calcular SPI actual
        (
            SELECT COALESCE(SUM(monto), 0) 
            FROM api_parcial 
            WHERE proyecto_id = ? 
              AND DATE_FORMAT(periodo, '%Y-%m') <= ?
        ) AS pv_para_spi";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    
    try {
        $stmt->execute([
            $proyecto_id,                 // BAC primera vez
            $proyecto_id, $fecha_filtro,  // AC
            $proyecto_id,                 // BAC segunda vez (para EV)
            $proyecto_id, $fecha_filtro,  // Avance físico real
            $proyecto_id,                 // BAC tercera vez (para CPI mensual)
            $proyecto_id, $fecha_filtro,  // CPI(3m) filtro
            $proyecto_id, $fecha_filtro   // PV para SPI
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Debug detallado
        error_log("🔍 IEAC(g) Debug - Proyecto: $proyecto_id, Fecha: $fecha_filtro");
        error_log("🔍 IEAC(g) Resultado SQL completo: " . json_encode($result));
        
        if ($result) {
            $bac = floatval($result['bac']);
            $ac = floatval($result['ac']);
            $ev = floatval($result['ev']);
            $cpi_3m = floatval($result['cpi_3m']);
            $pv_para_spi = floatval($result['pv_para_spi']);
            
            // Calcular SPI = EV / PV
            $spi = ($pv_para_spi > 0) ? ($ev / $pv_para_spi) : 1.0;
            
            // Calcular "Por Ganar" = BAC - EV
            $por_ganar = $bac - $ev;
            
            // Calcular IEAC(g) = Real + Por Ganar / (CPI3m × SPI)
            $ieac_g = $ac + ($por_ganar / ($cpi_3m * $spi));
            
            error_log("🔍 IEAC(g) Valores calculados:");
            error_log("  - BAC: $bac");
            error_log("  - AC: $ac");
            error_log("  - EV: $ev");
            error_log("  - CPI(3m): $cpi_3m");
            error_log("  - SPI: $spi");
            error_log("  - Por Ganar: $por_ganar");
            error_log("  - IEAC(g): $ieac_g");
            
            $ieac_g_redondeado = round($ieac_g);
            
        } else {
            $ieac_g_redondeado = 0;
            error_log("❌ IEAC(g) No se obtuvo resultado de la consulta");
        }
        
    } catch (PDOException $e) {
        error_log("❌ Error ejecutando consulta IEAC(g): " . $e->getMessage());
        $ieac_g_redondeado = 0;
        $result = null;
    }

    echo json_encode([
        'success' => true,
        'ieac_g' => $ieac_g_redondeado,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => [
            'resultado_sql' => $result,
            'bac' => $result['bac'] ?? 'NULL',
            'ac' => $result['ac'] ?? 'NULL',
            'ev' => $result['ev'] ?? 'NULL',
            'cpi_3m' => $result['cpi_3m'] ?? 'NULL',
            'spi' => isset($result['pv_para_spi']) && isset($result['ev']) ? 
                (floatval($result['ev']) / floatval($result['pv_para_spi'])) : 'NULL',
            'por_ganar' => isset($result['bac']) && isset($result['ev']) ? 
                (floatval($result['bac']) - floatval($result['ev'])) : 'NULL',
            'ieac_g_calculado' => isset($result['ac']) && isset($result['cpi_3m']) && isset($result['pv_para_spi']) && isset($result['bac']) && isset($result['ev']) ? 
                (floatval($result['ac']) + ((floatval($result['bac']) - floatval($result['ev'])) / (floatval($result['cpi_3m']) * (floatval($result['ev']) / floatval($result['pv_para_spi']))))) : 'NULL',
            'valor_redondeado' => $ieac_g_redondeado
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
