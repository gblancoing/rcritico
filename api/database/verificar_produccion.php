<?php
/**
 * Script para verificar el estado de la base de datos de producción
 * Compara estructura y datos entre local y producción
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
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Verificar Producción</title>";
    echo "<style>body{font-family:Arial,sans-serif;max-width:1200px;margin:20px auto;padding:20px;}";
    echo ".success{color:#28a745;}.error{color:#dc3545;}.warning{color:#ffc107;}.info{color:#17a2b8;}";
    echo "table{border-collapse:collapse;width:100%;margin:20px 0;}";
    echo "th,td{border:1px solid #ddd;padding:8px;text-align:left;}";
    echo "th{background:#17a2b8;color:white;}";
    echo "tr:nth-child(even){background:#f8f9fa;}</style></head><body>";
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
    logMessage("Conectando a base de datos LOCAL...", 'info');
    $pdoLocal = new PDO(
        "mysql:host={$configLocal['host']};dbname={$configLocal['dbname']};charset=utf8mb4",
        $configLocal['user'],
        $configLocal['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    logMessage("Conexión local exitosa", 'success');
    
    logMessage("Conectando a base de datos PRODUCCIÓN...", 'info');
    $pdoProd = new PDO(
        "mysql:host={$configProduccion['host']};dbname={$configProduccion['dbname']};charset=utf8mb4",
        $configProduccion['user'],
        $configProduccion['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    logMessage("Conexión producción exitosa", 'success');
    
    // Obtener tablas de local
    $stmt = $pdoLocal->query("SHOW TABLES");
    $tablesLocal = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Obtener tablas de producción
    $stmt = $pdoProd->query("SHOW TABLES");
    $tablesProd = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "\n<h2>Comparación de Tablas</h2>\n";
    echo "<table>\n";
    echo "<tr><th>Tabla</th><th>Local (filas)</th><th>Producción (filas)</th><th>Estado</th></tr>\n";
    
    $allTables = array_unique(array_merge($tablesLocal, $tablesProd));
    sort($allTables);
    
    foreach ($allTables as $table) {
        $inLocal = in_array($table, $tablesLocal);
        $inProd = in_array($table, $tablesProd);
        
        $countLocal = 0;
        $countProd = 0;
        
        if ($inLocal) {
            try {
                $stmt = $pdoLocal->query("SELECT COUNT(*) as cnt FROM `$table`");
                $countLocal = $stmt->fetch()['cnt'];
            } catch (Exception $e) {
                $countLocal = 'Error';
            }
        }
        
        if ($inProd) {
            try {
                $stmt = $pdoProd->query("SELECT COUNT(*) as cnt FROM `$table`");
                $countProd = $stmt->fetch()['cnt'];
            } catch (Exception $e) {
                $countProd = 'Error';
            }
        }
        
        $status = '';
        $statusClass = '';
        
        if (!$inLocal && $inProd) {
            $status = 'Solo en producción';
            $statusClass = 'warning';
        } elseif ($inLocal && !$inProd) {
            $status = 'Solo en local (se creará)';
            $statusClass = 'info';
        } elseif ($countLocal != $countProd) {
            $status = 'Diferente cantidad de filas';
            $statusClass = 'warning';
        } else {
            $status = 'OK';
            $statusClass = 'success';
        }
        
        echo "<tr>";
        echo "<td><strong>$table</strong></td>";
        echo "<td>" . ($inLocal ? number_format($countLocal) : '-') . "</td>";
        echo "<td>" . ($inProd ? number_format($countProd) : '-') . "</td>";
        echo "<td class='$statusClass'>$status</td>";
        echo "</tr>\n";
    }
    
    echo "</table>\n";
    
    // Resumen
    echo "\n<h2>Resumen</h2>\n";
    logMessage("Tablas en local: " . count($tablesLocal), 'info');
    logMessage("Tablas en producción: " . count($tablesProd), 'info');
    logMessage("Tablas solo en local: " . count(array_diff($tablesLocal, $tablesProd)), 'warning');
    logMessage("Tablas solo en producción: " . count(array_diff($tablesProd, $tablesLocal)), 'warning');
    
    echo "\n";
    logMessage("Verificación completada", 'success');
    
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

