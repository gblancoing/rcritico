-- =====================================================
-- SCRIPT PARA AGREGAR CAMPOS A TABLA DE CONTROLES MITIGADORES BOWTIE
-- Sistema de Control y Gestión de Archivos SSO Codelco
-- =====================================================

-- Agregar campo criticidad a bowtie_controles_mitigadores
ALTER TABLE bowtie_controles_mitigadores 
ADD COLUMN criticidad VARCHAR(50) NULL DEFAULT NULL COMMENT 'Criticidad del control mitigador (ej: Crítico, No crítico)' 
AFTER descripcion;

-- Agregar campo jerarquia a bowtie_controles_mitigadores
ALTER TABLE bowtie_controles_mitigadores 
ADD COLUMN jerarquia VARCHAR(50) NULL DEFAULT NULL COMMENT 'Jerarquía del control mitigador (ej: Aislamiento, Administrativo, etc.)' 
AFTER criticidad;

-- Agregar índices para búsquedas por criticidad y jerarquía
CREATE INDEX idx_criticidad_mitigador ON bowtie_controles_mitigadores(criticidad);
CREATE INDEX idx_jerarquia_mitigador ON bowtie_controles_mitigadores(jerarquia);

