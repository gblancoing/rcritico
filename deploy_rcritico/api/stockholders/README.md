# Informes Stockholders - Documentación

## Descripción
Este módulo permite gestionar informes para stockholders y asociarlos con el reporte ejecutivo generado desde el Dashboard.

## Instalación

### 1. Crear la tabla en la base de datos

Ejecuta el siguiente SQL en tu base de datos MySQL:

```sql
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
```

O ejecuta directamente el archivo SQL:
```bash
mysql -u tu_usuario -p tu_base_datos < api/database/create_informes_stockholders_table.sql
```

## Uso

### Crear un Informe Stockholder

1. Ve a la sección "Informes Stockholders" en el proyecto
2. Haz clic en "Nuevo Informe"
3. Completa el formulario:
   - **Título**: Título del informe
   - **Descripción**: Descripción del informe
   - **Fecha**: Fecha del informe
   - **Período**: Período que cubre (ej: "Q3 2024", "Noviembre 2024")
   - **Destinatarios**: A quién va dirigido (ej: "Accionistas, Board of Directors")
   - **Tipo**: Ejecutivo, Técnico o Financiero
4. Haz clic en "Crear Informe"

### Asociar Reporte Ejecutivo

Una vez creado el informe:

1. En la tarjeta del informe, verás un botón "Asociar Reporte" si no tiene reporte asociado
2. Haz clic en "Asociar Reporte"
3. Se asociará automáticamente el reporte ejecutivo generado desde el Dashboard
4. El botón cambiará a "Ver PDF" para acceder al reporte

### Ver/Descargar el Reporte

Si el informe tiene un reporte ejecutivo asociado:
- Haz clic en "Ver PDF" para abrir el reporte en una nueva ventana
- El reporte se genera dinámicamente con los datos actuales del proyecto

## Endpoints API

### GET `/api/stockholders/informes.php?proyecto_id={id}`
Lista todos los informes de un proyecto.

### GET `/api/stockholders/informes.php?id={id}&proyecto_id={id}`
Obtiene un informe específico.

### POST `/api/stockholders/informes.php?proyecto_id={id}`
Crea un nuevo informe.

**Body (JSON):**
```json
{
  "titulo": "Informe Trimestral Q3 2024",
  "descripcion": "Resumen ejecutivo...",
  "fecha": "2024-09-30",
  "periodo": "Q3 2024",
  "destinatarios": "Accionistas, Board of Directors",
  "tipo": "Ejecutivo",
  "estado": "Borrador",
  "portada": "/img/fondo-codelco.png"
}
```

### PUT `/api/stockholders/informes.php?id={id}&proyecto_id={id}`
Actualiza un informe existente.

### DELETE `/api/stockholders/informes.php?id={id}&proyecto_id={id}`
Elimina un informe.

### POST `/api/stockholders/asociar_reporte.php`
Asocia el reporte ejecutivo a un informe.

**Body (JSON):**
```json
{
  "informe_id": 1,
  "proyecto_id": 1
}
```

## Notas

- El reporte ejecutivo se genera dinámicamente cada vez que se accede, por lo que siempre mostrará los datos actuales del proyecto
- La ruta del PDF almacenada es: `/api/dashboard/generar_reporte_pdf.php?proyecto_id={id}&pdf=1`
- Los informes están vinculados al proyecto mediante `proyecto_id` y se eliminan automáticamente si se elimina el proyecto (CASCADE)

