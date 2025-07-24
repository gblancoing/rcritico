<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once '../db.php';

try {
    // Verificar si se proporciona un proyecto_id como parámetro
    $proyecto_id = isset($_GET['proyecto_id']) ? $_GET['proyecto_id'] : null;
    
    if ($proyecto_id) {
        // Consulta filtrada por proyecto específico
        $sql = "SELECT rp.id, rp.proyecto_id, p.nombre AS proyecto_nombre, 
                       cc.nombre AS centro_costo_nombre, rp.centro_costo, 
                       rp.periodo, rp.tipo, rp.cat_vp, rp.detalle_factorial, rp.monto,
                       rp.area_id, rp.responsable_obs_id, rp.fase_etapa_id, rp.fase_costos_id,
                       rp.tipo_paquete_id, rp.adquisiciones_vp_id, rp.adquisiciones_agenciadas_id,
                       rp.contratos_servicios_id, rp.campo3_fase_id, rp.campo4_etapa_id, rp.campo5_disciplina_id
                FROM real_parcial rp
                INNER JOIN proyectos p ON rp.proyecto_id = p.proyecto_id
                LEFT JOIN centros_costo cc ON rp.centro_costo = cc.id
                WHERE rp.proyecto_id = :proyecto_id
                ORDER BY rp.id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':proyecto_id', $proyecto_id, PDO::PARAM_INT);
    } else {
        // Consulta general (todos los proyectos)
        $sql = "SELECT rp.id, rp.proyecto_id, p.nombre AS proyecto_nombre, 
                       cc.nombre AS centro_costo_nombre, rp.centro_costo, 
                       rp.periodo, rp.tipo, rp.cat_vp, rp.detalle_factorial, rp.monto,
                       rp.area_id, rp.responsable_obs_id, rp.fase_etapa_id, rp.fase_costos_id,
                       rp.tipo_paquete_id, rp.adquisiciones_vp_id, rp.adquisiciones_agenciadas_id,
                       rp.contratos_servicios_id, rp.campo3_fase_id, rp.campo4_etapa_id, rp.campo5_disciplina_id
                FROM real_parcial rp
                INNER JOIN proyectos p ON rp.proyecto_id = p.proyecto_id
                LEFT JOIN centros_costo cc ON rp.centro_costo = cc.id
                ORDER BY rp.id DESC";
        $stmt = $pdo->prepare($sql);
    }
    
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Agregar información adicional sobre el filtro aplicado
    $response = [
        'success' => true, 
        'data' => $result,
        'filtro_aplicado' => $proyecto_id ? "Proyecto ID: $proyecto_id" : "Todos los proyectos",
        'total_registros' => count($result)
    ];
    
    echo json_encode($response);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?> 