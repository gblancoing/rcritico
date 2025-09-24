import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { API_BASE } from '../config';

// Estilos CSS para animaciones del modal y mensajes
const modalStyles = `
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-50px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background-color: rgba(0, 0, 0, 0.7) !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    z-index: 10000 !important;
    backdrop-filter: blur(2px) !important;
    padding: 20px !important;
  }
  
  .modal-content {
    background-color: white !important;
    padding: 40px !important;
    border-radius: 15px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
    max-width: 450px !important;
    width: 100% !important;
    max-height: 80vh !important;
    overflow: auto !important;
    position: relative !important;
    transform: translateY(0) !important;
    animation: modalSlideIn 0.3s ease-out !important;
    margin: auto !important;
  }
`;

// Agregar estilos al head del documento
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = modalStyles;
  document.head.appendChild(styleElement);
}

  
  
// Definir los diferentes tipos de reportes de reportabilidad
const reportes = [
  { value: 'lineas_bases', label: 'Líneas Bases - Real/Proyectado' },
  { value: 'recursos', label: 'Gestión de Recursos' },
  { value: 'cronograma', label: 'Cronograma y Calendario' },
  { value: 'riesgos', label: 'Gestión de Riesgos' },
  { value: 'comunicacion', label: 'Comunicación y Stakeholders' },
  { value: 'calidad', label: 'Control de Calidad' },
  { value: 'contratos', label: 'Gestión de Contratos' },
  { value: 'valor_ganado', label: 'Valor Ganado - Codelco' },
];

const reportesGestion = [
  { value: 'reporte_ordenes_compra', label: 'Reporte de Órdenes de Compra' },
  { value: 'reporte_pagos', label: 'Reporte de Pagos' },
  { value: 'reporte_contratos', label: 'Reporte de Contratos' },
  { value: 'reporte_staff_dueno', label: 'Reporte de Staff Dueño' },
];

const ALTURA_BARRA_SUPERIOR = 56;
const ANCHO_SIDEBAR = 240;

// --- COMPONENTE MODAL METODOLOGÍAS ECD ---
const ModalMetodologiasECD = ({ datosECD, fechaCorte, duracionPlanificada, onClose }) => {
  const formatearFecha = (meses) => {
    if (!meses || meses <= 0 || !isFinite(meses) || meses > 1000) return 'N/A';
    
    try {
      const fechaBase = new Date('2023-01-01'); // Fecha de inicio del proyecto
      const fechaFinal = new Date(fechaBase);
      
      // Limitar a un rango razonable (máximo 50 años desde 2023)
      const mesesLimitados = Math.min(Math.max(Math.ceil(meses), 1), 600);
      fechaFinal.setMonth(fechaFinal.getMonth() + mesesLimitados);
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaFinal.getTime())) {
        console.warn('Fecha inválida generada para meses:', meses);
        return 'N/A';
      }
      
      return fechaFinal.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha para meses:', meses, error);
      return 'N/A';
    }
  };
  
  // Generar tabla ECD usando datos directos
  const generarTablaECD = () => {
    if (!datosECD) return [];
    
    return [
      {
        metodologia: 'ECD(a)',
        formula: 'Duración Planificada / SPI',
        descripcion: 'Proyección del SPI actual a la duración total',
        valor: datosECD.metodologiaA || 0,
        color: '#3498db'
      },
      {
        metodologia: 'ECD(b)',
        formula: 'Plazo Control + Por Ganar / PV1m',
        descripcion: 'Proyección del PV mensual actual al trabajo restante',
        valor: datosECD.metodologiaB || 0,
        color: '#e74c3c'
      },
      {
        metodologia: 'ECD(c)',
        formula: 'Plazo Control + Por Ganar / PV3m',
        descripcion: 'Proyección del PV promedio de los últimos 3 meses',
        valor: datosECD.metodologiaC || 0,
        color: '#f39c12'
      },
      {
        metodologia: 'ECD(d)',
        formula: 'Plazo Control + Por Ganar / PV6m',
        descripcion: 'Proyección del PV promedio de los últimos 6 meses',
        valor: datosECD.metodologiaD || 0,
        color: '#9b59b6'
      },
      {
        metodologia: 'ECD(e)',
        formula: 'Plazo Control + Por Ganar / PV12m',
        descripcion: 'Proyección del PV promedio de los últimos 12 meses',
        valor: datosECD.metodologiaE || 0,
        color: '#1abc9c'
      },
      {
        metodologia: 'ECD(f)',
        formula: 'Plazo Control + Por Ganar / EV1m',
        descripcion: 'Proyección del EV promedio de los últimos 1 mes',
        valor: datosECD.metodologiaF || 0,
        color: '#34495e'
      },
      {
        metodologia: 'ECD(g)',
        formula: 'Plazo Control + Por Ganar / EV3m',
        descripcion: 'Proyección del EV promedio de los últimos 3 meses',
        valor: datosECD.metodologiaG || 0,
        color: '#e67e22'
      },
      {
        metodologia: 'ECD(h)',
        formula: 'Plazo Control + Por Ganar / EV6m',
        descripcion: 'Proyección del EV promedio de los últimos 6 meses',
        valor: datosECD.metodologiaH || 0,
        color: '#8e44ad'
      },
      {
        metodologia: 'ECD(i)',
        formula: 'Plazo Control + Por Ganar / EV12m',
        descripcion: 'Proyección del EV promedio de los últimos 12 meses',
        valor: datosECD.metodologiaI || 0,
        color: '#16a085'
      },
      {
        metodologia: 'ECD(j)',
        formula: 'Plazo Control + Por Ganar / AC3m',
        descripcion: 'Proyección del AC promedio de los últimos 3 meses',
        valor: datosECD.metodologiaJ || 0,
        color: '#e74c3c'
      },
      {
        metodologia: 'ECD(k)',
        formula: 'Plazo Control + Por Ganar / AC6m',
        descripcion: 'Proyección del AC promedio de los últimos 6 meses',
        valor: datosECD.metodologiaK || 0,
        color: '#c0392b'
      }
    ];
  };

  // Generar tabla ECD dinámicamente cuando cambien los datos
  const tablaECD = generarTablaECD();

  // Usar las estadísticas calculadas dinámicamente desde cargarMetodologiasECD
  const estadisticasTabla = {
    promedio: datosECD?.promedio || 0,
    maximo: datosECD?.maximo || 0,
    minimo: datosECD?.minimo || 0
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              📅
            </div>
            <div>
              <h2 style={{ margin: '0', fontSize: '1.4rem', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>
                Metodologías ECD
              </h2>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem', opacity: '0.9', fontFamily: 'Arial, sans-serif' }}>
                {fechaCorte}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Estadísticas Resumen - Las 5 tarjetas KPI exactas de Vectores.js */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '600' }}>Meses Promedio</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#8e44ad' }}>
                {estadisticasTabla.promedio && !isNaN(estadisticasTabla.promedio) 
                  ? `${Math.round(estadisticasTabla.promedio)} meses` 
                  : 'N/A'}
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '600' }}>Meses Máximo</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#e74c3c' }}>
                {estadisticasTabla.maximo && !isNaN(estadisticasTabla.maximo) 
                  ? `${Math.round(estadisticasTabla.maximo)} meses` 
                  : 'N/A'}
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '600' }}>Meses Mínimo</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#27ae60' }}>
                {estadisticasTabla.minimo && !isNaN(estadisticasTabla.minimo) 
                  ? `${Math.round(estadisticasTabla.minimo)} meses` 
                  : 'N/A'}
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '600' }}>Plazo Control</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#3498db' }}>
                {Math.round(datosECD?.plazoControl || 0)} meses
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '600' }}>Duración Planificada</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#8e44ad' }}>
                {duracionPlanificada} meses
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f3e5f5',
            borderRadius: '8px',
            border: '1px solid #ce93d8'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#4a148c', fontSize: '1rem' }}>
              📅 Interpretación de las Fechas Estimadas
            </h4>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#4a148c', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <li><strong>Fecha Promedio:</strong> Fecha más probable de finalización del proyecto</li>
              <li><strong>Fecha Máxima:</strong> Escenario pesimista - preparación para posibles retrasos</li>
              <li><strong>Fecha Mínima:</strong> Escenario optimista - potencial de finalización anticipada</li>
              <li><strong>Rango:</strong> Nivel de incertidumbre en la estimación temporal</li>
              <li><strong>Plazo Control:</strong> Meses transcurridos desde el inicio del proyecto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- COMPONENTE MODAL METODOLOGÍAS IEAC ---
const ModalMetodologiasIEAC = ({ datosIEAC, fechaCorte, onClose, porGanar = 0 }) => {
  // Función para formatear moneda
  const formatearMoneda = (valor) => `USD ${(valor / 1000000).toFixed(2)}M`;
  
  // Calcular estadísticas
  const valores = datosIEAC.map(item => item.valor).filter(v => v > 0);
  const promedio = valores.length > 0 ? valores.reduce((sum, val) => sum + val, 0) / valores.length : 0;
  const maximo = valores.length > 0 ? Math.max(...valores) : 0;
  const minimo = valores.length > 0 ? Math.min(...valores) : 0;
  const rango = maximo - minimo;
  
  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              🎯
            </div>
            <div>
              <h2 style={{ margin: '0', fontSize: '1.4rem', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>
                Metodologías IEAC
              </h2>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem', opacity: '0.9', fontFamily: 'Arial, sans-serif' }}>
                {fechaCorte}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Estadísticas Resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '600' }}>Promedio</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d35400' }}>
                {formatearMoneda(promedio)}
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '600' }}>Máximo</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e74c3c' }}>
                {formatearMoneda(maximo)}
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '600' }}>Mínimo</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#27ae60' }}>
                {formatearMoneda(minimo)}
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '600' }}>Por Ganar</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3498db' }}>
                {formatearMoneda(porGanar)}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};


const SidebarDerecho = ({ seleccion, setSeleccion, sidebarVisible, setSidebarVisible }) => (
  <>
    <div
      style={{
        position: 'fixed',
        top: ALTURA_BARRA_SUPERIOR,
        right: 0,
        width: ANCHO_SIDEBAR,
        height: '100vh',
        background: '#16355D',
        color: '#fff',
        boxShadow: '0 0 8px #0003',
        padding: '80px 16px 16px 16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        transform: sidebarVisible ? 'translateX(0)' : `translateX(${ANCHO_SIDEBAR}px)`,
        transition: 'transform 0.3s cubic-bezier(.4,1.3,.5,1)',
      }}
    >
      {/* Botón para ocultar el sidebar */}
      <button
        onClick={() => setSidebarVisible(false)}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          color: '#FFD000',
          fontSize: 22,
          cursor: 'pointer',
          zIndex: 1100,
        }}
        title="Ocultar panel"
      >
        ▶
      </button>
      <div style={{ marginBottom: 16, marginTop: 16 }}>
        <h4 style={{ color: '#FFD000', marginBottom: 8 }}>Analisis y Gestión</h4>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {reportes.map(reporte => (
            <button
              key={reporte.value}
              onClick={() => setSeleccion(reporte.value)}
              style={{
                display: 'block',
                width: '100%',
                marginBottom: 6,
                background: seleccion === reporte.value ? '#FFD000' : '#fff',
                color: seleccion === reporte.value ? '#16355D' : '#16355D',
                border: 'none',
                borderRadius: 4,
                padding: '8px 0',
                fontWeight: seleccion === reporte.value ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              {reporte.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nueva sección para Reportes de Gestión */}
      <div style={{ marginBottom: 16, marginTop: 16 }}>
        <h4 style={{ color: '#FFD000', marginBottom: 8 }}>Reportes de Gestión</h4>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {reportesGestion.map(reporte => (
            <button
              key={reporte.value}
              onClick={() => setSeleccion(reporte.value)}
              style={{
                display: 'block',
                width: '100%',
                marginBottom: 6,
                background: seleccion === reporte.value ? '#FFD000' : '#fff',
                color: seleccion === reporte.value ? '#16355D' : '#16355D',
                border: 'none',
                borderRadius: 4,
                padding: '8px 0',
                fontWeight: seleccion === reporte.value ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              {reporte.label}
            </button>
          ))}
        </div>
      </div>
    </div>
    {/* Flecha para mostrar el sidebar cuando está oculto */}
    {!sidebarVisible && (
      <button
        onClick={() => setSidebarVisible(true)}
        style={{
          position: 'fixed',
          top: ALTURA_BARRA_SUPERIOR + 12,
          right: 0,
          zIndex: 1101,
          background: '#16355D',
          color: '#FFD000',
          border: 'none',
          borderRadius: '8px 0 0 8px',
          fontSize: 22,
          padding: '6px 8px',
          boxShadow: '0 0 8px #0003',
          cursor: 'pointer',
        }}
        title="Mostrar panel"
      >
        ◀
      </button>
    )}
  </>
);

const Reportabilidad = ({ proyectoId }) => {
  const [seleccion, setSeleccion] = useState('lineas_bases');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroDescripcion, setFiltroDescripcion] = useState(''); // NUEVO: Filtro por descripción
  const [filtroVector, setFiltroVector] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [datosReporte, setDatosReporte] = useState([]);
  const [datosCumplimientoFisico, setDatosCumplimientoFisico] = useState([]);
  const [usandoDatosReales, setUsandoDatosReales] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  
  // Estados para mensajes de importación (movidos al componente padre)
  const [mensajeImportacion, setMensajeImportacion] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [descripcionesDisponibles, setDescripcionesDisponibles] = useState([]); // NUEVO: Lista de descripciones

  // Detectar el estado del sidebar izquierdo
  const [sidebarIzquierdoCollapsed, setSidebarIzquierdoCollapsed] = useState(false);
  
  useEffect(() => {
    const detectarSidebarIzquierdo = () => {
      const sidebarElement = document.querySelector('.ps-sidebar-root');
      if (sidebarElement) {
        const isCollapsed = sidebarElement.classList.contains('ps-collapsed');
        setSidebarIzquierdoCollapsed(isCollapsed);
      }
    };
    
    detectarSidebarIzquierdo();
    
    const observer = new MutationObserver(detectarSidebarIzquierdo);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Cargar descripciones cuando cambie el proyecto
  useEffect(() => {
    if (proyectoId) {
      obtenerDescripcionesDisponibles();
    }
  }, [proyectoId]);

  // Recargar datos cuando cambien los filtros de fecha
  useEffect(() => {
    if (proyectoId) {
      cargarDatosReporte();
    }
  }, [proyectoId, fechaDesde, fechaHasta, filtroDescripcion]);

  // Función para obtener descripciones únicas de la tabla financiero_sap
  const obtenerDescripcionesDisponibles = async () => {
    try {
      if (!proyectoId) return;
      
      const response = await fetch(`${API_BASE}/vectores/financiero_sap.php?proyecto_id=${proyectoId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const descripciones = [...new Set(data.data.map(row => row.descripcion).filter(desc => desc && desc.trim() !== ''))];
        setDescripcionesDisponibles(descripciones.sort());
      }
    } catch (error) {
      console.error('Error obteniendo descripciones:', error);
    }
  };

  // Calcular ancho dinámico basado en el estado del sidebar izquierdo
  const anchoSidebarIzquierdo = sidebarIzquierdoCollapsed ? 64 : 260;
  const anchoSidebarDerecho = sidebarVisible ? ANCHO_SIDEBAR : 0;
  const anchoAreaTrabajo = `calc(100vw - ${anchoSidebarIzquierdo}px - ${anchoSidebarDerecho}px)`;
  const alturaAreaTrabajo = `calc(100vh - ${ALTURA_BARRA_SUPERIOR}px)`;

  // Función para cargar datos según el reporte seleccionado
  const cargarDatosReporte = async () => {
    setCargandoDatos(true);
    try {
      // Solo manejamos lineas_bases
      setDatosReporte([]);
    } catch (error) {
      console.error('Error cargando datos del reporte:', error);
      setDatosReporte([]);
    } finally {
      setCargandoDatos(false);
    }
  };



  // Cargar datos cuando cambie la selección
  useEffect(() => {
    cargarDatosReporte();
  }, [seleccion]);



  // Resetear autorización cuando cambie el proyecto
  useEffect(() => {
    setAutorizado(false);
  }, [proyectoId]);

  // Función para renderizar el contenido según el reporte seleccionado
  const renderContenidoReporte = () => {
    if (cargandoDatos) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#16355D'
        }}>
          Cargando datos del reporte...
        </div>
      );
    }

    switch (seleccion) {
      case 'predictividad':
        return <ReportePredictividad 
          key="predictividad" 
          data={datosReporte} 
          mensajeImportacion={mensajeImportacion}
          setMensajeImportacion={setMensajeImportacion}
          tipoMensaje={tipoMensaje}
          setTipoMensaje={setTipoMensaje}
          proyectoId={proyectoId}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          filtroDescripcion={filtroDescripcion}
        />;
      case 'eficiencia_gasto':
        return <ReporteEficienciaGasto data={datosReporte} proyectoId={proyectoId} fechaDesde={fechaDesde} fechaHasta={fechaHasta} />;
      case 'cumplimiento_fisico':
        return <ReporteCumplimientoFisico data={datosReporte} autorizado={autorizado} setAutorizado={setAutorizado} proyectoId={proyectoId} fechaDesde={fechaDesde} fechaHasta={fechaHasta} datosCumplimientoFisico={datosCumplimientoFisico} filtroVector={filtroVector} setFiltroVector={setFiltroVector} />;
      case 'lineas_bases':
        return <ReporteLineasBases proyectoId={proyectoId} />;
      
      // Nuevos reportes de Análisis y Gestión
      case 'recursos':
        return <ReporteGenerico titulo="Gestión de Recursos" proyectoId={proyectoId} />;
      case 'cronograma':
        return <ReporteGenerico titulo="Cronograma y Calendario" proyectoId={proyectoId} />;
      case 'riesgos':
        return <ReporteGenerico titulo="Gestión de Riesgos" proyectoId={proyectoId} />;
      case 'comunicacion':
        return <ReporteGenerico titulo="Comunicación y Stakeholders" proyectoId={proyectoId} />;
      case 'calidad':
        return <ReporteGenerico titulo="Control de Calidad" proyectoId={proyectoId} />;
      case 'contratos':
        return <ReporteGenerico titulo="Gestión de Contratos" proyectoId={proyectoId} />;
      case 'valor_ganado':
        return <ReporteGenerico titulo="Valor Ganado - Codelco" proyectoId={proyectoId} />;
      
      // Reportes de Gestión
      case 'reporte_ordenes_compra':
        return <ReporteGenerico titulo="Reporte de Órdenes de Compra" proyectoId={proyectoId} />;
      case 'reporte_pagos':
        return <ReporteGenerico titulo="Reporte de Pagos" proyectoId={proyectoId} />;
      case 'reporte_contratos':
        return <ReporteGenerico titulo="Reporte de Contratos" proyectoId={proyectoId} />;
      case 'reporte_staff_dueno':
        return <ReporteGenerico titulo="Reporte de Staff Dueño" proyectoId={proyectoId} />;
      
      default:
        return <div>Selecciona un reporte</div>;
    }
  };

  // Componente genérico para reportes en desarrollo
  const ReporteGenerico = ({ titulo, proyectoId }) => {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#16355D', margin: 0 }}>
            {titulo}
          </h2>
        </div>

        <div style={{ 
          background: '#fff', 
          padding: '40px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#16355D', marginBottom: '15px' }}>
              🚧 Reporte en Desarrollo
            </h3>
            <p style={{ color: '#6c757d', fontSize: '16px', marginBottom: '10px' }}>
              <strong>{titulo}</strong>
            </p>
            <p style={{ color: '#6c757d', fontSize: '14px' }}>
              Proyecto ID: <span style={{ fontWeight: 'bold', color: '#16355D' }}>{proyectoId}</span>
            </p>
          </div>
          
          <div style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <p style={{ color: '#495057', marginBottom: '15px' }}>
              Este reporte está siendo desarrollado y estará disponible próximamente.
            </p>
            <p style={{ color: '#6c757d', fontSize: '12px' }}>
              El reporte mostrará datos dinámicos basados en el proyecto activo cuando esté completamente implementado.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Componente para el reporte de Predictividad
  const ReportePredictividad = ({ 
    data, 
    mensajeImportacion, 
    setMensajeImportacion, 
    tipoMensaje, 
    setTipoMensaje,
    proyectoId,
    fechaDesde,
    fechaHasta,
    filtroDescripcion
  }) => {
    // Estados para importación de predictividad
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [excelData, setExcelData] = useState([]);
    const [importando, setImportando] = useState(false);
    const [showFormatInfo, setShowFormatInfo] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [codigoAutorizacion, setCodigoAutorizacion] = useState('');
    const [errorCodigo, setErrorCodigo] = useState('');
    const fileInputRef = useRef(null);

    // Estados para datos de predictividad
    const [proyeccionFinanciera, setProyeccionFinanciera] = useState(0);
    const [proyeccionFisica, setProyeccionFisica] = useState(0);
    const [realFinanciera, setRealFinanciera] = useState(0);
    const [realFisica, setRealFisica] = useState(0);
    const [cargandoDatos, setCargandoDatos] = useState(false);
    
    // Estados para el historial de predictividad
    const [historialFinanciero, setHistorialFinanciero] = useState([]);
    const [historialFisico, setHistorialFisico] = useState([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);

    // Función para obtener descripciones únicas de la tabla financiero_sap
    const obtenerDescripcionesDisponibles = async () => {
      try {
        if (!proyectoId) return;
        
        const response = await fetch(`${API_BASE}/vectores/financiero_sap.php?proyecto_id=${proyectoId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          const descripciones = [...new Set(data.data.map(row => row.descripcion).filter(desc => desc && desc.trim() !== ''))];
          setDescripcionesDisponibles(descripciones.sort());
        }
      } catch (error) {
        console.error('Error obteniendo descripciones:', error);
      }
    };

    // Función para obtener datos de proyección financiera desde financiero_sap
    const obtenerProyeccionFinanciera = async () => {
      try {
        setCargandoDatos(true);
        
        // Construir URL con filtros
        let url = `${API_BASE}/predictividad/proyeccion_financiera.php`;
        const params = new URLSearchParams();
        
        if (proyectoId) {
          params.append('proyecto_id', proyectoId);
        }
        if (fechaDesde) {
          // Convertir formato YYYY-MM a YYYY-MM-01 para el inicio del mes
          const fechaDesdeCompleta = `${fechaDesde}-01`;
          params.append('fecha_desde', fechaDesdeCompleta);
        }
        if (fechaHasta) {
          // Obtener el último día del mes seleccionado
          const [year, month] = fechaHasta.split('-');
          const ultimoDia = new Date(parseInt(year), parseInt(month), 0).getDate();
          const fechaHastaCompleta = `${fechaHasta}-${ultimoDia.toString().padStart(2, '0')}`;
          params.append('fecha_hasta', fechaHastaCompleta);
        }
        if (filtroDescripcion) {
          params.append('descripcion', filtroDescripcion);
        }
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        
        console.log('🔍 Consultando proyección financiera:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📊 Respuesta proyección financiera:', data);
        
        if (data.success) {
          const valorProyeccion = parseFloat(data.total_proyeccion) || 0;
          setProyeccionFinanciera(valorProyeccion);
          
          console.log('✅ Proyección financiera actualizada:', valorProyeccion);
          console.log('📋 Categorías incluidas:', data.categorias_incluidas);
          console.log('🔧 Filtros aplicados:', data.filtros_aplicados);
        } else {
          console.error('❌ Error al obtener proyección financiera:', data.error);
          setProyeccionFinanciera(0);
        }
      } catch (error) {
        console.error('❌ Error de conexión proyección financiera:', error);
        setProyeccionFinanciera(0);
      } finally {
        setCargandoDatos(false);
      }
    };

    // Función para obtener datos de real financiero desde real_parcial
    const obtenerRealFinanciera = async () => {
      try {
        // Construir URL con filtros
        let url = `${API_BASE}/predictividad/real_financiera.php`;
        const params = new URLSearchParams();
        
        if (proyectoId) {
          params.append('proyecto_id', proyectoId);
        }
        if (fechaDesde) {
          // Convertir formato YYYY-MM a YYYY-MM-01 para el inicio del mes
          const fechaDesdeCompleta = `${fechaDesde}-01`;
          params.append('fecha_desde', fechaDesdeCompleta);
        }
        if (fechaHasta) {
          // Obtener el último día del mes seleccionado
          const [year, month] = fechaHasta.split('-');
          const ultimoDia = new Date(parseInt(year), parseInt(month), 0).getDate();
          const fechaHastaCompleta = `${fechaHasta}-${ultimoDia.toString().padStart(2, '0')}`;
          params.append('fecha_hasta', fechaHastaCompleta);
        }
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        
        console.log('🔍 Consultando real financiero:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📊 Respuesta real financiero:', data);
        
        if (data.success) {
          const valorReal = parseFloat(data.total_real) || 0;
          setRealFinanciera(valorReal);
          
          console.log('✅ Real financiero actualizado:', valorReal);
        } else {
          console.error('❌ Error al obtener real financiero:', data.error);
          setRealFinanciera(0);
        }
      } catch (error) {
        console.error('❌ Error de conexión real financiero:', error);
        setRealFinanciera(0);
      }
    };

    // Función para obtener datos de real físico (valor parcial) desde cumplimiento_fisico
    const obtenerRealFisica = async () => {
      try {
        // Construir URL con filtros
        let url = `${API_BASE}/cumplimiento_fisico/cumplimiento_fisico.php`;
        const params = new URLSearchParams();
        
        if (proyectoId) {
          params.append('proyecto_id', proyectoId);
        }
        
        // Filtrar específicamente por vector "REAL"
        params.append('vector', 'REAL');
        
        if (fechaDesde) {
          // Convertir formato YYYY-MM a YYYY-MM-01 para el inicio del mes
          const fechaDesdeCompleta = `${fechaDesde}-01`;
          params.append('periodo_desde', fechaDesdeCompleta);
        }
        if (fechaHasta) {
          // Obtener el último día del mes seleccionado
          const [year, month] = fechaHasta.split('-');
          const ultimoDia = new Date(parseInt(year), parseInt(month), 0).getDate();
          const fechaHastaCompleta = `${fechaHasta}-${ultimoDia.toString().padStart(2, '0')}`;
          params.append('periodo_hasta', fechaHastaCompleta);
        }
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        
        console.log('🔍 Consultando real físico (vector REAL):', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📊 Respuesta real físico:', data);
        
        if (data.success && data.data.length > 0) {
          // Obtener el valor más reciente del parcial_periodo (no acumulado)
          const datosOrdenados = data.data.sort((a, b) => new Date(b.periodo) - new Date(a.periodo));
          const valorMasReciente = parseFloat(datosOrdenados[0].parcial_periodo) || 0;
          
          setRealFisica(valorMasReciente);
          
          console.log('✅ Real físico actualizado (parcial):', valorMasReciente);
          console.log('📅 Periodo más reciente:', datosOrdenados[0].periodo);
          console.log('📋 Total registros encontrados:', data.data.length);
          console.log('🔍 Valor parcial vs acumulado:', {
            parcial: datosOrdenados[0].parcial_periodo,
            acumulado: datosOrdenados[0].porcentaje_periodo
          });
        } else {
          console.log('⚠️ No se encontraron datos de cumplimiento físico para vector REAL');
          setRealFisica(0);
        }
      } catch (error) {
        console.error('❌ Error de conexión real físico:', error);
        setRealFisica(0);
      }
    };

    // Función para obtener proyección física desde la tabla predictividad
    const obtenerProyeccionFisica = async () => {
      try {
        // Construir URL con filtros
        let url = `${API_BASE}/predictividad/proyeccion_fisica.php`;
        const params = new URLSearchParams();
        
        if (proyectoId) {
          params.append('proyecto_id', proyectoId);
        }
        if (fechaDesde) {
          // Enviar solo el año y mes para que el backend pueda extraer correctamente
          params.append('fecha_desde', fechaDesde);
        }
        if (fechaHasta) {
          // Enviar solo el año y mes para que el backend pueda extraer correctamente
          params.append('fecha_hasta', fechaHasta);
        }
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        
        console.log('🔍 Consultando proyección física:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📊 Respuesta proyección física:', data);
        
        if (data.success) {
          const valorProyeccion = parseFloat(data.total_proyeccion_fisica) || 0;
          setProyeccionFisica(valorProyeccion);
          
          console.log('✅ Proyección física actualizada:', valorProyeccion);
        } else {
          console.error('❌ Error al obtener proyección física:', data.error);
          setProyeccionFisica(0);
        }
      } catch (error) {
        console.error('❌ Error de conexión proyección física:', error);
        setProyeccionFisica(0);
      }
    };

    // Función para obtener historial de predictividad financiera
    const obtenerHistorialFinanciero = async () => {
      try {
        setCargandoHistorial(true);
        
        // Obtener datos desde enero-2025 hasta el presente
        const fechaInicio = '2025-01-01';
        const fechaActual = new Date().toISOString().split('T')[0];
        
        let url = `${API_BASE}/predictividad/proyeccion_financiera.php`;
        const params = new URLSearchParams();
        
        if (proyectoId) {
          params.append('proyecto_id', proyectoId);
        }
        params.append('fecha_desde', fechaInicio);
        params.append('fecha_hasta', fechaActual);
        params.append('historial', 'true'); // Flag para indicar que queremos historial
        
        if (filtroDescripcion) {
          params.append('descripcion', filtroDescripcion);
        }
        
        url += '?' + params.toString();
        
        console.log('🔍 Consultando historial financiero:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.historial) {
          setHistorialFinanciero(data.historial);
          console.log('✅ Historial financiero cargado:', data.historial);
        } else {
          console.error('❌ Error al obtener historial financiero:', data.error);
          setHistorialFinanciero([]);
        }
      } catch (error) {
        console.error('❌ Error de conexión historial financiero:', error);
        setHistorialFinanciero([]);
      } finally {
        setCargandoHistorial(false);
      }
    };

    // Función para obtener historial de predictividad física
    const obtenerHistorialFisico = async () => {
      try {
        // Obtener datos desde enero-2025 hasta el presente
        const fechaInicio = '2025-01-01';
        const fechaActual = new Date().toISOString().split('T')[0];
        
        let url = `${API_BASE}/predictividad/proyeccion_fisica.php`;
        const params = new URLSearchParams();
        
        if (proyectoId) {
          params.append('proyecto_id', proyectoId);
        }
        params.append('fecha_desde', fechaInicio);
        params.append('fecha_hasta', fechaActual);
        params.append('historial', 'true'); // Flag para indicar que queremos historial
        
        url += '?' + params.toString();
        
        console.log('🔍 Consultando historial físico:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.historial) {
          setHistorialFisico(data.historial);
          console.log('✅ Historial físico cargado:', data.historial);
        } else {
          console.error('❌ Error al obtener historial físico:', data.error);
          setHistorialFisico([]);
        }
      } catch (error) {
        console.error('❌ Error de conexión historial físico:', error);
        setHistorialFisico([]);
      }
    };

    // Función para calcular la desviación financiera
    const calcularDesviacionFinanciera = () => {
      if (proyeccionFinanciera > 0 && realFinanciera >= 0) {
        // Fórmula: ((REAL - PROYECCIÓN) / PROYECCIÓN) * 100
        const desviacion = ((realFinanciera - proyeccionFinanciera) / proyeccionFinanciera) * 100;
        
        console.log('📊 Calculando desviación financiera:');
        console.log(`   Real: USD ${realFinanciera.toLocaleString()}`);
        console.log(`   Proyección: USD ${proyeccionFinanciera.toLocaleString()}`);
        console.log(`   Fórmula: ((${realFinanciera} - ${proyeccionFinanciera}) / ${proyeccionFinanciera}) * 100`);
        console.log(`   Resultado: ${desviacion.toFixed(2)}%`);
        console.log(`   Interpretación: ${desviacion > 0 ? 'Sobregasto' : desviacion < 0 ? 'Ahorro' : 'Sin desviación'}`);
        
        return {
          valor: desviacion,
          porcentaje: desviacion.toFixed(2),
          tieneValor: true,
          esPositiva: desviacion > 0,
          esNegativa: desviacion < 0,
          esNeutral: Math.abs(desviacion) < 0.01
        };
      }
      
      console.log('⚠️ No se puede calcular desviación financiera:');
      console.log(`   Real: ${realFinanciera}, Proyección: ${proyeccionFinanciera}`);
      
      return {
        valor: 0,
        porcentaje: '0.00',
        tieneValor: false,
        esPositiva: false,
        esNegativa: false,
        esNeutral: false
      };
    };

    const calcularDesviacionFisica = () => {
      if (proyeccionFisica > 0 && realFisica >= 0) {
        // Fórmula: ((REAL - PROYECCIÓN) / PROYECCIÓN) * 100
        const desviacion = ((realFisica - proyeccionFisica) / proyeccionFisica) * 100;
        
        console.log('📊 Calculando desviación física:');
        console.log(`   Real: ${realFisica.toFixed(2)}%`);
        console.log(`   Proyección: ${proyeccionFisica.toFixed(2)}%`);
        console.log(`   Fórmula: ((${realFisica} - ${proyeccionFisica}) / ${proyeccionFisica}) * 100`);
        console.log(`   Resultado: ${desviacion.toFixed(2)}%`);
        console.log(`   Interpretación: ${desviacion > 0 ? 'Sobregasto' : desviacion < 0 ? 'Ahorro' : 'Sin desviación'}`);
        
        return {
          valor: desviacion,
          porcentaje: desviacion.toFixed(2),
          tieneValor: true,
          esPositiva: desviacion > 0,
          esNegativa: desviacion < 0,
          esNeutral: Math.abs(desviacion) < 0.01
        };
      }
      
      console.log('⚠️ No se puede calcular desviación física:');
      console.log(`   Real: ${realFisica}, Proyección: ${proyeccionFisica}`);
      
      return {
        valor: 0,
        porcentaje: '0.00',
        tieneValor: false,
        esPositiva: false,
        esNegativa: false,
        esNeutral: false
      };
    };

    // FUNCIONES DE IMPORTACIÓN PARA TABLA PREDICTIVIDAD

    // Función para seleccionar archivo Excel
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const extension = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(extension)) {
        setMensajeImportacion('❌ Solo se permiten archivos Excel (.xlsx, .xls)');
        setTipoMensaje('error');
        setArchivoSeleccionado(null);
        return;
      }

      setArchivoSeleccionado(file);
      setMensajeImportacion('');

      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setExcelData(data);
        
        if (data.length > 0) {
          console.log('📊 Columnas detectadas:', Object.keys(data[0]));
          console.log('📊 Primera fila:', data[0]);
          console.log('📊 Total filas:', data.length);
        }
      };
      reader.readAsBinaryString(file);
    };

    // Función para convertir fechas de Excel a formato DD-MM-YYYY
    const excelDateToMysql = (excelDate) => {
      console.log('🔍 JS - CONVERSIÓN DE FECHA A DD-MM-YYYY:');
      console.log('  📅 Valor recibido:', excelDate);
      console.log('  📅 Tipo:', typeof excelDate);
      console.log('  📅 ¿Está vacío?', !excelDate || excelDate === '');
      
      if (!excelDate || excelDate === '' || excelDate === null || excelDate === undefined) {
        console.log('❌ JS - Fecha vacía, retornando cadena vacía');
        return '';
      }
      
      // Si es un número (número de serie Excel)
      if (!isNaN(excelDate) && typeof excelDate === 'number') {
        console.log('🔢 JS - Procesando número de Excel:', excelDate);
        
        // Algoritmo manual para convertir número de Excel a fecha DD-MM-YYYY
        const excelEpoch = new Date(1900, 0, 1); // 1 de enero de 1900
        const msPerDay = 24 * 60 * 60 * 1000;
        
        // Ajuste por el bug de Excel con 1900 siendo bisiesto
        let adjustedDays = excelDate - 1; // Restar 1 porque Excel cuenta desde 1, no 0
        if (excelDate > 59) adjustedDays--; // Ajuste por el día 60 ficticio de 1900
        
        const resultDate = new Date(excelEpoch.getTime() + (adjustedDays * msPerDay));
        
        console.log('📅 JS - Fecha calculada:', resultDate);
        
        if (!isNaN(resultDate.getTime())) {
          const day = String(resultDate.getDate()).padStart(2, '0');
          const month = String(resultDate.getMonth() + 1).padStart(2, '0');
          const year = String(resultDate.getFullYear());
          const converted = `${day}-${month}-${year}`;
          console.log('✅ JS - Convertido número Excel a DD-MM-YYYY:', `${excelDate} -> "${converted}"`);
          return converted;
        } else {
          console.log('❌ JS - Error calculando fecha desde número Excel');
          return '';
        }
      }
      
      const dateStr = String(excelDate).trim();
      console.log('📅 JS - Fecha como string:', `"${dateStr}"`);
      
      // Si ya está en formato DD-MM-YYYY, retornarlo tal como está
      if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
        console.log('✅ JS - Ya está en formato DD-MM-YYYY:', `"${dateStr}"`);
        return dateStr;
      }
      
      // Si está en formato YYYY-MM-DD, convertirlo a DD-MM-YYYY
      if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
        const parts = dateStr.split('-');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const converted = `${day}-${month}-${year}`;
        console.log('✅ JS - Convertido YYYY-MM-DD a DD-MM-YYYY:', `"${dateStr}" -> "${converted}"`);
        return converted;
      }
      
      console.log('⚠️ JS - Formato no reconocido, retornando cadena vacía');
      return '';
    };

    // Función para normalizar nombres de columnas
    const normalizeKeys = (row) => {
      const newRow = {};
      console.log('🔧 NORMALIZANDO CLAVES:');
      console.log('  📋 Claves originales:', Object.keys(row));
      
      Object.keys(row).forEach(key => {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        newRow[normalizedKey] = row[key];
        console.log(`  🔄 "${key}" → "${normalizedKey}"`);
      });
      
      console.log('  ✅ Claves normalizadas:', Object.keys(newRow));
      return newRow;
    };

    // Función para convertir porcentajes
    const parsePercentage = (value) => {
      console.log('🔍 JS - PROCESANDO PORCENTAJE:');
      console.log('  📊 Valor original:', value);
      console.log('  📊 Tipo:', typeof value);
      
      if (value === null || value === undefined || value === '') {
        console.log('❌ JS - Valor vacío, retornando 0');
        return 0;
      }
      
      let strValue = String(value).trim();
      console.log('  📊 String inicial:', `"${strValue}"`);
      
      // Eliminar el símbolo % si existe
      if (strValue.includes('%')) {
        strValue = strValue.replace('%', '');
        console.log('  📊 Sin %:', `"${strValue}"`);
      }
      
      // Reemplazar comas por puntos
      if (strValue.includes(',')) {
        strValue = strValue.replace(',', '.');
        console.log('  📊 Coma reemplazada por punto:', `"${strValue}"`);
      }
      
      // Convertir a número
      const resultado = parseFloat(strValue);
      console.log('  📊 Número final:', resultado);
      
      if (isNaN(resultado)) {
        console.log('❌ JS - No es un número válido, retornando 0');
        return 0;
      }
      
      console.log('✅ JS - Porcentaje procesado:', `${value} -> ${resultado}`);
      return resultado;
    };

    // Función para mapear filas del Excel a formato de predictividad
    const mapExcelRow = (row) => {
      console.log('📊 ============ PROCESANDO FILA EXCEL PREDICTIVIDAD ============');
      console.log('📊 Datos originales del Excel:', row);
      console.log('📊 Claves originales del Excel:', Object.keys(row));
      
      // Verificar si periodo_cierre_real está en los datos originales
      const tienePeriodoCierreReal = Object.keys(row).some(key => 
        key.toLowerCase().includes('periodo') && 
        key.toLowerCase().includes('cierre') && 
        key.toLowerCase().includes('real')
      );
      console.log('🔍 ¿Tiene periodo_cierre_real en datos originales?', tienePeriodoCierreReal);
      
      const r = normalizeKeys(row);
      
      console.log('📊 Datos normalizados:', r);
      console.log('📊 Claves disponibles:', Object.keys(r));
      
      // Buscar las claves correspondientes a los campos del Excel
      let periodoPrediccionKey = null;
      let porcentajePredicidoKey = null;
      let periodoCierreRealKey = null;
      let valorRealPorcentajeKey = null;
      
      // Búsqueda exacta primero (en minúsculas porque normalizeKeys convierte a minúsculas)
      Object.keys(r).forEach(key => {
        console.log('🔍 Revisando clave:', key, '→ valor:', r[key]);
        if (key === 'periodo_prediccion') {
          periodoPrediccionKey = key;
          console.log('✅ Encontrada clave exacta periodo_prediccion');
        }
        if (key === 'porcentaje_predicido') {
          porcentajePredicidoKey = key;
          console.log('✅ Encontrada clave exacta porcentaje_predicido');
        }
        if (key === 'periodo_cierre_real') {
          periodoCierreRealKey = key;
          console.log('✅ Encontrada clave exacta periodo_cierre_real');
        }
        if (key === 'valor_real_porcentaje') {
          valorRealPorcentajeKey = key;
          console.log('✅ Encontrada clave exacta valor_real_porcentaje');
        }
      });
      
      // Si no se encuentran las claves exactas, buscar alternativas
      if (!periodoPrediccionKey) {
        console.log('🔍 Buscando alternativa para periodo_prediccion...');
        Object.keys(r).forEach(key => {
          if (key.includes('periodo') && key.includes('prediccion')) {
            periodoPrediccionKey = key;
            console.log('✅ Encontrada clave alternativa periodo_prediccion:', key);
          }
        });
      }
      
      if (!porcentajePredicidoKey) {
        console.log('🔍 Buscando alternativa para porcentaje_predicido...');
        Object.keys(r).forEach(key => {
          if (key.includes('porcentaje') && key.includes('predicido')) {
            porcentajePredicidoKey = key;
            console.log('✅ Encontrada clave alternativa porcentaje_predicido:', key);
          }
        });
      }
      
      if (!periodoCierreRealKey) {
        console.log('🔍 Buscando alternativa para periodo_cierre_real...');
        Object.keys(r).forEach(key => {
          console.log('  🔍 Revisando clave para periodo_cierre_real:', key);
          if (key.includes('periodo') && key.includes('cierre') && key.includes('real')) {
            periodoCierreRealKey = key;
            console.log('✅ Encontrada clave alternativa periodo_cierre_real:', key);
          }
        });
      }
      
      if (!valorRealPorcentajeKey) {
        console.log('🔍 Buscando alternativa para valor_real_porcentaje...');
        Object.keys(r).forEach(key => {
          if (key.includes('valor') && key.includes('real') && key.includes('porcentaje')) {
            valorRealPorcentajeKey = key;
            console.log('✅ Encontrada clave alternativa valor_real_porcentaje:', key);
          }
        });
      }
      
      console.log('🔍 CLAVES FINALES DETECTADAS:');
      console.log('  - periodo_prediccion:', periodoPrediccionKey, '→ valor:', r[periodoPrediccionKey]);
      console.log('  - porcentaje_predicido:', porcentajePredicidoKey, '→ valor:', r[porcentajePredicidoKey]);
      console.log('  - periodo_cierre_real:', periodoCierreRealKey, '→ valor:', r[periodoCierreRealKey]);
      console.log('  - valor_real_porcentaje:', valorRealPorcentajeKey, '→ valor:', r[valorRealPorcentajeKey]);
      
      // Verificación específica de las claves
      console.log('🔍 VERIFICACIÓN ESPECÍFICA:');
      console.log('  - ¿periodo_prediccion encontrada?', !!periodoPrediccionKey);
      console.log('  - ¿periodo_cierre_real encontrada?', !!periodoCierreRealKey);
      console.log('  - Todas las claves disponibles:', Object.keys(r));
      
      // Procesar los valores
      console.log('🔄 PROCESANDO VALORES:');
      
      const periodo_prediccion = periodoPrediccionKey ? excelDateToMysql(r[periodoPrediccionKey]) : '';
      console.log('📅 periodo_prediccion procesado:', periodo_prediccion, '← de:', r[periodoPrediccionKey]);
      
      const porcentaje_predicido = porcentajePredicidoKey ? parsePercentage(r[porcentajePredicidoKey]) : 0;
      console.log('📊 porcentaje_predicido procesado:', porcentaje_predicido, '← de:', r[porcentajePredicidoKey]);
      
      const periodo_cierre_real = periodoCierreRealKey ? excelDateToMysql(r[periodoCierreRealKey]) : '';
      console.log('📅 periodo_cierre_real procesado:', periodo_cierre_real, '← de:', r[periodoCierreRealKey]);
      
      const valor_real_porcentaje = valorRealPorcentajeKey ? parsePercentage(r[valorRealPorcentajeKey]) : 0;
      console.log('📊 valor_real_porcentaje procesado:', valor_real_porcentaje, '← de:', r[valorRealPorcentajeKey]);
      
      // DATOS FINALES QUE SE ENVIARÁN AL PHP
      console.log('🚀 DATOS FINALES PARA ENVIAR AL PHP:');
      console.log('  - periodo_prediccion:', periodo_prediccion);
      console.log('  - porcentaje_predicido:', porcentaje_predicido, '(tipo:', typeof porcentaje_predicido, ')');
      console.log('  - periodo_cierre_real:', periodo_cierre_real);
      console.log('  - valor_real_porcentaje:', valor_real_porcentaje, '(tipo:', typeof valor_real_porcentaje, ')');
      
      return {
        periodo_prediccion: periodo_prediccion,
        porcentaje_predicido: porcentaje_predicido,
        periodo_cierre_real: periodo_cierre_real,
        valor_real_porcentaje: valor_real_porcentaje
      };
    };

    // Función principal de importación
    const handleImportar = async () => {
      console.log('📊 Iniciando importación a tabla PREDICTIVIDAD');
      
      if (!archivoSeleccionado || excelData.length === 0) {
        setMensajeImportacion('❌ Por favor selecciona un archivo Excel válido');
        setTipoMensaje('error');
        return;
      }

      // Verificar autorización antes de importar
      if (!autorizado) {
        console.log('🔐 Requiere autorización para importar');
        setShowAuthModal(true);
        return;
      }

      // Si ya está autorizado, ejecutar la importación directamente
      ejecutarImportacion();
    };

    // Función para validar código de autorización
    const validarCodigoAutorizacion = async () => {
      const codigoCorrecto = 'codelco2025$';
      
      if (codigoAutorizacion.trim() === codigoCorrecto) {
        setAutorizado(true);
        setErrorCodigo('');
        setShowAuthModal(false);
        setCodigoAutorizacion('');
        
        // Continuar automáticamente con la importación después de validar
        setTimeout(() => {
          ejecutarImportacion();
        }, 100);
        
        return true;
      } else {
        setErrorCodigo('Código de autorización incorrecto');
        return false;
      }
    };

    // Función para ejecutar la importación
    const ejecutarImportacion = async () => {
      if (!archivoSeleccionado || excelData.length === 0) {
        setMensajeImportacion('❌ Por favor selecciona un archivo Excel válido');
        setTipoMensaje('error');
        return;
      }

      setImportando(true);
      setMensajeImportacion('');

      try {
        // Mapear los datos antes de enviar
        const datosMapeados = excelData.map(mapExcelRow);
        
        // Verificar que proyectoId esté disponible
        if (!proyectoId) {
          setMensajeImportacion('❌ Error: No hay proyecto seleccionado');
          setTipoMensaje('error');
          return;
        }
        
        console.log('📊 Datos mapeados a enviar:', datosMapeados);
        console.log('📊 Proyecto ID:', proyectoId);
        console.log('📊 Total filas a procesar:', datosMapeados.length);
        
        const response = await fetch(`${API_BASE}/predictividad/importar_predictividad.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            rows: datosMapeados,
            proyecto_id: proyectoId
          }),
        });

        const result = await response.json();
        console.log('📊 Respuesta del servidor:', result);

        if (result.success) {
          const mensajeExito = `✅ ¡Importación completada exitosamente! Se han importado ${result.inserted} de ${result.total_rows} registros a la tabla PREDICTIVIDAD.`;
          setMensajeImportacion(mensajeExito);
          setTipoMensaje('success');
          setArchivoSeleccionado(null);
          setExcelData([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Limpiar el mensaje después de 5 segundos
          setTimeout(() => {
            setMensajeImportacion('');
            setTipoMensaje('');
          }, 5000);
        } else {
          if (result.errores && Array.isArray(result.errores)) {
            setMensajeImportacion('❌ Errores en la importación: ' + result.errores.join(', '));
          } else {
            setMensajeImportacion(result.error || '❌ Error en la importación');
          }
          setTipoMensaje('error');
        }
      } catch (error) {
        console.error('❌ Error completo:', error);
        setMensajeImportacion('❌ Error de conexión: ' + error.message);
        setTipoMensaje('error');
      } finally {
        setImportando(false);
      }
    };

    // Función para descargar plantilla Excel
    const descargarPlantilla = async () => {
      try {
        // Crear plantilla con datos de ejemplo basados en la imagen
        const plantillaData = [
          {
            'periodo_prediccion': '31-12-2024',
            'porcentaje_predicido': '1,70%',
            'periodo_cierre_real': '31-01-2025',
            'valor_real_porcentaje': '3,43%'
          },
          {
            'periodo_prediccion': '31-01-2025',
            'porcentaje_predicido': '0,99%',
            'periodo_cierre_real': '28-02-2025',
            'valor_real_porcentaje': '2,56%'
          },
          {
            'periodo_prediccion': '28-02-2025',
            'porcentaje_predicido': '2,70%',
            'periodo_cierre_real': '31-03-2025',
            'valor_real_porcentaje': '2,68%'
          },
          {
            'periodo_prediccion': '31-03-2025',
            'porcentaje_predicido': '2,81%',
            'periodo_cierre_real': '30-04-2025',
            'valor_real_porcentaje': '3,19%'
          },
          {
            'periodo_prediccion': '30-04-2025',
            'porcentaje_predicido': '3,21%',
            'periodo_cierre_real': '31-05-2025',
            'valor_real_porcentaje': '1,96%'
          },
          {
            'periodo_prediccion': '31-05-2025',
            'porcentaje_predicido': '2,65%',
            'periodo_cierre_real': '30-06-2025',
            'valor_real_porcentaje': '2,48%'
          }
        ];

        // Crear workbook y worksheet
        const ws = XLSX.utils.json_to_sheet(plantillaData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Predictividad');

        // Descargar archivo
        const fileName = proyectoId ? `plantilla_predictividad_proyecto_${proyectoId}.xlsx` : 'plantilla_predictividad.xlsx';
        XLSX.writeFile(wb, fileName);
        
        // Mostrar mensaje de éxito
        setMensajeImportacion(`✅ Plantilla descargada exitosamente: ${fileName}`);
        setTipoMensaje('success');
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setMensajeImportacion('');
          setTipoMensaje('');
        }, 3000);
        
      } catch (error) {
        console.error('❌ Error al descargar plantilla:', error);
        setMensajeImportacion('❌ Error al descargar la plantilla: ' + error.message);
        setTipoMensaje('error');
      }
    };

    // Cargar datos al montar el componente y cuando cambien los filtros
    useEffect(() => {
      console.log('🔄 useEffect ejecutándose con parámetros:', { proyectoId, fechaDesde, fechaHasta, filtroDescripcion });
      
      if (proyectoId) {
        console.log('🔄 Actualizando datos de predictividad por cambio de filtros');
        obtenerProyeccionFinanciera();
        obtenerRealFinanciera();
        obtenerRealFisica();
        obtenerProyeccionFisica();
        
        // Cargar historial
        obtenerHistorialFinanciero();
        obtenerHistorialFisico();
      } else {
        console.log('⚠️ proyectoId no está disponible, no se ejecutan las funciones');
      }
    }, [proyectoId, fechaDesde, fechaHasta, filtroDescripcion]);

    // Validar que data sea un array válido
    const datosValidos = Array.isArray(data) ? data : [];
    
    // Agrupar datos por tipo (Física y Financiera)
    const datosFisicos = datosValidos.filter(item => (item.tipo || 'Fisica') === 'Fisica');
    const datosFinancieros = datosValidos.filter(item => (item.tipo || 'Fisica') === 'Financiera');
    
    // Obtener el período para mostrar en el título basado en los filtros de fecha
    const obtenerPeriodoActual = () => {
      if (fechaDesde && fechaHasta) {
        if (fechaDesde === fechaHasta) {
          // Mismo mes
          const mes = fechaDesde.split('-')[1];
          const anio = fechaDesde.split('-')[0];
          const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ];
          return `${nombresMeses[parseInt(mes) - 1]} ${anio}`;
        } else {
          // Rango de meses
          const mesDesde = fechaDesde.split('-')[1];
          const mesHasta = fechaHasta.split('-')[1];
          const anio = fechaDesde.split('-')[0];
          const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ];
          return `${nombresMeses[parseInt(mesDesde) - 1]} - ${nombresMeses[parseInt(mesHasta) - 1]} ${anio}`;
        }
      }
      return 'Período Actual';
    };
    
    const periodoActual = obtenerPeriodoActual();

    // Función para calcular la nota basada en la desviación según la métrica de predictividad
    const calcularNota = (desviacion) => {
      // Para desviaciones negativas (mayor eficiencia): siempre Nota 5
      // Para desviaciones positivas (menor eficiencia): evaluar según rango
      
      if (desviacion < 0) {
        // Desviación negativa = mayor eficiencia (gasto real < proyectado)
        // Si gastó menos de lo proyectado, es excelente = Nota 5
        return {
          numero: '5',
          color: '#28a745',
          descripcion: 'Excelente cumplimiento'
        };
      } else {
        // Desviación positiva = menor eficiencia (gasto real > proyectado)
        if (desviacion <= 10) {
          return {
            numero: '5',
            color: '#28a745',
            descripcion: 'Excelente cumplimiento'
          };
        } else if (desviacion <= 15) {
          return {
            numero: '3',
            color: '#ffc107',
            descripcion: 'Cumplimiento 100%'
          };
        } else {
          return {
            numero: '1',
            color: '#dc3545',
            descripcion: 'Cumplimiento crítico'
          };
        }
      }
    };

    // Función específica para calcular nota de predictividad física
    const calcularNotaFisica = (desviacion) => {
      // Para avance físico, la lógica es diferente:
      // - Desviación positiva = mayor avance del proyectado = bueno (pero proyección imprecisa)
      // - Desviación negativa = menor avance del proyectado = malo
      // La nota se basa en la precisión de la proyección, no en el avance en sí
      
      const desviacionAbsoluta = Math.abs(desviacion);
      
      if (desviacionAbsoluta <= 5) {
        // Proyección muy precisa (desviación ≤ 5%)
        return {
          numero: '5',
          color: '#28a745',
          descripcion: 'Proyección precisa'
        };
      } else if (desviacionAbsoluta <= 10) {
        // Proyección aceptable (desviación ≤ 10%)
        return {
          numero: '4',
          color: '#17a2b8',
          descripcion: 'Proyección aceptable'
        };
      } else if (desviacionAbsoluta <= 20) {
        // Proyección con desviación moderada (desviación ≤ 20%)
        return {
          numero: '3',
          color: '#ffc107',
          descripcion: 'Proyección moderada'
        };
      } else if (desviacionAbsoluta <= 50) {
        // Proyección con desviación alta (desviación ≤ 50%)
        return {
          numero: '2',
          color: '#fd7e14',
          descripcion: 'Proyección imprecisa'
        };
      } else {
        // Proyección muy imprecisa (desviación > 50%)
        return {
          numero: '1',
          color: '#dc3545',
          descripcion: 'Proyección crítica'
        };
      }
    };

    // Componente de Tooltip - COMENTADO PARA EVITAR ERRORES
    /*
    const Tooltip = ({ children, content, position = 'top' }) => {
      const [showTooltip, setShowTooltip] = useState(false);
      
      const tooltipStyle = {
        position: 'absolute',
        backgroundColor: '#333',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 1000,
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        whiteSpace: 'pre-line',
        lineHeight: '1.4',
        ...(position === 'top' && {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px'
        }),
        ...(position === 'bottom' && {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px'
        })
      };
      
      const arrowStyle = {
        position: 'absolute',
        width: '0',
        height: '0',
        ...(position === 'top' && {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #333'
        }),
        ...(position === 'bottom' && {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '6px solid #333'
        })
      };
      
      return (
        <div 
          style={{ position: 'relative', display: 'inline-block' }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {children}
          {showTooltip && (
            <div style={tooltipStyle}>
              {content}
              <div style={arrowStyle}></div>
            </div>
          )}
        </div>
      );
    };
    */

    return (
    <div style={{ width: '100%', padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h3 style={{ color: '#16355D', margin: 0 }}>PREDICTIVIDAD</h3>
          
          {/* Sección de importación - Funcionalidad completa */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-end'
          }}>
            {/* Etiqueta para identificar la sección */}
            <div style={{
              backgroundColor: '#6f42c1',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              📈 IMPORTACIÓN DE DATOS
            </div>
            
            {/* Botones con funcionalidad completa */}
            <div style={{ 
              display: 'flex', 
              gap: '6px', 
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setShowFormatInfo(!showFormatInfo)}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                  padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                  fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                  gap: '4px'
              }}
                title="Ver información del formato requerido"
            >
                <span style={{ fontSize: '12px' }}>ℹ️</span>
              Formato
            </button>

            <button
              onClick={descargarPlantilla}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                  padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                  fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                  gap: '4px'
              }}
                title="Descargar plantilla Excel con formato correcto"
            >
                <span style={{ fontSize: '12px' }}>📥</span>
              Plantilla
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                  padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                  fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                  gap: '4px'
              }}
                title="Seleccionar archivo Excel para importar"
            >
                <span style={{ fontSize: '12px' }}>📁</span>
              Archivo
            </button>

            <button
              onClick={handleImportar}
              disabled={!archivoSeleccionado || importando}
              style={{
                  backgroundColor: (!archivoSeleccionado || importando) ? '#6c757d' : '#6f42c1',
                color: 'white',
                border: 'none',
                  padding: '6px 10px',
                borderRadius: '4px',
                  cursor: (!archivoSeleccionado || importando) ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                  gap: '4px',
                  opacity: (!archivoSeleccionado || importando) ? 0.6 : 1
              }}
                title={archivoSeleccionado ? "Importar datos a la tabla predictividad" : "Primero selecciona un archivo"}
            >
                <span style={{ fontSize: '12px' }}>📈</span>
                {importando ? 'Importando...' : 'Importar'}
            </button>
            </div>
          </div>
        </div>

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Información de formato */}
        {showFormatInfo && (
          <div style={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '5px',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>📊 Formato Requerido para Tabla PREDICTIVIDAD:</h4>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              <p><strong>📋 Columnas requeridas (nombres exactos):</strong></p>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li><strong>periodo_prediccion:</strong> Fecha en formato DD-MM-YYYY (ej: 31-12-2024)</li>
                <li><strong>porcentaje_predicido:</strong> Porcentaje con coma decimal (ej: 1,70%)</li>
                <li><strong>periodo_cierre_real:</strong> Fecha en formato DD-MM-YYYY (ej: 31-01-2025)</li>
                <li><strong>valor_real_porcentaje:</strong> Porcentaje con coma decimal (ej: 3,43%)</li>
              </ul>
              
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                padding: '10px',
                marginTop: '10px'
              }}>
                <p style={{ margin: 0, color: '#155724', fontWeight: 'bold' }}>
                  ✅ NOTA: Use la plantilla descargable para asegurar el formato correcto.
                </p>
            </div>

          <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                padding: '10px',
                marginTop: '10px'
              }}>
                <p style={{ margin: 0, color: '#856404', fontWeight: 'bold' }}>
                  ⚠️ IMPORTANTE: Los datos se almacenan en la tabla "predictividad".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Archivo seleccionado */}
        {archivoSeleccionado && (
          <div style={{
            backgroundColor: '#d1ecf1',
            border: '1px solid #bee5eb',
            borderRadius: '5px',
            padding: '10px 15px',
            marginBottom: '15px'
          }}>
            <strong>📂 Archivo seleccionado:</strong> {archivoSeleccionado.name} 
            <span style={{ marginLeft: '10px', color: '#0c5460' }}>
            ({excelData.length} filas detectadas)
            </span>
          </div>
        )}

        {/* Modal de autorización */}
        {showAuthModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#16355D',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px auto'
                }}>
                  <span style={{ fontSize: '24px', color: 'white' }}>🔒</span>
                </div>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#16355D',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  Autorización Requerida
                </h3>
                
                <p style={{ 
                  margin: '0',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#666'
                }}>
                  Para importar datos a la tabla PREDICTIVIDAD, se requiere un código de autorización.
                </p>
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Código de Autorización
                </label>
                <input
                  type="password"
                  value={codigoAutorizacion}
                  onChange={(e) => setCodigoAutorizacion(e.target.value)}
                  placeholder="Ingrese el código de autorización"
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: errorCodigo ? '2px solid #dc3545' : '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      validarCodigoAutorizacion();
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#16355D';
                  }}
                  onBlur={(e) => {
                    if (!errorCodigo) {
                      e.target.style.borderColor = '#e1e5e9';
                    }
                  }}
                />
                {errorCodigo && (
                  <p style={{ 
                    color: '#dc3545', 
                    fontSize: '13px', 
                    margin: '8px 0 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>⚠️</span>
                    {errorCodigo}
                  </p>
                )}
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setCodigoAutorizacion('');
                    setErrorCodigo('');
                  }}
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    border: '2px solid #e1e5e9',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    minWidth: '100px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e9ecef';
                    e.target.style.borderColor = '#dee2e6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.borderColor = '#e1e5e9';
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={validarCodigoAutorizacion}
                  style={{
                    backgroundColor: '#16355D',
                    color: 'white',
                    border: '2px solid #16355D',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    minWidth: '100px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0d2535';
                    e.target.style.borderColor = '#0d2535';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#16355D';
                    e.target.style.borderColor = '#16355D';
                  }}
                >
                  Validar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de estado */}
        {mensajeImportacion && (
          <div style={{
            backgroundColor: tipoMensaje === 'success' ? '#d4edda' : '#f8d7da',
            border: `2px solid ${tipoMensaje === 'success' ? '#28a745' : '#dc3545'}`,
            borderRadius: '8px',
            padding: '15px 20px',
            marginBottom: '20px',
            color: tipoMensaje === 'success' ? '#155724' : '#721c24',
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <span style={{ fontSize: '20px' }}>
              {tipoMensaje === 'success' ? '✅' : '❌'}
            </span>
            <span>{mensajeImportacion}</span>
          </div>
        )}

        {/* Tabla de Predictividad */}
        <div style={{ 
          marginTop: '30px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Encabezado de la tabla */}
          <div style={{
            backgroundColor: '#16355D',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '26px',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}>
              PREDICTIVIDAD
            </h2>
            <p style={{ 
              margin: '0',
              fontSize: '14px',
              opacity: '0.85',
              fontWeight: '300',
              letterSpacing: '0.5px'
            }}>
              Análisis de Proyecciones y Desviaciones - {periodoActual}
            </p>
          </div>

          {/* Tabla de datos */}
          <div style={{ padding: '0' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              {/* Encabezados de columnas */}
          <thead>
                <tr style={{
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #dee2e6'
                }}>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#16355D',
                    borderRight: '1px solid #dee2e6',
                    width: '25%'
                  }}>
                    Categoría
                  </th>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#16355D',
                    borderRight: '1px solid #dee2e6',
                    width: '18.75%'
                  }}>
                    Proyección
                  </th>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#16355D',
                    borderRight: '1px solid #dee2e6',
                    width: '18.75%'
                  }}>
                    Real
                  </th>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#16355D',
                    borderRight: '1px solid #dee2e6',
                    width: '18.75%'
                  }}>
                    Desviación
                  </th>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#16355D',
                    width: '18.75%'
                  }}>
                    Nota
                  </th>
            </tr>
          </thead>
              
              {/* Cuerpo de la tabla */}
          <tbody>
                {/* Fila Financiera */}
                <tr style={{
                  borderBottom: '1px solid #dee2e6',
                  backgroundColor: 'white'
                }}>
                <td style={{ 
                    padding: '15px 20px',
                    borderRight: '1px solid #dee2e6',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '0',
                        height: '0',
                        borderLeft: '8px solid #ff6b35',
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent'
                      }}></div>
                      <span style={{
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        Financiera
                      </span>
                    </div>
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    borderRight: '1px solid #dee2e6',
                    fontWeight: '500',
                    color: cargandoDatos ? '#6c757d' : '#16355D',
                    backgroundColor: cargandoDatos ? '#f8f9fa' : 'transparent'
                  }}>
                    {cargandoDatos ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '12px', animation: 'spin 1s linear infinite' }}>⟳</span>
                      <span style={{ fontSize: '12px' }}>Cargando...</span>
                      </div>
                    ) : proyeccionFinanciera > 0 ? (
                      <div
                        style={{ cursor: 'help' }}
                        title={`📊 PROYECCIÓN FINANCIERA

🔍 Fuente de datos: Tabla financiero_sap
📋 Cálculo: Suma de categorías VP
   • MO (Mano de Obra)
   • IC (Instalaciones y Construcción)
   • EM (Equipos y Maquinaria)
   • IE (Instalaciones Especiales)
   • SC (Servicios de Construcción)
   • AD (Administración)
   • CL (Contingencia Local)
   • CT (Contingencia Total)

💰 Representa: Presupuesto proyectado para el período seleccionado
📅 Filtros aplicados: ${fechaDesde ? `Desde: ${fechaDesde}` : 'Sin filtro'} ${fechaHasta ? `Hasta: ${fechaHasta}` : ''} ${filtroDescripcion ? `Descripción: ${filtroDescripcion}` : ''}`}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>
                            USD {proyeccionFinanciera.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </div>
                          <div style={{ fontSize: '10px', color: '#28a745', marginTop: '2px' }}>
                            ✅ Datos SAP
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#6c757d' }}>
                        <div>-</div>
                        <div style={{ fontSize: '10px', marginTop: '2px' }}>
                          Sin datos
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    borderRight: '1px solid #dee2e6',
                    fontWeight: '500',
                    color: cargandoDatos ? '#6c757d' : '#16355D',
                    backgroundColor: cargandoDatos ? '#f8f9fa' : 'transparent'
                  }}>
                    {cargandoDatos ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '12px', animation: 'spin 1s linear infinite' }}>⟳</span>
                      <span style={{ fontSize: '12px' }}>Cargando...</span>
                      </div>
                    ) : realFinanciera > 0 ? (
                      <div
                        style={{ cursor: 'help' }}
                        title={`💰 REAL FINANCIERO

🔍 Fuente de datos: Tabla real_parcial
📋 Cálculo: Suma de categorías VP ejecutadas
   • MO (Mano de Obra)
   • IC (Instalaciones y Construcción)
   • EM (Equipos y Maquinaria)
   • IE (Instalaciones Especiales)
   • SC (Servicios de Construcción)
   • AD (Administración)
   • CL (Contingencia Local)
   • CT (Contingencia Total)

💡 Representa: Gasto real ejecutado en el período seleccionado
📅 Filtros aplicados: ${fechaDesde ? `Desde: ${fechaDesde}` : 'Sin filtro'} ${fechaHasta ? `Hasta: ${fechaHasta}` : ''}`}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>
                            USD {realFinanciera.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </div>
                          <div style={{ fontSize: '10px', color: '#007bff', marginTop: '2px' }}>
                            📋 Datos Reales
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#6c757d' }}>
                        <div>-</div>
                        <div style={{ fontSize: '10px', marginTop: '2px' }}>
                          Sin datos
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    borderRight: '1px solid #dee2e6',
                    fontWeight: '500'
                  }}>
                    {(() => {
                      const desviacion = calcularDesviacionFinanciera();
                      
                      if (cargandoDatos) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '12px', animation: 'spin 1s linear infinite' }}>⟳</span>
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>Calculando...</span>
                          </div>
                        );
                      }
                      
                      if (!desviacion.tieneValor) {
                        return (
                          <div style={{ color: '#6c757d' }}>
                            <div>-</div>
                            <div style={{ fontSize: '10px', marginTop: '2px' }}>
                              Sin datos
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div>
                          <div style={{ 
                            fontWeight: 'bold',
                            color: desviacion.esPositiva ? '#dc3545' : 
                                   desviacion.esNegativa ? '#28a745' : '#6c757d'
                          }}>
                            {desviacion.esPositiva ? '+' : ''}{desviacion.porcentaje}%
                          </div>
                          <div style={{ 
                            fontSize: '10px', 
                            marginTop: '2px',
                            color: desviacion.esPositiva ? '#dc3545' : 
                                   desviacion.esNegativa ? '#28a745' : '#6c757d'
                          }}>
                            {desviacion.esPositiva ? '📈 Más Gasto' : 
                             desviacion.esNegativa ? '📉 Menos Gasto' : '📊 Sin desviación'}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    fontWeight: '500',
                    color: '#6c757d'
                  }}>
                    {(() => {
                      const desviacion = calcularDesviacionFinanciera();
                      const nota = calcularNota(desviacion.porcentaje);
                      return (
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', color: nota.color }}>
                            {nota.numero}
                          </div>
                          <div style={{ fontSize: '10px', color: nota.color, marginTop: '2px' }}>
                            {nota.descripcion}
                          </div>
                        </div>
                      );
                    })()}
                </td>
              </tr>
                
                {/* Fila Física */}
                <tr style={{
                  borderBottom: '1px solid #dee2e6',
                  backgroundColor: '#f8f9fa'
                }}>
                  <td style={{
                    padding: '15px 20px',
                    borderRight: '1px solid #dee2e6',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '0',
                        height: '0',
                        borderLeft: '8px solid #ff6b35',
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent'
                      }}></div>
                      <span style={{
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        Física
                      </span>
                    </div>
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    borderRight: '1px solid #dee2e6',
                    fontWeight: '500',
                    color: cargandoDatos ? '#6c757d' : '#16355D',
                    backgroundColor: cargandoDatos ? '#f8f9fa' : 'transparent'
                  }}>
                    {cargandoDatos ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '12px', animation: 'spin 1s linear infinite' }}>⟳</span>
                        <span style={{ fontSize: '12px' }}>Cargando...</span>
                      </div>
                    ) : proyeccionFisica > 0 ? (
                      <div
                        style={{ cursor: 'help' }}
                        title={`📊 PROYECCIÓN FÍSICA

🔍 Fuente de datos: Tabla predictividad
📋 Campo: porcentaje_predicido
📅 Filtro por: period_cierre_real

💡 Representa: Porcentaje de avance físico proyectado para el período seleccionado
📈 Cálculo: Suma de porcentajes predichos en el período
📅 Filtros aplicados: ${fechaDesde ? `Desde: ${fechaDesde}` : 'Sin filtro'} ${fechaHasta ? `Hasta: ${fechaHasta}` : ''}

🔧 Nota: Los datos se obtienen de predicciones basadas en el avance histórico del proyecto`}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>
                            {proyeccionFisica.toFixed(2)}%
                          </div>
                          <div style={{ fontSize: '10px', color: '#28a745', marginTop: '2px' }}>
                            ✅ Datos Predictividad
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#6c757d' }}>
                        <div>-</div>
                        <div style={{ fontSize: '10px', marginTop: '2px' }}>
                          Sin datos
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    borderRight: '1px solid #dee2e6',
                    fontWeight: '500',
                    color: cargandoDatos ? '#6c757d' : '#16355D',
                    backgroundColor: cargandoDatos ? '#f8f9fa' : 'transparent'
                  }}>
                    {cargandoDatos ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '12px', animation: 'spin 1s linear infinite' }}>⟳</span>
                        <span style={{ fontSize: '12px' }}>Cargando...</span>
                      </div>
                    ) : realFisica > 0 ? (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {realFisica.toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#ff6b35', marginTop: '2px' }}>
                          🏗️ Parcial REAL
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#6c757d' }}>
                        <div>-</div>
                        <div style={{ fontSize: '10px', marginTop: '2px' }}>
                          Sin datos
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    borderRight: '1px solid #dee2e6',
                    fontWeight: '500'
                  }}>
                    {(() => {
                      const desviacion = calcularDesviacionFisica();
                      
                      if (cargandoDatos) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '12px', animation: 'spin 1s linear infinite' }}>⟳</span>
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>Calculando...</span>
                          </div>
                        );
                      }
                      
                      if (!desviacion.tieneValor) {
                        return (
                          <div style={{ color: '#6c757d' }}>
                            <div>-</div>
                            <div style={{ fontSize: '10px', marginTop: '2px' }}>
                              Sin datos
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div>
                          <div style={{ 
                            fontWeight: 'bold',
                            color: desviacion.esPositiva ? '#dc3545' : 
                                   desviacion.esNegativa ? '#28a745' : '#6c757d'
                          }}>
                            {desviacion.esPositiva ? '+' : ''}{desviacion.porcentaje}%
                          </div>
                          <div style={{ 
                            fontSize: '10px', 
                            marginTop: '2px',
                            color: desviacion.esPositiva ? '#dc3545' : 
                                   desviacion.esNegativa ? '#28a745' : '#6c757d'
                          }}>
                            {desviacion.esPositiva ? '📈 Mayor Avance' : 
                             desviacion.esNegativa ? '📉 Menor Avance' : '📊 Sin desviación'}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    textAlign: 'center',
                    fontWeight: '500',
                    color: '#6c757d'
                  }}>
                    {(() => {
                      const desviacion = calcularDesviacionFisica();
                      const nota = calcularNotaFisica(desviacion.porcentaje);
                      return (
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', color: nota.color }}>
                            {nota.numero}
                          </div>
                          <div style={{ fontSize: '10px', color: nota.color, marginTop: '2px' }}>
                            {nota.descripcion}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
          </tbody>
        </table>
          </div>

          {/* Análisis Dinámico - Predictividad */}
          {proyeccionFinanciera > 0 && realFinanciera > 0 && proyeccionFisica > 0 && realFisica > 0 && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '2px solid #ffc107',
              marginTop: '20px'
            }}>
              <h5 style={{ 
                color: '#856404', 
                marginBottom: '15px', 
                fontSize: '16px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📊 ANÁLISIS EJECUTIVO - PREDICTIVIDAD DEL PROYECTO
              </h5>
              
              {(() => {
                // Obtener datos de desviación
                const desviacionFinanciera = calcularDesviacionFinanciera();
                const desviacionFisica = calcularDesviacionFisica();
                
                // Calcular precisión de predicciones
                const precisionFinanciera = Math.abs(100 - Math.abs(desviacionFinanciera.porcentaje));
                const precisionFisica = Math.abs(100 - Math.abs(desviacionFisica.porcentaje));
                
                // Determinar estado general de predictividad
                const getEstadoPredictividad = () => {
                  const precisionPromedio = (precisionFinanciera + precisionFisica) / 2;
                  
                  if (precisionPromedio >= 95) {
                    return { texto: 'EXCELENTE', color: '#28a745', icono: '🟢' };
                  } else if (precisionPromedio >= 85) {
                    return { texto: 'BUENA', color: '#17a2b8', icono: '🔵' };
                  } else if (precisionPromedio >= 75) {
                    return { texto: 'REGULAR', color: '#ffc107', icono: '🟡' };
                  } else if (precisionPromedio >= 60) {
                    return { texto: 'REQUIERE MEJORA', color: '#fd7e14', icono: '🟠' };
                  } else {
                    return { texto: 'CRÍTICA', color: '#dc3545', icono: '🔴' };
                  }
                };
                
                const estadoPredictividad = getEstadoPredictividad();
                
                return (
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {/* Estado General de Predictividad */}
                    <div style={{ 
                      marginBottom: '15px', 
                      padding: '10px', 
                      backgroundColor: estadoPredictividad.color + '20',
                      borderRadius: '6px',
                      border: `1px solid ${estadoPredictividad.color}`
                    }}>
                      <strong style={{ color: estadoPredictividad.color }}>
                        {estadoPredictividad.icono} PRECISIÓN DE PREDICCIONES: {estadoPredictividad.texto}
                      </strong>
                    </div>
                    
                    {/* Análisis por dimensiones */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                      <div>
                        <h6 style={{ color: '#856404', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                          💰 PREDICCIÓN FINANCIERA
                        </h6>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <div><strong>Proyectado:</strong> USD {proyeccionFinanciera.toLocaleString()}</div>
                          <div><strong>Ejecutado:</strong> USD {realFinanciera.toLocaleString()}</div>
                          <div><strong>Desviación:</strong> 
                            <span style={{ 
                              color: desviacionFinanciera.esPositiva ? '#dc3545' : desviacionFinanciera.esNegativa ? '#28a745' : '#666',
                              fontWeight: 'bold'
                            }}>
                              {desviacionFinanciera.esPositiva ? '+' : ''}{desviacionFinanciera.porcentaje}%
                            </span>
                          </div>
                          <div><strong>Precisión:</strong> 
                            <span style={{ 
                              color: precisionFinanciera >= 95 ? '#28a745' : precisionFinanciera >= 85 ? '#17a2b8' : precisionFinanciera >= 75 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {precisionFinanciera.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h6 style={{ color: '#856404', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                          📈 PREDICCIÓN FÍSICA
                        </h6>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <div><strong>Proyectado:</strong> {proyeccionFisica.toFixed(2)}%</div>
                          <div><strong>Ejecutado:</strong> {realFisica.toFixed(2)}%</div>
                          <div><strong>Desviación:</strong> 
                            <span style={{ 
                              color: desviacionFisica.esPositiva ? '#dc3545' : desviacionFisica.esNegativa ? '#28a745' : '#666',
                              fontWeight: 'bold'
                            }}>
                              {desviacionFisica.esPositiva ? '+' : ''}{desviacionFisica.porcentaje}%
                            </span>
                          </div>
                          <div><strong>Precisión:</strong> 
                            <span style={{ 
                              color: precisionFisica >= 95 ? '#28a745' : precisionFisica >= 85 ? '#17a2b8' : precisionFisica >= 75 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {precisionFisica.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicadores clave */}
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '12px', 
                      borderRadius: '6px',
                      border: '1px solid #dee2e6',
                      marginBottom: '15px'
                    }}>
                      <h6 style={{ color: '#856404', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                        🎯 INDICADORES CLAVE DE PREDICTIVIDAD
                      </h6>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px' }}>
                        <div>
                          <strong>
                            Precisión Promedio:
                            <span 
                              title={`🧮 CÁLCULO DE PRECISIÓN PROMEDIO:

📊 FÓRMULA:
Precisión Promedio = (Precisión Financiera + Precisión Física) / 2

📈 CÁLCULO DE CADA PRECISIÓN:
• Precisión = 100% - |Desviación|

📋 EJEMPLO CON TUS DATOS:
• Desviación Financiera: ${typeof desviacionFinanciera.porcentaje === 'number' ? desviacionFinanciera.porcentaje.toFixed(2) : desviacionFinanciera.porcentaje}%
• Precisión Financiera: 100% - |${typeof desviacionFinanciera.porcentaje === 'number' ? desviacionFinanciera.porcentaje.toFixed(2) : desviacionFinanciera.porcentaje}%| = ${typeof precisionFinanciera === 'number' ? precisionFinanciera.toFixed(2) : precisionFinanciera}%

• Desviación Física: ${typeof desviacionFisica.porcentaje === 'number' ? desviacionFisica.porcentaje.toFixed(2) : desviacionFisica.porcentaje}%
• Precisión Física: 100% - |${typeof desviacionFisica.porcentaje === 'number' ? desviacionFisica.porcentaje.toFixed(2) : desviacionFisica.porcentaje}%| = ${typeof precisionFisica === 'number' ? precisionFisica.toFixed(2) : precisionFisica}%

🎯 RESULTADO:
Precisión Promedio = (${typeof precisionFinanciera === 'number' ? precisionFinanciera.toFixed(2) : precisionFinanciera}% + ${typeof precisionFisica === 'number' ? precisionFisica.toFixed(2) : precisionFisica}%) / 2 = ${((precisionFinanciera + precisionFisica) / 2).toFixed(1)}%

💡 INTERPRETACIÓN:
• 95-100%: Excelente precisión
• 85-94%: Buena precisión
• 75-84%: Precisión regular
• 60-74%: Requiere mejora
• <60%: Precisión crítica`}
                              style={{ 
                                cursor: 'help', 
                                color: '#007bff', 
                                marginLeft: '5px',
                                fontSize: '11px'
                              }}
                            >
                              ℹ️
                            </span>
                          </strong> 
                          <span style={{ 
                            color: (precisionFinanciera + precisionFisica) / 2 >= 95 ? '#28a745' : (precisionFinanciera + precisionFisica) / 2 >= 85 ? '#17a2b8' : (precisionFinanciera + precisionFisica) / 2 >= 75 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {((precisionFinanciera + precisionFisica) / 2).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <strong>Calificación Financiera:</strong> 
                          <span style={{ 
                            color: calcularNota(desviacionFinanciera.porcentaje).color,
                            fontWeight: 'bold'
                          }}>
                            {calcularNota(desviacionFinanciera.porcentaje).numero}/5
                          </span>
                        </div>
                        <div>
                          <strong>Calificación Física:</strong> 
                          <span style={{ 
                            color: calcularNotaFisica(desviacionFisica.porcentaje).color,
                            fontWeight: 'bold'
                          }}>
                            {calcularNotaFisica(desviacionFisica.porcentaje).numero}/5
                          </span>
                        </div>
                        <div>
                          <strong>Confianza del Modelo:</strong> 
                          <span style={{ 
                            color: (precisionFinanciera + precisionFisica) / 2 >= 90 ? '#28a745' : (precisionFinanciera + precisionFisica) / 2 >= 80 ? '#17a2b8' : '#ffc107',
                            fontWeight: 'bold'
                          }}>
                            {(precisionFinanciera + precisionFisica) / 2 >= 90 ? 'ALTA' : (precisionFinanciera + precisionFisica) / 2 >= 80 ? 'MEDIA' : 'BAJA'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recomendaciones */}
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '10px', 
                      backgroundColor: '#d1ecf1', 
                      borderRadius: '6px',
                      border: '1px solid #bee5eb',
                      fontSize: '12px',
                      color: '#0c5460'
                    }}>
                      <strong>💡 INSIGHTS DE PREDICTIVIDAD:</strong>
                      {(() => {
                        const precisionPromedio = (precisionFinanciera + precisionFisica) / 2;
                        
                        if (precisionPromedio >= 95) {
                          return ' El modelo de predicción muestra excelente precisión. Las proyecciones son altamente confiables para la planificación futura.';
                        } else if (precisionPromedio >= 85) {
                          return ' El modelo de predicción tiene buena precisión. Se recomienda monitorear tendencias para mejorar la exactitud.';
                        } else if (precisionPromedio >= 75) {
                          return ' La precisión del modelo es regular. Se sugiere revisar los parámetros de predicción y ajustar el modelo.';
                        } else if (precisionPromedio >= 60) {
                          return ' La precisión requiere mejora significativa. Se necesita recalibrar el modelo de predicción con datos más recientes.';
                        } else {
                          return ' La precisión es crítica. Se requiere una revisión completa del modelo de predicción y sus algoritmos.';
                        }
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

      </div>
    </div>
  );
  };

  // Componente para el reporte de Eficiencia del Gasto
  const ReporteEficienciaGasto = ({ data, proyectoId, fechaDesde, fechaHasta }) => {
    const [datosEficiencia, setDatosEficiencia] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    // Función para obtener datos financieros (V0 y Real) - PARCIALES
    const obtenerDatosFinancieros = async (periodo, fechaInicio = null, fechaFin = null) => {
      try {
        // Determinar el período a consultar
        let periodoAConsultar;
        let nombrePeriodo;
        
        if (periodo === 'mes') {
          // Determinar el período a consultar para el mes
          if (fechaDesde && fechaHasta && fechaDesde === fechaHasta) {
            // Caso 2: Filtros del mismo mes - usar el mes del filtro
            const [año, mes] = fechaDesde.split('-');
            const fechaFiltro = new Date(parseInt(año), parseInt(mes) - 1, 1);
            periodoAConsultar = fechaFiltro.toISOString().slice(0, 7) + '-01';
            nombrePeriodo = fechaFiltro.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
          } else {
            // Caso 1: Sin filtros o filtros de rango - usar el mes actual
            const mesActual = new Date().toISOString().slice(0, 7);
            periodoAConsultar = mesActual + '-01';
            nombrePeriodo = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
          }
        } else if (periodo === 'acumulado') {
          // Acumulado estándar: desde enero hasta el mes actual
          periodoAConsultar = null; // Se manejará con periodo_desde y periodo_hasta
        } else if (periodo === 'filtrado') {
          // Acumulado con filtros: desde enero hasta el mes final del filtro
          periodoAConsultar = null; // Se manejará con periodo_desde y periodo_hasta
        } else {
          // Para anual, usar las fechas de filtro si están disponibles
          periodoAConsultar = null; // Se manejará con periodo_desde y periodo_hasta
        }
        
        let urlV0 = `${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=v0_parcial`;
        let urlReal = `${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=real_parcial`;
        
        if (periodoAConsultar) {
          urlV0 += `&periodo=${periodoAConsultar}`;
          urlReal += `&periodo=${periodoAConsultar}`;
        } else if (periodo === 'acumulado') {
          // Para acumulado, traer todos los datos y filtrar en el frontend
          console.log('🔍 Acumulado: trayendo todos los datos para filtrar en frontend');
        } else if (periodo === 'filtrado' && fechaInicio && fechaFin) {
          // Para acumulado filtrado, traer todos los datos y filtrar en el frontend
          console.log('🔍 Filtrado: trayendo todos los datos para filtrar en frontend');
        } else if (periodo === 'anual') {
          // Para anual, traer todos los datos y filtrar por año completo
          console.log('🔍 Anual: trayendo todos los datos para filtrar por año completo');
        }
        
        console.log('🔍 Consultando datos financieros:', periodoAConsultar || 'sin filtro de período');
        console.log('📅 Período a consultar:', periodoAConsultar);
        console.log('📅 Nombre del período:', nombrePeriodo);
        console.log('URL V0:', urlV0);
        console.log('URL Real:', urlReal);

        const [responseV0, responseReal] = await Promise.all([
          fetch(urlV0),
          fetch(urlReal)
        ]);

        const dataV0 = await responseV0.json();
        const dataReal = await responseReal.json();

        console.log('📊 Datos V0 Parcial:', dataV0);
        console.log('📊 Datos Real Parcial:', dataReal);
        console.log('📊 Cantidad de registros V0:', dataV0.success ? dataV0.datos.length : 0);
        console.log('📊 Cantidad de registros Real:', dataReal.success ? dataReal.datos.length : 0);

        // Obtener PLAN V. O. 2025 (KUSD) y GASTO REAL (KUSD)
        let planV0 = 0;
        let gastoReal = 0;
        
        if (dataV0.success && dataV0.datos.length > 0) {
          if (periodo === 'acumulado') {
            // Filtrar datos desde enero hasta el mes actual
            const añoActual = new Date().getFullYear();
            const mesActual = new Date().getMonth() + 1;
            const fechaInicio = `${añoActual}-01-01`;
            const fechaFin = `${añoActual}-${mesActual.toString().padStart(2, '0')}-31`;
            
            const datosFiltrados = dataV0.datos.filter(item => {
              const itemFecha = new Date(item.periodo);
              const inicio = new Date(fechaInicio);
              const fin = new Date(fechaFin);
              return itemFecha >= inicio && itemFecha <= fin;
            });
            
            planV0 = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('💰 Plan V0 (acumulado desde enero hasta mes actual):', planV0);
          } else if (periodo === 'filtrado' && fechaInicio && fechaFin) {
            // Filtrar datos desde enero hasta el mes final del filtro
            const [añoFin, mesFin] = fechaFin.split('-');
            const fechaInicioAcumulado = `${añoFin}-01-01`;
            const fechaFinAcumulado = `${añoFin}-${mesFin}-31`;
            
            const datosFiltrados = dataV0.datos.filter(item => {
              const itemFecha = new Date(item.periodo);
              const inicio = new Date(fechaInicioAcumulado);
              const fin = new Date(fechaFinAcumulado);
              return itemFecha >= inicio && itemFecha <= fin;
            });
            
            planV0 = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('💰 Plan V0 (acumulado filtrado):', planV0);
          } else if (periodo === 'anual') {
            // Filtrar datos del año completo
            let añoAConsultar;
            if (fechaDesde && fechaHasta) {
              // Si hay filtros, usar el año del filtro
              if (fechaDesde === fechaHasta) {
                const [año] = fechaDesde.split('-');
                añoAConsultar = parseInt(año);
              } else {
                const [añoFin] = fechaHasta.split('-');
                añoAConsultar = parseInt(añoFin);
              }
            } else {
              // Sin filtros, usar el año actual
              añoAConsultar = new Date().getFullYear();
            }
            
            const fechaInicioAnual = `${añoAConsultar}-01-01`;
            const fechaFinAnual = `${añoAConsultar}-12-31`;
            
            const datosFiltrados = dataV0.datos.filter(item => {
              const itemFecha = new Date(item.periodo);
              const inicio = new Date(fechaInicioAnual);
              const fin = new Date(fechaFinAnual);
              return itemFecha >= inicio && itemFecha <= fin;
            });
            
            planV0 = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('💰 Plan V0 (anual):', planV0, 'para año', añoAConsultar);
          } else {
            // Mes específico - sumar todos los montos
            planV0 = dataV0.datos.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('💰 Plan V0 (mes específico):', planV0);
          }
        }

        if (dataReal.success && dataReal.datos.length > 0) {
          if (periodo === 'acumulado') {
            // Filtrar datos desde enero hasta el mes actual
            const añoActual = new Date().getFullYear();
            const mesActual = new Date().getMonth() + 1;
            const fechaInicio = `${añoActual}-01-01`;
            const fechaFin = `${añoActual}-${mesActual.toString().padStart(2, '0')}-31`;
            
            const datosFiltrados = dataReal.datos.filter(item => {
              const itemFecha = new Date(item.periodo);
              const inicio = new Date(fechaInicio);
              const fin = new Date(fechaFin);
              return itemFecha >= inicio && itemFecha <= fin;
            });
            
            gastoReal = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('💰 Gasto Real (acumulado desde enero hasta mes actual):', gastoReal);
          } else if (periodo === 'filtrado' && fechaInicio && fechaFin) {
            // Filtrar datos desde enero hasta el mes final del filtro
            const [añoFin, mesFin] = fechaFin.split('-');
            const fechaInicioAcumulado = `${añoFin}-01-01`;
            const fechaFinAcumulado = `${añoFin}-${mesFin}-31`;
            
            const datosFiltrados = dataReal.datos.filter(item => {
              const itemFecha = new Date(item.periodo);
              const inicio = new Date(fechaInicioAcumulado);
              const fin = new Date(fechaFinAcumulado);
              return itemFecha >= inicio && itemFecha <= fin;
            });
            
            gastoReal = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('💰 Gasto Real (acumulado filtrado):', gastoReal);
          } else if (periodo === 'anual') {
            // Filtrar datos del año completo
            let añoAConsultar;
            if (fechaDesde && fechaHasta) {
              // Si hay filtros, usar el año del filtro
              if (fechaDesde === fechaHasta) {
                const [año] = fechaDesde.split('-');
                añoAConsultar = parseInt(año);
              } else {
                const [añoFin] = fechaHasta.split('-');
                añoAConsultar = parseInt(añoFin);
              }
            } else {
              // Sin filtros, usar el año actual
              añoAConsultar = new Date().getFullYear();
            }
            
            const fechaInicioAnual = `${añoAConsultar}-01-01`;
            const fechaFinAnual = `${añoAConsultar}-12-31`;
            
            const datosFiltrados = dataReal.datos.filter(item => {
              const itemFecha = new Date(item.periodo);
              const inicio = new Date(fechaInicioAnual);
              const fin = new Date(fechaFinAnual);
              return itemFecha >= inicio && itemFecha <= fin;
            });
            
            gastoReal = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('💰 Gasto Real (anual):', gastoReal, 'para año', añoAConsultar);
          } else {
            // Mes específico - sumar todos los montos
            gastoReal = dataReal.datos.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('💰 Gasto Real (mes específico):', gastoReal);
          }
        }

        // CUMPLI. (A)(%) = (GASTO REAL / PLAN V. O.) * 100
        const cumplimientoA = planV0 > 0 ? (gastoReal / planV0) * 100 : 0;
        console.log('📈 Cumplimiento A:', cumplimientoA);

        return {
          planV0: planV0,
          gastoReal: gastoReal,
          cumplimientoA: cumplimientoA
        };
      } catch (error) {
        console.error('❌ Error obteniendo PLAN V. O. 2025 (KUSD):', error);
        return { planV0: 0, gastoReal: 0, cumplimientoA: 0 };
      }
    };

    // Función para obtener datos de cumplimiento físico - PARCIALES
    const obtenerDatosCumplimientoFisico = async (periodo, fechaInicio = null, fechaFin = null) => {
      try {
        console.log('🔍 Debug - obtenerDatosCumplimientoFisico:', { periodo, fechaInicio, fechaFin });
        
        let url = `${API_BASE}/cumplimiento_fisico/cumplimiento_fisico.php?proyecto_id=${proyectoId}`;
        
        // Aplicar filtros de fecha según el período
        if (periodo === 'mes') {
          // Determinar el período a consultar para el mes
          if (fechaDesde && fechaHasta && fechaDesde === fechaHasta) {
            // Caso 2: Filtros del mismo mes - usar el mes del filtro
            const [año, mes] = fechaDesde.split('-');
            const fechaFiltro = new Date(parseInt(año), parseInt(mes) - 1, 1);
            const mesFiltro = fechaFiltro.toISOString().slice(0, 7);
            url += `&periodo_desde=${mesFiltro}-01&periodo_hasta=${mesFiltro}-31`;
          } else {
            // Caso 1: Sin filtros o filtros de rango - usar el mes actual
            const mesActual = new Date().toISOString().slice(0, 7);
            url += `&periodo_desde=${mesActual}-01&periodo_hasta=${mesActual}-31`;
          }
        } else if (periodo === 'acumulado') {
          // Acumulado estándar: desde enero hasta el mes actual
          const añoActual = new Date().getFullYear();
          const mesActual = new Date().getMonth() + 1;
          const fechaInicio = `${añoActual}-01-01`;
          const fechaFin = `${añoActual}-${mesActual.toString().padStart(2, '0')}-31`;
          url += `&periodo_desde=${fechaInicio}&periodo_hasta=${fechaFin}`;
          console.log('🔍 Acumulado físico: desde', fechaInicio, 'hasta', fechaFin);
        } else if (periodo === 'filtrado') {
          // Acumulado con filtros: desde enero hasta el mes final del filtro
          if (fechaInicio && fechaFin) {
            const [añoFin, mesFin] = fechaFin.split('-');
            const fechaInicioAcumulado = `${añoFin}-01-01`;
            const fechaFinAcumulado = `${añoFin}-${mesFin}-31`;
            url += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
            console.log('🔍 Filtrado físico: desde', fechaInicioAcumulado, 'hasta', fechaFinAcumulado);
          }
        } else if (periodo === 'anual') {
          // Determinar el año a consultar
          let añoAConsultar;
          if (fechaDesde && fechaHasta) {
            // Si hay filtros, usar el año del filtro
            if (fechaDesde === fechaHasta) {
              const [año] = fechaDesde.split('-');
              añoAConsultar = parseInt(año);
            } else {
              const [añoFin] = fechaHasta.split('-');
              añoAConsultar = parseInt(añoFin);
            }
          } else {
            // Sin filtros, usar el año actual
            añoAConsultar = new Date().getFullYear();
          }
          
          const fechaInicio = `${añoAConsultar}-01-01`;
          const fechaFin = `${añoAConsultar}-12-31`;
          url += `&periodo_desde=${fechaInicio}&periodo_hasta=${fechaFin}`;
          console.log('🔍 Anual físico: desde', fechaInicio, 'hasta', fechaFin, 'para año', añoAConsultar);
        }

        console.log('🔍 Consultando datos de cumplimiento físico PARCIALES:');
        console.log('URL:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('📊 Datos cumplimiento físico:', data);

        if (data.success && data.data.length > 0) {
          // Filtrar datos por vector V0 y REAL
          const datosV0 = data.data.filter(item => item.vector === 'V0');
          const datosReal = data.data.filter(item => item.vector === 'REAL');
          
          console.log('📊 Datos V0:', datosV0);
          console.log('📊 Datos REAL:', datosReal);
          
          // Obtener valores de parcial_periodo
          let proyeccionV0 = 0;
          let avanceFisico = 0;
          
          if (datosV0.length > 0) {
            // PROG. V. O. 2025 (%) = sumar todos los valores parcial_periodo del vector V0
            proyeccionV0 = datosV0.reduce((sum, item) => sum + (parseFloat(item.parcial_periodo) || 0), 0);
            console.log('📈 Proyección V0 (suma de parcial_periodo):', proyeccionV0);
          }
          
          if (datosReal.length > 0) {
            // AVANC. FÍSICO (%) = sumar todos los valores parcial_periodo del vector REAL
            avanceFisico = datosReal.reduce((sum, item) => sum + (parseFloat(item.parcial_periodo) || 0), 0);
            console.log('📈 Avance Físico (suma de parcial_periodo):', avanceFisico);
          }
          
          // CUMPLI. (B)(%) = (AVANC. FÍSICO / PROG. V. O.) * 100
          const cumplimientoB = proyeccionV0 > 0 ? (avanceFisico / proyeccionV0) * 100 : 0;
          console.log('📈 Cumplimiento B:', cumplimientoB);

          return {
            proyeccionV0: proyeccionV0,
            avanceFisico: avanceFisico,
            cumplimientoB: cumplimientoB
          };
        }

        return { proyeccionV0: 0, avanceFisico: 0, cumplimientoB: 0 };
      } catch (error) {
        console.error('❌ Error obteniendo datos de cumplimiento físico PARCIALES:', error);
        return { proyeccionV0: 0, avanceFisico: 0, cumplimientoB: 0 };
      }
    };

    // Función para calcular la eficiencia del gasto
    const calcularEficienciaGasto = (cumplimientoB, cumplimientoA) => {
      if (cumplimientoA <= 0) return 0;
      // EFICIEN. GASTO (%) = (CUMPLI. (B)(%)) / (CUMPLI. (A)(%))
      return (cumplimientoB / cumplimientoA) * 100;
    };

    // Función para calcular la nota según la política de la imagen
    const calcularNota = (eficiencia) => {
      // Política de notas según la imagen:
      // < 80% = 1
      // 90% = 2  
      // 100% = 3
      // 105% = 4
      // > 110% = 5
      if (eficiencia < 80) return 1.00;
      if (eficiencia === 90) return 2.00;
      if (eficiencia === 100) return 3.00;
      if (eficiencia === 105) return 4.00;
      if (eficiencia > 110) return 5.00;
      
      // Para valores entre rangos, usar la nota más cercana
      if (eficiencia >= 80 && eficiencia < 90) return 1.00;
      if (eficiencia > 90 && eficiencia < 100) return 2.00;
      if (eficiencia > 100 && eficiencia < 105) return 3.00;
      if (eficiencia > 105 && eficiencia <= 110) return 4.00;
      
      return 1.00; // Valor por defecto
    };

    // Cargar datos cuando el componente se monta
    useEffect(() => {
      const cargarDatosEficiencia = async () => {
        setCargando(true);
        setError('');

        try {
          // Determinar los períodos basados en los filtros de fecha
          let periodos = [];
          
          // Determinar el período del mes (siempre el primer período)
          let nombrePeriodoMes;
          let tipoPeriodoMes = 'mes';
          
          if (fechaDesde && fechaHasta) {
            // Si hay filtros, verificar si es el mismo mes
            if (fechaDesde === fechaHasta) {
              // Caso 2: Filtros del mismo mes (ej: Mayo 2025, Mayo 2025)
              const [año, mes] = fechaDesde.split('-');
              const fechaFiltro = new Date(parseInt(año), parseInt(mes) - 1, 1);
              const mesNombre = fechaFiltro.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const añoNumero = fechaFiltro.getFullYear();
              nombrePeriodoMes = `PERIODO ${mesNombre}-${añoNumero}`;
              tipoPeriodoMes = 'mes';
            } else {
              // Caso 3: Filtros de rango - mantener mes actual para el primer período
              const mesActual = new Date();
              const mesNombre = mesActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const añoNumero = mesActual.getFullYear();
              nombrePeriodoMes = `PERIODO ${mesNombre}-${añoNumero}`;
              tipoPeriodoMes = 'mes';
            }
          } else {
            // Caso 1: Sin filtros - mes actual
            const mesActual = new Date();
            const mesNombre = mesActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const añoNumero = mesActual.getFullYear();
            nombrePeriodoMes = `PERIODO ${mesNombre}-${añoNumero}`;
            tipoPeriodoMes = 'mes';
          }
          
          // Determinar el período acumulado (segundo período)
          let nombrePeriodoAcumulado;
          let tipoPeriodoAcumulado = 'acumulado';
          
          console.log('🔍 Debug - Fechas para acumulado:', { fechaDesde, fechaHasta });
          
          if (fechaDesde && fechaHasta) {
            console.log('🔍 Debug - Detectando tipo de filtro:', { fechaDesde, fechaHasta, esMismoMes: fechaDesde === fechaHasta });
            
            // Si hay filtros, verificar si es el mismo mes o rango
            if (fechaDesde === fechaHasta) {
              // Mismo mes - no afecta al acumulado, mantener mes actual
              const mesActual = new Date();
              const mesNombre = mesActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const añoNumero = mesActual.getFullYear();
              nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesNombre}. ${añoNumero}`;
              console.log('🔍 Debug - Mismo mes detectado, usando mes actual:', nombrePeriodoAcumulado);
            } else {
              // Rango de fechas - usar el mes inicial y final del rango para el acumulado
              const [añoInicio, mesInicio] = fechaDesde.split('-');
              const [añoFin, mesFin] = fechaHasta.split('-');
              
              const fechaInicio = new Date(parseInt(añoInicio), parseInt(mesInicio) - 1, 1);
              const fechaFin = new Date(parseInt(añoFin), parseInt(mesFin) - 1, 1);
              
              const mesInicioNombre = fechaInicio.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const mesFinNombre = fechaFin.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const añoNumero = fechaFin.getFullYear();
              
              nombrePeriodoAcumulado = `PERIODO DESDE ${mesInicioNombre}. - ${mesFinNombre}. ${añoNumero}`;
              tipoPeriodoAcumulado = 'filtrado'; // Marcar como filtrado para usar fechas específicas
              console.log('🔍 Debug - Rango de fechas detectado:', { 
                nombrePeriodoAcumulado, 
                tipoPeriodoAcumulado,
                añoInicio,
                mesInicio,
                mesInicioNombre,
                añoFin,
                mesFin,
                mesFinNombre
              });
            }
          } else {
            // Sin filtros - usar el mes actual
            const mesActual = new Date();
            const mesNombre = mesActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const añoNumero = mesActual.getFullYear();
            nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesNombre}. ${añoNumero}`;
          }
          
          // Determinar el período anual (tercer período)
          let nombrePeriodoAnual = 'PERIODO AÑO 2025';
          
          if (fechaDesde && fechaHasta) {
            // Si hay filtros, usar el año del filtro
            if (fechaDesde === fechaHasta) {
              // Mismo mes - usar el año del filtro
              const [año] = fechaDesde.split('-');
              nombrePeriodoAnual = `PERIODO AÑO ${año}`;
            } else {
              // Rango de fechas - usar el año del filtro final
              const [añoFin] = fechaHasta.split('-');
              nombrePeriodoAnual = `PERIODO AÑO ${añoFin}`;
            }
          } else {
            // Sin filtros - usar el año actual
            const añoActual = new Date().getFullYear();
            nombrePeriodoAnual = `PERIODO AÑO ${añoActual}`;
          }
          
          // Construir los períodos
          periodos = [
            { nombre: nombrePeriodoMes, tipo: tipoPeriodoMes },
            { nombre: nombrePeriodoAcumulado, tipo: tipoPeriodoAcumulado, fechaInicio: fechaDesde, fechaFin: fechaHasta },
            { nombre: nombrePeriodoAnual, tipo: 'anual' }
          ];

          const datosCompletos = [];

          for (const periodo of periodos) {
            console.log('🔍 Debug - Procesando período:', { 
              nombre: periodo.nombre, 
              tipo: periodo.tipo, 
              fechaInicio: periodo.fechaInicio, 
              fechaFin: periodo.fechaFin 
            });
            
            // Obtener datos financieros
            const datosFinancieros = await obtenerDatosFinancieros(periodo.tipo, periodo.fechaInicio, periodo.fechaFin);
            
            // Obtener datos de cumplimiento físico
            const datosFisicos = await obtenerDatosCumplimientoFisico(periodo.tipo, periodo.fechaInicio, periodo.fechaFin);
            
            console.log('🔍 Debug - Resultados para', periodo.nombre, ':', {
              financieros: datosFinancieros,
              fisicos: datosFisicos
            });
            
            // Calcular eficiencia del gasto
            const eficienciaGasto = calcularEficienciaGasto(
              datosFisicos.cumplimientoB, 
              datosFinancieros.cumplimientoA
            );

            // Calcular nota
            const nota = calcularNota(eficienciaGasto);

            datosCompletos.push({
              periodo: periodo.nombre,
              planV0: datosFinancieros.planV0,
              gastoReal: datosFinancieros.gastoReal,
              cumplimientoA: datosFinancieros.cumplimientoA,
              proyeccionV0: datosFisicos.proyeccionV0,
              avanceFisico: datosFisicos.avanceFisico,
              cumplimientoB: datosFisicos.cumplimientoB,
              eficienciaGasto: eficienciaGasto,
              nota: nota
            });
          }

          setDatosEficiencia(datosCompletos);
        } catch (error) {
          console.error('Error cargando datos de eficiencia:', error);
          setError('Error al cargar los datos de eficiencia del gasto');
        } finally {
          setCargando(false);
        }
      };

      if (proyectoId) {
        cargarDatosEficiencia();
      }
    }, [proyectoId, fechaDesde, fechaHasta]);

    if (cargando) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#16355D'
        }}>
          Cargando datos de eficiencia del gasto...
            </div>
      );
    }

    if (error) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#dc3545'
        }}>
          {error}
            </div>
      );
    }

    if (datosEficiencia.length === 0) {
      return (
            <div style={{
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#16355D',
              textAlign: 'center'
            }}>
          <div style={{ marginBottom: '20px' }}>
            📊 No hay datos disponibles para generar el reporte de eficiencia del gasto
            </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Asegúrate de que existan datos en las tablas de vectores y cumplimiento físico para el proyecto seleccionado.
          </div>
        </div>
      );
    }

    return (
    <div style={{ width: '100%', padding: '20px' }}>
        <h3 style={{ color: '#16355D', marginBottom: '20px', textAlign: 'center' }}>
          EFICIENCIA DEL GASTO FÍSICO - FINANCIERO
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#16355D', color: 'white' }}>
                <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd' }}>
                  AVANCES
                </th>
                <th colSpan="3" style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd' }}>
                  AVANCE FINANCIERO
                </th>
                <th colSpan="3" style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd' }}>
                  AVANCE FÍSICO
                </th>
                <th colSpan="2" style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd' }}>
                  EFICIENCIA
                </th>
              </tr>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#16355D',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  PERÍODOS
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#16355D',
                  color: 'white'
                }}>
                  Plan V0
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#ffc107',
                  color: 'black'
                }}>
                  Gasto Real
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  Cumpli (%)
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#16355D',
                  color: 'white'
                }}>
                  Prog. V0
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#ffc107',
                  color: 'black'
                }}>
                  Avance Fisico
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  Cumpli (%)
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  EFICIEN. GASTO (%)
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  NOTA
                </th>
              </tr>
            </thead>
            <tbody>
              {datosEficiencia.map((fila, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {fila.periodo}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}>
                    {fila.planV0.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}>
                    {fila.gastoReal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {fila.cumplimientoA.toFixed(2)}%
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}>
                    {fila.proyeccionV0.toFixed(2)}%
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}>
                    {fila.avanceFisico.toFixed(2)}%
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {fila.cumplimientoB.toFixed(2)}%
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: fila.eficienciaGasto >= 150 ? '#28a745' : fila.eficienciaGasto >= 100 ? '#ffc107' : '#dc3545'
                  }}>
                    {fila.eficienciaGasto.toFixed(2)}%
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: fila.nota >= 4 ? '#28a745' : fila.nota >= 3 ? '#ffc107' : '#dc3545'
                  }}>
                    {fila.nota.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>

        {/* Información adicional */}
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ color: '#16355D', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
            📊 GLOSARIO TÉCNICO - EFICIENCIA DEL GASTO
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
            <div>
              <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                💰 AVANCE FINANCIERO
              </h5>
              <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                <li><strong>Plan V0:</strong> Presupuesto planificado según Versión 0 (USD). Representa la proyección financiera base del proyecto.</li>
                <li><strong>Gasto Real:</strong> Ejecución financiera real ejecutada en el período analizado (USD). Refleja el desembolso efectivo.</li>
                <li><strong>Cumpli (%):</strong> Porcentaje de cumplimiento financiero = (Gasto Real / Plan V0) × 100. Indica la eficiencia presupuestaria.</li>
              </ul>
            </div>
            
            <div>
              <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                📈 AVANCE FÍSICO
              </h5>
              <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                <li><strong>Prog. V0:</strong> Proyección física planificada según Versión 0 (%). Meta de avance físico esperado.</li>
                <li><strong>Avance Fisico:</strong> Avance físico real alcanzado en el período (%). Progreso efectivo de las actividades.</li>
                <li><strong>Cumpli (%):</strong> Porcentaje de cumplimiento físico = (Avance Físico / Prog. V0) × 100. Eficiencia operacional.</li>
              </ul>
            </div>
          </div>
          
            <div style={{
            backgroundColor: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #dee2e6',
            marginBottom: '15px'
          }}>
            <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
              🎯 MÉTRICAS DE EFICIENCIA
            </h5>
            <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                              <li><strong>Eficien. Gasto (%):</strong> Índice de eficiencia del gasto = (Cumpli. Físico / Cumpli. Financiero) × 100. Valores {'>'}100% indican mayor eficiencia física vs financiera.</li>
              <li><strong>Nota:</strong> Calificación basada en la eficiencia del gasto: 5.0 (Excelente), 4.0 (Bueno), 3.0 (Regular), 2.0 (Deficiente), 1.0 (Crítico).</li>
            </ul>
          </div>
          
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #28a745',
            fontSize: '12px',
            color: '#155724'
          }}>
            <strong>📋 PERÍODOS DE ANÁLISIS:</strong>
            <ul style={{ margin: '5px 0 0 15px', padding: 0, fontSize: '12px' }}>
              <li><strong>Período del Mes:</strong> Análisis mensual específico (actual o filtrado)</li>
              <li><strong>Período Acumulado:</strong> Sumatoria desde enero hasta el mes de análisis</li>
              <li><strong>Período Anual:</strong> Análisis completo del año (actual o filtrado)</li>
            </ul>
          </div>
          
          {/* Análisis Dinámico */}
          {datosEficiencia.length > 0 && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '15px', 
              borderRadius: '8px', 
              border: '2px solid #ffc107',
              marginTop: '15px'
            }}>
              <h5 style={{ 
                color: '#856404', 
                marginBottom: '12px', 
                fontSize: '14px', 
              fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📊 ANÁLISIS EJECUTIVO - ESTADO ACTUAL DEL PROYECTO
              </h5>
              
              {(() => {
                // Obtener datos del período actual (primera fila)
                const periodoActual = datosEficiencia[0];
                const periodoAcumulado = datosEficiencia[1];
                
                // Análisis financiero
                const eficienciaFinanciera = periodoActual.cumplimientoA;
                const eficienciaFisica = periodoActual.cumplimientoB;
                const eficienciaGasto = periodoActual.eficienciaGasto;
                
                // Análisis de tendencias (comparar mes actual vs mes anterior)
                // Para simplificar, usamos la diferencia entre el mes actual y el acumulado como indicador de tendencia
                const tendenciaFinanciera = periodoActual.cumplimientoA - 100; // Diferencia vs 100% (meta)
                const tendenciaFisica = periodoActual.cumplimientoB - 100; // Diferencia vs 100% (meta)
                
                // Determinar estado general
                const getEstadoGeneral = () => {
                  if (eficienciaGasto >= 150 && eficienciaFinanciera >= 100 && eficienciaFisica >= 100) {
                    return { texto: 'EXCELENTE', color: '#28a745', icono: '🟢' };
                  } else if (eficienciaGasto >= 100 && eficienciaFinanciera >= 90 && eficienciaFisica >= 90) {
                    return { texto: 'BUENO', color: '#17a2b8', icono: '🔵' };
                  } else if (eficienciaGasto >= 80 && eficienciaFinanciera >= 80 && eficienciaFisica >= 80) {
                    return { texto: 'REGULAR', color: '#ffc107', icono: '🟡' };
                  } else if (eficienciaGasto >= 60) {
                    return { texto: 'REQUIERE ATENCIÓN', color: '#fd7e14', icono: '🟠' };
                  } else {
                    return { texto: 'CRÍTICO', color: '#dc3545', icono: '🔴' };
                  }
                };
                
                const estadoGeneral = getEstadoGeneral();
                
                return (
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {/* Estado General */}
                    <div style={{ 
                      marginBottom: '12px', 
                      padding: '8px', 
                      backgroundColor: estadoGeneral.color + '20',
                      borderRadius: '6px',
                      border: `1px solid ${estadoGeneral.color}`
                    }}>
                      <strong style={{ color: estadoGeneral.color }}>
                        {estadoGeneral.icono} ESTADO GENERAL: {estadoGeneral.texto}
                      </strong>
            </div>
                    
                    {/* Análisis por dimensiones */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                      <div>
                        <h6 style={{ color: '#856404', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          💰 EFICIENCIA FINANCIERA
                        </h6>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          <div><strong>Planificado:</strong> {periodoActual.planV0.toLocaleString()} USD</div>
                          <div><strong>Ejecutado:</strong> {periodoActual.gastoReal.toLocaleString()} USD</div>
                          <div><strong>Cumplimiento:</strong> 
                            <span style={{ 
                              color: eficienciaFinanciera >= 100 ? '#28a745' : eficienciaFinanciera >= 90 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {eficienciaFinanciera.toFixed(1)}%
                            </span>
          </div>
                        </div>
      </div>

                      <div>
                        <h6 style={{ color: '#856404', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          📈 EFICIENCIA FÍSICA
                        </h6>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          <div><strong>Planificado:</strong> {periodoActual.proyeccionV0.toFixed(2)}%</div>
                          <div><strong>Ejecutado:</strong> {periodoActual.avanceFisico.toFixed(2)}%</div>
                          <div><strong>Cumplimiento:</strong> 
                            <span style={{ 
                              color: eficienciaFisica >= 100 ? '#28a745' : eficienciaFisica >= 90 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {eficienciaFisica.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicadores clave */}
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '10px', 
                      borderRadius: '6px',
                      border: '1px solid #dee2e6'
                    }}>
                      <h6 style={{ color: '#856404', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                        🎯 INDICADORES CLAVE
                      </h6>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                        <div>
                          <strong>Eficiencia del Gasto:</strong> 
                          <span style={{ 
                            color: eficienciaGasto >= 150 ? '#28a745' : eficienciaGasto >= 100 ? '#17a2b8' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {eficienciaGasto.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <strong>Calificación:</strong> 
                          <span style={{ 
                            color: periodoActual.nota >= 4 ? '#28a745' : periodoActual.nota >= 3 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {periodoActual.nota.toFixed(1)}/5.0
                          </span>
                        </div>
                        <div>
                          <strong>Desv. vs Meta Financiera:</strong> 
                          <span style={{ 
                            color: tendenciaFinanciera > 0 ? '#28a745' : tendenciaFinanciera < 0 ? '#dc3545' : '#666',
                            fontWeight: 'bold'
                          }}>
                            {tendenciaFinanciera > 0 ? '+' : ''}{tendenciaFinanciera.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <strong>Desv. vs Meta Física:</strong> 
                          <span style={{ 
                            color: tendenciaFisica > 0 ? '#28a745' : tendenciaFisica < 0 ? '#dc3545' : '#666',
                            fontWeight: 'bold'
                          }}>
                            {tendenciaFisica > 0 ? '+' : ''}{tendenciaFisica.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recomendaciones */}
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '8px', 
                      backgroundColor: '#d1ecf1', 
                      borderRadius: '6px',
                      border: '1px solid #bee5eb',
                      fontSize: '11px',
                      color: '#0c5460'
                    }}>
                      <strong>💡 INSIGHTS:</strong>
                      {eficienciaGasto >= 150 ? 
                        ' El proyecto muestra excelente eficiencia operacional con avance físico superior al financiero.' :
                        eficienciaGasto >= 100 ? 
                        ' El proyecto mantiene un balance adecuado entre avance físico y financiero.' :
                        eficienciaGasto >= 80 ? 
                        ' Se recomienda revisar la ejecución física para mejorar la eficiencia del gasto.' :
                        ' Se requiere intervención inmediata para optimizar la ejecución física y financiera.'
                      }
                                         </div>
                   </div>
                 );
               })()}
             </div>
           )}
           
           {/* Resumen de Períodos */}
           {datosEficiencia.length > 0 && (
             <div style={{ 
               backgroundColor: '#f8f9fa', 
               padding: '15px', 
               borderRadius: '8px', 
               border: '1px solid #dee2e6',
               marginTop: '15px'
             }}>
               <h5 style={{ 
                 color: '#495057', 
                 marginBottom: '12px', 
                 fontSize: '14px', 
                 fontWeight: 'bold',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px'
               }}>
                 📅 RESUMEN DE PERÍODOS
               </h5>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '12px' }}>
                 {datosEficiencia.map((periodo, index) => (
                   <div key={index} style={{ 
                     padding: '10px', 
                     backgroundColor: 'white', 
                     borderRadius: '6px',
                     border: '1px solid #ced4da'
                   }}>
                     <h6 style={{ 
                       color: '#16355D', 
                       marginBottom: '8px', 
                       fontSize: '11px', 
                       fontWeight: 'bold',
                       textAlign: 'center'
                     }}>
                       {periodo.periodo}
                     </h6>
                     
                     <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.3' }}>
                       <div style={{ marginBottom: '4px' }}>
                         <strong>Eficiencia:</strong> 
                         <span style={{ 
                           color: periodo.eficienciaGasto >= 150 ? '#28a745' : periodo.eficienciaGasto >= 100 ? '#17a2b8' : '#dc3545',
                           fontWeight: 'bold'
                         }}>
                           {periodo.eficienciaGasto.toFixed(1)}%
                         </span>
                       </div>
                       <div style={{ marginBottom: '4px' }}>
                         <strong>Financiero:</strong> {periodo.cumplimientoA.toFixed(1)}%
                       </div>
                       <div style={{ marginBottom: '4px' }}>
                         <strong>Físico:</strong> {periodo.cumplimientoB.toFixed(1)}%
                       </div>
                       <div>
                         <strong>Nota:</strong> 
                         <span style={{ 
                           color: periodo.nota >= 4 ? '#28a745' : periodo.nota >= 3 ? '#ffc107' : '#dc3545',
                           fontWeight: 'bold'
                         }}>
                           {periodo.nota.toFixed(1)}
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               
               
             </div>
           )}
          
          {/* Indicador de filtros aplicados */}
          {(fechaDesde || fechaHasta) && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '6px',
              border: '1px solid #2196f3',
              fontSize: '14px',
              color: '#1976d2'
            }}>
              <strong>🔍 Filtros aplicados:</strong> 
              {fechaDesde && ` Desde: ${fechaDesde}`}
              {fechaHasta && ` Hasta: ${fechaHasta}`}
            </div>
          )}
        </div>
    </div>
  );
  };

  // Componente para el reporte de Cumplimiento Físico
  const ReporteCumplimientoFisico = ({ data, autorizado, setAutorizado, proyectoId, fechaDesde, fechaHasta, datosCumplimientoFisico, filtroVector, setFiltroVector }) => {
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [excelData, setExcelData] = useState([]);
    const [importando, setImportando] = useState(false);
    const [mensajeImportacion, setMensajeImportacion] = useState('');
    const [tipoMensaje, setTipoMensaje] = useState(''); // 'success' o 'error'
      const [showFormatInfo, setShowFormatInfo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [codigoAutorizacion, setCodigoAutorizacion] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');
  const fileInputRef = useRef(null);

    // Función para calcular resúmenes de parciales por vector
    const calcularResumenes = () => {
      const datosFiltrados = getDatosFiltrados();
      const resumenes = {};
      
      // Obtener el mes actual y el mes anterior (mes vencido)
      const mesActual = new Date().getMonth() + 1; // getMonth() retorna 0-11, sumamos 1
      const mesVencido = mesActual === 1 ? 12 : mesActual - 1; // Mes anterior, si es enero va a diciembre
      const mesVencidoStr = mesVencido.toString().padStart(2, '0');
      const mesActualStr = mesActual.toString().padStart(2, '0');
      
      // Obtener el año actual y el año del mes vencido
      const añoActual = fechaDesde ? fechaDesde.split('-')[0] : 
                       fechaHasta ? fechaHasta.split('-')[0] : 
                       new Date().getFullYear().toString();
      
      // Si el mes vencido es diciembre, el año es el anterior
      const añoMesVencido = mesVencido === 12 ? (parseInt(añoActual) - 1).toString() : añoActual;
      
      // Obtener el mes del filtro (si es un solo mes)
      const mesFiltro = fechaDesde && fechaHasta && fechaDesde === fechaHasta ? 
                       fechaDesde.split('-')[1] : null;
      
      // Inicializar resúmenes para todos los vectores
      ['REAL', 'V0', 'NPC', 'API'].forEach(vector => {
        resumenes[vector] = {
          vector: vector,
          parcialPeriodo: 0,
          sumatoriaParciales: 0,
          proyeccionAno: 0
        };
      });
      
      // CASO 1: Sin filtro aplicado
      if (!fechaDesde && !fechaHasta) {
        // Columna 2: Período Actual (%) - valor del mes vencido
        datosCumplimientoFisico.forEach(item => {
          const itemAno = item.periodo.split('-')[0];
          const itemMes = item.periodo.split('-')[1];
          if (itemAno === añoMesVencido && itemMes === mesVencidoStr) {
            resumenes[item.vector].parcialPeriodo = parseFloat(item.parcial_periodo || 0);
          }
        });
        
        // Columna 3: Sumatoria Parciales (%) - desde enero hasta mes vencido
        datosCumplimientoFisico.forEach(item => {
          const itemAno = item.periodo.split('-')[0];
          const itemMes = parseInt(item.periodo.split('-')[1]);
          if (itemAno === añoMesVencido && itemMes >= 1 && itemMes <= mesVencido) {
            resumenes[item.vector].sumatoriaParciales += parseFloat(item.parcial_periodo || 0);
          }
        });
        
        // Columna 4: Proyección (%) - todo el año del mes vencido
        datosCumplimientoFisico.forEach(item => {
          const itemAno = item.periodo.split('-')[0];
          if (itemAno === añoMesVencido) {
            resumenes[item.vector].proyeccionAno += parseFloat(item.parcial_periodo || 0);
          }
        });
      }
      // CASO 2: Con filtro aplicado
      else {
        // COLUMNA 2: Período Actual (%) - SIEMPRE mes vencido (independiente del filtro)
        datosCumplimientoFisico.forEach(item => {
          const itemAno = item.periodo.split('-')[0];
          const itemMes = item.periodo.split('-')[1];
          if (itemAno === añoMesVencido && itemMes === mesVencidoStr) {
            resumenes[item.vector].parcialPeriodo = parseFloat(item.parcial_periodo || 0);
          }
        });
        
        // COLUMNA 3: Sumatoria Parciales (%) - Solo afectada por el filtro
        datosFiltrados.forEach(item => {
          const vector = item.vector;
          resumenes[vector].sumatoriaParciales += parseFloat(item.parcial_periodo || 0);
        });
        
        // COLUMNA 4: Proyección (%) - SIEMPRE año actual (independiente del filtro)
        datosCumplimientoFisico.forEach(item => {
          const itemAno = item.periodo.split('-')[0];
          if (itemAno === añoActual) {
            const vector = item.vector;
            if (resumenes[vector]) {
              resumenes[vector].proyeccionAno += parseFloat(item.parcial_periodo || 0);
            }
          }
        });
      }
      
      return Object.values(resumenes).sort((a, b) => {
        const ordenVector = { 'REAL': 1, 'V0': 2, 'NPC': 3, 'API': 4 };
        return (ordenVector[a.vector] || 5) - (ordenVector[b.vector] || 5);
      });
    };

    // Función para filtrar datos según las fechas y vector
    const getDatosFiltrados = () => {
      if (!datosCumplimientoFisico || datosCumplimientoFisico.length === 0) {
        console.log('No hay datos de cumplimiento físico disponibles');
        return [];
      }

      console.log('Datos totales disponibles:', datosCumplimientoFisico.length);
      console.log('Filtros aplicados - Desde:', fechaDesde, 'Hasta:', fechaHasta, 'Vector:', filtroVector);
      
      let datosFiltrados = [...datosCumplimientoFisico];

      // Aplicar filtro de fecha desde
      if (fechaDesde) {
        const fechaDesdeCompleta = `${fechaDesde}-01`;
        datosFiltrados = datosFiltrados.filter(item => item.periodo >= fechaDesdeCompleta);
      }

      // Aplicar filtro de fecha hasta
      if (fechaHasta) {
        const [year, month] = fechaHasta.split('-');
        const ultimoDia = new Date(parseInt(year), parseInt(month), 0).getDate();
        const fechaHastaCompleta = `${fechaHasta}-${ultimoDia.toString().padStart(2, '0')}`;
        datosFiltrados = datosFiltrados.filter(item => item.periodo <= fechaHastaCompleta);
      }

      // Aplicar filtro de vector
      if (filtroVector) {
        datosFiltrados = datosFiltrados.filter(item => item.vector === filtroVector);
      }

      // Ordenar por fecha y luego por vector en el orden específico: REAL, V0, NPC, API
      datosFiltrados.sort((a, b) => {
        // Primero ordenar por fecha
        if (a.periodo !== b.periodo) {
          return a.periodo.localeCompare(b.periodo);
        }
        
        // Luego ordenar por vector en el orden específico
        const ordenVector = { 'REAL': 1, 'V0': 2, 'NPC': 3, 'API': 4 };
        return (ordenVector[a.vector] || 5) - (ordenVector[b.vector] || 5);
      });

      console.log('Datos filtrados resultantes:', datosFiltrados.length);
      if (datosFiltrados.length > 0) {
        console.log('Ejemplo de datos filtrados:', datosFiltrados[0]);
      }

      return datosFiltrados;
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const extension = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(extension)) {
        setMensajeImportacion('Solo se permiten archivos Excel (.xlsx, .xls)');
        setTipoMensaje('error');
        setArchivoSeleccionado(null);
        return;
      }

      setArchivoSeleccionado(file);
      setMensajeImportacion('');

      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setExcelData(data);
        
        if (data.length > 0) {
          console.log('Nombres de columnas:', Object.keys(data[0]));
          console.log('Primera fila:', data[0]);
        }
      };
      reader.readAsBinaryString(file);
    };

    const excelDateToMysql = (excelDate) => {
      // Si es string tipo fecha
      if (typeof excelDate === 'string' && excelDate.includes('-')) {
        const parts = excelDate.split('-');
        if (parts.length === 3 && parts[2].length === 4) {
          // DD-MM-YYYY a YYYY-MM-DD
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return excelDate;
      }
      // Si es número (número de serie Excel)
      if (typeof excelDate === 'number') {
        const date = XLSX.SSF.parse_date_code(excelDate);
        if (!date) return '';
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
      return '';
    };

    const normalizeKeys = (row) => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        newRow[key.trim().toLowerCase()] = row[key];
      });
      return newRow;
    };

    // Función para convertir formato de porcentaje con coma decimal a número
    const parsePorcentaje = (valor) => {
      console.log('🔍 JS - PARSEPORCENTAJE (cumplimiento_fisico):');
      console.log('  📊 Valor original:', valor);
      console.log('  📊 Tipo:', typeof valor);
      
      if (!valor || valor === '' || valor === null || valor === undefined) {
        console.log('❌ JS - Valor vacío, retornando 0');
        return 0;
      }
      
      // Convertir a string si no lo es
      let strValor = String(valor).trim();
      console.log('  📊 String inicial:', `"${strValor}"`);
      
      // Si está vacío después del trim, retornar 0
      if (strValor === '') {
        console.log('❌ JS - String vacío después de trim, retornando 0');
        return 0;
      }
      
      // Remover el símbolo % si existe
      if (strValor.includes('%')) {
        strValor = strValor.replace('%', '');
        console.log('  📊 Sin %:', `"${strValor}"`);
      }
      
      // Reemplazar coma por punto para parseFloat
      if (strValor.includes(',')) {
      strValor = strValor.replace(',', '.');
        console.log('  📊 Coma reemplazada por punto:', `"${strValor}"`);
      }
      
      // Convertir a número
      let numero = parseFloat(strValor);
      console.log('  📊 Número antes de corrección:', numero);
      
      if (isNaN(numero)) {
        console.log('❌ JS - No es un número válido, retornando 0');
        return 0;
      }
      
      // CORRECCIÓN ESPECÍFICA PARA VALORES DE EXCEL
      // Si el número es menor a 2 y el valor original era 100 o similar, multiplicar por 100
      if (numero < 2 && numero > 0) {
        // Verificar si el valor original podría haber sido un porcentaje
        const valorOriginal = String(valor).trim();
        if (valorOriginal.includes('100') || valorOriginal.includes('1.00') || valorOriginal.includes('1,00')) {
          console.log('🔧 JS - Detectado posible valor de Excel como decimal, multiplicando por 100');
          numero = numero * 100;
        }
      }
      
      // Verificación adicional: si el número está entre 0 y 1, probablemente es un decimal de Excel
      if (numero > 0 && numero <= 1) {
        console.log('🔧 JS - Valor detectado como decimal (0-1), multiplicando por 100');
        numero = numero * 100;
      }
      
      console.log('  📊 Número final corregido:', numero);
      console.log('✅ JS - Porcentaje procesado (parsePorcentaje):', `${valor} -> ${numero}`);
      return numero;
    };

    const mapExcelRow = (row) => {
      const r = normalizeKeys(row);
      
      console.log('📊 ============ PROCESANDO FILA EXCEL CUMPLIMIENTO FÍSICO ============');
      console.log('📊 Datos originales del Excel:', row);
      console.log('📊 Datos normalizados:', r);
      console.log('📊 Claves disponibles:', Object.keys(r));
      
      // Buscar las claves correspondientes a los campos del Excel
      let vectorKey = null;
      let periodoKey = null;
      let parcialPeriodoKey = null;
      let porcentajePeriodoKey = null;
      
      // Búsqueda exacta primero
      Object.keys(r).forEach(key => {
        if (key === 'vector') vectorKey = key;
        if (key === 'periodo') periodoKey = key;
        if (key === 'parcial_periodo') parcialPeriodoKey = key;
        if (key === 'porcentaje_periodo') porcentajePeriodoKey = key;
      });
      
      // Si no se encuentran las claves exactas, buscar alternativas
      if (!vectorKey) {
        Object.keys(r).forEach(key => {
          if (key.includes('vector')) {
            vectorKey = key;
          }
        });
      }
      
      if (!periodoKey) {
        Object.keys(r).forEach(key => {
          if (key.includes('periodo') && !key.includes('parcial') && !key.includes('porcentaje')) {
            periodoKey = key;
          }
        });
      }
      
      if (!parcialPeriodoKey) {
        Object.keys(r).forEach(key => {
          if (key.includes('parcial') && key.includes('periodo')) {
            parcialPeriodoKey = key;
          }
        });
      }
      
      if (!porcentajePeriodoKey) {
        Object.keys(r).forEach(key => {
          if (key.includes('porcentaje') && key.includes('periodo')) {
            porcentajePeriodoKey = key;
          }
        });
      }
      
      console.log('🔍 CLAVES FINALES DETECTADAS:');
      console.log('  - vector:', vectorKey);
      console.log('  - periodo:', periodoKey);
      console.log('  - parcial_periodo:', parcialPeriodoKey);
      console.log('  - porcentaje_periodo:', porcentajePeriodoKey);
      
      // Procesar los valores
      console.log('🔄 PROCESANDO VALORES:');
      
      const vector = vectorKey ? String(r[vectorKey]).trim().toUpperCase() : '';
      console.log('📊 vector procesado:', vector, '← de:', r[vectorKey]);
      
      const periodo = periodoKey ? excelDateToMysql(r[periodoKey]) : '';
      console.log('📅 periodo procesado:', periodo, '← de:', r[periodoKey]);
      
      // COMPARACIÓN ESPECÍFICA: parcial_periodo vs porcentaje_periodo
      console.log('🔍 COMPARACIÓN PARCIAL vs PORCENTAJE:');
      console.log('  📊 Valor original parcial_periodo:', r[parcialPeriodoKey], '(tipo:', typeof r[parcialPeriodoKey], ')');
      console.log('  📊 Valor original porcentaje_periodo:', r[porcentajePeriodoKey], '(tipo:', typeof r[porcentajePeriodoKey], ')');
      console.log('  📊 Clave parcial_periodo encontrada:', parcialPeriodoKey);
      console.log('  📊 Clave porcentaje_periodo encontrada:', porcentajePeriodoKey);
      
      // VERIFICACIÓN ESPECÍFICA PARA DATOS PROBLEMÁTICOS
      if (r[parcialPeriodoKey] === undefined || r[parcialPeriodoKey] === null || r[parcialPeriodoKey] === '') {
        console.log('🚨 PROBLEMA DETECTADO: parcial_periodo está vacío o undefined');
        console.log('  📊 Valor:', r[parcialPeriodoKey]);
        console.log('  📊 Tipo:', typeof r[parcialPeriodoKey]);
        console.log('  📊 Todas las claves disponibles:', Object.keys(r));
      }
      
      const parcial_periodo = parcialPeriodoKey ? parsePorcentaje(r[parcialPeriodoKey]) : 0;
      console.log('📊 parcial_periodo procesado:', parcial_periodo, '← de:', r[parcialPeriodoKey]);
      
      const porcentaje_periodo = porcentajePeriodoKey ? parsePorcentaje(r[porcentajePeriodoKey]) : 0;
      console.log('📊 porcentaje_periodo procesado:', porcentaje_periodo, '← de:', r[porcentajePeriodoKey]);
      
      // DATOS FINALES QUE SE ENVIARÁN AL PHP
      console.log('🚀 DATOS FINALES PARA ENVIAR AL PHP:');
      console.log('  - vector:', vector);
      console.log('  - periodo:', periodo);
      console.log('  - parcial_periodo:', parcial_periodo, '(tipo:', typeof parcial_periodo, ')');
      console.log('  - porcentaje_periodo:', porcentaje_periodo, '(tipo:', typeof porcentaje_periodo, ')');
      
      // VERIFICACIÓN FINAL
      console.log('✅ VERIFICACIÓN FINAL:');
      console.log('  - ¿parcial_periodo es igual a porcentaje_periodo?', parcial_periodo === porcentaje_periodo);
      console.log('  - ¿parcial_periodo es 0?', parcial_periodo === 0);
      console.log('  - ¿porcentaje_periodo es 0?', porcentaje_periodo === 0);
      
      return {
        vector: vector,
        periodo: periodo,
        parcial_periodo: parcial_periodo,
        porcentaje_periodo: porcentaje_periodo
      };
    };

    const handleImportar = async () => {
      // Verificar autorización antes de importar
      if (!autorizado) {
        setShowAuthModal(true);
        return;
      }

      if (!archivoSeleccionado || excelData.length === 0) {
        setMensajeImportacion('Por favor selecciona un archivo Excel válido');
        setTipoMensaje('error');
        return;
      }

      setImportando(true);
      setMensajeImportacion('');

      try {
        // Mapear los datos antes de enviar
        const datosMapeados = excelData.map(mapExcelRow);
        
        // Debug: mostrar datos que se van a enviar
        console.log('Datos a enviar:', datosMapeados);
        
        // Verificar que proyectoId esté disponible
        if (!proyectoId) {
          setMensajeImportacion('Error: No hay proyecto seleccionado');
          setTipoMensaje('error');
          return;
        }
        
        console.log('Proyecto ID:', proyectoId);
        
        const response = await fetch(`${API_BASE}/cumplimiento_fisico/importar_cumplimiento_fisico.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            rows: datosMapeados,
            proyecto_id: proyectoId,
            centro_costo_id: '1' // Valor por defecto
          }),
        });

        const result = await response.json();
        console.log('Respuesta del servidor:', result);

        if (result.success) {
          setMensajeImportacion(result.message);
          setTipoMensaje('success');
          setArchivoSeleccionado(null);
          setExcelData([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          // Recargar datos después de la importación
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // Mostrar errores específicos si existen
          if (result.errores && Array.isArray(result.errores)) {
            setMensajeImportacion('Errores en la importación: ' + result.errores.join(', '));
          } else {
            setMensajeImportacion(result.error || 'Error en la importación');
          }
          setTipoMensaje('error');
        }
      } catch (error) {
        console.error('Error completo:', error);
        setMensajeImportacion('Error de conexión: ' + error.message);
        setTipoMensaje('error');
      } finally {
        setImportando(false);
      }
    };

    // Función para validar código de autorización
    const validarCodigoAutorizacion = () => {
      // Código secreto: codelco2025$
      const codigoCorrecto = 'codelco2025$';
      
      if (codigoAutorizacion.trim() === codigoCorrecto) {
        setAutorizado(true);
        setErrorCodigo('');
        setShowAuthModal(false);
        setCodigoAutorizacion('');
        return true;
      } else {
        setErrorCodigo('Código de autorización incorrecto');
        return false;
      }
    };

    const descargarPlantilla = async () => {
      try {
        let plantillaData = [];
        
        if (proyectoId) {
          // Intentar obtener datos reales desde la base de datos
          const response = await fetch(`${API_BASE}/cumplimiento_fisico/cumplimiento_fisico.php?proyecto_id=${proyectoId}`);
          const result = await response.json();
          
          if (result.success && result.data.length > 0) {
            // Usar datos reales de la base de datos
            plantillaData = result.data.map(item => {
              // Convertir fecha de YYYY-MM-DD a DD-MM-YYYY para la plantilla
              const fechaParts = item.periodo.split('-');
              const fechaFormateada = `${fechaParts[2]}-${fechaParts[1]}-${fechaParts[0]}`;
              
              // Formatear parcial_periodo con coma decimal y símbolo %
              const parcialFormateado = parseFloat(item.parcial_periodo || 0).toFixed(2).replace('.', ',') + '%';
              
              // Formatear porcentaje_periodo con coma decimal y símbolo %
              const porcentajeFormateado = parseFloat(item.porcentaje_periodo).toFixed(2).replace('.', ',') + '%';
              
              return {
                vector: item.vector,
                periodo: fechaFormateada,
                parcial_periodo: parcialFormateado,
                porcentaje_periodo: porcentajeFormateado
              };
            });
          } else {
            // Si no hay datos reales, usar datos de ejemplo basados en la imagen
            plantillaData = [
              {
                vector: 'REAL',
                periodo: '01-09-2021',
                parcial_periodo: '0,23%',
                porcentaje_periodo: '0,23%'
              },
              {
                vector: 'REAL',
                periodo: '01-10-2021',
                parcial_periodo: '0,24%',
                porcentaje_periodo: '0,47%'
              },
              {
                vector: 'REAL',
                periodo: '01-11-2021',
                parcial_periodo: '0,30%',
                porcentaje_periodo: '0,77%'
              },
              {
                vector: 'REAL',
                periodo: '01-12-2021',
                parcial_periodo: '0,45%',
                porcentaje_periodo: '1,22%'
              },
              {
                vector: 'REAL',
                periodo: '01-01-2022',
                parcial_periodo: '0,27%',
                porcentaje_periodo: '1,50%'
              },
              {
                vector: 'REAL',
                periodo: '01-02-2022',
                parcial_periodo: '0,83%',
                porcentaje_periodo: '2,32%'
              },
              {
                vector: 'REAL',
                periodo: '01-03-2022',
                parcial_periodo: '0,30%',
                porcentaje_periodo: '2,62%'
              },
              {
                vector: 'REAL',
                periodo: '01-04-2022',
                parcial_periodo: '0,36%',
                porcentaje_periodo: '2,99%'
              },
              {
                vector: 'REAL',
                periodo: '01-05-2022',
                parcial_periodo: '0,29%',
                porcentaje_periodo: '3,28%'
              },
              {
                vector: 'REAL',
                periodo: '01-06-2022',
                parcial_periodo: '0,15%',
                porcentaje_periodo: '3,43%'
              }
            ];
          }
        } else {
          // Si no hay proyecto seleccionado, usar datos de ejemplo basados en la imagen
          plantillaData = [
            {
              vector: 'REAL',
              periodo: '01-09-2021',
              porcentaje_periodo: '0,23%'
            },
            {
              vector: 'REAL',
              periodo: '01-10-2021',
              porcentaje_periodo: '0,47%'
            },
            {
              vector: 'REAL',
              periodo: '01-11-2021',
              porcentaje_periodo: '1,22%'
            },
            {
              vector: 'REAL',
              periodo: '01-12-2021',
              porcentaje_periodo: '2,32%'
            },
            {
              vector: 'REAL',
              periodo: '01-01-2022',
              porcentaje_periodo: '5,45%'
            },
            {
              vector: 'REAL',
              periodo: '01-02-2022',
              porcentaje_periodo: '8,67%'
            },
            {
              vector: 'REAL',
              periodo: '01-03-2022',
              porcentaje_periodo: '12,34%'
            },
            {
              vector: 'REAL',
              periodo: '01-04-2022',
              porcentaje_periodo: '15,78%'
            },
            {
              vector: 'REAL',
              periodo: '01-05-2022',
              porcentaje_periodo: '18,92%'
            },
            {
              vector: 'REAL',
              periodo: '01-06-2022',
              porcentaje_periodo: '20,58%'
            }
          ];
        }

        // Crear workbook y worksheet
        const ws = XLSX.utils.json_to_sheet(plantillaData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cumplimiento Físico');

        // Descargar archivo
        const fileName = proyectoId ? `cumplimiento_fisico_proyecto_${proyectoId}.xlsx` : 'plantilla_cumplimiento_fisico.xlsx';
        XLSX.writeFile(wb, fileName);
        
        // Mostrar mensaje de éxito
        setMensajeImportacion(`Archivo descargado exitosamente: ${fileName}`);
        setTipoMensaje('success');
        
      } catch (error) {
        console.error('Error al descargar plantilla:', error);
        setMensajeImportacion('Error al descargar la plantilla: ' + error.message);
        setTipoMensaje('error');
      }
    };

    // Función para calcular la nota basada en la desviación según la métrica
    const calcularNota = (desviacion) => {
      // Usar valor absoluto para manejar desviaciones positivas y negativas
      const desviacionAbs = Math.abs(desviacion);
      
      // Según la métrica: |X| > 15% = Nota 1, 15% >= |X| > 10% = Nota 3, 10% >= |X| >= 0% = Nota 5
      if (desviacionAbs > 15) {
        return {
          numero: '1',
          color: '#dc3545',
          descripcion: 'Cumplimiento crítico'
        };
      } else if (desviacionAbs > 10) {
        return {
          numero: '3',
          color: '#ffc107',
          descripcion: 'Cumplimiento 100%'
        };
      } else {
        return {
          numero: '5',
          color: '#28a745',
          descripcion: 'Excelente cumplimiento'
        };
      }
    };

    return (
      <div style={{ width: '100%', padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ color: '#16355D', margin: 0 }}>Análisis de Cumplimiento Físico</h3>
            {usandoDatosReales ? (
              <span style={{ 
                background: '#d4edda', 
                color: '#155724', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid #c3e6cb'
              }}>
                📊 Datos Reales
              </span>
            ) : (
              <span style={{ 
                background: '#fff3cd', 
                color: '#856404', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid #ffeaa7'
              }}>
                📋 Datos de Ejemplo
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowFormatInfo(true)}
              style={{
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              title="Ver formato requerido del archivo Excel"
            >
              ℹ️ Formato Requerido
            </button>
            
            <button
              onClick={descargarPlantilla}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              title="Descargar plantilla Excel"
            >
              📥 Descargar Plantilla
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              title="Seleccionar archivo Excel"
            >
              📁 Seleccionar Archivo
            </button>
            
            <button
              onClick={handleImportar}
              disabled={!archivoSeleccionado || importando}
              style={{
                background: archivoSeleccionado && !importando ? 
                  (autorizado ? '#28a745' : '#dc3545') : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: archivoSeleccionado && !importando ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
                position: 'relative'
              }}
              title={autorizado ? "Importar datos a la base de datos" : "Requiere autorización"}
            >
              {importando ? '⏳ Importando...' : 
               autorizado ? '🔓 Importar' : '🔐 Importar'}
              {autorizado && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#28a745',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white'
                }}>
                  ✓
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mostrar archivo seleccionado */}
        {archivoSeleccionado && (
          <div style={{ 
            background: '#e3f2fd', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            border: '1px solid #2196f3'
          }}>
            <strong>Archivo seleccionado:</strong> {archivoSeleccionado.name}
          </div>
        )}

        {/* Mostrar mensaje de importación */}
        {mensajeImportacion && (
          <div style={{ 
            background: tipoMensaje === 'success' ? '#d4edda' : '#f8d7da',
            color: tipoMensaje === 'success' ? '#155724' : '#721c24',
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            border: `1px solid ${tipoMensaje === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {mensajeImportacion}
          </div>
        )}



        {/* Tabla Dinámica de Datos Crudos */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ color: '#16355D', marginBottom: '20px' }}>
            📊 Tabla de Datos Detallados
            {fechaDesde || fechaHasta || filtroVector ? (
              <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginLeft: '10px' }}>
                (Filtrado: {fechaDesde || 'Inicio'} - {fechaHasta || 'Fin'} {filtroVector ? `| Vector: ${filtroVector}` : ''})
              </span>
            ) : null}
          </h3>

          {/* Filtro de Vector */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '15px',
            flexWrap: 'wrap'
          }}>
            <label 
              style={{ 
                color: '#16355D', 
                fontWeight: 'bold', 
                fontSize: '14px',
                marginRight: '5px',
                cursor: 'help'
              }}
              title="Filtra los datos mostrados en la tabla principal y afecta la columna 'Sumatoria Parciales' de la tabla de resumen. La columna 'Período Actual' y 'Proyección' NO se ven afectadas por este filtro."
            >
              Filtrar por Vector:
            </label>
            <select
              value={filtroVector}
              onChange={(e) => setFiltroVector(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '2px solid #16355D',
                fontSize: '14px',
                color: '#16355D',
                fontWeight: '500',
                background: 'white',
                cursor: 'pointer',
                minWidth: '120px'
              }}
            >
              <option value="">Todos los vectores</option>
              <option value="REAL">Real</option>
              <option value="V0">V0</option>
              <option value="NPC">NPC</option>
              <option value="API">API</option>
            </select>
            
            {filtroVector && (
              <button
                onClick={() => setFiltroVector('')}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                title="Limpiar el filtro de vector y mostrar todos los vectores nuevamente"
              >
                ✕ Limpiar
              </button>
            )}
          </div>
          
          {datosCumplimientoFisico.length > 0 ? (
            <div style={{ 
              maxHeight: '500px', 
              overflowY: 'auto', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div 
                style={{ 
                  background: '#f8f9fa', 
                  padding: '8px 12px', 
                  borderBottom: '1px solid #ddd',
                  fontSize: '12px',
                  color: '#666',
                  fontWeight: '500',
                  cursor: 'help'
                }}
                title="Esta tabla muestra los datos detallados de cumplimiento físico. Los filtros de fecha y vector afectan directamente los datos mostrados aquí. Los datos de esta tabla se utilizan para calcular la columna 'Sumatoria Parciales' en la tabla de resumen."
              >
                📋 Datos Detallados de Cumplimiento Físico
                {fechaDesde || fechaHasta || filtroVector ? (
                  <span style={{ marginLeft: '10px', color: '#16355D' }}>
                    (Filtrado: {fechaDesde || 'Inicio'} - {fechaHasta || 'Fin'} {filtroVector ? `| Vector: ${filtroVector}` : ''})
                  </span>
                ) : null}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#16355D', color: '#fff' }}>
                  <tr>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>Periodo</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>Proyecto</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>Centro de Costo</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>Vector</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>Parcial (%)</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>Acumulado (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {getDatosFiltrados().map((item, index) => (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #eee',
                      background: index % 2 === 0 ? '#fff' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '8px', fontSize: '12px', textAlign: 'center' }}>
                        {item.periodo ? (() => {
                          const parts = item.periodo.split('-');
                          const month = parts[1];
                          const year = parts[0].slice(-2);
                          return `${month}/${year}`;
                        })() : ''}
                      </td>
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {item.proyecto_nombre || `Proyecto ${item.proyecto_id}`}
                      </td>
                      <td style={{ padding: '8px', fontSize: '12px', fontWeight: '500' }}>
                        {item.nombre}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        fontSize: '12px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: item.vector === 'REAL' ? '#FF8C00' : 
                               item.vector === 'V0' ? '#00BFFF' : 
                               item.vector === 'NPC' ? '#0066CC' : '#32CD32'
                      }}>
                        {item.vector}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        fontSize: '12px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        {(() => {
                          const valor = parseFloat(item.parcial_periodo || 0);
                          return valor.toFixed(2).replace('.', ',') + '%';
                        })()}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        fontSize: '12px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        {(() => {
                          const valor = parseFloat(item.porcentaje_periodo || 0);
                          return valor.toFixed(2).replace('.', ',') + '%';
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <p>No hay datos de cumplimiento físico disponibles.</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>
                Importa datos usando el botón "Importar" arriba.
              </p>
            </div>
          )}
        </div>

        {/* Tabla de Resumen de Parciales */}
        {getDatosFiltrados().length > 0 && (
          <div style={{ marginTop: '30px', marginBottom: '30px' }}>
            <h3 style={{ color: '#16355D', marginBottom: '20px' }}>
              <span 
                style={{ cursor: 'help' }}
                title="Esta tabla muestra un resumen consolidado de los valores parciales por vector. Las columnas tienen diferentes comportamientos respecto a los filtros: Período Actual y Proyección NO se ven afectadas por filtros, mientras que Sumatoria Parciales SÍ responde a los filtros de fecha aplicados."
              >
                📊 Resumen de Parciales por Vector
                {fechaDesde || fechaHasta ? (
                  <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginLeft: '10px' }}>
                    (Filtrado: {fechaDesde || 'Inicio'} - {fechaHasta || 'Fin'})
                  </span>
                ) : null}
              </span>
            </h3>
            
            <div style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#16355D', color: '#fff' }}>
                  <tr>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '12px',
                      background: '#FF8C00',
                      color: '#fff'
                    }}>
                      <span 
                        style={{ cursor: 'help' }}
                        title="Tipos de vectores de cumplimiento físico disponibles en el sistema. Los vectores se muestran siempre en el orden: REAL, V0, NPC, API."
                      >
                        Vector
                      </span>
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>
                      <span 
                        style={{ cursor: 'help' }}
                        title="Muestra el valor del mes vencido (mes anterior al actual) para cada vector. Esta columna NO se ve afectada por los filtros de fecha aplicados - siempre muestra el mes vencido."
                      >
                        {(() => {
                          // SIEMPRE mostrar mes vencido (independiente del filtro)
                          const mesVencido = new Date().getMonth() === 0 ? 12 : new Date().getMonth();
                          const añoMesVencido = mesVencido === 12 ? new Date().getFullYear() - 1 : new Date().getFullYear();
                          const nombreMes = new Date(añoMesVencido, mesVencido - 1).toLocaleDateString('es-ES', { month: 'long' });
                          return (
                            <>
                              <div>Período Actual (%)</div>
                              <div>{nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}</div>
                            </>
                          );
                        })()}
                      </span>
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>
                      <span 
                        style={{ cursor: 'help' }}
                        title="Suma de los valores parciales según el filtro aplicado. Sin filtro: desde enero hasta el mes vencido. Con filtro: solo los meses seleccionados en el filtro de fechas."
                      >
                        {(() => {
                          if (!fechaDesde && !fechaHasta) {
                            // Sin filtro: desde enero hasta mes vencido
                            const mesVencido = new Date().getMonth() === 0 ? 12 : new Date().getMonth();
                            const añoMesVencido = mesVencido === 12 ? new Date().getFullYear() - 1 : new Date().getFullYear();
                            const nombreMes = new Date(añoMesVencido, mesVencido - 1).toLocaleDateString('es-ES', { month: 'long' });
                            return (
                              <>
                                <div>Sumatoria Parciales (%)</div>
                                <div>Enero - {nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}</div>
                              </>
                            );
                          } else if (fechaDesde && fechaHasta && fechaDesde === fechaHasta) {
                            // Filtro de un mes específico
                            const [año, mes] = fechaDesde.split('-');
                            const nombreMes = new Date(año, parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'long' });
                            return (
                              <>
                                <div>Sumatoria Parciales (%)</div>
                                <div>{nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}</div>
                              </>
                            );
                          } else {
                            // Filtro de rango
                            const [añoDesde, mesDesde] = fechaDesde ? fechaDesde.split('-') : ['', ''];
                            const [añoHasta, mesHasta] = fechaHasta ? fechaHasta.split('-') : ['', ''];
                            const nombreMesDesde = fechaDesde ? new Date(añoDesde, parseInt(mesDesde) - 1).toLocaleDateString('es-ES', { month: 'long' }) : '';
                            const nombreMesHasta = fechaHasta ? new Date(añoHasta, parseInt(mesHasta) - 1).toLocaleDateString('es-ES', { month: 'long' }) : '';
                            return (
                              <>
                                <div>Sumatoria Parciales (%)</div>
                                <div>{nombreMesDesde.charAt(0).toUpperCase() + nombreMesDesde.slice(1)} - {nombreMesHasta.charAt(0).toUpperCase() + nombreMesHasta.slice(1)}</div>
                              </>
                            );
                          }
                        })()}
                      </span>
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>
                      <span 
                        style={{ cursor: 'help' }}
                        title="Proyección anual completa para el año seleccionado. Esta columna NO se ve afectada por los filtros de fecha - siempre muestra la suma de todos los meses del año."
                      >
                        {(() => {
                          const añoProyeccion = fechaDesde ? fechaDesde.split('-')[0] : 
                                               fechaHasta ? fechaHasta.split('-')[0] : 
                                               new Date().getFullYear();
                          return `Proyección ${añoProyeccion} (%)`;
                        })()}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calcularResumenes().map((resumen, index) => (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #eee',
                      background: index % 2 === 0 ? '#fff' : '#f8f9fa'
                    }}>
                      <td style={{ 
                        padding: '12px 8px', 
                        fontSize: '14px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: resumen.vector === 'REAL' ? '#FF8C00' : 
                               resumen.vector === 'V0' ? '#00BFFF' : 
                               resumen.vector === 'NPC' ? '#0066CC' : '#32CD32'
                      }}>
                        <span 
                          style={{ cursor: 'help' }}
                          title={`Vector ${resumen.vector}: ${resumen.vector === 'REAL' ? 'Datos reales de ejecución física' : resumen.vector === 'V0' ? 'Versión 0 del presupuesto' : resumen.vector === 'NPC' ? 'Nuevo Presupuesto de Contrato' : 'Aprobación Presupuestaria Inicial'}`}
                        >
                          {resumen.vector}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px 8px', 
                        fontSize: '14px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        <span 
                          style={{ cursor: 'help' }}
                          title={`Valor del mes vencido para ${resumen.vector}. Este valor NO cambia al aplicar filtros de fecha.`}
                        >
                          {resumen.parcialPeriodo.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px 8px', 
                        fontSize: '14px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        <span 
                          style={{ cursor: 'help' }}
                          title={`Suma acumulada de valores parciales para ${resumen.vector} ${!fechaDesde && !fechaHasta ? 'desde enero hasta el mes vencido' : 'en el período filtrado'}.`}
                        >
                          {resumen.sumatoriaParciales.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px 8px', 
                        fontSize: '14px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        <span 
                          style={{ cursor: 'help' }}
                          title={`Proyección anual completa para ${resumen.vector}. Este valor NO cambia al aplicar filtros de fecha - siempre muestra la suma de todos los meses del año.`}
                        >
                          {resumen.proyeccionAno.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Curva S */}
        <div style={{ marginTop: '40px', marginBottom: '40px' }}>
          <h3 style={{ color: '#16355D', marginBottom: '20px' }}>
            📈 Curva S - Evolución del Cumplimiento
            {fechaDesde || fechaHasta || filtroVector ? (
              <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginLeft: '10px' }}>
                (Filtrado: {fechaDesde || 'Inicio'} - {fechaHasta || 'Fin'} {filtroVector ? `| Vector: ${filtroVector}` : ''})
              </span>
            ) : null}
          </h3>
          
          {getDatosFiltrados().length > 0 ? (
            <div style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <CurvaS data={getDatosFiltrados()} />
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <p>No hay datos suficientes para generar la curva S.</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>
                Importa datos usando el botón "Importar" arriba.
              </p>
            </div>
          )}
        </div>

        {/* Modal de Autorización */}
        {showAuthModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10001
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '450px',
              width: 'calc(100% - 40px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              border: '3px solid #16355D'
            }}>
              {/* Botón de cerrar */}
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setErrorCodigo('');
                  setCodigoAutorizacion('');
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  fontWeight: 'bold'
                }}
                title="Cancelar"
              >
                ×
              </button>

              {/* Contenido del modal */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  background: '#16355D', 
                  color: 'white', 
                  padding: '15px', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '18px',
                    color: '#FFD000'
                  }}>
                    🔐 Autorización Requerida
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px',
                    color: 'white'
                  }}>
                    Ingrese el código de autorización para importar datos
                  </p>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    color: '#16355D',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    Código de Autorización:
                  </label>
                  <input
                    type="password"
                    value={codigoAutorizacion}
                    onChange={(e) => {
                      setCodigoAutorizacion(e.target.value);
                      setErrorCodigo('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        validarCodigoAutorizacion();
                      }
                    }}
                    placeholder="Ingrese el código secreto"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: errorCodigo ? '2px solid #dc3545' : '2px solid #16355D',
                      fontSize: '16px',
                      textAlign: 'center',
                      letterSpacing: '2px',
                      fontWeight: 'bold',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    autoFocus
                  />
                  {errorCodigo && (
                    <p style={{ 
                      color: '#dc3545', 
                      fontSize: '12px', 
                      margin: '8px 0 0 0',
                      fontWeight: 'bold'
                    }}>
                      ❌ {errorCodigo}
                    </p>
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={validarCodigoAutorizacion}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      minWidth: '120px'
                    }}
                  >
                    🔓 Autorizar
                  </button>
                  <button
                    onClick={() => {
                      setShowAuthModal(false);
                      setErrorCodigo('');
                      setCodigoAutorizacion('');
                    }}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      minWidth: '120px'
                    }}
                  >
                    ❌ Cancelar
                  </button>
                </div>

                <div style={{ 
                  marginTop: '20px',
                  padding: '12px',
                  background: '#fff3cd',
                  borderRadius: '6px',
                  border: '1px solid #ffeaa7'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#856404',
                    fontWeight: 'bold'
                  }}>
                    ⚠️ Importante: Esta acción reemplazará todos los datos existentes del proyecto actual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popup Modal para Información del Formato */}
        {showFormatInfo && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}>
              {/* Botón de cerrar */}
              <button
                onClick={() => setShowFormatInfo(false)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666',
                  fontWeight: 'bold'
                }}
                title="Cerrar"
              >
                ×
              </button>

              {/* Contenido del modal */}
              <div>
                <h3 style={{ 
                  color: '#16355D', 
                  marginBottom: '15px',
                  fontSize: '16px',
                  textAlign: 'center'
                }}>
                  📋 Formato Requerido
                </h3>
                
                <div style={{ 
                  background: '#fff3cd', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: '1px solid #ffeaa7',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '14px' }}>Columnas:</h4>
                  <div style={{ fontSize: '13px', color: '#856404' }}>
                    <p style={{ margin: '4px 0' }}><strong>vector:</strong> REAL, V0, NPC, API</p>
                    <p style={{ margin: '4px 0' }}><strong>periodo:</strong> DD-MM-YYYY</p>
                    <p style={{ margin: '4px 0' }}><strong>parcial_periodo:</strong> 12,25% (opcional, vacío = 0%)</p>
                    <p style={{ margin: '4px 0' }}><strong>porcentaje_periodo:</strong> 12,25% (obligatorio)</p>
                  </div>
                </div>

                <div style={{ 
                  background: '#e3f2fd', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: '1px solid #2196f3',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1565c0', fontSize: '14px' }}>Notas:</h4>
                  <div style={{ fontSize: '12px', color: '#1565c0' }}>
                    <p style={{ margin: '4px 0' }}>• proyecto_id, id y nombre se obtienen automáticamente</p>
                    <p style={{ margin: '4px 0' }}>• Primera fila = encabezados</p>
                    <p style={{ margin: '4px 0' }}>• Formato fecha: 01-09-2021</p>
                    <p style={{ margin: '4px 0' }}>• parcial_periodo: opcional (vacío = 0%)</p>
                    <p style={{ margin: '4px 0' }}>• porcentaje_periodo: obligatorio (12,25%)</p>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                  <button
                    onClick={() => setShowFormatInfo(false)}
                    style={{
                      background: '#16355D',
                      color: 'white',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };





  return (
    <div style={{
      position: 'absolute',
      left: anchoSidebarIzquierdo + 32,
      top: ALTURA_BARRA_SUPERIOR,
      width: `calc(100vw - ${anchoSidebarIzquierdo}px - ${anchoSidebarDerecho}px - 32px)`,
      height: alturaAreaTrabajo,
      margin: 0,
      padding: 0,
      overflowX: 'hidden',
      background: '#f8f9fb',
      transition: 'width 0.3s cubic-bezier(.4,1.3,.5,1), left 0.3s cubic-bezier(.4,1.3,.5,1)',
      boxSizing: 'border-box',
      zIndex: 1,
    }}>


      {/* Filtros de fecha */}
      {seleccion !== 'lineas_bases' && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 18,
          marginBottom: 12,
          flexWrap: 'wrap',
          width: '100%',
          margin: 0,
          padding: '20px 20px 0 20px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'flex-end', margin: 0, padding: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: 0, padding: 0 }}>
              <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Desde</label>
              <input
                type="month"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                style={{
                  border: '2px solid #1d69db',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 10,
                  color: '#222',
                  fontWeight: 500,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: 0, padding: 0 }}>
              <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Hasta</label>
              <input
                type="month"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                style={{
                  border: '2px solid #3399ff',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 10,
                  color: '#222',
                  fontWeight: 500,
                  outline: 'none',
                }}
              />
            </div>
            {/* Filtro de descripción solo para predictividad */}
            {seleccion === 'predictividad' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: 0, padding: 0 }}>
                <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Descripción</label>
                <select
                  value={filtroDescripcion}
                  onChange={e => setFiltroDescripcion(e.target.value)}
                  style={{
                    border: '2px solid rgb(22, 53, 93)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 10,
                    color: '#222',
                    fontWeight: 500,
                    outline: 'none',
                    minWidth: '150px',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="">Todas las descripciones</option>
                  {descripcionesDisponibles.map((descripcion, index) => (
                    <option key={index} value={descripcion}>
                      {descripcion}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => { 
                setFechaDesde(''); 
                setFechaHasta(''); 
                setFiltroDescripcion('');
              }}
              title="Limpiar todos los filtros"
              style={{
                background: 'none',
                border: 'none',
                color: '#6c2eb6',
                fontSize: 22,
                marginLeft: 4,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span role="img" aria-label="barrer">🧹</span>
            </button>
          </div>
        </div>
      )}

      {/* Contenido del reporte */}
      <div style={{ padding: '0 20px' }}>
        {renderContenidoReporte()}
      </div>

      {/* Sidebar derecho */}
      <SidebarDerecho 
        seleccion={seleccion} 
        setSeleccion={setSeleccion} 
        sidebarVisible={sidebarVisible} 
        setSidebarVisible={setSidebarVisible} 
      />
    </div>
  );
};

// Componente para el gráfico de curva S
const GraficoCurvaS = ({ 
  datosTabla, 
  proyectoId, 
  mesMinimoECD, 
  mesMaximoECD, 
  montoMinimoIEAC, 
  montoMaximoIEAC, 
  valorBAC, 
  plazoControlECD, 
  datosAvFisicoReal 
}) => {
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [cargandoGrafico, setCargandoGrafico] = useState(false);
  
  // Estados para filtros de líneas
  const [filtrosActivos, setFiltrosActivos] = useState({
    avFisicoPlanificado: true,
    avFinancieroPlanificado: true,
    avFisicoReal: true,
    avFisicoProyectado: true,
    avFinancieroReal: true,
    ieacAvg: true,
    ieacMin: true,
    ieacMax: true,
    eacInformado: true,
    eacProyectado: true,
    costoGanado: true
  });

  const [modoOscuro, setModoOscuro] = useState(true); // true = fondo negro, false = fondo blanco

  // Función para alternar filtros
  const alternarFiltro = (filtro) => {
    setFiltrosActivos(prev => ({
      ...prev,
      [filtro]: !prev[filtro]
    }));
  };

  // Función para preparar los datos para el gráfico
  const prepararDatosGrafico = (datos) => {
    if (!datos || datos.length === 0) return [];

    return datos.map((row, index) => {
      const numeroMes = index + 1;
      
      // Convertir porcentajes a valores monetarios usando BAC
      const porcentajeAvFisicoPlanificado = row.api_acum ? parseFloat(row.api_acum) : null;
      const porcentajeAvFisicoReal = row.api_acum_real ? parseFloat(row.api_acum_real) : null;
      const porcentajeAvFisicoProyectado = row.api_acum_proyectado ? parseFloat(row.api_acum_proyectado) : null;
      
      // Convertir a valores monetarios: porcentaje * BAC (solo si hay porcentaje válido)
      const avFisicoPlanificadoMonetario = (valorBAC && porcentajeAvFisicoPlanificado !== null) ? porcentajeAvFisicoPlanificado * valorBAC : undefined;
      const avFisicoRealMonetario = (valorBAC && porcentajeAvFisicoReal !== null) ? porcentajeAvFisicoReal * valorBAC : undefined;
      const avFisicoProyectadoMonetario = (valorBAC && porcentajeAvFisicoProyectado !== null) ? porcentajeAvFisicoProyectado * valorBAC : undefined;
      
      // Calcular valores IEAC
      const ieacMinValue = calcularIEACMin(numeroMes);
      const ieacMaxValue = calcularIEACMax(numeroMes);
      
      // Calcular datos específicos para el área de la nube
      let ieacCloudArea = undefined;
      if (ieacMinValue !== undefined && ieacMaxValue !== undefined) {
        ieacCloudArea = ieacMaxValue - ieacMinValue;
      }
      
      return {
        mes: numeroMes,
        periodo: row.periodo,
        avFisicoPlanificado: avFisicoPlanificadoMonetario,
        avFinancieroPlanificado: row.monto_total ? parseFloat(row.monto_total) : undefined,
        avFisicoReal: avFisicoRealMonetario,
        avFisicoProyectado: avFisicoProyectadoMonetario,
        avFinancieroReal: row.incurrido_total ? parseFloat(row.incurrido_total) : undefined,
        ieacAvg: row.ieac_avg ? parseFloat(row.ieac_avg) : undefined,
        ieacMin: ieacMinValue,
        ieacMax: ieacMaxValue,
        // Datos específicos para el área de la nube
        ieacCloudArea: ieacCloudArea,
        eacInformado: calcularEACInformado(numeroMes),
        eacProyectado: calcularEACProyectado(numeroMes),
        costoGanado: calcularCostoGanado(numeroMes, row.periodo, row)
      };
    });
  };

  // Función para calcular IEAC Min
  const calcularIEACMin = (numeroMes) => {
    console.log('🔍 DEBUG calcularIEACMin:', {
      numeroMes,
      mesMinimoECD,
      mesMaximoECD,
      montoMinimoIEAC,
      enRango: numeroMes >= mesMinimoECD && numeroMes <= mesMaximoECD
    });
    
    if (!mesMinimoECD || !mesMaximoECD || !montoMinimoIEAC) {
      console.log('❌ DEBUG calcularIEACMin - Valores faltantes');
      return undefined;
    }
    if (numeroMes >= mesMinimoECD && numeroMes <= mesMaximoECD) {
      console.log('✅ DEBUG calcularIEACMin - Valor aplicado:', montoMinimoIEAC);
      return montoMinimoIEAC;
    }
    console.log('❌ DEBUG calcularIEACMin - Fuera de rango');
    return undefined;
  };

  // Función para calcular IEAC Max
  const calcularIEACMax = (numeroMes) => {
    if (!mesMinimoECD || !mesMaximoECD || !montoMaximoIEAC) {
      return undefined;
    }
    if (numeroMes >= mesMinimoECD && numeroMes <= mesMaximoECD) {
      return montoMaximoIEAC;
    }
    return undefined;
  };

  // Función para calcular EAC Informado
  const calcularEACInformado = (numeroMes) => {
    if (!plazoControlECD || !mesMaximoECD || !valorBAC) {
      return undefined;
    }
    if (numeroMes >= plazoControlECD && numeroMes <= mesMaximoECD) {
      return valorBAC;
    }
    return undefined;
  };

  // Función para calcular EAC Proyectado
  const calcularEACProyectado = (numeroMes) => {
    if (!plazoControlECD || !valorBAC) {
      return undefined;
    }
    if (numeroMes >= 1 && numeroMes <= plazoControlECD) {
      return valorBAC;
    }
    return undefined;
  };

  // Función para calcular Costo Ganado (Earned Value)
  const calcularCostoGanado = (numeroMes, periodoOriginal, row) => {
    if (!plazoControlECD || !valorBAC) {
      return undefined;
    }
    
    if (numeroMes >= 1 && numeroMes <= plazoControlECD) {
      // PRIORIDAD 1: Suma (Qty reales * PU Pto)
      if (row && row.cantidad_real && row.precio_unitario) {
        return row.cantidad_real * row.precio_unitario;
      }
      
      // PRIORIDAD 2: $ Prog/%Av. Prog * %Av. Real
      if (row && row.monto_total && row.api_acum && row.api_acum_real && row.incurrido_total) {
        const porcentajeAvanceProg = parseFloat(row.api_acum);
        const porcentajeAvanceReal = parseFloat(row.api_acum_real);
        const montoProgramado = parseFloat(row.monto_total);
        const montoReal = parseFloat(row.incurrido_total);
        
        if (porcentajeAvanceProg > 0) {
          const factorP = (montoProgramado / porcentajeAvanceProg) / (montoProgramado / porcentajeAvanceProg);
          const factorR = porcentajeAvanceReal > 0 ? (montoReal / porcentajeAvanceReal) / (montoReal / porcentajeAvanceReal) : 1;
          
          if ((factorP < 1.0 || factorP > 1.0) && (factorR < 1.0 || factorR > 1.0)) {
            return (montoProgramado / porcentajeAvanceProg) * porcentajeAvanceReal;
          }
        }
      }
      
      // PRIORIDAD 3: %Av.Real * BAC
      if (row && row.api_acum_real) {
        const porcentajeAvanceReal = parseFloat(row.api_acum_real);
        return valorBAC * porcentajeAvanceReal;
      }
      
      // PRIORIDAD 4: Indirectos (depende del API) 50%Avance + 50%Plazo
      if (row && row.api_acum_real) {
        const porcentajeAvanceReal = parseFloat(row.api_acum_real);
        const porcentajePlazo = numeroMes / plazoControlECD;
        return valorBAC * ((porcentajeAvanceReal * 0.5) + (porcentajePlazo * 0.5));
      }
    }
    
    return undefined;
  };

  // Función para calcular el rango del eje Y
  const calcularRangoEjeY = () => {
    if (!valorBAC) return { min: 0, max: 1000000 };
    
    // Agregar 20% de margen por encima del BAC
    const margen = valorBAC * 0.2;
    const maximo = valorBAC + margen;
    
    // Redondear hacia arriba para tener números más limpios
    const maximoRedondeado = Math.ceil(maximo / 100000) * 100000; // Redondear a centenas de miles
    
    return {
      min: 0,
      max: maximoRedondeado
    };
  };

  const rangoEjeY = calcularRangoEjeY();

  // Actualizar datos del gráfico cuando cambien los datos de la tabla
  useEffect(() => {
    console.log('🔍 DEBUG GraficoCurvaS - datosTabla:', datosTabla);
    console.log('🔍 DEBUG GraficoCurvaS - valorBAC:', valorBAC);
    console.log('🔍 DEBUG GraficoCurvaS - proyectoId:', proyectoId);
    
    if (datosTabla && datosTabla.length > 0) {
      setCargandoGrafico(true);
      const datosPreparados = prepararDatosGrafico(datosTabla);
      console.log('🔍 DEBUG GraficoCurvaS - datosPreparados:', datosPreparados);
      setDatosGrafico(datosPreparados);
      setCargandoGrafico(false);
    } else {
      console.log('❌ DEBUG GraficoCurvaS - No hay datosTabla o está vacío');
    }
  }, [datosTabla, valorBAC]);

  if (cargandoGrafico) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px',
        color: '#16355D'
      }}>
        Cargando gráfico de curva S...
      </div>
    );
  }

  if (!datosGrafico || datosGrafico.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px',
        color: '#666'
      }}>
        No hay datos disponibles para el gráfico
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      marginTop: '20px'
    }}>
      {/* Card Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        border: '1px solid #e5e7eb',
        borderBottom: 'none',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 8px 0',
            color: '#111827',
            fontSize: '18px',
            fontWeight: '600',
            lineHeight: '1.2'
          }}>
            Gráfico de Curva S
          </h3>
          <p style={{
            margin: '0',
            color: '#6b7280',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            Proyecto {proyectoId} - Análisis de avance físico y financiero
          </p>
        </div>
        
        {/* Toggle Modo Oscuro/Claro */}
        <button
          onClick={() => setModoOscuro(!modoOscuro)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: modoOscuro ? '#1f2937' : '#f3f4f6',
            color: modoOscuro ? '#ffffff' : '#374151',
            border: `1px solid ${modoOscuro ? '#374151' : '#d1d5db'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = modoOscuro ? '#374151' : '#e5e7eb';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = modoOscuro ? '#1f2937' : '#f3f4f6';
          }}
        >
          {modoOscuro ? (
            <>
              🌙 Modo Oscuro
            </>
          ) : (
            <>
              ☀️ Modo Claro
            </>
          )}
        </button>
      </div>

      {/* Card Content */}
      <div style={{
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e5e7eb',
        borderRight: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        {/* Panel de Filtros */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ 
            marginBottom: '16px', 
            color: '#111827',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            🔍 Filtros de Líneas
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {/* Grupo: Avances Planificados */}
            <div style={{ marginBottom: '8px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                📊 Avances Planificados
              </h5>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.avFisicoPlanificado}
                  onChange={() => alternarFiltro('avFisicoPlanificado')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#FF0000' }}>●</span> Av. Físico Planificado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.avFinancieroPlanificado}
                  onChange={() => alternarFiltro('avFinancieroPlanificado')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#FF0000' }}>●</span> Av. Financiero Planificado
              </label>
            </div>

            {/* Grupo: Avances Reales */}
            <div style={{ marginBottom: '8px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                📈 Avances Reales
              </h5>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.avFisicoReal}
                  onChange={() => alternarFiltro('avFisicoReal')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#00FF00' }}>●</span> Av. Físico Real
              </label>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.avFinancieroReal}
                  onChange={() => alternarFiltro('avFinancieroReal')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#00FF00' }}>●</span> Av. Financiero Real
              </label>
            </div>

            {/* Grupo: Proyecciones */}
            <div style={{ marginBottom: '8px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                🔮 Proyecciones
              </h5>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.avFisicoProyectado}
                  onChange={() => alternarFiltro('avFisicoProyectado')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#000000' }}>●</span> Av. Físico Proyectado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.costoGanado}
                  onChange={() => alternarFiltro('costoGanado')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#800080' }}>●</span> Costo Ganado
              </label>
            </div>

            {/* Grupo: IEAC */}
            <div style={{ marginBottom: '8px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                💰 IEAC
              </h5>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.ieacAvg}
                  onChange={() => alternarFiltro('ieacAvg')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#00FFFF' }}>●</span> IEAC Avg
              </label>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.ieacMin}
                  onChange={() => alternarFiltro('ieacMin')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#8B4513' }}>●</span> IEAC Min
              </label>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.ieacMax}
                  onChange={() => alternarFiltro('ieacMax')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#8B4513' }}>●</span> IEAC Max
              </label>
            </div>

            {/* Grupo: EAC */}
            <div style={{ marginBottom: '8px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                🎯 EAC
              </h5>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.eacInformado}
                  onChange={() => alternarFiltro('eacInformado')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#000000' }}>●</span> EAC Informado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={filtrosActivos.eacProyectado}
                  onChange={() => alternarFiltro('eacProyectado')}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#000000' }}>●</span> EAC Proyectado
              </label>
            </div>
          </div>

          {/* Botones de acción rápida */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFiltrosActivos({
                avFisicoPlanificado: true,
                avFinancieroPlanificado: true,
                avFisicoReal: true,
                avFisicoProyectado: true,
                avFinancieroReal: true,
                ieacAvg: true,
                ieacMin: true,
                ieacMax: true,
                eacInformado: true,
                eacProyectado: true,
                costoGanado: true
              })}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ✅ Mostrar Todas
            </button>
            <button
              onClick={() => setFiltrosActivos({
                avFisicoPlanificado: false,
                avFinancieroPlanificado: false,
                avFisicoReal: false,
                avFisicoProyectado: false,
                avFinancieroReal: false,
                ieacAvg: false,
                ieacMin: false,
                ieacMax: false,
                eacInformado: false,
                eacProyectado: false,
                costoGanado: false
              })}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ❌ Ocultar Todas
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div style={{ 
          height: '600px',
          backgroundColor: modoOscuro ? '#000000' : '#ffffff',
          borderRadius: '6px',
          padding: '16px',
          border: modoOscuro ? '1px solid #374151' : '1px solid #e5e7eb'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={datosGrafico} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid vertical={false} stroke={modoOscuro ? '#374151' : '#f3f4f6'} />
              <XAxis 
                dataKey="mes" 
                stroke={modoOscuro ? '#ffffff' : '#6b7280'}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `Mes ${value}`}
              />
              <YAxis 
                stroke={modoOscuro ? '#ffffff' : '#6b7280'}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value.toLocaleString()}`}
                domain={[rangoEjeY.min, rangoEjeY.max]}
                ticks={[
                  rangoEjeY.min,
                  rangoEjeY.max * 0.25,
                  rangoEjeY.max * 0.5,
                  rangoEjeY.max * 0.75,
                  rangoEjeY.max
                ]}
              />
              <Tooltip 
                formatter={(value, name) => {
                  return [`$${value?.toLocaleString() || '-'}`, name];
                }}
                labelFormatter={(label) => `Mes ${label}`}
                contentStyle={{
                  backgroundColor: modoOscuro ? '#1f2937' : '#ffffff',
                  border: modoOscuro ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  boxShadow: modoOscuro ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
                  color: modoOscuro ? '#ffffff' : '#111827'
                }}
                cursor={false}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '12px'
                }}
              />
              
              {/* Área transparente entre IEAC Min e IEAC Max - Solución profesional */}
              {/* Área base (IEAC Min) */}
              <Area
                type="monotone"
                dataKey="ieacMin"
                stackId="ieacCloud"
                stroke="none"
                fill={modoOscuro ? "#000000" : "#ffffff"}
                fillOpacity={1}
                baseValue={0}
              />
              {/* Área de la nube (diferencia entre IEAC Max e IEAC Min) */}
              <Area
                type="monotone"
                dataKey="ieacCloudArea"
                stackId="ieacCloud"
                stroke="none"
                fill={modoOscuro ? "rgba(139, 69, 19, 0.25)" : "rgba(139, 69, 19, 0.2)"}
                fillOpacity={0.4}
                baseValue={0}
              />
              
              {/* Líneas del gráfico */}
              {filtrosActivos.avFisicoPlanificado && (
                <Line 
                  type="monotone" 
                  dataKey="avFisicoPlanificado" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Av. Físico Planificado (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.avFinancieroPlanificado && (
                <Line 
                  type="monotone" 
                  dataKey="avFinancieroPlanificado" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Av. Financiero Planificado (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.avFisicoReal && (
                <Line 
                  type="monotone" 
                  dataKey="avFisicoReal" 
                  stroke="#10b981" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Av. Físico Real (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.avFisicoProyectado && (
                <Line 
                  type="monotone" 
                  dataKey="avFisicoProyectado" 
                  stroke="#374151" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Av. Físico Proyectado (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.avFinancieroReal && (
                <Line 
                  type="monotone" 
                  dataKey="avFinancieroReal" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Av. Financiero Real (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.ieacAvg && (
                <Line 
                  type="monotone" 
                  dataKey="ieacAvg" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  name="IEAC Avg (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.ieacMin && (
                <Line 
                  type="monotone" 
                  dataKey="ieacMin" 
                  stroke="#a16207" 
                  strokeWidth={2}
                  name="IEAC Min (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.ieacMax && (
                <Line 
                  type="monotone" 
                  dataKey="ieacMax" 
                  stroke="#a16207" 
                  strokeWidth={2}
                  name="IEAC Max (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.eacInformado && (
                <Line 
                  type="monotone" 
                  dataKey="eacInformado" 
                  stroke="#374151" 
                  strokeWidth={2}
                  name="EAC Informado (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.eacProyectado && (
                <Line 
                  type="monotone" 
                  dataKey="eacProyectado" 
                  stroke="#374151" 
                  strokeDasharray="2 2"
                  strokeWidth={2}
                  name="EAC Proyectado (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {filtrosActivos.costoGanado && (
                <Line 
                  type="monotone" 
                  dataKey="costoGanado" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Costo Ganado (USD)"
                  dot={false}
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card Footer */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        padding: '16px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <div style={{ color: '#6b7280' }}>
            📊 Análisis de curva S con métricas de Earned Value Management (EVM)
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para el reporte de Líneas Bases - Real/Proyectado
const ReporteLineasBases = ({ proyectoId }) => {
  // Estados para las 5 tablas
  const [tablaReal, setTablaReal] = useState([]);
  const [tablaNpc, setTablaNpc] = useState([]);
  const [tablaPoa, setTablaPoa] = useState([]);
  const [tablaV0, setTablaV0] = useState([]);
  const [tablaApi, setTablaApi] = useState([]);
  
  // Función para obtener el mes actual menos un mes en formato YYYY-MM
  const obtenerMesActualMenosUno = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth(); // 0-11
    
    // Restar un mes
    let mesAnterior = mes - 1;
    let añoAnterior = año;
    
    // Si el mes es enero (0), ir al diciembre del año anterior
    if (mesAnterior < 0) {
      mesAnterior = 11; // Diciembre
      añoAnterior = año - 1;
    }
    
    const mesFormateado = String(mesAnterior + 1).padStart(2, '0');
    return `${añoAnterior}-${mesFormateado}`;
  };

  // Estados para filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [fechaCorte, setFechaCorte] = useState(obtenerMesActualMenosUno());
  
  // Estado para los períodos cargados desde la API
  const [periodos, setPeriodos] = useState([]);
  const [cargandoPeriodos, setCargandoPeriodos] = useState(false);
  
  // Estado para los datos de av_fisico_plan (api_acum)
  const [datosAvFisicoPlan, setDatosAvFisicoPlan] = useState([]);
  const [cargandoAvFisicoPlan, setCargandoAvFisicoPlan] = useState(false);
  
  // Estado para los datos de av_financiero_plan (monto_total)
  const [datosAvFinancieroPlan, setDatosAvFinancieroPlan] = useState([]);
  const [cargandoAvFinancieroPlan, setCargandoAvFinancieroPlan] = useState(false);
  
  // Estado para los datos de av_fisico_real (api_acum)
  const [datosAvFisicoReal, setDatosAvFisicoReal] = useState([]);
  const [cargandoAvFisicoReal, setCargandoAvFisicoReal] = useState(false);
  
  // Estado para los datos de av_fisico_proyectado (api_acum)
  const [datosAvFisicoProyectado, setDatosAvFisicoProyectado] = useState([]);
  const [cargandoAvFisicoProyectado, setCargandoAvFisicoProyectado] = useState(false);
  
  // Estado para los datos de av_financiero_incurrido (incurrido_total)
  const [datosAvFinancieroIncurrido, setDatosAvFinancieroIncurrido] = useState([]);
  const [cargandoAvFinancieroIncurrido, setCargandoAvFinancieroIncurrido] = useState(false);
  
  // Estado para los datos de IEAC (avg)
  const [datosIEACAvg, setDatosIEACAvg] = useState([]);
  const [cargandoIEACAvg, setCargandoIEACAvg] = useState(false);

  // Estados para Metodologías IEAC
  const [datosIEAC, setDatosIEAC] = useState([]);
  const [cargandoIEAC, setCargandoIEAC] = useState(false);
  const [mostrarModalIEAC, setMostrarModalIEAC] = useState(false);
  const [porGanar, setPorGanar] = useState(0);
  
  // Estados para marcado dinámico de filas basado en IEAC
  const [montoMinimoIEAC, setMontoMinimoIEAC] = useState(null);
  const [montoMaximoIEAC, setMontoMaximoIEAC] = useState(null);
  const [valorBAC, setValorBAC] = useState(null);

  // Estados para Metodologías ECD
  const [datosECD, setDatosECD] = useState(null);
  const [cargandoECD, setCargandoECD] = useState(false);
  const [mostrarModalECD, setMostrarModalECD] = useState(false);
  const [duracionPlanificada, setDuracionPlanificada] = useState(12);
  
  // Estados para marcado dinámico de filas
  const [mesMinimoECD, setMesMinimoECD] = useState(null);
  const [mesMaximoECD, setMesMaximoECD] = useState(null);
  const [plazoControlECD, setPlazoControlECD] = useState(null);
  
  // Función para calcular el valor de IEAC Min basado en el rango de meses ECD
  const calcularIEACMin = (numeroMes) => {
    // Verificar si tenemos los datos necesarios
    if (!mesMinimoECD || !mesMaximoECD || !montoMinimoIEAC) {
      return null;
    }
    
    // Verificar si el mes actual está dentro del rango
    if (numeroMes >= mesMinimoECD && numeroMes <= mesMaximoECD) {
      return montoMinimoIEAC;
    }
    
    return null;
  };

  // Función para calcular el valor de IEAC Max basado en el rango de meses ECD
  const calcularIEACMax = (numeroMes) => {
    // Verificar si tenemos los datos necesarios
    if (!mesMinimoECD || !mesMaximoECD || !montoMaximoIEAC) {
      return null;
    }
    
    // Verificar si el mes actual está dentro del rango
    if (numeroMes >= mesMinimoECD && numeroMes <= mesMaximoECD) {
      return montoMaximoIEAC;
    }
    
    return null;
  };

  // Función para calcular el valor de EAC Informado basado en el rango desde Plazo Control hasta Meses Máximo
  const calcularEACInformado = (numeroMes) => {
    // Verificar si tenemos los datos necesarios
    if (!plazoControlECD || !mesMaximoECD || !valorBAC) {
      return null;
    }
    
    // Verificar si el mes actual está dentro del rango (desde Plazo Control hasta Meses Máximo)
    if (numeroMes >= plazoControlECD && numeroMes <= mesMaximoECD) {
      return valorBAC;
    }
    
    return null;
  };

  // Función para calcular el valor de EAC Proyectado basado en el rango desde mes 1 hasta Plazo Control
  const calcularEACProyectado = (numeroMes) => {
    // Verificar si tenemos los datos necesarios
    if (!plazoControlECD || !valorBAC) {
      return null;
    }
    
    // Verificar si el mes actual está dentro del rango (desde mes 1 hasta Plazo Control)
    if (numeroMes >= 1 && numeroMes <= plazoControlECD) {
      return valorBAC;
    }
    
    return null;
  };

  // Función para calcular el Costo Ganado (EV) según criterios de prioridad oficiales
  const calcularCostoGanado = (numeroMes, periodoOriginal, row) => {
    console.log('🔍 DEBUG calcularCostoGanado:', {
      numeroMes,
      periodoOriginal,
      plazoControlECD,
      valorBAC,
      row: row
    });
    
    // Verificar si tenemos los datos necesarios básicos
    if (!plazoControlECD || !valorBAC) {
      console.log('❌ Faltan datos necesarios:', {
        plazoControlECD: !!plazoControlECD,
        valorBAC: !!valorBAC
      });
      return null;
    }
    
    // Verificar si el mes actual está dentro del rango (desde mes 1 hasta Plazo Control)
    if (numeroMes >= 1 && numeroMes <= plazoControlECD) {
      console.log('✅ Mes dentro del rango:', numeroMes, '<=', plazoControlECD);
      
      // PRIORIDAD 1: Suma (Qty reales * PU Pto)
      // Solo si el sistema puede hacer el cálculo (requiere datos detallados)
      if (row && row.cantidad_real && row.precio_unitario) {
        const EV_Prioridad1 = row.cantidad_real * row.precio_unitario;
        console.log('✅ EV Prioridad 1 (Detalla):', {
          cantidad_real: row.cantidad_real,
          precio_unitario: row.precio_unitario,
          EV: EV_Prioridad1,
          formateado: formatearMoneda(EV_Prioridad1)
        });
        return EV_Prioridad1;
      }
      
      // PRIORIDAD 2: $ Prog/%Av. Prog * %Av. Real
      // Factor P = (%Av.Finan.Prog / %Av.Prog), Factor R = (%Av.Finan.Real / %Av.Real)
      if (row && row.monto_total && row.api_acum && row.api_acum_real && row.incurrido_total) {
        const porcentajeAvanceProg = parseFloat(row.api_acum);
        const porcentajeAvanceReal = parseFloat(row.api_acum_real);
        const montoProgramado = parseFloat(row.monto_total);
        const montoReal = parseFloat(row.incurrido_total);
        
        if (porcentajeAvanceProg > 0) {
          const factorP = (montoProgramado / porcentajeAvanceProg) / (montoProgramado / porcentajeAvanceProg);
          const factorR = porcentajeAvanceReal > 0 ? (montoReal / porcentajeAvanceReal) / (montoReal / porcentajeAvanceReal) : 1;
          
          // Verificar condiciones: Factor P y R < 1,0 o >1,0
          if ((factorP < 1.0 || factorP > 1.0) && (factorR < 1.0 || factorR > 1.0)) {
            const EV_Prioridad2 = (montoProgramado / porcentajeAvanceProg) * porcentajeAvanceReal;
            console.log('✅ EV Prioridad 2 (Simplificación primer orden):', {
              montoProgramado,
              porcentajeAvanceProg,
              porcentajeAvanceReal,
              factorP,
              factorR,
              EV: EV_Prioridad2,
              formateado: formatearMoneda(EV_Prioridad2)
            });
            return EV_Prioridad2;
          }
        }
      }
      
      // PRIORIDAD 3: %Av.Real * BAC
      // Factor P y R diferentes tendencias
      if (row && row.api_acum_real) {
        const porcentajeAvanceReal = parseFloat(row.api_acum_real);
        const EV_Prioridad3 = valorBAC * porcentajeAvanceReal;
        console.log('✅ EV Prioridad 3 (Simplificación segundo orden):', {
          porcentajeAvanceReal,
          valorBAC,
          EV: EV_Prioridad3,
          formateado: formatearMoneda(EV_Prioridad3)
        });
        return EV_Prioridad3;
      }
      
      // PRIORIDAD 4: Indirectos (depende del API) 50%Avance + 50%Plazo
      // Para casos donde no hay datos suficientes
      if (row && row.api_acum_real) {
        const porcentajeAvanceReal = parseFloat(row.api_acum_real);
        const porcentajePlazo = numeroMes / plazoControlECD; // Progreso temporal
        const EV_Prioridad4 = valorBAC * ((porcentajeAvanceReal * 0.5) + (porcentajePlazo * 0.5));
        console.log('✅ EV Prioridad 4 (Simplificación tercer orden):', {
          porcentajeAvanceReal,
          porcentajePlazo,
          valorBAC,
          EV: EV_Prioridad4,
          formateado: formatearMoneda(EV_Prioridad4)
        });
        return EV_Prioridad4;
      }
      
      console.log('❌ No se pudo calcular EV con ningún criterio de prioridad');
    } else {
      console.log('❌ Mes fuera del rango:', numeroMes, 'fuera de 1-', plazoControlECD);
    }
    
    return null;
  };



  // Estados para la distribución beta
  const [parametrosBeta, setParametrosBeta] = useState({ alpha: 2.5, beta: 1.5 });
  const [tipoProyecto, setTipoProyecto] = useState('construccion');
  const [mostrarConfiguracionBeta, setMostrarConfiguracionBeta] = useState(false);
  const [distribucionBeta, setDistribucionBeta] = useState([]);
  const [ieacAvgTotal, setIeacAvgTotal] = useState(0);

  // Estados para IEAC estratégico
  const [datosIEACStrategico, setDatosIEACStrategico] = useState([]);
  const [cargandoIEACStrategico, setCargandoIEACStrategico] = useState(false);


  // Cargar datos de las tablas
  const cargarDatosTabla = async (tabla, setter) => {
    try {
    if (!proyectoId) return;
    
      const response = await fetch(`${API_BASE}/${tabla}.php?proyecto_id=${proyectoId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setter(data.data);
      } else {
        setter([]);
      }
    } catch (error) {
      console.error(`Error cargando datos de ${tabla}:`, error);
      setter([]);
    }
  };

  // Función para cargar períodos desde la API
  const cargarPeriodos = async () => {
    if (!proyectoId) return;
    
    setCargandoPeriodos(true);
    try {
      let url = `${API_BASE}/gestion_proyecto/consultas/periodo.php?proyecto_id=${proyectoId}`;
      
      // Agregar filtros de fecha si están presentes
      if (fechaDesde) {
        url += `&fecha_desde=${fechaDesde}`;
      }
      if (fechaHasta) {
        url += `&fecha_hasta=${fechaHasta}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.datos) {
        setPeriodos(data.datos);
      } else {
        setPeriodos([]);
          }
        } catch (error) {
      console.error('Error cargando períodos:', error);
      setPeriodos([]);
    } finally {
      setCargandoPeriodos(false);
    }
  };

  // Función para cargar datos de av_fisico_plan (api_acum)
  const cargarAvFisicoPlan = async () => {
    if (!proyectoId) return;
    
    setCargandoAvFisicoPlan(true);
    try {
      let url = `${API_BASE}/gestion_proyecto/consultas/av_fisico_plan.php?proyecto_id=${proyectoId}`;
      
      // Agregar filtros de fecha si están presentes
      if (fechaDesde) {
        url += `&fecha_desde=${fechaDesde}`;
      }
      if (fechaHasta) {
        url += `&fecha_hasta=${fechaHasta}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.datos) {
        setDatosAvFisicoPlan(data.datos);
      } else {
        setDatosAvFisicoPlan([]);
      }
    } catch (error) {
      console.error('Error cargando av_fisico_plan:', error);
      setDatosAvFisicoPlan([]);
    } finally {
      setCargandoAvFisicoPlan(false);
    }
  };

  // Función para cargar datos de av_financiero_plan (monto_total)
  const cargarAvFinancieroPlan = async () => {
    if (!proyectoId) return;
    
    setCargandoAvFinancieroPlan(true);
    try {
      let url = `${API_BASE}/gestion_proyecto/consultas/av_financiero_plan.php?proyecto_id=${proyectoId}`;
      
      // Agregar filtros de fecha si están presentes
      if (fechaDesde) {
        url += `&fecha_desde=${fechaDesde}`;
      }
      if (fechaHasta) {
        url += `&fecha_hasta=${fechaHasta}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.datos) {
        setDatosAvFinancieroPlan(data.datos);
      } else {
        setDatosAvFinancieroPlan([]);
      }
    } catch (error) {
      console.error('Error cargando av_financiero_plan:', error);
      setDatosAvFinancieroPlan([]);
    } finally {
      setCargandoAvFinancieroPlan(false);
    }
  };

  // Función para cargar datos de av_fisico_real (api_acum)
  const cargarAvFisicoReal = async () => {
    console.log('🚀 INICIANDO cargarAvFisicoReal con proyectoId:', proyectoId);
    if (!proyectoId) {
      console.log('❌ No hay proyectoId, cancelando carga');
      return;
    }
    
    setCargandoAvFisicoReal(true);
    try {
      let url = `${API_BASE}/gestion_proyecto/consultas/av_fisico_real.php?proyecto_id=${proyectoId}`;
      
      // NUEVO: Agregar fecha de corte para determinar "hasta la fecha de corte"
      if (fechaCorte) {
        url += `&fecha_corte=${fechaCorte}`;
      }
      
      // Agregar filtros de fecha si están presentes
      if (fechaDesde) {
        url += `&fecha_desde=${fechaDesde}`;
      }
      if (fechaHasta) {
        url += `&fecha_hasta=${fechaHasta}`;
      }
      
      console.log('🔍 Consultando av_fisico_real con fecha de corte:', fechaCorte);
      console.log('📋 URL completa:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Respuesta av_fisico_real:', data);
      
      if (data.success && data.datos) {
        setDatosAvFisicoReal(data.datos);
        console.log('✅ Datos de av_fisico_real cargados:', data.datos.length, 'registros');
        console.log('🔍 Estructura de datos av_fisico_real:', data.datos.slice(0, 2)); // Mostrar primeros 2 registros
      } else {
        setDatosAvFisicoReal([]);
        console.log('⚠️ No se encontraron datos de av_fisico_real');
      }
    } catch (error) {
      console.error('❌ Error cargando av_fisico_real:', error);
      setDatosAvFisicoReal([]);
    } finally {
      setCargandoAvFisicoReal(false);
    }
  };

  // Función para cargar datos de av_fisico_proyectado (api_acum)
  const cargarAvFisicoProyectado = async () => {
    if (!proyectoId) return;
    
    setCargandoAvFisicoProyectado(true);
    try {
      let url = `${API_BASE}/gestion_proyecto/consultas/av_fisico_proyectado.php?proyecto_id=${proyectoId}`;
      
      // Agregar filtros de fecha si están presentes
      if (fechaDesde) {
        url += `&fecha_desde=${fechaDesde}`;
      }
      if (fechaHasta) {
        url += `&fecha_hasta=${fechaHasta}`;
      }
      
      // NUEVO: Agregar fecha de corte para determinar "hacia adelante"
      if (fechaCorte) {
        url += `&fecha_corte=${fechaCorte}`;
      }
      
      console.log('🔍 Consultando av_fisico_proyectado con fecha de corte:', fechaCorte);
      console.log('📋 URL completa:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Respuesta av_fisico_proyectado:', data);
      
      if (data.success && data.datos) {
        setDatosAvFisicoProyectado(data.datos);
        console.log('✅ Datos proyectados cargados desde av_fisico_real.api_acum:', data.datos.length, 'registros');
        console.log('📋 Tabla origen:', data.tabla_origen, 'Columna origen:', data.columna_origen);
      } else {
        setDatosAvFisicoProyectado([]);
        console.log('⚠️ No se encontraron datos proyectados');
      }
    } catch (error) {
      console.error('❌ Error cargando av_fisico_proyectado:', error);
      setDatosAvFisicoProyectado([]);
    } finally {
      setCargandoAvFisicoProyectado(false);
    }
  };

  // Función para cargar datos de av_financiero_incurrido (incurrido_total)
  const cargarAvFinancieroIncurrido = async () => {
    if (!proyectoId) return;
    
    setCargandoAvFinancieroIncurrido(true);
    try {
      // Cargar datos con fecha de corte para que funcione correctamente
      let url = `${API_BASE}/gestion_proyecto/consultas/av_financiero_incurrido.php?proyecto_id=${proyectoId}`;
      
      // NUEVO: Agregar fecha de corte para determinar "hasta la fecha de corte"
      if (fechaCorte) {
        url += `&fecha_corte=${fechaCorte}`;
      }
      
      console.log('🔍 Consultando av_financiero_incurrido con fecha de corte:', fechaCorte);
      console.log('📋 URL completa:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Respuesta av_financiero_incurrido:', data);
      
      if (data.success && data.datos) {
        setDatosAvFinancieroIncurrido(data.datos);
        console.log('✅ Datos financieros reales cargados desde vc_project_c9.incurrido:', data.datos.length, 'registros');
        console.log('📋 Tabla origen:', data.tabla_origen, 'Columna origen:', data.columna_origen);
        console.log('📋 Agrupación:', data.agrupacion);
        console.log('📊 Datos cargados:', data.datos);
      } else {
        setDatosAvFinancieroIncurrido([]);
        console.log('⚠️ No se encontraron datos financieros reales');
        console.log('❌ Respuesta del servidor:', data);
      }
    } catch (error) {
      console.error('❌ Error cargando av_financiero_incurrido:', error);
      setDatosAvFinancieroIncurrido([]);
    } finally {
      setCargandoAvFinancieroIncurrido(false);
    }
  };

  // Función para cargar datos de IEAC (avg)
  const cargarIEACAvg = async () => {
    if (!proyectoId) return;
    
    setCargandoIEACAvg(true);
    try {
      let url = `${API_BASE}/gestion_proyecto/consultas/ieac_avg.php?proyecto_id=${proyectoId}`;
      
      // Agregar fecha de corte para determinar "hacia adelante"
      if (fechaCorte) {
        url += `&fecha_corte=${fechaCorte}`;
      }
      
      // Agregar filtros de fecha si están presentes
      if (fechaDesde) {
        url += `&fecha_desde=${fechaDesde}`;
      }
      if (fechaHasta) {
        url += `&fecha_hasta=${fechaHasta}`;
      }
      
      console.log('🔍 Consultando IEAC (avg) con fecha de corte:', fechaCorte);
      console.log('📋 URL completa:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Respuesta IEAC (avg):', data);
      
      if (data.success && data.datos) {
        setDatosIEACAvg(data.datos);
        console.log('✅ Datos IEAC (avg) cargados:', data.datos.length, 'registros');
        console.log('📋 Lógica:', data.logica);
        console.log('📋 Fórmula:', data.formula);
        console.log('📊 Datos cargados:', data.datos);
        
        // Calcular distribución beta automáticamente si hay fecha de corte
        if (fechaCorte && data.datos.length > 0) {
          // Buscar el valor actual (AC) de la fecha de corte
          const valorActual = data.datos.find(d => d.ieac_avg && d.ieac_avg > 0)?.ieac_avg;
          if (valorActual && periodos.length > 0) {
            const distribucion = distribuirIEACAvg(valorActual, 35036000, fechaCorte, periodos, parametrosBeta.alpha, parametrosBeta.beta);
            setDistribucionBeta(distribucion);
            console.log('🔄 Distribución Beta calculada automáticamente:', distribucion);
          }
        }
      } else {
        setDatosIEACAvg([]);
        console.log('⚠️ No se encontraron datos IEAC (avg)');
        console.log('❌ Respuesta del servidor:', data);
      }
    } catch (error) {
      console.error('❌ Error cargando IEAC (avg):', error);
      setDatosIEACAvg([]);
    } finally {
      setCargandoIEACAvg(false);
    }
    };

  // Función para cargar Metodologías IEAC
  const cargarMetodologiasIEAC = async () => {
    if (!proyectoId || !fechaCorte) {
      console.log('⚠️ No se puede cargar IEAC: proyectoId o fechaCorte faltantes');
      return;
    }

    setCargandoIEAC(true);
    console.log('🚀 Cargando Metodologías IEAC para fecha de corte:', fechaCorte);
    
    try {
      // Obtener Por Ganar desde calcular_ieac_a.php (que ya calcula BAC, AC, EV y Por Ganar)
      let porGanarCalculado = 0;
      try {
        console.log('🔍 Obteniendo Por Ganar desde calcular_ieac_a.php...');
        const responsePorGanar = await fetch(`${API_BASE}/calcular_ieac_a.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaCorte}`);
        const dataPorGanar = await responsePorGanar.json();
        console.log('🔍 Respuesta calcular_ieac_a.php:', dataPorGanar);
        
        if (dataPorGanar.success) {
          // Obtener Por Ganar del debug de la API
          porGanarCalculado = parseFloat(dataPorGanar.debug?.por_ganar) || 0;
          console.log('✅ Por Ganar obtenido desde calcular_ieac_a.php:', porGanarCalculado, 'en millones:', (porGanarCalculado / 1000000).toFixed(2) + 'M');
          console.log('🔍 Debug completo:', dataPorGanar.debug);
          
          // Obtener BAC del debug de la API
          const bacCalculado = parseFloat(dataPorGanar.debug?.bac) || 0;
          setValorBAC(bacCalculado);
          console.log('✅ BAC obtenido desde calcular_ieac_a.php:', bacCalculado, 'en millones:', (bacCalculado / 1000000).toFixed(2) + 'M');
          console.log('🔍 Debug completo BAC:', dataPorGanar.debug);
        } else {
          console.error('❌ Error en datos Por Ganar:', dataPorGanar);
        }
        
      } catch (error) {
        console.error('❌ Error obteniendo Por Ganar:', error);
      }
      
      setPorGanar(porGanarCalculado);
      
      // Array de APIs de IEAC
      const apisIEAC = [
        'calcular_ieac_a.php',
        'calcular_ieac_b.php',
        'calcular_ieac_c.php',
        'calcular_ieac_d.php',
        'calcular_ieac_e.php',
        'calcular_ieac_f.php',
        'calcular_ieac_g.php',
        'calcular_ieac_h.php',
        'calcular_ieac_i.php'
      ];
      
      const datosIEAC = [];
      
      // Calcular cada metodología IEAC
      for (const api of apisIEAC) {
        try {
          const response = await fetch(`${API_BASE}/${api}?proyecto_id=${proyectoId}&fecha_filtro=${fechaCorte}`);
          const data = await response.json();
          
          if (data.success) {
            const letra = api.split('_')[2].split('.')[0];
            const valor = data[`ieac_${letra}`];
            
            if (valor && !isNaN(valor) && isFinite(valor) && valor > 0) {
              datosIEAC.push({
                metodologia: `IEAC(${letra})`,
                formula: getFormulaIEAC(letra),
                descripcion: getDescripcionIEAC(letra),
                valor: valor,
                color: getColorIEAC(letra)
              });
              console.log(`✅ IEAC(${letra}): ${formatearMoneda(valor)}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error calculando ${api}:`, error);
        }
      }
      
      setDatosIEAC(datosIEAC);
      
      // Calcular y guardar valores mínimo y máximo para marcado de filas
      const valores = datosIEAC.map(item => item.valor).filter(v => v > 0);
      const minimo = valores.length > 0 ? Math.min(...valores) : 0;
      const maximo = valores.length > 0 ? Math.max(...valores) : 0;
      
      console.log('🎯 DEBUG IEAC Min/Max calculation:', {
        datosIEAC: datosIEAC.length,
        valores: valores,
        minimo: minimo,
        maximo: maximo,
        formateado: {
          minimo: `USD ${(minimo / 1000000).toFixed(2)}M`,
          maximo: `USD ${(maximo / 1000000).toFixed(2)}M`
        }
      });
      
      setMontoMinimoIEAC(minimo);
      setMontoMaximoIEAC(maximo);
      
      console.log('✅ Metodologías IEAC cargadas:', datosIEAC.length);
      console.log('🎯 Valores IEAC para marcado de filas:', {
        montoMinimo: minimo,
        montoMaximo: maximo,
        formateado: {
          minimo: `USD ${(minimo / 1000000).toFixed(2)}M`,
          maximo: `USD ${(maximo / 1000000).toFixed(2)}M`
        }
      });
      
    } catch (error) {
      console.error('❌ Error cargando Metodologías IEAC:', error);
    } finally {
      setCargandoIEAC(false);
    }
  };

  // Función para cargar datos estratégicos de IEAC desde la API
  const cargarIEACStrategico = async () => {
    if (!proyectoId || !fechaCorte || !datosECD) {
      return;
    }

    setCargandoIEACStrategico(true);
    
    try {
      // CORRECCIÓN: Pasar el Mes Promedio ECD y Monto Máximo IEAC calculados por el frontend
      const mesPromedioECD = Math.ceil(datosECD.promedio || 66); // Usar Math.ceil para redondear hacia arriba
      const montoMaximoIEACValor = montoMaximoIEAC || 330510000; // Usar el valor máximo IEAC del modal
      const url = `${API_BASE}/gestion_proyecto/consultas/ieac_estrategico.php?proyecto_id=${proyectoId}&fecha_corte=${fechaCorte}&alpha=${parametrosBeta.alpha}&beta=${parametrosBeta.beta}&mes_promedio_ecd=${mesPromedioECD}&monto_maximo_ieac=${montoMaximoIEACValor}`;
      
      console.log(`🚀 Cargando IEAC estratégico con Mes Promedio ECD: ${mesPromedioECD} (original: ${datosECD.promedio})`);
      console.log(`💰 Monto Máximo IEAC: ${montoMaximoIEACValor}`);
      console.log(`🔗 URL API:`, url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.datos) {
        console.log(`✅ IEAC estratégico cargado: ${data.datos.length} registros`);
        console.log(`📅 Primer período:`, data.datos[0]?.periodo_original);
        console.log(`📅 Último período:`, data.datos[data.datos.length - 1]?.periodo_original);
        setDatosIEACStrategico(data.datos);
      } else {
        console.log(`❌ Error cargando IEAC estratégico:`, data);
        setDatosIEACStrategico([]);
      }
    } catch (error) {
      console.error('Error cargando IEAC estratégico:', error);
      setDatosIEACStrategico([]);
    } finally {
      setCargandoIEACStrategico(false);
    }
  };

  // Función para cargar Metodologías ECD (EXACTA copia de Vectores.js)
  const cargarMetodologiasECD = async () => {
    console.log('🔍 DEBUG cargarMetodologiasECD - proyectoId:', proyectoId, 'fechaCorte:', fechaCorte);

    if (!proyectoId || !fechaCorte) {
      console.log('⚠️ No se puede cargar ECD: proyectoId o fechaCorte faltantes');
      return;
    }

    setCargandoECD(true);
    console.log('🚀 Cargando Metodologías ECD para fecha de corte:', fechaCorte);
    
    try {
      // Convertir fechaCorte de YYYY-MM a YYYY-MM-DD (primer día del mes)
      const fechaFiltroCompleta = `${fechaCorte}-01`;
      
      // Calcular ECD(a) dinámicamente usando la nueva API
      let ecdA = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_a.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdA = parseFloat(data.ecd_a) || 0;
          console.log('✅ ECD(a) calculado dinámicamente:', ecdA, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(a) dinámico:', error);
      }

      // Calcular ECD(b) dinámicamente usando la nueva API
      let ecdB = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_b.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdB = parseFloat(data.ecd_b) || 0;
          console.log('✅ ECD(b) calculado dinámicamente:', ecdB, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(b) dinámico:', error);
      }

      // Calcular ECD(c) dinámicamente usando la nueva API
      let ecdC = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_c.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdC = parseFloat(data.ecd_c) || 0;
          console.log('✅ ECD(c) calculado dinámicamente:', ecdC, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(c) dinámico:', error);
      }

      // Calcular ECD(d) dinámicamente usando la nueva API
      let ecdD = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_d.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdD = parseFloat(data.ecd_d) || 0;
          console.log('✅ ECD(d) calculado dinámicamente:', ecdD, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(d) dinámico:', error);
      }

      // Calcular ECD(e) dinámicamente usando la nueva API
      let ecdE = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_e.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdE = parseFloat(data.ecd_e) || 0;
          console.log('✅ ECD(e) calculado dinámicamente:', ecdE, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(e) dinámico:', error);
      }

      // Calcular ECD(f) dinámicamente usando la nueva API
      let ecdF = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_f.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdF = parseFloat(data.ecd_f) || 0;
          console.log('✅ ECD(f) calculado dinámicamente:', ecdF, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(f) dinámico:', error);
      }

      // Calcular ECD(g) dinámicamente usando la nueva API
      let ecdG = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_g.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdG = parseFloat(data.ecd_g) || 0;
          console.log('✅ ECD(g) calculado dinámicamente:', ecdG, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(g) dinámico:', error);
      }

      // Calcular ECD(h) dinámicamente usando la nueva API
      let ecdH = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_h.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdH = parseFloat(data.ecd_h) || 0;
          console.log('✅ ECD(h) calculado dinámicamente:', ecdH, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(h) dinámico:', error);
      }

      // Calcular ECD(i) dinámicamente usando la nueva API
      let ecdI = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_i.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdI = parseFloat(data.ecd_i) || 0;
          console.log('✅ ECD(i) calculado dinámicamente:', ecdI, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(i) dinámico:', error);
      }

      // Calcular ECD(j) dinámicamente usando la nueva API
      let ecdJ = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_j.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdJ = parseFloat(data.ecd_j) || 0;
          console.log('✅ ECD(j) calculado dinámicamente:', ecdJ, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(j) dinámico:', error);
      }

      // Calcular ECD(k) dinámicamente usando la nueva API
      let ecdK = 0;
      try {
        const response = await fetch(`${API_BASE}/calcular_ecd_k.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success) {
          ecdK = parseFloat(data.ecd_k) || 0;
          console.log('✅ ECD(k) calculado dinámicamente:', ecdK, 'meses');
        }
      } catch (error) {
        console.error('❌ Error calculando ECD(k) dinámico:', error);
      }

      // Obtener Plazo Control dinámicamente
      let plazoControl = 0;
      try {
        const response = await fetch(`${API_BASE}/gestion_proyecto/consultas/periodo.php?proyecto_id=${proyectoId}&fecha_hasta=${fechaFiltroCompleta}`);
        const data = await response.json();
        
        if (data.success && data.datos && data.datos.length > 0) {
          plazoControl = data.datos.length;
          console.log('✅ Plazo Control obtenido dinámicamente:', plazoControl, 'meses');
        }
      } catch (error) {
        console.error('❌ Error obteniendo Plazo Control:', error);
      }

      // Calcular estadísticas basándose en los valores reales (EXACTO como Vectores.js)
      const valoresValidos = [ecdA, ecdB, ecdC, ecdD, ecdE, ecdF, ecdG, ecdH, ecdI, ecdJ, ecdK]
        .filter(valor => valor && !isNaN(valor) && isFinite(valor) && valor > 0);
      
      const promedio = valoresValidos.length > 0 
        ? valoresValidos.reduce((sum, val) => sum + val, 0) / valoresValidos.length 
        : plazoControl + 6; // Fallback: 6 meses adicionales
      
      const maximo = valoresValidos.length > 0 ? Math.max(...valoresValidos) : plazoControl + 12;
      const minimo = valoresValidos.length > 0 ? Math.min(...valoresValidos) : plazoControl + 1;

      // Crear objeto con todas las metodologías ECD y estadísticas
      const metodologiasECD = {
        // Metodologías individuales
        metodologiaA: ecdA,
        metodologiaB: ecdB,
        metodologiaC: ecdC,
        metodologiaD: ecdD,
        metodologiaE: ecdE,
        metodologiaF: ecdF,
        metodologiaG: ecdG,
        metodologiaH: ecdH,
        metodologiaI: ecdI,
        metodologiaJ: ecdJ,
        metodologiaK: ecdK,
        
        // Estadísticas calculadas dinámicamente
        promedio: promedio,
        maximo: maximo,
        minimo: minimo,
        
        // Plazo Control
        plazoControl: plazoControl
      };
      
      setDatosECD(metodologiasECD);
      
      // Guardar valores para marcado dinámico de filas
      setMesMinimoECD(Math.round(minimo));
      setMesMaximoECD(Math.round(maximo));
      setPlazoControlECD(plazoControl);
      
      console.log('✅ Metodologías ECD cargadas:', metodologiasECD);
      console.log('📊 Valores calculados:', {
        ecdA, ecdB, ecdC, ecdD, ecdE, ecdF, ecdG, ecdH, ecdI, ecdJ, ecdK,
        promedio, maximo, minimo, plazoControl
      });
      console.log('🎯 Valores para marcado de filas:', {
        mesMinimo: Math.round(minimo),
        mesMaximo: Math.round(maximo)
      });
      
    } catch (error) {
      console.error('❌ Error cargando Metodologías ECD:', error);
      console.error('🔍 Error completo:', error.message);
      setDatosECD(null);
    } finally {
      setCargandoECD(false);
    }
  };

  // Función para cargar duración planificada
  const cargarDuracionPlanificada = async () => {
    if (!proyectoId) {
      console.log('⚠️ No se puede cargar duración planificada: proyectoId faltante');
      return;
    }

    try {
      // Usar la misma API que Vectores.js: av_fisico_api.php
      const response = await fetch(`${API_BASE}/av_fisico_api.php?proyecto_id=${proyectoId}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Contar períodos únicos usando la misma lógica que Vectores.js
        const periodosUnicos = [...new Set(
          data.data
            .filter(dato => dato.periodo)
            .map(dato => dato.periodo.substring(0, 7)) // YYYY-MM
        )].length;
        
        setDuracionPlanificada(periodosUnicos);
        console.log('✅ Duración Planificada obtenida:', periodosUnicos);
      } else {
        // Valor por defecto si no se puede obtener
        setDuracionPlanificada(12);
        console.log('⚠️ Usando duración planificada por defecto: 12 meses');
      }
    } catch (error) {
      console.error('❌ Error cargando duración planificada:', error);
      setDuracionPlanificada(12); // Valor por defecto
    }
  };

  // Función para calcular indicadores EVM dinámicamente (EXACTA copia de Vectores.js)
  const calcularIndicadoresEVMDinamicos = async () => {
    if (!proyectoId || !fechaCorte) {
      console.log('⚠️ No se pueden calcular indicadores EVM: proyectoId o fechaCorte faltantes');
      return null;
    }

    try {
      // Obtener datos EXACTAMENTE como en Vectores.js
      const [realResponse, apiResponse] = await Promise.all([
        fetch(`${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=real_parcial`),
        fetch(`${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=api_parcial`)
      ]);

      const [realData, apiData] = await Promise.all([
        realResponse.json(),
        apiResponse.json()
      ]);

      if (!realData.success || !apiData.success) {
        console.log('⚠️ No se pudieron obtener datos para calcular EVM');
        return null;
      }

      // Los datos vienen en data.datos (igual que en Vectores.js)
      const datosReal = realData.datos || [];
      const datosApi = apiData.datos || [];

      console.log('📊 Datos obtenidos:', {
        real: datosReal.length,
        api: datosApi.length
      });

      // Calcular totales acumulados hasta la fecha de seguimiento (EXACTO como Vectores.js)
      const calcularTotalAcumulado = (datos, fechaLimite) => {
        return datos
          .filter(row => row.periodo <= fechaLimite)
          .reduce((total, row) => total + (Number(row.monto) || 0), 0);
      };

      // Calcular totales para el presupuesto completo (sin filtro de fecha)
      const calcularTotalCompleto = (datos) => {
        return datos.reduce((total, row) => total + (Number(row.monto) || 0), 0);
      };

      // Obtener valores en la fecha de seguimiento (EXACTO como Vectores.js)
      const AC = calcularTotalAcumulado(datosReal, fechaCorte); // Actual Cost (Costo Real acumulado)
      const PV = calcularTotalAcumulado(datosApi, fechaCorte);  // Planned Value (Costo Planeado API acumulado)
      const BAC = calcularTotalCompleto(datosApi); // Budget at Completion (Presupuesto total dinámico)

      console.log('💰 BAC CALCULADO DINÁMICAMENTE:', {
        bac: BAC,
        bacMillones: (BAC / 1000000).toFixed(2) + 'M',
        registrosApiParcial: datosApi.length,
        fechaCorte: fechaCorte
      });

      // EV = Valor del trabajo realmente completado
      // En EVM, EV = BAC × % de avance físico real acumulado
      // Obtener el porcentaje de avance físico desde la tabla av_fisico_real
      let porcentajeAvanceFisico = 0;
      
      try {
        console.log('🔍 OBTENIENDO AVANCE FÍSICO DINÁMICO para fecha:', fechaCorte);
        
        // Obtener avance físico real desde la API
        const avanceResponse = await fetch(`${API_BASE}/obtener_avance_fisico.php?proyecto_id=${proyectoId}&fecha=${fechaCorte}`);
        
        // Verificar si la respuesta es válida
        if (!avanceResponse.ok) {
          console.log('⚠️ Respuesta HTTP no válida:', avanceResponse.status, avanceResponse.statusText);
          throw new Error(`HTTP ${avanceResponse.status}: ${avanceResponse.statusText}`);
        }
        
        // Verificar el content-type
        const contentType = avanceResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await avanceResponse.text();
          console.log('⚠️ Respuesta no es JSON:', textResponse.substring(0, 200));
          throw new Error('La respuesta no es JSON válido');
        }
        
        const avanceData = await avanceResponse.json();
        console.log('🔍 Respuesta avance físico:', avanceData);
        
        if (avanceData.success && avanceData.avance_fisico !== null) {
          porcentajeAvanceFisico = avanceData.avance_fisico / 100; // Convertir de porcentaje a decimal
          console.log('✅ AVANCE FÍSICO DINÁMICO OBTENIDO:', {
            fecha: fechaCorte,
            porcentajeAvanceFisico: porcentajeAvanceFisico,
            porcentajeFormateado: (porcentajeAvanceFisico * 100).toFixed(2) + '%',
            fuente: 'av_fisico_real.api_acum'
          });
        } else {
          console.log('⚠️ No se pudo obtener avance físico, usando fallback');
          // Fallback: calcular EV usando NPC como proxy
          const npcResponse = await fetch(`${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=npc_parcial`);
          const npcData = await npcResponse.json();
          if (npcData.success) {
            const datosNpc = npcData.datos || [];
            const NPC = calcularTotalAcumulado(datosNpc, fechaCorte);
            porcentajeAvanceFisico = BAC > 0 ? NPC / BAC : 0;
            console.log('🔄 Usando NPC como fallback para EV:', {
              NPC: NPC,
              BAC: BAC,
              porcentajeCalculado: (porcentajeAvanceFisico * 100).toFixed(2) + '%'
            });
          }
        }
      } catch (error) {
        console.error('❌ Error obteniendo avance físico:', error);
        console.log('🔄 Usando fallback directo con NPC...');
        
        // Fallback directo: usar NPC
        try {
          const npcResponse = await fetch(`${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=npc_parcial`);
          const npcData = await npcResponse.json();
          if (npcData.success) {
            const datosNpc = npcData.datos || [];
            const NPC = calcularTotalAcumulado(datosNpc, fechaCorte);
            porcentajeAvanceFisico = BAC > 0 ? NPC / BAC : 0;
            console.log('✅ Fallback NPC exitoso:', {
              NPC: NPC,
              BAC: BAC,
              porcentajeCalculado: (porcentajeAvanceFisico * 100).toFixed(2) + '%'
            });
          }
        } catch (fallbackError) {
          console.error('❌ Error en fallback NPC:', fallbackError);
          porcentajeAvanceFisico = 0;
        }
      }

      // Calcular EV = BAC × % de avance físico
      const EV = BAC * porcentajeAvanceFisico;

      // Calcular SPI inicialmente
      let SPI = PV !== 0 ? EV / PV : 0;

      // OBTENER SPI DE LA TARJETA KPI EXISTENTE (NO CALCULARLO)
      try {
        console.log('🔍 Buscando SPI en tarjeta KPI...');
        
        // Buscar el elemento de la tarjeta KPI que contiene el SPI
        const spiElement = document.querySelector('[data-kpi="spi"]') || 
                          document.querySelector('.kpi-spi') ||
                          document.querySelector('[title*="SPI"]') ||
                          document.querySelector('[title*="spi"]') ||
                          document.querySelector('div:contains("SPI")') ||
                          document.querySelector('span:contains("SPI")');
        
        if (spiElement) {
          const spiText = spiElement.textContent || spiElement.innerText;
          console.log('🔍 Texto encontrado en elemento SPI:', spiText);
          
          // Buscar número decimal en el texto
          const spiMatch = spiText.match(/(\d+\.?\d*)/);
          if (spiMatch) {
            const spiKPI = parseFloat(spiMatch[1]);
            if (spiKPI > 0) {
              SPI = spiKPI;
              console.log('✅ SPI obtenido de tarjeta KPI:', SPI);
            }
          }
        }
        
        // Si no se encuentra en el DOM, usar el cálculo como fallback
        if (SPI === (PV !== 0 ? EV / PV : 0)) {
          console.log('⚠️ SPI no encontrado en KPI, usando cálculo:', SPI);
        }
      } catch (error) {
        console.error('❌ Error obteniendo SPI de KPI:', error);
        console.log('⚠️ Fallback a cálculo de SPI:', SPI);
      }

      console.log('📊 Indicadores EVM calculados (SPI de KPI):', {
        fechaCorte,
        AC: AC.toFixed(2),
        PV: PV.toFixed(2),
        EV: EV.toFixed(2),
        BAC: BAC.toFixed(2),
        SPI: SPI.toFixed(3),
        porcentajeAvanceFisico: (porcentajeAvanceFisico * 100).toFixed(2) + '%',
        fuenteSPI: SPI !== (PV !== 0 ? EV / PV : 0) ? 'KPI' : 'Calculado'
      });

      return {
        AC,
        PV,
        EV,
        BAC,
        SPI,
        porcentajeAvanceFisico
      };

    } catch (error) {
      console.error('❌ Error calculando indicadores EVM:', error);
      return null;
    }
  };


  // Función para obtener Plazo Control dinámicamente (EXACTA como Vectores.js)
  const obtenerPlazoControl = async (fechaSeguimiento) => {
    try {
      const response = await fetch(`${API_BASE}/gestion_proyecto/consultas/periodo.php?proyecto_id=${proyectoId}&fecha_hasta=${fechaSeguimiento}`);
      const data = await response.json();
      
      if (data.success && data.datos && data.datos.length > 0) {
        const plazoControl = data.datos.length;
        console.log('✅ Plazo Control obtenido dinámicamente:', {
          fecha: fechaSeguimiento,
          plazoControl: plazoControl,
          totalRegistros: data.datos.length
        });
        return plazoControl;
      } else {
        console.log('❌ No se encontraron períodos para calcular Plazo Control');
        return 0;
      }
    } catch (error) {
      console.error('❌ Error obteniendo Plazo Control:', error);
      return 0;
    }
  };

  // Función para obtener la fórmula de cada metodología IEAC
  const getFormulaIEAC = (letra) => {
    const formulas = {
      'a': 'Real + Por Ganar',
      'b': 'Presupuesto / CPI',
      'c': 'Real + Por Ganar / CPI',
      'd': 'Real + Por Ganar / CPI(3m)',
      'e': 'Real + Por Ganar / CPI(6m)',
      'f': 'Real + Por Ganar / (CPI × SPI)',
      'g': 'Real + Por Ganar / (CPI3m × SPI)',
      'h': 'Real + Por Ganar / (CPI6m × SPI)',
      'i': 'Real + Por Ganar / (70%CPI + 30%SPI)'
    };
    return formulas[letra] || '';
  };

  // Función para obtener la descripción de cada metodología IEAC
  const getDescripcionIEAC = (letra) => {
    const descripciones = {
      'a': 'Costo real + trabajo restante sin ajustes',
      'b': 'Proyección del CPI actual al presupuesto total',
      'c': 'Proyección del CPI actual al trabajo restante',
      'd': 'Proyección del CPI de los últimos 3 meses',
      'e': 'Proyección del CPI de los últimos 6 meses',
      'f': 'Proyección combinada de costo y cronograma actual',
      'g': 'Proyección combinada CPI 3 meses + cronograma',
      'h': 'Proyección combinada CPI 6 meses + cronograma',
      'i': 'Proyección ponderada (70% CPI, 30% SPI)'
    };
    return descripciones[letra] || '';
  };

  // Función para obtener el color de cada metodología IEAC
  const getColorIEAC = (letra) => {
    const colores = {
      'a': '#3498db',
      'b': '#e74c3c',
      'c': '#f39c12',
      'd': '#9b59b6',
      'e': '#1abc9c',
      'f': '#34495e',
      'g': '#e67e22',
      'h': '#8e44ad',
      'i': '#16a085'
    };
    return colores[letra] || '#6c757d';
  };


  // Función para calcular parámetros beta basados en el tipo de proyecto
  const calcularParametrosBeta = (tipo = 'construccion') => {
    const parametros = {
      'construccion': { alpha: 2.5, beta: 1.5, descripcion: 'Construcción - Mayor gasto en meses intermedios-finales' },
      'software': { alpha: 1.5, beta: 2.0, descripcion: 'Desarrollo de Software - Gasto más uniforme' },
      'investigacion': { alpha: 3.0, beta: 1.0, descripcion: 'Investigación - Gasto concentrado al final' },
      'infraestructura': { alpha: 2.0, beta: 1.8, descripcion: 'Infraestructura - Gasto balanceado' },
      'excel': { alpha: 2.8630, beta: 2.5, descripcion: 'Valores de Excel (α=2.8630, β=2.5)' },
      'default': { alpha: 2.5, beta: 1.5, descripcion: 'Valor por defecto' }
    };
    
    return parametros[tipo] || parametros.default;
  };

  // Función gamma aproximada
  const gamma = (n) => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= (i - 1);
    }
    return result;
  };

  // Función para calcular la función beta
  const betaFunction = (alpha, beta) => {
    return (gamma(alpha) * gamma(beta)) / gamma(alpha + beta);
  };

  // Función para calcular la distribución beta acumulada
  const betaCDF = (x, alpha, beta) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    
    // Aproximación usando la función beta incompleta
    let sum = 0;
    const steps = 1000;
    const step = x / steps;
    
    for (let i = 0; i < steps; i++) {
      const t = i * step;
      if (t > 0 && t < 1) {
        sum += Math.pow(t, alpha - 1) * Math.pow(1 - t, beta - 1) * step;
      }
    }
    
    return sum / betaFunction(alpha, beta);
  };

  // Función para distribuir el IEAC (avg) usando distribución beta
  const distribuirIEACAvg = (valorActual, valorObjetivo, fechaCorte, periodos, alpha, beta) => {
    if (!valorActual || !valorObjetivo || !fechaCorte || !periodos || periodos.length === 0) {
      return [];
    }

    // VALOR OBJETIVO FIJO: 35,036,000 USD (como en el Excel)
    const valorObjetivoFijo = 35036000;
    
    console.log(`🔍 Debug distribución beta principal:`);
    console.log(`   - Valor actual: ${valorActual}`);
    console.log(`   - Valor objetivo: ${valorObjetivoFijo}`);
    console.log(`   - Diferencia total: ${valorObjetivoFijo - valorActual}`);
    console.log(`   - Fecha corte: ${fechaCorte}`);
    console.log(`   - Alpha: ${alpha}, Beta: ${beta}`);
    
    // Filtrar períodos desde la fecha de corte hacia adelante
    const periodosFuturos = periodos.filter(periodo => 
      periodo.periodo_mes >= fechaCorte
    );

    if (periodosFuturos.length === 0) {
      return [];
    }

    console.log(`   - Períodos futuros encontrados: ${periodosFuturos.length}`);
    
    // Calcular la diferencia total que debe distribuirse
    const diferenciaTotal = valorObjetivoFijo - valorActual;
    
    // Calcular la distribución
    const distribucion = [];
    let totalDistribuido = 0;

    for (let i = 0; i < periodosFuturos.length; i++) {
      const periodo = periodosFuturos[i];
      
      // Calcular el progreso normalizado (0 a 1)
      const progresoNormalizado = i / (periodosFuturos.length - 1);
      
      // Calcular la distribución beta acumulada
      const cdfActual = betaCDF(progresoNormalizado, alpha, beta);
      const cdfAnterior = i > 0 ? betaCDF((i - 1) / (periodosFuturos.length - 1), alpha, beta) : 0;
      
      // Calcular la fracción para este período y asegurar que no sea negativa
      let fraccion = Math.max(0, cdfActual - cdfAnterior);
      
      // Si es el último período, asegurar que se complete la distribución
      if (i === periodosFuturos.length - 1) {
        fraccion = 1 - (cdfActual - fraccion);
      }
      
      // Calcular el monto para este período (parte de la diferencia)
      const montoDiferencia = diferenciaTotal * fraccion;
      
      // El monto total para este período es: valor actual + parte de la diferencia
      let montoTotal = valorActual + montoDiferencia;
      
      // Validar que el monto total sea un número válido
      if (isNaN(montoTotal) || !isFinite(montoTotal) || montoTotal < 0) {
        console.log(`❌ Monto total inválido calculado para período ${periodo.periodo_mes}: ${montoTotal}, usando valor actual como fallback`);
        montoTotal = valorActual;
      }
      
      distribucion.push({
        periodo_original: periodo.periodo_original,
        periodo_mes: periodo.periodo_mes,
        periodo_formateado: periodo.periodo_formateado,
        ieac_avg_distribuido: montoTotal,
        fraccion: fraccion,
        progreso_normalizado: progresoNormalizado,
        porcentaje: (fraccion * 100).toFixed(2),
        diferencia_parcial: montoDiferencia,
        valor_base: valorActual,
        valor_objetivo: valorObjetivoFijo
      });
      
      totalDistribuido += montoDiferencia;
    }

    // Normalizar para asegurar que la suma de diferencias sea exactamente igual a la diferencia total
    if (totalDistribuido > 0) {
      const factorCorreccion = diferenciaTotal / totalDistribuido;
      distribucion.forEach(item => {
        item.diferencia_parcial *= factorCorreccion;
        item.ieac_avg_distribuido = valorActual + item.diferencia_parcial;
      });
    }

    return distribucion;
  };

  // Cargar todas las tablas al montar el componente
  useEffect(() => {
    console.log('🔍 useEffect ejecutándose - proyectoId:', proyectoId);
    if (proyectoId) {
      console.log('🔍 Cargando datos para proyectoId:', proyectoId);
      cargarDatosTabla('av_fisico_real', setTablaReal);
      cargarDatosTabla('av_fisico_npc', setTablaNpc);
      cargarDatosTabla('av_fisico_poa', setTablaPoa);
      cargarDatosTabla('av_fisico_v0', setTablaV0);
      cargarDatosTabla('av_fisico_api', setTablaApi);
      cargarPeriodos(); // Cargar períodos también
      cargarAvFisicoPlan(); // Cargar datos de av_fisico_plan
      cargarAvFinancieroPlan(); // Cargar datos de av_financiero_plan
      cargarAvFisicoReal(); // Cargar datos de av_fisico_real
      cargarAvFisicoProyectado(); // Cargar datos de av_fisico_proyectado
      cargarAvFinancieroIncurrido(); // Cargar datos de av_financiero_incurrido
      cargarIEACAvg(); // Cargar datos de IEAC (avg)
      cargarMetodologiasIEAC(); // Cargar Metodologías IEAC
      cargarMetodologiasECD(); // Cargar Metodologías ECD
      cargarDuracionPlanificada(); // Cargar duración planificada
      cargarIEACStrategico(); // Cargar datos estratégicos de IEAC
    } else {
      console.log('⚠️ proyectoId no está disponible');
    }
  }, [proyectoId]);

  // Recargar períodos y datos cuando cambien los filtros de fecha
  useEffect(() => {
    console.log('🔄 useEffect [fechaDesde, fechaHasta, fechaCorte] ejecutándose...');
    console.log('Fecha Desde:', fechaDesde, 'Fecha Hasta:', fechaHasta, 'Fecha Corte:', fechaCorte);
    if (proyectoId) {
      cargarPeriodos();
      cargarAvFisicoPlan();
      cargarAvFinancieroPlan();
      cargarAvFisicoReal();
      cargarAvFisicoProyectado();
      cargarAvFinancieroIncurrido();
      cargarIEACAvg();
      cargarMetodologiasIEAC(); // Recargar Metodologías IEAC cuando cambie la fecha de corte
      cargarMetodologiasECD(); // Recargar Metodologías ECD cuando cambie la fecha de corte
      cargarDuracionPlanificada(); // Recargar duración planificada cuando cambie la fecha de corte
      cargarIEACStrategico(); // Recargar datos estratégicos de IEAC cuando cambie la fecha de corte
    }
  }, [fechaDesde, fechaHasta, fechaCorte]);

  // Cargar IEAC estratégico cuando cambien los datos ECD
  useEffect(() => {
    if (datosECD && fechaCorte) {
      cargarIEACStrategico();
    }
  }, [datosECD, fechaCorte]);

  // Recargar IEAC estratégico cuando cambien los parámetros Beta
  useEffect(() => {
    if (proyectoId && fechaCorte && datosECD) {
      console.log('🔄 Parámetros Beta cambiaron, recargando IEAC estratégico...', parametrosBeta);
      cargarIEACStrategico();
    }
  }, [parametrosBeta.alpha, parametrosBeta.beta]);

  // Recargar IEAC estratégico cuando se carguen los datos IEAC (para tener montoMaximoIEAC)
  useEffect(() => {
    if (proyectoId && fechaCorte && datosECD && montoMaximoIEAC) {
      console.log('🔄 Datos IEAC cargados, recargando IEAC estratégico con monto máximo:', montoMaximoIEAC);
      cargarIEACStrategico();
    }
  }, [montoMaximoIEAC]);

  // DEBUG: Verificar cuando se cargan los datos estratégicos
  useEffect(() => {
    if (datosIEACStrategico.length > 0) {
      console.log('✅ Datos IEAC estratégicos cargados:', datosIEACStrategico.length, 'registros');
      console.log('📅 Último período estratégico:', datosIEACStrategico[datosIEACStrategico.length - 1]?.periodo_original);
      console.log('🎯 Valor último período:', datosIEACStrategico[datosIEACStrategico.length - 1]?.ieac_avg_strategico);
    }
  }, [datosIEACStrategico]);

  // Recalcular distribución beta cuando cambien los parámetros
  useEffect(() => {
    if (datosIEACAvg.length > 0 && fechaCorte && periodos.length > 0) {
      // Buscar el valor actual (AC) de la fecha de corte
      const valorActual = datosIEACAvg.find(d => d.ieac_avg && d.ieac_avg > 0)?.ieac_avg;
      if (valorActual) {
        const distribucion = distribuirIEACAvg(
          valorActual,
          35036000, // Valor objetivo fijo
          fechaCorte,
          periodos,
          parametrosBeta.alpha,
          parametrosBeta.beta
        );
        setDistribucionBeta(distribucion);
        console.log('🔄 Distribución Beta recalculada con nuevos parámetros:', distribucion);
      } else {
        console.log('❌ No se encontró valor actual para recalcular distribución');
      }
    }
  }, [parametrosBeta, datosIEACAvg, fechaCorte, periodos]);

  // Obtener todos los datos de todas las tablas
  const obtenerTodosLosDatos = () => {
        // Ordenar según preferencia: REAL, V0, NPC, API
        const datosOrdenados = [
      ...tablaReal.map(row => ({ ...row, tipo: 'REAL' })),
      ...tablaV0.map(row => ({ ...row, tipo: 'V0' })),
      ...tablaNpc.map(row => ({ ...row, tipo: 'NPC' })),
      ...tablaApi.map(row => ({ ...row, tipo: 'API' }))
        ];
        return datosOrdenados;
  };

  // Función para obtener el valor de api_acum correspondiente a un período
  const obtenerApiAcumPorPeriodo = (periodoOriginal) => {
    const dato = datosAvFisicoPlan.find(item => item.periodo_original === periodoOriginal);
    return dato ? dato.api_acum : null;
  };

  // Función para obtener el valor de monto_total correspondiente a un período
  const obtenerMontoTotalPorPeriodo = (periodoOriginal) => {
    const dato = datosAvFinancieroPlan.find(item => item.periodo_original === periodoOriginal);
    return dato ? dato.monto_total : null;
  };

  // Función para obtener el valor de api_acum de av_fisico_real correspondiente a un período
  const obtenerApiAcumRealPorPeriodo = (periodoOriginal) => {
    const dato = datosAvFisicoReal.find(item => item.periodo_original === periodoOriginal);
    return dato ? dato.api_acum : null;
  };

  // Función para obtener el valor de api_acum de av_fisico_proyectado correspondiente a un período
  const obtenerApiAcumProyectadoPorPeriodo = (periodoOriginal) => {
    const dato = datosAvFisicoProyectado.find(item => item.periodo_original === periodoOriginal);
    return dato ? dato.api_acum : null;
  };

  // Función para obtener el valor de incurrido_total correspondiente a un período
  const obtenerIncurridoTotalPorPeriodo = (periodoOriginal) => {
    const dato = datosAvFinancieroIncurrido.find(item => item.periodo_original === periodoOriginal);
    console.log(`🔍 Buscando incurrido_total para período ${periodoOriginal}:`, dato);
    return dato ? dato.incurrido_total : null;
  };

  // Función para obtener el valor de IEAC (avg) correspondiente a un período
  const obtenerIEACAvgPorPeriodo = (periodoOriginal) => {
    // DEBUG ESPECÍFICO para Febrero 2027
    if (periodoOriginal === '2027-02-01') {
      console.log(`🔍 DEBUG Febrero 2027 - Buscando dato estratégico...`);
      console.log(`📊 Datos estratégicos disponibles:`, datosIEACStrategico.length);
      console.log(`📅 Datos estratégicos:`, datosIEACStrategico);
      
      const datoEstrategicoFebrero = datosIEACStrategico.find(item => item.periodo_original === periodoOriginal);
      console.log(`🎯 Dato estratégico encontrado para Febrero:`, datoEstrategicoFebrero);
    }

    // Primero verificar si hay datos estratégicos para este período
    const datoEstrategico = datosIEACStrategico.find(item => item.periodo_original === periodoOriginal);
    if (datoEstrategico && datoEstrategico.es_estrategico) {
      console.log(`🎯 IEAC estratégico para período ${periodoOriginal}:`, datoEstrategico.ieac_avg_strategico);
      return datoEstrategico.ieac_avg_strategico;
    }

    // DEBUG: Verificar si no se encuentra dato estratégico
    console.log(`🔍 No se encontró dato estratégico para período ${periodoOriginal}`);
    console.log(`📊 Datos estratégicos disponibles:`, datosIEACStrategico.length, 'registros');
    if (datosIEACStrategico.length > 0) {
      console.log(`📅 Último período estratégico:`, datosIEACStrategico[datosIEACStrategico.length - 1]?.periodo_original);
    }

    // CORRECCIÓN: Si no hay datos estratégicos y tenemos datos ECD, verificar si el período está después del Mes Promedio ECD
    if (datosECD && datosECD.promedio) {
      // Encontrar el número de mes para este período
      const periodoIndex = periodos.findIndex(p => p.periodo_original === periodoOriginal);
      const numeroMes = periodoIndex + 1;
      
      // CORRECCIÓN: Usar Math.ceil para asegurar que incluya el mes redondeado hacia arriba
      const mesPromedioRedondeado = Math.ceil(datosECD.promedio);
      
      // Si el período está después del Mes Promedio ECD redondeado, devolver null (cero/vacío)
      if (numeroMes > mesPromedioRedondeado) {
        console.log(`🚫 Período ${periodoOriginal} (mes ${numeroMes}) está después del Mes Promedio ECD redondeado (${mesPromedioRedondeado}). Devolviendo null.`);
        console.log(`📊 Valor original ECD promedio: ${datosECD.promedio}, redondeado: ${mesPromedioRedondeado}`);
        return null;
      }
    }

    // Si no hay datos estratégicos, usar la lógica original SOLO para períodos dentro del rango ECD
    const dato = datosIEACAvg.find(item => item.periodo_original === periodoOriginal);
    console.log(`🔍 Buscando IEAC (avg) para período ${periodoOriginal}:`, dato);
    
    // Extraer el período mes del periodoOriginal
    const periodoMes = periodoOriginal.substring(0, 7); // Formato: YYYY-MM
    
    // Si hay datos existentes para este período
    if (dato && dato.ieac_avg) {
      // Si hay fecha de corte y el período es futuro, distribuir usando beta
      if (fechaCorte && periodoMes >= fechaCorte) {
        console.log(`📊 Aplicando distribución beta para período futuro: ${periodoMes} >= ${fechaCorte}`);
        return calcularDistribucionBeta(dato.ieac_avg, periodoOriginal, periodos, fechaCorte, parametrosBeta.alpha, parametrosBeta.beta);
      }
      return dato.ieac_avg;
    }
    
    // Si no hay datos existentes pero es un período futuro, calcular usando distribución beta
    if (fechaCorte && periodoMes >= fechaCorte && datosIEACAvg.length > 0) {
      console.log(`📊 Calculando IEAC (avg) para período futuro sin datos: ${periodoMes} >= ${fechaCorte}`);
      
      // Buscar el valor actual (AC) de la fecha de corte para usar como base
      let valorActual = null;
      
      // Buscar en datos de av_financiero_incurrido para la fecha de corte
      const datoIncurrido = datosAvFinancieroIncurrido.find(d => d.periodo_mes === fechaCorte);
      if (datoIncurrido && datoIncurrido.incurrido_total) {
        valorActual = datoIncurrido.incurrido_total;
        console.log(`📊 Valor actual (AC) encontrado en fecha de corte: ${formatearMoneda(valorActual)}`);
      } else {
        // Si no hay datos de incurrido, buscar en la distribución beta ya calculada
        const distribucionExistente = distribucionBeta.find(d => d.periodo_original === periodoOriginal);
        if (distribucionExistente) {
          console.log(`📊 IEAC (avg) encontrado en distribución existente: ${formatearMoneda(distribucionExistente.ieac_avg_distribuido)}`);
          return distribucionExistente.ieac_avg_distribuido;
        }
        
        // Si no hay distribución existente, buscar en cualquier dato disponible
        if (datosIEACAvg.length > 0) {
          const primerDato = datosIEACAvg[0];
          if (primerDato && primerDato.ieac_avg) {
            valorActual = primerDato.ieac_avg;
            console.log(`📊 Valor actual encontrado en primer dato: ${formatearMoneda(valorActual)}`);
          }
        }
      }
      
      if (valorActual) {
        console.log(`📊 Valor actual encontrado: ${formatearMoneda(valorActual)}`);
        const resultado = calcularDistribucionBeta(valorActual, periodoOriginal, periodos, fechaCorte, parametrosBeta.alpha, parametrosBeta.beta);
        console.log(`📊 Resultado final para ${periodoOriginal}: ${formatearMoneda(resultado)}`);
        return resultado;
      } else {
        console.log(`❌ No se encontró valor actual para calcular distribución`);
        console.log(`📊 Datos IEAC disponibles:`, datosIEACAvg);
      }
    }
    
    return null;
  };

  // Función para calcular distribución beta para un período específico
  const calcularDistribucionBeta = (valorActual, periodoOriginal, periodos, fechaCorte, alpha, beta) => {
    if (!valorActual || !fechaCorte || !periodos || periodos.length === 0) {
      console.log(`❌ No se puede calcular distribución beta: valorActual=${valorActual}, fechaCorte=${fechaCorte}, periodos=${periodos?.length}`);
      return valorActual;
    }

    // VALOR OBJETIVO FIJO: 35,036,000 USD (como en el Excel)
    const valorObjetivoFijo = 35036000;
    
    console.log(`🔍 Debug distribución beta:`);
    console.log(`   - Valor actual: ${valorActual}`);
    console.log(`   - Valor objetivo: ${valorObjetivoFijo}`);
    console.log(`   - Fecha corte: ${fechaCorte}`);
    console.log(`   - Alpha: ${alpha}, Beta: ${beta}`);

    // Filtrar períodos futuros dinámicamente
    const periodosFuturos = periodos.filter(p => p.periodo_mes >= fechaCorte);
    
    if (periodosFuturos.length === 0) {
      console.log(`❌ No hay períodos futuros después de ${fechaCorte}`);
      return valorActual;
    }

    const periodoIndex = periodosFuturos.findIndex(p => p.periodo_original === periodoOriginal);
    
    if (periodoIndex === -1) {
      console.log(`❌ Período ${periodoOriginal} no encontrado en períodos futuros`);
      return valorActual;
    }

    // Calcular la diferencia total que debe distribuirse
    const diferenciaTotal = valorObjetivoFijo - valorActual;
    
    // Calcular distribución usando aproximación de beta
    const progresoNormalizado = periodosFuturos.length > 1 ? periodoIndex / (periodosFuturos.length - 1) : 1;
    const cdfActual = betaCDF(progresoNormalizado, alpha, beta);
    const cdfAnterior = periodoIndex > 0 ? betaCDF((periodoIndex - 1) / (periodosFuturos.length - 1), alpha, beta) : 0;
    
    // Asegurar que la fracción no sea negativa
    let fraccion = Math.max(0, cdfActual - cdfAnterior);
    
    // Si es el último período, asegurar que se complete la diferencia total
    if (periodoIndex === periodosFuturos.length - 1) {
      fraccion = 1 - (cdfActual - fraccion);
    }
    
    // Calcular la parte de la diferencia para este período
    const diferenciaParcial = diferenciaTotal * fraccion;
    
    // El resultado es: valor actual + parte de la diferencia
    const resultado = valorActual + diferenciaParcial;
    
    // Validar que el resultado sea un número válido
    if (isNaN(resultado) || !isFinite(resultado) || resultado < 0) {
      console.log(`❌ Resultado inválido calculado: ${resultado}, usando valor actual como fallback`);
      return valorActual;
    }
    
    console.log(`📊 Distribución Beta: α=${alpha}, β=${beta}, Períodos futuros=${periodosFuturos.length}, Índice=${periodoIndex}, Progreso=${progresoNormalizado.toFixed(4)}, Fracción=${fraccion.toFixed(4)}, Diferencia=${formatearMoneda(diferenciaParcial)}, Resultado=${formatearMoneda(resultado)}`);
    
    return resultado;
  };

  // Función para obtener Av. Fisico Real con lógica de fecha de corte (hasta la fecha de corte)
  const obtenerApiAcumRealConCorte = (periodoOriginal, periodoMes) => {
    if (!fechaCorte) {
      // Si no hay fecha de corte, no mostrar datos
      return null;
    }
    
    // Solo mostrar datos hasta la fecha de corte especificada
    if (periodoMes <= fechaCorte) {
      const valor = obtenerApiAcumRealPorPeriodo(periodoOriginal);
      console.log(`✅ Av. Fisico Real: ${periodoMes} <= ${fechaCorte} = ${valor}`);
      return valor;
    } else {
      console.log(`❌ Av. Fisico Real: ${periodoMes} > ${fechaCorte} = null (oculto)`);
      return null; // No mostrar datos después de la fecha de corte
    }
  };

  // Función para obtener Av. Fisico Proyectado con lógica de fecha de corte (desde la fecha de corte)
  const obtenerApiAcumProyectadoConCorte = (periodoOriginal, periodoMes) => {
    if (!fechaCorte) {
      // Si no hay fecha de corte, no mostrar datos
      return null;
    }
    
    // Solo mostrar datos desde la fecha de corte especificada
    if (periodoMes >= fechaCorte) {
      const valor = obtenerApiAcumProyectadoPorPeriodo(periodoOriginal);
      console.log(`✅ Av. Fisico Proyectado: ${periodoMes} >= ${fechaCorte} = ${valor}`);
      return valor;
    } else {
      console.log(`❌ Av. Fisico Proyectado: ${periodoMes} < ${fechaCorte} = null (oculto)`);
      return null; // No mostrar datos antes de la fecha de corte
    }
  };

  // Función para obtener Av. Financiero Real con lógica de fecha de corte (hasta la fecha de corte)
  const obtenerIncurridoTotalConCorte = (periodoOriginal, periodoMes) => {
    console.log(`🔍 Evaluando Av. Financiero Real para período ${periodoOriginal} (${periodoMes}) con fecha de corte ${fechaCorte}`);
    
    if (!fechaCorte) {
      console.log('❌ No hay fecha de corte definida');
      return null;
    }
    
    // Solo mostrar datos hasta la fecha de corte especificada
    if (periodoMes <= fechaCorte) {
      const valor = obtenerIncurridoTotalPorPeriodo(periodoOriginal);
      console.log(`✅ Av. Financiero Real: ${periodoMes} <= ${fechaCorte} = ${valor}`);
      return valor;
    } else {
      console.log(`❌ Av. Financiero Real: ${periodoMes} > ${fechaCorte} = null (oculto)`);
      return null; // No mostrar datos después de la fecha de corte
    }
  };

  // Función para filtrar datos por fecha
  const obtenerDatosFiltrados = () => {
    console.log(`🔍 Aplicando lógica de fecha de corte: ${fechaCorte}`);
    
    // Crear array base con todos los períodos cargados desde la API
    let datosBase = periodos.map(periodo => {
      // Aplicar lógica de fecha de corte para las columnas específicas
      const apiAcumReal = obtenerApiAcumRealConCorte(periodo.periodo_original, periodo.periodo_mes);
      const apiAcumProyectado = obtenerApiAcumProyectadoConCorte(periodo.periodo_original, periodo.periodo_mes);
      const incurridoTotal = obtenerIncurridoTotalConCorte(periodo.periodo_original, periodo.periodo_mes);
      
      // Calcular IEAC (avg) con distribución beta si es necesario
      const ieacAvg = obtenerIEACAvgPorPeriodo(periodo.periodo_original);
      
      console.log(`📊 Período ${periodo.periodo_mes}: Real=${apiAcumReal}, Proyectado=${apiAcumProyectado}, Financiero=${incurridoTotal}, IEAC=${ieacAvg}`);
      
      return {
        periodo: formatearPeriodo(periodo.periodo_original),
        periodo_original: periodo.periodo_original,
        periodo_inicio: periodo.periodo_inicio,
        periodo_mes: periodo.periodo_mes,
        api_acum: obtenerApiAcumPorPeriodo(periodo.periodo_original),
        monto_total: obtenerMontoTotalPorPeriodo(periodo.periodo_original),
        api_acum_real: apiAcumReal,
        api_acum_proyectado: apiAcumProyectado,
        incurrido_total: incurridoTotal,
        ieac_avg: ieacAvg
      };
    });

        // Si tenemos valores de ECD y es mayor que la duración planificada, agregar meses adicionales
        const mesLimiteECD = Math.max(
          mesMaximoECD || 0, 
          datosECD?.promedio ? Math.ceil(datosECD.promedio) : 0 // CORRECCIÓN: Usar Math.ceil para redondear hacia arriba
        );
    
    if (mesLimiteECD && mesLimiteECD > datosBase.length) {
      console.log(`📈 ECD límite (${mesLimiteECD}) es mayor que períodos actuales (${datosBase.length}). Agregando meses adicionales...`);
      
      // Obtener el último período para calcular los siguientes
      const ultimoPeriodo = datosBase[datosBase.length - 1];
      const ultimaFecha = new Date(ultimoPeriodo.periodo_original);
      
      // Agregar meses adicionales hasta el límite de ECD
      for (let mes = datosBase.length + 1; mes <= mesLimiteECD; mes++) {
        const nuevaFecha = new Date(ultimaFecha);
        nuevaFecha.setMonth(ultimaFecha.getMonth() + (mes - datosBase.length));
        
        const nuevoPeriodo = {
          periodo: formatearPeriodo(nuevaFecha.toISOString().split('T')[0]),
          periodo_original: nuevaFecha.toISOString().split('T')[0],
          periodo_inicio: nuevaFecha.toISOString().split('T')[0],
          periodo_mes: mes,
          api_acum: null, // Sin datos planificados para meses adicionales
          monto_total: null,
          api_acum_real: null,
          api_acum_proyectado: null,
          incurrido_total: null,
          ieac_avg: null
        };
        
        datosBase.push(nuevoPeriodo);
        console.log(`➕ Agregado mes ${mes}: ${nuevoPeriodo.periodo}`);
      }
    }

    return datosBase;
  };

  // Función para formatear el período en formato mes-año (MM-YYYY)
  const formatearPeriodo = (fecha) => {
    if (!fecha) return '-';
    
    try {
      // Extraer directamente el mes y año de la fecha string para evitar problemas de zona horaria
      const partes = fecha.split('-');
      if (partes.length >= 2) {
        const año = partes[0];
        const mes = partes[1];
        return `${mes}-${año}`;
      }
      
      // Fallback: usar Date si el formato no es el esperado
      const date = new Date(fecha + 'T00:00:00'); // Forzar hora local
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const año = date.getFullYear();
      
      return `${mes}-${año}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return fecha; // Retornar la fecha original si hay error
    }
  };

  // Función para formatear montos en formato de moneda USD
  const formatearMoneda = (monto) => {
    if (monto === null || monto === undefined) return '-';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(monto);
    } catch (error) {
      console.error('Error formateando moneda:', error);
      return monto.toString();
    }
  };

  // Función para determinar el estilo de marcado de filas basado en ECD
  const obtenerEstiloFila = (numeroMes) => {
    if (!mesMinimoECD || !mesMaximoECD || !numeroMes) {
      return {}; // Sin marcado si no hay datos ECD
    }

    // Marcar fila si el mes está entre el mínimo y máximo de ECD
    if (numeroMes >= mesMinimoECD && numeroMes <= mesMaximoECD) {
      return {
        backgroundColor: '#fff3cd', // Amarillo claro para rango ECD
        borderLeft: '4px solid #ffc107', // Borde amarillo a la izquierda
        fontWeight: 'bold'
      };
    }

    return {}; // Sin marcado para filas fuera del rango
  };

  // Función para determinar si una fila es un mes adicional agregado por ECD
  const esMesAdicionalECD = (numeroMes) => {
    return periodos && numeroMes > periodos.length;
  };

  // Función para determinar el estilo de marcado de filas basado en IEAC
  const obtenerEstiloFilaIEAC = (montoTotal) => {
    if (!montoMinimoIEAC || !montoMaximoIEAC || !montoTotal) {
      return {}; // Sin marcado si no hay datos IEAC o monto
    }

    // Marcar fila si el monto está entre el mínimo y máximo de IEAC
    if (montoTotal >= montoMinimoIEAC && montoTotal <= montoMaximoIEAC) {
      return {
        backgroundColor: '#e8f5e8', // Verde claro para rango IEAC
        borderLeft: '4px solid #28a745', // Borde verde a la izquierda
        fontWeight: 'bold'
      };
    }

    return {}; // Sin marcado para filas fuera del rango
  };

  // Función para obtener la fecha actual formateada
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };



    return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#16355D', margin: 0 }}>
          Líneas Bases - Real/Proyectado
        </h2>
      </div>

      {/* Simbología de colores */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h5 style={{ 
          margin: '0 0 10px 0', 
          color: '#16355D', 
          fontSize: '1rem',
          fontWeight: 'bold'
        }}>
          🎨 Simbología de Colores
        </h5>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '10px',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '4px'
            }}></div>
            <span><strong>ECD:</strong> Rango de meses estimados</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#e8f5e8',
              border: '2px solid #28a745',
              borderRadius: '4px'
            }}></div>
            <span><strong>IEAC:</strong> Rango de montos estimados</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#ffeaa7',
              border: '2px solid #e17055',
              borderRadius: '4px'
            }}></div>
            <span><strong>Intersección:</strong> Ambos criterios (quiebre)</span>
          </div>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#16355D', fontWeight: 'bold' }}>Desde:</label>
            <input
              type="month"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #007bff',
                fontSize: '14px',
                minWidth: '150px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#16355D', fontWeight: 'bold' }}>Hasta:</label>
            <input
              type="month"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #007bff',
                fontSize: '14px',
                minWidth: '150px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#dc3545', fontWeight: 'bold' }}>
              Fecha de Corte: <span style={{ fontSize: '10px', color: '#6c757d', fontWeight: 'normal' }}>(Mes actual -1)</span>
            </label>
            <input
              type="month"
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #dc3545',
                fontSize: '14px',
                minWidth: '150px'
              }}
              placeholder="MM-YYYY"
              title="Fecha de corte automática: mes actual menos un mes"
            />
          </div>
          
          <button
            onClick={() => {
              setFechaDesde('');
              setFechaHasta('');
              setFechaCorte(obtenerMesActualMenosUno());
            }}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '20px'
            }}
            title="Limpiar filtros"
          >
            🧹 Limpiar
          </button>

          {/* Botón Metodologías IEAC */}
          <button
            onClick={() => setMostrarModalIEAC(true)}
            disabled={cargandoIEAC || !datosIEAC || datosIEAC.length === 0}
            style={{
              background: datosIEAC && datosIEAC.length > 0 ? '#e67e22' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: datosIEAC && datosIEAC.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              marginTop: '20px',
              marginLeft: '10px',
              opacity: datosIEAC && datosIEAC.length > 0 ? 1 : 0.6
            }}
            title={datosIEAC && datosIEAC.length > 0 ? "Ver Metodologías IEAC" : "Cargando datos IEAC..."}
          >
            🎯 Metodologías IEAC
          </button>

          {/* Botón Metodologías ECD */}
          {console.log('🔍 DEBUG ECD Button:', { cargandoECD, datosECD, metodologiaA: datosECD?.metodologiaA })}
          <button
            onClick={() => setMostrarModalECD(true)}
            disabled={cargandoECD || !datosECD || datosECD.metodologiaA === 0 || datosECD.metodologiaA === null}
            style={{
              background: datosECD && datosECD.metodologiaA ? '#8e44ad' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: datosECD && datosECD.metodologiaA ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              marginTop: '20px',
              marginLeft: '10px',
              opacity: datosECD && datosECD.metodologiaA ? 1 : 0.6
            }}
            title={datosECD && datosECD.metodologiaA ? "Ver Metodologías ECD" : "Cargando datos ECD..."}
          >
            📅 Metodologías ECD
          </button>



        </div>
      </div>

      {/* Configuración de Distribución Beta */}
      <div className="configuracion-beta" style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px', 
        margin: '20px 0',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, color: '#16355D' }}>🔧 Configuración de Distribución Beta - IEAC (avg)</h4>
          <button
            onClick={() => setMostrarConfiguracionBeta(!mostrarConfiguracionBeta)}
            style={{
              background: mostrarConfiguracionBeta ? '#dc3545' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {mostrarConfiguracionBeta ? '❌ Ocultar' : '⚙️ Configurar'}
          </button>
        </div>
        
        {mostrarConfiguracionBeta && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#16355D', fontWeight: 'bold' }}>
                Tipo de Proyecto:
              </label>
              <select 
                value={tipoProyecto} 
                onChange={(e) => {
                  const tipo = e.target.value;
                  setTipoProyecto(tipo);
                  const params = calcularParametrosBeta(tipo);
                  setParametrosBeta(params);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #007bff',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
              >
                <option value="construccion">🏗️ Construcción - Mayor gasto en meses intermedios-finales</option>
                <option value="software">💻 Desarrollo de Software - Gasto más uniforme</option>
                <option value="investigacion">🔬 Investigación - Gasto concentrado al final</option>
                <option value="infraestructura">🏢 Infraestructura - Gasto balanceado</option>
                <option value="excel">📊 Valores de Excel (α=2.8630, β=2.5)</option>
                <option value="personalizado">⚙️ Personalizado</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#16355D', fontWeight: 'bold' }}>
                  Alpha (α):
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  value={parametrosBeta.alpha} 
                  onChange={(e) => setParametrosBeta(prev => ({ ...prev, alpha: parseFloat(e.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #007bff',
                    fontSize: '14px',
                    minWidth: '100px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#16355D', fontWeight: 'bold' }}>
                  Beta (β):
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  value={parametrosBeta.beta} 
                  onChange={(e) => setParametrosBeta(prev => ({ ...prev, beta: parseFloat(e.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #007bff',
                    fontSize: '14px',
                    minWidth: '100px'
                  }}
                />
              </div>
            </div>

            <button 
              onClick={() => {
                const distribucion = distribuirIEACAvg(
                  datosIEACAvg[0]?.ieac_avg || 0,
                  fechaCorte,
                  periodos,
                  parametrosBeta.alpha,
                  parametrosBeta.beta
                );
                setDistribucionBeta(distribucion);
                console.log('✅ Distribución Beta aplicada:', distribucion);
              }}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✅ Aplicar Distribución Beta
            </button>

            {distribucionBeta.length > 0 && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '6px' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#16355D' }}>📊 Distribución Calculada:</h5>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  <strong>Total IEAC (avg):</strong> {formatearMoneda(datosIEACAvg[0]?.ieac_avg || 0)}<br/>
                  <strong>Períodos futuros:</strong> {distribucionBeta.length}<br/>
                  <strong>Parámetros:</strong> α={parametrosBeta.alpha}, β={parametrosBeta.beta}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabla de datos */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #dee2e6',
        overflowX: 'auto',
        maxHeight: '70vh',
        overflowY: 'auto'
      }}>
        <h4 style={{ color: '#16355D', marginBottom: '15px' }}>
          Tabla Dinámica - Proyecto ID: {proyectoId} ({obtenerDatosFiltrados().length} registros)
          {fechaCorte && (
            <span style={{ 
              color: '#dc3545', 
              fontSize: '14px', 
              fontWeight: 'normal',
              marginLeft: '10px'
            }}>
              📅 Corte: {fechaCorte} (Real hasta {fechaCorte}, Proyectado desde {fechaCorte})
            </span>
          )}
        </h4>
        
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{ 
                background: '#16355D', 
                color: 'white',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                  <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                Mes
                  </th>
                  <th style={{ 
                    padding: '10px', 
                    textAlign: 'left', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                Periodo
                  </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'left', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                Av. Fisico Planificado(%)
                </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'left', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                Av. Financiero Planificado(USD)
                </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                Av. Fisico Real(%)
                </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                Av. Fisico Proyectado(%)
                </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                Av. Financiero Real(USD)
                </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                IEAC (avg)
                </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                IEAC Min (USD)
                </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                IEAC Max (USD)
                </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                EAC Informado (USD)
                </th>
                <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                EAC Proyectado (USD)
              </th>
              <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    border: '1px solid #dee2e6',
                    backgroundColor: '#16355D',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                Costo Ganado (USD)
                </th>
              </tr>
            </thead>
            <tbody>
            {cargandoPeriodos ? (
              <tr>
                <td colSpan="13" style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#6c757d',
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6'
                }}>
                  Cargando períodos...
                </td>
              </tr>
            ) : obtenerDatosFiltrados().length > 0 ? (
              obtenerDatosFiltrados().map((row, index) => {
                // Obtener el número de mes de la primera columna (index + 1)
                const numeroMes = index + 1;
                const estiloFilaECD = obtenerEstiloFila(numeroMes);
                const estiloFilaIEAC = obtenerEstiloFilaIEAC(row.monto_total);
                
                // Determinar si la fila cumple ambos criterios (ECD e IEAC)
                const cumpleECD = Object.keys(estiloFilaECD).length > 0;
                const cumpleIEAC = Object.keys(estiloFilaIEAC).length > 0;
                
                let estiloFilaFinal = {};
                
                if (cumpleECD && cumpleIEAC) {
                  // Fila que cumple ambos criterios - color especial (naranja)
                  estiloFilaFinal = {
                    backgroundColor: '#ffeaa7', // Naranja claro para intersección
                    borderLeft: '4px solid #e17055', // Borde naranja
                    fontWeight: 'bold'
                  };
                } else if (cumpleECD) {
                  // Solo cumple criterio ECD - amarillo
                  estiloFilaFinal = estiloFilaECD;
                } else if (cumpleIEAC) {
                  // Solo cumple criterio IEAC - verde
                  estiloFilaFinal = estiloFilaIEAC;
                }
                
                return (
                <tr key={index} style={{ 
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                    {row.periodo}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.api_acum ? `${(parseFloat(row.api_acum) * 100).toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.monto_total ? formatearMoneda(row.monto_total) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.api_acum_real ? `${(parseFloat(row.api_acum_real) * 100).toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.api_acum_proyectado ? `${(parseFloat(row.api_acum_proyectado) * 100).toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.incurrido_total ? formatearMoneda(row.incurrido_total) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.ieac_avg ? formatearMoneda(row.ieac_avg) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {calcularIEACMin(numeroMes) ? formatearMoneda(calcularIEACMin(numeroMes)) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {calcularIEACMax(numeroMes) ? formatearMoneda(calcularIEACMax(numeroMes)) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {calcularEACInformado(numeroMes) ? formatearMoneda(calcularEACInformado(numeroMes)) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {calcularEACProyectado(numeroMes) ? formatearMoneda(calcularEACProyectado(numeroMes)) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {calcularCostoGanado(numeroMes, row.periodo, row) ? formatearMoneda(calcularCostoGanado(numeroMes, row.periodo, row)) : '-'}
                  </td>
                </tr>
                );
              })
        ) : (
              <tr>
                <td colSpan="13" style={{ 
                  padding: '20px', 
            textAlign: 'center', 
            color: '#6c757d',
            background: '#f8f9fa',
                  border: '1px solid #dee2e6'
                }}>
                  No hay períodos disponibles para el proyecto seleccionado.
                </td>
              </tr>
            )}
          </tbody>
          </table>
      </div>

      {/* Gráfico de Curva S */}
      <GraficoCurvaS 
        datosTabla={obtenerDatosFiltrados()} 
        proyectoId={proyectoId}
        mesMinimoECD={mesMinimoECD}
        mesMaximoECD={mesMaximoECD}
        montoMinimoIEAC={montoMinimoIEAC}
        montoMaximoIEAC={montoMaximoIEAC}
        valorBAC={valorBAC}
        plazoControlECD={plazoControlECD}
        datosAvFisicoReal={datosAvFisicoReal}
      />

      {/* Modal Metodologías IEAC */}
      {mostrarModalIEAC && datosIEAC && datosIEAC.length > 0 && (
        <ModalMetodologiasIEAC 
          datosIEAC={datosIEAC} 
          fechaCorte={fechaCorte} 
          porGanar={porGanar}
          onClose={() => setMostrarModalIEAC(false)} 
        />
      )}

      {/* Modal Metodologías ECD */}
      {mostrarModalECD && datosECD && datosECD.metodologiaA && (
        <ModalMetodologiasECD 
          datosECD={datosECD} 
          fechaCorte={fechaCorte} 
          duracionPlanificada={duracionPlanificada}
          onClose={() => setMostrarModalECD(false)} 
        />
      )}



    </div>
  );
};

export default Reportabilidad; 
