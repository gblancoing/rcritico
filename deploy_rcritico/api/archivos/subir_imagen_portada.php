<?php
/**
 * API para subir imágenes de portada de carpetas
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

// Configuración - Detectar directorio base correctamente
// __DIR__ = /ruta/al/proyecto/api/archivos
// dirname(dirname(__DIR__)) = /ruta/al/proyecto
$baseDir = dirname(dirname(__DIR__));

// En algunos servidores, el path puede ser diferente, intentar detectar
if (!file_exists($baseDir . '/img')) {
    // Intentar con $_SERVER['DOCUMENT_ROOT']
    if (isset($_SERVER['DOCUMENT_ROOT'])) {
        $docRoot = $_SERVER['DOCUMENT_ROOT'];
        // Si el proyecto está en un subdirectorio, detectarlo
        $scriptPath = dirname(dirname(__DIR__));
        $relativePath = str_replace($docRoot, '', $scriptPath);
        if (file_exists($docRoot . $relativePath . '/img')) {
            $baseDir = $docRoot . $relativePath;
        }
    }
}

$uploadDir = $baseDir . '/img/portadas/';
$maxFileSize = 10 * 1024 * 1024; // 10MB
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Crear directorio si no existe
if (!file_exists($uploadDir)) {
    // Crear directorio img si no existe
    $imgDir = $baseDir . '/img';
    if (!file_exists($imgDir)) {
        if (!@mkdir($imgDir, 0755, true)) {
            echo json_encode([
                'success' => false, 
                'error' => 'No se pudo crear el directorio img',
                'debug' => [
                    'imgDir' => $imgDir,
                    'baseDir' => $baseDir,
                    'baseDir_exists' => file_exists($baseDir),
                    'baseDir_writable' => is_writable($baseDir)
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
    
    // Crear directorio portadas
    if (!@mkdir($uploadDir, 0755, true)) {
        echo json_encode([
            'success' => false, 
            'error' => 'No se pudo crear el directorio de portadas',
            'debug' => [
                'uploadDir' => $uploadDir,
                'imgDir' => $imgDir,
                'imgDir_exists' => file_exists($imgDir),
                'imgDir_writable' => is_writable($imgDir),
                'baseDir' => $baseDir,
                'baseDir_exists' => file_exists($baseDir),
                'baseDir_writable' => is_writable($baseDir)
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// Verificar que el directorio sea escribible
if (!is_writable($uploadDir)) {
    // Intentar cambiar permisos
    @chmod($uploadDir, 0755);
    // Si aún no es escribible, intentar 0777 (solo si es necesario)
    if (!is_writable($uploadDir)) {
        @chmod($uploadDir, 0777);
        if (!is_writable($uploadDir)) {
            echo json_encode([
                'success' => false, 
                'error' => 'El directorio de portadas no tiene permisos de escritura. Contacta al administrador del servidor.',
                'debug' => [
                    'uploadDir' => $uploadDir,
                    'permissions' => substr(sprintf('%o', fileperms($uploadDir)), -4),
                    'owner' => fileowner($uploadDir),
                    'group' => filegroup($uploadDir)
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit();
}

// Verificar que se recibió un archivo
if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        1 => 'El archivo excede el tamaño máximo permitido por PHP',
        2 => 'El archivo excede el tamaño máximo del formulario',
        3 => 'El archivo solo se subió parcialmente',
        4 => 'No se subió ningún archivo',
        6 => 'Falta la carpeta temporal',
        7 => 'Error al escribir en disco',
        8 => 'Una extensión PHP detuvo la subida'
    ];
    $errorCode = $_FILES['imagen']['error'] ?? 4;
    echo json_encode([
        'success' => false, 
        'error' => $errorMessages[$errorCode] ?? "Error de subida: código $errorCode"
    ]);
    exit();
}

$file = $_FILES['imagen'];
$carpeta_id = intval($_POST['carpeta_id'] ?? 0);

if (!$carpeta_id) {
    echo json_encode(['success' => false, 'error' => 'ID de carpeta requerido']);
    exit();
}

// Validar tamaño
if ($file['size'] > $maxFileSize) {
    echo json_encode(['success' => false, 'error' => 'El archivo excede el tamaño máximo (10MB)']);
    exit();
}

// Obtener tipo MIME de forma compatible
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$mimeTypes = [
    'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
    'gif' => 'image/gif', 'webp' => 'image/webp'
];

$mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';

// Intentar con finfo si está disponible
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
        $detectedMime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if ($detectedMime && $detectedMime !== 'application/octet-stream') {
            $mimeType = $detectedMime;
        }
    }
}

// Validar tipo
if (!in_array($mimeType, $allowedTypes) && !in_array($extension, $allowedExtensions)) {
    echo json_encode(['success' => false, 'error' => 'Tipo de archivo no permitido. Solo imágenes: JPG, PNG, GIF, WEBP']);
    exit();
}

// Generar nombre único
$nombreUnico = 'portada_' . $carpeta_id . '_' . time() . '.' . $extension;
$rutaDestino = $uploadDir . $nombreUnico;

// Verificar que el archivo temporal existe
if (!file_exists($file['tmp_name'])) {
    echo json_encode([
        'success' => false, 
        'error' => 'El archivo temporal no existe',
        'debug' => [
            'tmp_name' => $file['tmp_name'],
            'tmp_exists' => file_exists($file['tmp_name']),
            'upload_error' => $file['error']
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Verificar que el archivo temporal es válido
if (!is_uploaded_file($file['tmp_name'])) {
    echo json_encode([
        'success' => false, 
        'error' => 'El archivo no es un archivo subido válido',
        'debug' => [
            'tmp_name' => $file['tmp_name'],
            'is_uploaded_file' => is_uploaded_file($file['tmp_name'])
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Mover archivo
if (move_uploaded_file($file['tmp_name'], $rutaDestino)) {
    // Verificar que el archivo se movió correctamente
    if (!file_exists($rutaDestino)) {
        echo json_encode([
            'success' => false, 
            'error' => 'El archivo se movió pero no se encuentra en el destino',
            'debug' => [
                'rutaDestino' => $rutaDestino,
                'destino_exists' => file_exists($rutaDestino)
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    // Ruta relativa para guardar en BD
    $imagen_portada_url = '/img/portadas/' . $nombreUnico;
    
    try {
        // Actualizar la carpeta con la nueva imagen
        $stmt = $pdo->prepare("UPDATE carpetas SET imagen_portada_url = ? WHERE id = ?");
        $stmt->execute([$imagen_portada_url, $carpeta_id]);
        
        echo json_encode([
            'success' => true,
            'imagen_portada_url' => $imagen_portada_url,
            'mensaje' => 'Imagen de portada subida correctamente'
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        // Si falla la BD, eliminar el archivo subido
        @unlink($rutaDestino);
        echo json_encode([
            'success' => false, 
            'error' => 'Error al guardar en BD: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    // Obtener el último error de PHP
    $lastError = error_get_last();
    echo json_encode([
        'success' => false, 
        'error' => 'Error al mover el archivo al servidor',
        'debug' => [
            'tmp_name' => $file['tmp_name'],
            'tmp_exists' => file_exists($file['tmp_name']),
            'tmp_readable' => is_readable($file['tmp_name']),
            'rutaDestino' => $rutaDestino,
            'destino_dir_exists' => file_exists(dirname($rutaDestino)),
            'destino_dir_writable' => is_writable(dirname($rutaDestino)),
            'uploadDir' => $uploadDir,
            'uploadDir_writable' => is_writable($uploadDir),
            'file_size' => $file['size'],
            'php_error' => $lastError,
            'disk_free_space' => disk_free_space($uploadDir)
        ]
    ], JSON_UNESCAPED_UNICODE);
}
?>

