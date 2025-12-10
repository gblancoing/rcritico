<?php
/**
 * API para gestión de archivos de documentos en Línea Base
 * Permite subir, listar y eliminar archivos
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

// Configuración - Usar rutas absolutas para que funcione en cualquier servidor
// __DIR__ es la carpeta donde está este archivo (api/archivos/)
// Subimos 2 niveles para llegar a la raíz del proyecto
$baseDir = dirname(dirname(__DIR__)); // Equivale a ../../ pero de forma absoluta
$uploadDir = $baseDir . '/uploads/documentos_linea_base/';
$maxFileSize = 50 * 1024 * 1024; // 50MB
$allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'video/mp4', 'video/mpeg', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
];

// Crear directorio si no existe
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Verificar/crear tabla si no existe
function verificarTabla($pdo) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'linea_base_archivos'");
        if ($stmt->rowCount() === 0) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS linea_base_archivos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                linea_base_id INT NOT NULL,
                carpeta_id INT DEFAULT NULL,
                nombre_original VARCHAR(255) NOT NULL,
                nombre_archivo VARCHAR(255) NOT NULL,
                ruta VARCHAR(500) NOT NULL,
                tipo_mime VARCHAR(100) NOT NULL,
                tamano_bytes BIGINT NOT NULL,
                extension VARCHAR(20) NOT NULL,
                descripcion TEXT DEFAULT NULL,
                subido_por INT NOT NULL,
                subido_por_nombre VARCHAR(255) DEFAULT NULL,
                subido_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo TINYINT(1) DEFAULT 1,
                INDEX idx_linea_base (linea_base_id),
                INDEX idx_carpeta (carpeta_id),
                INDEX idx_activo (activo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
        }
    } catch (PDOException $e) {
        // Tabla ya existe, ignorar
    }
}

verificarTabla($pdo);

// GET: Obtener archivos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $linea_base_id = isset($_GET['linea_base_id']) ? intval($_GET['linea_base_id']) : null;
    $carpeta_id = isset($_GET['carpeta_id']) ? ($_GET['carpeta_id'] === 'null' ? null : intval($_GET['carpeta_id'])) : null;
    
    if (!$linea_base_id) {
        echo json_encode(['success' => false, 'error' => 'linea_base_id es requerido']);
        exit();
    }
    
    try {
        if ($carpeta_id === null) {
            $stmt = $pdo->prepare("SELECT * FROM linea_base_archivos WHERE linea_base_id = ? AND carpeta_id IS NULL AND activo = 1 ORDER BY nombre_original ASC");
            $stmt->execute([$linea_base_id]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM linea_base_archivos WHERE linea_base_id = ? AND carpeta_id = ? AND activo = 1 ORDER BY nombre_original ASC");
            $stmt->execute([$linea_base_id, $carpeta_id]);
        }
        $archivos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'archivos' => $archivos], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

// POST: Subir archivo(s)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $linea_base_id = intval($_POST['linea_base_id'] ?? 0);
    $carpeta_id = isset($_POST['carpeta_id']) && $_POST['carpeta_id'] !== '' && $_POST['carpeta_id'] !== 'null' ? intval($_POST['carpeta_id']) : null;
    $subido_por = intval($_POST['usuario_id'] ?? 0);
    $subido_por_nombre = $_POST['usuario_nombre'] ?? '';
    
    if (!$linea_base_id || !$subido_por) {
        echo json_encode(['success' => false, 'error' => 'linea_base_id y usuario_id son requeridos. Recibido: linea_base_id=' . $linea_base_id . ', usuario_id=' . $subido_por]);
        exit();
    }
    
    // Verificar si se recibieron archivos
    if (!isset($_FILES['archivos'])) {
        // Verificar límites de PHP
        $maxSize = ini_get('upload_max_filesize');
        $postMax = ini_get('post_max_size');
        echo json_encode([
            'success' => false, 
            'error' => 'No se recibieron archivos. Límites del servidor: upload_max_filesize=' . $maxSize . ', post_max_size=' . $postMax,
            'debug' => [
                'FILES' => $_FILES,
                'POST' => $_POST
            ]
        ]);
        exit();
    }
    
    if (empty($_FILES['archivos']['name'][0])) {
        echo json_encode(['success' => false, 'error' => 'Los archivos llegaron vacíos']);
        exit();
    }
    
    // Crear subdirectorio por linea_base_id
    $subDir = $uploadDir . "lb_$linea_base_id/";
    if (!file_exists($subDir)) {
        mkdir($subDir, 0755, true);
    }
    
    $archivosSubidos = [];
    $errores = [];
    
    $files = $_FILES['archivos'];
    $fileCount = is_array($files['name']) ? count($files['name']) : 1;
    
    for ($i = 0; $i < $fileCount; $i++) {
        $fileName = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $fileTmp = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $fileSize = is_array($files['size']) ? $files['size'][$i] : $files['size'];
        $fileError = is_array($files['error']) ? $files['error'][$i] : $files['error'];
        
        // Validar error de subida
        if ($fileError !== UPLOAD_ERR_OK) {
            $errorMessages = [
                1 => 'El archivo excede upload_max_filesize (' . ini_get('upload_max_filesize') . ')',
                2 => 'El archivo excede MAX_FILE_SIZE del formulario',
                3 => 'El archivo solo se subió parcialmente',
                4 => 'No se subió ningún archivo',
                6 => 'Falta la carpeta temporal',
                7 => 'Error al escribir en disco',
                8 => 'Una extensión PHP detuvo la subida'
            ];
            $errores[] = "Error al subir $fileName: " . ($errorMessages[$fileError] ?? "código $fileError");
            continue;
        }
        
        // Validar tamaño
        if ($fileSize > $maxFileSize) {
            $errores[] = "El archivo $fileName excede el tamaño máximo (50MB)";
            continue;
        }
        
        // Validar tipo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $fileTmp);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $allowedTypes)) {
            $errores[] = "Tipo de archivo no permitido: $fileName ($mimeType)";
            continue;
        }
        
        // Generar nombre único
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $nombreUnico = uniqid('doc_') . '_' . time() . '.' . $extension;
        $rutaDestino = $subDir . $nombreUnico;
        
        // Mover archivo
        if (move_uploaded_file($fileTmp, $rutaDestino)) {
            // Verificar que el archivo se guardó correctamente
            if (!file_exists($rutaDestino)) {
                $errores[] = "Error: El archivo $fileName se movió pero no existe en destino";
                continue;
            }
            try {
                $stmt = $pdo->prepare("INSERT INTO linea_base_archivos 
                    (linea_base_id, carpeta_id, nombre_original, nombre_archivo, ruta, tipo_mime, tamano_bytes, extension, subido_por, subido_por_nombre) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                
                // Guardar ruta relativa desde la raíz del proyecto
                $rutaRelativa = 'uploads/documentos_linea_base/lb_' . $linea_base_id . '/' . $nombreUnico;
                $stmt->execute([
                    $linea_base_id, 
                    $carpeta_id, 
                    $fileName, 
                    $nombreUnico, 
                    $rutaRelativa, 
                    $mimeType, 
                    $fileSize, 
                    $extension, 
                    $subido_por, 
                    $subido_por_nombre
                ]);
                
                $archivosSubidos[] = [
                    'id' => $pdo->lastInsertId(),
                    'nombre_original' => $fileName,
                    'nombre_archivo' => $nombreUnico,
                    'ruta' => $rutaRelativa,
                    'tipo_mime' => $mimeType,
                    'tamano_bytes' => $fileSize,
                    'extension' => $extension
                ];
                
            } catch (PDOException $e) {
                $errores[] = "Error al registrar $fileName: " . $e->getMessage();
                // Eliminar archivo si falla el registro
                unlink($rutaDestino);
            }
        } else {
            // Diagnóstico detallado para producción
            $diagnostico = [
                'archivo' => $fileName,
                'uploadDir' => $uploadDir,
                'subDir' => $subDir,
                'rutaDestino' => $rutaDestino,
                'dir_exists' => file_exists($subDir),
                'dir_writable' => is_writable($subDir),
                'tmp_exists' => file_exists($fileTmp),
                'baseDir' => $baseDir
            ];
            $errores[] = "Error al guardar $fileName. Diagnóstico: " . json_encode($diagnostico);
        }
    }
    
    if (count($archivosSubidos) > 0) {
        echo json_encode([
            'success' => true,
            'archivos' => $archivosSubidos,
            'errores' => $errores,
            'mensaje' => count($archivosSubidos) . ' archivo(s) subido(s) correctamente'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'No se pudo subir ningún archivo',
            'errores' => $errores
        ], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

// DELETE: Eliminar archivo
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = intval($data['id'] ?? 0);
    
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'id es requerido']);
        exit();
    }
    
    try {
        // Soft delete
        $stmt = $pdo->prepare("UPDATE linea_base_archivos SET activo = 0 WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'mensaje' => 'Archivo eliminado'], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
?>





