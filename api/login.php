<?php// Configuración de errores solo para desarrollo
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

require_once 'db.php';
file_put_contents('login_debug.txt', "Conexión a DB OK\n", FILE_APPEND);
file_put_contents('login_debug.txt', "INICIO LOGIN\n", FILE_APPEND);

// Obtener datos del body
$input = json_decode(file_get_contents('php://input'), true);
file_put_contents('login_debug.txt', print_r($input, true), FILE_APPEND);

if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Faltan datos requeridos (email y password)'
    ]);
    exit();
}

$email = trim($input['email']);
$password = trim($input['password']);

// Buscar usuario por email
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Usuario o contraseña incorrectos'
    ]);
    exit();
}

// Validar contraseña (soporte temporal para texto plano)
if (!password_verify($password, $user['password'])) {
    // Soporte temporal: si la contraseña coincide en texto plano, actualiza a hash
    if ($password === $user['password']) {
        // Actualiza la contraseña a hash
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $update = $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
        $update->execute([$newHash, $user['id']]);
    } else {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Usuario o contraseña incorrectos'
        ]);
        exit();
    }
}

file_put_contents('login_debug.txt', "DESPUÉS DE PASSWORD\n", FILE_APPEND);

// Si es visita sin permiso o no está aprobado
if ($user['rol'] === 'visita_sin_permiso' || !$user['aprobado']) {
    echo json_encode([
        'status' => 'pending',
        'message' => 'Usuario registrado pero no aprobado por un administrador',
        'rol' => $user['rol']
    ]);
    exit();
}

file_put_contents('login_debug.txt', "DESPUÉS DE APROBADO\n", FILE_APPEND);

// Obtener sucursales/proyectos según el rol
$centros = [];

if ($user['rol'] === 'super_admin') {
    // Todas las sucursales/proyectos
    $stmt = $pdo->query("SELECT id, nombre, descripcion, proyecto_id FROM centros_costo");
    $centros = $stmt->fetchAll();
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
        file_put_contents('login_debug.txt', "ADMIN CENTROS: " . print_r($centros, true) . "\\n", FILE_APPEND);
    } catch (Exception $e) {
        file_put_contents('login_debug.txt', "ERROR ADMIN: " . $e->getMessage() . "\\n", FILE_APPEND);
    }
} elseif ($user['rol'] === 'trabajador' || $user['rol'] === 'visita') {
    // Solo la sucursal/proyecto asignada
    if ($user['centro_costo_id']) {
        $stmt = $pdo->prepare("SELECT id, nombre, descripcion, region_id FROM centros_costo WHERE id = ?");
        $stmt->execute([$user['centro_costo_id']]);
        $centro = $stmt->fetch();
        if ($centro) {
            $centros[] = $centro;
        }
    }
}

file_put_contents('login_debug.txt', "CENTROS OBTENIDOS: " . print_r($centros, true) . "\n", FILE_APPEND);
file_put_contents('login_debug.txt', "ANTES DE LOGIN EXITOSO\n", FILE_APPEND);

// Login exitoso
// Obtener información completa del admin (centro_costo_id, proyecto_id, region_id)
$centro_costo_id = null;
$proyecto_id = null;
$region_id = null;
$centro_costo_nombre = null;
$proyecto_nombre = null;
$region_nombre = null;

if ($user['rol'] === 'admin') {
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

echo json_encode([
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
]);
exit();
?>
