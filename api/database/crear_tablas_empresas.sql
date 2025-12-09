-- Tabla para empresas contratistas
-- El RUT es el identificador único de la empresa (empresa_id = rut)
CREATE TABLE IF NOT EXISTS empresas (
    empresa_id VARCHAR(50) PRIMARY KEY COMMENT 'RUT de la empresa (formato: 12345678-9)',
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    contacto_nombre VARCHAR(255),
    contacto_telefono VARCHAR(50),
    contacto_email VARCHAR(255),
    activo TINYINT(1) DEFAULT 1,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_activo (activo),
    INDEX idx_nombre (nombre),
    INDEX idx_rut (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación many-to-many entre empresas y regiones
CREATE TABLE IF NOT EXISTS empresa_regiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL COMMENT 'RUT de la empresa',
    region_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regiones(region_id) ON DELETE CASCADE,
    UNIQUE KEY unique_empresa_region (empresa_id, region_id),
    INDEX idx_empresa_id (empresa_id),
    INDEX idx_region_id (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación many-to-many entre empresas y proyectos
CREATE TABLE IF NOT EXISTS empresa_proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL COMMENT 'RUT de la empresa',
    proyecto_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id) ON DELETE CASCADE,
    UNIQUE KEY unique_empresa_proyecto (empresa_id, proyecto_id),
    INDEX idx_empresa_id (empresa_id),
    INDEX idx_proyecto_id (proyecto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

