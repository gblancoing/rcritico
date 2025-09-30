import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Login from './login';
import MasterPage from './MasterPage';
import FinancieroPage from './FinancieroPage';
import CentrosPorRegion from './CentrosPorRegion';
import ProyectoPage from './ProyectoPage';
import './ProyectoPage.css';
import UsuariosPage from './UsuariosPage';
import Ajuste from './ajuste';

function App() {
  const [message, setMessage] = useState('');
  const [phpResponse, setPhpResponse] = useState('');
  const [loading, setLoading] = useState(false);
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
      
      if (
        (user.rol === 'super_admin' || user.rol === 'admin') &&
        location.pathname !== '/' &&
        location.pathname !== '/usuarios' &&
        location.pathname !== '/ajuste'
      ) {
        console.log('App: Redirigiendo admin a /');
        navigate('/');
      } else if ((user.rol === 'trabajador' || user.rol === 'visita') && centros.length === 1 && location.pathname !== `/financiero/${centros[0].id}`) {
        console.log('App: Redirigiendo trabajador/visita a financiero');
        navigate(`/financiero/${centros[0].id}`);
      } else if ((user.rol === 'trabajador' || user.rol === 'visita') && centros.length > 1 && location.pathname !== '/') {
        console.log('App: Redirigiendo trabajador/visita con múltiples centros a /');
        navigate('/');
      }
    }
  }, [user, centros, navigate, location.pathname]);

  // Función para probar la comunicación con PHP
  const testPhpConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test.php');
      const data = await response.text();
      setPhpResponse(data);
    } catch (error) {
      setPhpResponse('Error al conectar con PHP: ' + error.message);
    }
    setLoading(false);
  };

  // Función para enviar datos a PHP
  const sendToPhp = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/process.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
      });
      const data = await response.text();
      setPhpResponse(data);
    } catch (error) {
      setPhpResponse('Error al enviar datos: ' + error.message);
    }
    setLoading(false);
  };

  const irAFianciero = (centroId) => {
    navigate(`/financiero/${centroId}`);
  };

  const handleUsuariosClick = (event) => {
    event.preventDefault();
    navigate('/usuarios');
  };

  if (!user) {
    // Solo el login es condicional
    return <Login setUser={setUser} setCentros={setCentros} />;
  }

  return (
    <Routes>
      <Route path="/" element={<MasterPage user={user} centros={centros} onLogout={() => setUser(null)} />} />
      <Route path="/financiero/:centroId" element={<FinancieroPage user={user} centros={centros} />} />
      <Route path="/centros-por-region" element={<CentrosPorRegion user={user} centros={centros} onLogout={() => setUser(null)} />} />
      <Route path="/ajuste" element={<Ajuste user={user} />} />
      {/* Rutas alternativas para compatibilidad */}
      <Route path="/controlcantidad" element={<MasterPage user={user} centros={centros} onLogout={() => setUser(null)} />} />
      <Route path="/controlcantidad/financiero/:centroId" element={<FinancieroPage user={user} centros={centros} />} />
      <Route path="/financiero/:proyectoId" element={<FinancieroPage user={user} centros={centros} />} />
      <Route path="/proyecto/:proyectoId" element={<ProyectoPage />} />
      <Route path="/usuarios" element={<UsuariosPage user={user} />} />
    </Routes>
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