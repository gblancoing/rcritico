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

    // Consulta SQL simplificada para calcular ECD(g) con EV3m
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
            GROUP BY DATE_FORMAT(periodo, '%Y-%m'), proyecto_id, api_parcial
            ORDER BY DATE_FORMAT(periodo, '%Y-%m') DESC
            LIMIT 3
        ) AS ultimos_3_meses
    ) AS ev3m";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    
    try {
        $stmt->execute([
            $proyecto_id, $fecha_filtro,  // plazo_control
            $proyecto_id,                 // bac_total
            $proyecto_id, $fecha_filtro,  // avance_fisico
            $proyecto_id, $fecha_filtro   // ev3m (promedio últimos 3 meses únicos)
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Debug detallado
        error_log("🔍 ECD(g) Debug - Proyecto: $proyecto_id, Fecha: $fecha_filtro");
        error_log("🔍 ECD(g) Resultado SQL completo: " . json_encode($result));
        
        if ($result) {
            $plazo_control = $result['plazo_control'] ?? 0;
            $bac_total = $result['bac_total'] ?? 0;
            $avance_fisico = $result['avance_fisico'] ?? 0;
            $ev3m = $result['ev3m'] ?? 0;
            
            error_log("🔍 ECD(g) Plazo Control: $plazo_control");
            error_log("🔍 ECD(g) BAC Total: $bac_total");
            error_log("🔍 ECD(g) Avance Físico: $avance_fisico");
            error_log("🔍 ECD(g) EV3m: $ev3m");
            
            // Calcular ECD(g) manualmente usando la misma fórmula que ECD(f)
            if ($ev3m > 0 && $bac_total > 0) {
                $por_ganar = $bac_total - ($bac_total * $avance_fisico);
                $denominador = $bac_total * $ev3m; // BAC × EV3m (como en ECD(f))
                
                // Validar que el denominador no sea 0
                if ($denominador > 0) {
                    $ecd_g_calculado = $por_ganar / $denominador;
                    $valor_final = $plazo_control + $ecd_g_calculado;
                    $ecd_g = round($valor_final);
                    
                    error_log("🔍 ECD(g) Por Ganar: $por_ganar");
                    error_log("🔍 ECD(g) Denominador (BAC × EV3m): $denominador");
                    error_log("🔍 ECD(g) ECD Calculado (Por Ganar / Denominador): $ecd_g_calculado");
                    error_log("🔍 ECD(g) Valor final (plazo + calculado): $valor_final");
                    error_log("🔍 ECD(g) Valor redondeado: $ecd_g");
                } else {
                    $ecd_g = 0;
                    error_log("❌ ECD(g) Denominador es 0, no se puede calcular");
                }
            } else {
                $ecd_g = 0;
                error_log("❌ ECD(g) EV3m o BAC es 0, no se puede calcular - EV3m: $ev3m, BAC: $bac_total");
            }
        } else {
            $ecd_g = 0;
            error_log("❌ ECD(g) No se obtuvo resultado de la consulta");
        }
        
    } catch (PDOException $e) {
        error_log("❌ Error ejecutando consulta ECD(g): " . $e->getMessage());
        $ecd_g = 0;
        $result = null;
    }

    // Validar que el resultado sea válido antes de enviar
    $response_data = [
        'success' => true,
        'ecd_g' => $ecd_g,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'debug' => [
            'resultado_sql' => $result,
            'plazo_control' => $result['plazo_control'] ?? 'NULL',
            'bac_total' => $result['bac_total'] ?? 'NULL',
            'avance_fisico' => $result['avance_fisico'] ?? 'NULL',
            'ev3m' => $result['ev3m'] ?? 'NULL',
            'por_ganar' => isset($result['bac_total']) && isset($result['avance_fisico']) ? ($result['bac_total'] - ($result['bac_total'] * $result['avance_fisico'])) : 'NULL',
            'ecd_calculado' => isset($result['bac_total']) && isset($result['avance_fisico']) && isset($result['ev3m']) && $result['ev3m'] > 0 ? (($result['bac_total'] - ($result['bac_total'] * $result['avance_fisico'])) / ($result['bac_total'] * $result['ev3m'])) : 'NULL',
            'valor_final' => $ecd_g,
            'is_valid' => !is_null($ecd_g) && $ecd_g > 0 && is_finite($ecd_g)
        ]
    ];

    // Si el valor no es válido, marcar como error pero mantener la estructura
    if ($ecd_g <= 0 || !is_finite($ecd_g)) {
        $response_data['success'] = false;
        $response_data['message'] = 'ECD(g) no se pudo calcular correctamente';
        $response_data['ecd_g'] = 0;
    }

    echo json_encode($response_data);

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
