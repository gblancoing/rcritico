-- Tabla de relación many-to-many entre usuarios y empresas
-- Un usuario puede estar asociado a una empresa contratista
CREATE TABLE IF NOT EXISTS usuario_empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    empresa_id VARCHAR(50) NOT NULL COMMENT 'RUT de la empresa',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_empresa (usuario_id, empresa_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_empresa_id (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

