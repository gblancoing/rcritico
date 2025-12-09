<?php
/**
 * API para subir archivos de respaldo de Línea Base
 * Permite a los trabajadores subir fotografías y documentos como evidencia
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

// Configuración de subida - Usar rutas absolutas para que funcione en cualquier servidor
$baseDir = dirname(dirname(__DIR__)); // Sube 2 niveles desde api/archivos/
$uploadDir = $baseDir . '/uploads/respaldos/';
$maxFileSize = 10 * 1024 * 1024; // 10MB
$allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// Crear directorio si no existe
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit();
}

try {
    $carpeta_id = $_POST['carpeta_id'] ?? null;
    $tipo = $_POST['tipo'] ?? 'respaldo_linea_base';
    $item_id = $_POST['item_id'] ?? 'unknown';
    
    if (!isset($_FILES['archivos']) || empty($_FILES['archivos']['name'][0])) {
        echo json_encode(['success' => false, 'error' => 'No se recibieron archivos']);
        exit();
    }
    
    $archivosSubidos = [];
    $errores = [];
    
    $files = $_FILES['archivos'];
    $fileCount = count($files['name']);
    
    for ($i = 0; $i < $fileCount; $i++) {
        $fileName = $files['name'][$i];
        $fileTmp = $files['tmp_name'][$i];
        $fileSize = $files['size'][$i];
        $fileError = $files['error'][$i];
        $fileType = $files['type'][$i];
        
        // Validar error de subida
        if ($fileError !== UPLOAD_ERR_OK) {
            $errores[] = "Error al subir $fileName: código $fileError";
            continue;
        }
        
        // Validar tamaño
        if ($fileSize > $maxFileSize) {
            $errores[] = "El archivo $fileName excede el tamaño máximo (10MB)";
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
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
        $nombreUnico = uniqid('respaldo_') . '_' . time() . '.' . $extension;
        
        // Crear subdirectorio por carpeta
        $subDir = $uploadDir . ($carpeta_id ? "carpeta_$carpeta_id/" : "general/");
        if (!file_exists($subDir)) {
            mkdir($subDir, 0755, true);
        }
        
        $rutaDestino = $subDir . $nombreUnico;
        
        // Mover archivo
        if (move_uploaded_file($fileTmp, $rutaDestino)) {
            // Guardar ruta relativa desde la raíz del proyecto
            $subFolder = $carpeta_id ? "carpeta_$carpeta_id/" : "general/";
            $rutaRelativa = 'uploads/respaldos/' . $subFolder . $nombreUnico;
            $archivosSubidos[] = [
                'nombre' => $fileName,
                'nombre_archivo' => $nombreUnico,
                'ruta' => $rutaRelativa,
                'tipo' => $mimeType,
                'tamano' => $fileSize,
                'fecha_subida' => date('Y-m-d H:i:s')
            ];
        } else {
            $errores[] = "Error al guardar $fileName";
        }
    }
    
    if (count($archivosSubidos) > 0) {
        echo json_encode([
            'success' => true,
            'archivos' => $archivosSubidos,
            'errores' => $errores,
            'mensaje' => count($archivosSubidos) . ' archivo(s) subido(s) correctamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'No se pudo subir ningún archivo',
            'errores' => $errores
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error del servidor: ' . $e->getMessage()
    ]);
}
?>





