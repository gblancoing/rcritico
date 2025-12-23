# 📋 Instrucciones para Migrar a Producción

## ⚠️ IMPORTANTE: Antes de comenzar

1. **Hacer backup de producción**: Es CRÍTICO hacer un backup completo de la base de datos de producción antes de importar cualquier dato.
2. **Verificar diferencias**: Usa el script de verificación para ver qué tablas y datos difieren entre local y producción.
3. **Probar en staging**: Si es posible, prueba primero en un entorno de staging.

---

## 📦 Paso 1: Exportar Base de Datos Local

Tienes dos opciones para exportar:

### Opción A: Exportación con PHP (Recomendado si no tienes mysqldump)

1. Abre en tu navegador:
   ```
   http://localhost/rcritico/api/database/exportar_para_produccion.php
   ```

2. El script generará un archivo SQL con nombre: `exportacion_produccion_YYYY-MM-DD_HHMMSS.sql`

3. Descarga el archivo generado.

### Opción B: Exportación con mysqldump (Más rápido para bases de datos grandes)

1. Abre en tu navegador:
   ```
   http://localhost/rcritico/api/database/exportar_mysqldump.php
   ```

2. O desde línea de comandos:
   ```bash
   php api/database/exportar_mysqldump.php
   ```

3. Descarga el archivo generado.

---

## 🔍 Paso 2: Verificar Estado Actual

Antes de importar, verifica qué diferencias hay entre local y producción:

1. Abre en tu navegador:
   ```
   http://localhost/rcritico/api/database/verificar_produccion.php
   ```

2. Revisa la tabla comparativa para ver:
   - Qué tablas existen en cada base de datos
   - Cuántas filas tiene cada tabla
   - Qué tablas solo existen en local o en producción

---

## 💾 Paso 3: Hacer Backup de Producción

**CRÍTICO**: Antes de importar, debes hacer un backup de producción.

### Opción A: Desde phpMyAdmin

1. Accede a phpMyAdmin en tu servidor de producción
2. Selecciona la base de datos: `carenvpc_rcritico`
3. Ve a la pestaña "Exportar"
4. Selecciona "Método": "Rápido"
5. Haz clic en "Continuar"
6. Guarda el archivo con nombre: `backup_produccion_antes_importar_YYYY-MM-DD.sql`

### Opción B: Desde línea de comandos (SSH)

```bash
mysqldump -u carenvpc_rcritico -p carenvpc_rcritico > backup_produccion_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📥 Paso 4: Importar a Producción

### Método 1: phpMyAdmin (Recomendado)

1. Accede a phpMyAdmin en tu servidor de producción
2. Selecciona la base de datos: `carenvpc_rcritico`
3. Ve a la pestaña **"Importar"**
4. Haz clic en **"Elegir archivo"** y selecciona el archivo SQL exportado
5. Asegúrate de que:
   - **Formato**: SQL
   - **Tamaño máximo**: Si el archivo es grande, aumenta el límite o usa el método 2
6. Haz clic en **"Continuar"**
7. Espera a que termine la importación (puede tardar varios minutos)

### Método 2: Línea de comandos (SSH) - Para archivos grandes

```bash
mysql -u carenvpc_rcritico -p carenvpc_rcritico < exportacion_produccion_YYYY-MM-DD_HHMMSS.sql
```

---

## ✅ Paso 5: Verificar Importación

Después de importar, verifica que todo esté correcto:

1. Ejecuta nuevamente el script de verificación:
   ```
   http://localhost/rcritico/api/database/verificar_produccion.php
   ```

2. Verifica que:
   - Todas las tablas se hayan importado correctamente
   - Los conteos de filas coincidan con local
   - No haya errores en la conexión

3. Prueba la aplicación en producción:
   - Inicia sesión
   - Verifica que los datos se muestren correctamente
   - Prueba funcionalidades críticas

---

## 🔧 Configuración de Producción

Asegúrate de que el archivo `api/config/config.php` tenga la configuración correcta:

```php
$configProduccion = [
    'host' => 'localhost',
    'user' => 'carenvpc_rcritico',
    'pass' => 'O$AR-B5R2v',
    'dbname' => 'carenvpc_rcritico'
];
```

---

## 🚨 Solución de Problemas

### Error: "Table doesn't exist"
- Verifica que todas las tablas se hayan creado
- Revisa los logs de importación en phpMyAdmin

### Error: "Foreign key constraint fails"
- El script de exportación desactiva temporalmente las claves foráneas
- Si persiste, verifica que las tablas relacionadas existan

### Error: "Max file size exceeded"
- Usa el método de línea de comandos (SSH)
- O aumenta el límite en php.ini:
  ```ini
  upload_max_filesize = 100M
  post_max_size = 100M
  ```

### Datos no se muestran correctamente
- Verifica la codificación de caracteres (debe ser utf8mb4)
- Revisa que las conexiones usen charset=utf8mb4

---

## 📞 Contacto

Si encuentras problemas durante la migración, documenta:
1. El error exacto
2. En qué paso ocurrió
3. Capturas de pantalla si es posible

---

## 📝 Checklist Final

- [ ] Backup de producción realizado
- [ ] Exportación de local completada
- [ ] Verificación de diferencias realizada
- [ ] Importación a producción completada
- [ ] Verificación post-importación realizada
- [ ] Pruebas en producción exitosas
- [ ] Documentación actualizada

---

**Última actualización**: 2025-12-15

