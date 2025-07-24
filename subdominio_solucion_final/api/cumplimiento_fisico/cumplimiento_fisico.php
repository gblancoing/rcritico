<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

// Obtener el método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Obtener datos de cumplimiento físico
            $proyecto_id = isset($_GET['proyecto_id']) ? (int)$_GET['proyecto_id'] : null;
            $centro_costo_id = isset($_GET['centro_costo_id']) ? (int)$_GET['centro_costo_id'] : null;
            $vector = isset($_GET['vector']) ? $_GET['vector'] : null;
            $periodo_desde = isset($_GET['periodo_desde']) ? $_GET['periodo_desde'] : null;
            $periodo_hasta = isset($_GET['periodo_hasta']) ? $_GET['periodo_hasta'] : null;
            
            $sql = "SELECT cf.id_cumplimiento, cf.proyecto_id, cf.id, cf.nombre, cf.vector, cf.periodo, cf.parcial_periodo, cf.porcentaje_periodo, p.nombre as proyecto_nombre, cc.nombre as centro_costo_nombre 
                    FROM cumplimiento_fisico cf
                    INNER JOIN proyectos p ON cf.proyecto_id = p.proyecto_id
                    INNER JOIN centros_costo cc ON cf.id = cc.id
                    WHERE 1=1";
            $params = [];
            
            if ($proyecto_id) {
                $sql .= " AND cf.proyecto_id = ?";
                $params[] = $proyecto_id;
            }
            
            if ($centro_costo_id) {
                $sql .= " AND cf.id = ?";
                $params[] = $centro_costo_id;
            }
            
            if ($vector) {
                $sql .= " AND cf.vector = ?";
                $params[] = $vector;
            }
            
            if ($periodo_desde) {
                $sql .= " AND cf.periodo >= ?";
                $params[] = $periodo_desde;
            }
            
            if ($periodo_hasta) {
                $sql .= " AND cf.periodo <= ?";
                $params[] = $periodo_hasta;
            }
            
            $sql .= " ORDER BY cf.periodo ASC, cf.vector ASC";
            
            $stmt = $pdo->prepare($sql);
            if (!empty($params)) {
                $stmt->execute($params);
            } else {
                $stmt->execute();
            }
            
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $result,
                'count' => count($result)
            ]);
            break;
            
        case 'POST':
            // Crear nuevo registro de cumplimiento físico
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                throw new Exception('Datos JSON inválidos');
            }
            
            // Validar campos requeridos
            $required_fields = ['proyecto_id', 'id', 'nombre', 'vector', 'periodo', 'porcentaje_periodo'];
            foreach ($required_fields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    throw new Exception("Campo requerido faltante: $field");
                }
            }
            
            $sql = "INSERT INTO cumplimiento_fisico (proyecto_id, id, nombre, vector, periodo, porcentaje_periodo) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['proyecto_id'],
                $data['id'],
                $data['nombre'],
                $data['vector'],
                $data['periodo'],
                $data['porcentaje_periodo']
            ]);
            
            $id_cumplimiento = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Registro de cumplimiento físico creado exitosamente',
                'id_cumplimiento' => $id_cumplimiento
            ]);
            break;
            
        case 'PUT':
            // Actualizar registro de cumplimiento físico
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['id_cumplimiento'])) {
                throw new Exception('ID de cumplimiento requerido para actualización');
            }
            
            $sql = "UPDATE cumplimiento_fisico SET 
                    proyecto_id = ?, 
                    id = ?, 
                    nombre = ?, 
                    vector = ?, 
                    periodo = ?, 
                    porcentaje_periodo = ? 
                    WHERE id_cumplimiento = ?";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['proyecto_id'],
                $data['id'],
                $data['nombre'],
                $data['vector'],
                $data['periodo'],
                $data['porcentaje_periodo'],
                $data['id_cumplimiento']
            ]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Registro de cumplimiento físico actualizado exitosamente'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'No se encontró el registro para actualizar'
                ]);
            }
            break;
            
        case 'DELETE':
            // Eliminar registro de cumplimiento físico
            $id_cumplimiento = isset($_GET['id_cumplimiento']) ? (int)$_GET['id_cumplimiento'] : null;
            
            if (!$id_cumplimiento) {
                throw new Exception('ID de cumplimiento requerido para eliminación');
            }
            
            $sql = "DELETE FROM cumplimiento_fisico WHERE id_cumplimiento = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id_cumplimiento]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Registro de cumplimiento físico eliminado exitosamente'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'No se encontró el registro para eliminar'
                ]);
            }
            break;
            
        default:
            throw new Exception('Método HTTP no soportado');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 