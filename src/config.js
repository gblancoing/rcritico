// Configuración centralizada para URLs de API
const getApiBaseUrl = () => {
  // En desarrollo local
  if (process.env.NODE_ENV === 'development') {
    return '/api';
  }
  
  // En producción (cPanel)
  // Obtener la URL base dinámicamente
  const currentPath = window.location.pathname;
  
  // Si estamos en /financiero/, usar /financiero/api
  if (currentPath.startsWith('/financiero/')) {
    return '/financiero/api';
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
  
  // Si estamos en /financiero/, usar /financiero
  if (currentPath.startsWith('/financiero/')) {
    return `${baseUrl}/financiero`;
  }
  
  // Si estamos en la raíz del dominio, usar la raíz
  return baseUrl;
};

// Configuración para el login (necesita URL completa)
const getLoginUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    // Usar URL dinámica en lugar de hardcodeada
    return getAppUrl() + '/api/login.php';
  }
  
  // En producción, usar URL relativa
  const apiBase = getApiBaseUrl();
  return `${apiBase}/login.php`;
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