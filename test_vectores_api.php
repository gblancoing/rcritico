<?php
// Archivo de prueba para verificar la API de vectores
header('Content-Type: application/json');

require_once 'api/db.php';

echo "=== PRUEBA DE CONEXIÓN A BASE DE DATOS ===\n";

try {
    // Verificar conexión
    $test_query = "SELECT 1 as test";
    $stmt = $pdo->prepare($test_query);
    $stmt->execute();
    $result = $stmt->fetch();
    
    if ($result) {
        echo "✓ Conexión a base de datos exitosa\n";
    } else {
        echo "✗ Error en conexión a base de datos\n";
        exit;
    }
    
    // Verificar si las tablas existen
    $tablas_vectores = [
        'real_parcial',
        'real_acumulado', 
        'v0_parcial',
        'v0_acumulada',
        'npc_parcial',
        'npc_acumulado',
        'api_parcial',
        'api_acumulada',
        'financiero_sap',
        'proyectos'
    ];
    
    echo "\n=== VERIFICACIÓN DE TABLAS ===\n";
    
    foreach ($tablas_vectores as $tabla) {
        try {
            $sql = "SELECT COUNT(*) as count FROM $tabla";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch();
            
            if ($result !== false) {
                echo "✓ Tabla '$tabla' existe con {$result['count']} registros\n";
            } else {
                echo "✗ Tabla '$tabla' no existe o está vacía\n";
            }
        } catch (Exception $e) {
            echo "✗ Error en tabla '$tabla': " . $e->getMessage() . "\n";
        }
    }
    
    // Verificar proyectos disponibles
    echo "\n=== PROYECTOS DISPONIBLES ===\n";
    try {
        $sql = "SELECT proyecto_id, nombre FROM proyectos ORDER BY proyecto_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $proyectos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($proyectos) > 0) {
            foreach ($proyectos as $proyecto) {
                echo "✓ Proyecto ID {$proyecto['proyecto_id']}: {$proyecto['nombre']}\n";
            }
        } else {
            echo "✗ No hay proyectos en la base de datos\n";
        }
    } catch (Exception $e) {
        echo "✗ Error obteniendo proyectos: " . $e->getMessage() . "\n";
    }
    
    // Probar la API de datos_financieros.php
    echo "\n=== PRUEBA DE API datos_financieros.php ===\n";
    
    // Obtener el primer proyecto para la prueba
    $sql = "SELECT proyecto_id FROM proyectos LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $proyecto_test = $stmt->fetch();
    
    if ($proyecto_test) {
        $proyecto_id = $proyecto_test['proyecto_id'];
        echo "Probando con proyecto_id: $proyecto_id\n";
        
        // Simular la llamada a datos_financieros.php
        $tablas_permitidas = [
            'real_parcial',
            'real_acumulado', 
            'v0_parcial',
            'v0_acumulada',
            'npc_parcial',
            'npc_acumulado',
            'api_parcial',
            'api_acumulada',
            'financiero_sap'
        ];
        
        foreach ($tablas_permitidas as $tabla) {
            try {
                $sql = "SELECT COUNT(*) as count 
                        FROM $tabla rp 
                        INNER JOIN proyectos p ON rp.proyecto_id = p.proyecto_id 
                        WHERE rp.proyecto_id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$proyecto_id]);
                $result = $stmt->fetch();
                
                if ($result && $result['count'] > 0) {
                    echo "✓ Tabla '$tabla' tiene {$result['count']} registros para proyecto $proyecto_id\n";
                } else {
                    echo "✗ Tabla '$tabla' no tiene datos para proyecto $proyecto_id\n";
                }
            } catch (Exception $e) {
                echo "✗ Error en tabla '$tabla': " . $e->getMessage() . "\n";
            }
        }
    } else {
        echo "✗ No hay proyectos disponibles para la prueba\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error general: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DE PRUEBA ===\n";
?> 