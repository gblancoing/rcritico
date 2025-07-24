import React, { useState, useEffect } from 'react';
import './Sidebar.css';
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
  { clave: 'reportabilidad', texto: 'Reportabilidad', icono: <i className="fa fa-chart-bar"></i> },
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
        height: 'calc(100vh - 64px)', // Ajusta 64px si tu navbar tiene otra altura
        top: '64px',
        left: '0',
        right: 'unset',
        position: 'fixed',
        zIndex: 100,
      }}
    >
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
            fontWeight: active ? 'bold' : 'normal',
            borderRadius: '6px',
            margin: '4px 8px',
            transition: 'background 0.18s, color 0.18s',
          }),
          hover: ({ disabled }) => ({
            backgroundColor: disabled ? '#b0b0b0' : '#fff',
            color: disabled ? '#222' : '#1a2235',
            fontWeight: 'bold',
          }),
          icon: ({ active, disabled, hovered }) => ({
            color: active
              ? '#1a2235'
              : disabled
              ? hovered
                ? '#222'
                : '#b0b0b0'
              : hovered
              ? '#1a2235'
              : '#F2A900',
          }),
        }}
      >
        {opcionesVisibles.map(opcion => (
          <MenuItem
            key={opcion.clave}
            icon={opcion.icono}
            active={seleccionado === opcion.clave}
            onClick={() => onSelect(opcion.clave)}
          >
            {opcion.texto}
          </MenuItem>
        ))}
      </Menu>
      {/* Tarjeta KPI de información del proyecto, ahora al pie del sidebar, sin fondo blanco */}
      {projectToShow && !collapsed && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          width: '100%',
          color: '#fff',
          background: 'none',
          boxShadow: 'none',
          borderRadius: 0,
          padding: '0 16px',
          margin: 0,
          fontWeight: 400,
          zIndex: 1000
        }}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: 4}}>
            <span style={{fontSize: 22, marginRight: 8, color: '#FFD000'}}>📁</span>
            <span style={{fontWeight: 700, fontSize: 18, color: '#fff'}}>{projectToShow.nombre}</span>
          </div>
          <div style={{color: '#fff', fontSize: 14}}>ID: <b>{projectToShow.proyecto_id}</b></div>
          <div style={{color: '#fff', fontSize: 14}}>Región: <b>{projectToShow.region_id}</b></div>
          <div style={{color: '#fff', fontSize: 14}}>Descripción: <span style={{fontWeight: 600}}>{projectToShow.descripcion}</span></div>
        </div>
      )}
      {/* Botón de colapsar/expandir */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 0',
        cursor: 'pointer',
        borderTop: '1px solid #d1d5db',
        background: 'transparent',
        zIndex: 1000
      }}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expandir menú' : 'Minimizar menú'}
      >
        {collapsed ? <FaChevronUp size={22} color="#F2A900" /> : <FaChevronDown size={22} color="#F2A900" />}
      </div>
    </Sidebar>
  );
};

export default CustomSidebar;
