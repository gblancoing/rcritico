<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
require_once '../db.php';

try {
    $proyecto_id = $_GET['proyecto_id'] ?? null;
    $periodo_desde = $_GET['periodo_desde'] ?? null;
    $periodo_hasta = $_GET['periodo_hasta'] ?? null;

    if (!$proyecto_id) {
        echo json_encode(['success' => false, 'error' => 'proyecto_id es requerido']);
        exit;
    }

    // Verificar si existen datos para este proyecto
    $sqlCheck = "SELECT COUNT(*) as total FROM av_fisico_real WHERE proyecto_id = ?";
    $stmtCheck = $pdo->prepare($sqlCheck);
    $stmtCheck->execute([$proyecto_id]);
    $checkResult = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    
    // Verificar qué períodos existen para este proyecto
    $sqlPeriodos = "SELECT DISTINCT periodo FROM av_fisico_real WHERE proyecto_id = ? ORDER BY periodo";
    $stmtPeriodos = $pdo->prepare($sqlPeriodos);
    $stmtPeriodos->execute([$proyecto_id]);
    $periodos = $stmtPeriodos->fetchAll(PDO::FETCH_COLUMN);
    
    // Mostrar algunos registros de ejemplo
    $sqlEjemplos = "SELECT id_av_real, proyecto_id, periodo, vector, api_parcial FROM av_fisico_real WHERE proyecto_id = ? ORDER BY periodo DESC LIMIT 5";
    $stmtEjemplos = $pdo->prepare($sqlEjemplos);
    $stmtEjemplos->execute([$proyecto_id]);
    $ejemplos = $stmtEjemplos->fetchAll(PDO::FETCH_ASSOC);

    // Consulta completa con filtros
    $sql = "SELECT id_av_real, proyecto_id, periodo, vector, api_parcial FROM av_fisico_real WHERE proyecto_id = :proyecto_id";
    $params = ['proyecto_id' => $proyecto_id];

    if ($periodo_desde) {
        $sql .= " AND periodo >= :periodo_desde";
        $params['periodo_desde'] = $periodo_desde;
    }

    if ($periodo_hasta) {
        $sql .= " AND periodo <= :periodo_hasta";
        $params['periodo_hasta'] = $periodo_hasta;
    }

    $sql .= " ORDER BY periodo ASC";
    
    error_log("TEST - SQL Query av_fisico_real: " . $sql);
    error_log("TEST - Params av_fisico_real: " . json_encode($params));

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("TEST - Resultados encontrados av_fisico_real: " . count($data));

    // UNA SOLA RESPUESTA JSON
    echo json_encode([
        'success' => true,
        'datos' => $data,
        'total' => count($data),
        'debug_info' => [
            'proyecto_id_recibido' => $proyecto_id,
            'periodo_desde_recibido' => $periodo_desde,
            'periodo_hasta_recibido' => $periodo_hasta,
            'total_registros_proyecto' => $checkResult['total'],
            'periodos_disponibles' => $periodos,
            'total_periodos' => count($periodos),
            'registros_ejemplo' => $ejemplos,
            'sql_ejecutado' => $sql,
            'parametros_usados' => $params,
            'total_registros_filtrados' => count($data),
            'test_mode' => true
        ]
    ]);

} catch (Exception $e) {
    error_log("TEST - Excepción capturada av_fisico_real: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug_info' => [
            'exception_file' => $e->getFile(),
            'exception_line' => $e->getLine()
        ]
    ]);
}
?>
