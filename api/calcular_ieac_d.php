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

    // Consulta SQL completa para calcular IEAC(d) con CPI(3m)
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
                    -- Calcular CPI mensual: EV_mensual / AC_acumulado_hasta_ese_mes
                    CASE 
                        WHEN ac_acumulado > 0 THEN 
                            (bac_total * avance_fisico) / ac_acumulado
                        ELSE 1.0
                    END as cpi_mensual
                FROM (
                    SELECT 
                        DATE_FORMAT(rp.periodo, '%Y-%m') as mes,
                        -- AC acumulado hasta ese mes
                        (SELECT COALESCE(SUM(monto), 0) 
                         FROM real_parcial rp2 
                         WHERE rp2.proyecto_id = rp.proyecto_id 
                           AND DATE_FORMAT(rp2.periodo, '%Y-%m') <= DATE_FORMAT(rp.periodo, '%Y-%m')
                        ) as ac_acumulado,
                        -- BAC total
                        (SELECT COALESCE(SUM(monto), 0) FROM api_parcial WHERE proyecto_id = ?) as bac_total,
                        -- Avance físico de ese mes
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
        ) AS cpi_3m";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    
    try {
        $stmt->execute([
            $proyecto_id,                 // BAC primera vez
            $proyecto_id, $fecha_filtro,  // AC
            $proyecto_id,                 // BAC segunda vez (para EV)
            $proyecto_id, $fecha_filtro,  // Avance físico real
            $proyecto_id,                 // BAC tercera vez (para CPI mensual)
            $proyecto_id, $fecha_filtro   // CPI(3m) filtro
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Debug detallado
        error_log("🔍 IEAC(d) Debug - Proyecto: $proyecto_id, Fecha: $fecha_filtro");
        error_log("🔍 IEAC(d) Resultado SQL completo: " . json_encode($result));
        
        if ($result) {
            $bac = floatval($result['bac']);
            $ac = floatval($result['ac']);
            $ev = floatval($result['ev']);
            $cpi_3m = floatval($result['cpi_3m']);
            
            // Calcular "Por Ganar" = BAC - EV
            $por_ganar = $bac - $ev;
            
            // Calcular IEAC(d) = Real + Por Ganar / CPI(3m)
            $ieac_d = $ac + ($por_ganar / $cpi_3m);
            
            error_log("🔍 IEAC(d) Valores calculados:");
            error_log("  - BAC: $bac");
            error_log("  - AC: $ac");
            error_log("  - EV: $ev");
            error_log("  - Por Ganar: $por_ganar");
            error_log("  - CPI(3m): $cpi_3m");
            error_log("  - IEAC(d): $ieac_d");
            
            $ieac_d_redondeado = round($ieac_d);
            
        } else {
            $ieac_d_redondeado = 0;
            error_log("❌ IEAC(d) No se obtuvo resultado de la consulta");
        }
        
    } catch (PDOException $e) {
        error_log("❌ Error ejecutando consulta IEAC(d): " . $e->getMessage());
        $ieac_d_redondeado = 0;
        $result = null;
    }

    echo json_encode([
        'success' => true,
        'ieac_d' => $ieac_d_redondeado,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => [
            'resultado_sql' => $result,
            'bac' => $result['bac'] ?? 'NULL',
            'ac' => $result['ac'] ?? 'NULL',
            'ev' => $result['ev'] ?? 'NULL',
            'cpi_3m' => $result['cpi_3m'] ?? 'NULL',
            'por_ganar' => isset($result['bac']) && isset($result['ev']) ? 
                (floatval($result['bac']) - floatval($result['ev'])) : 'NULL',
            'ieac_d_calculado' => isset($result['ac']) && isset($result['cpi_3m']) && isset($result['bac']) && isset($result['ev']) ? 
                (floatval($result['ac']) + ((floatval($result['bac']) - floatval($result['ev'])) / floatval($result['cpi_3m']))) : 'NULL',
            'valor_redondeado' => $ieac_d_redondeado
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
