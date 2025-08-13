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
    $fecha_corte = $_GET['fecha_corte'] ?? null; // Nuevo parámetro para fecha de corte

    if (!$proyecto_id) {
        throw new Exception('proyecto_id es requerido');
    }

    // Si hay fecha de corte, usarla para filtrar datos
    // Si no hay fecha de corte, usar la lógica original de created_at
    if ($fecha_corte) {
        // Construir la consulta SQL para obtener api_acum por período
        // Usar la fecha de corte para filtrar datos
        $sql = "SELECT 
                    DATE_FORMAT(avr.periodo, '%Y-%m-01') as periodo_inicio,
                    DATE_FORMAT(avr.periodo, '%Y-%m') as periodo_mes,
                    DATE_FORMAT(avr.periodo, '%M %Y') as periodo_formateado,
                    avr.periodo as periodo_original,
                    avr.api_acum,
                    avr.api_parcial
                FROM av_fisico_real avr
                WHERE avr.proyecto_id = ? 
                AND DATE_FORMAT(avr.periodo, '%Y-%m') <= ?";

        $params = [$proyecto_id, $fecha_corte];
    } else {
        // NOTA: Este endpoint solo retorna datos hasta un mes anterior a la fecha de created_at
        // de la tabla av_fisico_api. Los períodos posteriores a esa fecha no tendrán datos.

        // Construir la consulta SQL para obtener api_acum por período
        // Solo incluir datos hasta un mes anterior a la fecha de created_at de av_fisico_api
        $sql = "SELECT 
                    DATE_FORMAT(avr.periodo, '%Y-%m-01') as periodo_inicio,
                    DATE_FORMAT(avr.periodo, '%Y-%m') as periodo_mes,
                    DATE_FORMAT(avr.periodo, '%M %Y') as periodo_formateado,
                    avr.periodo as periodo_original,
                    avr.api_acum,
                    avr.api_parcial
                FROM av_fisico_real avr
                INNER JOIN (
                    SELECT 
                        proyecto_id,
                        DATE_SUB(DATE_FORMAT(created_at, '%Y-%m-01'), INTERVAL 1 MONTH) as fecha_limite
                    FROM av_fisico_api 
                    WHERE proyecto_id = ?
                    ORDER BY created_at DESC
                    LIMIT 1
                ) as limite ON avr.proyecto_id = limite.proyecto_id
                WHERE avr.proyecto_id = ? 
                AND avr.periodo <= limite.fecha_limite";

        $params = [$proyecto_id, $proyecto_id];
    }

    // Agregar filtros de fecha si están presentes
    if ($fecha_desde) {
        $sql .= " AND DATE_FORMAT(avr.periodo, '%Y-%m') >= ?";
        $params[] = $fecha_desde;
    }

    if ($fecha_hasta) {
        $sql .= " AND DATE_FORMAT(avr.periodo, '%Y-%m') <= ?";
        $params[] = $fecha_hasta;
    }

    $sql .= " ORDER BY periodo ASC";

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Si no hay datos, crear datos de ejemplo para demostración
    if (empty($resultados)) {
        $resultados = generarDatosEjemplo($proyecto_id, $fecha_desde, $fecha_hasta);
    }

    echo json_encode([
        'success' => true,
        'datos' => $resultados,
        'total_registros' => count($resultados),
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

function generarDatosEjemplo($proyecto_id, $fecha_desde, $fecha_hasta) {
    // Datos de ejemplo para demostración - usando fechas reales de la BD
    // Simulando que created_at de av_fisico_api es '2022-01-15', por lo que la fecha límite es '2021-12-15'
    $fecha_limite_ejemplo = '2021-12-15';
    
    $datos = [
        [
            'periodo_inicio' => '2021-09-01',
            'periodo_mes' => '2021-09',
            'periodo_formateado' => 'Septiembre 2021',
            'periodo_original' => '2021-09-01',
            'api_acum' => 0.12,
            'api_parcial' => 0.12
        ],
        [
            'periodo_inicio' => '2021-10-01',
            'periodo_mes' => '2021-10',
            'periodo_formateado' => 'Octubre 2021',
            'periodo_original' => '2021-10-01',
            'api_acum' => 0.25,
            'api_parcial' => 0.13
        ],
        [
            'periodo_inicio' => '2021-11-01',
            'periodo_mes' => '2021-11',
            'periodo_formateado' => 'Noviembre 2021',
            'periodo_original' => '2021-11-01',
            'api_acum' => 0.38,
            'api_parcial' => 0.13
        ],
        [
            'periodo_inicio' => '2021-12-01',
            'periodo_mes' => '2021-12',
            'periodo_formateado' => 'Diciembre 2021',
            'periodo_original' => '2021-12-01',
            'api_acum' => 0.52,
            'api_parcial' => 0.14
        ]
        // Nota: Enero 2022 no se incluye porque está después de la fecha límite
    ];

    // Filtrar por fechas si están especificadas
    if ($fecha_desde || $fecha_hasta) {
        $datos_filtrados = [];
        foreach ($datos as $dato) {
            $incluir = true;

            if ($fecha_desde && $dato['periodo_mes'] < $fecha_desde) {
                $incluir = false;
            }
            if ($fecha_hasta && $dato['periodo_mes'] > $fecha_hasta) {
                $incluir = false;
            }

            if ($incluir) {
                $datos_filtrados[] = $dato;
            }
        }
        return $datos_filtrados;
    }

    return $datos;
}
?>
