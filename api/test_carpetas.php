<?php
// Script de prueba para diagnosticar problemas con carpetas.php
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

$resultado = [
    'success' => false,
    'mensajes' => [],
    'errores' => []
];

try {
    // 1. Verificar que podemos cargar db.php
    $resultado['mensajes'][] = 'Intentando cargar db.php...';
    require_once __DIR__ . '/config/db.php';
    $resultado['mensajes'][] = 'db.php cargado correctamente';
    
    // 2. Verificar que $pdo existe
    if (!isset($pdo)) {
        throw new Exception('La variable $pdo no está definida');
    }
    $resultado['mensajes'][] = 'Variable $pdo existe';
    
    // 3. Verificar conexión
    $pdo->query("SELECT 1");
    $resultado['mensajes'][] = 'Conexión a base de datos OK';
    
    // 4. Verificar si las tablas existen
    $tablas_requeridas = ['carpetas', 'archivos', 'carpeta_usuarios', 'actividad_carpetas', 'actividad_archivos'];
    $tablas_existentes = [];
    $tablas_faltantes = [];
    
    $stmt = $pdo->query("SHOW TABLES");
    $tablas_db = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($tablas_requeridas as $tabla) {
        if (in_array($tabla, $tablas_db)) {
            $tablas_existentes[] = $tabla;
        } else {
            $tablas_faltantes[] = $tabla;
        }
    }
    
    $resultado['tablas_existentes'] = $tablas_existentes;
    $resultado['tablas_faltantes'] = $tablas_faltantes;
    
    if (empty($tablas_faltantes)) {
        $resultado['mensajes'][] = 'Todas las tablas requeridas existen';
        $resultado['success'] = true;
    } else {
        $resultado['errores'][] = 'Faltan las siguientes tablas: ' . implode(', ', $tablas_faltantes);
        $resultado['mensajes'][] = 'Ejecuta el script: api/database/crear_tablas_carpetas_archivos.sql';
    }
    
    // 5. Si la tabla carpetas existe, verificar estructura
    if (in_array('carpetas', $tablas_existentes)) {
        try {
            $stmt = $pdo->query("DESCRIBE carpetas");
            $columnas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $resultado['estructura_carpetas'] = array_column($columnas, 'Field');
            $resultado['mensajes'][] = 'Estructura de tabla carpetas verificada';
        } catch (PDOException $e) {
            $resultado['errores'][] = 'Error al verificar estructura de carpetas: ' . $e->getMessage();
        }
    }
    
} catch (Exception $e) {
    $resultado['errores'][] = 'Excepción: ' . $e->getMessage();
    $resultado['trace'] = $e->getTraceAsString();
} catch (Error $e) {
    $resultado['errores'][] = 'Error fatal: ' . $e->getMessage();
    $resultado['trace'] = $e->getTraceAsString();
}

ob_clean();
echo json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
ob_end_flush();
?>

