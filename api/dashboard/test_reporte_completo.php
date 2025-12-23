<?php
// Script de prueba para diagnosticar el reporte completo
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

echo "<h1>Test Reporte Completo</h1>";
echo "<p>Verificando componentes...</p>";

// 1. Verificar TCPDF
echo "<h2>1. TCPDF</h2>";
try {
    require_once __DIR__ . '/../../vendor/autoload.php';
    if (class_exists('TCPDF')) {
        echo "<p style='color: green;'>✓ TCPDF disponible</p>";
    } else {
        echo "<p style='color: red;'>✗ TCPDF NO disponible</p>";
        exit;
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Error cargando TCPDF: " . htmlspecialchars($e->getMessage()) . "</p>";
    exit;
}

// 2. Verificar conexión a BD
echo "<h2>2. Base de Datos</h2>";
try {
    require_once __DIR__ . '/../config/db.php';
    if (isset($pdo)) {
        echo "<p style='color: green;'>✓ Conexión PDO disponible</p>";
        
        // Verificar proyecto_id = 1
        $stmt = $pdo->prepare("SELECT proyecto_id, nombre FROM proyectos WHERE proyecto_id = 1");
        $stmt->execute();
        $proyecto = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($proyecto) {
            echo "<p style='color: green;'>✓ Proyecto ID 1 encontrado: " . htmlspecialchars($proyecto['nombre']) . "</p>";
        } else {
            echo "<p style='color: red;'>✗ Proyecto ID 1 NO encontrado</p>";
        }
    } else {
        echo "<p style='color: red;'>✗ PDO NO disponible</p>";
        exit;
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Error de BD: " . htmlspecialchars($e->getMessage()) . "</p>";
    exit;
}

// 3. Probar generar PDF simple con datos del proyecto
echo "<h2>3. Generar PDF de Prueba</h2>";
try {
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    $pdf->SetCreator('Test');
    $pdf->SetAuthor('Test');
    $pdf->SetTitle('Test Reporte Completo');
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->AddPage();
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, 'Test Reporte Completo', 0, 1);
    $pdf->Cell(0, 10, 'Proyecto: ' . ($proyecto['nombre'] ?? 'N/A'), 0, 1);
    $pdf->Cell(0, 10, 'Fecha: ' . date('Y-m-d H:i:s'), 0, 1);
    
    // Limpiar buffer
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    
    header('Content-Type: application/pdf');
    $pdf->Output('test_reporte_completo.pdf', 'I');
    exit;
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Error generando PDF: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Archivo: " . htmlspecialchars($e->getFile()) . " (línea " . $e->getLine() . ")</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}
?>

