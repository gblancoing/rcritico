import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost/rcritico/api' 
  : '/api';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false);
  const notificacionesRef = useRef(null);

  // Cargar notificaciones al montar y cada 60 segundos
  useEffect(() => {
    cargarNotificaciones();
    const intervalo = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(intervalo);
  }, [user]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificacionesRef.current && !notificacionesRef.current.contains(event.target)) {
        setMostrarNotificaciones(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarNotificaciones = async () => {
    if (!user?.id) return;
    
    setCargandoNotificaciones(true);
    try {
      const res = await fetch(`${API_BASE}/notificaciones/obtener.php?usuario_id=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setNotificaciones(data.notificaciones || []);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setCargandoNotificaciones(false);
    }
  };

  const marcarComoLeida = async (notificacion) => {
    try {
      // Marcar como leída en el servidor
      const response = await fetch(`${API_BASE}/notificaciones/marcar_leida.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notificacion_id: notificacion.id,
          usuario_id: user.id,
          ref_id: notificacion.ref_id
        })
      });
      
      const result = await response.json();
      console.log('Respuesta marcar leída:', result);
      
      // Cerrar dropdown inmediatamente
      setMostrarNotificaciones(false);
      
      // Navegar a la carpeta correspondiente
      if (notificacion.carpeta_id && notificacion.proyecto_id) {
        // Guardar en sessionStorage para que GestorArchivos navegue al lugar correcto
        sessionStorage.setItem('navegarACarpeta', notificacion.carpeta_id);
        
        if (notificacion.tipo === 'mensaje') {
          // Para mensajes de foro, guardar el linea_base_id para hacer scroll
          if (notificacion.linea_base_id) {
            sessionStorage.setItem('lineaBaseId', notificacion.linea_base_id.toString());
          }
          sessionStorage.setItem('mostrarForo', 'true');
        } else if (notificacion.tipo === 'tarea') {
          // Para tareas, guardar el ID de la tarea
          if (notificacion.ref_id) {
            sessionStorage.setItem('tareaIdToOpen', notificacion.ref_id.toString());
          }
        }
        
        // Navegar al proyecto con la carpeta especificada
        window.location.href = `/proyecto/${notificacion.proyecto_id}?carpeta=${notificacion.carpeta_id}`;
      } else {
        // Si no hay navegación, solo recargar las notificaciones
        cargarNotificaciones();
      }
    } catch (error) {
      console.error('Error marcando notificación:', error);
    }
  };

  const totalNoLeidas = notificaciones.filter(n => !n.leida).length;

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

  const formatearTiempo = (fecha) => {
    const ahora = new Date();
    const notifFecha = new Date(fecha);
    const diff = ahora - notifFecha;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    return notifFecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  };

  return (
    <nav className="navbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#17a2b8',
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
        <img src={process.env.PUBLIC_URL + '/img/logo-codelco.png'} alt="Logo Codelco" className="navbar-logo" style={{
          width: '80px',
          height: 'auto',
          marginRight: '0.96rem',
          marginTop: '1.6px'
        }} />
        <span className="navbar-title" style={{
          fontWeight: 'bold',
          fontSize: '1.04rem',
          letterSpacing: '0.4px'
        }}>GESTIÓN CONTROLES CRÍTICOS QUE SALVAN VIDAS.</span>
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
        
        {/* Campanita de notificaciones */}
        <div ref={notificacionesRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setMostrarNotificaciones(!mostrarNotificaciones);
              if (!mostrarNotificaciones) cargarNotificaciones();
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            title="Notificaciones"
          >
            <i className="fa fa-bell" style={{ color: '#fff', fontSize: '14px' }}></i>
            {totalNoLeidas > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#dc3545',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '50%',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {totalNoLeidas > 99 ? '99+' : totalNoLeidas}
              </span>
            )}
          </button>

          {/* Dropdown de notificaciones */}
          {mostrarNotificaciones && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '360px',
              maxHeight: '450px',
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              zIndex: 1001
            }}>
              {/* Header del dropdown */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)'
              }}>
                <span style={{ 
                  fontWeight: '600', 
                  color: '#fff',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fa fa-bell"></i>
                  Notificaciones
                  {totalNoLeidas > 0 && (
                    <span style={{
                      background: 'rgba(255,255,255,0.25)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}>
                      {totalNoLeidas} nuevas
                    </span>
                  )}
                </span>
              </div>

              {/* Lista de notificaciones */}
              <div style={{ 
                maxHeight: '380px', 
                overflowY: 'auto'
              }}>
                {cargandoNotificaciones ? (
                  <div style={{ 
                    padding: '30px', 
                    textAlign: 'center', 
                    color: '#6c757d' 
                  }}>
                    <i className="fa fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Cargando...
                  </div>
                ) : notificaciones.length === 0 ? (
                  <div style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    color: '#6c757d' 
                  }}>
                    <i className="fa fa-bell-slash" style={{ 
                      fontSize: '32px', 
                      marginBottom: '12px',
                      opacity: 0.5 
                    }}></i>
                    <p style={{ margin: 0, fontSize: '14px' }}>No tienes notificaciones</p>
                  </div>
                ) : (
                  notificaciones.map((notif, index) => (
                    <div
                      key={notif.id || index}
                      role="button"
                      tabIndex={0}
                      onClick={() => marcarComoLeida(notif)}
                      onKeyPress={(e) => { if (e.key === 'Enter') marcarComoLeida(notif); }}
                      aria-label={`Notificación: ${notif.mensaje}`}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        background: notif.leida ? '#fff' : '#f0f7ff',
                        transition: 'background 0.15s',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = notif.leida ? '#f8f9fa' : '#e3f2fd'}
                      onMouseLeave={(e) => e.currentTarget.style.background = notif.leida ? '#fff' : '#f0f7ff'}
                    >
                      {/* Icono según tipo */}
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: notif.tipo === 'mensaje' ? '#17a2b8' : 
                                   notif.tipo === 'tarea' ? '#ffc107' : '#6c757d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <i className={`fa ${notif.tipo === 'mensaje' ? 'fa-comment' : 
                                          notif.tipo === 'tarea' ? 'fa-tasks' : 'fa-bell'}`} 
                           style={{ color: '#fff', fontSize: '14px' }}></i>
                      </div>

                      {/* Contenido */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          color: '#333',
                          fontWeight: notif.leida ? '400' : '600',
                          marginBottom: '4px',
                          lineHeight: '1.4'
                        }}>
                          {notif.mensaje}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#6c757d',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>
                            <i className="fa fa-folder" style={{ marginRight: '4px' }}></i>
                            {notif.carpeta_nombre || 'General'}
                          </span>
                          <span>•</span>
                          <span>{formatearTiempo(notif.fecha)}</span>
                        </div>
                      </div>

                      {/* Indicador de no leída */}
                      {!notif.leida && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#17a2b8',
                          flexShrink: 0,
                          marginTop: '6px'
                        }}></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <button className="logout-btn" onClick={onLogout} style={{
          background: '#fff',
          color: '#17a2b8',
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
