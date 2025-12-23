<?php
/**
 * Script de diagnóstico para creación de usuarios
 * Ejecutar en producción para verificar la configuración
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

require_once __DIR__ . '/config/db.php';

$diagnostico = [
    'fecha' => date('Y-m-d H:i:s'),
    'servidor' => [
        'php_version' => phpversion(),
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'N/A',
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'N/A',
    ],
    'base_datos' => [],
    'tabla_usuarios' => [],
    'errores' => []
];

try {
    // Verificar conexión a la base de datos
    $diagnostico['base_datos']['conectado'] = true;
    $diagnostico['base_datos']['driver'] = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    
    // Verificar estructura de la tabla usuarios
    $stmt = $pdo->query("DESCRIBE usuarios");
    $columnas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $diagnostico['tabla_usuarios']['columnas'] = $columnas;
    
    // Verificar si existen registros
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios");
    $total = $stmt->fetch(PDO::FETCH_ASSOC);
    $diagnostico['tabla_usuarios']['total_registros'] = $total['total'];
    
    // Verificar permisos de INSERT
    try {
        $test_nombre = 'TEST_' . time();
        $test_email = 'test_' . time() . '@test.com';
        $test_password = password_hash('test123', PASSWORD_DEFAULT);
        
        $stmt_test = $pdo->prepare("INSERT INTO usuarios (nombre, email, password, rol, aprobado) VALUES (?, ?, ?, 'visita', 0)");
        $stmt_test->execute([$test_nombre, $test_email, $test_password]);
        $test_id = $pdo->lastInsertId();
        
        // Eliminar el registro de prueba
        $stmt_delete = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt_delete->execute([$test_id]);
        
        $diagnostico['tabla_usuarios']['permiso_insert'] = true;
        $diagnostico['tabla_usuarios']['test_insert_id'] = $test_id;
    } catch (PDOException $e) {
        $diagnostico['tabla_usuarios']['permiso_insert'] = false;
        $diagnostico['errores'][] = 'Error en test INSERT: ' . $e->getMessage();
    }
    
    // Verificar tabla centros_costo
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM centros_costo");
        $total_cc = $stmt->fetch(PDO::FETCH_ASSOC);
        $diagnostico['tabla_centros_costo'] = ['total' => $total_cc['total']];
    } catch (PDOException $e) {
        $diagnostico['errores'][] = 'Error verificando centros_costo: ' . $e->getMessage();
    }
    
    // Verificar tabla usuario_centro_costo
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuario_centro_costo");
        $total_ucc = $stmt->fetch(PDO::FETCH_ASSOC);
        $diagnostico['tabla_usuario_centro_costo'] = ['total' => $total_ucc['total']];
    } catch (PDOException $e) {
        $diagnostico['errores'][] = 'Error verificando usuario_centro_costo: ' . $e->getMessage();
    }
    
    // Verificar tabla usuario_empresa
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuario_empresa");
        $total_ue = $stmt->fetch(PDO::FETCH_ASSOC);
        $diagnostico['tabla_usuario_empresa'] = ['total' => $total_ue['total']];
    } catch (PDOException $e) {
        $diagnostico['errores'][] = 'Error verificando usuario_empresa: ' . $e->getMessage();
    }
    
} catch (PDOException $e) {
    $diagnostico['base_datos']['conectado'] = false;
    $diagnostico['errores'][] = 'Error de conexión: ' . $e->getMessage();
} catch (Exception $e) {
    $diagnostico['errores'][] = 'Error general: ' . $e->getMessage();
}

echo json_encode($diagnostico, JSON_PRETTY_PRINT);

