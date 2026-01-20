<?php
/**
 * API para descargar toda la estructura de carpetas y archivos de un RC como ZIP
 * Mantiene la estructura de árbol de carpetas para fácil análisis en Windows
 */

// CRÍTICO: Desactivar errores que puedan generar output antes de headers
error_reporting(0);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CRÍTICO: Limpiar cualquier output buffer existente
while (ob_get_level()) {
    ob_end_clean();
}

// Aumentar límites para archivos grandes - sin limitaciones
ini_set('memory_limit', '2048M');
ini_set('max_execution_time', 0); // Sin límite de tiempo
set_time_limit(0); // Sin límite de tiempo
ini_set('max_input_time', 0);
ini_set('post_max_size', '0');
ini_set('upload_max_filesize', '0');

// Evitar timeout del servidor web
ignore_user_abort(true);

// CRÍTICO: Desactivar TODA compresión de salida que puede corromper el ZIP binario
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', 'Off');
@ini_set('output_buffering', 'Off');
@ini_set('output_compression', 'Off');
if (function_exists('ini_set')) {
    @ini_set('zlib.output_compression', 'Off');
}

// Headers CORS solo para OPTIONS (no para la descarga del ZIP)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : 0;

if (!$carpeta_id) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'carpeta_id es requerido'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Función para obtener el nivel de una carpeta
    function obtenerNivelCarpeta($pdo, $carpeta_id) {
        $nivel = 1;
        $carpeta_actual_id = $carpeta_id;
        
        while ($carpeta_actual_id) {
            $stmt = $pdo->prepare("SELECT carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
            $stmt->execute([$carpeta_actual_id]);
            $padre = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($padre && $padre['carpeta_padre_id']) {
                $nivel++;
                $carpeta_actual_id = $padre['carpeta_padre_id'];
            } else {
                break;
            }
        }
        
        return $nivel;
    }
    
    // Obtener información de la carpeta principal
    $stmt = $pdo->prepare("SELECT id, nombre, carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
    $stmt->execute([$carpeta_id]);
    $carpetaPrincipal = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$carpetaPrincipal) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Carpeta no encontrada'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Determinar el nivel de la carpeta
    $nivelCarpeta = obtenerNivelCarpeta($pdo, $carpeta_id);
    
    // Si es nivel 1, obtener la carpeta padre (nivel 0) para incluir todo
    $carpetaIdInicio = $carpeta_id;
    $carpetaNombreInicio = $carpetaPrincipal['nombre'];
    
    if ($nivelCarpeta === 1 && $carpetaPrincipal['carpeta_padre_id']) {
        // Obtener carpeta nivel 0 (padre)
        $stmtPadre = $pdo->prepare("SELECT id, nombre FROM carpetas WHERE id = ? AND activo = 1");
        $stmtPadre->execute([$carpetaPrincipal['carpeta_padre_id']]);
        $carpetaNivel0 = $stmtPadre->fetch(PDO::FETCH_ASSOC);
        
        if ($carpetaNivel0) {
            // Usar la carpeta nivel 0 como raíz
            $carpetaIdInicio = $carpetaNivel0['id'];
            $carpetaNombreInicio = $carpetaNivel0['nombre'];
        }
    }
    
    // Crear nombre seguro para el ZIP usando la carpeta de inicio (nivel 0 si es nivel 1)
    $nombreRC = preg_replace('/[^a-zA-Z0-9_-]/', '_', $carpetaNombreInicio);
    $fechaHoy = date('Y-m-d_H-i');
    $nombreZip = "{$nombreRC}_{$fechaHoy}.zip";
    
    // Crear archivo ZIP temporal
    $tempDir = sys_get_temp_dir();
    $zipPath = $tempDir . DIRECTORY_SEPARATOR . $nombreZip;
    
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
        throw new Exception("No se pudo crear el archivo ZIP");
    }
    
    // Usar compresión mínima para balance entre velocidad y tamaño
    // CM_DEFLATE con nivel 1 es rápido pero aún reduce el tamaño
    // Configuramos esto después de agregar cada archivo
    
    // Directorio base para los archivos
    $baseDir = dirname(dirname(__DIR__));
    
    // Función recursiva para agregar carpetas y archivos al ZIP
    function agregarCarpetaAlZip($pdo, $zip, $carpetaId, $rutaEnZip, $baseDir) {
        // Agregar archivos de esta carpeta (tabla archivos)
        $stmt = $pdo->prepare("
            SELECT nombre_original, ruta_archivo 
            FROM archivos 
            WHERE carpeta_id = ? AND activo = 1
        ");
        $stmt->execute([$carpetaId]);
        $archivos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($archivos as $archivo) {
            // Construir ruta física del archivo
            $rutaRelativa = $archivo['ruta_archivo'];
            
            // Convertir ruta de API a ruta física
            if (strpos($rutaRelativa, '/api/uploads/') === 0) {
                $rutaFisica = $baseDir . '/api/archivos/uploads' . str_replace('/api/uploads', '', $rutaRelativa);
            } elseif (strpos($rutaRelativa, '/api/archivos/uploads/') === 0) {
                $rutaFisica = $baseDir . $rutaRelativa;
            } else {
                $rutaFisica = $baseDir . '/' . ltrim($rutaRelativa, '/');
            }
            
            if (file_exists($rutaFisica)) {
                $nombreEnZip = $rutaEnZip . '/Archivos/' . $archivo['nombre_original'];
                $zip->addFile($rutaFisica, $nombreEnZip);
            }
        }
        
        // Agregar archivos de carpetas de archivos (tabla archivos_carpetas)
        agregarArchivosCarpetasAlZip($pdo, $zip, $carpetaId, $rutaEnZip . '/Archivos', $baseDir, null);
        
        // Agregar archivos de Línea Base
        agregarLineaBaseAlZip($pdo, $zip, $carpetaId, $rutaEnZip, $baseDir);
        
        // Agregar archivos del Foro
        agregarForoAlZip($pdo, $zip, $carpetaId, $rutaEnZip, $baseDir);
        
        // Procesar subcarpetas recursivamente
        $stmt = $pdo->prepare("
            SELECT id, nombre 
            FROM carpetas 
            WHERE carpeta_padre_id = ? AND activo = 1
            ORDER BY nombre
        ");
        $stmt->execute([$carpetaId]);
        $subcarpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($subcarpetas as $subcarpeta) {
            $nombreSubcarpeta = preg_replace('/[^a-zA-Z0-9_\- áéíóúÁÉÍÓÚñÑ]/', '_', $subcarpeta['nombre']);
            $nuevaRuta = $rutaEnZip . '/' . $nombreSubcarpeta;
            agregarCarpetaAlZip($pdo, $zip, $subcarpeta['id'], $nuevaRuta, $baseDir);
        }
    }
    
    // Función para agregar archivos de carpetas de archivos
    function agregarArchivosCarpetasAlZip($pdo, $zip, $carpetaId, $rutaEnZip, $baseDir, $carpetaPadreId) {
        // Verificar si existe la tabla archivos_carpetas
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'archivos_carpetas'");
            if ($stmt->rowCount() === 0) return;
        } catch (Exception $e) {
            return;
        }
        
        // Obtener carpetas de archivos
        if ($carpetaPadreId === null) {
            $stmt = $pdo->prepare("
                SELECT id, nombre 
                FROM archivos_carpetas 
                WHERE carpeta_id = ? AND carpeta_padre_id IS NULL AND activo = 1
                ORDER BY nombre
            ");
            $stmt->execute([$carpetaId]);
        } else {
            $stmt = $pdo->prepare("
                SELECT id, nombre 
                FROM archivos_carpetas 
                WHERE carpeta_padre_id = ? AND activo = 1
                ORDER BY nombre
            ");
            $stmt->execute([$carpetaPadreId]);
        }
        
        $carpetasArchivos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($carpetasArchivos as $carpetaArchivo) {
            $nombreCarpeta = preg_replace('/[^a-zA-Z0-9_\- áéíóúÁÉÍÓÚñÑ]/', '_', $carpetaArchivo['nombre']);
            $rutaCarpeta = $rutaEnZip . '/' . $nombreCarpeta;
            
            // Obtener archivos de esta carpeta de archivos
            $stmtArchivos = $pdo->prepare("
                SELECT nombre_original, ruta_archivo 
                FROM archivos 
                WHERE archivos_carpeta_id = ? AND activo = 1
            ");
            $stmtArchivos->execute([$carpetaArchivo['id']]);
            $archivos = $stmtArchivos->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($archivos as $archivo) {
                $rutaRelativa = $archivo['ruta_archivo'];
                
                if (strpos($rutaRelativa, '/api/uploads/') === 0) {
                    $rutaFisica = $baseDir . '/api/archivos/uploads' . str_replace('/api/uploads', '', $rutaRelativa);
                } elseif (strpos($rutaRelativa, '/api/archivos/uploads/') === 0) {
                    $rutaFisica = $baseDir . $rutaRelativa;
                } else {
                    $rutaFisica = $baseDir . '/' . ltrim($rutaRelativa, '/');
                }
                
                if (file_exists($rutaFisica)) {
                    $nombreEnZip = $rutaCarpeta . '/' . $archivo['nombre_original'];
                    $zip->addFile($rutaFisica, $nombreEnZip);
                }
            }
            
            // Recursión para subcarpetas de archivos
            agregarArchivosCarpetasAlZip($pdo, $zip, $carpetaId, $rutaCarpeta, $baseDir, $carpetaArchivo['id']);
        }
    }
    
    // Función para agregar archivos de Línea Base
    function agregarLineaBaseAlZip($pdo, $zip, $carpetaId, $rutaEnZip, $baseDir) {
        // Verificar si existen las tablas
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'carpeta_linea_base'");
            if ($stmt->rowCount() === 0) return;
        } catch (Exception $e) {
            return;
        }
        
        // Obtener líneas base (preventivos)
        $stmt = $pdo->prepare("
            SELECT id, codigo, dimension, pregunta
            FROM carpeta_linea_base 
            WHERE carpeta_id = ?
        ");
        $stmt->execute([$carpetaId]);
        $lineasBase = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($lineasBase as $lb) {
            // Obtener carpetas de esta línea base
            $stmtCarpetas = $pdo->prepare("
                SELECT id, nombre
                FROM linea_base_carpetas
                WHERE linea_base_id = ? AND activo = 1
            ");
            $stmtCarpetas->execute([$lb['id']]);
            $carpetasLB = $stmtCarpetas->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($carpetasLB as $carpetaLB) {
                // Obtener archivos de esta carpeta
                $stmtArchivos = $pdo->prepare("
                    SELECT nombre_original, ruta
                    FROM linea_base_archivos
                    WHERE carpeta_id = ? AND activo = 1
                ");
                $stmtArchivos->execute([$carpetaLB['id']]);
                $archivosLB = $stmtArchivos->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($archivosLB as $archivo) {
                    $rutaFisica = $baseDir . '/' . ltrim($archivo['ruta'], '/');
                    
                    if (file_exists($rutaFisica)) {
                        $codigoLimpio = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $lb['codigo']);
                        $carpetaLimpia = preg_replace('/[^a-zA-Z0-9_\- áéíóúÁÉÍÓÚñÑ]/', '_', $carpetaLB['nombre']);
                        $nombreEnZip = $rutaEnZip . '/Linea_Base/' . $codigoLimpio . '/' . $carpetaLimpia . '/' . $archivo['nombre_original'];
                        $zip->addFile($rutaFisica, $nombreEnZip);
                    }
                }
            }
        }
        
        // Obtener líneas base mitigadores
        try {
            $stmt = $pdo->prepare("
                SELECT id, codigo, dimension, pregunta
                FROM carpeta_linea_base_mitigadores 
                WHERE carpeta_id = ?
            ");
            $stmt->execute([$carpetaId]);
            $lineasBaseMit = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($lineasBaseMit as $lb) {
                $stmtCarpetas = $pdo->prepare("
                    SELECT id, nombre
                    FROM linea_base_carpetas
                    WHERE linea_base_id = ? AND activo = 1
                ");
                $stmtCarpetas->execute([$lb['id']]);
                $carpetasLB = $stmtCarpetas->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($carpetasLB as $carpetaLB) {
                    $stmtArchivos = $pdo->prepare("
                        SELECT nombre_original, ruta
                        FROM linea_base_archivos
                        WHERE carpeta_id = ? AND activo = 1
                    ");
                    $stmtArchivos->execute([$carpetaLB['id']]);
                    $archivosLB = $stmtArchivos->fetchAll(PDO::FETCH_ASSOC);
                    
                    foreach ($archivosLB as $archivo) {
                        $rutaFisica = $baseDir . '/' . ltrim($archivo['ruta'], '/');
                        
                        if (file_exists($rutaFisica)) {
                            $codigoLimpio = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $lb['codigo']);
                            $carpetaLimpia = preg_replace('/[^a-zA-Z0-9_\- áéíóúÁÉÍÓÚñÑ]/', '_', $carpetaLB['nombre']);
                            $nombreEnZip = $rutaEnZip . '/Linea_Base_Mitigadores/' . $codigoLimpio . '/' . $carpetaLimpia . '/' . $archivo['nombre_original'];
                            $zip->addFile($rutaFisica, $nombreEnZip);
                        }
                    }
                }
            }
        } catch (Exception $e) {
            // Tabla no existe, continuar
        }
    }
    
    // Función para agregar archivos del Foro
    function agregarForoAlZip($pdo, $zip, $carpetaId, $rutaEnZip, $baseDir) {
        // Obtener mensajes del foro que tienen archivos adjuntos
        $stmt = $pdo->prepare("
            SELECT conversacion_seguimiento
            FROM carpeta_linea_base
            WHERE carpeta_id = ? AND conversacion_seguimiento IS NOT NULL AND conversacion_seguimiento != ''
        ");
        $stmt->execute([$carpetaId]);
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($resultados as $row) {
            $mensajes = json_decode($row['conversacion_seguimiento'], true);
            if (!is_array($mensajes)) continue;
            
            foreach ($mensajes as $mensaje) {
                if (isset($mensaje['archivos']) && is_array($mensaje['archivos'])) {
                    foreach ($mensaje['archivos'] as $archivo) {
                        if (isset($archivo['ruta'])) {
                            $rutaFisica = $baseDir . '/' . ltrim($archivo['ruta'], '/');
                            
                            if (file_exists($rutaFisica)) {
                                $nombreArchivo = isset($archivo['nombre']) ? $archivo['nombre'] : basename($archivo['ruta']);
                                $nombreEnZip = $rutaEnZip . '/Foro/' . $nombreArchivo;
                                $zip->addFile($rutaFisica, $nombreEnZip);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Procesar desde la carpeta de inicio (nivel 0 si se descarga desde nivel 1)
    $nombreCarpetaRaiz = preg_replace('/[^a-zA-Z0-9_\- áéíóúÁÉÍÓÚñÑ]/', '_', $carpetaNombreInicio);
    agregarCarpetaAlZip($pdo, $zip, $carpetaIdInicio, $nombreCarpetaRaiz, $baseDir);
    
    // Agregar un archivo README
    $readme = "=== RESPALDO DE {$carpetaNombreInicio} ===\n\n";
    $readme .= "Fecha de exportación: " . date('d/m/Y H:i:s') . "\n";
    $readme .= "Carpeta ID de inicio: {$carpetaIdInicio}\n";
    if ($nivelCarpeta === 1) {
        $readme .= "Carpeta ID solicitada (Nivel 1): {$carpeta_id}\n";
        $readme .= "NOTA: Se incluyó toda la estructura desde el Nivel 0 hacia abajo\n";
    }
    $readme .= "\nEstructura:\n";
    $readme .= "- /Archivos: Archivos de la pestaña Archivos\n";
    $readme .= "- /Linea_Base: Evidencias de controles preventivos\n";
    $readme .= "- /Linea_Base_Mitigadores: Evidencias de controles mitigadores\n";
    $readme .= "- /Foro: Archivos adjuntos del foro\n";
    $readme .= "- Subcarpetas: Contienen la misma estructura\n";
    
    $zip->addFromString($nombreCarpetaRaiz . '/_LEEME.txt', $readme);
    
    // Cerrar ZIP correctamente
    $numArchivos = $zip->numFiles;
    $closeResult = $zip->close();
    
    if (!$closeResult) {
        // Intentar eliminar el archivo corrupto si existe
        @unlink($zipPath);
        throw new Exception("Error al cerrar el archivo ZIP. Código de error: " . $zip->getStatusString());
    }
    
    // Verificar que el ZIP se creó y es válido
    if (!file_exists($zipPath)) {
        throw new Exception("El archivo ZIP no se pudo crear en: " . $zipPath);
    }
    
    $fileSizeCheck = filesize($zipPath);
    if ($fileSizeCheck === 0 || $fileSizeCheck === false) {
        @unlink($zipPath);
        throw new Exception("El archivo ZIP está vacío o no se pudo crear correctamente");
    }
    
    // Validar que el ZIP no esté corrupto intentando abrirlo
    $testZip = new ZipArchive();
    $testResult = $testZip->open($zipPath, ZipArchive::CHECKCONS);
    if ($testResult !== TRUE) {
        @unlink($zipPath);
        throw new Exception("El archivo ZIP está corrupto. Código de error: " . $testResult);
    }
    $testZip->close();
    
    // Obtener tamaño del archivo ANTES de limpiar buffers
    $fileSize = filesize($zipPath);
    
    // CRÍTICO: Deshabilitar compresión de salida ANTES de limpiar buffers
    if (function_exists('apache_setenv')) {
        @apache_setenv('no-gzip', '1');
    }
    @ini_set('zlib.output_compression', 'Off');
    if (function_exists('ini_set')) {
        @ini_set('output_buffering', 'Off');
        @ini_set('output_compression', 'Off');
    }
    
    // CRÍTICO: Limpiar TODOS los buffers de salida
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Desactivar cualquier compresión adicional
    if (function_exists('apache_setenv')) {
        @apache_setenv('no-gzip', '1');
    }
    
    // Enviar headers en el orden correcto (sin Access-Control antes de Content-Type)
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . addslashes($nombreZip) . '"');
    header('Content-Length: ' . $fileSize);
    header('Cache-Control: no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header("Access-Control-Allow-Origin: *");
    
    // Asegurar que no hay output antes de enviar el archivo
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    
    // Leer y enviar el archivo
    $handle = @fopen($zipPath, 'rb');
    if ($handle === false) {
        throw new Exception("No se pudo abrir el archivo ZIP para lectura");
    }
    
    // Enviar el archivo en chunks (8KB es más seguro para evitar problemas)
    $chunkSize = 8192; // 8KB chunks
    $sent = 0;
    while (!feof($handle)) {
        $chunk = @fread($handle, $chunkSize);
        if ($chunk === false) {
            break;
        }
        if (strlen($chunk) > 0) {
            echo $chunk;
            $sent += strlen($chunk);
            // Flush sin ob_flush para evitar problemas
            if (function_exists('fastcgi_finish_request')) {
                // Para FastCGI
                flush();
            } else {
                // Para mod_php
                flush();
            }
        }
    }
    fclose($handle);
    
    // Verificar que se envió todo el archivo
    if ($sent !== $fileSize) {
        // Log del error pero no lanzar excepción (ya se envió parte)
        error_log("Warning: ZIP parcial enviado. Esperado: $fileSize, Enviado: $sent");
    }
    
    // Eliminar archivo temporal después de enviarlo
    @unlink($zipPath);
    
    // Asegurar que no hay más output
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }
    
    exit; // Importante: salir después de enviar el archivo
    
} catch (Exception $e) {
    // Limpiar buffer antes de enviar error
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Log del error para debugging (opcional, descomentar si es necesario)
    // error_log("Error en descargar_rc.php: " . $e->getMessage() . " | Trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header("Access-Control-Allow-Origin: *");
    
    // Mensaje de error más informativo en desarrollo, mensaje genérico en producción
    $mensajeError = 'Error al generar ZIP: ' . $e->getMessage();
    if (strpos($_SERVER['HTTP_HOST'], 'localhost') === false && strpos($_SERVER['HTTP_HOST'], '127.0.0.1') === false) {
        // Producción - mensaje genérico
        $mensajeError = 'Error al generar el archivo ZIP. Por favor, contacte al administrador.';
    }
    
    echo json_encode(['error' => $mensajeError], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Throwable $e) {
    // Capturar cualquier otro tipo de error (PHP 7+)
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header("Access-Control-Allow-Origin: *");
    
    $mensajeError = 'Error al generar ZIP: ' . $e->getMessage();
    if (strpos($_SERVER['HTTP_HOST'], 'localhost') === false && strpos($_SERVER['HTTP_HOST'], '127.0.0.1') === false) {
        $mensajeError = 'Error al generar el archivo ZIP. Por favor, contacte al administrador.';
    }
    
    echo json_encode(['error' => $mensajeError], JSON_UNESCAPED_UNICODE);
    exit;
}
?>

