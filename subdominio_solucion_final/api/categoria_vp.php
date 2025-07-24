<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir conexión a la base de datos
require_once 'db.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
    
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'list';
        
        switch ($action) {
            case 'list':
                // Obtener todas las categorías VP
                $stmt = $pdo->prepare("
                    SELECT cat_vp, categoria_ipa, descripcion_corta, descripcion_larga 
                    FROM categoria_vp 
                    ORDER BY cat_vp
                ");
                $stmt->execute();
                $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $categorias
                ]);
                break;
                
            case 'get':
                // Obtener una categoría específica por cat_vp
                $cat_vp = $_GET['cat_vp'] ?? '';
                
                if (empty($cat_vp)) {
                    throw new Exception('Código de categoría VP requerido');
                }
                
                $stmt = $pdo->prepare("
                    SELECT cat_vp, categoria_ipa, descripcion_corta, descripcion_larga 
                    FROM categoria_vp 
                    WHERE cat_vp = ?
                ");
                $stmt->execute([$cat_vp]);
                $categoria = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$categoria) {
                    throw new Exception('Categoría VP no encontrada');
                }
                
                echo json_encode([
                    'success' => true,
                    'data' => $categoria
                ]);
                break;
                
            case 'search':
                // Buscar categorías por término
                $search = $_GET['search'] ?? '';
                
                if (empty($search)) {
                    throw new Exception('Término de búsqueda requerido');
                }
                
                $stmt = $pdo->prepare("
                    SELECT cat_vp, categoria_ipa, descripcion_corta, descripcion_larga 
                    FROM categoria_vp 
                    WHERE cat_vp LIKE ? OR categoria_ipa LIKE ? OR descripcion_corta LIKE ?
                    ORDER BY cat_vp
                ");
                $searchTerm = "%$search%";
                $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
                $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $categorias
                ]);
                break;
                
            default:
                throw new Exception('Acción no válida');
        }
    } else {
        throw new Exception('Método no permitido');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?> 