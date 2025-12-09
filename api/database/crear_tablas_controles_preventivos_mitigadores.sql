-- =====================================================
-- SCRIPT PARA CREAR TABLAS DE CONTROLES PREVENTIVOS Y MITIGADORES
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Tabla: bowtie_controles_preventivos_generales
-- Controles preventivos generales (no críticos)
CREATE TABLE IF NOT EXISTS bowtie_controles_preventivos_generales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bowtie_id INT NOT NULL,
    codigo VARCHAR(50) NULL DEFAULT NULL COMMENT 'Código del control preventivo (ej: CP1, CP2...)',
    nombre_control TEXT NOT NULL COMMENT 'Nombre del control preventivo',
    consecuencias TEXT NULL DEFAULT NULL COMMENT 'Consecuencias asociadas',
    criticidad VARCHAR(50) NULL DEFAULT NULL COMMENT 'Criticidad del control (ej: Crítico, No crítico)',
    jerarquia VARCHAR(50) NULL DEFAULT NULL COMMENT 'Jerarquía del control (ej: Aislamiento, Administrativo, etc.)',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (bowtie_id) REFERENCES carpeta_bowtie(id) ON DELETE CASCADE,
    INDEX idx_bowtie (bowtie_id),
    INDEX idx_codigo (codigo),
    INDEX idx_criticidad (criticidad),
    INDEX idx_jerarquia (jerarquia),
    INDEX idx_orden (orden),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: bowtie_controles_mitigadores_generales
-- Controles mitigadores generales (no críticos)
CREATE TABLE IF NOT EXISTS bowtie_controles_mitigadores_generales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bowtie_id INT NOT NULL,
    codigo VARCHAR(50) NULL DEFAULT NULL COMMENT 'Código del control mitigador (ej: CM1, CM2...)',
    nombre_control TEXT NOT NULL COMMENT 'Nombre del control mitigador',
    consecuencias TEXT NULL DEFAULT NULL COMMENT 'Consecuencias asociadas',
    criticidad VARCHAR(50) NULL DEFAULT NULL COMMENT 'Criticidad del control (ej: Crítico, No crítico)',
    jerarquia VARCHAR(50) NULL DEFAULT NULL COMMENT 'Jerarquía del control (ej: Aislamiento, Administrativo, etc.)',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (bowtie_id) REFERENCES carpeta_bowtie(id) ON DELETE CASCADE,
    INDEX idx_bowtie (bowtie_id),
    INDEX idx_codigo (codigo),
    INDEX idx_criticidad (criticidad),
    INDEX idx_jerarquia (jerarquia),
    INDEX idx_orden (orden),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

