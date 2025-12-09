<?php
/**
 * Script de diagnóstico para verificar problemas de acceso de trabajadores
 * Uso: api/diagnostico_trabajador.php?usuario_id=X o ?email=usuario@ejemplo.com
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/db.php';

$usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
$email = isset($_GET['email']) ? trim($_GET['email']) : null;

if (!$usuario_id && !$email) {
    echo json_encode([
        'error' => 'Debe proporcionar usuario_id o email',
        'ejemplo' => '?usuario_id=1 o ?email=usuario@ejemplo.com'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    // Buscar usuario
    if ($usuario_id) {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt->execute([$usuario_id]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)");
        $stmt->execute([$email]);
    }
    
    $usuario = $stmt->fetch();
    
    if (!$usuario) {
        echo json_encode([
            'error' => 'Usuario no encontrado',
            'usuario_id' => $usuario_id,
            'email' => $email
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    $diagnostico = [
        'usuario' => [
            'id' => $usuario['id'],
            'nombre' => $usuario['nombre'],
            'email' => $usuario['email'],
            'rol' => $usuario['rol'],
            'aprobado' => $usuario['aprobado'] == 1,
            'centro_costo_id' => $usuario['centro_costo_id']
        ],
        'problemas' => [],
        'soluciones' => []
    ];
    
    // Verificar 1: ¿Está aprobado?
    if ($usuario['aprobado'] != 1) {
        $diagnostico['problemas'][] = 'Usuario NO está aprobado (aprobado = 0)';
        $diagnostico['soluciones'][] = "Ejecutar: UPDATE usuarios SET aprobado = 1 WHERE id = {$usuario['id']}";
    }
    
    // Verificar 2: ¿Es trabajador?
    if ($usuario['rol'] !== 'trabajador') {
        $diagnostico['problemas'][] = "El usuario tiene rol '{$usuario['rol']}', no 'trabajador'";
    }
    
    // Verificar 3: ¿Tiene registros en usuario_centro_costo?
    $stmt = $pdo->prepare("
        SELECT ucc.*, cc.nombre as centro_costo_nombre, cc.proyecto_id, 
               p.nombre as proyecto_nombre, p.region_id,
               r.nombre as region_nombre
        FROM usuario_centro_costo ucc
        JOIN centros_costo cc ON ucc.centro_costo_id = cc.id
        LEFT JOIN proyectos p ON cc.proyecto_id = p.proyecto_id
        LEFT JOIN regiones r ON p.region_id = r.region_id
        WHERE ucc.usuario_id = ?
    ");
    $stmt->execute([$usuario['id']]);
    $asignaciones = $stmt->fetchAll();
    
    $diagnostico['asignaciones_usuario_centro_costo'] = $asignaciones;
    
    if (empty($asignaciones)) {
        $diagnostico['problemas'][] = 'No tiene registros en la tabla usuario_centro_costo';
        
        // Verificar si tiene centro_costo_id directo
        if ($usuario['centro_costo_id']) {
            $diagnostico['info'][] = "Tiene centro_costo_id directo: {$usuario['centro_costo_id']} (se usará como fallback)";
            
            // Verificar que el centro de costo existe
            $stmt = $pdo->prepare("
                SELECT cc.*, p.nombre as proyecto_nombre, r.nombre as region_nombre
                FROM centros_costo cc
                LEFT JOIN proyectos p ON cc.proyecto_id = p.proyecto_id
                LEFT JOIN regiones r ON p.region_id = r.region_id
                WHERE cc.id = ?
            ");
            $stmt->execute([$usuario['centro_costo_id']]);
            $centro_directo = $stmt->fetch();
            
            if ($centro_directo) {
                $diagnostico['centro_costo_directo'] = $centro_directo;
            } else {
                $diagnostico['problemas'][] = "El centro_costo_id directo ({$usuario['centro_costo_id']}) NO existe en la tabla centros_costo";
                $diagnostico['soluciones'][] = "Asignar un centro_costo_id válido o crear registro en usuario_centro_costo";
            }
        } else {
            $diagnostico['problemas'][] = 'No tiene centro_costo_id directo ni registros en usuario_centro_costo';
            $diagnostico['soluciones'][] = "Crear registro en usuario_centro_costo: INSERT INTO usuario_centro_costo (usuario_id, centro_costo_id) VALUES ({$usuario['id']}, CENTRO_COSTO_ID)";
        }
    } else {
        // Verificar que los centros de costo existen y tienen proyectos válidos
        foreach ($asignaciones as $asignacion) {
            if (!$asignacion['proyecto_id']) {
                $diagnostico['problemas'][] = "El centro de costo '{$asignacion['centro_costo_nombre']}' no tiene proyecto_id asignado";
            }
            if (!$asignacion['region_id']) {
                $diagnostico['problemas'][] = "El proyecto '{$asignacion['proyecto_nombre']}' no tiene region_id asignado";
            }
        }
    }
    
    // Resumen
    $diagnostico['puede_acceder'] = 
        $usuario['aprobado'] == 1 && 
        $usuario['rol'] === 'trabajador' && 
        (!empty($asignaciones) || $usuario['centro_costo_id']);
    
    echo json_encode($diagnostico, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode([
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
?>





