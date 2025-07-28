<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);

// Parámetros requeridos
$proyecto_id = $data['proyecto_id'] ?? null;
$periodo_inicio = $data['periodo_inicio'] ?? null;
$periodo_fin = $data['periodo_fin'] ?? null;

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
                COUNT(*) as total_registros
            FROM predictividad 
            WHERE proyecto_id = ?";
    
    $params = [$proyecto_id];

    // Agregar filtros de período si se proporcionan
    if ($periodo_inicio && $periodo_fin) {
        $sql .= " AND periodo_prediccion BETWEEN ? AND ?";
        $params[] = $periodo_inicio;
        $params[] = $periodo_fin;
    } elseif ($periodo_inicio) {
        $sql .= " AND periodo_prediccion >= ?";
        $params[] = $periodo_inicio;
    } elseif ($periodo_fin) {
        $sql .= " AND periodo_prediccion <= ?";
        $params[] = $periodo_fin;
    }

    // Ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

    // Obtener también el valor total del proyecto para calcular el monto
    $stmtProyecto = $pdo->prepare("SELECT valor_total FROM proyectos WHERE proyecto_id = ?");
    $stmtProyecto->execute([$proyecto_id]);
    $proyectoInfo = $stmtProyecto->fetch();

    $valorTotal = $proyectoInfo['valor_total'] ?? 0;
    $porcentajeSuma = $resultado['proyeccion_fisica'] ?? 0;
    
    // Calcular el monto en USD
    $montoProyeccion = ($valorTotal * $porcentajeSuma) / 100;

    // Formatear el monto como USD
    $montoFormateado = number_format($montoProyeccion, 0, ',', ',');

    $respuesta = [
        'success' => true,
        'proyeccion_fisica' => [
            'porcentaje_total' => round($porcentajeSuma, 2),
            'monto_usd' => $montoFormateado,
            'monto_numerico' => $montoProyeccion,
            'total_registros' => $resultado['total_registros'] ?? 0,
            'valor_total_proyecto' => $valorTotal
        ],
        'filtros_aplicados' => [
            'proyecto_id' => $proyecto_id,
            'periodo_inicio' => $periodo_inicio,
            'periodo_fin' => $periodo_fin
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