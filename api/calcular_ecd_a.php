<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitudes OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

try {
    // Obtener parámetros
    $proyecto_id = $_GET['proyecto_id'] ?? null;
    $fecha_filtro = $_GET['fecha_filtro'] ?? null;
    
    if (!$proyecto_id) {
        throw new Exception('proyecto_id es requerido');
    }
    
    if (!$fecha_filtro) {
        throw new Exception('fecha_filtro es requerido');
    }
    
    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha_filtro)) {
        throw new Exception('fecha_filtro debe tener formato YYYY-MM-DD');
    }
    
    // PASO 1: Obtener Duración Planificada desde av_fisico_api
    $duracion_planificada = 0;
    try {
        $sql_duracion = "
            SELECT COUNT(DISTINCT SUBSTRING(periodo, 1, 7)) as total_periodos
            FROM av_fisico_api 
            WHERE proyecto_id = ? 
            AND periodo IS NOT NULL 
            AND periodo != ''
        ";
        
        $stmt_duracion = $pdo->prepare($sql_duracion);
        $stmt_duracion->execute([$proyecto_id]);
        $result_duracion = $stmt_duracion->fetch(PDO::FETCH_ASSOC);
        $duracion_planificada = intval($result_duracion['total_periodos']);
        
        error_log("🔍 Duración Planificada calculada: {$duracion_planificada} meses");
        
    } catch (Exception $e) {
        error_log("❌ Error obteniendo duración planificada: " . $e->getMessage());
        throw new Exception("Error obteniendo duración planificada: " . $e->getMessage());
    }
    
    // PASO 2: Obtener datos para calcular SPI (EV y PV)
    
    // Obtener PV (Planned Value) desde api_parcial
    $pv = 0;
    try {
        $sql_pv = "
            SELECT COALESCE(SUM(monto), 0) as total_pv
            FROM api_parcial 
            WHERE proyecto_id = ? 
            AND DATE_FORMAT(periodo, '%Y-%m') <= DATE_FORMAT(?, '%Y-%m')
        ";
        
        $stmt_pv = $pdo->prepare($sql_pv);
        $stmt_pv->execute([$proyecto_id, $fecha_filtro]);
        $result_pv = $stmt_pv->fetch(PDO::FETCH_ASSOC);
        $pv = floatval($result_pv['total_pv']);
        
        error_log("📊 PV calculado: {$pv}");
        
    } catch (Exception $e) {
        error_log("❌ Error obteniendo PV: " . $e->getMessage());
        throw new Exception("Error obteniendo PV: " . $e->getMessage());
    }
    
    // Obtener BAC (Budget at Completion) desde api_parcial
    $bac = 0;
    try {
        $sql_bac = "
            SELECT COALESCE(SUM(monto), 0) as total_bac
            FROM api_parcial 
            WHERE proyecto_id = ?
        ";
        
        $stmt_bac = $pdo->prepare($sql_bac);
        $stmt_bac->execute([$proyecto_id]);
        $result_bac = $stmt_bac->fetch(PDO::FETCH_ASSOC);
        $bac = floatval($result_bac['total_bac']);
        
        error_log("📊 BAC calculado: {$bac}");
        
    } catch (Exception $e) {
        error_log("❌ Error obteniendo BAC: " . $e->getMessage());
        throw new Exception("Error obteniendo BAC: " . $e->getMessage());
    }
    
    // Obtener EV (Earned Value) desde avance físico
    $ev = 0;
    $porcentaje_avance_fisico = 0;
    
    try {
        // Intentar obtener avance físico desde av_fisico_real
        $sql_avance = "
            SELECT 
                COALESCE(api_acum, 0) as api_acum
            FROM av_fisico_real 
            WHERE proyecto_id = ? 
            AND DATE_FORMAT(periodo, '%Y-%m') <= DATE_FORMAT(?, '%Y-%m')
            AND api_acum IS NOT NULL
            ORDER BY periodo DESC
            LIMIT 1
        ";
        
        $stmt_avance = $pdo->prepare($sql_avance);
        $stmt_avance->execute([$proyecto_id, $fecha_filtro]);
        $result_avance = $stmt_avance->fetch(PDO::FETCH_ASSOC);
        $porcentaje_avance_fisico = floatval($result_avance['api_acum']); // api_acum ya está en decimal (0.75 = 75%)
        
        if ($porcentaje_avance_fisico > 0) {
            $ev = $bac * $porcentaje_avance_fisico;
            error_log("✅ EV calculado desde av_fisico_real: {$ev} (porcentaje: " . ($porcentaje_avance_fisico * 100) . "%)");
        } else {
            // Fallback: usar NPC como proxy
            $sql_npc = "
                SELECT COALESCE(SUM(monto), 0) as total_npc
                FROM npc_parcial 
                WHERE proyecto_id = ? 
                AND DATE_FORMAT(periodo, '%Y-%m') <= DATE_FORMAT(?, '%Y-%m')
            ";
            
            $stmt_npc = $pdo->prepare($sql_npc);
            $stmt_npc->execute([$proyecto_id, $fecha_filtro]);
            $result_npc = $stmt_npc->fetch(PDO::FETCH_ASSOC);
            $npc = floatval($result_npc['total_npc']);
            
            if ($bac > 0) {
                $porcentaje_avance_fisico = $npc / $bac;
                $ev = $npc;
                error_log("⚠️ Fallback NPC: EV = {$ev} (porcentaje: " . ($porcentaje_avance_fisico * 100) . "%)");
            }
        }
        
    } catch (Exception $e) {
        error_log("❌ Error obteniendo EV: " . $e->getMessage());
        throw new Exception("Error obteniendo EV: " . $e->getMessage());
    }
    
    // PASO 3: Calcular SPI
    $spi = 0;
    if ($pv > 0) {
        $spi = $ev / $pv;
    }
    
    error_log("📊 SPI calculado: {$spi} (EV: {$ev}, PV: {$pv})");
    
    // PASO 4: Calcular ECD(a)
    $ecd_a = 0;
    if ($spi > 0) {
        $ecd_a = $duracion_planificada / $spi;
    }
    
    error_log("🎯 ECD(a) calculado: {$ecd_a} meses (Duración: {$duracion_planificada}, SPI: {$spi})");
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'proyecto_id' => $proyecto_id,
        'fecha_filtro' => $fecha_filtro,
        'duracion_planificada' => $duracion_planificada,
        'spi' => round($spi, 3),
        'ev' => round($ev, 2),
        'pv' => round($pv, 2),
        'bac' => round($bac, 2),
        'porcentaje_avance_fisico' => round($porcentaje_avance_fisico * 100, 2),
        'ecd_a' => round($ecd_a, 1),
        'formula' => "Duración Planificada / SPI",
        'calculo' => "{$duracion_planificada} / {$spi} = {$ecd_a}",
        'descripcion' => 'Proyección del SPI actual a la duración total'
    ]);
    
} catch (Exception $e) {
    error_log("❌ Error en calcular_ecd_a.php: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'proyecto_id' => $proyecto_id ?? null,
        'fecha_filtro' => $fecha_filtro ?? null
    ]);
}
?>
