<?php
/**
 * Archivo de prueba para verificar rutas de archivos estáticos
 */

echo '<h1>Prueba de Rutas de Archivos Estáticos</h1>';
echo '<p>Directorio actual: ' . __DIR__ . '</p>';

// Verificar archivos CSS
echo '<h2>Archivos CSS:</h2>';
$cssDir = __DIR__ . '/build/static/css';
if (is_dir($cssDir)) {
    $cssFiles = scandir($cssDir);
    foreach ($cssFiles as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'css') {
            $filePath = $cssDir . '/' . $file;
            $size = filesize($filePath);
            echo '<p>✅ ' . $file . ' (' . round($size/1024, 1) . ' KB)</p>';
        }
    }
} else {
    echo '<p>❌ Directorio CSS no encontrado</p>';
}

// Verificar archivos JS
echo '<h2>Archivos JS:</h2>';
$jsDir = __DIR__ . '/build/static/js';
if (is_dir($jsDir)) {
    $jsFiles = scandir($jsDir);
    foreach ($jsFiles as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'js') {
            $filePath = $jsDir . '/' . $file;
            $size = filesize($filePath);
            echo '<p>✅ ' . $file . ' (' . round($size/1024, 1) . ' KB)</p>';
        }
    }
} else {
    echo '<p>❌ Directorio JS no encontrado</p>';
}

// Verificar rutas específicas mencionadas en los errores
echo '<h2>Verificando archivos específicos:</h2>';
$specificFiles = [
    'main.1e12846d.css',
    'main.4e7b490e.js'
];

foreach ($specificFiles as $file) {
    $paths = [
        __DIR__ . '/build/' . $file,
        __DIR__ . '/build/static/css/' . $file,
        __DIR__ . '/build/static/js/' . $file
    ];
    
    $found = false;
    foreach ($paths as $filePath) {
        if (file_exists($filePath)) {
            $size = filesize($filePath);
            echo '<p>✅ ' . $file . ' encontrado en: ' . $filePath . ' (' . round($size/1024, 1) . ' KB)</p>';
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        echo '<p>❌ ' . $file . ' NO ENCONTRADO</p>';
    }
}

echo '<h2>Información del servidor:</h2>';
echo '<p>Server Name: ' . $_SERVER['SERVER_NAME'] . '</p>';
echo '<p>HTTP Host: ' . $_SERVER['HTTP_HOST'] . '</p>';
echo '<p>Request URI: ' . $_SERVER['REQUEST_URI'] . '</p>';
echo '<p>Document Root: ' . $_SERVER['DOCUMENT_ROOT'] . '</p>';
?>