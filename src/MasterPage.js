import React, { useState, useEffect } from 'react';
import './MasterPage.css';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './config';

const MasterPage = ({ user, centros, onLogout }) => {
  const [selectedCentro, setSelectedCentro] = useState(
    centros.length === 1 ? centros[0].id : ''
  );
  const [showFinanciera, setShowFinanciera] = useState(false);
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regiones, setRegiones] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [showRegionSelect, setShowRegionSelect] = useState(false);

  // Cargar regiones solo si se va a mostrar el selector
  useEffect(() => {
    if (showRegionSelect && regiones.length === 0) {
      fetch(`${API_BASE}/regiones.php`)
        .then(res => res.json())
        .then(data => setRegiones(data))
        .catch(error => {
          console.error('Error cargando regiones:', error);
          setRegiones([]);
        });
    }
  }, [showRegionSelect, regiones.length]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('centros');
    // Redirigir a la página principal donde se puede acceder al login
    window.location.href = '/';
  };

  // Función para manejar la navegación a proyectos
  const handleProyectosClick = (event) => {
    event.preventDefault();
    console.log('Botón Proyectos clickeado');
    console.log('Usuario actual:', user);
    console.log('Centros disponibles:', centros);
    console.log('Navegando a /centros-por-region');
    
    try {
      navigate('/centros-por-region');
    } catch (error) {
      console.error('Error al navegar:', error);
      // Fallback: usar window.location si navigate falla
      window.location.href = '/centros-por-region';
    }
  };

  const handleUsuariosClick = (event) => {
    event.preventDefault();
    navigate('/usuarios');
  };

  // Función para probar navegación básica
  const handleTestClick = () => {
    console.log('Botón de prueba clickeado');
    navigate('/test');
  };

  const handleAjusteClick = (event) => {
    event.preventDefault();
    navigate('/ajuste');
  };

  // Si es visita sin permiso
  if (user.rol === 'visita_sin_permiso' || !user.aprobado) {
    return (
      <div style={{ margin: '2rem', textAlign: 'center' }}>
        <h2>Acceso Restringido</h2>
        <p>Tu cuenta está pendiente de aprobación. Por favor, espera autorización de un administrador.</p>
      </div>
    );
  }

  // Si es trabajador o visita y solo tiene un centro, redirige automáticamente
  if (
    (user.rol === 'trabajador' || user.rol === 'visita') &&
    centros.length === 1
  ) {
    return (
      <div style={{ margin: '2rem', textAlign: 'center' }}>
        <h2>Bienvenido a {centros[0].nombre}</h2>
        <p>Proyecto/Sucursal: {centros[0].descripcion}</p>
        <p>
          {user.rol === 'visita'
            ? 'Solo tienes permisos de visualización.'
            : 'Tienes permisos restringidos para operar en este proyecto.'}
        </p>
        {/* Aquí puedes renderizar la página del proyecto/sucursal */}
        <button
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: '#764ba2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '0.5rem 1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  // Si es super admin o admin y tiene varios centros
  if (
    (user.rol === 'super_admin' || user.rol === 'admin') &&
    centros.length > 0
  ) {
    return (
      <div className="main-bg">
        <nav className="navbar">
          <div className="navbar-left">
            <img src={process.env.PUBLIC_URL + '/img/logo-codelco.png'} alt="Logo" className="navbar-logo" />
            <span className="navbar-title">Control Proyectos Financieros - Codelco</span>
          </div>
          <div className="navbar-menu">
            <a className="navbar-link" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
              <i className="fa fa-home"></i> Inicio
            </a>
            <a className="navbar-link" onClick={handleProyectosClick} style={{cursor: 'pointer'}}>
              <i className="fa fa-building"></i> Proyectos
            </a>
            {(user.rol === 'super_admin' || user.rol === 'admin') && (
              <a className="navbar-link" onClick={handleUsuariosClick} style={{cursor: 'pointer'}}>
                <i className="fa fa-users"></i> Usuarios
              </a>
            )}
            {user.rol === 'super_admin' && (
              <a className="navbar-link" onClick={handleAjusteClick} style={{cursor: 'pointer'}}>
                <i className="fa fa-cog"></i> Ajuste
              </a>
            )}
          </div>
          <div className="navbar-user">
            <i className="fa fa-user-circle"></i> {user.nombre} ({user.rol})
            <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </nav>
        <main className="main-content moderno">
          {/* Banner de bienvenida */}
          <div className="banner-bienvenida">
            <h1>¡Bienvenido a Control Proyectos Financieros - Codelco!</h1>
            <p>Centraliza, moderniza y asegura la gestión de tus proyectos financieros.</p>
          </div>

          {/* Accesos rápidos */}
          <div className="accesos-rapidos">
            <div className="tarjeta-acceso proyectos" onClick={handleProyectosClick} style={{cursor: 'pointer'}}>
              <i className="fa fa-building"></i>
              <h3>Proyectos</h3>
              <p>Visualización y control de los proyectos activos y su información financiera.</p>
            </div>
            {(user.rol === 'admin' || user.rol === 'super_admin') && (
              <div className="tarjeta-acceso usuarios" onClick={handleUsuariosClick} style={{cursor: 'pointer'}}>
                <i className="fa fa-users"></i>
                <h3>Usuarios</h3>
                <p>Administración segura de perfiles y permisos.</p>
              </div>
            )}
            {user.rol === 'super_admin' && (
              <div className="tarjeta-acceso ajuste" onClick={handleAjusteClick} style={{cursor: 'pointer'}}>
                <i className="fa fa-cog"></i>
                <h3>Ajuste</h3>
                <p>Configuración y personalización de la plataforma.</p>
              </div>
            )}
          </div>

          {/* Beneficios */}
          <div className="beneficios">
            <h2>Beneficios de la plataforma</h2>
            <ul>
              <li><i className="fa fa-shield-alt"></i> Seguridad avanzada y control de accesos.</li>
              <li><i className="fa fa-database"></i> Acceso centralizado y trazabilidad de acciones.</li>
              <li><i className="fa fa-sync-alt"></i> Modernización y eficiencia en la gestión financiera.</li>
              <li><i className="fa fa-smile"></i> Interfaz amigable y experiencia de usuario mejorada.</li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  // Si no tiene centros asignados
  return (
    <div className="main-bg">
      <nav className="navbar">
        <div className="navbar-left">
          <img src={process.env.PUBLIC_URL + '/img/logo-codelco.png'} alt="Logo" className="navbar-logo" />
          <span className="navbar-title">Control de Sucursales y Proyectos</span>
        </div>
        <div className="navbar-menu">
          
          <a href="#" className="navbar-link"><i className="fa fa-users"></i> Usuarios</a>
          <a href="#" className="navbar-link"><i className="fa fa-building"></i> Proyectos</a>
       
        </div>
        <div className="navbar-user">
          <i className="fa fa-user-circle"></i> {user.nombre} ({user.rol})
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>
      <div className="content-area">
        <div className="content-card">
          <h2>Bienvenido, {user.nombre}</h2>
          <p>Selecciona una sucursal/proyecto para comenzar.</p>
        </div>
      </div>
    </div>
  );
};

export default MasterPage;
