<?php
// Script para verificar qué archivo se está ejecutando realmente
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Verificar Archivo Ejecutado</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        .box { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>Verificación de Archivo Ejecutado</h1>
    
    <div class="box">
        <h2>Archivo Actual (este script)</h2>
        <p><strong>Ruta:</strong> <span class="info"><?php echo __FILE__; ?></span></p>
        <p><strong>Ruta absoluta:</strong> <span class="info"><?php echo realpath(__FILE__); ?></span></p>
        <p><strong>Directorio:</strong> <span class="info"><?php echo __DIR__; ?></span></p>
    </div>
    
    <div class="box">
        <h2>Verificación de generar_reporte_pdf.php</h2>
        <?php
        $archivo = __DIR__ . '/generar_reporte_pdf.php';
        if (file_exists($archivo)) {
            echo '<p class="success">✓ Archivo existe</p>';
            echo '<p>Ruta: ' . $archivo . '</p>';
            echo '<p>Última modificación: ' . date('Y-m-d H:i:s', filemtime($archivo)) . '</p>';
            echo '<p>Tamaño: ' . filesize($archivo) . ' bytes</p>';
            
            $content = file_get_contents($archivo);
            
            // Verificar contenido clave
            $tiene_version = strpos($content, 'VERSION_FINAL_2025') !== false;
            $tiene_banner = strpos($content, 'ARCHIVO ACTUALIZADO') !== false;
            $tiene_log = strpos($content, 'pdf_execution_log.txt') !== false;
            $tiene_resumen = strpos($content, 'RESUMEN POR RIESGO') !== false;
            
            echo '<h3>Verificación de contenido:</h3>';
            echo '<ul>';
            echo '<li>' . ($tiene_version ? '<span class="success">✓</span>' : '<span class="error">✗</span>') . ' Tiene VERSION_FINAL_2025</li>';
            echo '<li>' . ($tiene_banner ? '<span class="success">✓</span>' : '<span class="error">✗</span>') . ' Tiene ARCHIVO ACTUALIZADO</li>';
            echo '<li>' . ($tiene_log ? '<span class="success">✓</span>' : '<span class="error">✗</span>') . ' Tiene pdf_execution_log.txt</li>';
            echo '<li>' . ($tiene_resumen ? '<span class="success">✓</span>' : '<span class="error">✗</span>') . ' Tiene RESUMEN POR RIESGO</li>';
            echo '</ul>';
            
            if (!$tiene_version || !$tiene_banner) {
                echo '<p class="error"><strong>⚠️ ADVERTENCIA: Este archivo NO tiene los cambios recientes!</strong></p>';
            }
        } else {
            echo '<p class="error">✗ Archivo NO existe: ' . $archivo . '</p>';
        }
        ?>
    </div>
    
    <div class="box">
        <h2>Prueba Directa del PDF</h2>
        <p>Haz clic en el botón para generar el PDF. Si NO ves un banner ROJO/AMARILLO en la parte superior, el archivo NO se está ejecutando correctamente.</p>
        <a href="generar_reporte_pdf.php?proyecto_id=1&_t=<?php echo time(); ?>&_r=<?php echo rand(10000, 99999); ?>" class="btn" target="_blank">Generar PDF Ahora</a>
    </div>
    
    <div class="box">
        <h2>Verificar Log de Ejecución</h2>
        <?php
        $log_file = __DIR__ . '/../../pdf_execution_log.txt';
        if (file_exists($log_file)) {
            echo '<p class="success">✓ Log existe: ' . $log_file . '</p>';
            echo '<p>Tamaño: ' . filesize($log_file) . ' bytes</p>';
            echo '<p>Última modificación: ' . date('Y-m-d H:i:s', filemtime($log_file)) . '</p>';
            
            $log_content = file_get_contents($log_file);
            if (!empty($log_content)) {
                echo '<h3>Últimas 10 líneas del log:</h3>';
                $lines = explode("\n", $log_content);
                $last_lines = array_slice($lines, -10);
                echo '<pre>' . htmlspecialchars(implode("\n", $last_lines)) . '</pre>';
            } else {
                echo '<p class="error">El log está vacío. El archivo NO se ha ejecutado.</p>';
            }
        } else {
            echo '<p class="error">✗ Log NO existe: ' . $log_file . '</p>';
            echo '<p>Esto significa que el archivo generar_reporte_pdf.php NO se ha ejecutado aún, o hay un problema de permisos.</p>';
        }
        ?>
    </div>
    
    <div class="box">
        <h2>Verificar Permisos</h2>
        <?php
        $test_file = __DIR__ . '/../../test_write_permissions.txt';
        $test_write = @file_put_contents($test_file, 'test');
        if ($test_write !== false) {
            echo '<p class="success">✓ Permisos de escritura: OK</p>';
            @unlink($test_file);
        } else {
            echo '<p class="error">✗ Permisos de escritura: ERROR</p>';
            echo '<p>No se puede escribir archivos. Esto puede impedir la creación del log.</p>';
        }
        ?>
    </div>
</body>
</html>

