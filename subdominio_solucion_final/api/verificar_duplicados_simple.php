<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

try {
    $proyecto_id = 1; // Proyecto por defecto
    
    echo "=== VERIFICACIÓN RÁPIDA DE DUPLICADOS ===\n\n";
    
    // 1. Verificar total de registros
    $sqlTotal = "SELECT COUNT(*) as total FROM financiero_sap WHERE proyecto_id = ?";
    $stmtTotal = $pdo->prepare($sqlTotal);
    $stmtTotal->execute([$proyecto_id]);
    $total = $stmtTotal->fetch(PDO::FETCH_ASSOC);
    
    echo "1. TOTAL DE REGISTROS: " . ($total['total'] ?? 0) . "\n\n";
    
    // 2. Verificar registros únicos
    $sqlUnicos = "SELECT COUNT(DISTINCT id_sap) as unicos FROM financiero_sap WHERE proyecto_id = ?";
    $stmtUnicos = $pdo->prepare($sqlUnicos);
    $stmtUnicos->execute([$proyecto_id]);
    $unicos = $stmtUnicos->fetch(PDO::FETCH_ASSOC);
    
    echo "2. REGISTROS ÚNICOS: " . ($unicos['unicos'] ?? 0) . "\n\n";
    
    // 3. Verificar suma sin corrección
    $sqlSuma = "SELECT SUM(MO + IC + EM + IE + SC + AD + CL + CT) as total FROM financiero_sap WHERE proyecto_id = ?";
    $stmtSuma = $pdo->prepare($sqlSuma);
    $stmtSuma->execute([$proyecto_id]);
    $suma = $stmtSuma->fetch(PDO::FETCH_ASSOC);
    
    echo "3. SUMA TOTAL (SIN CORRECCIÓN): " . number_format($suma['total'] ?? 0, 0, ',', ',') . "\n\n";
    
    // 4. Calcular valor corregido
    $total_registros = $total['total'] ?? 0;
    $registros_unicos = $unicos['unicos'] ?? 0;
    $suma_total = $suma['total'] ?? 0;
    
    if ($total_registros > $registros_unicos && $registros_unicos > 0) {
        $factor_correccion = $registros_unicos / $total_registros;
        $valor_corregido = $suma_total * $factor_correccion;
        
        echo "4. FACTOR DE CORRECCIÓN: " . $factor_correccion . "\n";
        echo "5. VALOR CORREGIDO: " . number_format($valor_corregido, 0, ',', ',') . "\n\n";
    } else {
        echo "4. NO HAY DUPLICADOS - VALOR CORRECTO: " . number_format($suma_total, 0, ',', ',') . "\n\n";
    }
    
    // 5. Mostrar algunos registros duplicados si existen
    $sqlDuplicados = "SELECT id_sap, COUNT(*) as cantidad 
                      FROM financiero_sap 
                      WHERE proyecto_id = ? 
                      GROUP BY id_sap 
                      HAVING COUNT(*) > 1 
                      LIMIT 5";
    $stmtDuplicados = $pdo->prepare($sqlDuplicados);
    $stmtDuplicados->execute([$proyecto_id]);
    $duplicados = $stmtDuplicados->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($duplicados)) {
        echo "6. EJEMPLOS DE DUPLICADOS:\n";
        foreach ($duplicados as $dup) {
            echo "   - ID_SAP: {$dup['id_sap']} aparece {$dup['cantidad']} veces\n";
        }
    } else {
        echo "6. NO SE ENCONTRARON DUPLICADOS\n";
    }
    
    echo "\n=== VERIFICACIÓN COMPLETADA ===\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
?>