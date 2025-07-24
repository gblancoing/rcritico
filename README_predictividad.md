# Módulo de Predictividad

## Descripción
El módulo de predictividad permite analizar la precisión de las predicciones realizadas en proyectos, comparando valores predichos con valores reales para evaluar la eficiencia de los modelos predictivos.

## Estructura de la Base de Datos

### Tabla: `predictividad`
```sql
CREATE TABLE `predictividad` (
  `id_predictivo` int(11) NOT NULL AUTO_INCREMENT,
  `proyecto_id` int(11) NOT NULL,
  `id` int(11) NOT NULL,
  `prediccion` enum('Fisica','Financiera') NOT NULL,
  `pasado_predictivo` varchar(7) NOT NULL COMMENT 'Formato MM-YYYY',
  `futuro_predictivo` varchar(7) NOT NULL COMMENT 'Formato MM-YYYY',
  `valor_pasado_predictivo` decimal(15,2) NOT NULL,
  `valor_real` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id_predictivo`),
  KEY `fk_predictividad_proyecto` (`proyecto_id`),
  KEY `fk_predictividad_centro_costo` (`id`),
  CONSTRAINT `fk_predictividad_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`proyecto_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_predictividad_centro_costo` FOREIGN KEY (`id`) REFERENCES `centros_costo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## Archivos del Sistema

### Backend (PHP)
- `api/predictividad/predictividad.php` - API para obtener datos de predictividad
- `api/predictividad/insertar_predictividad.php` - API para insertar/actualizar datos de predictividad

### Frontend (React)
- `src/analisis/Reportabilidad.js` - Componente principal que incluye la pestaña de predictividad

## Funcionalidades

### 1. Visualización de Datos
- **Gráfica de líneas**: Muestra la evolución de predicciones vs realidad
- **Estadísticas generales**: Precisión promedio, predicciones eficientes, tipos de predicción
- **Tabla detallada**: Información completa de cada predicción

### 2. Métricas Calculadas
- **Precisión**: Porcentaje de acierto de la predicción
- **Eficiencia**: Si el valor real es mayor o igual al predicho
- **Diferencia**: Valor absoluto entre predicción y realidad
- **Diferencia porcentual**: Porcentaje de variación

### 3. Filtros Disponibles
- Por proyecto
- Por centro de costo
- Por tipo de predicción (Física/Financiera)
- Por período predictivo

## Uso de las APIs

### Obtener Datos de Predictividad
```javascript
// GET /api/predictividad/predictividad.php
const response = await fetch(`${API_BASE}/predictividad/predictividad.php?proyecto_id=1`);
const data = await response.json();
```

**Parámetros opcionales:**
- `proyecto_id` - ID del proyecto
- `centro_costo_id` - ID del centro de costo
- `prediccion` - "Fisica" o "Financiera"
- `pasado_predictivo` - Formato "MM-YYYY"
- `futuro_predictivo` - Formato "MM-YYYY"

### Insertar Datos de Predictividad
```javascript
// POST /api/predictividad/insertar_predictividad.php
const response = await fetch(`${API_BASE}/predictividad/insertar_predictividad.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    proyecto_id: 1,
    centro_costo_id: 1,
    prediccion: 'Fisica',
    pasado_predictivo: '01-2024',
    futuro_predictivo: '06-2024',
    valor_pasado_predictivo: 75.00,
    valor_real: 78.90
  })
});
```

## Integración con Otros Módulos

La tabla `predictividad` se alimenta automáticamente desde otros análisis previos. Para insertar datos desde otros módulos:

```php
// Ejemplo de inserción desde otro análisis
$datos_predictividad = [
    'proyecto_id' => $proyecto_id,
    'centro_costo_id' => $centro_costo_id,
    'prediccion' => 'Fisica', // o 'Financiera'
    'pasado_predictivo' => '01-2024',
    'futuro_predictivo' => '06-2024',
    'valor_pasado_predictivo' => $valor_predicho,
    'valor_real' => $valor_real
];

$response = file_get_contents('http://tu-dominio.com/api/predictividad/insertar_predictividad.php', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode($datos_predictividad)
    ]
]));
```

## Características del Frontend

### Indicadores Visuales
- **Datos Reales**: Badge verde cuando se muestran datos de la base de datos
- **Datos de Ejemplo**: Badge amarillo cuando se muestran datos simulados

### Colores por Tipo de Predicción
- **Física**: Naranja (#FF9800)
- **Financiera**: Azul (#2196F3)

### Estados de Eficiencia
- **Eficiente**: Verde (#4CAF50) - Valor real ≥ Valor predicho
- **Ineficiente**: Rojo (#F44336) - Valor real < Valor predicho

### Niveles de Precisión
- **Excelente** (≥95%): Verde
- **Bueno** (90-94%): Naranja
- **Requiere Atención** (<90%): Rojo

## Notas Importantes

1. **Formato de Fechas**: Las fechas deben estar en formato "MM-YYYY" (ej: "01-2024")
2. **Valores Numéricos**: Los valores deben ser números decimales
3. **Tipos de Predicción**: Solo se aceptan "Fisica" o "Financiera"
4. **Relaciones**: La tabla mantiene integridad referencial con `proyectos` y `centros_costo`
5. **Actualización**: Si existe un registro con los mismos parámetros, se actualiza en lugar de insertar

## Ejemplo de Datos

```sql
INSERT INTO `predictividad` VALUES
(1, 1, 1, 'Fisica', '01-2024', '06-2024', 75.00, 78.90),
(2, 1, 1, 'Fisica', '02-2024', '07-2024', 80.00, 82.50),
(3, 1, 1, 'Financiera', '01-2024', '06-2024', 1250000.00, 1285000.00);
``` 