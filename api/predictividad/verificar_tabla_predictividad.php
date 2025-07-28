<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db.php';

try {
    $diagnostico = [];
    $diagnostico['timestamp'] = date('Y-m-d H:i:s');
    
    // 1. Verificar si la tabla existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'predictividad'");
    $tableExists = $stmt->rowCount() > 0;
    $diagnostico['tabla_existe'] = $tableExists;
    
    if ($tableExists) {
        // 2. Obtener estructura actual de la tabla
        $stmt = $pdo->query("DESCRIBE predictividad");
        $columnas_actuales = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $diagnostico['estructura_actual'] = $columnas_actuales;
        
        // 3. Verificar columnas específicas
        $columnas_nombres = array_column($columnas_actuales, 'Field');
        $diagnostico['columnas_existentes'] = $columnas_nombres;
        
        $columnas_requeridas = [
            'id_predictivo',
            'proyecto_id', 
            'id',
            'periodo_prediccion',
            'porcentaje_predicido',
            'periodo_cierre_real',
            'valor_real_porcentaje'
        ];
        
        $columnas_faltantes = array_diff($columnas_requeridas, $columnas_nombres);
        $diagnostico['columnas_faltantes'] = $columnas_faltantes;
        $diagnostico['todas_columnas_existen'] = empty($columnas_faltantes);
        
        // 4. Verificar si la tabla tiene datos
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM predictividad");
        $total = $stmt->fetch(PDO::FETCH_ASSOC);
        $diagnostico['total_registros'] = $total['total'];
        
    } else {
        $diagnostico['mensaje'] = 'La tabla predictividad no existe y debe ser creada';
    }
    
    // 5. Si se solicita recrear la tabla
    if (isset($_GET['recrear']) && $_GET['recrear'] === 'true') {
        if ($tableExists) {
            // Hacer backup de datos existentes
            $stmt = $pdo->query("SELECT * FROM predictividad");
            $datos_backup = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $diagnostico['backup_registros'] = count($datos_backup);
            
            // Eliminar tabla existente
            $pdo->exec("DROP TABLE IF EXISTS predictividad");
            $diagnostico['tabla_eliminada'] = true;
        }
        
        // Crear tabla con estructura correcta
        $sql = "CREATE TABLE predictividad (
            id_predictivo INT AUTO_INCREMENT PRIMARY KEY,
            proyecto_id INT NOT NULL,
            id INT NOT NULL,
            periodo_prediccion DATE,
            porcentaje_predicido DECIMAL(8,4) DEFAULT 0.0000,
            periodo_cierre_real DATE,
            valor_real_porcentaje DECIMAL(8,4) DEFAULT 0.0000,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_proyecto_id (proyecto_id),
            INDEX idx_centro_costo_id (id),
            INDEX idx_periodo_prediccion (periodo_prediccion),
            INDEX idx_periodo_cierre_real (periodo_cierre_real),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id),
            FOREIGN KEY (id) REFERENCES centros_costo(id)
        )";
        
        $pdo->exec($sql);
        $diagnostico['tabla_creada'] = true;
        $diagnostico['estructura_nueva'] = 'Tabla creada con estructura correcta';
        
        // Restaurar datos si había backup
        if (isset($datos_backup) && !empty($datos_backup)) {
            $insertados = 0;
            foreach ($datos_backup as $registro) {
                try {
                    $stmt = $pdo->prepare("INSERT INTO predictividad 
                        (proyecto_id, id, periodo_prediccion, porcentaje_predicido, periodo_cierre_real, valor_real_porcentaje) 
                        VALUES (?, ?, ?, ?, ?, ?)");
                    
                    if ($stmt->execute([
                        $registro['proyecto_id'],
                        $registro['id'],
                        $registro['periodo_prediccion'],
                        $registro['porcentaje_predicido'],
                        $registro['periodo_cierre_real'],
                        $registro['valor_real_porcentaje']
                    ])) {
                        $insertados++;
                    }
                } catch (Exception $e) {
                    // Continuar con el siguiente registro si hay error
                }
            }
            $diagnostico['registros_restaurados'] = $insertados;
        }
    }
    
    echo json_encode([
        'success' => true,
        'diagnostico' => $diagnostico
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'diagnostico' => $diagnostico ?? []
    ]);
}
?> 