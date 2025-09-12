<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);

// Parámetros requeridos
$proyecto_id = $data['proyecto_id'] ?? null;
$periodo_hasta = $data['periodo_hasta'] ?? null;

if (!$proyecto_id || !$periodo_hasta) {
    echo json_encode(['success' => false, 'error' => 'proyecto_id y periodo_hasta son requeridos']);
    exit;
}

try {
    // Calcular el período anterior (mes anterior) - LÓGICA EXACTA
    $fechaHasta = new DateTime($periodo_hasta . '-01');
    $fechaAnterior = clone $fechaHasta;
    $fechaAnterior->modify('-1 month');
    
    // Obtener el último día del mes anterior
    $ultimoDiaMesAnterior = $fechaAnterior->format('Y-m-t');
    $periodoAnterior = $ultimoDiaMesAnterior;
    
    // Log para debug
    error_log("TEST - proyecto_id: $proyecto_id, periodo_hasta: $periodo_hasta, periodo_anterior: $periodoAnterior");
    
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
    error_log("TEST - SQL ejecutado: $sql con parámetros: [$proyecto_id, $periodoAnterior]");
    error_log("TEST - Resultado encontrado: " . ($resultado ? 'SÍ' : 'NO'));
    
    if ($resultado) {
        $proyeccionFisica = floatval($resultado['porcentaje_predicido']);
        $realFisico = floatval($resultado['valor_real_porcentaje']);
        
        error_log("TEST - Datos encontrados: porcentaje_predicido = $proyeccionFisica, valor_real_porcentaje = $realFisico");
        
        echo json_encode([
            'success' => true,
            'data' => [
                'proyeccion_fisica' => $proyeccionFisica,
                'real_fisico' => $realFisico,
                'periodo_prediccion' => $resultado['periodo_prediccion'],
                'periodo_cierre_real' => $resultado['periodo_cierre_real'],
                'periodo_solicitado' => $periodo_hasta,
                'periodo_anterior_usado' => $periodoAnterior,
                'debug_info' => [
                    'proyecto_id_recibido' => $proyecto_id,
                    'periodo_hasta_recibido' => $periodo_hasta,
                    'periodo_anterior_calculado' => $periodoAnterior,
                    'fecha_hasta' => $fechaHasta->format('Y-m-d'),
                    'fecha_anterior' => $fechaAnterior->format('Y-m-d'),
                    'ultimo_dia_mes_anterior' => $ultimoDiaMesAnterior
                ]
            ],
            'message' => 'Datos de proyección física obtenidos correctamente'
        ]);
    } else {
        error_log("TEST - No se encontraron datos para proyecto_id: $proyecto_id y periodo_prediccion: $periodoAnterior");
        
        // Verificar qué períodos existen para este proyecto
        $sqlPeriodos = "SELECT DISTINCT periodo_prediccion FROM predictividad WHERE proyecto_id = ? ORDER BY periodo_prediccion";
        $stmtPeriodos = $pdo->prepare($sqlPeriodos);
        $stmtPeriodos->execute([$proyecto_id]);
        $periodos = $stmtPeriodos->fetchAll(PDO::FETCH_COLUMN);
        
        echo json_encode([
            'success' => false,
            'error' => 'No se encontraron datos para el período anterior especificado',
            'debug_info' => [
                'proyecto_id' => $proyecto_id,
                'periodo_hasta' => $periodo_hasta,
                'periodo_anterior_calculado' => $periodoAnterior,
                'periodos_disponibles' => $periodos,
                'total_periodos' => count($periodos)
            ]
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener proyección física: ' . $e->getMessage()
    ]);
}
?>
