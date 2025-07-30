<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db.php';

try {
    // Obtener parámetros de la consulta
    $proyecto_id = $_GET['proyecto_id'] ?? $_POST['proyecto_id'] ?? null;
    $fecha_desde = $_GET['fecha_desde'] ?? $_POST['fecha_desde'] ?? null;
    $fecha_hasta = $_GET['fecha_hasta'] ?? $_POST['fecha_hasta'] ?? null;
    $descripcion = $_GET['descripcion'] ?? $_POST['descripcion'] ?? null;
    $historial = $_GET['historial'] ?? $_POST['historial'] ?? false;

    if (!$proyecto_id) {
        echo json_encode([
            'success' => false,
            'error' => 'proyecto_id es requerido'
        ]);
        exit;
    }
    
    error_log("🔍 PROYECTO ID RECIBIDO: " . $proyecto_id);

    // Verificar que el proyecto existe en la tabla financiero_sap
    $sqlVerificar = "SELECT COUNT(*) as total FROM financiero_sap WHERE proyecto_id = ?";
    $stmtVerificar = $pdo->prepare($sqlVerificar);
    $stmtVerificar->execute([$proyecto_id]);
    $verificacion = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
    
    error_log("🔍 VERIFICACIÓN DE PROYECTO:");
    error_log("  Total registros para proyecto_id $proyecto_id: " . ($verificacion['total'] ?? 0));
    
    if (($verificacion['total'] ?? 0) == 0) {
        error_log("❌ NO HAY DATOS PARA ESTE PROYECTO EN financiero_sap");
        echo json_encode([
            'success' => true,
            'data' => [
                'total_proyeccion' => 0,
                'total_registros' => 0,
                'periodo_minimo' => null,
                'periodo_maximo' => null
            ]
        ]);
        exit;
    }

    // Construir la consulta base para obtener datos de proyección financiera
    // Consultamos la tabla financiero_sap sumando las columnas de categorías VP (MO, IC, EM, IE, SC, AD, CL, CT)
    
    if ($historial) {
        // Si es historial, agrupar por período
        $sql = "SELECT 
                    periodo,
                    SUM(MO + IC + EM + IE + SC + AD + CL + CT) as proyeccion,
                    COUNT(*) as registros
                FROM financiero_sap 
                WHERE proyecto_id = ?";
    } else {
        // Consulta normal para el total
        $sql = "SELECT 
                    SUM(MO + IC + EM + IE + SC + AD + CL + CT) as total_proyeccion,
                    COUNT(*) as total_registros,
                    MIN(periodo) as periodo_minimo,
                    MAX(periodo) as periodo_maximo
                FROM financiero_sap 
                WHERE proyecto_id = ?";
    }
    
    $params = [$proyecto_id];

    // Agregar filtros de fecha si se proporcionan
    if ($fecha_desde) {
        $sql .= " AND periodo >= ?";
        $params[] = $fecha_desde;
        error_log("🔍 FILTRO fecha_desde aplicado: $fecha_desde");
    }
    
    if ($fecha_hasta) {
        $sql .= " AND periodo <= ?";
        $params[] = $fecha_hasta;
        error_log("🔍 FILTRO fecha_hasta aplicado: $fecha_hasta");
    }
    
    if ($descripcion) {
        $sql .= " AND descripcion = ?";
        $params[] = $descripcion;
        error_log("🔍 FILTRO descripcion aplicado: $descripcion");
    }
    
    if (!$fecha_desde && !$fecha_hasta && !$descripcion) {
        error_log("🔍 SIN FILTROS - mostrando todos los datos");
    }

    // Ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    if ($historial) {
        // Modo historial: obtener múltiples filas
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Procesar datos del historial
        $historial = [];
        foreach ($resultados as $row) {
            $historial[] = [
                'periodo' => $row['periodo'],
                'proyeccion' => floatval($row['proyeccion']),
                'registros' => intval($row['registros'])
            ];
        }
        
        // Ordenar por período
        usort($historial, function($a, $b) {
            return strcmp($a['periodo'], $b['periodo']);
        });
        
        echo json_encode([
            'success' => true,
            'historial' => $historial,
            'total_periodos' => count($historial)
        ]);
    } else {
        // Modo normal: obtener una sola fila
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

        // Log para debugging
        error_log("🔍 DEBUG PROYECCIÓN FINANCIERA:");
        error_log("  SQL ejecutado: " . $sql);
        error_log("  Parámetros: " . json_encode($params));
        error_log("  Resultado: " . json_encode($resultado));

        // Obtener el valor total de la proyección financiera
        $total_proyeccion = $resultado['total_proyeccion'] ?? 0;
        
        error_log("🔍 PROYECCIÓN FINANCIERA CALCULADA:");
        error_log("  Valor total: " . $total_proyeccion);
        error_log("  Registros procesados: " . ($resultado['total_registros'] ?? 0));
        error_log("  Rango de períodos: " . ($resultado['periodo_minimo'] ?? 'N/A') . " a " . ($resultado['periodo_maximo'] ?? 'N/A'));

        echo json_encode([
            'success' => true,
            'categoria' => 'Financiera',
            'total_proyeccion' => $total_proyeccion,
            'total_formateado' => number_format($total_proyeccion, 0, ',', ','),
            'categorias_incluidas' => ['MO', 'IC', 'EM', 'IE', 'SC', 'AD', 'CL', 'CT'],
            'detalles' => [
                'proyecto_id' => $proyecto_id,
                'total_registros' => intval($verificacion['total'] ?? 0),
                'filtros_aplicados' => [
                    'fecha_desde' => $fecha_desde,
                    'fecha_hasta' => $fecha_hasta
                ],
                'rango_datos' => [
                    'periodo_minimo' => $resultado['periodo_minimo'],
                    'periodo_maximo' => $resultado['periodo_maximo']
                ],
                'debug_info' => [
                    'registros_unicos' => $verificacion['total'] ?? 0,
                    'total_registros' => $verificacion['total'] ?? 0,
                    'valor_original' => $resultado['total_proyeccion'] ?? 0,
                    'valor_final' => $total_proyeccion,
                    'tipo_calculo' => 'SUMA DIRECTA - Sin correcciones',
                    'filtros_aplicados' => [
                        'fecha_desde' => $fecha_desde,
                        'fecha_hasta' => $fecha_hasta
                    ]
                ]
            ]
        ]);
    }

} catch (Exception $e) {
    error_log("❌ ERROR EN PROYECCIÓN FINANCIERA: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener proyección financiera: ' . $e->getMessage()
    ]);
}
?> 