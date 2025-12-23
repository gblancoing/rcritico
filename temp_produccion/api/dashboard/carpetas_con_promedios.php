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

// GET: Obtener carpetas con sus promedios de ponderación
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $proyecto_id = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    
    if (!$proyecto_id) {
        http_response_code(400);
        echo json_encode(['error' => 'proyecto_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Función para obtener el nivel de una carpeta
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
        
        // Función para calcular promedio de ponderación de una carpeta en cascada ascendente
        function calcularPromedioPonderacion($pdo, $carpeta_id) {
            $nivel = obtenerNivelCarpeta($pdo, $carpeta_id);
            
            // Obtener todas las carpetas a incluir en el cálculo (cascada ascendente)
            $carpetas_ids = [$carpeta_id];
            
            // Si es nivel 1 o nivel 0, incluir todas sus subcarpetas recursivamente
            if ($nivel <= 1) {
                $subcarpetas = obtenerSubcarpetasRecursivas($pdo, $carpeta_id);
                $carpetas_ids = array_merge($carpetas_ids, $subcarpetas);
            }
            
            // Eliminar duplicados
            $carpetas_ids = array_unique($carpetas_ids);
            
            if (empty($carpetas_ids)) {
                return null;
            }
            
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
            
            // Si no hay registros pero hay subcarpetas, devolver 0% (no null)
            // Esto significa que las subcarpetas existen pero están vacías o en 0%
            if ($total_registros === 0) {
                // Verificar si hay subcarpetas
                if ($nivel <= 1 && count($carpetas_ids) > 1) {
                    // Hay subcarpetas pero sin registros, devolver 0%
                    return 0;
                }
                // No hay subcarpetas ni registros, devolver null
                return null;
            }
            
            // Obtener promedios (ya incluyen 0s)
            $promedio_preventivos = $resultado_preventivos['promedio'] !== null ? floatval($resultado_preventivos['promedio']) : 0;
            $promedio_mitigadores = $resultado_mitigadores['promedio'] !== null ? floatval($resultado_mitigadores['promedio']) : 0;
            
            // Calcular promedio general: suma total de ambas tablas / total de registros
            $suma_preventivos = floatval($resultado_preventivos['suma_total'] ?? 0);
            $suma_mitigadores = floatval($resultado_mitigadores['suma_total'] ?? 0);
            $suma_total = $suma_preventivos + $suma_mitigadores;
            
            $promedio_general = $suma_total / $total_registros;
            
            return round($promedio_general, 2);
        }
        
        // Obtener rol del usuario si se proporciona
        $usuario_rol = null;
        if ($usuario_id) {
            try {
                $stmt_rol = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
                $stmt_rol->execute([$usuario_id]);
                $usuario_data = $stmt_rol->fetch();
                if ($usuario_data) {
                    $usuario_rol = $usuario_data['rol'];
                }
            } catch (PDOException $e) {
                error_log('Error obteniendo rol de usuario: ' . $e->getMessage());
            }
        }
        
        // Obtener carpetas de nivel 1
        if ($usuario_rol === 'trabajador' && $usuario_id) {
            $sql_carpetas_nivel1 = "SELECT DISTINCT c.*, 
                                           COUNT(DISTINCT sc.id) as cantidad_subcarpetas
                                    FROM carpetas c
                                    INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                                    LEFT JOIN carpetas sc ON sc.carpeta_padre_id = c.id AND sc.activo = 1
                                    WHERE c.proyecto_id = ? 
                                    AND c.carpeta_padre_id IS NULL
                                    AND c.activo = 1
                                    AND cu.usuario_id = ? 
                                    AND cu.puede_ver = 1
                                    GROUP BY c.id
                                    ORDER BY c.nombre";
            $stmt_carpetas_nivel1 = $pdo->prepare($sql_carpetas_nivel1);
            $stmt_carpetas_nivel1->execute([$proyecto_id, $usuario_id]);
        } else {
            $sql_carpetas_nivel1 = "SELECT c.*, 
                                           COUNT(DISTINCT sc.id) as cantidad_subcarpetas
                                    FROM carpetas c
                                    LEFT JOIN carpetas sc ON sc.carpeta_padre_id = c.id AND sc.activo = 1
                                    WHERE c.proyecto_id = ? 
                                    AND c.carpeta_padre_id IS NULL
                                    AND c.activo = 1
                                    GROUP BY c.id
                                    ORDER BY c.nombre";
            $stmt_carpetas_nivel1 = $pdo->prepare($sql_carpetas_nivel1);
            $stmt_carpetas_nivel1->execute([$proyecto_id]);
        }
        
        $carpetas_nivel1 = $stmt_carpetas_nivel1->fetchAll(PDO::FETCH_ASSOC);
        
        $resultado = [];
        $suma_promedios_general = 0;
        $contador_promedios_general = 0;
        
        foreach ($carpetas_nivel1 as $carpeta_nivel1) {
            $subcarpetas_con_promedio = [];
            
            // Obtener subcarpetas de nivel 2 para mostrar sus promedios individuales
            if ($usuario_rol === 'trabajador' && $usuario_id) {
                $sql_subcarpetas = "SELECT DISTINCT c.*
                                    FROM carpetas c
                                    INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                                    WHERE c.carpeta_padre_id = ?
                                    AND c.activo = 1
                                    AND cu.usuario_id = ?
                                    AND cu.puede_ver = 1
                                    ORDER BY c.nombre";
                $stmt_subcarpetas = $pdo->prepare($sql_subcarpetas);
                $stmt_subcarpetas->execute([$carpeta_nivel1['id'], $usuario_id]);
            } else {
                $sql_subcarpetas = "SELECT c.*
                                    FROM carpetas c
                                    WHERE c.carpeta_padre_id = ?
                                    AND c.activo = 1
                                    ORDER BY c.nombre";
                $stmt_subcarpetas = $pdo->prepare($sql_subcarpetas);
                $stmt_subcarpetas->execute([$carpeta_nivel1['id']]);
            }
            
            $subcarpetas = $stmt_subcarpetas->fetchAll(PDO::FETCH_ASSOC);
            
            $suma_promedios_nivel1 = 0;
            $contador_promedios_nivel1 = 0;
            
            foreach ($subcarpetas as $subcarpeta) {
                // Para subcarpetas de nivel 2, calcular su promedio individual (sin incluir subcarpetas)
                $nivel_subcarpeta = obtenerNivelCarpeta($pdo, $subcarpeta['id']);
                if ($nivel_subcarpeta === 2) {
                    // Obtener solo la carpeta actual sin subcarpetas
                    $carpetas_ids_sub = [$subcarpeta['id']];
                    $placeholders_sub = implode(',', array_fill(0, count($carpetas_ids_sub), '?'));
                    
                    // Calcular promedio de tabla preventiva
                    $sql_preventivos_sub = "SELECT 
                                               AVG(COALESCE(ponderacion, 0)) as promedio, 
                                               COUNT(*) as total,
                                               SUM(COALESCE(ponderacion, 0)) as suma_total
                                           FROM carpeta_linea_base
                                           WHERE carpeta_id IN ($placeholders_sub)
                                           AND activo = 1";
                    
                    $stmt_preventivos_sub = $pdo->prepare($sql_preventivos_sub);
                    $stmt_preventivos_sub->execute($carpetas_ids_sub);
                    $resultado_preventivos_sub = $stmt_preventivos_sub->fetch(PDO::FETCH_ASSOC);
                    
                    // Calcular promedio de tabla mitigadores
                    $sql_mitigadores_sub = "SELECT 
                                               AVG(COALESCE(ponderacion, 0)) as promedio, 
                                               COUNT(*) as total,
                                               SUM(COALESCE(ponderacion, 0)) as suma_total
                                            FROM carpeta_linea_base_mitigadores
                                            WHERE carpeta_id IN ($placeholders_sub)
                                            AND activo = 1";
                    
                    $stmt_mitigadores_sub = $pdo->prepare($sql_mitigadores_sub);
                    $stmt_mitigadores_sub->execute($carpetas_ids_sub);
                    $resultado_mitigadores_sub = $stmt_mitigadores_sub->fetch(PDO::FETCH_ASSOC);
                    
                    // Calcular promedio general
                    $total_preventivos_sub = intval($resultado_preventivos_sub['total'] ?? 0);
                    $total_mitigadores_sub = intval($resultado_mitigadores_sub['total'] ?? 0);
                    $total_registros_sub = $total_preventivos_sub + $total_mitigadores_sub;
                    
                    // Si no hay registros, devolver 0% (las carpetas de nivel 2 siempre deben tener un porcentaje)
                    if ($total_registros_sub === 0) {
                        $promedio_subcarpeta = 0;
                    } else {
                        $suma_preventivos_sub = floatval($resultado_preventivos_sub['suma_total'] ?? 0);
                        $suma_mitigadores_sub = floatval($resultado_mitigadores_sub['suma_total'] ?? 0);
                        $suma_total_sub = $suma_preventivos_sub + $suma_mitigadores_sub;
                        $promedio_subcarpeta = round($suma_total_sub / $total_registros_sub, 2);
                    }
                } else {
                    // Para otros niveles, usar la función recursiva
                    $promedio_subcarpeta = calcularPromedioPonderacion($pdo, $subcarpeta['id']);
                    // Si devuelve null pero hay subcarpetas, considerar 0%
                    if ($promedio_subcarpeta === null) {
                        $promedio_subcarpeta = 0;
                    }
                }
                
                $subcarpeta_con_promedio = [
                    'id' => $subcarpeta['id'],
                    'nombre' => $subcarpeta['nombre'],
                    'descripcion' => $subcarpeta['descripcion'] ?? '',
                    'promedio_ponderacion' => $promedio_subcarpeta
                ];
                
                $subcarpetas_con_promedio[] = $subcarpeta_con_promedio;
                
                // Acumular para el promedio de nivel 1
                $suma_promedios_nivel1 += $promedio_subcarpeta;
                $contador_promedios_nivel1++;
            }
            
            // Calcular promedio de nivel 1: promedio de los promedios de sus subcarpetas
            // Si tiene subcarpetas, calcular el promedio (incluso si todas están en 0%)
            $promedio_nivel1 = null;
            if ($contador_promedios_nivel1 > 0) {
                $promedio_nivel1 = round($suma_promedios_nivel1 / $contador_promedios_nivel1, 2);
            } else {
                // Si no tiene subcarpetas, usar el cálculo en cascada ascendente
                $promedio_nivel1 = calcularPromedioPonderacion($pdo, $carpeta_nivel1['id']);
            }
            
            $resultado[] = [
                'id' => $carpeta_nivel1['id'],
                'nombre' => $carpeta_nivel1['nombre'],
                'descripcion' => $carpeta_nivel1['descripcion'] ?? '',
                'cantidad_subcarpetas' => intval($carpeta_nivel1['cantidad_subcarpetas'] ?? 0),
                'promedio_ponderacion' => $promedio_nivel1,
                'subcarpetas' => $subcarpetas_con_promedio
            ];
            
            // Acumular para el promedio general
            if ($promedio_nivel1 !== null) {
                $suma_promedios_general += $promedio_nivel1;
                $contador_promedios_general++;
            }
        }
        
        // Calcular promedio general de todas las carpetas de nivel 1
        $promedio_general = null;
        if ($contador_promedios_general > 0) {
            $promedio_general = round($suma_promedios_general / $contador_promedios_general, 2);
        }
        
        // Devolver resultado con promedio general
        echo json_encode([
            'carpetas' => $resultado,
            'promedio_general' => $promedio_general
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        error_log('Error en carpetas_con_promedios.php: ' . $e->getMessage());
        echo json_encode([
            'error' => 'Error al obtener carpetas con promedios: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Error general en carpetas_con_promedios.php: ' . $e->getMessage());
        echo json_encode([
            'error' => 'Error al obtener carpetas con promedios: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>

