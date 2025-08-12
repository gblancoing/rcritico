<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'db.php';

try {
    // Validar parámetros requeridos
    if (!isset($_GET['proyecto_id'])) {
        throw new Exception('El parámetro proyecto_id es requerido');
    }

    $proyectoId = $_GET['proyecto_id'];
    $descripcion = $_GET['descripcion'] ?? null;
    $periodoDesde = $_GET['periodo_desde'] ?? null;
    $periodoHasta = $_GET['periodo_hasta'] ?? null;

    // Validar que el proyecto_id sea numérico
    if (!is_numeric($proyectoId)) {
        throw new Exception('El proyecto_id debe ser numérico');
    }

    // Construir la consulta SQL
    $sql = "SELECT 
                SUM(MO + IC + EM + IE + SC + AD + CL + CT) as monto_total,
                COUNT(*) as cantidad_registros
            FROM financiero_sap 
            WHERE proyecto_id = ?";

    $params = [$proyectoId];
    $types = 'i';

    // Agregar filtro por descripción si se proporciona
    if ($descripcion && trim($descripcion) !== '') {
        $sql .= " AND descripcion = ?";
        $params[] = $descripcion;
        $types .= 's';
    }

    // Agregar filtros de período si se proporcionan
    if ($periodoDesde) {
        $sql .= " AND periodo >= ?";
        $params[] = $periodoDesde;
        $types .= 's';
    }

    if ($periodoHasta) {
        $sql .= " AND periodo <= ?";
        $params[] = $periodoHasta;
        $types .= 's';
    }

    // Preparar y ejecutar la consulta
    $stmt = $conn->prepare($sql);
    
    if ($types !== '') {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result) {
        throw new Exception('Error al ejecutar la consulta: ' . $stmt->error);
    }

    $row = $result->fetch_assoc();
    
    if ($row) {
        $montoTotal = floatval($row['monto_total'] ?? 0);
        $cantidadRegistros = intval($row['cantidad_registros'] ?? 0);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'monto_total' => $montoTotal,
                'cantidad_registros' => $cantidadRegistros,
                'proyecto_id' => $proyectoId,
                'descripcion' => $descripcion,
                'periodo_desde' => $periodoDesde,
                'periodo_hasta' => $periodoHasta
            ],
            'message' => 'Datos obtenidos correctamente'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => [
                'monto_total' => 0,
                'cantidad_registros' => 0,
                'proyecto_id' => $proyectoId,
                'descripcion' => $descripcion,
                'periodo_desde' => $periodoDesde,
                'periodo_hasta' => $periodoHasta
            ],
            'message' => 'No se encontraron datos para los criterios especificados'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'data' => null
    ]);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
?>
