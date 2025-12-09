-- =====================================================
-- SCRIPT PARA CREAR TABLA DE ANÁLISIS BOWTIE
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Tabla: carpeta_bowtie
-- Almacena el análisis Bowtie completo para cada carpeta
CREATE TABLE IF NOT EXISTS carpeta_bowtie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carpeta_id INT NOT NULL,
    evento_central TEXT NULL DEFAULT NULL COMMENT 'Evento central del análisis Bowtie (peligro principal)',
    creado_por INT NOT NULL COMMENT 'Usuario que creó el análisis',
    actualizado_por INT NULL COMMENT 'Usuario que actualizó por última vez',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY unique_carpeta_bowtie (carpeta_id),
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: bowtie_causas
-- Causas del análisis Bowtie (lado izquierdo)
CREATE TABLE IF NOT EXISTS bowtie_causas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bowtie_id INT NOT NULL,
    descripcion TEXT NOT NULL COMMENT 'Descripción de la causa',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (bowtie_id) REFERENCES carpeta_bowtie(id) ON DELETE CASCADE,
    INDEX idx_bowtie (bowtie_id),
    INDEX idx_orden (orden),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: bowtie_controles_preventivos
-- Controles críticos preventivos (entre causas y evento central)
CREATE TABLE IF NOT EXISTS bowtie_controles_preventivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bowtie_id INT NOT NULL,
    causa_id INT NULL COMMENT 'Causa asociada (NULL = control general)',
    descripcion TEXT NOT NULL COMMENT 'Descripción del control preventivo',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (bowtie_id) REFERENCES carpeta_bowtie(id) ON DELETE CASCADE,
    FOREIGN KEY (causa_id) REFERENCES bowtie_causas(id) ON DELETE CASCADE,
    INDEX idx_bowtie (bowtie_id),
    INDEX idx_causa (causa_id),
    INDEX idx_orden (orden),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: bowtie_consecuencias
-- Consecuencias del análisis Bowtie (lado derecho)
CREATE TABLE IF NOT EXISTS bowtie_consecuencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bowtie_id INT NOT NULL,
    descripcion TEXT NOT NULL COMMENT 'Descripción de la consecuencia',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (bowtie_id) REFERENCES carpeta_bowtie(id) ON DELETE CASCADE,
    INDEX idx_bowtie (bowtie_id),
    INDEX idx_orden (orden),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: bowtie_controles_mitigadores
-- Controles críticos mitigadores (entre evento central y consecuencias)
CREATE TABLE IF NOT EXISTS bowtie_controles_mitigadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bowtie_id INT NOT NULL,
    consecuencia_id INT NULL COMMENT 'Consecuencia asociada (NULL = control general)',
    descripcion TEXT NOT NULL COMMENT 'Descripción del control mitigador',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (bowtie_id) REFERENCES carpeta_bowtie(id) ON DELETE CASCADE,
    FOREIGN KEY (consecuencia_id) REFERENCES bowtie_consecuencias(id) ON DELETE CASCADE,
    INDEX idx_bowtie (bowtie_id),
    INDEX idx_consecuencia (consecuencia_id),
    INDEX idx_orden (orden),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

