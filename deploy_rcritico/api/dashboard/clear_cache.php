<?php
// Script para limpiar caché de PHP
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Limpiar Caché PHP</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Limpiar Caché de PHP</h1>
    
    <?php
    echo '<div class="info">';
    echo '<h3>Información del Sistema</h3>';
    echo '<p>PHP Version: ' . phpversion() . '</p>';
    echo '<p>OPcache habilitado: ' . (function_exists('opcache_reset') ? 'SÍ' : 'NO') . '</p>';
    echo '</div>';
    
    if (function_exists('opcache_reset')) {
        if (opcache_reset()) {
            echo '<div class="success">';
            echo '<h3>✓ OPcache limpiado exitosamente</h3>';
            echo '<p>El caché de PHP ha sido limpiado. Ahora intenta generar el PDF nuevamente.</p>';
            echo '</div>';
        } else {
            echo '<div class="error">';
            echo '<h3>✗ Error al limpiar OPcache</h3>';
            echo '<p>No se pudo limpiar el caché. Intenta reiniciar Apache manualmente.</p>';
            echo '</div>';
        }
    } else {
        echo '<div class="info">';
        echo '<h3>OPcache no está disponible</h3>';
        echo '<p>OPcache no está habilitado en tu instalación de PHP. Esto significa que no hay caché de código que limpiar.</p>';
        echo '<p>Si aún ves el reporte antiguo, el problema puede ser:</p>';
        echo '<ul>';
        echo '<li>Caché del navegador (usa Ctrl+Shift+Delete)</li>';
        echo '<li>Apache está usando otro archivo (verifica la ruta)</li>';
        echo '<li>Hay un error en el código que impide su ejecución</li>';
        echo '</ul>';
        echo '</div>';
    }
    
    echo '<div class="info">';
    echo '<h3>Verificación del archivo</h3>';
    $archivo = __DIR__ . '/generar_reporte_pdf.php';
    if (file_exists($archivo)) {
        echo '<p>✓ Archivo existe: ' . $archivo . '</p>';
        echo '<p>Última modificación: ' . date('Y-m-d H:i:s', filemtime($archivo)) . '</p>';
        echo '<p>Tamaño: ' . filesize($archivo) . ' bytes</p>';
        
        $content = file_get_contents($archivo);
        if (strpos($content, 'ARCHIVO ACTUALIZADO') !== false) {
            echo '<p style="color: green; font-weight: bold;">✓ Contiene "ARCHIVO ACTUALIZADO"</p>';
        } else {
            echo '<p style="color: red; font-weight: bold;">✗ NO contiene "ARCHIVO ACTUALIZADO"</p>';
        }
    } else {
        echo '<p style="color: red; font-weight: bold;">✗ Archivo NO existe</p>';
    }
    echo '</div>';
    
    echo '<div class="info">';
    echo '<h3>Próximos pasos</h3>';
    echo '<ol>';
    echo '<li>Reinicia Apache en XAMPP (detén e inicia nuevamente)</li>';
    echo '<li>Limpia el caché del navegador (Ctrl+Shift+Delete)</li>';
    echo '<li>Prueba en modo incógnito</li>';
    echo '<li>Genera el PDF nuevamente</li>';
    echo '</ol>';
    echo '<p><a href="generar_reporte_pdf.php?proyecto_id=1&_t=' . time() . '&_r=' . rand(1000, 9999) . '" target="_blank">Probar PDF ahora</a></p>';
    echo '</div>';
    ?>
</body>
</html>

