<?php
/**
 * API para gestión de carpetas de documentos en Línea Base
 * Permite crear estructura de carpetas tipo OneDrive
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

// Verificar/crear tabla si no existe
function verificarTabla($pdo) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'linea_base_carpetas'");
        if ($stmt->rowCount() === 0) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS linea_base_carpetas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                linea_base_id INT NOT NULL,
                carpeta_padre_id INT DEFAULT NULL,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT DEFAULT NULL,
                color VARCHAR(7) DEFAULT '#17a2b8',
                creado_por INT NOT NULL,
                creado_por_nombre VARCHAR(255) DEFAULT NULL,
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                activo TINYINT(1) DEFAULT 1,
                INDEX idx_linea_base (linea_base_id),
                INDEX idx_carpeta_padre (carpeta_padre_id),
                INDEX idx_activo (activo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
        }
    } catch (PDOException $e) {
        // Tabla ya existe, ignorar
    }
}

verificarTabla($pdo);

// GET: Obtener carpetas de un registro de línea base
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $linea_base_id = isset($_GET['linea_base_id']) ? intval($_GET['linea_base_id']) : null;
    $carpeta_padre_id = isset($_GET['carpeta_padre_id']) ? ($_GET['carpeta_padre_id'] === 'null' ? null : intval($_GET['carpeta_padre_id'])) : null;
    
    if (!$linea_base_id) {
        echo json_encode(['success' => false, 'error' => 'linea_base_id es requerido']);
        exit();
    }
    
    try {
        // Obtener carpetas
        if ($carpeta_padre_id === null) {
            $stmt = $pdo->prepare("SELECT * FROM linea_base_carpetas WHERE linea_base_id = ? AND carpeta_padre_id IS NULL AND activo = 1 ORDER BY nombre ASC");
            $stmt->execute([$linea_base_id]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM linea_base_carpetas WHERE linea_base_id = ? AND carpeta_padre_id = ? AND activo = 1 ORDER BY nombre ASC");
            $stmt->execute([$linea_base_id, $carpeta_padre_id]);
        }
        $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener archivos de la carpeta actual
        $stmtArchivos = $pdo->query("SHOW TABLES LIKE 'linea_base_archivos'");
        $archivos = [];
        if ($stmtArchivos->rowCount() > 0) {
            if ($carpeta_padre_id === null) {
                $stmt2 = $pdo->prepare("SELECT * FROM linea_base_archivos WHERE linea_base_id = ? AND carpeta_id IS NULL AND activo = 1 ORDER BY nombre_original ASC");
                $stmt2->execute([$linea_base_id]);
            } else {
                $stmt2 = $pdo->prepare("SELECT * FROM linea_base_archivos WHERE linea_base_id = ? AND carpeta_id = ? AND activo = 1 ORDER BY nombre_original ASC");
                $stmt2->execute([$linea_base_id, $carpeta_padre_id]);
            }
            $archivos = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Obtener ruta de navegación (breadcrumbs)
        $breadcrumbs = [];
        if ($carpeta_padre_id !== null) {
            $currentId = $carpeta_padre_id;
            while ($currentId !== null) {
                $stmtBread = $pdo->prepare("SELECT id, nombre, carpeta_padre_id FROM linea_base_carpetas WHERE id = ?");
                $stmtBread->execute([$currentId]);
                $carpeta = $stmtBread->fetch(PDO::FETCH_ASSOC);
                if ($carpeta) {
                    array_unshift($breadcrumbs, ['id' => $carpeta['id'], 'nombre' => $carpeta['nombre']]);
                    $currentId = $carpeta['carpeta_padre_id'];
                } else {
                    break;
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'carpetas' => $carpetas,
            'archivos' => $archivos,
            'breadcrumbs' => $breadcrumbs,
            'carpeta_actual' => $carpeta_padre_id
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

// POST: Crear nueva carpeta
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $linea_base_id = intval($data['linea_base_id'] ?? 0);
    $carpeta_padre_id = isset($data['carpeta_padre_id']) && $data['carpeta_padre_id'] !== null ? intval($data['carpeta_padre_id']) : null;
    $nombre = trim($data['nombre'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $color = $data['color'] ?? '#17a2b8';
    $creado_por = intval($data['usuario_id'] ?? 0);
    $creado_por_nombre = $data['usuario_nombre'] ?? '';
    
    if (!$linea_base_id || !$nombre || !$creado_por) {
        echo json_encode(['success' => false, 'error' => 'linea_base_id, nombre y usuario_id son requeridos']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO linea_base_carpetas (linea_base_id, carpeta_padre_id, nombre, descripcion, color, creado_por, creado_por_nombre) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$linea_base_id, $carpeta_padre_id, $nombre, $descripcion, $color, $creado_por, $creado_por_nombre]);
        
        $nuevaId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'mensaje' => 'Carpeta creada exitosamente',
            'carpeta' => [
                'id' => $nuevaId,
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'color' => $color
            ]
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

// PUT: Actualizar carpeta
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = intval($data['id'] ?? 0);
    $nombre = trim($data['nombre'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $color = $data['color'] ?? '#17a2b8';
    
    if (!$id || !$nombre) {
        echo json_encode(['success' => false, 'error' => 'id y nombre son requeridos']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE linea_base_carpetas SET nombre = ?, descripcion = ?, color = ? WHERE id = ?");
        $stmt->execute([$nombre, $descripcion, $color, $id]);
        
        echo json_encode(['success' => true, 'mensaje' => 'Carpeta actualizada'], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

// DELETE: Eliminar carpeta (soft delete)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = intval($data['id'] ?? 0);
    
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'id es requerido']);
        exit();
    }
    
    try {
        // Soft delete de la carpeta y sus subcarpetas recursivamente
        $pdo->beginTransaction();
        
        // Función para eliminar recursivamente
        $eliminarRecursivo = function($carpetaId) use ($pdo, &$eliminarRecursivo) {
            // Obtener subcarpetas
            $stmt = $pdo->prepare("SELECT id FROM linea_base_carpetas WHERE carpeta_padre_id = ? AND activo = 1");
            $stmt->execute([$carpetaId]);
            $subcarpetas = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Eliminar subcarpetas recursivamente
            foreach ($subcarpetas as $subId) {
                $eliminarRecursivo($subId);
            }
            
            // Eliminar archivos de esta carpeta
            $stmtArchivos = $pdo->prepare("UPDATE linea_base_archivos SET activo = 0 WHERE carpeta_id = ?");
            $stmtArchivos->execute([$carpetaId]);
            
            // Eliminar la carpeta
            $stmtCarpeta = $pdo->prepare("UPDATE linea_base_carpetas SET activo = 0 WHERE id = ?");
            $stmtCarpeta->execute([$carpetaId]);
        };
        
        $eliminarRecursivo($id);
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'mensaje' => 'Carpeta eliminada'], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
?>







