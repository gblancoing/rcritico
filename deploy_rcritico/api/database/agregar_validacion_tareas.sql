-- =====================================================
-- SCRIPT PARA AGREGAR CAMPOS DE VALIDACIÓN A TAREAS
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Agregar campos para validación de tareas
ALTER TABLE carpeta_tareas 
ADD COLUMN IF NOT EXISTS estado_validacion ENUM('pendiente', 'validada', 'rechazada') DEFAULT 'pendiente' AFTER estado,
ADD COLUMN IF NOT EXISTS validada_por INT NULL AFTER estado_validacion,
ADD COLUMN IF NOT EXISTS validada_en DATETIME NULL AFTER validada_por,
ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT NULL AFTER validada_en,
ADD INDEX idx_estado_validacion (estado_validacion),
ADD INDEX idx_validada_por (validada_por),
ADD FOREIGN KEY (validada_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Actualizar tareas existentes: si están completadas pero no tienen validación, marcar como pendiente de validación
UPDATE carpeta_tareas 
SET estado_validacion = 'pendiente' 
WHERE estado = 'completada' AND (estado_validacion IS NULL OR estado_validacion = 'pendiente');

