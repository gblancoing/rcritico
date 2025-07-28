<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

try {
    // Obtener todos los proyectos disponibles
    $stmt = $pdo->query("SELECT DISTINCT proyecto_id FROM financiero_sap LIMIT 10");
    $proyectos = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Proyectos disponibles en financiero_sap: " . implode(', ', $proyectos) . "\n\n";
    
    // Para cada proyecto, mostrar las categorías VP
    foreach ($proyectos as $proyecto_id) {
        echo "=== PROYECTO $proyecto_id ===\n";
        
        // Verificar categorías VP
        $stmt = $pdo->prepare("SELECT DISTINCT categoria_vp, COUNT(*) as cantidad FROM financiero_sap WHERE proyecto_id = ? GROUP BY categoria_vp");
        $stmt->execute([$proyecto_id]);
        $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Categorías VP encontradas:\n";
        foreach ($categorias as $cat) {
            echo "  - " . $cat['categoria_vp'] . ": " . $cat['cantidad'] . " registros\n";
        }
        
        // Calcular suma de categorías VP
        $stmt = $pdo->prepare("SELECT 
            SUM(CASE 
                WHEN categoria_vp IN ('MO', 'IC', 'EM', 'IE', 'SC', 'AD', 'CL', 'CT') 
                THEN monto 
                ELSE 0 
            END) as total_proyeccion,
            COUNT(*) as total_registros
        FROM financiero_sap WHERE proyecto_id = ?");
        $stmt->execute([$proyecto_id]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "Total proyección: " . number_format($resultado['total_proyeccion'], 0, ',', ',') . "\n";
        echo "Total registros: " . $resultado['total_registros'] . "\n\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?> 