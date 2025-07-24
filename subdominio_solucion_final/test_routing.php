<?php
// Archivo de prueba para verificar el routing
echo "<h1>Test de Routing</h1>";
echo "<p>Este archivo confirma que PHP está funcionando correctamente.</p>";
echo "<p>Timestamp: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Server: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Mostrar información de la petición
echo "<h2>Información de la Petición:</h2>";
echo "<p>REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "</p>";
echo "<p>SCRIPT_NAME: " . $_SERVER['SCRIPT_NAME'] . "</p>";
echo "<p>PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'No definido') . "</p>";
echo "<p>QUERY_STRING: " . ($_SERVER['QUERY_STRING'] ?? 'No definido') . "</p>";

// Verificar si existe el build
$build_path = __DIR__ . '/build';
$index_path = $build_path . '/index.html';

echo "<h2>Verificación de Archivos:</h2>";
echo "<p>Directorio build existe: " . (is_dir($build_path) ? 'SÍ' : 'NO') . "</p>";
echo "<p>index.html existe: " . (file_exists($index_path) ? 'SÍ' : 'NO') . "</p>";

if (file_exists($index_path)) {
    echo "<p>Tamaño de index.html: " . filesize($index_path) . " bytes</p>";
}
?> 