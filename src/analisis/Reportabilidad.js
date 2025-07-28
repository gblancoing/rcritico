import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, BarChart, Bar, LabelList, Cell, PieChart, Pie } from 'recharts';
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
  { value: 'predictividad', label: 'Predictividad' },
  { value: 'eficiencia_gasto', label: 'Eficiencia del Gasto' },
  { value: 'cumplimiento_fisico', label: 'Cumplimiento Físico' },
];

const ALTURA_BARRA_SUPERIOR = 56;
const ANCHO_SIDEBAR = 240;

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
        <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
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
  const [seleccion, setSeleccion] = useState('predictividad');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroVector, setFiltroVector] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [datosReporte, setDatosReporte] = useState([]);
  const [datosCumplimientoFisico, setDatosCumplimientoFisico] = useState([]);
  const [usandoDatosReales, setUsandoDatosReales] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  
  // Estados para mensajes de importación (movidos al componente padre)
  const [mensajeImportacion, setMensajeImportacion] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

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
        case 'cumplimiento_fisico':
          // Cargar datos reales de cumplimiento físico desde la API
          if (proyectoId) {
            // Construir URL con filtros de fecha
            let url = `${API_BASE}/cumplimiento_fisico/cumplimiento_fisico.php?proyecto_id=${proyectoId}`;
            
            if (fechaDesde) {
              // Convertir formato YYYY-MM a YYYY-MM-01 para el inicio del mes
              const fechaDesdeCompleta = `${fechaDesde}-01`;
              url += `&periodo_desde=${fechaDesdeCompleta}`;
            }
            if (fechaHasta) {
              // Obtener el último día del mes seleccionado
              const [year, month] = fechaHasta.split('-');
              const ultimoDia = new Date(parseInt(year), parseInt(month), 0).getDate();
              const fechaHastaCompleta = `${fechaHasta}-${ultimoDia.toString().padStart(2, '0')}`;
              url += `&periodo_hasta=${fechaHastaCompleta}`;
            }
            

            
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
              // Guardar datos crudos para la tabla dinámica
              setDatosCumplimientoFisico(result.data);
              // Procesar datos para el formato requerido por el componente
              datos = procesarDatosCumplimientoFisico(result.data);
              setUsandoDatosReales(true);
            } else {
              // Si no hay datos reales, usar datos de ejemplo
              setDatosCumplimientoFisico([]);
              datos = generarDatosEjemplo(seleccion);
              setUsandoDatosReales(false);
            }
          } else {
            setDatosCumplimientoFisico([]);
            datos = generarDatosEjemplo(seleccion);
          }
          break;
          
        case 'predictividad':
          // Para predictividad, usar datos de ejemplo por ahora
          // La funcionalidad principal es la importación de Excel
          datos = generarDatosEjemplo(seleccion);
          setUsandoDatosReales(false);
          break;
          
        case 'eficiencia_gasto':
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

  // Función para procesar datos de cumplimiento físico desde la API
  const procesarDatosCumplimientoFisico = (datosAPI) => {
    if (!datosAPI || datosAPI.length === 0) {
      return generarDatosEjemplo('cumplimiento_fisico');
    }

    // Agrupar datos por centro de costo y vector
    const datosAgrupados = {};
    
    datosAPI.forEach(registro => {
      const key = `${registro.nombre}_${registro.vector}`;
      if (!datosAgrupados[key]) {
        datosAgrupados[key] = {
          actividad: `${registro.nombre} - ${registro.vector}`,
          planificado: 0,
          real: 0,
          cumplimiento: 0,
          datos: [],
          porcentajes: []
        };
      }
      datosAgrupados[key].datos.push(registro);
      datosAgrupados[key].porcentajes.push(parseFloat(registro.porcentaje_periodo) || 0);
    });
    
    // Calcular promedios y cumplimiento
    const resultado = Object.values(datosAgrupados).map(item => {
      const porcentajesValidos = item.porcentajes.filter(p => !isNaN(p) && p >= 0);
      
      if (porcentajesValidos.length === 0) {
        return {
          actividad: item.actividad,
          planificado: 0,
          real: 0,
          cumplimiento: 0
        };
      }
      
      const promedioReal = porcentajesValidos.reduce((sum, p) => sum + p, 0) / porcentajesValidos.length;
      const maximo = Math.max(...porcentajesValidos);
      const planificado = maximo * 1.02; // Planificado como 2% más que el máximo real
      const cumplimiento = planificado > 0 ? (promedioReal / planificado) * 100 : 0;
      
      return {
        actividad: item.actividad,
        planificado: Math.round(planificado * 10) / 10,
        real: Math.round(promedioReal * 10) / 10,
        cumplimiento: Math.round(cumplimiento * 10) / 10
      };
    });
    
    // Si no hay datos procesados, usar datos de ejemplo
    if (resultado.length === 0) {
      return generarDatosEjemplo('cumplimiento_fisico');
    }
    
    return resultado;
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
      case 'cumplimiento_fisico':
        return [
          { actividad: 'Excavación', planificado: 85, real: 82, cumplimiento: 96.5 },
          { actividad: 'Fundaciones', planificado: 65, real: 63, cumplimiento: 96.9 },
          { actividad: 'Estructura', planificado: 45, real: 43, cumplimiento: 95.6 },
          { actividad: 'Instalaciones', planificado: 25, real: 24, cumplimiento: 96.0 },
        ];
      default:
        return [];
    }
  };

  // Cargar datos cuando cambie la selección
  useEffect(() => {
    cargarDatosReporte();
  }, [seleccion]);

  // Recargar datos cuando cambien los filtros de fecha (solo para cumplimiento_fisico)
  useEffect(() => {
    if (seleccion === 'cumplimiento_fisico' && proyectoId) {
      cargarDatosReporte();
    }
  }, [fechaDesde, fechaHasta]);

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
        />;
      case 'eficiencia_gasto':
        return <ReporteEficienciaGasto data={datosReporte} />;
      case 'cumplimiento_fisico':
        return <ReporteCumplimientoFisico data={datosReporte} autorizado={autorizado} setAutorizado={setAutorizado} />;
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
    fechaHasta
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
        console.log('🚀 INICIANDO obtenerProyeccionFisica');
        console.log('📋 Parámetros:', { proyectoId, fechaDesde, fechaHasta });
        
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
        
        console.log('🔍 Consultando proyección física desde predictividad:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        const data = await response.json();
        console.log('📊 Respuesta proyección física:', data);
        
        if (data.success) {
          const valorProyeccion = parseFloat(data.total_proyeccion_fisica) || 0;
          console.log('🔢 Valor proyección parseado:', valorProyeccion);
          
          setProyeccionFisica(valorProyeccion);
          
          console.log('✅ Proyección física actualizada:', valorProyeccion);
          console.log('📋 Total registros encontrados:', data.detalles?.total_registros);
          console.log('📊 Formato:', data.total_formateado);
        } else {
          console.log('⚠️ No se encontraron datos de proyección física en predictividad');
          console.log('❌ Error:', data.error);
          setProyeccionFisica(0);
        }
      } catch (error) {
        console.error('❌ Error de conexión proyección física:', error);
        setProyeccionFisica(0);
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

    // Función para convertir fechas de Excel a formato YYYY-MM-DD (para campos DATE)
    const excelDateToMysql = (excelDate) => {
      console.log('🔍 JS - CONVERSIÓN DE FECHA A YYYY-MM-DD:');
      console.log('  📅 Valor recibido:', excelDate);
      console.log('  📅 Tipo:', typeof excelDate);
      
      if (!excelDate || excelDate === '' || excelDate === null || excelDate === undefined) {
        console.log('❌ JS - Fecha vacía, retornando cadena vacía');
        return '';
      }
      
      // Si es un número (número de serie Excel)
      if (!isNaN(excelDate) && typeof excelDate === 'number') {
        console.log('🔢 JS - Procesando número de Excel:', excelDate);
        
        // Algoritmo simple para convertir número de Excel a fecha
        const excelEpoch = new Date(1900, 0, 1);
        const msPerDay = 24 * 60 * 60 * 1000;
        let adjustedDays = excelDate - 1;
        if (excelDate > 59) adjustedDays--;
        
        const resultDate = new Date(excelEpoch.getTime() + (adjustedDays * msPerDay));
        
        if (!isNaN(resultDate.getTime())) {
          const year = resultDate.getFullYear();
          const month = String(resultDate.getMonth() + 1).padStart(2, '0');
          const day = String(resultDate.getDate()).padStart(2, '0');
          const converted = `${year}-${month}-${day}`;
          console.log('✅ JS - Convertido número Excel a YYYY-MM-DD:', `${excelDate} -> "${converted}"`);
          return converted;
        } else {
          console.log('❌ JS - Error calculando fecha desde número Excel');
          return '';
        }
      }
      
      // Si es string, procesar formato DD-MM-YYYY
      const dateStr = String(excelDate).trim();
      console.log('📅 JS - Fecha como string:', `"${dateStr}"`);
      
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        console.log('📅 JS - Partes de fecha:', parts);
        
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            // Formato DD-MM-YYYY -> convertir a YYYY-MM-DD
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            const converted = `${year}-${month}-${day}`;
            console.log('✅ JS - Convertido DD-MM-YYYY a YYYY-MM-DD:', `"${dateStr}" -> "${converted}"`);
            return converted;
          } else if (parts[0].length === 4) {
            // Ya está en formato YYYY-MM-DD
            const year = parts[0];
            const month = parts[1].padStart(2, '0');
            const day = parts[2].padStart(2, '0');
            const converted = `${year}-${month}-${day}`;
            console.log('✅ JS - Formato YYYY-MM-DD mantenido:', `"${dateStr}" -> "${converted}"`);
            return converted;
          }
        }
      }
      
      console.log('⚠️ JS - Formato no reconocido, retornando cadena vacía');
      return '';
    };

    // Función para normalizar nombres de columnas
    const normalizeKeys = (row) => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        newRow[key.trim().toLowerCase().replace(/\s+/g, '_')] = row[key];
      });
      return newRow;
    };

    // Función para convertir porcentajes
    const parsePercentage = (value) => {
      console.log('🔢 JS PARSEPERCENTAGE - Iniciando conversión:');
      console.log('  Valor original:', value);
      console.log('  Tipo:', typeof value);
      
      if (!value || value === '' || value === null || value === undefined) {
        console.log('  ✅ JS - Valor vacío, retornando 0');
        return 0;
      }
      
      let numero = 0;
      
      // Si es un número (viene de Excel como decimal)
      if (typeof value === 'number') {
        numero = value;
        console.log('  📊 JS - Es número:', numero);
        
        // Si es un número muy pequeño (< 1), probablemente viene de formato porcentaje de Excel
        // Multiplicar por 100 para obtener el valor que el usuario espera
        if (numero > 0 && numero < 1) {
          numero = numero * 100;
          console.log('  🔄 JS - Detectado formato porcentaje Excel, multiplicado por 100:', numero);
        }
      } else {
        // Si es string, procesarlo como antes
        let str = String(value).trim();
        console.log('  Como string:', str);
        
        if (str === '') {
          console.log('  ✅ JS - String vacío después de trim, retornando 0');
          return 0;
        }
        
        // Remover el símbolo % si existe
        if (str.includes('%')) {
          str = str.replace('%', '');
          console.log('  Después de quitar %:', str);
        }
        
        // Reemplazar coma por punto para parseFloat
        str = str.replace(',', '.');
        console.log('  Después de coma->punto:', str);
        
        numero = parseFloat(str);
        console.log('  Resultado parseFloat:', numero);
      }
      
      console.log('  ¿Es NaN?:', isNaN(numero));
      
      const resultado = isNaN(numero) ? 0 : parseFloat(numero.toFixed(2));
      console.log('🔢 JS PARSEPERCENTAGE - Resultado final:', resultado);
      
      return resultado;
    };

    // Función para mapear filas del Excel a formato de base de datos
    const mapExcelRow = (row) => {
      const r = normalizeKeys(row);
      
      console.log('📊 ============ PROCESANDO FILA EXCEL ============');
      console.log('📊 Datos originales del Excel:', row);
      console.log('📊 Datos normalizados:', r);
      console.log('📊 Claves disponibles:', Object.keys(r));
      
      // COMPARACIÓN ESPECÍFICA: ¿Por qué periodo_prediccion funciona pero periodo_cierre_real no?
      console.log('🔍 COMPARACIÓN DE CAMPOS DE FECHA EN EXCEL:');
      console.log('  📅 periodo_prediccion en datos originales:', row['periodo_prediccion']);
      console.log('  📅 periodo_prediccion en datos normalizados:', r['periodo_prediccion']);
      console.log('  📅 periodo_cierre_real en datos originales:', row['periodo_cierre_real']);
      console.log('  📅 periodo_cierre_real en datos normalizados:', r['periodo_cierre_real']);
      
      // Buscar variaciones de periodo_cierre_real en los datos
      console.log('🔍 BÚSQUEDA DE CLAVES RELACIONADAS CON CIERRE/REAL:');
      Object.keys(row).forEach(key => {
        if (key.toLowerCase().includes('cierre') || key.toLowerCase().includes('real')) {
          console.log(`  - ORIGINAL '${key}':`, row[key]);
        }
      });
      Object.keys(r).forEach(key => {
        if (key.includes('cierre') || key.includes('real')) {
          console.log(`  - NORMALIZADA '${key}':`, r[key]);
        }
      });
      
      // Buscar claves de forma más flexible
      let periodoPrediccionKey = null;
      let porcentajePredicidoKey = null;
      let periodoCierreRealKey = null;
      let valorRealPorcentajeKey = null;
      
      // Búsqueda exacta primero
      Object.keys(r).forEach(key => {
        if (key === 'periodo_prediccion') periodoPrediccionKey = key;
        if (key === 'porcentaje_predicido') porcentajePredicidoKey = key;
        if (key === 'periodo_cierre_real') periodoCierreRealKey = key;
        if (key === 'valor_real_porcentaje') valorRealPorcentajeKey = key;
      });
      
      // Si no se encuentran las claves exactas, buscar alternativas
      if (!periodoPrediccionKey) {
        Object.keys(r).forEach(key => {
          if (key.includes('periodo') && key.includes('prediccion')) {
            periodoPrediccionKey = key;
          }
        });
      }
      
      if (!porcentajePredicidoKey) {
        Object.keys(r).forEach(key => {
          if (key.includes('porcentaje') && key.includes('predicido')) {
            porcentajePredicidoKey = key;
          }
        });
      }
      
      if (!periodoCierreRealKey) {
        console.log('🔍 periodo_cierre_real no encontrado, buscando alternativas...');
        Object.keys(r).forEach(key => {
          if (key.includes('periodo') && key.includes('cierre') && key.includes('real')) {
            periodoCierreRealKey = key;
            console.log('✅ Encontrada clave alternativa para periodo_cierre_real:', key);
          }
        });
        
        // Si aún no se encuentra, buscar solo con "cierre" y "real"
        if (!periodoCierreRealKey) {
          Object.keys(r).forEach(key => {
            if (key.includes('cierre') && key.includes('real')) {
              periodoCierreRealKey = key;
              console.log('✅ Encontrada clave con cierre+real:', key);
            }
          });
        }
        
        // Como último recurso, buscar solo "real" que contenga fecha
        if (!periodoCierreRealKey) {
          Object.keys(r).forEach(key => {
            if (key.includes('real') && r[key] && String(r[key]).includes('-')) {
              periodoCierreRealKey = key;
              console.log('✅ Encontrada clave con "real" que parece fecha:', key);
            }
          });
        }
      }
      
      if (!valorRealPorcentajeKey) {
        Object.keys(r).forEach(key => {
          if (key.includes('valor') && key.includes('real')) {
            valorRealPorcentajeKey = key;
          }
        });
      }
      
      console.log('🔍 CLAVES FINALES DETECTADAS:');
      console.log('  - periodo_prediccion:', periodoPrediccionKey);
      console.log('  - porcentaje_predicido:', porcentajePredicidoKey);
      console.log('  - periodo_cierre_real:', periodoCierreRealKey);
      console.log('  - valor_real_porcentaje:', valorRealPorcentajeKey);
      
      // Procesar los valores con logging detallado
      console.log('🔄 PROCESANDO VALORES:');
      
      const periodo_prediccion = periodoPrediccionKey ? excelDateToMysql(r[periodoPrediccionKey]) : '';
      console.log('📅 periodo_prediccion procesado:', periodo_prediccion, '← de:', r[periodoPrediccionKey]);
      
      const porcentaje_predicido = porcentajePredicidoKey ? parsePercentage(r[porcentajePredicidoKey]) : 0;
      console.log('📊 porcentaje_predicido procesado:', porcentaje_predicido, '← de:', r[porcentajePredicidoKey]);
      
      const periodo_cierre_real = periodoCierreRealKey ? excelDateToMysql(r[periodoCierreRealKey]) : '';
      console.log('📅 periodo_cierre_real procesado:', periodo_cierre_real, '← de:', r[periodoCierreRealKey]);
      
      const valor_real_porcentaje = valorRealPorcentajeKey ? parsePercentage(r[valorRealPorcentajeKey]) : 0;
      console.log('📊 valor_real_porcentaje procesado:', valor_real_porcentaje, '← de:', r[valorRealPorcentajeKey]);
      
      // Verificación especial para periodo_cierre_real
      if (!periodo_cierre_real && periodoCierreRealKey) {
        console.log('🚨 PROBLEMA EN JS: periodo_cierre_real vacío después del procesamiento');
        console.log('  - Clave usada:', periodoCierreRealKey);
        console.log('  - Valor original:', r[periodoCierreRealKey]);
        console.log('  - Tipo del valor:', typeof r[periodoCierreRealKey]);
      }
      
      // Si periodo_cierre_real está vacío, usar periodo_prediccion como fallback
      let periodo_cierre_real_final = periodo_cierre_real;
      if (!periodo_cierre_real && periodo_prediccion) {
        console.log('⚠️ JS - Usando periodo_prediccion como fallback para periodo_cierre_real');
        periodo_cierre_real_final = periodo_prediccion;
      }
      
      const mappedRow = {
        periodo_prediccion: periodo_prediccion,
        porcentaje_predicido: porcentaje_predicido,
        periodo_cierre_real: periodo_cierre_real_final,
        valor_real_porcentaje: valor_real_porcentaje
      };
      
      console.log('📊 FILA MAPEADA FINAL:', mappedRow);
      console.log('📊 ============ FIN PROCESAMIENTO FILA EXCEL ============');
      
      return mappedRow;
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
      console.log('🔄 useEffect ejecutándose con parámetros:', { proyectoId, fechaDesde, fechaHasta });
      
      if (proyectoId) {
        console.log('🔄 Actualizando datos de predictividad por cambio de filtros');
        obtenerProyeccionFinanciera();
        obtenerRealFinanciera();
        obtenerRealFisica();
        obtenerProyeccionFisica();
      } else {
        console.log('⚠️ proyectoId no está disponible, no se ejecutan las funciones');
      }
    }, [proyectoId, fechaDesde, fechaHasta]);

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
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          USD {proyeccionFinanciera.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: '10px', color: '#28a745', marginTop: '2px' }}>
                          ✅ Datos SAP
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
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          USD {realFinanciera.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: '10px', color: '#007bff', marginTop: '2px' }}>
                          📋 Datos Reales
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
                            {desviacion.esPositiva ? '📈 Sobregasto' : 
                             desviacion.esNegativa ? '📉 Ahorro' : '📊 Sin desviación'}
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
                    -
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
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {proyeccionFisica.toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#28a745', marginTop: '2px' }}>
                          ✅ Datos Predictividad
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
                            {desviacion.esPositiva ? '📈 Sobregasto' : 
                             desviacion.esNegativa ? '📉 Ahorro' : '📊 Sin desviación'}
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
                    -
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Componente para el reporte de Eficiencia del Gasto
  const ReporteEficienciaGasto = ({ data }) => (
    <div style={{ width: '100%', padding: '20px' }}>
      <h3 style={{ color: '#16355D', marginBottom: '20px' }}>Análisis de Eficiencia del Gasto</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {data.map((item, index) => (
          <div key={index} style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '2px solid #16355D'
          }}>
            <h4 style={{ color: '#16355D', marginBottom: '10px' }}>{item.categoria}</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1ecb4f', marginBottom: '5px' }}>
              {item.eficiencia}%
            </div>
            <div style={{ color: '#666', marginBottom: '10px' }}>
              Presupuesto: ${(item.presupuesto/1000000).toFixed(1)}M
            </div>
            <div style={{ color: '#666', marginBottom: '10px' }}>
              Ejecutado: ${(item.ejecutado/1000000).toFixed(1)}M
            </div>
            <div style={{
              padding: '5px 10px',
              borderRadius: '4px',
              background: item.eficiencia >= 95 ? '#d4edda' : item.eficiencia >= 90 ? '#fff3cd' : '#f8d7da',
              color: item.eficiencia >= 95 ? '#155724' : item.eficiencia >= 90 ? '#856404' : '#721c24',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              {item.eficiencia >= 95 ? 'Excelente' : item.eficiencia >= 90 ? 'Bueno' : 'Requiere Atención'}
            </div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="categoria" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={v => `${v}%`} />
          <Bar dataKey="eficiencia" fill="#16355D" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // Componente para el reporte de Cumplimiento Físico
  const ReporteCumplimientoFisico = ({ data, autorizado, setAutorizado }) => {
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
      if (!valor || valor === '' || valor === null || valor === undefined) return 0;
      
      // Convertir a string si no lo es
      let strValor = String(valor).trim();
      
      // Si está vacío después del trim, retornar 0
      if (strValor === '') return 0;
      
      // Remover el símbolo % si existe
      if (strValor.includes('%')) {
        strValor = strValor.replace('%', '');
      }
      
      // Reemplazar coma por punto para parseFloat
      strValor = strValor.replace(',', '.');
      
      // Convertir a número
      const numero = parseFloat(strValor);
      
      // Si el valor original tenía %, mantener el valor tal como está
      // Si no tenía %, asumir que ya es un porcentaje completo
      if (String(valor).includes('%')) {
        return isNaN(numero) ? 0 : numero;
      } else {
        // Si no tenía %, asumir que es un valor decimal y convertirlo a porcentaje
        return isNaN(numero) ? 0 : numero * 100;
      }
    };

    const mapExcelRow = (row) => {
      const r = normalizeKeys(row);
      
      
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
            cargarDatosReporte();
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
                fontWeight: 'bold'
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
                fontWeight: 'bold'
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
                fontWeight: 'bold'
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
                fontWeight: 'bold',
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
            <label style={{ 
              color: '#16355D', 
              fontWeight: 'bold', 
              fontSize: '14px',
              marginRight: '5px'
            }}>
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
                title="Limpiar filtro de vector"
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
                        {parseFloat(item.parcial_periodo || 0).toFixed(2)}%
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        fontSize: '12px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        {parseFloat(item.porcentaje_periodo).toFixed(2)}%
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
              📊 Resumen de Parciales por Vector
              {fechaDesde || fechaHasta ? (
                <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginLeft: '10px' }}>
                  (Filtrado: {fechaDesde || 'Inicio'} - {fechaHasta || 'Fin'})
                </span>
              ) : null}
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
                      Vector
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>
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
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>
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
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>
                      {(() => {
                        const añoProyeccion = fechaDesde ? fechaDesde.split('-')[0] : 
                                             fechaHasta ? fechaHasta.split('-')[0] : 
                                             new Date().getFullYear();
                        return `Proyección ${añoProyeccion} (%)`;
                      })()}
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
                        {resumen.vector}
                      </td>
                      <td style={{ 
                        padding: '12px 8px', 
                        fontSize: '14px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        {resumen.parcialPeriodo.toFixed(2)}%
                      </td>
                      <td style={{ 
                        padding: '12px 8px', 
                        fontSize: '14px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        {resumen.sumatoriaParciales.toFixed(2)}%
                      </td>
                      <td style={{ 
                        padding: '12px 8px', 
                        fontSize: '14px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#16355D'
                      }}>
                        {resumen.proyeccionAno.toFixed(2)}%
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

  // Componente para la Curva S
  const CurvaS = ({ data }) => {
    // Preparar datos para la gráfica - agrupar por período
    const datosPorPeriodo = {};
    const periodosUnicos = new Set();
    
    data.forEach(item => {
      // Usar la fecha completa como período (YYYY-MM-DD)
      const periodo = item.periodo;
      periodosUnicos.add(periodo);
      
      if (!datosPorPeriodo[periodo]) {
        datosPorPeriodo[periodo] = {
          periodo: periodo,
          fecha: new Date(item.periodo)
        };
      }
      
      // Agregar el vector al período
      datosPorPeriodo[periodo][item.vector] = parseFloat(item.porcentaje_periodo);
    });
    
    // Crear lista ordenada de períodos (fechas completas)
    const periodosOrdenados = Array.from(periodosUnicos).sort((a, b) => {
      return a.localeCompare(b); // Ordenar fechas YYYY-MM-DD alfabéticamente
    });
    
    // Crear array de datos para la gráfica
    const datosGrafica = periodosOrdenados.map(periodo => {
      return datosPorPeriodo[periodo] || { periodo: periodo };
    });

    // Calcular valores por vector
    const datosPorVector = {};
    data.forEach(item => {
      if (!datosPorVector[item.vector]) {
        datosPorVector[item.vector] = [];
      }
      datosPorVector[item.vector].push(parseFloat(item.porcentaje_periodo));
    });
    
    // Obtener el valor más reciente/futuro de cada vector
    const valorReal = datosPorVector['REAL'] && datosPorVector['REAL'].length > 0 
      ? Math.max(...datosPorVector['REAL']) : 0;
    const valorV0 = datosPorVector['V0'] && datosPorVector['V0'].length > 0 
      ? Math.max(...datosPorVector['V0']) : 0;
    const valorNPC = datosPorVector['NPC'] && datosPorVector['NPC'].length > 0 
      ? Math.max(...datosPorVector['NPC']) : 0;
    const valorAPI = datosPorVector['API'] && datosPorVector['API'].length > 0 
      ? Math.max(...datosPorVector['API']) : 0;

    // Colores por vector
    const getColorByVector = (vector) => {
      switch (vector) {
        case 'REAL': return '#FF8C00'; // Naranja oscuro
        case 'V0': return '#00BFFF';   // Celeste fuerte
        case 'NPC': return '#0066CC';  // Azul
        case 'API': return '#32CD32';  // Verde claro fuerte
        default: return '#666';
      }
    };

    return (
      <div>
        {/* Valores por Vector */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            background: '#FFF3E0', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #FF8C00',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#FF8C00', fontSize: '14px' }}>REAL</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF8C00' }}>
              {valorReal.toFixed(2)}%
            </p>
          </div>
          
          <div style={{ 
            background: '#E0F7FF', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #00BFFF',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#00BFFF', fontSize: '14px' }}>V0</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#00BFFF' }}>
              {valorV0.toFixed(2)}%
            </p>
            <p style={{ 
              margin: '5px 0 0 0', 
              fontSize: '12px', 
              color: valorReal - valorV0 >= 0 ? '#4CAF50' : '#F44336',
              fontWeight: 'bold'
            }}>
              Eficiencia: {valorReal - valorV0 >= 0 ? '+' : ''}{(valorReal - valorV0).toFixed(2)}%
              {valorReal - valorV0 >= 0 ? ' (Eficiente)' : ' (Ineficiente)'}
            </p>
          </div>
          
          <div style={{ 
            background: '#E0F0FF', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #0066CC',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#0066CC', fontSize: '14px' }}>NPC</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#0066CC' }}>
              {valorNPC.toFixed(2)}%
            </p>
            <p style={{ 
              margin: '5px 0 0 0', 
              fontSize: '12px', 
              color: valorReal - valorNPC >= 0 ? '#4CAF50' : '#F44336',
              fontWeight: 'bold'
            }}>
              Eficiencia: {valorReal - valorNPC >= 0 ? '+' : ''}{(valorReal - valorNPC).toFixed(2)}%
              {valorReal - valorNPC >= 0 ? ' (Eficiente)' : ' (Ineficiente)'}
            </p>
          </div>
          
          <div style={{ 
            background: '#E8F5E8', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #32CD32',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#32CD32', fontSize: '14px' }}>API</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#32CD32' }}>
              {valorAPI.toFixed(2)}%
            </p>
            <p style={{ 
              margin: '5px 0 0 0', 
              fontSize: '12px', 
              color: valorReal - valorAPI >= 0 ? '#4CAF50' : '#F44336',
              fontWeight: 'bold'
            }}>
              Eficiencia: {valorReal - valorAPI >= 0 ? '+' : ''}{(valorReal - valorAPI).toFixed(2)}%
              {valorReal - valorAPI >= 0 ? ' (Eficiente)' : ' (Ineficiente)'}
            </p>
          </div>
        </div>

        {/* Gráfica Curva S */}
        <div style={{ height: '400px', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafica} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                      <XAxis 
                          dataKey="periodo" 
                          stroke="#666"
                          fontSize={8}
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
                          tickFormatter={(value) => `${value}%`}
                          domain={[0, 'dataMax + 10']}
                          label={{ value: 'Porcentaje (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        />
                                      <Tooltip 
                          contentStyle={{ 
                            background: '#fff', 
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          formatter={(value, name) => [`${value}%`, name]}
                          labelFormatter={(label) => {
                            // Formatear fecha de YYYY-MM-DD a MM/YYYY
                            const parts = label.split('-');
                            const month = parts[1];
                            const year = parts[0];
                            return `Período: ${month}/${year}`;
                          }}
                        />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
              />
              {['REAL', 'V0', 'NPC', 'API'].map((vector) => (
                <Line 
                  key={vector}
                  type="monotone" 
                  dataKey={vector} 
                  stroke={getColorByVector(vector)} 
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={{ 
                    fill: getColorByVector(vector), 
                    strokeWidth: 1.5, 
                    r: 3,
                    stroke: '#fff'
                  }}
                  activeDot={{ 
                    r: 5, 
                    stroke: getColorByVector(vector), 
                    strokeWidth: 2,
                    fill: '#fff'
                  }}
                  name={`Cumplimiento ${vector}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
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
      {/* Filtros de fecha */}
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
          <button
            onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
            title="Limpiar filtro de fecha"
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

export default Reportabilidad; 