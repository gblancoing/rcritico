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
        
        // Validar que dataRegiones sea un array
        if (!Array.isArray(dataRegiones)) {
          console.error('Error: dataRegiones no es un array:', dataRegiones);
          setRegiones([]);
          return;
        }
        
        setRegiones(dataRegiones);

        // Cargar proyectos reales
        const responseProyectos = await fetch(`${API_BASE}/proyectos.php`);
        
        if (!responseProyectos.ok) {
          throw new Error(`HTTP error! status: ${responseProyectos.status}`);
        }
        
        const dataProyectos = await responseProyectos.json();
        console.log('Datos de proyectos:', dataProyectos);
        
        // Validar que dataProyectos sea un array
        if (!Array.isArray(dataProyectos)) {
          console.error('Error: dataProyectos no es un array:', dataProyectos);
          setProyectos([]);
          return;
        }
        
        setProyectos(dataProyectos);

        // Agrupar proyectos por región
        const agrupados = {};
        dataRegiones.forEach(region => {
          agrupados[region.region_id] = dataProyectos.filter(p => String(p.region_id) === String(region.region_id));
        });
        setProyectosPorRegion(agrupados);
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
  console.log('Proyectos por región:', proyectosPorRegion);

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

      <main className="main-content moderno" style={{paddingTop: '80px'}}>
        <div className="banner-bienvenida">
          <h1>Regiones de Chile</h1>
          <p>Haz clic en una región para ver sus proyectos asociados.</p>
        </div>

        <div className="content-card" style={{maxWidth: 900, margin: '2rem auto'}}>
          <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
            {regionesFiltradas.map(region => {
              const proyectosRegion = proyectosPorRegionFiltrados[region.region_id] || [];
              const isExpanded = expanded.includes(region.region_id);
              const tieneProyectos = Number(region.cantidad_proyectos) > 0;
              return (
                <li key={region.region_id} style={{
                  borderBottom: '1px solid #eee',
                  padding: 0
                }}>
                  <div
                    onClick={() => tieneProyectos && toggleExpand(region.region_id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 2rem',
                      cursor: tieneProyectos ? 'pointer' : 'default',
                      background: isExpanded ? '#f5f6fa' : 'transparent',
                      transition: 'background 0.2s',
                      fontWeight: 500,
                      gap: '2rem' // <-- más espacio entre columnas
                    }}
                  >
                    <span style={{display: 'flex', alignItems: 'center'}}>
                      <i className="fa fa-map-marker-alt" style={{color: '#0a6ebd', marginRight: 8}}></i>
                      {region.nombre}
                    </span>
                    <span style={{
                      color: tieneProyectos ? '#ff6600' : '#888',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {tieneProyectos && (
                        <i className={`fa fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{fontSize: 14, marginRight: 6}}></i>
                      )}
                      {region.cantidad_proyectos} proyecto{region.cantidad_proyectos === '1' ? '' : 's'}
                    </span>
                  </div>
                  {/* Proyectos desplegados */}
                  {isExpanded && tieneProyectos && (
                    <ul style={{
                      listStyle: 'none',
                      margin: 0,
                      padding: '0 0 0 2.2rem',
                      background: '#f9f9fb',
                      borderRadius: 8
                    }}>
                      {proyectosRegion.map(proy => (
                        <li
                          key={proy.proyecto_id}
                          onClick={() => handleProyectoClick(proy.proyecto_id)}
                          style={{
                            padding: '0.7rem 0',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            color: '#0a6ebd',
                            fontWeight: 500,
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#eaf1fa'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <i className="fa fa-folder-open" style={{marginRight: 8, color: '#ff6600'}}></i>
                          <span style={{fontWeight: 600}}>{proy.nombre}</span>
                          <span style={{display: 'block', color: '#444', fontWeight: 400, fontSize: '0.97em', marginLeft: 8}}>
                            {proy.descripcion}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default CentrosPorRegion; 