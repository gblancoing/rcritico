<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración
require_once 'config.php';

try {
    // Obtener configuración
    $dbConfig = getDbConfig();
    
    echo "=== PRUEBA DE CONEXIÓN AL SERVIDOR ===\n\n";
    echo "1. CONFIGURACIÓN DETECTADA:\n";
    echo "   Host: " . $dbConfig['host'] . "\n";
    echo "   Usuario: " . $dbConfig['user'] . "\n";
    echo "   Base de datos: " . $dbConfig['dbname'] . "\n";
    echo "   Entorno: " . (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ? 'LOCAL' : 'SERVIDOR') . "\n";
    echo "   HTTP_HOST: " . $_SERVER['HTTP_HOST'] . "\n\n";
    
    // Probar conexión MySQLi
    echo "2. PROBANDO CONEXIÓN MYSQLI:\n";
    $conn = new mysqli($dbConfig['host'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['dbname']);
    
    if ($conn->connect_error) {
        echo "   ❌ Error MySQLi: " . $conn->connect_error . "\n\n";
    } else {
        echo "   ✅ Conexión MySQLi exitosa\n\n";
        
        // Verificar tablas
        echo "3. VERIFICANDO TABLAS:\n";
        $result = $conn->query("SHOW TABLES");
        if ($result) {
            echo "   Tablas encontradas:\n";
            while ($row = $result->fetch_array()) {
                echo "   - " . $row[0] . "\n";
            }
        } else {
            echo "   ❌ Error al listar tablas: " . $conn->error . "\n";
        }
        echo "\n";
        
        // Verificar tabla financiero_sap específicamente
        echo "4. VERIFICANDO TABLA financiero_sap:\n";
        $result = $conn->query("SELECT COUNT(*) as total FROM financiero_sap");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "   ✅ Tabla financiero_sap existe con " . $row['total'] . " registros\n";
        } else {
            echo "   ❌ Error con tabla financiero_sap: " . $conn->error . "\n";
        }
        echo "\n";
        
        $conn->close();
    }
    
    // Probar conexión PDO
    echo "5. PROBANDO CONEXIÓN PDO:\n";
    $dsn = "mysql:host=" . $dbConfig['host'] . ";dbname=" . $dbConfig['dbname'] . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    try {
        $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $options);
        echo "   ✅ Conexión PDO exitosa\n\n";
        
        // Probar consulta simple
        echo "6. PROBANDO CONSULTA SIMPLE:\n";
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM financiero_sap");
        $result = $stmt->fetch();
        echo "   ✅ Consulta exitosa: " . $result['total'] . " registros en financiero_sap\n\n";
        
    } catch (PDOException $e) {
        echo "   ❌ Error PDO: " . $e->getMessage() . "\n\n";
    }
    
    echo "=== PRUEBA COMPLETADA ===\n";
    
} catch (Exception $e) {
    echo "❌ ERROR GENERAL: " . $e->getMessage() . "\n";
    echo "Detalles: " . $e->getTraceAsString() . "\n";
}
?>