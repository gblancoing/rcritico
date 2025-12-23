<?php
/**
 * API para gestionar carpetas de archivos
 * Permite crear, listar, editar y eliminar carpetas en la pestaña Archivos
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// Crear tabla si no existe
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS archivos_carpetas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        carpeta_id INT NOT NULL,
        carpeta_padre_id INT NULL,
        creado_por INT NOT NULL,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        activo TINYINT(1) DEFAULT 1,
        color VARCHAR(7) DEFAULT '#17a2b8',
        icono VARCHAR(50) DEFAULT 'fa-folder',
        INDEX idx_carpeta (carpeta_id),
        INDEX idx_carpeta_padre (carpeta_padre_id),
        INDEX idx_activo (activo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    
    // Verificar si la columna archivos_carpeta_id existe en la tabla archivos
    $stmt_check = $pdo->query("SHOW COLUMNS FROM archivos LIKE 'archivos_carpeta_id'");
    if ($stmt_check->rowCount() === 0) {
        $pdo->exec("ALTER TABLE archivos ADD COLUMN archivos_carpeta_id INT NULL AFTER carpeta_id");
        $pdo->exec("ALTER TABLE archivos ADD INDEX idx_archivos_carpeta (archivos_carpeta_id)");
    }
} catch (PDOException $e) {
    // Tabla ya existe o error menor, continuar
}

// GET: Listar carpetas de archivos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : null;
    $carpeta_padre_id = isset($_GET['carpeta_padre_id']) ? $_GET['carpeta_padre_id'] : null;
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    // Obtener carpeta específica por ID
    if ($id) {
        try {
            $sql = "SELECT ac.*, u.nombre as creador_nombre,
                           (SELECT COUNT(*) FROM archivos WHERE archivos_carpeta_id = ac.id AND activo = 1) as cantidad_archivos,
                           (SELECT COUNT(*) FROM archivos_carpetas WHERE carpeta_padre_id = ac.id AND activo = 1) as cantidad_subcarpetas
                    FROM archivos_carpetas ac
                    LEFT JOIN usuarios u ON ac.creado_por = u.id
                    WHERE ac.id = ? AND ac.activo = 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);
            $carpeta = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($carpeta) {
                echo json_encode($carpeta, JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Carpeta no encontrada'], JSON_UNESCAPED_UNICODE);
            }
            exit;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    
    if (!$carpeta_id) {
        http_response_code(400);
        echo json_encode(['error' => 'carpeta_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Construir consulta según si se buscan subcarpetas o carpetas raíz
        if ($carpeta_padre_id === 'null' || $carpeta_padre_id === '') {
            // Carpetas raíz (sin padre)
            $sql = "SELECT ac.*, u.nombre as creador_nombre,
                           (SELECT COUNT(*) FROM archivos WHERE archivos_carpeta_id = ac.id AND activo = 1) as cantidad_archivos,
                           (SELECT COUNT(*) FROM archivos_carpetas WHERE carpeta_padre_id = ac.id AND activo = 1) as cantidad_subcarpetas
                    FROM archivos_carpetas ac
                    LEFT JOIN usuarios u ON ac.creado_por = u.id
                    WHERE ac.carpeta_id = ? AND ac.carpeta_padre_id IS NULL AND ac.activo = 1
                    ORDER BY ac.nombre ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$carpeta_id]);
        } elseif ($carpeta_padre_id) {
            // Subcarpetas de una carpeta específica
            $sql = "SELECT ac.*, u.nombre as creador_nombre,
                           (SELECT COUNT(*) FROM archivos WHERE archivos_carpeta_id = ac.id AND activo = 1) as cantidad_archivos,
                           (SELECT COUNT(*) FROM archivos_carpetas WHERE carpeta_padre_id = ac.id AND activo = 1) as cantidad_subcarpetas
                    FROM archivos_carpetas ac
                    LEFT JOIN usuarios u ON ac.creado_por = u.id
                    WHERE ac.carpeta_id = ? AND ac.carpeta_padre_id = ? AND ac.activo = 1
                    ORDER BY ac.nombre ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$carpeta_id, intval($carpeta_padre_id)]);
        } else {
            // Todas las carpetas de la carpeta principal
            $sql = "SELECT ac.*, u.nombre as creador_nombre,
                           (SELECT COUNT(*) FROM archivos WHERE archivos_carpeta_id = ac.id AND activo = 1) as cantidad_archivos,
                           (SELECT COUNT(*) FROM archivos_carpetas WHERE carpeta_padre_id = ac.id AND activo = 1) as cantidad_subcarpetas
                    FROM archivos_carpetas ac
                    LEFT JOIN usuarios u ON ac.creado_por = u.id
                    WHERE ac.carpeta_id = ? AND ac.activo = 1
                    ORDER BY ac.carpeta_padre_id IS NULL DESC, ac.nombre ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$carpeta_id]);
        }
        
        $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($carpetas, JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener carpetas: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// POST: Crear carpeta
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nombre = isset($data['nombre']) ? trim($data['nombre']) : null;
    $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
    $carpeta_id = isset($data['carpeta_id']) ? intval($data['carpeta_id']) : null;
    $carpeta_padre_id = isset($data['carpeta_padre_id']) && $data['carpeta_padre_id'] ? intval($data['carpeta_padre_id']) : null;
    $creado_por = isset($data['creado_por']) ? intval($data['creado_por']) : null;
    $color = isset($data['color']) ? $data['color'] : '#17a2b8';
    $icono = isset($data['icono']) ? $data['icono'] : 'fa-folder';
    
    if (!$nombre || !$carpeta_id || !$creado_por) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Datos incompletos. Se requiere: nombre, carpeta_id, creado_por'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que no exista una carpeta con el mismo nombre en el mismo nivel
        if ($carpeta_padre_id) {
            $stmt_check = $pdo->prepare("SELECT id FROM archivos_carpetas WHERE nombre = ? AND carpeta_id = ? AND carpeta_padre_id = ? AND activo = 1");
            $stmt_check->execute([$nombre, $carpeta_id, $carpeta_padre_id]);
        } else {
            $stmt_check = $pdo->prepare("SELECT id FROM archivos_carpetas WHERE nombre = ? AND carpeta_id = ? AND carpeta_padre_id IS NULL AND activo = 1");
            $stmt_check->execute([$nombre, $carpeta_id]);
        }
        
        if ($stmt_check->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Ya existe una carpeta con ese nombre en esta ubicación'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO archivos_carpetas (nombre, descripcion, carpeta_id, carpeta_padre_id, creado_por, color, icono) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$nombre, $descripcion, $carpeta_id, $carpeta_padre_id, $creado_por, $color, $icono]);
        
        $nuevo_id = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'id' => $nuevo_id,
            'mensaje' => 'Carpeta creada exitosamente'
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al crear carpeta: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// PUT: Actualizar carpeta
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = isset($data['id']) ? intval($data['id']) : null;
    $nombre = isset($data['nombre']) ? trim($data['nombre']) : null;
    $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
    $color = isset($data['color']) ? $data['color'] : null;
    $icono = isset($data['icono']) ? $data['icono'] : null;
    
    if (!$id || !$nombre) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID y nombre son requeridos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que la carpeta existe
        $stmt_check = $pdo->prepare("SELECT * FROM archivos_carpetas WHERE id = ? AND activo = 1");
        $stmt_check->execute([$id]);
        $carpeta = $stmt_check->fetch();
        
        if (!$carpeta) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Carpeta no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar nombre duplicado
        if ($carpeta['carpeta_padre_id']) {
            $stmt_dup = $pdo->prepare("SELECT id FROM archivos_carpetas WHERE nombre = ? AND carpeta_id = ? AND carpeta_padre_id = ? AND id != ? AND activo = 1");
            $stmt_dup->execute([$nombre, $carpeta['carpeta_id'], $carpeta['carpeta_padre_id'], $id]);
        } else {
            $stmt_dup = $pdo->prepare("SELECT id FROM archivos_carpetas WHERE nombre = ? AND carpeta_id = ? AND carpeta_padre_id IS NULL AND id != ? AND activo = 1");
            $stmt_dup->execute([$nombre, $carpeta['carpeta_id'], $id]);
        }
        
        if ($stmt_dup->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Ya existe una carpeta con ese nombre en esta ubicación'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $updates = ["nombre = ?", "descripcion = ?"];
        $params = [$nombre, $descripcion];
        
        if ($color) {
            $updates[] = "color = ?";
            $params[] = $color;
        }
        if ($icono) {
            $updates[] = "icono = ?";
            $params[] = $icono;
        }
        
        $params[] = $id;
        
        $stmt = $pdo->prepare("UPDATE archivos_carpetas SET " . implode(", ", $updates) . " WHERE id = ?");
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'mensaje' => 'Carpeta actualizada exitosamente'
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al actualizar carpeta: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE: Eliminar carpeta (y subcarpetas en cascada)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Función recursiva para contar y obtener IDs de subcarpetas
        function obtenerSubcarpetasRecursivo($pdo, $carpeta_id, &$ids) {
            $stmt = $pdo->prepare("SELECT id FROM archivos_carpetas WHERE carpeta_padre_id = ? AND activo = 1");
            $stmt->execute([$carpeta_id]);
            $subcarpetas = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($subcarpetas as $sub_id) {
                $ids[] = $sub_id;
                obtenerSubcarpetasRecursivo($pdo, $sub_id, $ids);
            }
        }
        
        // Verificar que la carpeta existe
        $stmt_check = $pdo->prepare("SELECT id FROM archivos_carpetas WHERE id = ? AND activo = 1");
        $stmt_check->execute([$id]);
        if (!$stmt_check->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Carpeta no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Obtener todas las subcarpetas recursivamente
        $ids_a_eliminar = [$id];
        obtenerSubcarpetasRecursivo($pdo, $id, $ids_a_eliminar);
        
        // Contar archivos afectados
        $placeholders = str_repeat('?,', count($ids_a_eliminar) - 1) . '?';
        $stmt_archivos = $pdo->prepare("SELECT COUNT(*) FROM archivos WHERE archivos_carpeta_id IN ($placeholders) AND activo = 1");
        $stmt_archivos->execute($ids_a_eliminar);
        $archivos_eliminados = $stmt_archivos->fetchColumn();
        
        // Soft delete de archivos
        $stmt_del_archivos = $pdo->prepare("UPDATE archivos SET activo = 0 WHERE archivos_carpeta_id IN ($placeholders)");
        $stmt_del_archivos->execute($ids_a_eliminar);
        
        // Soft delete de carpetas
        $stmt_del_carpetas = $pdo->prepare("UPDATE archivos_carpetas SET activo = 0 WHERE id IN ($placeholders)");
        $stmt_del_carpetas->execute($ids_a_eliminar);
        
        echo json_encode([
            'success' => true,
            'mensaje' => 'Carpeta eliminada exitosamente',
            'archivos_eliminados' => $archivos_eliminados,
            'subcarpetas_eliminadas' => count($ids_a_eliminar) - 1
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al eliminar carpeta: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>

