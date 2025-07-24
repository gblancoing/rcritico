<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// SOLO PARA DESARROLLO: mostrar errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $proyecto_id = $_GET['proyecto_id'] ?? null;
    $tabla = $_GET['tabla'] ?? null;
    
    if (!$proyecto_id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de proyecto requerido']);
        exit;
    }
    
    // Lista de tablas permitidas
    $tablas_permitidas = [
        'real_parcial',
        'real_acumulado', 
        'v0_parcial',
        'v0_acumulada',
        'npc_parcial',
        'npc_acumulado',
        'api_parcial',
        'api_acumulada'
    ];
    
    try {
        $datos = [];
        
        if ($tabla && in_array($tabla, $tablas_permitidas)) {
            // Obtener datos de una tabla específica con JOIN para obtener el nombre del proyecto
            $sql = "SELECT rp.*, p.nombre AS proyecto_nombre 
                    FROM $tabla rp 
                    INNER JOIN proyectos p ON rp.proyecto_id = p.proyecto_id 
                    WHERE rp.proyecto_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$proyecto_id]);
            $datos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            // Obtener datos de todas las tablas con JOIN para obtener el nombre del proyecto
            foreach ($tablas_permitidas as $tabla_nombre) {
                $sql = "SELECT rp.*, p.nombre AS proyecto_nombre 
                        FROM $tabla_nombre rp 
                        INNER JOIN proyectos p ON rp.proyecto_id = p.proyecto_id 
                        WHERE rp.proyecto_id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$proyecto_id]);
                $datos[$tabla_nombre] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }
        
        echo json_encode([
            'success' => true,
            'proyecto_id' => $proyecto_id,
            'datos' => $datos
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error en la consulta: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
?> 