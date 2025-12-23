<?php
/**
 * API para gestionar Informes Stockholders
 * Permite crear, listar, actualizar y eliminar informes para stockholders
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$proyecto_id = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : null;
$informe_id = isset($_GET['id']) ? intval($_GET['id']) : null;

try {
    switch ($method) {
        case 'GET':
            if ($informe_id) {
                // Obtener un informe específico
                $stmt = $pdo->prepare("
                    SELECT * FROM informes_stockholders 
                    WHERE id = ? AND proyecto_id = ?
                ");
                $stmt->execute([$informe_id, $proyecto_id]);
                $informe = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$informe) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Informe no encontrado'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
                
                echo json_encode($informe, JSON_UNESCAPED_UNICODE);
            } else {
                // Listar todos los informes de un proyecto
                if (!$proyecto_id) {
                    http_response_code(400);
                    echo json_encode(['error' => 'proyecto_id es requerido'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
                
                $stmt = $pdo->prepare("
                    SELECT * FROM informes_stockholders 
                    WHERE proyecto_id = ? 
                    ORDER BY fecha_creacion DESC
                ");
                $stmt->execute([$proyecto_id]);
                $informes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode($informes, JSON_UNESCAPED_UNICODE);
            }
            break;
            
        case 'POST':
            // Crear nuevo informe
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$proyecto_id) {
                http_response_code(400);
                echo json_encode(['error' => 'proyecto_id es requerido'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            // Verificar que el proyecto existe
            $stmt = $pdo->prepare("SELECT proyecto_id FROM proyectos WHERE proyecto_id = ?");
            $stmt->execute([$proyecto_id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'El proyecto especificado no existe'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            $titulo = $data['titulo'] ?? '';
            $descripcion = $data['descripcion'] ?? '';
            $fecha = $data['fecha'] ?? date('Y-m-d');
            $periodo = $data['periodo'] ?? '';
            $destinatarios = $data['destinatarios'] ?? '';
            $tipo = $data['tipo'] ?? 'Ejecutivo';
            $estado = $data['estado'] ?? 'Borrador';
            $ruta_pdf = $data['ruta_pdf'] ?? null; // Ruta del PDF asociado (reporte ejecutivo)
            $portada = $data['portada'] ?? '/img/fondo-codelco.png';
            $parametros_reporte = isset($data['parametros_reporte']) ? json_encode($data['parametros_reporte'], JSON_UNESCAPED_UNICODE) : null;
            
            if (empty($titulo)) {
                http_response_code(400);
                echo json_encode(['error' => 'El título es requerido'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            // Verificar si la columna parametros_reporte existe
            $columna_existe = false;
            try {
                $stmt_check = $pdo->query("SHOW COLUMNS FROM informes_stockholders LIKE 'parametros_reporte'");
                $columna_existe = $stmt_check->rowCount() > 0;
            } catch (PDOException $e) {
                error_log('Error verificando columna parametros_reporte: ' . $e->getMessage());
            }
            
            // Validar que fecha sea válida
            if (!empty($fecha)) {
                $fecha_validada = date('Y-m-d', strtotime($fecha));
                if ($fecha_validada === false || $fecha_validada === '1970-01-01') {
                    $fecha = date('Y-m-d');
                } else {
                    $fecha = $fecha_validada;
                }
            } else {
                $fecha = date('Y-m-d');
            }
            
            if ($columna_existe) {
                // Insertar con parametros_reporte
                $stmt = $pdo->prepare("
                    INSERT INTO informes_stockholders 
                    (proyecto_id, titulo, descripcion, fecha, periodo, destinatarios, tipo, estado, ruta_pdf, portada, parametros_reporte, fecha_creacion, fecha_actualizacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                $stmt->execute([
                    $proyecto_id,
                    $titulo,
                    $descripcion,
                    $fecha,
                    $periodo,
                    $destinatarios,
                    $tipo,
                    $estado,
                    $ruta_pdf,
                    $portada,
                    $parametros_reporte
                ]);
            } else {
                // Insertar sin parametros_reporte (columna no existe aún)
                $stmt = $pdo->prepare("
                    INSERT INTO informes_stockholders 
                    (proyecto_id, titulo, descripcion, fecha, periodo, destinatarios, tipo, estado, ruta_pdf, portada, fecha_creacion, fecha_actualizacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                $stmt->execute([
                    $proyecto_id,
                    $titulo,
                    $descripcion,
                    $fecha,
                    $periodo,
                    $destinatarios,
                    $tipo,
                    $estado,
                    $ruta_pdf,
                    $portada
                ]);
            }
            
            $nuevo_id = $pdo->lastInsertId();
            
            // Obtener el informe creado
            $stmt = $pdo->prepare("SELECT * FROM informes_stockholders WHERE id = ?");
            $stmt->execute([$nuevo_id]);
            $informe = $stmt->fetch(PDO::FETCH_ASSOC);
            
            http_response_code(201);
            echo json_encode($informe, JSON_UNESCAPED_UNICODE);
            break;
            
        case 'PUT':
            // Actualizar informe existente
            if (!$informe_id || !$proyecto_id) {
                http_response_code(400);
                echo json_encode(['error' => 'id y proyecto_id son requeridos'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $campos = [];
            $valores = [];
            
            if (isset($data['titulo'])) {
                $campos[] = 'titulo = ?';
                $valores[] = $data['titulo'];
            }
            if (isset($data['descripcion'])) {
                $campos[] = 'descripcion = ?';
                $valores[] = $data['descripcion'];
            }
            if (isset($data['fecha'])) {
                $campos[] = 'fecha = ?';
                $valores[] = $data['fecha'];
            }
            if (isset($data['periodo'])) {
                $campos[] = 'periodo = ?';
                $valores[] = $data['periodo'];
            }
            if (isset($data['destinatarios'])) {
                $campos[] = 'destinatarios = ?';
                $valores[] = $data['destinatarios'];
            }
            if (isset($data['tipo'])) {
                $campos[] = 'tipo = ?';
                $valores[] = $data['tipo'];
            }
            if (isset($data['estado'])) {
                $campos[] = 'estado = ?';
                $valores[] = $data['estado'];
            }
            if (isset($data['ruta_pdf'])) {
                $campos[] = 'ruta_pdf = ?';
                $valores[] = $data['ruta_pdf'];
            }
            if (isset($data['portada'])) {
                $campos[] = 'portada = ?';
                $valores[] = $data['portada'];
            }
            // Verificar si la columna parametros_reporte existe antes de intentar actualizarla
            try {
                $stmt_check = $pdo->query("SHOW COLUMNS FROM informes_stockholders LIKE 'parametros_reporte'");
                $columna_existe = $stmt_check->rowCount() > 0;
                
                if ($columna_existe && isset($data['parametros_reporte'])) {
                    $campos[] = 'parametros_reporte = ?';
                    $valores[] = json_encode($data['parametros_reporte'], JSON_UNESCAPED_UNICODE);
                }
            } catch (PDOException $e) {
                // Si falla la verificación, simplemente no incluir parametros_reporte
                error_log('No se pudo verificar columna parametros_reporte: ' . $e->getMessage());
            }
            
            if (empty($campos)) {
                http_response_code(400);
                echo json_encode(['error' => 'No hay campos para actualizar'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            $campos[] = 'fecha_actualizacion = NOW()';
            $valores[] = $informe_id;
            $valores[] = $proyecto_id;
            
            $sql = "UPDATE informes_stockholders SET " . implode(', ', $campos) . " WHERE id = ? AND proyecto_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($valores);
            
            // Obtener el informe actualizado
            $stmt = $pdo->prepare("SELECT * FROM informes_stockholders WHERE id = ? AND proyecto_id = ?");
            $stmt->execute([$informe_id, $proyecto_id]);
            $informe = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$informe) {
                http_response_code(404);
                echo json_encode(['error' => 'Informe no encontrado'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            echo json_encode($informe, JSON_UNESCAPED_UNICODE);
            break;
            
        case 'DELETE':
            // Eliminar informe
            if (!$informe_id || !$proyecto_id) {
                http_response_code(400);
                echo json_encode(['error' => 'id y proyecto_id son requeridos'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM informes_stockholders WHERE id = ? AND proyecto_id = ?");
            $stmt->execute([$informe_id, $proyecto_id]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Informe no encontrado'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            echo json_encode(['message' => 'Informe eliminado correctamente'], JSON_UNESCAPED_UNICODE);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    $error_message = $e->getMessage();
    $error_code = $e->getCode();
    
    // Log detallado del error
    error_log('Error en informes.php (PDO): ' . $error_message);
    error_log('Código de error: ' . $error_code);
    error_log('Método: ' . $method);
    error_log('Proyecto ID: ' . $proyecto_id);
    error_log('Informe ID: ' . $informe_id);
    
    // Verificar diferentes tipos de errores
    if (strpos($error_message, "doesn't exist") !== false || 
        (strpos($error_message, "Table") !== false && strpos($error_message, "doesn't exist") !== false)) {
        // Tabla no existe
        echo json_encode([
            'error' => 'La tabla informes_stockholders no existe. Por favor, ejecuta el script SQL para crearla.',
            'sql_file' => 'api/database/create_informes_stockholders_table.sql',
            'install_url' => '/rcritico/api/stockholders/crear_tabla.php',
            'debug' => $error_message
        ], JSON_UNESCAPED_UNICODE);
    } elseif (strpos($error_message, "Unknown column") !== false && strpos($error_message, "parametros_reporte") !== false) {
        // Columna parametros_reporte no existe
        echo json_encode([
            'error' => 'La columna parametros_reporte no existe. Por favor, ejecuta el script para agregarla.',
            'install_url' => '/rcritico/api/stockholders/agregar_columna_parametros.php',
            'debug' => $error_message
        ], JSON_UNESCAPED_UNICODE);
    } elseif (strpos($error_message, "foreign key constraint") !== false || 
              strpos($error_message, "1452") !== false) {
        // Error de foreign key - proyecto_id no existe
        echo json_encode([
            'error' => 'El proyecto especificado no existe. Verifica que el proyecto_id sea válido.',
            'message' => 'No se puede crear el informe porque el proyecto no existe en la base de datos.',
            'debug' => $error_message
        ], JSON_UNESCAPED_UNICODE);
    } else {
        // Otro error de base de datos
        echo json_encode([
            'error' => 'Error de base de datos',
            'message' => $error_message,
            'code' => $error_code,
            'debug' => 'Revisa los logs del servidor para más detalles'
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Error en informes.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    echo json_encode([
        'error' => 'Error inesperado',
        'message' => $e->getMessage(),
        'debug' => 'Revisa los logs del servidor para más detalles'
    ], JSON_UNESCAPED_UNICODE);
}
?>

