<?php
/**
 * API para asociar el reporte ejecutivo generado a un informe stockholder
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$informe_id = isset($data['informe_id']) ? intval($data['informe_id']) : null;
$proyecto_id = isset($data['proyecto_id']) ? intval($data['proyecto_id']) : null;

if (!$informe_id || !$proyecto_id) {
    http_response_code(400);
    echo json_encode(['error' => 'informe_id y proyecto_id son requeridos'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Verificar que el informe existe
    $stmt = $pdo->prepare("SELECT * FROM informes_stockholders WHERE id = ? AND proyecto_id = ?");
    $stmt->execute([$informe_id, $proyecto_id]);
    $informe = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$informe) {
        http_response_code(404);
        echo json_encode(['error' => 'Informe no encontrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Generar la URL del reporte ejecutivo (sin doble /api/)
    $ruta_pdf = "/rcritico/api/dashboard/generar_reporte_pdf.php?proyecto_id={$proyecto_id}&pdf=1";
    
    // Actualizar el informe con la ruta del PDF
    $stmt = $pdo->prepare("
        UPDATE informes_stockholders 
        SET ruta_pdf = ?, fecha_actualizacion = NOW() 
        WHERE id = ? AND proyecto_id = ?
    ");
    $stmt->execute([$ruta_pdf, $informe_id, $proyecto_id]);
    
    // Obtener el informe actualizado
    $stmt = $pdo->prepare("SELECT * FROM informes_stockholders WHERE id = ? AND proyecto_id = ?");
    $stmt->execute([$informe_id, $proyecto_id]);
    $informe_actualizado = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'message' => 'Reporte ejecutivo asociado correctamente',
        'informe' => $informe_actualizado
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>

