-- =====================================================
-- SCRIPT PARA CREAR TABLA DE ARCHIVOS ADJUNTOS DE TAREAS
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Tabla: carpeta_tarea_adjuntos
-- Archivos adjuntos a las tareas (documentos de apoyo)
CREATE TABLE IF NOT EXISTS carpeta_tarea_adjuntos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tarea_id INT NOT NULL,
    usuario_id INT NOT NULL, -- Usuario que adjuntó el archivo
    nombre_original VARCHAR(255) NOT NULL, -- Nombre original del archivo
    nombre_archivo VARCHAR(255) NOT NULL, -- Nombre del archivo en el servidor
    ruta_archivo VARCHAR(500) NOT NULL, -- Ruta completa del archivo en el servidor
    tipo_mime VARCHAR(100), -- Tipo MIME del archivo
    tamano BIGINT, -- Tamaño del archivo en bytes
    descripcion TEXT, -- Descripción opcional del adjunto
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (tarea_id) REFERENCES carpeta_tareas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_tarea (tarea_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_creado_en (creado_en),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

