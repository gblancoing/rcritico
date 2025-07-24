<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    // Verificar conexión
    echo "=== PRUEBA DE CONEXIÓN ===\n";
    $pdo->query("SELECT 1");
    echo "✅ Conexión exitosa\n\n";
    
    // Verificar si la tabla existe
    echo "=== VERIFICACIÓN DE TABLA ===\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'financiero_sap'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "✅ Tabla financiero_sap existe\n\n";
        
        // Mostrar estructura de la tabla
        echo "=== ESTRUCTURA DE LA TABLA ===\n";
        $stmt = $pdo->query("DESCRIBE financiero_sap");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($columns as $column) {
            echo "Campo: {$column['Field']} | Tipo: {$column['Type']} | Null: {$column['Null']} | Default: {$column['Default']}\n";
        }
        
        // Contar registros
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM financiero_sap");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "\nTotal de registros: {$count['total']}\n";
        
    } else {
        echo "❌ Tabla financiero_sap NO existe\n";
        
        // Crear la tabla si no existe
        echo "\n=== CREANDO TABLA ===\n";
        $sql = "CREATE TABLE financiero_sap (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_sap VARCHAR(30) NOT NULL,
            proyecto_id INT NOT NULL,
            centro_costo_nombre VARCHAR(100),
            version_sap VARCHAR(50),
            descripcion VARCHAR(50),
            grupo_version VARCHAR(50),
            periodo DATE,
            MO DECIMAL(15,2) DEFAULT 0.00,
            IC DECIMAL(15,2) DEFAULT 0.00,
            EM DECIMAL(15,2) DEFAULT 0.00,
            IE DECIMAL(15,2) DEFAULT 0.00,
            SC DECIMAL(15,2) DEFAULT 0.00,
            AD DECIMAL(15,2) DEFAULT 0.00,
            CL DECIMAL(15,2) DEFAULT 0.00,
            CT DECIMAL(15,2) DEFAULT 0.00,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_id_sap_proyecto (id_sap, proyecto_id),
            INDEX idx_proyecto_id (proyecto_id),
            INDEX idx_periodo (periodo),
            INDEX idx_version_sap (version_sap)
        )";
        
        $pdo->exec($sql);
        echo "✅ Tabla financiero_sap creada exitosamente\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?> 