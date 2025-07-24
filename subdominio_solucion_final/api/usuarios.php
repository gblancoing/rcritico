<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require 'db.php';

// Parámetros de filtro (opcional)
$region_id = isset($_GET['region_id']) ? intval($_GET['region_id']) : null;
$proyecto_id = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : null;
$centro_costo_id = isset($_GET['centro_costo_id']) ? intval($_GET['centro_costo_id']) : null;

$sql = "SELECT 
    u.id, u.nombre, u.email, u.rol, u.centro_costo_id, u.aprobado,
    c.nombre AS centro_costo_nombre,
    p.nombre AS proyecto_nombre,
    r.nombre AS region_nombre
FROM usuarios u
LEFT JOIN centros_costo c ON u.centro_costo_id = c.id
LEFT JOIN proyectos p ON c.proyecto_id = p.proyecto_id
LEFT JOIN regiones r ON p.region_id = r.region_id
WHERE 1=1";

$params = [];
if ($region_id) {
    $sql .= " AND p.region_id = ?";
    $params[] = $region_id;
}
if ($proyecto_id) {
    $sql .= " AND p.proyecto_id = ?";
    $params[] = $proyecto_id;
}
if ($centro_costo_id) {
    $sql .= " AND u.centro_costo_id = ?";
    $params[] = $centro_costo_id;
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($usuarios);
