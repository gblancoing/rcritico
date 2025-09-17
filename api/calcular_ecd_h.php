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

    // Consulta SQL para calcular ECD(h) con EV6m (promedio últimos 6 meses únicos)
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
    ) AS bac_total,
    (
        SELECT COALESCE(api_acum, 0)
        FROM av_fisico_real
        WHERE proyecto_id = ?
          AND DATE_FORMAT(periodo, '%Y-%m') <= ?
        ORDER BY periodo DESC
        LIMIT 1
    ) AS avance_fisico,
    (
        SELECT COALESCE(AVG(api_parcial), 0)
        FROM (
            SELECT api_parcial
            FROM av_fisico_real
            WHERE proyecto_id = ? 
              AND DATE_FORMAT(periodo, '%Y-%m') <= ?
            GROUP BY DATE_FORMAT(periodo, '%Y-%m')
            ORDER BY DATE_FORMAT(periodo, '%Y-%m') DESC
            LIMIT 6
        ) AS ultimos_6_meses
    ) AS ev6m";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    
    try {
        $stmt->execute([
            $proyecto_id, $fecha_filtro,  // plazo_control
            $proyecto_id,                 // bac_total
            $proyecto_id, $fecha_filtro,  // avance_fisico
            $proyecto_id, $fecha_filtro   // ev6m (promedio últimos 6 meses únicos)
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Debug detallado
        error_log("🔍 ECD(h) Debug - Proyecto: $proyecto_id, Fecha: $fecha_filtro");
        error_log("🔍 ECD(h) Resultado SQL completo: " . json_encode($result));
        
        if ($result) {
            $plazo_control = $result['plazo_control'] ?? 0;
            $bac_total = $result['bac_total'] ?? 0;
            $avance_fisico = $result['avance_fisico'] ?? 0;
            $ev6m = $result['ev6m'] ?? 0;
            
            error_log("🔍 ECD(h) Plazo Control: $plazo_control");
            error_log("🔍 ECD(h) BAC Total: $bac_total");
            error_log("🔍 ECD(h) Avance Físico: $avance_fisico");
            error_log("🔍 ECD(h) EV6m: $ev6m");
            
            // Calcular ECD(h) manualmente usando la misma fórmula que ECD(f) y ECD(g)
            if ($ev6m > 0) {
                $por_ganar = $bac_total - ($bac_total * $avance_fisico);
                $denominador = $bac_total * $ev6m; // BAC × EV6m
                $ecd_h_calculado = $por_ganar / $denominador;
                $valor_final = $plazo_control + $ecd_h_calculado;
                $ecd_h = round($valor_final);
                
                error_log("🔍 ECD(h) Por Ganar: $por_ganar");
                error_log("🔍 ECD(h) Denominador (BAC × EV6m): $denominador");
                error_log("🔍 ECD(h) ECD Calculado (Por Ganar / Denominador): $ecd_h_calculado");
                error_log("🔍 ECD(h) Valor final (plazo + calculado): $valor_final");
                error_log("🔍 ECD(h) Valor redondeado: $ecd_h");
            } else {
                $ecd_h = 0;
                error_log("❌ ECD(h) EV6m es 0, no se puede calcular");
            }
        } else {
            $ecd_h = 0;
            error_log("❌ ECD(h) No se obtuvo resultado de la consulta");
        }
        
    } catch (PDOException $e) {
        error_log("❌ Error ejecutando consulta ECD(h): " . $e->getMessage());
        $ecd_h = 0;
        $result = null;
    }

    echo json_encode([
        'success' => true,
        'ecd_h' => $ecd_h,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => [
            'resultado_sql' => $result,
            'plazo_control' => $result['plazo_control'] ?? 'NULL',
            'bac_total' => $result['bac_total'] ?? 'NULL',
            'avance_fisico' => $result['avance_fisico'] ?? 'NULL',
            'ev6m' => $result['ev6m'] ?? 'NULL',
            'por_ganar' => isset($result['bac_total']) && isset($result['avance_fisico']) ? ($result['bac_total'] - ($result['bac_total'] * $result['avance_fisico'])) : 'NULL',
            'ecd_calculado' => isset($result['bac_total']) && isset($result['avance_fisico']) && isset($result['ev6m']) && $result['ev6m'] > 0 ? (($result['bac_total'] - ($result['bac_total'] * $result['avance_fisico'])) / ($result['bac_total'] * $result['ev6m'])) : 'NULL',
            'valor_final' => $ecd_h
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
