<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php'; // Ajusta la ruta si es necesario

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['rows']) || !is_array($data['rows'])) {
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit;
}

$rows = $data['rows'];
$proyecto_id = $data['proyecto_id'] ?? null;

if (!$proyecto_id) {
    echo json_encode(['success' => false, 'error' => 'proyecto_id is required']);
    exit;
}

// Obtener el centro de costo del proyecto
$stmt = $pdo->prepare("SELECT nombre FROM centros_costo WHERE proyecto_id = ? LIMIT 1");
$stmt->execute([$proyecto_id]);
$centro_costo = $stmt->fetch();

$centro_costo_nombre = $centro_costo ? $centro_costo['nombre'] : 'PREDICTIVO';

$inserted = 0;
foreach ($rows as $row) {
    // Ajusta los nombres de las columnas según tu Excel
    $periodo = $row['periodo'] ?? '';
    $tipo = $row['tipo'] ?? '';
    $cat_vp = $row['cat_vp'] ?? '';
    $detalle_factorial = $row['detalle_factorial'] ?? '';
    $monto = $row['monto'] ?? 0;

    error_log("MONTO recibido: " . $monto);

    $stmt = $pdo->prepare("INSERT INTO predictividad_parcial (proyecto_id, centro_costo, periodo, tipo, cat_vp, detalle_factorial, monto)
        VALUES (?, ?, ?, ?, ?, ?, ?)");
    if ($stmt->execute([$proyecto_id, $centro_costo_nombre, $periodo, $tipo, $cat_vp, $detalle_factorial, $monto])) {
        $inserted++;
    }
}

echo json_encode(['success' => true, 'inserted' => $inserted]);
?>