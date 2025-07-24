import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, BarChart, Bar, LabelList, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const tablas = [

  { value: 'api_acumulada', label: 'API Acumulada' },
  { value: 'api_parcial', label: 'API Parcial' },
  { value: 'npc_acumulado', label: 'NPC Acumulado' },
  { value: 'npc_parcial', label: 'NPC Parcial' },
  { value: 'v0_acumulada', label: 'V0 Acumulada' },
  { value: 'v0_parcial', label: 'V0 Parcial' },
  { value: 'real_acumulado', label: 'Real Acumulado' },
  { value: 'real_parcial', label: 'Real Parcial' },
];

const reportes = [
  { value: 'reporte9', label: 'Flujo Financiero SAP' },
  { value: 'reporte6', label: 'Curva S - Acumulados' },
  { value: 'reporte1', label: 'Curva S - Parciales' },
  // Agrega más reportes si los necesitas
];

const ALTURA_BARRA_SUPERIOR = 56; // Ajusta según tu layout
const ANCHO_SIDEBAR = 240;

const SidebarDerecho = ({ seleccion, setSeleccion, sidebarVisible, setSidebarVisible }) => (
  <>
    <div
      style={{
        position: 'fixed',
        top: ALTURA_BARRA_SUPERIOR,
        right: 0,
        width: ANCHO_SIDEBAR,
        height: `calc(100vh - ${ALTURA_BARRA_SUPERIOR}px)`,
        background: '#16355D',
        color: '#fff',
        boxShadow: '0 0 8px #0003',
        padding: '32px 16px 16px 16px',
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
        <h4 style={{ color: '#FFD000', marginBottom: 8 }}>Vectores</h4>
        <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
          {tablas.map(tabla => (
            <button
              key={tabla.value}
              onClick={() => setSeleccion(tabla.value)}
              style={{
                display: 'block',
                width: '100%',
                marginBottom: 6,
                background: seleccion === tabla.value ? '#FFD000' : '#fff',
                color: seleccion === tabla.value ? '#16355D' : '#16355D',
                border: 'none',
                borderRadius: 4,
                padding: '8px 0',
                fontWeight: seleccion === tabla.value ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              {tabla.label}
            </button>
          ))}
        </div>
      </div>
  <div>
        <h4 style={{ color: '#FFD000', marginBottom: 8 }}>Analisis - Reportes</h4>
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

const Vectores = ({ proyectoId }) => {
  const [seleccion, setSeleccion] = useState('real_parcial'); // Por defecto 'Real Parcial'
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [excelData, setExcelData] = useState([]);
  const [importando, setImportando] = useState(false);
  const [tablaRealParcial, setTablaRealParcial] = useState([]);
  const [tablaRealAcumulado, setTablaRealAcumulado] = useState([]); // NUEVO
  const [tablaV0Parcial, setTablaV0Parcial] = useState([]); // NUEVO
  const [tablaV0Acumulada, setTablaV0Acumulada] = useState([]); // NUEVO
  const [tablaNpcParcial, setTablaNpcParcial] = useState([]); // NUEVO
  const [tablaNpcAcumulado, setTablaNpcAcumulado] = useState([]); // NUEVO
  const [tablaApiParcial, setTablaApiParcial] = useState([]); // NUEVO
  const [tablaApiAcumulada, setTablaApiAcumulada] = useState([]); // NUEVO
  const [tablaFinancieroSap, setTablaFinancieroSap] = useState([]); // NUEVO: Tabla financiero_sap
  const [cargandoTabla, setCargandoTabla] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importMessage, setImportMessage] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const CLAVE_IMPORTACION = 'codelco2025$'; // Clave actualizada
  const [showClaveModal, setShowClaveModal] = useState(false);
  const [claveInput, setClaveInput] = useState('');
  const [claveError, setClaveError] = useState('');
  // 1. Agrega estado para mostrar el modal del informe ejecutivo
  const [showInformeModal, setShowInformeModal] = useState(false);
  // 1. Agrega una función para capturar el gráfico como imagen
  const [graficoImg, setGraficoImg] = useState(null);
  const graficoRef = useRef();
  // 1. Agrega refs y estados para ambos gráficos
  const [graficoParcialesImg, setGraficoParcialesImg] = useState(null);
  const [graficoAcumuladosImg, setGraficoAcumuladosImg] = useState(null);
  const graficoParcialesRef = useRef();
  const graficoAcumuladosRef = useRef();
  // Nuevo estado para controlar la carga de datos del informe
  const [cargandoInforme, setCargandoInforme] = useState(false);
  // --- NUEVO: Tabla Transpuesta ---
  const [vectorTranspuesta, setVectorTranspuesta] = useState('real_parcial');

  const categorias = [
    'CONSTRUCCION',
    'INDIRECTOS DE CONTRATISTAS',
    'EQUIPOS Y MATERIALES',
    'INGENIERÍA',
    'SERVICIOS DE APOYO A LA CONSTRUCCIÓN',
    'ADM. DEL PROYECTO',
    'COSTOS ESPECIALES',
    'CONTINGENCIA'
  ];

  // Mapeo de categorías con sus códigos para mostrar en reporte8
  const categoriasConCodigos = {
    'CONSTRUCCION': 'MO',
    'INDIRECTOS DE CONTRATISTAS': 'IC',
    'EQUIPOS Y MATERIALES': 'EM',
    'INGENIERÍA': 'IE',
    'SERVICIOS DE APOYO A LA CONSTRUCCIÓN': 'SC',
    'ADM. DEL PROYECTO': 'AD',
    'COSTOS ESPECIALES': 'CL',
    'CONTINGENCIA': 'CT'
  };

  // Nombres optimizados para encabezados de tabla
  const nombresEncabezados = {
    'MO': 'Construcción',
    'IC': 'Indirectos',
    'EM': 'Equipos',
    'IE': 'Ingeniería',
    'SC': 'Servicios',
    'AD': 'Administración',
    'CL': 'Costos Esp.',
    'CT': 'Contingencia'
  };

  const normalizar = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

  // Función helper para cargar datos de una tabla específica
  const cargarDatosTabla = async (tabla, setter) => {
    setCargandoTabla(true);
    try {
      if (proyectoId) {
        // Usar la nueva API que filtra por proyecto
        const response = await fetch(`http://localhost/financiero/api/datos_financieros.php?proyecto_id=${proyectoId}&tabla=${tabla}`);
        const data = await response.json();
        if (data.success) {
          // La API datos_financieros.php devuelve los datos en data.datos
          console.log(`Datos cargados para ${tabla}:`, data.datos);
          setter(data.datos || []);
        } else {
          console.log(`Error cargando ${tabla}:`, data.error);
          setter([]);
        }
      } else {
        // Fallback a la API original si no hay proyectoId
        const response = await fetch(`/api/vectores/${tabla}.php`);
        const data = await response.json();
        if (data.success) {
          // La API individual devuelve los datos en data.data
          setter(data.data || []);
        } else {
          setter([]);
        }
      }
    } catch (error) {
      console.error(`Error cargando ${tabla}:`, error);
      setter([]);
    } finally {
      setCargandoTabla(false);
    }
  };

  // Cargar datos según la selección
  useEffect(() => {
    if (seleccion === 'real_parcial') {
      cargarDatosTabla('real_parcial', setTablaRealParcial);
    } else if (seleccion === 'real_acumulado') {
      cargarDatosTabla('real_acumulado', setTablaRealAcumulado);
    } else if (seleccion === 'v0_parcial') {
      cargarDatosTabla('v0_parcial', setTablaV0Parcial);
    } else if (seleccion === 'v0_acumulada') {
      cargarDatosTabla('v0_acumulada', setTablaV0Acumulada);
    } else if (seleccion === 'npc_parcial') {
      cargarDatosTabla('npc_parcial', setTablaNpcParcial);
    } else if (seleccion === 'npc_acumulado') {
      cargarDatosTabla('npc_acumulado', setTablaNpcAcumulado);
    } else if (seleccion === 'api_parcial') {
      cargarDatosTabla('api_parcial', setTablaApiParcial);
    } else if (seleccion === 'api_acumulada') {
      cargarDatosTabla('api_acumulada', setTablaApiAcumulada);
    } else if (seleccion === 'reporte9') {
      cargarDatosTabla('financiero_sap', setTablaFinancieroSap);
    }
  }, [seleccion, proyectoId, importando]); // recarga al importar y cuando cambia el proyecto

  // --- useEffect para cargar todos los parciales cuando seleccionamos Curva S ---
  useEffect(() => {
    if (seleccion === 'reporte1') {
      // Real Parcial
      if (tablaRealParcial.length === 0) {
        cargarDatosTabla('real_parcial', setTablaRealParcial);
      }
      // V0 Parcial
      if (tablaV0Parcial.length === 0) {
        cargarDatosTabla('v0_parcial', setTablaV0Parcial);
      }
      // NPC Parcial
      if (tablaNpcParcial.length === 0) {
        cargarDatosTabla('npc_parcial', setTablaNpcParcial);
      }
      // API Parcial
      if (tablaApiParcial.length === 0) {
        cargarDatosTabla('api_parcial', setTablaApiParcial);
      }
    }
  }, [seleccion, proyectoId]);

  // --- useEffect para cargar todos los acumulados cuando seleccionamos Curva S - Acumulados ---
  useEffect(() => {
    if (seleccion === 'reporte6') {
      // Real Acumulado
      if (tablaRealAcumulado.length === 0) {
        cargarDatosTabla('real_acumulado', setTablaRealAcumulado);
      }
      // V0 Acumulada
      if (tablaV0Acumulada.length === 0) {
        cargarDatosTabla('v0_acumulada', setTablaV0Acumulada);
      }
      // NPC Acumulado
      if (tablaNpcAcumulado.length === 0) {
        cargarDatosTabla('npc_acumulado', setTablaNpcAcumulado);
      }
      // API Acumulada
      if (tablaApiAcumulada.length === 0) {
        cargarDatosTabla('api_acumulada', setTablaApiAcumulada);
      }
    }
    }, [seleccion, proyectoId]);
  
  // --- useEffect para cargar todos los datos cuando se seleccionan reportes que los necesitan ---
  useEffect(() => {
    if (seleccion === 'reporte6' || seleccion === 'reporte9') {
      cargarDatosInforme();
    }
  }, [seleccion, proyectoId]);
  
  // Aquí puedes renderizar el contenido según la selección
  const renderContenido = () => {
    if (tablas.some(t => t.value === seleccion)) {
      return null;
    }
    if (reportes.some(r => r.value === seleccion)) {
      return null;
    }
    return <div>Selecciona una opción</div>;
  };

  // Función para leer el archivo Excel
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setExcelData(data);
      // Agrega este log:
      if (data.length > 0) {
        console.log('Nombres de columnas:', Object.keys(data[0]));
        console.log('Primera fila:', data[0]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Nueva función para manejar el archivo en el modal
  const handleModalFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setExcelData(data);
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

  const cleanMonto = (monto) => {
    if (typeof monto === 'number') return monto;
    if (typeof monto === 'string') {
      if (monto.trim() === '-' || monto.trim() === '') return 0;
      // Quita puntos de miles y cambia coma decimal por punto
      // Ejemplo: "2.441.480,50" => "2441480.50"
      let limpio = monto.replace(/\./g, '').replace(',', '.');
      // Si después de limpiar sigue sin ser número, retorna 0
      return parseFloat(limpio) || 0;
    }
    return 0;
  };

  const normalizeKeys = (row) => {
    const newRow = {};
    Object.keys(row).forEach(key => {
      newRow[key.trim().toUpperCase()] = row[key];
    });
    return newRow;
  };

  const mapExcelRow = (row) => {
    const r = normalizeKeys(row);
    
    // Si es reporte9 (Flujo Financiero SAP), mapear campos específicos
    if (seleccion === 'reporte9') {
      return {
        proyecto_id: proyectoId || 1,
        id_sap: r['ID_SAP'] || r['ID SAP'] || '',
        version_sap: r['VERSION_SAP'] || r['VERSION SAP'] || '',
        descripcion: r['DESCRIPCION'] || r['DESCRIPCIÓN'] || '',
        grupo_version: r['GRUPO_VERSION'] || r['GRUPO VERSION'] || '',
        periodo: excelDateToMysql(r['PERIODO']),
        MO: cleanMonto(r['MO']),
        IC: cleanMonto(r['IC']),
        EM: cleanMonto(r['EM']),
        IE: cleanMonto(r['IE']),
        SC: cleanMonto(r['SC']),
        AD: cleanMonto(r['AD']),
        CL: cleanMonto(r['CL']),
        CT: cleanMonto(r['CT'])
      };
    }
    
    // Mapeo estándar para otras tablas
    return {
      proyecto_id: proyectoId || 1,
      centro_costo: r['CENTRO COSTO'] || '',
      periodo: excelDateToMysql(r['PERIODO']),
      tipo: r['TIPO'] || '',
      cat_vp: r['CAT_VP'] || '',
      detalle_factorial: r['DETALLE_FACTORIAL'] || '',
      monto: cleanMonto(r['MONTO'])
    };
  };

  // Función para enviar los datos al backend
  const handleImportar = async () => {
    setImportando(true);
    try {
      // Mapea los datos antes de enviar
      const datosMapeados = excelData.map(mapExcelRow);
      let endpoint = '/api/importaciones/importar_real_parcial.php';
      if (seleccion === 'real_acumulado') endpoint = '/api/importaciones/importar_real_acumulado.php';
      if (seleccion === 'v0_parcial') endpoint = '/api/importaciones/importar_v0_parcial.php';
      if (seleccion === 'v0_acumulada') endpoint = '/api/importaciones/importar_v0_acumulado.php';
      if (seleccion === 'npc_parcial') endpoint = '/api/importaciones/importar_npc_parcial.php';
      if (seleccion === 'npc_acumulado') endpoint = '/api/importaciones/importar_npc_acumulado.php';
      if (seleccion === 'api_parcial') endpoint = '/api/importaciones/importar_api_parcial.php';
      if (seleccion === 'api_acumulada') endpoint = '/api/importaciones/importar_api_acumulado.php';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: datosMapeados })
      });
      const result = await res.json();
      if (result.success) {
        alert('¡Importación exitosa!');
      } else {
        alert('Error al importar: ' + (result.error || ''));
      }
    } catch (e) {
      alert('Error de red o servidor');
    }
    setImportando(false);
  };

  // Nueva función para importar desde el modal
  const handleModalImportar = async () => {
    setImportando(true);
    setImportMessage('');
    try {
      const datosMapeados = excelData.map(mapExcelRow);
      let endpoint = '/api/importaciones/importar_real_parcial.php';
      if (seleccion === 'real_acumulado') endpoint = '/api/importaciones/importar_real_acumulado.php';
      if (seleccion === 'v0_parcial') endpoint = '/api/importaciones/importar_v0_parcial.php';
      if (seleccion === 'v0_acumulada') endpoint = '/api/importaciones/importar_v0_acumulado.php';
      if (seleccion === 'npc_parcial') endpoint = '/api/importaciones/importar_npc_parcial.php';
      if (seleccion === 'npc_acumulado') endpoint = '/api/importaciones/importar_npc_acumulado.php';
      if (seleccion === 'api_parcial') endpoint = '/api/importaciones/importar_api_parcial.php';
      if (seleccion === 'api_acumulada') endpoint = '/api/importaciones/importar_api_acumulado.php';
      if (seleccion === 'reporte9') endpoint = '/api/importaciones/importar_financiero_sap.php';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rows: datosMapeados,
          proyecto_id: proyectoId || 1
        })
      });
      const result = await res.json();
      if (result.success) {
        setImportMessage('¡Importación exitosa!');
        setShowImportModal(false);
        setSelectedFile(null);
        setExcelData([]);
      } else {
        let errorMessage = 'Error al importar: ' + (result.error || '');
        if (result.errors && result.errors.length > 0) {
          errorMessage += '\n\nErrores específicos:\n' + result.errors.join('\n');
        }
        setImportMessage(errorMessage);
      }
    } catch (e) {
      setImportMessage('Error de red o servidor');
    }
    setImportando(false);
  };

  // Función para filtrar y sumar por detalle_factorial
  const getKpiData = () => {
    let data = tablaRealParcial;
    if (seleccion === 'real_acumulado') data = tablaRealAcumulado;
    if (seleccion === 'v0_parcial') data = tablaV0Parcial;
    if (seleccion === 'v0_acumulada') data = tablaV0Acumulada;
    if (seleccion === 'npc_parcial') data = tablaNpcParcial;
    if (seleccion === 'npc_acumulado') data = tablaNpcAcumulado;
    if (seleccion === 'api_parcial') data = tablaApiParcial;
    if (seleccion === 'api_acumulada') data = tablaApiAcumulada;
    if (fechaDesde) {
      data = data.filter(row => row.periodo >= fechaDesde);
    }
    if (fechaHasta) {
      data = data.filter(row => row.periodo <= fechaHasta);
    }
    // Agrupa y suma por detalle_factorial usando mayúsculas y trim
    const kpi = {};
    data.forEach(row => {
      let key = normalizar(row.detalle_factorial || 'Sin Detalle');
      if (!kpi[key]) kpi[key] = 0;
      kpi[key] += Number(row.monto) || 0;
    });
    // Asegura que todas las categorías estén presentes
    categorias.forEach(cat => {
      if (!kpi[normalizar(cat)]) kpi[normalizar(cat)] = 0;
    });
    return kpi;
  };

  const kpiData = getKpiData();
  const totalKpi = Object.values(kpiData).reduce((a, b) => a + Number(b), 0);

  const getTablaFiltrada = () => {
    let data = tablaRealParcial;
    if (seleccion === 'real_acumulado') data = tablaRealAcumulado;
    if (seleccion === 'v0_parcial') data = tablaV0Parcial;
    if (seleccion === 'v0_acumulada') data = tablaV0Acumulada;
    if (seleccion === 'npc_parcial') data = tablaNpcParcial;
    if (seleccion === 'npc_acumulado') data = tablaNpcAcumulado;
    if (seleccion === 'api_parcial') data = tablaApiParcial;
    if (seleccion === 'api_acumulada') data = tablaApiAcumulada;
    if (fechaDesde) {
      data = data.filter(row => row.periodo >= fechaDesde);
    }
    if (fechaHasta) {
      data = data.filter(row => row.periodo <= fechaHasta);
    }
    return data;
  };

  // --- FUNCIÓN PARA PREPARAR DATOS DE CURVA S ---
  const prepararDatosCurvaS = (real, v0, npc, api) => {
    // Unificar todos los periodos
    const periodosSet = new Set([
      ...real.map(r => r.periodo),
      ...v0.map(r => r.periodo),
      ...npc.map(r => r.periodo),
      ...api.map(r => r.periodo),
    ]);
    const periodos = Array.from(periodosSet).filter(Boolean).sort();

    // Sumar montos por periodo para cada tipo
    const sumarPorPeriodo = (arr) => {
      const map = {};
      arr.forEach(row => {
        if (!row.periodo) return;
        if (!map[row.periodo]) map[row.periodo] = 0;
        map[row.periodo] += Number(row.monto) || 0;
      });
      return map;
    };
    const realMap = sumarPorPeriodo(real);
    const v0Map = sumarPorPeriodo(v0);
    const npcMap = sumarPorPeriodo(npc);
    const apiMap = sumarPorPeriodo(api);

    // Si quieres acumulado, suma progresivamente
    let realAcum = 0, v0Acum = 0, npcAcum = 0, apiAcum = 0;
    return periodos.map(periodo => {
      realAcum += realMap[periodo] || 0;
      v0Acum += v0Map[periodo] || 0;
      npcAcum += npcMap[periodo] || 0;
      apiAcum += apiMap[periodo] || 0;
      return {
        periodo,
        'Real Parcial': realAcum,
        'V0 Parcial': v0Acum,
        'NPC Parcial': npcAcum,
        'API Parcial': apiAcum,
      };
    });
  };
  // --- COMPONENTE DE GRÁFICO CURVA S ---
  const CurvaSChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 40, right: 40, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="periodo"
          angle={-45}
          textAnchor="end"
          height={60}
          interval="preserveStartEnd" // <-- Esto es clave
        />
        <YAxis tickFormatter={v => `$${(v/1_000_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}M`} width={90} />
        <Tooltip formatter={v => `USD ${Number(v).toLocaleString('en-US')}`} />
        <Legend verticalAlign="top" align="center" height={36} iconType="circle" wrapperStyle={{ top: 0 }} />
        <Line type="monotone" dataKey="Real Parcial" stroke="#1ecb4f" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="V0 Parcial" stroke="#16355D" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="NPC Parcial" stroke="#FFD000" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="API Parcial" stroke="#0177FF" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );

  // --- FUNCIÓN PARA PREPARAR DATOS DE CURVA S ACUMULADOS ---
  const prepararDatosCurvaS_Acumulados = (real, v0, npc, api, fechaDesde, fechaHasta) => {
    // 1. Calcula los mapas completos (sin filtrar)
    const sumarPorPeriodo = (arr) => {
      const map = {};
      arr.forEach(row => {
        if (!row.periodo) return;
        if (!map[row.periodo]) map[row.periodo] = 0;
        map[row.periodo] += Number(row.monto) || 0;
      });
      return map;
    };
    const realMap = sumarPorPeriodo(real);
    const v0Map = sumarPorPeriodo(v0);
    const npcMap = sumarPorPeriodo(npc);
    const apiMap = sumarPorPeriodo(api);

    // 2. Obtén el último periodo de la serie completa
    const periodos = Array.from(new Set([
      ...real.map(r => r.periodo),
      ...v0.map(r => r.periodo),
      ...npc.map(r => r.periodo),
      ...api.map(r => r.periodo),
    ])).filter(Boolean).sort();

    const lastPeriodo = periodos[periodos.length - 1];
    const realFinal = realMap[lastPeriodo] || 1;
    const v0Final = v0Map[lastPeriodo] || 1;
    const npcFinal = npcMap[lastPeriodo] || 1;
    const apiFinal = apiMap[lastPeriodo] || 1;

    // 3. Aplica el filtro de fechas SOLO para mostrar
    const periodosFiltrados = periodos.filter(periodo =>
      (!fechaDesde || periodo >= fechaDesde) &&
      (!fechaHasta || periodo <= fechaHasta)
    );

    // 4. Calcula los porcentajes usando SIEMPRE el valor final de la serie completa
    return periodosFiltrados.map(periodo => ({
        periodo,
      'Real %': ((realMap[periodo] || 0) / realFinal) * 100,
      'V0 %': ((v0Map[periodo] || 0) / v0Final) * 100,
      'NPC %': ((npcMap[periodo] || 0) / npcFinal) * 100,
      'API %': ((apiMap[periodo] || 0) / apiFinal) * 100,
    }));
  };

  // --- COMPONENTE DE GRÁFICO CURVA S ACUMULADOS ---
  const CurvaSChartAcumulados = ({ data }) => (
    <ResponsiveContainer width="100%" height={440}>
      <LineChart data={data} margin={{ top: 40, right: 40, left: 10, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periodo" angle={-45} textAnchor="end" height={60} />
        <YAxis domain={[0, 100]} tickFormatter={v => `${v.toFixed(0)}%`} width={60} />
        <Tooltip formatter={v => `${v.toFixed(1)}%`} />
        <Legend verticalAlign="top" align="center" height={36} iconType="circle" wrapperStyle={{ top: 0 }} />
        <Line type="monotone" dataKey="Real %" stroke="#1ecb4f" strokeWidth={2} dot={false} name="Real (%)" />
        <Line type="monotone" dataKey="V0 %" stroke="#16355D" strokeWidth={2} dot={false} name="V0 (%)" />
        <Line type="monotone" dataKey="NPC %" stroke="#FFD000" strokeWidth={2} dot={false} name="NPC (%)" />
        <Line type="monotone" dataKey="API %" stroke="#0177FF" strokeWidth={2} dot={false} name="API (%)" />
      </LineChart>
    </ResponsiveContainer>
  );

  const anchoSidebarDerecho = sidebarVisible ? ANCHO_SIDEBAR : 0;
  
  // Detectar el estado del sidebar izquierdo
  const [sidebarIzquierdoCollapsed, setSidebarIzquierdoCollapsed] = useState(false);
  
  useEffect(() => {
    const detectarSidebarIzquierdo = () => {
      // Buscar el elemento del sidebar izquierdo
      const sidebarElement = document.querySelector('.ps-sidebar-root');
      if (sidebarElement) {
        const isCollapsed = sidebarElement.classList.contains('ps-collapsed');
        setSidebarIzquierdoCollapsed(isCollapsed);
      }
    };
    
    // Detectar inicialmente
    detectarSidebarIzquierdo();
    
    // Observar cambios en el DOM
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
  const anchoAreaTrabajo = `calc(100vw - ${anchoSidebarIzquierdo}px - ${anchoSidebarDerecho}px)`;
  const alturaAreaTrabajo = `calc(100vh - ${ALTURA_BARRA_SUPERIOR}px)`;

  const handleDescargarPDF = async () => {
    const modal = document.getElementById('informe-ejecutivo-modal');
    if (!modal) return;

    // Encuentra las secciones a capturar
    const secciones = [
      modal.querySelector('#seccion-graficos'),
      modal.querySelector('#seccion-tabla-acumulados'),
      modal.querySelector('#seccion-tabla-parciales')
    ];

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 20;

    for (let i = 0; i < secciones.length; i++) {
      const seccion = secciones[i];
      if (!seccion) continue;
      // Captura la sección como imagen
      const canvas = await html2canvas(seccion, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      // Si la imagen no cabe en la página, agrega una nueva
      if (y + imgHeight > pageHeight - 20) {
        pdf.addPage();
        y = 20;
      }
      pdf.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight);
      y += imgHeight + 20;
    }
    pdf.save('informe_ejecutivo.pdf');
  };

  // 1. Función de análisis automático básico
  const generarAnalisis = () => {
    // Ejemplo simple: compara totales y tendencias
    let analisis = '';
    // Acumulados
    const totalReal = categorias.reduce((acc, cat) => acc + (tablaRealAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
    const totalV0 = categorias.reduce((acc, cat) => acc + (tablaV0Acumulada.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
    const totalNPC = categorias.reduce((acc, cat) => acc + (tablaNpcAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
    const totalAPI = categorias.reduce((acc, cat) => acc + (tablaApiAcumulada.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
    // Tendencia simple
    const max = Math.max(totalReal, totalV0, totalNPC, totalAPI);
    const min = Math.min(totalReal, totalV0, totalNPC, totalAPI);
    if (totalReal === max) analisis += 'El vector Real Acumulado presenta el mayor avance financiero respecto a los demás vectores. ';
    if (totalAPI === min) analisis += 'El vector API Acumulado muestra el menor avance relativo. ';
    if (totalNPC > totalV0) analisis += 'El avance según el nuevo presupuesto de control (NPC) supera a la línea base original (V0), lo que puede indicar ajustes positivos en la gestión. ';
    if (totalReal < totalV0) analisis += 'El avance real está por debajo de la línea base, lo que sugiere posibles retrasos o desviaciones.';
    if (!analisis) analisis = 'Los vectores presentan avances similares, sin desviaciones significativas.';
    return analisis;
  };

  // 2. Función para capturar el gráfico como imagen
  const capturarGrafico = async () => {
    if (!graficoRef.current) return;
    const canvas = await html2canvas(graficoRef.current, { scale: 2 });
    setGraficoImg(canvas.toDataURL('image/png'));
  };

  // 3. Llama a capturarGrafico cuando se abre el modal
  useEffect(() => {
    if (showInformeModal) {
      setTimeout(() => capturarGrafico(), 300); // Espera a que el gráfico se renderice
    }
    if (!showInformeModal) setGraficoImg(null);
  }, [showInformeModal, seleccion, fechaDesde, fechaHasta]);

  // 2. Captura ambos gráficos cuando se abre el modal
  const capturarGraficos = async () => {
    if (graficoParcialesRef.current) {
      const canvas = await html2canvas(graficoParcialesRef.current, { scale: 2 });
      setGraficoParcialesImg(canvas.toDataURL('image/png'));
    }
    if (graficoAcumuladosRef.current) {
      const canvas = await html2canvas(graficoAcumuladosRef.current, { scale: 2 });
      setGraficoAcumuladosImg(canvas.toDataURL('image/png'));
    }
  };

  useEffect(() => {
    if (showInformeModal) {
      setTimeout(() => capturarGraficos(), 400);
    }
    if (!showInformeModal) {
      setGraficoParcialesImg(null);
      setGraficoAcumuladosImg(null);
    }
  }, [showInformeModal, seleccion, fechaDesde, fechaHasta]);

  // Función para cargar todos los datos necesarios para el informe
  const cargarDatosInforme = async () => {
    setCargandoInforme(true);
    const fetchIfEmpty = async (arr, tabla, setter) => {
      if (arr.length === 0) {
        try {
          if (proyectoId) {
            // Usar la nueva API que filtra por proyecto
            const res = await fetch(`http://localhost/financiero/api/datos_financieros.php?proyecto_id=${proyectoId}&tabla=${tabla}`);
            const data = await res.json();
            setter(data.success ? data.datos : []);
          } else {
            // Fallback a la API original si no hay proyectoId
            const res = await fetch(`/api/vectores/${tabla}.php`);
            const data = await res.json();
            setter(data.success ? data.data : []);
          }
        } catch (error) {
          console.error('Error cargando datos:', error);
          setter([]);
        }
      }
    };
    await Promise.all([
      fetchIfEmpty(tablaRealParcial, 'real_parcial', setTablaRealParcial),
      fetchIfEmpty(tablaV0Parcial, 'v0_parcial', setTablaV0Parcial),
      fetchIfEmpty(tablaNpcParcial, 'npc_parcial', setTablaNpcParcial),
      fetchIfEmpty(tablaApiParcial, 'api_parcial', setTablaApiParcial),
      fetchIfEmpty(tablaRealAcumulado, 'real_acumulado', setTablaRealAcumulado),
      fetchIfEmpty(tablaV0Acumulada, 'v0_acumulada', setTablaV0Acumulada),
      fetchIfEmpty(tablaNpcAcumulado, 'npc_acumulado', setTablaNpcAcumulado),
      fetchIfEmpty(tablaApiAcumulada, 'api_acumulada', setTablaApiAcumulada),
    ]);
    setCargandoInforme(false);
  };

  // Función para preparar datos para gráfico cascada
  const prepararDatosCascada = (categorias, base, real, tipo) => {
    // base: V0 o API, real: Real Acumulado
    // tipo: 'V0' o 'API'
    // 1. Suma por categoría
    const baseMap = {};
    const realMap = {};
    categorias.forEach(cat => {
      const key = normalizar(cat);
      const baseArr = (tipo === 'V0' ? tablaV0Acumulada : tablaApiAcumulada).filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key && (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
      const realArr = tablaRealAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key && (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
      baseMap[key] = baseArr.length > 0 ? Number(baseArr.reduce((a, b) => a.periodo > b.periodo ? a : b).monto) : 0;
      realMap[key] = realArr.length > 0 ? Number(realArr.reduce((a, b) => a.periodo > b.periodo ? a : b).monto) : 0;
    });
    // 2. Ordenar categorías igual que en la tabla
    const diffs = categorias.map(cat => {
      const key = normalizar(cat);
      return {
        categoria: cat,
        diff: (realMap[key] || 0) - (baseMap[key] || 0)
      };
    });
    // 3. Construir estructura tipo waterfall
    let data = [];
    let acumulado = tipo === 'V0' ?
      categorias.reduce((acc, cat) => acc + (baseMap[normalizar(cat)] || 0), 0) :
      categorias.reduce((acc, cat) => acc + (baseMap[normalizar(cat)] || 0), 0);
    const baseLabel = tipo === 'V0' ? 'V0' : 'API';
    data.push({ name: `Versión ${baseLabel}`, value: Math.round(acumulado/1e6), tipo: 'base' });
    diffs.forEach((d, idx) => {
      if (d.diff !== 0) {
        data.push({
          name: d.categoria,
          value: Math.round(d.diff/1e6),
          tipo: d.diff > 0 ? 'aumento' : 'disminucion'
        });
        acumulado += d.diff;
      }
    });
    data.push({ name: 'Av. Real', value: Math.round(acumulado/1e6), tipo: 'total' });
    return data;
  };

  // Componente gráfico cascada
  const GraficoCascada = ({ data, titulo }) => (
    <div style={{ width: '100%', maxWidth: 900, margin: '32px auto 0 auto', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #0001', padding: 24 }}>
      <h4 style={{ textAlign: 'center', color: '#0a3265', fontWeight: 700, marginBottom: 12 }}>{titulo}</h4>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-35} textAnchor="end" height={60} />
          <YAxis label={{ value: 'M$USD', angle: -90, position: 'insideLeft', offset: 10 }} />
          <Tooltip formatter={v => `${v} M$USD`} />
          <Bar dataKey="value">
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`}
                fill={entry.tipo === 'base' ? '#4a90e2' : entry.tipo === 'aumento' ? '#4a90e2' : entry.tipo === 'disminucion' ? '#ff9800' : '#888'}
                stroke={entry.tipo === 'total' ? '#888' : undefined}
                fillOpacity={entry.tipo === 'total' ? 0.4 : 1}
                strokeWidth={entry.tipo === 'total' ? 2 : 1}
              />
            ))}
            <LabelList dataKey="value" position="top" formatter={v => v !== 0 ? v : ''} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // Nueva función para preparar datos tipo waterfall acumulativo
  const prepararDatosCascadaAcumulativa = (categorias, base, real, tipo) => {
    // base: V0 o API, real: Real Acumulado
    // tipo: 'V0' o 'API'
    const baseMap = {};
    const realMap = {};
    categorias.forEach(cat => {
      const key = normalizar(cat);
      const baseArr = (tipo === 'V0' ? tablaV0Acumulada : tablaApiAcumulada).filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key && (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
      const realArr = tablaRealAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key && (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
      baseMap[key] = baseArr.length > 0 ? Number(baseArr.reduce((a, b) => a.periodo > b.periodo ? a : b).monto) : 0;
      realMap[key] = realArr.length > 0 ? Number(realArr.reduce((a, b) => a.periodo > b.periodo ? a : b).monto) : 0;
    });
    // 1. Calcular el valor inicial (suma de base)
    let acumulado = categorias.reduce((acc, cat) => acc + (baseMap[normalizar(cat)] || 0), 0);
    const baseLabel = tipo === 'V0' ? 'V0' : 'API';
    let data = [];
    data.push({ name: `Versión ${baseLabel}`, base: 0, delta: Math.round(acumulado/1e6), tipo: 'base', label: Math.round(acumulado/1e6) });
    // 2. Para cada categoría, calcular el delta y el offset acumulado
    categorias.forEach(cat => {
      const key = normalizar(cat);
      const delta = Math.round(((realMap[key] || 0) - (baseMap[key] || 0))/1e6);
      data.push({
        name: cat,
        base: Math.round(acumulado/1e6),
        delta,
        tipo: delta > 0 ? 'aumento' : delta < 0 ? 'disminucion' : 'neutro',
        label: delta
      });
      acumulado += delta * 1e6; // volver a millones para el siguiente offset
    });
    // 3. Barra final (Av. Real)
    const realTotal = categorias.reduce((acc, cat) => {
      const key = normalizar(cat);
      const arrFiltrado = tablaRealAcumulado.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
      const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
      if (registros.length > 0) {
        const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
        return acc + Number(ultimo.monto) || 0;
      }
      return acc;
    }, 0);
    data.push({ name: 'Av. Real', base: 0, delta: Math.round(realTotal/1e6), tipo: 'total', label: Math.round(realTotal/1e6) });
    return data;
  };

  // Nueva función para preparar datos tipo waterfall para parciales
  const prepararDatosCascadaParciales = (categorias, base, real, tipo) => {
    // base: V0 o API Parcial, real: Real Parcial
    // tipo: 'V0' o 'API'
    const baseMap = {};
    const realMap = {};
    categorias.forEach(cat => {
      const key = normalizar(cat);
      const baseArr = (tipo === 'V0' ? tablaV0Parcial : tablaApiParcial).filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key && (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
      const realArr = tablaRealParcial.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key && (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
      baseMap[key] = baseArr.reduce((acc, row) => acc + (Number(row.monto) || 0), 0);
      realMap[key] = realArr.reduce((acc, row) => acc + (Number(row.monto) || 0), 0);
    });
    // 1. Calcular el valor inicial (suma de base)
    let acumulado = categorias.reduce((acc, cat) => acc + (baseMap[normalizar(cat)] || 0), 0);
    const baseLabel = tipo === 'V0' ? 'V0' : 'API';
    let data = [];
    data.push({ name: `Versión ${baseLabel}`, base: 0, delta: Math.round(acumulado/1e6), tipo: 'base', label: Math.round(acumulado/1e6) });
    // 2. Para cada categoría, calcular el delta y el offset acumulado
    categorias.forEach(cat => {
      const key = normalizar(cat);
      const delta = Math.round(((realMap[key] || 0) - (baseMap[key] || 0))/1e6);
      data.push({
        name: cat,
        base: Math.round(acumulado/1e6),
        delta,
        tipo: delta > 0 ? 'aumento' : delta < 0 ? 'disminucion' : 'neutro',
        label: delta
      });
      acumulado += delta * 1e6; // volver a millones para el siguiente offset
    });
    // 3. Barra final (Av. Real)
    const realTotal = categorias.reduce((acc, cat) => {
      const key = normalizar(cat);
      const arrFiltrado = tablaRealParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
      const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
      return acc + registros.reduce((a, row) => a + (Number(row.monto) || 0), 0);
    }, 0);
    data.push({ name: 'Av. Real', base: 0, delta: Math.round(realTotal/1e6), tipo: 'total', label: Math.round(realTotal/1e6) });
    return data;
  };

  // Nuevo componente gráfico cascada acumulativa
  const GraficoCascadaAcumulativa = ({ data, titulo }) => (
    <div style={{ width: '100%', maxWidth: 900, margin: '32px auto 0 auto', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #0001', padding: 24 }}>
      <h4 style={{ textAlign: 'center', color: '#0a3265', fontWeight: 700, marginBottom: 12 }}>{titulo}</h4>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-30} 
            textAnchor="end" 
            height={80}
            tick={{
              fontFamily: 'Arial, Segoe UI, sans-serif',
              fontSize: 12,
              fontWeight: 'bold',
              fill: '#222'
            }}
          />
          <YAxis label={{ value: 'M$USD', angle: -90, position: 'insideLeft', offset: 10 }} />
          <Tooltip formatter={v => `${v} M$USD`} />
          {/* Serie invisible para el offset/base */}
          <Bar dataKey="base" stackId="a" fill="transparent" />
          {/* Serie visible para el delta */}
          <Bar dataKey="delta" stackId="a">
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`}
                fill={entry.tipo === 'base' ? '#4a90e2' : entry.tipo === 'aumento' ? '#4a90e2' : entry.tipo === 'disminucion' ? '#ff9800' : entry.tipo === 'total' ? '#43a047' : '#888'}
                stroke={entry.tipo === 'total' ? '#43a047' : undefined}
                fillOpacity={entry.tipo === 'total' ? 0.4 : 1}
                strokeWidth={entry.tipo === 'total' ? 2 : 1}
              />
            ))}
            <LabelList dataKey="label" position="top" formatter={v => v !== 0 ? v : ''} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // --- FUNCIÓN PARA PREPARAR DATOS TRANSPUESTOS ---
  const prepararDatosTranspuesta = () => {
    let data = [];
    let tabla = [];
    if (vectorTranspuesta === 'real_parcial') tabla = tablaRealParcial;
    if (vectorTranspuesta === 'v0_parcial') tabla = tablaV0Parcial;
    if (vectorTranspuesta === 'npc_parcial') tabla = tablaNpcParcial;
    if (vectorTranspuesta === 'api_parcial') tabla = tablaApiParcial;
    if (vectorTranspuesta === 'real_acumulado') tabla = tablaRealAcumulado;
    if (vectorTranspuesta === 'v0_acumulada') tabla = tablaV0Acumulada;
    if (vectorTranspuesta === 'npc_acumulado') tabla = tablaNpcAcumulado;
    if (vectorTranspuesta === 'api_acumulada') tabla = tablaApiAcumulada;
    // Filtrar por periodo si hay filtro de fechas
    if (fechaDesde) {
      tabla = tabla.filter(row => row.periodo >= fechaDesde);
    }
    if (fechaHasta) {
      tabla = tabla.filter(row => row.periodo <= fechaHasta);
    }
    // Agrupar por periodo (mes)
    const periodos = Array.from(new Set(tabla.map(row => row.periodo))).filter(Boolean).sort();
    // Para cada periodo, armar un objeto con los montos por categoría
    periodos.forEach(periodo => {
      const fila = { mes: periodo };
      categorias.forEach(cat => {
        const key = normalizar(cat);
        const registros = tabla.filter(row => row.periodo === periodo && normalizar(row.detalle_factorial || 'Sin Detalle') === key);
        fila[cat] = registros.length > 0 ? registros.reduce((a, b) => a + (Number(b.monto) || 0), 0) : 0;
      });
      data.push(fila);
    });
    return data;
  };

  // --- COMPONENTE TABLA TRANSPUESTA ---
  const TablaTranspuesta = () => {
    // Usar los estados globales de fechaDesde y fechaHasta
    const data = prepararDatosTranspuesta();
    return (
      <div style={{ width: '100%', margin: '32px 0 0 0', overflowX: 'auto', overflowY: 'visible', maxHeight: 'none' }}>
        <div style={{ overflowY: 'auto', maxHeight: '65vh', width: '100%' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #0001', fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', borderTopLeftRadius: 10, background: '#0a3265', color: '#fff', position: 'sticky', top: 0, zIndex: 3, fontSize: 16, fontWeight: 600, fontFamily: 'Arial, sans-serif', lineHeight: '1.2' }}>MES</th>
                {categorias.map(cat => (
                  <th key={cat} style={{ padding: '12px 16px', textAlign: 'center', background: '#0a3265', color: '#fff', position: 'sticky', top: 0, zIndex: 3, fontSize: 16, fontWeight: 600, fontFamily: 'Arial, sans-serif', lineHeight: '1.2' }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 16, fontFamily: 'Arial, sans-serif', lineHeight: '1.2' }}>{cat}</span> <span style={{ color: '#1ecb4f', fontWeight: 600, fontSize: 16, fontFamily: 'Arial, sans-serif', lineHeight: '1.2' }}>({categoriasConCodigos[cat]})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(fila => (
                <tr key={fila.mes}>
                  <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0a3265', background: '#f6f8fa' }}>{fila.mes}</td>
                  {categorias.map(cat => (
                    <td key={cat} style={{ padding: '6px 12px', textAlign: 'center' }}>{fila[cat] > 0 ? fila[cat].toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const vectoresTranspuesta = [
    { value: 'real_parcial', label: 'Real Parcial' },
    { value: 'v0_parcial', label: 'V0 Parcial' },
    { value: 'npc_parcial', label: 'NPC Parcial' },
    { value: 'api_parcial', label: 'API Parcial' },
  ];

  return (
    <div style={{
      position: 'absolute',
      left: anchoSidebarIzquierdo + 32, // Margen izquierdo de 32px
      top: ALTURA_BARRA_SUPERIOR,
      width: `calc(100vw - ${anchoSidebarIzquierdo}px - ${anchoSidebarDerecho}px - 32px)`, // Reducir aún más el margen para minimizar el espacio
      height: alturaAreaTrabajo,
      margin: 0,
      padding: 0,
      overflowX: 'hidden',
      background: '#f8f9fb',
      transition: 'width 0.3s cubic-bezier(.4,1.3,.5,1), left 0.3s cubic-bezier(.4,1.3,.5,1)',
      boxSizing: 'border-box',
      zIndex: 1,
    }}>
      {/* Tarjetas KPI SIEMPRE debajo de la barra de navegación */}
      {(seleccion === 'real_parcial' || seleccion === 'real_acumulado' || seleccion === 'v0_parcial' || seleccion === 'v0_acumulada' || seleccion === 'npc_parcial' || seleccion === 'npc_acumulado' || seleccion === 'api_parcial' || seleccion === 'api_acumulada') && getTablaFiltrada().length > 0 && (
        <div style={{
          width: '100%',
          margin: 0,
          padding: 0,
          marginTop: 27,
          marginBottom: 7
        }}>
          <div style={{
            display: 'flex',
            gap: 7,
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            width: '100%',
            alignItems: 'flex-start',
            margin: 0,
            padding: 0,
          }}>
            {Object.entries(kpiData).map(([detalle, suma]) => (
              <div key={detalle} style={{
                  minWidth: 54,
                  minHeight: 16,
                  background: '#fff',
                  border: '1px solid #1ecb4f',
                  borderRadius: 4,
                  boxShadow: '0 1px 2px #0001',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5px 4px',
                  marginBottom: 2,
                  fontSize: 10,
                }}>
                  <div style={{ color: '#1ecb4f', fontWeight: 600, fontSize: 9, marginBottom: 1, textAlign: 'center', lineHeight: 1.1 }}>{detalle}</div>
                  <div style={{ color: '#16355D', fontWeight: 700, fontSize: 10, lineHeight: 1.1 }}>
                    USD {Number(suma).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ color: '#0177FF', fontWeight: 600, fontSize: 9 }}>
                    {totalKpi > 0 ? ((suma / totalKpi) * 100).toFixed(1) + '%' : '0%'}
                  </div>
                </div>
              ))}
            {/* Tarjeta KPI de total general - Solo para parciales */}
            {(seleccion === 'real_parcial' || seleccion === 'v0_parcial' || seleccion === 'npc_parcial' || seleccion === 'api_parcial') && (
              <div style={{
                minWidth: 80,
                minHeight: 24,
                background: '#16355D',
                border: '2px solid #FFD000',
                borderRadius: 6,
                boxShadow: '0 2px 6px #0002',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 10px',
                marginLeft: 12,
                fontSize: 12,
              }}>
                <div style={{ color: '#FFD000', fontWeight: 700, fontSize: 11, marginBottom: 2, textAlign: 'center', lineHeight: 1.1 }}>
                  TOTAL FILTRO
                </div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, lineHeight: 1.1 }}>
                  USD {Number(totalKpi).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Fila horizontal: filtros y botón */}
      {(seleccion === 'real_parcial' || seleccion === 'real_acumulado' || seleccion === 'v0_parcial' || seleccion === 'v0_acumulada' || seleccion === 'npc_parcial' || seleccion === 'npc_acumulado' || seleccion === 'api_parcial' || seleccion === 'api_acumulada') && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 18,
          marginBottom: 12,
          flexWrap: 'wrap',
          width: '100%',
          margin: 0,
          padding: 0,
        }}>
          {/* Botón importar tabla */}
          <button
            style={{
              background: '#FFD000',
              color: '#16355D',
              border: 'none',
              borderRadius: 6,
              padding: '8px 18px',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0001',
              marginBottom: 0
            }}
            onClick={() => {
              setShowClaveModal(true);
            }}
            disabled={importando}
          >
            Importar tabla
          </button>
          {/* Selector de fechas */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'flex-end', margin: 0, padding: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: 0, padding: 0 }}>
              <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                style={{
                  border: '2px solidrgb(29, 105, 219)',
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
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                style={{
                  border: '2px solidrgb(51, 153, 255)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 10,
                  color: '#222',
                  fontWeight: 500,
                  outline: 'none',
                }}
              />
            </div>
            {/* Botón limpiar filtro */}
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
      )}
      {/* Modal de importación */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 16px #0003',
            padding: 32,
            minWidth: 340,
            maxWidth: 420,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <h3 style={{ color: '#16355D', marginBottom: 18, fontWeight: 700 }}>
              {seleccion === 'reporte9' ? 'Importar datos de Flujo Financiero SAP' : 'Importar datos de Real Parcial'}
            </h3>
            {/* Botón moderno para elegir archivo */}
            <label htmlFor="file-upload" style={{
              background: '#FFD000',
              color: '#16355D',
              border: 'none',
              borderRadius: 6,
              padding: '10px 28px',
              fontWeight: 700,
              fontSize: 10,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0001',
              marginBottom: 10,
              display: 'inline-block',
              textAlign: 'center',
            }}>
              Elegir archivo
              <input
                id="file-upload"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleModalFileChange}
                disabled={importando}
                style={{ display: 'none' }}
              />
            </label>
            {/* Nombre del archivo seleccionado */}
            {selectedFile && (
              <div style={{ color: '#16355D', fontSize: 15, marginBottom: 16, marginTop: 2, fontWeight: 500 }}>
                {selectedFile.name}
              </div>
            )}
            <button
              onClick={handleModalImportar}
              disabled={!selectedFile || importando}
              style={{
                background: '#FFD000',
                color: '#16355D',
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 10,
                cursor: !selectedFile || importando ? 'not-allowed' : 'pointer',
                marginBottom: 12,
                marginTop: 4
              }}
            >
              {importando ? 'Importando...' : 'Importar'}
            </button>
            <button
              onClick={() => setShowImportModal(false)}
              style={{
                background: 'none',
                color: '#16355D',
                border: 'none',
                fontWeight: 500,
                fontSize: 10,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              disabled={importando}
            >
              Cancelar
            </button>
            {importMessage && (
              <div style={{ color: importMessage.includes('éxito') ? 'green' : 'red', marginTop: 12 }}>{importMessage}</div>
            )}
            
            {/* Información de formato para SAP */}
            {seleccion === 'reporte9' && (
              <div style={{
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '5px',
                padding: '15px',
                marginTop: '15px',
                fontSize: '12px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '13px' }}>Formato Requerido para SAP:</h4>
                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  <p><strong>Columnas requeridas:</strong></p>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    <li><strong>ID_SAP:</strong> Identificador único del registro SAP</li>
                    <li><strong>VERSION_SAP:</strong> Versión del sistema SAP</li>
                    <li><strong>DESCRIPCION:</strong> Descripción del registro</li>
                    <li><strong>GRUPO_VERSION:</strong> Grupo de versión</li>
                    <li><strong>PERIODO:</strong> Fecha en formato DD-MM-YYYY</li>
                    <li><strong>MO, IC, EM, IE, SC, AD, CL, CT:</strong> Montos para cada categoría</li>
                  </ul>
                  <p><strong>Nota:</strong> Los registros existentes con el mismo ID_SAP serán actualizados.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de clave para importar */}
      {showClaveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 16px #0003',
            padding: 32,
            minWidth: 340,
            maxWidth: 420,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <h3 style={{ color: '#16355D', marginBottom: 18, fontWeight: 700 }}>Clave requerida</h3>
            <input
              type="password"
              value={claveInput}
              onChange={e => { setClaveInput(e.target.value); setClaveError(''); }}
              placeholder="Ingrese la clave"
              style={{
                border: '1.5px solid #16355D',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 15,
                marginBottom: 10,
                width: '100%'
              }}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') {
                if (claveInput === CLAVE_IMPORTACION) {
                  setShowClaveModal(false);
                  setClaveInput('');
                  setTimeout(() => setShowImportModal(true), 100);
                } else {
                  setClaveError('Clave incorrecta');
                }
              }}}
            />
            <button
              onClick={() => {
                if (claveInput === CLAVE_IMPORTACION) {
                  setShowClaveModal(false);
                  setClaveInput('');
                  setTimeout(() => setShowImportModal(true), 100);
                } else {
                  setClaveError('Clave incorrecta');
                }
              }}
              style={{
                background: '#FFD000',
                color: '#16355D',
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                marginBottom: 8,
                marginTop: 4
              }}
            >
              Validar clave
            </button>
            <button
              onClick={() => { setShowClaveModal(false); setClaveInput(''); setClaveError(''); }}
              style={{
                background: 'none',
                color: '#16355D',
                border: 'none',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Cancelar
            </button>
            {claveError && (
              <div style={{ color: 'red', marginTop: 8 }}>{claveError}</div>
            )}
          </div>
        </div>
      )}
      {/* Fin del modal */}
      {cargandoTabla ? (
        <div>Cargando datos...</div>
      ) : (
        seleccion === 'reporte1' ? (
          <div style={{ width: '100%', margin: 0, padding: 0, paddingRight: 8 }}>
            <h4 style={{margin: '24px 0 8px 0', color: '#0a3265', fontWeight: 700, alignSelf: 'flex-start', width: '100%' }}>Curva S - Evolución de Parciales</h4>
            {/* Filtros de fecha y barredor */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  style={{
                    border: '2px solidrgb(29, 105, 219)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 10,
                    color: '#222',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  style={{
                    border: '2px solidrgb(51, 153, 255)',
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
            {/* Gráfico usando SOLO los vectores validados */}
            <div ref={graficoRef}>
              <CurvaSChart
                data={prepararDatosCurvaS(
                  tablaRealParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta)),
                  tablaV0Parcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta)),
                  tablaNpcParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta)),
                  tablaApiParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta))
                )}
              />
            </div>
            {/* Tarjetas KPI usando SOLO los vectores validados y sumando correctamente los detalles factoriales */}
            <div style={{
              width: '100%',
              display: 'flex',
              flexWrap: 'nowrap', // Para que no bajen de línea
              gap: 10,
              margin: '18px 0 0 0',
              alignItems: 'stretch',
              justifyContent: 'stretch',
              boxSizing: 'border-box'
            }}>
              {['Real Parcial', 'V0 Parcial', 'NPC Parcial', 'API Parcial'].map((tipo, idx) => {
                // Selecciona el arreglo correspondiente filtrado
                let arr = [];
                if (tipo === 'Real Parcial') arr = tablaRealParcial;
                if (tipo === 'V0 Parcial') arr = tablaV0Parcial;
                if (tipo === 'NPC Parcial') arr = tablaNpcParcial;
                if (tipo === 'API Parcial') arr = tablaApiParcial;
                arr = arr.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                // Agrupa y suma por detalle_factorial (case-insensitive y sin espacios)
                const kpi = {};
                arr.forEach(row => {
                  let key = normalizar(row.detalle_factorial || 'Sin Detalle');
                  if (!kpi[key]) kpi[key] = 0;
                  kpi[key] += Number(row.monto) || 0;
                });
                // Mostrar siempre todas las categorías aunque no existan en los datos
                return (
                  <div key={tipo} style={{
                    flex: 1,
                    background: '#fff',
                    border: '1.5px solid #16355D',
                    borderRadius: 8,
                    boxShadow: '0 1px 4px #0001',
                    padding: 14,
                    marginBottom: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    minWidth: 0
                  }}>
                    <div style={{ color: '#16355D', fontWeight: 800, fontSize: 13, marginBottom: 6, letterSpacing: 0.5 }}>{tipo}</div>
                    {categorias.map(cat => {
                      const key = normalizar(cat);
                      return (
                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderBottom: '1px solid #f0f0f0', padding: '2px 0' }}>
                          <span style={{ color: '#0177FF', fontWeight: 600 }}>{cat}</span>
                          <span style={{ color: kpi[key] > 0 ? '#222' : '#bbb', fontWeight: 700, minWidth: 90, textAlign: 'right' }}>
                            USD {Number(kpi[key] || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      );
                    })}
                    {Object.values(kpi).reduce((a, b) => a + b, 0) === 0 && (
                      <div style={{ color: '#aaa', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                        Sin datos en el periodo seleccionado
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* TABLA RESUMEN DE PARCIALES */}
            <div style={{ width: '100%', margin: '32px 0 0 0', overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #0001', fontSize: 13, minWidth: 900 }}>
                <thead>
                  <tr style={{ background: '#0a3265', color: '#fff' }}>
                    <th style={{ padding: '8px 12px', borderTopLeftRadius: 10 }}>Categoría VP</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Real Parcial USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(A)</span></th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>V0 Parcial USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(B)</span></th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>NPC Parcial USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(C)</span></th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>API Parcial USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(D)</span></th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', borderLeft: '3px solid #e53935' }}>Cascada V0 <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(A-B)</span></th>
                    <th style={{ padding: '8px 12px', borderTopRightRadius: 10, textAlign: 'center' }}>Cascada API <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(A-D)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map(cat => {
                    const key = normalizar(cat);
                    // Suma por categoría y tipo
                    const getMontoParcial = (arr) => {
                      arr = arr.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                      const registros = arr.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                      return registros.reduce((acc, row) => acc + (Number(row.monto) || 0), 0);
                    };
                    const montoAPI = getMontoParcial(tablaApiParcial);
                    const montoV0 = getMontoParcial(tablaV0Parcial);
                    const montoNPC = getMontoParcial(tablaNpcParcial);
                    const montoReal = getMontoParcial(tablaRealParcial);
                    const cascadaV0 = montoReal - montoV0;
                    const cascadaAPI = montoReal - montoAPI;
                    return (
                      <tr key={cat}>
                        <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0a3265', background: '#f6f8fa' }}>{cat}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoReal > 0 ? montoReal.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoV0 > 0 ? montoV0.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoNPC > 0 ? montoNPC.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoAPI > 0 ? montoAPI.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: cascadaV0 > 0 ? '#1ecb4f' : cascadaV0 < 0 ? '#ff4444' : '#666', borderLeft: '3px solid #e53935' }}>
                          {montoReal > 0 || montoV0 > 0 ? cascadaV0.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: cascadaAPI > 0 ? '#1ecb4f' : cascadaAPI < 0 ? '#ff4444' : '#666' }}>
                          {montoReal > 0 || montoAPI > 0 ? cascadaAPI.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Fila de totales */}
                  <tr style={{ background: '#e6f0fa', fontWeight: 700 }}>
                    <td style={{ padding: '8px 12px', color: '#0a3265' }}>TOTAL PARCIAL</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                      const suma = categorias.reduce((acc, cat) => acc + (tablaRealParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                      return suma > 0 ? suma.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                      const suma = categorias.reduce((acc, cat) => acc + (tablaV0Parcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                      return suma > 0 ? suma.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                      const suma = categorias.reduce((acc, cat) => acc + (tablaNpcParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                      return suma > 0 ? suma.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                      const suma = categorias.reduce((acc, cat) => acc + (tablaApiParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                      return suma > 0 ? suma.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, borderLeft: '3px solid #e53935' }}>
                      {(() => {
                        // Cascada V0: Total Real - Total V0
                        const totalReal = categorias.reduce((acc, cat) => {
                          const key = normalizar(cat);
                          const arrFiltrado = tablaRealParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                          const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                          return acc + registros.reduce((a, row) => a + (Number(row.monto) || 0), 0);
                        }, 0);
                        const totalV0 = categorias.reduce((acc, cat) => {
                          const key = normalizar(cat);
                          const arrFiltrado = tablaV0Parcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                          const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                          return acc + registros.reduce((a, row) => a + (Number(row.monto) || 0), 0);
                        }, 0);
                        const diferencia = totalReal - totalV0;
                        return diferencia !== 0 ? diferencia.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                      })()}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>
                      {(() => {
                        // Cascada API: Total Real - Total API
                        const totalReal = categorias.reduce((acc, cat) => {
                          const key = normalizar(cat);
                          const arrFiltrado = tablaRealParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                          const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                          return acc + registros.reduce((a, row) => a + (Number(row.monto) || 0), 0);
                        }, 0);
                        const totalAPI = categorias.reduce((acc, cat) => {
                          const key = normalizar(cat);
                          const arrFiltrado = tablaApiParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                          const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                          return acc + registros.reduce((a, row) => a + (Number(row.monto) || 0), 0);
                        }, 0);
                        const diferencia = totalReal - totalAPI;
                        return diferencia !== 0 ? diferencia.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                      })()}
                    </td>
                  </tr>
                  <tr style={{ background: '#e6f0fa', fontWeight: 700 }}>
                    <td style={{ padding: '8px 12px', color: '#0a3265' }}>% AVANCE PARCIAL</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                      // Real Parcial / Real Acumulado
                      const totalParcial = categorias.reduce((acc, cat) => acc + (tablaRealParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                      const totalAcum = categorias.reduce((acc, cat) => {
                        const registros = tablaRealAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat));
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return totalAcum > 0 ? ((totalParcial / totalAcum) * 100).toFixed(2) + '%' : '0%';
                    })()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                      // V0 Parcial / V0 Acumulado
                      const totalParcial = categorias.reduce((acc, cat) => acc + (tablaV0Parcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                      const totalAcum = categorias.reduce((acc, cat) => {
                        const registros = tablaV0Acumulada.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat));
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return totalAcum > 0 ? ((totalParcial / totalAcum) * 100).toFixed(2) + '%' : '0%';
                    })()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                      // NPC Parcial / NPC Acumulado
                      const totalParcial = categorias.reduce((acc, cat) => acc + (tablaNpcParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                      const totalAcum = categorias.reduce((acc, cat) => {
                        const registros = tablaNpcAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat));
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return totalAcum > 0 ? ((totalParcial / totalAcum) * 100).toFixed(2) + '%' : '0%';
                    })()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                      // API Parcial / API Acumulado
                      const totalParcial = categorias.reduce((acc, cat) => acc + (tablaApiParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                      const totalAcum = categorias.reduce((acc, cat) => {
                        const registros = tablaApiAcumulada.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat));
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return totalAcum > 0 ? ((totalParcial / totalAcum) * 100).toFixed(2) + '%' : '0%';
                    })()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', borderLeft: '3px solid #e53935' }}>-</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* GRÁFICOS DE CASCADA - ANÁLISIS DE PARCIALES */}
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <h4 style={{ color: '#0a3265', fontWeight: 700, marginBottom: 24 }}>Gráficos de Cascada - Análisis de Parciales</h4>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 32, justifyContent: 'center', alignItems: 'flex-start', width: '100%', flexWrap: 'nowrap' }}>
                <div style={{ flex: '1 1 420px', maxWidth: '48%', minWidth: 340 }}>
                  <GraficoCascadaAcumulativa
                    data={prepararDatosCascadaParciales(categorias, tablaV0Parcial, tablaRealParcial, 'V0')}
                    titulo="Cascada V0 (A-B) - Parciales (M$USD)"
                  />
                </div>
                <div style={{ flex: '1 1 420px', maxWidth: '48%', minWidth: 340 }}>
                  <GraficoCascadaAcumulativa
                    data={prepararDatosCascadaParciales(categorias, tablaApiParcial, tablaRealParcial, 'API')}
                    titulo="Cascada API (A-D) - Parciales (M$USD)"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (seleccion === 'reporte6' || seleccion === 'reporte9') ? null : (
          seleccion !== 'reporte9' && (
            <div style={{ width: '100%', margin: 0, padding: 0, paddingRight: 8 }}>
              <h4 style={{margin: '24px 0 8px 0', color: '#0a3265', fontWeight: 700, alignSelf: 'flex-start', width: '100%' }}>Datos importados en la base de datos:</h4>
              <div
                className="ag-theme-alpine custom-codelco-theme"
                style={{
                  height: '60vh',
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  fontSize: '0.8em',
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 1px 4px 0 rgba(10,50,101,0.07)',
                  margin: 0,
                  padding: 0,
                  boxSizing: 'border-box',
                  overflowX: 'auto',
                  alignSelf: 'stretch',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <AgGridReact
                  className="ag-theme-alpine"
                  rowData={getTablaFiltrada()}
                  columnDefs={[
                    { headerName: 'ID', field: 'id', width: 60, sortable: true, cellStyle: { padding: '0.2em 0.4em', fontSize: '0.8em' } },
                    { headerName: 'Proyecto', field: 'proyecto_nombre', flex: 1, sortable: true, cellStyle: { padding: '2px 4px', fontSize: 12 } },
                    { headerName: 'Centro Costo', field: 'centro_costo', flex: 1, sortable: true, cellStyle: { padding: '2px 4px', fontSize: 12 } },
                    { headerName: 'Periodo', field: 'periodo', flex: 1, sortable: true, cellStyle: { padding: '2px 4px', fontSize: 12 } },
                    { headerName: 'Tipo', field: 'tipo', flex: 1, sortable: true, cellStyle: { padding: '2px 4px', fontSize: 12 } },
                    { headerName: 'Cat VP', field: 'cat_vp', flex: 1, sortable: true, cellStyle: { padding: '2px 4px', fontSize: 12 } },
                    { headerName: 'Detalle Factorial', field: 'detalle_factorial', flex: 1, sortable: true, cellStyle: { padding: '2px 4px', fontSize: 12 } },
                    { headerName: 'Monto', field: 'monto', width: 110, sortable: true, valueFormatter: p => p.value ? `USD ${Number(p.value).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : 'USD 0', cellStyle: { padding: '2px 4px', fontSize: 12, textAlign: 'right' } },
                  ]}
                  defaultColDef={{
                    sortable: true,
                    resizable: true,
                    cellStyle: { padding: '2px 4px', fontSize: 12 },
                  }}
                  pagination={true}
                  paginationPageSize={20}
                  domLayout="normal"
                  animateRows={true}
                  suppressRowClickSelection={true}
                  suppressCellFocus={true}
                  rowSelection="single"
                  overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
                  quickFilterText=""
                />
              </div>
            </div>
          )
        )
      )}
      {(seleccion === 'reporte6') && (
        <div style={{ width: '100%', margin: 0, padding: 0, paddingRight: 8 }}>
          <h4 style={{margin: '24px 0 8px 0', color: '#0a3265', fontWeight: 700, alignSelf: 'flex-start', width: '100%' }}>
            Curva S - Evolución de Acumulados
          </h4>
          {/* Filtros de fecha y barredor */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                style={{
                  border: '2px solidrgb(29, 105, 219)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 10,
                  color: '#222',
                  fontWeight: 500,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                style={{
                  border: '2px solidrgb(51, 153, 255)',
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
          {/* Gráfico solo para reporte6 (Curva S - Acumulados) */}
          {seleccion === 'reporte6' && (
            <div ref={graficoRef}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={prepararDatosCurvaS_Acumulados(
                  tablaRealAcumulado,
                  tablaV0Acumulada,
                  tablaNpcAcumulado,
                  tablaApiAcumulada,
                  fechaDesde,
                  fechaHasta
                )} margin={{ top: 40, right: 40, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" angle={-45} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v.toFixed(0)}%`} width={60} />
                  <Tooltip formatter={v => `${v.toFixed(1)}%`} />
                  <Legend verticalAlign="top" align="center" height={36} iconType="circle" wrapperStyle={{ top: 0 }} />
                  <Line type="monotone" dataKey="Real %" stroke="#1ecb4f" strokeWidth={2} dot={false} name="Real (%)" />
                  <Line type="monotone" dataKey="V0 %" stroke="#16355D" strokeWidth={2} dot={false} name="V0 (%)" />
                  <Line type="monotone" dataKey="NPC %" stroke="#FFD000" strokeWidth={2} dot={false} name="NPC (%)" />
                  <Line type="monotone" dataKey="API %" stroke="#0177FF" strokeWidth={2} dot={false} name="API (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Tarjetas KPI de detalles factoriales de todos los acumulados filtrados - Solo para reporte6 */}
          {seleccion === 'reporte6' && (
            <div style={{
              width: '100%',
              display: 'flex',
              flexWrap: 'nowrap', // Para que no bajen de línea
              gap: 10,
              margin: '18px 0 0 0',
              alignItems: 'stretch',
              justifyContent: 'stretch',
              boxSizing: 'border-box'
            }}>
              {['Real Acumulado', 'V0 Acumulado', 'NPC Acumulado', 'API Acumulado'].map((tipo, idx) => {
                // Selecciona el arreglo correspondiente filtrado
                let arr = [];
                if (tipo === 'Real Acumulado') arr = tablaRealAcumulado;
                if (tipo === 'V0 Acumulado') arr = tablaV0Acumulada;
                if (tipo === 'NPC Acumulado') arr = tablaNpcAcumulado;
                if (tipo === 'API Acumulado') arr = tablaApiAcumulada;
                arr = arr.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                // Agrupa y toma el monto del último periodo para cada detalle_factorial
                const kpi = {};
                categorias.forEach(cat => {
                  const key = normalizar(cat);
                  // Filtra los registros de la categoría
                  const registrosCat = arr.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                  if (registrosCat.length > 0) {
                    // Toma el registro con el periodo más alto (último)
                    const ultimo = registrosCat.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                    kpi[key] = Number(ultimo.monto) || 0;
                  } else {
                    kpi[key] = 0;
                  }
                });
                // Determina el arreglo total según el tipo
                let arrTotal = [];
                if (tipo === 'Real Acumulado') arrTotal = tablaRealAcumulado;
                if (tipo === 'V0 Acumulado') arrTotal = tablaV0Acumulada;
                if (tipo === 'NPC Acumulado') arrTotal = tablaNpcAcumulado;
                if (tipo === 'API Acumulado') arrTotal = tablaApiAcumulada;

                // Calcula los montos totales de cada categoría (sin filtro)
                const montosTotalesPorCat = {};
                categorias.forEach(cat => {
                  const key = normalizar(cat);
                  const registrosCatTotal = arrTotal.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                  let montoTotal = 0;
                  if (registrosCatTotal.length > 0) {
                    const ultimoTotal = registrosCatTotal.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                    montoTotal = Number(ultimoTotal.monto) || 0;
                  }
                  montosTotalesPorCat[key] = montoTotal;
                });
                const sumaTotal = Object.values(montosTotalesPorCat).reduce((a, b) => a + b, 0);

                return (
                  <div key={tipo} style={{
                    flex: 1, // ¡Esto es clave!
                    background: '#fff',
                    border: '1.5px solid #16355D',
                    borderRadius: 8,
                    boxShadow: '0 1px 4px #0001',
                    padding: 14,
                    marginBottom: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    minWidth: 0 // Permite que se ajusten bien
                  }}>
                    <div style={{ color: '#16355D', fontWeight: 800, fontSize: 13, marginBottom: 6, letterSpacing: 0.5 }}>{tipo}</div>
                    {categorias.map(cat => {
                      const key = normalizar(cat);

                      // Registros de la categoría en el filtro
                      const registrosCatFiltrado = arr.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                      let montoFiltrado = 0;
                      if (registrosCatFiltrado.length > 0) {
                        const ultimoFiltrado = registrosCatFiltrado.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                        montoFiltrado = Number(ultimoFiltrado.monto) || 0;
                      }

                      // Obtén el monto total de la categoría (sin filtro)
                      const montoTotal = montosTotalesPorCat[key] || 0;

                      // Lógica de porcentaje según filtro
                      let porcentaje = 0;
                      if (!fechaDesde && !fechaHasta) {
                        // Sin filtro: distribución por total de costos
                        porcentaje = sumaTotal > 0 ? (montoTotal / sumaTotal) * 100 : 0;
                      } else {
                        // Con filtro: avance respecto al total histórico de la categoría
                        porcentaje = montoTotal > 0 ? (montoFiltrado / montoTotal) * 100 : 0;
                      }

                      return (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderBottom: '1px solid #f0f0f0', padding: '2px 0' }}>
                        <span style={{ color: '#0177FF', fontWeight: 600 }}>{cat}</span>
                          <span style={{ color: montoFiltrado > 0 ? '#222' : '#bbb', fontWeight: 700, minWidth: 90, textAlign: 'right' }}>
                            USD {Number(montoFiltrado).toLocaleString('en-US', { maximumFractionDigits: 0 })} <span style={{ color: '#888', fontWeight: 500 }} title="Porcentaje = (Monto categoría / Total general) × 100">({porcentaje.toFixed(2)}%)</span>
                        </span>
                      </div>
                      );
                    })}
                    {Object.values(kpi).reduce((a, b) => a + b, 0) === 0 && (
                      <div style={{ color: '#aaa', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                        Sin datos en el periodo seleccionado
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* Tabla resumen de acumulados por categoría y tipo */}
          <div style={{ width: '100%', margin: '32px 0 0 0', overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #0001', fontSize: 13, minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#0a3265', color: '#fff' }}>
                  <th style={{ padding: '8px 12px', borderTopLeftRadius: 10 }}>Categoría VP</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Real Acumulado USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(A)</span></th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>V0 Acumulado USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(B)</span></th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>NPC Acumulado USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(C)</span></th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>API Acumulado USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(D)</span></th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', borderLeft: '3px solid #e53935' }}>Cascada V0 <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(A-B)</span></th>
                  <th style={{ padding: '8px 12px', borderTopRightRadius: 10, textAlign: 'center' }}>Cascada API <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(A-D)</span></th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => {
                  const key = normalizar(cat);

                  // Función para obtener el monto final filtrado por fecha
                  const getMontoFinalFiltrado = (arr) => {
                    // Aplica el filtro de fechas
                    const arrFiltrado = arr.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                    const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                    if (registros.length > 0) {
                      const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                      return Number(ultimo.monto) || 0;
                    }
                    return 0;
                  };

                  const montoAPI = getMontoFinalFiltrado(tablaApiAcumulada);
                  const montoV0 = getMontoFinalFiltrado(tablaV0Acumulada);
                  const montoNPC = getMontoFinalFiltrado(tablaNpcAcumulado);
                  const montoReal = getMontoFinalFiltrado(tablaRealAcumulado);
                  const cascadaV0 = montoReal - montoV0;
                  const cascadaAPI = montoReal - montoAPI;

                  return (
                    <tr key={cat}>
                      <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0a3265', background: '#f6f8fa' }}>{cat}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoReal > 0 ? montoReal.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoV0 > 0 ? montoV0.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoNPC > 0 ? montoNPC.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoAPI > 0 ? montoAPI.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: cascadaV0 > 0 ? '#1ecb4f' : cascadaV0 < 0 ? '#ff4444' : '#666', borderLeft: '3px solid #e53935' }}>
                        {montoReal > 0 || montoV0 > 0 ? cascadaV0.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: cascadaAPI > 0 ? '#1ecb4f' : cascadaAPI < 0 ? '#ff4444' : '#666' }}>
                        {montoReal > 0 || montoAPI > 0 ? cascadaAPI.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                      </td>
                    </tr>
                  );
                })}
                {/* Fila de totales y % avance financiero acumulado */}
                <tr style={{ background: '#e6f0fa', fontWeight: 700 }}>
                  <td style={{ padding: '8px 12px', color: '#0a3265' }}>TOTAL ACUM.</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {(() => {
                      // Suma filtrada Real
                      const sumaFiltrada = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaRealAcumulado.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return sumaFiltrada > 0 ? sumaFiltrada.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {(() => {
                      // Suma filtrada V0
                      const sumaFiltrada = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaV0Acumulada.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return sumaFiltrada > 0 ? sumaFiltrada.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {(() => {
                      // Suma filtrada NPC
                      const sumaFiltrada = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaNpcAcumulado.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return sumaFiltrada > 0 ? sumaFiltrada.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {(() => {
                      // Suma filtrada API
                      const sumaFiltrada = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaApiAcumulada.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return sumaFiltrada > 0 ? sumaFiltrada.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, borderLeft: '3px solid #e53935' }}>
                    {(() => {
                      // Cascada V0: Total Real - Total V0
                      const totalReal = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaRealAcumulado.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      const totalV0 = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaV0Acumulada.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      const diferencia = totalReal - totalV0;
                      return diferencia !== 0 ? diferencia.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>
                    {(() => {
                      // Cascada API: Total Real - Total API
                      const totalReal = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaRealAcumulado.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      const totalAPI = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaApiAcumulada.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      const diferencia = totalReal - totalAPI;
                      return diferencia !== 0 ? diferencia.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                    })()}
                  </td>
                </tr>
                <tr style={{ background: '#e6f0fa', fontWeight: 700 }}>
                  <td style={{ padding: '8px 12px', color: '#0a3265' }}>% AV. FINANCIERO ACUM.</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }} title="Porcentaje de avance = (Total Real Acumulado filtrado / Total Real Acumulado histórico) × 100">
                    {(() => {
                      // % avance Real
                      const sumaFiltrada = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaRealAcumulado.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      // Suma total histórico
                      const sumaTotal = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const registros = tablaRealAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return sumaTotal > 0 ? (sumaFiltrada / sumaTotal * 100).toFixed(2) + '%' : '0%';
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }} title="Porcentaje de avance = (Total V0 Acumulado filtrado / Total V0 Acumulado histórico) × 100">
                    {(() => {
                      // % avance V0
                      const sumaFiltrada = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaV0Acumulada.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      const sumaTotal = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const registros = tablaV0Acumulada.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return sumaTotal > 0 ? (sumaFiltrada / sumaTotal * 100).toFixed(2) + '%' : '0%';
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }} title="Porcentaje de avance = (Total NPC Acumulado filtrado / Total NPC Acumulado histórico) × 100">
                    {(() => {
                      // % avance NPC
                      const sumaFiltrada = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaNpcAcumulado.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      const sumaTotal = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const registros = tablaNpcAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return sumaTotal > 0 ? (sumaFiltrada / sumaTotal * 100).toFixed(2) + '%' : '0%';
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }} title="Porcentaje de avance = (Total API Acumulado filtrado / Total API Acumulado histórico) × 100">
                    {(() => {
                      // % avance API
                      const sumaFiltrada = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const arrFiltrado = tablaApiAcumulada.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                        const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      const sumaTotal = categorias.reduce((acc, cat) => {
                        const key = normalizar(cat);
                        const registros = tablaApiAcumulada.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                        if (registros.length > 0) {
                          const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                          return acc + Number(ultimo.monto) || 0;
                        }
                        return acc;
                      }, 0);
                      return sumaTotal > 0 ? (sumaFiltrada / sumaTotal * 100).toFixed(2) + '%' : '0%';
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', borderLeft: '3px solid #e53935' }}>-</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>-</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* GRÁFICOS DE CASCADA - ANÁLISIS DE ACUMULADOS - Solo para reporte6 */}
          {seleccion === 'reporte6' && (
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <h4 style={{ color: '#0a3265', fontWeight: 700, marginBottom: 24 }}>Gráficos de Cascada - Análisis de Acumulados</h4>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 32, justifyContent: 'center', alignItems: 'flex-start', width: '100%', flexWrap: 'nowrap' }}>
                <div style={{ flex: '1 1 420px', maxWidth: '48%', minWidth: 340 }}>
                  <GraficoCascadaAcumulativa
                    data={prepararDatosCascadaAcumulativa(categorias, tablaV0Acumulada, tablaRealAcumulado, 'V0')}
                    titulo="Cascada V0 (A-B) - Acumulados (M$USD)"
                  />
                </div>
                <div style={{ flex: '1 1 420px', maxWidth: '48%', minWidth: 340 }}>
                  <GraficoCascadaAcumulativa
                    data={prepararDatosCascadaAcumulativa(categorias, tablaApiAcumulada, tablaRealAcumulado, 'API')}
                    titulo="Cascada API (A-D) - Acumulados (M$USD)"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {seleccion === 'reporte8' && (
        <div style={{ width: '100%', margin: 0, padding: 0, paddingRight: 8 }}>
          <h4 style={{margin: '24px 0 8px 0', color: '#0a3265', fontWeight: 700, alignSelf: 'flex-start', width: '100%' }}>Flujo Financiero SAP</h4>
          {/* Filtros de fecha */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                style={{
                  border: '2px solidrgb(29, 105, 219)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 10,
                  color: '#222',
                  fontWeight: 500,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                style={{
                  border: '2px solidrgb(51, 153, 255)',
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
          {/* Copia de la tabla de acumulados */}
          <div style={{ width: '100%', margin: '32px 0 0 0', overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #0001', fontSize: 13, minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#0a3265', color: '#fff' }}>
                  <th style={{ padding: '8px 12px', borderTopLeftRadius: 10 }}>Categoría VP</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Real Acumulado USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(A)</span></th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>V0 Acumulado USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(B)</span></th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>NPC Acumulado USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(C)</span></th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>API Acumulado USD <span style={{ color: '#90EE90', fontWeight: 'bold' }}>(D)</span></th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => {
                  const key = normalizar(cat);
                  // ... cálculos de montos ...
                  const getMontoFinalFiltrado = (arr) => {
                    const arrFiltrado = arr.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta));
                    const registros = arrFiltrado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === key);
                    if (registros.length > 0) {
                      const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                      return Number(ultimo.monto) || 0;
                    }
                    return 0;
                  };
                  const montoAPI = getMontoFinalFiltrado(tablaApiAcumulada);
                  const montoV0 = getMontoFinalFiltrado(tablaV0Acumulada);
                  const montoNPC = getMontoFinalFiltrado(tablaNpcAcumulado);
                  const montoReal = getMontoFinalFiltrado(tablaRealAcumulado);
                  return (
                    <tr key={cat}>
                      <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0a3265', background: '#f6f8fa' }}>
                        {cat} <span style={{ color: '#1ecb4f', fontWeight: 'bold' }}>({categoriasConCodigos[cat]})</span>
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoReal > 0 ? montoReal.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoV0 > 0 ? montoV0.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoNPC > 0 ? montoNPC.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>{montoAPI > 0 ? montoAPI.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}</td>
                    </tr>
                  );
                })}
                {/* Fila de totales */}
                <tr style={{ background: '#e6f0fa', fontWeight: 700 }}>
                  <td style={{ padding: '8px 12px', color: '#0a3265' }}>TOTAL ACUM.</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                    const suma = categorias.reduce((acc, cat) => acc + (tablaRealAcumulado.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                    return suma > 0 ? suma.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                  })()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                    const suma = categorias.reduce((acc, cat) => acc + (tablaV0Acumulada.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                    return suma > 0 ? suma.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                  })()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                    const suma = categorias.reduce((acc, cat) => acc + (tablaNpcAcumulado.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                    return suma > 0 ? suma.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                  })()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                    const suma = categorias.reduce((acc, cat) => acc + (tablaApiAcumulada.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                    return suma > 0 ? suma.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
                  })()}</td>
                </tr>
                <tr style={{ background: '#e6f0fa', fontWeight: 700 }}>
                  <td style={{ padding: '8px 12px', color: '#0a3265' }}>% AV. FINANCIERO ACUM.</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                    // Real Parcial / Real Acumulado
                    const totalParcial = categorias.reduce((acc, cat) => acc + (tablaRealParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                    const totalAcum = categorias.reduce((acc, cat) => {
                      const registros = tablaRealAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat));
                      if (registros.length > 0) {
                        const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                        return acc + Number(ultimo.monto) || 0;
                      }
                      return acc;
                    }, 0);
                    return totalAcum > 0 ? ((totalParcial / totalAcum) * 100).toFixed(2) + '%' : '0%';
                  })()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                    // V0 Parcial / V0 Acumulado
                    const totalParcial = categorias.reduce((acc, cat) => acc + (tablaV0Parcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                    const totalAcum = categorias.reduce((acc, cat) => {
                      const registros = tablaV0Acumulada.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat));
                      if (registros.length > 0) {
                        const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                        return acc + Number(ultimo.monto) || 0;
                      }
                      return acc;
                    }, 0);
                    return totalAcum > 0 ? ((totalParcial / totalAcum) * 100).toFixed(2) + '%' : '0%';
                  })()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                    // NPC Parcial / NPC Acumulado
                    const totalParcial = categorias.reduce((acc, cat) => acc + (tablaNpcParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                    const totalAcum = categorias.reduce((acc, cat) => {
                      const registros = tablaNpcAcumulado.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat));
                      if (registros.length > 0) {
                        const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                        return acc + Number(ultimo.monto) || 0;
                      }
                      return acc;
                    }, 0);
                    return totalAcum > 0 ? ((totalParcial / totalAcum) * 100).toFixed(2) + '%' : '0%';
                  })()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(() => {
                    // API Parcial / API Acumulado
                    const totalParcial = categorias.reduce((acc, cat) => acc + (tablaApiParcial.filter(row => (!fechaDesde || row.periodo >= fechaDesde) && (!fechaHasta || row.periodo <= fechaHasta) && normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat)).reduce((a, row) => a + (Number(row.monto) || 0), 0)), 0);
                    const totalAcum = categorias.reduce((acc, cat) => {
                      const registros = tablaApiAcumulada.filter(row => normalizar(row.detalle_factorial || 'Sin Detalle') === normalizar(cat));
                      if (registros.length > 0) {
                        const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b));
                        return acc + Number(ultimo.monto) || 0;
                      }
                      return acc;
                    }, 0);
                    return totalAcum > 0 ? ((totalParcial / totalAcum) * 100).toFixed(2) + '%' : '0%';
                  })()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {seleccion === 'reporte9' && (
        <div style={{ width: '100%', margin: 0, padding: 0, paddingRight: 8 }}>
          <h4 style={{margin: '24px 0 8px 0', color: '#0a3265', fontWeight: 700, alignSelf: 'flex-start', width: '100%' }}>Flujo Financiero SAP</h4>
          
          {/* Filtros y botón de importación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            {/* Columna izquierda: Filtros de fecha */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  style={{
                    border: '2px solid rgb(29, 105, 219)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 10,
                    color: '#222',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label style={{ color: '#060270', fontWeight: 700, marginBottom: 2, fontSize: 11 }}>Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  style={{
                    border: '2px solid rgb(51, 153, 255)',
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
            
            {/* Columna derecha: Botón de importación */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button
                onClick={() => setShowImportModal(true)}
                style={{
                  background: '#FFD000',
                  color: '#16355D',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px #0001',
                }}
              >
                📁 Importar Excel
              </button>
            </div>
          </div>
          
          {/* Tarjetas KPI para Flujo Financiero SAP */}
          <div style={{
            width: '100%',
            margin: '16px 0 0 0',
            padding: 0,
          }}>
            <div style={{
              display: 'flex',
              gap: 7,
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
              width: '100%',
              alignItems: 'flex-start',
              margin: 0,
              padding: 0,
            }}>
              {Object.entries(categoriasConCodigos).map(([categoria, codigo]) => {
                // Debug: verificar el estado de tablaFinancieroSap
                console.log('tablaFinancieroSap:', tablaFinancieroSap, 'tipo:', typeof tablaFinancieroSap, 'es array:', Array.isArray(tablaFinancieroSap));
                
                // Aplicar filtros de fecha
                let data = Array.isArray(tablaFinancieroSap) ? tablaFinancieroSap : [];
                if (fechaDesde) {
                  data = data.filter(row => row.periodo >= fechaDesde);
                }
                if (fechaHasta) {
                  data = data.filter(row => row.periodo <= fechaHasta);
                }
                
                // Calcular total por categoría
                const total = data.reduce((acc, row) => acc + (Number(row[codigo]) || 0), 0);
                
                // Calcular total general para el porcentaje
                const totalGeneral = Object.values(categoriasConCodigos).reduce((acc, cod) => {
                  return acc + data.reduce((a, row) => a + (Number(row[cod]) || 0), 0);
                }, 0);
                
                const porcentaje = totalGeneral > 0 ? ((total / totalGeneral) * 100) : 0;
                
                return (
                  <div key={categoria} style={{
                    minWidth: 54,
                    minHeight: 16,
                    background: '#fff',
                    border: '1px solid #1ecb4f',
                    borderRadius: 4,
                    boxShadow: '0 1px 2px #0001',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5px 4px',
                    marginBottom: 2,
                    fontSize: 10,
                  }}>
                    <div style={{ color: '#1ecb4f', fontWeight: 600, fontSize: 9, marginBottom: 1, textAlign: 'center', lineHeight: 1.1 }}>{codigo}</div>
                    <div style={{ color: '#16355D', fontWeight: 700, fontSize: 10, lineHeight: 1.1 }}>
                      USD {Number(total).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ color: '#0177FF', fontWeight: 600, fontSize: 9 }}>
                      {porcentaje.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
              
              {/* Tarjeta KPI de total general */}
              <div style={{
                minWidth: 80,
                minHeight: 24,
                background: '#16355D',
                border: '2px solid #FFD000',
                borderRadius: 6,
                boxShadow: '0 2px 6px #0002',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 10px',
                marginLeft: 12,
                fontSize: 12,
              }}>
                <div style={{ color: '#FFD000', fontWeight: 700, fontSize: 11, marginBottom: 2, textAlign: 'center', lineHeight: 1.1 }}>
                  TOTAL SAP
                </div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, lineHeight: 1.1 }}>
                  USD {(() => {
                    let data = Array.isArray(tablaFinancieroSap) ? tablaFinancieroSap : [];
                    if (fechaDesde) {
                      data = data.filter(row => row.periodo >= fechaDesde);
                    }
                    if (fechaHasta) {
                      data = data.filter(row => row.periodo <= fechaHasta);
                    }
                    
                    const total = Object.values(categoriasConCodigos).reduce((acc, codigo) => {
                      return acc + data.reduce((a, row) => a + (Number(row[codigo]) || 0), 0);
                    }, 0);
                    return Number(total).toLocaleString('en-US', { maximumFractionDigits: 0 });
                  })()}
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabla de datos de Flujo Financiero SAP */}
          <div style={{ marginTop: 16 }}>
            <div style={{
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 8px #0001',
              overflow: 'hidden',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#16355D', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, color: '#fff' }}>ID SAP</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, color: '#fff' }}>Versión</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, color: '#fff' }}>Descripción</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, color: '#fff' }}>Grupo</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, color: '#fff' }}>Período</th>
                                              <th style={{ padding: '10px 6px', textAlign: 'right', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, minWidth: '90px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, lineHeight: 1.1, textAlign: 'center', color: '#fff' }}>{nombresEncabezados['MO']}</span>
                            <span style={{ fontSize: 8, color: '#1ecb4f', fontWeight: 'bold' }}>(MO)</span>
                          </div>
                        </th>
                        <th style={{ padding: '10px 6px', textAlign: 'right', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, minWidth: '90px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, lineHeight: 1.1, textAlign: 'center', color: '#fff' }}>{nombresEncabezados['IC']}</span>
                            <span style={{ fontSize: 8, color: '#1ecb4f', fontWeight: 'bold' }}>(IC)</span>
                          </div>
                        </th>
                        <th style={{ padding: '10px 6px', textAlign: 'right', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, minWidth: '90px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, lineHeight: 1.1, textAlign: 'center', color: '#fff' }}>{nombresEncabezados['EM']}</span>
                            <span style={{ fontSize: 8, color: '#1ecb4f', fontWeight: 'bold' }}>(EM)</span>
                          </div>
                        </th>
                        <th style={{ padding: '10px 6px', textAlign: 'right', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, minWidth: '90px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, lineHeight: 1.1, textAlign: 'center', color: '#fff' }}>{nombresEncabezados['IE']}</span>
                            <span style={{ fontSize: 8, color: '#1ecb4f', fontWeight: 'bold' }}>(IE)</span>
                          </div>
                        </th>
                        <th style={{ padding: '10px 6px', textAlign: 'right', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, minWidth: '90px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, lineHeight: 1.1, textAlign: 'center', color: '#fff' }}>{nombresEncabezados['SC']}</span>
                            <span style={{ fontSize: 8, color: '#1ecb4f', fontWeight: 'bold' }}>(SC)</span>
                          </div>
                        </th>
                        <th style={{ padding: '10px 6px', textAlign: 'right', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, minWidth: '90px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, lineHeight: 1.1, textAlign: 'center', color: '#fff' }}>{nombresEncabezados['AD']}</span>
                            <span style={{ fontSize: 8, color: '#1ecb4f', fontWeight: 'bold' }}>(AD)</span>
                          </div>
                        </th>
                                                 <th style={{ padding: '10px 6px', textAlign: 'right', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, minWidth: '90px' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                             <span style={{ fontSize: 9, lineHeight: 1.1, textAlign: 'center', color: '#fff' }}>{nombresEncabezados['CL']}</span>
                             <span style={{ fontSize: 8, color: '#1ecb4f', fontWeight: 'bold' }}>(CL)</span>
                           </div>
                         </th>
                         <th style={{ padding: '10px 6px', textAlign: 'right', borderBottom: '1px solid #ddd', fontSize: 11, fontWeight: 700, minWidth: '90px' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                             <span style={{ fontSize: 9, lineHeight: 1.1, textAlign: 'center', color: '#fff' }}>{nombresEncabezados['CT']}</span>
                             <span style={{ fontSize: 8, color: '#1ecb4f', fontWeight: 'bold' }}>(CT)</span>
                           </div>
                         </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let data = Array.isArray(tablaFinancieroSap) ? tablaFinancieroSap : [];
                      if (fechaDesde) {
                        data = data.filter(row => row.periodo >= fechaDesde);
                      }
                      if (fechaHasta) {
                        data = data.filter(row => row.periodo <= fechaHasta);
                      }
                      return data.map((row, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px', fontSize: 11 }}>{row.id_sap}</td>
                          <td style={{ padding: '8px', fontSize: 11 }}>{row.version_sap}</td>
                          <td style={{ padding: '8px', fontSize: 11 }}>{row.descripcion}</td>
                          <td style={{ padding: '8px', fontSize: 11 }}>{row.grupo_version}</td>
                          <td style={{ padding: '8px', fontSize: 11 }}>{row.periodo}</td>
                          <td style={{ padding: '8px', fontSize: 11, textAlign: 'right' }}>{Number(row.MO || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px', fontSize: 11, textAlign: 'right' }}>{Number(row.IC || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px', fontSize: 11, textAlign: 'right' }}>{Number(row.EM || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px', fontSize: 11, textAlign: 'right' }}>{Number(row.IE || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px', fontSize: 11, textAlign: 'right' }}>{Number(row.SC || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px', fontSize: 11, textAlign: 'right' }}>{Number(row.AD || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px', fontSize: 11, textAlign: 'right' }}>{Number(row.CL || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px', fontSize: 11, textAlign: 'right' }}>{Number(row.CT || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 32 }}>
        {renderContenido()}
      </div>
      {/* Sidebar solo visible en esta página */}
      <SidebarDerecho
        seleccion={seleccion}
        setSeleccion={setSeleccion}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
      />
      {/* Tarjeta flotante de información del proyecto */}
      <div style={{
        position: 'fixed',
        top: 80, // Ajusta según tu layout
        left: 60, // Ajusta según tu layout
        zIndex: 3000, // Mayor que el sidebar
        // ...otros estilos de la tarjeta...
      }}>
        {/* Contenido de la tarjeta */}
      </div>
    </div>
  );
};

export default Vectores; 