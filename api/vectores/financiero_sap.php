<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db.php';

try {
    // Obtener el proyecto_id de los parámetros GET
    $proyecto_id = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : null;
    
    // Construir la consulta base
    $query = "
        SELECT 
            fs.id_sap,
            fs.proyecto_id,
            fs.centro_costo_nombre,
            fs.version_sap,
            fs.descripcion,
            fs.grupo_version,
            fs.periodo,
            fs.MO,
            fs.IC,
            fs.EM,
            fs.IE,
            fs.SC,
            fs.AD,
            fs.CL,
            fs.CT
        FROM financiero_sap fs
        WHERE 1=1
    ";
    
    $params = [];
    
    // Filtrar por proyecto si se especifica
    if ($proyecto_id) {
        $query .= " AND fs.proyecto_id = ?";
        $params[] = $proyecto_id;
    }
    
    $query .= " ORDER BY fs.periodo DESC, fs.version_sap ASC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $data,
        'count' => count($data)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 