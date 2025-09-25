<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitudes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

try {
    // Obtener parámetros
    $proyecto_id = $_GET['proyecto_id'] ?? null;
    $plazo_control = $_GET['plazo_control'] ?? null;
    
    if (!$proyecto_id) {
        throw new Exception('proyecto_id es requerido');
    }
    
    if (!$plazo_control) {
        throw new Exception('plazo_control es requerido');
    }
    
    // Consulta SQL para calcular Costo Ganado para todos los períodos
    $sql = "
    SELECT 
        lb.periodo,
        lb.proyecto_id,
        
        -- GRUPO A: api_acumulada (categorías EM, MO, IC, IE, SC) con validación
        CASE 
            WHEN (SELECT api_acum FROM av_fisico_real WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id) = 0 
                 OR (SELECT api_acum FROM av_fisico_api WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id) = 0
            THEN 0
            ELSE (
                (SELECT SUM(monto) 
                 FROM api_acumulada 
                 WHERE periodo = lb.periodo 
                   AND proyecto_id = lb.proyecto_id
                   AND cat_vp IN ('EM', 'MO', 'IC', 'IE', 'SC'))
                / 
                (SELECT api_acum FROM av_fisico_api WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id)
                * 
                (SELECT api_acum FROM av_fisico_real WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id)
            )
        END as resultado_grupo_a,
        
        -- GRUPO B: AD (50% avance + 50% plazo)
        (
            (SELECT base 
             FROM vc_project_9c 
             WHERE periodo = lb.periodo 
               AND proyecto_id = lb.proyecto_id 
               AND cat_vp = 'AD')
            * 
            (0.5 * (SELECT api_acum FROM av_fisico_real WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id) + 
             0.5 * (
                 (SELECT COUNT(DISTINCT periodo) FROM av_fisico_api WHERE proyecto_id = lb.proyecto_id AND periodo <= lb.periodo)
                 / 
                 (SELECT COUNT(DISTINCT periodo) FROM av_fisico_api WHERE proyecto_id = lb.proyecto_id)
             ))
        ) as resultado_grupo_b,
        
        -- GRUPO C: CL + CT (suma de incurrido)
        (SELECT SUM(incurrido) 
         FROM vc_project_9c 
         WHERE periodo = lb.periodo 
           AND proyecto_id = lb.proyecto_id 
           AND cat_vp IN ('CL', 'CT')) as resultado_grupo_c,
        
        -- COSTO GANADO TOTAL (suma de los 3 grupos)
        (
            -- Grupo A (CORREGIDO: usa api_acumulada.monto como en la columna individual)
            CASE 
                WHEN (SELECT api_acum FROM av_fisico_real WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id) = 0 
                     OR (SELECT api_acum FROM av_fisico_api WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id) = 0
                THEN 0
                ELSE (
                    (SELECT SUM(monto) 
                     FROM api_acumulada 
                     WHERE periodo = lb.periodo 
                       AND proyecto_id = lb.proyecto_id
                       AND cat_vp IN ('EM', 'MO', 'IC', 'IE', 'SC'))
                    / 
                    (SELECT api_acum FROM av_fisico_api WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id)
                    * 
                    (SELECT api_acum FROM av_fisico_real WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id)
                )
            END
            +
            -- Grupo B
            (
                (SELECT base 
                 FROM vc_project_9c 
                 WHERE periodo = lb.periodo 
                   AND proyecto_id = lb.proyecto_id 
                   AND cat_vp = 'AD')
                * 
                (0.5 * (SELECT api_acum FROM av_fisico_real WHERE periodo = lb.periodo AND proyecto_id = lb.proyecto_id) + 
                 0.5 * (
                     (SELECT COUNT(DISTINCT periodo) FROM av_fisico_api WHERE proyecto_id = lb.proyecto_id AND periodo <= lb.periodo)
                     / 
                     (SELECT COUNT(DISTINCT periodo) FROM av_fisico_api WHERE proyecto_id = lb.proyecto_id)
                 ))
            )
            +
            -- Grupo C
            (SELECT SUM(incurrido) 
             FROM vc_project_9c 
             WHERE periodo = lb.periodo 
               AND proyecto_id = lb.proyecto_id 
               AND cat_vp IN ('CL', 'CT'))
        ) as costo_ganado_total

    FROM (
        -- Base de datos de Líneas Bases - Real/Proyectado
        SELECT DISTINCT periodo, proyecto_id
        FROM av_fisico_api 
        WHERE proyecto_id = ?
    ) AS lb

    WHERE lb.proyecto_id = ?
      AND lb.periodo <= (
          -- Obtener el período correspondiente al Plazo Control
          SELECT periodo 
          FROM av_fisico_api 
          WHERE proyecto_id = ?
          ORDER BY periodo ASC
          LIMIT 1 OFFSET ?
      )
    ORDER BY lb.periodo
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$proyecto_id, $proyecto_id, $proyecto_id, $plazo_control - 1]);
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Crear un array asociativo por período para fácil acceso
    $costoGanadoPorPeriodo = [];
    foreach ($resultados as $row) {
        $costoGanadoPorPeriodo[$row['periodo']] = $row['costo_ganado_total'];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $costoGanadoPorPeriodo,
        'raw_data' => $resultados,
        'message' => 'Costo Ganado calculado exitosamente'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Error al calcular Costo Ganado'
    ]);
}
?>
