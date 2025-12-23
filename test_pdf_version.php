<?php
// Script de prueba para verificar qué archivo se está ejecutando
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Test de Versión del PDF</h1>";
echo "<p>Verificando archivos...</p>";

$files_to_check = [
    'api/dashboard/generar_reporte_pdf.php',
    'deploy_rcritico/api/dashboard/generar_reporte_pdf.php'
];

foreach ($files_to_check as $file) {
    if (file_exists($file)) {
        echo "<h2>Archivo: $file</h2>";
        echo "<p>Existe: Sí</p>";
        echo "<p>Última modificación: " . date('Y-m-d H:i:s', filemtime($file)) . "</p>";
        
        $content = file_get_contents($file);
        
        if (strpos($content, 'VERSION 3.0') !== false) {
            echo "<p style='color: green; font-weight: bold;'>✓ Contiene 'VERSION 3.0'</p>";
        } else {
            echo "<p style='color: red; font-weight: bold;'>✗ NO contiene 'VERSION 3.0'</p>";
        }
        
        if (strpos($content, 'CAMBIOS APLICADOS') !== false) {
            echo "<p style='color: green; font-weight: bold;'>✓ Contiene 'CAMBIOS APLICADOS'</p>";
        } else {
            echo "<p style='color: red; font-weight: bold;'>✗ NO contiene 'CAMBIOS APLICADOS'</p>";
        }
        
        if (strpos($content, 'color_gris_tabla') !== false) {
            echo "<p style='color: green; font-weight: bold;'>✓ Contiene 'color_gris_tabla' (nuevos colores)</p>";
        } else {
            echo "<p style='color: red; font-weight: bold;'>✗ NO contiene 'color_gris_tabla'</p>";
        }
        
        if (strpos($content, 'SetLineWidth(0.5)') !== false) {
            echo "<p style='color: green; font-weight: bold;'>✓ Contiene bordes gruesos (0.5)</p>";
        } else {
            echo "<p style='color: red; font-weight: bold;'>✗ NO contiene bordes gruesos</p>";
        }
        
        echo "<hr>";
    } else {
        echo "<h2>Archivo: $file</h2>";
        echo "<p style='color: red;'>✗ NO EXISTE</p>";
        echo "<hr>";
    }
}

echo "<h2>Ruta actual del script:</h2>";
echo "<p>" . __FILE__ . "</p>";
echo "<p>Directorio de trabajo: " . getcwd() . "</p>";

echo "<h2>URLs para probar:</h2>";
echo "<p><a href='api/dashboard/generar_reporte_pdf.php?proyecto_id=1&test=1' target='_blank'>Probar: api/dashboard/generar_reporte_pdf.php</a></p>";
echo "<p><a href='deploy_rcritico/api/dashboard/generar_reporte_pdf.php?proyecto_id=1&test=1' target='_blank'>Probar: deploy_rcritico/api/dashboard/generar_reporte_pdf.php</a></p>";
?>

