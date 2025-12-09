<?php
// Función helper para enviar headers CORS sin duplicados
function sendCorsHeaders() {
    // Remover headers CORS existentes para evitar duplicados
    if (function_exists('header_remove')) {
        header_remove('Access-Control-Allow-Origin');
        header_remove('Access-Control-Allow-Methods');
        header_remove('Access-Control-Allow-Headers');
    }
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

// Manejar preflight OPTIONS request para CORS ANTES de cualquier otra cosa
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendCorsHeaders();
    http_response_code(200);
    exit;
}

// Iniciar output buffering al inicio para capturar TODO
// Usar ob_start con callback para asegurar que siempre se devuelva JSON
ob_start(function($buffer) {
    // Si hay algún contenido que no sea JSON, convertirlo a JSON de error
    if (!empty($buffer) && !preg_match('/^\s*[\{\[]/', $buffer)) {
        return json_encode(['success' => false, 'error' => 'Respuesta no válida del servidor: ' . substr($buffer, 0, 200)], JSON_UNESCAPED_UNICODE);
    }
    return $buffer;
});

// Desactivar TODOS los errores visuales
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);

// Función para devolver JSON de error de forma segura
function sendJsonError($message, $code = 500) {
    ob_clean();
    http_response_code($code);
    sendCorsHeaders();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    ob_end_flush();
    exit;
}

// Función para devolver JSON de éxito
function sendJsonSuccess($data = []) {
    ob_clean();
    sendCorsHeaders();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['success' => true], $data), JSON_UNESCAPED_UNICODE);
    ob_end_flush();
    exit;
}

// Configurar handlers de errores
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    sendJsonError("Error en $file línea $line: $message");
});

set_exception_handler(function($exception) {
    sendJsonError('Error no manejado: ' . $exception->getMessage());
});

// OPTIONS ya se maneja arriba, no es necesario aquí de nuevo

// Intentar incluir el archivo real
try {
    // NO limpiar el buffer aquí, dejar que el archivo incluido lo maneje
    require_once __DIR__ . '/archivos/carpetas.php';
    // Si llegamos aquí sin salir, algo salió mal
    sendJsonError('El endpoint no procesó la solicitud correctamente');
} catch (Throwable $e) {
    sendJsonError('Error al procesar solicitud: ' . $e->getMessage() . ' | Tipo: ' . get_class($e));
}
?>
