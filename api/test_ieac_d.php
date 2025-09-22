<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    // Parámetros de prueba
    $proyecto_id = $_GET['proyecto_id'] ?? '1';
    $fecha_filtro = $_GET['fecha_filtro'] ?? date('Y-m');
    
    echo json_encode([
        'success' => true,
        'test_info' => [
            'proyecto_id' => $proyecto_id,
            'fecha_filtro' => $fecha_filtro,
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => 'Archivo de prueba para IEAC(d) creado exitosamente'
        ]
    ]);
    
    // Verificar que el archivo calcular_ieac_d.php existe
    if (file_exists('calcular_ieac_d.php')) {
        echo json_encode([
            'file_check' => [
                'exists' => true,
                'message' => 'Archivo calcular_ieac_d.php existe'
            ]
        ]);
    } else {
        echo json_encode([
            'file_check' => [
                'exists' => false,
                'message' => 'Archivo calcular_ieac_d.php NO existe'
            ]
        ]);
    }
    
    // Probar la consulta básica para verificar estructura de datos
    $sql_test = "SELECT 
        COUNT(*) as total_registros_vc,
        COUNT(DISTINCT DATE_FORMAT(periodo, '%Y-%m')) as meses_disponibles_vc
    FROM vc_project_9c 
    WHERE proyecto_id = ?";
    
    $stmt_test = $pdo->prepare($sql_test);
    $stmt_test->execute([$proyecto_id]);
    $test_result = $stmt_test->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'data_test' => [
            'vc_project_9c' => $test_result,
            'message' => 'Datos de prueba de vc_project_9c'
        ]
    ]);
    
    // Probar consulta de av_fisico_real
    $sql_test2 = "SELECT 
        COUNT(*) as total_registros_afr,
        COUNT(DISTINCT DATE_FORMAT(periodo, '%Y-%m')) as meses_disponibles_afr
    FROM av_fisico_real 
    WHERE proyecto_id = ?";
    
    $stmt_test2 = $pdo->prepare($sql_test2);
    $stmt_test2->execute([$proyecto_id]);
    $test_result2 = $stmt_test2->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'data_test2' => [
            'av_fisico_real' => $test_result2,
            'message' => 'Datos de prueba de av_fisico_real'
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
