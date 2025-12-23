<?php
// Script de prueba simple para verificar que TCPDF funciona
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Limpiar cualquier salida previa
while (ob_get_level() > 0) {
    ob_end_clean();
}

// Headers
header('Content-Type: application/pdf');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');

try {
    // Cargar TCPDF
    require_once __DIR__ . '/../../vendor/autoload.php';
    
    if (!class_exists('TCPDF')) {
        die('TCPDF no está disponible');
    }
    
    // Crear PDF simple
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    $pdf->SetCreator('Test');
    $pdf->SetAuthor('Test');
    $pdf->SetTitle('Test PDF');
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->AddPage();
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, 'Test PDF - Si ves esto, TCPDF funciona correctamente', 0, 1);
    $pdf->Cell(0, 10, 'Fecha: ' . date('Y-m-d H:i:s'), 0, 1);
    
    // Generar PDF
    $pdf->Output('test.pdf', 'I');
    exit;
    
} catch (Exception $e) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Error</h1>';
    echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '<p>Archivo: ' . htmlspecialchars($e->getFile()) . ' (línea ' . $e->getLine() . ')</p>';
    exit;
}
?>

