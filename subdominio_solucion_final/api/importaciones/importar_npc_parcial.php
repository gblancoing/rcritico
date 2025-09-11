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
$inserted = 0;

// Limpiar tabla antes de importar
$proyecto_id = $data['proyecto_id'] ?? null;
if ($proyecto_id) {
    $deleteStmt = $pdo->prepare("DELETE FROM npc_parcial WHERE proyecto_id = ?");
    $deleteStmt->execute([$proyecto_id]);
    error_log("🧹 Tabla npc_parcial limpiada para proyecto_id: " . $proyecto_id);
}

foreach ($rows as $row) {
    // Ajusta los nombres de las columnas según tu Excel
    $proyecto_id = $row['proyecto_id'] ?? null;
    $centro_costo = $row['centro_costo'] ?? '';
    $periodo = $row['periodo'] ?? '';
    $tipo = $row['tipo'] ?? '';
    $cat_vp = $row['cat_vp'] ?? '';
    $detalle_factorial = $row['detalle_factorial'] ?? '';
    $monto = $row['monto'] ?? 0;

    error_log("MONTO recibido: " . $monto);

    $stmt = $pdo->prepare("INSERT INTO npc_parcial (proyecto_id, centro_costo, periodo, tipo, cat_vp, detalle_factorial, monto)
        VALUES (?, ?, ?, ?, ?, ?, ?)");
    if ($stmt->execute([$proyecto_id, $centro_costo, $periodo, $tipo, $cat_vp, $detalle_factorial, $monto])) {
        $inserted++;
    }
}

echo json_encode(['success' => true, 'inserted' => $inserted]);