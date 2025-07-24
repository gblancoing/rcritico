-- Script para crear la tabla financiero_sap
-- Ejecutar este script en la base de datos para crear la tabla

-- Seleccionar la base de datos (cambiar 'nombre_de_tu_base' por el nombre real)
USE `financiero`;

CREATE TABLE IF NOT EXISTS `financiero`.`financiero_sap` (
  `id_sap` int(11) NOT NULL AUTO_INCREMENT,
  `proyecto_id` int(11) NOT NULL,
  `centro_costo_nombre` varchar(100) DEFAULT NULL COMMENT 'Nombre del centro de costo',
  `version_sap` varchar(50) DEFAULT NULL,
  `descripcion` varchar(50) DEFAULT NULL,
  `grupo_version` varchar(50) DEFAULT NULL,
  `periodo` date DEFAULT NULL COMMENT 'Fecha en formato YYYY-MM-DD',
  `MO` decimal(15,2) DEFAULT 0.00 COMMENT 'CONSTRUCCION',
  `IC` decimal(15,2) DEFAULT 0.00 COMMENT 'INDIRECTOS DE CONTRATISTAS',
  `EM` decimal(15,2) DEFAULT 0.00 COMMENT 'EQUIPOS Y MATERIALES',
  `IE` decimal(15,2) DEFAULT 0.00 COMMENT 'INGENIERÍA',
  `SC` decimal(15,2) DEFAULT 0.00 COMMENT 'SERVICIOS DE APOYO A LA CONSTRUCCIÓN',
  `AD` decimal(15,2) DEFAULT 0.00 COMMENT 'ADM. DEL PROYECTO',
  `CL` decimal(15,2) DEFAULT 0.00 COMMENT 'COSTOS ESPECIALES',
  `CT` decimal(15,2) DEFAULT 0.00 COMMENT 'CONTINGENCIA',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sap`),
  KEY `idx_proyecto_id` (`proyecto_id`),
  KEY `idx_periodo` (`periodo`),
  KEY `idx_version_sap` (`version_sap`),
  CONSTRAINT `fk_financiero_sap_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`proyecto_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla para almacenar datos financieros de SAP';

-- Insertar algunos datos de ejemplo (opcional)
-- INSERT INTO financiero_sap (proyecto_id, centro_costo_nombre, version_sap, descripcion, grupo_version, periodo, MO, IC, EM, IE, SC, AD, CL, CT) VALUES
-- (1, 'Centro de Costo Principal', 'V1.0', 'Descripción ejemplo', 'Grupo A', '2024-01-01', 1000000.00, 500000.00, 750000.00, 300000.00, 200000.00, 150000.00, 100000.00, 50000.00); 