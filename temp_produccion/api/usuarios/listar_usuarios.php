<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';

// GET: Listar usuarios (para asignación a carpetas)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Incluir empresa_id de la tabla usuario_empresa y nombre de empresa
        $sql = "SELECT u.id, u.nombre, u.email, u.rol, u.aprobado,
                       ue.empresa_id, e.nombre AS empresa_nombre
                FROM usuarios u
                LEFT JOIN usuario_empresa ue ON u.id = ue.usuario_id
                LEFT JOIN empresas e ON ue.empresa_id = e.empresa_id
                WHERE u.aprobado = 1
                ORDER BY u.nombre";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($usuarios, JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener usuarios: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>

