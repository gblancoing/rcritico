<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);

// Parámetros requeridos
$proyecto_id = $data['proyecto_id'] ?? null;
$periodos = $data['periodos'] ?? []; // Array de fechas específicas

if (!$proyecto_id) {
    echo json_encode(['success' => false, 'error' => 'proyecto_id es requerido']);
    exit;
}

try {
    // Verificar que el proyecto existe
    $stmt = $pdo->prepare("SELECT proyecto_id FROM proyectos WHERE proyecto_id = ?");
    $stmt->execute([$proyecto_id]);
    $proyecto = $stmt->fetch();

    if (!$proyecto) {
        echo json_encode(['success' => false, 'error' => 'El proyecto_id especificado no existe']);
        exit;
    }

    // Construir la consulta base
    $sql = "SELECT 
                SUM(porcentaje_predicido) as proyeccion_fisica,
                COUNT(*) as total_registros,
                GROUP_CONCAT(DISTINCT periodo_prediccion ORDER BY periodo_prediccion) as periodos_incluidos
            FROM predictividad 
            WHERE proyecto_id = ?";
    
    $params = [$proyecto_id];

    // Agregar filtro de períodos específicos si se proporcionan
    if (!empty($periodos) && is_array($periodos)) {
        $placeholders = str_repeat('?,', count($periodos) - 1) . '?';
        $sql .= " AND periodo_prediccion IN ($placeholders)";
        $params = array_merge($params, $periodos);
    }

    // Ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

    // Obtener el valor total del proyecto
    $stmtProyecto = $pdo->prepare("SELECT valor_total FROM proyectos WHERE proyecto_id = ?");
    $stmtProyecto->execute([$proyecto_id]);
    $proyectoInfo = $stmtProyecto->fetch();

    $valorTotal = $proyectoInfo['valor_total'] ?? 0;
    $porcentajeSuma = $resultado['proyeccion_fisica'] ?? 0;
    
    // Calcular el monto en USD
    $montoProyeccion = ($valorTotal * $porcentajeSuma) / 100;

    // Formatear el monto como USD
    $montoFormateado = number_format($montoProyeccion, 0, ',', ',');

    // Obtener detalles por período si se solicitan
    $detallesPorPeriodo = [];
    if (!empty($periodos)) {
        $sqlDetalles = "SELECT 
                            periodo_prediccion,
                            porcentaje_predicido,
                            valor_real_porcentaje
                        FROM predictividad 
                        WHERE proyecto_id = ? AND periodo_prediccion IN ($placeholders)
                        ORDER BY periodo_prediccion";
        
        $stmtDetalles = $pdo->prepare($sqlDetalles);
        $paramsDetalles = array_merge([$proyecto_id], $periodos);
        $stmtDetalles->execute($paramsDetalles);
        
        while ($row = $stmtDetalles->fetch(PDO::FETCH_ASSOC)) {
            $detallesPorPeriodo[] = [
                'periodo' => $row['periodo_prediccion'],
                'porcentaje_predicido' => $row['porcentaje_predicido'],
                'valor_real_porcentaje' => $row['valor_real_porcentaje']
            ];
        }
    }

    $respuesta = [
        'success' => true,
        'proyeccion_fisica' => [
            'porcentaje_total' => round($porcentajeSuma, 2),
            'monto_usd' => $montoFormateado,
            'monto_numerico' => $montoProyeccion,
            'total_registros' => $resultado['total_registros'] ?? 0,
            'valor_total_proyecto' => $valorTotal,
            'periodos_incluidos' => $resultado['periodos_incluidos'] ?? '',
            'detalles_por_periodo' => $detallesPorPeriodo
        ],
        'filtros_aplicados' => [
            'proyecto_id' => $proyecto_id,
            'periodos_consultados' => $periodos
        ]
    ];

    echo json_encode($respuesta);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener proyección física: ' . $e->getMessage()
    ]);
}
?> 