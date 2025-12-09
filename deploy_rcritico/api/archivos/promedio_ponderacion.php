<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// GET: Calcular promedio de ponderación para una carpeta y sus subcarpetas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : null;
    
    if (!$carpeta_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'carpeta_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Función para obtener el nivel de una carpeta (cuántos padres tiene hasta la raíz)
        function obtenerNivelCarpeta($pdo, $carpeta_id) {
            $nivel = 1;
            $carpeta_actual_id = $carpeta_id;
            
            while ($carpeta_actual_id) {
                $stmt = $pdo->prepare("SELECT carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
                $stmt->execute([$carpeta_actual_id]);
                $padre = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($padre && $padre['carpeta_padre_id']) {
                    $nivel++;
                    $carpeta_actual_id = $padre['carpeta_padre_id'];
                } else {
                    break;
                }
            }
            
            return $nivel;
        }
        
        // Función recursiva para obtener todas las subcarpetas de una carpeta
        function obtenerSubcarpetasRecursivas($pdo, $carpeta_id, $carpetas_ids = []) {
            $stmt = $pdo->prepare("SELECT id FROM carpetas WHERE carpeta_padre_id = ? AND activo = 1");
            $stmt->execute([$carpeta_id]);
            $subcarpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($subcarpetas as $subcarpeta) {
                $carpetas_ids[] = $subcarpeta['id'];
                // Recursivamente obtener subcarpetas de esta subcarpeta
                $carpetas_ids = obtenerSubcarpetasRecursivas($pdo, $subcarpeta['id'], $carpetas_ids);
            }
            
            return $carpetas_ids;
        }
        
        // Obtener el nivel de la carpeta
        $nivel_carpeta = obtenerNivelCarpeta($pdo, $carpeta_id);
        
        // Obtener todas las carpetas a incluir en el cálculo (cascada ascendente)
        $carpetas_ids = [$carpeta_id];
        
        // Si es nivel 1 o nivel 0, incluir todas sus subcarpetas recursivamente
        if ($nivel_carpeta <= 1) {
            $subcarpetas = obtenerSubcarpetasRecursivas($pdo, $carpeta_id);
            $carpetas_ids = array_merge($carpetas_ids, $subcarpetas);
        }
        
        // Eliminar duplicados
        $carpetas_ids = array_unique($carpetas_ids);
        $placeholders = implode(',', array_fill(0, count($carpetas_ids), '?'));
        
        // Calcular promedio de tabla preventiva - INCLUYENDO TODOS LOS REGISTROS (incluso 0%)
        $sql_preventivos = "SELECT 
                               AVG(COALESCE(ponderacion, 0)) as promedio, 
                               COUNT(*) as total,
                               SUM(COALESCE(ponderacion, 0)) as suma_total
                           FROM carpeta_linea_base
                           WHERE carpeta_id IN ($placeholders)
                           AND activo = 1";
        
        $stmt_preventivos = $pdo->prepare($sql_preventivos);
        $stmt_preventivos->execute($carpetas_ids);
        $resultado_preventivos = $stmt_preventivos->fetch(PDO::FETCH_ASSOC);
        
        // Calcular promedio de tabla mitigadores - INCLUYENDO TODOS LOS REGISTROS (incluso 0%)
        $sql_mitigadores = "SELECT 
                               AVG(COALESCE(ponderacion, 0)) as promedio, 
                               COUNT(*) as total,
                               SUM(COALESCE(ponderacion, 0)) as suma_total
                            FROM carpeta_linea_base_mitigadores
                            WHERE carpeta_id IN ($placeholders)
                            AND activo = 1";
        
        $stmt_mitigadores = $pdo->prepare($sql_mitigadores);
        $stmt_mitigadores->execute($carpetas_ids);
        $resultado_mitigadores = $stmt_mitigadores->fetch(PDO::FETCH_ASSOC);
        
        // Calcular promedio general combinando ambas tablas
        $total_preventivos = intval($resultado_preventivos['total'] ?? 0);
        $total_mitigadores = intval($resultado_mitigadores['total'] ?? 0);
        $total_registros = $total_preventivos + $total_mitigadores;
        
        // Obtener promedios (ya incluyen 0s)
        $promedio_preventivos = $resultado_preventivos['promedio'] !== null ? floatval($resultado_preventivos['promedio']) : 0;
        $promedio_mitigadores = $resultado_mitigadores['promedio'] !== null ? floatval($resultado_mitigadores['promedio']) : 0;
        
        // Calcular promedio general: suma total de ambas tablas / total de registros
        $suma_preventivos = floatval($resultado_preventivos['suma_total'] ?? 0);
        $suma_mitigadores = floatval($resultado_mitigadores['suma_total'] ?? 0);
        $suma_total = $suma_preventivos + $suma_mitigadores;
        
        $promedio_general = 0;
        if ($total_registros > 0) {
            $promedio_general = $suma_total / $total_registros;
        }
        
        echo json_encode([
            'success' => true,
            'carpeta_id' => $carpeta_id,
            'nivel_carpeta' => $nivel_carpeta,
            'promedio_general' => round($promedio_general, 2),
            'promedio_preventivos' => round($promedio_preventivos, 2),
            'promedio_mitigadores' => round($promedio_mitigadores, 2),
            'total_preventivos' => $total_preventivos,
            'total_mitigadores' => $total_mitigadores,
            'total_registros' => $total_registros,
            'subcarpetas_incluidas' => count($carpetas_ids),
            'carpetas_ids' => array_values($carpetas_ids) // Para debugging
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al calcular promedio: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>

