// Configuración centralizada para URLs de API
const getApiBaseUrl = () => {
  // En desarrollo local
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Si estamos en el puerto de React (3001, 3000, etc.), usar rcritico por defecto
    const port = window.location.port;
    if (port && (port === '3001' || port === '3000' || port === '3002')) {
      // React dev server - usar rcritico por defecto
      return 'http://localhost/rcritico/api';
    }
    
    // Si estamos accediendo directamente al servidor PHP (puerto 80 o sin puerto)
    const pathname = window.location.pathname;
    let projectPath = '';
    
    // Extraer el nombre del proyecto del pathname
    // Ejemplos: /rcritico/ -> /rcritico, /ssocaren/ -> /ssocaren
    const pathParts = pathname.split('/').filter(p => p);
    
    // Buscar rcritico o ssocaren en el pathname
    if (pathname.includes('/rcritico') || pathname.includes('/rcritico/')) {
      projectPath = '/rcritico';
    } else if (pathname.includes('/ssocaren') || pathname.includes('/ssocaren/')) {
      projectPath = '/ssocaren';
    } else if (pathParts.length > 0 && (pathParts[0] === 'rcritico' || pathParts[0] === 'ssocaren')) {
      // Si el primer segmento es rcritico o ssocaren
      projectPath = '/' + pathParts[0];
    } else {
      // Por defecto usar rcritico si no se detecta nada
      projectPath = '/rcritico';
    }
    
    return `http://localhost${projectPath}/api`;
  }
  
  // En producción (cPanel)
  // Obtener la URL base dinámicamente
  const currentPath = window.location.pathname;
  
  // Si estamos en /pmo/, usar /pmo/api
  if (currentPath.startsWith('/pmo/')) {
    return '/pmo/api';
  }
  
  // Si estamos en la raíz del dominio, usar /api
  return '/api';
};

// Función para obtener la URL base completa
const getBaseUrl = () => {
  return window.location.origin;
};

// Función para obtener la URL completa de la aplicación
const getAppUrl = () => {
  const baseUrl = getBaseUrl();
  const currentPath = window.location.pathname;
  
  // Si estamos en /pmo/, usar /pmo
  if (currentPath.startsWith('/pmo/')) {
    return `${baseUrl}/pmo`;
  }
  
  // Si estamos en la raíz del dominio, usar la raíz
  return baseUrl;
};

// Configuración para el login (necesita URL completa)
const getLoginUrl = () => {
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Si estamos en el puerto de React (3001, 3000, etc.), usar rcritico por defecto
    const port = window.location.port;
    if (port && (port === '3001' || port === '3000' || port === '3002')) {
      // React dev server - usar rcritico por defecto
      return 'http://localhost/rcritico/api/auth/login.php';
    }
    
    // Si estamos accediendo directamente al servidor PHP (puerto 80 o sin puerto)
    const pathname = window.location.pathname;
    let projectPath = '';
    
    // Buscar rcritico o ssocaren en el pathname
    if (pathname.includes('/rcritico') || pathname.includes('/rcritico/')) {
      projectPath = '/rcritico';
    } else if (pathname.includes('/ssocaren') || pathname.includes('/ssocaren/')) {
      projectPath = '/ssocaren';
    } else {
      // Por defecto usar rcritico si no se detecta nada
      projectPath = '/rcritico';
    }
    
    return `http://localhost${projectPath}/api/auth/login.php`;
  }
  
  // En producción, usar URL relativa
  const apiBase = getApiBaseUrl();
  return `${apiBase}/auth/login.php`;
};

export const API_BASE = getApiBaseUrl();
export const LOGIN_URL = getLoginUrl();
export const BASE_URL = getBaseUrl();
export const APP_URL = getAppUrl();

// Función helper para construir URLs de API
export const buildApiUrl = (endpoint) => {
  return `${API_BASE}/${endpoint}`;
};

// Función helper para construir URLs completas de la aplicación
export const buildAppUrl = (endpoint) => {
  return `${APP_URL}/${endpoint}`;
}; 