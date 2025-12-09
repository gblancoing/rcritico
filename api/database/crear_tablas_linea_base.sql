-- =====================================================
-- SCRIPT PARA CREAR TABLAS DE LÍNEA BASE
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Tabla: carpeta_linea_base
-- Almacena la línea base de controles críticos preventivos
CREATE TABLE IF NOT EXISTS carpeta_linea_base (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carpeta_id INT NOT NULL,
    control_preventivo_id INT NULL,
    codigo VARCHAR(50) NULL,
    dimension TEXT NULL,
    pregunta TEXT NULL,
    evidencia TEXT NULL,
    verificador_responsable TEXT NULL,
    fecha_verificacion DATE NULL,
    implementado_estandar VARCHAR(10) NULL,
    accion_ejecutar TEXT NULL,
    responsable_cierre TEXT NULL,
    fecha_cierre DATE NULL,
    criticidad VARCHAR(50) NULL,
    porcentaje_avance DECIMAL(5,2) NULL,
    nombre_dueno_control TEXT NULL,
    ultimo_usuario_edito VARCHAR(255) NULL,
    estado_validacion VARCHAR(50) NULL COMMENT 'Estado: validado, con_observaciones, o NULL',
    comentario_validacion TEXT NULL COMMENT 'Comentarios de observaciones',
    usuario_validacion VARCHAR(255) NULL COMMENT 'Usuario que validó/comentó (formato: nombre|fecha)',
    fecha_validacion DATETIME NULL COMMENT 'Fecha y hora de la validación',
    ponderacion DECIMAL(5,2) NULL COMMENT 'Ponderación: 100 si validado, 0 si observaciones o null',
    orden INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_control_preventivo (control_preventivo_id),
    INDEX idx_activo (activo),
    INDEX idx_estado_validacion (estado_validacion),
    INDEX idx_ponderacion (ponderacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: carpeta_linea_base_mitigadores
-- Almacena la línea base de controles críticos mitigadores
CREATE TABLE IF NOT EXISTS carpeta_linea_base_mitigadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carpeta_id INT NOT NULL,
    control_mitigador_id INT NULL,
    codigo VARCHAR(50) NULL,
    dimension TEXT NULL,
    pregunta TEXT NULL,
    evidencia TEXT NULL,
    verificador_responsable TEXT NULL,
    fecha_verificacion DATE NULL,
    implementado_estandar VARCHAR(10) NULL,
    accion_ejecutar TEXT NULL,
    responsable_cierre TEXT NULL,
    fecha_cierre DATE NULL,
    criticidad VARCHAR(50) NULL,
    porcentaje_avance DECIMAL(5,2) NULL,
    nombre_dueno_control TEXT NULL,
    ultimo_usuario_edito VARCHAR(255) NULL,
    estado_validacion VARCHAR(50) NULL COMMENT 'Estado: validado, con_observaciones, o NULL',
    comentario_validacion TEXT NULL COMMENT 'Comentarios de observaciones',
    usuario_validacion VARCHAR(255) NULL COMMENT 'Usuario que validó/comentó (formato: nombre|fecha)',
    fecha_validacion DATETIME NULL COMMENT 'Fecha y hora de la validación',
    ponderacion DECIMAL(5,2) NULL COMMENT 'Ponderación: 100 si validado, 0 si observaciones o null',
    orden INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id) ON DELETE CASCADE,
    INDEX idx_carpeta (carpeta_id),
    INDEX idx_control_mitigador (control_mitigador_id),
    INDEX idx_activo (activo),
    INDEX idx_estado_validacion (estado_validacion),
    INDEX idx_ponderacion (ponderacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

