<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener parámetros de filtro
    $proyectoId = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : 1;
    $fechaDesde = isset($_GET['fecha_desde']) ? $_GET['fecha_desde'] : null;
    $fechaHasta = isset($_GET['fecha_hasta']) ? $_GET['fecha_hasta'] : null;
    $catVp = isset($_GET['cat_vp']) ? $_GET['cat_vp'] : null;
    
    // Construir la consulta SQL
    $sql = "SELECT * FROM vc_project_9c WHERE proyecto_id = :proyecto_id";
    $params = [':proyecto_id' => $proyectoId];
    
    // Agregar filtros de fecha si están presentes
    if ($fechaDesde) {
        $sql .= " AND periodo >= :fecha_desde";
        $params[':fecha_desde'] = $fechaDesde;
    }
    
    if ($fechaHasta) {
        $sql .= " AND periodo <= :fecha_hasta";
        $params[':fecha_hasta'] = $fechaHasta;
    }
    
    // Agregar filtro de cat_vp si está presente
    if ($catVp) {
        $sql .= " AND cat_vp = :cat_vp";
        $params[':cat_vp'] = $catVp;
    }
    
    // Ordenar por periodo y cat_vp
    $sql .= " ORDER BY periodo ASC, cat_vp ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $resultados,
        'count' => count($resultados)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 