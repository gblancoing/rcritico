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
                    
                    // Agrupar preguntas por dimension_id
                    foreach ($preguntas as $preg) {
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
                    
                    // Agrupar preguntas por dimension_id
                    foreach ($preguntas as $preg) {
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
                
                try {
                    // Intentar insertar con todos los campos nuevos (si las columnas existen)
                    $stmt_cp = $pdo->prepare("INSERT INTO bowtie_controles_preventivos (bowtie_id, causa_id, codigo, descripcion, criticidad, jerarquia, orden, activo) VALUES (?, NULL, ?, ?, ?, ?, ?, 1)");
                    $stmt_cp->execute([$bowtie_id, $codigo_cp, trim($control['descripcion']), $criticidad, $jerarquia, $index]);
                } catch (PDOException $e) {
                    // Si alguna columna no existe, intentar insertar sin los campos nuevos
                    if (strpos($e->getMessage(), "Unknown column") !== false || 
                        strpos($e->getMessage(), "doesn't exist") !== false) {
                        try {
                            // Intentar con código pero sin campos nuevos
                            $stmt_cp = $pdo->prepare("INSERT INTO bowtie_controles_preventivos (bowtie_id, causa_id, codigo, descripcion, orden, activo) VALUES (?, NULL, ?, ?, ?, 1)");
                            $stmt_cp->execute([$bowtie_id, $codigo_cp, trim($control['descripcion']), $index]);
                        } catch (PDOException $e2) {
                            // Si la columna codigo tampoco existe, insertar solo descripción
                            if (strpos($e2->getMessage(), "Unknown column 'codigo'") !== false || 
                                strpos($e2->getMessage(), "doesn't exist") !== false) {
                                $stmt_cp = $pdo->prepare("INSERT INTO bowtie_controles_preventivos (bowtie_id, causa_id, descripcion, orden, activo) VALUES (?, NULL, ?, ?, 1)");
                                $stmt_cp->execute([$bowtie_id, trim($control['descripcion']), $index]);
                            } else {
                                throw $e2;
                            }
                        }
                    } else {
                        throw $e;
                    }
                }
                $control_preventivo_id = $pdo->lastInsertId();
                
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
                                $stmt_dim = $pdo->prepare("INSERT INTO bowtie_dimensiones (control_preventivo_id, control_mitigador_id, nombre, orden, activo) VALUES (?, NULL, ?, ?, 1)");
                                $stmt_dim->execute([$control_preventivo_id, trim($dimension['nombre']), $dim_index]);
                                $dimension_id = $pdo->lastInsertId();
                                
                                // Insertar preguntas para esta dimensión
                                if (isset($dimension['preguntas']) && is_array($dimension['preguntas'])) {
                                    foreach ($dimension['preguntas'] as $preg_index => $pregunta) {
                                        if (!empty(trim($pregunta['texto'] ?? ''))) {
                                            $evidencia = isset($pregunta['evidencia']) && !empty(trim($pregunta['evidencia'])) ? trim($pregunta['evidencia']) : null;
                                            $stmt_preg = $pdo->prepare("INSERT INTO bowtie_preguntas (dimension_id, texto, evidencia, orden, activo) VALUES (?, ?, ?, ?, 1)");
                                            $stmt_preg->execute([$dimension_id, trim($pregunta['texto']), $evidencia, $preg_index]);
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
                                $stmt_dim = $pdo->prepare("INSERT INTO bowtie_dimensiones (control_preventivo_id, control_mitigador_id, nombre, orden, activo) VALUES (NULL, ?, ?, ?, 1)");
                                $stmt_dim->execute([$control_mitigador_id, trim($dimension['nombre']), $dim_index]);
                                $dimension_id = $pdo->lastInsertId();
                                
                                // Insertar preguntas para esta dimensión
                                if (isset($dimension['preguntas']) && is_array($dimension['preguntas'])) {
                                    foreach ($dimension['preguntas'] as $preg_index => $pregunta) {
                                        if (!empty(trim($pregunta['texto'] ?? ''))) {
                                            $evidencia = isset($pregunta['evidencia']) && !empty(trim($pregunta['evidencia'])) ? trim($pregunta['evidencia']) : null;
                                            $stmt_preg = $pdo->prepare("INSERT INTO bowtie_preguntas (dimension_id, texto, evidencia, orden, activo) VALUES (?, ?, ?, ?, 1)");
                                            $stmt_preg->execute([$dimension_id, trim($pregunta['texto']), $evidencia, $preg_index]);
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
