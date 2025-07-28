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
    }

    // Construir la consulta base para obtener datos de proyección financiera
    // Consultamos la tabla financiero_sap sumando las columnas de categorías VP (MO, IC, EM, IE, SC, AD, CL, CT)
    $sql = "SELECT 
                SUM(MO + IC + EM + IE + SC + AD + CL + CT) as total_proyeccion,
                COUNT(*) as total_registros,
                MIN(periodo) as periodo_minimo,
                MAX(periodo) as periodo_maximo
            FROM financiero_sap 
            WHERE proyecto_id = ?";
    
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
    
    if (!$fecha_desde && !$fecha_hasta) {
        error_log("🔍 SIN FILTROS DE FECHA - mostrando todos los datos");
    }

    // Ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

    // Log para debugging
    error_log("🔍 DEBUG PROYECCIÓN FINANCIERA:");
    error_log("  SQL ejecutado: " . $sql);
    error_log("  Parámetros: " . print_r($params, true));
    error_log("  Resultado: " . print_r($resultado, true));
    error_log("  Total registros: " . ($resultado['total_registros'] ?? 0));
    error_log("  Total proyección: " . ($resultado['total_proyeccion'] ?? 0));

    // Preparar la respuesta
    $total_proyeccion = $resultado['total_proyeccion'] ?? 0;
    
    // Verificar qué categorías VP tienen valores en la tabla
    $sqlCategorias = "SELECT 
                        SUM(MO) as total_mo,
                        SUM(IC) as total_ic,
                        SUM(EM) as total_em,
                        SUM(IE) as total_ie,
                        SUM(SC) as total_sc,
                        SUM(AD) as total_ad,
                        SUM(CL) as total_cl,
                        SUM(CT) as total_ct,
                        COUNT(*) as total_registros
                    FROM financiero_sap 
                    WHERE proyecto_id = ?";
    $stmtCategorias = $pdo->prepare($sqlCategorias);
    $stmtCategorias->execute([$proyecto_id]);
    $totalesCategorias = $stmtCategorias->fetch(PDO::FETCH_ASSOC);
    
    error_log("🔍 TOTALES POR CATEGORÍA VP:");
    error_log("  - MO (CONSTRUCCIÓN): " . number_format($totalesCategorias['total_mo'] ?? 0, 2));
    error_log("  - IC (INDIRECTOS): " . number_format($totalesCategorias['total_ic'] ?? 0, 2));
    error_log("  - EM (EQUIPOS): " . number_format($totalesCategorias['total_em'] ?? 0, 2));
    error_log("  - IE (INGENIERÍA): " . number_format($totalesCategorias['total_ie'] ?? 0, 2));
    error_log("  - SC (SERVICIOS): " . number_format($totalesCategorias['total_sc'] ?? 0, 2));
    error_log("  - AD (ADMINISTRACIÓN): " . number_format($totalesCategorias['total_ad'] ?? 0, 2));
    error_log("  - CL (COSTOS ESPECIALES): " . number_format($totalesCategorias['total_cl'] ?? 0, 2));
    error_log("  - CT (CONTINGENCIA): " . number_format($totalesCategorias['total_ct'] ?? 0, 2));
    error_log("  - Total registros: " . ($totalesCategorias['total_registros'] ?? 0));
    
    // Formatear el resultado como moneda USD
    $proyeccion_formateada = number_format($total_proyeccion, 0, ',', ',');

    $respuesta = [
        'success' => true,
        'categoria' => 'Financiera',
        'total_proyeccion' => $total_proyeccion,
        'total_formateado' => $proyeccion_formateada,
        'categorias_incluidas' => ['MO', 'IC', 'EM', 'IE', 'SC', 'AD', 'CL', 'CT'],
        'totales_por_categoria' => [
            'MO' => $totalesCategorias['total_mo'] ?? 0,
            'IC' => $totalesCategorias['total_ic'] ?? 0,
            'EM' => $totalesCategorias['total_em'] ?? 0,
            'IE' => $totalesCategorias['total_ie'] ?? 0,
            'SC' => $totalesCategorias['total_sc'] ?? 0,
            'AD' => $totalesCategorias['total_ad'] ?? 0,
            'CL' => $totalesCategorias['total_cl'] ?? 0,
            'CT' => $totalesCategorias['total_ct'] ?? 0
        ],
        'detalles' => [
            'proyecto_id' => $proyecto_id,
            'total_registros' => intval($resultado['total_registros']),
            'filtros_aplicados' => [
                'fecha_desde' => $fecha_desde,
                'fecha_hasta' => $fecha_hasta
            ],
            'rango_datos' => [
                'periodo_minimo' => $resultado['periodo_minimo'],
                'periodo_maximo' => $resultado['periodo_maximo']
            ]
        ]
    ];

    // Si no hay datos, agregar información adicional
    if ($resultado['total_registros'] == 0) {
        $respuesta['message'] = 'No se encontraron datos de proyección financiera para los parámetros especificados';
        $respuesta['total_proyeccion'] = 0;
        $respuesta['total_formateado'] = '0';
    }

    echo json_encode($respuesta);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al consultar proyección financiera: ' . $e->getMessage(),
        'categoria' => 'Financiera',
        'total_proyeccion' => 0,
        'total_formateado' => '0'
    ]);
}
?> 