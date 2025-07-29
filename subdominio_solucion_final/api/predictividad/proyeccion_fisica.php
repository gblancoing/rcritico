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
    
    error_log("🔍 PROYECCIÓN FÍSICA - PROYECTO ID: " . $proyecto_id);
    error_log("🔍 FECHA DESDE: " . ($fecha_desde ?? 'NULL'));
    error_log("🔍 FECHA HASTA: " . ($fecha_hasta ?? 'NULL'));

    // Verificar que el proyecto existe en la tabla predictividad
    $sqlVerificar = "SELECT COUNT(*) as total FROM predictividad WHERE proyecto_id = ?";
    $stmtVerificar = $pdo->prepare($sqlVerificar);
    $stmtVerificar->execute([$proyecto_id]);
    $verificacion = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
    
    error_log("🔍 VERIFICACIÓN PREDICTIVIDAD:");
    error_log("  Total registros para proyecto_id $proyecto_id: " . ($verificacion['total'] ?? 0));
    
    if (($verificacion['total'] ?? 0) == 0) {
        error_log("❌ NO HAY DATOS PARA ESTE PROYECTO EN predictividad");
    }

    // Construir la consulta base para obtener datos de proyección física
    // Consultamos la tabla predictividad usando periodo_cierre_real y obteniendo porcentaje_predicido
    $sql = "SELECT 
                SUM(porcentaje_predicido) as total_proyeccion_fisica,
                COUNT(*) as total_registros,
                MIN(periodo_cierre_real) as periodo_minimo,
                MAX(periodo_cierre_real) as periodo_maximo
            FROM predictividad 
            WHERE proyecto_id = ?";
    
    $params = [$proyecto_id];

    // Agregar filtros de fecha usando periodo_cierre_real
    // Para filtrar por mes, buscamos registros donde periodo_cierre_real esté dentro del mes seleccionado
    if ($fecha_desde && $fecha_hasta) {
        // Extraer año y mes del filtro (formato YYYY-MM)
        $partes_desde = explode('-', $fecha_desde);
        $partes_hasta = explode('-', $fecha_hasta);
        
        if (count($partes_desde) == 2 && count($partes_hasta) == 2) {
            $anio_desde = $partes_desde[0];
            $mes_desde = $partes_desde[1];
            $anio_hasta = $partes_hasta[0];
            $mes_hasta = $partes_hasta[1];
            
            // Si es el mismo mes, buscar registros de ese mes específico
            if ($anio_desde == $anio_hasta && $mes_desde == $mes_hasta) {
                $sql .= " AND YEAR(periodo_cierre_real) = ? AND MONTH(periodo_cierre_real) = ?";
                $params[] = $anio_desde;
                $params[] = $mes_desde;
                error_log("🔍 FILTRO MES ESPECÍFICO: Año $anio_desde, Mes $mes_desde");
            } else {
                // Si es un rango, convertir a fechas completas
                $fecha_desde_completa = $fecha_desde . '-01';
                $fecha_hasta_completa = $fecha_hasta . '-31'; // Último día del mes
                $sql .= " AND periodo_cierre_real >= ? AND periodo_cierre_real <= ?";
                $params[] = $fecha_desde_completa;
                $params[] = $fecha_hasta_completa;
                error_log("🔍 FILTRO RANGO: $fecha_desde_completa a $fecha_hasta_completa");
            }
        }
    } elseif ($fecha_desde) {
        // Solo fecha desde
        $partes_desde = explode('-', $fecha_desde);
        if (count($partes_desde) == 2) {
            $anio_desde = $partes_desde[0];
            $mes_desde = $partes_desde[1];
            $fecha_desde_completa = $fecha_desde . '-01';
            $sql .= " AND periodo_cierre_real >= ?";
            $params[] = $fecha_desde_completa;
            error_log("🔍 FILTRO fecha_desde aplicado: $fecha_desde_completa");
        }
    } elseif ($fecha_hasta) {
        // Solo fecha hasta
        $partes_hasta = explode('-', $fecha_hasta);
        if (count($partes_hasta) == 2) {
            $anio_hasta = $partes_hasta[0];
            $mes_hasta = $partes_hasta[1];
            $fecha_hasta_completa = $fecha_hasta . '-31';
            $sql .= " AND periodo_cierre_real <= ?";
            $params[] = $fecha_hasta_completa;
            error_log("🔍 FILTRO fecha_hasta aplicado: $fecha_hasta_completa");
        }
    }
    
    if (!$fecha_desde && !$fecha_hasta) {
        error_log("🔍 SIN FILTROS DE FECHA - mostrando todos los datos");
    }

    // Ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

    // Log para debugging
    error_log("🔍 DEBUG PROYECCIÓN FÍSICA:");
    error_log("  SQL ejecutado: " . $sql);
    error_log("  Parámetros: " . print_r($params, true));
    error_log("  Resultado: " . print_r($resultado, true));
    error_log("  Total registros: " . ($resultado['total_registros'] ?? 0));
    error_log("  Total proyección física (%): " . ($resultado['total_proyeccion_fisica'] ?? 0));

    // Preparar la respuesta
    $total_proyeccion_fisica = $resultado['total_proyeccion_fisica'] ?? 0;
    
    // Verificar qué registros específicos se encontraron
    $sqlDetalle = "SELECT 
                        periodo_cierre_real,
                        porcentaje_predicido,
                        periodo_prediccion
                    FROM predictividad 
                    WHERE proyecto_id = ?";
    
    $paramsDetalle = [$proyecto_id];
    
    // Aplicar la misma lógica de filtro para la consulta de detalle
    if ($fecha_desde && $fecha_hasta) {
        // Extraer año y mes del filtro (formato YYYY-MM)
        $partes_desde = explode('-', $fecha_desde);
        $partes_hasta = explode('-', $fecha_hasta);
        
        if (count($partes_desde) == 2 && count($partes_hasta) == 2) {
            $anio_desde = $partes_desde[0];
            $mes_desde = $partes_desde[1];
            $anio_hasta = $partes_hasta[0];
            $mes_hasta = $partes_hasta[1];
            
            // Si es el mismo mes, buscar registros de ese mes específico
            if ($anio_desde == $anio_hasta && $mes_desde == $mes_hasta) {
                $sqlDetalle .= " AND YEAR(periodo_cierre_real) = ? AND MONTH(periodo_cierre_real) = ?";
                $paramsDetalle[] = $anio_desde;
                $paramsDetalle[] = $mes_desde;
            } else {
                // Si es un rango, convertir a fechas completas
                $fecha_desde_completa = $fecha_desde . '-01';
                $fecha_hasta_completa = $fecha_hasta . '-31'; // Último día del mes
                $sqlDetalle .= " AND periodo_cierre_real >= ? AND periodo_cierre_real <= ?";
                $paramsDetalle[] = $fecha_desde_completa;
                $paramsDetalle[] = $fecha_hasta_completa;
            }
        }
    } elseif ($fecha_desde) {
        // Solo fecha desde
        $partes_desde = explode('-', $fecha_desde);
        if (count($partes_desde) == 2) {
            $fecha_desde_completa = $fecha_desde . '-01';
            $sqlDetalle .= " AND periodo_cierre_real >= ?";
            $paramsDetalle[] = $fecha_desde_completa;
        }
    } elseif ($fecha_hasta) {
        // Solo fecha hasta
        $partes_hasta = explode('-', $fecha_hasta);
        if (count($partes_hasta) == 2) {
            $fecha_hasta_completa = $fecha_hasta . '-31';
            $sqlDetalle .= " AND periodo_cierre_real <= ?";
            $paramsDetalle[] = $fecha_hasta_completa;
        }
    }
    
    $sqlDetalle .= " ORDER BY periodo_cierre_real";
    
    $stmtDetalle = $pdo->prepare($sqlDetalle);
    $stmtDetalle->execute($paramsDetalle);
    $registrosDetalle = $stmtDetalle->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("🔍 REGISTROS ENCONTRADOS:");
    foreach ($registrosDetalle as $registro) {
        error_log("  - periodo_cierre_real: " . $registro['periodo_cierre_real'] . 
                 ", porcentaje_predicido: " . $registro['porcentaje_predicido'] . 
                 ", periodo_prediccion: " . $registro['periodo_prediccion']);
    }
    
    // Formatear el resultado como porcentaje
    $proyeccion_formateada = number_format($total_proyeccion_fisica, 2) . '%';

    $respuesta = [
        'success' => true,
        'categoria' => 'Fisica',
        'total_proyeccion_fisica' => $total_proyeccion_fisica,
        'total_formateado' => $proyeccion_formateada,
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
            ],
            'registros_encontrados' => $registrosDetalle
        ]
    ];

    // Si no hay datos, agregar información adicional
    if ($resultado['total_registros'] == 0) {
        $respuesta['message'] = 'No se encontraron datos de proyección física para los parámetros especificados';
        $respuesta['total_proyeccion_fisica'] = 0;
        $respuesta['total_formateado'] = '0.00%';
    }

    echo json_encode($respuesta);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al consultar proyección física: ' . $e->getMessage(),
        'categoria' => 'Fisica',
        'total_proyeccion_fisica' => 0,
        'total_formateado' => '0.00%'
    ]);
}
?> 