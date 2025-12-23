-- Agregar columna para parámetros de personalización del informe
ALTER TABLE `informes_stockholders` 
ADD COLUMN `parametros_reporte` JSON DEFAULT NULL COMMENT 'Parámetros de personalización del reporte (secciones a incluir, filtros, etc.)' 
AFTER `ruta_pdf`;

