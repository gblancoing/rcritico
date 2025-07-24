<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar si la tabla existe
    $query = "SHOW TABLES LIKE 'categoria_vp'";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        // Crear la tabla si no existe
        $createTable = "CREATE TABLE IF NOT EXISTS categoria_vp (
            cat_vp VARCHAR(10) NOT NULL PRIMARY KEY,
            Propósito VARCHAR(200) NOT NULL,
            categoria_ipa VARCHAR(100) NOT NULL,
            descripcion_corta VARCHAR(200) NOT NULL,
            descripcion_larga TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_categoria_ipa (categoria_ipa),
            INDEX idx_descripcion_corta (descripcion_corta)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createTable);
        
        // Insertar datos iniciales
        $insertData = "INSERT INTO categoria_vp (cat_vp, Propósito, categoria_ipa, descripcion_corta, descripcion_larga) VALUES 
        ('AD', 'Todos aquellos servicios de apoyo, necesarios para la administración y gestión del proyecto.', 'Indirecto', 'Costos administrativos y gestión del proyecto.', 'Es el costo del Mandante por Administrar el Proyecto. Incluye personal de dirección, administración, contabilidad, recursos humanos, etc.'),
        ('CL', 'Todos aquellos costos de responsabilidad del cliente, gastos extraordinarios e imprevistos.', 'Costos Especiales', 'Gastos extraordinarios e imprevistos (Cliente)', 'Corresponden a los costos de alistamiento operacional, costos de cierre, gastos extraordinarios y otros costos especiales que son responsabilidad del cliente.'),
        ('CT', 'Provisión según la clase de estimación para contingencias del proyecto.', 'Contingencias', 'Reserva financiera para contingencias', 'La Contingencia es una Provisión de dinero que tiene como objetivo cubrir los riesgos identificados y no identificados del proyecto. Se calcula como un porcentaje del costo directo.'),
        ('EM', 'Costo de las instalaciones permanentes, equipos y materiales necesarios para el proyecto.', 'Directo', 'Adquisición de equipos, maquinaria y materiales', 'Adquisiciones Nacionales e Internacionales de equipos, maquinaria, materiales y suministros necesarios para la ejecución del proyecto.'),
        ('IC', 'Costos indirectos asociados a contratistas y servicios externos.', 'Directo', 'Costos indirectos asociados a contratistas', 'Incluye Gastos Generales; Utilidades; Instalaciones de Campamento; Equipos de Apoyo; y otros costos indirectos asociados a contratistas.'),
        ('IE', 'Todos aquellos servicios de apoyo, necesarios para el desarrollo de ingenierías y consultoría técnica.', 'Indirecto', 'Servicios de ingeniería y consultoría técnica', 'Desarrollo de Ingenierías (Pre-Factibilidad; Factibilidad; Ingeniería Básica; Ingeniería de Detalle); Estudios Especializados; Consultoría Técnica; y otros servicios de ingeniería.'),
        ('MO', 'Costo de las instalaciones permanentes, mano de obra directa y actividades de construcción.', 'Directo', 'Mano de obra directa y actividades de construcción', 'Considera costo Mano de Obra, uso de Equipo de Apoyo, y actividades de construcción directa del proyecto.'),
        ('SC', 'Todos aquellos servicios de apoyo, necesarios para la construcción y operación del proyecto.', 'Indirecto', 'Servicios de apoyo a la construcción.', 'Corresponden a todos los costos necesarios que dan soporte a la construcción: Logística; Seguridad; Mantenimiento; Servicios de Campamento; y otros servicios de apoyo.')
        ON DUPLICATE KEY UPDATE 
        Propósito = VALUES(Propósito),
        categoria_ipa = VALUES(categoria_ipa),
        descripcion_corta = VALUES(descripcion_corta),
        descripcion_larga = VALUES(descripcion_larga)";
        
        $pdo->exec($insertData);
    }
    
    // Ahora consultar los datos
    $query = "SELECT 
                cat_vp,
                Propósito,
                categoria_ipa,
                descripcion_corta,
                descripcion_larga,
                created_at,
                updated_at
              FROM categoria_vp 
              ORDER BY cat_vp";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear la respuesta
    $response = [
        'success' => true,
        'categorias' => $categorias,
        'total' => count($categorias),
        'timestamp' => date('Y-m-d H:i:s'),
        'table_created' => !$tableExists
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?> 