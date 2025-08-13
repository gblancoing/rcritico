<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    // Obtener parámetros
    $proyecto_id = $_GET['proyecto_id'] ?? '1'; // Default para pruebas
    
    echo json_encode([
        'success' => true,
        'test_info' => [
            'proyecto_id' => $proyecto_id,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
    
    // 1. Verificar si la tabla existe
    $check_table = "SHOW TABLES LIKE 'vc_project_c9'";
    $stmt_check = $pdo->prepare($check_table);
    $stmt_check->execute();
    $table_exists = $stmt_check->rowCount() > 0;
    
    echo json_encode([
        'step_1' => [
            'table_exists' => $table_exists,
            'message' => $table_exists ? 'Tabla vc_project_c9 existe' : 'Tabla vc_project_c9 NO existe'
        ]
    ]);
    
    if (!$table_exists) {
        echo json_encode([
            'error' => 'La tabla vc_project_c9 no existe en la base de datos'
        ]);
        exit;
    }
    
    // 2. Verificar estructura de la tabla
    $describe_table = "DESCRIBE vc_project_c9";
    $stmt_describe = $pdo->prepare($describe_table);
    $stmt_describe->execute();
    $columns = $stmt_describe->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'step_2' => [
            'columns' => $columns,
            'message' => 'Estructura de la tabla vc_project_c9'
        ]
    ]);
    
    // 3. Verificar si hay datos para el proyecto
    $check_data = "SELECT COUNT(*) as total FROM vc_project_c9 WHERE proyecto_id = ?";
    $stmt_data = $pdo->prepare($check_data);
    $stmt_data->execute([$proyecto_id]);
    $total_records = $stmt_data->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'step_3' => [
            'total_records' => $total_records,
            'message' => "Total registros para proyecto_id {$proyecto_id}"
        ]
    ]);
    
    // 4. Obtener algunos registros de ejemplo
    if ($total_records > 0) {
        $sample_data = "SELECT * FROM vc_project_c9 WHERE proyecto_id = ? LIMIT 5";
        $stmt_sample = $pdo->prepare($sample_data);
        $stmt_sample->execute([$proyecto_id]);
        $sample_records = $stmt_sample->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'step_4' => [
                'sample_records' => $sample_records,
                'message' => 'Muestra de registros'
            ]
        ]);
        
        // 5. Probar la consulta completa
        $fecha_corte = date('Y-m', strtotime('-1 month'));
        $sql = "SELECT 
                    DATE_FORMAT(periodo, '%Y-%m-01') as periodo_inicio,
                    DATE_FORMAT(periodo, '%Y-%m') as periodo_mes,
                    DATE_FORMAT(periodo, '%M %Y') as periodo_formateado,
                    periodo as periodo_original,
                    SUM(incurrido) as incurrido_total
                FROM vc_project_c9 
                WHERE proyecto_id = ? 
                AND DATE_FORMAT(periodo, '%Y-%m') <= ?
                GROUP BY DATE_FORMAT(periodo, '%Y-%m-01'), DATE_FORMAT(periodo, '%Y-%m'), DATE_FORMAT(periodo, '%M %Y'), periodo
                ORDER BY periodo ASC";
        
        $stmt_test = $pdo->prepare($sql);
        $stmt_test->execute([$proyecto_id, $fecha_corte]);
        $test_results = $stmt_test->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'step_5' => [
                'sql_query' => $sql,
                'fecha_corte' => $fecha_corte,
                'test_results' => $test_results,
                'count_results' => count($test_results),
                'message' => 'Prueba de consulta completa'
            ]
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?> 