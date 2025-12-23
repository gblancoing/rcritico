<?php
// Script para mostrar qué archivo se está ejecutando realmente
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Debug - Archivo Ejecutado</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        .box { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Debug: Verificación de Archivo Ejecutado</h1>
    
    <div class="box">
        <h2>Información del Script Actual</h2>
        <p><strong>Archivo ejecutado:</strong> <span class="info"><?php echo __FILE__; ?></span></p>
        <p><strong>Ruta absoluta:</strong> <span class="info"><?php echo realpath(__FILE__); ?></span></p>
        <p><strong>Directorio:</strong> <span class="info"><?php echo __DIR__; ?></span></p>
        <p><strong>Timestamp:</strong> <span class="info"><?php echo date('Y-m-d H:i:s'); ?></span></p>
    </div>
    
    <div class="box">
        <h2>Verificación de generar_reporte_pdf.php</h2>
        <?php
        $archivo_principal = __DIR__ . '/generar_reporte_pdf.php';
        if (file_exists($archivo_principal)) {
            echo '<p class="success">✓ Archivo existe: ' . $archivo_principal . '</p>';
            echo '<p>Última modificación: ' . date('Y-m-d H:i:s', filemtime($archivo_principal)) . '</p>';
            echo '<p>Tamaño: ' . filesize($archivo_principal) . ' bytes</p>';
            
            $content = file_get_contents($archivo_principal);
            
            // Verificar contenido
            $checks = [
                'ARCHIVO ACTUALIZADO' => strpos($content, 'ARCHIVO ACTUALIZADO') !== false,
                'obtenerEstadisticasRC' => strpos($content, 'obtenerEstadisticasRC') !== false,
                'RESUMEN POR RIESGO' => strpos($content, 'RESUMEN POR RIESGO') !== false,
                'SetXY(10, 10)' => strpos($content, 'SetXY(10, 10)') !== false,
                'SetFillColor(255, 0, 0)' => strpos($content, 'SetFillColor(255, 0, 0)') !== false,
            ];
            
            echo '<h3>Verificación de contenido:</h3>';
            echo '<ul>';
            foreach ($checks as $check => $result) {
                echo '<li>' . ($result ? '<span class="success">✓</span>' : '<span class="error">✗</span>') . ' ' . $check . '</li>';
            }
            echo '</ul>';
            
            // Mostrar las primeras líneas donde debería estar el banner
            echo '<h3>Líneas alrededor del banner (líneas 403-412):</h3>';
            $lines = explode("\n", $content);
            $start = max(0, 400);
            $end = min(count($lines), 415);
            echo '<pre>';
            for ($i = $start; $i < $end; $i++) {
                $line_num = $i + 1;
                $line = htmlspecialchars($lines[$i]);
                if (strpos($line, 'ARCHIVO ACTUALIZADO') !== false) {
                    echo "<strong style='background: yellow;'>$line_num: $line</strong>\n";
                } else {
                    echo "$line_num: $line\n";
                }
            }
            echo '</pre>';
        } else {
            echo '<p class="error">✗ Archivo NO existe: ' . $archivo_principal . '</p>';
        }
        ?>
    </div>
    
    <div class="box">
        <h2>Comparación con otros archivos</h2>
        <?php
        $archivos = [
            'api/dashboard/generar_reporte_pdf.php',
            'deploy_rcritico/api/dashboard/generar_reporte_pdf.php',
        ];
        
        foreach ($archivos as $archivo) {
            $ruta_completa = __DIR__ . '/../../' . $archivo;
            if (file_exists($ruta_completa)) {
                echo '<h3>' . $archivo . '</h3>';
                echo '<p>Última modificación: ' . date('Y-m-d H:i:s', filemtime($ruta_completa)) . '</p>';
                $content = file_get_contents($ruta_completa);
                $tiene_banner = strpos($content, 'ARCHIVO ACTUALIZADO') !== false;
                echo '<p>' . ($tiene_banner ? '<span class="success">✓ Tiene banner</span>' : '<span class="error">✗ NO tiene banner</span>') . '</p>';
            }
        }
        ?>
    </div>
    
    <div class="box">
        <h2>Prueba Directa</h2>
        <p><a href="generar_reporte_pdf.php?proyecto_id=1&debug=1&_t=<?php echo time(); ?>&_r=<?php echo rand(1000, 9999); ?>" target="_blank">Generar PDF ahora (con parámetros anti-caché)</a></p>
        <p><small>Si el PDF generado NO tiene el banner rojo, entonces el servidor está usando otro archivo o hay un error antes de llegar al banner.</small></p>
    </div>
    
    <div class="box">
        <h2>Información del Servidor</h2>
        <p><strong>PHP Version:</strong> <?php echo phpversion(); ?></p>
        <p><strong>Document Root:</strong> <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'No disponible'; ?></p>
        <p><strong>Script Name:</strong> <?php echo $_SERVER['SCRIPT_NAME'] ?? 'No disponible'; ?></p>
        <p><strong>Request URI:</strong> <?php echo $_SERVER['REQUEST_URI'] ?? 'No disponible'; ?></p>
    </div>
</body>
</html>

