import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import './css/SidebarZoom.css';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaChevronUp, FaChartPie, FaFileAlt, FaFileInvoiceDollar, FaBalanceScale, FaExchangeAlt, FaVectorSquare } from 'react-icons/fa';
import { FaListAlt } from 'react-icons/fa';
import { useProject } from './ProjectContext';

// Variable para controlar la visibilidad del menú de análisis
const MOSTRAR_MENU_ANALISIS = true;

const opciones = [
  { clave: 'resumen', texto: 'Resumen financiero', icono: <i className="fa fa-pie-chart"></i> },
  { clave: 'factorial', texto: 'Reporte Factorial', icono: <i className="fa fa-file-alt"></i> },
  { clave: 'fisico', texto: 'Reporte Físico Finan...', icono: <i className="fa fa-file-invoice"></i> },
  { clave: 'eficiencia', texto: 'Eficiencia del Gasto', icono: <i className="fa fa-balance-scale"></i> },
  { clave: 'vectores_rp', texto: 'Vectores Real - Pro...', icono: <i className="fa fa-random"></i> },
  { clave: 'vectores', texto: 'Vectores', icono: <i className="fa fa-project-diagram"></i> },
  { clave: 'reportabilidad', texto: 'Físico - Financiero', icono: <i className="fa fa-chart-bar"></i> },
  { clave: 'gestion', texto: 'Gestión Proyecto', icono: <i className="fa fa-tasks"></i> },
  // Agrega esta línea:
  { clave: 'estructura', texto: 'Estructura de Cuentas', icono: <FaListAlt /> }
];

// Filtrar opciones - ocultar solo las que están en la imagen
const opcionesVisibles = opciones.filter(opcion => 
  !['factorial', 'fisico', 'eficiencia', 'vectores_rp'].includes(opcion.clave)
);

const CustomSidebar = ({ seleccionado, onSelect, onCollapsedChange, proyecto }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { selectedProject } = useProject();
  
  // Usar el proyecto pasado como prop o el del contexto
  const projectToShow = proyecto || selectedProject;

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
        height: 'calc(100vh - 51px)', // 64px * 0.8 = 51.2px
        top: '51px', // 64px * 0.8 = 51.2px
        left: '0',
        right: 'unset',
        position: 'fixed',
        zIndex: 100,
        width: collapsed ? '52px' : '208px', // 65px * 0.8 = 52px, 260px * 0.8 = 208px
        minWidth: collapsed ? '52px' : '208px',
        maxWidth: collapsed ? '52px' : '208px',
      }}
    >
      {/* Botón de colapsar/expandir dentro del sidebar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="sidebar-toggle-btn"
        style={{
          position: 'absolute',
          top: 10, // 12px * 0.8 = 9.6px
          right: 6, // 8px * 0.8 = 6.4px
          background: 'none',
          border: 'none',
          color: '#FFD000',
          fontSize: 18, // 22px * 0.8 = 17.6px
          cursor: 'pointer',
          zIndex: 1100,
          padding: '4px',
          borderRadius: '4px',
          transition: 'all 0.2s ease'
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
              ? '#d1d5db' // Gris claro para deshabilitado
              : 'transparent',
            color: active
              ? '#1a2235'
              : disabled
              ? '#222' // Letras oscuras para deshabilitado
              : '#fff',
            fontWeight: active ? '600' : '500',
            borderRadius: '5px', // 6px * 0.8 = 4.8px
            margin: '2px 6px', // 2px * 0.8 = 1.6px, 8px * 0.8 = 6.4px
            padding: '11px 16px', // 14px * 0.8 = 11.2px, 20px * 0.8 = 16px
            transition: 'all 0.18s ease',
            fontSize: '13px', // Reducido proporcionalmente
            marginTop: '32px', // 40px * 0.8 = 32px
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
            fontSize: '14px', // Reducido proporcionalmente
            marginRight: '11px', // 14px * 0.8 = 11.2px
          }),
        }}
      >
        {opcionesVisibles.map((opcion, index) => (
          <MenuItem
            key={opcion.clave}
            icon={opcion.icono}
            active={seleccionado === opcion.clave}
            onClick={() => onSelect(opcion.clave)}
            style={{
              marginTop: index === 0 ? '32px' : '2px', // 40px * 0.8 = 32px, solo el primer elemento
            }}
          >
            {opcion.texto}
          </MenuItem>
        ))}
      </Menu>
      {/* Tarjeta KPI de información del proyecto, ahora al pie del sidebar, sin fondo blanco */}
      {projectToShow && !collapsed && (
        <div className="proyecto-info-container" style={{
          position: 'absolute',
          bottom: 64, // 80px * 0.8 = 64px
          left: 0,
          width: '100%',
          color: '#fff',
          background: 'none',
          boxShadow: 'none',
          borderRadius: 0,
          padding: '0 13px', // 16px * 0.8 = 12.8px
          margin: 0,
          fontWeight: 400,
          zIndex: 1000,
          fontSize: '13px', // Reducido proporcionalmente
          lineHeight: '1.4'
        }}>
          <div className="proyecto-info-header" style={{display: 'flex', alignItems: 'center', marginBottom: 3}}>
            <span className="proyecto-info-icon" style={{fontSize: 18, marginRight: 6, color: '#FFD000'}}>📁</span>
            <span className="proyecto-info-title" style={{fontWeight: 600, fontSize: 14, color: '#fff'}}>{projectToShow.nombre}</span>
          </div>
          <div className="proyecto-info-detail" style={{color: '#fff', fontSize: 11}}>ID: <b>{projectToShow.proyecto_id}</b></div>
          <div className="proyecto-info-detail" style={{color: '#fff', fontSize: 11}}>Región: <b>{projectToShow.region_id}</b></div>
          <div className="proyecto-info-description" style={{color: '#fff', fontSize: 11, fontWeight: 500, lineHeight: '1.3'}}>Descripción: <span style={{fontWeight: 600}}>{projectToShow.descripcion}</span></div>
        </div>
      )}
    </Sidebar>
  );
};

export default CustomSidebar;
