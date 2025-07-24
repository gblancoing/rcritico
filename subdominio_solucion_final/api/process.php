<?php
// Configurar headers para CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método no permitido. Solo se aceptan peticiones POST.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Obtener el contenido JSON del body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Verificar si se recibieron datos válidos
if (!$data || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Datos inválidos. Se requiere un campo "message".'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$message = trim($data['message']);

// Verificar que el mensaje no esté vacío
if (empty($message)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'El mensaje no puede estar vacío.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Procesar el mensaje
$processedMessage = [
    'status' => 'success',
    'message' => 'Mensaje procesado correctamente',
    'data' => [
        'original_message' => $message,
        'processed_at' => date('Y-m-d H:i:s'),
        'message_length' => strlen($message),
        'word_count' => str_word_count($message),
        'uppercase' => strtoupper($message),
        'lowercase' => strtolower($message),
        'reversed' => strrev($message),
        'md5_hash' => md5($message),
        'sha1_hash' => sha1($message)
    ],
    'server_info' => [
        'php_version' => PHP_VERSION,
        'timestamp' => date('Y-m-d H:i:s'),
        'timezone' => date_default_timezone_get(),
        'memory_usage' => memory_get_usage(true),
        'peak_memory' => memory_get_peak_usage(true)
    ]
];

// Log del mensaje (opcional)
$logEntry = date('Y-m-d H:i:s') . " - Mensaje recibido: " . substr($message, 0, 100) . "\n";
file_put_contents('api/message_log.txt', $logEntry, FILE_APPEND | LOCK_EX);

// Respuesta en formato JSON
echo json_encode($processedMessage, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?> 