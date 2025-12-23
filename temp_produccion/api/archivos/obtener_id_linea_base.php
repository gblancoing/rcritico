<?php
/**
 * Endpoint para obtener el ID real de un registro de línea base por sus propiedades únicas
 * Usado cuando el ID devuelto es 0 o no existe
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (ob_get_level()) {
    ob_clean();
}

require_once __DIR__ . '/../config/db.php';

try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    
    $tipo = $data['tipo'] ?? 'preventivo'; // 'preventivo' o 'mitigador'
    $carpeta_id = intval($data['carpeta_id'] ?? 0);
    $control_id = intval($data['control_id'] ?? 0);
    $dimension = trim($data['dimension'] ?? '');
    $pregunta = trim($data['pregunta'] ?? '');
    $evidencia = trim($data['evidencia'] ?? '');
    
    if (!$carpeta_id || !$control_id || !$dimension || !$pregunta || !$evidencia) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Faltan parámetros requeridos',
            'debug' => [
                'carpeta_id' => $carpeta_id,
                'control_id' => $control_id,
                'dimension' => $dimension,
                'tipo' => $tipo
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    $tabla = $tipo === 'preventivo' ? 'carpeta_linea_base' : 'carpeta_linea_base_mitigadores';
    $campo_control = $tipo === 'preventivo' ? 'control_preventivo_id' : 'control_mitigador_id';
    
    // Buscar el registro por propiedades únicas
    $stmt = $pdo->prepare("
        SELECT id 
        FROM $tabla 
        WHERE carpeta_id = ? 
          AND $campo_control = ? 
          AND dimension = ? 
          AND pregunta = ? 
          AND evidencia = ? 
          AND activo = 1 
        ORDER BY id DESC 
        LIMIT 1
    ");
    
    $stmt->execute([$carpeta_id, $control_id, $dimension, $pregunta, $evidencia]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result && $result['id']) {
        $id_real = intval($result['id']);
        
        // Verificar que realmente existe
        $stmt_verify = $pdo->prepare("SELECT id FROM $tabla WHERE id = ? AND activo = 1");
        $stmt_verify->execute([$id_real]);
        
        if ($stmt_verify->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'id' => $id_real,
                'tipo' => $tipo,
                'tabla' => $tabla
            ], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'El ID encontrado no existe en la BD'
            ], JSON_UNESCAPED_UNICODE);
        }
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'No se encontró un registro con esas propiedades',
            'debug' => [
                'carpeta_id' => $carpeta_id,
                'control_id' => $control_id,
                'dimension' => $dimension,
                'tipo' => $tipo
            ]
        ], JSON_UNESCAPED_UNICODE);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

