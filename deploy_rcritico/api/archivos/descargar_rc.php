<?php
/**
 * API para descargar toda la estructura de carpetas y archivos de un RC como ZIP
 * Mantiene la estructura de árbol de carpetas para fácil análisis en Windows
 */

// Aumentar límites para archivos grandes
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', 600);
set_time_limit(600);

// Evitar timeout del servidor web
ignore_user_abort(true);

// Desactivar compresión que puede causar timeout
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', 'Off');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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
    // Obtener información de la carpeta principal
    $stmt = $pdo->prepare("SELECT id, nombre FROM carpetas WHERE id = ? AND activo = 1");
    $stmt->execute([$carpeta_id]);
    $carpetaPrincipal = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$carpetaPrincipal) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Carpeta no encontrada'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Crear nombre seguro para el ZIP
    $nombreRC = preg_replace('/[^a-zA-Z0-9_-]/', '_', $carpetaPrincipal['nombre']);
    $fechaHoy = date('Y-m-d_H-i');
    $nombreZip = "{$nombreRC}_{$fechaHoy}.zip";
    
    // Crear archivo ZIP temporal
    $tempDir = sys_get_temp_dir();
    $zipPath = $tempDir . DIRECTORY_SEPARATOR . $nombreZip;
    
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
        throw new Exception("No se pudo crear el archivo ZIP");
    }
    
    // Usar compresión rápida para evitar timeout
    $zip->setCompressionIndex(0, ZipArchive::CM_STORE); // Sin compresión = más rápido
    
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
    
    // Procesar la carpeta principal
    $nombreCarpetaRaiz = preg_replace('/[^a-zA-Z0-9_\- áéíóúÁÉÍÓÚñÑ]/', '_', $carpetaPrincipal['nombre']);
    agregarCarpetaAlZip($pdo, $zip, $carpeta_id, $nombreCarpetaRaiz, $baseDir);
    
    // Agregar un archivo README
    $readme = "=== RESPALDO DE {$carpetaPrincipal['nombre']} ===\n\n";
    $readme .= "Fecha de exportación: " . date('d/m/Y H:i:s') . "\n";
    $readme .= "Carpeta ID: {$carpeta_id}\n\n";
    $readme .= "Estructura:\n";
    $readme .= "- /Archivos: Archivos de la pestaña Archivos\n";
    $readme .= "- /Linea_Base: Evidencias de controles preventivos\n";
    $readme .= "- /Linea_Base_Mitigadores: Evidencias de controles mitigadores\n";
    $readme .= "- /Foro: Archivos adjuntos del foro\n";
    $readme .= "- Subcarpetas: Contienen la misma estructura\n";
    
    $zip->addFromString($nombreCarpetaRaiz . '/_LEEME.txt', $readme);
    
    // Cerrar ZIP
    $numArchivos = $zip->numFiles;
    $zip->close();
    
    // Verificar que el ZIP se creó
    if (!file_exists($zipPath) || filesize($zipPath) === 0) {
        throw new Exception("El archivo ZIP está vacío o no se pudo crear");
    }
    
    // Enviar archivo ZIP
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $nombreZip . '"');
    header('Content-Length: ' . filesize($zipPath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: public');
    
    // Limpiar buffer de salida
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    readfile($zipPath);
    
    // Eliminar archivo temporal
    @unlink($zipPath);
    
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error al generar ZIP: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>

