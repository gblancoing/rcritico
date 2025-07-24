# Tabla cumplimiento_fisico

## Descripción
La tabla `cumplimiento_fisico` almacena datos de cumplimiento físico de proyectos, relacionando proyectos con centros de costo y diferentes vectores (Real, V0, NPC, API) a lo largo del tiempo.

## Estructura de la Tabla

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id_cumplimiento` | int(11) | Clave primaria | AUTO_INCREMENT, NOT NULL |
| `proyecto_id` | int(11) | ID del proyecto | NOT NULL, FK a proyectos.proyecto_id |
| `id` | int(11) | ID del centro de costo | NOT NULL, FK a centros_costo.id |
| `nombre` | varchar(100) | Nombre del centro de costo | NOT NULL |
| `vector` | varchar(50) | Tipo de vector | NOT NULL (Real, V0, NPC, API) |
| `periodo` | date | Fecha del periodo | NOT NULL (YYYY-MM-DD) |
| `porcentaje_periodo` | decimal(5,2) | Porcentaje de cumplimiento | NOT NULL (0.00 a 100.00) |

## Relaciones
- `proyecto_id` → `proyectos.proyecto_id` (FOREIGN KEY)
- `id` → `centros_costo.id` (FOREIGN KEY)

## Instalación

### 1. Ejecutar el script SQL
```sql
-- Ejecutar el archivo: crear_tabla_cumplimiento_fisico.sql
-- Este script creará la tabla y insertará datos de ejemplo
```

### 2. Verificar la instalación
```sql
-- Verificar que la tabla se creó correctamente
DESCRIBE cumplimiento_fisico;

-- Verificar los datos de ejemplo
SELECT * FROM cumplimiento_fisico LIMIT 10;
```

## API Endpoints

### GET /api/cumplimiento_fisico.php
Obtiene datos de cumplimiento físico con filtros opcionales.

**Parámetros de consulta:**
- `proyecto_id` (opcional): Filtrar por proyecto específico
- `centro_costo_id` (opcional): Filtrar por centro de costo específico
- `vector` (opcional): Filtrar por vector específico (Real, V0, NPC, API)
- `periodo_desde` (opcional): Fecha de inicio (YYYY-MM-DD)
- `periodo_hasta` (opcional): Fecha de fin (YYYY-MM-DD)

**Ejemplo de uso:**
```javascript
// Obtener todos los datos
fetch('/api/cumplimiento_fisico.php')
  .then(response => response.json())
  .then(data => console.log(data));

// Obtener datos filtrados por proyecto
fetch('/api/cumplimiento_fisico.php?proyecto_id=1&vector=Real')
  .then(response => response.json())
  .then(data => console.log(data));
```

### POST /api/cumplimiento_fisico.php
Crea un nuevo registro de cumplimiento físico.

**Cuerpo de la petición (JSON):**
```json
{
  "proyecto_id": 1,
  "id": 1,
  "nombre": "Centro Principal",
  "vector": "Real",
  "periodo": "2024-07-01",
  "porcentaje_periodo": 85.50
}
```

### PUT /api/cumplimiento_fisico.php
Actualiza un registro existente.

**Cuerpo de la petición (JSON):**
```json
{
  "id_cumplimiento": 1,
  "proyecto_id": 1,
  "id": 1,
  "nombre": "Centro Principal",
  "vector": "Real",
  "periodo": "2024-07-01",
  "porcentaje_periodo": 87.25
}
```

### DELETE /api/cumplimiento_fisico.php
Elimina un registro específico.

**Parámetros de consulta:**
- `id_cumplimiento`: ID del registro a eliminar

**Ejemplo:**
```javascript
fetch('/api/cumplimiento_fisico.php?id_cumplimiento=1', {
  method: 'DELETE'
})
.then(response => response.json())
.then(data => console.log(data));
```

## Consultas SQL Útiles

### 1. Obtener cumplimiento físico por proyecto y vector
```sql
SELECT cf.periodo, cf.vector, cf.porcentaje_periodo, p.nombre as proyecto
FROM cumplimiento_fisico cf
INNER JOIN proyectos p ON cf.proyecto_id = p.proyecto_id
WHERE cf.proyecto_id = 1
ORDER BY cf.periodo, cf.vector;
```

### 2. Comparar vectores para un proyecto específico
```sql
SELECT cf.periodo, 
       MAX(CASE WHEN cf.vector = 'Real' THEN cf.porcentaje_periodo END) as Real,
       MAX(CASE WHEN cf.vector = 'V0' THEN cf.porcentaje_periodo END) as V0,
       MAX(CASE WHEN cf.vector = 'NPC' THEN cf.porcentaje_periodo END) as NPC,
       MAX(CASE WHEN cf.vector = 'API' THEN cf.porcentaje_periodo END) as API
FROM cumplimiento_fisico cf
WHERE cf.proyecto_id = 1
GROUP BY cf.periodo
ORDER BY cf.periodo;
```

### 3. Obtener el último porcentaje por vector y proyecto
```sql
SELECT cf.proyecto_id, cf.vector, cf.porcentaje_periodo, cf.periodo
FROM cumplimiento_fisico cf
INNER JOIN (
    SELECT proyecto_id, vector, MAX(periodo) as max_periodo
    FROM cumplimiento_fisico
    GROUP BY proyecto_id, vector
) latest ON cf.proyecto_id = latest.proyecto_id 
         AND cf.vector = latest.vector 
         AND cf.periodo = latest.max_periodo
ORDER BY cf.proyecto_id, cf.vector;
```

## Integración con el Frontend

### En el componente Reportabilidad.js
La tabla `cumplimiento_fisico` se puede integrar en el reporte de "Cumplimiento Físico" de la página de Reportabilidad:

```javascript
// Función para cargar datos de cumplimiento físico desde la API
const cargarDatosCumplimientoFisico = async (proyectoId) => {
  try {
    const response = await fetch(`${API_BASE}/cumplimiento_fisico.php?proyecto_id=${proyectoId}`);
    const data = await response.json();
    
    if (data.success) {
      // Procesar los datos para el gráfico
      const datosProcesados = procesarDatosCumplimiento(data.data);
      setDatosReporte(datosProcesados);
    }
  } catch (error) {
    console.error('Error cargando datos de cumplimiento físico:', error);
  }
};
```

## Mantenimiento

### Backup de datos
```sql
-- Crear backup de la tabla
mysqldump -u usuario -p financiero cumplimiento_fisico > backup_cumplimiento_fisico.sql
```

### Limpieza de datos antiguos
```sql
-- Eliminar datos anteriores a una fecha específica
DELETE FROM cumplimiento_fisico WHERE periodo < '2023-01-01';
```

### Optimización de índices
```sql
-- Crear índices adicionales si es necesario
CREATE INDEX idx_cumplimiento_proyecto_vector ON cumplimiento_fisico(proyecto_id, vector);
CREATE INDEX idx_cumplimiento_periodo ON cumplimiento_fisico(periodo);
```

## Notas Importantes

1. **Integridad de datos**: La tabla mantiene integridad referencial con `proyectos` y `centros_costo`
2. **Sin timestamps**: Como solicitado, no se incluyen campos `created_at` o `updated_at`
3. **Validación**: El campo `porcentaje_periodo` debe estar entre 0.00 y 100.00
4. **Vectores válidos**: Los valores válidos para `vector` son: Real, V0, NPC, API
5. **Formato de fecha**: El campo `periodo` debe estar en formato YYYY-MM-DD

## Archivos Relacionados

- `crear_tabla_cumplimiento_fisico.sql` - Script de creación de la tabla
- `api/cumplimiento_fisico/cumplimiento_fisico.php` - API para operaciones CRUD
- `api/cumplimiento_fisico/importar_cumplimiento_fisico.php` - API para importación de Excel
- `src/analisis/Reportabilidad.js` - Componente frontend que usa estos datos 