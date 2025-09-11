<?php// Configuración de errores solo para desarrollo
if (in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) || 
    strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false) {
    // Solo mostrar errores en desarrollo local
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    // En producción, ocultar errores
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}
echo "<h2>Prueba de Conexión a Base de Datos</h2>";

// Configuración de la base de datos
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'financiero';

echo "<h3>Configuración:</h3>";
echo "<ul>";
echo "<li><strong>Host:</strong> $host</li>";
echo "<li><strong>Usuario:</strong> $user</li>";
echo "<li><strong>Base de datos:</strong> $dbname</li>";
echo "</ul>";

// Prueba con MySQLi
echo "<h3>Prueba con MySQLi:</h3>";
$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    echo "<p style='color: red;'>❌ Error de conexión MySQLi: " . $conn->connect_error . "</p>";
} else {
    echo "<p style='color: green;'>✅ Conexión MySQLi exitosa</p>";
    echo "<p><strong>Versión del servidor:</strong> " . $conn->server_info . "</p>";
    echo "<p><strong>Versión del cliente:</strong> " . $conn->client_info . "</p>";
    echo "<p><strong>Host info:</strong> " . $conn->host_info . "</p>";
    
    // Verificar si la base de datos existe
    $result = $conn->query("SHOW DATABASES LIKE '$dbname'");
    if ($result->num_rows > 0) {
        echo "<p style='color: green;'>✅ Base de datos '$dbname' existe</p>";
        
        // Mostrar algunas tablas
        $conn->select_db($dbname);
        $tables = $conn->query("SHOW TABLES");
        if ($tables->num_rows > 0) {
            echo "<p><strong>Tablas encontradas:</strong></p><ul>";
            while ($table = $tables->fetch_array()) {
                echo "<li>" . $table[0] . "</li>";
            }
            echo "</ul>";
        } else {
            echo "<p style='color: orange;'>⚠️ No se encontraron tablas en la base de datos</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Base de datos '$dbname' no existe</p>";
    }
    
    $conn->close();
}

// Prueba con PDO
echo "<h3>Prueba con PDO:</h3>";
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "<p style='color: green;'>✅ Conexión PDO exitosa</p>";
    echo "<p><strong>Versión del driver:</strong> " . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION) . "</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Error de conexión PDO: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><em>Fecha y hora de la prueba: " . date('Y-m-d H:i:s') . "</em></p>";
?> 