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
        throw new Exception('proyecto_id es requerido');
    }

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
    
    // Debug: mostrar la consulta SQL y parámetros
    error_log("SQL Query av_fisico_real: " . $sql);
    error_log("Params av_fisico_real: " . json_encode($params));

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: verificar si hay errores en la consulta
    if ($stmt->errorInfo()[0] !== '00000') {
        error_log("❌ Error en la consulta SQL av_fisico_real: " . json_encode($stmt->errorInfo()));
    }
    
    // Debug: mostrar resultados
    error_log("Resultados encontrados av_fisico_real: " . count($data));
    if (count($data) > 0) {
        error_log("Primer registro av_fisico_real: " . json_encode($data[0]));
        error_log("Valor api_parcial del primer registro av_fisico_real: " . $data[0]['api_parcial']);
    } else {
        error_log("⚠️ No se encontraron registros en av_fisico_real para proyecto_id: " . $proyecto_id);
        error_log("⚠️ Con filtros: desde=" . ($periodo_desde ?? 'NULL') . ", hasta=" . ($periodo_hasta ?? 'NULL'));
    }

    echo json_encode([
        'success' => true,
        'datos' => $data,
        'total' => count($data)
    ]);

} catch (Exception $e) {
    error_log("❌ Excepción capturada av_fisico_real: " . $e->getMessage());
    error_log("❌ Archivo: " . $e->getFile() . " Línea: " . $e->getLine());
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>

