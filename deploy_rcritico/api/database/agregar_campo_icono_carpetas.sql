-- Script para agregar campo de icono personalizado a las carpetas
-- Permite subir una imagen/icono representativo para cada carpeta

ALTER TABLE carpetas 
ADD COLUMN icono_url VARCHAR(500) NULL DEFAULT NULL COMMENT 'URL o ruta del icono/imagen de la carpeta';

-- Índice para búsquedas rápidas (opcional)
-- CREATE INDEX idx_icono_url ON carpetas(icono_url);

