<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../config/db.php';

try {
    $pdo->query("SHOW COLUMNS FROM archivos LIKE 'archivos_carpeta_id'")->rowCount() === 0 && 
    $pdo->exec("ALTER TABLE archivos ADD COLUMN archivos_carpeta_id INT NULL AFTER carpeta_id");
} catch (PDOException $e) {}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : null;
    $archivos_carpeta_id = isset($_GET['archivos_carpeta_id']) ? $_GET['archivos_carpeta_id'] : null;
    
    if (!$carpeta_id) { http_response_code(400); echo json_encode(['error' => 'carpeta_id requerido']); exit; }
    
    try {
        $sql = "SELECT a.*, u.nombre as subido_por_nombre FROM archivos a LEFT JOIN usuarios u ON a.subido_por = u.id WHERE a.carpeta_id = ? AND a.activo = 1";
        $params = [$carpeta_id];
        
        if ($archivos_carpeta_id && $archivos_carpeta_id !== 'root') {
            $sql .= " AND a.archivos_carpeta_id = ?";
            $params[] = intval($archivos_carpeta_id);
        } else {
            $sql .= " AND (a.archivos_carpeta_id IS NULL OR a.archivos_carpeta_id = 0)";
        }
        
        $stmt = $pdo->prepare($sql . " ORDER BY a.subido_en DESC");
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC)); exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]); exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $carpeta_id = intval($_POST['carpeta_id'] ?? 0);
    $usuario_id = intval($_POST['usuario_id'] ?? 0);
    $archivos_carpeta_id = intval($_POST['archivos_carpeta_id'] ?? 0);
    
    if (!$carpeta_id || !$usuario_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parametros faltantes']); exit;
    }
    
    if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Error archivo: ' . ($_FILES['archivo']['error'] ?? 'no recibido')]); exit;
    }
    
    $archivo = $_FILES['archivo'];
    $ext = pathinfo($archivo['name'], PATHINFO_EXTENSION);
    $nombre_unico = uniqid() . '_' . time() . '.' . $ext;
    
    $baseDir = dirname(dirname(__DIR__));
    $uploadDir = $baseDir . '/uploads/archivos/proyecto_' . $carpeta_id . '/';
    
    // Crear carpeta base si no existe
    $baseUpload = $baseDir . '/uploads/archivos/';
    if (!is_dir($baseUpload)) { @mkdir($baseUpload, 0755, true); }
    
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'No se pudo crear directorio']); exit;
    }
    
    $ruta_destino = $uploadDir . $nombre_unico;
    $ruta_relativa = 'uploads/archivos/proyecto_' . $carpeta_id . '/' . $nombre_unico;
    
    if (!move_uploaded_file($archivo['tmp_name'], $ruta_destino)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error moviendo archivo']); exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO archivos (nombre, nombre_original, ruta_archivo, tipo_mime, carpeta_id, archivos_carpeta_id, subido_por) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$nombre_unico, $archivo['name'], $ruta_relativa, $archivo['type'], $carpeta_id, $archivos_carpeta_id ?: null, $usuario_id]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'nombre_original' => $archivo['name']]); exit;
    } catch (PDOException $e) {
        @unlink($ruta_destino);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'BD: ' . $e->getMessage()]); exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'id requerido']); exit; }
    
    try {
        $pdo->prepare("UPDATE archivos SET activo = 0 WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true]); exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]); exit;
    }
}

http_response_code(405);
echo json_encode(['error' => 'Metodo no permitido']);