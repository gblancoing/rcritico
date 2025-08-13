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

    $sql = "SELECT id_av_v0, proyecto_id, periodo, vector, api_parcial FROM av_fisico_v0 WHERE proyecto_id = :proyecto_id";
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
    error_log("SQL Query: " . $sql);
    error_log("Params: " . json_encode($params));

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: verificar si hay errores en la consulta
    if ($stmt->errorInfo()[0] !== '00000') {
        error_log("❌ Error en la consulta SQL: " . json_encode($stmt->errorInfo()));
    }
    
    // Debug: mostrar resultados
    error_log("Resultados encontrados: " . count($data));
    if (count($data) > 0) {
        error_log("Primer registro: " . json_encode($data[0]));
        error_log("Valor api_parcial del primer registro: " . $data[0]['api_parcial']);
    } else {
        error_log("⚠️ No se encontraron registros para proyecto_id: " . $proyecto_id);
        error_log("⚠️ Con filtros: desde=" . ($periodo_desde ?? 'NULL') . ", hasta=" . ($periodo_hasta ?? 'NULL'));
    }

    echo json_encode([
        'success' => true,
        'datos' => $data,
        'total' => count($data)
    ]);

} catch (Exception $e) {
    error_log("❌ Excepción capturada: " . $e->getMessage());
    error_log("❌ Archivo: " . $e->getFile() . " Línea: " . $e->getLine());
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
