-- =====================================================
-- SCRIPT SQL: Tablas para Documentos de Línea Base
-- Sistema de carpetas y archivos tipo OneDrive
-- =====================================================
-- Fecha: 2025-11-27
-- =====================================================

-- Tabla de carpetas (estructura jerárquica infinita)
CREATE TABLE IF NOT EXISTS linea_base_carpetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    linea_base_id INT NOT NULL COMMENT 'ID del registro de línea base',
    carpeta_padre_id INT DEFAULT NULL COMMENT 'NULL = carpeta raíz, ID = subcarpeta',
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    color VARCHAR(7) DEFAULT '#17a2b8' COMMENT 'Color del icono de carpeta',
    creado_por INT NOT NULL COMMENT 'ID del usuario que creó',
    creado_por_nombre VARCHAR(255) DEFAULT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    
    INDEX idx_linea_base (linea_base_id),
    INDEX idx_carpeta_padre (carpeta_padre_id),
    INDEX idx_activo (activo),
    
    FOREIGN KEY (carpeta_padre_id) REFERENCES linea_base_carpetas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla de archivos
CREATE TABLE IF NOT EXISTS linea_base_archivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    linea_base_id INT NOT NULL COMMENT 'ID del registro de línea base',
    carpeta_id INT DEFAULT NULL COMMENT 'NULL = raíz, ID = dentro de carpeta',
    nombre_original VARCHAR(255) NOT NULL COMMENT 'Nombre original del archivo',
    nombre_archivo VARCHAR(255) NOT NULL COMMENT 'Nombre único en el servidor',
    ruta VARCHAR(500) NOT NULL COMMENT 'Ruta relativa del archivo',
    tipo_mime VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    extension VARCHAR(20) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    subido_por INT NOT NULL COMMENT 'ID del usuario que subió',
    subido_por_nombre VARCHAR(255) DEFAULT NULL,
    subido_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    
    INDEX idx_linea_base (linea_base_id),
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_activo (activo),
    INDEX idx_extension (extension),
    
    FOREIGN KEY (carpeta_id) REFERENCES linea_base_carpetas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- NOTAS:
-- 1. linea_base_id conecta con carpeta_linea_base.id
-- 2. carpeta_padre_id = NULL significa carpeta raíz
-- 3. Los archivos pueden estar en raíz (carpeta_id = NULL)
--    o dentro de una carpeta específica
-- =====================================================

