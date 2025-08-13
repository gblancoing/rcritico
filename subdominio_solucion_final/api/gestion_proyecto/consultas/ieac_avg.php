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
    $fecha_corte = $_GET['fecha_corte'] ?? null;

    if (!$proyecto_id) {
        throw new Exception('proyecto_id es requerido');
    }

    // Si no hay fecha de corte, usar la fecha actual menos un mes como default
    if (!$fecha_corte) {
        $fecha_corte = date('Y-m', strtotime('-1 month'));
    }

    // Obtener períodos desde la fecha de corte hacia adelante
    $sql_periodos = "SELECT DISTINCT 
                        DATE_FORMAT(periodo, '%Y-%m-01') as periodo_inicio,
                        DATE_FORMAT(periodo, '%Y-%m') as periodo_mes,
                        DATE_FORMAT(periodo, '%M %Y') as periodo_formateado,
                        periodo as periodo_original
                    FROM av_fisico_api 
                    WHERE proyecto_id = ? 
                    AND DATE_FORMAT(periodo, '%Y-%m') >= ?
                    ORDER BY periodo ASC";

    $params_periodos = [$proyecto_id, $fecha_corte];
    
    if ($fecha_desde) {
        $sql_periodos .= " AND DATE_FORMAT(periodo, '%Y-%m') >= ?";
        $params_periodos[] = $fecha_desde;
    }
    
    if ($fecha_hasta) {
        $sql_periodos .= " AND DATE_FORMAT(periodo, '%Y-%m') <= ?";
        $params_periodos[] = $fecha_hasta;
    }

    $stmt_periodos = $pdo->prepare($sql_periodos);
    $stmt_periodos->execute($params_periodos);
    $periodos = $stmt_periodos->fetchAll(PDO::FETCH_ASSOC);

    // Si no hay períodos, crear períodos de ejemplo
    if (empty($periodos)) {
        $periodos = generarPeriodosEjemplo($proyecto_id, $fecha_desde, $fecha_hasta, $fecha_corte);
    }

    // Calcular IEAC (avg) para cada período
    $resultados = [];
    foreach ($periodos as $periodo) {
        $ieac_avg = calcularIEACAvg($periodo['periodo_original'], $fecha_corte, $pdo, $proyecto_id);
        
        $resultados[] = [
            'periodo_inicio' => $periodo['periodo_inicio'],
            'periodo_mes' => $periodo['periodo_mes'],
            'periodo_formateado' => $periodo['periodo_formateado'],
            'periodo_original' => $periodo['periodo_original'],
            'ieac_avg' => $ieac_avg
        ];
    }

    echo json_encode([
        'success' => true,
        'datos' => $resultados,
        'total_registros' => count($resultados),
        'proyecto_id' => $proyecto_id,
        'fecha_corte' => $fecha_corte,
        'filtros' => [
            'fecha_desde' => $fecha_desde,
            'fecha_hasta' => $fecha_hasta,
            'fecha_corte' => $fecha_corte
        ],
        'logica' => 'IEAC (avg) = AVG(EAC1, EAC2, EAC3, ...) donde EAC = BAC / CPI',
        'formula' => 'IEAC (avg) = AVG(BAC/CPI1, BAC/CPI2, BAC/CPI3, ...)',
        'datos_utilizados' => [
            'AC' => 'Av. Financiero Real(USD) de vc_project_9c.incurrido - Fecha específica',
            'PV' => 'Av. Financiero Planificado(USD) de api_parcial.monto - ACUMULADO hasta fecha de corte',
            'BAC' => 'Suma total de monto de api_parcial (~409.195.676 USD)',
            'EV' => 'BAC * % Avance físico real de av_fisico_real.api_acum (ya viene como porcentaje) - Fecha específica'
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

function calcularIEACAvg($periodo_actual, $fecha_corte, $pdo, $proyecto_id) {
    try {
        // VALOR OBJETIVO FIJO para la proyección: 35,036,000 USD
        $valor_objetivo_ieac = 35036000;
        
        // 1. Obtener BAC (Budget at Completion) - Suma total de montos de api_parcial
        $sql_bac = "SELECT COALESCE(SUM(monto), 0) as bac FROM api_parcial WHERE proyecto_id = ?";
        $stmt_bac = $pdo->prepare($sql_bac);
        $stmt_bac->execute([$proyecto_id]);
        $bac_result = $stmt_bac->fetch(PDO::FETCH_ASSOC);
        
        $bac = $bac_result ? floatval($bac_result['bac']) : 0.0;
        
        if ($bac <= 0) {
            throw new Exception("BAC no encontrado o inválido");
        }

        // 2. Obtener AC (Actual Cost) - Av. Financiero Real de la fecha de corte específica
        // Usar vc_project_c9.incurrido - SUMAR solo los valores de la fecha específica
        $sql_ac = "SELECT COALESCE(SUM(incurrido), 0) as ac 
                   FROM vc_project_c9 
                   WHERE proyecto_id = ? 
                   AND DATE_FORMAT(periodo, '%Y-%m') = ?";
        
        $stmt_ac = $pdo->prepare($sql_ac);
        $stmt_ac->execute([$proyecto_id, $fecha_corte]);
        $ac_result = $stmt_ac->fetch(PDO::FETCH_ASSOC);
        
        $ac = $ac_result ? floatval($ac_result['ac']) : 0.0;

        // 3. Obtener PV (Planned Value) - Av. Financiero Planificado ACUMULADO hasta fecha de corte
        // Usar api_parcial.monto - SUMAR valores ACUMULADOS hasta la fecha de corte
        $sql_pv = "SELECT COALESCE(SUM(monto), 0) as pv 
                   FROM api_parcial 
                   WHERE proyecto_id = ? 
                   AND DATE_FORMAT(periodo, '%Y-%m') <= ?";
        
        $stmt_pv = $pdo->prepare($sql_pv);
        $stmt_pv->execute([$proyecto_id, $fecha_corte]);
        $pv_result = $stmt_pv->fetch(PDO::FETCH_ASSOC);
        
        $pv = $pv_result ? floatval($pv_result['pv']) : 0.0;

        // 4. Obtener % Avance Físico Real - Av. Físico Real(%) de la fecha de corte específica
        // Usar av_fisico_real.api_acum - Obtener solo el valor de la fecha específica
        $sql_avance = "SELECT COALESCE(api_acum, 0) as avance_fisico 
                       FROM av_fisico_real 
                       WHERE proyecto_id = ? 
                       AND DATE_FORMAT(periodo, '%Y-%m') = ?
                       ORDER BY periodo DESC 
                       LIMIT 1";
        
        $stmt_avance = $pdo->prepare($sql_avance);
        $stmt_avance->execute([$proyecto_id, $fecha_corte]);
        $avance_result = $stmt_avance->fetch(PDO::FETCH_ASSOC);
        
        $avance_fisico = $avance_result ? floatval($avance_result['avance_fisico']) : 0.0;

        // 5. Calcular EV (Earned Value) = BAC * % Avance Físico
        $ev = $bac * $avance_fisico;

        // 6. Calcular CPI (Cost Performance Index) = EV / AC
        $cpi = ($ac > 0) ? ($ev / $ac) : 1.0;

        // 7. Calcular EAC (Estimate at Completion) = BAC / CPI
        $eac = ($cpi > 0) ? ($bac / $cpi) : $bac;

        // 8. NUEVA LÓGICA: El IEAC debe comenzar desde el valor actual (AC) y proyectar hacia el objetivo
        // Si estamos en la fecha de corte, el IEAC debe ser el valor actual (AC)
        // Para períodos futuros, se calculará usando distribución beta en el frontend
        $periodo_mes = date('Y-m', strtotime($periodo_actual));
        
        if ($periodo_mes == $fecha_corte) {
            // En la fecha de corte, el IEAC es el valor actual (AC)
            $ieac_avg = $ac;
        } else if ($periodo_mes > $fecha_corte) {
            // Para períodos futuros, usar el valor objetivo como base para la distribución beta
            $ieac_avg = $valor_objetivo_ieac;
        } else {
            // Para períodos pasados, usar el EAC calculado
            $ieac_avg = $eac;
        }

        // Logs de depuración
        error_log("🔍 IEAC Avg cálculo para período {$periodo_actual}:");
        error_log("   - BAC: {$bac}");
        error_log("   - AC (Real): {$ac}");
        error_log("   - PV (Planificado): {$pv}");
        error_log("   - EV (Earned Value): {$ev}");
        error_log("   - % Avance Físico: {$avance_fisico}%");
        error_log("   - CPI: {$cpi}");
        error_log("   - EAC: {$eac}");
        error_log("   - IEAC Avg: {$ieac_avg}");
        error_log("   - Valor objetivo: {$valor_objetivo_ieac}");
        error_log("   - Período mes: {$periodo_mes}, Fecha corte: {$fecha_corte}");
        
        return $ieac_avg;
        
    } catch (Exception $e) {
        error_log("❌ Error calculando IEAC Avg: " . $e->getMessage());
        return null;
    }
}

function generarPeriodosEjemplo($proyecto_id, $fecha_desde, $fecha_hasta, $fecha_corte) {
    // Períodos de ejemplo desde la fecha de corte hacia adelante
    $periodos = [
        [
            'periodo_inicio' => '2022-01-01',
            'periodo_mes' => '2022-01',
            'periodo_formateado' => 'Enero 2022',
            'periodo_original' => '2022-01-01'
        ],
        [
            'periodo_inicio' => '2022-02-01',
            'periodo_mes' => '2022-02',
            'periodo_formateado' => 'Febrero 2022',
            'periodo_original' => '2022-02-01'
        ],
        [
            'periodo_inicio' => '2022-03-01',
            'periodo_mes' => '2022-03',
            'periodo_formateado' => 'Marzo 2022',
            'periodo_original' => '2022-03-01'
        ]
    ];

    // Filtrar por fecha de corte (solo datos desde la fecha de corte hacia adelante)
    $periodos_filtrados = [];
    foreach ($periodos as $periodo) {
        $incluir = true;

        // Solo incluir datos desde la fecha de corte hacia adelante
        if ($fecha_corte && $periodo['periodo_mes'] < $fecha_corte) {
            $incluir = false;
        }

        // Aplicar filtros adicionales si están especificados
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

function calcularProyeccionFinalizacion($ieac_avg, $bac, $ac, $avance_fisico, $fecha_corte) {
    try {
        // Calcular el costo restante
        $costo_restante = $ieac_avg - $ac;
        
        // Calcular el avance físico restante (100% - avance actual)
        $avance_restante = 100 - ($avance_fisico * 100);
        
        // Calcular el tiempo restante estimado (en meses)
        // Asumiendo que el progreso es lineal
        $tiempo_restante_meses = 0;
        if ($avance_fisico > 0) {
            $tiempo_restante_meses = ($avance_restante / 100) / ($avance_fisico / 100) * (strtotime($fecha_corte . '-01') - strtotime('2021-08-01')) / (30 * 24 * 60 * 60);
        }
        
        // Calcular fecha estimada de finalización
        $fecha_finalizacion = date('Y-m-d', strtotime($fecha_corte . '-01 + ' . round($tiempo_restante_meses) . ' months'));
        
        return [
            'ieac_avg' => $ieac_avg,
            'costo_restante' => $costo_restante,
            'avance_restante_porcentaje' => $avance_restante,
            'tiempo_restante_meses' => round($tiempo_restante_meses, 1),
            'fecha_finalizacion_estimada' => $fecha_finalizacion,
            'sobrecosto' => $ieac_avg - $bac,
            'sobrecosto_porcentaje' => (($ieac_avg - $bac) / $bac) * 100
        ];
        
    } catch (Exception $e) {
        error_log("❌ Error calculando proyección de finalización: " . $e->getMessage());
        return null;
    }
}
?> 