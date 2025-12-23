<?php
// Configuración de errores solo para desarrollo
if (in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) || 
    strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false) {
    // Solo mostrar errores en desarrollo local
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    // En producción, ocultar errores
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Limpiar archivo de debug al inicio (solo mantener últimas 100 líneas)
$debug_file = __DIR__ . '/login_debug.txt';
if (file_exists($debug_file)) {
    $lines = file($debug_file);
    if (count($lines) > 100) {
        file_put_contents($debug_file, implode('', array_slice($lines, -100)));
    }
}

require_once __DIR__ . '/../config/db.php';
file_put_contents($debug_file, "========================================\n", FILE_APPEND);
file_put_contents($debug_file, "NUEVO INTENTO DE LOGIN: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
file_put_contents($debug_file, "Método: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);
file_put_contents($debug_file, "Conexión a DB OK\n", FILE_APPEND);
file_put_contents($debug_file, "INICIO LOGIN\n", FILE_APPEND);

// Obtener datos del body
$raw_input = file_get_contents('php://input');
file_put_contents($debug_file, "Raw input recibido: " . substr($raw_input, 0, 200) . "\n", FILE_APPEND);
$input = json_decode($raw_input, true);
file_put_contents($debug_file, "Input decodificado: " . print_r($input, true) . "\n", FILE_APPEND);

if (json_last_error() !== JSON_ERROR_NONE) {
    file_put_contents($debug_file, "ERROR JSON: " . json_last_error_msg() . "\n", FILE_APPEND);
}

if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Faltan datos requeridos (email y password)'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$email = trim($input['email']);
$password = trim($input['password']);

file_put_contents($debug_file, "Email recibido: '$email'\n", FILE_APPEND);
file_put_contents($debug_file, "Password recibido (longitud): " . strlen($password) . "\n", FILE_APPEND);
file_put_contents($debug_file, "Password recibido (primeros 3 chars): " . substr($password, 0, 3) . "...\n", FILE_APPEND);

// Buscar usuario por email (case-insensitive)
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    file_put_contents($debug_file, "Usuario no encontrado con email: '$email'\n", FILE_APPEND);
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Usuario o contraseña incorrectos'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

file_put_contents($debug_file, "Usuario encontrado: ID={$user['id']}, Email={$user['email']}, Rol={$user['rol']}, Aprobado={$user['aprobado']}\n", FILE_APPEND);
file_put_contents($debug_file, "Password hash en DB (primeros 30 chars): " . substr($user['password'], 0, 30) . "...\n", FILE_APPEND);
file_put_contents($debug_file, "Password hash en DB (longitud): " . strlen($user['password']) . "\n", FILE_APPEND);

// Validar contraseña (soporte temporal para texto plano)
file_put_contents($debug_file, "Comparando password recibido con hash almacenado...\n", FILE_APPEND);
$password_valid = password_verify($password, $user['password']);
file_put_contents($debug_file, "password_verify resultado: " . ($password_valid ? 'TRUE' : 'FALSE') . "\n", FILE_APPEND);

// Debug adicional: probar con diferentes variaciones
if (!$password_valid) {
    file_put_contents($debug_file, "password_verify falló, probando variaciones...\n", FILE_APPEND);
    // Probar sin trim
    $password_no_trim = $input['password'] ?? '';
    file_put_contents($debug_file, "Probando sin trim (longitud): " . strlen($password_no_trim) . "\n", FILE_APPEND);
    $test1 = password_verify($password_no_trim, $user['password']);
    file_put_contents($debug_file, "Test sin trim: " . ($test1 ? 'TRUE' : 'FALSE') . "\n", FILE_APPEND);
}

if (!$password_valid) {
    // Soporte temporal: si la contraseña coincide en texto plano, actualiza a hash
    if ($password === $user['password']) {
        file_put_contents($debug_file, "Password coincide en texto plano, actualizando a hash\n", FILE_APPEND);
        // Actualiza la contraseña a hash
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $update = $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
        $update->execute([$newHash, $user['id']]);
    } else {
        file_put_contents($debug_file, "Password NO coincide. Password recibido (longitud): " . strlen($password) . "\n", FILE_APPEND);
        file_put_contents($debug_file, "Password en DB (longitud): " . strlen($user['password']) . "\n", FILE_APPEND);
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Usuario o contraseña incorrectos'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
} else {
    file_put_contents($debug_file, "Password válida!\n", FILE_APPEND);
}

file_put_contents($debug_file, "DESPUÉS DE PASSWORD\n", FILE_APPEND);

// Si es visita sin permiso o no está aprobado
if ($user['rol'] === 'visita_sin_permiso' || !$user['aprobado']) {
    echo json_encode([
        'status' => 'pending',
        'message' => 'Usuario registrado pero no aprobado por un administrador',
        'rol' => $user['rol']
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

file_put_contents($debug_file, "DESPUÉS DE APROBADO\n", FILE_APPEND);

// Obtener sucursales/proyectos según el rol
$centros = [];

if ($user['rol'] === 'super_admin') {
    // Todas las sucursales/proyectos
    $stmt = $pdo->query("SELECT id, nombre, descripcion, proyecto_id FROM centros_costo");
    $centros = $stmt->fetchAll();
    // Normalizar proyecto_id a entero para consistencia
    foreach ($centros as &$centro) {
        $centro['proyecto_id'] = isset($centro['proyecto_id']) ? (int)$centro['proyecto_id'] : null;
        $centro['id'] = isset($centro['id']) ? (int)$centro['id'] : null;
    }
    unset($centro); // Romper referencia
} elseif ($user['rol'] === 'admin') {
    try {
        $stmt = $pdo->prepare("
            SELECT cc.id, cc.nombre, cc.descripcion, cc.proyecto_id
            FROM usuario_centro_costo ucc
            JOIN centros_costo cc ON ucc.centro_costo_id = cc.id
            WHERE ucc.usuario_id = ?
        ");
        $stmt->execute([$user['id']]);
        $centros = $stmt->fetchAll();
        
        // Normalizar proyecto_id a entero para consistencia
        foreach ($centros as &$centro) {
            $centro['proyecto_id'] = isset($centro['proyecto_id']) ? (int)$centro['proyecto_id'] : null;
            $centro['id'] = isset($centro['id']) ? (int)$centro['id'] : null;
        }
        unset($centro); // Romper referencia
        
        file_put_contents($debug_file, "ADMIN CENTROS: " . print_r($centros, true) . "\n", FILE_APPEND);
        
        // Si no hay centros desde usuario_centro_costo, usar centro_costo_id directo como fallback
        if (empty($centros) && isset($user['centro_costo_id']) && $user['centro_costo_id']) {
            file_put_contents($debug_file, "ADMIN: Usando fallback con centro_costo_id: {$user['centro_costo_id']}\n", FILE_APPEND);
            $stmt = $pdo->prepare("SELECT id, nombre, descripcion, proyecto_id FROM centros_costo WHERE id = ?");
            $stmt->execute([$user['centro_costo_id']]);
            $centro = $stmt->fetch();
            if ($centro) {
                // Normalizar proyecto_id
                $centro['proyecto_id'] = isset($centro['proyecto_id']) ? (int)$centro['proyecto_id'] : null;
                $centro['id'] = isset($centro['id']) ? (int)$centro['id'] : null;
                $centros[] = $centro;
                file_put_contents($debug_file, "ADMIN: Centro obtenido por fallback: " . print_r($centro, true) . "\n", FILE_APPEND);
            }
        }
    } catch (Exception $e) {
        file_put_contents($debug_file, "ERROR ADMIN: " . $e->getMessage() . "\n", FILE_APPEND);
        file_put_contents($debug_file, "Stack trace: " . $e->getTraceAsString() . "\n", FILE_APPEND);
        // Fallback: usar centro_costo_id directo si existe
        if (isset($user['centro_costo_id']) && $user['centro_costo_id']) {
            try {
                $stmt = $pdo->prepare("SELECT id, nombre, descripcion, proyecto_id FROM centros_costo WHERE id = ?");
                $stmt->execute([$user['centro_costo_id']]);
                $centro = $stmt->fetch();
                if ($centro) {
                    // Normalizar proyecto_id
                    $centro['proyecto_id'] = isset($centro['proyecto_id']) ? (int)$centro['proyecto_id'] : null;
                    $centro['id'] = isset($centro['id']) ? (int)$centro['id'] : null;
                    $centros = [$centro];
                    file_put_contents($debug_file, "ADMIN: Centro obtenido por fallback en catch: " . print_r($centro, true) . "\n", FILE_APPEND);
                }
            } catch (Exception $ex) {
                file_put_contents($debug_file, "ERROR ADMIN FALLBACK: " . $ex->getMessage() . "\n", FILE_APPEND);
            }
        }
    }
} elseif ($user['rol'] === 'trabajador') {
    // Trabajador puede tener múltiples proyectos asignados
    try {
        $stmt = $pdo->prepare("
            SELECT cc.id, cc.nombre, cc.descripcion, cc.proyecto_id
            FROM usuario_centro_costo ucc
            JOIN centros_costo cc ON ucc.centro_costo_id = cc.id
            WHERE ucc.usuario_id = ?
        ");
        $stmt->execute([$user['id']]);
        $centros = $stmt->fetchAll();
        
        // Normalizar proyecto_id a entero para consistencia
        foreach ($centros as &$centro) {
            $centro['proyecto_id'] = isset($centro['proyecto_id']) ? (int)$centro['proyecto_id'] : null;
            $centro['id'] = isset($centro['id']) ? (int)$centro['id'] : null;
        }
        unset($centro); // Romper referencia
        
        file_put_contents($debug_file, "TRABAJADOR CENTROS: " . print_r($centros, true) . "\n", FILE_APPEND);
        
        // Si no hay centros desde usuario_centro_costo, usar centro_costo_id directo como fallback
        if (empty($centros) && isset($user['centro_costo_id']) && $user['centro_costo_id']) {
            file_put_contents($debug_file, "Usando fallback con centro_costo_id: {$user['centro_costo_id']}\n", FILE_APPEND);
            $stmt = $pdo->prepare("SELECT id, nombre, descripcion, proyecto_id FROM centros_costo WHERE id = ?");
            $stmt->execute([$user['centro_costo_id']]);
            $centro = $stmt->fetch();
            if ($centro) {
                // Normalizar proyecto_id
                $centro['proyecto_id'] = isset($centro['proyecto_id']) ? (int)$centro['proyecto_id'] : null;
                $centro['id'] = isset($centro['id']) ? (int)$centro['id'] : null;
                $centros[] = $centro;
                file_put_contents($debug_file, "Centro obtenido por fallback: " . print_r($centro, true) . "\n", FILE_APPEND);
            }
        }
    } catch (Exception $e) {
        file_put_contents($debug_file, "ERROR TRABAJADOR: " . $e->getMessage() . "\n", FILE_APPEND);
        file_put_contents($debug_file, "Stack trace: " . $e->getTraceAsString() . "\n", FILE_APPEND);
        // Fallback: usar centro_costo_id directo si existe
        if (isset($user['centro_costo_id']) && $user['centro_costo_id']) {
            try {
                $stmt = $pdo->prepare("SELECT id, nombre, descripcion, proyecto_id FROM centros_costo WHERE id = ?");
                $stmt->execute([$user['centro_costo_id']]);
                $centro = $stmt->fetch();
                if ($centro) {
                    // Normalizar proyecto_id
                    $centro['proyecto_id'] = isset($centro['proyecto_id']) ? (int)$centro['proyecto_id'] : null;
                    $centro['id'] = isset($centro['id']) ? (int)$centro['id'] : null;
                    $centros = [$centro];
                    file_put_contents($debug_file, "TRABAJADOR: Centro obtenido por fallback en catch: " . print_r($centro, true) . "\n", FILE_APPEND);
                }
            } catch (Exception $e2) {
                file_put_contents($debug_file, "ERROR en fallback: " . $e2->getMessage() . "\n", FILE_APPEND);
            }
        }
    }
} elseif ($user['rol'] === 'visita') {
    // Visita no tiene acceso a proyectos, solo puede ver la página de inicio
    $centros = [];
}

file_put_contents($debug_file, "CENTROS OBTENIDOS: " . print_r($centros, true) . "\n", FILE_APPEND);
file_put_contents($debug_file, "ANTES DE LOGIN EXITOSO\n", FILE_APPEND);

// Login exitoso
// Obtener información completa del admin (centro_costo_id, proyecto_id, region_id)
$centro_costo_id = null;
$proyecto_id = null;
$region_id = null;
$centro_costo_nombre = null;
$proyecto_nombre = null;
$region_nombre = null;

try {
if ($user['rol'] === 'admin' || $user['rol'] === 'trabajador') {
    // Admin y trabajador pueden tener múltiples proyectos, tomar el primero para información
    $stmt = $pdo->prepare("
        SELECT ucc.centro_costo_id, cc.nombre as centro_costo_nombre, 
               p.proyecto_id, p.nombre as proyecto_nombre,
               r.region_id, r.nombre as region_nombre
        FROM usuario_centro_costo ucc
        JOIN centros_costo cc ON ucc.centro_costo_id = cc.id
        JOIN proyectos p ON cc.proyecto_id = p.proyecto_id
        JOIN regiones r ON p.region_id = r.region_id
        WHERE ucc.usuario_id = ?
        LIMIT 1
    ");
    $stmt->execute([$user['id']]);
    $result = $stmt->fetch();
    if ($result) {
        $centro_costo_id = $result['centro_costo_id'];
        $proyecto_id = $result['proyecto_id'];
        $region_id = $result['region_id'];
        $centro_costo_nombre = $result['centro_costo_nombre'];
        $proyecto_nombre = $result['proyecto_nombre'];
        $region_nombre = $result['region_nombre'];
    }
} elseif ($user['rol'] === 'visita') {
    // Visita no tiene acceso a proyectos
    $centro_costo_id = null;
    $proyecto_id = null;
    $region_id = null;
    $centro_costo_nombre = null;
    $proyecto_nombre = null;
    $region_nombre = null;
} else {
    // Para otros roles, obtener desde centro_costo_id directo
    if ($user['centro_costo_id']) {
        $stmt = $pdo->prepare("
            SELECT cc.id as centro_costo_id, cc.nombre as centro_costo_nombre,
                   p.proyecto_id, p.nombre as proyecto_nombre,
                   r.region_id, r.nombre as region_nombre
            FROM centros_costo cc
            JOIN proyectos p ON cc.proyecto_id = p.proyecto_id
            JOIN regiones r ON p.region_id = r.region_id
            WHERE cc.id = ?
        ");
        $stmt->execute([$user['centro_costo_id']]);
        $result = $stmt->fetch();
        if ($result) {
            $centro_costo_id = $result['centro_costo_id'];
            $proyecto_id = $result['proyecto_id'];
            $region_id = $result['region_id'];
            $centro_costo_nombre = $result['centro_costo_nombre'];
            $proyecto_nombre = $result['proyecto_nombre'];
            $region_nombre = $result['region_nombre'];
        }
    }
}

    file_put_contents($debug_file, "Preparando respuesta JSON\n", FILE_APPEND);
    
    $response = [
    'status' => 'success',
    'message' => 'Login exitoso',
    'user' => [
        'id' => $user['id'],
        'nombre' => $user['nombre'],
        'email' => $user['email'],
        'rol' => $user['rol'],
        'aprobado' => $user['aprobado'],
        'centro_costo_id' => $centro_costo_id,
        'proyecto_id' => $proyecto_id,
        'region_id' => $region_id,
        'centro_costo_nombre' => $centro_costo_nombre,
        'proyecto_nombre' => $proyecto_nombre,
        'region_nombre' => $region_nombre
    ],
    'centros' => $centros
    ];
    
    file_put_contents($debug_file, "Respuesta preparada: " . json_encode($response, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    file_put_contents($debug_file, "Respuesta enviada exitosamente\n", FILE_APPEND);
    
} catch (Exception $e) {
    file_put_contents($debug_file, "ERROR CRÍTICO: " . $e->getMessage() . "\n", FILE_APPEND);
    file_put_contents($debug_file, "Stack trace: " . $e->getTraceAsString() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error interno del servidor: ' . $e->getMessage()
], JSON_UNESCAPED_UNICODE);
}
exit();
?>
