import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import './styles/SidebarZoom.css';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { useProject } from './context/ProjectContext';
import { API_BASE } from './config';

// Variable para controlar la visibilidad del menú de análisis
const MOSTRAR_MENU_ANALISIS = true;

const opciones = [];

// Todas las opciones son visibles
const opcionesVisibles = opciones;

const CustomSidebar = ({ seleccionado, onSelect, onCollapsedChange, proyecto, user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    carpetas: true, // Expandido por defecto
    control_proyecto: false
  });
  const [carpetas, setCarpetas] = useState([]);
  const [carpetasExpandidas, setCarpetasExpandidas] = useState(new Set()); // IDs de carpetas expandidas
  const [loadingCarpetas, setLoadingCarpetas] = useState(false);
  const { selectedProject } = useProject();
  
  // Obtener usuario del localStorage si no se pasa como prop
  const usuarioActual = user || JSON.parse(localStorage.getItem('user')) || null;
  
  // Usar el proyecto pasado como prop o el del contexto
  const projectToShow = proyecto || selectedProject;
  
  // Cargar todas las carpetas del proyecto (para árbol jerárquico)
  useEffect(() => {
    if (projectToShow && projectToShow.proyecto_id) {
      cargarTodasLasCarpetas();
    }
  }, [projectToShow, usuarioActual]);
  
  const cargarTodasLasCarpetas = async () => {
    setLoadingCarpetas(true);
    try {
      // Construir URL con usuario_id para filtrar según permisos
      const params = new URLSearchParams({
        proyecto_id: projectToShow.proyecto_id,
        todas: '1'
      });
      
      // Agregar usuario_id si está disponible (importante para trabajadores)
      if (usuarioActual && usuarioActual.id) {
        params.append('usuario_id', usuarioActual.id);
      }
      
      const res = await fetch(`${API_BASE}/archivos/carpetas.php?${params}`);
      const data = await res.json();
      setCarpetas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      setCarpetas([]);
    }
    setLoadingCarpetas(false);
  };
  
  // Construir árbol jerárquico de carpetas
  const construirArbolCarpetas = () => {
    const carpetaMap = new Map();
    const raices = [];
    
    // Primero, crear un mapa de todas las carpetas
    carpetas.forEach(carpeta => {
      carpetaMap.set(carpeta.id, { ...carpeta, hijos: [] });
    });
    
    // Luego, construir la jerarquía
    carpetas.forEach(carpeta => {
      if (carpeta.carpeta_padre_id === null || carpeta.carpeta_padre_id === 0) {
        raices.push(carpetaMap.get(carpeta.id));
      } else {
        const padre = carpetaMap.get(carpeta.carpeta_padre_id);
        if (padre) {
          padre.hijos.push(carpetaMap.get(carpeta.id));
        }
      }
    });
    
    // Ordenar hijos alfabéticamente
    const ordenarHijos = (nodo) => {
      if (nodo.hijos && nodo.hijos.length > 0) {
        nodo.hijos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        nodo.hijos.forEach(ordenarHijos);
      }
    };
    
    raices.forEach(ordenarHijos);
    raices.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    return raices;
  };
  
  // Toggle expandir/colapsar carpeta
  const toggleCarpeta = (carpetaId) => {
    setCarpetasExpandidas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(carpetaId)) {
        nuevo.delete(carpetaId);
      } else {
        nuevo.add(carpetaId);
      }
      return nuevo;
    });
  };
  
  // Renderizar árbol de carpetas recursivamente (estilo explorador de Windows)
  const renderizarArbolCarpetas = (nodos, nivel = 0) => {
    return nodos.map((nodo) => {
      const tieneHijos = nodo.hijos && nodo.hijos.length > 0;
      const expandida = carpetasExpandidas.has(nodo.id);
      const indentacion = nivel * 16; // Indentación por nivel
      const esActiva = seleccionado === `carpeta_${nodo.id}`;
      
      return (
        <div key={nodo.id} style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              margin: '1px 6px',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: esActiva ? '#F2A900' : 'transparent',
              color: esActiva ? '#1a2235' : '#fff',
              fontSize: '13px',
              paddingLeft: `${8 + indentacion}px`,
              transition: 'all 0.15s ease',
              minHeight: '28px'
            }}
            onMouseEnter={(e) => {
              if (!esActiva) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!esActiva) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            onClick={() => onSelect(`carpeta_${nodo.id}`)}
          >
            {/* Icono de expandir/colapsar */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (tieneHijos) {
                  toggleCarpeta(nodo.id);
                }
              }}
              style={{
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '4px',
                cursor: tieneHijos ? 'pointer' : 'default',
                flexShrink: 0
              }}
            >
              {tieneHijos ? (
                <i 
                  className={`fa fa-chevron-${expandida ? 'down' : 'right'}`}
                  style={{
                    fontSize: '9px',
                    color: esActiva ? '#1a2235' : '#F2A900'
                  }}
                />
              ) : (
                <span style={{ width: '9px', display: 'inline-block' }}></span>
              )}
            </div>
            
            {/* Icono de carpeta */}
            <i 
              className={`fa ${expandida && tieneHijos ? 'fa-folder-open' : 'fa-folder'}`}
              style={{
                marginRight: '6px',
                fontSize: '14px',
                color: esActiva ? '#1a2235' : '#F2A900',
                flexShrink: 0
              }}
            />
            
            {/* Nombre de la carpeta */}
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                fontWeight: esActiva ? '600' : '400'
              }}
              title={nodo.descripcion || nodo.nombre}
            >
              {nodo.nombre}
            </span>
            
            {/* Contador de archivos */}
            {nodo.cantidad_archivos > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  fontSize: '10px',
                  color: esActiva ? 'rgba(26, 34, 53, 0.7)' : 'rgba(255,255,255,0.6)',
                  flexShrink: 0
                }}
              >
                ({nodo.cantidad_archivos})
              </span>
            )}
          </div>
          
          {/* Subcarpetas (renderizadas recursivamente) */}
          {tieneHijos && expandida && !collapsed && (
            <div style={{ position: 'relative' }}>
              {/* Línea vertical conectora (opcional, estilo Windows) */}
              {nivel === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${8 + indentacion + 8}px`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    pointerEvents: 'none'
                  }}
                />
              )}
              {renderizarArbolCarpetas(nodo.hijos, nivel + 1)}
            </div>
          )}
        </div>
      );
    });
  };
  
  // Función para toggle de secciones
  const toggleSeccion = (seccion) => {
    setSeccionesExpandidas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  };

  // Notificar al componente padre cuando cambie el estado del sidebar
  React.useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(collapsed);
    }
  }, [collapsed, onCollapsedChange]);

  return (
    <Sidebar
      breakPoint="md"
      backgroundColor="rgba(0, 43, 127, 0.92)"
      collapsed={collapsed}
      rootStyles={{
        height: 'calc(100vh - 51px)',
        top: '51px',
        left: '0',
        right: 'unset',
        position: 'fixed',
        zIndex: 100,
        width: collapsed ? '52px' : '260px',
        minWidth: collapsed ? '52px' : '260px',
        maxWidth: collapsed ? '52px' : '260px',
        borderRight: '6px solid #F2A900',
      }}
    >
      {/* Botón de colapsar/expandir dentro del sidebar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="sidebar-toggle-btn"
        style={{
          position: 'absolute',
          top: 10,
          right: 8,
          background: 'none',
          border: 'none',
          color: '#FFD000',
          fontSize: 20,
          cursor: 'pointer',
          zIndex: 1100,
          padding: '4px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          fontWeight: 'bold'
        }}
        title={collapsed ? 'Expandir menú' : 'Minimizar menú'}
      >
        {collapsed ? '▶' : '◀'}
      </button>
      
      <Menu
        menuItemStyles={{
          button: ({ active, disabled }) => ({
            backgroundColor: active
              ? '#F2A900'
              : disabled
              ? '#d1d5db'
              : 'transparent',
            color: active
              ? '#1a2235'
              : disabled
              ? '#222'
              : '#fff',
            fontWeight: active ? '600' : '500',
            borderRadius: '5px',
            margin: '2px 8px',
            padding: '11px 12px',
            transition: 'all 0.18s ease',
            fontSize: '14px',
            marginTop: '32px',
            whiteSpace: 'nowrap',
            overflow: 'visible',
            textOverflow: 'clip',
          }),
          hover: ({ disabled }) => ({
            backgroundColor: disabled ? '#b0b0b0' : 'rgba(255, 255, 255, 0.1)',
            color: disabled ? '#222' : '#F2A900',
            fontWeight: '600',
          }),
          icon: ({ active, disabled, hovered }) => ({
            color: active
              ? '#1a2235'
              : disabled
              ? hovered
                ? '#222'
                : '#b0b0b0'
              : hovered
              ? '#F2A900'
              : '#F2A900',
            fontSize: '16px',
            marginRight: '10px',
            flexShrink: 0,
          }),
        }}
      >
        {/* Dashboard */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
          <MenuItem
            icon={<i className="fa fa-chart-line"></i>}
            active={seleccionado === 'dashboard'}
            onClick={() => onSelect('dashboard')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </MenuItem>
        </div>

        {/* Sección: Gestión de Archivos - Carpetas */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
          <MenuItem
            icon={<i className="fa fa-folder-open"></i>}
            onClick={() => toggleSeccion('carpetas')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Gestión de Archivos</span>
              <i className={`fa fa-chevron-${seccionesExpandidas.carpetas ? 'up' : 'down'}`} 
                 style={{ fontSize: '12px', marginLeft: '8px' }}></i>
            </div>
          </MenuItem>
          
          {seccionesExpandidas.carpetas && !collapsed && (
            <div style={{ paddingLeft: '0px' }}>
              <MenuItem
                icon={<i className="fa fa-folder-open"></i>}
                active={seleccionado === 'gestor_archivos'}
                onClick={() => onSelect('gestor_archivos')}
                style={{
                  margin: '2px 6px',
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                Todas las Carpetas
              </MenuItem>
              {loadingCarpetas ? (
                <div style={{ padding: '8px 16px', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                  Cargando...
                </div>
              ) : (
                <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', overflowX: 'hidden' }}>
                  {renderizarArbolCarpetas(construirArbolCarpetas())}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Sección: Control Proyecto */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
          <MenuItem
            icon={<i className="fa fa-folder"></i>}
            onClick={() => toggleSeccion('control_proyecto')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Control Proyecto</span>
              <i className={`fa fa-chevron-${seccionesExpandidas.control_proyecto ? 'up' : 'down'}`} 
                 style={{ fontSize: '12px', marginLeft: '8px' }}></i>
            </div>
          </MenuItem>
          
          {seccionesExpandidas.control_proyecto && !collapsed && (
            <div style={{ paddingLeft: '20px' }}>
              <MenuItem
                icon={<i className="fa fa-tasks"></i>}
                active={seleccionado === 'control_tareas'}
                onClick={() => onSelect('control_tareas')}
                style={{
                  margin: '2px 6px',
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                Control de Tareas (Gantt)
              </MenuItem>
              <MenuItem
                icon={<i className="fa fa-comments"></i>}
                active={seleccionado === 'resumen_comentarios'}
                onClick={() => onSelect('resumen_comentarios')}
                style={{
                  margin: '2px 6px',
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                Resumen de Comentarios
              </MenuItem>
              <MenuItem
                icon={<i className="fa fa-sitemap"></i>}
                active={seleccionado === 'arbol_carpetas'}
                onClick={() => onSelect('arbol_carpetas')}
                style={{
                  margin: '2px 6px',
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                Árbol de Carpetas
              </MenuItem>
              <MenuItem
                icon={<i className="fa fa-chalkboard-teacher"></i>}
                active={seleccionado === 'presentaciones_staff'}
                onClick={() => onSelect('presentaciones_staff')}
                style={{
                  margin: '2px 6px',
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                Presentaciones Staff
              </MenuItem>
              <MenuItem
                icon={<i className="fa fa-chart-line"></i>}
                active={seleccionado === 'informes_stockholders'}
                onClick={() => onSelect('informes_stockholders')}
                style={{
                  margin: '2px 6px',
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                Informes Stockholders
              </MenuItem>
            </div>
          )}
        </div>
      </Menu>
    </Sidebar>
  );
};

export default CustomSidebar;
