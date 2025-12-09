<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// GET: Listar archivos adjuntos de una tarea
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $tarea_id = isset($_GET['tarea_id']) ? intval($_GET['tarea_id']) : null;
    
    if (!$tarea_id) {
        http_response_code(400);
        echo json_encode(['error' => 'tarea_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        $sql = "SELECT a.*, 
                       u.nombre as usuario_nombre,
                       u.email as usuario_email
                FROM carpeta_tarea_adjuntos a
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                WHERE a.tarea_id = ? AND a.activo = 1
                ORDER BY a.creado_en DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tarea_id]);
        $adjuntos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($adjuntos, JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener adjuntos: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// POST: Subir archivo adjunto
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['archivo']) || !isset($_POST['tarea_id']) || !isset($_POST['usuario_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $tarea_id = intval($_POST['tarea_id']);
    $usuario_id = intval($_POST['usuario_id']);
    $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : null;
    $archivo = $_FILES['archivo'];
    
    try {
        // Verificar que el usuario tiene permiso para adjuntar (debe ser el creador o estar asignado)
        $sqlVerificar = "SELECT t.creado_por, 
                                COUNT(ta.id) as tiene_asignacion
                         FROM carpeta_tareas t
                         LEFT JOIN carpeta_tarea_asignaciones ta ON ta.tarea_id = t.id 
                             AND ta.usuario_id = ? 
                             AND ta.activo = 1
                         WHERE t.id = ? AND t.activo = 1
                         GROUP BY t.id";
        $stmtVerificar = $pdo->prepare($sqlVerificar);
        $stmtVerificar->execute([$usuario_id, $tarea_id]);
        $verificacion = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
        
        if (!$verificacion) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Tarea no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar permisos: solo el creador o los asignados pueden adjuntar
        $es_creador = $verificacion['creado_por'] == $usuario_id;
        $esta_asignado = $verificacion['tiene_asignacion'] > 0;
        
        // También permitir a super_admin y admin adjuntar
        $sqlRol = "SELECT rol FROM usuarios WHERE id = ?";
        $stmtRol = $pdo->prepare($sqlRol);
        $stmtRol->execute([$usuario_id]);
        $usuario = $stmtRol->fetch();
        $es_admin = $usuario && in_array($usuario['rol'], ['super_admin', 'admin']);
        
        if (!$es_creador && !$esta_asignado && !$es_admin) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No tienes permiso para adjuntar archivos a esta tarea'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Validar archivo
        if ($archivo['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Error al subir archivo'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Validar tamaño (máximo 50MB)
        $max_size = 50 * 1024 * 1024; // 50MB
        if ($archivo['size'] > $max_size) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'El archivo es demasiado grande. Máximo 50MB'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Crear directorio para adjuntos de tareas si no existe
        $directorio_base = __DIR__ . '/../../uploads/tareas_adjuntos/';
        if (!file_exists($directorio_base)) {
            mkdir($directorio_base, 0755, true);
        }
        
        // Generar nombre único para el archivo
        $extension = pathinfo($archivo['name'], PATHINFO_EXTENSION);
        $nombre_original = pathinfo($archivo['name'], PATHINFO_BASENAME);
        $nombre_archivo = uniqid('tarea_' . $tarea_id . '_') . '.' . $extension;
        $ruta_archivo = $directorio_base . $nombre_archivo;
        
        // Mover archivo al directorio
        if (!move_uploaded_file($archivo['tmp_name'], $ruta_archivo)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al guardar archivo'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Guardar información en la base de datos
        $ruta_relativa = 'uploads/tareas_adjuntos/' . $nombre_archivo;
        $tipo_mime = $archivo['type'] ?? mime_content_type($ruta_archivo);
        
        $sql = "INSERT INTO carpeta_tarea_adjuntos (tarea_id, usuario_id, nombre_original, nombre_archivo, ruta_archivo, tipo_mime, tamano, descripcion) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $tarea_id,
            $usuario_id,
            $nombre_original,
            $nombre_archivo,
            $ruta_relativa,
            $tipo_mime,
            $archivo['size'],
            $descripcion
        ]);
        
        $adjunto_id = $pdo->lastInsertId();
        
        // Obtener el adjunto creado con información del usuario
        $sqlAdjunto = "SELECT a.*, 
                              u.nombre as usuario_nombre,
                              u.email as usuario_email
                       FROM carpeta_tarea_adjuntos a
                       LEFT JOIN usuarios u ON a.usuario_id = u.id
                       WHERE a.id = ?";
        $stmtAdjunto = $pdo->prepare($sqlAdjunto);
        $stmtAdjunto->execute([$adjunto_id]);
        $adjuntoCreado = $stmtAdjunto->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'adjunto' => $adjuntoCreado], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al adjuntar archivo: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// DELETE: Eliminar adjunto (soft delete)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $adjunto_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    
    if (!$adjunto_id || !$usuario_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que el usuario es el autor del adjunto o es admin
        $sqlVerificar = "SELECT usuario_id, ruta_archivo FROM carpeta_tarea_adjuntos WHERE id = ?";
        $stmtVerificar = $pdo->prepare($sqlVerificar);
        $stmtVerificar->execute([$adjunto_id]);
        $adjuntoActual = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
        
        if (!$adjuntoActual) {
            http_response_code(404);
            echo json_encode(['error' => 'Adjunto no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar rol del usuario
        $sqlUsuario = "SELECT rol FROM usuarios WHERE id = ?";
        $stmtUsuario = $pdo->prepare($sqlUsuario);
        $stmtUsuario->execute([$usuario_id]);
        $usuario = $stmtUsuario->fetch();
        
        if (!$usuario || ($adjuntoActual['usuario_id'] != $usuario_id && !in_array($usuario['rol'], ['super_admin', 'admin']))) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permiso para eliminar este adjunto'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Soft delete
        $sql = "UPDATE carpeta_tarea_adjuntos SET activo = 0 WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$adjunto_id]);
        
        // Opcional: eliminar archivo físico (comentado por seguridad)
        // $ruta_fisica = __DIR__ . '/../../' . $adjuntoActual['ruta_archivo'];
        // if (file_exists($ruta_fisica)) {
        //     unlink($ruta_fisica);
        // }
        
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar adjunto: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);

