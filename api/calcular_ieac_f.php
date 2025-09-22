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

    // Consulta SQL completa para calcular IEAC(f) con CPI × SPI
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
        
        -- 4. Calcular CPI actual
        (
            SELECT COALESCE(SUM(monto), 0) 
            FROM real_parcial 
            WHERE proyecto_id = ? 
              AND DATE_FORMAT(periodo, '%Y-%m') <= ?
        ) AS ac_para_cpi,
        
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
            $proyecto_id, $fecha_filtro,  // AC para CPI
            $proyecto_id, $fecha_filtro   // PV para SPI
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Debug detallado
        error_log("🔍 IEAC(f) Debug - Proyecto: $proyecto_id, Fecha: $fecha_filtro");
        error_log("🔍 IEAC(f) Resultado SQL completo: " . json_encode($result));
        
        if ($result) {
            $bac = floatval($result['bac']);
            $ac = floatval($result['ac']);
            $ev = floatval($result['ev']);
            $ac_para_cpi = floatval($result['ac_para_cpi']);
            $pv_para_spi = floatval($result['pv_para_spi']);
            
            // Calcular CPI = EV / AC
            $cpi = ($ac_para_cpi > 0) ? ($ev / $ac_para_cpi) : 1.0;
            
            // Calcular SPI = EV / PV
            $spi = ($pv_para_spi > 0) ? ($ev / $pv_para_spi) : 1.0;
            
            // Calcular "Por Ganar" = BAC - EV
            $por_ganar = $bac - $ev;
            
            // Calcular IEAC(f) = Real + Por Ganar / (CPI × SPI)
            $ieac_f = $ac + ($por_ganar / ($cpi * $spi));
            
            error_log("🔍 IEAC(f) Valores calculados:");
            error_log("  - BAC: $bac");
            error_log("  - AC: $ac");
            error_log("  - EV: $ev");
            error_log("  - CPI: $cpi");
            error_log("  - SPI: $spi");
            error_log("  - Por Ganar: $por_ganar");
            error_log("  - IEAC(f): $ieac_f");
            
            $ieac_f_redondeado = round($ieac_f);
            
        } else {
            $ieac_f_redondeado = 0;
            error_log("❌ IEAC(f) No se obtuvo resultado de la consulta");
        }
        
    } catch (PDOException $e) {
        error_log("❌ Error ejecutando consulta IEAC(f): " . $e->getMessage());
        $ieac_f_redondeado = 0;
        $result = null;
    }

    echo json_encode([
        'success' => true,
        'ieac_f' => $ieac_f_redondeado,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => [
            'resultado_sql' => $result,
            'bac' => $result['bac'] ?? 'NULL',
            'ac' => $result['ac'] ?? 'NULL',
            'ev' => $result['ev'] ?? 'NULL',
            'cpi' => isset($result['ac_para_cpi']) && isset($result['ev']) ? 
                (floatval($result['ev']) / floatval($result['ac_para_cpi'])) : 'NULL',
            'spi' => isset($result['pv_para_spi']) && isset($result['ev']) ? 
                (floatval($result['ev']) / floatval($result['pv_para_spi'])) : 'NULL',
            'por_ganar' => isset($result['bac']) && isset($result['ev']) ? 
                (floatval($result['bac']) - floatval($result['ev'])) : 'NULL',
            'ieac_f_calculado' => isset($result['ac']) && isset($result['ac_para_cpi']) && isset($result['pv_para_spi']) && isset($result['bac']) && isset($result['ev']) ? 
                (floatval($result['ac']) + ((floatval($result['bac']) - floatval($result['ev'])) / ((floatval($result['ev']) / floatval($result['ac_para_cpi'])) * (floatval($result['ev']) / floatval($result['pv_para_spi']))))) : 'NULL',
            'valor_redondeado' => $ieac_f_redondeado
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
