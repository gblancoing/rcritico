# Importación de Datos de Cumplimiento Físico

## Descripción
Esta funcionalidad permite importar datos de cumplimiento físico desde archivos Excel directamente a la tabla `cumplimiento_fisico` de la base de datos.

## Ubicación
La funcionalidad está disponible en la página de **Reportabilidad** → **Cumplimiento Físico**.

## Funcionalidades Disponibles

### 1. 📥 Descargar Plantilla
- **Propósito**: Obtener un archivo Excel con la estructura correcta y datos de ejemplo
- **Formato**: Archivo .xlsx con encabezados y datos de muestra
- **Uso**: Hacer clic en el botón "📥 Descargar Plantilla"

### 2. 📁 Seleccionar Archivo
- **Propósito**: Elegir un archivo Excel para importar
- **Formatos soportados**: .xlsx, .xls
- **Tamaño máximo**: 10MB
- **Uso**: Hacer clic en el botón "📁 Seleccionar Archivo"

### 3. 📤 Importar
- **Propósito**: Procesar el archivo seleccionado e insertar los datos en la base de datos
- **Validaciones**: Se realizan múltiples validaciones antes de la inserción
- **Uso**: Hacer clic en el botón "📤 Importar" (solo disponible cuando hay un archivo seleccionado)

## Estructura del Archivo Excel

### Encabezados Requeridos
La primera fila del archivo Excel debe contener exactamente estos encabezados:

| Columna | Descripción | Tipo | Restricciones |
|---------|-------------|------|---------------|
| `vector` | Tipo de vector | Texto | Debe ser: Real, V0, NPC, API |
| `periodo` | Fecha del periodo | Fecha | Formato: YYYY-MM-DD |
| `porcentaje_periodo` | Porcentaje de cumplimiento | Decimal | Rango: 0.00 a 100.00 |

**Nota:** Los campos `proyecto_id`, `id` (centro de costo) y `nombre` se obtienen automáticamente del contexto del proyecto seleccionado.

### Ejemplo de Datos
```excel
vector | periodo     | porcentaje_periodo
Real   | 2024-01-01  | 15.50
V0     | 2024-01-01  | 12.00
NPC    | 2024-01-01  | 14.00
API    | 2024-01-01  | 13.00
Real   | 2024-02-01  | 28.75
V0     | 2024-02-01  | 25.00
NPC    | 2024-02-01  | 27.00
API    | 2024-02-01  | 26.00
```

## Validaciones Realizadas

### 1. Validación de Archivo
- ✅ Extensión válida (.xlsx, .xls)
- ✅ Tamaño máximo (10MB)
- ✅ Archivo no corrupto

### 2. Validación de Estructura
- ✅ Presencia de todos los encabezados requeridos
- ✅ Orden correcto de las columnas
- ✅ Al menos una fila de datos

### 3. Validación de Datos
- ✅ `proyecto_id`: Número entero válido y existe en la tabla `proyectos`
- ✅ `id`: Número entero válido y existe en la tabla `centros_costo`
- ✅ `nombre`: No está vacío
- ✅ `vector`: Valor válido (Real, V0, NPC, API)
- ✅ `periodo`: Fecha válida en formato YYYY-MM-DD
- ✅ `porcentaje_periodo`: Número decimal entre 0.00 y 100.00

## Proceso de Importación

### 1. Carga del Archivo
```javascript
// El usuario selecciona un archivo Excel
const formData = new FormData();
formData.append('archivo', archivoSeleccionado);
```

### 2. Envío al Servidor
```javascript
// Se envía al endpoint de importación
const response = await fetch(`${API_BASE}/importar_cumplimiento_fisico.php`, {
  method: 'POST',
  body: formData,
});
```

### 3. Procesamiento en el Servidor
```php
// Se carga el archivo Excel usando PhpSpreadsheet
$spreadsheet = IOFactory::load($archivo['tmp_name']);
$worksheet = $spreadsheet->getActiveSheet();
$rows = $worksheet->toArray();
```

### 4. Validaciones y Inserción
```php
// Se valida cada fila y se inserta en la base de datos
foreach ($rows as $i => $row) {
    // Validaciones...
    $stmt->execute([$proyecto_id, $centro_costo_id, $nombre, $vector, $periodo, $porcentaje_periodo]);
}
```

## Manejo de Errores

### Errores de Validación
- **Archivo inválido**: Se muestra mensaje específico del error
- **Estructura incorrecta**: Se listan las columnas faltantes
- **Datos inválidos**: Se muestran los errores por fila

### Errores de Base de Datos
- **Transacciones**: Si hay errores, se hace rollback de todos los cambios
- **Integridad**: Se verifica que los IDs referenciados existan
- **Duplicados**: Se permiten registros duplicados (mismo proyecto, centro, vector y periodo)

## Mensajes de Respuesta

### Éxito
```json
{
  "success": true,
  "message": "Importación exitosa. 24 registros insertados.",
  "registros_insertados": 24
}
```

### Error
```json
{
  "success": false,
  "error": "Errores en la importación",
  "errores": [
    "Fila 3: Proyecto ID 999 no existe",
    "Fila 5: Vector inválido. Debe ser: Real, V0, NPC, API"
  ],
  "registros_con_errores": [...],
  "registros_insertados": 0
}
```

## Archivos Relacionados

### Frontend
- `src/analisis/Reportabilidad.js` - Componente principal con la interfaz de importación

### Backend
- `api/cumplimiento_fisico/importar_cumplimiento_fisico.php` - Endpoint para procesar la importación
- `api/cumplimiento_fisico/cumplimiento_fisico.php` - API CRUD para la tabla

### Base de Datos
- `cumplimiento_fisico` - Tabla destino de los datos importados
- `proyectos` - Tabla referenciada por proyecto_id
- `centros_costo` - Tabla referenciada por id

## Dependencias

### Frontend
- `xlsx` - Para generar y leer archivos Excel
- `fetch` - Para enviar archivos al servidor

### Backend
- `PhpSpreadsheet` - Para procesar archivos Excel
- `PDO` - Para operaciones de base de datos

## Instalación de Dependencias

### Backend (PHP)
```bash
# Instalar PhpSpreadsheet via Composer
composer require phpoffice/phpspreadsheet
```

### Frontend (React)
```bash
# Instalar XLSX
npm install xlsx
```

## Consideraciones de Seguridad

1. **Validación de archivos**: Solo se aceptan archivos Excel
2. **Límite de tamaño**: Máximo 10MB por archivo
3. **Validación de datos**: Todos los datos se validan antes de la inserción
4. **Transacciones**: Se usan transacciones para garantizar consistencia
5. **Prepared statements**: Se usan para prevenir inyección SQL

## Troubleshooting

### Error: "No se recibió el archivo"
- Verificar que el archivo no exceda el límite de tamaño
- Verificar que el formulario tenga `enctype="multipart/form-data"`

### Error: "Faltan columnas requeridas"
- Verificar que la primera fila contenga exactamente los encabezados requeridos
- Verificar que no haya espacios extra en los nombres de las columnas

### Error: "Proyecto ID X no existe"
- Verificar que el ID del proyecto exista en la tabla `proyectos`
- Usar la consulta: `SELECT proyecto_id, nombre FROM proyectos;`

### Error: "Centro de costo ID X no existe"
- Verificar que el ID del centro de costo exista en la tabla `centros_costo`
- Usar la consulta: `SELECT id, nombre FROM centros_costo;` 