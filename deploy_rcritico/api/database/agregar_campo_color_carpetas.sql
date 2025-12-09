-- Script para agregar campo de color personalizado a las carpetas
-- Solo para uso de super_admin

ALTER TABLE carpetas 
ADD COLUMN color_primario VARCHAR(7) NULL DEFAULT NULL COMMENT 'Color primario en formato HEX (#RRGGBB)',
ADD COLUMN color_secundario VARCHAR(7) NULL DEFAULT NULL COMMENT 'Color secundario en formato HEX (#RRGGBB)';

-- Índice para búsquedas rápidas por color (opcional)
-- CREATE INDEX idx_color_primario ON carpetas(color_primario);

