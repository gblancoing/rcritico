<?php
/**
 * Script para agregar la columna parametros_reporte a la tabla informes_stockholders
 * Ejecutar una vez: http://localhost/rcritico/api/stockholders/agregar_columna_parametros.php
 */

require_once __DIR__ . '/../config/db.php';

header('Content-Type: text/html; charset=utf-8');

try {
    // Verificar si la columna ya existe
    $stmt = $pdo->query("SHOW COLUMNS FROM informes_stockholders LIKE 'parametros_reporte'");
    $existe = $stmt->rowCount() > 0;
    
    if ($existe) {
        echo "<h2>✅ La columna 'parametros_reporte' ya existe</h2>";
        echo "<p>No es necesario agregarla nuevamente.</p>";
    } else {
        // Agregar la columna
        $sql = "ALTER TABLE `informes_stockholders` 
                ADD COLUMN `parametros_reporte` JSON DEFAULT NULL 
                COMMENT 'Parámetros de personalización del reporte (secciones a incluir, filtros, etc.)' 
                AFTER `ruta_pdf`";
        
        $pdo->exec($sql);
        
        echo "<h2>✅ Columna 'parametros_reporte' agregada exitosamente</h2>";
        echo "<p>La columna ha sido agregada y está lista para usar.</p>";
    }
    
    // Mostrar estructura actualizada
    $stmt = $pdo->query("DESCRIBE informes_stockholders");
    $columnas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Estructura actualizada de la tabla:</h3>";
    echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    foreach ($columnas as $columna) {
        $highlight = $columna['Field'] === 'parametros_reporte' ? " style='background: #d4edda;'" : '';
        echo "<tr{$highlight}>";
        echo "<td><strong>{$columna['Field']}</strong></td>";
        echo "<td>{$columna['Type']}</td>";
        echo "<td>{$columna['Null']}</td>";
        echo "<td>{$columna['Key']}</td>";
        echo "<td>{$columna['Default']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (PDOException $e) {
    echo "<h2>❌ Error al agregar la columna</h2>";
    echo "<p style='color: red;'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
} catch (Exception $e) {
    echo "<h2>❌ Error inesperado</h2>";
    echo "<p style='color: red;'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>

