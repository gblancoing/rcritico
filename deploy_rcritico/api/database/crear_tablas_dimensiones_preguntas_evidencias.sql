-- =====================================================
-- SCRIPT PARA CREAR TABLAS DE DIMENSIONES, PREGUNTAS Y EVIDENCIAS
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Tabla: bowtie_dimensiones
-- Dimensiones asociadas a controles críticos (preventivos o mitigadores)
CREATE TABLE IF NOT EXISTS bowtie_dimensiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    control_preventivo_id INT NULL COMMENT 'ID del control preventivo (si aplica)',
    control_mitigador_id INT NULL COMMENT 'ID del control mitigador (si aplica)',
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre de la dimensión (Diseño, Implementación, Entrenamiento)',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (control_preventivo_id) REFERENCES bowtie_controles_preventivos(id) ON DELETE CASCADE,
    FOREIGN KEY (control_mitigador_id) REFERENCES bowtie_controles_mitigadores(id) ON DELETE CASCADE,
    INDEX idx_control_preventivo (control_preventivo_id),
    INDEX idx_control_mitigador (control_mitigador_id),
    INDEX idx_orden (orden),
    INDEX idx_activo (activo),
    -- Asegurar que solo uno de los dos IDs sea no nulo
    CHECK ((control_preventivo_id IS NOT NULL AND control_mitigador_id IS NULL) OR 
           (control_preventivo_id IS NULL AND control_mitigador_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: bowtie_preguntas
-- Preguntas asociadas a dimensiones
CREATE TABLE IF NOT EXISTS bowtie_preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dimension_id INT NOT NULL,
    texto TEXT NOT NULL COMMENT 'Texto de la pregunta',
    evidencia TEXT NULL DEFAULT NULL COMMENT 'Evidencia asociada a la pregunta',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (dimension_id) REFERENCES bowtie_dimensiones(id) ON DELETE CASCADE,
    INDEX idx_dimension (dimension_id),
    INDEX idx_orden (orden),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

