<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

try {
    echo "=== VERIFICACIÓN DE DUPLICADOS EN EL SERVIDOR ===\n\n";
    
    // 1. Verificar duplicados por id_sap y proyecto_id
    echo "1. VERIFICANDO DUPLICADOS POR ID_SAP Y PROYECTO_ID:\n";
    $sqlDuplicados = "SELECT proyecto_id, id_sap, COUNT(*) as cantidad
                      FROM financiero_sap 
                      GROUP BY proyecto_id, id_sap 
                      HAVING COUNT(*) > 1
                      ORDER BY proyecto_id, id_sap";
    
    $stmtDuplicados = $pdo->prepare($sqlDuplicados);
    $stmtDuplicados->execute();
    $duplicados = $stmtDuplicados->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($duplicados)) {
        echo "   ✅ NO HAY DUPLICADOS POR ID_SAP\n\n";
    } else {
        echo "   ❌ SE ENCONTRARON " . count($duplicados) . " COMBINACIONES DUPLICADAS:\n";
        foreach ($duplicados as $dup) {
            echo "   - Proyecto ID: {$dup['proyecto_id']}, ID SAP: {$dup['id_sap']}, Cantidad: {$dup['cantidad']}\n";
        }
        echo "\n";
    }
    
    // 2. Verificar total de registros por proyecto
    echo "2. TOTAL DE REGISTROS POR PROYECTO:\n";
    $sqlTotal = "SELECT proyecto_id, COUNT(*) as total_registros
                 FROM financiero_sap 
                 GROUP BY proyecto_id 
                 ORDER BY proyecto_id";
    
    $stmtTotal = $pdo->prepare($sqlTotal);
    $stmtTotal->execute();
    $totales = $stmtTotal->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($totales as $total) {
        echo "   - Proyecto ID: {$total['proyecto_id']} - Registros: {$total['total_registros']}\n";
    }
    echo "\n";
    
    // 3. Verificar suma sin GROUP BY (como estaba antes)
    echo "3. SUMA SIN GROUP BY (VALOR DUPLICADO):\n";
    $sqlSinGroupBy = "SELECT 
                        SUM(MO + IC + EM + IE + SC + AD + CL + CT) as total_proyeccion,
                        COUNT(*) as total_registros
                      FROM financiero_sap 
                      WHERE proyecto_id = 1";
    
    $stmtSinGroupBy = $pdo->prepare($sqlSinGroupBy);
    $stmtSinGroupBy->execute();
    $resultadoSinGroupBy = $stmtSinGroupBy->fetch(PDO::FETCH_ASSOC);
    
    echo "   - Total sin GROUP BY: " . number_format($resultadoSinGroupBy['total_proyeccion'], 0, ',', ',') . "\n";
    echo "   - Registros sin GROUP BY: " . $resultadoSinGroupBy['total_registros'] . "\n\n";
    
    // 4. Verificar suma CON GROUP BY (valor correcto)
    echo "4. SUMA CON GROUP BY (VALOR CORRECTO):\n";
    $sqlConGroupBy = "SELECT 
                        SUM(MO + IC + EM + IE + SC + AD + CL + CT) as total_proyeccion,
                        COUNT(DISTINCT id_sap) as total_registros
                      FROM financiero_sap 
                      WHERE proyecto_id = 1
                      GROUP BY proyecto_id";
    
    $stmtConGroupBy = $pdo->prepare($sqlConGroupBy);
    $stmtConGroupBy->execute();
    $resultadoConGroupBy = $stmtConGroupBy->fetch(PDO::FETCH_ASSOC);
    
    echo "   - Total con GROUP BY: " . number_format($resultadoConGroupBy['total_proyeccion'], 0, ',', ',') . "\n";
    echo "   - Registros únicos: " . $resultadoConGroupBy['total_registros'] . "\n\n";
    
    // 5. Verificar registros únicos por id_sap
    echo "5. REGISTROS ÚNICOS POR ID_SAP:\n";
    $sqlUnicos = "SELECT COUNT(DISTINCT id_sap) as registros_unicos
                  FROM financiero_sap 
                  WHERE proyecto_id = 1";
    
    $stmtUnicos = $pdo->prepare($sqlUnicos);
    $stmtUnicos->execute();
    $unicos = $stmtUnicos->fetch(PDO::FETCH_ASSOC);
    
    echo "   - Registros únicos por ID_SAP: " . $unicos['registros_unicos'] . "\n\n";
    
    // 6. Mostrar algunos registros de ejemplo
    echo "6. MUESTRA DE REGISTROS (primeros 5):\n";
    $sqlMuestra = "SELECT id, id_sap, proyecto_id, periodo, 
                          MO, IC, EM, IE, SC, AD, CL, CT
                   FROM financiero_sap 
                   WHERE proyecto_id = 1
                   ORDER BY id
                   LIMIT 5";
    
    $stmtMuestra = $pdo->prepare($sqlMuestra);
    $stmtMuestra->execute();
    $muestra = $stmtMuestra->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($muestra as $index => $row) {
        echo "   Registro " . ($index + 1) . ":\n";
        echo "   - ID: {$row['id']}, ID_SAP: {$row['id_sap']}\n";
        echo "   - Período: {$row['periodo']}\n";
        echo "   - Suma VP: " . number_format($row['MO'] + $row['IC'] + $row['EM'] + $row['IE'] + $row['SC'] + $row['AD'] + $row['CL'] + $row['CT'], 0, ',', ',') . "\n\n";
    }
    
    echo "=== VERIFICACIÓN COMPLETADA ===\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Detalles: " . $e->getTraceAsString() . "\n";
}
?>