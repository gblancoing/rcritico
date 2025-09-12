<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);

// Parámetros requeridos
$proyecto_id = $data['proyecto_id'] ?? null;
$periodo_hasta = $data['periodo_hasta'] ?? null; // Formato: YYYY-MM

if (!$proyecto_id || !$periodo_hasta) {
    echo json_encode(['success' => false, 'error' => 'proyecto_id y periodo_hasta son requeridos']);
    exit;
}

try {
    // Calcular el período anterior (mes anterior)
    // Convertir YYYY-MM a YYYY-MM-01 para crear fecha válida
    $fechaHasta = new DateTime($periodo_hasta . '-01');
    $fechaAnterior = clone $fechaHasta;
    $fechaAnterior->modify('-1 month');
    
    // Obtener el último día del mes anterior
    $ultimoDiaMesAnterior = $fechaAnterior->format('Y-m-t'); // 't' da el último día del mes
    $periodoAnterior = $ultimoDiaMesAnterior;
    
    // Log para debug
    error_log("DEBUG - proyecto_id: $proyecto_id, periodo_hasta: $periodo_hasta, periodo_anterior: $periodoAnterior");
    error_log("DEBUG - fechaHasta: " . $fechaHasta->format('Y-m-d'));
    error_log("DEBUG - fechaAnterior: " . $fechaAnterior->format('Y-m-d'));
    error_log("DEBUG - ultimoDiaMesAnterior: " . $ultimoDiaMesAnterior);

    // Consultar la tabla predictividad para obtener el porcentaje_predicido del mes anterior
    $sql = "SELECT 
                porcentaje_predicido,
                valor_real_porcentaje,
                periodo_prediccion,
                periodo_cierre_real
            FROM predictividad 
            WHERE proyecto_id = ? 
            AND periodo_prediccion = ?
            ORDER BY id_predictivo DESC
            LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$proyecto_id, $periodoAnterior]);
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Log para debug
    error_log("DEBUG - SQL ejecutado: $sql con parámetros: [$proyecto_id, $periodoAnterior]");
    error_log("DEBUG - Resultado encontrado: " . ($resultado ? 'SÍ' : 'NO'));
    if ($resultado) {
        error_log("DEBUG - Datos encontrados: " . json_encode($resultado));
        error_log("DEBUG - porcentaje_predicido: " . $resultado['porcentaje_predicido']);
    } else {
        error_log("DEBUG - No se encontraron datos para proyecto_id: $proyecto_id y periodo_prediccion: $periodoAnterior");
        
        // Verificar si existen datos para este proyecto
        $sqlCheck = "SELECT COUNT(*) as total FROM predictividad WHERE proyecto_id = ?";
        $stmtCheck = $pdo->prepare($sqlCheck);
        $stmtCheck->execute([$proyecto_id]);
        $checkResult = $stmtCheck->fetch(PDO::FETCH_ASSOC);
        error_log("DEBUG - Total registros para proyecto $proyecto_id: " . $checkResult['total']);
        
        // Verificar qué períodos existen para este proyecto
        $sqlPeriodos = "SELECT DISTINCT periodo_prediccion FROM predictividad WHERE proyecto_id = ? ORDER BY periodo_prediccion";
        $stmtPeriodos = $pdo->prepare($sqlPeriodos);
        $stmtPeriodos->execute([$proyecto_id]);
        $periodos = $stmtPeriodos->fetchAll(PDO::FETCH_COLUMN);
        error_log("DEBUG - Períodos disponibles: " . implode(', ', $periodos));
    }

    if ($resultado) {
        $proyeccionFisica = floatval($resultado['porcentaje_predicido']);
        $realFisico = floatval($resultado['valor_real_porcentaje']);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'proyeccion_fisica' => $proyeccionFisica,
                'real_fisico' => $realFisico,
                'periodo_prediccion' => $resultado['periodo_prediccion'],
                'periodo_cierre_real' => $resultado['periodo_cierre_real'],
                'periodo_solicitado' => $periodo_hasta,
                'periodo_anterior_usado' => $periodoAnterior
            ],
            'message' => 'Datos de proyección física obtenidos correctamente'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => [
                'proyeccion_fisica' => 0,
                'real_fisico' => 0,
                'periodo_prediccion' => null,
                'periodo_cierre_real' => null,
                'periodo_solicitado' => $periodo_hasta,
                'periodo_anterior_usado' => $periodoAnterior
            ],
            'message' => 'No se encontraron datos para el período anterior especificado'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener proyección física: ' . $e->getMessage()
    ]);
}
?>