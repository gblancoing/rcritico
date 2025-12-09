import React, { useState, useEffect } from 'react';
import './MasterPage.css';
import '../styles/Navbar.css';
import '../styles/MasterPageZoom.css';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

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
      <div className="main-bg" style={{
        background: `linear-gradient(rgba(10, 110, 189, 0.3), rgba(30, 64, 175, 0.3)), url(${process.env.PUBLIC_URL + '/img/muro.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh'
      }}>
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content moderno" style={{ paddingTop: '100px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '3rem',
            textAlign: 'center',
            width: '100%',
            maxWidth: '700px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <i className="fa fa-lock" style={{ fontSize: '4rem', color: '#dc3545', marginBottom: '1rem' }}></i>
            <h2 style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              color: '#dc3545',
              fontWeight: '700'
            }}>
              Acceso Restringido
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#666',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Tu cuenta está pendiente de aprobación.
            </p>
            <p style={{
              fontSize: '0.95rem',
              color: '#888',
              lineHeight: '1.6'
            }}>
              Por favor, espera autorización de un administrador para acceder al sistema.
            </p>
          </div>
        </main>
      </div>
    );
  }
  
  // Función para obtener información según el rol
  const getRoleInfo = () => {
    const roleInfo = {
      super_admin: {
        title: 'Super Administrador',
        subtitle: 'Control total del sistema',
        description: 'Tienes acceso completo a todas las funcionalidades del sistema. Puedes gestionar usuarios, proyectos, carpetas y configuraciones.',
        features: [
          { icon: 'fa-users-cog', text: 'Gestión completa de usuarios y roles' },
          { icon: 'fa-project-diagram', text: 'Administración de proyectos y carpetas' },
          { icon: 'fa-cog', text: 'Configuración del sistema' },
          { icon: 'fa-shield-alt', text: 'Control de permisos y accesos' },
          { icon: 'fa-chart-line', text: 'Visión global de todos los proyectos' }
        ],
        actions: [
          { icon: 'fa-building', title: 'Proyectos', description: 'Gestiona todos los proyectos y carpetas', onClick: handleProyectosClick },
          { icon: 'fa-cog', title: 'Ajuste', description: 'Configuración del sistema', onClick: handleAjusteClick }
        ]
      },
      admin: {
        title: 'Administrador',
        subtitle: 'Gestión de carpetas asignadas',
        description: 'Puedes gestionar las carpetas que te han sido asignadas y administrar usuarios trabajadores dentro de ellas.',
        features: [
          { icon: 'fa-folder-open', text: 'Gestión de carpetas asignadas' },
          { icon: 'fa-user-plus', text: 'Asignar trabajadores a carpetas' },
          { icon: 'fa-file-upload', text: 'Subir y gestionar archivos' },
          { icon: 'fa-tasks', text: 'Crear y asignar tareas' },
          { icon: 'fa-comments', text: 'Moderar foros de discusión' }
        ],
        actions: [
          { icon: 'fa-building', title: 'Proyectos', description: 'Accede a tus carpetas asignadas', onClick: handleProyectosClick }
        ]
      },
      trabajador: {
        title: 'Trabajador',
        subtitle: 'Colaboración en proyectos',
        description: 'Trabaja en las carpetas asignadas, sube archivos, completa tareas y participa en los foros de discusión.',
        features: [
          { icon: 'fa-folder', text: 'Acceso a carpetas asignadas' },
          { icon: 'fa-file-upload', text: 'Subir archivos y documentos' },
          { icon: 'fa-tasks', text: 'Ver y completar tareas asignadas' },
          { icon: 'fa-comments', text: 'Participar en foros de discusión' },
          { icon: 'fa-chart-bar', text: 'Visualizar análisis Bowtie y Línea Base' }
        ],
        actions: [
          { icon: 'fa-building', title: 'Proyectos', description: 'Accede a tus proyectos asignados', onClick: handleProyectosClick }
        ]
      },
      visita: {
        title: 'Usuario Visitante',
        subtitle: 'Acceso de solo lectura',
        description: 'Tienes permisos limitados de visualización. Contacta a un administrador si necesitas acceso adicional.',
        features: [
          { icon: 'fa-eye', text: 'Visualización de contenido asignado' },
          { icon: 'fa-file-download', text: 'Descarga de archivos permitidos' },
          { icon: 'fa-info-circle', text: 'Consulta de información general' }
        ],
        actions: []
      }
    };
    return roleInfo[user.rol] || roleInfo.trabajador;
  };

  const roleInfo = getRoleInfo();

  // Función para convertir hex a rgba
  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Función para obtener el color del icono según su tipo
  const getIconColor = (iconName) => {
    const iconColors = {
      // Acciones principales
      'fa-building': '#0a6ebd', // Azul para proyectos
      'fa-cog': '#6b7280', // Gris para ajuste/configuración
      
      // Características del perfil
      'fa-folder': '#3b82f6', // Azul claro para carpetas
      'fa-folder-open': '#3b82f6',
      'fa-file-upload': '#10b981', // Verde para subir archivos
      'fa-tasks': '#f59e0b', // Naranja/ámbar para tareas
      'fa-comments': '#8b5cf6', // Púrpura para foros
      'fa-chart-bar': '#ef4444', // Rojo para análisis
      'fa-user-plus': '#06b6d4', // Cyan para usuarios
      'fa-eye': '#6366f1', // Índigo para visualización
      'fa-file-download': '#14b8a6', // Teal para descargas
      'fa-info-circle': '#64748b', // Gris para información
      'fa-users-cog': '#0ea5e9', // Azul cielo para gestión usuarios
      'fa-project-diagram': '#0a6ebd', // Azul para proyectos
      'fa-shield-alt': '#10b981', // Verde para seguridad
      'fa-chart-line': '#f59e0b', // Naranja para gráficos
      
      // Características del sistema
      'fa-history': '#6366f1', // Índigo para trazabilidad
      'fa-users': '#8b5cf6', // Púrpura para colaboración
      
      // Default
      'default': '#0a6ebd'
    };
    
    return iconColors[iconName] || iconColors['default'];
  };

  // Renderizado principal con diseño profesional mejorado
    return (
      <div className="main-bg" style={{
      background: `linear-gradient(rgba(10, 110, 189, 0.35), rgba(30, 64, 175, 0.35)), url(${process.env.PUBLIC_URL + '/img/muro.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      paddingBottom: '2rem'
    }}>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '90px 1.5rem 2rem 1.5rem'
      }}>
        {/* Header Section - Bienvenida Compacta */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(30px)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0a6ebd 0%, #FF8C00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <i className="fa fa-user-circle" style={{ fontSize: '1.5rem', color: 'white' }}></i>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.25rem',
                flexWrap: 'wrap'
              }}>
                <h1 style={{
                  fontSize: '1.15rem',
                  margin: 0,
                  fontWeight: '700',
                  color: '#ffffff',
                  letterSpacing: '-0.1px',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)'
                }}>
                  {user.nombre}
                </h1>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'linear-gradient(135deg, #0a6ebd 0%, #FF8C00 100%)',
                  color: 'white',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}>
                  <i className="fa fa-user-shield" style={{ fontSize: '0.65rem' }}></i>
                  {roleInfo.title}
                </div>
              </div>
              <p style={{
                fontSize: '0.85rem',
                color: '#e2e8f0',
                margin: 0,
                fontWeight: '500',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
              }}>
                {roleInfo.subtitle}
              </p>
            </div>
          </div>
          </div>

        {/* Main Content Grid - Compacto */}
        <div className="dashboard-main-grid" style={{
          display: 'grid',
          gridTemplateColumns: roleInfo.actions.length > 0 ? '1fr 1fr' : '1fr',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          {/* Left Column - Acciones Rápidas */}
          {roleInfo.actions.length > 0 && (
            <div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(20px)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '0.875rem',
                border: '1px solid rgba(10, 110, 189, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0a6ebd 0%, #FF8C00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className="fa fa-bolt" style={{ fontSize: '0.75rem', color: 'white' }}></i>
                </div>
                <h2 style={{
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)'
                }}>
                  Accesos Rápidos
                </h2>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {roleInfo.actions.map((action, index) => (
                  <div
                    key={index}
                    onClick={action.onClick}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(30px)',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      border: '1px solid rgba(10, 110, 189, 0.25)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.875rem'
                    }}
                    onMouseEnter={(e) => {
                      const iconColor = getIconColor(action.icon);
                      e.currentTarget.style.borderColor = iconColor;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = `0 4px 16px ${hexToRgba(iconColor, 0.4)}`;
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(10, 110, 189, 0.25)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: getIconColor(action.icon),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 3px 10px ${hexToRgba(getIconColor(action.icon), 0.4)}`
                    }}>
                      <i className={`fa ${action.icon}`} style={{ fontSize: '1.1rem', color: 'white' }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '0.15rem',
                        lineHeight: '1.3',
                        textShadow: '0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>
                        {action.title}
                      </h3>
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#e2e8f0',
                        margin: 0,
                        lineHeight: '1.4',
                        textShadow: '0 1px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
                      }}>
                        {action.description}
                      </p>
                    </div>
                    <i className="fa fa-chevron-right" style={{ color: '#e2e8f0', fontSize: '0.85rem', flexShrink: 0, textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}></i>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column - Características del Perfil */}
          <div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '0.875rem',
              border: '1px solid rgba(10, 110, 189, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0a6ebd 0%, #FF8C00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <i className="fa fa-star" style={{ fontSize: '0.75rem', color: 'white' }}></i>
              </div>
              <h2 style={{
                fontSize: '0.9rem',
                fontWeight: '700',
                color: '#ffffff',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)'
              }}>
                Características de tu Perfil
              </h2>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(30px)',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(10, 110, 189, 0.25)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem'
              }}>
                {roleInfo.features.map((feature, index) => {
                  const iconColor = getIconColor(feature.icon);
                  return (
                  <div
                    key={index}
                    style={{
                      padding: '0.875rem',
                      background: hexToRgba(iconColor, 0.08),
                      borderRadius: '10px',
                      border: `1px solid ${hexToRgba(iconColor, 0.2)}`,
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = hexToRgba(iconColor, 0.15);
                      e.currentTarget.style.borderColor = hexToRgba(iconColor, 0.3);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = hexToRgba(iconColor, 0.08);
                      e.currentTarget.style.borderColor = hexToRgba(iconColor, 0.2);
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9px',
                      background: iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.625rem auto',
                      boxShadow: `0 3px 10px ${hexToRgba(iconColor, 0.4)}`
                    }}>
                      <i className={`fa ${feature.icon}`} style={{
                        fontSize: '1rem',
                        color: 'white'
                      }}></i>
                    </div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#e2e8f0',
                      lineHeight: '1.4',
                      fontWeight: '500',
                      margin: 0,
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}>
                      {feature.text}
                    </p>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
          </div>

        {/* Sistema Features - Compacto */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(30px)',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(10, 110, 189, 0.25)'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            border: '1px solid rgba(10, 110, 189, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0a6ebd 0%, #FF8C00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <i className="fa fa-info-circle" style={{ fontSize: '0.75rem', color: 'white' }}></i>
            </div>
            <h2 style={{
              fontSize: '0.9rem',
              fontWeight: '700',
              color: '#ffffff',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)'
            }}>
              Características del Sistema
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem'
          }}>
            {[
              { icon: 'fa-shield-alt', title: 'Seguridad', desc: 'Control de accesos por rol' },
              { icon: 'fa-project-diagram', title: 'Organización', desc: 'Gestión por proyectos y carpetas' },
              { icon: 'fa-history', title: 'Trazabilidad', desc: 'Registro completo de actividades' },
              { icon: 'fa-users', title: 'Colaboración', desc: 'Trabajo en equipo eficiente' }
            ].map((item, index) => {
              const iconColor = getIconColor(item.icon);
              return (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: hexToRgba(iconColor, 0.08),
                  borderRadius: '10px',
                  border: `1px solid ${hexToRgba(iconColor, 0.2)}`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = hexToRgba(iconColor, 0.15);
                  e.currentTarget.style.borderColor = hexToRgba(iconColor, 0.3);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = hexToRgba(iconColor, 0.08);
                  e.currentTarget.style.borderColor = hexToRgba(iconColor, 0.2);
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '9px',
                  background: iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.625rem auto',
                  boxShadow: `0 3px 10px ${hexToRgba(iconColor, 0.4)}`
                }}>
                  <i className={`fa ${item.icon}`} style={{ fontSize: '1.1rem', color: 'white' }}></i>
                </div>
                <h3 style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  margin: '0 0 0.3rem 0',
                  fontWeight: '600',
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#e2e8f0',
                  margin: 0,
                  lineHeight: '1.4',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
                }}>
                  {item.desc}
                </p>
      </div>
    );
            })}
          </div>
        </div>
      </div>
    </div>
  );

};

export default MasterPage;
