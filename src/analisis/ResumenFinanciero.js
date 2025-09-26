import React, { useState, useEffect } from 'react';
import './ResumenFinanciero.css';
import PanelAyuda from './PanelAyuda';
import { API_BASE } from '../config';


  const ResumenFinanciero = ({ proyectoId }) => {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Función para obtener el mes anterior en formato MM-YYYY
  const obtenerMesAnterior = () => {
    const hoy = new Date();
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const año = mesAnterior.getFullYear();
    const mes = String(mesAnterior.getMonth() + 1).padStart(2, '0');
    return `${año}-${mes}`;
  };
  
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState(obtenerMesAnterior());
  const vectorSeleccionado = 'real_parcial'; // Fijo en Real Parcial - no editable
  const [, setVectorSeleccionado] = useState('real_parcial'); // Función inactiva
  const [presupuestoTipo, setPresupuestoTipo] = useState('v0'); // v0, npc, api
  const [tipoPresupuesto, setTipoPresupuesto] = useState('V0'); // V0, NPC, API
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [region, setRegion] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [proyectoInfo, setProyectoInfo] = useState(null);
  const [filtrosActualizados, setFiltrosActualizados] = useState(0);
      const [popupActivo, setPopupActivo] = useState(null); // Para controlar popups de información KPI
  const [cumplimientoFisico, setCumplimientoFisico] = useState({}); // Para almacenar datos de cumplimiento físico


  // Objeto de filtros para el análisis dinámico
  const filtros = {
    region: region,
    proyecto: proyecto,
    fechaInicio: fechaDesde,
    fechaFin: fechaHasta
  };

  // Categorías VP con colores y descripciones
  const categoriasVP = {
    'MO': { 
      nombre: 'CONSTRUCCIÓN', 
      color: '#2E8B57', 
      porcentaje: 47.3,
      descripcion: 'Mano de obra directa y actividades de construcción principal del proyecto.'
    },
    'IC': { 
      nombre: 'INDIRECTOS CONTRATISTAS', 
      color: '#4682B4', 
      porcentaje: 13.6,
      descripcion: 'Costos indirectos asociados a contratistas y servicios externos.'
    },
    'EM': { 
      nombre: 'EQUIPOS Y MATERIALES', 
      color: '#DAA520', 
      porcentaje: 0.6,
      descripcion: 'Adquisición de equipos, maquinaria y materiales necesarios para el proyecto.'
    },
    'IE': { 
      nombre: 'INGENIERÍA', 
      color: '#8B4513', 
      porcentaje: 3.4,
      descripcion: 'Servicios de ingeniería, diseño y consultoría técnica especializada.'
    },
    'SC': { 
      nombre: 'SERVICIOS APOYO', 
      color: '#32CD32', 
      porcentaje: 3.0,
      descripcion: 'Servicios de apoyo a la construcción como logística, seguridad y mantenimiento.'
    },
    'AD': { 
      nombre: 'ADM. PROYECTO', 
      color: '#FF6347', 
      porcentaje: 15.2,
      descripcion: 'Costos administrativos, gestión del proyecto y personal de dirección.'
    },
    'CL': { 
      nombre: 'COSTOS ESPECIALES', 
      color: '#9370DB', 
      porcentaje: 7.9,
      descripcion: 'Gastos extraordinarios, imprevistos y costos especiales del proyecto.'
    },
    'CT': { 
      nombre: 'CONTINGENCIA', 
      color: '#FF4500', 
      porcentaje: 9.1,
      descripcion: 'Reserva financiera para contingencias y variaciones del proyecto.'
    }
  };

  // Cargar información del proyecto
  useEffect(() => {
    const cargarProyectoInfo = async () => {
      if (!proyectoId) return;
      
      try {
        const response = await fetch(`${API_BASE}/proyecto.php?id=${proyectoId}`);
        if (response.ok) {
          const data = await response.json();
          if (!data.error) {
            setProyectoInfo(data);
          }
        }
      } catch (err) {
        console.error('Error cargando información del proyecto:', err);
      }
    };

    cargarProyectoInfo();
  }, [proyectoId]);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!proyectoId) {
        setError('No se proporcionó ID de proyecto');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setDatos(data.datos);
      } catch (err) {
        console.error('Error cargando datos financieros:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [proyectoId]);

  // Función para cargar datos de cumplimiento físico
  const cargarCumplimientoFisico = async () => {
    if (!proyectoId) return;
    
    try {
      const response = await fetch(`${API_BASE}/obtener_cumplimiento_fisico_mensual.php?proyecto_id=${proyectoId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCumplimientoFisico(data.cumplimiento_fisico_mensual);
      }
    } catch (err) {
      console.error('Error cargando datos de cumplimiento físico:', err);
    }
  };

  // Cargar datos de cumplimiento físico cuando cambie el proyecto
  useEffect(() => {
    cargarCumplimientoFisico();
  }, [proyectoId]);

  // Efecto para recalcular KPIs cuando cambien los filtros
  useEffect(() => {
    setFiltrosActualizados(prev => prev + 1);
  }, [fechaDesde, fechaHasta, vectorSeleccionado, presupuestoTipo]);

  // Función para calcular totales por tabla
  const calcularTotales = (datosTabla) => {
    if (!Array.isArray(datosTabla)) return 0;
    const total = datosTabla.reduce((total, item) => total + parseFloat(item.monto || 0), 0);
    // Redondear para evitar errores de precisión de punto flotante
    return Math.round(total);
  };

  // Función para formatear moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Función para formatear moneda USD
  const formatearMonedaUSD = (valor) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Función para calcular distribución por categoría VP
  const calcularDistribucionVP = (datosTabla) => {
    if (!Array.isArray(datosTabla)) return {};
    
    const distribucion = {};
    datosTabla.forEach(item => {
      const categoria = item.cat_vp || 'OTRO';
      const monto = parseFloat(item.monto || 0);
      distribucion[categoria] = (distribucion[categoria] || 0) + monto;
    });
    
    return distribucion;
  };

  // Función para obtener datos filtrados por mes
  const obtenerDatosFiltrados = (datosTabla) => {
    if (!Array.isArray(datosTabla)) return [];
    
    if (!fechaDesde && !fechaHasta) return datosTabla;
    
    return datosTabla.filter(item => {
      const fechaItem = new Date(item.periodo);
      const añoItem = fechaItem.getFullYear();
      const mesItem = String(fechaItem.getMonth() + 1).padStart(2, '0');
      const periodItem = `${añoItem}-${mesItem}`;
      
      // Comparar con filtros de mes
      if (fechaDesde && periodItem < fechaDesde) return false;
      if (fechaHasta && periodItem > fechaHasta) return false;
      return true;
    });
  };

  // Función para determinar si un vector es acumulado
  const esVectorAcumulado = (vector) => {
    return vector.includes('acumulado') || vector.includes('acumulada') || vector.includes('acumulad');
  };

  // Función para calcular totales considerando si es acumulado o parcial
  const calcularTotalesCorrectos = (datosTabla, vector, datosCompletos = null) => {
    if (!Array.isArray(datosTabla)) return 0;
    
    const esAcumulado = esVectorAcumulado(vector);
    
    if (esAcumulado) {
      // Para datos acumulados, necesito obtener los datos parciales correspondientes
      // y sumarlos hasta la fecha del filtro para obtener el total acumulado real
      const vectorParcial = vector.replace('_acumulado', '_parcial').replace('_acumulada', '_parcial');
      
      // Obtener los datos parciales del mismo tipo
      const datosParciales = datosCompletos ? datosCompletos[vectorParcial] || [] : [];
      const datosParcialesFiltrados = obtenerDatosFiltrados(datosParciales);
      
      // Sumar todos los datos parciales hasta la fecha del filtro
      const totalAcumulado = datosParcialesFiltrados.reduce((total, item) => total + parseFloat(item.monto || 0), 0);
      return Math.round(totalAcumulado);
    } else {
      // Para datos parciales, sumamos todos los valores
      const totalParcial = datosTabla.reduce((total, item) => total + parseFloat(item.monto || 0), 0);
      return Math.round(totalParcial);
    }
  };

  // Función para calcular distribución por categoría VP considerando acumulados
  const calcularDistribucionVPCorrecta = (datosTabla, vector, datosCompletos = null) => {
    if (!Array.isArray(datosTabla)) return {};
    
    const esAcumulado = esVectorAcumulado(vector);
    
    if (esAcumulado) {
      // Para acumulados, necesito obtener los datos parciales correspondientes
      // y agruparlos por categoría hasta la fecha del filtro
      const vectorParcial = vector.replace('_acumulado', '_parcial').replace('_acumulada', '_parcial');
      
      // Obtener los datos parciales del mismo tipo
      const datosParciales = datosCompletos ? datosCompletos[vectorParcial] || [] : [];
      const datosParcialesFiltrados = obtenerDatosFiltrados(datosParciales);
      
      // Agrupar por categoría y sumar todos los valores parciales
      const distribucion = {};
      datosParcialesFiltrados.forEach(item => {
        const categoria = item.cat_vp || 'OTRO';
        const monto = parseFloat(item.monto || 0);
        distribucion[categoria] = (distribucion[categoria] || 0) + monto;
      });
      
      // Redondear cada categoría para evitar errores de precisión
      Object.keys(distribucion).forEach(categoria => {
        distribucion[categoria] = Math.round(distribucion[categoria]);
      });
      
      return distribucion;
    } else {
      // Para parciales, sumamos todos los valores por categoría
      const distribucion = {};
      datosTabla.forEach(item => {
        const categoria = item.cat_vp || 'OTRO';
        const monto = parseFloat(item.monto || 0);
        distribucion[categoria] = (distribucion[categoria] || 0) + monto;
      });
      
      // Redondear cada categoría para evitar errores de precisión
      Object.keys(distribucion).forEach(categoria => {
        distribucion[categoria] = Math.round(distribucion[categoria]);
      });
      
      return distribucion;
    }
  };

  // Función para calcular KPIs con nueva lógica
  const calcularKPIs = (datos, presupuestoTipo) => {
    // Total Ejecutado: Siempre del Real Parcial
    const datosRealParcial = datos.real_parcial || [];
    const datosFiltradosReal = obtenerDatosFiltrados(datosRealParcial);
    const totalEjecutado = calcularTotalesCorrectos(datosFiltradosReal, 'real_parcial', datos);
    
    // Log específico para debug de KPIs
    console.log('=== DEBUG KPIs CALCULATION ===');
    console.log('Datos Real Parcial totales:', datosRealParcial.length);
    console.log('Datos Real Parcial filtrados:', datosFiltradosReal.length);
    console.log('Total Ejecutado calculado:', totalEjecutado);
    console.log('Filtros aplicados - Desde:', fechaDesde, 'Hasta:', fechaHasta);
    
    // Presupuesto: Según el tipo seleccionado (V0, NPC, API)
    let vectorPresupuesto = '';
    let nombrePresupuesto = '';
    
    switch(presupuestoTipo) {
      case 'v0':
        vectorPresupuesto = 'v0_parcial';
        nombrePresupuesto = 'V0 Parcial';
        break;
      case 'npc':
        vectorPresupuesto = 'npc_parcial';
        nombrePresupuesto = 'NPC Parcial';
        break;
      case 'api':
        vectorPresupuesto = 'api_parcial';
        nombrePresupuesto = 'API Parcial';
        break;
      default:
        vectorPresupuesto = 'v0_parcial';
        nombrePresupuesto = 'V0 Parcial';
    }
    
    const datosPresupuesto = datos[vectorPresupuesto] || [];
    const datosFiltradosPresupuesto = obtenerDatosFiltrados(datosPresupuesto);
    const presupuesto = calcularTotalesCorrectos(datosFiltradosPresupuesto, vectorPresupuesto, datos);
    
    console.log('Vector Presupuesto:', vectorPresupuesto);
    console.log('Datos Presupuesto totales:', datosPresupuesto.length);
    console.log('Datos Presupuesto filtrados:', datosFiltradosPresupuesto.length);
    console.log('Presupuesto calculado:', presupuesto);
    
    // Calcular variación
    // Fórmula correcta: (Presupuesto - Real) / Presupuesto
    // Si el resultado es negativo, significa que se gastó más de lo presupuestado
    const variacion = presupuesto > 0 ? ((presupuesto - totalEjecutado) / presupuesto) * 100 : 0;
    
    // Calcular eficiencia basada en la variación
    // Con la nueva fórmula: (Presupuesto - Real) / Presupuesto
    // Si variación es positiva (se gastó menos de lo presupuestado), eficiencia = 100% + variación
    // Si variación es negativa (se gastó más de lo presupuestado), eficiencia = 100% + variación
    const eficiencia = Math.max(0, 100 + variacion);
    
    // Logs de depuración
    console.log('=== DEBUG KPIs ===');
    console.log('Total Ejecutado (Real Parcial):', totalEjecutado);
    console.log('Presupuesto (' + nombrePresupuesto + '):', presupuesto);
    console.log('Variación calculada:', variacion);
    console.log('Eficiencia calculada:', eficiencia);
    console.log('Registros Real:', datosFiltradosReal.length);
    console.log('Registros Presupuesto:', datosFiltradosPresupuesto.length);
    console.log('==================');
    
    // Distribución del total ejecutado
    const distribucion = calcularDistribucionVPCorrecta(datosFiltradosReal, 'real_parcial', datos);
    
    return {
      totalEjecutado,
      presupuesto,
      variacion,
      eficiencia,
      registrosReal: datosFiltradosReal.length,
      registrosPresupuesto: datosFiltradosPresupuesto.length,
      distribucion,
      nombrePresupuesto,
      vectorPresupuesto
    };
  };

  // Función para calcular datos de visualización basados en el vector seleccionado
  const calcularDatosVisualizacion = (datos, vectorSeleccionado) => {
    const datosVector = datos[vectorSeleccionado] || [];
    const datosFiltrados = obtenerDatosFiltrados(datosVector);
    const distribucion = calcularDistribucionVPCorrecta(datosFiltrados, vectorSeleccionado, datos);
    
    // Calcular el total sumando las categorías para garantizar consistencia
    const total = Object.values(distribucion).reduce((sum, valor) => sum + valor, 0);
    
    const esAcumulado = esVectorAcumulado(vectorSeleccionado);
    
    // Log para debuggear las fechas de los datos filtrados
    console.log('=== DEBUG DATOS VISUALIZACION ===');
    console.log('Vector seleccionado:', vectorSeleccionado);
    console.log('Datos totales:', datosVector.length);
    console.log('Datos filtrados:', datosFiltrados.length);
    console.log('Filtros aplicados - Desde:', fechaDesde, 'Hasta:', fechaHasta);
    
    // Mostrar las primeras y últimas fechas de los datos filtrados
    if (datosFiltrados.length > 0) {
      const fechas = datosFiltrados.map(item => item.periodo).sort();
      console.log('Primera fecha filtrada:', fechas[0]);
      console.log('Última fecha filtrada:', fechas[fechas.length - 1]);
    }
    console.log('================================');
    
    return {
      total,
      distribucion,
      registros: datosFiltrados.length,
      esAcumulado,
      datosVector: datosFiltrados
    };
  };

  // Función para procesar datos del cuadro de calor (heatmap)
  const procesarDatosHeatmap = (datosVector, esAcumulado) => {
    const meses = {};
    
    // Log para debuggear las fechas
    console.log('=== DEBUG HEATMAP ===');
    console.log('Tipo de datos:', esAcumulado ? 'Acumulado' : 'Parcial');
    console.log('Número de registros:', datosVector.length);
    
    if (esAcumulado) {
      // Para datos acumulados, sumamos todos los valores por mes
      // Cada registro representa el valor acumulado hasta esa fecha para una categoría específica
      datosVector.forEach(item => {
        // Extraer año y mes directamente del string de fecha (YYYY-MM-DD)
        const [year, month] = item.periodo.split('-');
        const mesKey = `${year}-${month}`;
        // Sumamos todos los valores acumulados del mismo mes (diferentes categorías)
        meses[mesKey] = (meses[mesKey] || 0) + parseFloat(item.monto || 0);
        
        // Log para las primeras fechas
        if (Object.keys(meses).length <= 5) {
          console.log(`Fecha original: ${item.periodo}, MesKey: ${mesKey}, Valor: ${item.monto}`);
        }
      });
    } else {
      // Para datos parciales, sumamos todos los valores por mes
      datosVector.forEach(item => {
        // Extraer año y mes directamente del string de fecha (YYYY-MM-DD)
        const [year, month] = item.periodo.split('-');
        const mesKey = `${year}-${month}`;
        meses[mesKey] = (meses[mesKey] || 0) + parseFloat(item.monto || 0);
        
        // Log para las primeras fechas
        if (Object.keys(meses).length <= 5) {
          console.log(`Fecha original: ${item.periodo}, MesKey: ${mesKey}, Valor: ${item.monto}`);
        }
      });
    }
    
    // Redondear todos los valores mensuales para evitar errores de precisión
    Object.keys(meses).forEach(mes => {
      meses[mes] = Math.round(meses[mes]);
    });
    
    console.log('Meses procesados:', Object.keys(meses).sort());
    console.log('========================');
    
    return meses;
  };

  // Función para contar periodos mensuales únicos
  const contarPeriodosMensuales = (datosVector) => {
    const mesesUnicos = new Set();
    
    datosVector.forEach(item => {
      const [year, month] = item.periodo.split('-');
      const mesKey = `${year}-${month}`;
      mesesUnicos.add(mesKey);
    });
    
    return mesesUnicos.size;
  };

  // Función para contar años únicos
  const contarAnosUnicos = (datosVector) => {
    const anosUnicos = new Set();
    
    datosVector.forEach(item => {
      const [year] = item.periodo.split('-');
      anosUnicos.add(year);
    });
    
    return anosUnicos.size;
  };

  // Función para generar datos de curva S
  const generarDatosCurvaS = (datosVector, esAcumulado) => {
    const meses = procesarDatosHeatmap(datosVector, esAcumulado);
    
    // Ordenar los meses cronológicamente
    const mesesOrdenados = Object.entries(meses).sort(([mesA], [mesB]) => {
      const fechaA = new Date(mesA + '-01');
      const fechaB = new Date(mesB + '-01');
      return fechaA - fechaB;
    });
    
    // Calcular valores acumulados para la curva S
    let acumulado = 0;
    const datosCurvaS = mesesOrdenados.map(([mes, monto]) => {
      acumulado += monto;
      return {
        mes,
        monto,
        acumulado,
        fecha: new Date(mes + '-01')
      };
    });
    
    // Calcular porcentajes para la curva S
    const totalFinal = datosCurvaS.length > 0 ? datosCurvaS[datosCurvaS.length - 1].acumulado : 0;
    
    return datosCurvaS.map(item => ({
      ...item,
      porcentaje: totalFinal > 0 ? (item.acumulado / totalFinal) * 100 : 0
    }));
  };

        // Función para manejar clic en botón de información KPI
      const handleInfoClick = (tipo, event) => {
        if (event) {
          event.stopPropagation();
          event.preventDefault();
        }
        const nuevoEstado = popupActivo === tipo ? null : tipo;
        setPopupActivo(nuevoEstado);
      };

  // Función para cerrar popup al hacer clic fuera
  const handleClickOutside = (event) => {
    if (!event.target.closest('.kpi-info-popup') && !event.target.closest('.kpi-info-btn')) {
      setPopupActivo(null);
    }
  };

        // Efecto para agregar/remover event listener de clic fuera
      useEffect(() => {
        if (popupActivo) {
          document.addEventListener('click', handleClickOutside, true);
          return () => {
            document.removeEventListener('click', handleClickOutside, true);
          };
        }
      }, [popupActivo]);

  if (loading) {
    return (
      <div className="resumen-loading">
        <div className="loading-spinner"></div>
        <h3>Cargando datos financieros...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resumen-error">
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="resumen-no-data">
        <h3>No hay datos disponibles</h3>
      </div>
    );
  }

  // Calcular KPIs y datos de visualización (se recalcularán cuando cambien los filtros)
  const kpis = calcularKPIs(datos, presupuestoTipo);
  const datosVisualizacion = calcularDatosVisualizacion(datos, vectorSeleccionado);
  

  
  // Log de depuración para verificar filtros
  console.log('=== FILTROS APLICADOS ===');
  console.log('Fecha Desde:', fechaDesde);
  console.log('Fecha Hasta:', fechaHasta);
  console.log('Vector Seleccionado:', vectorSeleccionado);
  console.log('Presupuesto Tipo:', presupuestoTipo);
  console.log('Filtros Actualizados:', filtrosActualizados);
  console.log('========================');
  
  // Log específico para verificar inconsistencias
  console.log('=== VERIFICACIÓN DE INCONSISTENCIAS ===');
  console.log('Total de datosVisualizacion:', datosVisualizacion.total);
  console.log('Distribución de datosVisualizacion:', datosVisualizacion.distribucion);
  
  // Calcular suma de categorías para comparar
  const sumaCategorias = Object.values(datosVisualizacion.distribucion).reduce((sum, valor) => sum + valor, 0);
  console.log('Suma de categorías:', sumaCategorias);
  console.log('Diferencia:', datosVisualizacion.total - sumaCategorias);
  console.log('=====================================');



  
  
   return (
     <div 
       className={`resumen-financiero ${mostrarAyuda ? 'panel-abierto' : ''}`}
       style={{
         transform: 'scale(0.8)',
         transformOrigin: 'top left',
         width: '125%',
         maxWidth: '100vw', // Nunca exceder el viewport width
         minHeight: '125vh',
         overflow: 'auto', // Scroll si es necesario
         boxSizing: 'border-box'
       }}
     >

      {/* Header con filtros */}
      <div className="resumen-header">
        <div className="resumen-title">
          <i className="fa fa-chart-line"></i>
          <div>
            <h2>Dashboard Ejecutivo - {proyectoInfo?.nombre ? `${proyectoInfo.nombre} (ID: ${proyectoId})` : `Proyecto ID: ${proyectoId}`}</h2>
            <div className="vector-info">
              <span className="vector-nombre">{vectorSeleccionado.replace('_', ' ').toUpperCase()}</span>
              {kpis.esAcumulado && <span className="vector-badge acumulado">ACUMULADO</span>}
              <span className="moneda-info">
                <strong>US</strong>
                <i className="fa fa-dollar-sign" style={{marginRight: '0.5rem', color: '#0a6ebd', fontWeight: 'bold'}}></i>
                <strong>TODOS LOS VALORES ESTÁN EN USD</strong>
              </span>
            </div>
          </div>
        </div>
        
        <div className="resumen-filtros">
          {/* Vector selector hidden - fixed to real_parcial */}
          {/* <div className="filtro-grupo">
            <label>Vector:</label>
            <select 
              value={vectorSeleccionado} 
              onChange={(e) => setVectorSeleccionado(e.target.value)}
              className="filtro-select"
            >
              <option value="real_parcial">Real Parcial</option>
              <option value="real_acumulado">Real Acumulado</option>
              <option value="v0_parcial">V0 Parcial</option>
              <option value="v0_acumulada">V0 Acumulado</option>
              <option value="npc_parcial">NPC Parcial</option>
              <option value="npc_acumulado">NPC Acumulado</option>
              <option value="api_parcial">API Parcial</option>
              <option value="api_acumulada">API Acumulado</option>
            </select>
          </div> */}
          
          <div className="filtro-grupo">
            <label>Desde:</label>
            <input 
              type="month" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)}
              className="filtro-date"
            />
          </div>
          
          <div className="filtro-grupo">
            <label>Hasta:</label>
            <input 
              type="month" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)}
              className="filtro-date"
            />
          </div>
          
          <button 
            onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
            className="filtro-limpiar"
          >
            <i className="fa fa-times"></i> Limpiar
          </button>
          
          <button 
            onClick={() => setMostrarAyuda(true)}
            className="filtro-ayuda"
            title="Mostrar ayuda sobre categorías VP"
          >
            <i className="fa fa-question-circle"></i> Ayuda
          </button>
        </div>
      </div>

      

       {/* KPIs Principales */}
       <div className="kpis-container">
        <div className="kpi-card kpi-total">
          {/* Botón de información */}
          <button 
            className="kpi-info-btn"
            onClick={(e) => handleInfoClick('total', e)}
            title="Ver información detallada"
          >
            <i className="fa fa-search"></i>
          </button>
          
          
          
          <div className="kpi-icon">
            <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>US</span>
          </div>
          <div className="kpi-content">
            <h3>Total Ejecutado</h3>
            <div className="kpi-valor">{formatearMonedaUSD(kpis.totalEjecutado)}</div>
            <div className="kpi-subtitle">(Real Parcial - Acumulado)</div>
          </div>
          

        </div>

        <div className="kpi-card kpi-presupuesto">
          {/* Botón de información */}
          <button 
            className="kpi-info-btn"
            onClick={(e) => handleInfoClick('presupuesto', e)}
            title="Ver información detallada"
          >
            <i className="fa fa-search"></i>
          </button>
          
          <div className="kpi-icon">
            <i className="fa fa-dollar-sign"></i>
          </div>
          <div className="kpi-content">
            <h3>Presupuesto</h3>
            <div className="kpi-valor">{formatearMonedaUSD(kpis.presupuesto)}</div>
            <div className="kpi-subtitle">(Presupuesto Total)</div>
          </div>
        </div>

        <div className="kpi-card kpi-variacion">
          {/* Botón de información */}
          <button 
            className="kpi-info-btn"
            onClick={(e) => handleInfoClick('variacion', e)}
            title="Ver información detallada"
          >
            <i className="fa fa-search"></i>
          </button>
          
          <div className="kpi-icon">
            <i className="fa fa-chart-line"></i>
          </div>
          <div className="kpi-content">
            <h3>Variación</h3>
            <div className={`kpi-valor ${kpis.variacion >= 0 ? 'positivo' : 'negativo'}`}>
              {kpis.variacion >= 0 ? '+' : ''}{formatearMonedaUSD(kpis.variacion)}
            </div>
            <div className="kpi-subtitle">(Diferencia vs Presupuesto)</div>
          </div>
        </div>

        <div className="kpi-card kpi-eficiencia">
          {/* Botón de información */}
          <button 
            className="kpi-info-btn"
            onClick={(e) => handleInfoClick('eficiencia', e)}
            title="Ver información detallada"
          >
            <i className="fa fa-search"></i>
          </button>
          
          <div className="kpi-icon">
            <i className="fa fa-percentage"></i>
          </div>
          <div className="kpi-content">
            <h3>Eficiencia</h3>
            <div className="kpi-valor">{kpis.eficiencia.toFixed(1)}%</div>
            <div className="kpi-subtitle">(Cumplimiento del Presupuesto)</div>
          </div>
        </div>

      </div>

      {/* POPUPS FUERA DE LAS TARJETAS KPI - ESQUINA INFERIOR IZQUIERDA */}
      {popupActivo === 'total' && popupActivo !== null && (
        <div
          className="kpi-popup-forzado"
          style={{
            position: 'fixed !important',
            bottom: '2rem !important',
            left: '2rem !important',
            top: 'auto !important',
            right: 'auto !important',
            transform: 'none !important',
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            zIndex: 999999,
            minWidth: '320px',
            maxWidth: '400px',
            border: '1px solid rgba(10, 110, 189, 0.3)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(10, 110, 189, 0.1)',
            backdropFilter: 'blur(10px)',
            animation: 'popupFadeIn 0.3s ease'
          }}
        >
          <div style={{marginBottom: '1rem'}}>
            <h4 style={{
              margin: '0 0 0.75rem 0',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              paddingBottom: '0.5rem'
            }}>
              <span style={{marginRight: '0.5rem', color: '#0a6ebd', fontWeight: 'bold'}}>US</span>
              Total Ejecutado
            </h4>
            <p style={{
              margin: '0 0 1rem 0',
              lineHeight: '1.5',
              fontSize: '0.9rem',
              color: '#e0e0e0'
            }}>
              Suma de todos los montos registrados en <strong>Real Parcial</strong>. Este valor siempre representa el gasto real ejecutado del proyecto.
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Valor actual:</span>
              <span style={{fontSize: '0.9rem', color: '#fff', fontWeight: '600'}}>{formatearMonedaUSD(kpis.totalEjecutado)}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Años:</span>
              <span style={{fontSize: '0.9rem', color: '#fff', fontWeight: '600'}}>{contarAnosUnicos(datosVisualizacion.datosVector)} años</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Periodos:</span>
              <span style={{fontSize: '0.9rem', color: '#fff', fontWeight: '600'}}>{contarPeriodosMensuales(datosVisualizacion.datosVector)} meses</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Vector:</span>
              <span style={{fontSize: '0.9rem', color: '#0a6ebd', fontWeight: '600'}}>Real Parcial</span>
            </div>
          </div>
        </div>
      )}

      {popupActivo === 'presupuesto' && (
        <div
          className="kpi-popup-forzado"
          style={{
            position: 'fixed !important',
            bottom: '2rem !important',
            left: '2rem !important',
            top: 'auto !important',
            right: 'auto !important',
            transform: 'none !important',
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            zIndex: 999999,
            minWidth: '320px',
            maxWidth: '400px',
            border: '1px solid rgba(10, 110, 189, 0.3)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(10, 110, 189, 0.1)',
            backdropFilter: 'blur(10px)',
            animation: 'popupFadeIn 0.3s ease'
          }}
        >
          <div style={{marginBottom: '1rem'}}>
            <h4 style={{
              margin: '0 0 0.75rem 0',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              paddingBottom: '0.5rem'
            }}>
              <i className="fa fa-chart-bar" style={{marginRight: '0.5rem', color: '#0a6ebd'}}></i>
              Presupuesto
            </h4>
            <p style={{
              margin: '0 0 1rem 0',
              lineHeight: '1.5',
              fontSize: '0.9rem',
              color: '#e0e0e0'
            }}>
              Total del <strong>{kpis.nombrePresupuesto}</strong> seleccionado. Este valor sirve como referencia para medir el desempeño financiero comparado con el gasto real ejecutado.
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Valor actual:</span>
              <span style={{fontSize: '0.9rem', color: '#fff', fontWeight: '600'}}>{formatearMonedaUSD(kpis.presupuesto)}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Tipo:</span>
              <span style={{fontSize: '0.9rem', color: '#0a6ebd', fontWeight: '600'}}>{kpis.nombrePresupuesto}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Años:</span>
              <span style={{fontSize: '0.9rem', color: '#fff', fontWeight: '600'}}>{contarAnosUnicos(datosVisualizacion.datosVector)} años</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Periodos:</span>
              <span style={{fontSize: '0.9rem', color: '#fff', fontWeight: '600'}}>{contarPeriodosMensuales(datosVisualizacion.datosVector)} meses</span>
            </div>
          </div>
        </div>
      )}

      {popupActivo === 'variacion' && (
        <div
          className="kpi-popup-forzado"
          style={{
            position: 'fixed !important',
            bottom: '2rem !important',
            left: '2rem !important',
            top: 'auto !important',
            right: 'auto !important',
            transform: 'none !important',
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            zIndex: 999999,
            minWidth: '320px',
            maxWidth: '400px',
            border: '1px solid rgba(10, 110, 189, 0.3)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(10, 110, 189, 0.1)',
            backdropFilter: 'blur(10px)',
            animation: 'popupFadeIn 0.3s ease'
          }}
        >
          <div style={{marginBottom: '1rem'}}>
            <h4 style={{
              margin: '0 0 0.75rem 0',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              paddingBottom: '0.5rem'
            }}>
              <i className="fa fa-percentage" style={{marginRight: '0.5rem', color: '#0a6ebd'}}></i>
              Variación
            </h4>
            <p style={{
              margin: '0 0 1rem 0',
              lineHeight: '1.5',
              fontSize: '0.9rem',
              color: '#e0e0e0'
            }}>
              Diferencia porcentual entre el <strong>Presupuesto ({kpis.nombrePresupuesto})</strong> y el <strong>Total Ejecutado (Real Parcial)</strong>.
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Variación actual:</span>
              <span style={{
                fontSize: '0.9rem',
                color: kpis.variacion >= 0 ? '#4CAF50' : '#f44336',
                fontWeight: '600'
              }}>
                {kpis.variacion >= 0 ? '+' : ''}{kpis.variacion.toFixed(1)}%
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Interpretación:</span>
              <span style={{
                fontSize: '0.85rem',
                color: kpis.variacion >= 0 ? '#4CAF50' : '#f44336',
                fontWeight: '500'
              }}>
                {kpis.variacion >= 0 ? 'Favorable' : 'Requiere atención'}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Fórmula:</span>
              <span style={{fontSize: '0.8rem', color: '#0a6ebd', fontWeight: '500'}}>((Presupuesto - Ejecutado) / Presupuesto) × 100</span>
            </div>
          </div>
        </div>
      )}

      {popupActivo === 'eficiencia' && (
        <div
          className="kpi-popup-forzado"
          style={{
            position: 'fixed !important',
            bottom: '2rem !important',
            left: '2rem !important',
            top: 'auto !important',
            right: 'auto !important',
            transform: 'none !important',
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            zIndex: 999999,
            minWidth: '320px',
            maxWidth: '400px',
            border: '1px solid rgba(10, 110, 189, 0.3)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(10, 110, 189, 0.1)',
            backdropFilter: 'blur(10px)',
            animation: 'popupFadeIn 0.3s ease'
          }}
        >
          <div style={{marginBottom: '1rem'}}>
            <h4 style={{
              margin: '0 0 0.75rem 0',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              paddingBottom: '0.5rem'
            }}>
              <i className="fa fa-tachometer-alt" style={{marginRight: '0.5rem', color: '#0a6ebd'}}></i>
              Eficiencia
            </h4>
            <p style={{
              margin: '0 0 1rem 0',
              lineHeight: '1.5',
              fontSize: '0.9rem',
              color: '#e0e0e0'
            }}>
              Indicador de rendimiento basado en la variación. Mide qué tan bien se están utilizando los recursos financieros comparado con el presupuesto <strong>({kpis.nombrePresupuesto})</strong>.
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Eficiencia actual:</span>
              <span style={{
                fontSize: '0.9rem',
                color: kpis.eficiencia >= 100 ? '#4CAF50' : '#f44336',
                fontWeight: '600'
              }}>
                {kpis.eficiencia.toFixed(1)}%
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Interpretación:</span>
              <span style={{
                fontSize: '0.85rem',
                color: kpis.eficiencia >= 100 ? '#4CAF50' : '#f44336',
                fontWeight: '500'
              }}>
                {kpis.eficiencia >= 100 ? 'Excelente gestión' : 'Requiere optimización'}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(10, 110, 189, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(10, 110, 189, 0.2)'
            }}>
              <span style={{fontSize: '0.85rem', color: '#ccc', fontWeight: '500'}}>Fórmula:</span>
              <span style={{fontSize: '0.8rem', color: '#0a6ebd', fontWeight: '500'}}>100% + Variación (mínimo 0%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos y Visualizaciones */}
      <div className="graficos-container">
                 {/* Distribución por Categoría VP */}
         <div className="grafico-card">
           <h3><i className="fa fa-pie-chart"></i> Distribución por Categoría VP - REAL PARCIAL vs API PARCIAL</h3>
           
           {/* Gráfico de Barras */}
           <div className="distribucion-vp">
             {(() => {
               // Calcular distribución API PARCIAL
               const datosApiParcial = datos.api_parcial || [];
               const datosApiFiltrados = obtenerDatosFiltrados(datosApiParcial);
               const distribucionApi = calcularDistribucionVPCorrecta(datosApiFiltrados, 'api_parcial', datos);
               const totalApi = Object.values(distribucionApi).reduce((sum, valor) => sum + valor, 0);
               
               // Log para verificar los valores de distribución
               console.log('=== DISTRIBUCIÓN VP ===');
               console.log('Total REAL PARCIAL:', datosVisualizacion.total);
               console.log('Total API PARCIAL:', totalApi);
               
               return Object.entries(datosVisualizacion.distribucion).map(([categoria, monto]) => {
                 const porcentaje = (monto / datosVisualizacion.total) * 100;
                 const categoriaInfo = categoriasVP[categoria] || { nombre: categoria, color: '#666', descripcion: 'Categoría no definida' };
                 
                 // Obtener datos API para la misma categoría
                 const montoApi = distribucionApi[categoria] || 0;
                 const porcentajeApi = (montoApi / totalApi) * 100;
               
               return (
                 <div 
                   key={categoria} 
                   className="categoria-item"
                   onClick={() => {
                     setCategoriaSeleccionada(categoria);
                     setMostrarAyuda(true);
                   }}
                   style={{ cursor: 'pointer' }}
                   data-tooltip={`${categoriaInfo.nombre} (${categoria}): ${categoriaInfo.descripcion} | Real: ${formatearMonedaUSD(monto)} (${porcentaje.toFixed(1)}%) | API: ${formatearMonedaUSD(montoApi)} (${porcentajeApi.toFixed(1)}%) | Haz clic para ver detalles`}
                 >
                   <div style={{ marginBottom: '15px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                     {/* Título de la categoría */}
                     <div style={{ 
                       fontSize: '14px', 
                       fontWeight: 'bold', 
                       color: '#2c3e50', 
                       marginBottom: '10px',
                       display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'center'
                     }}>
                       <span>{categoriaInfo.nombre} ({categoria})</span>
                       {/* Banderita de comparación */}
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center',
                         gap: '4px'
                       }}>
                         {(() => {
                           const comparacion = monto > montoApi ? (
                             <div style={{ 
                               display: 'flex', 
                               alignItems: 'center',
                               gap: '4px',
                               padding: '2px 6px',
                               background: '#fff5f5',
                               border: '1px solid #f56565',
                               borderRadius: '4px'
                             }}>
                               <i className="fa fa-flag" style={{ color: '#e53e3e', fontSize: '12px' }}></i>
                               <span style={{ color: '#e53e3e', fontSize: '10px', fontWeight: 'bold' }}>SOBRECOSTO</span>
                             </div>
                           ) : monto < montoApi ? (
                             <div style={{ 
                               display: 'flex', 
                               alignItems: 'center',
                               gap: '4px',
                               padding: '2px 6px',
                               background: '#f0fff4',
                               border: '1px solid #38a169',
                               borderRadius: '4px'
                             }}>
                               <i className="fa fa-flag" style={{ color: '#38a169', fontSize: '12px' }}></i>
                               <span style={{ color: '#38a169', fontSize: '10px', fontWeight: 'bold' }}>DENTRO DE LO PLANIFICADO</span>
                             </div>
                           ) : null;
                           return comparacion;
                         })()}
                       </div>
                     </div>

                     {/* Real Parcial */}
                     <div style={{ marginBottom: '10px', paddingLeft: '8px' }}>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'space-between',
                         marginBottom: '4px'
                       }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <i className="fa fa-chart-line" style={{ color: '#1976d2', fontSize: '12px' }}></i>
                           <span style={{ 
                             color: '#1976d2', 
                             fontWeight: '600', 
                             fontSize: '12px'
                           }}>Real Parcial</span>
                         </div>
                         <span style={{ 
                           color: '#1976d2', 
                           fontWeight: 'bold',
                           fontSize: '12px'
                         }}>
                           {formatearMonedaUSD(monto)} ({porcentaje.toFixed(1)}%)
                         </span>
                       </div>
                       <div style={{ fontSize: '11px', color: '#666', marginLeft: '18px', marginBottom: '4px' }}>
                         (monto gastado a la fecha)
                       </div>
                       {/* Barra de progreso REAL PARCIAL */}
                       <div style={{ 
                         marginLeft: '18px',
                         width: 'calc(100% - 18px)', 
                         height: '8px', 
                         background: '#e3f2fd', 
                         borderRadius: '4px', 
                         overflow: 'hidden',
                         border: '1px solid #1976d2'
                       }}>
                         <div 
                           style={{ 
                             width: `${porcentaje}%`, 
                             background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                             height: '100%',
                             borderRadius: '3px',
                             boxShadow: '0 1px 3px rgba(25, 118, 210, 0.3)'
                           }}
                         ></div>
                       </div>
                     </div>

                     {/* API Parcial */}
                     <div style={{ paddingLeft: '8px' }}>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'space-between',
                         marginBottom: '4px'
                       }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <i className="fa fa-project-diagram" style={{ color: '#009639', fontSize: '12px' }}></i>
                           <span style={{ 
                             color: '#009639', 
                             fontWeight: '600', 
                             fontSize: '12px'
                           }}>API Parcial</span>
                         </div>
                         <span style={{ 
                           color: '#009639', 
                           fontWeight: 'bold',
                           fontSize: '12px'
                         }}>
                           {formatearMonedaUSD(montoApi)} ({porcentajeApi.toFixed(1)}%)
                         </span>
                       </div>
                       <div style={{ fontSize: '11px', color: '#666', marginLeft: '18px', marginBottom: '4px' }}>
                         (monto gastado a la fecha)
                       </div>
                       {/* Barra de progreso API PARCIAL */}
                       <div style={{ 
                         marginLeft: '18px',
                         width: 'calc(100% - 18px)', 
                         height: '8px', 
                         background: '#e8f5e8', 
                         borderRadius: '4px', 
                         overflow: 'hidden',
                         border: '1px solid #009639'
                       }}>
                         <div 
                           style={{ 
                             width: `${porcentajeApi}%`, 
                             background: 'linear-gradient(90deg, #009639 0%, #4caf50 100%)',
                             height: '100%',
                             borderRadius: '3px',
                             boxShadow: '0 1px 3px rgba(0, 150, 57, 0.3)'
                           }}
                         ></div>
                       </div>
                     </div>
                   </div>
            </div>
          );
        });
               })()}
      </div>


         </div>

        {/* Cuadro de Calor por Mes */}
        <div className="grafico-card">
          <h3><i className="fa fa-calendar-alt"></i> Evolución Mensual - {vectorSeleccionado.replace('_', ' ').toUpperCase()}</h3>
          <div className="heatmap-container">
            {(() => {
              // Usar datos filtrados si hay filtro de fecha, si no, usar todos los datos
              const hayFiltroFecha = fechaDesde || fechaHasta;
              const datosParaHeatmap = hayFiltroFecha ? datosVisualizacion.datosVector : (datos[vectorSeleccionado] || []);
              const meses = procesarDatosHeatmap(datosParaHeatmap, datosVisualizacion.esAcumulado);
              
              const maxMonto = Math.max(...Object.values(meses));
              
              // Ordenar los meses cronológicamente (desde el inicio hacia el final)
              const mesesOrdenados = Object.entries(meses).sort(([mesA], [mesB]) => {
                const fechaA = new Date(mesA + '-01');
                const fechaB = new Date(mesB + '-01');
                return fechaA - fechaB;
              });
              
              return (
                <div className="heatmap">
                  {mesesOrdenados.map(([mes, monto]) => {
                    const intensidad = (monto / maxMonto) * 100;
                    
                    // Crear degradado basado en el color de Codelco
                    const colorClaro = '#E0FFFF'; // Light Cyan (muy claro)
                    const colorMedioClaro = '#B0E0E6'; // Powder Blue
                    const colorMedio = '#20B2AA'; // Light Sea Green (color base de Codelco)
                    const colorMedioOscuro = '#008B8B'; // Dark Cyan
                    const colorOscuro = '#006666'; // Dark Sea Green
                    
                    // Crear gradiente dinámico basado en la intensidad
                    let gradiente;
                    let colorTexto;
                    
                    if (intensidad < 25) {
                      gradiente = `linear-gradient(135deg, ${colorClaro} 0%, ${colorMedioClaro} 100%)`;
                      colorTexto = '#2c3e50'; // Texto oscuro para fondos muy claros
                    } else if (intensidad < 45) {
                      gradiente = `linear-gradient(135deg, ${colorMedioClaro} 0%, ${colorMedio} 100%)`;
                      colorTexto = '#2c3e50'; // Texto oscuro para fondos claros
                    } else if (intensidad < 65) {
                      gradiente = `linear-gradient(135deg, ${colorMedio} 0%, ${colorMedioOscuro} 100%)`;
                      colorTexto = '#ffffff'; // Texto blanco para fondos medios
                    } else if (intensidad < 85) {
                      gradiente = `linear-gradient(135deg, ${colorMedioOscuro} 0%, ${colorOscuro} 100%)`;
                      colorTexto = '#ffffff'; // Texto blanco para fondos oscuros
                    } else {
                      gradiente = `linear-gradient(135deg, ${colorOscuro} 0%, #004d4d 100%)`;
                      colorTexto = '#e0e0e0'; // Texto gris claro para fondos muy oscuros
                    }
                    
                    return (
                      <div 
                        key={mes} 
                        className="heatmap-cell" 
                        style={{ 
                          background: gradiente,
                          border: intensidad > 80 ? '2px solid #004d4d' : '1px solid rgba(32, 178, 170, 0.2)',
                          color: colorTexto
                        }}
                        data-tooltip={`${mes}: ${formatearMonedaUSD(monto)}${cumplimientoFisico[mes] ? ` | Avance físico REAL Parcial: ${cumplimientoFisico[mes].parcial.toFixed(2)}% | Avance físico REAL Acumulado: ${cumplimientoFisico[mes].acumulado.toFixed(2)}%` : ''}`}
                      >
                        <div className="heatmap-label">{mes}</div>
                        <div className="heatmap-valor">{formatearMonedaUSD(monto)}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

             {/* Gráfico de Línea - Evolución Mensual REAL PARCIAL - ELIMINADO */}

      {/* Panel de Ayuda */}
      {mostrarAyuda && (
        <PanelAyuda 
          categoriaSeleccionada={categoriaSeleccionada}
          onCerrar={() => setMostrarAyuda(false)}
        />
      )}

    </div>
  );
};

export default ResumenFinanciero; 