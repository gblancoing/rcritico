<?php
// Script de prueba para verificar qué archivo se está ejecutando
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Archivo PDF</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        .file-info { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .exists { color: green; font-weight: bold; }
        .not-exists { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Verificación de Archivos PDF</h1>
    
    <?php
    $files = [
        'api/dashboard/generar_reporte_pdf.php',
        'deploy_rcritico/api/dashboard/generar_reporte_pdf.php',
        'temp_produccion/api/dashboard/generar_reporte_pdf.php'
    ];
    
    foreach ($files as $file) {
        echo '<div class="file-info">';
        echo '<h3>' . htmlspecialchars($file) . '</h3>';
        
        if (file_exists($file)) {
            echo '<p class="exists">✓ EXISTE</p>';
            echo '<p>Última modificación: ' . date('Y-m-d H:i:s', filemtime($file)) . '</p>';
            echo '<p>Tamaño: ' . filesize($file) . ' bytes</p>';
            
            $content = file_get_contents($file);
            
            if (strpos($content, 'ARCHIVO ACTUALIZADO') !== false) {
                echo '<p style="color: green; font-weight: bold;">✓ Contiene "ARCHIVO ACTUALIZADO"</p>';
            } else {
                echo '<p style="color: red; font-weight: bold;">✗ NO contiene "ARCHIVO ACTUALIZADO"</p>';
            }
            
            if (strpos($content, 'obtenerEstadisticasRC') !== false) {
                echo '<p style="color: green; font-weight: bold;">✓ Contiene función obtenerEstadisticasRC</p>';
            } else {
                echo '<p style="color: red; font-weight: bold;">✗ NO contiene función obtenerEstadisticasRC</p>';
            }
            
            if (strpos($content, 'RESUMEN POR RIESGO') !== false) {
                echo '<p style="color: green; font-weight: bold;">✓ Contiene "RESUMEN POR RIESGO"</p>';
            } else {
                echo '<p style="color: red; font-weight: bold;">✗ NO contiene "RESUMEN POR RIESGO"</p>';
            }
        } else {
            echo '<p class="not-exists">✗ NO EXISTE</p>';
        }
        
        echo '</div>';
    }
    
    echo '<h2>Ruta actual del script de prueba:</h2>';
    echo '<p>' . __FILE__ . '</p>';
    echo '<p>Directorio de trabajo: ' . getcwd() . '</p>';
    
    echo '<h2>URL para probar el PDF:</h2>';
    echo '<p><a href="api/dashboard/generar_reporte_pdf.php?proyecto_id=1&test=' . time() . '" target="_blank">Probar: api/dashboard/generar_reporte_pdf.php</a></p>';
    ?>
</body>
</html>

