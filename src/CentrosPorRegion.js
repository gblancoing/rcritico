import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterPage.css';
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
      background: `linear-gradient(rgba(10, 110, 189, 0.4), rgba(30, 64, 175, 0.4)), url(${process.env.PUBLIC_URL + '/img/Muro.JPG'})`,
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
          
          /* Enable scrolling so content is visible */
          .main-content.moderno {
            overflow-y: auto !important;
            height: calc(100vh - 80px) !important;
          }
          
          .content-card {
            max-height: calc(100vh - 140px) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
        `}
      </style>
      <nav className="navbar">
        <div className="navbar-left">
          <img src={process.env.PUBLIC_URL + '/img/logo-codelco.png'} alt="Logo" className="navbar-logo" />
          <span className="navbar-title">Control Proyectos Financieros - Codelco</span>
        </div>
        <div className="navbar-menu">
          <a className="navbar-link" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <i className="fa fa-home"></i> Inicio
          </a>
          <a className="navbar-link" onClick={() => navigate('/centros-por-region')} style={{cursor: 'pointer'}}>
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

      <main className="main-content moderno" style={{
        paddingTop: '30px', 
        background: 'transparent', 
        boxShadow: 'none',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className="content-card" style={{
          maxWidth: '450px', 
          minWidth: '350px',
          margin: '0 auto', 
          padding: '0', 
          background: 'rgba(13, 30, 60, 0.85)', 
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', 
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '12px',
          position: 'relative',
          fontSize: '12px',
          height: 'auto',
          maxHeight: 'calc(100vh - 120px)',
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
          {/* Desplegar solo si hay datos */}
          {regionesFiltradas.length > 0 && (
            <ul style={{
              listStyle: 'none', 
              padding: '12px',
              margin: 0,
              width: '100%'
            }}>
              {regionesFiltradas.map(region => {
                const proyectosRegion = proyectosPorRegionFiltrados[region.region_id] || [];
                const isExpanded = expanded.includes(region.region_id);
                // Usar la variable correcta que estaba en el original
                const tieneProyectos = Number(region.cantidad_proyectos) > 0;
                
                return (
                  <li key={region.region_id} style={{
                    marginBottom: '4px',
                    padding: 0
                  }}>
                    <div
                      onClick={() => tieneProyectos && toggleExpand(region.region_id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        cursor: tieneProyectos ? 'pointer' : 'default',
                        background: 'rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                        fontWeight: 500,
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        marginBottom: '2px'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                      <div style={{display: 'flex', alignItems: 'center', flex: 1}}>
                        <i className="fa fa-map-marker-alt" style={{color: '#60a5fa', marginRight: 8, fontSize: '12px'}}></i>
                        <span style={{
                          color: '#ffffff',
                          fontWeight: 500,
                          fontSize: '12px'
                        }}>
                          {region.nombre}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          color: tieneProyectos ? '#f59e0b' : '#ffffff',
                          fontWeight: 500,
                          fontSize: '12px'
                        }}>
                          {region.cantidad_proyectos} proyecto{region.cantidad_proyectos === 1 ? '' : 's'}
                        </span>
                        {tieneProyectos && (
                          <i className={`fa fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{
                            fontSize: '10px',
                            color: '#f59e0b',
                            marginLeft: '2px'
                          }}></i>
                        )}
                      </div>
                    </div>
                    
                    {/* Proyectos desplegados - manteniendo la lógica original */}
                    {isExpanded && tieneProyectos && (
                      <ul style={{
                        listStyle: 'none',
                        margin: '2px 0',
                        padding: '6px 0 6px 25px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {proyectosRegion.map(proy => (
                          <li
                            key={proy.proyecto_id}
                            onClick={() => handleProyectoClick(proy.proyecto_id)}
                            style={{
                              padding: '6px 10px',
                              cursor: 'pointer',
                              color: '#ffffff',
                              fontWeight: 400,
                              transition: 'all 0.2s ease',
                              borderRadius: '3px',
                              margin: '2px 0',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            }}
                          >
                            <i className="fa fa-folder-open" style={{color: '#f59e0b', fontSize: '10px'}}></i>
                            <div>
                              <div style={{
                                fontWeight: 500,
                                color: '#ffffff',
                                fontSize: '10px'
                              }}>
                                {proy.nombre}
                              </div>
                              {proy.descripcion && (
                                <div style={{
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  fontSize: '9px',
                                  marginTop: '1px'
                                }}>
                                  {proy.descripcion}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default CentrosPorRegion;