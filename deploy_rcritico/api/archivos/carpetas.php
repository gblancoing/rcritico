<?php
// Función helper para enviar headers CORS sin duplicados (solo definir si no existe)
if (!function_exists('sendCorsHeaders')) {
    function sendCorsHeaders() {
        // Remover headers CORS existentes para evitar duplicados
        if (function_exists('header_remove')) {
            header_remove('Access-Control-Allow-Origin');
            header_remove('Access-Control-Allow-Methods');
            header_remove('Access-Control-Allow-Headers');
        }
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    }
}

// Manejar preflight OPTIONS request para CORS PRIMERO (por si se accede directamente)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendCorsHeaders();
    http_response_code(200);
    exit;
}

// Este archivo es incluido desde api/carpetas.php que ya configuró los headers y error handlers
// NO limpiar el buffer aquí porque api/carpetas.php ya lo maneja

try {
    require_once __DIR__ . '/../config/db.php';
    
    // Verificar que $pdo existe
    if (!isset($pdo)) {
        throw new Exception('La conexión PDO no está disponible');
    }
} catch (Exception $e) {
    // Limpiar cualquier salida previa
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(500);
    sendCorsHeaders();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'Error al cargar configuración: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Error $e) {
    // Limpiar cualquier salida previa
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(500);
    sendCorsHeaders();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'Error fatal al cargar configuración: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}

// Obtener usuario actual desde headers o token (simplificado por ahora)
// En producción, usar JWT o sesiones
$usuario_actual = null;
$usuario_rol = null;
if (isset($_GET['usuario_id'])) {
    $usuario_actual = intval($_GET['usuario_id']);
    // Obtener el rol del usuario
    try {
        $stmt_rol = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
        $stmt_rol->execute([$usuario_actual]);
        $usuario_data = $stmt_rol->fetch();
        if ($usuario_data) {
            $usuario_rol = $usuario_data['rol'];
        }
    } catch (Exception $e) {
        // Si hay error, continuar sin filtrar por rol
    }
}

// GET: Listar carpetas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Si se solicita una carpeta específica por ID (para cargar información de riesgo crítico)
    $carpeta_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($carpeta_id) {
        try {
            $sql = "SELECT c.*, 
                           u.nombre as creador_nombre,
                           c.color_primario,
                           c.color_secundario,
                           c.icono_url,
                           c.evento_no_deseado,
                           c.evento_riesgo,
                           c.controles_supervisor,
                           c.controles_trabajador,
                           c.informacion_riesgo,
                           COUNT(DISTINCT a.id) as cantidad_archivos,
                           COUNT(DISTINCT sc.id) as cantidad_subcarpetas
                    FROM carpetas c
                    LEFT JOIN usuarios u ON c.creado_por = u.id
                    LEFT JOIN archivos a ON c.id = a.carpeta_id AND a.activo = 1
                    LEFT JOIN carpetas sc ON sc.carpeta_padre_id = c.id AND sc.activo = 1
                    WHERE c.id = ? AND c.activo = 1
                    GROUP BY c.id";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$carpeta_id]);
            $carpeta = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($carpeta) {
                // Si NO es super_admin, verificar acceso a la carpeta o a algún ancestro
                // Para nivel 1 y 2, se requiere asignación explícita
                if ($usuario_rol !== 'super_admin' && $usuario_actual) {
                    // Obtener todos los IDs de carpetas asignadas al usuario
                    $stmt_asignadas = $pdo->prepare("SELECT carpeta_id FROM carpeta_usuarios WHERE usuario_id = ? AND puede_ver = 1");
                    $stmt_asignadas->execute([$usuario_actual]);
                    $carpetas_asignadas_ids = array_column($stmt_asignadas->fetchAll(PDO::FETCH_ASSOC), 'carpeta_id');
                    
                    if (!empty($carpetas_asignadas_ids)) {
                        // Verificar si la carpeta actual está asignada explícitamente
                        $tiene_acceso = in_array($carpeta_id, $carpetas_asignadas_ids);
                        
                        // Si no está asignada directamente, verificar si algún ancestro está asignado
                        // PERO solo para niveles 3+ (herencia de permisos)
                        if (!$tiene_acceso) {
                            $carpeta_actual_id = $carpeta_id;
                            $nivel = 0;
                            
                            // Determinar el nivel de la carpeta
                            while ($carpeta_actual_id !== null) {
                                $nivel++;
                                $stmt_padre = $pdo->prepare("SELECT carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
                                $stmt_padre->execute([$carpeta_actual_id]);
                                $padre = $stmt_padre->fetch();
                                $carpeta_actual_id = $padre ? $padre['carpeta_padre_id'] : null;
                            }
                            
                            // Solo permitir herencia de permisos para nivel 3+
                            // Nivel 1 y 2 requieren asignación explícita
                            if ($nivel > 2) {
                                $carpeta_actual_id = $carpeta_id;
                                while ($carpeta_actual_id !== null) {
                                    if (in_array($carpeta_actual_id, $carpetas_asignadas_ids)) {
                                        $tiene_acceso = true;
                                        break;
                                    }
                                    
                                    $stmt_padre = $pdo->prepare("SELECT carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
                                    $stmt_padre->execute([$carpeta_actual_id]);
                                    $padre = $stmt_padre->fetch();
                                    $carpeta_actual_id = $padre ? $padre['carpeta_padre_id'] : null;
                                }
                            }
                        }
                        
                        if (!$tiene_acceso) {
                            ob_clean();
                            http_response_code(403);
                            sendCorsHeaders();
                            header('Content-Type: application/json; charset=utf-8');
                            echo json_encode(['error' => 'No tiene acceso a esta carpeta. Debe ser asignado por el super administrador.'], JSON_UNESCAPED_UNICODE);
                            exit;
                        }
                    } else {
                        // Usuario sin carpetas asignadas
                        ob_clean();
                        http_response_code(403);
                        sendCorsHeaders();
                        header('Content-Type: application/json; charset=utf-8');
                        echo json_encode(['error' => 'No tiene acceso a esta carpeta. Debe ser asignado por el super administrador.'], JSON_UNESCAPED_UNICODE);
                        exit;
                    }
                }
                
                ob_clean();
                sendCorsHeaders();
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode($carpeta, JSON_UNESCAPED_UNICODE);
                exit;
            } else {
                ob_clean();
                http_response_code(404);
                sendCorsHeaders();
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['error' => 'Carpeta no encontrada'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        } catch (PDOException $e) {
            ob_clean();
            http_response_code(500);
            sendCorsHeaders();
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Error al obtener carpeta: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    
    $proyecto_id = isset($_GET['proyecto_id']) ? intval($_GET['proyecto_id']) : null;
    $centro_costo_id = isset($_GET['centro_costo_id']) ? intval($_GET['centro_costo_id']) : null;
    $carpeta_padre_id = isset($_GET['carpeta_padre_id']) ? intval($_GET['carpeta_padre_id']) : null;
    $todas = isset($_GET['todas']) && $_GET['todas'] === '1'; // Nuevo parámetro para obtener todas las carpetas
    
    try {
        // Si se solicita todas las carpetas (para árbol jerárquico)
        if ($todas && $proyecto_id) {
            // Obtener todas las carpetas del proyecto sin filtrar por carpeta_padre
            $sql = "SELECT c.*, 
                           u.nombre as creador_nombre,
                           c.color_primario,
                           c.color_secundario,
                           c.icono_url,
                           COUNT(DISTINCT a.id) as cantidad_archivos,
                           COUNT(DISTINCT sc.id) as cantidad_subcarpetas
                    FROM carpetas c
                    LEFT JOIN usuarios u ON c.creado_por = u.id
                    LEFT JOIN archivos a ON c.id = a.carpeta_id AND a.activo = 1
                    LEFT JOIN carpetas sc ON sc.carpeta_padre_id = c.id AND sc.activo = 1";
            
            // Si NO es super_admin, solo mostrar carpetas asignadas explícitamente
            // Esto aplica para admin y trabajador en nivel 1 y 2
            if ($usuario_rol !== 'super_admin' && $usuario_actual) {
                $sql .= " INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id 
                          WHERE c.activo = 1 AND c.proyecto_id = ? 
                          AND cu.usuario_id = ? AND cu.puede_ver = 1";
                $params = [$proyecto_id, $usuario_actual];
            } else {
                // Solo super_admin ve todas las carpetas sin restricción
                $sql .= " WHERE c.activo = 1 AND c.proyecto_id = ?";
                $params = [$proyecto_id];
            }
            
            if ($centro_costo_id) {
                $sql .= " AND c.centro_costo_id = ?";
                $params[] = $centro_costo_id;
            }
            
            $sql .= " GROUP BY c.id ORDER BY c.carpeta_padre_id IS NULL DESC, c.nombre";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Si NO es super_admin, también incluir subcarpetas de las carpetas asignadas
            // PERO solo si las subcarpetas también están asignadas explícitamente (nivel 2 requiere asignación)
            if ($usuario_rol !== 'super_admin' && $usuario_actual) {
                $carpetas_ids = array_column($carpetas, 'id');
                if (!empty($carpetas_ids)) {
                    $placeholders = implode(',', array_fill(0, count($carpetas_ids), '?'));
                    // Para nivel 2, también requerir asignación explícita
                    $sql_subcarpetas = "SELECT c.*, 
                                               u.nombre as creador_nombre,
                                               c.color_primario,
                                               c.color_secundario,
                                               c.icono_url,
                                               COUNT(DISTINCT a.id) as cantidad_archivos,
                                               COUNT(DISTINCT sc.id) as cantidad_subcarpetas
                                        FROM carpetas c
                                        INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                                        LEFT JOIN usuarios u ON c.creado_por = u.id
                                        LEFT JOIN archivos a ON c.id = a.carpeta_id AND a.activo = 1
                                        LEFT JOIN carpetas sc ON sc.carpeta_padre_id = c.id AND sc.activo = 1
                                        WHERE c.activo = 1 
                                        AND c.carpeta_padre_id IN ($placeholders)
                                        AND cu.usuario_id = ? 
                                        AND cu.puede_ver = 1
                                        GROUP BY c.id ORDER BY c.nombre";
                    $stmt_sub = $pdo->prepare($sql_subcarpetas);
                    $params_sub = array_merge($carpetas_ids, [$usuario_actual]);
                    $stmt_sub->execute($params_sub);
                    $subcarpetas = $stmt_sub->fetchAll(PDO::FETCH_ASSOC);
                    // Combinar carpetas principales con subcarpetas, eliminando duplicados por ID
                    $carpetas_ids_existentes = array_column($carpetas, 'id');
                    foreach ($subcarpetas as $subcarpeta) {
                        if (!in_array($subcarpeta['id'], $carpetas_ids_existentes)) {
                            $carpetas[] = $subcarpeta;
                            $carpetas_ids_existentes[] = $subcarpeta['id'];
                        }
                    }
                }
            }
            
            ob_clean();
            sendCorsHeaders();
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($carpetas, JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Comportamiento original: filtrar por carpeta_padre
        // Si NO es super_admin, solo mostrar carpetas asignadas explícitamente (nivel 1 y 2)
        if ($usuario_rol !== 'super_admin' && $usuario_actual) {
            // Para trabajadores: solo carpetas asignadas y sus subcarpetas
            $sql = "SELECT DISTINCT c.*, 
                           u.nombre as creador_nombre,
                           c.color_primario,
                           c.color_secundario,
                           c.icono_url,
                           COUNT(DISTINCT a.id) as cantidad_archivos,
                           COUNT(DISTINCT sc.id) as cantidad_subcarpetas
                    FROM carpetas c
                    INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                    LEFT JOIN usuarios u ON c.creado_por = u.id
                    LEFT JOIN archivos a ON c.id = a.carpeta_id AND a.activo = 1
                    LEFT JOIN carpetas sc ON sc.carpeta_padre_id = c.id AND sc.activo = 1
                    WHERE c.activo = 1 
                    AND cu.usuario_id = ? 
                    AND cu.puede_ver = 1";
            
            $params = [$usuario_actual];
            
            if ($proyecto_id) {
                $sql .= " AND c.proyecto_id = ?";
                $params[] = $proyecto_id;
            }
            
            if ($centro_costo_id) {
                $sql .= " AND c.centro_costo_id = ?";
                $params[] = $centro_costo_id;
            }
            
            if ($carpeta_padre_id !== null) {
                $sql .= " AND c.carpeta_padre_id " . ($carpeta_padre_id === 0 ? "IS NULL" : "= ?");
                if ($carpeta_padre_id !== 0) {
                    $params[] = $carpeta_padre_id;
                }
            } else {
                // Por defecto, mostrar solo carpetas raíz asignadas
                $sql .= " AND c.carpeta_padre_id IS NULL";
            }
            
            $sql .= " GROUP BY c.id ORDER BY c.nombre";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Eliminar duplicados por ID (por si hay múltiples registros en carpeta_usuarios)
            $carpetas_unicas = [];
            $ids_vistos = [];
            foreach ($carpetas as $carpeta) {
                if (!in_array($carpeta['id'], $ids_vistos)) {
                    $carpetas_unicas[] = $carpeta;
                    $ids_vistos[] = $carpeta['id'];
                }
            }
            $carpetas = $carpetas_unicas;
            
            // Si estamos en una carpeta específica, verificar si el usuario tiene acceso a ella o a algún ancestro
            if ($carpeta_padre_id !== null && $carpeta_padre_id !== 0) {
                // Función recursiva para verificar si una carpeta o alguno de sus ancestros está asignada al usuario
                // Primero, obtener todos los IDs de carpetas asignadas al usuario
                $stmt_asignadas = $pdo->prepare("SELECT carpeta_id FROM carpeta_usuarios WHERE usuario_id = ? AND puede_ver = 1");
                $stmt_asignadas->execute([$usuario_actual]);
                $carpetas_asignadas_ids = array_column($stmt_asignadas->fetchAll(PDO::FETCH_ASSOC), 'carpeta_id');
                
                if (!empty($carpetas_asignadas_ids)) {
                    // Verificar si la carpeta padre actual o alguno de sus ancestros está en la lista de asignadas
                    $tiene_acceso = false;
                    $carpeta_actual_id = $carpeta_padre_id;
                    
                    // Recorrer la jerarquía hacia arriba para verificar si algún ancestro está asignado
                    while ($carpeta_actual_id !== null) {
                        if (in_array($carpeta_actual_id, $carpetas_asignadas_ids)) {
                            $tiene_acceso = true;
                            break;
                        }
                        
                        // Obtener el padre de la carpeta actual
                        $stmt_padre = $pdo->prepare("SELECT carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
                        $stmt_padre->execute([$carpeta_actual_id]);
                        $padre = $stmt_padre->fetch();
                        $carpeta_actual_id = $padre ? $padre['carpeta_padre_id'] : null;
                    }
                    
                    if ($tiene_acceso) {
                        // Verificar el nivel de la carpeta padre
                        $stmt_nivel = $pdo->prepare("SELECT carpeta_padre_id FROM carpetas WHERE id = ? AND activo = 1");
                        $stmt_nivel->execute([$carpeta_padre_id]);
                        $padre_data = $stmt_nivel->fetch();
                        $es_nivel_2 = $padre_data && $padre_data['carpeta_padre_id'] === null;
                        
                        // Si es nivel 2, requerir asignación explícita
                        // Si es nivel 3+, permitir herencia de permisos
                        if ($es_nivel_2) {
                            // Nivel 2: requerir asignación explícita
                            $sql_sub = "SELECT DISTINCT c.*, 
                                               u.nombre as creador_nombre,
                                               c.color_primario,
                                               c.color_secundario,
                                               c.icono_url,
                                               COUNT(DISTINCT a.id) as cantidad_archivos,
                                               COUNT(DISTINCT sc.id) as cantidad_subcarpetas
                                        FROM carpetas c
                                        INNER JOIN carpeta_usuarios cu ON c.id = cu.carpeta_id
                                        LEFT JOIN usuarios u ON c.creado_por = u.id
                                        LEFT JOIN archivos a ON c.id = a.carpeta_id AND a.activo = 1
                                        LEFT JOIN carpetas sc ON sc.carpeta_padre_id = c.id AND sc.activo = 1
                                        WHERE c.activo = 1 
                                        AND c.carpeta_padre_id = ?
                                        AND cu.usuario_id = ? 
                                        AND cu.puede_ver = 1
                                        GROUP BY c.id ORDER BY c.nombre";
                            $stmt_sub = $pdo->prepare($sql_sub);
                            $stmt_sub->execute([$carpeta_padre_id, $usuario_actual]);
                        } else {
                            // Nivel 3+: permitir herencia de permisos
                            $sql_sub = "SELECT DISTINCT c.*, 
                                               u.nombre as creador_nombre,
                                               c.color_primario,
                                               c.color_secundario,
                                               c.icono_url,
                                               COUNT(DISTINCT a.id) as cantidad_archivos,
                                               COUNT(DISTINCT sc.id) as cantidad_subcarpetas
                                        FROM carpetas c
                                        LEFT JOIN usuarios u ON c.creado_por = u.id
                                        LEFT JOIN archivos a ON c.id = a.carpeta_id AND a.activo = 1
                                        LEFT JOIN carpetas sc ON sc.carpeta_padre_id = c.id AND sc.activo = 1
                                        WHERE c.activo = 1 
                                        AND c.carpeta_padre_id = ?
                                        GROUP BY c.id ORDER BY c.nombre";
                            $stmt_sub = $pdo->prepare($sql_sub);
                            $stmt_sub->execute([$carpeta_padre_id]);
                        }
                        $subcarpetas = $stmt_sub->fetchAll(PDO::FETCH_ASSOC);
                        // Combinar con las carpetas ya obtenidas, eliminando duplicados por ID
                        $carpetas_ids_existentes = array_column($carpetas, 'id');
                        foreach ($subcarpetas as $subcarpeta) {
                            if (!in_array($subcarpeta['id'], $carpetas_ids_existentes)) {
                                $carpetas[] = $subcarpeta;
                                $carpetas_ids_existentes[] = $subcarpeta['id'];
                            }
                        }
                    }
                }
            }
        } else {
            // Solo para super_admin: mostrar todas las carpetas sin restricción
        $sql = "SELECT c.*, 
                       u.nombre as creador_nombre,
                       c.color_primario,
                       c.color_secundario,
                       COUNT(DISTINCT a.id) as cantidad_archivos,
                       COUNT(DISTINCT sc.id) as cantidad_subcarpetas
                FROM carpetas c
                LEFT JOIN usuarios u ON c.creado_por = u.id
                LEFT JOIN archivos a ON c.id = a.carpeta_id AND a.activo = 1
                LEFT JOIN carpetas sc ON sc.carpeta_padre_id = c.id AND sc.activo = 1
                WHERE c.activo = 1";
        
        $params = [];
        
        if ($proyecto_id) {
            $sql .= " AND c.proyecto_id = ?";
            $params[] = $proyecto_id;
        }
        
        if ($centro_costo_id) {
            $sql .= " AND c.centro_costo_id = ?";
            $params[] = $centro_costo_id;
        }
        
        if ($carpeta_padre_id !== null) {
            $sql .= " AND c.carpeta_padre_id " . ($carpeta_padre_id === 0 ? "IS NULL" : "= ?");
            if ($carpeta_padre_id !== 0) {
                $params[] = $carpeta_padre_id;
            }
        } else {
            // Por defecto, mostrar solo carpetas raíz
            $sql .= " AND c.carpeta_padre_id IS NULL";
        }
        
        $sql .= " GROUP BY c.id ORDER BY c.nombre";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        ob_clean();
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($carpetas, JSON_UNESCAPED_UNICODE);
        exit;
    } catch (PDOException $e) {
        ob_clean();
        http_response_code(500);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Error al obtener carpetas: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// POST: Crear carpeta
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nombre = trim($data['nombre'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $proyecto_id = intval($data['proyecto_id'] ?? 0);
    $centro_costo_id = isset($data['centro_costo_id']) ? intval($data['centro_costo_id']) : null;
    $carpeta_padre_id = isset($data['carpeta_padre_id']) && $data['carpeta_padre_id'] ? intval($data['carpeta_padre_id']) : null;
    $creado_por = intval($data['creado_por'] ?? 0);
    $color_primario = isset($data['color_primario']) && !empty($data['color_primario']) ? trim($data['color_primario']) : null;
    $color_secundario = isset($data['color_secundario']) && !empty($data['color_secundario']) ? trim($data['color_secundario']) : null;
    
    // Validar formato de colores HEX si se proporcionan
    if ($color_primario && !preg_match('/^#[0-9A-Fa-f]{6}$/', $color_primario)) {
        $color_primario = null;
    }
    if ($color_secundario && !preg_match('/^#[0-9A-Fa-f]{6}$/', $color_secundario)) {
        $color_secundario = null;
    }
    
    if (empty($nombre) || !$proyecto_id || !$creado_por) {
        ob_clean();
        http_response_code(400);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Verificar que el proyecto existe
        $stmt_check = $pdo->prepare("SELECT proyecto_id FROM proyectos WHERE proyecto_id = ?");
        $stmt_check->execute([$proyecto_id]);
        if (!$stmt_check->fetch()) {
            ob_clean();
            http_response_code(404);
            sendCorsHeaders();
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Proyecto no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Verificar que la carpeta padre existe (si se especifica)
        if ($carpeta_padre_id) {
            try {
                $stmt_check = $pdo->prepare("SELECT id FROM carpetas WHERE id = ? AND proyecto_id = ? AND activo = 1");
                $stmt_check->execute([$carpeta_padre_id, $proyecto_id]);
                if (!$stmt_check->fetch()) {
                    ob_clean();
                    http_response_code(404);
                    sendCorsHeaders();
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode(['success' => false, 'error' => 'Carpeta padre no encontrada'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            } catch (PDOException $e) {
                // Si la tabla no existe, el error se capturará en el catch principal
                throw $e;
            }
        }
        
        // Obtener icono_url si está presente
        $icono_url = isset($data['icono_url']) && !empty($data['icono_url']) ? $data['icono_url'] : null;
        
        // Crear la carpeta (las tablas ya están verificadas por el test)
        $stmt = $pdo->prepare("INSERT INTO carpetas (nombre, descripcion, proyecto_id, centro_costo_id, carpeta_padre_id, creado_por, color_primario, color_secundario, icono_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$nombre, $descripcion, $proyecto_id, $centro_costo_id, $carpeta_padre_id, $creado_por, $color_primario, $color_secundario, $icono_url]);
        
        $carpeta_id = $pdo->lastInsertId();
        
        // Registrar actividad (solo si la tabla existe)
        try {
            $stmt_act = $pdo->prepare("INSERT INTO actividad_carpetas (carpeta_id, usuario_id, tipo_actividad, descripcion, ip_address) VALUES (?, ?, 'crear', ?, ?)");
            $stmt_act->execute([$carpeta_id, $creado_por, "Carpeta creada: $nombre", $_SERVER['REMOTE_ADDR'] ?? '']);
        } catch (PDOException $e) {
            // Si la tabla de actividad no existe, continuar sin registrar
        }
        
        ob_clean();
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => true, 'carpeta_id' => $carpeta_id], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (PDOException $e) {
        ob_clean();
        http_response_code(500);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        $errorMessage = $e->getMessage();
        // Mensaje más amigable si la tabla no existe
        if (strpos($errorMessage, "doesn't exist") !== false || 
            strpos($errorMessage, "Table") !== false || 
            strpos($errorMessage, "Unknown table") !== false ||
            strpos($errorMessage, "no existe") !== false) {
            $errorMessage = "Las tablas de base de datos no están creadas. Por favor ejecuta el script SQL: api/database/crear_tablas_carpetas_archivos.sql";
        }
        echo json_encode(['success' => false, 'error' => $errorMessage], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Exception $e) {
        ob_clean();
        http_response_code(500);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
    exit;
}

// PUT: Editar carpeta
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $carpeta_id = intval($data['id'] ?? 0);
    $nombre = trim($data['nombre'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $usuario_id = intval($data['usuario_id'] ?? 0);
    $icono_url = isset($data['icono_url']) && !empty($data['icono_url']) ? $data['icono_url'] : null;
    $color_primario = isset($data['color_primario']) && !empty($data['color_primario']) ? trim($data['color_primario']) : null;
    $color_secundario = isset($data['color_secundario']) && !empty($data['color_secundario']) ? trim($data['color_secundario']) : null;
    
    // Campos de información de riesgo crítico
    $evento_no_deseado = isset($data['evento_no_deseado']) ? trim($data['evento_no_deseado']) : null;
    $evento_riesgo = isset($data['evento_riesgo']) ? trim($data['evento_riesgo']) : null;
    $controles_supervisor = isset($data['controles_supervisor']) ? (is_string($data['controles_supervisor']) ? $data['controles_supervisor'] : json_encode($data['controles_supervisor'])) : null;
    $controles_trabajador = isset($data['controles_trabajador']) ? (is_string($data['controles_trabajador']) ? $data['controles_trabajador'] : json_encode($data['controles_trabajador'])) : null;
    $informacion_riesgo = isset($data['informacion_riesgo']) ? trim($data['informacion_riesgo']) : null;
    
    // Validar formato de colores HEX si se proporcionan
    if ($color_primario && !preg_match('/^#[0-9A-Fa-f]{6}$/', $color_primario)) {
        $color_primario = null;
    }
    if ($color_secundario && !preg_match('/^#[0-9A-Fa-f]{6}$/', $color_secundario)) {
        $color_secundario = null;
    }
    
    if (!$carpeta_id || empty($nombre) || !$usuario_id) {
        ob_clean();
        http_response_code(400);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Validar que solo admin y super_admin pueden editar información de riesgo crítico
    try {
        $stmt_rol = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
        $stmt_rol->execute([$usuario_id]);
        $usuario_data = $stmt_rol->fetch();
        
        if (!$usuario_data) {
            ob_clean();
            http_response_code(404);
            sendCorsHeaders();
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Usuario no encontrado'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $rol_usuario = $usuario_data['rol'];
        
        // Si se intenta editar información de riesgo crítico, verificar permisos
        if (isset($data['evento_no_deseado']) || isset($data['evento_riesgo']) || 
            isset($data['controles_supervisor']) || isset($data['controles_trabajador']) || 
            isset($data['informacion_riesgo'])) {
            
            if (!in_array($rol_usuario, ['super_admin', 'admin'])) {
                ob_clean();
                http_response_code(403);
                sendCorsHeaders();
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'error' => 'Solo administradores pueden editar información de riesgo crítico'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    } catch (PDOException $e) {
        ob_clean();
        http_response_code(500);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Error al validar permisos: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Actualizar todos los campos, incluyendo información de riesgo crítico
        $sql = "UPDATE carpetas SET nombre = ?, descripcion = ?, color_primario = ?, color_secundario = ?, 
                evento_no_deseado = ?, evento_riesgo = ?, controles_supervisor = ?, controles_trabajador = ?, informacion_riesgo = ?, actualizado_en = NOW()";
        $params = [$nombre, $descripcion, $color_primario, $color_secundario, $evento_no_deseado, $evento_riesgo, $controles_supervisor, $controles_trabajador, $informacion_riesgo];
        
        // Si icono_url se proporciona, incluirlo en la actualización
        if ($icono_url !== null) {
            $sql .= ", icono_url = ?";
            $params[] = $icono_url;
        }
        
        $sql .= " WHERE id = ? AND activo = 1";
        $params[] = $carpeta_id;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Registrar actividad (solo si la tabla existe)
        try {
            $stmt_act = $pdo->prepare("INSERT INTO actividad_carpetas (carpeta_id, usuario_id, tipo_actividad, descripcion, ip_address) VALUES (?, ?, 'editar', ?, ?)");
            $stmt_act->execute([$carpeta_id, $usuario_id, "Carpeta editada: $nombre", $_SERVER['REMOTE_ADDR'] ?? '']);
        } catch (PDOException $e) {
            // Si la tabla de actividad no existe, continuar sin registrar
        }
        
        ob_clean();
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        ob_clean();
        http_response_code(500);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Error al editar carpeta: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// Función recursiva para eliminar carpeta en cascada
function eliminarCarpetaEnCascada($pdo, $carpeta_id, $usuario_id, $ip_address = '') {
    $archivos_eliminados = 0;
    $subcarpetas_eliminadas = 0;
    
    // 1. Obtener todos los archivos de esta carpeta
    $stmt_archivos = $pdo->prepare("SELECT id, nombre_original, ruta_archivo FROM archivos WHERE carpeta_id = ? AND activo = 1");
    $stmt_archivos->execute([$carpeta_id]);
    $archivos = $stmt_archivos->fetchAll(PDO::FETCH_ASSOC);
    
    // 2. Eliminar todos los archivos físicamente y en BD
    foreach ($archivos as $archivo) {
        // Eliminar archivo físico del servidor
        // La ruta se guarda como '/api/uploads/proyecto_X/nombre_archivo'
        // Necesitamos convertirla a ruta física: api/archivos/uploads/proyecto_X/nombre_archivo
        $ruta_relativa = $archivo['ruta_archivo'];
        
        // Convertir /api/uploads/... a ruta física
        if (strpos($ruta_relativa, '/api/uploads/') === 0) {
            // Reemplazar /api/uploads/ con la ruta física real
            $ruta_fisica = __DIR__ . '/uploads' . str_replace('/api/uploads', '', $ruta_relativa);
        } else {
            // Si ya es una ruta relativa, construir desde el directorio actual
            $ruta_fisica = __DIR__ . '/uploads/' . basename($ruta_relativa);
        }
        
        // Intentar eliminar el archivo físico
        if (file_exists($ruta_fisica)) {
            @unlink($ruta_fisica);
        }
        
        // También intentar desde la raíz del proyecto por si acaso
        $ruta_alternativa = __DIR__ . '/..' . $ruta_relativa;
        if (file_exists($ruta_alternativa) && $ruta_alternativa !== $ruta_fisica) {
            @unlink($ruta_alternativa);
        }
        
        // Soft delete en BD
        $stmt_del_archivo = $pdo->prepare("UPDATE archivos SET activo = 0 WHERE id = ?");
        $stmt_del_archivo->execute([$archivo['id']]);
        
        // Registrar actividad
        try {
            $stmt_act = $pdo->prepare("INSERT INTO actividad_archivos (archivo_id, usuario_id, tipo_actividad, descripcion, ip_address) VALUES (?, ?, 'eliminar', ?, ?)");
            $stmt_act->execute([$archivo['id'], $usuario_id, "Archivo eliminado en cascada: " . $archivo['nombre_original'], $ip_address]);
        } catch (PDOException $e) {
            // Continuar si la tabla no existe
        }
        
        $archivos_eliminados++;
    }
    
    // 3. Obtener todas las subcarpetas
    $stmt_subcarpetas = $pdo->prepare("SELECT id, nombre FROM carpetas WHERE carpeta_padre_id = ? AND activo = 1");
    $stmt_subcarpetas->execute([$carpeta_id]);
    $subcarpetas = $stmt_subcarpetas->fetchAll(PDO::FETCH_ASSOC);
    
    // 4. Eliminar recursivamente cada subcarpeta
    foreach ($subcarpetas as $subcarpeta) {
        $resultado = eliminarCarpetaEnCascada($pdo, $subcarpeta['id'], $usuario_id, $ip_address);
        $archivos_eliminados += $resultado['archivos'];
        $subcarpetas_eliminadas += $resultado['subcarpetas'] + 1; // +1 por la subcarpeta misma
    }
    
    // 5. Eliminar la carpeta misma (soft delete)
    $stmt_del_carpeta = $pdo->prepare("UPDATE carpetas SET activo = 0 WHERE id = ?");
    $stmt_del_carpeta->execute([$carpeta_id]);
    
    return [
        'archivos' => $archivos_eliminados,
        'subcarpetas' => $subcarpetas_eliminadas
    ];
}

// DELETE: Eliminar carpeta (soft delete con eliminación en cascada)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $carpeta_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : 0;
    
    if (!$carpeta_id || !$usuario_id) {
        ob_clean();
        http_response_code(400);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    try {
        // Obtener nombre de la carpeta antes de eliminar
        $stmt_get = $pdo->prepare("SELECT nombre FROM carpetas WHERE id = ? AND activo = 1");
        $stmt_get->execute([$carpeta_id]);
        $carpeta = $stmt_get->fetch();
        
        if (!$carpeta) {
            ob_clean();
            http_response_code(404);
            sendCorsHeaders();
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Carpeta no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        // Eliminar en cascada (archivos, subcarpetas y la carpeta misma)
        $resultado = eliminarCarpetaEnCascada($pdo, $carpeta_id, $usuario_id, $_SERVER['REMOTE_ADDR'] ?? '');
        
        // Registrar actividad de la carpeta principal
        try {
            $stmt_act = $pdo->prepare("INSERT INTO actividad_carpetas (carpeta_id, usuario_id, tipo_actividad, descripcion, ip_address) VALUES (?, ?, 'eliminar', ?, ?)");
            $descripcion = "Carpeta eliminada: " . $carpeta['nombre'] . 
                          " (Archivos eliminados: " . $resultado['archivos'] . 
                          ", Subcarpetas eliminadas: " . $resultado['subcarpetas'] . ")";
            $stmt_act->execute([$carpeta_id, $usuario_id, $descripcion, $_SERVER['REMOTE_ADDR'] ?? '']);
        } catch (PDOException $e) {
            // Si la tabla de actividad no existe, continuar sin registrar
        }
        
        ob_clean();
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true, 
            'mensaje' => 'Carpeta eliminada exitosamente',
            'archivos_eliminados' => $resultado['archivos'],
            'subcarpetas_eliminadas' => $resultado['subcarpetas']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (PDOException $e) {
        ob_clean();
        http_response_code(500);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Error al eliminar carpeta: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Exception $e) {
        ob_clean();
        http_response_code(500);
        sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Error al eliminar carpeta: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
?>
