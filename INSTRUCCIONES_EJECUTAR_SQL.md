# 📋 Instrucciones para Ejecutar el Script SQL

## Método 1: Usando phpMyAdmin (Recomendado)

### Paso 1: Abrir phpMyAdmin
1. Abre tu navegador web
2. Ve a: `http://localhost/phpmyadmin`
3. Inicia sesión (usuario: `root`, contraseña: normalmente vacía en XAMPP)

### Paso 2: Seleccionar la Base de Datos
1. En el panel izquierdo, haz clic en la base de datos `rcritico`
2. Asegúrate de que esté seleccionada (debe aparecer resaltada)

### Paso 3: Abrir la Pestaña SQL
1. En la parte superior, haz clic en la pestaña **"SQL"**
2. Verás un área de texto grande donde puedes escribir o pegar código SQL

### Paso 4: Cargar el Script
**Opción A: Copiar y Pegar**
1. Abre el archivo `api/database/reparar_foreign_keys_simple.sql` con un editor de texto
2. Selecciona TODO el contenido (Ctrl+A)
3. Copia el contenido (Ctrl+C)
4. Pega el contenido en el área de texto de phpMyAdmin (Ctrl+V)

**Opción B: Importar Archivo**
1. En phpMyAdmin, después de seleccionar la base de datos `rcritico`
2. Ve a la pestaña **"Importar"** (en lugar de "SQL")
3. Haz clic en **"Elegir archivo"**
4. Navega a: `C:\xampp\htdocs\rcritico\api\database\reparar_foreign_keys_simple.sql`
5. Selecciona el archivo y haz clic en **"Continuar"**

### Paso 5: Ejecutar el Script
1. Una vez que el código SQL esté en el área de texto
2. Haz clic en el botón **"Continuar"** o **"Ejecutar"** (botón azul en la parte inferior)
3. Espera a que se ejecute (puede tardar unos segundos)

### Paso 6: Verificar Resultados
1. Deberías ver un mensaje de éxito: **"Todas las Foreign Keys han sido agregadas correctamente"**
2. Si hay errores, aparecerán en rojo
3. **Nota**: Si ves errores que dicen "Duplicate key name" o "Foreign key already exists", es normal - significa que algunas foreign keys ya existían

---

## Método 2: Usando Línea de Comandos MySQL

### Paso 1: Abrir Terminal/PowerShell
1. Presiona `Win + R`
2. Escribe `cmd` o `powershell` y presiona Enter

### Paso 2: Navegar al Directorio
```bash
cd C:\xampp\htdocs\rcritico
```

### Paso 3: Ejecutar el Script
```bash
C:\xampp\mysql\bin\mysql.exe -u root -p rcritico < api\database\reparar_foreign_keys_simple.sql
```

**Nota**: Si no tienes contraseña, presiona Enter cuando te la pida. Si tienes contraseña, escríbela.

---

## Método 3: Usando MySQL Workbench (Si lo tienes instalado)

1. Abre MySQL Workbench
2. Conéctate a tu servidor local (localhost)
3. Selecciona la base de datos `rcritico`
4. Ve a: **File → Open SQL Script**
5. Selecciona: `C:\xampp\htdocs\rcritico\api\database\reparar_foreign_keys_simple.sql`
6. Haz clic en el botón **⚡ Execute** (rayo) o presiona `Ctrl+Shift+Enter`

---

## ⚠️ Qué Esperar al Ejecutar

### ✅ Éxito
Si todo va bien, verás:
- Mensaje: "Todas las Foreign Keys han sido agregadas correctamente"
- Sin errores en rojo
- El script se ejecuta completamente

### ⚠️ Errores Normales (No son Problemas)
Si ves errores como:
- `Duplicate key name 'nombre_constraint'` 
- `Foreign key 'nombre_constraint' already exists`

**Esto es NORMAL** - significa que algunas foreign keys ya existían. El script continuará con las demás.

### ❌ Errores Reales (Necesitan Atención)
Si ves errores como:
- `Table 'nombre_tabla' doesn't exist`
- `Column 'nombre_columna' doesn't exist`
- `Cannot add foreign key constraint`

Estos errores indican que:
- Faltan tablas o columnas en la base de datos
- Hay datos inconsistentes que impiden crear las foreign keys

---

## 🔍 Verificar que Funcionó

Después de ejecutar el script, verifica:

1. **Usando el script de verificación:**
   - Abre: `http://localhost/rcritico/api/verificar_foreign_keys.php`
   - Debe mostrar que las foreign keys están aplicadas

2. **Probando el endpoint:**
   - Abre: `http://localhost/rcritico/api/regiones.php`
   - Debe devolver JSON válido con las regiones

3. **Probando la página:**
   - Abre: `http://localhost/rcritico/centros-por-region`
   - No debe mostrar el error "Unexpected end of JSON input"

---

## 📝 Notas Importantes

- **Haz un backup** de tu base de datos antes de ejecutar el script (por si acaso)
- El script usa `SET FOREIGN_KEY_CHECKS = 0` al inicio y `= 1` al final para evitar problemas durante la ejecución
- Si el script falla a mitad de camino, algunas foreign keys pueden haberse agregado. Puedes ejecutarlo de nuevo de forma segura

---

## 🆘 Si Tienes Problemas

1. **Error de permisos**: Asegúrate de que el usuario MySQL tenga permisos para modificar la base de datos
2. **Error de sintaxis**: Verifica que copiaste todo el contenido del archivo SQL
3. **Timeout**: Si el script es muy largo, aumenta el tiempo de ejecución en phpMyAdmin (Configuración → Tiempo máximo de ejecución)

