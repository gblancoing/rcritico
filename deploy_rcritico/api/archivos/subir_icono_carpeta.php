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
    if (!isset($_FILES['icono']) || !isset($_POST['usuario_id'])) {
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $usuario_id = intval($_POST['usuario_id']);
    $archivo = $_FILES['icono'];
    
    // Validar tipo de archivo (solo imágenes)
    $tipos_permitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!in_array($archivo['type'], $tipos_permitidos)) {
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Tipo de archivo no permitido. Solo se permiten imágenes.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Validar tamaño (máximo 2MB)
    if ($archivo['size'] > 2 * 1024 * 1024) {
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'El archivo no debe superar los 2MB'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Crear directorio para iconos si no existe
        $upload_dir = __DIR__ . '/uploads/iconos_carpetas/';
        
        // Verificar que el directorio padre 'uploads' existe
        $uploads_parent = __DIR__ . '/uploads/';
        if (!file_exists($uploads_parent)) {
            if (!mkdir($uploads_parent, 0755, true)) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'error' => 'No se pudo crear el directorio de uploads. Verifique permisos del servidor.'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        
        // Crear el directorio de iconos si no existe
        if (!file_exists($upload_dir)) {
            if (!mkdir($upload_dir, 0755, true)) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'error' => 'No se pudo crear el directorio de iconos. Verifique permisos del servidor.'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        
        // Verificar permisos de escritura
        if (!is_writable($upload_dir)) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'El directorio de iconos no tiene permisos de escritura. Contacte al administrador del servidor.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar que el archivo temporal existe
        if (!file_exists($archivo['tmp_name'])) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'El archivo temporal no existe. Verifique la configuración de PHP (upload_tmp_dir).'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Generar nombre único
        $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
        $nombre_archivo = 'icono_' . uniqid() . '_' . time() . '.' . $extension;
        $ruta_completa = $upload_dir . $nombre_archivo;
        
        // Mover archivo
        $resultado_move = @move_uploaded_file($archivo['tmp_name'], $ruta_completa);
        
        if ($resultado_move) {
            // Verificar que el archivo se guardó correctamente
            if (!file_exists($ruta_completa)) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'error' => 'El archivo no se guardó correctamente'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            // Verificar que el archivo tiene contenido
            if (filesize($ruta_completa) === 0) {
                @unlink($ruta_completa); // Eliminar archivo vacío
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'error' => 'El archivo subido está vacío'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            // Ruta relativa para el frontend
            // La ruta debe ser /api/uploads/iconos_carpetas/... para que api/uploads.php la maneje
            $ruta_relativa = '/api/uploads/iconos_carpetas/' . $nombre_archivo;
            
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => true,
                'icono_url' => $ruta_relativa,
                'nombre_archivo' => $nombre_archivo
            ], JSON_UNESCAPED_UNICODE);
        } else {
            // Obtener el último error de PHP
            $error_php = error_get_last();
            $mensaje_error = 'Error al guardar el icono en el servidor';
            
            if ($error_php && isset($error_php['message'])) {
                $mensaje_error .= ': ' . $error_php['message'];
            } else {
                // Verificar posibles causas comunes
                if (!is_writable($upload_dir)) {
                    $mensaje_error .= ': El directorio no tiene permisos de escritura';
                } elseif (disk_free_space($upload_dir) < $archivo['size']) {
                    $mensaje_error .= ': No hay suficiente espacio en disco';
                } else {
                    $mensaje_error .= ': Verifique permisos del servidor y configuración de PHP';
                }
            }
            
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => $mensaje_error], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Error al procesar el icono: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => false, 'error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);


            if (!file_exists($ruta_completa)) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'error' => 'El archivo no se guardó correctamente'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            // Verificar que el archivo tiene contenido
            if (filesize($ruta_completa) === 0) {
                @unlink($ruta_completa); // Eliminar archivo vacío
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'error' => 'El archivo subido está vacío'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            // Ruta relativa para el frontend
            // La ruta debe ser /api/uploads/iconos_carpetas/... para que api/uploads.php la maneje
            $ruta_relativa = '/api/uploads/iconos_carpetas/' . $nombre_archivo;
            
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => true,
                'icono_url' => $ruta_relativa,
                'nombre_archivo' => $nombre_archivo
            ], JSON_UNESCAPED_UNICODE);
        } else {
            // Obtener el último error de PHP
            $error_php = error_get_last();
            $mensaje_error = 'Error al guardar el icono en el servidor';
            
            if ($error_php && isset($error_php['message'])) {
                $mensaje_error .= ': ' . $error_php['message'];
            } else {
                // Verificar posibles causas comunes
                if (!is_writable($upload_dir)) {
                    $mensaje_error .= ': El directorio no tiene permisos de escritura';
                } elseif (disk_free_space($upload_dir) < $archivo['size']) {
                    $mensaje_error .= ': No hay suficiente espacio en disco';
                } else {
                    $mensaje_error .= ': Verifique permisos del servidor y configuración de PHP';
                }
            }
            
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => $mensaje_error], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Error al procesar el icono: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => false, 'error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);

