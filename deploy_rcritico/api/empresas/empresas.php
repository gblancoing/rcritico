<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuración de errores solo para desarrollo
if (in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) || 
    strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}
require_once __DIR__ . '/../config/db.php';

// POST - Crear empresa
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['nombre']) || !isset($data['rut']) || empty($data['rut'])) {
        echo json_encode(['success' => false, 'error' => 'El nombre y el RUT son obligatorios'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        // El RUT es el ID de la empresa
        $rut = trim($data['rut']);
        
        // Verificar si ya existe una empresa con ese RUT
        $stmt_check = $pdo->prepare("SELECT empresa_id FROM empresas WHERE empresa_id = ?");
        $stmt_check->execute([$rut]);
        if ($stmt_check->rowCount() > 0) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => 'Ya existe una empresa con ese RUT'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Insertar empresa usando el RUT como ID
        $stmt = $pdo->prepare("
            INSERT INTO empresas (empresa_id, nombre, direccion, telefono, email, contacto_nombre, contacto_telefono, contacto_email, activo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ");
        $stmt->execute([
            $rut,
            $data['nombre'] ?? '',
            $data['direccion'] ?? null,
            $data['telefono'] ?? null,
            $data['email'] ?? null,
            $data['contacto_nombre'] ?? null,
            $data['contacto_telefono'] ?? null,
            $data['contacto_email'] ?? null
        ]);
        
        // Insertar relaciones con regiones
        if (isset($data['regiones']) && is_array($data['regiones'])) {
            $stmt_region = $pdo->prepare("INSERT INTO empresa_regiones (empresa_id, region_id) VALUES (?, ?)");
            foreach ($data['regiones'] as $region_id) {
                $stmt_region->execute([$rut, (int)$region_id]);
            }
        }
        
        // Insertar relaciones con proyectos
        if (isset($data['proyectos']) && is_array($data['proyectos'])) {
            $stmt_proyecto = $pdo->prepare("INSERT INTO empresa_proyectos (empresa_id, proyecto_id) VALUES (?, ?)");
            foreach ($data['proyectos'] as $proyecto_id) {
                $stmt_proyecto->execute([$rut, (int)$proyecto_id]);
            }
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'empresa_id' => $rut], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Error creando empresa: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al crear empresa: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Error general creando empresa: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error inesperado: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// PUT - Actualizar empresa
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['empresa_id'], $data['nombre'], $data['rut']) || empty($data['rut'])) {
        echo json_encode(['success' => false, 'error' => 'Datos incompletos: empresa_id, nombre y RUT son obligatorios'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        $rut_actual = trim($data['rut']);
        $empresa_id_actual = $data['empresa_id'];
        
        // Si el RUT cambió, verificar que no exista otra empresa con el nuevo RUT
        if ($rut_actual !== $empresa_id_actual) {
            $stmt_check = $pdo->prepare("SELECT empresa_id FROM empresas WHERE empresa_id = ? AND empresa_id != ?");
            $stmt_check->execute([$rut_actual, $empresa_id_actual]);
            if ($stmt_check->rowCount() > 0) {
                $pdo->rollBack();
                echo json_encode(['success' => false, 'error' => 'Ya existe otra empresa con ese RUT'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            // Si el RUT cambió, actualizar las relaciones primero
            $pdo->prepare("UPDATE empresa_regiones SET empresa_id = ? WHERE empresa_id = ?")->execute([$rut_actual, $empresa_id_actual]);
            $pdo->prepare("UPDATE empresa_proyectos SET empresa_id = ? WHERE empresa_id = ?")->execute([$rut_actual, $empresa_id_actual]);
        }
        
        // Actualizar empresa (si el RUT cambió, también actualizar el ID)
        if ($rut_actual !== $empresa_id_actual) {
            // Eliminar el registro antiguo y crear uno nuevo con el nuevo RUT
            $stmt_delete = $pdo->prepare("DELETE FROM empresas WHERE empresa_id = ?");
            $stmt_delete->execute([$empresa_id_actual]);
            
            $stmt = $pdo->prepare("
                INSERT INTO empresas (empresa_id, nombre, direccion, telefono, email, contacto_nombre, contacto_telefono, contacto_email, activo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $rut_actual,
                $data['nombre'],
                $data['direccion'] ?? null,
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                $data['contacto_nombre'] ?? null,
                $data['contacto_telefono'] ?? null,
                $data['contacto_email'] ?? null,
                $data['activo'] ?? 1
            ]);
        } else {
            // Solo actualizar los datos, el RUT no cambió
            $stmt = $pdo->prepare("
                UPDATE empresas 
                SET nombre = ?, direccion = ?, telefono = ?, email = ?, 
                    contacto_nombre = ?, contacto_telefono = ?, contacto_email = ?,
                    activo = ?
                WHERE empresa_id = ?
            ");
            $stmt->execute([
                $data['nombre'],
                $data['direccion'] ?? null,
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                $data['contacto_nombre'] ?? null,
                $data['contacto_telefono'] ?? null,
                $data['contacto_email'] ?? null,
                $data['activo'] ?? 1,
                $empresa_id_actual
            ]);
        }
        
        // Eliminar relaciones existentes y recrearlas
        $pdo->prepare("DELETE FROM empresa_regiones WHERE empresa_id = ?")->execute([$rut_actual]);
        $pdo->prepare("DELETE FROM empresa_proyectos WHERE empresa_id = ?")->execute([$rut_actual]);
        
        // Insertar nuevas relaciones con regiones
        if (isset($data['regiones']) && is_array($data['regiones'])) {
            $stmt_region = $pdo->prepare("INSERT INTO empresa_regiones (empresa_id, region_id) VALUES (?, ?)");
            foreach ($data['regiones'] as $region_id) {
                $stmt_region->execute([$rut_actual, (int)$region_id]);
            }
        }
        
        // Insertar nuevas relaciones con proyectos
        if (isset($data['proyectos']) && is_array($data['proyectos'])) {
            $stmt_proyecto = $pdo->prepare("INSERT INTO empresa_proyectos (empresa_id, proyecto_id) VALUES (?, ?)");
            foreach ($data['proyectos'] as $proyecto_id) {
                $stmt_proyecto->execute([$rut_actual, (int)$proyecto_id]);
            }
        }
        
        $pdo->commit();
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Error actualizando empresa: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al actualizar empresa: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Error general actualizando empresa: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error inesperado: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE - Eliminar empresa
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['empresa_id'])) {
        echo json_encode(['success' => false, 'error' => 'ID de empresa requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Las relaciones se eliminan en cascada por las FOREIGN KEY
        $stmt = $pdo->prepare("DELETE FROM empresas WHERE empresa_id = ?");
        $stmt->execute([$data['empresa_id']]);
        
        $pdo->commit();
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Error eliminando empresa: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al eliminar empresa: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Error general eliminando empresa: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error inesperado: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// GET - Listar empresas con sus regiones y proyectos
try {
    $stmt_check = $pdo->query("SHOW COLUMNS FROM empresas LIKE 'activo'");
    $tiene_activo = $stmt_check->rowCount() > 0;
    
    if ($tiene_activo) {
        $stmt = $pdo->query("
            SELECT empresa_id, nombre, direccion, telefono, email, 
                   contacto_nombre, contacto_telefono, contacto_email, activo,
                   fecha_registro, fecha_actualizacion
            FROM empresas 
            WHERE activo = 1 
            ORDER BY nombre ASC
        ");
    } else {
        $stmt = $pdo->query("
            SELECT empresa_id, nombre, direccion, telefono, email, 
                   contacto_nombre, contacto_telefono, contacto_email,
                   fecha_registro, fecha_actualizacion
            FROM empresas 
            ORDER BY nombre ASC
        ");
    }
    
    $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener regiones y proyectos para cada empresa
    foreach ($empresas as &$empresa) {
        $empresa_id = $empresa['empresa_id']; // El RUT es el ID
        
        // Agregar el RUT como campo separado para compatibilidad (empresa_id ya es el RUT)
        $empresa['rut'] = $empresa_id;
        
        // Obtener regiones
        $stmt_regiones = $pdo->prepare("
            SELECT er.region_id, r.nombre 
            FROM empresa_regiones er
            JOIN regiones r ON er.region_id = r.region_id
            WHERE er.empresa_id = ?
        ");
        $stmt_regiones->execute([$empresa_id]);
        $empresa['regiones'] = $stmt_regiones->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener proyectos
        $stmt_proyectos = $pdo->prepare("
            SELECT ep.proyecto_id, p.nombre 
            FROM empresa_proyectos ep
            JOIN proyectos p ON ep.proyecto_id = p.proyecto_id
            WHERE ep.empresa_id = ?
        ");
        $stmt_proyectos->execute([$empresa_id]);
        $empresa['proyectos'] = $stmt_proyectos->fetchAll(PDO::FETCH_ASSOC);
        
        // Normalizar IDs (solo regiones y proyectos, empresa_id se mantiene como string)
        foreach ($empresa['regiones'] as &$region) {
            $region['region_id'] = (int)$region['region_id'];
        }
        foreach ($empresa['proyectos'] as &$proyecto) {
            $proyecto['proyecto_id'] = (int)$proyecto['proyecto_id'];
        }
    }
    
    echo json_encode($empresas, JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    error_log('Error cargando empresas: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al cargar empresas: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log('Error general cargando empresas: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error inesperado: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

