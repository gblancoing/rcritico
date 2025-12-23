<?php
/**
 * Script para exportar usando mysqldump (más eficiente para bases de datos grandes)
 * 
 * USO:
 * php api/database/exportar_mysqldump.php
 */

// Configuración
$configLocal = [
    'host' => 'localhost',
    'user' => 'root',
    'pass' => '',
    'dbname' => 'rcritico'
];

$configProduccion = [
    'host' => 'localhost',
    'user' => 'carenvpc_rcritico',
    'pass' => 'O$AR-B5R2v',
    'dbname' => 'carenvpc_rcritico'
];

// Headers para navegador
if (php_sapi_name() !== 'cli') {
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Exportar con mysqldump</title>";
    echo "<style>body{font-family:Arial,sans-serif;max-width:1200px;margin:20px auto;padding:20px;}";
    echo ".success{color:#28a745;}.error{color:#dc3545;}.warning{color:#ffc107;}.info{color:#17a2b8;}";
    echo "pre{background:#f8f9fa;padding:15px;border-radius:5px;overflow-x:auto;}</style></head><body>";
}

function logMessage($message, $type = 'info') {
    $prefix = '';
    switch($type) {
        case 'success': $prefix = '✓ '; break;
        case 'error': $prefix = '✗ '; break;
        case 'warning': $prefix = '⚠ '; break;
        default: $prefix = 'ℹ '; break;
    }
    
    if (php_sapi_name() === 'cli') {
        echo $prefix . $message . "\n";
    } else {
        $class = $type;
        echo "<div class='$class'><strong>$prefix</strong> $message</div>\n";
    }
}

try {
    logMessage("Buscando mysqldump...", 'info');
    
    // Buscar mysqldump en ubicaciones comunes
    $mysqldumpPaths = [
        'mysqldump', // En PATH
        'C:\\xampp\\mysql\\bin\\mysqldump.exe', // XAMPP Windows
        'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
        'C:\\Program Files\\xampp\\mysql\\bin\\mysqldump.exe',
        '/usr/bin/mysqldump', // Linux
        '/usr/local/bin/mysqldump', // macOS
    ];
    
    $mysqldump = null;
    foreach ($mysqldumpPaths as $path) {
        if (file_exists($path) || ($path === 'mysqldump' && shell_exec("where mysqldump 2>nul") !== null)) {
            $mysqldump = $path;
            break;
        }
    }
    
    if (!$mysqldump) {
        // Intentar encontrar en PATH
        $output = shell_exec("where mysqldump 2>nul");
        if ($output) {
            $mysqldump = trim(explode("\n", $output)[0]);
        }
    }
    
    if (!$mysqldump) {
        throw new Exception("mysqldump no encontrado. Por favor, instálalo o usa exportar_para_produccion.php");
    }
    
    logMessage("mysqldump encontrado: $mysqldump", 'success');
    
    // Generar nombre de archivo
    $filename = 'exportacion_produccion_' . date('Y-m-d_His') . '.sql';
    $filepath = __DIR__ . '/' . $filename;
    
    // Construir comando mysqldump
    $command = sprintf(
        '"%s" --host=%s --user=%s %s --default-character-set=utf8mb4 --single-transaction --routines --triggers %s > "%s"',
        $mysqldump,
        escapeshellarg($configLocal['host']),
        escapeshellarg($configLocal['user']),
        $configLocal['pass'] ? '--password=' . escapeshellarg($configLocal['pass']) : '',
        escapeshellarg($configLocal['dbname']),
        $filepath
    );
    
    logMessage("Ejecutando mysqldump...", 'info');
    logMessage("Comando: " . str_replace($configLocal['pass'], '***', $command), 'info');
    
    // Ejecutar comando
    $output = [];
    $returnVar = 0;
    exec($command . ' 2>&1', $output, $returnVar);
    
    if ($returnVar !== 0) {
        throw new Exception("Error al ejecutar mysqldump:\n" . implode("\n", $output));
    }
    
    if (!file_exists($filepath) || filesize($filepath) === 0) {
        throw new Exception("El archivo generado está vacío o no se creó");
    }
    
    $fileSize = filesize($filepath);
    $fileSizeMB = round($fileSize / 1024 / 1024, 2);
    
    logMessage("Exportación completada exitosamente!", 'success');
    logMessage("Archivo generado: $filename", 'info');
    logMessage("Tamaño: $fileSizeMB MB", 'info');
    logMessage("Ubicación: $filepath", 'info');
    
    // Agregar comentario al inicio del archivo
    $header = "-- ============================================\n";
    $header .= "-- EXPORTACIÓN PARA PRODUCCIÓN (mysqldump)\n";
    $header .= "-- Base de datos: {$configLocal['dbname']} -> {$configProduccion['dbname']}\n";
    $header .= "-- Fecha: " . date('Y-m-d H:i:s') . "\n";
    $header .= "-- ============================================\n\n";
    
    $content = file_get_contents($filepath);
    file_put_contents($filepath, $header . $content);
    
    echo "\n";
    logMessage("INSTRUCCIONES PARA IMPORTAR EN PRODUCCIÓN:", 'warning');
    echo "\n";
    echo "1. Accede a phpMyAdmin en tu servidor de producción\n";
    echo "2. Selecciona la base de datos: {$configProduccion['dbname']}\n";
    echo "3. Ve a la pestaña 'Importar'\n";
    echo "4. Selecciona el archivo: $filename\n";
    echo "5. Asegúrate de que 'Formato' esté en 'SQL'\n";
    echo "6. Haz clic en 'Continuar'\n";
    echo "\n";
    echo "⚠️  ADVERTENCIA: Esto reemplazará TODOS los datos existentes en producción.\n";
    echo "   Asegúrate de hacer un backup de producción antes de importar.\n";
    echo "\n";
    
    // Opción para descargar el archivo si se ejecuta desde navegador
    if (php_sapi_name() !== 'cli') {
        echo "<div style='margin-top:20px;padding:15px;background:#e7f3ff;border-radius:5px;'>";
        echo "<h3>Descargar archivo SQL</h3>";
        echo "<a href='$filename' download style='display:inline-block;padding:10px 20px;background:#17a2b8;color:white;text-decoration:none;border-radius:5px;'>";
        echo "📥 Descargar $filename</a>";
        echo "</div>";
    }
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage(), 'error');
    if (php_sapi_name() !== 'cli') {
        echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
    }
    exit(1);
}

if (php_sapi_name() !== 'cli') {
    echo "</body></html>";
}
?>

