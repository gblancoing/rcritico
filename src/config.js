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

// Configuración para el login (necesita URL completa)
const getLoginUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost/financiero/api/login.php';
  }
  
  // En producción, usar URL relativa
  const apiBase = getApiBaseUrl();
  return `${apiBase}/login.php`;
};

export const API_BASE = getApiBaseUrl();
export const LOGIN_URL = getLoginUrl();

// Función helper para construir URLs de API
export const buildApiUrl = (endpoint) => {
  return `${API_BASE}/${endpoint}`;
}; 