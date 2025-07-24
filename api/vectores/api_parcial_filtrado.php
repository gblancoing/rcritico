<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once '../db.php';

try {
    // Obtener el proyecto_id de los parámetros GET
    $proyecto_id = isset($_GET['proyecto_id']) ? (int)$_GET['proyecto_id'] : null;
    
    if ($proyecto_id) {
        // Filtrar por proyecto específico
        $sql = "SELECT rp.id, rp.proyecto_id, p.nombre AS proyecto_nombre, rp.centro_costo, rp.periodo, rp.tipo, rp.cat_vp, rp.detalle_factorial, rp.monto,
                       ro.descripcion AS responsable_obs_descripcion
                FROM api_parcial rp
                INNER JOIN proyectos p ON rp.proyecto_id = p.proyecto_id
                LEFT JOIN Responsables_OBS ro ON rp.responsable_obs_id = ro.id
                WHERE rp.proyecto_id = ?
                ORDER BY rp.id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$proyecto_id]);
    } else {
        // Mostrar todos los proyectos
        $sql = "SELECT rp.id, rp.proyecto_id, p.nombre AS proyecto_nombre, rp.centro_costo, rp.periodo, rp.tipo, rp.cat_vp, rp.detalle_factorial, rp.monto,
                       ro.descripcion AS responsable_obs_descripcion
                FROM api_parcial rp
                INNER JOIN proyectos p ON rp.proyecto_id = p.proyecto_id
                LEFT JOIN Responsables_OBS ro ON rp.responsable_obs_id = ro.id
                ORDER BY rp.id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
    }
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} 