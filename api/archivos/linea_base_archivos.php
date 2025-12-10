<?php
/**
 * API para gestión de archivos de documentos en Línea Base
 */

// Capturar errores fatales y convertirlos a JSON
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode([
            'success' => false,
            'error' => 'Error fatal del servidor: ' . $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ], JSON_UNESCAPED_UNICODE);
    }
});

// Desactivar display de errores para evitar HTML mezclado con JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once __DIR__ . '/../config/db.php';
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error de conexión a BD: ' . $e->getMessage()]);
    exit();
}

// Configuración
$baseDir = dirname(dirname(__DIR__));
$uploadDir = $baseDir . '/uploads/documentos_linea_base/';
$maxFileSize = 100 * 1024 * 1024; // 100MB

$allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'application/octet-stream', // Para archivos genéricos
    'video/mp4', 'video/mpeg', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
];

// Crear directorio base si no existe
if (!file_exists($uploadDir)) {
    if (!@mkdir($uploadDir, 0755, true)) {
        echo json_encode(['success' => false, 'error' => 'No se pudo crear el directorio de uploads: ' . $uploadDir]);
        exit();
    }
}

// Verificar/crear tabla
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
        // Ignorar si tabla ya existe
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
        echo json_encode(['success' => true, 'archivos' => $stmt->fetchAll(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Error BD: ' . $e->getMessage()]);
    }
    exit();
}

// POST: Subir archivo(s)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Verificar límites de PHP
    $uploadMaxSize = ini_get('upload_max_filesize');
    $postMaxSize = ini_get('post_max_size');
    
    $linea_base_id = intval($_POST['linea_base_id'] ?? 0);
    $carpeta_id = isset($_POST['carpeta_id']) && $_POST['carpeta_id'] !== '' && $_POST['carpeta_id'] !== 'null' ? intval($_POST['carpeta_id']) : null;
    $subido_por = intval($_POST['usuario_id'] ?? 0);
    $subido_por_nombre = $_POST['usuario_nombre'] ?? '';
    
    if (!$linea_base_id || !$subido_por) {
        echo json_encode([
            'success' => false, 
            'error' => 'Parámetros requeridos faltantes',
            'debug' => [
                'linea_base_id' => $linea_base_id,
                'usuario_id' => $subido_por,
                'POST' => $_POST,
                'FILES' => isset($_FILES) ? array_keys($_FILES) : 'no FILES'
            ]
        ]);
        exit();
    }
    
    // Verificar si llegaron archivos
    if (!isset($_FILES['archivos'])) {
        echo json_encode([
            'success' => false, 
            'error' => 'No se recibieron archivos. Posible causa: archivo muy grande.',
            'limits' => [
                'upload_max_filesize' => $uploadMaxSize,
                'post_max_size' => $postMaxSize
            ],
            'FILES' => $_FILES,
            'POST_keys' => array_keys($_POST)
        ]);
        exit();
    }
    
    if (empty($_FILES['archivos']['name'][0])) {
        echo json_encode(['success' => false, 'error' => 'Array de archivos vacío']);
        exit();
    }
    
    // Crear subdirectorio
    $subDir = $uploadDir . "lb_$linea_base_id/";
    if (!file_exists($subDir)) {
        if (!@mkdir($subDir, 0755, true)) {
            echo json_encode(['success' => false, 'error' => 'No se pudo crear subdirectorio: ' . $subDir]);
            exit();
        }
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
                1 => 'El archivo excede upload_max_filesize (' . $uploadMaxSize . ')',
                2 => 'El archivo excede MAX_FILE_SIZE del formulario',
                3 => 'El archivo solo se subió parcialmente',
                4 => 'No se subió ningún archivo',
                6 => 'Falta la carpeta temporal',
                7 => 'Error al escribir en disco',
                8 => 'Una extensión PHP detuvo la subida'
            ];
            $errores[] = "Error con $fileName: " . ($errorMessages[$fileError] ?? "código $fileError");
            continue;
        }
        
        // Validar tamaño
        if ($fileSize > $maxFileSize) {
            $errores[] = "El archivo $fileName excede el tamaño máximo (100MB)";
            continue;
        }
        
        // Obtener tipo MIME
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $fileTmp);
        finfo_close($finfo);
        
        // Permitir más tipos si la extensión es conocida
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $extensionesPermitidas = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar'];
        
        if (!in_array($mimeType, $allowedTypes) && !in_array($extension, $extensionesPermitidas)) {
            $errores[] = "Tipo no permitido: $fileName ($mimeType)";
            continue;
        }
        
        // Generar nombre único
        $nombreUnico = uniqid('doc_') . '_' . time() . '.' . $extension;
        $rutaDestino = $subDir . $nombreUnico;
        
        // Mover archivo
        if (move_uploaded_file($fileTmp, $rutaDestino)) {
            try {
                $stmt = $pdo->prepare("INSERT INTO linea_base_archivos 
                    (linea_base_id, carpeta_id, nombre_original, nombre_archivo, ruta, tipo_mime, tamano_bytes, extension, subido_por, subido_por_nombre) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                
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
                    'tamano_bytes' => $fileSize
                ];
                
            } catch (PDOException $e) {
                $errores[] = "Error BD para $fileName: " . $e->getMessage();
                @unlink($rutaDestino);
            }
        } else {
            $errores[] = "Error al mover $fileName al servidor";
        }
    }
    
    if (count($archivosSubidos) > 0) {
        echo json_encode([
            'success' => true,
            'archivos' => $archivosSubidos,
            'errores' => $errores,
            'mensaje' => count($archivosSubidos) . ' archivo(s) subido(s)'
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
        $stmt = $pdo->prepare("UPDATE linea_base_archivos SET activo = 0 WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'mensaje' => 'Archivo eliminado'], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
?>
