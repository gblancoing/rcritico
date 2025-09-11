import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, BarChart, Bar, LabelList, Cell, PieChart, Pie, ComposedChart, ReferenceLine } from 'recharts';
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
  
  
  { value: 'eficiencia_gasto', label: 'Eficiencia del Gasto' },

  { value: 'predictividad', label: 'Predictividad' },
  { value: 'lineas_bases', label: 'Líneas Bases - Real/Proyectado' },
  
  
];

const ALTURA_BARRA_SUPERIOR = 56;
const ANCHO_SIDEBAR = 240;

// Componente de Tooltip Profesional (Global)
const CustomTooltip = ({ children, content, position = 'top' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  
  const tooltipStyle = {
    position: 'fixed',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    padding: '24px 28px',
    borderRadius: '16px',
    fontSize: '15px',
    maxWidth: '450px',
    minWidth: '350px',
    zIndex: 2147483647,
    whiteSpace: 'normal',
    lineHeight: '1.7',
    boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.3)',
    border: '3px solid #4a90e2',
    opacity: showTooltip ? 1 : 0,
    visibility: showTooltip ? 'visible' : 'hidden',
    transform: showTooltip ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.95)',
    transition: 'all 0.3s ease',
    pointerEvents: showTooltip ? 'auto' : 'none',
    backdropFilter: 'blur(10px)',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    left: tooltipPosition.x,
    top: tooltipPosition.y,
    isolation: 'isolate',
    willChange: 'transform, opacity'
  };

  const arrowStyle = {
    position: 'absolute',
    width: 0,
    height: 0,
    ...(position === 'top' && {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '12px solid transparent',
      borderRight: '12px solid transparent',
      borderTop: '12px solid #4a90e2',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
    }),
    ...(position === 'bottom' && {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '12px solid transparent',
      borderRight: '12px solid transparent',
      borderBottom: '12px solid #4a90e2',
      filter: 'drop-shadow(0 -2px 4px rgba(0,0,0,0.2))'
    })
  };

  const contentStyle = {
    fontWeight: '600',
    textAlign: 'left',
    color: '#ffffff',
    fontSize: '15px',
    lineHeight: '1.7',
    position: 'relative',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '24px',
    height: '24px',
    backgroundColor: '#dc3545',
    borderRadius: '50%',
    border: '2px solid #ffffff',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(220, 69, 53, 0.4)',
    zIndex: 2147483647
  };

  const lupaStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    backgroundColor: '#4a90e2',
    borderRadius: '50%',
    marginLeft: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid #ffffff',
    boxShadow: '0 2px 8px rgba(74, 144, 226, 0.3)',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const handleClick = (event) => {
    try {
      const rect = event.currentTarget.getBoundingClientRect();
      const tooltipHeight = 200; // Altura aproximada del tooltip
      const margin = 30;
      
      // Calcular posición para que el tooltip aparezca arriba del elemento
      let newY = rect.top - tooltipHeight - margin;
      
      // Si no hay espacio arriba, mostrar abajo
      if (newY < 20) {
        newY = rect.bottom + margin;
      }
      
      // Asegurar que la posición X esté dentro de los límites de la ventana
      let newX = rect.left + rect.width / 2;
      const tooltipWidth = 400; // Ancho aproximado del tooltip
      
      if (newX - tooltipWidth / 2 < 20) {
        newX = tooltipWidth / 2 + 20;
      } else if (newX + tooltipWidth / 2 > window.innerWidth - 20) {
        newX = window.innerWidth - tooltipWidth / 2 - 20;
      }
      
      const newPosition = {
        x: newX,
        y: newY
      };
      
      setTooltipPosition(newPosition);
      setShowTooltip(!showTooltip);
    } catch (error) {
      console.error('Error al posicionar tooltip:', error);
      // Posición de respaldo en el centro de la pantalla
      setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setShowTooltip(!showTooltip);
    }
  };

  const handleClickOutside = (event) => {
    if (showTooltip && !event.target.closest('.tooltip-container')) {
      setShowTooltip(false);
    }
  };

  useEffect(() => {
    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTooltip]);

  // Manejar redimensionamiento de ventana
  useEffect(() => {
    const handleResize = () => {
      if (showTooltip) {
        // Reposicionar el tooltip si la ventana cambia de tamaño
        setTooltipPosition(prev => ({
          x: Math.min(prev.x, window.innerWidth - 200),
          y: Math.min(prev.y, window.innerHeight - 200)
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showTooltip]);

  // Asegurar que el tooltip esté en el DOM correcto
  useEffect(() => {
    if (showTooltip) {
      // Forzar un re-render del tooltip
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  return (
    <>
      <div className="tooltip-container" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        {children}
        <div 
          style={lupaStyle} 
          onClick={handleClick}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#357abd';
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#4a90e2';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.3)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
      </div>
      
      {/* Tooltip renderizado en el body para evitar problemas de overflow */}
      {showTooltip && createPortal(
        <>
          {/* Overlay de fondo para asegurar que esté por encima de todo */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2147483646,
              pointerEvents: 'none'
            }}
          />
          <div style={tooltipStyle}>
            <button 
              style={closeButtonStyle}
              onClick={() => setShowTooltip(false)}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#c82333';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc3545';
                e.target.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>
            <div style={contentStyle}>{content}</div>
          </div>
        </>,
        document.body
      )}
    </>
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
        <h4 style={{ color: '#FFD000', marginBottom: 8 }}>Reportes de Reportabilidad</h4>
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
  const [seleccion, setSeleccion] = useState('eficiencia_gasto');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroDescripcion, setFiltroDescripcion] = useState(''); // NUEVO: Filtro por descripción
  // Función para obtener el mes anterior en formato YYYY-MM
  const obtenerMesAnterior = () => {
    const fechaActual = new Date();
    const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
    const año = mesAnterior.getFullYear();
    const mes = String(mesAnterior.getMonth() + 1).padStart(2, '0');
    return `${año}-${mes}`;
  };

  const [hasta20, setHasta20] = useState(obtenerMesAnterior()); // NUEVO: Filtro principal con mes anterior por defecto
  const [filtroVector, setFiltroVector] = useState('');

  // Función para mapear los valores según Hasta 2.0
  const mapearValoresDesdeHasta20 = (hasta20Value) => {
    if (!hasta20Value) {
      setFechaDesde('');
      setFechaHasta('');
      setFiltroDescripcion('');
      return;
    }

    // Extraer año y mes de Hasta 2.0
    const [año, mes] = hasta20Value.split('-');
    const añoNumero = parseInt(año);
    const mesNumero = parseInt(mes);
    
    // Calcular año para la versión (mes anterior)
    const añoVersion = mesNumero === 1 ? añoNumero - 1 : añoNumero;
    
    // Mapeo de meses a versiones (mes anterior) - Dinámico por año
    const mapeoVersiones = {
      1: { // Enero -> Version L Diciembre (año anterior)
        descripcion: `Version L Diciembre ${añoVersion}`
      },
      2: { // Febrero -> Version A Enero
        descripcion: `Version A Enero ${añoNumero}`
      },
      3: { // Marzo -> Version B Febrero
        descripcion: `Version B Febrero ${añoNumero}`
      },
      4: { // Abril -> Version C Marzo
        descripcion: `Version C Marzo ${añoNumero}`
      },
      5: { // Mayo -> Version D Abril
        descripcion: `Version D Abril ${añoNumero}`
      },
      6: { // Junio -> Version E Mayo
        descripcion: `Version E Mayo ${añoNumero}`
      },
      7: { // Julio -> Version F Junio  
        descripcion: `Version F Junio ${añoNumero}`
      },
      8: { // Agosto -> Version G Julio
        descripcion: `Version G Julio ${añoNumero}`
      },
      9: { // Septiembre -> Version H Agosto
        descripcion: `Version H Agosto ${añoNumero}`
      },
      10: { // Octubre -> Version I Septiembre
        descripcion: `Version I Septiembre ${añoNumero}`
      },
      11: { // Noviembre -> Version J Octubre
        descripcion: `Version J Octubre ${añoNumero}`
      },
      12: { // Diciembre -> Version K Noviembre
        descripcion: `Version K Noviembre ${añoNumero}`
      }
    };

    // Establecer valores
    setFechaDesde(hasta20Value); // Desde = mismo mes que Hasta 2.0
    setFechaHasta(hasta20Value); // Hasta = mismo mes que Hasta 2.0
    
    // Descripción = versión del mes anterior
    const configuracion = mapeoVersiones[mesNumero];
    if (configuracion) {
      setFiltroDescripcion(configuracion.descripcion);
    } else {
      setFiltroDescripcion('');
    }
  };
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [datosReporte, setDatosReporte] = useState([]);

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
      let datos = [];
      
      switch (seleccion) {

          
        case 'predictividad':
          // Para predictividad, usar datos de ejemplo por ahora
          // La funcionalidad principal es la importación de Excel
          datos = generarDatosEjemplo(seleccion);
          setUsandoDatosReales(false);
          break;
          
        case 'eficiencia_gasto':
          // Para eficiencia del gasto, usar datos reales
          if (proyectoId) {
            // Los datos se cargarán dinámicamente en el componente
            datos = [];
            setUsandoDatosReales(true);
          } else {
            datos = generarDatosEjemplo(seleccion);
            setUsandoDatosReales(false);
          }
          break;
        default:
          // Para otros reportes, usar datos de ejemplo por ahora
          datos = generarDatosEjemplo(seleccion);
          setUsandoDatosReales(false);
          break;
      }
      
      setDatosReporte(datos);
    } catch (error) {
      console.error('Error cargando datos del reporte:', error);
      // En caso de error, usar datos de ejemplo
      const datosEjemplo = generarDatosEjemplo(seleccion);
      setDatosReporte(datosEjemplo);
    } finally {
      setCargandoDatos(false);
    }
  };

  // Función para procesar datos de predictividad parcial desde la API
  const procesarDatosPredictividad = (datosAPI) => {
    if (!datosAPI || datosAPI.length === 0) {
      return generarDatosEjemplo('predictividad');
    }

    // Agrupar datos por tipo y período
    const datosAgrupados = {};
    
    datosAPI.forEach(registro => {
      const key = `${registro.tipo}_${registro.periodo}`;
      if (!datosAgrupados[key]) {
        datosAgrupados[key] = {
          tipo: registro.tipo || 'Fisica',
          periodo: registro.periodo || '2024-01-01',
          mes: registro.mes || 'Ene - 2024',
          monto: parseFloat(registro.monto) || 0,
          cat_vp: registro.cat_vp || '',
          detalle_factorial: registro.detalle_factorial || '',
          centro_costo: registro.centro_costo || 'Centro Principal'
        };
      }
    });
    
    // Convertir a formato requerido por el componente
    const resultado = Object.values(datosAgrupados).map(item => {
      // Calcular valores para la tabla de predictividad
      const prediccion = item.monto;
      const real = item.monto * (0.95 + Math.random() * 0.1); // Simular valor real con variación
      const diferencia = real - prediccion;
      const diferencia_porcentual = prediccion > 0 ? (diferencia / prediccion) * 100 : 0;
      
      return {
        mes: item.mes,
        prediccion: prediccion,
        real: real,
        precision: Math.max(0, 100 - Math.abs(diferencia_porcentual)),
        tipo: item.tipo,
        eficiencia: diferencia_porcentual > -5 ? 'Eficiente' : 'Ineficiente',
        diferencia: diferencia,
        diferencia_porcentual: diferencia_porcentual,
        // Datos adicionales de predictividad parcial
        periodo: item.periodo,
        cat_vp: item.cat_vp,
        detalle_factorial: item.detalle_factorial,
        centro_costo: item.centro_costo
      };
    });
    
    // Si no hay datos procesados, usar datos de ejemplo
    if (resultado.length === 0) {
      return generarDatosEjemplo('predictividad');
    }
    
    return resultado;
  };

  // Función para generar datos de ejemplo según el tipo de reporte
  const generarDatosEjemplo = (tipoReporte) => {
    switch (tipoReporte) {
      case 'predictividad':
        return [
          { mes: 'Ene', prediccion: 15, real: 14, precision: 93.3 },
          { mes: 'Feb', prediccion: 28, real: 26, precision: 92.9 },
          { mes: 'Mar', prediccion: 42, real: 40, precision: 95.2 },
          { mes: 'Abr', prediccion: 55, real: 53, precision: 96.4 },
          { mes: 'May', prediccion: 68, real: 65, precision: 95.6 },
          { mes: 'Jun', prediccion: 78, real: 75, precision: 96.2 },
        ];
      case 'eficiencia_gasto':
        return [
          { categoria: 'Materiales', presupuesto: 2500000, ejecutado: 2350000, eficiencia: 94.0 },
          { categoria: 'Mano de Obra', presupuesto: 1800000, ejecutado: 1720000, eficiencia: 95.6 },
          { categoria: 'Equipos', presupuesto: 3200000, ejecutado: 3080000, eficiencia: 96.3 },
          { categoria: 'Indirectos', presupuesto: 1200000, ejecutado: 1180000, eficiencia: 98.3 },
        ];

      default:
        return [];
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
          return <ReporteEficienciaGasto data={datosReporte} proyectoId={proyectoId} fechaDesde={fechaDesde} fechaHasta={fechaHasta} filtroDescripcion={filtroDescripcion} />;

      case 'lineas_bases':
        return <ReporteLineasBases proyectoId={proyectoId} />;
      default:
        return <div>Selecciona un reporte</div>;
    }
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

    // Función para obtener datos de real físico desde av_fisico_real
    const obtenerRealFisica = async () => {
      try {
        console.log('🔍 DEBUG - Iniciando obtenerRealFisica');
        console.log('🔍 DEBUG - proyectoId:', proyectoId);
        console.log('🔍 DEBUG - fechaDesde:', fechaDesde);
        console.log('🔍 DEBUG - fechaHasta:', fechaHasta);
        
        // TEMPORAL: Usar endpoint de prueba
        let url = `${API_BASE}/eficiencia_gasto/test_av_fisico_real.php`;
        const params = new URLSearchParams();
        
        if (proyectoId) {
          params.append('proyecto_id', proyectoId);
        }
        
        if (fechaDesde) {
          // Convertir formato YYYY-MM a YYYY-MM-01 para el inicio del mes
          const fechaDesdeCompleta = `${fechaDesde}-01`;
          params.append('periodo_desde', fechaDesdeCompleta);
          console.log('🔍 DEBUG - fechaDesdeCompleta:', fechaDesdeCompleta);
        }
        if (fechaHasta) {
          // Obtener el último día del mes seleccionado
          const [year, month] = fechaHasta.split('-');
          const ultimoDia = new Date(parseInt(year), parseInt(month), 0).getDate();
          const fechaHastaCompleta = `${fechaHasta}-${ultimoDia.toString().padStart(2, '0')}`;
          params.append('periodo_hasta', fechaHastaCompleta);
          console.log('🔍 DEBUG - fechaHastaCompleta:', fechaHastaCompleta);
        }
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        
        console.log('🔍 DEBUG - URL final:', url);
        console.log('🔍 Consultando real físico desde av_fisico_real:', url);
        
        const response = await fetch(url);
        console.log('🔍 DEBUG - Response status:', response.status);
        console.log('🔍 DEBUG - Response ok:', response.ok);
        
        const data = await response.json();
        console.log('📊 Respuesta real físico desde av_fisico_real:', data);
        
        if (data.success && data.datos && data.datos.length > 0) {
          console.log('🔍 DEBUG - Datos encontrados:', data.datos.length, 'registros');
          console.log('🔍 DEBUG - Primeros 3 registros:', data.datos.slice(0, 3));
          
          // Obtener el valor más reciente del api_parcial
          const datosOrdenados = data.datos.sort((a, b) => new Date(b.periodo) - new Date(a.periodo));
          const valorMasReciente = parseFloat(datosOrdenados[0].api_parcial) || 0;
          
          console.log('🔍 DEBUG - Registro más reciente:', datosOrdenados[0]);
          console.log('🔍 DEBUG - Valor api_parcial raw:', datosOrdenados[0].api_parcial);
          console.log('🔍 DEBUG - Valor api_parcial parseFloat:', valorMasReciente);
          
          // Convertir a porcentaje: el valor ya está en decimal (0.0071 = 0.71%)
          const valorPorcentaje = valorMasReciente * 100;
          
          console.log('🔍 DEBUG - Valor convertido a porcentaje:', valorPorcentaje);
          
          setRealFisica(valorPorcentaje);
          
          console.log('✅ Real físico actualizado desde av_fisico_real:', valorPorcentaje);
          console.log('📅 Periodo más reciente:', datosOrdenados[0].periodo);
          console.log('📋 Total registros encontrados:', data.datos.length);
          console.log('🔍 Valor api_parcial convertido a porcentaje:', valorPorcentaje);
        } else {
          console.log('⚠️ No se encontraron datos en av_fisico_real para el proyecto');
          console.log('⚠️ data.success:', data.success);
          console.log('⚠️ data.datos:', data.datos);
          console.log('⚠️ data.datos length:', data.datos ? data.datos.length : 'undefined');
          setRealFisica(0);
        }
      } catch (error) {
        console.error('❌ Error de conexión real físico desde av_fisico_real:', error);
        setRealFisica(0);
      }
    };

    // Función para obtener proyección física desde la tabla predictividad usando mes anterior
    const obtenerProyeccionFisica = async () => {
      try {
        console.log('🔍 DEBUG - Iniciando obtenerProyeccionFisica');
        console.log('🔍 DEBUG - proyectoId:', proyectoId);
        console.log('🔍 DEBUG - hasta20:', hasta20);
        
        if (!proyectoId || !hasta20) {
          console.log('⚠️ proyectoId o hasta20 no disponibles para proyección física');
          setProyeccionFisica(0);
          return;
        }

        const requestBody = {
          proyecto_id: proyectoId,
          periodo_hasta: hasta20 // Formato: YYYY-MM
        };
        
        console.log('🔍 DEBUG - Request body:', requestBody);
        console.log('🔍 DEBUG - URL:', `${API_BASE}/predictividad/test_proyeccion_fisica_dinamico.php`);

        // TEMPORAL: Usar endpoint de prueba dinámico
        const response = await fetch(`${API_BASE}/predictividad/test_proyeccion_fisica_dinamico.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log('🔍 DEBUG - Response status:', response.status);
        console.log('🔍 DEBUG - Response ok:', response.ok);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔍 DEBUG - Response data:', data);
        
        if (data.success) {
          const proyeccion = data.data.proyeccion_fisica || 0;
          console.log('✅ Proyección física obtenida:', {
            valor: proyeccion,
            periodo_solicitado: data.data.periodo_solicitado,
            periodo_anterior_usado: data.data.periodo_anterior_usado,
            periodo_prediccion: data.data.periodo_prediccion
          });
          setProyeccionFisica(proyeccion);
        } else {
          console.log('⚠️ No se encontraron datos de proyección física:', data.message);
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
      if (proyeccionFisica !== 0 && realFisica >= 0) {
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

    // Inicializar filtros automáticamente cuando se carga el componente
    useEffect(() => {
      if (hasta20) {
        mapearValoresDesdeHasta20(hasta20);
      }
    }, []); // Solo se ejecuta una vez al montar el componente

    // Cargar datos al montar el componente y cuando cambien los filtros
    useEffect(() => {
      console.log('🔄 useEffect ejecutándose con parámetros:', { proyectoId, fechaDesde, fechaHasta, filtroDescripcion, hasta20 });
      
      if (proyectoId) {
        console.log('🔄 Actualizando datos de predictividad por cambio de filtros');
        obtenerProyeccionFinanciera();
        obtenerRealFinanciera();
        obtenerRealFisica();
        obtenerProyeccionFisica(); // Ahora usa hasta20 para calcular mes anterior
        
        // Cargar historial
        obtenerHistorialFinanciero();
        obtenerHistorialFisico();
      } else {
        console.log('⚠️ proyectoId no está disponible, no se ejecutan las funciones');
      }
    }, [proyectoId, fechaDesde, fechaHasta, filtroDescripcion, hasta20]);

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
          
          {/* Filtros compactos */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {/* NUEVO: Filtro principal - Ajusta automáticamente los demás filtros */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ color: '#FF6B35', fontWeight: 700, fontSize: 13 }} title="Filtro principal que ajusta automáticamente Desde, Hasta y Descripción">Seleccione Período:</label>
              <input
                type="month"
                value={hasta20}
                onChange={e => {
                  setHasta20(e.target.value);
                  mapearValoresDesdeHasta20(e.target.value);
                }}
                style={{
                  border: '2px solid #FF6B35',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                  outline: 'none',
                  width: '140px',
                  backgroundColor: '#FFF5F2',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Filtros originales (OCULTOS - controlados automáticamente por Seleccione Período) */}
            <div style={{ display: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ color: '#060270', fontWeight: 600, fontSize: 12 }}>Desde:</label>
                <input
                  type="month"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  style={{
                    border: '1px solid #1d69db',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 12,
                    outline: 'none',
                    width: '140px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ color: '#060270', fontWeight: 600, fontSize: 12 }}>Hasta:</label>
                <input
                  type="month"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  style={{
                    border: '1px solid #1d69db',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 12,
                    outline: 'none',
                    width: '140px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ color: '#060270', fontWeight: 600, fontSize: 12 }}>Descripción:</label>
                <select
                  value={filtroDescripcion}
                  onChange={e => setFiltroDescripcion(e.target.value)}
                  style={{
                    border: '1px solid #1d69db',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 12,
                    outline: 'none',
                    width: '160px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Todas</option>
                  {descripcionesDisponibles.map((descripcion, index) => (
                    <option key={index} value={descripcion}>
                      {descripcion}
                    </option>
                ))}
                </select>
              </div>
            </div>
            
            {hasta20 && (
              <button
                onClick={() => {
                  setFechaDesde('');
                  setFechaHasta('');
                  setFiltroDescripcion('');
                  setHasta20('');
                }}
                style={{
                  background: '#FF8C00',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Limpiar filtro de período"
              >
                🧹
              </button>
            )}
          </div>
          
          {/* Sección de importación - Funcionalidad completa */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-end'
          }}>
            
            
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
                    ) : proyeccionFisica !== 0 ? (
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
                          <div style={{ 
                            fontWeight: 'bold',
                            color: proyeccionFisica < 0 ? '#dc3545' : '#16355D'
                          }}>
                            {proyeccionFisica.toFixed(2)}%
                          </div>
                          <div style={{ 
                            fontSize: '10px', 
                            color: proyeccionFisica < 0 ? '#dc3545' : '#28a745', 
                            marginTop: '2px' 
                          }}>
                            {proyeccionFisica < 0 ? '⚠️' : '✅'} Datos Predictividad
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

          {/* Glosario Técnico - Predictividad */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ color: '#16355D', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
              📚 GLOSARIO TÉCNICO - PREDICTIVIDAD
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  💰 PREDICCIÓN FINANCIERA
                </h5>
                <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                  <li><strong>Proyección:</strong> Valor planificado según proyecciones financieras (USD). Representa la expectativa de gasto para el período.</li>
                  <li><strong>Real:</strong> Ejecución financiera real desde la tabla real_parcial (USD). Refleja el desembolso efectivo.</li>
                  <li><strong>Desviación:</strong> Diferencia porcentual entre Real y Proyección = ((Real - Proyección) / Proyección) × 100.</li>
                </ul>
              </div>
              
              <div>
                <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  📈 PREDICCIÓN FÍSICA
                </h5>
                <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                  <li><strong>Proyección:</strong> Meta de avance físico planificada según tabla predictividad (%). Objetivo operacional esperado.</li>
                  <li><strong>Real:</strong> Avance físico real desde la tabla av_fisico_real.api_parcial (%). Progreso efectivo alcanzado.</li>
                  <li><strong>Desviación:</strong> Diferencia porcentual entre Real y Proyección = ((Real - Proyección) / Proyección) × 100.</li>
                </ul>
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#e3f2fd', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #2196f3',
              marginBottom: '15px'
            }}>
              <h5 style={{ color: '#1565c0', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                🎯 MÉTRICAS DE PREDICTIVIDAD
              </h5>
              <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                <li><strong>Precisión:</strong> Indicador de exactitud de las proyecciones = 100% - |Desviación|. Valores {'>'}95% indican excelente predictibilidad.</li>
                <li><strong>Nota:</strong> Calificación basada en la precisión de las predicciones.</li>
              </ul>
            </div>
            
            {/* Layout de Mitad y Mitad: Reglas de Ponderación + Fuentes de Datos */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginBottom: '15px'
            }}>
              {/* Reglas de Ponderación de Notas - Predictividad */}
              <div style={{
                backgroundColor: '#fff3e0', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid #ffb74d',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h5 style={{ color: '#e65100', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                    📋 REGLAS DE PONDERACIÓN DE NOTAS - PREDICTIVIDAD
                  </h5>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '15px',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <h6 style={{ color: '#bf360c', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                        🟢 NOTAS EXCELENTES (4.0 - 5.0)
                      </h6>
                      <ul style={{ margin: 0, paddingLeft: '15px', color: '#bf360c', fontSize: '12px', lineHeight: '1.3' }}>
                        <li><strong>5.0 (Excelente):</strong> Precisión ≥ 95%</li>
                        <li><strong>4.0 (Bueno):</strong> Precisión 90% - 95%</li>
                      </ul>
                    </div>
                    <div>
                      <h6 style={{ color: '#f57c00', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                        🟡 NOTAS REGULARES (2.0 - 3.0)
                      </h6>
                      <ul style={{ margin: 0, paddingLeft: '15px', color: '#f57c00', fontSize: '12px', lineHeight: '1.3' }}>
                        <li><strong>3.0 (Regular):</strong> Precisión 75% - 90%</li>
                        <li><strong>2.0 (Deficiente):</strong> Precisión 60% - 75%</li>
                      </ul>
                    </div>
                  </div>
                  <div style={{ 
                    backgroundColor: '#ffebee', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: '1px solid #ef5350',
                    marginBottom: '12px'
                  }}>
                    <h6 style={{ color: '#c62828', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                      🔴 NOTA CRÍTICA (1.0)
                    </h6>
                    <ul style={{ margin: 0, paddingLeft: '15px', color: '#c62828', fontSize: '12px', lineHeight: '1.3' }}>
                      <li><strong>1.0 (Crítico):</strong> Precisión {'<'} 60%</li>
                    </ul>
                  </div>
                </div>
                
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#f1f8e9', 
                  borderRadius: '6px', 
                  border: '1px solid #8bc34a',
                  fontSize: '12px',
                  color: '#33691e'
                }}>
                  <strong>💡 Interpretación:</strong> La precisión mide qué tan acertadas fueron las proyecciones. Una precisión {'>'}95% significa que las predicciones fueron muy cercanas a la realidad, mientras que {'<'}60% indica que las proyecciones requieren revisión inmediata.
                </div>
              </div>
              
              {/* Períodos de Análisis */}
              <div style={{ 
                backgroundColor: '#e8f5e8', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid #4caf50',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <h5 style={{ color: '#2e7d32', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                  📅 PERÍODOS DE ANÁLISIS
                </h5>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px'
                }}>
                  {/* Período del Mes */}
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #28a745'
                  }}>
                    <h6 style={{ color: '#155724', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      📊 Período del Mes
                    </h6>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', lineHeight: '1.3' }}>
                      Análisis mensual específico (actual o filtrado por fechas)
                    </p>
                  </div>
                  
                  {/* Período Acumulado */}
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #28a745'
                  }}>
                    <h6 style={{ color: '#155724', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      📈 Período Acumulado
                    </h6>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', lineHeight: '1.3' }}>
                      Sumatoria desde enero hasta el mes de análisis
                    </p>
                  </div>
                  
                  {/* Período Anual */}
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #28a745'
                  }}>
                    <h6 style={{ color: '#155724', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      📅 Período Anual
                    </h6>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', lineHeight: '1.3' }}>
                      Análisis completo del año (actual o filtrado)
                    </p>
                  </div>
                </div>
                
                {/* Espaciador para igualar altura con el panel izquierdo */}
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: 'transparent',
                  fontSize: '12px',
                  color: 'transparent'
                }}>
                  Espaciador para igualar altura
                </div>
              </div>
            </div>
          </div>

          {/* Análisis Dinámico - Predictividad */}
          {proyeccionFinanciera > 0 && realFinanciera > 0 && proyeccionFisica !== 0 && realFisica > 0 && (
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
                        {estadoPredictividad.icono} 
                          PRECISIÓN DE PREDICCIONES:
                        {estadoPredictividad.texto}
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
                          <div>
                            <strong>
                              <CustomTooltip content="Fórmula: ((Real - Proyectado) / Proyectado) × 100">
                                Desviación:
                              </CustomTooltip>
                            </strong> 
                            <span style={{ 
                              color: desviacionFinanciera.esPositiva ? '#dc3545' : desviacionFinanciera.esNegativa ? '#28a745' : '#666',
                              fontWeight: 'bold'
                            }}>
                              {desviacionFinanciera.esPositiva ? '+' : ''}{desviacionFinanciera.porcentaje}%
                            </span>
                          </div>
                          <div>
                            <strong>
                              <CustomTooltip content="Fórmula: 100% - |Desviación|">
                                Precisión:
                              </CustomTooltip>
                            </strong> 
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
                          <div>
                            <strong>
                                                          <CustomTooltip content="Fórmula: ((Real - Proyectado) / Proyectado) × 100">
                              Desviación:
                            </CustomTooltip>
                            </strong> 
                            <span style={{ 
                              color: desviacionFisica.esPositiva ? '#dc3545' : desviacionFisica.esNegativa ? '#28a745' : '#666',
                              fontWeight: 'bold'
                            }}>
                              {desviacionFisica.esPositiva ? '+' : ''}{desviacionFisica.porcentaje}%
                            </span>
                          </div>
                          <div>
                            <strong>
                                                          <CustomTooltip content="Fórmula: 100% - |Desviación|">
                              Precisión:
                            </CustomTooltip>
                            </strong> 
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
  const ReporteEficienciaGasto = ({ data, proyectoId, fechaDesde, fechaHasta, filtroDescripcion }) => {
    const [datosEficiencia, setDatosEficiencia] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');



    // Función para obtener datos financieros (V0 y Real) - PARCIALES
    const obtenerDatosFinancieros = async (periodo, fechaInicio = null, fechaFin = null, filtroDescripcion = null) => {
      try {
        // Determinar el período a consultar
        let periodoAConsultar;
        let nombrePeriodo;
        
        if (periodo === 'mes') {
          // Determinar el período a consultar para el mes
          if (fechaInicio) {
            // Usar la fecha de inicio pasada como parámetro
            const [año, mes] = fechaInicio.split('-');
            const fechaFiltro = new Date(parseInt(año), parseInt(mes) - 1, 1);
            periodoAConsultar = fechaFiltro.toISOString().slice(0, 7) + '-01';
            nombrePeriodo = fechaFiltro.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
          } else {
            // Sin fecha de inicio - usar el mes actual
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
        let urlReal = `${API_BASE}/datos_financieros_sap.php?proyecto_id=${proyectoId}`;
        
        // Agregar filtro de descripción si está disponible
        if (filtroDescripcion && filtroDescripcion.trim() !== '') {
          urlReal += `&descripcion=${encodeURIComponent(filtroDescripcion)}`;
        }
        
        if (periodoAConsultar) {
          urlV0 += `&periodo=${periodoAConsultar}`;
          urlReal += `&periodo_desde=${periodoAConsultar}&periodo_hasta=${periodoAConsultar}`;
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
        console.log('📝 Descripción filtrada:', filtroDescripcion);
        console.log('URL V0:', urlV0);
        console.log('URL Real SAP:', urlReal);

        const [responseV0, responseReal] = await Promise.all([
          fetch(urlV0),
          fetch(urlReal)
        ]);

        const dataV0 = await responseV0.json();
        const dataReal = await responseReal.json();

        console.log('📊 Datos V0 Parcial:', dataV0);
        console.log('📊 Datos Real SAP:', dataReal);
        console.log('📊 Cantidad de registros V0:', dataV0.success ? dataV0.datos.length : 0);
        console.log('📊 Datos Real SAP:', dataReal.success ? dataReal.data : 'Sin datos');

        // Obtener PLAN V. O. 2025 (KUSD) y GASTO REAL (KUSD)
        let planV0 = 0;
        let gastoReal = 0;
        
                  if (dataV0.success && dataV0.datos.length > 0) {
            if (periodo === 'acumulado') {
              // Filtrar datos desde enero hasta el mes actual
              const añoActual = new Date().getFullYear();
              const mesActual = new Date().getMonth() + 1;
              const fechaInicioAcumulado = `${añoActual}-01-01`;
              const fechaFinAcumulado = `${añoActual}-${mesActual.toString().padStart(2, '0')}-31`;
              
              const datosFiltrados = dataV0.datos.filter(item => {
                const itemFecha = new Date(item.periodo);
                const inicio = new Date(fechaInicioAcumulado);
                const fin = new Date(fechaFinAcumulado);
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
              // Filtrar datos del año completo usando las fechas pasadas como parámetros
              let añoAConsultar;
              if (fechaInicio && fechaFin) {
                // Usar las fechas pasadas como parámetros
                const [año] = fechaInicio.split('-');
                añoAConsultar = parseInt(año);
              } else {
                // Sin fechas, usar el año actual
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

        // Obtener gasto real desde la tabla financiero_sap
        if (dataReal.success && dataReal.data) {
          if (periodo === 'acumulado') {
            // Para acumulado, construir URL con fechas desde enero hasta mes actual
            const añoActual = new Date().getFullYear();
            const mesActual = new Date().getMonth() + 1;
            const fechaInicioAcumulado = `${añoActual}-01-01`;
            const fechaFinAcumulado = `${añoActual}-${mesActual.toString().padStart(2, '0')}-31`;
            
            let urlRealAcumulado = `${API_BASE}/datos_financieros_sap.php?proyecto_id=${proyectoId}`;
            if (filtroDescripcion && filtroDescripcion.trim() !== '') {
              urlRealAcumulado += `&descripcion=${encodeURIComponent(filtroDescripcion)}`;
            }
            urlRealAcumulado += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
            
            const responseRealAcumulado = await fetch(urlRealAcumulado);
            const dataRealAcumulado = await responseRealAcumulado.json();
            
            if (dataRealAcumulado.success && dataRealAcumulado.data) {
              gastoReal = parseFloat(dataRealAcumulado.data.monto_total) || 0;
            }
            console.log('💰 Gasto Real SAP (acumulado desde enero hasta mes actual):', gastoReal);
          } else if (periodo === 'filtrado' && fechaInicio && fechaFin) {
            // Para acumulado filtrado, construir URL con fechas desde enero hasta mes final del filtro
            const [añoFin, mesFin] = fechaFin.split('-');
            const fechaInicioAcumulado = `${añoFin}-01-01`;
            const fechaFinAcumulado = `${añoFin}-${mesFin}-31`;
            
            let urlRealFiltrado = `${API_BASE}/datos_financieros_sap.php?proyecto_id=${proyectoId}`;
            if (filtroDescripcion && filtroDescripcion.trim() !== '') {
              urlRealFiltrado += `&descripcion=${encodeURIComponent(filtroDescripcion)}`;
            }
            urlRealFiltrado += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
            
            const responseRealFiltrado = await fetch(urlRealFiltrado);
            const dataRealFiltrado = await responseRealFiltrado.json();
            
            if (dataRealFiltrado.success && dataRealFiltrado.data) {
              gastoReal = parseFloat(dataRealFiltrado.data.monto_total) || 0;
            }
            console.log('💰 Gasto Real SAP (acumulado filtrado):', gastoReal);
          } else if (periodo === 'anual') {
            // Para anual, construir URL con fechas del año completo
            let añoAConsultar;
            if (fechaInicio && fechaFin) {
              // Usar las fechas pasadas como parámetros
              const [año] = fechaInicio.split('-');
              añoAConsultar = parseInt(año);
            } else {
              // Sin fechas, usar el año actual
              añoAConsultar = new Date().getFullYear();
            }
            
            const fechaInicioAnual = `${añoAConsultar}-01-01`;
            const fechaFinAnual = `${añoAConsultar}-12-31`;
            
            let urlRealAnual = `${API_BASE}/datos_financieros_sap.php?proyecto_id=${proyectoId}`;
            if (filtroDescripcion && filtroDescripcion.trim() !== '') {
              urlRealAnual += `&descripcion=${encodeURIComponent(filtroDescripcion)}`;
            }
            urlRealAnual += `&periodo_desde=${fechaInicioAnual}&periodo_hasta=${fechaFinAnual}`;
            
            const responseRealAnual = await fetch(urlRealAnual);
            const dataRealAnual = await responseRealAnual.json();
            
            if (dataRealAnual.success && dataRealAnual.data) {
              gastoReal = parseFloat(dataRealAnual.data.monto_total) || 0;
            }
            console.log('💰 Gasto Real SAP (anual):', gastoReal, 'para año', añoAConsultar);
          } else {
            // Mes específico - usar los datos ya obtenidos
            gastoReal = parseFloat(dataReal.data.monto_total) || 0;
            console.log('💰 Gasto Real SAP (mes específico):', gastoReal);
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
        console.error('❌ Error obteniendo datos financieros:', error);
        return { planV0: 0, gastoReal: 0, cumplimientoA: 0 };
      }
    };

    // Función para obtener datos de PROG. V0 desde av_fisico_v0
    const obtenerDatosCumplimientoFisico = async (periodo, fechaInicio = null, fechaFin = null) => {
      try {
        console.log('🔍 Debug - obtenerDatosCumplimientoFisico:', { periodo, fechaInicio, fechaFin });
        
        // Construir la URL para consultar la tabla av_fisico_v0
        let url = `${API_BASE}/eficiencia_gasto/avance_fisico_v0.php?proyecto_id=${proyectoId}`;
        
        // Aplicar filtros de fecha según el período
        if (periodo === 'mes') {
          // Determinar el período a consultar para el mes
          if (fechaInicio) {
            // Usar la fecha de inicio pasada como parámetro
            const [año, mes] = fechaInicio.split('-');
            const fechaFiltro = new Date(parseInt(año), parseInt(mes) - 1, 1);
            const mesFiltro = fechaFiltro.toISOString().slice(0, 7);
            url += `&periodo_desde=${mesFiltro}-01&periodo_hasta=${mesFiltro}-31`;
          } else {
            // Sin fecha de inicio - usar el mes actual
            const mesActual = new Date().toISOString().slice(0, 7);
            url += `&periodo_desde=${mesActual}-01&periodo_hasta=${mesActual}-31`;
          }
        } else if (periodo === 'acumulado') {
          // Acumulado estándar: desde enero hasta el mes actual
          const añoActual = new Date().getFullYear();
          const mesActual = new Date().getMonth() + 1;
          const fechaInicioAcumulado = `${añoActual}-01-01`;
          const fechaFinAcumulado = `${añoActual}-${mesActual.toString().padStart(2, '0')}-31`;
          url += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
          console.log('🔍 Acumulado físico: desde', fechaInicioAcumulado, 'hasta', fechaFinAcumulado);
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
          // Determinar el año a consultar usando las fechas pasadas como parámetros
          let añoAConsultar;
          if (fechaInicio && fechaFin) {
            // Usar las fechas pasadas como parámetros
            const [año] = fechaInicio.split('-');
            añoAConsultar = parseInt(año);
          } else {
            // Sin fechas, usar el año actual
            añoAConsultar = new Date().getFullYear();
          }
          
          const fechaInicioAnual = `${añoAConsultar}-01-01`;
          const fechaFinAnual = `${añoAConsultar}-12-31`;
          url += `&periodo_desde=${fechaInicioAnual}&periodo_hasta=${fechaFinAnual}`;
          console.log('🔍 Anual físico: desde', fechaInicioAnual, 'hasta', fechaFinAnual, 'para año', añoAConsultar);
        }

        console.log('🔍 Consultando datos de PROG. V0 desde av_fisico_v0:');
        console.log('URL:', url);

        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        const data = await response.json();
        console.log('📊 Datos PROG. V0:', data);
        console.log('📊 Estructura de respuesta:', {
          success: data.success,
          datos: data.datos,
          total: data.total,
          hasData: data.datos && data.datos.length > 0
        });

        if (data.success && data.datos && data.datos.length > 0) {
          console.log('🔍 Procesando datos encontrados...');
          console.log('📊 Primeros 3 registros:', data.datos.slice(0, 3));
          
          // Obtener valores de api_parcial de la tabla av_fisico_v0
          let proyeccionV0 = 0;
          
          // PROG. V. O. 2025 (%) = sumar todos los valores api_parcial del período
          proyeccionV0 = data.datos.reduce((sum, item) => {
            const valor = parseFloat(item.api_parcial) || 0;
            console.log(`📊 Item ${item.periodo}: api_parcial = ${item.api_parcial} -> parseFloat = ${valor}`);
            return sum + valor;
          }, 0);
          
          // Convertir a porcentaje: el valor ya está en decimal (0.0071 = 0.71%)
          // Solo multiplicamos por 100 para mostrarlo como porcentaje
          proyeccionV0 = proyeccionV0 * 100;
          
          console.log('📈 Proyección V0 (suma de api_parcial):', proyeccionV0);
          console.log('📈 Proyección V0 convertida a porcentaje: %', proyeccionV0.toFixed(2));

          // Ahora consultar av_fisico_real para obtener el Avance Fisico
          console.log('🔍 Consultando av_fisico_real para Avance Fisico...');
          let avanceFisico = 0;
          
          try {
            // Construir URL para av_fisico_real con los mismos filtros
            let urlReal = `${API_BASE}/eficiencia_gasto/avance_fisico_real.php?proyecto_id=${proyectoId}`;
            
            // Aplicar los mismos filtros de fecha
            if (periodo === 'mes') {
              if (fechaInicio) {
                const [año, mes] = fechaInicio.split('-');
                const fechaFiltro = new Date(parseInt(año), parseInt(mes) - 1, 1);
                const mesFiltro = fechaFiltro.toISOString().slice(0, 7);
                urlReal += `&periodo_desde=${mesFiltro}-01&periodo_hasta=${mesFiltro}-31`;
              } else {
                const mesActual = new Date().toISOString().slice(0, 7);
                urlReal += `&periodo_desde=${mesActual}-01&periodo_hasta=${mesActual}-31`;
              }
            } else if (periodo === 'acumulado') {
              const añoActual = new Date().getFullYear();
              const mesActual = new Date().getMonth() + 1;
              const fechaInicioAcumulado = `${añoActual}-01-01`;
              const fechaFinAcumulado = `${añoActual}-${mesActual.toString().padStart(2, '0')}-31`;
              urlReal += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
            } else if (periodo === 'filtrado') {
              if (fechaInicio && fechaFin) {
                const [añoFin, mesFin] = fechaFin.split('-');
                const fechaInicioAcumulado = `${añoFin}-01-01`;
                const fechaFinAcumulado = `${añoFin}-${mesFin}-31`;
                urlReal += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
              }
            } else if (periodo === 'anual') {
              let añoAConsultar;
              if (fechaInicio && fechaFin) {
                const [año] = fechaInicio.split('-');
                añoAConsultar = parseInt(año);
              } else {
                añoAConsultar = new Date().getFullYear();
              }
              
              const fechaInicioAnual = `${añoAConsultar}-01-01`;
              const fechaFinAnual = `${añoAConsultar}-12-31`;
              urlReal += `&periodo_desde=${fechaInicioAnual}&periodo_hasta=${fechaFinAnual}`;
            }

            console.log('🔍 URL av_fisico_real:', urlReal);
            
            const responseReal = await fetch(urlReal);
            const dataReal = await responseReal.json();
            
            console.log('📊 Datos av_fisico_real:', dataReal);
            
            if (dataReal.success && dataReal.datos && dataReal.datos.length > 0) {
              // Sumar todos los valores api_parcial del período
              avanceFisico = dataReal.datos.reduce((sum, item) => {
                const valor = parseFloat(item.api_parcial) || 0;
                console.log(`📊 Item Real ${item.periodo}: api_parcial = ${item.api_parcial} -> parseFloat = ${valor}`);
                return sum + valor;
              }, 0);
              
              // Convertir a porcentaje
              avanceFisico = avanceFisico * 100;
              
              console.log('📈 Avance Fisico (suma de api_parcial):', avanceFisico);
              console.log('📈 Avance Fisico convertido a porcentaje: %', avanceFisico.toFixed(2));
            } else {
              console.log('⚠️ No se encontraron datos en av_fisico_real');
              avanceFisico = 0;
            }
          } catch (error) {
            console.error('❌ Error consultando av_fisico_real:', error);
            avanceFisico = 0;
          }

          // Calcular cumplimiento B: (AVANC. FÍSICO / PROG. V. O.) * 100
          let cumplimientoB = 0;
          if (proyeccionV0 > 0) {
            cumplimientoB = (avanceFisico / proyeccionV0) * 100;
          }
          console.log('📈 Cumplimiento B calculado: %', cumplimientoB.toFixed(2));
          
          return {
            proyeccionV0: proyeccionV0,    // Valor real de av_fisico_v0
            avanceFisico: avanceFisico,    // Valor real de av_fisico_real
            cumplimientoB: cumplimientoB   // Cálculo correcto
          };
        } else {
          console.log('❌ No se encontraron datos o respuesta inválida');
          console.log('❌ data.success:', data.success);
          console.log('❌ data.datos:', data.datos);
          console.log('❌ data.total:', data.total);
          
          return {
            proyeccionV0: 0,      // Sin datos (ya está en porcentaje)
            avanceFisico: 0,      // Sin datos (ya está en porcentaje)
            cumplimientoB: 0      // Sin cálculo
          };
        }
              } catch (error) {
          console.error('❌ Error en obtenerDatosCumplimientoFisico:', error);
          return { proyeccionV0: 0, avanceFisico: null, cumplimientoB: 0 };
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
          let fechaMesFiltro = null;
          
          if (fechaDesde && fechaHasta) {
            // Si hay filtros, verificar si es el mismo mes
            if (fechaDesde === fechaHasta) {
              // Caso 1: Filtros del mismo mes (ej: Julio 2025, Julio 2025)
              const [año, mes] = fechaDesde.split('-');
              const fechaFiltro = new Date(parseInt(año), parseInt(mes) - 1, 1);
              const mesNombre = fechaFiltro.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const añoNumero = fechaFiltro.getFullYear();
              nombrePeriodoMes = `PERIODO ${mesNombre}-${añoNumero}`;
              tipoPeriodoMes = 'mes';
              fechaMesFiltro = fechaDesde; // Usar la fecha del filtro
            } else {
              // Caso 2: Filtros de rango - usar el mes final del filtro
              const [añoFin, mesFin] = fechaHasta.split('-');
              const fechaFin = new Date(parseInt(añoFin), parseInt(mesFin) - 1, 1);
              const mesNombre = fechaFin.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const añoNumero = fechaFin.getFullYear();
              nombrePeriodoMes = `PERIODO ${mesNombre}-${añoNumero}`;
              tipoPeriodoMes = 'mes';
              fechaMesFiltro = fechaHasta; // Usar la fecha final del filtro
            }
          } else if (fechaHasta) {
            // Caso 3: Solo fecha hasta (ej: -----------, Julio 2025)
            const [año, mes] = fechaHasta.split('-');
            const fechaFiltro = new Date(parseInt(año), parseInt(mes) - 1, 1);
            const mesNombre = fechaFiltro.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const añoNumero = fechaFiltro.getFullYear();
            nombrePeriodoMes = `PERIODO ${mesNombre}-${añoNumero}`;
            tipoPeriodoMes = 'mes';
            fechaMesFiltro = fechaHasta; // Usar la fecha hasta
          } else {
            // Caso 4: Sin filtros - mes actual
            const mesActual = new Date();
            const mesNombre = mesActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const añoNumero = mesActual.getFullYear();
            nombrePeriodoMes = `PERIODO ${mesNombre}-${añoNumero}`;
            tipoPeriodoMes = 'mes';
            fechaMesFiltro = mesActual.toISOString().slice(0, 7); // Usar mes actual
          }
          
          // Determinar el período acumulado (segundo período)
          let nombrePeriodoAcumulado;
          let tipoPeriodoAcumulado = 'acumulado';
          let fechaAcumuladoInicio = null;
          let fechaAcumuladoFin = null;
          
          console.log('🔍 Debug - Fechas para acumulado:', { fechaDesde, fechaHasta });
          
          if (fechaDesde && fechaHasta) {
            console.log('🔍 Debug - Detectando tipo de filtro:', { fechaDesde, fechaHasta, esMismoMes: fechaDesde === fechaHasta });
            
            // Si hay filtros, verificar si es el mismo mes o rango
            if (fechaDesde === fechaHasta) {
              // Caso 1: Mismo mes (ej: Agosto 2025, Agosto 2025) - acumulado desde enero hasta el mes del filtro
              const [año, mes] = fechaDesde.split('-');
              const mesNombre = new Date(parseInt(año), parseInt(mes) - 1, 1).toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const añoNumero = parseInt(año);
              nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesNombre}. ${añoNumero}`;
              fechaAcumuladoInicio = `${año}-01-01`;
              fechaAcumuladoFin = fechaDesde;
              tipoPeriodoAcumulado = 'filtrado';
              console.log('🔍 Debug - Mismo mes detectado, acumulado desde enero hasta el mes del filtro:', nombrePeriodoAcumulado);
            } else {
              // Caso 2: Rango de fechas (ej: Enero 2025, Julio 2025) - acumulado desde enero hasta julio
              const [añoFin, mesFin] = fechaHasta.split('-');
              const fechaFin = new Date(parseInt(añoFin), parseInt(mesFin) - 1, 1);
              const mesFinNombre = fechaFin.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const añoNumero = parseInt(añoFin);
              
              nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesFinNombre}. ${añoNumero}`;
              fechaAcumuladoInicio = `${añoFin}-01-01`;
              fechaAcumuladoFin = fechaHasta;
              tipoPeriodoAcumulado = 'filtrado';
              console.log('🔍 Debug - Rango de fechas detectado, acumulado desde enero hasta el mes final:', { 
                nombrePeriodoAcumulado, 
                tipoPeriodoAcumulado,
                fechaAcumuladoInicio,
                fechaAcumuladoFin
              });
            }
          } else if (fechaHasta) {
            // Caso 3: Solo fecha hasta (ej: -----------, Julio 2025) - acumulado desde enero hasta julio
            const [año, mes] = fechaHasta.split('-');
            const fechaFin = new Date(parseInt(año), parseInt(mes) - 1, 1);
            const mesFinNombre = fechaFin.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const añoNumero = parseInt(año);
            
            nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesFinNombre}. ${añoNumero}`;
            fechaAcumuladoInicio = `${año}-01-01`;
            fechaAcumuladoFin = fechaHasta;
            tipoPeriodoAcumulado = 'filtrado';
            console.log('🔍 Debug - Solo fecha hasta, acumulado desde enero hasta el mes especificado:', nombrePeriodoAcumulado);
          } else {
            // Caso 4: Sin filtros - acumulado desde enero hasta mes actual
            const mesActual = new Date();
            const mesNombre = mesActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const añoNumero = mesActual.getFullYear();
            nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesNombre}. ${añoNumero}`;
            fechaAcumuladoInicio = `${añoNumero}-01-01`;
            fechaAcumuladoFin = mesActual.toISOString().slice(0, 7);
          }
          
          // Determinar el período anual (tercer período)
          let nombrePeriodoAnual = 'PERIODO AÑO 2025';
          let añoAnual = null;
          
          if (fechaDesde && fechaHasta) {
            // Si hay filtros, usar el año del filtro
            if (fechaDesde === fechaHasta) {
              // Caso 1: Mismo mes - usar el año del filtro
              const [año] = fechaDesde.split('-');
              nombrePeriodoAnual = `PERIODO AÑO ${año}`;
              añoAnual = parseInt(año);
            } else {
              // Caso 2: Rango de fechas - usar el año del filtro final
              const [añoFin] = fechaHasta.split('-');
              nombrePeriodoAnual = `PERIODO AÑO ${añoFin}`;
              añoAnual = parseInt(añoFin);
            }
          } else if (fechaHasta) {
            // Caso 3: Solo fecha hasta - usar el año de la fecha hasta
            const [año] = fechaHasta.split('-');
            nombrePeriodoAnual = `PERIODO AÑO ${año}`;
            añoAnual = parseInt(año);
          } else {
            // Caso 4: Sin filtros - usar el año actual
            const añoActual = new Date().getFullYear();
            nombrePeriodoAnual = `PERIODO AÑO ${añoActual}`;
            añoAnual = añoActual;
          }
          
          // Construir los períodos
          periodos = [
            { 
              nombre: nombrePeriodoMes, 
              tipo: tipoPeriodoMes, 
              fechaInicio: fechaMesFiltro, 
              fechaFin: fechaMesFiltro 
            },
            { 
              nombre: nombrePeriodoAcumulado, 
              tipo: tipoPeriodoAcumulado, 
              fechaInicio: fechaAcumuladoInicio, 
              fechaFin: fechaAcumuladoFin 
            },
            { 
              nombre: nombrePeriodoAnual, 
              tipo: 'anual',
              fechaInicio: `${añoAnual}-01-01`,
              fechaFin: `${añoAnual}-12-31`
            }
          ];

          console.log('🔍 Debug - Períodos construidos:', periodos);

          const datosCompletos = [];

          for (const periodo of periodos) {
            console.log('🔍 Debug - Procesando período:', { 
              nombre: periodo.nombre, 
              tipo: periodo.tipo, 
              fechaInicio: periodo.fechaInicio, 
              fechaFin: periodo.fechaFin 
            });
            
            // Obtener datos financieros
            const datosFinancieros = await obtenerDatosFinancieros(periodo.tipo, periodo.fechaInicio, periodo.fechaFin, filtroDescripcion);
            
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
    }, [proyectoId, fechaDesde, fechaHasta, filtroDescripcion]);



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
        
        {/* Filtros compactos */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#060270', fontWeight: 600, fontSize: 12 }}>Desde:</label>
            <input
              type="month"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              style={{
                border: '1px solid #1d69db',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 12,
                outline: 'none',
                width: '140px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#060270', fontWeight: 600, fontSize: 12 }}>Hasta:</label>
            <input
              type="month"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              style={{
                border: '1px solid #1d69db',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 12,
                outline: 'none',
                width: '140px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#060270', fontWeight: 600, fontSize: 12 }}>Descripción:</label>
            <select
              value={filtroDescripcion}
              onChange={e => setFiltroDescripcion(e.target.value)}
              style={{
                border: '1px solid #1d69db',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 12,
                outline: 'none',
                width: '160px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Todas</option>
              {descripcionesDisponibles.map((descripcion, index) => (
                <option key={index} value={descripcion}>
                  {descripcion}
                </option>
              ))}
            </select>
          </div>
          
          {(fechaDesde || fechaHasta || filtroDescripcion) && (
            <button
              onClick={() => {
                setFechaDesde('');
                setFechaHasta('');
                setFiltroDescripcion('');
              }}
              style={{
                background: '#FF8C00',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Limpiar filtros"
            >
              🧹
            </button>
          )}
        </div>
        
        {/* Mensaje informativo */}
        {filtroDescripcion && (
          <div style={{
            marginBottom: '15px',
            padding: '10px 15px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '6px',
            color: '#1565c0',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            📊 Mostrando datos filtrados por: <strong>{filtroDescripcion}</strong>
          </div>
        )}
        
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
                  <CustomTooltip 
                    content="📊 CUMPLIMIENTO FINANCIERO - Fórmula: (Gasto Real ÷ Plan V0) × 100. Eficiencia presupuestaria: >100% = sobre ejecución, <100% = sub ejecución."
                    position="top"
                  >
                    <span style={{ 
                      cursor: 'help', 
                      borderBottom: '2px dotted rgba(255,255,255,0.7)',
                      paddingBottom: '2px',
                      transition: 'all 0.2s ease',
                      ':hover': {
                        borderBottomColor: 'rgba(255,255,255,1)'
                      }
                    }}>
                      Cumpli. Financiero (%)
                    </span>
                  </CustomTooltip>
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
                  <CustomTooltip 
                    content="📋 CUMPLIMIENTO FÍSICO - Fórmula: (Avance Físico ÷ Prog. V0) × 100. Eficiencia operacional: >100% = adelanto físico, <100% = retraso físico."
                    position="top"
                  >
                    <span style={{ 
                      cursor: 'help', 
                      borderBottom: '2px dotted rgba(255,255,255,0.7)',
                      paddingBottom: '2px',
                      transition: 'all 0.2s ease'
                    }}>
                      Cumpli. Físico (%)
                    </span>
                  </CustomTooltip>
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  <CustomTooltip 
                    content="🎯 EFICIENCIA DEL GASTO - Fórmula: (Cumpli. Físico ÷ Cumpli. Financiero) × 100. Índice clave: >100% = mayor eficiencia física, <100% = menor eficiencia física."
                    position="top"
                  >
                    <span style={{ 
                      cursor: 'help', 
                      borderBottom: '2px dotted rgba(255,255,255,0.7)',
                      paddingBottom: '2px',
                      transition: 'all 0.2s ease'
                    }}>
                      EFICIEN. GASTO (%)
                    </span>
                  </CustomTooltip>
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  <CustomTooltip 
                    content="⭐ CALIFICACIÓN - Sistema de evaluación: 5.0 (>110% Excelente), 4.0 (105-110% Bueno), 3.0 (100-105% Regular), 2.0 (90-100% Deficiente), 1.0 (<90% Crítico)."
                    position="top"
                  >
                    <span style={{ 
                      cursor: 'help', 
                      borderBottom: '2px dotted rgba(255,255,255,0.7)',
                      paddingBottom: '2px',
                      transition: 'all 0.2s ease'
                    }}>
                      NOTA
                    </span>
                  </CustomTooltip>
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
                    {fila.proyeccionV0 !== null ? `${fila.proyeccionV0.toFixed(2)}%` : ''}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}>
                    {fila.avanceFisico !== null ? `${fila.avanceFisico.toFixed(2)}%` : ''}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {fila.cumplimientoB !== null ? `${fila.cumplimientoB.toFixed(2)}%` : ''}
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
          
          {/* Layout de Dos Columnas: Reglas de Notas + Períodos de Análisis */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '15px'
          }}>
            {/* Columna Izquierda: Reglas de Ponderación de Notas */}
            <div style={{
              backgroundColor: '#e3f2fd', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #2196f3'
            }}>
              <h5 style={{ color: '#1565c0', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                📋 REGLAS DE PONDERACIÓN DE NOTAS
              </h5>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px',
                marginBottom: '12px'
              }}>
                <div>
                  <h6 style={{ color: '#1976d2', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    🟢 EXCELENTES (4.0-5.0)
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '12px', color: '#1565c0', fontSize: '11px', lineHeight: '1.3' }}>
                    <li><strong>5.0:</strong> {'>'} 110%</li>
                    <li><strong>4.0:</strong> 105% - 110%</li>
                  </ul>
                </div>
                <div>
                  <h6 style={{ color: '#ff9800', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    🟡 REGULARES (2.0-3.0)
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '12px', color: '#f57c00', fontSize: '11px', lineHeight: '1.3' }}>
                    <li><strong>3.0:</strong> 100% - 105%</li>
                    <li><strong>2.0:</strong> 90% - 100%</li>
                  </ul>
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#fff3e0', 
                padding: '8px', 
                borderRadius: '6px', 
                border: '1px solid #ffb74d',
                marginBottom: '8px'
              }}>
                <h6 style={{ color: '#e65100', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  🔴 CRÍTICO (1.0)
                </h6>
                <ul style={{ margin: 0, paddingLeft: '12px', color: '#bf360c', fontSize: '11px', lineHeight: '1.3' }}>
                  <li><strong>1.0:</strong> {'<'} 90%</li>
                </ul>
              </div>
              <div style={{ 
                padding: '6px 10px', 
                backgroundColor: '#f1f8e9', 
                borderRadius: '6px', 
                border: '1px solid #8bc34a',
                fontSize: '11px',
                color: '#33691e'
              }}>
                <strong>💡</strong> {'>'}100% = Buena gestión, {'<'}100% = Requiere atención
              </div>
            </div>

            {/* Columna Derecha: Períodos de Análisis */}
            <div style={{
              backgroundColor: '#e8f5e8', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #28a745'
            }}>
              <h5 style={{ color: '#155724', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                📅 PERÍODOS DE ANÁLISIS
              </h5>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: '8px'
              }}>
                <div style={{
                  backgroundColor: '#f1f8e9',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #66bb6a'
                }}>
                  <h6 style={{ color: '#2e7d32', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    📊 Período del Mes
                  </h6>
                  <p style={{ margin: 0, fontSize: '11px', color: '#388e3c', lineHeight: '1.3' }}>
                    Análisis mensual específico (actual o filtrado por fechas)
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#f1f8e9',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #66bb6a'
                }}>
                  <h6 style={{ color: '#2e7d32', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    📈 Período Acumulado
                  </h6>
                  <p style={{ margin: 0, fontSize: '11px', color: '#388e3c', lineHeight: '1.3' }}>
                    Sumatoria desde enero hasta el mes de análisis
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#f1f8e9',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #66bb6a'
                }}>
                  <h6 style={{ color: '#2e7d32', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    🗓️ Período Anual
                  </h6>
                  <p style={{ margin: 0, fontSize: '11px', color: '#388e3c', lineHeight: '1.3' }}>
                    Análisis completo del año (actual o filtrado)
                  </p>
                </div>
              </div>
            </div>
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
                          <div><strong>Planificado:</strong> {periodoActual.proyeccionV0 !== null ? `${periodoActual.proyeccionV0.toFixed(2)}%` : 'N/A'}</div>
                          <div><strong>Ejecutado:</strong> {periodoActual.avanceFisico !== null ? `${periodoActual.avanceFisico.toFixed(2)}%` : 'N/A'}</div>
                          <div><strong>Cumplimiento:</strong> 
                            <span style={{ 
                              color: eficienciaFisica >= 100 ? '#28a745' : eficienciaFisica >= 90 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {eficienciaFisica !== null ? `${eficienciaFisica.toFixed(1)}%` : 'N/A'}
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

// Componente para el reporte de Líneas Bases - Real/Proyectado
const ReporteLineasBases = ({ proyectoId }) => {
  // Estados para las 5 tablas
  const [tablaReal, setTablaReal] = useState([]);
  const [tablaNpc, setTablaNpc] = useState([]);
  const [tablaPoa, setTablaPoa] = useState([]);
  const [tablaV0, setTablaV0] = useState([]);
  const [tablaApi, setTablaApi] = useState([]);
  
  // Estados para importación
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [importando, setImportando] = useState(false);
  const [tablaSeleccionada, setTablaSeleccionada] = useState('av_fisico_real');
  const [mensajeImportacion, setMensajeImportacion] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('info');
  const fileInputRef = useRef(null);

  // Estados para filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroVector, setFiltroVector] = useState('');
  
  // Estado para controlar qué tabla mostrar
  const [tablaVisualizar, setTablaVisualizar] = useState('todas');
  
  // Estado para fecha de última importación
  const [ultimaImportacion, setUltimaImportacion] = useState(null);

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

  // Cargar todas las tablas al montar el componente
  useEffect(() => {
    if (proyectoId) {
      cargarDatosTabla('av_fisico_real', setTablaReal);
      cargarDatosTabla('av_fisico_npc', setTablaNpc);
      cargarDatosTabla('av_fisico_poa', setTablaPoa);
      cargarDatosTabla('av_fisico_v0', setTablaV0);
      cargarDatosTabla('av_fisico_api', setTablaApi);
    }
  }, [proyectoId]);

  // Función para manejar la selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setArchivoSeleccionado(file);
      setExcelData([]);
      setMensajeImportacion('');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (data.length > 1) {
            const headers = data[0];
            const rows = data.slice(1).map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });
            setExcelData(rows);
            setMensajeImportacion(`✅ Archivo cargado: ${rows.length} filas de datos`);
            setTipoMensaje('success');
          }
        } catch (error) {
          setMensajeImportacion('❌ Error al leer el archivo Excel');
          setTipoMensaje('error');
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // Función para convertir fecha de Excel a MySQL
  const excelDateToMysql = (excelDate) => {
    if (!excelDate) return null;
    
    if (typeof excelDate === 'string') {
      // Remover " real" del final si existe
      const cleanDate = excelDate.replace(/\s+real$/i, '');
      
      // Si es DD-MM-YYYY
      if (/^\d{2}-\d{2}-\d{4}$/.test(cleanDate)) {
        const [day, month, year] = cleanDate.split('-');
        return `${year}-${month}-${day}`;
      }
      
      // Si es YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        return cleanDate;
      }
      
      // Intentar parsear como fecha estándar
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    if (typeof excelDate === 'number') {
      // Si es un número (fecha de Excel), convertirla
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  };

  // Función para normalizar claves
  const normalizeKeys = (row) => {
    const normalized = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      normalized[normalizedKey] = row[key];
    });
    return normalized;
  };

  // Función para mapear filas de Excel según la tabla seleccionada
  const mapExcelRow = (row) => {
    const normalizedRow = normalizeKeys(row);
    
    // Función para limpiar ID (remover "real" del final)
    const cleanId = (id) => {
      if (typeof id === 'string') {
        return id.replace(/real$/i, '');
      }
      return id;
    };
    
    // Función para limpiar porcentajes
    const cleanPercentage = (value) => {
      if (!value) return 0;
      
      let cleanValue = String(value).trim();
      
      // Remover símbolo de porcentaje
      const hasPercentage = cleanValue.includes('%');
      cleanValue = cleanValue.replace('%', '');
      
      // Convertir coma a punto
      cleanValue = cleanValue.replace(',', '.');
      
      const numValue = parseFloat(cleanValue);
      if (isNaN(numValue)) return 0;
      
      // Si tenía símbolo de porcentaje, convertir a decimal (dividir por 100)
      if (hasPercentage) {
        return Math.min(numValue / 100, 9.9999); // Máximo para DECIMAL(5,4)
      }
      
      // Si no tenía símbolo de porcentaje, asumir que ya es decimal
      return Math.min(numValue, 9.9999); // Máximo para DECIMAL(5,4)
    };
    
    const baseMapping = {
      proyecto_id: proyectoId,
      periodo: excelDateToMysql(normalizedRow.periodo || normalizedRow.fecha),
      vector: normalizedRow.vector || '',
      ie_parcial: cleanPercentage(normalizedRow.ie_parcial || normalizedRow.ie || 0),
      ie_acumulado: cleanPercentage(normalizedRow.ie_acumulado || normalizedRow.ie_acum || 0),
      em_parcial: cleanPercentage(normalizedRow.em_parcial || normalizedRow.em || 0),
      em_acumulado: cleanPercentage(normalizedRow.em_acumulado || normalizedRow.em_acum || 0),
      mo_parcial: cleanPercentage(normalizedRow.mo_parcial || normalizedRow.mo || 0),
      mo_acumulado: cleanPercentage(normalizedRow.mo_acumulado || normalizedRow.mo_acum || 0),
      api_parcial: cleanPercentage(normalizedRow.api_parcial || normalizedRow.api || 0),
      api_acum: cleanPercentage(normalizedRow.api_acum || normalizedRow.api_acumulado || 0)
    };

    // Agregar el ID específico según la tabla
    switch (tablaSeleccionada) {
      case 'av_fisico_real':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_real || ''), ...baseMapping };
      case 'av_fisico_npc':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_npc || ''), ...baseMapping };
      case 'av_fisico_poa':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_poa || ''), ...baseMapping };
      case 'av_fisico_v0':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_v0 || ''), ...baseMapping };
      case 'av_fisico_api':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_api || ''), ...baseMapping };
      default:
        return baseMapping;
    }
  };

  // Función para importar datos
  const handleImportar = async () => {
    if (!excelData || excelData.length === 0) {
      setMensajeImportacion('❌ No hay datos para importar');
      setTipoMensaje('error');
      return;
    }

    setImportando(true);
    try {
      const mappedData = excelData.map(mapExcelRow);
      
      // Debug: mostrar los datos mapeados
      console.log('Datos mapeados:', mappedData);
      
      const response = await fetch(`${API_BASE}/importaciones/importar_av_real_proyectado.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: mappedData,
          tabla: tablaSeleccionada,
          proyecto_id: proyectoId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMensajeImportacion(`✅ Importación exitosa: ${result.inserted} registros importados`);
        setTipoMensaje('success');
        
        // Actualizar fecha de última importación
        setUltimaImportacion(new Date().toLocaleString('es-ES'));
        
        // Recargar datos de la tabla correspondiente
        switch (tablaSeleccionada) {
          case 'av_fisico_real':
            cargarDatosTabla('av_fisico_real', setTablaReal);
            break;
          case 'av_fisico_npc':
            cargarDatosTabla('av_fisico_npc', setTablaNpc);
            break;
          case 'av_fisico_poa':
            cargarDatosTabla('av_fisico_poa', setTablaPoa);
            break;
          case 'av_fisico_v0':
            cargarDatosTabla('av_fisico_v0', setTablaV0);
            break;
          case 'av_fisico_api':
            cargarDatosTabla('av_fisico_api', setTablaApi);
            break;
        }
        
        // Limpiar archivo
        setArchivoSeleccionado(null);
        setExcelData([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        let errorMessage = result.error || 'Error desconocido';
        if (result.errores && Array.isArray(result.errores)) {
          errorMessage += '\n\nErrores específicos:\n' + result.errores.join('\n');
        }
        setMensajeImportacion(`❌ Error en la importación: ${errorMessage}`);
        setTipoMensaje('error');
      }
    } catch (error) {
      setMensajeImportacion(`❌ Error de conexión: ${error.message}`);
      setTipoMensaje('error');
    }
    setImportando(false);
  };

  // Función para obtener datos filtrados
  const getDatosFiltrados = (datos) => {
    let filtrados = datos;
    
    // Debug: mostrar información de filtrado
    if (fechaDesde || fechaHasta) {
      console.log('🔍 Debug - Filtros aplicados:', { fechaDesde, fechaHasta, datosOriginales: datos.length });
    }
    
    if (fechaDesde) {
      filtrados = filtrados.filter(row => {
        if (!row.periodo) return false;
        
        // Función para convertir fecha a formato ISO para comparación
        const convertirFechaAISO = (fechaStr) => {
          if (!fechaStr) return null;
          
          // Si ya está en formato ISO (YYYY-MM-DD), usar directamente
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return fechaStr;
          }
          
          // Si está en formato DD-MM-YYYY, convertir a ISO
          if (fechaStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [dia, mes, año] = fechaStr.split('-');
            return `${año}-${mes}-${dia}`;
          }
          
          // Para otros formatos, intentar parsear correctamente
          const fecha = new Date(fechaStr);
          if (isNaN(fecha.getTime())) {
            console.warn('⚠️ Fecha inválida en filtrado:', fechaStr);
            return null;
          }
          
          return fecha.toISOString().split('T')[0];
        };
        
        const fechaRowISO = convertirFechaAISO(row.periodo);
        const fechaDesdeISO = convertirFechaAISO(fechaDesde);
        
        if (!fechaRowISO || !fechaDesdeISO) {
          console.warn('Fecha inválida detectada:', { periodo: row.periodo, fechaDesde });
          return false;
        }
        
        const cumpleFiltro = fechaRowISO >= fechaDesdeISO;
        
        // Debug: mostrar comparación de fechas
        if (fechaDesde && fechaHasta) {
          console.log('🔍 Debug - Comparación fecha:', {
            periodo: row.periodo,
            fechaRowISO: fechaRowISO,
            fechaDesdeISO: fechaDesdeISO,
            cumpleFiltro
          });
        }
        
        return cumpleFiltro;
      });
    }
    
    if (fechaHasta) {
      filtrados = filtrados.filter(row => {
        if (!row.periodo) return false;
        
        // Función para convertir fecha a formato ISO para comparación
        const convertirFechaAISO = (fechaStr) => {
          if (!fechaStr) return null;
          
          // Si ya está en formato ISO (YYYY-MM-DD), usar directamente
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return fechaStr;
          }
          
          // Si está en formato DD-MM-YYYY, convertir a ISO
          if (fechaStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [dia, mes, año] = fechaStr.split('-');
            return `${año}-${mes}-${dia}`;
          }
          
          // Para otros formatos, intentar parsear correctamente
          const fecha = new Date(fechaStr);
          if (isNaN(fecha.getTime())) {
            console.warn('⚠️ Fecha inválida en filtrado:', fechaStr);
            return null;
          }
          
          return fecha.toISOString().split('T')[0];
        };
        
        const fechaRowISO = convertirFechaAISO(row.periodo);
        const fechaHastaISO = convertirFechaAISO(fechaHasta);
        
        if (!fechaRowISO || !fechaHastaISO) {
          console.warn('Fecha inválida detectada:', { periodo: row.periodo, fechaHasta });
          return false;
        }
        
        const cumpleFiltro = fechaRowISO <= fechaHastaISO;
        
        // Debug: mostrar comparación de fechas
        if (fechaDesde && fechaHasta) {
          console.log('🔍 Debug - Comparación fecha HASTA:', {
            periodo: row.periodo,
            fechaRowISO: fechaRowISO,
            fechaHastaISO: fechaHastaISO,
            cumpleFiltro
          });
        }
        
        return cumpleFiltro;
      });
    }
    
    if (filtroVector) {
      filtrados = filtrados.filter(row => row.vector === filtroVector);
    }
    
    // Debug: mostrar resultado final del filtrado
    if (fechaDesde || fechaHasta) {
      console.log('🔍 Debug - Resultado filtrado:', { 
        datosOriginales: datos.length, 
        datosFiltrados: filtrados.length,
        filtros: { fechaDesde, fechaHasta, filtroVector }
      });
    }
    
    return filtrados;
  };

  // Obtener vectores únicos para el filtro
  const obtenerVectoresUnicos = () => {
    const todosLosDatos = [...tablaReal, ...tablaNpc, ...tablaPoa, ...tablaV0, ...tablaApi];
    const vectores = [...new Set(todosLosDatos.map(row => row.vector).filter(v => v))];
    return vectores.sort();
  };

  // Obtener datos de la tabla seleccionada para visualizar
  const obtenerDatosTablaSeleccionada = () => {
    switch (tablaVisualizar) {
      case 'real':
        return getDatosFiltrados(tablaReal);
      case 'npc':
        return getDatosFiltrados(tablaNpc);
      case 'poa':
        return getDatosFiltrados(tablaPoa);
      case 'v0':
        return getDatosFiltrados(tablaV0);
      case 'api':
        return getDatosFiltrados(tablaApi);
      case 'todas':
      default:
        // Ordenar según preferencia: REAL, V0, NPC, API, POA
        const datosOrdenados = [
          ...getDatosFiltrados(tablaReal).map(row => ({ ...row, tipo: 'REAL' })),
          ...getDatosFiltrados(tablaV0).map(row => ({ ...row, tipo: 'V0' })),
          ...getDatosFiltrados(tablaNpc).map(row => ({ ...row, tipo: 'NPC' })),
          ...getDatosFiltrados(tablaApi).map(row => ({ ...row, tipo: 'API' })),
          ...getDatosFiltrados(tablaPoa).map(row => ({ ...row, tipo: 'POA' }))
        ];
        return datosOrdenados;
    }
  };

  // Función para obtener la fecha actual formateada
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // Función para obtener la posición de la línea de corte
  const obtenerPosicionLineaCorte = () => {
    const datosGrafica = prepararDatosCurvaS();
    if (datosGrafica.length === 0) return null;
    
    const fechaActual = obtenerFechaActual();
    
    // Debug: mostrar información
    console.log('Datos de la gráfica:', datosGrafica.map(d => d.periodo));
    console.log('Fecha actual:', fechaActual);
    
    // Buscar si existe un período exacto para hoy
    const periodoExacto = datosGrafica.find(dato => dato.periodo === fechaActual);
    if (periodoExacto) {
      console.log('Período exacto encontrado:', fechaActual);
      return fechaActual;
    }
    
    // Si no existe, buscar el período más cercano a la fecha actual
    const fechaActualObj = new Date(fechaActual);
    let periodoMasCercano = null;
    let diferenciaMinima = Infinity;
    
    datosGrafica.forEach(dato => {
      const fechaDato = new Date(dato.periodo);
      const diferencia = Math.abs(fechaActualObj - fechaDato);
      if (diferencia < diferenciaMinima) {
        diferenciaMinima = diferencia;
        periodoMasCercano = dato.periodo;
      }
    });
    
    console.log('Período más cercano encontrado:', periodoMasCercano);
    return periodoMasCercano;
  };

  // Función para obtener el porcentaje de la fecha de corte "HOY"
  const obtenerPorcentajeHoy = (tipo) => {
    // Si hay una tabla específica seleccionada, solo mostrar el porcentaje de esa tabla
    if (tablaVisualizar !== 'todas' && tablaVisualizar !== tipo) {
      return 0;
    }
    
    const datosGrafica = prepararDatosCurvaS();
    const periodoHoy = obtenerPosicionLineaCorte();
    
    if (!periodoHoy || datosGrafica.length === 0) return 0;
    
    const datosHoy = datosGrafica.find(dato => dato.periodo === periodoHoy);
    if (!datosHoy) return 0;
    
    switch (tipo) {
      case 'real': return datosHoy.real || 0;
      case 'v0': return datosHoy.v0 || 0;
      case 'npc': return datosHoy.npc || 0;
      case 'api': return datosHoy.api || 0;
      case 'poa': return datosHoy.poa || 0;
      default: return 0;
    }
  };

  // Función para preparar datos de la Curva S
  const prepararDatosCurvaS = () => {
    const datosReal = getDatosFiltrados(tablaReal);
    const datosV0 = getDatosFiltrados(tablaV0);
    const datosNpc = getDatosFiltrados(tablaNpc);
    const datosApi = getDatosFiltrados(tablaApi);
    const datosPoa = getDatosFiltrados(tablaPoa);

    // Filtrar datos según la tabla seleccionada
    let datosParaGrafica = [];
    if (tablaVisualizar === 'real') {
      datosParaGrafica = datosReal;
    } else if (tablaVisualizar === 'v0') {
      datosParaGrafica = datosV0;
    } else if (tablaVisualizar === 'npc') {
      datosParaGrafica = datosNpc;
    } else if (tablaVisualizar === 'api') {
      datosParaGrafica = datosApi;
    } else if (tablaVisualizar === 'poa') {
      datosParaGrafica = datosPoa;
    } else {
      // Para 'todas' o cualquier otro valor, usar todos los datos
      datosParaGrafica = [...datosReal, ...datosV0, ...datosNpc, ...datosApi, ...datosPoa];
    }

    // Obtener todos los períodos únicos
    const todosLosPeriodos = new Set();
    datosParaGrafica.forEach(row => {
      if (row.periodo) {
        todosLosPeriodos.add(row.periodo);
      }
    });

    // Ordenar períodos
    const periodosOrdenados = Array.from(todosLosPeriodos).sort();

    // Crear datos para la gráfica usando api_acum de cada tabla
    const datosGrafica = periodosOrdenados.map(periodo => {
      const realData = datosReal.find(row => row.periodo === periodo);
      const v0Data = datosV0.find(row => row.periodo === periodo);
      const npcData = datosNpc.find(row => row.periodo === periodo);
      const apiData = datosApi.find(row => row.periodo === periodo);
      const poaData = datosPoa.find(row => row.periodo === periodo);

      const datosBase = {
        periodo: periodo,
        fecha: new Date(periodo),
        real: realData ? parseFloat(realData.api_acum || 0) * 100 : 0,
        v0: v0Data ? parseFloat(v0Data.api_acum || 0) * 100 : 0,
        npc: npcData ? parseFloat(npcData.api_acum || 0) * 100 : 0,
        api: apiData ? parseFloat(apiData.api_acum || 0) * 100 : 0,
        poa: poaData ? parseFloat(poaData.api_acum || 0) * 100 : 0
      };

      // Si se seleccionó una tabla específica, solo mostrar esa línea
      if (tablaVisualizar !== 'todas') {
        const datosFiltrados = { ...datosBase };
        // Poner en 0 las líneas que no están seleccionadas
        if (tablaVisualizar !== 'real') datosFiltrados.real = 0;
        if (tablaVisualizar !== 'v0') datosFiltrados.v0 = 0;
        if (tablaVisualizar !== 'npc') datosFiltrados.npc = 0;
        if (tablaVisualizar !== 'api') datosFiltrados.api = 0;
        if (tablaVisualizar !== 'poa') datosFiltrados.poa = 0;
        return datosFiltrados;
      }

      return datosBase;
    });

    return datosGrafica;
  };

    return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#16355D', margin: 0 }}>
          Líneas Bases - Real/Proyectado
        </h2>
        
        {ultimaImportacion && (
          <div style={{ 
            background: '#e8f5e8', 
            padding: '8px 12px', 
            borderRadius: '6px', 
            border: '1px solid #4caf50',
            fontSize: '12px',
            color: '#2e7d32'
          }}>
            <span style={{ fontWeight: 'bold' }}>📅 Última importación:</span> {ultimaImportacion}
          </div>
        )}
      </div>

      {/* Sección de importación */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ color: '#16355D', marginBottom: '15px' }}>Importar Datos</h3>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Seleccionar Tabla:
            </label>
            <select
              value={tablaSeleccionada}
              onChange={(e) => setTablaSeleccionada(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="av_fisico_real">Real</option>
              <option value="av_fisico_npc">NPC</option>
              <option value="av_fisico_poa">POA</option>
              <option value="av_fisico_v0">V0</option>
              <option value="av_fisico_api">API</option>
            </select>
      </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Archivo Excel:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            />
          </div>
          
          <button
            onClick={handleImportar}
            disabled={importando || !archivoSeleccionado}
            style={{
              background: importando ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: importando ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {importando ? 'Importando...' : 'Importar'}
          </button>
        </div>

        {mensajeImportacion && (
      <div style={{ 
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: tipoMensaje === 'success' ? '#d4edda' : '#f8d7da',
            color: tipoMensaje === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${tipoMensaje === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {mensajeImportacion}
      </div>
        )}
        
        {ultimaImportacion && (
          <div style={{ 
            marginTop: '10px',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7',
            fontSize: '12px'
          }}>
            <span style={{ fontWeight: 'bold' }}>📅 Última importación:</span> {ultimaImportacion}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ color: '#16355D', marginBottom: '10px' }}>Filtros</h4>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '12px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '12px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Vector:</label>
            <select
              value={filtroVector}
              onChange={(e) => setFiltroVector(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '12px',
                minWidth: '120px'
              }}
            >
              <option value="">Todos los vectores</option>
              {obtenerVectoresUnicos().map((vector, index) => (
                <option key={index} value={vector}>{vector}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => {
              setFechaDesde('');
              setFechaHasta('');
              setFiltroVector('');
            }}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Selector de tabla para visualizar */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ color: '#16355D', marginBottom: '15px' }}>Seleccionar Tabla para Visualizar</h4>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTablaVisualizar('todas')}
            style={{
              background: tablaVisualizar === 'todas' ? '#16355D' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Todas las Tablas
          </button>
          
          <button
            onClick={() => setTablaVisualizar('real')}
            style={{
              background: tablaVisualizar === 'real' ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo Real
          </button>
          
          <button
            onClick={() => setTablaVisualizar('npc')}
            style={{
              background: tablaVisualizar === 'npc' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo NPC
          </button>
          
          <button
            onClick={() => setTablaVisualizar('poa')}
            style={{
              background: tablaVisualizar === 'poa' ? '#ffc107' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo POA
          </button>
          
          <button
            onClick={() => setTablaVisualizar('v0')}
            style={{
              background: tablaVisualizar === 'v0' ? '#17a2b8' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo V0
          </button>
          
          <button
            onClick={() => setTablaVisualizar('api')}
            style={{
              background: tablaVisualizar === 'api' ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo API
          </button>
        </div>
      </div>

      {/* Resumen de datos */}
        <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>Real</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {obtenerPorcentajeHoy('real').toFixed(2)}%
        </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
            borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>NPC</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {obtenerPorcentajeHoy('npc').toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>POA</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
            {obtenerPorcentajeHoy('poa').toFixed(2)}%
        </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>V0</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
            {obtenerPorcentajeHoy('v0').toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>API</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
            {obtenerPorcentajeHoy('api').toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
      </div>

      {/* Gráfico Curva S */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #dee2e6',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: '#16355D', marginBottom: '15px', textAlign: 'center' }}>
          📈 Curva S - API Acumulado {tablaVisualizar === 'todas' ? '(Real, V0, NPC, API, POA)' : `(${tablaVisualizar.toUpperCase()})`}
        </h4>
        
        {prepararDatosCurvaS().length > 0 ? (
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prepararDatosCurvaS()} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="periodo" 
                  stroke="#666"
                  fontSize={10}
                  tick={{ fill: '#666' }}
                  type="category"
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    // Formatear fecha de YYYY-MM-DD a MM/YY
                    const parts = value.split('-');
                    const month = parts[1];
                    const year = parts[0].slice(-2);
                    return `${month}/${year}`;
                  }}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={11}
                  tick={{ fill: '#666' }}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  domain={[0, 100]}
                  label={{ value: 'API Acumulado (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      // Formatear fecha de YYYY-MM-DD a MM/YYYY
                      const parts = label.split('-');
                      const month = parts[1];
                      const year = parts[0];
                      const periodoFormateado = `${month}/${year}`;
                      
                      return (
                        <div style={{
                          background: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          padding: '12px',
                          fontSize: '12px',
                          fontFamily: 'Arial, sans-serif'
                        }}>
                          <div style={{
                            borderBottom: '1px solid #eee',
                            paddingBottom: '8px',
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            color: '#333',
                            fontSize: '13px'
                          }}>
                            Período: {periodoFormateado}
                          </div>
                          
                          {payload.map((entry, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              backgroundColor: `${entry.color}10`
                            }}>
                              <span style={{ 
                                color: entry.color, 
                                fontWeight: '600',
                                fontSize: '11px'
                              }}>
                                {entry.name.toUpperCase()}:
                              </span>
                              <span style={{ 
                                fontWeight: 'bold',
                                color: '#333',
                                fontSize: '11px',
                                backgroundColor: `${entry.color}20`,
                                padding: '1px 4px',
                                borderRadius: '2px'
                              }}>
                                {entry.value.toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                
                {/* Líneas de cada vector - Orden: REAL, V0, NPC, API, POA */}
                <Line 
                  type="monotone" 
                  dataKey="real" 
                  stroke="#28a745" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="REAL"
                />
                <Line 
                  type="monotone" 
                  dataKey="v0" 
                  stroke="#17a2b8" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="V0"
                />
                <Line 
                  type="monotone" 
                  dataKey="npc" 
                  stroke="#007bff" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="NPC"
                />
                <Line 
                  type="monotone" 
                  dataKey="api" 
                  stroke="#dc3545" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="API"
                />
                <Line 
                  type="monotone" 
                  dataKey="poa" 
                  stroke="#ffc107" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="POA"
                />
                
                {/* Línea vertical de corte - fecha actual */}
                {obtenerPosicionLineaCorte() && (
                  <ReferenceLine 
                    x={obtenerPosicionLineaCorte()} 
                    stroke="#ff6b35" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{
                      value: "HOY",
                      position: "top",
                      fill: "#ff6b35",
                      fontSize: 10,
                      fontWeight: "bold"
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#6c757d',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p>No hay datos suficientes para mostrar la Curva S.</p>
            <p>Importa datos de Real, V0, NPC y API para visualizar la gráfica de API Acumulado.</p>
          </div>
        )}
      </div>

      {/* Tabla de datos */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #dee2e6',
        overflowX: 'auto'
      }}>
        <h4 style={{ color: '#16355D', marginBottom: '15px' }}>
          Datos de {tablaVisualizar === 'todas' ? 'Todas las Tablas' : 
                     tablaVisualizar === 'real' ? 'Real' :
                     tablaVisualizar === 'npc' ? 'NPC' :
                     tablaVisualizar === 'poa' ? 'POA' :
                     tablaVisualizar === 'v0' ? 'V0' : 'API'}
          ({obtenerDatosTablaSeleccionada().length} registros)
        </h4>
        
        {obtenerDatosTablaSeleccionada().length > 0 ? (
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
                top: 0
              }}>
                {tablaVisualizar === 'todas' && (
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                    Tipo
                  </th>
                )}

                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                  Vector
                </th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                  Período
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  IE Parcial
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  IE Acumulado
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  EM Parcial
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  EM Acumulado
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  MO Parcial
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  MO Acumulado
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  API Parcial
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  API Acumulado
                </th>
              </tr>
            </thead>
            <tbody>
              {obtenerDatosTablaSeleccionada().map((row, index) => (
                <tr key={index} style={{ 
                  background: index % 2 === 0 ? '#f8f9fa' : '#fff',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  {tablaVisualizar === 'todas' && (
                    <td style={{ 
                      padding: '8px', 
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      color: row.tipo === 'REAL' ? '#28a745' :
                             row.tipo === 'V0' ? '#17a2b8' :
                             row.tipo === 'NPC' ? '#007bff' : '#dc3545'
                    }}>
                      {row.tipo}
                    </td>
                  )}
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                    {row.vector || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                    {row.periodo ? (() => {
                      // Debug: mostrar el valor original del período
                      console.log('🔍 Debug - Período original:', row.periodo, 'Tipo:', typeof row.periodo);
                      
                      // Función para formatear fecha correctamente
                      const formatearFecha = (fechaStr) => {
                        if (!fechaStr) return '-';
                        
                        // Si está en formato ISO (YYYY-MM-DD), parsear correctamente
                        if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                          const [año, mes, dia] = fechaStr.split('-');
                          // Crear fecha usando el constructor que no tiene problemas de zona horaria
                          const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
                          console.log('🔍 Debug - ISO parseado:', fechaStr, '->', fecha.toLocaleDateString('es-ES'));
                          return fecha.toLocaleDateString('es-ES');
                        }
                        
                        // Si está en formato DD-MM-YYYY, convertir a ISO
                        if (fechaStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
                          const [dia, mes, año] = fechaStr.split('-');
                          const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
                          console.log('🔍 Debug - DD-MM-YYYY parseado:', fechaStr, '->', fecha.toLocaleDateString('es-ES'));
                          return fecha.toLocaleDateString('es-ES');
                        }
                        
                        // Para otros formatos, intentar parsear directamente
                        const fecha = new Date(fechaStr);
                        if (isNaN(fecha.getTime())) {
                          console.warn('⚠️ Fecha inválida:', fechaStr);
                          return fechaStr; // Mostrar el valor original si no se puede parsear
                        }
                        
                        return fecha.toLocaleDateString('es-ES');
                      };
                      
                      const fechaFormateada = formatearFecha(row.periodo);
                      console.log('🔍 Debug - Fecha formateada:', fechaFormateada);
                      return fechaFormateada;
                    })() : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.ie_parcial ? `${(parseFloat(row.ie_parcial) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.ie_acumulado ? `${(parseFloat(row.ie_acumulado) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.em_parcial ? `${(parseFloat(row.em_parcial) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.em_acumulado ? `${(parseFloat(row.em_acumulado) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.mo_parcial ? `${(parseFloat(row.mo_parcial) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.mo_acumulado ? `${(parseFloat(row.mo_acumulado) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.api_parcial ? `${(parseFloat(row.api_parcial) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.api_acum ? `${(parseFloat(row.api_acum) * 100).toFixed(2)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#6c757d',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p>No hay datos disponibles para mostrar.</p>
            <p>Importa archivos Excel o selecciona otra tabla para visualizar datos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportabilidad; 