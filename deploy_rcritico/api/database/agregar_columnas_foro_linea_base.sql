-- =====================================================
-- SCRIPT SQL: Agregar columnas para Foro de Seguimiento
-- =====================================================

-- TABLA: carpeta_linea_base (Controles Preventivos)
ALTER TABLE carpeta_linea_base 
  ADD COLUMN comentario_trabajador TEXT DEFAULT NULL,
  ADD COLUMN archivos_respaldo TEXT DEFAULT NULL,
  ADD COLUMN conversacion_seguimiento LONGTEXT DEFAULT NULL;

-- TABLA: carpeta_linea_base_mitigadores (Controles Mitigadores)
ALTER TABLE carpeta_linea_base_mitigadores 
  ADD COLUMN comentario_trabajador TEXT DEFAULT NULL,
  ADD COLUMN archivos_respaldo TEXT DEFAULT NULL,
  ADD COLUMN conversacion_seguimiento LONGTEXT DEFAULT NULL;
