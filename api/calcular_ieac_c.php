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

    // Consulta SQL para calcular IEAC(c) = Real + Por Ganar / CPI
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
        ) AS ev";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    
    try {
        $stmt->execute([
            $proyecto_id,                 // BAC primera vez
            $proyecto_id, $fecha_filtro,  // AC
            $proyecto_id,                 // BAC segunda vez (para EV)
            $proyecto_id, $fecha_filtro   // Avance físico real
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Debug detallado
        error_log("🔍 IEAC(c) Debug - Proyecto: $proyecto_id, Fecha: $fecha_filtro");
        error_log("🔍 IEAC(c) Resultado SQL completo: " . json_encode($result));
        
        if ($result) {
            $bac = floatval($result['bac']);
            $ac = floatval($result['ac']);
            $ev = floatval($result['ev']);
            
            // Calcular CPI = EV / AC
            $cpi = ($ac > 0) ? ($ev / $ac) : 1.0;
            
            // Calcular "Por Ganar" = BAC - EV
            $por_ganar = $bac - $ev;
            
            // Calcular IEAC(c) = Real + Por Ganar / CPI
            $ieac_c = $ac + ($por_ganar / $cpi);
            
            error_log("🔍 IEAC(c) Valores calculados:");
            error_log("  - BAC: $bac");
            error_log("  - AC: $ac");
            error_log("  - EV: $ev");
            error_log("  - CPI: $cpi");
            error_log("  - Por Ganar: $por_ganar");
            error_log("  - IEAC(c): $ieac_c");
            
            $ieac_c_redondeado = round($ieac_c);
            
        } else {
            $ieac_c_redondeado = 0;
            error_log("❌ IEAC(c) No se obtuvo resultado de la consulta");
        }
        
    } catch (PDOException $e) {
        error_log("❌ Error ejecutando consulta IEAC(c): " . $e->getMessage());
        $ieac_c_redondeado = 0;
        $result = null;
    }

    echo json_encode([
        'success' => true,
        'ieac_c' => $ieac_c_redondeado,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => [
            'resultado_sql' => $result,
            'bac' => $result['bac'] ?? 'NULL',
            'ac' => $result['ac'] ?? 'NULL',
            'ev' => $result['ev'] ?? 'NULL',
            'cpi' => isset($result['ac']) && isset($result['ev']) ? 
                (floatval($result['ev']) / floatval($result['ac'])) : 'NULL',
            'por_ganar' => isset($result['bac']) && isset($result['ev']) ? 
                (floatval($result['bac']) - floatval($result['ev'])) : 'NULL',
            'ieac_c_calculado' => isset($result['ac']) && isset($result['bac']) && isset($result['ev']) ? 
                (floatval($result['ac']) + ((floatval($result['bac']) - floatval($result['ev'])) / (floatval($result['ev']) / floatval($result['ac'])))) : 'NULL',
            'valor_redondeado' => $ieac_c_redondeado
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


