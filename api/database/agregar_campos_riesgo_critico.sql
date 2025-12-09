-- Script para agregar campos de información de riesgo crítico a las carpetas
-- Permite almacenar información estructurada sobre el riesgo crítico asociado a cada carpeta
-- Estructura: Supervisor y Trabajador, cada uno con Controles Preventivos y Mitigadores

ALTER TABLE carpetas 
ADD COLUMN evento_no_deseado TEXT NULL DEFAULT NULL COMMENT 'Evento no deseado del riesgo crítico (ej: CONTACTO CON ENERGÍA ELÉCTRICA)',
ADD COLUMN evento_riesgo TEXT NULL DEFAULT NULL COMMENT 'Evento de riesgo asociado (ej: INTERACCIÓN CON ENERGÍA ELÉCTRICA)',
ADD COLUMN controles_supervisor TEXT NULL DEFAULT NULL COMMENT 'Controles del supervisor en formato JSON: {preventivos: [{numero, descripcion, pregunta, respuesta}], mitigadores: [{numero, descripcion, pregunta, respuesta}]}',
ADD COLUMN controles_trabajador TEXT NULL DEFAULT NULL COMMENT 'Controles del trabajador en formato JSON: {preventivos: [{numero, descripcion, pregunta, respuesta}], mitigadores: [{numero, descripcion, pregunta, respuesta}]}',
ADD COLUMN informacion_riesgo TEXT NULL DEFAULT NULL COMMENT 'Información completa del riesgo crítico para uso con chatbot (formato texto plano)';

-- Índice para búsquedas rápidas por evento de riesgo (opcional)
-- CREATE INDEX idx_evento_riesgo ON carpetas(evento_riesgo(100));

