<?php
// Script de prueba directo para verificar que el PDF se genera correctamente
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Headers anti-caché
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

require_once __DIR__ . '/../config/db.php';

$proyecto_id = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : 1;

// Obtener información del proyecto
$stmt_proyecto = $pdo->prepare("SELECT * FROM proyectos WHERE proyecto_id = ?");
$stmt_proyecto->execute([$proyecto_id]);
$proyecto = $stmt_proyecto->fetch(PDO::FETCH_ASSOC);

if (!$proyecto) {
    die("Proyecto no encontrado");
}

// Intentar cargar TCPDF
$tcpdf_paths = [
    __DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php',
    __DIR__ . '/../../../vendor/tecnickcom/tcpdf/tcpdf.php',
    __DIR__ . '/../../tcpdf/tcpdf.php',
    __DIR__ . '/../../../tcpdf/tcpdf.php',
];

$tcpdf_loaded = false;
foreach ($tcpdf_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $tcpdf_loaded = true;
        break;
    }
}

if (!$tcpdf_loaded) {
    die("TCPDF no encontrado. Rutas probadas: " . implode(", ", $tcpdf_paths));
}

// Crear PDF
$pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
$pdf->setPrintHeader(false);
$pdf->setPrintFooter(false);
$pdf->SetMargins(15, 15, 15);
$pdf->AddPage();

// BANNER ROJO MUY VISIBLE
$pdf->SetFillColor(255, 0, 0);
$pdf->SetTextColor(255, 255, 0);
$pdf->SetFont('helvetica', 'B', 24);
$pdf->SetXY(10, 10);
$pdf->Cell(190, 20, '*** TEST DIRECTO - ARCHIVO ACTUALIZADO ***', 1, 1, 'C', true);

// Información
$pdf->SetTextColor(0, 0, 0);
$pdf->SetFont('helvetica', '', 12);
$pdf->SetXY(10, 35);
$pdf->Cell(190, 10, 'Proyecto: ' . $proyecto['nombre'], 0, 1, 'L');
$pdf->SetXY(10, 45);
$pdf->Cell(190, 10, 'Archivo ejecutado: ' . __FILE__, 0, 1, 'L');
$pdf->SetXY(10, 55);
$pdf->Cell(190, 10, 'Fecha: ' . date('Y-m-d H:i:s'), 0, 1, 'L');
$pdf->SetXY(10, 65);
$pdf->Cell(190, 10, 'Si ves el banner rojo arriba, el archivo se está ejecutando correctamente', 0, 1, 'L');

// Output
header('Content-Type: application/pdf');
$pdf->Output('test_directo.pdf', 'I');
?>

