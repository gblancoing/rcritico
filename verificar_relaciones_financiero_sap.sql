-- Script para verificar las relaciones entre tablas
-- Ejecutar este script para verificar que las foreign keys estén correctamente configuradas

USE `financiero`;

-- Verificar la estructura de la tabla financiero_sap
DESCRIBE `financiero_sap`;

-- Verificar las foreign keys de la tabla financiero_sap
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE 
    TABLE_SCHEMA = 'financiero' 
    AND TABLE_NAME = 'financiero_sap' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verificar que existen datos en las tablas relacionadas
SELECT 'Proyectos' as tabla, COUNT(*) as cantidad FROM proyectos;
SELECT 'Centros de Costo' as tabla, COUNT(*) as cantidad FROM centros_costo;
SELECT 'Financiero SAP' as tabla, COUNT(*) as cantidad FROM financiero_sap;

-- Verificar la relación entre proyectos y centros_costo
SELECT 
    p.proyecto_id,
    p.nombre as proyecto_nombre,
    cc.id as centro_costo_id,
    cc.nombre as centro_costo_nombre
FROM 
    proyectos p
    LEFT JOIN centros_costo cc ON p.proyecto_id = cc.proyecto_id
ORDER BY 
    p.proyecto_id; 