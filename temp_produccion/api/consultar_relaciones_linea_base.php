<?php
/**
 * Script para consultar las relaciones entre linea_base_carpetas y las tablas maestras
 * Verifica que cada linea_base_id en linea_base_carpetas exista en carpeta_linea_base o carpeta_linea_base_mitigadores
 */

header('Content-Type: application/json; charset=utf-8');
if (ob_get_level()) {
    ob_clean();
}

require_once __DIR__ . '/config/db.php';

try {
    // Obtener todos los linea_base_id únicos de linea_base_carpetas
    $stmt = $pdo->query("
        SELECT DISTINCT linea_base_id 
        FROM linea_base_carpetas 
        WHERE activo = 1 
        ORDER BY linea_base_id
    ");
    $lineaBaseIdsEnCarpetas = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Verificar cuáles existen en carpeta_linea_base
    $existentesEnPreventivo = [];
    if (!empty($lineaBaseIdsEnCarpetas)) {
        $placeholders = implode(',', array_fill(0, count($lineaBaseIdsEnCarpetas), '?'));
        $stmt = $pdo->prepare("
            SELECT id 
            FROM carpeta_linea_base 
            WHERE id IN ($placeholders) AND activo = 1
        ");
        $stmt->execute($lineaBaseIdsEnCarpetas);
        $existentesEnPreventivo = $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    // Verificar cuáles existen en carpeta_linea_base_mitigadores
    $existentesEnMitigadores = [];
    if (!empty($lineaBaseIdsEnCarpetas)) {
        $placeholders = implode(',', array_fill(0, count($lineaBaseIdsEnCarpetas), '?'));
        $stmt = $pdo->prepare("
            SELECT id 
            FROM carpeta_linea_base_mitigadores 
            WHERE id IN ($placeholders) AND activo = 1
        ");
        $stmt->execute($lineaBaseIdsEnCarpetas);
        $existentesEnMitigadores = $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    // Identificar cuáles NO existen en ninguna tabla
    $existentesEnTotal = array_unique(array_merge($existentesEnPreventivo, $existentesEnMitigadores));
    $noExistentes = array_diff($lineaBaseIdsEnCarpetas, $existentesEnTotal);
    
    // Para cada linea_base_id que no existe, obtener las carpetas asociadas
    $problemas = [];
    foreach ($noExistentes as $lineaBaseId) {
        $stmt = $pdo->prepare("
            SELECT id, nombre, linea_base_id, carpeta_padre_id, creado_en
            FROM linea_base_carpetas
            WHERE linea_base_id = ? AND activo = 1
        ");
        $stmt->execute([$lineaBaseId]);
        $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $problemas[] = [
            'linea_base_id' => $lineaBaseId,
            'cantidad_carpetas' => count($carpetas),
            'existe_en_preventivo' => in_array($lineaBaseId, $existentesEnPreventivo),
            'existe_en_mitigadores' => in_array($lineaBaseId, $existentesEnMitigadores),
            'carpetas' => $carpetas
        ];
    }
    
    // Consultar específicamente el linea_base_id 6099
    $consultaEspecifica = null;
    if (in_array(6099, $lineaBaseIdsEnCarpetas)) {
        $stmt = $pdo->prepare("SELECT id FROM carpeta_linea_base WHERE id = 6099 AND activo = 1");
        $stmt->execute();
        $existeEnPreventivo = $stmt->fetch() !== false;
        
        $stmt = $pdo->prepare("SELECT id FROM carpeta_linea_base_mitigadores WHERE id = 6099 AND activo = 1");
        $stmt->execute();
        $existeEnMitigadores = $stmt->fetch() !== false;
        
        $stmt = $pdo->prepare("
            SELECT id, nombre, linea_base_id, carpeta_padre_id, creado_en, creado_por
            FROM linea_base_carpetas
            WHERE linea_base_id = 6099 AND activo = 1
        ");
        $stmt->execute();
        $carpetas6099 = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Buscar el ID más reciente en carpeta_linea_base alrededor de 6099
        $stmt = $pdo->query("SELECT MAX(id) as max_id FROM carpeta_linea_base WHERE activo = 1");
        $maxId = $stmt->fetch(PDO::FETCH_ASSOC)['max_id'];
        
        $stmt = $pdo->query("SELECT MAX(id) as max_id FROM carpeta_linea_base_mitigadores WHERE activo = 1");
        $maxIdMitigadores = $stmt->fetch(PDO::FETCH_ASSOC)['max_id'];
        
        $consultaEspecifica = [
            'linea_base_id' => 6099,
            'existe_en_preventivo' => $existeEnPreventivo,
            'existe_en_mitigadores' => $existeEnMitigadores,
            'existe_en_alguna' => $existeEnPreventivo || $existeEnMitigadores,
            'carpetas_asociadas' => $carpetas6099,
            'max_id_preventivo' => $maxId,
            'max_id_mitigadores' => $maxIdMitigadores,
            'recomendacion' => $existeEnPreventivo || $existeEnMitigadores 
                ? 'El ID existe en la base de datos' 
                : 'El ID NO existe. Las carpetas con este ID deberían estar asociadas a otro linea_base_id válido'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'resumen' => [
            'total_linea_base_ids_en_carpetas' => count($lineaBaseIdsEnCarpetas),
            'existentes_en_preventivo' => count($existentesEnPreventivo),
            'existentes_en_mitigadores' => count($existentesEnMitigadores),
            'existentes_en_total' => count($existentesEnTotal),
            'no_existentes' => count($noExistentes)
        ],
        'problemas' => $problemas,
        'consulta_especifica_6099' => $consultaEspecifica,
        'ids_no_existentes' => array_values($noExistentes)
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_UNESCAPED_UNICODE);
}

