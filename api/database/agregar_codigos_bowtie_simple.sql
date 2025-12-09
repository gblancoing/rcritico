-- Script SIMPLE para agregar campos de código a las tablas del análisis Bowtie
-- Ejecuta cada comando por separado o todo junto
-- Si una columna ya existe, verás un error que puedes ignorar

-- 1. Agregar campo código a causas
ALTER TABLE bowtie_causas ADD COLUMN codigo VARCHAR(20) NULL DEFAULT NULL COMMENT 'Código de la causa (ej: CA1, CA2...)';

-- 2. Agregar campo código a consecuencias
ALTER TABLE bowtie_consecuencias ADD COLUMN codigo VARCHAR(20) NULL DEFAULT NULL COMMENT 'Código de la consecuencia (ej: CO1, CO2...)';

-- 3. Agregar campo código a controles preventivos
ALTER TABLE bowtie_controles_preventivos ADD COLUMN codigo VARCHAR(20) NULL DEFAULT NULL COMMENT 'Código del control preventivo (ej: CCP1, CCP2...)';

-- 4. Agregar campo código a controles mitigadores
ALTER TABLE bowtie_controles_mitigadores ADD COLUMN codigo VARCHAR(20) NULL DEFAULT NULL COMMENT 'Código del control mitigador (ej: CCM1, CCM2...)';

-- 5. Crear índices (ignorar errores si ya existen)
CREATE INDEX idx_causa_codigo ON bowtie_causas(codigo);
CREATE INDEX idx_consecuencia_codigo ON bowtie_consecuencias(codigo);
CREATE INDEX idx_preventivo_codigo ON bowtie_controles_preventivos(codigo);
CREATE INDEX idx_mitigador_codigo ON bowtie_controles_mitigadores(codigo);

-- 6. Crear tablas de relación (si no existen)
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

