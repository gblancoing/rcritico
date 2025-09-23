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

    // Consulta SQL para calcular IEAC(b) = BAC / CPI
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
        error_log("🔍 IEAC(b) Debug - Proyecto: $proyecto_id, Fecha: $fecha_filtro");
        error_log("🔍 IEAC(b) Resultado SQL completo: " . json_encode($result));
        
        if ($result) {
            $bac = floatval($result['bac']);
            $ac = floatval($result['ac']);
            $ev = floatval($result['ev']);
            
            // Calcular CPI = EV / AC
            $cpi = ($ac > 0) ? ($ev / $ac) : 1.0;
            
            // Calcular IEAC(b) = BAC / CPI
            $ieac_b = ($cpi > 0) ? ($bac / $cpi) : $bac;
            
            error_log("🔍 IEAC(b) Valores calculados:");
            error_log("  - BAC: $bac");
            error_log("  - AC: $ac");
            error_log("  - EV: $ev");
            error_log("  - CPI: $cpi");
            error_log("  - IEAC(b): $ieac_b");
            
            $ieac_b_redondeado = round($ieac_b);
            
        } else {
            $ieac_b_redondeado = 0;
            error_log("❌ IEAC(b) No se obtuvo resultado de la consulta");
        }
        
    } catch (PDOException $e) {
        error_log("❌ Error ejecutando consulta IEAC(b): " . $e->getMessage());
        $ieac_b_redondeado = 0;
        $result = null;
    }

    echo json_encode([
        'success' => true,
        'ieac_b' => $ieac_b_redondeado,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => [
            'resultado_sql' => $result,
            'bac' => $result['bac'] ?? 'NULL',
            'ac' => $result['ac'] ?? 'NULL',
            'ev' => $result['ev'] ?? 'NULL',
            'cpi' => isset($result['ac']) && isset($result['ev']) ? 
                (floatval($result['ev']) / floatval($result['ac'])) : 'NULL',
            'ieac_b_calculado' => isset($result['bac']) && isset($result['ac']) && isset($result['ev']) ? 
                (floatval($result['bac']) / (floatval($result['ev']) / floatval($result['ac']))) : 'NULL',
            'valor_redondeado' => $ieac_b_redondeado
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


