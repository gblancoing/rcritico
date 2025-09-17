<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Incluir configuración de base de datos
require_once 'config.php';
require_once 'db.php';

try {
    // Obtener la fecha desde el parámetro GET
    $fecha = isset($_GET['fecha']) ? $_GET['fecha'] : null;
    
    if (!$fecha) {
        throw new Exception('Parámetro fecha es requerido');
    }
    
    // Validar formato de fecha (YYYY-MM-DD)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        throw new Exception('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    
    // Obtener proyecto_id desde parámetros GET
    $proyecto_id = isset($_GET['proyecto_id']) ? (int)$_GET['proyecto_id'] : 1;
    
    // Consulta SQL para obtener avance físico REAL desde av_fisico_real
    // Nota: api_acum está almacenado como decimal (ej: 0.74) y se convertirá a porcentaje (74%)
    $sql_real = "SELECT api_acum 
                 FROM av_fisico_real 
                 WHERE proyecto_id = ? 
                 AND periodo = ? 
                 ORDER BY periodo DESC 
                 LIMIT 1";
    
    $stmt_real = $conn->prepare($sql_real);
    $stmt_real->bind_param('is', $proyecto_id, $fecha);
    $stmt_real->execute();
    $result_real = $stmt_real->get_result();
    
    // Consulta SQL para obtener avance físico API desde av_fisico_api
    // Nota: api_acum está almacenado como decimal (ej: 0.68) y se convertirá a porcentaje (68%)
    $sql_api = "SELECT api_acum 
                FROM av_fisico_api 
                WHERE proyecto_id = ? 
                AND periodo = ? 
                ORDER BY periodo DESC 
                LIMIT 1";
    
    $stmt_api = $conn->prepare($sql_api);
    $stmt_api->bind_param('is', $proyecto_id, $fecha);
    $stmt_api->execute();
    $result_api = $stmt_api->get_result();
    
    $avanceFisico = [];
    
    // Obtener valor REAL (convertir de decimal a porcentaje)
    if ($row_real = $result_real->fetch_assoc()) {
        $avanceFisico['REAL'] = floatval($row_real['api_acum']) * 100;
    } else {
        $avanceFisico['REAL'] = null;
    }
    
    // Obtener valor API (convertir de decimal a porcentaje)
    if ($row_api = $result_api->fetch_assoc()) {
        $avanceFisico['API'] = floatval($row_api['api_acum']) * 100;
    } else {
        $avanceFisico['API'] = null;
    }
    
    // Preparar respuesta
    $response = [
        'success' => true,
        'fecha' => $fecha,
        'avance_fisico' => [
            'REAL' => isset($avanceFisico['REAL']) ? $avanceFisico['REAL'] : null,
            'API' => isset($avanceFisico['API']) ? $avanceFisico['API'] : null
        ]
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$stmt_real->close();
$stmt_api->close();
$conn->close();
?> 