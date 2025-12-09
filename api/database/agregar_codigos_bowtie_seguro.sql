-- Script SEGURO para agregar campos de código a las tablas del análisis Bowtie
-- Este script verifica si las columnas existen antes de agregarlas
-- Ejecuta este script completo en MySQL

-- Agregar campo código a causas (si no existe)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bowtie_causas' 
    AND COLUMN_NAME = 'codigo');
    
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE bowtie_causas ADD COLUMN codigo VARCHAR(20) NULL DEFAULT NULL COMMENT ''Código de la causa (ej: CA1, CA2...)''', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar campo código a consecuencias (si no existe)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bowtie_consecuencias' 
    AND COLUMN_NAME = 'codigo');
    
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE bowtie_consecuencias ADD COLUMN codigo VARCHAR(20) NULL DEFAULT NULL COMMENT ''Código de la consecuencia (ej: CO1, CO2...)''', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar campo código a controles preventivos (si no existe)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bowtie_controles_preventivos' 
    AND COLUMN_NAME = 'codigo');
    
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE bowtie_controles_preventivos ADD COLUMN codigo VARCHAR(20) NULL DEFAULT NULL COMMENT ''Código del control preventivo (ej: CCP1, CCP2...)''', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar campo código a controles mitigadores (si no existe)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bowtie_controles_mitigadores' 
    AND COLUMN_NAME = 'codigo');
    
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE bowtie_controles_mitigadores ADD COLUMN codigo VARCHAR(20) NULL DEFAULT NULL COMMENT ''Código del control mitigador (ej: CCM1, CCM2...)''', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear índices (ejecutar individualmente - ignorar errores si ya existen)
-- Si algún índice ya existe, simplemente continuar con el siguiente

-- Índice para causas
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bowtie_causas' 
    AND INDEX_NAME = 'idx_causa_codigo');
SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_causa_codigo ON bowtie_causas(codigo)', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para consecuencias
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bowtie_consecuencias' 
    AND INDEX_NAME = 'idx_consecuencia_codigo');
SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_consecuencia_codigo ON bowtie_consecuencias(codigo)', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para controles preventivos
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bowtie_controles_preventivos' 
    AND INDEX_NAME = 'idx_preventivo_codigo');
SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_preventivo_codigo ON bowtie_controles_preventivos(codigo)', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para controles mitigadores
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bowtie_controles_mitigadores' 
    AND INDEX_NAME = 'idx_mitigador_codigo');
SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_mitigador_codigo ON bowtie_controles_mitigadores(codigo)', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear tablas de relación (si no existen)
CREATE TABLE IF NOT EXISTS bowtie_control_preventivo_causas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    control_preventivo_id INT NOT NULL,
    causa_id INT NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (control_preventivo_id) REFERENCES bowtie_controles_preventivos(id) ON DELETE CASCADE,
    FOREIGN KEY (causa_id) REFERENCES bowtie_causas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_control_causa (control_preventivo_id, causa_id),
    INDEX idx_control (control_preventivo_id),
    INDEX idx_causa (causa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS bowtie_control_mitigador_consecuencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    control_mitigador_id INT NOT NULL,
    consecuencia_id INT NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (control_mitigador_id) REFERENCES bowtie_controles_mitigadores(id) ON DELETE CASCADE,
    FOREIGN KEY (consecuencia_id) REFERENCES bowtie_consecuencias(id) ON DELETE CASCADE,
    UNIQUE KEY unique_control_consecuencia (control_mitigador_id, consecuencia_id),
    INDEX idx_control (control_mitigador_id),
    INDEX idx_consecuencia (consecuencia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
