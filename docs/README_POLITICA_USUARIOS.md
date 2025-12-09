# Política de Usuarios y Permisos - Sistema de Gestión de Archivos SSO Codelco

## 📋 Descripción del Sistema

Este es un **Sistema de Control y Gestión de Archivos** organizado por proyecto y centro de costo. Permite gestionar archivos de manera centralizada, con control de accesos por roles y trazabilidad completa de las acciones realizadas por los usuarios.

## 📋 Índice
1. [Roles de Usuario](#roles-de-usuario)
2. [Permisos por Rol](#permisos-por-rol)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Reglas de Negocio](#reglas-de-negocio)
5. [Sistema de Permisos](#sistema-de-permisos)
6. [Flujo de Creación de Usuarios](#flujo-de-creación-de-usuarios)
7. [Gestión de Archivos](#gestión-de-archivos)

---

## 👥 Roles de Usuario

El sistema cuenta con **4 roles principales** de usuario:

### 1. **super_admin** (Super Administrador)
- Usuario con acceso total al sistema
- Puede gestionar todos los aspectos de la plataforma

### 2. **admin** (Administrador)
- Usuario con permisos administrativos limitados
- Acceso restringido a proyectos asignados

### 3. **trabajador** (Trabajador)
- Usuario con permisos operativos
- Acceso restringido a proyectos asignados

### 4. **visita** (Visita)
- Usuario con permisos de solo visualización
- Sin acceso a proyectos

---

## 🔐 Permisos por Rol

### **super_admin**

#### Acceso a Proyectos
- ✅ Acceso a **todos los proyectos** de **todas las regiones**
- ✅ Puede navegar libremente entre proyectos y regiones

#### Gestión de Archivos
- ✅ **Crear carpetas** en la plataforma
- ✅ **Subir archivos** a cualquier carpeta
- ✅ **Editar** archivos y carpetas
- ✅ **Eliminar** archivos y carpetas
- ✅ **Descargar** archivos

#### Gestión de Usuarios
- ✅ **Crear** nuevos usuarios
- ✅ **Editar** usuarios existentes
- ✅ **Eliminar** usuarios

#### Gestión de Proyectos y Centros de Costo
- ✅ **Crear** nuevos proyectos
- ✅ **Crear** nuevos centros de costo
- ✅ **Editar** proyectos y centros de costo
- ✅ **Eliminar** proyectos y centros de costo

#### Acceso a Pestañas
- ✅ **Inicio**
- ✅ **Proyectos**
- ✅ **Ajuste** (solo super_admin)
- ✅ **Usuarios**

---

### **admin**

#### Acceso a Proyectos
- ✅ Acceso **solo a proyectos asignados** (puede tener múltiples proyectos)
- ✅ Puede navegar entre sus proyectos asignados
- ❌ **NO** puede acceder a proyectos no asignados

#### Gestión de Archivos
- ✅ **Crear carpetas** en la plataforma
- ✅ **Subir archivos** a cualquier carpeta
- ✅ **Editar** archivos y carpetas
- ✅ **Eliminar** archivos y carpetas
- ✅ **Descargar** archivos

#### Gestión de Usuarios
- ❌ **NO** puede crear usuarios
- ❌ **NO** puede editar usuarios
- ❌ **NO** puede eliminar usuarios

#### Gestión de Proyectos y Centros de Costo
- ❌ **NO** puede crear proyectos
- ❌ **NO** puede crear centros de costo
- ❌ **NO** puede editar proyectos o centros de costo
- ❌ **NO** puede eliminar proyectos o centros de costo

#### Acceso a Pestañas
- ✅ **Inicio**
- ✅ **Proyectos**
- ❌ **Ajuste** (bloqueado para admin)
- ❌ **Usuarios** (bloqueado para admin)

---

### **trabajador**

#### Acceso a Proyectos
- ✅ Acceso **solo a proyectos asignados** (puede tener múltiples proyectos)
- ✅ Puede navegar entre sus proyectos asignados
- ❌ **NO** puede acceder a proyectos no asignados

#### Gestión de Archivos
- ❌ **NO** puede crear carpetas
- ✅ **Subir archivos** a carpetas **ya existentes**
- ❌ **NO** puede editar archivos o carpetas
- ⚠️ **Eliminar** archivos **solo con autorización** de admin o super_admin
- ✅ **Descargar** archivos

#### Gestión de Usuarios
- ❌ **NO** puede crear usuarios
- ❌ **NO** puede editar usuarios
- ❌ **NO** puede eliminar usuarios

#### Gestión de Proyectos y Centros de Costo
- ❌ **NO** puede crear proyectos
- ❌ **NO** puede crear centros de costo
- ❌ **NO** puede editar proyectos o centros de costo
- ❌ **NO** puede eliminar proyectos o centros de costo

#### Acceso a Pestañas
- ✅ **Inicio**
- ✅ **Proyectos**
- ❌ **Ajuste** (bloqueado para trabajador)
- ❌ **Usuarios** (bloqueado para trabajador)

---

### **visita**

#### Acceso a Proyectos
- ❌ **NO** puede acceder a proyectos
- ❌ **NO** puede navegar entre proyectos
- ✅ Solo puede visualizar la página de inicio

#### Gestión de Archivos
- ❌ **NO** puede crear carpetas
- ❌ **NO** puede subir archivos
- ❌ **NO** puede editar archivos
- ❌ **NO** puede eliminar archivos
- ❌ **NO** puede descargar archivos (sin acceso a proyectos)

#### Gestión de Usuarios
- ❌ **NO** puede crear usuarios
- ❌ **NO** puede editar usuarios
- ❌ **NO** puede eliminar usuarios

#### Gestión de Proyectos y Centros de Costo
- ❌ **NO** puede crear proyectos
- ❌ **NO** puede crear centros de costo
- ❌ **NO** puede editar proyectos o centros de costo
- ❌ **NO** puede eliminar proyectos o centros de costo

#### Acceso a Pestañas
- ✅ **Inicio** (solo visualización)
- ❌ **Proyectos** (bloqueado - no puede acceder a proyectos)
- ❌ **Ajuste** (bloqueado para visita)
- ❌ **Usuarios** (bloqueado para visita)

#### Estado de Aprobación
- ⚠️ Los usuarios de tipo **visita** se crean automáticamente con estado **pendiente de aprobación**
- ⚠️ Un administrador debe cambiar el rol para otorgar acceso real

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### `usuarios`
```sql
- id (PK)
- nombre
- email (único)
- password (hash)
- rol (super_admin, admin, trabajador, visita, visita_sin_permiso)
- centro_costo_id (FK, nullable)
- aprobado (0 = pendiente, 1 = aprobado)
```

#### `usuario_centro_costo` (Tabla de Relación)
```sql
- usuario_id (FK)
- centro_costo_id (FK)
```
**Propósito**: Permite que usuarios `admin` y `trabajador` tengan múltiples proyectos asignados.

#### `proyectos`
```sql
- proyecto_id (PK)
- nombre
- descripcion
- region_id (FK)
```

#### `centros_costo`
```sql
- id (PK)
- nombre
- descripcion
- proyecto_id (FK)
```

#### `regiones`
```sql
- region_id (PK)
- nombre
- capital
```

### Relaciones

```
regiones (1) ──< (N) proyectos (1) ──< (N) centros_costo (1) ──< (N) usuarios
                                                                    │
                                                                    └──< (N) usuario_centro_costo (N) ──> (1) centros_costo
```

---

## 📜 Reglas de Negocio

### 1. Asignación de Proyectos

#### super_admin
- Tiene acceso a **todos los proyectos** automáticamente
- No requiere asignación explícita

#### admin y trabajador
- Deben tener **al menos un proyecto asignado** mediante la tabla `usuario_centro_costo`
- Pueden tener **múltiples proyectos** asignados
- Solo pueden acceder a proyectos donde tienen un centro de costo asignado

#### visita
- **NO** tiene proyectos asignados
- **NO** requiere centro de costo
- Solo puede ver la página de inicio

### 2. Creación de Usuarios

#### Usuarios tipo "visita"
- Se crean automáticamente con `aprobado = 0` (pendiente)
- **NO** requieren `centro_costo_id`
- **NO** se crea relación en `usuario_centro_costo`
- Un administrador debe cambiar el rol para otorgar acceso

#### Usuarios tipo "admin" y "trabajador"
- Requieren `centro_costo_id` obligatorio
- Se crea automáticamente relación en `usuario_centro_costo`
- Se crean con `aprobado = 1` por defecto (puede cambiarse)

#### Usuarios tipo "super_admin"
- Solo pueden ser creados por otro `super_admin`
- No requieren `centro_costo_id` (tienen acceso total)

### 3. Control de Acceso a Proyectos

- El sistema verifica permisos antes de mostrar cualquier proyecto
- Los usuarios solo ven proyectos a los que tienen acceso
- Los intentos de acceso no autorizado son bloqueados con mensaje informativo

### 4. Gestión de Archivos

#### Creación de Carpetas
- Solo `super_admin` y `admin` pueden crear carpetas
- `trabajador` y `visita` **NO** pueden crear carpetas

#### Subida de Archivos
- `super_admin`, `admin` y `trabajador` pueden subir archivos
- `trabajador` solo puede subir a carpetas **ya existentes**
- `visita` **NO** puede subir archivos

#### Eliminación de Archivos
- `super_admin` y `admin` pueden eliminar libremente
- `trabajador` puede eliminar **solo con autorización** de admin o super_admin
- `visita` **NO** puede eliminar archivos

### 5. Pestaña de Ajuste

- **Solo** visible para `super_admin`
- `admin`, `trabajador` y `visita` **NO** pueden acceder
- Contiene configuración del sistema, gestión de proyectos y centros de costo

---

## 🔧 Sistema de Permisos

### Archivo: `src/utils/permissions.js`

El sistema utiliza un helper centralizado para verificar permisos:

```javascript
import { 
  canAccessProject,
  canCreateFolders,
  canUploadFiles,
  canEditFiles,
  canDeleteFiles,
  canDownloadFiles,
  canViewAjuste,
  getUserPermissions
} from './utils/permissions';
```

### Funciones Principales

#### `canAccessProject(user, proyectoId)`
Verifica si un usuario puede acceder a un proyecto específico.

#### `canCreateFolders(user)`
Verifica si un usuario puede crear carpetas.

#### `canUploadFiles(user)`
Verifica si un usuario puede subir archivos.

#### `canEditFiles(user)`
Verifica si un usuario puede editar archivos.

#### `canDeleteFiles(user, requiresAuthorization)`
Verifica si un usuario puede eliminar archivos.

#### `canDownloadFiles(user)`
Verifica si un usuario puede descargar archivos.

#### `canViewAjuste(user)`
Verifica si un usuario puede ver la pestaña de Ajuste.

#### `getUserPermissions(user)`
Retorna un objeto con todos los permisos del usuario.

---

## 🔄 Flujo de Creación de Usuarios

### Usuario tipo "visita"

1. Usuario se registra con rol `visita`
2. Sistema crea usuario con:
   - `aprobado = 0` (pendiente)
   - `centro_costo_id = NULL`
   - **NO** se crea relación en `usuario_centro_costo`
3. Usuario puede hacer login pero solo ve página de inicio
4. Administrador debe:
   - Cambiar rol a `admin` o `trabajador`
   - Asignar centro de costo
   - Aprobar usuario (`aprobado = 1`)

### Usuario tipo "admin" o "trabajador"

1. Administrador crea usuario con rol `admin` o `trabajador`
2. Sistema requiere `centro_costo_id` obligatorio
3. Sistema crea usuario con:
   - `aprobado = 1` (por defecto)
   - `centro_costo_id` asignado
   - Se crea relación en `usuario_centro_costo`
4. Usuario puede hacer login y acceder a proyectos asignados

### Usuario tipo "super_admin"

1. Solo otro `super_admin` puede crear este tipo de usuario
2. No requiere `centro_costo_id`
3. Tiene acceso total automáticamente

---

## 📝 Notas Importantes

### Seguridad
- Las contraseñas se almacenan con hash usando `password_hash()` de PHP
- Los permisos se verifican tanto en frontend como en backend
- El acceso a proyectos se valida en cada solicitud

### Escalabilidad
- El sistema permite múltiples proyectos por usuario (admin y trabajador)
- La estructura de base de datos soporta crecimiento futuro
- Los permisos están centralizados para fácil mantenimiento

### Auditoría
- **PENDIENTE**: Implementar registro de actividades de usuarios (quién visualizó, editó o eliminó archivos)
- Este será un requerimiento futuro para el control y gestión de archivos

---

## 📁 Gestión de Archivos

### Organización
- Los archivos se organizan por **Proyecto** y **Centro de Costo**
- Cada proyecto puede tener múltiples centros de costo
- Los archivos se almacenan en carpetas dentro de cada proyecto/centro de costo

### Control de Actividades
El sistema registra las siguientes actividades de los usuarios:
- **Visualización**: Quién visualizó un archivo y cuándo
- **Edición**: Quién editó un archivo y cuándo
- **Eliminación**: Quién eliminó un archivo y cuándo
- **Subida**: Quién subió un archivo y cuándo
- **Descarga**: Quién descargó un archivo y cuándo

### Estructura de Carpetas
- Los usuarios con permisos pueden crear carpetas para organizar archivos
- Las carpetas pueden tener subcarpetas
- Cada carpeta puede tener permisos específicos por rol

---

## 🚀 Estado del Proyecto

### ✅ Implementado
1. ✅ Sistema de permisos por roles
2. ✅ Control de acceso a proyectos implementado
3. ✅ Estructura de base de datos para usuarios, proyectos y centros de costo
4. ✅ Interfaz de usuario con navegación por roles
5. ✅ Sistema de autenticación y autorización

### ⏳ Pendiente de Implementar
1. ⏳ Módulo de gestión de archivos (subir, descargar, editar, eliminar)
2. ⏳ Sistema de auditoría (registro de actividades de usuarios)
3. ⏳ Gestión de carpetas con permisos
4. ⏳ Sistema de autorización para eliminación de archivos (trabajador)
5. ⏳ Visualización de historial de actividades por archivo

---

**Última actualización**: Enero 2025  
**Versión del documento**: 1.1  
**Tipo de Sistema**: Control y Gestión de Archivos

