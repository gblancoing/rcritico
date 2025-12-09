-- Script para agregar campos de Peligro, Energía y Evento Top al análisis Bowtie
-- Estos campos reemplazan el campo único evento_central

ALTER TABLE carpeta_bowtie 
ADD COLUMN peligro TEXT NULL DEFAULT NULL COMMENT 'Peligro identificado en el análisis Bowtie',
ADD COLUMN energia TEXT NULL DEFAULT NULL COMMENT 'Energía(s) asociada(s) al peligro',
ADD COLUMN evento_top TEXT NULL DEFAULT NULL COMMENT 'Evento Top del análisis Bowtie';

-- Mantener evento_central por compatibilidad, pero se recomienda usar los nuevos campos
-- El campo evento_central puede ser eliminado en futuras versiones

