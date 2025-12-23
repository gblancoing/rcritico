<?php
/**
 * Script de diagnóstico específico para RC04
 * Analiza problemas con creación de carpetas y mensajes del foro
 */

header('Content-Type: application/json; charset=utf-8');

if (ob_get_level()) {
    ob_clean();
}

require_once __DIR__ . '/config.php';

// Obtener configuración de la base de datos
$dbConfig = getDbConfig();
$dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4";
$username = $dbConfig['user'];
$password = $dbConfig['pass'];
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error de conexión: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $diagnostico = [
        'fecha' => date('Y-m-d H:i:s'),
        'rc04' => [],
        'errores' => [],
        'recomendaciones' => []
    ];
    
    // 1. Buscar RC04 en la tabla carpetas
    $stmt_rc04 = $pdo->prepare("SELECT id, nombre, activo, proyecto_id FROM carpetas WHERE nombre LIKE 'RC04%' OR nombre = 'RC04' ORDER BY id LIMIT 1");
    $stmt_rc04->execute();
    $rc04 = $stmt_rc04->fetch(PDO::FETCH_ASSOC);
    
    if (!$rc04) {
        $diagnostico['errores'][] = 'RC04 no encontrado en la tabla carpetas';
        echo json_encode($diagnostico, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    $carpeta_id_rc04 = $rc04['id'];
    $diagnostico['rc04'] = [
        'id' => $carpeta_id_rc04,
        'nombre' => $rc04['nombre'],
        'activo' => $rc04['activo'],
        'proyecto_id' => $rc04['proyecto_id']
    ];
    
    // 2. Verificar registros en carpeta_linea_base para RC04
    $stmt_lb = $pdo->prepare("
        SELECT 
            id, 
            control_preventivo_id, 
            codigo, 
            dimension, 
            pregunta, 
            evidencia,
            activo,
            creado_en,
            actualizado_en
        FROM carpeta_linea_base 
        WHERE carpeta_id = ? 
        ORDER BY id DESC 
        LIMIT 20
    ");
    $stmt_lb->execute([$carpeta_id_rc04]);
    $lineas_base = $stmt_lb->fetchAll(PDO::FETCH_ASSOC);
    
    $diagnostico['rc04']['linea_base_preventivos'] = [
        'total' => count($lineas_base),
        'activos' => count(array_filter($lineas_base, function($lb) { return $lb['activo'] == 1; })),
        'inactivos' => count(array_filter($lineas_base, function($lb) { return $lb['activo'] == 0; })),
        'registros' => $lineas_base
    ];
    
    // 3. Verificar registros en carpeta_linea_base_mitigadores para RC04
    try {
        $stmt_lb_mit = $pdo->prepare("
            SELECT 
                id, 
                control_mitigador_id, 
                codigo, 
                dimension, 
                pregunta, 
                evidencia,
                activo,
                creado_en,
                actualizado_en
            FROM carpeta_linea_base_mitigadores 
            WHERE carpeta_id = ? 
            ORDER BY id DESC 
            LIMIT 20
        ");
        $stmt_lb_mit->execute([$carpeta_id_rc04]);
        $lineas_base_mit = $stmt_lb_mit->fetchAll(PDO::FETCH_ASSOC);
        
        $diagnostico['rc04']['linea_base_mitigadores'] = [
            'total' => count($lineas_base_mit),
            'activos' => count(array_filter($lineas_base_mit, function($lb) { return $lb['activo'] == 1; })),
            'inactivos' => count(array_filter($lineas_base_mit, function($lb) { return $lb['activo'] == 0; })),
            'registros' => $lineas_base_mit
        ];
    } catch (Exception $e) {
        $diagnostico['rc04']['linea_base_mitigadores'] = ['error' => $e->getMessage()];
    }
    
    // 4. Verificar IDs problemáticos (como 6099)
    $id_problema = 6099;
    $stmt_check_id = $pdo->prepare("
        SELECT 'carpeta_linea_base' as tabla, id, carpeta_id, activo, creado_en 
        FROM carpeta_linea_base 
        WHERE id = ?
        UNION ALL
        SELECT 'carpeta_linea_base_mitigadores' as tabla, id, carpeta_id, activo, creado_en 
        FROM carpeta_linea_base_mitigadores 
        WHERE id = ?
    ");
    $stmt_check_id->execute([$id_problema, $id_problema]);
    $id_check = $stmt_check_id->fetchAll(PDO::FETCH_ASSOC);
    
    $diagnostico['id_problema_6099'] = [
        'existe' => count($id_check) > 0,
        'detalles' => $id_check
    ];
    
    // 5. Verificar registros recientes de RC04 (últimos 60 segundos)
    $stmt_recientes = $pdo->prepare("
        SELECT id, carpeta_id, activo, creado_en 
        FROM carpeta_linea_base 
        WHERE carpeta_id = ? 
          AND creado_en >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
        ORDER BY id DESC
    ");
    $stmt_recientes->execute([$carpeta_id_rc04]);
    $recientes = $stmt_recientes->fetchAll(PDO::FETCH_ASSOC);
    
    $diagnostico['rc04']['registros_recientes'] = $recientes;
    
    // 6. Verificar mensajes del foro para RC04
    try {
        $stmt_mensajes = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM carpeta_mensajes 
            WHERE carpeta_id = ?
        ");
        $stmt_mensajes->execute([$carpeta_id_rc04]);
        $mensajes_count = $stmt_mensajes->fetch(PDO::FETCH_ASSOC);
        
        $diagnostico['rc04']['mensajes_foro'] = [
            'total' => intval($mensajes_count['total'])
        ];
    } catch (Exception $e) {
        $diagnostico['rc04']['mensajes_foro'] = ['error' => $e->getMessage()];
    }
    
    // 7. Verificar carpetas de documentos para RC04
    try {
        // Obtener todos los linea_base_id de RC04
        $stmt_lb_ids = $pdo->prepare("
            SELECT id FROM carpeta_linea_base WHERE carpeta_id = ? AND activo = 1
            UNION
            SELECT id FROM carpeta_linea_base_mitigadores WHERE carpeta_id = ? AND activo = 1
        ");
        $stmt_lb_ids->execute([$carpeta_id_rc04, $carpeta_id_rc04]);
        $lb_ids = $stmt_lb_ids->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($lb_ids)) {
            $placeholders = implode(',', array_fill(0, count($lb_ids), '?'));
            $stmt_carpetas = $pdo->prepare("
                SELECT linea_base_id, COUNT(*) as total_carpetas
                FROM linea_base_carpetas
                WHERE linea_base_id IN ($placeholders) AND activo = 1
                GROUP BY linea_base_id
            ");
            $stmt_carpetas->execute($lb_ids);
            $carpetas_doc = $stmt_carpetas->fetchAll(PDO::FETCH_ASSOC);
            
            $diagnostico['rc04']['carpetas_documentos'] = [
                'linea_base_ids_con_carpetas' => count($carpetas_doc),
                'detalles' => $carpetas_doc
            ];
        } else {
            $diagnostico['rc04']['carpetas_documentos'] = [
                'error' => 'No hay registros activos de linea_base para RC04'
            ];
        }
    } catch (Exception $e) {
        $diagnostico['rc04']['carpetas_documentos'] = ['error' => $e->getMessage()];
    }
    
    // 8. Análisis de problemas potenciales
    if ($rc04['activo'] == 0) {
        $diagnostico['errores'][] = 'RC04 está marcado como INACTIVO en la tabla carpetas';
        $diagnostico['recomendaciones'][] = 'Activar RC04: UPDATE carpetas SET activo = 1 WHERE id = ' . $carpeta_id_rc04;
    }
    
    if (count($lineas_base) == 0) {
        $diagnostico['errores'][] = 'No hay registros en carpeta_linea_base para RC04';
        $diagnostico['recomendaciones'][] = 'Verificar que se hayan creado registros de línea base para RC04';
    }
    
    $inactivos = array_filter($lineas_base, function($lb) { return $lb['activo'] == 0; });
    if (count($inactivos) > 0) {
        $diagnostico['errores'][] = 'Hay ' . count($inactivos) . ' registros INACTIVOS en carpeta_linea_base para RC04';
        $ids_inactivos = array_column($inactivos, 'id');
        $diagnostico['recomendaciones'][] = 'Activar registros: UPDATE carpeta_linea_base SET activo = 1 WHERE id IN (' . implode(',', $ids_inactivos) . ')';
    }
    
    if (count($id_check) == 0) {
        $diagnostico['errores'][] = 'El ID 6099 NO existe en ninguna tabla (carpeta_linea_base ni carpeta_linea_base_mitigadores)';
        $diagnostico['recomendaciones'][] = 'El frontend está intentando usar un ID que no existe. Verificar que el guardado de línea base esté funcionando correctamente.';
    }
    
    // 9. Verificar AUTO_INCREMENT
    $stmt_auto = $pdo->query("
        SELECT 
            TABLE_NAME,
            AUTO_INCREMENT
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN ('carpeta_linea_base', 'carpeta_linea_base_mitigadores')
    ");
    $auto_increment = $stmt_auto->fetchAll(PDO::FETCH_ASSOC);
    $diagnostico['auto_increment'] = $auto_increment;
    
    echo json_encode($diagnostico, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error en diagnóstico: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

