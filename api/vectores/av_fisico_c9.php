<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../db.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener parámetros de consulta
    $proyectoId = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : 1;
    $fechaDesde = isset($_GET['fecha_desde']) ? $_GET['fecha_desde'] : null;
    $fechaHasta = isset($_GET['fecha_hasta']) ? $_GET['fecha_hasta'] : null;
    $catVp = isset($_GET['cat_vp']) ? $_GET['cat_vp'] : null;
    
    // Construir la consulta SQL
    $sql = "SELECT 
                id_c9,
                periodo,
                cat_vp,
                moneda_base,
                proyecto_id,
                base,
                cambio,
                control,
                tendencia,
                eat,
                compromiso,
                incurrido,
                financiero,
                por_comprometer,
                created_at,
                updated_at
            FROM av_fisico_c9 
            WHERE proyecto_id = :proyecto_id";
    
    $params = [':proyecto_id' => $proyectoId];
    
    // Agregar filtros adicionales
    if ($fechaDesde) {
        $sql .= " AND periodo >= :fecha_desde";
        $params[':fecha_desde'] = $fechaDesde;
    }
    
    if ($fechaHasta) {
        $sql .= " AND periodo <= :fecha_hasta";
        $params[':fecha_hasta'] = $fechaHasta;
    }
    
    if ($catVp) {
        $sql .= " AND cat_vp = :cat_vp";
        $params[':cat_vp'] = $catVp;
    }
    
    // Ordenar por periodo
    $sql .= " ORDER BY periodo ASC, cat_vp ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $data = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Convertir valores numéricos
        $row['base'] = floatval($row['base']);
        $row['cambio'] = floatval($row['cambio']);
        $row['control'] = floatval($row['control']);
        $row['tendencia'] = floatval($row['tendencia']);
        $row['eat'] = floatval($row['eat']);
        $row['compromiso'] = floatval($row['compromiso']);
        $row['incurrido'] = floatval($row['incurrido']);
        $row['financiero'] = floatval($row['financiero']);
        $row['por_comprometer'] = floatval($row['por_comprometer']);
        $row['moneda_base'] = intval($row['moneda_base']);
        $row['proyecto_id'] = intval($row['proyecto_id']);
        
        $data[] = $row;
    }
    
    echo json_encode($data);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al obtener datos: ' . $e->getMessage()
    ]);
}
?> 