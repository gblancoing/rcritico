-- =====================================================
-- SCRIPT PARA CREAR TABLA DE ASIGNACIONES MÚLTIPLES DE TAREAS
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Tabla: carpeta_tarea_asignaciones
-- Permite asignar una tarea a múltiples usuarios
CREATE TABLE IF NOT EXISTS carpeta_tarea_asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tarea_id INT NOT NULL,
    usuario_id INT NOT NULL,
    asignado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (tarea_id) REFERENCES carpeta_tareas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tarea_usuario (tarea_id, usuario_id),
    INDEX idx_tarea (tarea_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migrar datos existentes de asignado_a a la nueva tabla
INSERT INTO carpeta_tarea_asignaciones (tarea_id, usuario_id, asignado_en, activo)
SELECT id, asignado_a, creado_en, 1
FROM carpeta_tareas
WHERE asignado_a IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM carpeta_tarea_asignaciones 
    WHERE carpeta_tarea_asignaciones.tarea_id = carpeta_tareas.id 
    AND carpeta_tarea_asignaciones.usuario_id = carpeta_tareas.asignado_a
);

