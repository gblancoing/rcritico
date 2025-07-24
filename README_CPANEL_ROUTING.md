# Configuración de Routing para cPanel - V2

## Problema
Cuando actualizas la página (F5) o navegas directamente a una URL como `/usuarios` o `/proyecto/1`, aparece un error 404 porque cPanel no sabe cómo manejar las rutas de React Router.

## Soluciones Múltiples

### Opción 1: Router Simple (Recomendado para empezar)

1. **Ejecutar el script de preparación:**
   ```bash
   npm run build
   node preparar_cpanel_v2.js
   ```

2. **Renombrar archivos en cPanel:**
   ```bash
   # Renombrar el router simple como index.php
   simple_router.php → index.php
   ```

3. **Subir archivos a cPanel:**
   - `index.php` (simple_router.php renombrado)
   - `api/` (carpeta completa)
   - `build/` (carpeta completa)
   - `web.config`
   - `_redirects`
   - `test_routing.php`

### Opción 2: Router Específico para cPanel

Si la Opción 1 no funciona:

1. **Renombrar:**
   ```bash
   cpanel_router.php → index.php
   ```

### Opción 3: Configuración Automática del Servidor

Si las opciones anteriores no funcionan:

1. **Renombrar:**
   ```bash
   server_config.php → index.php
   ```

### Opción 4: Configuración Manual en cPanel

1. **Ir a cPanel > Advanced > URL Rewriting**
2. **Agregar las siguientes reglas:**

```apache
RewriteEngine On

# Permitir archivos y directorios existentes
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# API routes
RewriteRule ^api/(.*)$ api/$1 [L]

# React routes
RewriteRule ^(.*)$ build/index.html [L]
```

## Verificación Paso a Paso

### 1. Probar configuración básica
```
https://tudominio.com/test_routing.php
```
**Resultado esperado:** Página con información del servidor y archivos

### 2. Probar rutas principales
- `https://tudominio.com/` ✅
- `https://tudominio.com/usuarios` ✅
- `https://tudominio.com/proyecto/1` ✅
- `https://tudominio.com/api/usuarios.php` ✅

### 3. Probar actualización (F5)
- Navegar a `/usuarios`
- Presionar F5
- Debe cargar correctamente ✅

### 4. Verificar logs de error
- **cPanel > Logs > Error Logs**
- Buscar mensajes que empiecen con:
  - `Simple Router`
  - `CPANEL ROUTER`
  - `SERVER CONFIG`
  - `DEBUG ROUTING`

## Troubleshooting Detallado

### Error 404 persistente

1. **Verificar archivos:**
   ```bash
   # En cPanel, verificar que existen:
   - index.php
   - build/index.html
   - api/usuarios.php
   ```

2. **Verificar permisos:**
   ```bash
   # Archivos: 644
   # Carpetas: 755
   ```

3. **Verificar logs:**
   - Revisar logs de error en cPanel
   - Buscar mensajes de debug

### API no funciona

1. **Probar directamente:**
   ```
   https://tudominio.com/api/usuarios.php
   ```

2. **Verificar estructura:**
   ```
   public_html/
   ├── api/
   │   ├── usuarios.php
   │   ├── proyectos.php
   │   └── ...
   ```

### Archivos estáticos no cargan

1. **Verificar consola del navegador:**
   - F12 > Console
   - Buscar errores 404 en archivos .js o .css

2. **Verificar estructura build:**
   ```
   public_html/
   ├── build/
   │   ├── index.html
   │   ├── static/
   │   │   ├── css/
   │   │   └── js/
   │   └── ...
   ```

## Estructura Final en cPanel

```
public_html/
├── index.php (uno de los routers)
├── api/
│   ├── usuarios.php
│   ├── proyectos.php
│   └── ...
├── build/
│   ├── index.html
│   ├── static/
│   └── ...
├── web.config
├── _redirects
├── test_routing.php
├── simple_router.php (backup)
├── cpanel_router.php (backup)
├── server_config.php (backup)
└── README_CPANEL_ROUTING.md
```

## Orden de Prueba

1. **Empezar con `simple_router.php`** (más simple)
2. **Si no funciona, probar `cpanel_router.php`**
3. **Si no funciona, probar `server_config.php`**
4. **Si nada funciona, contactar soporte del hosting**

## Notas Importantes

- **No usar .htaccess** si tu hosting no lo soporta
- **Los logs de debug** están habilitados para troubleshooting
- **Comentar los logs** en producción para mejor rendimiento
- **Verificar que mod_rewrite esté habilitado** si usas .htaccess
- **Contactar al soporte del hosting** si ninguna opción funciona

## Comandos Útiles

```bash
# Generar build
npm run build

# Preparar archivos
node preparar_cpanel_v2.js

# Verificar estructura
ls -la build/
ls -la api/
``` 