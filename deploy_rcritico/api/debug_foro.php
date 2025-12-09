<?php
/**
 * Archivo de diagnóstico para el foro de Línea Base
 * Sube este archivo a: /api/debug_foro.php
 * Luego accede a: https://rcritico.jej664caren.cl/api/debug_foro.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config/db.php';

$resultado = [
    'fecha_prueba' => date('Y-m-d H:i:s'),
    'conexion_db' => false,
    'tabla_preventivos' => [],
    'tabla_mitigadores' => [],
    'prueba_escritura' => false,
    'errores' => []
];

try {
    // Verificar conexión
    $resultado['conexion_db'] = true;
    
    // Verificar columnas en carpeta_linea_base
    $stmt = $pdo->query("DESCRIBE carpeta_linea_base");
    $columnas = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $resultado['tabla_preventivos']['columnas'] = $columnas;
    $resultado['tabla_preventivos']['tiene_conversacion_seguimiento'] = in_array('conversacion_seguimiento', $columnas);
    $resultado['tabla_preventivos']['tiene_comentario_trabajador'] = in_array('comentario_trabajador', $columnas);
    $resultado['tabla_preventivos']['tiene_archivos_respaldo'] = in_array('archivos_respaldo', $columnas);
    
    // Verificar columnas en carpeta_linea_base_mitigadores
    $stmt2 = $pdo->query("DESCRIBE carpeta_linea_base_mitigadores");
    $columnas2 = $stmt2->fetchAll(PDO::FETCH_COLUMN);
    $resultado['tabla_mitigadores']['columnas'] = $columnas2;
    $resultado['tabla_mitigadores']['tiene_conversacion_seguimiento'] = in_array('conversacion_seguimiento', $columnas2);
    $resultado['tabla_mitigadores']['tiene_comentario_trabajador'] = in_array('comentario_trabajador', $columnas2);
    $resultado['tabla_mitigadores']['tiene_archivos_respaldo'] = in_array('archivos_respaldo', $columnas2);
    
    // Verificar si hay registros con datos de foro
    $stmt3 = $pdo->query("SELECT COUNT(*) as total, 
        SUM(CASE WHEN conversacion_seguimiento IS NOT NULL AND conversacion_seguimiento != '' AND conversacion_seguimiento != '[]' THEN 1 ELSE 0 END) as con_conversacion,
        SUM(CASE WHEN comentario_trabajador IS NOT NULL AND comentario_trabajador != '' THEN 1 ELSE 0 END) as con_comentario
        FROM carpeta_linea_base WHERE activo = 1");
    $stats = $stmt3->fetch(PDO::FETCH_ASSOC);
    $resultado['tabla_preventivos']['estadisticas'] = $stats;
    
    // Prueba de escritura
    $testJson = json_encode([['id' => 'test', 'mensaje' => 'Prueba diagnóstico', 'fecha' => date('Y-m-d H:i:s')]]);
    
    // Obtener un registro existente para actualizar
    $stmt4 = $pdo->query("SELECT id FROM carpeta_linea_base WHERE activo = 1 LIMIT 1");
    $registro = $stmt4->fetch(PDO::FETCH_ASSOC);
    
    if ($registro) {
        // Intentar actualizar
        $stmtUpdate = $pdo->prepare("UPDATE carpeta_linea_base SET conversacion_seguimiento = ? WHERE id = ?");
        $updateResult = $stmtUpdate->execute([$testJson, $registro['id']]);
        
        if ($updateResult) {
            $resultado['prueba_escritura'] = true;
            $resultado['registro_actualizado'] = $registro['id'];
            
            // Verificar que se guardó
            $stmtVerify = $pdo->prepare("SELECT conversacion_seguimiento FROM carpeta_linea_base WHERE id = ?");
            $stmtVerify->execute([$registro['id']]);
            $verificacion = $stmtVerify->fetch(PDO::FETCH_ASSOC);
            $resultado['verificacion_lectura'] = $verificacion['conversacion_seguimiento'];
            
            // Limpiar la prueba
            $stmtClean = $pdo->prepare("UPDATE carpeta_linea_base SET conversacion_seguimiento = NULL WHERE id = ?");
            $stmtClean->execute([$registro['id']]);
        }
    } else {
        $resultado['errores'][] = 'No hay registros para probar escritura';
    }
    
    // Verificar versión del archivo PHP
    $phpContent = file_get_contents(__DIR__ . '/archivos/carpeta_linea_base.php');
    $resultado['archivo_php']['tiene_conversacion_seguimiento'] = strpos($phpContent, 'conversacion_seguimiento') !== false;
    $resultado['archivo_php']['tiene_json_encode'] = strpos($phpContent, 'json_encode($item[\'conversacion_seguimiento\']') !== false || strpos($phpContent, 'JSON.stringify') !== false;
    $resultado['archivo_php']['lineas_totales'] = substr_count($phpContent, "\n") + 1;
    
} catch (PDOException $e) {
    $resultado['errores'][] = 'Error de base de datos: ' . $e->getMessage();
} catch (Exception $e) {
    $resultado['errores'][] = 'Error general: ' . $e->getMessage();
}

// Mostrar resultado formateado
echo json_encode($resultado, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>






