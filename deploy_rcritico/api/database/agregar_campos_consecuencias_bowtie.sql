-- =====================================================
-- SCRIPT PARA AGREGAR CAMPOS A TABLA DE CONSECUENCIAS BOWTIE
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Agregar campo evento_no_deseado a bowtie_consecuencias
ALTER TABLE bowtie_consecuencias 
ADD COLUMN evento_no_deseado TEXT NULL DEFAULT NULL COMMENT 'Evento no deseado asociado a la consecuencia' 
AFTER descripcion;

-- Agregar campo categoria a bowtie_consecuencias
ALTER TABLE bowtie_consecuencias 
ADD COLUMN categoria VARCHAR(50) NULL DEFAULT NULL COMMENT 'Categoría de la consecuencia (ej: SSO, Medio Ambiente, etc.)' 
AFTER evento_no_deseado;

-- Agregar índice para búsquedas por categoría
CREATE INDEX idx_categoria ON bowtie_consecuencias(categoria);

