-- Tabla para registrar notificaciones de tareas enviadas
-- Evita enviar múltiples notificaciones para la misma tarea en el mismo día

CREATE TABLE IF NOT EXISTS tarea_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tarea_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_notificacion ENUM('vencimiento_proximo', 'vencimiento_hoy', 'vencido') DEFAULT 'vencimiento_proximo',
    fecha_notificacion DATE NOT NULL,
    enviado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (tarea_id) REFERENCES carpeta_tareas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY idx_unique_notificacion (tarea_id, usuario_id, tipo_notificacion, fecha_notificacion),
    INDEX idx_tarea (tarea_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_notificacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

