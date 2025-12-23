<?php
/**
 * Script para exportar la base de datos local y prepararla para producción
 * 
 * USO:
 * 1. Ejecutar desde navegador: http://localhost/rcritico/api/database/exportar_para_produccion.php
 * 2. O desde línea de comandos: php api/database/exportar_para_produccion.php
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
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Exportar para Producción</title>";
    echo "<style>body{font-family:Arial,sans-serif;max-width:1200px;margin:20px auto;padding:20px;}";
    echo ".success{color:#28a745;}.error{color:#dc3545;}.warning{color:#ffc107;}.info{color:#17a2b8;}";
    echo "pre{background:#f8f9fa;padding:15px;border-radius:5px;overflow-x:auto;}";
    echo "h2{color:#17a2b8;border-bottom:2px solid #17a2b8;padding-bottom:10px;}</style></head><body>";
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
    logMessage("Iniciando exportación de base de datos local...", 'info');
    
    // Conectar a la base de datos local
    $pdo = new PDO(
        "mysql:host={$configLocal['host']};dbname={$configLocal['dbname']};charset=utf8mb4",
        $configLocal['user'],
        $configLocal['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    logMessage("Conexión a base de datos local exitosa", 'success');
    
    // Obtener todas las tablas
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    logMessage("Encontradas " . count($tables) . " tablas", 'info');
    
    // Crear el contenido del SQL
    $sqlContent = "-- ============================================\n";
    $sqlContent .= "-- EXPORTACIÓN PARA PRODUCCIÓN\n";
    $sqlContent .= "-- Base de datos: {$configLocal['dbname']} -> {$configProduccion['dbname']}\n";
    $sqlContent .= "-- Fecha: " . date('Y-m-d H:i:s') . "\n";
    $sqlContent .= "-- ============================================\n\n";
    $sqlContent .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
    $sqlContent .= "SET AUTOCOMMIT = 0;\n";
    $sqlContent .= "START TRANSACTION;\n";
    $sqlContent .= "SET time_zone = \"+00:00\";\n\n";
    $sqlContent .= "-- Desactivar verificación de claves foráneas temporalmente\n";
    $sqlContent .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";
    
    // Exportar estructura y datos de cada tabla
    foreach ($tables as $table) {
        logMessage("Exportando tabla: $table", 'info');
        
        // Obtener estructura de la tabla
        $createTable = $pdo->query("SHOW CREATE TABLE `$table`")->fetch();
        $sqlContent .= "\n-- ============================================\n";
        $sqlContent .= "-- Estructura de tabla: `$table`\n";
        $sqlContent .= "-- ============================================\n\n";
        $sqlContent .= "DROP TABLE IF EXISTS `$table`;\n";
        $sqlContent .= $createTable['Create Table'] . ";\n\n";
        
        // Obtener datos de la tabla
        $stmt = $pdo->query("SELECT * FROM `$table`");
        $rows = $stmt->fetchAll();
        
        if (count($rows) > 0) {
            $sqlContent .= "-- Datos de la tabla: `$table`\n";
            
            // Obtener nombres de columnas
            $columns = array_keys($rows[0]);
            $columnNames = '`' . implode('`, `', $columns) . '`';
            
            // Insertar datos en lotes para mejor rendimiento
            $batchSize = 100;
            $totalRows = count($rows);
            
            for ($i = 0; $i < $totalRows; $i += $batchSize) {
                $batch = array_slice($rows, $i, $batchSize);
                $sqlContent .= "INSERT INTO `$table` ($columnNames) VALUES\n";
                
                $values = [];
                foreach ($batch as $row) {
                    $rowValues = [];
                    foreach ($row as $value) {
                        if ($value === null) {
                            $rowValues[] = 'NULL';
                        } else {
                            // Escapar comillas y caracteres especiales
                            $escaped = $pdo->quote($value);
                            $rowValues[] = $escaped;
                        }
                    }
                    $values[] = '(' . implode(', ', $rowValues) . ')';
                }
                
                $sqlContent .= implode(",\n", $values) . ";\n\n";
            }
            
            logMessage("  → " . count($rows) . " filas exportadas", 'success');
        } else {
            $sqlContent .= "-- La tabla `$table` está vacía\n\n";
            logMessage("  → Tabla vacía", 'warning');
        }
    }
    
    // Reactivar verificación de claves foráneas
    $sqlContent .= "\n-- Reactivar verificación de claves foráneas\n";
    $sqlContent .= "SET FOREIGN_KEY_CHECKS = 1;\n\n";
    $sqlContent .= "COMMIT;\n";
    
    // Guardar archivo
    $filename = 'exportacion_produccion_' . date('Y-m-d_His') . '.sql';
    $filepath = __DIR__ . '/' . $filename;
    
    file_put_contents($filepath, $sqlContent);
    
    $fileSize = filesize($filepath);
    $fileSizeMB = round($fileSize / 1024 / 1024, 2);
    
    logMessage("Exportación completada exitosamente!", 'success');
    logMessage("Archivo generado: $filename", 'info');
    logMessage("Tamaño: $fileSizeMB MB", 'info');
    logMessage("Ubicación: $filepath", 'info');
    
    // Mostrar información adicional
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

