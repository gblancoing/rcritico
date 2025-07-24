# Tabla categoria_vp - Documentación

## Descripción
La tabla `categoria_vp` es una tabla maestra que centraliza la información de las categorías VP (Vicepresidencia) utilizadas en el sistema financiero. Esta tabla sirve como referencia para estandarizar las categorías de costos en todas las tablas del sistema.

## Estructura de la Tabla

### Campos
- **cat_vp** (VARCHAR(10), PRIMARY KEY): Código único de la categoría VP
- **categoria_ipa** (VARCHAR(100)): Nombre de la categoría según estándar IPA
- **descripcion_corta** (VARCHAR(200)): Descripción breve de la categoría
- **descripcion_larga** (TEXT): Descripción detallada de la categoría
- **created_at** (TIMESTAMP): Fecha de creación del registro
- **updated_at** (TIMESTAMP): Fecha de última actualización

### Categorías Incluidas
1. **MO** - CONSTRUCCIÓN
2. **IC** - INDIRECTOS CONTRATISTAS
3. **EM** - EQUIPOS Y MATERIALES
4. **IE** - INGENIERÍA
5. **SC** - SERVICIOS APOYO
6. **AD** - ADM. PROYECTO
7. **CL** - COSTOS ESPECIALES
8. **CT** - CONTINGENCIA

## Instalación

### 1. Ejecutar el Script SQL
```bash
mysql -u [usuario] -p [base_de_datos] < categoria_vp.sql
```

### 2. Verificar la Instalación
```sql
SELECT * FROM categoria_vp ORDER BY cat_vp;
```

## API de Consulta

### Endpoint Base
```
GET /api/categoria_vp.php
```

### Acciones Disponibles

#### 1. Listar Todas las Categorías
```
GET /api/categoria_vp.php?action=list
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "cat_vp": "MO",
      "categoria_ipa": "CONSTRUCCIÓN",
      "descripcion_corta": "Mano de obra directa y actividades de construcción principal del proyecto",
      "descripcion_larga": "Incluye todos los costos asociados..."
    }
  ]
}
```

#### 2. Obtener Categoría Específica
```
GET /api/categoria_vp.php?action=get&cat_vp=MO
```

#### 3. Buscar Categorías
```
GET /api/categoria_vp.php?action=search&search=construcción
```

## Integración con el Sistema Actual

### ✅ No Afecta la Funcionalidad Existente
- El dashboard actual sigue funcionando exactamente igual
- Las categorías hardcodeadas en `ResumenFinanciero.js` se mantienen
- No se requieren cambios en el frontend existente

### 🔄 Uso Opcional para Futuras Mejoras
La nueva tabla puede ser utilizada para:

1. **Enriquecer Tooltips**: Usar descripciones más detalladas
2. **Validación de Datos**: Verificar que las categorías existan
3. **Reportes Avanzados**: Generar reportes con información completa
4. **Administración**: Permitir gestión de categorías desde interfaz

## Ejemplos de Uso

### JavaScript - Cargar Categorías
```javascript
// Cargar todas las categorías
fetch('/api/categoria_vp.php?action=list')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Categorías cargadas:', data.data);
    }
  });

// Obtener categoría específica
fetch('/api/categoria_vp.php?action=get&cat_vp=MO')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Categoría MO:', data.data);
    }
  });
```

### PHP - Consulta Directa
```php
// Obtener descripción de una categoría
$stmt = $pdo->prepare("SELECT descripcion_larga FROM categoria_vp WHERE cat_vp = ?");
$stmt->execute(['MO']);
$descripcion = $stmt->fetchColumn();
```

## Mantenimiento

### Agregar Nueva Categoría
```sql
INSERT INTO categoria_vp (cat_vp, categoria_ipa, descripcion_corta, descripcion_larga) 
VALUES ('XX', 'NUEVA CATEGORÍA', 'Descripción corta', 'Descripción larga detallada');
```

### Actualizar Categoría Existente
```sql
UPDATE categoria_vp 
SET categoria_ipa = 'NUEVO NOMBRE', 
    descripcion_corta = 'Nueva descripción corta',
    descripcion_larga = 'Nueva descripción larga'
WHERE cat_vp = 'MO';
```

### Eliminar Categoría (Cuidado)
```sql
DELETE FROM categoria_vp WHERE cat_vp = 'XX';
-- ⚠️ Verificar que no esté en uso en otras tablas
```

## Relaciones con Otras Tablas

### Tablas que Referencian cat_vp
- Tablas de cantidades (real_parcial, v0_parcial, etc.)
- campo3_fase
- Otras tablas del sistema financiero

### Integridad Referencial
La tabla `categoria_vp` actúa como tabla maestra, pero no se han definido foreign keys para mantener la flexibilidad del sistema actual.

## Notas Importantes

1. **Compatibilidad**: La nueva tabla es completamente compatible con el sistema existente
2. **Opcional**: Su uso es opcional y no afecta la funcionalidad actual
3. **Escalable**: Permite agregar nuevas categorías sin modificar código
4. **Estándar**: Sigue estándares IPA para nomenclatura de categorías 