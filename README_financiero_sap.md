# Flujo Financiero SAP - Documentación

## Descripción
La funcionalidad "Flujo Financiero SAP" permite importar y visualizar datos financieros desde archivos Excel a la tabla `financiero_sap` de la base de datos.

## Estructura de la Base de Datos

### Tabla: `financiero_sap`
- `id_sap` - Auto-incrementable (PK)
- `proyecto_id` - ID del proyecto (FK → `proyectos.proyecto_id`)
- `centro_costo_nombre` - Nombre del centro de costo (se asigna automáticamente desde `centros_costo.nombre`)
- `version_sap` - Versión SAP (VARCHAR 50)
- `descripcion` - Descripción (VARCHAR 50)
- `grupo_version` - Grupo de versión (VARCHAR 50)
- `periodo` - Período en formato MM-AAAA
- `MO` - CONSTRUCCION (numérico)
- `IC` - INDIRECTOS DE CONTRATISTAS (numérico)
- `EM` - EQUIPOS Y MATERIALES (numérico)
- `IE` - INGENIERÍA (numérico)
- `SC` - SERVICIOS DE APOYO A LA CONSTRUCCIÓN (numérico)
- `AD` - ADM. DEL PROYECTO (numérico)
- `CL` - COSTOS ESPECIALES (numérico)
- `CT` - CONTINGENCIA (numérico)

## Formato del Archivo Excel

El archivo Excel debe contener las siguientes columnas (sin incluir las primeras 3 columnas que se asignan automáticamente):

| Columna Excel | Descripción | Tipo | Ejemplo |
|---------------|-------------|------|---------|
| VERSION_SAP | Versión SAP | Texto | "V1.0" |
| DESCRIPCION | Descripción | Texto | "Presupuesto inicial" |
| GRUPO_VERSION | Grupo de versión | Texto | "Grupo A" |
| PERIODO | Período | Texto | "01-2024" |
| MO | CONSTRUCCION | Numérico | 1000000 |
| IC | INDIRECTOS DE CONTRATISTAS | Numérico | 500000 |
| EM | EQUIPOS Y MATERIALES | Numérico | 750000 |
| IE | INGENIERÍA | Numérico | 300000 |
| SC | SERVICIOS DE APOYO | Numérico | 200000 |
| AD | ADM. DEL PROYECTO | Numérico | 150000 |
| CL | COSTOS ESPECIALES | Numérico | 100000 |
| CT | CONTINGENCIA | Numérico | 50000 |

## Instrucciones de Uso

### 1. Preparar el Archivo Excel
- Crear un archivo Excel con las columnas especificadas arriba
- Asegurarse de que los nombres de las columnas coincidan exactamente
- Los valores numéricos pueden incluir separadores de miles y comas decimales

### 2. Importar Datos
1. Navegar a la sección "Vectores" en la aplicación
2. Seleccionar "Flujo Financiero SAP" del menú lateral
3. Hacer clic en el botón "📁 Importar Datos SAP"
4. Ingresar la clave de seguridad: `codelco2025$`
5. Seleccionar el archivo Excel
6. Hacer clic en "Importar"

### 3. Visualizar Datos
- Los datos importados se mostrarán en una tabla con todas las columnas
- Se puede filtrar por fecha usando los controles "Desde" y "Hasta"
- Los montos se formatean automáticamente con separadores de miles

## Características Técnicas

### Relaciones de Base de Datos
- **financiero_sap.proyecto_id** → **proyectos.proyecto_id** (Foreign Key)
- **centros_costo.proyecto_id** → **proyectos.proyecto_id** (Foreign Key)
- **financiero_sap.centro_costo_nombre** se obtiene desde **centros_costo.nombre**

### Asignación Automática
- **proyecto_id**: Se asigna automáticamente según el proyecto en sesión
- **centro_costo_nombre**: Se asigna automáticamente desde la tabla `centros_costo`
- Si no existe un centro de costo para el proyecto, se crea uno automáticamente

### Validación de Datos
- Los montos se limpian automáticamente (se eliminan separadores de miles)
- Los valores vacíos se convierten a 0
- El período se convierte de MM-AAAA a YYYY-MM-01

### Seguridad
- Requiere clave de seguridad para importar datos
- Los datos se filtran por proyecto para evitar acceso no autorizado

## Archivos Modificados/Creados

### Nuevos Archivos
- `api/importaciones/importar_financiero_sap.php` - Endpoint para importar datos
- `api/vectores/financiero_sap.php` - Endpoint para obtener datos
- `crear_tabla_financiero_sap.sql` - Script para crear la tabla
- `README_financiero_sap.md` - Esta documentación

### Archivos Modificados
- `src/analisis/Vectores.js` - Agregada funcionalidad de importación y visualización

## Notas Importantes

1. **Ejecutar el script SQL** antes de usar la funcionalidad
2. **Verificar permisos** de la base de datos para la nueva tabla
3. **Probar con datos de ejemplo** antes de importar datos reales
4. **Hacer respaldo** de la base de datos antes de ejecutar el script SQL

## Solución de Problemas

### Error: "No se encontró centro de costo para el proyecto"
- Verificar que el proyecto tenga un centro de costo asignado en la tabla `centros_costo`
- Si no existe, se usará "Centro de Costo Principal" por defecto

### Error: "Datos inválidos"
- Verificar que el archivo Excel tenga el formato correcto
- Asegurarse de que los nombres de las columnas coincidan exactamente

### Error: "Clave incorrecta"
- Usar la clave correcta: `codelco2025$` 