-- =====================================================
-- SCRIPT SEGURO PARA AGREGAR CAMPOS DE VALIDACIÓN Y PONDERACIÓN
-- A LAS TABLAS DE LÍNEA BASE
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================
-- 
-- Este script verifica si las columnas existen antes de agregarlas
-- Funciona con MySQL 5.7+ y MariaDB 10.2+
-- =====================================================

DELIMITER $$

-- Procedimiento para agregar columna si no existe (Preventivos)
DROP PROCEDURE IF EXISTS agregar_columnas_validacion_preventivos$$
CREATE PROCEDURE agregar_columnas_validacion_preventivos()
BEGIN
    DECLARE CONTINUE HANDLER FOR 1060 BEGIN END; -- Error: Duplicate column name
    
    -- Agregar estado_validacion
    SET @sql = 'ALTER TABLE carpeta_linea_base ADD COLUMN estado_validacion VARCHAR(50) NULL COMMENT ''Estado: validado, con_observaciones, o NULL''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Agregar comentario_validacion
    SET @sql = 'ALTER TABLE carpeta_linea_base ADD COLUMN comentario_validacion TEXT NULL COMMENT ''Comentarios de observaciones''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Agregar usuario_validacion
    SET @sql = 'ALTER TABLE carpeta_linea_base ADD COLUMN usuario_validacion VARCHAR(255) NULL COMMENT ''Usuario que validó/comentó (formato: nombre|fecha)''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Agregar fecha_validacion
    SET @sql = 'ALTER TABLE carpeta_linea_base ADD COLUMN fecha_validacion DATETIME NULL COMMENT ''Fecha y hora de la validación''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Agregar ponderacion
    SET @sql = 'ALTER TABLE carpeta_linea_base ADD COLUMN ponderacion DECIMAL(5,2) NULL COMMENT ''Ponderación: 100 si validado, 0 si observaciones o null''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

-- Procedimiento para agregar columna si no existe (Mitigadores)
DROP PROCEDURE IF EXISTS agregar_columnas_validacion_mitigadores$$
CREATE PROCEDURE agregar_columnas_validacion_mitigadores()
BEGIN
    DECLARE CONTINUE HANDLER FOR 1060 BEGIN END; -- Error: Duplicate column name
    
    -- Agregar estado_validacion
    SET @sql = 'ALTER TABLE carpeta_linea_base_mitigadores ADD COLUMN estado_validacion VARCHAR(50) NULL COMMENT ''Estado: validado, con_observaciones, o NULL''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Agregar comentario_validacion
    SET @sql = 'ALTER TABLE carpeta_linea_base_mitigadores ADD COLUMN comentario_validacion TEXT NULL COMMENT ''Comentarios de observaciones''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Agregar usuario_validacion
    SET @sql = 'ALTER TABLE carpeta_linea_base_mitigadores ADD COLUMN usuario_validacion VARCHAR(255) NULL COMMENT ''Usuario que validó/comentó (formato: nombre|fecha)''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Agregar fecha_validacion
    SET @sql = 'ALTER TABLE carpeta_linea_base_mitigadores ADD COLUMN fecha_validacion DATETIME NULL COMMENT ''Fecha y hora de la validación''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Agregar ponderacion
    SET @sql = 'ALTER TABLE carpeta_linea_base_mitigadores ADD COLUMN ponderacion DECIMAL(5,2) NULL COMMENT ''Ponderación: 100 si validado, 0 si observaciones o null''';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

-- Ejecutar los procedimientos
CALL agregar_columnas_validacion_preventivos();
CALL agregar_columnas_validacion_mitigadores();

-- Crear índices (si no existen, se generará un error que puede ignorarse)
CREATE INDEX idx_estado_validacion ON carpeta_linea_base(estado_validacion);
CREATE INDEX idx_ponderacion ON carpeta_linea_base(ponderacion);
CREATE INDEX idx_estado_validacion_mitigadores ON carpeta_linea_base_mitigadores(estado_validacion);
CREATE INDEX idx_ponderacion_mitigadores ON carpeta_linea_base_mitigadores(ponderacion);

-- Limpiar procedimientos temporales
DROP PROCEDURE IF EXISTS agregar_columnas_validacion_preventivos;
DROP PROCEDURE IF EXISTS agregar_columnas_validacion_mitigadores;

