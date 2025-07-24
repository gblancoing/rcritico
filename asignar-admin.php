<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require 'db.php';

echo "🔧 Asignando centro de costo al admin...\n\n";

// 1. Buscar el usuario admin
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ? AND rol = 'admin'");
$stmt->execute(['dgaleno@jej.cl']); // Cambiar por el email correcto del admin
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "❌ Usuario admin no encontrado\n";
    exit;
}

echo "✅ Usuario admin encontrado: " . $user['nombre'] . "\n";

// 2. Verificar si ya tiene centros asignados
$stmt = $pdo->prepare("SELECT * FROM usuario_centro_costo WHERE usuario_id = ?");
$stmt->execute([$user['id']]);
$ucc = $stmt->fetch(PDO::FETCH_ASSOC);

if ($ucc) {
    echo "✅ Usuario admin ya tiene centros asignados\n";
    echo "- Centro costo ID: " . $ucc['centro_costo_id'] . "\n";
} else {
    echo "❌ Usuario admin no tiene centros asignados\n";
    
    // 3. Buscar el primer centro de costo disponible
    $stmt = $pdo->query("SELECT id, nombre FROM centros_costo LIMIT 1");
    $centro = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$centro) {
        echo "❌ No hay centros de costo disponibles\n";
        exit;
    }
    
    echo "✅ Centro de costo encontrado: " . $centro['nombre'] . "\n";
    
    // 4. Asignar el centro de costo al admin
    try {
        $stmt = $pdo->prepare("INSERT INTO usuario_centro_costo (usuario_id, centro_costo_id) VALUES (?, ?)");
        $stmt->execute([$user['id'], $centro['id']]);
        
        echo "✅ Centro de costo asignado correctamente al admin\n";
        echo "- Usuario ID: " . $user['id'] . "\n";
        echo "- Centro costo ID: " . $centro['id'] . "\n";
    } catch (Exception $e) {
        echo "❌ Error al asignar centro de costo: " . $e->getMessage() . "\n";
    }
}

// 5. Verificar la asignación completa
echo "\n🔍 Verificando asignación completa...\n";

$stmt = $pdo->prepare("
    SELECT u.nombre as usuario_nombre, cc.nombre as centro_nombre, 
           p.nombre as proyecto_nombre, r.nombre as region_nombre
    FROM usuarios u
    JOIN usuario_centro_costo ucc ON u.id = ucc.usuario_id
    JOIN centros_costo cc ON ucc.centro_costo_id = cc.id
    JOIN proyectos p ON cc.proyecto_id = p.proyecto_id
    JOIN regiones r ON p.region_id = r.region_id
    WHERE u.id = ?
");
$stmt->execute([$user['id']]);
$resultado = $stmt->fetch(PDO::FETCH_ASSOC);

if ($resultado) {
    echo "✅ Asignación completa verificada:\n";
    echo "- Usuario: " . $resultado['usuario_nombre'] . "\n";
    echo "- Centro: " . $resultado['centro_nombre'] . "\n";
    echo "- Proyecto: " . $resultado['proyecto_nombre'] . "\n";
    echo "- Región: " . $resultado['region_nombre'] . "\n";
    echo "\n🎉 ¡El admin ahora debería ver su región en la aplicación!\n";
} else {
    echo "❌ Error en la verificación de asignación\n";
}

echo "\n💡 Próximos pasos:\n";
echo "1. Recargar la página de la aplicación\n";
echo "2. Verificar que se muestre la región asignada\n";
echo "3. Revisar la consola del navegador para confirmar\n";
?> 