<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['rows']) || !is_array($data['rows'])) {
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit;
}

$rows = $data['rows'];
$proyecto_id = $data['proyecto_id'] ?? null;

if (!$proyecto_id) {
    echo json_encode(['success' => false, 'error' => 'proyecto_id is required']);
    exit;
}

// Obtener el centro de costo del proyecto
$stmt = $pdo->prepare("SELECT nombre FROM centros_costo WHERE proyecto_id = ? LIMIT 1");
$stmt->execute([$proyecto_id]);
$centro_costo = $stmt->fetch();

$centro_costo_nombre = $centro_costo ? $centro_costo['nombre'] : 'SAP';

$inserted = 0;
$errors = [];

foreach ($rows as $row) {
    try {
        // Mapear los campos del Excel a la tabla financiero_sap
        $id_sap = $row['id_sap'] ?? '';
        $version_sap = $row['version_sap'] ?? '';
        $descripcion = $row['descripcion'] ?? '';
        $grupo_version = $row['grupo_version'] ?? '';
        $periodo = $row['periodo'] ?? '';
        $mo = $row['MO'] ?? 0;
        $ic = $row['IC'] ?? 0;
        $em = $row['EM'] ?? 0;
        $ie = $row['IE'] ?? 0;
        $sc = $row['SC'] ?? 0;
        $ad = $row['AD'] ?? 0;
        $cl = $row['CL'] ?? 0;
        $ct = $row['CT'] ?? 0;

        // Verificar si ya existe un registro con el mismo id_sap y proyecto_id
        $stmt = $pdo->prepare("SELECT id FROM financiero_sap WHERE id_sap = ? AND proyecto_id = ?");
        $stmt->execute([$id_sap, $proyecto_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Actualizar registro existente
            $stmt = $pdo->prepare("UPDATE financiero_sap SET 
                centro_costo_nombre = ?, version_sap = ?, descripcion = ?, grupo_version = ?, 
                periodo = ?, MO = ?, IC = ?, EM = ?, IE = ?, SC = ?, AD = ?, CL = ?, CT = ?
                WHERE id_sap = ? AND proyecto_id = ?");
            
            if ($stmt->execute([
                $centro_costo_nombre, $version_sap, $descripcion, $grupo_version,
                $periodo, $mo, $ic, $em, $ie, $sc, $ad, $cl, $ct,
                $id_sap, $proyecto_id
            ])) {
                $inserted++;
            }
        } else {
            // Insertar nuevo registro
            $stmt = $pdo->prepare("INSERT INTO financiero_sap 
                (proyecto_id, centro_costo_nombre, id_sap, version_sap, descripcion, grupo_version, 
                periodo, MO, IC, EM, IE, SC, AD, CL, CT)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            if ($stmt->execute([
                $proyecto_id, $centro_costo_nombre, $id_sap, $version_sap, $descripcion, $grupo_version,
                $periodo, $mo, $ic, $em, $ie, $sc, $ad, $cl, $ct
            ])) {
                $inserted++;
            }
        }
    } catch (Exception $e) {
        $errors[] = "Error en fila: " . $e->getMessage();
    }
}

if (!empty($errors)) {
    echo json_encode([
        'success' => false, 
        'error' => 'Errores durante la importación',
        'errors' => $errors,
        'inserted' => $inserted
    ]);
} else {
    echo json_encode([
        'success' => true, 
        'inserted' => $inserted,
        'message' => "Se importaron/actualizaron $inserted registros exitosamente"
    ]);
}
?> 