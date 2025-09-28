import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleUsuariosClick = (event) => {
    event.preventDefault();
    navigate('/usuarios');
  };

  const handleAjusteClick = (event) => {
    event.preventDefault();
    navigate('/ajuste');
  };

  const handleInicioClick = (event) => {
    event.preventDefault();
    navigate('/');
  };

  const handleProyectosClick = (event) => {
    event.preventDefault();
    navigate('/centros-por-region');
  };

  return (
    <nav className="navbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#0a6ebd',
      padding: '0.56rem 1.6rem',
      color: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      zIndex: 1000,
      fontSize: '0.84rem'
    }}>
      <div className="navbar-left" style={{
        display: 'flex',
        alignItems: 'center'
      }}>
        <img src={process.env.PUBLIC_URL + '/img/logo-codelco.png'} alt="Logo" className="navbar-logo" style={{
          width: '80px',
          height: 'auto',
          marginRight: '0.96rem',
          marginTop: '1.6px'
        }} />
        <span className="navbar-title" style={{
          fontWeight: 'bold',
          fontSize: '1.04rem',
          letterSpacing: '0.4px'
        }}>Control Proyectos Financieros - Codelco</span>
      </div>
      <div className="navbar-menu" style={{
        display: 'flex',
        gap: '1.6rem'
      }}>
        <a className="navbar-link" onClick={handleInicioClick} style={{
          cursor: 'pointer',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.32rem',
          transition: 'color 0.2s'
        }}>
          <i className="fa fa-home" style={{fontSize: '0.84rem'}}></i> Inicio
        </a>
        <a className="navbar-link" onClick={handleProyectosClick} style={{
          cursor: 'pointer',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.32rem',
          transition: 'color 0.2s'
        }}>
          <i className="fa fa-building" style={{fontSize: '0.84rem'}}></i> Proyectos
        </a>
        {(user.rol === 'super_admin' || user.rol === 'admin') && (
          <a className="navbar-link" onClick={handleUsuariosClick} style={{
            cursor: 'pointer',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.32rem',
            transition: 'color 0.2s'
          }}>
            <i className="fa fa-users" style={{fontSize: '0.84rem'}}></i> Usuarios
          </a>
        )}
        {user.rol === 'super_admin' && (
          <a className="navbar-link" onClick={handleAjusteClick} style={{
            cursor: 'pointer',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.32rem',
            transition: 'color 0.2s'
          }}>
            <i className="fa fa-cog" style={{fontSize: '0.84rem'}}></i> Ajuste
          </a>
        )}
      </div>
      <div className="navbar-user" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        fontWeight: '500',
        fontSize: '0.84rem'
      }}>
        <i className="fa fa-user-circle" style={{fontSize: '0.84rem'}}></i> {user.nombre} ({user.rol})
        <button className="logout-btn" onClick={onLogout} style={{
          background: '#fff',
          color: '#0a6ebd',
          border: 'none',
          borderRadius: '4.8px',
          padding: '0.32rem 0.8rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s',
          fontSize: '0.84rem'
        }}>Cerrar sesión</button>
      </div>
    </nav>
  );
};

export default Navbar;
