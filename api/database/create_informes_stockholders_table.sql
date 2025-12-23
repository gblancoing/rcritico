-- Tabla para almacenar Informes Stockholders
CREATE TABLE IF NOT EXISTS `informes_stockholders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proyecto_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha` date NOT NULL,
  `periodo` varchar(100) DEFAULT NULL,
  `destinatarios` varchar(255) DEFAULT NULL,
  `tipo` enum('Ejecutivo','Técnico','Financiero') DEFAULT 'Ejecutivo',
  `estado` enum('Borrador','En Revisión','Publicado') DEFAULT 'Borrador',
  `ruta_pdf` varchar(500) DEFAULT NULL COMMENT 'Ruta al PDF del reporte ejecutivo asociado',
  `portada` varchar(500) DEFAULT '/img/fondo-codelco.png',
  `fecha_creacion` datetime NOT NULL,
  `fecha_actualizacion` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_proyecto_id` (`proyecto_id`),
  CONSTRAINT `fk_informes_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`proyecto_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

