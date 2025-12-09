-- =====================================================
-- SCRIPT PARA CREAR TABLAS DE GESTIÓN DE ARCHIVOS
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Tabla: carpetas
-- Almacena las carpetas organizadas por proyecto y centro de costo
CREATE TABLE IF NOT EXISTS carpetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    proyecto_id INT NOT NULL,
    centro_costo_id INT,
    carpeta_padre_id INT NULL, -- Para subcarpetas (NULL = carpeta raíz)
    creado_por INT NOT NULL, -- usuario_id del creador
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id) ON DELETE CASCADE,
    FOREIGN KEY (centro_costo_id) REFERENCES centros_costo(id) ON DELETE SET NULL,
    FOREIGN KEY (carpeta_padre_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_proyecto (proyecto_id),
    INDEX idx_centro_costo (centro_costo_id),
    INDEX idx_carpeta_padre (carpeta_padre_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: archivos
-- Almacena los archivos dentro de las carpetas
CREATE TABLE IF NOT EXISTS archivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL, -- Ruta física del archivo en el servidor
    tipo_mime VARCHAR(100),
    tamaño BIGINT, -- Tamaño en bytes
    carpeta_id INT NOT NULL,
    subido_por INT NOT NULL, -- usuario_id del que subió el archivo
    subido_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_subido_por (subido_por),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: carpeta_usuarios
-- Asignación de usuarios a carpetas (permisos específicos por carpeta)
CREATE TABLE IF NOT EXISTS carpeta_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carpeta_id INT NOT NULL,
    usuario_id INT NOT NULL,
    puede_ver TINYINT(1) DEFAULT 1,
    puede_subir TINYINT(1) DEFAULT 0,
    puede_editar TINYINT(1) DEFAULT 0,
    puede_eliminar TINYINT(1) DEFAULT 0,
    asignado_por INT NOT NULL, -- usuario_id que hizo la asignación
    asignado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (asignado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_carpeta_usuario (carpeta_id, usuario_id),
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: actividad_archivos
-- Registro de actividades de usuarios sobre archivos (auditoría)
CREATE TABLE IF NOT EXISTS actividad_archivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    archivo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_actividad ENUM('visualizar', 'descargar', 'subir', 'editar', 'eliminar', 'renombrar') NOT NULL,
    descripcion TEXT,
    fecha_actividad DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (archivo_id) REFERENCES archivos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_archivo (archivo_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_tipo_actividad (tipo_actividad),
    INDEX idx_fecha (fecha_actividad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: actividad_carpetas
-- Registro de actividades de usuarios sobre carpetas (auditoría)
CREATE TABLE IF NOT EXISTS actividad_carpetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carpeta_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_actividad ENUM('crear', 'editar', 'eliminar', 'renombrar', 'asignar_usuario', 'quitar_usuario') NOT NULL,
    descripcion TEXT,
    fecha_actividad DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_tipo_actividad (tipo_actividad),
    INDEX idx_fecha (fecha_actividad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

