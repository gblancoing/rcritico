-- =====================================================
-- TABLA: archivos_carpetas
-- Carpetas específicas para la pestaña "Archivos" del nivel 1
-- Permite organizar archivos en carpetas y subcarpetas
-- =====================================================

CREATE TABLE IF NOT EXISTS archivos_carpetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    carpeta_id INT NOT NULL,                    -- ID de la carpeta principal (nivel 1) a la que pertenece
    carpeta_padre_id INT NULL,                  -- Para subcarpetas (NULL = carpeta raíz de archivos)
    creado_por INT NOT NULL,                    -- usuario_id del creador
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    color VARCHAR(7) DEFAULT '#17a2b8',         -- Color de la carpeta (hex)
    icono VARCHAR(50) DEFAULT 'fa-folder',      -- Icono de FontAwesome
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    FOREIGN KEY (carpeta_padre_id) REFERENCES archivos_carpetas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_carpeta_padre (carpeta_padre_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Modificar tabla archivos para agregar referencia a archivos_carpetas
ALTER TABLE archivos 
ADD COLUMN archivos_carpeta_id INT NULL AFTER carpeta_id,
ADD FOREIGN KEY (archivos_carpeta_id) REFERENCES archivos_carpetas(id) ON DELETE SET NULL,
ADD INDEX idx_archivos_carpeta (archivos_carpeta_id);

