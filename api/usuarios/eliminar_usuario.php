<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validar que el método sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Método no permitido. Se requiere POST.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// Contraseña especial para confirmar eliminación
const PASSWORD_ELIMINACION = 'qwerty123$$';

// Verificar que la conexión a la base de datos esté disponible
if (!isset($pdo)) {
    http_response_code(500);
    // Asegurar headers CORS incluso en errores
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Error de conexión a la base de datos.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $input = file_get_contents('php://input');
    error_log('Input recibido en eliminar_usuario.php: ' . $input);
    
    if (empty($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No se recibieron datos.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        error_log('Error al decodificar JSON: ' . json_last_error_msg());
        echo json_encode(['success' => false, 'error' => 'Datos JSON inválidos: ' . json_last_error_msg()], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    error_log('Datos decodificados: ' . print_r($data, true));
    
    $id = isset($data['id']) ? intval($data['id']) : 0;
    $password_confirmacion = isset($data['password_confirmacion']) ? trim($data['password_confirmacion']) : '';
    $usuario_que_elimina_id = isset($data['usuario_que_elimina_id']) ? intval($data['usuario_que_elimina_id']) : 0;
    
    error_log("ID usuario a eliminar: $id, ID usuario que elimina: $usuario_que_elimina_id");

    // Validar ID del usuario a eliminar
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID de usuario inválido.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Validar que se proporcione el ID del usuario que está eliminando
    if ($usuario_que_elimina_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Debe proporcionar el ID del usuario que está eliminando.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Verificar que el usuario que está eliminando existe y es super_admin
    $stmt_verificar = $pdo->prepare("SELECT id, rol FROM usuarios WHERE id = ?");
    $stmt_verificar->execute([$usuario_que_elimina_id]);
    $usuario_que_elimina = $stmt_verificar->fetch();

    if (!$usuario_que_elimina) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Usuario que intenta eliminar no encontrado.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($usuario_que_elimina['rol'] !== 'super_admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Solo los super administradores pueden eliminar usuarios.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Validar contraseña de confirmación
    if (empty($password_confirmacion)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Debe proporcionar la contraseña de confirmación.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($password_confirmacion !== PASSWORD_ELIMINACION) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Contraseña de confirmación incorrecta.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Verificar que el usuario a eliminar existe y obtener su información
    $stmt_usuario = $pdo->prepare("SELECT id, nombre, email FROM usuarios WHERE id = ?");
    $stmt_usuario->execute([$id]);
    $usuario_a_eliminar = $stmt_usuario->fetch();

    if (!$usuario_a_eliminar) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Usuario a eliminar no encontrado.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Prevenir auto-eliminación
    if ($id === $usuario_que_elimina_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No puedes eliminar tu propio usuario.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $usuario_nombre = $usuario_a_eliminar['nombre'];
    $usuario_email = $usuario_a_eliminar['email'];
    
    // Iniciar transacción para eliminar todas las relaciones
    $pdo->beginTransaction();
    
    try {
        // Deshabilitar verificaciones de claves foráneas temporalmente
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        // 1. Eliminar asignaciones de usuarios a carpetas
        $stmt_carpeta_usuarios = $pdo->prepare("DELETE FROM carpeta_usuarios WHERE usuario_id = ?");
        $stmt_carpeta_usuarios->execute([$id]);
        
        // 2. Eliminar relación usuario_centro_costo si existe
        $stmt_check_table = $pdo->query("SHOW TABLES LIKE 'usuario_centro_costo'");
        if ($stmt_check_table->rowCount() > 0) {
            $stmt_usuario_centro = $pdo->prepare("DELETE FROM usuario_centro_costo WHERE usuario_id = ?");
            $stmt_usuario_centro->execute([$id]);
        }
        
        // 3. Eliminar asignaciones de tareas (carpeta_tarea_asignaciones)
        $stmt_check_table = $pdo->query("SHOW TABLES LIKE 'carpeta_tarea_asignaciones'");
        if ($stmt_check_table->rowCount() > 0) {
            $stmt_tarea_asignaciones = $pdo->prepare("DELETE FROM carpeta_tarea_asignaciones WHERE usuario_id = ?");
            $stmt_tarea_asignaciones->execute([$id]);
        }
        
        // 4. Eliminar comentarios de tareas (carpeta_tarea_comentarios)
        $stmt_check_table = $pdo->query("SHOW TABLES LIKE 'carpeta_tarea_comentarios'");
        if ($stmt_check_table->rowCount() > 0) {
            $stmt_comentarios = $pdo->prepare("DELETE FROM carpeta_tarea_comentarios WHERE usuario_id = ?");
            $stmt_comentarios->execute([$id]);
        }
        
        // 5. Limpiar referencias en carpeta_linea_base (campos de texto)
        $stmt_check_table = $pdo->query("SHOW TABLES LIKE 'carpeta_linea_base'");
        if ($stmt_check_table->rowCount() > 0) {
            $stmt_update_linea_base = $pdo->prepare("
                UPDATE carpeta_linea_base 
                SET usuario_validacion = NULL, 
                    ultimo_usuario_edito = NULL 
                WHERE usuario_validacion = ? OR ultimo_usuario_edito = ?
            ");
            $stmt_update_linea_base->execute([$usuario_email, $usuario_email]);
        }
        
        // 6. Limpiar referencias en carpeta_linea_base_mitigadores
        $stmt_check_table = $pdo->query("SHOW TABLES LIKE 'carpeta_linea_base_mitigadores'");
        if ($stmt_check_table->rowCount() > 0) {
            $stmt_update_mitigadores = $pdo->prepare("
                UPDATE carpeta_linea_base_mitigadores 
                SET usuario_validacion = NULL, 
                    ultimo_usuario_edito = NULL 
                WHERE usuario_validacion = ? OR ultimo_usuario_edito = ?
            ");
            $stmt_update_mitigadores->execute([$usuario_email, $usuario_email]);
        }
        
        // 7. Limpiar mensajes del foro si existe la tabla
        $stmt_check_table = $pdo->query("SHOW TABLES LIKE 'carpeta_mensajes'");
        if ($stmt_check_table->rowCount() > 0) {
            try {
                // Verificar si existe la columna usuario_id
                $stmt_check_col = $pdo->query("SHOW COLUMNS FROM carpeta_mensajes LIKE 'usuario_id'");
                if ($stmt_check_col->rowCount() > 0) {
                    $stmt_mensajes = $pdo->prepare("DELETE FROM carpeta_mensajes WHERE usuario_id = ?");
                    $stmt_mensajes->execute([$id]);
                }
            } catch (PDOException $ex) {
                // Ignorar errores de esta tabla
                error_log('Warning: No se pudieron limpiar mensajes: ' . $ex->getMessage());
            }
        }
        
        // 8. Limpiar archivos si existe la tabla y tiene usuario_id
        $stmt_check_table = $pdo->query("SHOW TABLES LIKE 'archivos'");
        if ($stmt_check_table->rowCount() > 0) {
            try {
                $stmt_check_col = $pdo->query("SHOW COLUMNS FROM archivos LIKE 'usuario_id'");
                if ($stmt_check_col->rowCount() > 0) {
                    $stmt_archivos = $pdo->prepare("DELETE FROM archivos WHERE usuario_id = ?");
                    $stmt_archivos->execute([$id]);
                }
            } catch (PDOException $ex) {
                error_log('Warning: No se pudieron limpiar archivos: ' . $ex->getMessage());
            }
        }
        
        // 9. Finalmente, eliminar el usuario
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        
        // Rehabilitar verificaciones de claves foráneas
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        // Confirmar transacción
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario eliminado correctamente.'
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        // Rehabilitar verificaciones de claves foráneas antes de hacer rollback
        try {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        } catch (Exception $ex) {
            // Ignorar errores al re-habilitar
        }
        // Revertir transacción en caso de error
        $pdo->rollBack();
        throw $e; // Relanzar para que sea capturado por el catch externo
    }
} catch (PDOException $e) {
    http_response_code(500);
    // Asegurar headers CORS incluso en errores
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header('Content-Type: application/json; charset=utf-8');
    
    $errorMessage = $e->getMessage();
    $errorCode = $e->getCode();
    
    error_log('Error PDO en eliminar_usuario.php: ' . $errorMessage);
    error_log('Código de error: ' . $errorCode);
    error_log('Stack trace: ' . $e->getTraceAsString());
    
    // Mensaje más específico según el tipo de error
    $userMessage = 'Error en la base de datos al eliminar usuario.';
    if (strpos($errorMessage, 'foreign key constraint') !== false) {
        $userMessage = 'No se puede eliminar el usuario porque tiene datos relacionados en el sistema.';
    } elseif (strpos($errorMessage, '1451') !== false) {
        $userMessage = 'No se puede eliminar el usuario porque tiene registros relacionados en otras tablas.';
    }
    
    echo json_encode([
        'success' => false,
        'error' => $userMessage,
        'debug' => (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') !== false) ? $errorMessage : null
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    // Asegurar headers CORS incluso en errores
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header('Content-Type: application/json; charset=utf-8');
    error_log('Error en eliminar_usuario.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    error_log('Tipo de error: ' . get_class($e));
    error_log('Archivo: ' . $e->getFile() . ' Línea: ' . $e->getLine());
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor al eliminar usuario.'
    ], JSON_UNESCAPED_UNICODE);
}
?>
