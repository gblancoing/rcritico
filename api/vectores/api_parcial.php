<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once '../db.php'; // Ajusta la ruta si tu estructura es diferente

try {
    $sql = "SELECT rp.id, rp.proyecto_id, p.nombre AS proyecto_nombre, rp.centro_costo, rp.periodo, rp.tipo, rp.cat_vp, rp.detalle_factorial, rp.monto
            FROM api_parcial rp
            INNER JOIN proyectos p ON rp.proyecto_id = p.proyecto_id
            ORDER BY rp.id DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
