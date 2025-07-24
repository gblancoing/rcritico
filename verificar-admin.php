<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require 'db.php';

echo "🔍 Verificando datos del usuario admin...\n\n";

// 1. Buscar el usuario admin
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ? AND rol = 'admin'");
$stmt->execute(['dgaleno@jej.cl']); // Cambiar por el email correcto del admin
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "❌ Usuario admin no encontrado\n";
    exit;
}

echo "✅ Usuario admin encontrado:\n";
echo "- ID: " . $user['id'] . "\n";
echo "- Nombre: " . $user['nombre'] . "\n";
echo "- Email: " . $user['email'] . "\n";
echo "- Rol: " . $user['rol'] . "\n";
echo "- Centro costo ID: " . $user['centro_costo_id'] . "\n\n";

// 2. Verificar si tiene centros asignados en usuario_centro_costo
$stmt = $pdo->prepare("SELECT * FROM usuario_centro_costo WHERE usuario_id = ?");
$stmt->execute([$user['id']]);
$ucc = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$ucc) {
    echo "❌ Usuario admin no tiene centros asignados en usuario_centro_costo\n";
    echo "💡 Solución: Asignar un centro de costo al admin\n\n";
} else {
    echo "✅ Usuario admin tiene centros asignados:\n";
    echo "- Centro costo ID: " . $ucc['centro_costo_id'] . "\n\n";
}

// 3. Verificar el centro de costo
if ($ucc) {
    $stmt = $pdo->prepare("SELECT * FROM centros_costo WHERE id = ?");
    $stmt->execute([$ucc['centro_costo_id']]);
    $centro = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$centro) {
        echo "❌ Centro de costo no encontrado\n";
    } else {
        echo "✅ Centro de costo encontrado:\n";
        echo "- ID: " . $centro['id'] . "\n";
        echo "- Nombre: " . $centro['nombre'] . "\n";
        echo "- Proyecto ID: " . $centro['proyecto_id'] . "\n\n";
        
        // 4. Verificar el proyecto
        $stmt = $pdo->prepare("SELECT * FROM proyectos WHERE proyecto_id = ?");
        $stmt->execute([$centro['proyecto_id']]);
        $proyecto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$proyecto) {
            echo "❌ Proyecto no encontrado\n";
        } else {
            echo "✅ Proyecto encontrado:\n";
            echo "- ID: " . $proyecto['proyecto_id'] . "\n";
            echo "- Nombre: " . $proyecto['nombre'] . "\n";
            echo "- Región ID: " . $proyecto['region_id'] . "\n\n";
            
            // 5. Verificar la región
            $stmt = $pdo->prepare("SELECT * FROM regiones WHERE region_id = ?");
            $stmt->execute([$proyecto['region_id']]);
            $region = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$region) {
                echo "❌ Región no encontrada\n";
            } else {
                echo "✅ Región encontrada:\n";
                echo "- ID: " . $region['region_id'] . "\n";
                echo "- Nombre: " . $region['nombre'] . "\n\n";
                
                echo "🎉 ¡Todo está correcto! El admin debería ver su región.\n";
            }
        }
    }
}

// 6. Mostrar todos los centros disponibles
echo "\n📋 Centros de costo disponibles:\n";
$stmt = $pdo->query("SELECT cc.id, cc.nombre, p.nombre as proyecto_nombre, r.nombre as region_nombre 
                     FROM centros_costo cc 
                     JOIN proyectos p ON cc.proyecto_id = p.proyecto_id 
                     JOIN regiones r ON p.region_id = r.region_id");
$centros = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($centros as $centro) {
    echo "- ID: " . $centro['id'] . " | " . $centro['nombre'] . " | " . $centro['proyecto_nombre'] . " | " . $centro['region_nombre'] . "\n";
}

echo "\n💡 Si el admin no tiene centros asignados, ejecutar:\n";
echo "INSERT INTO usuario_centro_costo (usuario_id, centro_costo_id) VALUES (" . $user['id'] . ", 1);\n";
?> 