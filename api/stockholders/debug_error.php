<?php
/**
 * Script de diagnóstico para errores en informes.php
 */

require_once __DIR__ . '/../config/db.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Diagnóstico de Errores - Informes Stockholders</h2>";

try {
    // 1. Verificar conexión
    echo "<p>✅ Conexión a la base de datos: OK</p>";
    
    // 2. Verificar tabla
    $stmt = $pdo->query("SHOW TABLES LIKE 'informes_stockholders'");
    if ($stmt->rowCount() > 0) {
        echo "<p>✅ Tabla 'informes_stockholders' existe</p>";
        
        // 3. Verificar columnas
        $stmt = $pdo->query("DESCRIBE informes_stockholders");
        $columnas = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "<h3>Columnas existentes:</h3><ul>";
        foreach ($columnas as $col) {
            echo "<li>{$col}</li>";
        }
        echo "</ul>";
        
        // 4. Verificar si falta parametros_reporte
        if (!in_array('parametros_reporte', $columnas)) {
            echo "<p style='color: orange;'>⚠️ La columna 'parametros_reporte' NO existe</p>";
            echo "<p><a href='agregar_columna_parametros.php'>Agregar columna parametros_reporte</a></p>";
        } else {
            echo "<p>✅ Columna 'parametros_reporte' existe</p>";
        }
        
        // 5. Verificar que existe un proyecto con ID 1
        $stmt = $pdo->prepare("SELECT proyecto_id FROM proyectos WHERE proyecto_id = 1");
        $stmt->execute();
        $proyecto_existe = $stmt->fetch();
        
        if ($proyecto_existe) {
            echo "<p>✅ Proyecto con ID 1 existe</p>";
            
            // 6. Probar INSERT sin parametros_reporte
            echo "<h3>Prueba de INSERT:</h3>";
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO informes_stockholders 
                    (proyecto_id, titulo, descripcion, fecha, periodo, destinatarios, tipo, estado, ruta_pdf, portada, fecha_creacion, fecha_actualizacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([1, 'TEST ' . time(), 'Prueba', date('Y-m-d'), 'TEST', 'TEST', 'Ejecutivo', 'Borrador', null, '/img/fondo-codelco.png']);
                $test_id = $pdo->lastInsertId();
                // Eliminar el registro de prueba
                $pdo->prepare("DELETE FROM informes_stockholders WHERE id = ?")->execute([$test_id]);
                echo "<p>✅ INSERT sin parametros_reporte funciona</p>";
            } catch (PDOException $e) {
                echo "<p style='color: red;'>❌ Error en INSERT: " . htmlspecialchars($e->getMessage()) . "</p>";
            }
            
            // 7. Probar INSERT con parametros_reporte (si existe la columna)
            if (in_array('parametros_reporte', $columnas)) {
                try {
                    $stmt = $pdo->prepare("
                        INSERT INTO informes_stockholders 
                        (proyecto_id, titulo, descripcion, fecha, periodo, destinatarios, tipo, estado, ruta_pdf, portada, parametros_reporte, fecha_creacion, fecha_actualizacion)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    ");
                    $parametros_test = json_encode(['test' => true]);
                    $stmt->execute([1, 'TEST2 ' . time(), 'Prueba', date('Y-m-d'), 'TEST', 'TEST', 'Ejecutivo', 'Borrador', null, '/img/fondo-codelco.png', $parametros_test]);
                    $test_id2 = $pdo->lastInsertId();
                    // Eliminar el registro de prueba
                    $pdo->prepare("DELETE FROM informes_stockholders WHERE id = ?")->execute([$test_id2]);
                    echo "<p>✅ INSERT con parametros_reporte funciona</p>";
                } catch (PDOException $e) {
                    echo "<p style='color: red;'>❌ Error en INSERT con parametros_reporte: " . htmlspecialchars($e->getMessage()) . "</p>";
                }
            }
        } else {
            echo "<p style='color: orange;'>⚠️ No existe proyecto con ID 1. Las pruebas de INSERT fallarán por foreign key.</p>";
        }
        
        // 7. Verificar informes existentes
        $stmt = $pdo->query("SELECT id, proyecto_id, titulo FROM informes_stockholders ORDER BY id DESC LIMIT 5");
        $informes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h3>Últimos 5 informes:</h3>";
        if (count($informes) > 0) {
            echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
            echo "<tr><th>ID</th><th>Proyecto ID</th><th>Título</th></tr>";
            foreach ($informes as $inf) {
                echo "<tr><td>{$inf['id']}</td><td>{$inf['proyecto_id']}</td><td>{$inf['titulo']}</td></tr>";
            }
            echo "</table>";
        } else {
            echo "<p>No hay informes en la base de datos</p>";
        }
        
    } else {
        echo "<p style='color: red;'>❌ La tabla 'informes_stockholders' NO existe</p>";
        echo "<p><a href='crear_tabla.php'>Crear tabla</a></p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error inesperado: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>

