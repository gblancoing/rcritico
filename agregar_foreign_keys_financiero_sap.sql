-- Script para agregar foreign keys a la tabla financiero_sap existente
-- Ejecutar este script si la tabla ya fue creada sin foreign keys

USE `financiero`;

-- Agregar foreign key para proyecto_id
ALTER TABLE `financiero_sap` 
ADD CONSTRAINT `fk_financiero_sap_proyecto` 
FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`proyecto_id`) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Verificar que la foreign key se agregó correctamente
SHOW CREATE TABLE `financiero_sap`; 