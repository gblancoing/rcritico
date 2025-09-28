import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterPage.css';
import './css/Navbar.css';
import Navbar from './components/Navbar';
import { useProject } from './ProjectContext';
import { API_BASE } from './config';

const CentrosPorRegion = ({ user, centros, onLogout }) => {
  const [regiones, setRegiones] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [proyectosPorRegion, setProyectosPorRegion] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState([]);
  const navigate = useNavigate();
  const { setSelectedProject } = useProject();

  useEffect(() => {
    const cargarDatos = async () => {
      console.log('CentrosPorRegion: Cargando datos...');
      console.log('API_BASE:', API_BASE);
      console.log('Centros recibidos:', centros);
      
      try {
        // Cargar regiones
        const responseRegiones = await fetch(`${API_BASE}/regiones.php`);
        console.log('Respuesta de regiones:', responseRegiones);
        
        if (!responseRegiones.ok) {
          throw new Error(`HTTP error! status: ${responseRegiones.status}`);
        }
        
        const dataRegiones = await responseRegiones.json();
        console.log('Datos de regiones:', dataRegiones);
        
        // Determinar qué datos usar según la estructura de respuesta
        let regionesData = [];
        if (dataRegiones.success && Array.isArray(dataRegiones.regiones)) {
          regionesData = dataRegiones.regiones;
        } else if (Array.isArray(dataRegiones)) {
          regionesData = dataRegiones;
        } else {
          console.error('Error: datos de regiones no válidos:', dataRegiones);
          setRegiones([]);
          return;
        }
        
        console.log('Regiones procesadas:', regionesData);
        
        // Cargar proyectos reales
        const responseProyectos = await fetch(`${API_BASE}/proyectos.php`);
        
        if (!responseProyectos.ok) {
          throw new Error(`HTTP error! status: ${responseProyectos.status}`);
        }
        
        const dataProyectos = await responseProyectos.json();
        console.log('Datos de proyectos:', dataProyectos);
        
        // Determinar qué datos usar según la estructura de respuesta
        let proyectosData = [];
        if (dataProyectos.success && Array.isArray(dataProyectos.proyectos)) {
          proyectosData = dataProyectos.proyectos;
        } else if (Array.isArray(dataProyectos)) {
          proyectosData = dataProyectos;
        } else {
          console.error('Error: datos de proyectos no válidos:', dataProyectos);
          setProyectos([]);
          return;
        }

        console.log('Proyectos procesados:', proyectosData);
        setProyectos(proyectosData);

        // Agrupar proyectos por región
        const agrupados = {};
        regionesData.forEach(region => {
          agrupados[region.region_id] = proyectosData.filter(p => String(p.region_id) === String(region.region_id));
        });
        setProyectosPorRegion(agrupados);
        
        console.log('Proyectos agrupados por región:', agrupados);
        
        // Agregar cantidad de proyectos a cada región
        const regionesConCantidad = regionesData.map(region => ({
          ...region,
          cantidad_proyectos: agrupados[region.region_id] ? agrupados[region.region_id].length : 0
        }));
        
        console.log('Regiones con cantidad final:', regionesConCantidad);
        setRegiones(regionesConCantidad);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setRegiones([]);
        setProyectos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('centros');
    // Redirigir a la página de login
    window.location.href = '/financiero/';
  };

  // Expandir/cerrar región
  const toggleExpand = (regionId) => {
    setExpanded(prev =>
      prev.includes(regionId)
        ? prev.filter(id => id !== regionId)
        : [...prev, regionId]
    );
  };

  // Navegar al proyecto
  const handleProyectoClick = (proyectoId) => {
    const proyecto = proyectos.find(p => p.proyecto_id === proyectoId);
    setSelectedProject(proyecto); // Guarda el proyecto seleccionado en el contexto
    navigate(`/proyecto/${proyectoId}`);
  };

  // Función para manejar la navegación a usuarios
  const handleUsuariosClick = (event) => {
    event.preventDefault();
    navigate('/usuarios');
  };

  // Función para manejar la navegación a ajuste
  const handleAjusteClick = (event) => {
    event.preventDefault();
    navigate('/ajuste');
  };

  if (loading) {
    return (
      <div className="main-bg">
        <div className="content-card" style={{textAlign: 'center'}}>
          <h2>Cargando regiones...</h2>
        </div>
      </div>
    );
  }

  // Solo super_admin y admin pueden ver la navegación entre proyectos
  if (user.rol !== 'super_admin' && user.rol !== 'admin') {
    return (
      <div className="main-bg">
        <div className="content-card" style={{textAlign: 'center', marginTop: '4rem'}}>
          <h2>Acceso restringido</h2>
          <p>No tienes permisos para navegar entre proyectos y regiones.</p>
          <p>Contacta a un administrador para más información.</p>
        </div>
      </div>
    );
  }

  // Validar que regiones sea un array antes de filtrar
  if (!Array.isArray(regiones)) {
    console.error('Error: regiones no es un array:', regiones);
    return (
      <div className="main-bg">
        <div className="content-card" style={{textAlign: 'center'}}>
          <h2>Error cargando datos</h2>
          <p>No se pudieron cargar las regiones correctamente.</p>
        </div>
      </div>
    );
  }

  let regionesFiltradas = regiones;
  let proyectosPorRegionFiltrados = proyectosPorRegion;

  console.log('Usuario actual:', user);
  console.log('Centros disponibles:', centros);
  console.log('Regiones totales:', regiones.length);
  console.log('Regiones cargadas:', regiones);
  console.log('Proyectos por región:', proyectosPorRegion);
  console.log('Estado loading:', loading);

  if (user.rol === 'admin') {
    // Para admin, mostrar solo su región y proyecto asignado
    console.log('Usuario admin:', user);
    console.log('Centros del admin:', centros);
    
    // Obtener la región y proyecto del usuario admin
    const userRegionId = user.region_id;
    const userProyectoId = user.proyecto_id;
    
    console.log('Región del admin:', userRegionId);
    console.log('Proyecto del admin:', userProyectoId);
    
    if (userRegionId && userProyectoId) {
      // Filtrar solo la región del admin
      regionesFiltradas = regiones.filter(region => String(region.region_id) === String(userRegionId));
      
      // Filtrar solo el proyecto del admin en esa región
      proyectosPorRegionFiltrados = {};
      regionesFiltradas.forEach(region => {
        proyectosPorRegionFiltrados[region.region_id] = (proyectosPorRegion[region.region_id] || []).filter(p => 
          String(p.proyecto_id) === String(userProyectoId)
        );
      });
      
      console.log('Regiones filtradas para admin:', regionesFiltradas);
      console.log('Proyectos filtrados para admin:', proyectosPorRegionFiltrados);
    } else {
      console.log('Admin sin región o proyecto asignado');
      regionesFiltradas = [];
      proyectosPorRegionFiltrados = {};
    }
  }

  console.log('Regiones filtradas:', regionesFiltradas.length);
  console.log('Proyectos por región filtrados:', proyectosPorRegionFiltrados);

  // Validación final antes del render
  if (!Array.isArray(regionesFiltradas)) {
    console.error('Error: regionesFiltradas no es un array:', regionesFiltradas);
    regionesFiltradas = [];
  }

  return (
    <div className="main-bg" style={{
      background: `linear-gradient(rgba(10, 110, 189, 0.4), rgba(30, 64, 175, 0.4)), url(${process.env.PUBLIC_URL + '/img/muro.jpg'})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <style>
        {`
          .main-content.moderno {
            background: transparent !important;
            box-shadow: none !important;
          }
          
          .content-card {
            background: transparent !important;
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          /* Enable scrolling so content is visible */
          .main-content.moderno {
            overflow-y: auto !important;
            height: calc(100vh - 80px) !important;
          }
          
          .content-card {
            max-height: calc(100vh - 140px) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            animation: fadeInUp 0.6s ease-out;
          }
          
          /* Scrollbar personalizado */
          .content-card::-webkit-scrollbar {
            width: 6px;
          }
          
          .content-card::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          
          .content-card::-webkit-scrollbar-thumb {
            background: rgba(245, 158, 11, 0.6);
            border-radius: 3px;
          }
          
          .content-card::-webkit-scrollbar-thumb:hover {
            background: rgba(245, 158, 11, 0.8);
          }
          
          /* Responsive design */
          @media (max-width: 768px) {
            .content-card {
              margin: 10px !important;
              border-radius: 12px !important;
            }
          }
          
          @media (max-width: 480px) {
            .content-card {
              margin: 5px !important;
              border-radius: 8px !important;
            }
          }
          
          /* Efectos de hover mejorados */
          .region-item:hover {
            animation: pulse 0.6s ease-in-out;
          }
          
          /* Transiciones suaves */
          * {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          /* Estilos hover para navbar */
          .navbar-link:hover {
            color: #ffd700 !important;
          }
          
          .logout-btn:hover {
            background: #ffd700 !important;
            color: #0a6ebd !important;
          }
        `}
      </style>
      <Navbar user={user} onLogout={handleLogout} />

      <main className="main-content moderno" style={{
        paddingTop: '30px', 
        background: 'transparent', 
        boxShadow: 'none',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div className="content-card" style={{
          maxWidth: window.innerWidth > 1200 ? '560px' : window.innerWidth > 768 ? '480px' : '76%', 
          minWidth: window.innerWidth > 768 ? '320px' : '240px',
          margin: '0 auto', 
          padding: '0', 
          background: 'rgba(13, 30, 60, 0.92)', 
          boxShadow: '0 20px 64px rgba(0, 0, 0, 0.32)', 
          border: '1px solid rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '13px',
          position: 'relative',
          fontSize: window.innerWidth > 768 ? '11px' : '10px',
          height: 'auto',
          maxHeight: 'calc(100vh - 140px)',
          overflow: 'hidden'
        }}>
          {/* Debug info para verificar carga de datos */}
          {regionesFiltradas.length === 0 && loading && (
            <div style={{padding: '12px', color: '#ffffff', textAlign: 'center', fontSize: '11px'}}>
              Cargando regiones desde base de datos...
            </div>
          )}
          {regionesFiltradas.length === 0 && !loading && (
            <div style={{padding: '12px', color: '#ffffff', textAlign: 'center', fontSize: '11px'}}>
              No se encontraron regiones. Verifica la conexión con la base de datos.
            </div>
          )}
          {/* Header con título */}
          {regionesFiltradas.length > 0 && (
            <div style={{
              padding: '16px 20px 12px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                margin: 0,
                textAlign: 'center',
                letterSpacing: '0.4px'
              }}>
                Regiones y Proyectos
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '10px',
                margin: '3px 0 0 0',
                textAlign: 'center'
              }}>
                Selecciona una región para ver sus proyectos
              </p>
            </div>
          )}

          {/* Desplegar solo si hay datos */}
          {regionesFiltradas.length > 0 && (
            <div style={{
              padding: '16px 20px 20px 20px',
              maxHeight: 'calc(100vh - 280px)',
              overflowY: 'auto'
            }}>
              <ul style={{
                listStyle: 'none', 
                padding: 0,
                margin: 0,
                width: '100%'
              }}>
                {regionesFiltradas.map((region, index) => {
                  const proyectosRegion = proyectosPorRegionFiltrados[region.region_id] || [];
                  const isExpanded = expanded.includes(region.region_id);
                  const tieneProyectos = Number(region.cantidad_proyectos) > 0;
                  
                  return (
                    <li key={region.region_id} style={{
                      marginBottom: '10px'
                    }}>
                      <div
                        onClick={() => tieneProyectos && toggleExpand(region.region_id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '13px 16px',
                          cursor: tieneProyectos ? 'pointer' : 'default',
                          background: tieneProyectos 
                            ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(59, 130, 246, 0.1))'
                            : 'rgba(255, 255, 255, 0.08)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          fontWeight: 500,
                          borderRadius: '10px',
                          border: tieneProyectos 
                            ? '1px solid rgba(96, 165, 250, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: tieneProyectos 
                            ? '0 3px 10px rgba(96, 165, 250, 0.1)'
                            : '0 2px 6px rgba(0, 0, 0, 0.1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseOver={e => {
                          if (tieneProyectos) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(96, 165, 250, 0.25), rgba(59, 130, 246, 0.15))';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(96, 165, 250, 0.2)';
                          }
                        }}
                        onMouseOut={e => {
                          if (tieneProyectos) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(59, 130, 246, 0.1))';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.1)';
                          }
                        }}
                      >
                        {/* Efecto de brillo sutil */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
                        }}></div>
                        
                        <div style={{display: 'flex', alignItems: 'center', flex: 1}}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: tieneProyectos 
                              ? 'linear-gradient(135deg, #60a5fa, #3b82f6)'
                              : 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '13px',
                            boxShadow: tieneProyectos 
                              ? '0 3px 10px rgba(96, 165, 250, 0.3)'
                              : '0 2px 6px rgba(0, 0, 0, 0.1)'
                          }}>
                            <i className="fa fa-map-marker-alt" style={{
                              color: '#ffffff', 
                              fontSize: '13px',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                            }}></i>
                          </div>
                          <div style={{flex: 1}}>
                            <span style={{
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '12px',
                              lineHeight: '1.3',
                              display: 'block'
                            }}>
                              {region.nombre}
                            </span>
                            <span style={{
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontSize: '10px',
                              fontWeight: 400
                            }}>
                              Región {index + 1} de {regionesFiltradas.length}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <div style={{
                            background: tieneProyectos 
                              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                              : 'rgba(255, 255, 255, 0.1)',
                            padding: '5px 10px',
                            borderRadius: '16px',
                            border: tieneProyectos 
                              ? '1px solid rgba(245, 158, 11, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: tieneProyectos 
                              ? '0 2px 6px rgba(245, 158, 11, 0.2)'
                              : 'none'
                          }}>
                            <span style={{
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '11px'
                            }}>
                              {region.cantidad_proyectos} proyecto{region.cantidad_proyectos === 1 ? '' : 's'}
                            </span>
                          </div>
                          {tieneProyectos && (
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s ease'
                            }}>
                              <i className={`fa fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{
                                fontSize: '10px',
                                color: '#f59e0b',
                                transition: 'transform 0.3s ease'
                              }}></i>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Proyectos desplegados con mejor diseño */}
                      {isExpanded && tieneProyectos && (
                        <div style={{
                          marginTop: '6px',
                          padding: '13px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '10px',
                            paddingBottom: '6px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <i className="fa fa-folder-open" style={{
                              color: '#f59e0b',
                              fontSize: '11px',
                              marginRight: '6px'
                            }}></i>
                            <span style={{
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              Proyectos en esta región ({proyectosRegion.length})
                            </span>
                          </div>
                          
                          <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                          }}>
                            {proyectosRegion.map((proy, proyIndex) => (
                              <li
                                key={proy.proyecto_id}
                                onClick={() => handleProyectoClick(proy.proyecto_id)}
                                style={{
                                  padding: '10px 13px',
                                  cursor: 'pointer',
                                  color: '#ffffff',
                                  fontWeight: 400,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  borderRadius: '6px',
                                  margin: '5px 0',
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))';
                                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                                  e.currentTarget.style.transform = 'translateX(4px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.2)';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                  e.currentTarget.style.transform = 'translateX(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                {/* Indicador numérico */}
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  color: '#ffffff',
                                  flexShrink: 0
                                }}>
                                  {proyIndex + 1}
                                </div>
                                
                                <div style={{flex: 1}}>
                                  <div style={{
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    lineHeight: '1.3',
                                    marginBottom: '2px'
                                  }}>
                                    {proy.nombre}
                                  </div>
                                  {proy.descripcion && (
                                    <div style={{
                                      color: 'rgba(255, 255, 255, 0.7)',
                                      fontSize: '10px',
                                      lineHeight: '1.3'
                                    }}>
                                      {proy.descripcion}
                                    </div>
                                  )}
                                </div>
                                
                                <i className="fa fa-arrow-right" style={{
                                  color: 'rgba(245, 158, 11, 0.6)',
                                  fontSize: '10px',
                                  transition: 'all 0.3s ease'
                                }}></i>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CentrosPorRegion;