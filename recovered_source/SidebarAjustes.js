import React, { useState } from 'react';
import './Sidebar.css';
import './styles/SidebarZoom.css';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';

const SidebarAjustes = ({ seleccionado, onNavigate, onCollapsedChange, collapsed: collapsedProp, user }) => {
  const [collapsed, setCollapsed] = useState(collapsedProp || false);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    gestion: true,
    administracion: false,
    sistema: false
  });

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

  React.useEffect(() => {
    setCollapsed(collapsedProp);
  }, [collapsedProp]);

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
        {/* Panel Principal */}
        <MenuItem
          icon={<i className="fa fa-cog"></i>}
          active={seleccionado === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
          style={{ marginTop: '32px' }}
        >
          Panel Principal
        </MenuItem>

        {/* Sección GESTIÓN */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
          {!collapsed && (
            <div style={{ 
              padding: '8px 16px', 
              color: '#95a5a6', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              letterSpacing: '1px' 
            }}>
              GESTIÓN
            </div>
          )}
          
          <MenuItem
            icon={<i className="fa fa-pie-chart"></i>}
            onClick={() => toggleSeccion('gestion')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Proyectos</span>
              {!collapsed && (
                <i className={`fa fa-chevron-${seccionesExpandidas.gestion ? 'up' : 'down'}`} 
                   style={{ fontSize: '12px', marginLeft: '8px' }}></i>
              )}
            </div>
          </MenuItem>
          
          {seccionesExpandidas.gestion && !collapsed && (
            <div style={{ paddingLeft: '20px' }}>
              <MenuItem
                icon={<i className="fa fa-pie-chart"></i>}
                active={seleccionado === 'proyectos'}
                onClick={() => onNavigate('proyectos')}
                style={{
                  margin: '2px 6px',
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                Gestionar Proyectos
              </MenuItem>
              <MenuItem
                icon={<i className="fa fa-sitemap"></i>}
                active={seleccionado === 'centros-costo'}
                onClick={() => onNavigate('centros-costo')}
                style={{
                  margin: '2px 6px',
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                Centros de Costo
              </MenuItem>
            </div>
          )}
          
          <MenuItem
            icon={<i className="fa fa-building"></i>}
            active={seleccionado === 'empresas'}
            onClick={() => onNavigate('empresas')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Empresas Contratistas</span>
              {!collapsed && <i className="fa fa-angle-down" style={{ fontSize: '12px' }}></i>}
            </div>
          </MenuItem>
          
          <MenuItem
            icon={<i className="fa fa-file-text"></i>}
            active={seleccionado === 'contratos'}
            onClick={() => onNavigate('contratos')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Contratos</span>
              {!collapsed && <i className="fa fa-angle-down" style={{ fontSize: '12px' }}></i>}
            </div>
          </MenuItem>
        </div>

        {/* Sección ADMINISTRACIÓN */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
          {!collapsed && (
            <div style={{ 
              padding: '8px 16px', 
              color: '#95a5a6', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              letterSpacing: '1px' 
            }}>
              ADMINISTRACIÓN
            </div>
          )}
          
          <MenuItem
            icon={<i className="fa fa-users"></i>}
            active={seleccionado === 'usuarios'}
            onClick={() => onNavigate('usuarios')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px'
            }}
          >
            Usuarios
          </MenuItem>
        </div>

        {/* Sección SISTEMA */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
          {!collapsed && (
            <div style={{ 
              padding: '8px 16px', 
              color: '#95a5a6', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              letterSpacing: '1px' 
            }}>
              SISTEMA
            </div>
          )}
          
          <MenuItem
            icon={<i className="fa fa-cog"></i>}
            active={seleccionado === 'configuracion'}
            onClick={() => onNavigate('configuracion')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px'
            }}
          >
            Configuración General
          </MenuItem>
          
          <MenuItem
            icon={<i className="fa fa-database"></i>}
            active={seleccionado === 'backup'}
            onClick={() => onNavigate('backup')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px'
            }}
          >
            Backup & Restore
          </MenuItem>
          
          <MenuItem
            icon={<i className="fa fa-shield"></i>}
            active={seleccionado === 'seguridad'}
            onClick={() => onNavigate('seguridad')}
            style={{
              margin: '2px 6px',
              padding: '11px 16px'
            }}
          >
            Seguridad
          </MenuItem>
        </div>
      </Menu>
    </Sidebar>
  );
};

export default SidebarAjustes;

