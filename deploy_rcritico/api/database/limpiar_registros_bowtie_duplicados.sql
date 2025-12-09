-- Script para limpiar registros duplicados e inactivos de las tablas Bowtie
-- Este script elimina permanentemente los registros marcados como activo=0

-- Eliminar causas inactivas
DELETE FROM bowtie_causas WHERE activo = 0;

-- Eliminar consecuencias inactivas
DELETE FROM bowtie_consecuencias WHERE activo = 0;

-- Eliminar controles preventivos inactivos
DELETE FROM bowtie_controles_preventivos WHERE activo = 0;

-- Eliminar controles mitigadores inactivos
DELETE FROM bowtie_controles_mitigadores WHERE activo = 0;

-- Verificar que los registros activos tengan códigos asignados
-- Si no tienen código, asignarles uno basado en su orden
UPDATE bowtie_causas 
SET codigo = CONCAT('CA', orden + 1) 
WHERE activo = 1 AND (codigo IS NULL OR codigo = '');

UPDATE bowtie_consecuencias 
SET codigo = CONCAT('CO', orden + 1) 
WHERE activo = 1 AND (codigo IS NULL OR codigo = '');

UPDATE bowtie_controles_preventivos 
SET codigo = CONCAT('CCP', orden + 1) 
WHERE activo = 1 AND (codigo IS NULL OR codigo = '');

UPDATE bowtie_controles_mitigadores 
SET codigo = CONCAT('CCM', orden + 1) 
WHERE activo = 1 AND (codigo IS NULL OR codigo = '');

