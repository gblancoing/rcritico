-- Seleccionar la base de datos
USE `financiero`;

-- Eliminar tabla existente si existe
DROP TABLE IF EXISTS `predictividad_parcial`;

-- Crear tabla predictividad_parcial igual a real_parcial
CREATE TABLE `predictividad_parcial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proyecto_id` int(11) NOT NULL,
  `centro_costo` varchar(100) DEFAULT NULL,
  `periodo` date DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `cat_vp` varchar(30) DEFAULT NULL,
  `detalle_factorial` varchar(100) DEFAULT NULL,
  `monto` decimal(18,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_predictividad_parcial_proyecto` (`proyecto_id`),
  KEY `idx_predictividad_parcial_cat_vp` (`cat_vp`),
  KEY `idx_predictividad_parcial_periodo` (`periodo`),
  KEY `idx_predictividad_parcial_centro_costo` (`centro_costo`),
  CONSTRAINT `predictividad_parcial_ibfk_1` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`proyecto_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci; 