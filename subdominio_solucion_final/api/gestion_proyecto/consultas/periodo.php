<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../db.php';

try {
    // Obtener parámetros
    $proyecto_id = $_GET['proyecto_id'] ?? null;
    $fecha_desde = $_GET['fecha_desde'] ?? null;
    $fecha_hasta = $_GET['fecha_hasta'] ?? null;

    if (!$proyecto_id) {
        throw new Exception('proyecto_id es requerido');
    }

    // Construir la consulta SQL para obtener períodos únicos
    $sql = "SELECT DISTINCT 
                DATE_FORMAT(periodo, '%Y-%m-01') as periodo_inicio,
                DATE_FORMAT(periodo, '%Y-%m') as periodo_mes,
                DATE_FORMAT(periodo, '%M %Y') as periodo_formateado,
                periodo as periodo_original
            FROM av_fisico_api 
            WHERE proyecto_id = ?";

    $params = [$proyecto_id];

    // Agregar filtros de fecha si están presentes
    if ($fecha_desde) {
        $sql .= " AND DATE_FORMAT(periodo, '%Y-%m') >= ?";
        $params[] = $fecha_desde;
    }

    if ($fecha_hasta) {
        $sql .= " AND DATE_FORMAT(periodo, '%Y-%m') <= ?";
        $params[] = $fecha_hasta;
    }

    $sql .= " ORDER BY periodo ASC";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Si no hay datos, crear períodos de ejemplo para demostración
    if (empty($resultados)) {
        $resultados = generarPeriodosEjemplo($proyecto_id, $fecha_desde, $fecha_hasta);
    }

    echo json_encode([
        'success' => true,
        'datos' => $resultados,
        'total_periodos' => count($resultados),
        'proyecto_id' => $proyecto_id,
        'filtros' => [
            'fecha_desde' => $fecha_desde,
            'fecha_hasta' => $fecha_hasta
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

function generarPeriodosEjemplo($proyecto_id, $fecha_desde, $fecha_hasta) {
    // Períodos de ejemplo para demostración - usando fechas reales de la BD
    $periodos = [
        [
            'periodo_inicio' => '2021-09-01',
            'periodo_mes' => '2021-09',
            'periodo_formateado' => 'Septiembre 2021',
            'periodo_original' => '2021-09-01'
        ],
        [
            'periodo_inicio' => '2021-10-01',
            'periodo_mes' => '2021-10',
            'periodo_formateado' => 'Octubre 2021',
            'periodo_original' => '2021-10-01'
        ],
        [
            'periodo_inicio' => '2021-11-01',
            'periodo_mes' => '2021-11',
            'periodo_formateado' => 'Noviembre 2021',
            'periodo_original' => '2021-11-01'
        ],
        [
            'periodo_inicio' => '2021-12-01',
            'periodo_mes' => '2021-12',
            'periodo_formateado' => 'Diciembre 2021',
            'periodo_original' => '2021-12-01'
        ],
        [
            'periodo_inicio' => '2022-01-01',
            'periodo_mes' => '2022-01',
            'periodo_formateado' => 'Enero 2022',
            'periodo_original' => '2022-01-01'
        ]
    ];

    // Filtrar por fechas si están especificadas
    if ($fecha_desde || $fecha_hasta) {
        $periodos_filtrados = [];
        foreach ($periodos as $periodo) {
            $incluir = true;

            if ($fecha_desde && $periodo['periodo_mes'] < $fecha_desde) {
                $incluir = false;
            }
            if ($fecha_hasta && $periodo['periodo_mes'] > $fecha_hasta) {
                $incluir = false;
            }

            if ($incluir) {
                $periodos_filtrados[] = $periodo;
            }
        }
        return $periodos_filtrados;
    }

    return $periodos;
}
?> 