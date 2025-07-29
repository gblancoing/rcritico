<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

try {
    $proyecto_id = 1;
    $fecha_desde = '2025-06-01';
    $fecha_hasta = '2025-06-30';
    
    echo "=== DIAGNÓSTICO PROYECCIÓN FINANCIERA JUNIO 2025 ===\n\n";
    
    // 1. Verificar datos sin filtros de fecha
    echo "1. DATOS SIN FILTROS DE FECHA:\n";
    $sqlSinFiltros = "SELECT 
                        SUM(MO + IC + EM + IE + SC + AD + CL + CT) as total_proyeccion,
                        COUNT(*) as total_registros,
                        COUNT(DISTINCT id_sap) as registros_unicos
                      FROM financiero_sap 
                      WHERE proyecto_id = ?";
    
    $stmtSinFiltros = $pdo->prepare($sqlSinFiltros);
    $stmtSinFiltros->execute([$proyecto_id]);
    $resultadoSinFiltros = $stmtSinFiltros->fetch(PDO::FETCH_ASSOC);
    
    echo "   - Total sin filtros: " . number_format($resultadoSinFiltros['total_proyeccion'] ?? 0, 0, ',', ',') . "\n";
    echo "   - Registros totales: " . ($resultadoSinFiltros['total_registros'] ?? 0) . "\n";
    echo "   - Registros únicos: " . ($resultadoSinFiltros['registros_unicos'] ?? 0) . "\n\n";
    
    // 2. Verificar datos CON filtros de fecha (junio 2025)
    echo "2. DATOS CON FILTROS DE FECHA (JUNIO 2025):\n";
    $sqlConFiltros = "SELECT 
                        SUM(MO + IC + EM + IE + SC + AD + CL + CT) as total_proyeccion,
                        COUNT(*) as total_registros,
                        COUNT(DISTINCT id_sap) as registros_unicos
                      FROM financiero_sap 
                      WHERE proyecto_id = ? 
                      AND periodo >= ? 
                      AND periodo <= ?";
    
    $stmtConFiltros = $pdo->prepare($sqlConFiltros);
    $stmtConFiltros->execute([$proyecto_id, $fecha_desde, $fecha_hasta]);
    $resultadoConFiltros = $stmtConFiltros->fetch(PDO::FETCH_ASSOC);
    
    echo "   - Total con filtros: " . number_format($resultadoConFiltros['total_proyeccion'] ?? 0, 0, ',', ',') . "\n";
    echo "   - Registros totales: " . ($resultadoConFiltros['total_registros'] ?? 0) . "\n";
    echo "   - Registros únicos: " . ($resultadoConFiltros['registros_unicos'] ?? 0) . "\n\n";
    
    // 3. Verificar si hay duplicados en junio
    echo "3. VERIFICACIÓN DE DUPLICADOS EN JUNIO:\n";
    $sqlDuplicadosJunio = "SELECT id_sap, COUNT(*) as cantidad 
                           FROM financiero_sap 
                           WHERE proyecto_id = ? 
                           AND periodo >= ? 
                           AND periodo <= ?
                           GROUP BY id_sap 
                           HAVING COUNT(*) > 1";
    
    $stmtDuplicadosJunio = $pdo->prepare($sqlDuplicadosJunio);
    $stmtDuplicadosJunio->execute([$proyecto_id, $fecha_desde, $fecha_hasta]);
    $duplicadosJunio = $stmtDuplicadosJunio->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($duplicadosJunio)) {
        echo "   - Se encontraron " . count($duplicadosJunio) . " ID_SAP duplicados en junio\n";
        foreach ($duplicadosJunio as $dup) {
            echo "   - ID_SAP: {$dup['id_sap']} aparece {$dup['cantidad']} veces\n";
        }
    } else {
        echo "   - NO hay duplicados en junio\n";
    }
    echo "\n";
    
    // 4. Mostrar algunos registros de junio
    echo "4. MUESTRA DE REGISTROS DE JUNIO (primeros 3):\n";
    $sqlMuestraJunio = "SELECT id, id_sap, periodo, 
                               MO, IC, EM, IE, SC, AD, CL, CT,
                               (MO + IC + EM + IE + SC + AD + CL + CT) as suma_total
                        FROM financiero_sap 
                        WHERE proyecto_id = ? 
                        AND periodo >= ? 
                        AND periodo <= ?
                        ORDER BY id
                        LIMIT 3";
    
    $stmtMuestraJunio = $pdo->prepare($sqlMuestraJunio);
    $stmtMuestraJunio->execute([$proyecto_id, $fecha_desde, $fecha_hasta]);
    $muestraJunio = $stmtMuestraJunio->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($muestraJunio as $index => $row) {
        echo "   Registro " . ($index + 1) . ":\n";
        echo "   - ID: {$row['id']}, ID_SAP: {$row['id_sap']}, Período: {$row['periodo']}\n";
        echo "   - Suma total: " . number_format($row['suma_total'], 0, ',', ',') . "\n";
    }
    echo "\n";
    
    // 5. Calcular valores esperados
    echo "5. VALORES ESPERADOS:\n";
    $valorConFiltros = $resultadoConFiltros['total_proyeccion'] ?? 0;
    $valorSinFiltros = $resultadoSinFiltros['total_proyeccion'] ?? 0;
    
    echo "   - Valor con filtros (junio): " . number_format($valorConFiltros, 0, ',', ',') . "\n";
    echo "   - Valor sin filtros (histórico): " . number_format($valorSinFiltros, 0, ',', ',') . "\n";
    echo "   - Valor histórico corregido (x0.5): " . number_format($valorSinFiltros * 0.5, 0, ',', ',') . "\n\n";
    
    echo "=== DIAGNÓSTICO COMPLETADO ===\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
?>