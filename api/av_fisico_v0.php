<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'db.php';

try {
    $proyecto_id = $_GET['proyecto_id'] ?? null;
    $fecha_desde = $_GET['fecha_desde'] ?? null;
    $fecha_hasta = $_GET['fecha_hasta'] ?? null;
    $vector = $_GET['vector'] ?? null;

    if (!$proyecto_id) {
        throw new Exception('proyecto_id es requerido');
    }

    $sql = "SELECT * FROM av_fisico_v0 WHERE proyecto_id = :proyecto_id";
    $params = ['proyecto_id' => $proyecto_id];

    if ($fecha_desde) {
        $sql .= " AND periodo >= :fecha_desde";
        $params['fecha_desde'] = $fecha_desde;
    }

    if ($fecha_hasta) {
        $sql .= " AND periodo <= :fecha_hasta";
        $params['fecha_hasta'] = $fecha_hasta;
    }

    if ($vector) {
        $sql .= " AND vector = :vector";
        $params['vector'] = $vector;
    }

    $sql .= " ORDER BY periodo ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data,
        'total' => count($data)
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 