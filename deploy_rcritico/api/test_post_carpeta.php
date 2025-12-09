<?php
// Script de prueba para POST de carpetas
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
    'errores' => [],
    'datos_recibidos' => []
];

try {
    // Simular datos POST
    $_SERVER['REQUEST_METHOD'] = 'POST';
    
    // Datos de prueba
    $test_data = [
        'nombre' => 'Prueba',
        'descripcion' => 'Prueba',
        'proyecto_id' => 1,
        'centro_costo_id' => null,
        'carpeta_padre_id' => null,
        'creado_por' => 1
    ];
    
    $resultado['datos_recibidos'] = $test_data;
    
    // Simular php://input
    $GLOBALS['test_input'] = json_encode($test_data);
    
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
    
    // 4. Verificar que el proyecto existe
    $stmt_check = $pdo->prepare("SELECT proyecto_id FROM proyectos WHERE proyecto_id = ?");
    $stmt_check->execute([$test_data['proyecto_id']]);
    if (!$stmt_check->fetch()) {
        $resultado['errores'][] = 'Proyecto no encontrado';
    } else {
        $resultado['mensajes'][] = 'Proyecto encontrado';
    }
    
    // 5. Intentar crear la carpeta
    $stmt = $pdo->prepare("INSERT INTO carpetas (nombre, descripcion, proyecto_id, centro_costo_id, carpeta_padre_id, creado_por) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $test_data['nombre'],
        $test_data['descripcion'],
        $test_data['proyecto_id'],
        $test_data['centro_costo_id'],
        $test_data['carpeta_padre_id'],
        $test_data['creado_por']
    ]);
    
    $carpeta_id = $pdo->lastInsertId();
    $resultado['mensajes'][] = "Carpeta creada con ID: $carpeta_id";
    $resultado['carpeta_id'] = $carpeta_id;
    $resultado['success'] = true;
    
    // Eliminar la carpeta de prueba
    $stmt_delete = $pdo->prepare("DELETE FROM carpetas WHERE id = ?");
    $stmt_delete->execute([$carpeta_id]);
    $resultado['mensajes'][] = 'Carpeta de prueba eliminada';
    
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

