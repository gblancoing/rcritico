-- =====================================================
-- SCRIPT PARA CREAR TABLAS DE FORO Y TAREAS POR CARPETA
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Tabla: carpeta_mensajes
-- Mensajes/comentarios del foro de cada carpeta
CREATE TABLE IF NOT EXISTS carpeta_mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carpeta_id INT NOT NULL,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    mensaje_padre_id INT NULL, -- Para respuestas/replies (NULL = mensaje principal)
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (mensaje_padre_id) REFERENCES carpeta_mensajes(id) ON DELETE CASCADE,
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_mensaje_padre (mensaje_padre_id),
    INDEX idx_creado_en (creado_en),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: carpeta_tareas
-- Tareas y recordatorios asignados a usuarios en cada carpeta
CREATE TABLE IF NOT EXISTS carpeta_tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carpeta_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    creado_por INT NOT NULL, -- usuario_id del creador
    asignado_a INT NULL, -- usuario_id del asignado (NULL = sin asignar / todos)
    fecha_vencimiento DATETIME NULL,
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    estado ENUM('pendiente', 'en_progreso', 'completada', 'cancelada') DEFAULT 'pendiente',
    recordatorio_en DATETIME NULL, -- Fecha/hora para recordatorio
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completado_en DATETIME NULL,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_asignado_a (asignado_a),
    INDEX idx_estado (estado),
    INDEX idx_prioridad (prioridad),
    INDEX idx_fecha_vencimiento (fecha_vencimiento),
    INDEX idx_recordatorio_en (recordatorio_en),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: carpeta_tarea_comentarios
-- Comentarios en las tareas
CREATE TABLE IF NOT EXISTS carpeta_tarea_comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tarea_id INT NOT NULL,
    usuario_id INT NOT NULL,
    comentario TEXT NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (tarea_id) REFERENCES carpeta_tareas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_tarea (tarea_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_creado_en (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

