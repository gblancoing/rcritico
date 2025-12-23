<?php
/**
 * Script para crear la tabla informes_stockholders si no existe
 * Ejecutar una vez: http://localhost/rcritico/api/stockholders/crear_tabla.php
 */

require_once __DIR__ . '/../config/db.php';

header('Content-Type: text/html; charset=utf-8');

try {
    // Verificar si la tabla ya existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'informes_stockholders'");
    $existe = $stmt->rowCount() > 0;
    
    if ($existe) {
        echo "<h2>✅ La tabla 'informes_stockholders' ya existe</h2>";
        echo "<p>No es necesario crearla nuevamente.</p>";
    } else {
        // Crear la tabla
        $sql = "
        CREATE TABLE `informes_stockholders` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `proyecto_id` int(11) NOT NULL,
          `titulo` varchar(255) NOT NULL,
          `descripcion` text DEFAULT NULL,
          `fecha` date NOT NULL,
          `periodo` varchar(100) DEFAULT NULL,
          `destinatarios` varchar(255) DEFAULT NULL,
          `tipo` enum('Ejecutivo','Técnico','Financiero') DEFAULT 'Ejecutivo',
          `estado` enum('Borrador','En Revisión','Publicado') DEFAULT 'Borrador',
          `ruta_pdf` varchar(500) DEFAULT NULL COMMENT 'Ruta al PDF del reporte ejecutivo asociado',
          `portada` varchar(500) DEFAULT '/img/fondo-codelco.png',
          `fecha_creacion` datetime NOT NULL,
          `fecha_actualizacion` datetime NOT NULL,
          PRIMARY KEY (`id`),
          KEY `idx_proyecto_id` (`proyecto_id`),
          CONSTRAINT `fk_informes_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`proyecto_id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $pdo->exec($sql);
        
        echo "<h2>✅ Tabla 'informes_stockholders' creada exitosamente</h2>";
        echo "<p>La tabla ha sido creada y está lista para usar.</p>";
    }
    
    // Mostrar información de la tabla
    $stmt = $pdo->query("DESCRIBE informes_stockholders");
    $columnas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Estructura de la tabla:</h3>";
    echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    foreach ($columnas as $columna) {
        echo "<tr>";
        echo "<td>{$columna['Field']}</td>";
        echo "<td>{$columna['Type']}</td>";
        echo "<td>{$columna['Null']}</td>";
        echo "<td>{$columna['Key']}</td>";
        echo "<td>{$columna['Default']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (PDOException $e) {
    echo "<h2>❌ Error al crear la tabla</h2>";
    echo "<p style='color: red;'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    
    if (strpos($e->getMessage(), 'foreign key constraint') !== false) {
        echo "<p><strong>Sugerencia:</strong> Verifica que la tabla 'proyectos' existe y tiene la columna 'proyecto_id'.</p>";
    }
} catch (Exception $e) {
    echo "<h2>❌ Error inesperado</h2>";
    echo "<p style='color: red;'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>

