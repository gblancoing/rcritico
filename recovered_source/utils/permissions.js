/**
 * Sistema de permisos por roles
 * Controla el acceso y las acciones permitidas según el rol del usuario
 */

/**
 * Verifica si un usuario tiene un rol específico
 */
export const hasRole = (user, role) => {
  if (!user || !user.rol) return false;
  return user.rol === role;
};

/**
 * Verifica si un usuario tiene alguno de los roles especificados
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.rol) return false;
  return roles.includes(user.rol);
};

/**
 * Verifica si un usuario puede acceder a todos los proyectos
 */
export const canAccessAllProjects = (user) => {
  return hasRole(user, 'super_admin');
};

/**
 * Verifica si un usuario puede acceder a proyectos asignados
 */
export const canAccessAssignedProjects = (user) => {
  return hasAnyRole(user, ['super_admin', 'admin', 'trabajador']);
};

/**
 * Verifica si un usuario puede ver proyectos (solo visualización)
 */
export const canViewProjects = (user) => {
  return hasAnyRole(user, ['super_admin', 'admin', 'trabajador', 'visita']);
};

/**
 * Verifica si un usuario puede acceder a un proyecto específico
 */
export const canAccessProject = (user, proyectoId) => {
  if (!user) return false;
  
  // super_admin puede acceder a todos
  if (hasRole(user, 'super_admin')) return true;
  
  // admin y trabajador pueden acceder a proyectos asignados
  if (hasAnyRole(user, ['admin', 'trabajador'])) {
    // Verificar si el proyecto está en los centros asignados
    const centros = JSON.parse(localStorage.getItem('centros')) || [];
    return centros.some(centro => String(centro.proyecto_id) === String(proyectoId));
  }
  
  // visita no puede acceder a proyectos
  if (hasRole(user, 'visita')) return false;
  
  return false;
};

/**
 * Verifica si un usuario puede ver la pestaña de Ajuste
 */
export const canViewAjuste = (user) => {
  return hasRole(user, 'super_admin');
};

/**
 * Verifica si un usuario puede crear carpetas
 */
export const canCreateFolders = (user) => {
  return hasRole(user, 'super_admin');
};

/**
 * Verifica si un usuario puede subir archivos
 */
export const canUploadFiles = (user) => {
  return hasAnyRole(user, ['super_admin', 'admin', 'trabajador']);
};

/**
 * Verifica si un usuario puede editar archivos/carpetas
 */
export const canEditFiles = (user) => {
  return hasAnyRole(user, ['super_admin', 'admin']);
};

/**
 * Verifica si un usuario puede eliminar archivos/carpetas
 */
export const canDeleteFiles = (user, requiresAuthorization = false) => {
  if (hasRole(user, 'super_admin')) return true;
  
  // Trabajador solo puede eliminar con autorización
  if (hasRole(user, 'trabajador') && requiresAuthorization) {
    return true; // La autorización se manejará en el componente
  }
  
  return false;
};

/**
 * Verifica si un usuario puede descargar archivos
 */
export const canDownloadFiles = (user) => {
  return hasAnyRole(user, ['super_admin', 'admin', 'trabajador', 'visita']);
};

/**
 * Verifica si un usuario puede crear usuarios
 */
export const canCreateUsers = (user) => {
  return hasRole(user, 'super_admin');
};

/**
 * Verifica si un usuario puede editar usuarios
 */
export const canEditUsers = (user) => {
  return hasRole(user, 'super_admin');
};

/**
 * Verifica si un usuario puede eliminar usuarios
 */
export const canDeleteUsers = (user) => {
  return hasRole(user, 'super_admin');
};

/**
 * Verifica si un usuario puede crear proyectos
 */
export const canCreateProjects = (user) => {
  return hasRole(user, 'super_admin');
};

/**
 * Verifica si un usuario puede crear centros de costo
 */
export const canCreateCentrosCosto = (user) => {
  return hasRole(user, 'super_admin');
};

/**
 * Obtiene los permisos completos de un usuario
 */
export const getUserPermissions = (user) => {
  if (!user) return {};
  
  return {
    canAccessAllProjects: canAccessAllProjects(user),
    canAccessAssignedProjects: canAccessAssignedProjects(user),
    canViewProjects: canViewProjects(user),
    canViewAjuste: canViewAjuste(user),
    canCreateFolders: canCreateFolders(user),
    canUploadFiles: canUploadFiles(user),
    canEditFiles: canEditFiles(user),
    canDeleteFiles: canDeleteFiles(user),
    canDownloadFiles: canDownloadFiles(user),
    canCreateUsers: canCreateUsers(user),
    canEditUsers: canEditUsers(user),
    canDeleteUsers: canDeleteUsers(user),
    canCreateProjects: canCreateProjects(user),
    canCreateCentrosCosto: canCreateCentrosCosto(user),
  };
};

