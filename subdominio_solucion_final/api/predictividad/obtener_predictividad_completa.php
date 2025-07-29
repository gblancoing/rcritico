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
$periodos = $data['periodos'] ?? []; // Array de fechas específicas

if (!$proyecto_id) {
    echo json_encode(['success' => false, 'error' => 'proyecto_id es requerido']);
    exit;
}

try {
    // Verificar que el proyecto existe
    $stmt = $pdo->prepare("SELECT proyecto_id, valor_total FROM proyectos WHERE proyecto_id = ?");
    $stmt->execute([$proyecto_id]);
    $proyecto = $stmt->fetch();

    if (!$proyecto) {
        echo json_encode(['success' => false, 'error' => 'El proyecto_id especificado no existe']);
        exit;
    }

    $valorTotal = $proyecto['valor_total'] ?? 0;
    $params = [$proyecto_id];
    $whereClause = "WHERE proyecto_id = ?";

    // Agregar filtros de período
    if (!empty($periodos) && is_array($periodos)) {
        $placeholders = str_repeat('?,', count($periodos) - 1) . '?';
        $whereClause .= " AND periodo_prediccion IN ($placeholders)";
        $params = array_merge($params, $periodos);
    } elseif ($periodo_inicio && $periodo_fin) {
        $whereClause .= " AND periodo_prediccion BETWEEN ? AND ?";
        $params[] = $periodo_inicio;
        $params[] = $periodo_fin;
    } elseif ($periodo_inicio) {
        $whereClause .= " AND periodo_prediccion >= ?";
        $params[] = $periodo_inicio;
    } elseif ($periodo_fin) {
        $whereClause .= " AND periodo_prediccion <= ?";
        $params[] = $periodo_fin;
    }

    // 1. OBTENER DATOS FÍSICOS (de tabla predictividad)
    $sqlFisica = "SELECT 
                    SUM(porcentaje_predicido) as proyeccion_fisica,
                    SUM(valor_real_porcentaje) as real_fisica,
                    COUNT(*) as total_registros
                  FROM predictividad 
                  $whereClause";
    
    $stmtFisica = $pdo->prepare($sqlFisica);
    $stmtFisica->execute($params);
    $resultadoFisica = $stmtFisica->fetch(PDO::FETCH_ASSOC);

    // 2. OBTENER DATOS FINANCIEROS (de tabla financiero_sap)
    $sqlFinanciera = "SELECT 
                        SUM(porcentaje_predicido) as proyeccion_financiera,
                        SUM(valor_real_porcentaje) as real_financiera,
                        COUNT(*) as total_registros
                      FROM financiero_sap 
                      $whereClause";
    
    $stmtFinanciera = $pdo->prepare($sqlFinanciera);
    $stmtFinanciera->execute($params);
    $resultadoFinanciera = $stmtFinanciera->fetch(PDO::FETCH_ASSOC);

    // Calcular montos y desviaciones
    $datos = [
        'financiera' => [
            'proyeccion' => [
                'porcentaje' => $resultadoFinanciera['proyeccion_financiera'] ?? 0,
                'monto_usd' => number_format(($valorTotal * ($resultadoFinanciera['proyeccion_financiera'] ?? 0)) / 100, 0, ',', ','),
                'monto_numerico' => ($valorTotal * ($resultadoFinanciera['proyeccion_financiera'] ?? 0)) / 100
            ],
            'real' => [
                'porcentaje' => $resultadoFinanciera['real_financiera'] ?? 0,
                'monto_usd' => number_format(($valorTotal * ($resultadoFinanciera['real_financiera'] ?? 0)) / 100, 0, ',', ','),
                'monto_numerico' => ($valorTotal * ($resultadoFinanciera['real_financiera'] ?? 0)) / 100
            ],
            'desviacion' => [
                'porcentaje' => ($resultadoFinanciera['real_financiera'] ?? 0) - ($resultadoFinanciera['proyeccion_financiera'] ?? 0),
                'monto_usd' => number_format(($valorTotal * (($resultadoFinanciera['real_financiera'] ?? 0) - ($resultadoFinanciera['proyeccion_financiera'] ?? 0))) / 100, 0, ',', ','),
                'monto_numerico' => ($valorTotal * (($resultadoFinanciera['real_financiera'] ?? 0) - ($resultadoFinanciera['proyeccion_financiera'] ?? 0))) / 100
            ]
        ],
        'fisica' => [
            'proyeccion' => [
                'porcentaje' => $resultadoFisica['proyeccion_fisica'] ?? 0,
                'monto_usd' => number_format(($valorTotal * ($resultadoFisica['proyeccion_fisica'] ?? 0)) / 100, 0, ',', ','),
                'monto_numerico' => ($valorTotal * ($resultadoFisica['proyeccion_fisica'] ?? 0)) / 100
            ],
            'real' => [
                'porcentaje' => $resultadoFisica['real_fisica'] ?? 0,
                'monto_usd' => number_format(($valorTotal * ($resultadoFisica['real_fisica'] ?? 0)) / 100, 0, ',', ','),
                'monto_numerico' => ($valorTotal * ($resultadoFisica['real_fisica'] ?? 0)) / 100
            ],
            'desviacion' => [
                'porcentaje' => ($resultadoFisica['real_fisica'] ?? 0) - ($resultadoFisica['proyeccion_fisica'] ?? 0),
                'monto_usd' => number_format(($valorTotal * (($resultadoFisica['real_fisica'] ?? 0) - ($resultadoFisica['proyeccion_fisica'] ?? 0))) / 100, 0, ',', ','),
                'monto_numerico' => ($valorTotal * (($resultadoFisica['real_fisica'] ?? 0) - ($resultadoFisica['proyeccion_fisica'] ?? 0))) / 100
            ]
        ]
    ];

    // Formatear porcentajes
    foreach (['financiera', 'fisica'] as $categoria) {
        foreach (['proyeccion', 'real', 'desviacion'] as $tipo) {
            $datos[$categoria][$tipo]['porcentaje_formateado'] = number_format($datos[$categoria][$tipo]['porcentaje'], 2) . '%';
        }
    }

    $respuesta = [
        'success' => true,
        'predictividad' => [
            'financiera' => [
                'proyeccion' => [
                    'valor' => $datos['financiera']['proyeccion']['monto_usd'],
                    'porcentaje' => $datos['financiera']['proyeccion']['porcentaje_formateado'],
                    'tiene_datos' => $datos['financiera']['proyeccion']['monto_numerico'] > 0
                ],
                'real' => [
                    'valor' => $datos['financiera']['real']['monto_usd'],
                    'porcentaje' => $datos['financiera']['real']['porcentaje_formateado'],
                    'tiene_datos' => $datos['financiera']['real']['monto_numerico'] > 0
                ],
                'desviacion' => [
                    'valor' => $datos['financiera']['desviacion']['monto_usd'],
                    'porcentaje' => $datos['financiera']['desviacion']['porcentaje_formateado'],
                    'tiene_datos' => $datos['financiera']['desviacion']['monto_numerico'] != 0
                ]
            ],
            'fisica' => [
                'proyeccion' => [
                    'valor' => $datos['fisica']['proyeccion']['monto_usd'],
                    'porcentaje' => $datos['fisica']['proyeccion']['porcentaje_formateado'],
                    'tiene_datos' => $datos['fisica']['proyeccion']['monto_numerico'] > 0
                ],
                'real' => [
                    'valor' => $datos['fisica']['real']['monto_usd'],
                    'porcentaje' => $datos['fisica']['real']['porcentaje_formateado'],
                    'tiene_datos' => $datos['fisica']['real']['monto_numerico'] > 0
                ],
                'desviacion' => [
                    'valor' => $datos['fisica']['desviacion']['monto_usd'],
                    'porcentaje' => $datos['fisica']['desviacion']['porcentaje_formateado'],
                    'tiene_datos' => $datos['fisica']['desviacion']['monto_numerico'] != 0
                ]
            ]
        ],
        'valor_total_proyecto' => $valorTotal,
        'filtros_aplicados' => [
            'proyecto_id' => $proyecto_id,
            'periodo_inicio' => $periodo_inicio,
            'periodo_fin' => $periodo_fin,
            'periodos' => $periodos
        ]
    ];

    echo json_encode($respuesta);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener predictividad completa: ' . $e->getMessage()
    ]);
}
?> 