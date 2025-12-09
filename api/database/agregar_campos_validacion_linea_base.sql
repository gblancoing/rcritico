-- =====================================================
-- SCRIPT PARA AGREGAR CAMPOS DE VALIDACIÓN Y PONDERACIÓN
-- A LAS TABLAS DE LÍNEA BASE
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================
-- 
-- NOTA: Este script intenta agregar columnas. Si una columna ya existe, 
-- se generará un error que puede ignorarse de forma segura.
-- Ejecute cada sentencia una por una o use un cliente SQL que maneje errores.
--
-- Alternativamente, ejecute este script desde PHP o use el método automático
-- que está implementado en carpeta_linea_base.php y carpeta_linea_base_mitigadores.php
-- =====================================================

-- =====================================================
-- TABLA: carpeta_linea_base (Preventivos)
-- =====================================================

-- Agregar estado_validacion
ALTER TABLE carpeta_linea_base 
ADD COLUMN estado_validacion VARCHAR(50) NULL COMMENT 'Estado: validado, con_observaciones, o NULL';

-- Agregar comentario_validacion
ALTER TABLE carpeta_linea_base 
ADD COLUMN comentario_validacion TEXT NULL COMMENT 'Comentarios de observaciones';

-- Agregar usuario_validacion
ALTER TABLE carpeta_linea_base 
ADD COLUMN usuario_validacion VARCHAR(255) NULL COMMENT 'Usuario que validó/comentó (formato: nombre|fecha)';

-- Agregar fecha_validacion
ALTER TABLE carpeta_linea_base 
ADD COLUMN fecha_validacion DATETIME NULL COMMENT 'Fecha y hora de la validación';

-- Agregar ponderacion
ALTER TABLE carpeta_linea_base 
ADD COLUMN ponderacion DECIMAL(5,2) NULL COMMENT 'Ponderación: 100 si validado, 0 si observaciones o null';

-- Crear índice para estado_validacion
CREATE INDEX idx_estado_validacion ON carpeta_linea_base(estado_validacion);

-- Crear índice para ponderacion
CREATE INDEX idx_ponderacion ON carpeta_linea_base(ponderacion);

-- =====================================================
-- TABLA: carpeta_linea_base_mitigadores (Mitigadores)
-- =====================================================

-- Agregar estado_validacion
ALTER TABLE carpeta_linea_base_mitigadores 
ADD COLUMN estado_validacion VARCHAR(50) NULL COMMENT 'Estado: validado, con_observaciones, o NULL';

-- Agregar comentario_validacion
ALTER TABLE carpeta_linea_base_mitigadores 
ADD COLUMN comentario_validacion TEXT NULL COMMENT 'Comentarios de observaciones';

-- Agregar usuario_validacion
ALTER TABLE carpeta_linea_base_mitigadores 
ADD COLUMN usuario_validacion VARCHAR(255) NULL COMMENT 'Usuario que validó/comentó (formato: nombre|fecha)';

-- Agregar fecha_validacion
ALTER TABLE carpeta_linea_base_mitigadores 
ADD COLUMN fecha_validacion DATETIME NULL COMMENT 'Fecha y hora de la validación';

-- Agregar ponderacion
ALTER TABLE carpeta_linea_base_mitigadores 
ADD COLUMN ponderacion DECIMAL(5,2) NULL COMMENT 'Ponderación: 100 si validado, 0 si observaciones o null';

-- Crear índice para estado_validacion
CREATE INDEX idx_estado_validacion_mitigadores ON carpeta_linea_base_mitigadores(estado_validacion);

-- Crear índice para ponderacion
CREATE INDEX idx_ponderacion_mitigadores ON carpeta_linea_base_mitigadores(ponderacion);
