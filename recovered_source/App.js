import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Login from './pages/login';
import MasterPage from './pages/MasterPage';
import CentrosPorRegion from './pages/CentrosPorRegion';
import ProyectoPage from './pages/ProyectoPage';
import './pages/ProyectoPage.css';
import UsuariosPage from './pages/UsuariosPage';
import Ajuste from './pages/ajuste';
import GeminiChat from './components/GeminiChat';

function App() {
  const [user, setUser] = useState(null);
  const [centros, setCentros] = useState([]);

  // Hook de navegación
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Cargar usuario desde localStorage si existe
    const userData = JSON.parse(localStorage.getItem('user'));
    const centrosData = JSON.parse(localStorage.getItem('centros')) || [];
    setUser(userData);
    setCentros(centrosData);
  }, []);

  // Redirección automática según el rol
  useEffect(() => {
    // Permitir acceso directo a la página de proyecto
    if (location.pathname.startsWith('/proyecto/')) {
      return;
    }
    if (user) {
      console.log('App: Redirección automática - Usuario:', user.rol, 'Path:', location.pathname);
      
      // No redirigir si estamos en la página de centros por región
      if (location.pathname === '/centros-por-region') {
        console.log('App: Permitiendo acceso a centros-por-region');
        return;
      }
      
      // super_admin: puede acceder a todas las rutas
      if (user.rol === 'super_admin') {
        // Permitir acceso a todas las rutas
        return;
      }
      
      // admin: puede acceder a inicio, proyectos y usuarios, pero NO a ajuste
      if (user.rol === 'admin') {
        if (location.pathname === '/ajuste') {
          console.log('App: Admin no puede acceder a ajuste, redirigiendo a /');
          navigate('/');
        }
        return;
      }
      
      // trabajador: puede acceder a inicio y proyectos asignados
      if (user.rol === 'trabajador') {
        if (location.pathname === '/ajuste' || location.pathname === '/usuarios') {
          console.log('App: Trabajador no puede acceder a ajuste/usuarios, redirigiendo a /');
          navigate('/');
        }
        return;
      }
      
      // visita: solo puede ver inicio y proyectos (sin acceso a proyectos)
      if (user.rol === 'visita') {
        if (location.pathname.startsWith('/proyecto/') || 
            location.pathname === '/ajuste' || 
            location.pathname === '/usuarios') {
          console.log('App: Visita no puede acceder a proyectos/ajuste/usuarios, redirigiendo a /');
          navigate('/');
        }
        return;
      }
    }
  }, [user, centros, navigate, location.pathname]);

  const handleUsuariosClick = (event) => {
    event.preventDefault();
    navigate('/usuarios');
  };

  if (!user) {
    // Solo el login es condicional
    return <Login setUser={setUser} setCentros={setCentros} />;
  }

  const handleLogout = () => {
    // Limpiar localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('centros');
    // Limpiar estado
    setUser(null);
    setCentros([]);
    // Redirigir a la página de login (raíz)
    window.location.href = '/';
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<MasterPage user={user} centros={centros} onLogout={handleLogout} />} />
        <Route path="/centros-por-region" element={<CentrosPorRegion user={user} centros={centros} onLogout={handleLogout} />} />
        <Route path="/ajuste" element={<Ajuste user={user} />} />
        <Route path="/proyecto/:proyectoId" element={<ProyectoPage />} />
        <Route path="/usuarios" element={<UsuariosPage user={user} />} />
      </Routes>
      {user && <GeminiChat />}
    </>
  );
}

// Envolver App con Router para que useNavigate funcione
function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWithRouter; 