# Sistema de Notificaciones de Tareas por Email

## Descripción

Este sistema envía notificaciones automáticas por correo electrónico a los usuarios cuando tienen tareas próximas a vencer o que ya han vencido y aún están en proceso.

## Características

- **Notificaciones automáticas**: Se envían correos cuando:
  - La tarea vence en 3 días
  - La tarea vence en 1 día
  - La tarea vence hoy
  - La tarea ya venció hace 1 día (si aún está pendiente)
  - La tarea ya venció hace 3 días (si aún está pendiente)

- **Destinatarios**: Se envían notificaciones a:
  - Todos los usuarios asignados a la tarea
  - El creador de la tarea

- **Prevención de duplicados**: El sistema registra las notificaciones enviadas para evitar enviar múltiples correos el mismo día.

## Instalación

### 1. Crear la tabla de notificaciones

Ejecuta el script SQL para crear la tabla:

```sql
-- Ejecutar: api/database/crear_tabla_notificaciones_tareas.sql
```

### 2. Configurar el Cron Job

#### En Linux/Unix (cPanel, servidor Linux):

Edita el crontab:
```bash
crontab -e
```

Agrega la siguiente línea para ejecutar el script diariamente a las 8:00 AM:
```
0 8 * * * /usr/bin/php /ruta/completa/a/tu/proyecto/api/cron/notificar_tareas_vencimiento.php >> /ruta/completa/a/tu/proyecto/api/cron/cron.log 2>&1
```

**Ejemplo con ruta completa:**
```
0 8 * * * /usr/bin/php /home/usuario/public_html/ssocaren/api/cron/notificar_tareas_vencimiento.php >> /home/usuario/public_html/ssocaren/api/cron/cron.log 2>&1
```

#### En Windows (XAMPP):

1. Abre el **Programador de tareas** (Task Scheduler)
2. Crea una nueva tarea básica
3. Configura:
   - **Nombre**: Notificaciones Tareas SSO Caren
   - **Desencadenador**: Diariamente a las 8:00 AM
   - **Acción**: Iniciar un programa
   - **Programa**: `C:\xampp\php\php.exe`
   - **Argumentos**: `C:\xampp\htdocs\ssocaren\api\cron\notificar_tareas_vencimiento.php`
   - **Carpeta de inicio**: `C:\xampp\htdocs\ssocaren\api\cron`

#### Ejecución manual (para pruebas):

```bash
# Linux/Unix
php /ruta/completa/api/cron/notificar_tareas_vencimiento.php

# Windows
C:\xampp\php\php.exe C:\xampp\htdocs\ssocaren\api\cron\notificar_tareas_vencimiento.php
```

## Configuración

### Ajustar días de notificación

Edita el archivo `api/cron/notificar_tareas_vencimiento.php` y modifica las variables:

```php
// Días antes del vencimiento para enviar notificación
$dias_antes_notificacion = [3, 1, 0]; // Puedes cambiar estos valores

// Días después del vencimiento para notificar tareas vencidas
$dias_despues_vencido = [1, 3]; // Puedes cambiar estos valores
```

### Configuración de Email

La configuración del servidor SMTP está en `api/utils/email_functions_real.php`:

```php
$mail->Host       = 'mail.jej664caren.cl';
$mail->Username   = 'financiero@jej664caren.cl';
$mail->Password   = 'Inging1989$';
```

## Logs

Los logs se guardan en:
- `api/notificaciones_tareas.log` - Registro de todas las notificaciones enviadas y errores

## Verificación

Para verificar que el sistema funciona:

1. Crea una tarea de prueba con fecha de vencimiento en 3 días
2. Ejecuta manualmente el script de notificaciones
3. Revisa el log en `api/notificaciones_tareas.log`
4. Verifica que recibiste el correo electrónico

## Solución de Problemas

### El cron no se ejecuta

1. Verifica los permisos del archivo PHP
2. Verifica la ruta completa del PHP y del script
3. Revisa los logs del cron en `api/cron/cron.log`
4. Verifica que el servidor tenga permisos para enviar emails

### No se reciben correos

1. Revisa `api/notificaciones_tareas.log` para ver errores
2. Verifica la configuración SMTP en `api/utils/email_functions_real.php`
3. Verifica que los usuarios tengan emails válidos en la base de datos
4. Revisa la carpeta de spam

### Correos duplicados

El sistema previene duplicados registrando las notificaciones en la tabla `tarea_notificaciones`. Si aún recibes duplicados:

1. Verifica que la tabla `tarea_notificaciones` existe
2. Revisa que el script tenga permisos para escribir en la base de datos

## Estructura de Base de Datos

La tabla `tarea_notificaciones` almacena:
- `tarea_id`: ID de la tarea
- `usuario_id`: ID del usuario notificado
- `tipo_notificacion`: Tipo (vencimiento_proximo, vencimiento_hoy, vencido)
- `fecha_notificacion`: Fecha en que se envió la notificación
- `enviado_en`: Timestamp del envío

