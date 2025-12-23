<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// POST: Subir icono de carpeta
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!isset($_FILES['icono']) || !isset($_POST['usuario_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $usuario_id = intval($_POST['usuario_id']);
    $archivo = $_FILES['icono'];
    
    // Validar tipo de archivo (solo imágenes)
    $tipos_permitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!in_array($archivo['type'], $tipos_permitidos)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Tipo de archivo no permitido. Solo se permiten imágenes.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Validar tamaño (máximo 2MB)
    if ($archivo['size'] > 2 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El archivo no debe superar los 2MB'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Crear directorio para iconos - usar la carpeta img/iconos en la raíz
        $baseDir = dirname(dirname(__DIR__));
        $upload_dir = $baseDir . '/img/iconos/';
        
        // Crear el directorio si no existe
        if (!file_exists($upload_dir)) {
            if (!mkdir($upload_dir, 0755, true)) {
                echo json_encode(['success' => false, 'error' => 'No se pudo crear el directorio de iconos.'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        
        // Verificar permisos de escritura
        if (!is_writable($upload_dir)) {
            echo json_encode(['success' => false, 'error' => 'El directorio de iconos no tiene permisos de escritura.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Generar nombre único
        $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
        $nombre_archivo = 'icono_' . uniqid() . '_' . time() . '.' . $extension;
        $ruta_completa = $upload_dir . $nombre_archivo;
        
        // Mover archivo
        if (move_uploaded_file($archivo['tmp_name'], $ruta_completa)) {
            // Ruta relativa para guardar en BD - usar /img/iconos/
            $ruta_relativa = '/img/iconos/' . $nombre_archivo;
            
            echo json_encode([
                'success' => true,
                'icono_url' => $ruta_relativa,
                'nombre_archivo' => $nombre_archivo
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al guardar el icono en el servidor'], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al procesar el icono: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => false, 'error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
