<?php
// Test directo del endpoint de proyección física
header('Content-Type: application/json');

echo "=== TEST DIRECTO DEL ENDPOINT PROYECCIÓN FÍSICA ===\n\n";

// Simular parámetros como los envía el frontend
$proyecto_id = 1;
$fecha_desde = '2025-06';
$fecha_hasta = '2025-06';

echo "Parámetros de prueba:\n";
echo "- proyecto_id: $proyecto_id\n";
echo "- fecha_desde: $fecha_desde\n";
echo "- fecha_hasta: $fecha_hasta\n\n";

// Construir URL como la hace el frontend
$url = "http://localhost/financiero/api/predictividad/proyeccion_fisica.php?proyecto_id=$proyecto_id&fecha_desde=$fecha_desde&fecha_hasta=$fecha_hasta";

echo "URL que debería llamar el frontend:\n";
echo "$url\n\n";

echo "=== RESULTADO ESPERADO ===\n";
echo "Debería devolver: 2.65 para junio 2025\n\n";

echo "=== PARA PROBAR ===\n";
echo "1. Abre esta URL en tu navegador:\n";
echo "$url\n\n";
echo "2. Deberías ver un JSON con:\n";
echo '{"success":true,"total_proyeccion_fisica":2.65,"total_formateado":"2.65%"}\n\n';

echo "=== SI NO FUNCIONA ===\n";
echo "El problema está en la configuración del servidor o la ruta del archivo.\n";
echo "Verifica que el archivo api/predictividad/proyeccion_fisica.php existe y es accesible.\n";
?> 