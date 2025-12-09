<?php
/**
 * API para marcar una notificación como leída
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$notificacion_id = $data['notificacion_id'] ?? '';
$usuario_id = isset($data['usuario_id']) ? intval($data['usuario_id']) : 0;
// ref_id viene como string numérico del frontend, mantenerlo igual
$ref_id = isset($data['ref_id']) ? strval($data['ref_id']) : '';

if (!$usuario_id) {
    echo json_encode(['success' => false, 'error' => 'usuario_id requerido'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Asegurarse de que la tabla existe
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS notificaciones_leidas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            tipo VARCHAR(50) NOT NULL,
            referencia_id BIGINT UNSIGNED NOT NULL,
            leido_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_lectura (usuario_id, tipo, referencia_id),
            INDEX idx_usuario (usuario_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Determinar el tipo basado en el notificacion_id
    $tipo = 'mensaje_foro';
    
    if (strpos($notificacion_id, 'tarea_') === 0) {
        $tipo = 'tarea';
        if (empty($ref_id)) {
            $ref_id = str_replace('tarea_', '', $notificacion_id);
        }
    }
    
    // Si no se proporcionó ref_id, generar uno basado en el ID
    if (empty($ref_id)) {
        $ref_id = sprintf('%u', crc32($notificacion_id));
    }
    
    // Insertar registro de lectura (ignorar si ya existe)
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO notificaciones_leidas (usuario_id, tipo, referencia_id)
        VALUES (?, ?, ?)
    ");
    $result = $stmt->execute([$usuario_id, $tipo, $ref_id]);
    
    $rows_affected = $stmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'mensaje' => 'Notificación marcada como leída',
        'debug' => [
            'usuario_id' => $usuario_id,
            'tipo' => $tipo,
            'ref_id' => $ref_id,
            'notificacion_id' => $notificacion_id,
            'rows_affected' => $rows_affected,
            'execute_result' => $result
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
