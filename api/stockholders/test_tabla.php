<?php
/**
 * Script de prueba para verificar la conexión y la tabla
 */

require_once __DIR__ . '/../config/db.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Prueba de Conexión y Tabla</h2>";

try {
    // 1. Verificar conexión
    echo "<p>✅ Conexión a la base de datos: OK</p>";
    
    // 2. Obtener nombre de la base de datos
    $stmt = $pdo->query("SELECT DATABASE() as db");
    $db_info = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p><strong>Base de datos actual:</strong> " . htmlspecialchars($db_info['db']) . "</p>";
    
    // 3. Verificar si la tabla existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'informes_stockholders'");
    $existe = $stmt->rowCount() > 0;
    
    if ($existe) {
        echo "<p>✅ La tabla 'informes_stockholders' existe</p>";
        
        // 4. Intentar una consulta SELECT
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM informes_stockholders");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p>✅ Consulta SELECT exitosa. Total de registros: " . $result['total'] . "</p>";
        } catch (PDOException $e) {
            echo "<p style='color: red;'>❌ Error en SELECT: " . htmlspecialchars($e->getMessage()) . "</p>";
        }
        
        // 5. Intentar una consulta INSERT de prueba (rollback)
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("
                INSERT INTO informes_stockholders 
                (proyecto_id, titulo, descripcion, fecha, periodo, destinatarios, tipo, estado, fecha_creacion, fecha_actualizacion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([999, 'TEST', 'Prueba', date('Y-m-d'), 'TEST', 'TEST', 'Ejecutivo', 'Borrador']);
            $pdo->rollBack();
            echo "<p>✅ Consulta INSERT de prueba exitosa (rollback realizado)</p>";
        } catch (PDOException $e) {
            echo "<p style='color: red;'>❌ Error en INSERT: " . htmlspecialchars($e->getMessage()) . "</p>";
        }
        
    } else {
        echo "<p style='color: red;'>❌ La tabla 'informes_stockholders' NO existe</p>";
        echo "<p>Ejecuta: <a href='crear_tabla.php'>crear_tabla.php</a></p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error inesperado: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>

