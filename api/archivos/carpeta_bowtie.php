<?php
// Headers CORS completos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

// GET: Obtener análisis Bowtie de una carpeta
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $carpeta_id = isset($_GET['carpeta_id']) ? intval($_GET['carpeta_id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    
    if (!$carpeta_id) {
        http_response_code(400);
        echo json_encode(['error' => 'carpeta_id es requerido'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar permisos si se proporciona usuario_id
        if ($usuario_id) {
            $stmt_rol = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
            $stmt_rol->execute([$usuario_id]);
            $usuario_data = $stmt_rol->fetch();
            
            if ($usuario_data) {
                $rol = $usuario_data['rol'];
                
                // Solo validar permisos heredados para trabajadores, admin o visitas
                if (in_array($rol, ['trabajador', 'admin', 'visita'])) {
                    // Obtener todas las carpetas asignadas al usuario
                    $stmt_asignadas = $pdo->prepare("SELECT carpeta_id FROM carpeta_usuarios WHERE usuario_id = ? AND puede_ver = 1");
                    $stmt_asignadas->execute([$usuario_id]);
                    $carpetas_asignadas = array_column($stmt_asignadas->fetchAll(PDO::FETCH_ASSOC), 'carpeta_id');
                    
                    if (empty($carpetas_asignadas)) {
                        http_response_code(403);
                        echo json_encode(['error' => 'No tienes permiso para acceder a esta carpeta'], JSON_UNESCAPED_UNICODE);
                        exit;
                    }
                    
                    // Verificar si la carpeta actual o alguno de sus ancestros está asignada
                    $carpeta_actual = $carpeta_id;
                    $tiene_acceso = false;
                    
                    while ($carpeta_actual !== null) {
                        if (in_array($carpeta_actual, $carpetas_asignadas)) {
                            $tiene_acceso = true;
                            break;
                        }
                        
                        $stmt_padre = $pdo->prepare("SELECT carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
                        $stmt_padre->execute([$carpeta_actual]);
                        $padre = $stmt_padre->fetch(PDO::FETCH_ASSOC);
                        $carpeta_actual = $padre ? $padre['carpeta_padre_id'] : null;
                    }
                    
                    if (!$tiene_acceso) {
                        http_response_code(403);
                        echo json_encode(['error' => 'No tienes permiso para acceder a esta carpeta'], JSON_UNESCAPED_UNICODE);
                        exit;
                    }
                }
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Usuario no encontrado'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        
        // Obtener análisis Bowtie principal
        $stmt_bowtie = $pdo->prepare("SELECT b.*, 
                                              u_creador.nombre as creador_nombre,
                                              u_actualizador.nombre as actualizador_nombre
                                       FROM carpeta_bowtie b
                                       LEFT JOIN usuarios u_creador ON b.creado_por = u_creador.id
                                       LEFT JOIN usuarios u_actualizador ON b.actualizado_por = u_actualizador.id
                                       WHERE b.carpeta_id = ? AND b.activo = 1");
        $stmt_bowtie->execute([$carpeta_id]);
        $bowtie = $stmt_bowtie->fetch(PDO::FETCH_ASSOC);
        
        if (!$bowtie) {
            // Si no existe, retornar estructura vacía
            echo json_encode([
                'bowtie_id' => null,
                'evento_central' => null,
                'peligro' => null,
                'energia' => null,
                'evento_top' => null,
                'causas' => [],
                'controles_preventivos' => [],
                'consecuencias' => [],
                'controles_mitigadores' => []
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Obtener causas
        $stmt_causas = $pdo->prepare("SELECT * FROM bowtie_causas WHERE bowtie_id = ? AND activo = 1 ORDER BY orden ASC, id ASC");
        $stmt_causas->execute([$bowtie['id']]);
        $causas = $stmt_causas->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener controles preventivos
        $stmt_preventivos = $pdo->prepare("SELECT cp.*, 
                                                  c.descripcion as causa_descripcion
                                           FROM bowtie_controles_preventivos cp
                                           LEFT JOIN bowtie_causas c ON cp.causa_id = c.id
                                           WHERE cp.bowtie_id = ? AND cp.activo = 1 
                                           ORDER BY cp.orden ASC, cp.id ASC");
        $stmt_preventivos->execute([$bowtie['id']]);
        $controles_preventivos = $stmt_preventivos->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener relaciones muchos a muchos para controles preventivos (optimizado - una sola consulta)
        $cp_ids = array_column($controles_preventivos, 'id');
        $causas_asociadas_map = [];
        $dimensiones_map = [];
        $preguntas_map = [];
        
        if (!empty($cp_ids)) {
            $placeholders = implode(',', array_fill(0, count($cp_ids), '?'));
            
            // Obtener todas las relaciones de causas de una vez
            try {
                $stmt_rel_cp = $pdo->prepare("SELECT rel.control_preventivo_id, c.id, c.codigo 
                                              FROM bowtie_control_preventivo_causas rel
                                              INNER JOIN bowtie_causas c ON rel.causa_id = c.id
                                              WHERE rel.control_preventivo_id IN ($placeholders)");
                $stmt_rel_cp->execute($cp_ids);
                $relaciones = $stmt_rel_cp->fetchAll(PDO::FETCH_ASSOC);
                foreach ($relaciones as $rel) {
                    if (!isset($causas_asociadas_map[$rel['control_preventivo_id']])) {
                        $causas_asociadas_map[$rel['control_preventivo_id']] = [];
                    }
                    $causas_asociadas_map[$rel['control_preventivo_id']][] = [
                        'id' => $rel['id'],
                        'codigo' => $rel['codigo']
                    ];
                }
            } catch (PDOException $e) {
                // Si la tabla no existe, simplemente no hay relaciones
            }
            
            // Obtener todas las dimensiones de una vez
            try {
                $stmt_dim = $pdo->prepare("SELECT * FROM bowtie_dimensiones 
                                          WHERE control_preventivo_id IN ($placeholders) AND activo = 1 
                                          ORDER BY orden ASC, id ASC");
                $stmt_dim->execute($cp_ids);
                $dimensiones = $stmt_dim->fetchAll(PDO::FETCH_ASSOC);
                
                // Agrupar dimensiones por control_preventivo_id
                foreach ($dimensiones as $dim) {
                    if (!isset($dimensiones_map[$dim['control_preventivo_id']])) {
                        $dimensiones_map[$dim['control_preventivo_id']] = [];
                    }
                    $dimensiones_map[$dim['control_preventivo_id']][] = $dim;
                }
                
                // Obtener todas las preguntas de una vez
                if (!empty($dimensiones)) {
                    $dim_ids = array_column($dimensiones, 'id');
                    $placeholders_dim = implode(',', array_fill(0, count($dim_ids), '?'));
                    $stmt_preg = $pdo->prepare("SELECT * FROM bowtie_preguntas 
                                               WHERE dimension_id IN ($placeholders_dim) AND activo = 1 
                                               ORDER BY orden ASC, id ASC");
                    $stmt_preg->execute($dim_ids);
                    $preguntas = $stmt_preg->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Obtener evidencias individuales para cada pregunta
                    $pregunta_ids = array_column($preguntas, 'id');
                    $evidencias_map = [];
                    if (!empty($pregunta_ids)) {
                        try {
                            $placeholders_preg = implode(',', array_fill(0, count($pregunta_ids), '?'));
                            $stmt_evid = $pdo->prepare("SELECT * FROM bowtie_evidencias 
                                                       WHERE pregunta_id IN ($placeholders_preg) AND activo = 1 
                                                       ORDER BY orden ASC, id ASC");
                            $stmt_evid->execute($pregunta_ids);
                            $evidencias = $stmt_evid->fetchAll(PDO::FETCH_ASSOC);
                            
                            // Log CRÍTICO: Verificar qué devuelve la consulta SQL directamente (PREVENTIVOS)
                            error_log("=== CONSULTA SQL EVIDENCIAS PREVENTIVAS ===");
                            error_log("IDs de preguntas consultadas: " . implode(',', $pregunta_ids));
                            error_log("Total evidencias devueltas por SQL: " . count($evidencias));
                            foreach ($evidencias as $ev) {
                                error_log("  Evidencia SQL: ID={$ev['id']}, pregunta_id={$ev['pregunta_id']}, orden={$ev['orden']}, activo={$ev['activo']}, texto=" . substr($ev['texto'], 0, 50));
                            }
                            error_log("=== FIN CONSULTA SQL PREVENTIVAS ===");
                            
                            // Agrupar evidencias por pregunta_id
                            foreach ($evidencias as $evid) {
                                if (!isset($evidencias_map[$evid['pregunta_id']])) {
                                    $evidencias_map[$evid['pregunta_id']] = [];
                                }
                                $evidencias_map[$evid['pregunta_id']][] = [
                                    'id' => $evid['id'],
                                    'texto' => $evid['texto'],
                                    'orden' => $evid['orden']
                                ];
                            }
                            
                            // Log detallado de evidencias obtenidas (PREVENTIVOS)
                            error_log("=== EVIDENCIAS PREVENTIVOS ===");
                            error_log("Total evidencias obtenidas: " . count($evidencias) . " para " . count($pregunta_ids) . " preguntas");
                            error_log("IDs de preguntas consultadas: " . implode(',', $pregunta_ids));
                            foreach ($evidencias_map as $preg_id => $evids) {
                                $ids_evids = array_column($evids, 'id');
                                error_log("  Pregunta ID {$preg_id}: " . count($evids) . " evidencias (IDs: " . implode(',', $ids_evids) . ")");
                            }
                            error_log("=== FIN EVIDENCIAS PREVENTIVOS ===");
                        } catch (PDOException $e) {
                            // Si la tabla bowtie_evidencias no existe aún, continuar sin evidencias individuales
                            error_log("Tabla bowtie_evidencias no existe aún: " . $e->getMessage());
                        }
                    }
                    
                    // Agrupar preguntas por dimension_id y agregar evidencias
                    foreach ($preguntas as $preg) {
                        // CRÍTICO: SIEMPRE obtener evidencias directamente de BD para esta pregunta específica
                        // Esto evita problemas donde el map inicial no obtiene todas las evidencias
                        $evidencias_pregunta = [];
                        try {
                            $stmt_direct_all = $pdo->prepare("SELECT id, texto, orden FROM bowtie_evidencias WHERE pregunta_id = ? AND activo = 1 ORDER BY orden ASC, id ASC");
                            $stmt_direct_all->execute([$preg['id']]);
                            $todas_las_evidencias = $stmt_direct_all->fetchAll(PDO::FETCH_ASSOC);
                            
                            $evidencias_pregunta = array_map(function($ev) {
                                return [
                                    'id' => $ev['id'],
                                    'texto' => $ev['texto'],
                                    'orden' => $ev['orden']
                                ];
                            }, $todas_las_evidencias);
                            
                            // Log para debugging
                            if (count($todas_las_evidencias) > 0) {
                                $ids_evids = array_column($todas_las_evidencias, 'id');
                                error_log("Pregunta ID {$preg['id']}: Obtenidas " . count($todas_las_evidencias) . " evidencias directamente de BD (IDs: " . implode(',', $ids_evids) . ")");
                            }
                        } catch (PDOException $e) {
                            error_log("Error obteniendo evidencias para pregunta {$preg['id']}: " . $e->getMessage());
                            // Fallback al map si hay error
                            $evidencias_pregunta = $evidencias_map[$preg['id']] ?? [];
                        }
                        
                        $preg['evidencias'] = $evidencias_pregunta;
                        
                        if (!isset($preguntas_map[$preg['dimension_id']])) {
                            $preguntas_map[$preg['dimension_id']] = [];
                        }
                        $preguntas_map[$preg['dimension_id']][] = $preg;
                    }
                }
            } catch (PDOException $e) {
                // Si las tablas no existen, simplemente no hay dimensiones
            }
        }
        
        // Asignar relaciones y dimensiones a cada control preventivo
        foreach ($controles_preventivos as &$cp) {
            $cp['causas_asociadas'] = $causas_asociadas_map[$cp['id']] ?? [];
            $dimensiones_control = $dimensiones_map[$cp['id']] ?? [];
            foreach ($dimensiones_control as &$dim) {
                $dim['preguntas'] = $preguntas_map[$dim['id']] ?? [];
            }
            unset($dim);
            $cp['dimensiones'] = $dimensiones_control;
        }
        unset($cp);
        
        // Obtener consecuencias
        $stmt_consecuencias = $pdo->prepare("SELECT * FROM bowtie_consecuencias WHERE bowtie_id = ? AND activo = 1 ORDER BY orden ASC, id ASC");
        $stmt_consecuencias->execute([$bowtie['id']]);
        $consecuencias = $stmt_consecuencias->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener controles mitigadores
        $stmt_mitigadores = $pdo->prepare("SELECT cm.*, 
                                                 c.descripcion as consecuencia_descripcion
                                          FROM bowtie_controles_mitigadores cm
                                          LEFT JOIN bowtie_consecuencias c ON cm.consecuencia_id = c.id
                                          WHERE cm.bowtie_id = ? AND cm.activo = 1 
                                          ORDER BY cm.orden ASC, cm.id ASC");
        $stmt_mitigadores->execute([$bowtie['id']]);
        $controles_mitigadores = $stmt_mitigadores->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener relaciones muchos a muchos para controles mitigadores (optimizado - una sola consulta)
        $cm_ids = array_column($controles_mitigadores, 'id');
        $consecuencias_asociadas_map = [];
        $dimensiones_mitigador_map = [];
        $preguntas_mitigador_map = [];
        
        if (!empty($cm_ids)) {
            $placeholders = implode(',', array_fill(0, count($cm_ids), '?'));
            
            // Obtener todas las relaciones de consecuencias de una vez
            try {
                $stmt_rel_cm = $pdo->prepare("SELECT rel.control_mitigador_id, c.id, c.codigo 
                                              FROM bowtie_control_mitigador_consecuencias rel
                                              INNER JOIN bowtie_consecuencias c ON rel.consecuencia_id = c.id
                                              WHERE rel.control_mitigador_id IN ($placeholders)");
                $stmt_rel_cm->execute($cm_ids);
                $relaciones = $stmt_rel_cm->fetchAll(PDO::FETCH_ASSOC);
                foreach ($relaciones as $rel) {
                    if (!isset($consecuencias_asociadas_map[$rel['control_mitigador_id']])) {
                        $consecuencias_asociadas_map[$rel['control_mitigador_id']] = [];
                    }
                    $consecuencias_asociadas_map[$rel['control_mitigador_id']][] = [
                        'id' => $rel['id'],
                        'codigo' => $rel['codigo']
                    ];
                }
            } catch (PDOException $e) {
                // Si la tabla no existe, simplemente no hay relaciones
            }
            
            // Obtener todas las dimensiones de una vez
            try {
                $stmt_dim = $pdo->prepare("SELECT * FROM bowtie_dimensiones 
                                          WHERE control_mitigador_id IN ($placeholders) AND activo = 1 
                                          ORDER BY orden ASC, id ASC");
                $stmt_dim->execute($cm_ids);
                $dimensiones = $stmt_dim->fetchAll(PDO::FETCH_ASSOC);
                
                // Agrupar dimensiones por control_mitigador_id
                foreach ($dimensiones as $dim) {
                    if (!isset($dimensiones_mitigador_map[$dim['control_mitigador_id']])) {
                        $dimensiones_mitigador_map[$dim['control_mitigador_id']] = [];
                    }
                    $dimensiones_mitigador_map[$dim['control_mitigador_id']][] = $dim;
                }
                
                // Obtener todas las preguntas de una vez
                if (!empty($dimensiones)) {
                    $dim_ids = array_column($dimensiones, 'id');
                    $placeholders_dim = implode(',', array_fill(0, count($dim_ids), '?'));
                    $stmt_preg = $pdo->prepare("SELECT * FROM bowtie_preguntas 
                                               WHERE dimension_id IN ($placeholders_dim) AND activo = 1 
                                               ORDER BY orden ASC, id ASC");
                    $stmt_preg->execute($dim_ids);
                    $preguntas = $stmt_preg->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Obtener evidencias individuales para cada pregunta (mitigadores)
                    $pregunta_ids = array_column($preguntas, 'id');
                    $evidencias_map = [];
                    if (!empty($pregunta_ids)) {
                        try {
                            $placeholders_preg = implode(',', array_fill(0, count($pregunta_ids), '?'));
                            $stmt_evid = $pdo->prepare("SELECT * FROM bowtie_evidencias 
                                                       WHERE pregunta_id IN ($placeholders_preg) AND activo = 1 
                                                       ORDER BY orden ASC, id ASC");
                            $stmt_evid->execute($pregunta_ids);
                            $evidencias = $stmt_evid->fetchAll(PDO::FETCH_ASSOC);
                            
                            // Agrupar evidencias por pregunta_id
                            foreach ($evidencias as $evid) {
                                if (!isset($evidencias_map[$evid['pregunta_id']])) {
                                    $evidencias_map[$evid['pregunta_id']] = [];
                                }
                                $evidencias_map[$evid['pregunta_id']][] = [
                                    'id' => $evid['id'],
                                    'texto' => $evid['texto'],
                                    'orden' => $evid['orden']
                                ];
                            }
                        } catch (PDOException $e) {
                            // Si la tabla bowtie_evidencias no existe aún, continuar sin evidencias individuales
                            error_log("Tabla bowtie_evidencias no existe aún: " . $e->getMessage());
                        }
                    }
                    
                    // Agrupar preguntas por dimension_id y agregar evidencias
                    foreach ($preguntas as $preg) {
                        // CRÍTICO: SIEMPRE obtener evidencias directamente de BD para esta pregunta específica
                        // Esto evita problemas donde el map inicial no obtiene todas las evidencias
                        $evidencias_pregunta = [];
                        try {
                            $stmt_direct_all = $pdo->prepare("SELECT id, texto, orden FROM bowtie_evidencias WHERE pregunta_id = ? AND activo = 1 ORDER BY orden ASC, id ASC");
                            $stmt_direct_all->execute([$preg['id']]);
                            $todas_las_evidencias = $stmt_direct_all->fetchAll(PDO::FETCH_ASSOC);
                            
                            $evidencias_pregunta = array_map(function($ev) {
                                return [
                                    'id' => $ev['id'],
                                    'texto' => $ev['texto'],
                                    'orden' => $ev['orden']
                                ];
                            }, $todas_las_evidencias);
                            
                            // Log para debugging
                            if (count($todas_las_evidencias) > 0) {
                                $ids_evids = array_column($todas_las_evidencias, 'id');
                                error_log("Pregunta Mitigador ID {$preg['id']}: Obtenidas " . count($todas_las_evidencias) . " evidencias directamente de BD (IDs: " . implode(',', $ids_evids) . ")");
                            }
                        } catch (PDOException $e) {
                            error_log("Error obteniendo evidencias para pregunta mitigador {$preg['id']}: " . $e->getMessage());
                            // Fallback al map si hay error
                            $evidencias_pregunta = $evidencias_map[$preg['id']] ?? [];
                        }
                        
                        $preg['evidencias'] = $evidencias_pregunta;
                        
                        // Log para debugging
                        if (!empty($evidencias_pregunta)) {
                            error_log("Pregunta Mitigador ID {$preg['id']}: Devolviendo " . count($evidencias_pregunta) . " evidencias (IDs: " . implode(',', array_column($evidencias_pregunta, 'id')) . ")");
                        } else if (!empty($preg['evidencia'])) {
                            error_log("Pregunta Mitigador ID {$preg['id']}: No hay evidencias en array, pero tiene evidencia (texto): " . substr($preg['evidencia'], 0, 50));
                        }
                        
                        if (!isset($preguntas_mitigador_map[$preg['dimension_id']])) {
                            $preguntas_mitigador_map[$preg['dimension_id']] = [];
                        }
                        $preguntas_mitigador_map[$preg['dimension_id']][] = $preg;
                    }
                }
            } catch (PDOException $e) {
                // Si las tablas no existen, simplemente no hay dimensiones
            }
        }
        
        // Asignar relaciones y dimensiones a cada control mitigador
        foreach ($controles_mitigadores as &$cm) {
            $cm['consecuencias_asociadas'] = $consecuencias_asociadas_map[$cm['id']] ?? [];
            $dimensiones_control = $dimensiones_mitigador_map[$cm['id']] ?? [];
            foreach ($dimensiones_control as &$dim) {
                $dim['preguntas'] = $preguntas_mitigador_map[$dim['id']] ?? [];
            }
            unset($dim);
            $cm['dimensiones'] = $dimensiones_control;
        }
        unset($cm);
        
        // Obtener controles preventivos generales (nueva tabla)
        try {
            $stmt_preventivos_generales = $pdo->prepare("SELECT * FROM bowtie_controles_preventivos_generales WHERE bowtie_id = ? AND activo = 1 ORDER BY orden ASC, id ASC");
            $stmt_preventivos_generales->execute([$bowtie['id']]);
            $controles_preventivos_generales_raw = $stmt_preventivos_generales->fetchAll(PDO::FETCH_ASSOC);
            
            // Filtrar duplicados basados en código (mantener el primero encontrado)
            $codigosVistos = [];
            $controles_preventivos_generales = [];
            foreach ($controles_preventivos_generales_raw as $control) {
                $codigo = isset($control['codigo']) ? strtoupper(trim($control['codigo'])) : null;
                if ($codigo && !in_array($codigo, $codigosVistos)) {
                    $codigosVistos[] = $codigo;
                    $controles_preventivos_generales[] = $control;
                } elseif (!$codigo) {
                    // Si no tiene código, agregarlo de todas formas (se le asignará uno en el frontend)
                    $controles_preventivos_generales[] = $control;
                }
            }
        } catch (PDOException $e) {
            // Si la tabla no existe, retornar vacío
            $controles_preventivos_generales = [];
        }
        
        // Obtener controles mitigadores generales (nueva tabla)
        try {
            $stmt_mitigadores_generales = $pdo->prepare("SELECT * FROM bowtie_controles_mitigadores_generales WHERE bowtie_id = ? AND activo = 1 ORDER BY orden ASC, id ASC");
            $stmt_mitigadores_generales->execute([$bowtie['id']]);
            $controles_mitigadores_generales = $stmt_mitigadores_generales->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Si la tabla no existe, retornar vacío
            $controles_mitigadores_generales = [];
        }
        
        // Construir respuesta completa
        $resultado = [
            'bowtie_id' => intval($bowtie['id']),
            'carpeta_id' => intval($bowtie['carpeta_id']),
            'evento_central' => $bowtie['evento_central'] ?? null,
            'peligro' => $bowtie['peligro'] ?? null,
            'energia' => $bowtie['energia'] ?? null,
            'evento_top' => $bowtie['evento_top'] ?? null,
            'creado_por' => intval($bowtie['creado_por']),
            'creador_nombre' => $bowtie['creador_nombre'],
            'actualizado_por' => $bowtie['actualizado_por'] ? intval($bowtie['actualizado_por']) : null,
            'actualizador_nombre' => $bowtie['actualizador_nombre'],
            'creado_en' => $bowtie['creado_en'],
            'actualizado_en' => $bowtie['actualizado_en'],
            'causas' => $causas,
            'controles_preventivos' => $controles_preventivos,
            'consecuencias' => $consecuencias,
            'controles_mitigadores' => $controles_mitigadores,
            'controles_preventivos_generales' => $controles_preventivos_generales,
            'controles_mitigadores_generales' => $controles_mitigadores_generales
        ];
        
        echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        // Asegurar headers CORS incluso en errores
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header('Content-Type: application/json; charset=utf-8');
        error_log("Error en GET carpeta_bowtie.php: " . $e->getMessage());
        echo json_encode(['error' => 'Error al obtener análisis Bowtie: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        // Asegurar headers CORS incluso en errores
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header('Content-Type: application/json; charset=utf-8');
        error_log("Error general en GET carpeta_bowtie.php: " . $e->getMessage());
        echo json_encode(['error' => 'Error al obtener análisis Bowtie: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// POST/PUT: Guardar o actualizar análisis Bowtie
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $carpeta_id = intval($data['carpeta_id'] ?? 0);
    $evento_central = isset($data['evento_central']) ? trim($data['evento_central']) : null;
    $peligro = isset($data['peligro']) ? trim($data['peligro']) : null;
    $energia = isset($data['energia']) ? trim($data['energia']) : null;
    $evento_top = isset($data['evento_top']) ? trim($data['evento_top']) : null;
    $usuario_id = intval($data['usuario_id'] ?? 0);
    // Log para debugging
    error_log("=== GUARDANDO BOWTIE ===");
    error_log("Causas recibidas: " . json_encode($data['causas'] ?? [], JSON_UNESCAPED_UNICODE));
    if (isset($data['causas']) && is_array($data['causas'])) {
        foreach ($data['causas'] as $idx => $causa) {
            error_log("Causa[$idx]: codigo=" . ($causa['codigo'] ?? 'NULL') . ", descripcion=" . substr($causa['descripcion'] ?? '', 0, 50));
        }
    }
    
    $causas = isset($data['causas']) && is_array($data['causas']) ? $data['causas'] : [];
    $controles_preventivos = isset($data['controles_preventivos']) && is_array($data['controles_preventivos']) ? $data['controles_preventivos'] : [];
    $consecuencias = isset($data['consecuencias']) && is_array($data['consecuencias']) ? $data['consecuencias'] : [];
    $controles_mitigadores = isset($data['controles_mitigadores']) && is_array($data['controles_mitigadores']) ? $data['controles_mitigadores'] : [];
    $controles_preventivos_generales = isset($data['controles_preventivos_generales']) && is_array($data['controles_preventivos_generales']) ? $data['controles_preventivos_generales'] : [];
    $controles_mitigadores_generales = isset($data['controles_mitigadores_generales']) && is_array($data['controles_mitigadores_generales']) ? $data['controles_mitigadores_generales'] : [];
    
    if (!$carpeta_id || !$usuario_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'carpeta_id y usuario_id son requeridos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Verificar permisos de edición
    try {
        $stmt_rol = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
        $stmt_rol->execute([$usuario_id]);
        $usuario_data = $stmt_rol->fetch();
        
        if (!$usuario_data) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Usuario no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $rol_usuario = $usuario_data['rol'];
        
        // Solo admin y super_admin pueden editar análisis Bowtie
        if (!in_array($rol_usuario, ['super_admin', 'admin'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo administradores pueden editar análisis Bowtie'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Iniciar transacción
        $pdo->beginTransaction();
        
        // Verificar si ya existe un análisis Bowtie para esta carpeta
        $stmt_existe = $pdo->prepare("SELECT id FROM carpeta_bowtie WHERE carpeta_id = ? AND activo = 1");
        $stmt_existe->execute([$carpeta_id]);
        $bowtie_existente = $stmt_existe->fetch();
        
        if ($bowtie_existente) {
            // Actualizar análisis existente
            $bowtie_id = $bowtie_existente['id'];
            
            // Actualizar campos del evento central (soporta ambos formatos para compatibilidad)
            $stmt_update = $pdo->prepare("UPDATE carpeta_bowtie SET evento_central = ?, peligro = ?, energia = ?, evento_top = ?, actualizado_por = ?, actualizado_en = NOW() WHERE id = ?");
            $stmt_update->execute([$evento_central, $peligro, $energia, $evento_top, $usuario_id, $bowtie_id]);
            
            // Soft delete de todos los elementos existentes
            // Primero obtener IDs de controles para hacer soft delete de dimensiones y preguntas
            $stmt_cp_ids = $pdo->prepare("SELECT id FROM bowtie_controles_preventivos WHERE bowtie_id = ?");
            $stmt_cp_ids->execute([$bowtie_id]);
            $cp_ids = $stmt_cp_ids->fetchAll(PDO::FETCH_COLUMN);
            
            $stmt_cm_ids = $pdo->prepare("SELECT id FROM bowtie_controles_mitigadores WHERE bowtie_id = ?");
            $stmt_cm_ids->execute([$bowtie_id]);
            $cm_ids = $stmt_cm_ids->fetchAll(PDO::FETCH_COLUMN);
            
            // Soft delete de dimensiones y preguntas asociadas (si las tablas existen)
            try {
                if (!empty($cp_ids)) {
                    $placeholders_cp = implode(',', array_fill(0, count($cp_ids), '?'));
                    $stmt_dim_ids = $pdo->prepare("SELECT id FROM bowtie_dimensiones WHERE control_preventivo_id IN ($placeholders_cp)");
                    $stmt_dim_ids->execute($cp_ids);
                    $dim_ids = $stmt_dim_ids->fetchAll(PDO::FETCH_COLUMN);
                    if (!empty($dim_ids)) {
                        $placeholders_dim = implode(',', array_fill(0, count($dim_ids), '?'));
                        $pdo->prepare("UPDATE bowtie_preguntas SET activo = 0 WHERE dimension_id IN ($placeholders_dim)")->execute($dim_ids);
                        $pdo->prepare("UPDATE bowtie_dimensiones SET activo = 0 WHERE control_preventivo_id IN ($placeholders_cp)")->execute($cp_ids);
                    }
                }
                if (!empty($cm_ids)) {
                    $placeholders_cm = implode(',', array_fill(0, count($cm_ids), '?'));
                    $stmt_dim_ids = $pdo->prepare("SELECT id FROM bowtie_dimensiones WHERE control_mitigador_id IN ($placeholders_cm)");
                    $stmt_dim_ids->execute($cm_ids);
                    $dim_ids = $stmt_dim_ids->fetchAll(PDO::FETCH_COLUMN);
                    if (!empty($dim_ids)) {
                        $placeholders_dim = implode(',', array_fill(0, count($dim_ids), '?'));
                        $pdo->prepare("UPDATE bowtie_preguntas SET activo = 0 WHERE dimension_id IN ($placeholders_dim)")->execute($dim_ids);
                        $pdo->prepare("UPDATE bowtie_dimensiones SET activo = 0 WHERE control_mitigador_id IN ($placeholders_cm)")->execute($cm_ids);
                    }
                }
            } catch (PDOException $e) {
                // Si las tablas no existen, simplemente continuar
                error_log("Error en soft delete de dimensiones: " . $e->getMessage());
            }
            
            $pdo->prepare("UPDATE bowtie_causas SET activo = 0 WHERE bowtie_id = ?")->execute([$bowtie_id]);
            $pdo->prepare("UPDATE bowtie_controles_preventivos SET activo = 0 WHERE bowtie_id = ?")->execute([$bowtie_id]);
            $pdo->prepare("UPDATE bowtie_consecuencias SET activo = 0 WHERE bowtie_id = ?")->execute([$bowtie_id]);
            $pdo->prepare("UPDATE bowtie_controles_mitigadores SET activo = 0 WHERE bowtie_id = ?")->execute([$bowtie_id]);
            
            // Eliminar relaciones existentes (se recrearán con los nuevos datos) - solo si las tablas existen
            try {
                $pdo->prepare("DELETE FROM bowtie_control_preventivo_causas WHERE control_preventivo_id IN (SELECT id FROM bowtie_controles_preventivos WHERE bowtie_id = ?)")->execute([$bowtie_id]);
            } catch (PDOException $e) {
                // Si la tabla no existe, simplemente continuar
            }
            try {
                $pdo->prepare("DELETE FROM bowtie_control_mitigador_consecuencias WHERE control_mitigador_id IN (SELECT id FROM bowtie_controles_mitigadores WHERE bowtie_id = ?)")->execute([$bowtie_id]);
            } catch (PDOException $e) {
                // Si la tabla no existe, simplemente continuar
            }
        } else {
            // Crear nuevo análisis
            $stmt_insert = $pdo->prepare("INSERT INTO carpeta_bowtie (carpeta_id, evento_central, peligro, energia, evento_top, creado_por) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt_insert->execute([$carpeta_id, $evento_central, $peligro, $energia, $evento_top, $usuario_id]);
            $bowtie_id = $pdo->lastInsertId();
        }
        
        // Primero: Obtener códigos existentes para esta carpeta para evitar duplicados
        $stmt_codigos_existentes = $pdo->prepare("SELECT codigo FROM bowtie_causas WHERE bowtie_id = ? AND activo = 1 AND codigo IS NOT NULL");
        $stmt_codigos_existentes->execute([$bowtie_id]);
        $codigos_existentes = $stmt_codigos_existentes->fetchAll(PDO::FETCH_COLUMN);
        $codigos_usados = array_flip($codigos_existentes); // Para búsqueda rápida
        
        // Función para generar el siguiente código disponible
        $generarSiguienteCodigo = function($codigos_usados) {
            $contador = 1;
            do {
                $codigo = 'CA' . $contador;
                $contador++;
            } while (isset($codigos_usados[$codigo]));
            return $codigo;
        };
        
        // Primero: Insertar todas las causas y crear mapa de códigos a IDs
        $causas_map = []; // código => id
        foreach ($causas as $index => $causa) {
            $descripcion_limpia = trim($causa['descripcion'] ?? '');
            error_log("Procesando causa[$index]: codigo=" . ($causa['codigo'] ?? 'NULL') . ", descripcion_length=" . strlen($descripcion_limpia));
            
            if (!empty($descripcion_limpia)) {
                // Validar y generar código único
                $codigo_propuesto = isset($causa['codigo']) && !empty(trim($causa['codigo'])) ? trim($causa['codigo']) : null;
                
                if ($codigo_propuesto) {
                    // Verificar si el código ya está en uso
                    if (isset($codigos_usados[$codigo_propuesto])) {
                        // Código duplicado, generar uno nuevo
                        $codigo_causa = $generarSiguienteCodigo($codigos_usados);
                        error_log("Código duplicado '$codigo_propuesto' detectado, usando '$codigo_causa' en su lugar");
                    } else {
                        $codigo_causa = $codigo_propuesto;
                    }
                } else {
                    // Generar código automáticamente
                    $codigo_causa = $generarSiguienteCodigo($codigos_usados);
                }
                
                // Marcar código como usado
                $codigos_usados[$codigo_causa] = true;
                
                try {
                    // Intentar insertar con código (si la columna existe)
                    $stmt_causa = $pdo->prepare("INSERT INTO bowtie_causas (bowtie_id, codigo, descripcion, orden, activo) VALUES (?, ?, ?, ?, 1)");
                    $stmt_causa->execute([$bowtie_id, $codigo_causa, $descripcion_limpia, $index]);
                    error_log("Causa insertada exitosamente: id=" . $pdo->lastInsertId() . ", codigo=$codigo_causa");
                } catch (PDOException $e) {
                    // Si la columna codigo no existe, insertar sin código
                    if (strpos($e->getMessage(), "Unknown column 'codigo'") !== false || 
                        strpos($e->getMessage(), "doesn't exist") !== false) {
                        $stmt_causa = $pdo->prepare("INSERT INTO bowtie_causas (bowtie_id, descripcion, orden, activo) VALUES (?, ?, ?, 1)");
                        $stmt_causa->execute([$bowtie_id, $descripcion_limpia, $index]);
                        error_log("Causa insertada sin código: id=" . $pdo->lastInsertId());
                    } else {
                        error_log("Error insertando causa: " . $e->getMessage());
                        throw $e;
                    }
                }
                $causa_id = $pdo->lastInsertId();
                $causas_map[$codigo_causa] = $causa_id;
                
                // Insertar controles preventivos asociados directamente a esta causa (legacy)
                if (isset($causa['controles_preventivos']) && is_array($causa['controles_preventivos'])) {
                    foreach ($causa['controles_preventivos'] as $cp_index => $control) {
                        if (!empty(trim($control['descripcion'] ?? ''))) {
                            $codigo_cp = isset($control['codigo']) && !empty(trim($control['codigo'])) ? trim($control['codigo']) : ('CCP' . ($cp_index + 1));
                            try {
                                $stmt_cp = $pdo->prepare("INSERT INTO bowtie_controles_preventivos (bowtie_id, causa_id, codigo, descripcion, orden, activo) VALUES (?, ?, ?, ?, ?, 1)");
                                $stmt_cp->execute([$bowtie_id, $causa_id, $codigo_cp, trim($control['descripcion']), $cp_index]);
                            } catch (PDOException $e) {
                                // Si la columna codigo no existe, insertar sin código
                                if (strpos($e->getMessage(), "Unknown column 'codigo'") !== false || 
                                    strpos($e->getMessage(), "doesn't exist") !== false) {
                                    $stmt_cp = $pdo->prepare("INSERT INTO bowtie_controles_preventivos (bowtie_id, causa_id, descripcion, orden, activo) VALUES (?, ?, ?, ?, 1)");
                                    $stmt_cp->execute([$bowtie_id, $causa_id, trim($control['descripcion']), $cp_index]);
                                } else {
                                    throw $e;
                                }
                            }
                        }
                    }
                }
            } else {
                error_log("Causa[$index] omitida: descripción vacía");
            }
        }
        
        // Segundo: Obtener códigos de consecuencias existentes para evitar duplicados
        $stmt_codigos_consecuencias = $pdo->prepare("SELECT codigo FROM bowtie_consecuencias WHERE bowtie_id = ? AND activo = 1 AND codigo IS NOT NULL");
        $stmt_codigos_consecuencias->execute([$bowtie_id]);
        $codigos_consecuencias_existentes = $stmt_codigos_consecuencias->fetchAll(PDO::FETCH_COLUMN);
        $codigos_consecuencias_usados = array_flip($codigos_consecuencias_existentes);
        
        // Función para generar el siguiente código de consecuencia disponible
        $generarSiguienteCodigoConsecuencia = function($codigos_usados) {
            $contador = 1;
            do {
                $codigo = 'CO' . $contador;
                $contador++;
            } while (isset($codigos_usados[$codigo]));
            return $codigo;
        };
        
        // Segundo: Insertar todas las consecuencias y crear mapa de códigos a IDs
        $consecuencias_map = []; // código => id
        foreach ($consecuencias as $index => $consecuencia) {
            if (!empty(trim($consecuencia['descripcion'] ?? ''))) {
                // Validar y generar código único
                $codigo_propuesto = isset($consecuencia['codigo']) && !empty(trim($consecuencia['codigo'])) ? trim($consecuencia['codigo']) : null;
                
                if ($codigo_propuesto) {
                    // Verificar si el código ya está en uso
                    if (isset($codigos_consecuencias_usados[$codigo_propuesto])) {
                        // Código duplicado, generar uno nuevo
                        $codigo_consecuencia = $generarSiguienteCodigoConsecuencia($codigos_consecuencias_usados);
                        error_log("Código de consecuencia duplicado '$codigo_propuesto' detectado, usando '$codigo_consecuencia' en su lugar");
                    } else {
                        $codigo_consecuencia = $codigo_propuesto;
                    }
                } else {
                    // Generar código automáticamente
                    $codigo_consecuencia = $generarSiguienteCodigoConsecuencia($codigos_consecuencias_usados);
                }
                
                // Marcar código como usado
                $codigos_consecuencias_usados[$codigo_consecuencia] = true;
                
                $evento_no_deseado = isset($consecuencia['evento_no_deseado']) && !empty(trim($consecuencia['evento_no_deseado'])) ? trim($consecuencia['evento_no_deseado']) : null;
                $categoria = isset($consecuencia['categoria']) && !empty(trim($consecuencia['categoria'])) ? trim($consecuencia['categoria']) : null;
                
                try {
                    // Intentar insertar con todos los campos nuevos (si las columnas existen)
                    $stmt_consecuencia = $pdo->prepare("INSERT INTO bowtie_consecuencias (bowtie_id, codigo, descripcion, evento_no_deseado, categoria, orden, activo) VALUES (?, ?, ?, ?, ?, ?, 1)");
                    $stmt_consecuencia->execute([$bowtie_id, $codigo_consecuencia, trim($consecuencia['descripcion']), $evento_no_deseado, $categoria, $index]);
                } catch (PDOException $e) {
                    // Si alguna columna no existe, intentar insertar sin los campos nuevos
                    if (strpos($e->getMessage(), "Unknown column") !== false || 
                        strpos($e->getMessage(), "doesn't exist") !== false) {
                        try {
                            // Intentar con código pero sin campos nuevos
                            $stmt_consecuencia = $pdo->prepare("INSERT INTO bowtie_consecuencias (bowtie_id, codigo, descripcion, orden, activo) VALUES (?, ?, ?, ?, 1)");
                            $stmt_consecuencia->execute([$bowtie_id, $codigo_consecuencia, trim($consecuencia['descripcion']), $index]);
                        } catch (PDOException $e2) {
                            // Si la columna codigo tampoco existe, insertar solo descripción
                            if (strpos($e2->getMessage(), "Unknown column 'codigo'") !== false || 
                                strpos($e2->getMessage(), "doesn't exist") !== false) {
                                $stmt_consecuencia = $pdo->prepare("INSERT INTO bowtie_consecuencias (bowtie_id, descripcion, orden, activo) VALUES (?, ?, ?, 1)");
                                $stmt_consecuencia->execute([$bowtie_id, trim($consecuencia['descripcion']), $index]);
                            } else {
                                throw $e2;
                            }
                        }
                    } else {
                        throw $e;
                    }
                }
                $consecuencia_id = $pdo->lastInsertId();
                $consecuencias_map[$codigo_consecuencia] = $consecuencia_id;
                
                // Insertar controles mitigadores asociados directamente a esta consecuencia (legacy)
                if (isset($consecuencia['controles_mitigadores']) && is_array($consecuencia['controles_mitigadores'])) {
                    foreach ($consecuencia['controles_mitigadores'] as $cm_index => $control) {
                        if (!empty(trim($control['descripcion'] ?? ''))) {
                            $codigo_cm = isset($control['codigo']) && !empty(trim($control['codigo'])) ? trim($control['codigo']) : ('CCM' . ($cm_index + 1));
                            try {
                                $stmt_cm = $pdo->prepare("INSERT INTO bowtie_controles_mitigadores (bowtie_id, consecuencia_id, codigo, descripcion, orden, activo) VALUES (?, ?, ?, ?, ?, 1)");
                                $stmt_cm->execute([$bowtie_id, $consecuencia_id, $codigo_cm, trim($control['descripcion']), $cm_index]);
                            } catch (PDOException $e) {
                                // Si la columna codigo no existe, insertar sin código
                                if (strpos($e->getMessage(), "Unknown column 'codigo'") !== false || 
                                    strpos($e->getMessage(), "doesn't exist") !== false) {
                                    $stmt_cm = $pdo->prepare("INSERT INTO bowtie_controles_mitigadores (bowtie_id, consecuencia_id, descripcion, orden, activo) VALUES (?, ?, ?, ?, 1)");
                                    $stmt_cm->execute([$bowtie_id, $consecuencia_id, trim($control['descripcion']), $cm_index]);
                                } else {
                                    throw $e;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Tercero: Insertar controles preventivos generales y sus relaciones
        foreach ($controles_preventivos as $index => $control) {
            if (!empty(trim($control['descripcion'] ?? '')) && empty($control['causa_id'] ?? null)) {
                // Validar y generar código único
                $codigo_propuesto = isset($control['codigo']) && !empty(trim($control['codigo'])) ? trim($control['codigo']) : null;
                
                if ($codigo_propuesto) {
                    // Verificar si el código ya está en uso
                    if (isset($codigos_preventivos_usados[$codigo_propuesto])) {
                        // Código duplicado, generar uno nuevo
                        $codigo_cp = $generarSiguienteCodigoPreventivo($codigos_preventivos_usados);
                        error_log("Código de control preventivo duplicado '$codigo_propuesto' detectado, usando '$codigo_cp' en su lugar");
                    } else {
                        $codigo_cp = $codigo_propuesto;
                    }
                } else {
                    // Generar código automáticamente
                    $codigo_cp = $generarSiguienteCodigoPreventivo($codigos_preventivos_usados);
                }
                
                // Marcar código como usado
                $codigos_preventivos_usados[$codigo_cp] = true;
                
                $criticidad = isset($control['criticidad']) && !empty(trim($control['criticidad'])) ? trim($control['criticidad']) : null;
                $jerarquia = isset($control['jerarquia']) && !empty(trim($control['jerarquia'])) ? trim($control['jerarquia']) : null;
                
                // CRÍTICO: Verificar si el control tiene ID para actualizarlo en lugar de insertar uno nuevo
                $control_preventivo_id = null;
                if (!empty($control['id']) && is_numeric($control['id'])) {
                    // El control tiene ID, intentar actualizarlo
                    try {
                        // Intentar actualizar con todos los campos nuevos (si las columnas existen)
                        $stmt_cp = $pdo->prepare("UPDATE bowtie_controles_preventivos SET bowtie_id = ?, causa_id = NULL, codigo = ?, descripcion = ?, criticidad = ?, jerarquia = ?, orden = ?, activo = 1 WHERE id = ?");
                        $stmt_cp->execute([$bowtie_id, $codigo_cp, trim($control['descripcion']), $criticidad, $jerarquia, $index, $control['id']]);
                        if ($stmt_cp->rowCount() > 0) {
                            $control_preventivo_id = $control['id'];
                            error_log("Control preventivo actualizado: ID={$control_preventivo_id}, codigo={$codigo_cp}");
                        } else {
                            // El ID no existe, insertar como nuevo
                            throw new PDOException("Control ID {$control['id']} no encontrado, insertando como nuevo");
                        }
                    } catch (PDOException $e) {
                        // Si alguna columna no existe o el ID no existe, intentar actualizar sin los campos nuevos
                        if (strpos($e->getMessage(), "Unknown column") !== false || 
                            strpos($e->getMessage(), "doesn't exist") !== false ||
                            strpos($e->getMessage(), "no encontrado") !== false) {
                            try {
                                // Intentar actualizar con código pero sin campos nuevos
                                $stmt_cp = $pdo->prepare("UPDATE bowtie_controles_preventivos SET bowtie_id = ?, causa_id = NULL, codigo = ?, descripcion = ?, orden = ?, activo = 1 WHERE id = ?");
                                $stmt_cp->execute([$bowtie_id, $codigo_cp, trim($control['descripcion']), $index, $control['id']]);
                                if ($stmt_cp->rowCount() > 0) {
                                    $control_preventivo_id = $control['id'];
                                    error_log("Control preventivo actualizado (sin campos nuevos): ID={$control_preventivo_id}, codigo={$codigo_cp}");
                                } else {
                                    throw new PDOException("Control ID {$control['id']} no encontrado, insertando como nuevo");
                                }
                            } catch (PDOException $e2) {
                                // Si la columna codigo tampoco existe o el ID no existe, insertar como nuevo
                                if (strpos($e2->getMessage(), "Unknown column 'codigo'") !== false || 
                                    strpos($e2->getMessage(), "doesn't exist") !== false ||
                                    strpos($e2->getMessage(), "no encontrado") !== false) {
                                    // Insertar como nuevo control
                                    $control_preventivo_id = null;
                                } else {
                                    throw $e2;
                                }
                            }
                        } else {
                            throw $e;
                        }
                    }
                }
                
                // Si no se actualizó (no tenía ID o el ID no existía), insertar como nuevo
                if (!$control_preventivo_id) {
                try {
                    // Intentar insertar con todos los campos nuevos (si las columnas existen)
                    $stmt_cp = $pdo->prepare("INSERT INTO bowtie_controles_preventivos (bowtie_id, causa_id, codigo, descripcion, criticidad, jerarquia, orden, activo) VALUES (?, NULL, ?, ?, ?, ?, ?, 1)");
                    $stmt_cp->execute([$bowtie_id, $codigo_cp, trim($control['descripcion']), $criticidad, $jerarquia, $index]);
                        $control_preventivo_id = $pdo->lastInsertId();
                        error_log("Nuevo control preventivo insertado: ID={$control_preventivo_id}, codigo={$codigo_cp}");
                } catch (PDOException $e) {
                    // Si alguna columna no existe, intentar insertar sin los campos nuevos
                    if (strpos($e->getMessage(), "Unknown column") !== false || 
                        strpos($e->getMessage(), "doesn't exist") !== false) {
                        try {
                            // Intentar con código pero sin campos nuevos
                            $stmt_cp = $pdo->prepare("INSERT INTO bowtie_controles_preventivos (bowtie_id, causa_id, codigo, descripcion, orden, activo) VALUES (?, NULL, ?, ?, ?, 1)");
                            $stmt_cp->execute([$bowtie_id, $codigo_cp, trim($control['descripcion']), $index]);
                                $control_preventivo_id = $pdo->lastInsertId();
                                error_log("Nuevo control preventivo insertado (sin campos nuevos): ID={$control_preventivo_id}, codigo={$codigo_cp}");
                        } catch (PDOException $e2) {
                            // Si la columna codigo tampoco existe, insertar solo descripción
                            if (strpos($e2->getMessage(), "Unknown column 'codigo'") !== false || 
                                strpos($e2->getMessage(), "doesn't exist") !== false) {
                                $stmt_cp = $pdo->prepare("INSERT INTO bowtie_controles_preventivos (bowtie_id, causa_id, descripcion, orden, activo) VALUES (?, NULL, ?, ?, 1)");
                                $stmt_cp->execute([$bowtie_id, trim($control['descripcion']), $index]);
                                    $control_preventivo_id = $pdo->lastInsertId();
                                    error_log("Nuevo control preventivo insertado (sin codigo): ID={$control_preventivo_id}");
                            } else {
                                throw $e2;
                            }
                        }
                    } else {
                        throw $e;
                    }
                }
                }
                
                // Insertar relaciones con causas (muchos a muchos) - solo si la tabla existe
                if (isset($control['causas_asociadas']) && is_array($control['causas_asociadas'])) {
                    foreach ($control['causas_asociadas'] as $causa_asoc) {
                        $codigo_causa_asoc = is_string($causa_asoc) ? trim($causa_asoc) : (isset($causa_asoc['codigo']) ? trim($causa_asoc['codigo']) : null);
                        if ($codigo_causa_asoc && isset($causas_map[$codigo_causa_asoc])) {
                            try {
                                $stmt_rel = $pdo->prepare("INSERT INTO bowtie_control_preventivo_causas (control_preventivo_id, causa_id) VALUES (?, ?)");
                                $stmt_rel->execute([$control_preventivo_id, $causas_map[$codigo_causa_asoc]]);
                            } catch (PDOException $e) {
                                // Ignorar si la tabla no existe o si ya existe la relación
                                $error_msg = $e->getMessage();
                                if (strpos($error_msg, "doesn't exist") === false && 
                                    strpos($error_msg, 'Base table or view not found') === false &&
                                    strpos($error_msg, 'Duplicate entry') === false) {
                                    // Solo lanzar error si es otro tipo de error
                                    throw $e;
                                }
                            }
                        }
                    }
                }
                
                // Insertar dimensiones, preguntas y evidencias para este control preventivo
                if (isset($control['dimensiones']) && is_array($control['dimensiones'])) {
                    foreach ($control['dimensiones'] as $dim_index => $dimension) {
                        if (!empty(trim($dimension['nombre'] ?? ''))) {
                            try {
                                // Si la dimensión tiene ID, intentar actualizar; sino insertar nueva
                                $dimension_id = null;
                                if (!empty($dimension['id']) && is_numeric($dimension['id'])) {
                                    // Actualizar dimensión existente y reactivarla
                                    $stmt_dim = $pdo->prepare("UPDATE bowtie_dimensiones SET control_preventivo_id = ?, nombre = ?, orden = ?, activo = 1 WHERE id = ?");
                                    $stmt_dim->execute([$control_preventivo_id, trim($dimension['nombre']), $dim_index, $dimension['id']]);
                                    // Verificar si se actualizó correctamente
                                    if ($stmt_dim->rowCount() > 0) {
                                        $dimension_id = $dimension['id'];
                                        error_log("Dimensión preventivo actualizada: ID={$dimension_id}, control_preventivo_id={$control_preventivo_id}, nombre=" . substr(trim($dimension['nombre']), 0, 50));
                                    } else {
                                        // Si no se actualizó (no existe), insertar como nueva
                                $stmt_dim = $pdo->prepare("INSERT INTO bowtie_dimensiones (control_preventivo_id, control_mitigador_id, nombre, orden, activo) VALUES (?, NULL, ?, ?, 1)");
                                $stmt_dim->execute([$control_preventivo_id, trim($dimension['nombre']), $dim_index]);
                                $dimension_id = $pdo->lastInsertId();
                                        error_log("Dimensión preventivo insertada (ID original {$dimension['id']} no encontrado): nuevo ID={$dimension_id}, nombre=" . substr(trim($dimension['nombre']), 0, 50));
                                    }
                                } else {
                                    // Insertar nueva dimensión
                                    $stmt_dim = $pdo->prepare("INSERT INTO bowtie_dimensiones (control_preventivo_id, control_mitigador_id, nombre, orden, activo) VALUES (?, NULL, ?, ?, 1)");
                                    $stmt_dim->execute([$control_preventivo_id, trim($dimension['nombre']), $dim_index]);
                                    $dimension_id = $pdo->lastInsertId();
                                    error_log("Nueva dimensión preventivo insertada: ID={$dimension_id}, nombre=" . substr(trim($dimension['nombre']), 0, 50));
                                }
                                
                                // Insertar preguntas para esta dimensión (preventivos)
                                if (isset($dimension['preguntas']) && is_array($dimension['preguntas'])) {
                                    foreach ($dimension['preguntas'] as $preg_index => $pregunta) {
                                        if (!empty(trim($pregunta['texto'] ?? ''))) {
                                            // Mantener evidencia como texto para compatibilidad (se puede eliminar después)
                                            $evidencia = isset($pregunta['evidencia']) && !empty(trim($pregunta['evidencia'])) ? trim($pregunta['evidencia']) : null;
                                            
                                            // Insertar o actualizar pregunta
                                            $pregunta_id = null;
                                            if (!empty($pregunta['id']) && is_numeric($pregunta['id'])) {
                                                // CRÍTICO: Actualizar también dimension_id para asociar la pregunta a la nueva dimensión activa
                                                // Y reactivar la pregunta si estaba desactivada
                                                $stmt_preg = $pdo->prepare("UPDATE bowtie_preguntas SET dimension_id = ?, texto = ?, evidencia = ?, orden = ?, activo = 1 WHERE id = ?");
                                                $stmt_preg->execute([$dimension_id, trim($pregunta['texto']), $evidencia, $preg_index, $pregunta['id']]);
                                                if ($stmt_preg->rowCount() > 0) {
                                                    $pregunta_id = $pregunta['id'];
                                                    error_log("Pregunta preventivo actualizada: ID={$pregunta_id}, dimension_id={$dimension_id}, texto=" . substr(trim($pregunta['texto']), 0, 50));
                                                } else {
                                                    // El ID no existe, insertar como nueva
                                            $stmt_preg = $pdo->prepare("INSERT INTO bowtie_preguntas (dimension_id, texto, evidencia, orden, activo) VALUES (?, ?, ?, ?, 1)");
                                            $stmt_preg->execute([$dimension_id, trim($pregunta['texto']), $evidencia, $preg_index]);
                                                    $pregunta_id = $pdo->lastInsertId();
                                                    error_log("Pregunta preventivo insertada (ID original {$pregunta['id']} no encontrado): nuevo ID={$pregunta_id}, texto=" . substr(trim($pregunta['texto']), 0, 50));
                                                }
                                            } else {
                                                // Nueva pregunta sin ID
                                                $stmt_preg = $pdo->prepare("INSERT INTO bowtie_preguntas (dimension_id, texto, evidencia, orden, activo) VALUES (?, ?, ?, ?, 1)");
                                                $stmt_preg->execute([$dimension_id, trim($pregunta['texto']), $evidencia, $preg_index]);
                                                $pregunta_id = $pdo->lastInsertId();
                                                error_log("Nueva pregunta preventivo insertada: ID={$pregunta_id}, texto=" . substr(trim($pregunta['texto']), 0, 50));
                                            }
                                            
                                            // Manejar evidencias individuales (nuevo formato)
                                            if (isset($pregunta['evidencias']) && is_array($pregunta['evidencias'])) {
                                                try {
                                                    // Obtener TODAS las evidencias activas actuales de esta pregunta
                                                    $stmt_existentes = $pdo->prepare("SELECT id FROM bowtie_evidencias WHERE pregunta_id = ? AND activo = 1");
                                                    $stmt_existentes->execute([$pregunta_id]);
                                                    $ids_existentes_bd = $stmt_existentes->fetchAll(PDO::FETCH_COLUMN);
                                                    
                                                    error_log("PREVENTIVO - Pregunta ID {$pregunta_id}: Evidencias recibidas del frontend: " . count($pregunta['evidencias']) . " (BD tiene " . count($ids_existentes_bd) . " activas)");
                                                    
                                                    // IDs de evidencias que se procesan (actualizadas o insertadas)
                                                    $ids_evidencias_procesadas = [];
                                                    
                                                    // Insertar o actualizar evidencias individuales
                                                    foreach ($pregunta['evidencias'] as $evid_index => $evidencia_obj) {
                                                        $evidencia_texto = is_array($evidencia_obj) ? ($evidencia_obj['texto'] ?? '') : (string)$evidencia_obj;
                                                        
                                                        // CRÍTICO: Solo procesar evidencias con texto no vacío
                                                        if (!empty(trim($evidencia_texto))) {
                                                            $evidencia_id = is_array($evidencia_obj) && isset($evidencia_obj['id']) ? $evidencia_obj['id'] : null;
                                                            $evidencia_id_real = null;
                                                            
                                                            error_log("PREVENTIVO - Procesando evidencia: ID recibido={$evidencia_id}, texto=" . substr(trim($evidencia_texto), 0, 50));
                                                            
                                                            // Si el ID existe y no es temporal, intentar actualizar
                                                            if ($evidencia_id && !preg_match('/^temp_/', (string)$evidencia_id)) {
                                                                $evidencia_id_int = (int)$evidencia_id;
                                                                
                                                                // Verificar si existe en BD para esta pregunta (activa o inactiva)
                                                                $stmt_check = $pdo->prepare("SELECT id FROM bowtie_evidencias WHERE id = ? AND pregunta_id = ?");
                                                                $stmt_check->execute([$evidencia_id_int, $pregunta_id]);
                                                                $existe = $stmt_check->fetch();
                                                                
                                                                if ($existe) {
                                                                    // Actualizar evidencia existente (reactivar si estaba desactivada)
                                                                    $stmt_evid = $pdo->prepare("UPDATE bowtie_evidencias SET texto = ?, orden = ?, activo = 1 WHERE id = ? AND pregunta_id = ?");
                                                                    $stmt_evid->execute([trim($evidencia_texto), $evid_index, $evidencia_id_int, $pregunta_id]);
                                                                    $evidencia_id_real = $evidencia_id_int;
                                                                    error_log("PREVENTIVO - Evidencia actualizada: ID={$evidencia_id_real}");
                                                                } else {
                                                                    // El ID no existe para esta pregunta, insertar como nueva
                                                                    $stmt_evid = $pdo->prepare("INSERT INTO bowtie_evidencias (pregunta_id, texto, orden, activo) VALUES (?, ?, ?, 1)");
                                                                    $stmt_evid->execute([$pregunta_id, trim($evidencia_texto), $evid_index]);
                                                                    $evidencia_id_real = $pdo->lastInsertId();
                                                                    error_log("PREVENTIVO - Nueva evidencia insertada: ID={$evidencia_id_real} (ID recibido {$evidencia_id} no existía)");
                                                                }
                                                            } else {
                                                                // Nueva evidencia (ID temporal o sin ID) - insertar como nueva
                                                                $stmt_evid = $pdo->prepare("INSERT INTO bowtie_evidencias (pregunta_id, texto, orden, activo) VALUES (?, ?, ?, 1)");
                                                                $stmt_evid->execute([$pregunta_id, trim($evidencia_texto), $evid_index]);
                                                                $evidencia_id_real = $pdo->lastInsertId();
                                                                error_log("PREVENTIVO - Nueva evidencia insertada: ID={$evidencia_id_real} (sin ID o temporal)");
                                                            }
                                                            
                                                            // Agregar el ID real a la lista de procesadas
                                                            if ($evidencia_id_real) {
                                                                $ids_evidencias_procesadas[] = $evidencia_id_real;
                                                            }
                                                        } else {
                                                            error_log("PREVENTIVO - Evidencia ignorada: texto vacío en índice {$evid_index}");
                                                        }
                                                    }
                                                    
                                                    error_log("PREVENTIVO - Pregunta ID {$pregunta_id}: IDs procesadas=" . implode(',', $ids_evidencias_procesadas) . ", IDs existentes BD=" . implode(',', $ids_existentes_bd));
                                                    
                                                    // CRÍTICO: Desactivar evidencias que están en BD pero NO en la lista de procesadas
                                                    // IMPORTANTE: Si el array recibido está vacío (count = 0), NO hacer nada para preservar evidencias existentes
                                                    // Si el array tiene elementos pero ninguna fue procesada (todas vacías), desactivar todas las existentes
                                                    if (count($pregunta['evidencias']) > 0) {
                                                        // Hay elementos en el array: comparar IDs procesadas con existentes
                                                        if (!empty($ids_evidencias_procesadas)) {
                                                            // Hay evidencias procesadas: desactivar solo las que no están en la lista
                                                            $ids_para_mantener = array_unique($ids_evidencias_procesadas);
                                                            $ids_para_desactivar = array_diff($ids_existentes_bd, $ids_para_mantener);
                                                            
                                                            if (!empty($ids_para_desactivar)) {
                                                                $placeholders = implode(',', array_fill(0, count($ids_para_desactivar), '?'));
                                                                $stmt_deactivate = $pdo->prepare("UPDATE bowtie_evidencias SET activo = 0 WHERE pregunta_id = ? AND id IN ($placeholders)");
                                                                $params = array_merge([$pregunta_id], $ids_para_desactivar);
                                                                $stmt_deactivate->execute($params);
                                                                error_log("PREVENTIVO - Pregunta ID {$pregunta_id}: Desactivadas evidencias: " . implode(',', $ids_para_desactivar));
                                                            } else {
                                                                error_log("PREVENTIVO - Pregunta ID {$pregunta_id}: No hay evidencias para desactivar (todas están en la lista de procesadas)");
                                                            }
                                                        } else {
                                                            // Array con elementos pero ninguna fue procesada (todas tienen texto vacío)
                                                            // Esto significa que el usuario eliminó todas las evidencias
                                                            if (!empty($ids_existentes_bd)) {
                                                                $placeholders = implode(',', array_fill(0, count($ids_existentes_bd), '?'));
                                                                $stmt_deactivate = $pdo->prepare("UPDATE bowtie_evidencias SET activo = 0 WHERE pregunta_id = ? AND id IN ($placeholders)");
                                                                $params = array_merge([$pregunta_id], $ids_existentes_bd);
                                                                $stmt_deactivate->execute($params);
                                                                error_log("PREVENTIVO - Pregunta ID {$pregunta_id}: Todas las evidencias recibidas están vacías, desactivando todas las existentes: " . implode(',', $ids_existentes_bd));
                                                            }
                                                        }
                                                    } else {
                                                        // Array vacío: no hacer nada, mantener todas las evidencias existentes
                                                        // Esto preserva las evidencias si el frontend no las envía en el request
                                                        error_log("PREVENTIVO - Pregunta ID {$pregunta_id}: Array de evidencias vacío, manteniendo todas las evidencias existentes en BD");
                                                    }
                                                } catch (PDOException $e) {
                                                    error_log("Error guardando evidencias individuales (preventivos): " . $e->getMessage());
                                                }
                                            } else {
                                                error_log("PREVENTIVO - Pregunta ID {$pregunta_id}: No tiene campo 'evidencias' o no es array, manteniendo evidencias existentes");
                                            }
                                        }
                                    }
                                }
                            } catch (PDOException $e) {
                                // Si las tablas no existen, simplemente continuar
                                error_log("Error insertando dimensiones para control preventivo: " . $e->getMessage());
                            }
                        }
                    }
                }
            }
        }
        
        // Cuarto: Obtener códigos de controles mitigadores existentes para evitar duplicados
        $stmt_codigos_mitigadores = $pdo->prepare("SELECT codigo FROM bowtie_controles_mitigadores WHERE bowtie_id = ? AND activo = 1 AND codigo IS NOT NULL");
        $stmt_codigos_mitigadores->execute([$bowtie_id]);
        $codigos_mitigadores_existentes = $stmt_codigos_mitigadores->fetchAll(PDO::FETCH_COLUMN);
        $codigos_mitigadores_usados = array_flip($codigos_mitigadores_existentes);
        
        // Función para generar el siguiente código de control mitigador disponible
        $generarSiguienteCodigoMitigador = function($codigos_usados) {
            $contador = 1;
            do {
                $codigo = 'CCM' . $contador;
                $contador++;
            } while (isset($codigos_usados[$codigo]));
            return $codigo;
        };
        
        // Cuarto: Insertar controles mitigadores generales y sus relaciones
        foreach ($controles_mitigadores as $index => $control) {
            if (!empty(trim($control['descripcion'] ?? '')) && empty($control['consecuencia_id'] ?? null)) {
                // Validar y generar código único
                $codigo_propuesto = isset($control['codigo']) && !empty(trim($control['codigo'])) ? trim($control['codigo']) : null;
                
                if ($codigo_propuesto) {
                    // Verificar si el código ya está en uso
                    if (isset($codigos_mitigadores_usados[$codigo_propuesto])) {
                        // Código duplicado, generar uno nuevo
                        $codigo_cm = $generarSiguienteCodigoMitigador($codigos_mitigadores_usados);
                        error_log("Código de control mitigador duplicado '$codigo_propuesto' detectado, usando '$codigo_cm' en su lugar");
                    } else {
                        $codigo_cm = $codigo_propuesto;
                    }
                } else {
                    // Generar código automáticamente
                    $codigo_cm = $generarSiguienteCodigoMitigador($codigos_mitigadores_usados);
                }
                
                // Marcar código como usado
                $codigos_mitigadores_usados[$codigo_cm] = true;
                
                $criticidad = isset($control['criticidad']) && !empty(trim($control['criticidad'])) ? trim($control['criticidad']) : null;
                $jerarquia = isset($control['jerarquia']) && !empty(trim($control['jerarquia'])) ? trim($control['jerarquia']) : null;
                
                try {
                    // Intentar insertar con todos los campos nuevos (si las columnas existen)
                    $stmt_cm = $pdo->prepare("INSERT INTO bowtie_controles_mitigadores (bowtie_id, consecuencia_id, codigo, descripcion, criticidad, jerarquia, orden, activo) VALUES (?, NULL, ?, ?, ?, ?, ?, 1)");
                    $stmt_cm->execute([$bowtie_id, $codigo_cm, trim($control['descripcion']), $criticidad, $jerarquia, $index]);
                } catch (PDOException $e) {
                    // Si alguna columna no existe, intentar insertar sin los campos nuevos
                    if (strpos($e->getMessage(), "Unknown column") !== false || 
                        strpos($e->getMessage(), "doesn't exist") !== false) {
                        try {
                            // Intentar con código pero sin campos nuevos
                            $stmt_cm = $pdo->prepare("INSERT INTO bowtie_controles_mitigadores (bowtie_id, consecuencia_id, codigo, descripcion, orden, activo) VALUES (?, NULL, ?, ?, ?, 1)");
                            $stmt_cm->execute([$bowtie_id, $codigo_cm, trim($control['descripcion']), $index]);
                        } catch (PDOException $e2) {
                            // Si la columna codigo tampoco existe, insertar solo descripción
                            if (strpos($e2->getMessage(), "Unknown column 'codigo'") !== false || 
                                strpos($e2->getMessage(), "doesn't exist") !== false) {
                                $stmt_cm = $pdo->prepare("INSERT INTO bowtie_controles_mitigadores (bowtie_id, consecuencia_id, descripcion, orden, activo) VALUES (?, NULL, ?, ?, 1)");
                                $stmt_cm->execute([$bowtie_id, trim($control['descripcion']), $index]);
                            } else {
                                throw $e2;
                            }
                        }
                    } else {
                        throw $e;
                    }
                }
                $control_mitigador_id = $pdo->lastInsertId();
                
                // Insertar relaciones con consecuencias (muchos a muchos) - solo si la tabla existe
                if (isset($control['consecuencias_asociadas']) && is_array($control['consecuencias_asociadas'])) {
                    foreach ($control['consecuencias_asociadas'] as $consecuencia_asoc) {
                        $codigo_consecuencia_asoc = is_string($consecuencia_asoc) ? trim($consecuencia_asoc) : (isset($consecuencia_asoc['codigo']) ? trim($consecuencia_asoc['codigo']) : null);
                        if ($codigo_consecuencia_asoc && isset($consecuencias_map[$codigo_consecuencia_asoc])) {
                            try {
                                $stmt_rel = $pdo->prepare("INSERT INTO bowtie_control_mitigador_consecuencias (control_mitigador_id, consecuencia_id) VALUES (?, ?)");
                                $stmt_rel->execute([$control_mitigador_id, $consecuencias_map[$codigo_consecuencia_asoc]]);
                            } catch (PDOException $e) {
                                // Ignorar si la tabla no existe o si ya existe la relación
                                $error_msg = $e->getMessage();
                                if (strpos($error_msg, "doesn't exist") === false && 
                                    strpos($error_msg, 'Base table or view not found') === false &&
                                    strpos($error_msg, 'Duplicate entry') === false) {
                                    // Solo lanzar error si es otro tipo de error
                                    throw $e;
                                }
                            }
                        }
                    }
                }
                
                // Insertar dimensiones, preguntas y evidencias para este control mitigador
                if (isset($control['dimensiones']) && is_array($control['dimensiones'])) {
                    foreach ($control['dimensiones'] as $dim_index => $dimension) {
                        if (!empty(trim($dimension['nombre'] ?? ''))) {
                            try {
                                $dimension_id = null;
                                // Si la dimensión tiene ID, intentar actualizar; sino insertar nueva
                                if (!empty($dimension['id'])) {
                                    // Actualizar dimensión existente
                                    $stmt_dim = $pdo->prepare("UPDATE bowtie_dimensiones SET nombre = ?, orden = ?, activo = 1 WHERE id = ? AND control_mitigador_id = ?");
                                    $stmt_dim->execute([trim($dimension['nombre']), $dim_index, $dimension['id'], $control_mitigador_id]);
                                    // Verificar si se actualizó correctamente
                                    if ($stmt_dim->rowCount() > 0) {
                                        $dimension_id = $dimension['id'];
                                        error_log("Dimensión mitigador actualizada: ID={$dimension_id}, nombre=" . substr(trim($dimension['nombre']), 0, 50));
                                    } else {
                                        // Si no se actualizó (no existe o pertenece a otro control), insertar como nueva
                                $stmt_dim = $pdo->prepare("INSERT INTO bowtie_dimensiones (control_preventivo_id, control_mitigador_id, nombre, orden, activo) VALUES (NULL, ?, ?, ?, 1)");
                                $stmt_dim->execute([$control_mitigador_id, trim($dimension['nombre']), $dim_index]);
                                $dimension_id = $pdo->lastInsertId();
                                        error_log("Dimensión mitigador insertada (ID original {$dimension['id']} no encontrado): nuevo ID={$dimension_id}, nombre=" . substr(trim($dimension['nombre']), 0, 50));
                                    }
                                } else {
                                    // Insertar nueva dimensión
                                    $stmt_dim = $pdo->prepare("INSERT INTO bowtie_dimensiones (control_preventivo_id, control_mitigador_id, nombre, orden, activo) VALUES (NULL, ?, ?, ?, 1)");
                                    $stmt_dim->execute([$control_mitigador_id, trim($dimension['nombre']), $dim_index]);
                                    $dimension_id = $pdo->lastInsertId();
                                    error_log("Nueva dimensión mitigador insertada: ID={$dimension_id}, nombre=" . substr(trim($dimension['nombre']), 0, 50));
                                }
                                
                                // Insertar preguntas para esta dimensión (mitigadores)
                                if (isset($dimension['preguntas']) && is_array($dimension['preguntas'])) {
                                    foreach ($dimension['preguntas'] as $preg_index => $pregunta) {
                                        if (!empty(trim($pregunta['texto'] ?? ''))) {
                                            // Mantener evidencia como texto para compatibilidad (se puede eliminar después)
                                            $evidencia = isset($pregunta['evidencia']) && !empty(trim($pregunta['evidencia'])) ? trim($pregunta['evidencia']) : null;
                                            
                                            // Insertar o actualizar pregunta
                                            if (!empty($pregunta['id'])) {
                                                // CRÍTICO: Actualizar también dimension_id para asociar la pregunta a la nueva dimensión activa
                                                $stmt_preg = $pdo->prepare("UPDATE bowtie_preguntas SET dimension_id = ?, texto = ?, evidencia = ?, orden = ? WHERE id = ?");
                                                $stmt_preg->execute([$dimension_id, trim($pregunta['texto']), $evidencia, $preg_index, $pregunta['id']]);
                                                $pregunta_id = $pregunta['id'];
                                                error_log("Pregunta preventivo actualizada: ID={$pregunta_id}, dimension_id={$dimension_id} (actualizada)");
                                            } else {
                                            $stmt_preg = $pdo->prepare("INSERT INTO bowtie_preguntas (dimension_id, texto, evidencia, orden, activo) VALUES (?, ?, ?, ?, 1)");
                                            $stmt_preg->execute([$dimension_id, trim($pregunta['texto']), $evidencia, $preg_index]);
                                                $pregunta_id = $pdo->lastInsertId();
                                            }
                                            
                                            // Manejar evidencias individuales (nuevo formato)
                                            if (isset($pregunta['evidencias']) && is_array($pregunta['evidencias'])) {
                                                try {
                                                    // Obtener TODAS las evidencias activas actuales de esta pregunta
                                                    $stmt_existentes = $pdo->prepare("SELECT id FROM bowtie_evidencias WHERE pregunta_id = ? AND activo = 1");
                                                    $stmt_existentes->execute([$pregunta_id]);
                                                    $ids_existentes_bd = $stmt_existentes->fetchAll(PDO::FETCH_COLUMN);
                                                    
                                                    error_log("MITIGADOR - Pregunta ID {$pregunta_id}: Evidencias recibidas del frontend: " . count($pregunta['evidencias']) . " (BD tiene " . count($ids_existentes_bd) . " activas)");
                                                    
                                                    // IDs de evidencias que se procesan (actualizadas o insertadas)
                                                    $ids_evidencias_procesadas = [];
                                                    
                                                    // Insertar o actualizar evidencias individuales
                                                    foreach ($pregunta['evidencias'] as $evid_index => $evidencia_obj) {
                                                        $evidencia_texto = is_array($evidencia_obj) ? ($evidencia_obj['texto'] ?? '') : (string)$evidencia_obj;
                                                        
                                                        // CRÍTICO: Solo procesar evidencias con texto no vacío
                                                        if (!empty(trim($evidencia_texto))) {
                                                            $evidencia_id = is_array($evidencia_obj) && isset($evidencia_obj['id']) ? $evidencia_obj['id'] : null;
                                                            $evidencia_id_real = null;
                                                            
                                                            error_log("MITIGADOR - Procesando evidencia: ID recibido={$evidencia_id}, texto=" . substr(trim($evidencia_texto), 0, 50));
                                                            
                                                            // Si el ID existe y no es temporal, intentar actualizar
                                                            if ($evidencia_id && !preg_match('/^temp_/', (string)$evidencia_id)) {
                                                                $evidencia_id_int = (int)$evidencia_id;
                                                                
                                                                // Verificar si existe en BD para esta pregunta (activa o inactiva)
                                                                $stmt_check = $pdo->prepare("SELECT id FROM bowtie_evidencias WHERE id = ? AND pregunta_id = ?");
                                                                $stmt_check->execute([$evidencia_id_int, $pregunta_id]);
                                                                $existe = $stmt_check->fetch();
                                                                
                                                                if ($existe) {
                                                                    // Actualizar evidencia existente (reactivar si estaba desactivada)
                                                                    $stmt_evid = $pdo->prepare("UPDATE bowtie_evidencias SET texto = ?, orden = ?, activo = 1 WHERE id = ? AND pregunta_id = ?");
                                                                    $stmt_evid->execute([trim($evidencia_texto), $evid_index, $evidencia_id_int, $pregunta_id]);
                                                                    $evidencia_id_real = $evidencia_id_int;
                                                                    error_log("MITIGADOR - Evidencia actualizada: ID={$evidencia_id_real}");
                                                                } else {
                                                                    // El ID no existe para esta pregunta, insertar como nueva
                                                                    $stmt_evid = $pdo->prepare("INSERT INTO bowtie_evidencias (pregunta_id, texto, orden, activo) VALUES (?, ?, ?, 1)");
                                                                    $stmt_evid->execute([$pregunta_id, trim($evidencia_texto), $evid_index]);
                                                                    $evidencia_id_real = $pdo->lastInsertId();
                                                                    error_log("MITIGADOR - Nueva evidencia insertada: ID={$evidencia_id_real} (ID recibido {$evidencia_id} no existía)");
                                                                }
                                                            } else {
                                                                // Nueva evidencia (ID temporal o sin ID) - insertar como nueva
                                                                $stmt_evid = $pdo->prepare("INSERT INTO bowtie_evidencias (pregunta_id, texto, orden, activo) VALUES (?, ?, ?, 1)");
                                                                $stmt_evid->execute([$pregunta_id, trim($evidencia_texto), $evid_index]);
                                                                $evidencia_id_real = $pdo->lastInsertId();
                                                                error_log("MITIGADOR - Nueva evidencia insertada: ID={$evidencia_id_real} (sin ID o temporal)");
                                                            }
                                                            
                                                            // Agregar el ID real a la lista de procesadas
                                                            if ($evidencia_id_real) {
                                                                $ids_evidencias_procesadas[] = $evidencia_id_real;
                                                            }
                                                        } else {
                                                            error_log("MITIGADOR - Evidencia ignorada: texto vacío en índice {$evid_index}");
                                                        }
                                                    }
                                                    
                                                    error_log("MITIGADOR - Pregunta ID {$pregunta_id}: IDs procesadas=" . implode(',', $ids_evidencias_procesadas) . ", IDs existentes BD=" . implode(',', $ids_existentes_bd));
                                                    
                                                    // CRÍTICO: Desactivar evidencias que están en BD pero NO en la lista de procesadas
                                                    // IMPORTANTE: Si el array recibido está vacío (count = 0), NO hacer nada para preservar evidencias existentes
                                                    // Si el array tiene elementos pero ninguna fue procesada (todas vacías), desactivar todas las existentes
                                                    if (count($pregunta['evidencias']) > 0) {
                                                        // Hay elementos en el array: comparar IDs procesadas con existentes
                                                        if (!empty($ids_evidencias_procesadas)) {
                                                            // Hay evidencias procesadas: desactivar solo las que no están en la lista
                                                            $ids_para_mantener = array_unique($ids_evidencias_procesadas);
                                                            $ids_para_desactivar = array_diff($ids_existentes_bd, $ids_para_mantener);
                                                            
                                                            if (!empty($ids_para_desactivar)) {
                                                                $placeholders = implode(',', array_fill(0, count($ids_para_desactivar), '?'));
                                                                $stmt_deactivate = $pdo->prepare("UPDATE bowtie_evidencias SET activo = 0 WHERE pregunta_id = ? AND id IN ($placeholders)");
                                                                $params = array_merge([$pregunta_id], $ids_para_desactivar);
                                                                $stmt_deactivate->execute($params);
                                                                error_log("MITIGADOR - Pregunta ID {$pregunta_id}: Desactivadas evidencias: " . implode(',', $ids_para_desactivar));
                                                            } else {
                                                                error_log("MITIGADOR - Pregunta ID {$pregunta_id}: No hay evidencias para desactivar (todas están en la lista de procesadas)");
                                                            }
                                                        } else {
                                                            // Array con elementos pero ninguna fue procesada (todas tienen texto vacío)
                                                            // Esto significa que el usuario eliminó todas las evidencias
                                                            if (!empty($ids_existentes_bd)) {
                                                                $placeholders = implode(',', array_fill(0, count($ids_existentes_bd), '?'));
                                                                $stmt_deactivate = $pdo->prepare("UPDATE bowtie_evidencias SET activo = 0 WHERE pregunta_id = ? AND id IN ($placeholders)");
                                                                $params = array_merge([$pregunta_id], $ids_existentes_bd);
                                                                $stmt_deactivate->execute($params);
                                                                error_log("MITIGADOR - Pregunta ID {$pregunta_id}: Todas las evidencias recibidas están vacías, desactivando todas las existentes: " . implode(',', $ids_existentes_bd));
                                                            }
                                                        }
                                                    } else {
                                                        // Array vacío: no hacer nada, mantener todas las evidencias existentes
                                                        // Esto preserva las evidencias si el frontend no las envía en el request
                                                        error_log("MITIGADOR - Pregunta ID {$pregunta_id}: Array de evidencias vacío, manteniendo todas las evidencias existentes en BD");
                                                    }
                                                } catch (PDOException $e) {
                                                    error_log("Error guardando evidencias individuales (mitigadores): " . $e->getMessage());
                                                }
                                            } else {
                                                error_log("MITIGADOR - Pregunta ID {$pregunta_id}: No tiene campo 'evidencias' o no es array, manteniendo evidencias existentes");
                                            }
                                        }
                                    }
                                }
                            } catch (PDOException $e) {
                                // Si las tablas no existen, simplemente continuar
                                error_log("Error insertando dimensiones para control mitigador: " . $e->getMessage());
                            }
                        }
                    }
                }
            }
        }
        
        // Quinto: Insertar controles preventivos generales
        try {
            // Filtrar duplicados antes de insertar (basado en código)
            $codigosVistos = [];
            $controlesUnicos = [];
            foreach ($controles_preventivos_generales as $index => $control) {
                if (!empty(trim($control['nombre_control'] ?? ''))) {
                    $codigo = isset($control['codigo']) && !empty(trim($control['codigo'])) ? trim($control['codigo']) : ('CP' . ($index + 1));
                    $codigoUpper = strtoupper($codigo);
                    
                    // Verificar duplicados
                    if (!in_array($codigoUpper, $codigosVistos)) {
                        $codigosVistos[] = $codigoUpper;
                        $controlesUnicos[] = [
                            'index' => $index,
                            'control' => $control,
                            'codigo' => $codigo
                        ];
                    }
                }
            }
            
            // Insertar solo controles únicos
            foreach ($controlesUnicos as $item) {
                $codigo = $item['codigo'];
                $control = $item['control'];
                $index = $item['index'];
                $nombre_control = trim($control['nombre_control']);
                $consecuencias = isset($control['consecuencias']) && !empty(trim($control['consecuencias'])) ? trim($control['consecuencias']) : null;
                $criticidad = isset($control['criticidad']) && !empty(trim($control['criticidad'])) ? trim($control['criticidad']) : null;
                $jerarquia = isset($control['jerarquia']) && !empty(trim($control['jerarquia'])) ? trim($control['jerarquia']) : null;
                
                $stmt_cp_gen = $pdo->prepare("INSERT INTO bowtie_controles_preventivos_generales (bowtie_id, codigo, nombre_control, consecuencias, criticidad, jerarquia, orden, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
                $stmt_cp_gen->execute([$bowtie_id, $codigo, $nombre_control, $consecuencias, $criticidad, $jerarquia, $index]);
            }
        } catch (PDOException $e) {
            // Si la tabla no existe, simplemente continuar
            error_log("Tabla bowtie_controles_preventivos_generales no existe o error: " . $e->getMessage());
        }
        
        // Sexto: Insertar controles mitigadores generales
        try {
            foreach ($controles_mitigadores_generales as $index => $control) {
                if (!empty(trim($control['nombre_control'] ?? ''))) {
                    $codigo = isset($control['codigo']) && !empty(trim($control['codigo'])) ? trim($control['codigo']) : ('CM' . ($index + 1));
                    $nombre_control = trim($control['nombre_control']);
                    $consecuencias = isset($control['consecuencias']) && !empty(trim($control['consecuencias'])) ? trim($control['consecuencias']) : null;
                    $criticidad = isset($control['criticidad']) && !empty(trim($control['criticidad'])) ? trim($control['criticidad']) : null;
                    $jerarquia = isset($control['jerarquia']) && !empty(trim($control['jerarquia'])) ? trim($control['jerarquia']) : null;
                    
                    $stmt_cm_gen = $pdo->prepare("INSERT INTO bowtie_controles_mitigadores_generales (bowtie_id, codigo, nombre_control, consecuencias, criticidad, jerarquia, orden, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
                    $stmt_cm_gen->execute([$bowtie_id, $codigo, $nombre_control, $consecuencias, $criticidad, $jerarquia, $index]);
                }
            }
        } catch (PDOException $e) {
            // Si la tabla no existe, simplemente continuar
            error_log("Tabla bowtie_controles_mitigadores_generales no existe o error: " . $e->getMessage());
        }
        
        // Confirmar transacción
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'bowtie_id' => $bowtie_id,
            'message' => 'Análisis Bowtie guardado exitosamente'
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        // Revertir transacción en caso de error
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        // Asegurar headers CORS incluso en errores
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header('Content-Type: application/json; charset=utf-8');
        error_log("Error PDO en POST carpeta_bowtie.php: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode(['success' => false, 'error' => 'Error al guardar análisis Bowtie: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        // Revertir transacción en caso de error
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        // Asegurar headers CORS incluso en errores
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header('Content-Type: application/json; charset=utf-8');
        error_log("Error general en POST carpeta_bowtie.php: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
