import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, APP_URL, BASE_URL } from '../config';
import { canCreateFolders, canUploadFiles, canEditFiles, canDeleteFiles, canDownloadFiles } from '../utils/permissions';
import * as XLSX from 'xlsx';

// Función para obtener el icono según el tipo de archivo
const obtenerIconoArchivo = (nombreArchivo, tipoMime) => {
  const extension = nombreArchivo.split('.').pop().toLowerCase();
  const tipo = tipoMime ? tipoMime.toLowerCase() : '';
  
  // PDF
  if (extension === 'pdf' || tipo.includes('pdf')) {
    return { icono: 'fa-file-pdf', color: '#dc3545' };
  }
  
  // Word
  if (extension === 'doc' || extension === 'docx' || tipo.includes('word') || tipo.includes('msword')) {
    return { icono: 'fa-file-word', color: '#2b579a' };
  }
  
  // Excel
  if (extension === 'xls' || extension === 'xlsx' || tipo.includes('excel') || tipo.includes('spreadsheet')) {
    return { icono: 'fa-file-excel', color: '#1d6f42' };
  }
  
  // PowerPoint
  if (extension === 'ppt' || extension === 'pptx' || tipo.includes('powerpoint') || tipo.includes('presentation')) {
    return { icono: 'fa-file-powerpoint', color: '#d04423' };
  }
  
  // Imágenes
  if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif' || extension === 'bmp' || extension === 'webp' || tipo.includes('image')) {
    return { icono: 'fa-file-image', color: '#28a745' };
  }
  
  // Video
  if (extension === 'mp4' || extension === 'avi' || extension === 'mov' || extension === 'wmv' || extension === 'flv' || tipo.includes('video')) {
    return { icono: 'fa-file-video', color: '#6f42c1' };
  }
  
  // Audio
  if (extension === 'mp3' || extension === 'wav' || extension === 'ogg' || extension === 'flac' || tipo.includes('audio')) {
    return { icono: 'fa-file-audio', color: '#ffc107' };
  }
  
  // Texto
  if (extension === 'txt' || extension === 'csv' || tipo.includes('text')) {
    return { icono: 'fa-file-alt', color: '#6c757d' };
  }
  
  // ZIP / Comprimidos
  if (extension === 'zip' || extension === 'rar' || extension === '7z' || extension === 'tar' || extension === 'gz' || tipo.includes('zip') || tipo.includes('compressed')) {
    return { icono: 'fa-file-archive', color: '#fd7e14' };
  }
  
  // Código
  if (extension === 'js' || extension === 'html' || extension === 'css' || extension === 'php' || extension === 'py' || extension === 'java' || extension === 'cpp' || extension === 'c') {
    return { icono: 'fa-file-code', color: '#17a2b8' };
  }
  
  // Por defecto: archivo genérico
  return { icono: 'fa-file', color: '#17a2b8' };
};

// Función para formatear fecha y hora
const formatearFechaHora = (fechaString) => {
  if (!fechaString) return 'Fecha no disponible';
  const fecha = new Date(fechaString);
  return fecha.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Función para formatear el último usuario que editó con fecha y hora
const formatearUltimoUsuarioEdito = (usuarioString) => {
  if (!usuarioString || usuarioString === '-') return '-';
  
  // El formato esperado es: "Nombre Usuario|YYYY-MM-DD HH:MM:SS"
  const partes = usuarioString.split('|');
  if (partes.length === 2) {
    const nombre = partes[0].trim();
    const fechaHora = partes[1].trim();
    const fechaFormateada = formatearFechaHora(fechaHora);
    return `${nombre} - ${fechaFormateada}`;
  }
  
  // Si no tiene el formato esperado, devolver tal cual (compatibilidad con datos antiguos)
  return usuarioString;
};

// Función para obtener el string del último usuario con fecha y hora
const obtenerUltimoUsuarioEditoString = (user) => {
  const nombreUsuario = user?.nombre || user?.email || 'Usuario';
  const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return `${nombreUsuario}|${fechaHora}`;
};

// Función para obtener colores variados según el nombre de la carpeta
const obtenerColoresCarpeta = (nombreCarpeta, idCarpeta, colorPrimario = null, colorSecundario = null) => {
  // Si la carpeta tiene colores personalizados, usarlos
  if (colorPrimario) {
    // Si solo hay color primario, generar el secundario automáticamente
    const secundario = colorSecundario || generarColorSecundario(colorPrimario);
    return {
      primary: colorPrimario,
      secondary: secundario,
      iconBg: 'rgba(255,255,255,0.25)'
    };
  }
  
  // Paleta de colores profesionales y vibrantes (fallback automático)
  const paletaColores = [
    // Naranjas y rojos
    { primary: '#FF6B35', secondary: '#FF8C5A', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#F77F00', secondary: '#FCBF49', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#E63946', secondary: '#F77F00', iconBg: 'rgba(255,255,255,0.25)' },
    // Azules y teal
    { primary: '#06A77D', secondary: '#0AD3A3', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#118AB2', secondary: '#06D6A0', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#073B4C', secondary: '#118AB2', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#1A659E', secondary: '#4A90E2', iconBg: 'rgba(255,255,255,0.25)' },
    // Morados y púrpuras
    { primary: '#7209B7', secondary: '#B5179E', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#560BAD', secondary: '#7209B7', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#6A4C93', secondary: '#9D4EDD', iconBg: 'rgba(255,255,255,0.25)' },
    // Verdes
    { primary: '#2D6A4F', secondary: '#40916C', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#06FFA5', secondary: '#38E4AE', iconBg: 'rgba(0,0,0,0.1)' },
    { primary: '#52B788', secondary: '#74C69D', iconBg: 'rgba(255,255,255,0.25)' },
    // Amarillos y dorados
    { primary: '#F2A900', secondary: '#FFC947', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#F77F00', secondary: '#FCBF49', iconBg: 'rgba(255,255,255,0.25)' },
    // Rosas y magentas
    { primary: '#C77DFF', secondary: '#E0AAFF', iconBg: 'rgba(255,255,255,0.25)' },
    { primary: '#D90429', secondary: '#EF233C', iconBg: 'rgba(255,255,255,0.25)' },
    // Azul oscuro
    { primary: '#17a2b8', secondary: '#FF8C00', iconBg: 'rgba(255,255,255,0.25)' },
  ];

  // Generar un índice basado en el nombre y ID de la carpeta para consistencia
  const hash = (nombreCarpeta + idCarpeta.toString()).split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const index = Math.abs(hash) % paletaColores.length;
  return paletaColores[index];
};

// Función auxiliar para generar un color secundario basado en el primario
const generarColorSecundario = (colorPrimario) => {
  if (!colorPrimario || !colorPrimario.startsWith('#')) {
    return '#FFC947';
  }
  
  // Convertir HEX a RGB
  const r = parseInt(colorPrimario.slice(1, 3), 16);
  const g = parseInt(colorPrimario.slice(3, 5), 16);
  const b = parseInt(colorPrimario.slice(5, 7), 16);
  
  // Aclarar el color (aumentar brillo en ~30%)
  const nuevoR = Math.min(255, Math.floor(r + (255 - r) * 0.3));
  const nuevoG = Math.min(255, Math.floor(g + (255 - g) * 0.3));
  const nuevoB = Math.min(255, Math.floor(b + (255 - b) * 0.3));
  
  // Convertir de vuelta a HEX
  return `#${nuevoR.toString(16).padStart(2, '0')}${nuevoG.toString(16).padStart(2, '0')}${nuevoB.toString(16).padStart(2, '0')}`.toUpperCase();
};

const parseEvidenciasTexto = (texto) => {
  if (!texto) return [];
  const partes = texto
    .split(/[\r\n]+|;/)
    .map(parte => parte.trim())
    .filter(Boolean)
    .map(parte => parte.replace(/^\-\s*/, '').replace(/^\•\s*/, ''));
  return partes.length ? partes : [texto.trim()];
};

const pestañasGenerales = ['guia', 'riesgo', 'bowtie', 'linea_base', 'archivos', 'foro', 'tareas'];
const pestañasTerceraCascada = ['bowtie', 'linea_base', 'archivos', 'foro', 'tareas'];

// Función auxiliar para verificar si el usuario puede editar análisis Bowtie
// admin solo puede editar en nivel 2, super_admin puede editar en todos los niveles
const puedeEditarBowtie = (user, rutaNavegacion) => {
  if (!user) return false;
  if (user.rol === 'super_admin') return true;
  if (user.rol === 'admin' && rutaNavegacion.length === 2) return true; // Solo nivel 2
  return false;
};

const GestorArchivos = ({ proyectoId, centroCostoId, carpetaId, user, sidebarCollapsed }) => {
  // Debug: Verificar permisos del usuario
  useEffect(() => {
    if (user) {
      console.log('🔍 [DEBUG] Usuario actual:', user);
      console.log('🔍 [DEBUG] Rol del usuario:', user.rol);
      console.log('🔍 [DEBUG] canEditFiles:', canEditFiles(user));
      console.log('🔍 [DEBUG] canDeleteFiles:', canDeleteFiles(user));
      console.log('🔍 [DEBUG] canCreateFolders:', canCreateFolders(user));
    }
  }, [user]);
  
  const [carpetas, setCarpetas] = useState([]);
  const [carpetaActual, setCarpetaActual] = useState(null); // Carpeta seleccionada
  const [promediosPonderacion, setPromediosPonderacion] = useState({}); // { carpeta_id: promedio }
  const [promedioPonderacionActual, setPromedioPonderacionActual] = useState(null); // Promedio de la carpeta actual
  const [usuariosParticipantesCarpeta, setUsuariosParticipantesCarpeta] = useState([]); // Usuarios asignados a la carpeta actual (para select lists)
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrearCarpeta, setModalCrearCarpeta] = useState(false);
  const [modalAsignarUsuario, setModalAsignarUsuario] = useState(null);
  const [modalEditarCarpeta, setModalEditarCarpeta] = useState(null);
  const [archivoPreview, setArchivoPreview] = useState(null); // Archivo para previsualizar
  const [pdfError, setPdfError] = useState(false); // Error al cargar PDF
  const [pdfPages, setPdfPages] = useState([]); // Páginas del PDF renderizadas
  const [pdfLoading, setPdfLoading] = useState(false); // Estado de carga del PDF
  const [pdfViewUrl, setPdfViewUrl] = useState(null); // URL efectiva del PDF en preview
  const [previewMaximizado, setPreviewMaximizado] = useState(false); // Estado para maximizar previsualización
  const [uploadProgress, setUploadProgress] = useState(null); // { archivo: nombre, progreso: 0-100, estado: 'subiendo'|'completado'|'error' }
  const [archivosSubiendo, setArchivosSubiendo] = useState([]); // Lista de archivos en proceso de subida
  const [pestañaActiva, setPestañaActiva] = useState('guia');
  const [informacionRiesgo, setInformacionRiesgo] = useState(null);
  const [editandoRiesgo, setEditandoRiesgo] = useState(false);
  const [analisisBowtie, setAnalisisBowtie] = useState(null);
  const [cargandoBowtie, setCargandoBowtie] = useState(false);
  const [mostrarGuiaBowtie, setMostrarGuiaBowtie] = useState(true);
  const [guiaBowtieMinimizada, setGuiaBowtieMinimizada] = useState(true);
  const [guardandoBowtie, setGuardandoBowtie] = useState(false);
  const [guardandoCausas, setGuardandoCausas] = useState(false);
  const [guardandoConsecuencias, setGuardandoConsecuencias] = useState(false);
  const [guardandoControlesPreventivos, setGuardandoControlesPreventivos] = useState(false);
  const [guardandoControlesMitigadores, setGuardandoControlesMitigadores] = useState(false);
  const [guardandoControlesPreventivosGenerales, setGuardandoControlesPreventivosGenerales] = useState(false);
  const [guardandoControlesMitigadoresGenerales, setGuardandoControlesMitigadoresGenerales] = useState(false);
  const [causasEditando, setCausasEditando] = useState(new Set()); // IDs de causas en modo edición
  const [consecuenciasEditando, setConsecuenciasEditando] = useState(new Set()); // IDs de consecuencias en modo edición
  const [controlesPreventivosEditando, setControlesPreventivosEditando] = useState(new Set()); // IDs de controles preventivos en modo edición
  const [controlesMitigadoresEditando, setControlesMitigadoresEditando] = useState(new Set()); // IDs de controles mitigadores en modo edición
  const [controlesPreventivosGeneralesEditando, setControlesPreventivosGeneralesEditando] = useState(new Set()); // IDs de controles preventivos generales en modo edición
  const [controlesMitigadoresGeneralesEditando, setControlesMitigadoresGeneralesEditando] = useState(new Set()); // IDs de controles mitigadores generales en modo edición
  const [tablasBowtieMinimizadas, setTablasBowtieMinimizadas] = useState({
    causas: false,
    consecuencias: false,
    controles_preventivos_criticos: false,
    controles_preventivos_generales: false,
    controles_mitigadores_criticos: false,
    controles_mitigadores_generales: false
  });
  const [lineaBase, setLineaBase] = useState([]);
  const [cargandoLineaBase, setCargandoLineaBase] = useState(false);
  const [guardandoLineaBase, setGuardandoLineaBase] = useState(false);
  const [lineaBaseEditando, setLineaBaseEditando] = useState(new Set());
  const [lineaBaseMitigadores, setLineaBaseMitigadores] = useState([]);
  const [cargandoLineaBaseMitigadores, setCargandoLineaBaseMitigadores] = useState(false);
  const [guardandoLineaBaseMitigadores, setGuardandoLineaBaseMitigadores] = useState(false);
  const [lineaBaseMitigadoresEditando, setLineaBaseMitigadoresEditando] = useState(new Set());
  const [modalDimensionesPreventivo, setModalDimensionesPreventivo] = useState(null); // { controlId, controlIndex, tipo: 'preventivo' }
  const [modalDimensionesMitigador, setModalDimensionesMitigador] = useState(null); // { controlId, controlIndex, tipo: 'mitigador' }
  const [modalVerDimensiones, setModalVerDimensiones] = useState(null); // { control, tipo: 'preventivo' | 'mitigador' } - Solo lectura
  const [filtroTipoDimension, setFiltroTipoDimension] = useState('TODAS');
  const [editandoTabla, setEditandoTabla] = useState({
    evento_no_deseado: false,
    evento_riesgo: false,
    supervisor_preventivo: false,
    supervisor_mitigador: false,
    trabajador_preventivo: false,
    trabajador_mitigador: false,
    informacion_riesgo: false
  });
  const [mensajesForo, setMensajesForo] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [mensajeRespondiendo, setMensajeRespondiendo] = useState(null);
  const [respuestaMensaje, setRespuestaMensaje] = useState('');
  const [respuestasAbiertas, setRespuestasAbiertas] = useState({}); // { mensajeId: textoRespuesta }
  const [tareas, setTareas] = useState([]);
  const [modalCrearTarea, setModalCrearTarea] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    descripcion: '',
    asignados_a: [], // Array de IDs de usuarios asignados
    fecha_vencimiento: '',
    prioridad: 'media',
    recordatorio_en: ''
  });
  const [comentariosTarea, setComentariosTarea] = useState({}); // { tareaId: [comentarios] }
  const [nuevoComentario, setNuevoComentario] = useState({}); // { tareaId: texto }
  const [tareaExpandida, setTareaExpandida] = useState(null); // ID de la tarea expandida para ver comentarios
  const [adjuntosTarea, setAdjuntosTarea] = useState({}); // { tareaId: [adjuntos] }
  const [subiendoAdjunto, setSubiendoAdjunto] = useState({}); // { tareaId: boolean }
  const [modalInvitarUsuarioTarea, setModalInvitarUsuarioTarea] = useState(null); // { tareaId: ID de la tarea }
  const [modalVerParticipantes, setModalVerParticipantes] = useState(false); // Modal para ver participantes
  const [participantesCarpeta, setParticipantesCarpeta] = useState([]); // Lista de participantes de la carpeta
  const [cargandoParticipantes, setCargandoParticipantes] = useState(false); // Estado de carga de participantes
  const [modalValidacionObservacion, setModalValidacionObservacion] = useState(null); // { itemIndex, tipo: 'preventivo'|'mitigador', item }
  const [notificaciones, setNotificaciones] = useState([]); // Array de notificaciones toast
  
  // Función para mostrar notificaciones toast
  const mostrarNotificacion = (mensaje, tipo = 'success', duracion = 3000) => {
    const id = Date.now() + Math.random();
    const nuevaNotificacion = {
      id,
      mensaje,
      tipo, // 'success', 'error', 'warning', 'info'
      duracion
    };
    
    setNotificaciones(prev => [...prev, nuevaNotificacion]);
    
    // Auto-eliminar después de la duración
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, duracion);
    
    return id;
  };
  
  // Cargar PDF cuando cambia el archivo a previsualizar o cuando cambia el estado de maximizado
  useEffect(() => {
    if (archivoPreview) {
      const extension = archivoPreview.nombre_original.split('.').pop().toLowerCase();
      const tipoMime = archivoPreview.tipo_mime || '';
      
      if (extension === 'pdf' || tipoMime.includes('pdf')) {
        // Construir URL completa para el endpoint de visualización
        let resolvedPdfUrl;
        if (process.env.NODE_ENV === 'development') {
          resolvedPdfUrl = `http://localhost/rcritico/api/view_pdf.php?id=${archivoPreview.id}`;
        } else {
          resolvedPdfUrl = `${API_BASE}/view_pdf.php?id=${archivoPreview.id}`;
        }
        setPdfViewUrl(resolvedPdfUrl);
        console.log('Cargando PDF desde:', resolvedPdfUrl);
        // Recargar PDF cuando cambia el estado de maximizado para aplicar nueva escala
        cargarPDF(resolvedPdfUrl);
      } else {
        setPdfViewUrl(null);
        setPdfPages([]);
        setPdfLoading(false);
        setPdfError(false);
      }
    } else {
      // Resetear estado de maximizado cuando se cierra el preview
      setPreviewMaximizado(false);
      setPdfViewUrl(null);
    }
  }, [archivoPreview?.id, previewMaximizado]);
  
  // Función para cargar PDF con PDF.js
  const cargarPDF = (pdfUrl) => {
    if (!window.pdfjsLib) {
      setPdfError('PDF.js no está cargado. Recarga la página.');
      setPdfLoading(false);
      return;
    }
    
    setPdfLoading(true);
    setPdfError(null);
    setPdfPages([]);
    
    // Configurar worker de PDF.js
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Configurar opciones de carga (sin headers CORS - esos son del servidor)
    const loadingTask = window.pdfjsLib.getDocument({
      url: pdfUrl,
      withCredentials: false
    });
    
    // Cargar el PDF
    loadingTask.promise
      .then((pdf) => {
        const numPages = pdf.numPages;
        
        // Renderizar todas las páginas
        const renderPromises = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          renderPromises.push(
            pdf.getPage(pageNum).then((page) => {
              // Usar escala mayor cuando está maximizado para mejor calidad
              const scale = previewMaximizado ? 2.0 : 1.5;
              const viewport = page.getViewport({ scale: scale });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              const renderContext = {
                canvasContext: context,
                viewport: viewport
              };
              
              return page.render(renderContext).promise.then(() => {
                // Retornar solo los datos necesarios, no el canvas directamente
                return { 
                  pageNum,
                  width: canvas.width,
                  height: canvas.height,
                  canvasData: canvas // Guardar referencia al canvas
                };
              });
            })
          );
        }
        
        return Promise.all(renderPromises);
      })
      .then((renderedPages) => {
        setPdfPages(renderedPages);
        setPdfLoading(false);
      })
      .catch((error) => {
        console.error('Error cargando PDF:', error);
        console.error('URL intentada:', pdfUrl);
        let errorMessage = 'Error al cargar el PDF';
        if (error.message) {
          errorMessage += ': ' + error.message;
        }
        if (error.details) {
          errorMessage += ' (' + error.details + ')';
        }
        setPdfError(errorMessage);
        setPdfLoading(false);
      });
  };
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [nuevaCarpeta, setNuevaCarpeta] = useState({
    nombre: '',
    descripcion: '',
    color_primario: '',
    color_secundario: '',
    icono_url: ''
  });
  const [iconoPreview, setIconoPreview] = useState(null); // Preview del icono seleccionado
const [rutaNavegacion, setRutaNavegacion] = useState([]); // Breadcrumb
const [modalEliminacionExito, setModalEliminacionExito] = useState(null); // { nombre, archivos, subcarpetas }

const usaPestañasReducidas = rutaNavegacion.length >= 2;
const pestañasDisponibles = usaPestañasReducidas ? pestañasTerceraCascada : pestañasGenerales;

const aplicarAnalisisBowtie = (analisis) => {
  setAnalisisBowtie(analisis);
  setCausasEditando(new Set());
  setConsecuenciasEditando(new Set());
  setControlesPreventivosEditando(new Set());
  setControlesMitigadoresEditando(new Set());
  setControlesPreventivosGeneralesEditando(new Set());
  setControlesMitigadoresGeneralesEditando(new Set());
};

useEffect(() => {
  if (!carpetaActual) return;
  const pestañasPermitidas = usaPestañasReducidas ? pestañasTerceraCascada : pestañasGenerales;
  if (!pestañasPermitidas.includes(pestañaActiva)) {
    setPestañaActiva(usaPestañasReducidas ? 'bowtie' : 'guia');
  }
}, [carpetaActual, usaPestañasReducidas, pestañaActiva]);

  useEffect(() => {
    cargarCarpetas();
    cargarUsuarios();
  }, [proyectoId, centroCostoId, carpetaActual]);

  // Cargar promedio de ponderación de la carpeta actual cuando cambia (solo nivel 2)
  useEffect(() => {
    const cargarPromedioActual = async () => {
      // Solo cargar promedio si estamos en nivel 2
      if (carpetaActual && carpetaActual.id && rutaNavegacion.length === 2) {
        try {
          const res = await fetch(`${API_BASE}/archivos/promedio_ponderacion.php?carpeta_id=${carpetaActual.id}`);
          const data = await res.json();
          if (data.success) {
            setPromedioPonderacionActual(data.promedio_general);
          } else {
            setPromedioPonderacionActual(null);
          }
        } catch (error) {
          console.error('Error cargando promedio de ponderación:', error);
          setPromedioPonderacionActual(null);
        }
      } else {
        setPromedioPonderacionActual(null);
      }
    };
    
    cargarPromedioActual();
  }, [carpetaActual, rutaNavegacion.length]);

  // Cargar usuarios participantes de la carpeta actual cuando estamos en nivel 2
  useEffect(() => {
    const cargarUsuariosParticipantes = async () => {
      // Solo cargar usuarios si estamos en nivel 2
      if (carpetaActual && carpetaActual.id && rutaNavegacion.length === 2) {
        try {
          const res = await fetch(`${API_BASE}/archivos/carpeta_usuarios.php?carpeta_id=${carpetaActual.id}`);
          if (res.ok) {
            const data = await res.json();
            setUsuariosParticipantesCarpeta(Array.isArray(data) ? data : []);
          } else {
            setUsuariosParticipantesCarpeta([]);
          }
        } catch (error) {
          console.error('Error cargando usuarios participantes:', error);
          setUsuariosParticipantesCarpeta([]);
        }
      } else {
        setUsuariosParticipantesCarpeta([]);
      }
    };
    
    cargarUsuariosParticipantes();
  }, [carpetaActual, rutaNavegacion.length]);

  useEffect(() => {
    // Si se pasa carpetaId como prop, cargar la carpeta específica
    if (carpetaId && user && user.id) {
      // Verificar si la carpeta actual es diferente a la solicitada
      if (carpetaActual && carpetaActual.id === parseInt(carpetaId)) {
        // Ya está cargada la carpeta correcta, no hacer nada
        return;
      }
      
      // Cargar información de la carpeta específica usando el endpoint por ID
      fetch(`${API_BASE}/archivos/carpetas.php?id=${carpetaId}${user && user.id ? `&usuario_id=${user.id}` : ''}`)
        .then(res => {
          if (!res.ok) {
            // Si es 403 o 404, el usuario no tiene acceso
            if (res.status === 403 || res.status === 404) {
              return res.json().then(errorData => {
                const mensaje = errorData.error || 'No tienes permiso para acceder a esta carpeta. Debe ser asignado por el super administrador.';
                mostrarNotificacion(mensaje, 'error');
                return null;
              }).catch(() => {
                mostrarNotificacion('No tienes permiso para acceder a esta carpeta. Debe ser asignado por el super administrador.', 'error');
                return null;
              });
            }
            throw new Error(`Error HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (!data || data.error) {
            const mensaje = data?.error || 'No tienes permiso para acceder a esta carpeta. Debe ser asignado por el super administrador.';
            mostrarNotificacion(mensaje, 'error');
            return;
          }
          
          // La respuesta ahora es un objeto único (no un array)
          const carpeta = Array.isArray(data) ? data[0] : data;
          
          if (carpeta && carpeta.id) {
            // Construir ruta de navegación (breadcrumb) cargando carpetas padre
            const construirRutaNavegacion = async (carpetaActual) => {
              const ruta = [carpetaActual];
              let carpetaPadreId = carpetaActual.carpeta_padre_id;
              
              // Cargar carpetas padre recursivamente
              while (carpetaPadreId) {
                try {
                  const resPadre = await fetch(`${API_BASE}/archivos/carpetas.php?id=${carpetaPadreId}${user && user.id ? `&usuario_id=${user.id}` : ''}`);
                  if (resPadre.ok) {
                    const dataPadre = await resPadre.json();
                    const carpetaPadre = Array.isArray(dataPadre) ? dataPadre[0] : dataPadre;
                    if (carpetaPadre && carpetaPadre.id) {
                      ruta.unshift(carpetaPadre);
                      carpetaPadreId = carpetaPadre.carpeta_padre_id;
                    } else {
                      break;
                    }
                  } else if (resPadre.status === 403) {
                    // Si no tiene acceso a la carpeta padre, detener la construcción de la ruta
                    console.warn('No tiene acceso a la carpeta padre:', carpetaPadreId);
                    break;
                  } else {
                    break;
                  }
                } catch (error) {
                  console.error('Error cargando carpeta padre:', error);
                  break;
                }
              }
              
              setRutaNavegacion(ruta);
            };
            
            setCarpetaActual(carpeta);
            construirRutaNavegacion(carpeta);
          } else if (user.rol === 'trabajador') {
            alert('No tienes permiso para acceder a esta carpeta');
          }
        })
        .catch(error => {
          console.error('Error cargando carpeta:', error);
          if (user && user.rol === 'trabajador') {
            alert('No tienes permiso para acceder a esta carpeta');
          }
        });
    } else if (!carpetaId && carpetaActual) {
      // Si se quita el carpetaId, limpiar la carpeta actual
      setCarpetaActual(null);
      setRutaNavegacion([]);
    }
  }, [carpetaId, user, proyectoId]);

  useEffect(() => {
    if (carpetaActual) {
      // Verificar si hay una tarea específica que abrir (desde Gantt)
      const tareaIdToOpen = sessionStorage.getItem('tareaIdToOpen');
      // Verificar si hay un mensaje específico que abrir (desde ResumenComentarios)
      const mensajeIdToOpen = sessionStorage.getItem('mensajeIdToOpen');
      // Verificar si se debe abrir el foro directamente (desde ResumenComentarios - Ver historial)
      const abrirForoCarpeta = sessionStorage.getItem('abrirForoCarpeta');
      
      if (tareaIdToOpen) {
        // Cambiar a pestaña de tareas y expandir la tarea específica
        setPestañaActiva('tareas');
        // Limpiar el sessionStorage después de leerlo
        sessionStorage.removeItem('tareaIdToOpen');
      } else if (mensajeIdToOpen) {
        // Cambiar a pestaña de foro para mostrar el mensaje
        setPestañaActiva('foro');
        // Limpiar el sessionStorage después de leerlo
        sessionStorage.removeItem('mensajeIdToOpen');
      } else if (abrirForoCarpeta && parseInt(abrirForoCarpeta) === carpetaActual.id) {
        // Cambiar a pestaña de foro para ver el historial completo
        setPestañaActiva('foro');
        // Limpiar el sessionStorage después de leerlo
        sessionStorage.removeItem('abrirForoCarpeta');
      } else {
        setPestañaActiva('guia'); // Resetear a guía controles críticos al cambiar de carpeta
      }
      
      // Limpiar información de riesgo antes de cargar la nueva
      setInformacionRiesgo(null);
      setAnalisisBowtie(null);
      setLineaBase([]);
      setLineaBaseMitigadores([]);
      
      cargarArchivos(carpetaActual.id);
      cargarUsuariosAsignados(carpetaActual.id);
      cargarMensajesForo(carpetaActual.id);
      cargarTareas(carpetaActual.id);
      cargarInformacionRiesgo(carpetaActual.id);
      cargarAnalisisBowtie(carpetaActual.id).then(() => {
        // Cargar línea base después de que BOWTIE esté cargado
        // Usar un delay para asegurar que el estado de analisisBowtie esté actualizado
        setTimeout(() => {
          cargarLineaBase(carpetaActual.id);
          cargarLineaBaseMitigadores(carpetaActual.id);
        }, 500);
      });
      // Resetear estados de edición al cambiar de carpeta
      setEditandoTabla({
        evento_no_deseado: false,
        evento_riesgo: false,
        supervisor_preventivo: false,
        supervisor_mitigador: false,
        trabajador_preventivo: false,
        trabajador_mitigador: false,
        informacion_riesgo: false
      });
      // Limpiar comentarios al cambiar de carpeta
      setComentariosTarea({});
      setNuevoComentario({});
      setTareaExpandida(null);
      setAdjuntosTarea({});
      // Limpiar formularios de respuesta abiertos
      setRespuestasAbiertas({});
    } else {
      setArchivos([]);
      setUsuariosAsignados([]);
      setMensajesForo([]);
      setTareas([]);
      setComentariosTarea({});
      setNuevoComentario({});
      setTareaExpandida(null);
      setAdjuntosTarea({});
      setRespuestasAbiertas({});
    }
  }, [carpetaActual]);

  // Sincronizar línea base cuando cambien los controles preventivos en BOWTIE
  // Usar una "firma" basada solo en IDs y cantidad para evitar loops infinitos
  const controlesPreventivosFirma = useMemo(() => {
    if (!analisisBowtie || !analisisBowtie.controles_preventivos) return null;
    const ids = analisisBowtie.controles_preventivos.map(c => c.id || c.codigo || '').filter(Boolean);
    return `${ids.length}-${ids.join(',')}`;
  }, [analisisBowtie?.controles_preventivos]);

  // useEffect deshabilitado temporalmente - la carga se hace desde cargarAnalisisBowtie().then()
  // para evitar conflictos de timing
  // useEffect(() => {
  //   if (!carpetaActual || !carpetaActual.id) return;
  //   
  //   // Solo cargar línea base si analisisBowtie ya está cargado
  //   // Esto evita que se ejecute antes de que los datos estén listos
  //   if (analisisBowtie !== null && controlesPreventivosFirma !== null) {
  //     // Usar un pequeño delay para asegurar que el estado esté sincronizado
  //     const timer = setTimeout(() => {
  //       cargarLineaBase(carpetaActual.id);
  //     }, 100);
  //     
  //     return () => clearTimeout(timer);
  //   }
  // }, [controlesPreventivosFirma, carpetaActual?.id]);

  // Sincronizar línea base mitigadores cuando cambien los controles mitigadores en BOWTIE
  // Usar una "firma" basada solo en IDs y cantidad para evitar loops infinitos
  const controlesMitigadoresFirma = useMemo(() => {
    if (!analisisBowtie || !analisisBowtie.controles_mitigadores) return null;
    const ids = analisisBowtie.controles_mitigadores.map(c => c.id || c.codigo || '').filter(Boolean);
    return `${ids.length}-${ids.join(',')}`;
  }, [analisisBowtie?.controles_mitigadores]);

  useEffect(() => {
    if (!carpetaActual || !carpetaActual.id) return;
    
    if (analisisBowtie && analisisBowtie.controles_mitigadores && analisisBowtie.controles_mitigadores.length > 0) {
      // Cargar línea base existente si hay, sino crear nueva
      cargarLineaBaseMitigadores(carpetaActual.id);
    } else {
      // Si no hay controles, intentar cargar desde API directamente o limpiar
      cargarLineaBaseMitigadores(carpetaActual.id);
    }
  }, [controlesMitigadoresFirma, carpetaActual?.id]);

  // Scroll al mensaje específico cuando se carga desde ResumenComentarios
  useEffect(() => {
    const mensajeIdToOpen = sessionStorage.getItem('mensajeIdToOpen');
    if (mensajeIdToOpen && mensajesForo.length > 0 && carpetaActual) {
      const mensajeId = parseInt(mensajeIdToOpen);
      // Scroll suave hacia el mensaje después de un breve delay
      setTimeout(() => {
        const mensajeElement = document.getElementById(`mensaje-${mensajeId}`);
        if (mensajeElement) {
          mensajeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Resaltar el mensaje brevemente
          mensajeElement.style.transition = 'box-shadow 0.3s ease';
          mensajeElement.style.boxShadow = '0 0 20px rgba(23, 162, 184, 0.5)';
          setTimeout(() => {
            mensajeElement.style.boxShadow = '';
          }, 2000);
        }
      }, 500);
      // Limpiar después de usar
      sessionStorage.removeItem('mensajeIdToOpen');
    }
  }, [mensajesForo, carpetaActual]);

  // Expandir tarea específica cuando se carga desde Gantt
  useEffect(() => {
    const tareaIdToOpen = sessionStorage.getItem('tareaIdToOpen');
    if (tareaIdToOpen && tareas.length > 0 && carpetaActual) {
      const tareaId = parseInt(tareaIdToOpen);
      const tareaExiste = tareas.find(t => t.id === tareaId);
      if (tareaExiste) {
        setTareaExpandida(tareaId);
        // Cargar comentarios y adjuntos de la tarea
        cargarAdjuntosTarea(tareaId);
        // Scroll suave hacia la tarea después de un breve delay
        setTimeout(() => {
          const tareaElement = document.getElementById(`tarea-${tareaId}`);
          if (tareaElement) {
            tareaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Resaltar la tarea brevemente
            tareaElement.style.transition = 'box-shadow 0.3s ease';
            tareaElement.style.boxShadow = '0 0 20px rgba(10, 110, 189, 0.5)';
            setTimeout(() => {
              tareaElement.style.boxShadow = '';
            }, 2000);
          }
        }, 500);
      }
      // Limpiar después de usar
      sessionStorage.removeItem('tareaIdToOpen');
    }
  }, [tareas, carpetaActual]);

  // Cargar comentarios y adjuntos cuando se expande una tarea
  useEffect(() => {
    if (tareaExpandida && tareas.length > 0) {
      const tarea = tareas.find(t => t.id === tareaExpandida);
      if (tarea && tarea.comentarios) {
        setComentariosTarea(prev => ({
          ...prev,
          [tareaExpandida]: tarea.comentarios
        }));
      }
      // Cargar adjuntos
      cargarAdjuntosTarea(tareaExpandida);
    }
  }, [tareaExpandida, tareas]);

  const cargarAdjuntosTarea = async (tareaId) => {
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_tarea_adjuntos.php?tarea_id=${tareaId}`);
      if (!res.ok) {
        console.error('Error cargando adjuntos:', res.status);
        setAdjuntosTarea(prev => ({ ...prev, [tareaId]: [] }));
        return;
      }
      const data = await res.json();
      setAdjuntosTarea(prev => ({
        ...prev,
        [tareaId]: Array.isArray(data) ? data : []
      }));
    } catch (error) {
      console.error('Error cargando adjuntos:', error);
      setAdjuntosTarea(prev => ({ ...prev, [tareaId]: [] }));
    }
  };

  const subirAdjuntoTarea = async (tareaId, archivo, descripcion = '') => {
    if (!archivo) return;

    setSubiendoAdjunto(prev => ({ ...prev, [tareaId]: true }));

    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('tarea_id', tareaId);
      formData.append('usuario_id', user.id);
      if (descripcion) {
        formData.append('descripcion', descripcion);
      }

      const res = await fetch(`${API_BASE}/archivos/carpeta_tarea_adjuntos.php`, {
        method: 'POST',
        body: formData
      });

      const contentType = res.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }

      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }

      if (data.success && data.adjunto) {
        // Agregar el nuevo adjunto a la lista
        setAdjuntosTarea(prev => ({
          ...prev,
          [tareaId]: [...(prev[tareaId] || []), data.adjunto]
        }));
        alert('Archivo adjuntado correctamente');
      } else if (data.error) {
        alert('Error al adjuntar archivo: ' + data.error);
      } else {
        alert('Error al adjuntar archivo: Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error subiendo adjunto:', error);
      alert('Error al adjuntar archivo: ' + (error.message || 'Error de conexión'));
    } finally {
      setSubiendoAdjunto(prev => ({ ...prev, [tareaId]: false }));
    }
  };

  const descargarAdjunto = (adjunto) => {
    // Construir URL de descarga
    let urlDescarga = adjunto.ruta_archivo;
    if (!urlDescarga.startsWith('http')) {
      if (process.env.NODE_ENV === 'development') {
        urlDescarga = 'http://localhost/rcritico/' + urlDescarga;
      } else {
        const origin = window.location.origin;
        urlDescarga = origin + (urlDescarga.startsWith('/') ? '' : '/') + urlDescarga;
      }
    }
    window.open(urlDescarga, '_blank');
  };

  const eliminarAdjunto = async (adjuntoId, tareaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo adjunto?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_tarea_adjuntos.php?id=${adjuntoId}&usuario_id=${user.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Eliminar el adjunto de la lista
        setAdjuntosTarea(prev => ({
          ...prev,
          [tareaId]: (prev[tareaId] || []).filter(a => a.id !== adjuntoId)
        }));
        alert('Archivo eliminado correctamente');
      } else {
        alert('Error al eliminar archivo: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error eliminando adjunto:', error);
      alert('Error al eliminar archivo: ' + (error.message || 'Error de conexión'));
    }
  };

  const validarTarea = async (tareaId, accion, motivoRechazo = null) => {
    // accion: 'validada' o 'rechazada'
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_tareas.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tareaId,
          estado_validacion: accion,
          usuario_validador_id: user.id,
          motivo_rechazo: motivoRechazo
        })
      });

      const contentType = res.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }

      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }

      if (data.success) {
        cargarTareas(carpetaActual.id);
        if (accion === 'validada') {
          alert('Tarea validada correctamente');
        } else {
          alert('Tarea rechazada. Se ha vuelto a estado "En Progreso"');
        }
      } else if (data.error) {
        alert('Error al validar tarea: ' + data.error);
      } else {
        alert('Error al validar tarea: Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error validando tarea:', error);
      alert('Error al validar tarea: ' + (error.message || 'Error de conexión'));
    }
  };

  const invitarUsuarioATarea = async (tareaId, usuarioId) => {
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_tarea_asignaciones.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarea_id: tareaId,
          usuario_id: usuarioId,
          usuario_invitador_id: user.id
        })
      });

      const contentType = res.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }

      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }

      if (data.success) {
        setModalInvitarUsuarioTarea(null);
        cargarTareas(carpetaActual.id);
        alert('Usuario invitado a la tarea correctamente');
      } else if (data.error) {
        alert('Error al invitar usuario: ' + data.error);
      } else {
        alert('Error al invitar usuario: Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error invitando usuario:', error);
      alert('Error al invitar usuario: ' + (error.message || 'Error de conexión'));
    }
  };

  const quitarUsuarioDeTarea = async (tareaId, usuarioId) => {
    if (!window.confirm('¿Estás seguro de que deseas quitar a este usuario de la tarea?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_tarea_asignaciones.php?tarea_id=${tareaId}&usuario_id=${usuarioId}&usuario_quita_id=${user.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (res.ok && data.success) {
        cargarTareas(carpetaActual.id);
        alert('Usuario removido de la tarea correctamente');
      } else {
        alert('Error al quitar usuario: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error quitando usuario:', error);
      alert('Error al quitar usuario: ' + (error.message || 'Error de conexión'));
    }
  };

  const crearComentario = async (tareaId) => {
    const comentarioTexto = nuevoComentario[tareaId]?.trim();
    if (!comentarioTexto) return;

    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_tarea_comentarios.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarea_id: tareaId,
          usuario_id: user.id,
          comentario: comentarioTexto
        })
      });

      const contentType = res.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }

      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }

      if (data.success && data.comentario) {
        // Agregar el nuevo comentario a la lista
        setComentariosTarea(prev => ({
          ...prev,
          [tareaId]: [...(prev[tareaId] || []), data.comentario]
        }));
        // Limpiar el campo de comentario
        setNuevoComentario(prev => ({
          ...prev,
          [tareaId]: ''
        }));
        // Recargar tareas para actualizar contador
        cargarTareas(carpetaActual.id);
      } else if (data.error) {
        alert('Error al crear comentario: ' + data.error);
      } else {
        alert('Error al crear comentario: Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error creando comentario:', error);
      alert('Error al crear comentario: ' + (error.message || 'Error de conexión'));
    }
  };

  const cargarMensajesForo = async (carpetaId) => {
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_mensajes.php?carpeta_id=${carpetaId}${user && user.id ? `&usuario_id=${user.id}` : ''}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Error HTTP ${res.status}` }));
        console.error('Error cargando mensajes del foro:', errorData.error || `HTTP ${res.status}`);
        setMensajesForo([]);
        return;
      }
      
      const data = await res.json();
      setMensajesForo(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando mensajes del foro:', error);
      setMensajesForo([]);
    }
  };

  const cargarTareas = async (carpetaId) => {
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_tareas.php?carpeta_id=${carpetaId}${user && user.id ? `&usuario_id=${user.id}` : ''}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Error HTTP ${res.status}` }));
        console.error('Error cargando tareas:', errorData.error || `HTTP ${res.status}`);
        setTareas([]);
        return;
      }
      
      const data = await res.json();
      setTareas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setTareas([]);
    }
  };

  const cargarInformacionRiesgo = async (carpetaId) => {
    if (!carpetaId) {
      setInformacionRiesgo(null);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/archivos/carpetas.php?id=${carpetaId}`);
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }
      const data = await res.json();
      
      // Si la respuesta es un error, limpiar información
      if (data && data.error) {
        setInformacionRiesgo(null);
        return;
      }
      
      // La respuesta ahora debería ser un objeto único (no un array)
      let carpeta;
      if (data && !data.error && !Array.isArray(data)) {
        carpeta = data;
      } else if (data && !data.error && Array.isArray(data) && data.length > 0) {
        // Fallback: si viene como array, tomar el primero
        carpeta = data[0];
      } else {
        carpeta = {};
      }
      
      // Verificar que la carpeta tiene el ID correcto
      if (carpeta.id && parseInt(carpeta.id) !== parseInt(carpetaId)) {
        console.warn('ID de carpeta no coincide:', carpeta.id, 'vs', carpetaId);
        setInformacionRiesgo(null);
        return;
      }

      // Parsear JSON de controles si existen
      let controlesSupervisor = { preventivos: [], mitigadores: [] };
      let controlesTrabajador = { preventivos: [], mitigadores: [] };
      
      try {
        if (carpeta.controles_supervisor) {
          controlesSupervisor = typeof carpeta.controles_supervisor === 'string' 
            ? JSON.parse(carpeta.controles_supervisor) 
            : carpeta.controles_supervisor;
        }
      } catch (e) {
        console.error('Error parseando controles_supervisor:', e);
      }
      
      try {
        if (carpeta.controles_trabajador) {
          controlesTrabajador = typeof carpeta.controles_trabajador === 'string'
            ? JSON.parse(carpeta.controles_trabajador)
            : carpeta.controles_trabajador;
        }
      } catch (e) {
        console.error('Error parseando controles_trabajador:', e);
      }

      setInformacionRiesgo({
        evento_no_deseado: carpeta.evento_no_deseado || '',
        evento_riesgo: carpeta.evento_riesgo || '',
        controles_supervisor: controlesSupervisor,
        controles_trabajador: controlesTrabajador,
        informacion_riesgo: carpeta.informacion_riesgo || ''
      });
    } catch (error) {
      console.error('Error cargando información de riesgo:', error);
      setInformacionRiesgo({
        evento_no_deseado: '',
        evento_riesgo: '',
        controles_supervisor: { preventivos: [], mitigadores: [] },
        controles_trabajador: { preventivos: [], mitigadores: [] },
        informacion_riesgo: ''
      });
    }
  };

  const cargarAnalisisBowtie = async (carpetaId) => {
    if (!carpetaId) {
      setAnalisisBowtie(null);
      return;
    }
    
    setCargandoBowtie(true);
    try {
      const params = new URLSearchParams({
        carpeta_id: carpetaId
      });
      if (user && user.id) {
        params.append('usuario_id', user.id);
      }
      
      const res = await fetch(`${API_BASE}/archivos/carpeta_bowtie.php?${params}`);
      if (!res.ok) {
        // Si es un error 404, significa que no hay análisis aún, crear estructura vacía
        if (res.status === 404) {
          console.log('No hay análisis Bowtie para esta carpeta, creando estructura vacía');
          setAnalisisBowtie({
            evento_central: '',
            peligro: '',
            energia: '',
            evento_top: '',
            causas: [],
            consecuencias: [],
            controles_preventivos: [],
            controles_preventivos_generales: [],
            controles_mitigadores: [],
            controles_mitigadores_generales: []
          });
          setCargandoBowtie(false);
          return;
        }
        throw new Error(`Error HTTP ${res.status}`);
      }
      const data = await res.json();
      
      if (data && data.error) {
        console.error('Error en respuesta del servidor:', data.error);
        // Si hay un error pero ya tenemos datos, mantenerlos
        if (!analisisBowtie) {
          setAnalisisBowtie({
            evento_central: '',
            peligro: '',
            energia: '',
            evento_top: '',
            causas: [],
            consecuencias: [],
            controles_preventivos: [],
            controles_preventivos_generales: [],
            controles_mitigadores: [],
            controles_mitigadores_generales: []
          });
        }
        return;
      }
      
      const analisisVacio = {
        evento_central: '',
        peligro: '',
        energia: '',
        evento_top: '',
        causas: [],
        consecuencias: [],
        controles_preventivos: [],
        controles_preventivos_generales: [],
        controles_mitigadores: [],
        controles_mitigadores_generales: []
      };
      
      // Si no hay análisis, intentar clonar del nivel superior si corresponde
      if (!data.bowtie_id) {
        console.log('No hay bowtie_id en la respuesta, intentando clonar desde nivel superior si aplica');
        const esNivel2 = rutaNavegacion.length === 2 && carpetaActual?.carpeta_padre_id;
        let analisisClonado = null;
        
        if (esNivel2) {
          try {
            const resPadre = await fetch(`${API_BASE}/archivos/carpeta_bowtie.php?carpeta_id=${carpetaActual.carpeta_padre_id}`);
            if (resPadre.ok) {
              const datosPadre = await resPadre.json();
              if (datosPadre && datosPadre.bowtie_id) {
                analisisClonado = construirAnalisisClonadoSinEvidencias(datosPadre);
              }
            }
          } catch (error) {
            console.error('Error clonando análisis Bowtie del nivel superior:', error);
          }
        }
        
        if (analisisClonado) {
          aplicarAnalisisBowtie(analisisClonado);
        } else {
          aplicarAnalisisBowtie(analisisVacio);
        }
      } else {
        // Estructurar los datos: agrupar controles dentro de causas y consecuencias
        const controlesPreventivosCriticos = (data.controles_preventivos || []).map((cp, index) => ({
          ...cp,
          codigo: cp.codigo || `CCP${index + 1}`,
          descripcion: cp.descripcion || '',
          criticidad: cp.criticidad || '',
          jerarquia: cp.jerarquia || '',
          causas_asociadas: (cp.causas_asociadas || []).map((causaAsociada, idxAsoc) => ({
            codigo: causaAsociada.codigo || `CA${causaAsociada.id || idxAsoc + 1}`,
            id: causaAsociada.id
          })),
          dimensiones: cp.dimensiones || []
        }));
        
        const controlesMitigadoresCriticos = (data.controles_mitigadores || []).map((cm, index) => ({
          ...cm,
          codigo: cm.codigo || `CCM${index + 1}`,
          descripcion: cm.descripcion || '',
          criticidad: cm.criticidad || '',
          jerarquia: cm.jerarquia || '',
          consecuencias_asociadas: (cm.consecuencias_asociadas || []).map((consecuenciaAsociada, idxAsoc) => ({
            codigo: consecuenciaAsociada.codigo || `CO${consecuenciaAsociada.id || idxAsoc + 1}`,
            id: consecuenciaAsociada.id
          })),
          dimensiones: cm.dimensiones || []
        }));
        
        const causasEstructuradas = (data.causas || []).map((causa, index) => ({
          ...causa,
          codigo: causa.codigo || `CA${index + 1}`,
          controles_preventivos: controlesPreventivosCriticos
            .filter(cp => cp.causa_id === causa.id)
            .map(cp => ({ descripcion: cp.descripcion, id: cp.id, codigo: cp.codigo }))
        }));
        
        const consecuenciasEstructuradas = (data.consecuencias || []).map((consecuencia, index) => ({
          ...consecuencia,
          codigo: consecuencia.codigo || `CO${index + 1}`,
          evento_no_deseado: consecuencia.evento_no_deseado || null,
          categoria: consecuencia.categoria || null,
          controles_mitigadores: controlesMitigadoresCriticos
            .filter(cm => cm.consecuencia_id === consecuencia.id)
            .map(cm => ({ descripcion: cm.descripcion, id: cm.id, codigo: cm.codigo }))
        }));
        
        // Controles generales provenientes de las nuevas tablas (con fallback a los datos existentes)
        const controlesPreventivosGeneralesRaw = Array.isArray(data.controles_preventivos_generales)
          ? data.controles_preventivos_generales
          : [];
        const controlesMitigadoresGeneralesRaw = Array.isArray(data.controles_mitigadores_generales)
          ? data.controles_mitigadores_generales
          : [];

        // Filtrar duplicados basados en ID o código antes de procesar
        const controlesPreventivosGeneralesUnicos = controlesPreventivosGeneralesRaw.reduce((acc, control) => {
          // Si tiene ID, verificar que no esté ya en el array
          if (control.id) {
            const existe = acc.find(c => c.id === control.id);
            if (!existe) acc.push(control);
          } else if (control.codigo) {
            // Si no tiene ID pero tiene código, verificar que el código no esté duplicado
            const existe = acc.find(c => c.codigo === control.codigo && !c.id);
            if (!existe) acc.push(control);
          } else {
            // Si no tiene ni ID ni código, agregarlo
            acc.push(control);
          }
          return acc;
        }, []);

        const controlesPreventivosGenerales = controlesPreventivosGeneralesUnicos.map((control, index) => ({
          ...control,
          codigo: control.codigo || `CP${index + 1}`,
          nombre_control: control.nombre_control || control.descripcion || '',
          consecuencias: control.consecuencias || '',
          criticidad: control.criticidad || '',
          jerarquia: control.jerarquia || ''
        }));

        const controlesMitigadoresGenerales = controlesMitigadoresGeneralesRaw.map((control, index) => ({
          ...control,
          codigo: control.codigo || `CM${index + 1}`,
          nombre_control: control.nombre_control || control.descripcion || '',
          consecuencias: control.consecuencias || '',
          criticidad: control.criticidad || '',
          jerarquia: control.jerarquia || ''
        }));
        
        const analisisFinal = {
          ...data,
          peligro: data.peligro || '',
          energia: data.energia || '',
          evento_top: data.evento_top || '',
          causas: causasEstructuradas,
          consecuencias: consecuenciasEstructuradas,
          controles_preventivos: controlesPreventivosCriticos,
          controles_mitigadores: controlesMitigadoresCriticos,
          controles_preventivos_generales: controlesPreventivosGenerales,
          controles_mitigadores_generales: controlesMitigadoresGenerales
        };
        
        aplicarAnalisisBowtie(analisisFinal);
      }
    } catch (error) {
      console.error('Error cargando análisis Bowtie:', error);
      // No limpiar los datos si ya existen, solo mostrar error
      // Esto evita que se borren los datos si hay un error temporal en la recarga
      if (!analisisBowtie) {
        aplicarAnalisisBowtie({
          evento_central: '',
          peligro: '',
          energia: '',
          evento_top: '',
          causas: [],
          controles_preventivos: [],
          controles_preventivos_generales: [],
          consecuencias: [],
          controles_mitigadores: [],
          controles_mitigadores_generales: []
        });
      }
    } finally {
      setCargandoBowtie(false);
    }
  };

  const guardarAnalisisBowtie = async () => {
    if (!carpetaActual || !analisisBowtie) return;
    
    try {
      setGuardandoBowtie(true);
      // Preparar datos para enviar
      const datosEnvio = {
        carpeta_id: carpetaActual.id,
        usuario_id: user.id,
        evento_central: analisisBowtie.evento_central || '',
        peligro: analisisBowtie.peligro || '',
        energia: analisisBowtie.energia || '',
        evento_top: analisisBowtie.evento_top || '',
        causas: analisisBowtie.causas || [],
        controles_preventivos: analisisBowtie.controles_preventivos || [],
        consecuencias: analisisBowtie.consecuencias || [],
        controles_mitigadores: analisisBowtie.controles_mitigadores || [],
        controles_preventivos_generales: analisisBowtie.controles_preventivos_generales || [],
        controles_mitigadores_generales: analisisBowtie.controles_mitigadores_generales || []
      };
      
      const res = await fetch(`${API_BASE}/archivos/carpeta_bowtie.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEnvio)
      });

      const data = await res.json();
      if (data.success) {
        // Recargar el análisis
        if (carpetaActual && carpetaActual.id) {
          await cargarAnalisisBowtie(carpetaActual.id);
        }
        console.log('Análisis Bowtie guardado correctamente');
      } else {
        alert('Error al guardar: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error guardando análisis Bowtie:', error);
      alert('Error al guardar el análisis Bowtie');
    } finally {
      setGuardandoBowtie(false);
    }
  };

  const renderEtiquetaCampo = (texto, color = '#0a6ebd') => (
    <span style={{
      display: 'inline-block',
      fontSize: '9px',
      fontWeight: '700',
      letterSpacing: '0.5px',
      color,
      background: `${color}1a`,
      border: `1px solid ${color}66`,
      padding: '1px 6px',
      borderRadius: '999px',
      marginBottom: '4px'
    }}>
      {texto}
    </span>
  );

  const renderDimensionCell = (valor) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {renderEtiquetaCampo('DIMENSIÓN')}
      <div style={{ fontWeight: 600, fontSize: '11px', color: '#111827', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
        {valor || 'Sin dimensión definida'}
      </div>
    </div>
  );

  const renderPreguntaCell = (valor) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {renderEtiquetaCampo('PREGUNTA', '#ea580c')}
      <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
        {valor || 'Sin pregunta registrada'}
      </div>
    </div>
  );

  const renderEvidenciaCell = (valor) => {
    const evidencias = parseEvidenciasTexto(valor);
    if (!evidencias.length) {
      return (
        <div style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: '11px' }}>
          Sin evidencia registrada
        </div>
      );
    }

    return (
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#fff'
      }}>
        {evidencias.map((ev, idx) => (
          <div
            key={`evidencia-${idx}`}
            style={{
              padding: '0.35rem 0.45rem',
              background: idx % 2 === 0 ? '#fdfdfd' : '#f8fbff',
              borderBottom: idx === evidencias.length - 1 ? 'none' : '1px dashed #cbd5f5'
            }}
          >
            <div style={{ fontSize: '11px', color: '#111827', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
              {ev}
            </div>
          </div>
        ))}
      </div>
    );
  };

const limpiarEvidenciasEnControles = (controles = []) => controles.map(control => ({
  ...control,
  dimensiones: (control.dimensiones || []).map(dimension => ({
    ...dimension,
    preguntas: (dimension.preguntas || []).map(pregunta => ({
      ...pregunta,
      evidencia: ''
    }))
  }))
}));

const construirAnalisisClonadoSinEvidencias = (data) => {
  if (!data) return null;
  return {
    evento_central: data.evento_central || '',
    peligro: data.peligro || '',
    energia: data.energia || '',
    evento_top: data.evento_top || '',
    causas: Array.isArray(data.causas) ? data.causas.map(c => ({ ...c })) : [],
    consecuencias: Array.isArray(data.consecuencias) ? data.consecuencias.map(c => ({ ...c })) : [],
    controles_preventivos: limpiarEvidenciasEnControles(data.controles_preventivos || []),
    controles_mitigadores: limpiarEvidenciasEnControles(data.controles_mitigadores || []),
    controles_preventivos_generales: Array.isArray(data.controles_preventivos_generales)
      ? data.controles_preventivos_generales.map(cp => ({ ...cp }))
      : [],
    controles_mitigadores_generales: Array.isArray(data.controles_mitigadores_generales)
      ? data.controles_mitigadores_generales.map(cm => ({ ...cm }))
      : []
  };
};

  const cargarLineaBase = async (carpetaId) => {
    if (!carpetaId) {
      setLineaBase([]);
      return;
    }

    try {
      setCargandoLineaBase(true);
      // Siempre intentar cargar desde API primero para obtener datos frescos
      let controlesPreventivos = [];
      console.log('[Línea Base] Iniciando carga, analisisBowtie existe?', !!analisisBowtie);
      
      try {
        const res = await fetch(`${API_BASE}/archivos/carpeta_bowtie.php?carpeta_id=${carpetaId}`);
        const data = await res.json();
        console.log('[Línea Base] Respuesta API completa:', data);
        console.log('[Línea Base] data.success:', data.success, 'data.bowtie_id:', data.bowtie_id);
        console.log('[Línea Base] data.controles_preventivos:', data.controles_preventivos ? data.controles_preventivos.length : 'null/undefined');
        
        // Intentar obtener controles desde la respuesta de la API
        if (data.controles_preventivos && Array.isArray(data.controles_preventivos) && data.controles_preventivos.length > 0) {
          controlesPreventivos = data.controles_preventivos;
          console.log('[Línea Base] Controles obtenidos desde API:', controlesPreventivos.length);
        } else if (data.success && data.bowtie_id) {
          // Si hay bowtie_id pero no controles en la respuesta, podría ser que estén vacíos
          controlesPreventivos = data.controles_preventivos || [];
          console.log('[Línea Base] Controles desde API (con bowtie_id):', controlesPreventivos.length);
        }
        
        // Si aún no hay controles desde API, intentar desde el estado local
        if (controlesPreventivos.length === 0) {
          if (analisisBowtie && analisisBowtie.controles_preventivos && analisisBowtie.controles_preventivos.length > 0) {
            controlesPreventivos = analisisBowtie.controles_preventivos;
            console.log('[Línea Base] Usando controles desde analisisBowtie (fallback):', controlesPreventivos.length);
          } else {
            console.log('[Línea Base] No se encontraron controles ni en API ni en estado');
          }
        }
      } catch (apiError) {
        console.error('[Línea Base] Error al obtener desde API:', apiError);
        // Fallback al estado local
        if (analisisBowtie && analisisBowtie.controles_preventivos && analisisBowtie.controles_preventivos.length > 0) {
          controlesPreventivos = analisisBowtie.controles_preventivos;
          console.log('[Línea Base] Usando controles desde analisisBowtie (error en API):', controlesPreventivos.length);
        }
      }
      
      console.log('[Línea Base] Total controles encontrados:', controlesPreventivos.length);
      
      if (controlesPreventivos.length > 0) {
        // Intentar cargar línea base existente desde API (si existe)
        try {
          const resLineaBase = await fetch(`${API_BASE}/archivos/carpeta_linea_base.php?carpeta_id=${carpetaId}`);
          const dataLineaBase = await resLineaBase.json();
          
          if (dataLineaBase.success && dataLineaBase.linea_base && dataLineaBase.linea_base.length > 0) {
            // Si hay línea base guardada, sincronizar con controles preventivos actuales
            const lineaBaseExistente = dataLineaBase.linea_base;
            // Crear una fila por cada dimensión-pregunta de cada control
            const nuevaLineaBase = [];
            
            controlesPreventivos.forEach((control, controlIndex) => {
              const dimensiones = control.dimensiones || [];
              const codigo = control.codigo || `CCP${controlIndex + 1}`;
              const nombreControl = control.descripcion || '';
              
              // Si no hay dimensiones, crear una fila vacía
              if (dimensiones.length === 0) {
                const existente = lineaBaseExistente.find(lb => lb.control_preventivo_id === control.id && !lb.dimension);
                nuevaLineaBase.push({
                  id: existente?.id || null,
                  control_preventivo_id: control.id,
                  codigo: codigo,
                  control_critico_preventivo: nombreControl,
                  dimension: '',
                  pregunta: '',
                  evidencia: '',
                  verificador_responsable: existente ? (existente.verificador_responsable ?? '') : '',
                  fecha_verificacion: existente ? (existente.fecha_verificacion ?? '') : '',
                  implementado_estandar_desempeno: existente ? (existente.implementado_estandar ?? '') : '',
                  accion_a_ejecutar: existente ? (existente.accion_ejecutar ?? '') : '',
                  responsable_cierre_accion: existente ? (existente.responsable_cierre ?? '') : '',
                  fecha_cierre: existente ? (existente.fecha_cierre ?? '') : '',
                  criticidad: existente ? (existente.criticidad || '') : '',
                  porcentaje_avance_implementacion_accion: existente ? (existente.porcentaje_avance ?? '') : '',
                  nombre_dueno_control_critico_tecnico: existente ? (existente.nombre_dueno_control ?? '') : '',
                  ultimo_usuario_edito: existente?.ultimo_usuario_edito || '',
                  estado_validacion: existente?.estado_validacion || null,
                  comentario_validacion: existente?.comentario_validacion || '',
                  usuario_validacion: existente?.usuario_validacion || '',
                  fecha_validacion: existente?.fecha_validacion || '',
                  ponderacion: existente?.ponderacion !== undefined ? existente.ponderacion : (existente?.estado_validacion === 'validado' ? 100 : 0)
                });
                return;
              }
              
              // Crear una fila por cada dimensión-pregunta
              dimensiones.forEach((dimension, dimIndex) => {
                const preguntas = dimension.preguntas || [];
                const nombreDimension = dimension.nombre || '';
                
                // Si no hay preguntas, crear una fila solo con la dimensión
                if (preguntas.length === 0) {
                  const existente = lineaBaseExistente.find(lb => 
                    lb.control_preventivo_id === control.id && 
                    lb.dimension === nombreDimension && 
                    !lb.pregunta
                  );
                  nuevaLineaBase.push({
                    id: existente?.id || null,
                    control_preventivo_id: control.id,
                    codigo: codigo,
                    control_critico_preventivo: dimIndex === 0 ? nombreControl : '', // Solo en primera fila
                    dimension: nombreDimension,
                    pregunta: '',
                    evidencia: '',
                    verificador_responsable: existente ? (existente.verificador_responsable ?? '') : '',
                    fecha_verificacion: existente ? (existente.fecha_verificacion ?? '') : '',
                    implementado_estandar_desempeno: existente ? (existente.implementado_estandar ?? '') : '',
                    accion_a_ejecutar: existente ? (existente.accion_ejecutar ?? '') : '',
                    responsable_cierre_accion: existente ? (existente.responsable_cierre ?? '') : '',
                    fecha_cierre: existente ? (existente.fecha_cierre ?? '') : '',
                    criticidad: existente ? (existente.criticidad || '') : '',
                    porcentaje_avance_implementacion_accion: existente ? (existente.porcentaje_avance ?? '') : '',
                    nombre_dueno_control_critico_tecnico: existente ? (existente.nombre_dueno_control ?? '') : '',
                    ultimo_usuario_edito: existente?.ultimo_usuario_edito || '',
                    estado_validacion: existente?.estado_validacion || null,
                    comentario_validacion: existente?.comentario_validacion || '',
                    usuario_validacion: existente?.usuario_validacion || '',
                    fecha_validacion: existente?.fecha_validacion || '',
                    ponderacion: existente?.ponderacion !== undefined ? existente.ponderacion : (existente?.estado_validacion === 'validado' ? 100 : 0)
                  });
                  return;
                }
                
                // Crear una fila por cada pregunta
                preguntas.forEach((pregunta, pregIndex) => {
                  const esPrimeraFila = dimIndex === 0 && pregIndex === 0;
                  const existente = lineaBaseExistente.find(lb => 
                    lb.control_preventivo_id === control.id && 
                    lb.dimension === nombreDimension && 
                    lb.pregunta === pregunta.texto
                  );
                  
                  nuevaLineaBase.push({
                    id: existente?.id || null,
                    control_preventivo_id: control.id,
                    codigo: codigo,
                    control_critico_preventivo: esPrimeraFila ? nombreControl : '', // Solo en primera fila del control
                    dimension: nombreDimension,
                    pregunta: pregunta.texto || '',
                    evidencia: pregunta.evidencia || (existente ? (existente.evidencia ?? '') : ''),
                    verificador_responsable: existente ? (existente.verificador_responsable ?? '') : '',
                    fecha_verificacion: existente ? (existente.fecha_verificacion ?? '') : '',
                    implementado_estandar_desempeno: existente ? (existente.implementado_estandar ?? '') : '',
                    accion_a_ejecutar: existente ? (existente.accion_ejecutar ?? '') : '',
                    responsable_cierre_accion: existente ? (existente.responsable_cierre ?? '') : '',
                    fecha_cierre: existente ? (existente.fecha_cierre ?? '') : '',
                    criticidad: existente ? (existente.criticidad || '') : '',
                    porcentaje_avance_implementacion_accion: existente ? (existente.porcentaje_avance ?? '') : '',
                    nombre_dueno_control_critico_tecnico: existente ? (existente.nombre_dueno_control ?? '') : '',
                    ultimo_usuario_edito: existente?.ultimo_usuario_edito || '',
                    estado_validacion: existente?.estado_validacion || null,
                    comentario_validacion: existente?.comentario_validacion || '',
                    usuario_validacion: existente?.usuario_validacion || '',
                    fecha_validacion: existente?.fecha_validacion || '',
                    ponderacion: existente?.ponderacion !== undefined ? existente.ponderacion : (existente?.estado_validacion === 'validado' ? 100 : 0)
                  });
                });
              });
            });
            console.log('[Línea Base] Línea base sincronizada con existente:', nuevaLineaBase.length, 'elementos');
            console.log('[Línea Base] Estableciendo estado con', nuevaLineaBase.length, 'elementos');
            setLineaBase(nuevaLineaBase);
            // Verificar inmediatamente después (en el siguiente tick)
            setTimeout(() => {
              console.log('[Línea Base] Estado verificado después de setLineaBase:', nuevaLineaBase.length);
            }, 0);
          } else {
            // Si no hay línea base guardada, crear desde controles preventivos
            // Crear una fila por cada dimensión-pregunta de cada control
            const nuevaLineaBase = [];
            
            controlesPreventivos.forEach((control, controlIndex) => {
              const dimensiones = control.dimensiones || [];
              const codigo = control.codigo || `CCP${controlIndex + 1}`;
              const nombreControl = control.descripcion || '';
              
              // Si no hay dimensiones, crear una fila vacía
              if (dimensiones.length === 0) {
                nuevaLineaBase.push({
                  id: null,
                  control_preventivo_id: control.id,
                  codigo: codigo,
                  control_critico_preventivo: nombreControl,
                  dimension: '',
                  pregunta: '',
                  evidencia: '',
                  verificador_responsable: '',
                  fecha_verificacion: '',
                  implementado_estandar_desempeno: '',
                  accion_a_ejecutar: '',
                  responsable_cierre_accion: '',
                  fecha_cierre: '',
                  criticidad: control.criticidad || '',
                  porcentaje_avance_implementacion_accion: '',
                  nombre_dueno_control_critico_tecnico: ''
                });
                return;
              }
              
              // Crear una fila por cada dimensión-pregunta
              dimensiones.forEach((dimension, dimIndex) => {
                const preguntas = dimension.preguntas || [];
                const nombreDimension = dimension.nombre || '';
                
                // Si no hay preguntas, crear una fila solo con la dimensión
                if (preguntas.length === 0) {
                  nuevaLineaBase.push({
                    id: null,
                    control_preventivo_id: control.id,
                    codigo: codigo,
                    control_critico_preventivo: dimIndex === 0 ? nombreControl : '', // Solo en primera fila
                    dimension: nombreDimension,
                    pregunta: '',
                    evidencia: '',
                    verificador_responsable: '',
                    fecha_verificacion: '',
                    implementado_estandar_desempeno: '',
                    accion_a_ejecutar: '',
                    responsable_cierre_accion: '',
                    fecha_cierre: '',
                    criticidad: control.criticidad || '',
                    porcentaje_avance_implementacion_accion: '',
                    nombre_dueno_control_critico_tecnico: ''
                  });
                  return;
                }
                
                // Crear una fila por cada pregunta
                preguntas.forEach((pregunta, pregIndex) => {
                  const esPrimeraFila = dimIndex === 0 && pregIndex === 0;
                  
                  nuevaLineaBase.push({
                    id: null,
                    control_preventivo_id: control.id,
                    codigo: codigo,
                    control_critico_preventivo: esPrimeraFila ? nombreControl : '', // Solo en primera fila del control
                    dimension: nombreDimension,
                    pregunta: pregunta.texto || '',
                    evidencia: pregunta.evidencia || '',
                    verificador_responsable: '',
                    fecha_verificacion: '',
                    implementado_estandar_desempeno: '',
                    accion_a_ejecutar: '',
                    responsable_cierre_accion: '',
                    fecha_cierre: '',
                    criticidad: control.criticidad || '',
                    porcentaje_avance_implementacion_accion: '',
                    nombre_dueno_control_critico_tecnico: ''
                  });
                });
              });
            });
            console.log('[Línea Base] Línea base creada desde controles preventivos:', nuevaLineaBase.length, 'elementos');
            console.log('[Línea Base] Estableciendo estado con', nuevaLineaBase.length, 'elementos');
            setLineaBase(nuevaLineaBase);
            // Verificar inmediatamente después (en el siguiente tick)
            setTimeout(() => {
              console.log('[Línea Base] Estado verificado después de setLineaBase:', nuevaLineaBase.length);
            }, 0);
          }
        } catch (error) {
          console.log('[Línea Base] No hay API de línea base aún, creando desde controles preventivos');
          // Si no existe la API, crear desde controles preventivos
          // Crear una fila por cada dimensión-pregunta de cada control
          const nuevaLineaBase = [];
          
          controlesPreventivos.forEach((control, controlIndex) => {
            const dimensiones = control.dimensiones || [];
            const codigo = control.codigo || `CCP${controlIndex + 1}`;
            const nombreControl = control.descripcion || '';
            
            // Si no hay dimensiones, crear una fila vacía
            if (dimensiones.length === 0) {
              nuevaLineaBase.push({
                id: null,
                control_preventivo_id: control.id,
                codigo: codigo,
                control_critico_preventivo: nombreControl,
                dimension: '',
                pregunta: '',
                evidencia: '',
                verificador_responsable: '',
                fecha_verificacion: '',
                implementado_estandar_desempeno: '',
                accion_a_ejecutar: '',
                responsable_cierre_accion: '',
                fecha_cierre: '',
                criticidad: control.criticidad || '',
                porcentaje_avance_implementacion_accion: '',
                nombre_dueno_control_critico_tecnico: ''
              });
              return;
            }
            
            // Crear una fila por cada dimensión-pregunta
            dimensiones.forEach((dimension, dimIndex) => {
              const preguntas = dimension.preguntas || [];
              const nombreDimension = dimension.nombre || '';
              
              // Si no hay preguntas, crear una fila solo con la dimensión
              if (preguntas.length === 0) {
                nuevaLineaBase.push({
                  id: null,
                  control_preventivo_id: control.id,
                  codigo: codigo,
                  control_critico_preventivo: dimIndex === 0 ? nombreControl : '', // Solo en primera fila
                  dimension: nombreDimension,
                  pregunta: '',
                  evidencia: '',
                  verificador_responsable: '',
                  fecha_verificacion: '',
                  implementado_estandar_desempeno: '',
                  accion_a_ejecutar: '',
                  responsable_cierre_accion: '',
                  fecha_cierre: '',
                  criticidad: control.criticidad || '',
                  porcentaje_avance_implementacion_accion: '',
                  nombre_dueno_control_critico_tecnico: ''
                });
                return;
              }
              
              // Crear una fila por cada pregunta
              preguntas.forEach((pregunta, pregIndex) => {
                const esPrimeraFila = dimIndex === 0 && pregIndex === 0;
                
                nuevaLineaBase.push({
                  id: null,
                  control_preventivo_id: control.id,
                  codigo: codigo,
                  control_critico_preventivo: esPrimeraFila ? nombreControl : '', // Solo en primera fila del control
                  dimension: nombreDimension,
                  pregunta: pregunta.texto || '',
                  evidencia: pregunta.evidencia || '',
                  verificador_responsable: '',
                  fecha_verificacion: '',
                  implementado_estandar_desempeno: '',
                  accion_a_ejecutar: '',
                  responsable_cierre_accion: '',
                  fecha_cierre: '',
                  criticidad: control.criticidad || '',
                  porcentaje_avance_implementacion_accion: '',
                  nombre_dueno_control_critico_tecnico: ''
                });
              });
            });
          });
          console.log('[Línea Base] Línea base creada (catch):', nuevaLineaBase.length, 'elementos');
          console.log('[Línea Base] Estableciendo estado con', nuevaLineaBase.length, 'elementos');
          setLineaBase(nuevaLineaBase);
          // Verificar inmediatamente después (en el siguiente tick)
          setTimeout(() => {
            console.log('[Línea Base] Estado verificado después de setLineaBase (catch):', nuevaLineaBase.length);
          }, 0);
        }
      } else {
        // Si no hay controles preventivos, limpiar línea base
        console.log('[Línea Base] No hay controles preventivos, limpiando línea base');
        setLineaBase([]);
      }
    } catch (error) {
      console.error('[Línea Base] Error cargando línea base:', error);
      setLineaBase([]);
    } finally {
      setCargandoLineaBase(false);
    }
  };

  const guardarLineaBase = async () => {
    if (!carpetaActual || !lineaBase || lineaBase.length === 0) return;

    try {
      setGuardandoLineaBase(true);
      const datosEnvio = {
        carpeta_id: carpetaActual.id,
        usuario_id: user.id,
        linea_base: lineaBase.map(item => ({
          id: item.id,
          control_preventivo_id: item.control_preventivo_id,
          codigo: item.codigo || '',
          control_critico_preventivo: item.control_critico_preventivo || '',
          dimension: item.dimension || '',
          pregunta: item.pregunta || '',
          evidencia: item.evidencia || '',
          verificador_responsable: item.verificador_responsable || '',
          fecha_verificacion: (item.fecha_verificacion && item.fecha_verificacion.trim() !== '') ? item.fecha_verificacion : null,
          implementado_estandar: item.implementado_estandar_desempeno || '',
          accion_ejecutar: item.accion_a_ejecutar || '',
          responsable_cierre: item.responsable_cierre_accion || '',
          fecha_cierre: (item.fecha_cierre && item.fecha_cierre.trim() !== '') ? item.fecha_cierre : null,
          criticidad: item.criticidad || '',
          porcentaje_avance: item.porcentaje_avance_implementacion_accion || '',
          nombre_dueno_control: item.nombre_dueno_control_critico_tecnico || '',
          ultimo_usuario_edito: item.ultimo_usuario_edito || '',
          estado_validacion: item.estado_validacion || null,
          comentario_validacion: item.comentario_validacion || '',
          usuario_validacion: item.usuario_validacion || '',
          fecha_validacion: (item.fecha_validacion && item.fecha_validacion.trim() !== '') ? item.fecha_validacion : null,
          ponderacion: item.ponderacion !== undefined ? item.ponderacion : (item.estado_validacion === 'validado' ? 100 : 0)
        }))
      };

      const res = await fetch(`${API_BASE}/archivos/carpeta_linea_base.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEnvio)
      });

      const data = await res.json();
      if (data.success) {
        await cargarLineaBase(carpetaActual.id);
        // Recargar promedio de ponderación
        try {
          const resPromedio = await fetch(`${API_BASE}/archivos/promedio_ponderacion.php?carpeta_id=${carpetaActual.id}`);
          const dataPromedio = await resPromedio.json();
          if (dataPromedio.success) {
            setPromedioPonderacionActual(dataPromedio.promedio_general);
            // Actualizar también en el objeto de promedios
            setPromediosPonderacion(prev => ({ ...prev, [carpetaActual.id]: dataPromedio.promedio_general }));
          }
        } catch (error) {
          console.error('Error recargando promedio:', error);
        }
        mostrarNotificacion('✓ Línea base guardada correctamente', 'success');
      } else {
        mostrarNotificacion('✗ Error al guardar: ' + (data.error || 'Error desconocido'), 'error', 5000);
      }
    } catch (error) {
      console.error('Error guardando línea base:', error);
      mostrarNotificacion('✗ Error al guardar la línea base', 'error', 5000);
    } finally {
      setGuardandoLineaBase(false);
    }
  };

  const cargarLineaBaseMitigadores = async (carpetaId) => {
    if (!carpetaId) {
      setLineaBaseMitigadores([]);
      return;
    }

    try {
      setCargandoLineaBaseMitigadores(true);
      // Siempre intentar cargar desde API primero para obtener datos frescos
      let controlesMitigadores = [];
      console.log('[Línea Base Mitigadores] Iniciando carga, analisisBowtie existe?', !!analisisBowtie);
      
      try {
        const res = await fetch(`${API_BASE}/archivos/carpeta_bowtie.php?carpeta_id=${carpetaId}`);
        const data = await res.json();
        console.log('[Línea Base Mitigadores] Respuesta API completa:', data);
        console.log('[Línea Base Mitigadores] data.success:', data.success, 'data.bowtie_id:', data.bowtie_id);
        console.log('[Línea Base Mitigadores] data.controles_mitigadores:', data.controles_mitigadores ? data.controles_mitigadores.length : 'null/undefined');
        
        // Intentar obtener controles desde la respuesta de la API
        if (data.controles_mitigadores && Array.isArray(data.controles_mitigadores) && data.controles_mitigadores.length > 0) {
          controlesMitigadores = data.controles_mitigadores;
          console.log('[Línea Base Mitigadores] Controles obtenidos desde API:', controlesMitigadores.length);
        } else if (data.success && data.bowtie_id) {
          // Si hay bowtie_id pero no controles en la respuesta, podría ser que estén vacíos
          controlesMitigadores = data.controles_mitigadores || [];
          console.log('[Línea Base Mitigadores] Controles desde API (con bowtie_id):', controlesMitigadores.length);
        }
        
        // Si aún no hay controles desde API, intentar desde el estado local
        if (controlesMitigadores.length === 0) {
          if (analisisBowtie && analisisBowtie.controles_mitigadores && analisisBowtie.controles_mitigadores.length > 0) {
            controlesMitigadores = analisisBowtie.controles_mitigadores;
            console.log('[Línea Base Mitigadores] Usando controles desde analisisBowtie (fallback):', controlesMitigadores.length);
          } else {
            console.log('[Línea Base Mitigadores] No se encontraron controles ni en API ni en estado');
          }
        }
      } catch (apiError) {
        console.error('[Línea Base Mitigadores] Error al obtener desde API:', apiError);
        // Fallback al estado local
        if (analisisBowtie && analisisBowtie.controles_mitigadores && analisisBowtie.controles_mitigadores.length > 0) {
          controlesMitigadores = analisisBowtie.controles_mitigadores;
          console.log('[Línea Base Mitigadores] Usando controles desde analisisBowtie (error en API):', controlesMitigadores.length);
        }
      }
      
      console.log('[Línea Base Mitigadores] Total controles encontrados:', controlesMitigadores.length);
      
      if (controlesMitigadores.length > 0) {
        // Intentar cargar línea base existente desde API (si existe)
        try {
          const resLineaBase = await fetch(`${API_BASE}/archivos/carpeta_linea_base_mitigadores.php?carpeta_id=${carpetaId}`);
          const dataLineaBase = await resLineaBase.json();
          
          if (dataLineaBase.success && dataLineaBase.linea_base && dataLineaBase.linea_base.length > 0) {
            // Si hay línea base guardada, sincronizar con controles mitigadores actuales
            const lineaBaseExistente = dataLineaBase.linea_base;
            // Crear una fila por cada dimensión-pregunta de cada control
            const nuevaLineaBase = [];
            
            controlesMitigadores.forEach((control, controlIndex) => {
              const dimensiones = control.dimensiones || [];
              const codigo = control.codigo || `CCM${controlIndex + 1}`;
              const nombreControl = control.descripcion || '';
              
              // Si no hay dimensiones, crear una fila vacía
              if (dimensiones.length === 0) {
                const existente = lineaBaseExistente.find(lb => lb.control_mitigador_id === control.id && !lb.dimension);
                nuevaLineaBase.push({
                  id: existente?.id || null,
                  control_mitigador_id: control.id,
                  codigo: codigo,
                  control_critico_mitigador: nombreControl,
                  dimension: '',
                  pregunta: '',
                  evidencia: '',
                  verificador_responsable: existente ? (existente.verificador_responsable ?? '') : '',
                  fecha_verificacion: existente ? (existente.fecha_verificacion ?? '') : '',
                  implementado_estandar_desempeno: existente ? (existente.implementado_estandar ?? '') : '',
                  accion_a_ejecutar: existente ? (existente.accion_ejecutar ?? '') : '',
                  responsable_cierre_accion: existente ? (existente.responsable_cierre ?? '') : '',
                  fecha_cierre: existente ? (existente.fecha_cierre ?? '') : '',
                  criticidad: existente ? (existente.criticidad || '') : '',
                  porcentaje_avance_implementacion_accion: existente ? (existente.porcentaje_avance ?? '') : '',
                  nombre_dueno_control_critico_tecnico: existente ? (existente.nombre_dueno_control ?? '') : '',
                  ultimo_usuario_edito: existente?.ultimo_usuario_edito || '',
                  estado_validacion: existente?.estado_validacion || null,
                  comentario_validacion: existente?.comentario_validacion || '',
                  usuario_validacion: existente?.usuario_validacion || '',
                  fecha_validacion: existente?.fecha_validacion || '',
                  ponderacion: existente?.ponderacion !== undefined ? existente.ponderacion : (existente?.estado_validacion === 'validado' ? 100 : 0)
                });
                return;
              }
              
              // Crear una fila por cada dimensión-pregunta
              dimensiones.forEach((dimension, dimIndex) => {
                const preguntas = dimension.preguntas || [];
                const nombreDimension = dimension.nombre || '';
                
                // Si no hay preguntas, crear una fila solo con la dimensión
                if (preguntas.length === 0) {
                  const existente = lineaBaseExistente.find(lb => 
                    lb.control_mitigador_id === control.id && 
                    lb.dimension === nombreDimension && 
                    !lb.pregunta
                  );
                  nuevaLineaBase.push({
                    id: existente?.id || null,
                    control_mitigador_id: control.id,
                    codigo: codigo,
                    control_critico_mitigador: dimIndex === 0 ? nombreControl : '', // Solo en primera fila
                    dimension: nombreDimension,
                    pregunta: '',
                    evidencia: '',
                    verificador_responsable: existente ? (existente.verificador_responsable ?? '') : '',
                    fecha_verificacion: existente ? (existente.fecha_verificacion ?? '') : '',
                    implementado_estandar_desempeno: existente ? (existente.implementado_estandar ?? '') : '',
                    accion_a_ejecutar: existente ? (existente.accion_ejecutar ?? '') : '',
                    responsable_cierre_accion: existente ? (existente.responsable_cierre ?? '') : '',
                    fecha_cierre: existente ? (existente.fecha_cierre ?? '') : '',
                    criticidad: existente ? (existente.criticidad || '') : '',
                    porcentaje_avance_implementacion_accion: existente ? (existente.porcentaje_avance ?? '') : '',
                    nombre_dueno_control_critico_tecnico: existente ? (existente.nombre_dueno_control ?? '') : '',
                    ultimo_usuario_edito: existente?.ultimo_usuario_edito || '',
                    estado_validacion: existente?.estado_validacion || null,
                    comentario_validacion: existente?.comentario_validacion || '',
                    usuario_validacion: existente?.usuario_validacion || '',
                    fecha_validacion: existente?.fecha_validacion || '',
                    ponderacion: existente?.ponderacion !== undefined ? existente.ponderacion : (existente?.estado_validacion === 'validado' ? 100 : 0)
                  });
                  return;
                }
                
                // Crear una fila por cada pregunta
                preguntas.forEach((pregunta, pregIndex) => {
                  const esPrimeraFila = dimIndex === 0 && pregIndex === 0;
                  const existente = lineaBaseExistente.find(lb => 
                    lb.control_mitigador_id === control.id && 
                    lb.dimension === nombreDimension && 
                    lb.pregunta === pregunta.texto
                  );
                  
                  nuevaLineaBase.push({
                    id: existente?.id || null,
                    control_mitigador_id: control.id,
                    codigo: codigo,
                    control_critico_mitigador: esPrimeraFila ? nombreControl : '', // Solo en primera fila del control
                    dimension: nombreDimension,
                    pregunta: pregunta.texto || '',
                    evidencia: pregunta.evidencia || (existente ? (existente.evidencia ?? '') : ''),
                    verificador_responsable: existente ? (existente.verificador_responsable ?? '') : '',
                    fecha_verificacion: existente ? (existente.fecha_verificacion ?? '') : '',
                    implementado_estandar_desempeno: existente ? (existente.implementado_estandar ?? '') : '',
                    accion_a_ejecutar: existente ? (existente.accion_ejecutar ?? '') : '',
                    responsable_cierre_accion: existente ? (existente.responsable_cierre ?? '') : '',
                    fecha_cierre: existente ? (existente.fecha_cierre ?? '') : '',
                    criticidad: existente ? (existente.criticidad || '') : '',
                    porcentaje_avance_implementacion_accion: existente ? (existente.porcentaje_avance ?? '') : '',
                    nombre_dueno_control_critico_tecnico: existente ? (existente.nombre_dueno_control ?? '') : '',
                    ultimo_usuario_edito: existente?.ultimo_usuario_edito || '',
                    estado_validacion: existente?.estado_validacion || null,
                    comentario_validacion: existente?.comentario_validacion || '',
                    usuario_validacion: existente?.usuario_validacion || '',
                    fecha_validacion: existente?.fecha_validacion || '',
                    ponderacion: existente?.ponderacion !== undefined ? existente.ponderacion : (existente?.estado_validacion === 'validado' ? 100 : 0)
                  });
                });
              });
            });
            setLineaBaseMitigadores(nuevaLineaBase);
          } else {
            // Si no hay línea base guardada, crear desde controles mitigadores
            // Crear una fila por cada dimensión-pregunta de cada control
            const nuevaLineaBase = [];
            
            controlesMitigadores.forEach((control, controlIndex) => {
              const dimensiones = control.dimensiones || [];
              const codigo = control.codigo || `CCM${controlIndex + 1}`;
              const nombreControl = control.descripcion || '';
              
              // Si no hay dimensiones, crear una fila vacía
              if (dimensiones.length === 0) {
                nuevaLineaBase.push({
                  id: null,
                  control_mitigador_id: control.id,
                  codigo: codigo,
                  control_critico_mitigador: nombreControl,
                  dimension: '',
                  pregunta: '',
                  evidencia: '',
                  verificador_responsable: '',
                  fecha_verificacion: '',
                  implementado_estandar_desempeno: '',
                  accion_a_ejecutar: '',
                  responsable_cierre_accion: '',
                  fecha_cierre: '',
                  criticidad: control.criticidad || '',
                  porcentaje_avance_implementacion_accion: '',
                  nombre_dueno_control_critico_tecnico: ''
                });
                return;
              }
              
              // Crear una fila por cada dimensión-pregunta
              dimensiones.forEach((dimension, dimIndex) => {
                const preguntas = dimension.preguntas || [];
                const nombreDimension = dimension.nombre || '';
                
                // Si no hay preguntas, crear una fila solo con la dimensión
                if (preguntas.length === 0) {
                  nuevaLineaBase.push({
                    id: null,
                    control_mitigador_id: control.id,
                    codigo: codigo,
                    control_critico_mitigador: dimIndex === 0 ? nombreControl : '', // Solo en primera fila
                    dimension: nombreDimension,
                    pregunta: '',
                    evidencia: '',
                    verificador_responsable: '',
                    fecha_verificacion: '',
                    implementado_estandar_desempeno: '',
                    accion_a_ejecutar: '',
                    responsable_cierre_accion: '',
                    fecha_cierre: '',
                    criticidad: control.criticidad || '',
                    porcentaje_avance_implementacion_accion: '',
                    nombre_dueno_control_critico_tecnico: ''
                  });
                  return;
                }
                
                // Crear una fila por cada pregunta
                preguntas.forEach((pregunta, pregIndex) => {
                  const esPrimeraFila = dimIndex === 0 && pregIndex === 0;
                  
                  nuevaLineaBase.push({
                    id: null,
                    control_mitigador_id: control.id,
                    codigo: codigo,
                    control_critico_mitigador: esPrimeraFila ? nombreControl : '', // Solo en primera fila del control
                    dimension: nombreDimension,
                    pregunta: pregunta.texto || '',
                    evidencia: pregunta.evidencia || '',
                    verificador_responsable: '',
                    fecha_verificacion: '',
                    implementado_estandar_desempeno: '',
                    accion_a_ejecutar: '',
                    responsable_cierre_accion: '',
                    fecha_cierre: '',
                    criticidad: control.criticidad || '',
                    porcentaje_avance_implementacion_accion: '',
                    nombre_dueno_control_critico_tecnico: ''
                  });
                });
              });
            });
            setLineaBaseMitigadores(nuevaLineaBase);
          }
        } catch (error) {
          console.log('No hay API de línea base mitigadores aún, creando desde controles mitigadores');
          // Si no existe la API, crear desde controles mitigadores
          // Crear una fila por cada dimensión-pregunta de cada control
          const nuevaLineaBase = [];
          
          controlesMitigadores.forEach((control, controlIndex) => {
            const dimensiones = control.dimensiones || [];
            const codigo = control.codigo || `CCM${controlIndex + 1}`;
            const nombreControl = control.descripcion || '';
            
            // Si no hay dimensiones, crear una fila vacía
            if (dimensiones.length === 0) {
              nuevaLineaBase.push({
                id: null,
                control_mitigador_id: control.id,
                codigo: codigo,
                control_critico_mitigador: nombreControl,
                dimension: '',
                pregunta: '',
                evidencia: '',
                verificador_responsable: '',
                fecha_verificacion: '',
                implementado_estandar_desempeno: '',
                accion_a_ejecutar: '',
                responsable_cierre_accion: '',
                fecha_cierre: '',
                criticidad: control.criticidad || '',
                porcentaje_avance_implementacion_accion: '',
                nombre_dueno_control_critico_tecnico: ''
              });
              return;
            }
            
            // Crear una fila por cada dimensión-pregunta
            dimensiones.forEach((dimension, dimIndex) => {
              const preguntas = dimension.preguntas || [];
              const nombreDimension = dimension.nombre || '';
              
              // Si no hay preguntas, crear una fila solo con la dimensión
              if (preguntas.length === 0) {
                nuevaLineaBase.push({
                  id: null,
                  control_mitigador_id: control.id,
                  codigo: codigo,
                  control_critico_mitigador: dimIndex === 0 ? nombreControl : '', // Solo en primera fila
                  dimension: nombreDimension,
                  pregunta: '',
                  evidencia: '',
                  verificador_responsable: '',
                  fecha_verificacion: '',
                  implementado_estandar_desempeno: '',
                  accion_a_ejecutar: '',
                  responsable_cierre_accion: '',
                  fecha_cierre: '',
                  criticidad: control.criticidad || '',
                  porcentaje_avance_implementacion_accion: '',
                  nombre_dueno_control_critico_tecnico: ''
                });
                return;
              }
              
              // Crear una fila por cada pregunta
              preguntas.forEach((pregunta, pregIndex) => {
                const esPrimeraFila = dimIndex === 0 && pregIndex === 0;
                
                nuevaLineaBase.push({
                  id: null,
                  control_mitigador_id: control.id,
                  codigo: codigo,
                  control_critico_mitigador: esPrimeraFila ? nombreControl : '', // Solo en primera fila del control
                  dimension: nombreDimension,
                  pregunta: pregunta.texto || '',
                  evidencia: pregunta.evidencia || '',
                  verificador_responsable: '',
                  fecha_verificacion: '',
                  implementado_estandar_desempeno: '',
                  accion_a_ejecutar: '',
                  responsable_cierre_accion: '',
                  fecha_cierre: '',
                  criticidad: control.criticidad || '',
                  porcentaje_avance_implementacion_accion: '',
                  nombre_dueno_control_critico_tecnico: ''
                });
              });
            });
          });
          setLineaBaseMitigadores(nuevaLineaBase);
        }
      } else {
        setLineaBaseMitigadores([]);
      }
    } catch (error) {
      console.error('Error cargando línea base mitigadores:', error);
      setLineaBaseMitigadores([]);
    } finally {
      setCargandoLineaBaseMitigadores(false);
    }
  };

  const guardarLineaBaseMitigadores = async () => {
    if (!carpetaActual || !lineaBaseMitigadores || lineaBaseMitigadores.length === 0) return;

    try {
      setGuardandoLineaBaseMitigadores(true);
      const datosEnvio = {
        carpeta_id: carpetaActual.id,
        usuario_id: user.id,
        linea_base: lineaBaseMitigadores.map(item => ({
          id: item.id,
          control_mitigador_id: item.control_mitigador_id,
          codigo: item.codigo || '',
          control_critico_mitigador: item.control_critico_mitigador || '',
          dimension: item.dimension || '',
          pregunta: item.pregunta || '',
          evidencia: item.evidencia || '',
          verificador_responsable: item.verificador_responsable || '',
          fecha_verificacion: (item.fecha_verificacion && item.fecha_verificacion.trim() !== '') ? item.fecha_verificacion : null,
          implementado_estandar: item.implementado_estandar_desempeno || '',
          accion_ejecutar: item.accion_a_ejecutar || '',
          responsable_cierre: item.responsable_cierre_accion || '',
          fecha_cierre: (item.fecha_cierre && item.fecha_cierre.trim() !== '') ? item.fecha_cierre : null,
          criticidad: item.criticidad || '',
          porcentaje_avance: item.porcentaje_avance_implementacion_accion || '',
          nombre_dueno_control: item.nombre_dueno_control_critico_tecnico || '',
          ultimo_usuario_edito: item.ultimo_usuario_edito || '',
          estado_validacion: item.estado_validacion || null,
          comentario_validacion: item.comentario_validacion || '',
          usuario_validacion: item.usuario_validacion || '',
          fecha_validacion: (item.fecha_validacion && item.fecha_validacion.trim() !== '') ? item.fecha_validacion : null,
          ponderacion: item.ponderacion !== undefined ? item.ponderacion : (item.estado_validacion === 'validado' ? 100 : 0)
        }))
      };

      const res = await fetch(`${API_BASE}/archivos/carpeta_linea_base_mitigadores.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEnvio)
      });

      const data = await res.json();
      if (data.success) {
        await cargarLineaBaseMitigadores(carpetaActual.id);
        // Recargar promedio de ponderación
        try {
          const resPromedio = await fetch(`${API_BASE}/archivos/promedio_ponderacion.php?carpeta_id=${carpetaActual.id}`);
          const dataPromedio = await resPromedio.json();
          if (dataPromedio.success) {
            setPromedioPonderacionActual(dataPromedio.promedio_general);
            // Actualizar también en el objeto de promedios
            setPromediosPonderacion(prev => ({ ...prev, [carpetaActual.id]: dataPromedio.promedio_general }));
          }
        } catch (error) {
          console.error('Error recargando promedio:', error);
        }
        mostrarNotificacion('✓ Línea base mitigadores guardada correctamente', 'success');
      } else {
        mostrarNotificacion('✗ Error al guardar: ' + (data.error || 'Error desconocido'), 'error', 5000);
      }
    } catch (error) {
      console.error('Error guardando línea base mitigadores:', error);
      mostrarNotificacion('✗ Error al guardar la línea base mitigadores', 'error', 5000);
    } finally {
      setGuardandoLineaBaseMitigadores(false);
    }
  };

  // Función para exportar Línea Base Preventivos a Excel
  const exportarLineaBaseExcel = () => {
    if (!lineaBase || lineaBase.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      // Preparar los datos para Excel
      const datosExcel = lineaBase.map(item => ({
        'Código': item.codigo || '',
        'Controles Críticos Preventivos': item.control_critico_preventivo || '',
        'Dimensión': item.dimension || '',
        'Pregunta': item.pregunta || '',
        'Evidencia': item.evidencia || '',
        'Verificador Responsable': item.verificador_responsable || '',
        'Fecha Verificación': item.fecha_verificacion || '',
        'Implementado Estándar de Desempeño (SI / NO / NA)': item.implementado_estandar_desempeno || '',
        'Acción a Ejecutar': item.accion_a_ejecutar || '',
        'Responsable Cierre de Acción': item.responsable_cierre_accion || '',
        'Fecha de Cierre': item.fecha_cierre || '',
        'Criticidad': item.criticidad || '',
        '% Avance Implementación Acción': item.porcentaje_avance_implementacion_accion || '',
        'Nombre Dueño Control Crítico Técnico (CODELCO VP)': item.nombre_dueno_control_critico_tecnico || '',
        'Último Usuario que Editó': formatearUltimoUsuarioEdito(item.ultimo_usuario_edito)
      }));

      // Crear un libro de trabajo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosExcel);

      // Ajustar el ancho de las columnas
      const colWidths = [
        { wch: 12 },  // Código
        { wch: 40 },  // Controles Críticos Preventivos
        { wch: 15 },  // Dimensión
        { wch: 30 },  // Pregunta
        { wch: 30 },  // Evidencia
        { wch: 25 },  // Verificador Responsable
        { wch: 18 },  // Fecha Verificación
        { wch: 35 },  // Implementado Estándar
        { wch: 30 },  // Acción a Ejecutar
        { wch: 25 },  // Responsable Cierre
        { wch: 18 },  // Fecha de Cierre
        { wch: 12 },  // Criticidad
        { wch: 20 },  // % Avance
        { wch: 40 },  // Nombre Dueño Control
        { wch: 30 }   // Último Usuario
      ];
      ws['!cols'] = colWidths;

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Línea Base Preventivos');

      // Generar el nombre del archivo
      const nombreCarpeta = carpetaActual?.nombre || 'Carpeta';
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Linea_Base_Preventivos_${nombreCarpeta}_${fecha}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, nombreArchivo);
      alert('Archivo Excel exportado correctamente');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel: ' + error.message);
    }
  };

  // Función para exportar Línea Base Mitigadores a Excel
  const exportarLineaBaseMitigadoresExcel = () => {
    if (!lineaBaseMitigadores || lineaBaseMitigadores.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      // Preparar los datos para Excel
      const datosExcel = lineaBaseMitigadores.map(item => ({
        'Código': item.codigo || '',
        'Controles Críticos Mitigadores': item.control_critico_mitigador || '',
        'Dimensión': item.dimension || '',
        'Pregunta': item.pregunta || '',
        'Evidencia': item.evidencia || '',
        'Verificador Responsable': item.verificador_responsable || '',
        'Fecha Verificación': item.fecha_verificacion || '',
        'Implementado Estándar de Desempeño (SI / NO / NA)': item.implementado_estandar_desempeno || '',
        'Acción a Ejecutar': item.accion_a_ejecutar || '',
        'Responsable Cierre de Acción': item.responsable_cierre_accion || '',
        'Fecha de Cierre': item.fecha_cierre || '',
        'Criticidad': item.criticidad || '',
        '% Avance Implementación Acción': item.porcentaje_avance_implementacion_accion || '',
        'Nombre Dueño Control Crítico Técnico (CODELCO VP)': item.nombre_dueno_control_critico_tecnico || '',
        'Último Usuario que Editó': formatearUltimoUsuarioEdito(item.ultimo_usuario_edito)
      }));

      // Crear un libro de trabajo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosExcel);

      // Ajustar el ancho de las columnas
      const colWidths = [
        { wch: 12 },  // Código
        { wch: 40 },  // Controles Críticos Mitigadores
        { wch: 15 },  // Dimensión
        { wch: 30 },  // Pregunta
        { wch: 30 },  // Evidencia
        { wch: 25 },  // Verificador Responsable
        { wch: 18 },  // Fecha Verificación
        { wch: 35 },  // Implementado Estándar
        { wch: 30 },  // Acción a Ejecutar
        { wch: 25 },  // Responsable Cierre
        { wch: 18 },  // Fecha de Cierre
        { wch: 12 },  // Criticidad
        { wch: 20 },  // % Avance
        { wch: 40 },  // Nombre Dueño Control
        { wch: 30 }   // Último Usuario
      ];
      ws['!cols'] = colWidths;

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Línea Base Mitigadores');

      // Generar el nombre del archivo
      const nombreCarpeta = carpetaActual?.nombre || 'Carpeta';
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Linea_Base_Mitigadores_${nombreCarpeta}_${fecha}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, nombreArchivo);
      alert('Archivo Excel exportado correctamente');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel: ' + error.message);
    }
  };

  // Función auxiliar para guardar una sección específica
  const guardarSeccionBowtie = async (seccion, datosSeccion) => {
    if (!carpetaActual || !analisisBowtie) {
      console.error('No hay carpeta actual o análisis Bowtie');
      return false;
    }
    
    try {
      // Preparar datos completos manteniendo los datos actuales de otras secciones
      // Limpiar datos antes de enviar (remover propiedades innecesarias pero mantener estructura)
      const limpiarDatos = (items, tipoSeccion) => {
        if (!items || !Array.isArray(items)) return [];
        return items.map((item, idx) => {
          // Para causas
          if (tipoSeccion === 'causas') {
            return {
              codigo: item.codigo || `CA${idx + 1}`,
              descripcion: item.descripcion || ''
            };
          }
          // Para consecuencias (incluye campos adicionales)
          if (tipoSeccion === 'consecuencias') {
            return {
              codigo: item.codigo || `CO${idx + 1}`,
              descripcion: item.descripcion || '',
              evento_no_deseado: item.evento_no_deseado || null,
              categoria: item.categoria || null
            };
          }
          // Para controles preventivos
          if (tipoSeccion === 'controles_preventivos') {
            const causasAsoc = (item.causas_asociadas || []).map(ca => {
              if (typeof ca === 'string') return { codigo: ca };
              return { codigo: ca.codigo || ca };
            });
            return {
              codigo: item.codigo || `CCP${idx + 1}`,
              descripcion: item.descripcion || '',
              criticidad: item.criticidad || null,
              jerarquia: item.jerarquia || null,
              causas_asociadas: causasAsoc,
              dimensiones: item.dimensiones || []
            };
          }
          // Para controles mitigadores
          if (tipoSeccion === 'controles_mitigadores') {
            const consecuenciasAsoc = (item.consecuencias_asociadas || []).map(co => {
              if (typeof co === 'string') return { codigo: co };
              return { codigo: co.codigo || co };
            });
            return {
              codigo: item.codigo || `CCM${idx + 1}`,
              descripcion: item.descripcion || '',
              criticidad: item.criticidad || null,
              jerarquia: item.jerarquia || null,
              consecuencias_asociadas: consecuenciasAsoc,
              dimensiones: item.dimensiones || []
            };
          }
      if (tipoSeccion === 'controles_preventivos_generales') {
        return {
          codigo: item.codigo || `CP${idx + 1}`,
          nombre_control: item.nombre_control || item.descripcion || '',
          consecuencias: item.consecuencias || '',
          criticidad: item.criticidad || '',
          jerarquia: item.jerarquia || ''
        };
      }
      if (tipoSeccion === 'controles_mitigadores_generales') {
        return {
          codigo: item.codigo || `CM${idx + 1}`,
          nombre_control: item.nombre_control || item.descripcion || '',
          consecuencias: item.consecuencias || '',
          criticidad: item.criticidad || '',
          jerarquia: item.jerarquia || ''
            };
          }
          // Por defecto, mantener estructura básica
          return {
            codigo: item.codigo || null,
            descripcion: item.descripcion || ''
          };
        });
      };

      const datosEnvio = {
        carpeta_id: carpetaActual.id,
        usuario_id: user.id,
        evento_central: analisisBowtie.evento_central || '',
        peligro: analisisBowtie.peligro || '',
        energia: analisisBowtie.energia || '',
        evento_top: analisisBowtie.evento_top || '',
        causas: seccion === 'causas' ? limpiarDatos(datosSeccion, 'causas') : limpiarDatos(analisisBowtie.causas || [], 'causas'),
        controles_preventivos: seccion === 'controles_preventivos' ? limpiarDatos(datosSeccion, 'controles_preventivos') : limpiarDatos(analisisBowtie.controles_preventivos || [], 'controles_preventivos'),
        consecuencias: seccion === 'consecuencias' ? limpiarDatos(datosSeccion, 'consecuencias') : limpiarDatos(analisisBowtie.consecuencias || [], 'consecuencias'),
        controles_mitigadores: seccion === 'controles_mitigadores' ? limpiarDatos(datosSeccion, 'controles_mitigadores') : limpiarDatos(analisisBowtie.controles_mitigadores || [], 'controles_mitigadores'),
        controles_preventivos_generales: seccion === 'controles_preventivos_generales' ? limpiarDatos(datosSeccion, 'controles_preventivos_generales') : limpiarDatos(analisisBowtie.controles_preventivos_generales || [], 'controles_preventivos_generales'),
        controles_mitigadores_generales: seccion === 'controles_mitigadores_generales' ? limpiarDatos(datosSeccion, 'controles_mitigadores_generales') : limpiarDatos(analisisBowtie.controles_mitigadores_generales || [], 'controles_mitigadores_generales')
      };
      
      console.log(`=== GUARDANDO ${seccion.toUpperCase()} ===`);
      console.log(`Datos completos a enviar:`, datosEnvio);
      console.log(`Array de ${seccion} que se enviará (${datosEnvio[seccion].length} elementos):`, datosEnvio[seccion]);
      
      // Log detallado de cada elemento
      datosEnvio[seccion].forEach((item, idx) => {
        console.log(`  ${seccion}[${idx}]:`, {
          codigo: item.codigo,
          descripcion: item.descripcion ? item.descripcion.substring(0, 50) + '...' : '(vacío)',
          descripcion_completa: item.descripcion,
          todas_las_propiedades: Object.keys(item)
        });
      });
      
      console.log(`Estado actual de analisisBowtie.${seccion} (${(analisisBowtie[seccion] || []).length} elementos):`, analisisBowtie[seccion] || []);
      console.log(`Parámetro datosSeccion recibido (${datosSeccion.length} elementos):`, datosSeccion);
      
      const res = await fetch(`${API_BASE}/archivos/carpeta_bowtie.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEnvio)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error HTTP:', res.status, errorText);
        throw new Error(`Error HTTP ${res.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await res.json();
      console.log('Respuesta del servidor:', data);
      
      if (data.success) {
        // Esperar un momento para asegurar que el servidor haya procesado los cambios
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recargar el análisis para obtener los IDs generados
        if (carpetaActual && carpetaActual.id) {
          console.log('Recargando análisis Bowtie después de guardar...');
          try {
            // Forzar recarga pasando el ID explícitamente
            await cargarAnalisisBowtie(carpetaActual.id);
            console.log('Análisis recargado exitosamente');
            
            // Esperar un momento para que React procese la actualización del estado
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Recargar datos desde el servidor para asegurar sincronización
            // No forzar re-render innecesario, solo recargar si es necesario
          } catch (error) {
            console.error('Error al recargar análisis después de guardar:', error);
            // No fallar completamente, los datos ya se guardaron
          }
        }
        return true;
      } else {
        const errorMsg = data.error || 'Error desconocido';
        console.error('Error del servidor:', errorMsg);
        alert('Error al guardar: ' + errorMsg);
        return false;
      }
    } catch (error) {
      console.error(`Error guardando ${seccion}:`, error);
      alert(`Error al guardar ${seccion}: ${error.message || error}`);
      return false;
    }
  };

  // Funciones independientes para cada tabla
  const guardarCausas = async () => {
    if (!carpetaActual || !analisisBowtie) {
      console.error('No se puede guardar: carpetaActual o analisisBowtie es null');
      return;
    }
    
    // Validar que haya al menos una causa con descripción
    const causasConDescripcion = (analisisBowtie.causas || []).filter(c => c.descripcion && c.descripcion.trim().length > 0);
    if (causasConDescripcion.length === 0) {
      alert('Debe agregar al menos una causa con descripción antes de guardar.');
      return;
    }
    
    console.log('Estado actual de causas antes de guardar:', analisisBowtie.causas);
    setGuardandoCausas(true);
    try {
      // Filtrar solo causas con descripción para enviar
      const causasValidas = (analisisBowtie.causas || []).filter(c => c.descripcion && c.descripcion.trim().length > 0);
      const resultado = await guardarSeccionBowtie('causas', causasValidas);
      if (resultado) {
        console.log('Causas guardadas exitosamente');
        // Salir del modo edición para todas las causas guardadas
        setCausasEditando(new Set());
        // Mostrar mensaje de éxito
        alert('Causas guardadas correctamente.');
      } else {
        console.error('Error al guardar causas');
        alert('Error al guardar las causas. Por favor, intente nuevamente.');
      }
    } catch (error) {
      console.error('Excepción al guardar causas:', error);
      alert('Error al guardar las causas: ' + (error.message || error));
    } finally {
      setGuardandoCausas(false);
    }
  };

  const guardarConsecuencias = async () => {
    if (!carpetaActual || !analisisBowtie) {
      console.error('No se puede guardar: carpetaActual o analisisBowtie es null');
      return;
    }
    
    const consecuenciasValidas = (analisisBowtie.consecuencias || []).filter(c => c.descripcion && c.descripcion.trim() !== '');

    if (consecuenciasValidas.length === 0) {
      alert('Debe agregar al menos una consecuencia con descripción antes de guardar.');
      return;
    }

    console.log('Estado actual de consecuencias antes de guardar:', analisisBowtie.consecuencias);
    setGuardandoConsecuencias(true);
    try {
      const resultado = await guardarSeccionBowtie('consecuencias', consecuenciasValidas);
      if (resultado) {
        console.log('Consecuencias guardadas exitosamente');
        // Salir del modo edición para todas las consecuencias guardadas
        setConsecuenciasEditando(new Set());
        // Mostrar mensaje de éxito
        alert('Consecuencias guardadas correctamente.');
      } else {
        console.error('Error al guardar consecuencias');
        alert('Error al guardar las consecuencias. Por favor, intente nuevamente.');
      }
    } catch (error) {
      console.error('Error en guardarConsecuencias:', error);
      alert('Error al guardar las consecuencias. Por favor, intente nuevamente.');
    } finally {
      setGuardandoConsecuencias(false);
    }
  };

  const guardarControlesPreventivos = async () => {
    if (!carpetaActual || !analisisBowtie) {
      console.error('No se puede guardar: carpetaActual o analisisBowtie es null');
      return;
    }
    
    const controlesValidos = (analisisBowtie.controles_preventivos || []).filter(c => c.descripcion && c.descripcion.trim() !== '');

    if (controlesValidos.length === 0) {
      alert('Debe agregar al menos un control preventivo con descripción antes de guardar.');
      return;
    }

    console.log('Estado actual de controles preventivos antes de guardar:', analisisBowtie.controles_preventivos);
    setGuardandoControlesPreventivos(true);
    try {
      const resultado = await guardarSeccionBowtie('controles_preventivos', controlesValidos);
      if (resultado) {
        console.log('Controles preventivos guardados exitosamente');
        // Salir del modo edición para todos los controles guardados
        setControlesPreventivosEditando(new Set());
        // Mostrar mensaje de éxito
        alert('Controles preventivos guardados correctamente.');
      } else {
        console.error('Error al guardar controles preventivos');
        alert('Error al guardar los controles preventivos. Por favor, intente nuevamente.');
      }
    } catch (error) {
      console.error('Error en guardarControlesPreventivos:', error);
      alert('Error al guardar los controles preventivos. Por favor, intente nuevamente.');
    } finally {
      setGuardandoControlesPreventivos(false);
    }
  };

  const guardarControlesMitigadores = async () => {
    if (!carpetaActual || !analisisBowtie) {
      console.error('No se puede guardar: carpetaActual o analisisBowtie es null');
      return;
    }
    
    const controlesValidos = (analisisBowtie.controles_mitigadores || []).filter(c => c.descripcion && c.descripcion.trim() !== '');

    if (controlesValidos.length === 0) {
      alert('Debe agregar al menos un control mitigador con descripción antes de guardar.');
      return;
    }

    console.log('Estado actual de controles mitigadores antes de guardar:', analisisBowtie.controles_mitigadores);
    setGuardandoControlesMitigadores(true);
    try {
      const resultado = await guardarSeccionBowtie('controles_mitigadores', controlesValidos);
      if (resultado) {
        console.log('Controles mitigadores guardados exitosamente');
        // Salir del modo edición para todos los controles guardados
        setControlesMitigadoresEditando(new Set());
        // Mostrar mensaje de éxito
        alert('Controles mitigadores guardados correctamente.');
      } else {
        console.error('Error al guardar controles mitigadores');
        alert('Error al guardar los controles mitigadores. Por favor, intente nuevamente.');
      }
    } catch (error) {
      console.error('Error en guardarControlesMitigadores:', error);
      alert('Error al guardar los controles mitigadores. Por favor, intente nuevamente.');
    } finally {
      setGuardandoControlesMitigadores(false);
    }
  };

  const guardarControlesPreventivosGenerales = async () => {
    if (!carpetaActual || !analisisBowtie) {
      console.error('No se puede guardar: carpetaActual o analisisBowtie es null');
      return;
    }

    const controlesValidos = (analisisBowtie.controles_preventivos_generales || []).filter(c => c.nombre_control && c.nombre_control.trim() !== '');
    if (controlesValidos.length === 0) {
      alert('Debe agregar al menos un control preventivo general con nombre antes de guardar.');
      return;
    }

    setGuardandoControlesPreventivosGenerales(true);
    try {
      const resultado = await guardarSeccionBowtie('controles_preventivos_generales', controlesValidos);
      if (resultado) {
        setControlesPreventivosGeneralesEditando(new Set());
        alert('Controles preventivos generales guardados correctamente.');
      } else {
        alert('Error al guardar los controles preventivos generales. Por favor, intente nuevamente.');
      }
    } catch (error) {
      console.error('Error en guardarControlesPreventivosGenerales:', error);
      alert('Error al guardar los controles preventivos generales. Por favor, intente nuevamente.');
    } finally {
      setGuardandoControlesPreventivosGenerales(false);
    }
  };

  const guardarControlesMitigadoresGenerales = async () => {
    if (!carpetaActual || !analisisBowtie) {
      console.error('No se puede guardar: carpetaActual o analisisBowtie es null');
      return;
    }

    const controlesValidos = (analisisBowtie.controles_mitigadores_generales || []).filter(c => c.nombre_control && c.nombre_control.trim() !== '');
    if (controlesValidos.length === 0) {
      alert('Debe agregar al menos un control mitigador general con nombre antes de guardar.');
      return;
    }

    setGuardandoControlesMitigadoresGenerales(true);
    try {
      const resultado = await guardarSeccionBowtie('controles_mitigadores_generales', controlesValidos);
      if (resultado) {
        setControlesMitigadoresGeneralesEditando(new Set());
        alert('Controles mitigadores generales guardados correctamente.');
      } else {
        alert('Error al guardar los controles mitigadores generales. Por favor, intente nuevamente.');
      }
    } catch (error) {
      console.error('Error en guardarControlesMitigadoresGenerales:', error);
      alert('Error al guardar los controles mitigadores generales. Por favor, intente nuevamente.');
    } finally {
      setGuardandoControlesMitigadoresGenerales(false);
    }
  };

  const guardarInformacionRiesgo = async () => {
    if (!carpetaActual || !informacionRiesgo) return;
    
    try {
      const res = await fetch(`${API_BASE}/archivos/carpetas.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: carpetaActual.id,
          nombre: carpetaActual.nombre,
          descripcion: carpetaActual.descripcion,
          usuario_id: user.id,
          evento_no_deseado: informacionRiesgo.evento_no_deseado,
          evento_riesgo: informacionRiesgo.evento_riesgo,
          controles_supervisor: JSON.stringify(informacionRiesgo.controles_supervisor),
          controles_trabajador: JSON.stringify(informacionRiesgo.controles_trabajador),
          informacion_riesgo: informacionRiesgo.informacion_riesgo
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Información de riesgo crítico guardada correctamente');
        setEditandoRiesgo(false);
        // Recargar la información
        cargarInformacionRiesgo(carpetaActual.id);
      } else {
        alert('Error al guardar: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error guardando información de riesgo:', error);
      alert('Error al guardar la información de riesgo crítico');
    }
  };

  const agregarControl = (rol, tipo) => {
    if (!informacionRiesgo) return;
    const nuevoControl = { numero: '', descripcion: '', pregunta: '', respuesta: '' };
    const nuevosControles = { ...informacionRiesgo };
    nuevosControles[`controles_${rol}`][tipo].push(nuevoControl);
    setInformacionRiesgo(nuevosControles);
  };

  const eliminarControl = (rol, tipo, index) => {
    if (!informacionRiesgo) return;
    const nuevosControles = { ...informacionRiesgo };
    nuevosControles[`controles_${rol}`][tipo].splice(index, 1);
    setInformacionRiesgo(nuevosControles);
  };

  const actualizarControl = (rol, tipo, index, campo, valor) => {
    if (!informacionRiesgo) return;
    const nuevosControles = { ...informacionRiesgo };
    nuevosControles[`controles_${rol}`][tipo][index][campo] = valor;
    setInformacionRiesgo(nuevosControles);
  };

  const crearMensaje = async (mensajePadreId = null, textoRespuesta = null) => {
    // Si se pasa textoRespuesta, es una respuesta inline desde un mensaje específico
    const mensajeTexto = textoRespuesta ? textoRespuesta.trim() : (mensajeRespondiendo ? respuestaMensaje.trim() : nuevoMensaje.trim());
    if (!mensajeTexto) return;
    
    // Extraer solo valores primitivos para evitar referencias circulares
    let mensajePadreIdFinal = null;
    if (mensajePadreId) {
      mensajePadreIdFinal = typeof mensajePadreId === 'object' ? (mensajePadreId.id || null) : mensajePadreId;
    } else if (mensajeRespondiendo) {
      mensajePadreIdFinal = typeof mensajeRespondiendo === 'object' && mensajeRespondiendo !== null 
        ? (mensajeRespondiendo.id || null) 
        : (typeof mensajeRespondiendo === 'number' ? mensajeRespondiendo : null);
    }
    
    // Asegurar que los IDs son números o null
    const carpetaId = typeof carpetaActual?.id === 'number' ? carpetaActual.id : parseInt(carpetaActual?.id) || null;
    const usuarioId = typeof user?.id === 'number' ? user.id : parseInt(user?.id) || null;
    
    try {
      const payload = {
        carpeta_id: carpetaId,
        usuario_id: usuarioId,
        mensaje: mensajeTexto,
        mensaje_padre_id: mensajePadreIdFinal
      };
      
      const res = await fetch(`${API_BASE}/archivos/carpeta_mensajes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }
      
      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }
      
      if (data.success) {
        setNuevoMensaje('');
        setMensajeRespondiendo(null);
        setRespuestaMensaje('');
        // Cerrar el formulario inline si estaba abierto
        if (mensajePadreIdFinal) {
          setRespuestasAbiertas(prev => {
            const nuevas = { ...prev };
            delete nuevas[mensajePadreIdFinal];
            return nuevas;
          });
        }
        cargarMensajesForo(carpetaActual.id);
        mostrarNotificacion('✓ Mensaje publicado correctamente', 'success');
      } else if (data.error) {
        mostrarNotificacion('✗ Error al crear mensaje: ' + data.error, 'error', 5000);
      } else {
        mostrarNotificacion('✗ Error al crear mensaje: Respuesta inesperada del servidor', 'error', 5000);
      }
    } catch (error) {
      console.error('Error creando mensaje:', error);
      const errorMessage = error.message || 'Error de conexión';
      // Evitar mostrar el error de estructura circular en la notificación
      if (errorMessage.includes('circular') || errorMessage.includes('Converting')) {
        mostrarNotificacion('✗ Error al crear mensaje: Error de formato. Por favor, intente nuevamente.', 'error', 5000);
      } else {
        mostrarNotificacion('✗ Error al crear mensaje: ' + errorMessage, 'error', 5000);
      }
    }
  };

  const crearTarea = async () => {
    if (!nuevaTarea.titulo.trim()) {
      alert('El título es requerido');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_tareas.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carpeta_id: carpetaActual.id,
          titulo: nuevaTarea.titulo,
          descripcion: nuevaTarea.descripcion || '',
          creado_por: user.id,
          asignados_a: nuevaTarea.asignados_a || [], // Array de IDs
          fecha_vencimiento: nuevaTarea.fecha_vencimiento || null,
          prioridad: nuevaTarea.prioridad,
          recordatorio_en: nuevaTarea.recordatorio_en || null
        })
      });
      
      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }
      
      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }
      
      if (data.success) {
        setModalCrearTarea(false);
        setNuevaTarea({
          titulo: '',
          descripcion: '',
          asignados_a: [],
          fecha_vencimiento: '',
          prioridad: 'media',
          recordatorio_en: ''
        });
        cargarTareas(carpetaActual.id);
      } else if (data.error) {
        alert('Error al crear tarea: ' + data.error);
      } else {
        alert('Error al crear tarea: Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error creando tarea:', error);
      alert('Error al crear tarea: ' + (error.message || 'Error de conexión'));
    }
  };

  const actualizarEstadoTarea = async (tareaId, nuevoEstado) => {
    try {
      // Primero obtener la tarea actual para mantener título y descripción
      const tareaActual = tareas.find(t => t.id === tareaId);
      if (!tareaActual) {
        alert('Tarea no encontrada');
        return;
      }
      
      const res = await fetch(`${API_BASE}/archivos/carpeta_tareas.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tareaId,
          titulo: tareaActual.titulo,
          descripcion: tareaActual.descripcion || '',
          estado: nuevoEstado,
          usuario_id: user.id // Incluir usuario_id para verificar si requiere validación
        })
      });
      
      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }
      
      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }
      
      if (data.success) {
        cargarTareas(carpetaActual.id);
      } else if (data.error) {
        alert('Error al actualizar tarea: ' + data.error);
      } else {
        alert('Error al actualizar tarea: Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      alert('Error al actualizar tarea: ' + (error.message || 'Error de conexión'));
    }
  };

  const cargarCarpetas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        proyecto_id: proyectoId,
        carpeta_padre_id: carpetaActual ? carpetaActual.id : 0
      });
      if (centroCostoId) {
        params.append('centro_costo_id', centroCostoId);
      }
      // Agregar usuario_id para filtrar carpetas asignadas (importante para trabajadores y admin)
      if (user && user.id) {
        params.append('usuario_id', user.id);
      }
      
      const res = await fetch(`${API_BASE}/archivos/carpetas.php?${params}`);
      
      if (!res.ok) {
        if (res.status === 403) {
          const errorData = await res.json().catch(() => ({ error: 'No tiene acceso a esta carpeta' }));
          console.warn('Acceso denegado:', errorData.error);
          // No mostrar alert aquí, solo limpiar carpetas
          setCarpetas([]);
          setLoading(false);
          return;
        }
        throw new Error(`Error HTTP ${res.status}`);
      }
      
      const data = await res.json();
      const carpetasData = Array.isArray(data) ? data : [];
      setCarpetas(carpetasData);
      
      // Cargar promedios de ponderación en cascada ascendente
      // Nivel 0: muestra promedio de todas sus subcarpetas (nivel 1 y nivel 2)
      // Nivel 1: muestra promedio de todas sus subcarpetas (nivel 2)
      // Nivel 2: muestra su propio promedio
      const promedios = {};
      if (rutaNavegacion.length === 0 || rutaNavegacion.length === 1) {
        await Promise.all(carpetasData.map(async (carpeta) => {
          try {
            const resPromedio = await fetch(`${API_BASE}/archivos/promedio_ponderacion.php?carpeta_id=${carpeta.id}`);
            const dataPromedio = await resPromedio.json();
            if (dataPromedio.success) {
              promedios[carpeta.id] = dataPromedio.promedio_general;
            }
          } catch (error) {
            console.error(`Error cargando promedio para carpeta ${carpeta.id}:`, error);
          }
        }));
      }
      setPromediosPonderacion(promedios);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      setCarpetas([]);
    }
    setLoading(false);
  };

  const cargarArchivos = async (carpetaId) => {
    try {
      const res = await fetch(`${API_BASE}/archivos/archivos.php?carpeta_id=${carpetaId}${user && user.id ? `&usuario_id=${user.id}` : ''}`);
      const data = await res.json();
      setArchivos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      setArchivos([]);
    }
  };

  const subirArchivoConProgreso = (file, carpetaId, usuarioId, index, total) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('carpeta_id', carpetaId);
      formData.append('usuario_id', usuarioId);
      
      const xhr = new XMLHttpRequest();
      
      // Actualizar progreso
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progreso = Math.round((e.loaded / e.total) * 100);
          setArchivosSubiendo(prev => {
            const nuevos = [...prev];
            if (nuevos[index]) {
              nuevos[index] = { ...nuevos[index], progreso };
            }
            return nuevos;
          });
          
          // Actualizar progreso general
          setUploadProgress(prev => {
            if (!prev) return prev;
            const progresoGeneral = Math.round(((index * 100) + progreso) / total);
            return { ...prev, progresoGeneral };
          });
        }
      });
      
      // Manejar respuesta
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              setArchivosSubiendo(prev => {
                const nuevos = [...prev];
                if (nuevos[index]) {
                  nuevos[index] = { ...nuevos[index], progreso: 100, estado: 'completado' };
                }
                return nuevos;
              });
              
              setUploadProgress(prev => {
                if (!prev) return prev;
                return { ...prev, completados: prev.completados + 1 };
              });
              
              resolve(data);
            } else {
              setArchivosSubiendo(prev => {
                const nuevos = [...prev];
                if (nuevos[index]) {
                  nuevos[index] = { ...nuevos[index], estado: 'error', error: data.error || 'Error desconocido' };
                }
                return nuevos;
              });
              reject(new Error(data.error || 'Error al subir archivo'));
            }
          } catch (e) {
            setArchivosSubiendo(prev => {
              const nuevos = [...prev];
              if (nuevos[index]) {
                nuevos[index] = { ...nuevos[index], estado: 'error', error: 'Error al procesar respuesta' };
              }
              return nuevos;
            });
            reject(new Error('Error al procesar respuesta del servidor'));
          }
        } else {
          setArchivosSubiendo(prev => {
            const nuevos = [...prev];
            if (nuevos[index]) {
              nuevos[index] = { ...nuevos[index], estado: 'error', error: `Error HTTP ${xhr.status}` };
            }
            return nuevos;
          });
          reject(new Error(`Error HTTP ${xhr.status}`));
        }
      });
      
      // Manejar errores
      xhr.addEventListener('error', () => {
        setArchivosSubiendo(prev => {
          const nuevos = [...prev];
          if (nuevos[index]) {
            nuevos[index] = { ...nuevos[index], estado: 'error', error: 'Error de conexión' };
          }
          return nuevos;
        });
        reject(new Error('Error de conexión'));
      });
      
      // Enviar petición
      xhr.open('POST', `${API_BASE}/archivos/archivos.php`);
      xhr.send(formData);
    });
  };

  const cargarUsuarios = async () => {
    try {
      // Intentar obtener usuarios desde la API de usuarios o desde login
      const res = await fetch(`${API_BASE}/listar_usuarios.php`);
      if (res.ok) {
        const data = await res.json();
        setUsuarios(Array.isArray(data) ? data : []);
      } else {
        // Si no existe la API, usar datos del localStorage o array vacío
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setUsuarios([]);
    }
  };

  const cargarUsuariosAsignados = async (carpetaId) => {
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_usuarios.php?carpeta_id=${carpetaId}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Error HTTP ${res.status}` }));
        console.error('Error cargando usuarios asignados:', errorData.error || `HTTP ${res.status}`);
        setUsuariosAsignados([]);
        return;
      }
      
      const data = await res.json();
      setUsuariosAsignados(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando usuarios asignados:', error);
      setUsuariosAsignados([]);
    }
  };

  // Cargar usuarios asignados cuando se abre el modal desde una carpeta de nivel 2
  useEffect(() => {
    if (modalAsignarUsuario && modalAsignarUsuario.id) {
      cargarUsuariosAsignados(modalAsignarUsuario.id);
    }
  }, [modalAsignarUsuario]);

  const cargarParticipantesCarpeta = async (carpetaId) => {
    if (!carpetaId) return;
    
    setCargandoParticipantes(true);
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_usuarios.php?carpeta_id=${carpetaId}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Error HTTP ${res.status}` }));
        console.error('Error cargando participantes:', errorData.error || `HTTP ${res.status}`);
        setParticipantesCarpeta([]);
        setCargandoParticipantes(false);
        return;
      }
      
      const data = await res.json();
      setParticipantesCarpeta(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando participantes:', error);
      setParticipantesCarpeta([]);
    } finally {
      setCargandoParticipantes(false);
    }
  };

  const abrirModalParticipantes = () => {
    if (carpetaActual) {
      setModalVerParticipantes(true);
      cargarParticipantesCarpeta(carpetaActual.id);
    }
  };

  const handleCrearCarpeta = async () => {
    if (!nuevaCarpeta.nombre.trim()) {
      alert('El nombre de la carpeta es requerido');
      return;
    }

    try {
      let icono_url = null;
      
      // Si hay un icono para subir, subirlo primero
      if (nuevaCarpeta.icono_file) {
        const formData = new FormData();
        formData.append('icono', nuevaCarpeta.icono_file);
        formData.append('usuario_id', user.id);
        
        const uploadRes = await fetch(`${API_BASE}/archivos/subir_icono_carpeta.php`, {
          method: 'POST',
          body: formData
        });
        
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          icono_url = uploadData.icono_url;
        } else {
          alert('Error al subir el icono: ' + (uploadData.error || 'Error desconocido'));
          return;
        }
      } else if (nuevaCarpeta.icono_url && nuevaCarpeta.icono_url.trim()) {
        // Si hay un icono_url predefinido (sin archivo para subir), normalizar la ruta
        let rutaIcono = nuevaCarpeta.icono_url.trim();
        
        // Si empieza con @, removerlo (ej: @rc01.png -> rc01.png)
        if (rutaIcono.startsWith('@')) {
          rutaIcono = rutaIcono.substring(1);
        }
        
        // Si no empieza con /, asumir que es un icono predefinido en /img/iconos/
        if (!rutaIcono.startsWith('/') && !rutaIcono.startsWith('http')) {
          icono_url = '/img/iconos/' + rutaIcono;
        } else {
          icono_url = rutaIcono;
        }
      }
      
      const res = await fetch(`${API_BASE}/archivos/carpetas.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevaCarpeta.nombre,
          descripcion: nuevaCarpeta.descripcion,
          proyecto_id: proyectoId,
          centro_costo_id: centroCostoId || null,
          carpeta_padre_id: carpetaActual ? carpetaActual.id : null,
          creado_por: user.id,
          color_primario: user.rol === 'super_admin' ? nuevaCarpeta.color_primario || null : null,
          color_secundario: user.rol === 'super_admin' ? nuevaCarpeta.color_secundario || null : null,
          icono_url: icono_url
        })
      });

      // Verificar el tipo de contenido de la respuesta
      const contentType = res.headers.get('content-type');
      let data;
      
      // Intentar parsear como JSON primero
      const text = await res.text();
      console.log('Respuesta del servidor (primeros 500 caracteres):', text.substring(0, 500));
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Error parseando JSON:', e);
          console.error('Texto recibido:', text);
          throw new Error('El servidor devolvió una respuesta que no es JSON válido. Respuesta: ' + text.substring(0, 200));
        }
      } else {
        // Si no es JSON, intentar parsearlo de todas formas (por si los headers están mal)
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Respuesta no JSON del servidor:', text.substring(0, 500));
          throw new Error('El servidor devolvió una respuesta no válida. Verifica que las tablas de base de datos estén creadas ejecutando: api/database/crear_tablas_carpetas_archivos.sql. Respuesta: ' + text.substring(0, 200));
        }
      }

      if (data.success) {
        setModalCrearCarpeta(false);
        setNuevaCarpeta({ nombre: '', descripcion: '', color_primario: '', color_secundario: '', icono_url: '' });
        setIconoPreview(null);
        cargarCarpetas();
      } else {
        const errorMsg = data.error || 'Error desconocido';
        console.error('Error del servidor:', errorMsg);
        alert('Error al crear carpeta: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error creando carpeta:', error);
      alert('Error al crear carpeta: ' + (error.message || 'Error de conexión'));
    }
  };

  const handleEditarCarpeta = async () => {
    if (!modalEditarCarpeta || !modalEditarCarpeta.nombre.trim()) {
      alert('El nombre de la carpeta es requerido');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/archivos/carpetas.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modalEditarCarpeta.id,
          nombre: modalEditarCarpeta.nombre,
          descripcion: modalEditarCarpeta.descripcion,
          usuario_id: user.id,
          color_primario: user.rol === 'super_admin' ? (modalEditarCarpeta.color_primario || null) : null,
          color_secundario: user.rol === 'super_admin' ? (modalEditarCarpeta.color_secundario || null) : null
        })
      });

      const data = await res.json();
      if (data.success) {
        setModalEditarCarpeta(null);
        cargarCarpetas();
        if (carpetaActual && carpetaActual.id === modalEditarCarpeta.id) {
          setCarpetaActual({ ...carpetaActual, nombre: modalEditarCarpeta.nombre, descripcion: modalEditarCarpeta.descripcion });
        }
      } else {
        alert('Error al editar carpeta: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error editando carpeta:', error);
      alert('Error al editar carpeta');
    }
  };

  const handleEliminarCarpeta = async (carpetaId) => {
    // Buscar la carpeta para mostrar su nombre en el mensaje
    const carpeta = carpetas.find(c => c.id === carpetaId);
    const nombreCarpeta = carpeta ? carpeta.nombre : 'esta carpeta';
    
    const mensaje = `¿Estás seguro de eliminar la carpeta "${nombreCarpeta}"?\n\n` +
                   `⚠️ ADVERTENCIA: Esta acción eliminará en cascada:\n` +
                   `• Todos los archivos dentro de la carpeta\n` +
                   `• Todas las subcarpetas y su contenido\n` +
                   `• Los archivos físicos del servidor\n\n` +
                   `Esta acción NO se puede deshacer.`;
    
    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      const url = `${API_BASE}/archivos/carpetas.php?id=${carpetaId}&usuario_id=${user.id}`;
      console.log('Eliminando carpeta, URL:', url);
      console.log('API_BASE:', API_BASE);
      
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Respuesta recibida:', res.status, res.statusText);

      // Verificar el tipo de contenido de la respuesta
      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.log('Respuesta no JSON:', text.substring(0, 500));
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor (HTTP ' + res.status + '): ' + text.substring(0, 200));
        }
      }

      if (res.ok && data.success) {
        // Mostrar modal de éxito con el resultado
        setModalEliminacionExito({
          nombre: nombreCarpeta,
          archivos: data.archivos_eliminados || 0,
          subcarpetas: data.subcarpetas_eliminadas || 0
        });
        
        if (carpetaActual && carpetaActual.id === carpetaId) {
          setCarpetaActual(null);
          setRutaNavegacion([]);
        }
        cargarCarpetas();
      } else {
        alert('Error al eliminar carpeta: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error eliminando carpeta:', error);
      console.error('URL intentada:', `${API_BASE}/archivos/carpetas.php?id=${carpetaId}&usuario_id=${user.id}`);
      alert('Error al eliminar carpeta: ' + (error.message || 'Error de conexión') + '\n\nVerifica la consola del navegador (F12) para más detalles.');
    }
  };

  const handleAsignarUsuario = async (usuarioId, permisos) => {
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_usuarios.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carpeta_id: modalAsignarUsuario.id,
          usuario_id: usuarioId,
          puede_ver: permisos.ver ? 1 : 0,
          puede_subir: permisos.subir ? 1 : 0,
          puede_editar: permisos.editar ? 1 : 0,
          puede_eliminar: permisos.eliminar ? 1 : 0,
          asignado_por: user.id
        })
      });

      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }
      
      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }
      
      if (data.success) {
        cargarUsuariosAsignados(modalAsignarUsuario.id);
      } else if (data.error) {
        alert('Error al asignar usuario: ' + data.error);
      } else {
        alert('Error al asignar usuario: Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error asignando usuario:', error);
      alert('Error al asignar usuario: ' + (error.message || 'Error de conexión'));
    }
  };

  const handleQuitarUsuario = async (usuarioId) => {
    try {
      const res = await fetch(`${API_BASE}/archivos/carpeta_usuarios.php?carpeta_id=${modalAsignarUsuario.id}&usuario_id=${usuarioId}&quita_por=${user.id}`, {
        method: 'DELETE'
      });

      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }
      
      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }
      
      if (data.success) {
        cargarUsuariosAsignados(modalAsignarUsuario.id);
      } else if (data.error) {
        alert('Error al quitar usuario: ' + data.error);
      } else {
        alert('Error al quitar usuario: Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error quitando usuario:', error);
      alert('Error al quitar usuario: ' + (error.message || 'Error de conexión'));
    }
  };

  const entrarCarpeta = (carpeta) => {
    setCarpetaActual(carpeta);
    setRutaNavegacion([...rutaNavegacion, carpeta]);
  };

  const volverAtras = () => {
    if (rutaNavegacion.length > 0) {
      const nuevaRuta = rutaNavegacion.slice(0, -1);
      setRutaNavegacion(nuevaRuta);
      setCarpetaActual(nuevaRuta.length > 0 ? nuevaRuta[nuevaRuta.length - 1] : null);
    } else {
      setCarpetaActual(null);
      setRutaNavegacion([]);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '70vh',
        fontSize: '18px',
        color: '#17a2b8'
      }}>
        Cargando carpetas...
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {carpetaActual ? (
          // Cuando hay una carpeta seleccionada, mostrar nombre e icono de la carpeta
          (() => {
            const colores = obtenerColoresCarpeta(carpetaActual.nombre, carpetaActual.id, carpetaActual.color_primario, carpetaActual.color_secundario);
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                {/* Icono de la carpeta */}
                {carpetaActual.icono_url ? (
                  <img 
                    src={(() => {
                      if (carpetaActual.icono_url.startsWith('http')) {
                        return carpetaActual.icono_url;
                      }
                      if (carpetaActual.icono_url.startsWith('/api/')) {
                        const baseUrl = API_BASE.replace('/api', '');
                        return baseUrl + carpetaActual.icono_url;
                      }
                      if (carpetaActual.icono_url.startsWith('/')) {
                        if (process.env.NODE_ENV === 'development' && (window.location.port === '3001' || window.location.port === '3000' || window.location.port === '3002')) {
                          return 'http://localhost/rcritico' + carpetaActual.icono_url;
                        }
                        return (APP_URL || BASE_URL) + carpetaActual.icono_url;
                      }
                      const baseUrl = process.env.NODE_ENV === 'development' && (window.location.port === '3001' || window.location.port === '3000' || window.location.port === '3002')
                        ? 'http://localhost/rcritico'
                        : (APP_URL || BASE_URL);
                      return baseUrl + '/' + carpetaActual.icono_url;
                    })()} 
                    alt={carpetaActual.nombre}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'contain',
                      flexShrink: 0
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const iconElement = e.target.nextElementSibling;
                      if (iconElement) iconElement.style.display = 'flex';
                    }}
                  />
                ) : null}
                <i 
                  className={`fa ${carpetaActual.cantidad_archivos > 0 || carpetaActual.cantidad_subcarpetas > 0 ? 'fa-folder-open' : 'fa-folder'}`}
                  style={{ 
                    display: carpetaActual.icono_url ? 'none' : 'flex',
                    fontSize: '48px',
                    color: '#F2A900',
                    flexShrink: 0
                  }}
                ></i>
                <div>
                  <h1 style={{ margin: 0, color: '#17a2b8', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {carpetaActual.nombre}
                  </h1>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Información del Riesgo Crítico
                  </p>
                </div>
              </div>
            );
          })()
        ) : (
          // Cuando no hay carpeta seleccionada, mostrar el banner genérico
          <div>
            <h1 style={{ margin: 0, color: '#17a2b8', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa fa-folder-open" style={{ color: '#F2A900' }}></i>
              Gestión de Archivos
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Organiza y gestiona archivos por proyecto y centro de costo
            </p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {carpetaActual && (
            <button
              onClick={() => {
                if (carpetaActual) {
                  abrirModalParticipantes();
                }
              }}
              style={{
                background: '#0ba360',
                color: 'white',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(11, 163, 96, 0.3)'
              }}
            >
              <i className="fa fa-users"></i> Participantes
            </button>
          )}
          {canCreateFolders(user) && (
            <button
              onClick={() => setModalCrearCarpeta(true)}
              style={{
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa fa-plus"></i> Crear Carpeta
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      {rutaNavegacion.length > 0 && (
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              setCarpetaActual(null);
              setRutaNavegacion([]);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#17a2b8',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <i className="fa fa-home"></i> Inicio
          </button>
          {rutaNavegacion.map((carpeta, index) => (
            <React.Fragment key={`ruta-${carpeta.id}-${index}`}>
              <span style={{ color: '#999' }}>/</span>
              <button
                onClick={() => {
                  const nuevaRuta = rutaNavegacion.slice(0, index + 1);
                  setRutaNavegacion(nuevaRuta);
                  setCarpetaActual(carpeta);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: index === rutaNavegacion.length - 1 ? '#17a2b8' : '#FF8C00',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: index === rutaNavegacion.length - 1 ? 'bold' : 'normal'
                }}
              >
                {carpeta.nombre}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Grid de Carpetas - Diseño Compacto y Profesional */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {carpetas.map((carpeta, carpetaIndex) => {
          const totalItems = (carpeta.cantidad_archivos || 0) + (carpeta.cantidad_subcarpetas || 0);
          const tieneContenido = totalItems > 0;
          const colores = obtenerColoresCarpeta(carpeta.nombre, carpeta.id, carpeta.color_primario, carpeta.color_secundario);
          
          return (
            <div
              key={`carpeta-${carpeta.id}-${carpetaIndex}`}
              onClick={() => entrarCarpeta(carpeta)}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                border: `2px solid ${tieneContenido ? colores.primary + '30' : 'rgba(0,0,0,0.08)'}`,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${colores.primary}30, 0 4px 8px rgba(0,0,0,0.12)`;
                e.currentTarget.style.borderColor = colores.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = tieneContenido ? colores.primary + '30' : 'rgba(0,0,0,0.08)';
              }}
            >
              {/* Icono destacado en la parte superior */}
              <div
                style={{
                  background: tieneContenido 
                    ? `linear-gradient(135deg, ${colores.primary} 0%, ${colores.secondary} 100%)` 
                    : 'linear-gradient(135deg, #e8e8e8 0%, #f0f0f0 100%)',
                  padding: '1.25rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '100px'
                }}
              >
                {/* Efecto de brillo sutil */}
                <div style={{
                  position: 'absolute',
                  top: '-30%',
                  right: '-30%',
                  width: '150%',
                  height: '150%',
                  background: tieneContenido 
                    ? `radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)` 
                    : 'none',
                  pointerEvents: 'none'
                }}></div>
                
                {/* Icono grande y destacado */}
                <div style={{
                  fontSize: '56px',
                  color: tieneContenido ? '#ffffff' : '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  background: tieneContenido ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  borderRadius: '16px',
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: tieneContenido ? '0 6px 20px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  border: tieneContenido ? '2px solid rgba(255,255,255,0.3)' : 'none'
                }}>
                  {carpeta.icono_url ? (
                    <img 
                      src={(() => {
                        // Si ya es una URL completa (http/https), usarla directamente
                        if (carpeta.icono_url.startsWith('http')) {
                          return carpeta.icono_url;
                        }
                        
                        // Construir la URL completa
                        // En desarrollo con React dev server, siempre usar localhost/rcritico
                        let baseUrl = '';
                        if (process.env.NODE_ENV === 'development' && (window.location.port === '3001' || window.location.port === '3000' || window.location.port === '3002')) {
                          baseUrl = 'http://localhost/rcritico';
                        } else {
                          // En producción, usar la URL base sin puerto
                          baseUrl = window.location.origin;
                          // Si el pathname incluye /rcritico o /ssocaren, agregarlo
                          const pathname = window.location.pathname;
                          if (pathname.includes('/rcritico')) {
                            baseUrl += '/rcritico';
                          } else if (pathname.includes('/ssocaren')) {
                            baseUrl += '/ssocaren';
                          }
                        }
                        
                        // Si la ruta del icono ya empieza con /, concatenar directamente
                        if (carpeta.icono_url.startsWith('/')) {
                          return baseUrl + carpeta.icono_url;
                        }
                        
                        // Si no, agregar el separador
                        return baseUrl + '/' + carpeta.icono_url;
                      })()} 
                      alt={carpeta.nombre}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: '8px'
                      }}
                      onError={(e) => {
                        // Si falla la carga del icono, ocultar la imagen y mostrar el icono por defecto
                        console.error('Error cargando icono:', {
                          icono_url: carpeta.icono_url,
                          url_intentada: e.target.src,
                          api_base: API_BASE,
                          app_url: APP_URL,
                          base_url: BASE_URL,
                          window_origin: window.location.origin,
                          window_pathname: window.location.pathname
                        });
                        e.target.style.display = 'none';
                        const iconElement = e.target.parentElement.querySelector('i.fa');
                        if (iconElement) {
                          iconElement.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <i 
                    className={`fa ${tieneContenido ? 'fa-folder-open' : 'fa-folder'}`}
                    style={{ 
                      display: carpeta.icono_url ? 'none' : 'flex',
                      fontSize: '48px'
                    }}
                  ></i>
                </div>
              </div>

              {/* Contenido compacto */}
              <div style={{
                padding: '0.875rem 1rem',
                background: '#ffffff',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {/* Nombre de la carpeta */}
                <h3 style={{
                  margin: '0',
                  color: '#17a2b8',
                  fontSize: '13px',
                  fontWeight: '700',
                  lineHeight: '1.3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  minHeight: '34px'
                }}>
                  {carpeta.nombre}
                </h3>
                
                {/* Descripción compacta */}
                {carpeta.descripcion && (
                  <p style={{
                    margin: '0',
                    color: '#666',
                    fontSize: '10px',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {carpeta.descripcion}
                  </p>
                )}

                {/* Estadísticas compactas en una línea */}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                  marginTop: 'auto',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#e3f2fd',
                    color: '#FF8C00',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    <i className="fa fa-file" style={{ fontSize: '9px' }}></i>
                    <span>{carpeta.cantidad_archivos || 0}</span>
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#fff3e0',
                    color: '#f57c00',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    <i className="fa fa-folder" style={{ fontSize: '9px' }}></i>
                    <span>{carpeta.cantidad_subcarpetas || 0}</span>
                  </div>
                  {(rutaNavegacion.length === 0 || rutaNavegacion.length === 1) && promediosPonderacion[carpeta.id] !== undefined && promediosPonderacion[carpeta.id] !== null && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: promediosPonderacion[carpeta.id] >= 80 ? '#e8f5e9' : promediosPonderacion[carpeta.id] >= 50 ? '#fff9c4' : '#ffebee',
                      color: promediosPonderacion[carpeta.id] >= 80 ? '#2e7d32' : promediosPonderacion[carpeta.id] >= 50 ? '#f57f17' : '#c62828',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      <i className="fa fa-percent" style={{ fontSize: '9px' }}></i>
                      <span>{promediosPonderacion[carpeta.id].toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer con usuario y acciones */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: '#f8f9fa',
                borderTop: '1px solid #f0f0f0'
              }}>
                {/* Usuario */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#666',
                  flex: 1,
                  minWidth: 0
                }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colores.primary} 0%, ${colores.secondary} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {carpeta.creador_nombre ? carpeta.creador_nombre.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {carpeta.creador_nombre ? carpeta.creador_nombre.split(' ')[0] : 'Usuario'}
                  </span>
                </div>

                {/* Botones de acción compactos */}
                {(canEditFiles(user) || canDeleteFiles(user) || (user && user.rol === 'super_admin')) && (
                  <div style={{
                    display: 'flex',
                    gap: '4px'
                  }}>
                    {canEditFiles(user) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalEditarCarpeta(carpeta);
                        }}
                        style={{
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 3px rgba(10, 110, 189, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#8B4513';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#17a2b8';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Editar"
                      >
                        <i className="fa fa-pencil"></i>
                      </button>
                    )}
                    {(user && user.rol === 'super_admin') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalAsignarUsuario(carpeta);
                        }}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 3px rgba(40, 167, 69, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1e7e34';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#28a745';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Asignar usuarios"
                      >
                        <i className="fa fa-users"></i>
                      </button>
                    )}
                    {canDeleteFiles(user) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarCarpeta(carpeta.id);
                        }}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 3px rgba(220, 53, 69, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#c82333';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#dc3545';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Eliminar"
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
        );
        })}
      </div>

      {/* Contenido de Carpeta con Pestañas (si hay carpeta seleccionada) */}
      {carpetaActual && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: 0,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Pestañas */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #e9ecef',
            background: '#f8f9fa'
          }}>
            {pestañasDisponibles.map((pestaña) => (
              <button
                key={pestaña}
                onClick={() => {
                  setPestañaActiva(pestaña);
                  // Si se activa la pestaña de línea base, recargar los datos
                  if (pestaña === 'linea_base' && carpetaActual && carpetaActual.id) {
                    console.log('[Línea Base] Pestaña activada, recargando datos...');
                    cargarLineaBase(carpetaActual.id);
                    cargarLineaBaseMitigadores(carpetaActual.id);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: pestañaActiva === pestaña ? 'white' : 'transparent',
                  color: pestañaActiva === pestaña ? '#17a2b8' : '#808080',
                  fontWeight: pestañaActiva === pestaña ? '600' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderBottom: pestañaActiva === pestaña ? '3px solid #17a2b8' : '3px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textTransform: 'capitalize'
                }}
                onMouseEnter={(e) => {
                  if (pestañaActiva !== pestaña) {
                    e.target.style.background = '#f0f0f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pestañaActiva !== pestaña) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <i className={`fa fa-${pestaña === 'archivos' ? 'file' : pestaña === 'riesgo' ? 'exclamation-triangle' : pestaña === 'bowtie' ? 'project-diagram' : pestaña === 'linea_base' ? 'chart-line' : pestaña === 'guia' ? 'book' : pestaña === 'foro' ? 'comments' : 'tasks'}`}></i>
                {pestaña === 'archivos' ? 'Archivos' : pestaña === 'riesgo' ? 'Riesgo Crítico' : pestaña === 'bowtie' ? 'BOWTIE' : pestaña === 'linea_base' ? 'Linea Base' : pestaña === 'guia' ? 'Guía Controles Críticos' : pestaña === 'foro' ? 'Foro' : 'Tareas'}
                {pestaña === 'tareas' && tareas.length > 0 && (
                  <span style={{
                    background: '#dc3545',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    marginLeft: '4px'
                  }}>
                    {tareas.filter(t => t.estado !== 'completada').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Contenido de las pestañas */}
          <div style={{ padding: '1.5rem' }}>
            {/* Pestaña Análisis BOWTIE */}
            {pestañaActiva === 'bowtie' && (
              <div>
                {!carpetaActual ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                    <i className="fa fa-project-diagram" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                    <p>Selecciona una carpeta para ver su análisis Bowtie</p>
                  </div>
                ) : cargandoBowtie ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#17a2b8' }}></i>
                    <p style={{ marginTop: '1rem', color: '#666' }}>Cargando análisis Bowtie...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Mensaje informativo sobre permisos */}
                    {!puedeEditarBowtie(user, rutaNavegacion) && (
                      <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '6px',
                        padding: '0.75rem 1rem',
                        color: '#856404',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <i className="fa fa-info-circle"></i>
                        <span>
                          {user?.rol === 'admin' && rutaNavegacion.length !== 2 
                            ? 'Los administradores solo pueden editar el análisis Bowtie en carpetas de nivel 2.'
                            : `Solo super administradores pueden editar el análisis Bowtie. Este análisis está asociado a la carpeta ${carpetaActual?.nombre || ''}.`}
                        </span>
                      </div>
                    )}

                    {/* Título y botón de guardar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '1rem',
                      borderBottom: '2px solid #e9ecef'
                    }}>
                      <h2 style={{ margin: 0, color: '#17a2b8', fontSize: '24px', fontWeight: '700' }}>
                        <i className="fa fa-project-diagram" style={{ marginRight: '10px' }}></i>
                        Análisis Bowtie - {carpetaActual.nombre}
                      </h2>
                      {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                        <button
                          onClick={guardarAnalisisBowtie}
                          style={{
                            background: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="fa fa-save"></i>
                          Guardar Análisis
                        </button>
                      )}
                    </div>

                    {/* Guía para aplicar el análisis Bowtie */}
                    {mostrarGuiaBowtie && (
                      <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #17a2b8',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        marginBottom: '1.5rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: guiaBowtieMinimizada ? '0' : '1rem',
                          paddingBottom: guiaBowtieMinimizada ? '0' : '0.75rem',
                          borderBottom: guiaBowtieMinimizada ? 'none' : '3px solid #17a2b8',
                          cursor: 'pointer'
                        }}
                        onClick={() => setGuiaBowtieMinimizada(!guiaBowtieMinimizada)}
                        >
                          <h3 style={{
                            margin: 0,
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#17a2b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <i className="fa fa-book" style={{ fontSize: '22px' }}></i>
                            Guía para Aplicar el Análisis Bowtie
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setGuiaBowtieMinimizada(!guiaBowtieMinimizada);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#17a2b8',
                              fontSize: '18px',
                              cursor: 'pointer',
                              padding: '0.25rem 0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={guiaBowtieMinimizada ? 'Expandir guía' : 'Minimizar guía'}
                          >
                            <i className={`fa fa-chevron-${guiaBowtieMinimizada ? 'down' : 'up'}`}></i>
                          </button>
                        </div>

                        {!guiaBowtieMinimizada && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {/* ¿Qué es el análisis Bowtie? */}
                          <div>
                            <h4 style={{
                              margin: 0,
                              marginBottom: '0.75rem',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#0a3265',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="fa fa-question-circle" style={{ color: '#17a2b8' }}></i>
                              ¿Qué es el Análisis Bowtie?
                            </h4>
                            <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.8', paddingLeft: '2rem' }}>
                              <p style={{ marginBottom: '0.75rem' }}>
                                El <strong>análisis Bowtie</strong> es una metodología visual de gestión de riesgos que permite identificar y evaluar de manera integral los riesgos críticos asociados a una actividad o proceso. Su nombre proviene de la forma de corbata (bowtie) que adopta el diagrama cuando se visualiza.
                              </p>
                              <p style={{ marginBottom: 0 }}>
                                Este método ayuda a comprender la relación entre las <strong>causas</strong> que pueden generar un evento no deseado, los <strong>controles preventivos</strong> que evitan que ocurra, las <strong>consecuencias</strong> si el evento se materializa, y los <strong>controles mitigadores</strong> que reducen el impacto.
                              </p>
                            </div>
                          </div>

                          {/* Estructura del Diagrama */}
                          <div>
                            <h4 style={{
                              margin: 0,
                              marginBottom: '0.75rem',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#0a3265',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="fa fa-sitemap" style={{ color: '#17a2b8' }}></i>
                              Estructura del Diagrama Bowtie
                            </h4>
                            <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.8', paddingLeft: '2rem' }}>
                              <div style={{
                                background: '#f8f9fa',
                                padding: '1rem',
                                borderRadius: '6px',
                                border: '1px solid #dee2e6',
                                marginBottom: '0.75rem'
                              }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                  {/* Lado Izquierdo */}
                                  <div style={{
                                    background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)',
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    border: '2px solid #17a2b8'
                                  }}>
                                    <div style={{ fontWeight: '700', color: '#0c5460', marginBottom: '0.5rem', fontSize: '14px' }}>
                                      <i className="fa fa-arrow-left" style={{ marginRight: '6px' }}></i>
                                      LADO IZQUIERDO
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '13px', color: '#0c5460', lineHeight: '1.8' }}>
                                      <li><strong>Causas:</strong> Factores o condiciones que pueden provocar el evento central</li>
                                      <li><strong>Controles Preventivos:</strong> Medidas que evitan que las causas generen el evento</li>
                                    </ul>
                                  </div>

                                  {/* Centro */}
                                  <div style={{
                                    background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    border: '2px solid #dc3545',
                                    gridColumn: 'span 2',
                                    textAlign: 'center'
                                  }}>
                                    <div style={{ fontWeight: '700', color: '#721c24', marginBottom: '0.5rem', fontSize: '14px' }}>
                                      <i className="fa fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
                                      EVENTO CENTRAL
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#721c24' }}>
                                      El peligro principal o evento no deseado que se quiere prevenir o mitigar
                                    </div>
                                  </div>

                                  {/* Lado Derecho */}
                                  <div style={{
                                    background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)',
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    border: '2px solid #FF8C00',
                                    marginTop: '1rem'
                                  }}>
                                    <div style={{ fontWeight: '700', color: '#856404', marginBottom: '0.5rem', fontSize: '14px' }}>
                                      <i className="fa fa-arrow-right" style={{ marginRight: '6px' }}></i>
                                      LADO DERECHO
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '13px', color: '#856404', lineHeight: '1.8' }}>
                                      <li><strong>Consecuencias:</strong> Impactos que resultan si el evento central ocurre</li>
                                      <li><strong>Controles Mitigadores:</strong> Medidas que reducen la severidad de las consecuencias</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Pasos para realizar el análisis */}
                          <div>
                            <h4 style={{
                              margin: 0,
                              marginBottom: '0.75rem',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#0a3265',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="fa fa-list-ol" style={{ color: '#17a2b8' }}></i>
                              Pasos para Realizar el Análisis Bowtie
                            </h4>
                            <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.8', paddingLeft: '2rem' }}>
                              <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                <li style={{ marginBottom: '0.75rem' }}>
                                  <strong>Identificar el Evento Central:</strong> Defina claramente el peligro principal o evento no deseado que se quiere analizar. Debe ser específico y relacionado con el riesgo crítico de la carpeta.
                                </li>
                                <li style={{ marginBottom: '0.75rem' }}>
                                  <strong>Identificar las Causas:</strong> Liste todas las causas posibles que pueden provocar el evento central. Piense en factores humanos, técnicos, organizacionales y ambientales.
                                </li>
                                <li style={{ marginBottom: '0.75rem' }}>
                                  <strong>Definir Controles Preventivos:</strong> Para cada causa, identifique los controles críticos preventivos que evitan que la causa genere el evento central. Estos controles deben ser específicos y verificables.
                                </li>
                                <li style={{ marginBottom: '0.75rem' }}>
                                  <strong>Identificar las Consecuencias:</strong> Determine las posibles consecuencias si el evento central ocurre. Considere impactos en personas, equipos, medio ambiente y operaciones.
                                </li>
                                <li style={{ marginBottom: '0.75rem' }}>
                                  <strong>Definir Controles Mitigadores:</strong> Para cada consecuencia, establezca los controles críticos mitigadores que reducen la severidad del impacto. Estos controles actúan después de que el evento ocurre.
                                </li>
                                <li>
                                  <strong>Revisar y Validar:</strong> Revise el análisis completo con el equipo de trabajo y valide que todos los controles están correctamente identificados y son efectivos.
                                </li>
                              </ol>
                            </div>
                          </div>

                          {/* Mejores Prácticas */}
                          <div>
                            <h4 style={{
                              margin: 0,
                              marginBottom: '0.75rem',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#0a3265',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="fa fa-check-circle" style={{ color: '#17a2b8' }}></i>
                              Mejores Prácticas
                            </h4>
                            <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.8', paddingLeft: '2rem' }}>
                              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>
                                  <strong>Sea específico:</strong> Evite descripciones genéricas. Cada causa, consecuencia y control debe ser claro y específico.
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                  <strong>Involucre al equipo:</strong> El análisis debe realizarse con la participación de trabajadores, supervisores y especialistas en seguridad.
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                  <strong>Base en evidencia:</strong> Utilice información de incidentes previos, análisis de riesgos y experiencia del equipo.
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                  <strong>Revise regularmente:</strong> El análisis Bowtie debe actualizarse cuando cambien las condiciones de trabajo o se identifiquen nuevos riesgos.
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                  <strong>Conecte con controles críticos:</strong> Los controles identificados en el Bowtie deben estar alineados con los controles críticos definidos en la pestaña "Riesgo Crítico".
                                </li>
                                <li>
                                  <strong>Documente claramente:</strong> Asegúrese de que las descripciones sean comprensibles para todos los niveles de la organización.
                                </li>
                              </ul>
                            </div>
                          </div>

                          {/* Ejemplo Visual */}
                          <div>
                            <h4 style={{
                              margin: 0,
                              marginBottom: '0.75rem',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#0a3265',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="fa fa-lightbulb" style={{ color: '#FF8C00' }}></i>
                              Ejemplo de Estructura
                            </h4>
                            <div style={{
                              background: '#f8f9fa',
                              padding: '1rem',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6',
                              fontSize: '13px',
                              color: '#495057',
                              lineHeight: '1.8'
                            }}>
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#dc3545' }}>Evento Central:</strong> &quot;Contacto con energía eléctrica durante trabajos en equipos energizados&quot;
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                  <strong style={{ color: '#17a2b8' }}>Causa:</strong> &quot;Equipo energizado sin señalización adecuada&quot;
                                  <div style={{ marginLeft: '1rem', marginTop: '0.25rem', fontSize: '12px' }}>
                                    <strong>Control Preventivo:</strong> &quot;Verificar señalización de área restringida antes de iniciar trabajo&quot;
                                  </div>
                                </div>
                                <div>
                                  <strong style={{ color: '#FF8C00' }}>Consecuencia:</strong> &quot;Lesión grave o fatal por electrocución&quot;
                                  <div style={{ marginLeft: '1rem', marginTop: '0.25rem', fontSize: '12px' }}>
                                    <strong>Control Mitigador:</strong> &quot;Equipo de respuesta a emergencias disponible y entrenado&quot;
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    )}

                    {/* Evento Central - Peligro, Energía y Evento Top */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      {/* Peligro */}
                      <div style={{
                        background: 'white',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #17a2b8'
                      }}>
                        <div style={{ color: '#17a2b8', fontSize: '11px', fontWeight: '600', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                          Peligro
                        </div>
                        {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie ? (
                          <textarea
                            value={analisisBowtie.peligro || ''}
                            onChange={(e) => setAnalisisBowtie({...analisisBowtie, peligro: e.target.value})}
                            placeholder="Ingrese el peligro identificado..."
                            style={{
                              width: '100%',
                              minHeight: '50px',
                              maxHeight: '100px',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #ced4da',
                              fontSize: '13px',
                              color: '#212529',
                              background: '#f8f9fa',
                              resize: 'vertical',
                              fontFamily: 'inherit'
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: '13px', color: '#495057', minHeight: '30px', padding: '0.4rem', lineHeight: '1.5' }}>
                            {analisisBowtie?.peligro || 'No especificado'}
                          </div>
                        )}
                      </div>

                      {/* Energía */}
                      <div style={{
                        background: 'white',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #17a2b8'
                      }}>
                        <div style={{ color: '#17a2b8', fontSize: '11px', fontWeight: '600', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                          Energía(s)
                        </div>
                        {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie ? (
                          <textarea
                            value={analisisBowtie.energia || ''}
                            onChange={(e) => setAnalisisBowtie({...analisisBowtie, energia: e.target.value})}
                            placeholder="Ingrese la(s) energía(s) asociada(s)..."
                            style={{
                              width: '100%',
                              minHeight: '50px',
                              maxHeight: '100px',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #ced4da',
                              fontSize: '13px',
                              color: '#212529',
                              background: '#f8f9fa',
                              resize: 'vertical',
                              fontFamily: 'inherit'
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: '13px', color: '#495057', minHeight: '30px', padding: '0.4rem', lineHeight: '1.5' }}>
                            {analisisBowtie?.energia || 'No especificado'}
                          </div>
                        )}
                      </div>

                      {/* Evento Top */}
                      <div style={{
                        background: '#dc3545',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '2px solid #dc3545'
                      }}>
                        <div style={{ color: 'white', fontSize: '11px', fontWeight: '600', marginBottom: '0.4rem', textTransform: 'uppercase', textAlign: 'center' }}>
                          Evento Top
                        </div>
                        {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie ? (
                          <textarea
                            value={analisisBowtie.evento_top || ''}
                            onChange={(e) => setAnalisisBowtie({...analisisBowtie, evento_top: e.target.value})}
                            placeholder="Ingrese el Evento Top..."
                            style={{
                              width: '100%',
                              minHeight: '50px',
                              maxHeight: '100px',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(255,255,255,0.3)',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#212529',
                              background: 'white',
                              resize: 'vertical',
                              fontFamily: 'inherit'
                            }}
                          />
                        ) : (
                          <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', minHeight: '30px', padding: '0.4rem', textAlign: 'center', lineHeight: '1.5' }}>
                            {analisisBowtie?.evento_top || 'No especificado'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenedor principal del diagrama Bowtie */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2rem',
                      marginTop: '1rem'
                    }}>
                      {/* Lado Izquierdo: Causas y Controles Preventivos */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{
                          background: 'white',
                          padding: '1.5rem',
                          borderRadius: '8px',
                          border: '2px solid #17a2b8',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '2px solid #17a2b8'
                          }}>
                            <h3 style={{ margin: 0, color: '#17a2b8', fontSize: '18px', fontWeight: '700' }}>
                              <i className="fa fa-arrow-left" style={{ marginRight: '8px' }}></i>
                              Causas
                            </h3>
                              <button
                              onClick={() => setTablasBowtieMinimizadas(prev => ({ ...prev, causas: !prev.causas }))}
                                style={{
                                background: 'transparent',
                                  border: 'none',
                                color: '#17a2b8',
                                  cursor: 'pointer',
                                fontSize: '16px',
                                padding: '0.25rem 0.5rem'
                                }}
                              title={tablasBowtieMinimizadas.causas ? 'Expandir tabla' : 'Minimizar tabla'}
                              >
                              <i className={`fa ${tablasBowtieMinimizadas.causas ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                              </button>
                          </div>

                          {/* Tabla de Causas */}
                          {!tablasBowtieMinimizadas.causas && (
                            <>
                          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                              <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #17a2b8' }}>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '80px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 101 }}>Código</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Causas</th>
                                  {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: '700', color: '#17a2b8', width: '50px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}></th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const causasParaMostrar = analisisBowtie?.causas || [];
                                  return causasParaMostrar.length > 0 ? (
                                    causasParaMostrar.map((causa, index) => {
                                    const codigo = causa.codigo || `CA${index + 1}`;
                                    const estaGuardada = !!causa.id; // Si tiene ID, está guardada en BD
                                    const estaEditando = causasEditando.has(causa.id) || (!estaGuardada); // Nueva causa siempre editable
                                    const puedeEditar = puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie;
                                    
                                    return (
                                      <tr key={`causa-${causa.id || `temp-${index}`}-${index}`} style={{ borderBottom: '1px solid #dee2e6', lineHeight: '1.3' }}>
                                        <td style={{ padding: '0.35rem 0.5rem', background: '#f8f9fa', fontWeight: '600', color: '#495057', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={codigo}
                                              onChange={(e) => {
                                                const nuevoCodigo = e.target.value.toUpperCase().trim();
                                                // Validar formato CA + número
                                                if (nuevoCodigo === '' || nuevoCodigo.match(/^CA\d+$/)) {
                                                  const nuevasCausas = [...analisisBowtie.causas];
                                                  nuevasCausas[index] = {...nuevasCausas[index], codigo: nuevoCodigo};
                                                  setAnalisisBowtie({...analisisBowtie, causas: nuevasCausas});
                                                }
                                              }}
                                              onBlur={(e) => {
                                                // Al perder el foco, validar que el código no esté duplicado
                                                const nuevoCodigo = e.target.value.toUpperCase().trim();
                                                if (nuevoCodigo && nuevoCodigo.match(/^CA\d+$/)) {
                                                  const codigosExistentes = analisisBowtie.causas
                                                    .map((c, i) => i !== index ? c.codigo : null)
                                                    .filter(c => c && c.match(/^CA\d+$/i));
                                                  
                                                  if (codigosExistentes.includes(nuevoCodigo)) {
                                                    // Código duplicado, encontrar el siguiente disponible
                                                    const numeros = codigosExistentes
                                                      .map(c => {
                                                        const match = c.match(/^CA(\d+)$/i);
                                                        return match ? parseInt(match[1]) : 0;
                                                      })
                                                      .filter(n => n > 0);
                                                    
                                                    let siguienteNumero = 1;
                                                    while (numeros.includes(siguienteNumero)) {
                                                      siguienteNumero++;
                                                    }
                                                    
                                                    const codigoDisponible = `CA${siguienteNumero}`;
                                                    const nuevasCausas = [...analisisBowtie.causas];
                                                    nuevasCausas[index] = {...nuevasCausas[index], codigo: codigoDisponible};
                                                    setAnalisisBowtie({...analisisBowtie, causas: nuevasCausas});
                                                    alert(`El código ${nuevoCodigo} ya está en uso. Se asignó ${codigoDisponible} automáticamente.`);
                                                  }
                                                }
                                              }}
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>
                                              {codigo}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <textarea
                                              value={causa.descripcion || ''}
                                              onChange={(e) => {
                                                const nuevasCausas = [...analisisBowtie.causas];
                                                nuevasCausas[index] = {...nuevasCausas[index], descripcion: e.target.value};
                                                setAnalisisBowtie({...analisisBowtie, causas: nuevasCausas});
                                              }}
                                              placeholder="Descripción de la causa..."
                                              style={{
                                                width: '100%',
                                                minHeight: '35px',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                lineHeight: '1.4',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                                              {causa.descripcion || 'Sin descripción'}
                                            </div>
                                          )}
                                        </td>
                                        {puedeEditar && (
                                          <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                            {estaGuardada && !estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  // Entrar en modo edición
                                                  setCausasEditando(prev => new Set([...prev, causa.id]));
                                                }}
                                                style={{
                                                  background: '#17a2b8',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.4rem 0.6rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '12px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Editar causa"
                                              >
                                                <i className="fa fa-edit"></i>
                                              </button>
                                            ) : null}
                                            <button
                                              onClick={() => {
                                                if (estaGuardada && estaEditando) {
                                                  // Cancelar edición - recargar datos del servidor
                                                  setCausasEditando(prev => {
                                                    const nuevo = new Set(prev);
                                                    nuevo.delete(causa.id);
                                                    return nuevo;
                                                  });
                                                  if (carpetaActual && carpetaActual.id) {
                                                    cargarAnalisisBowtie(carpetaActual.id);
                                                  }
                                                } else {
                                                  // Eliminar causa
                                                  const nuevasCausas = analisisBowtie.causas.filter((_, i) => i !== index);
                                                  setAnalisisBowtie({...analisisBowtie, causas: nuevasCausas});
                                                }
                                              }}
                                              style={{
                                                background: estaEditando ? '#6c757d' : '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                              title={estaEditando ? "Cancelar edición" : "Eliminar causa"}
                                            >
                                              <i className={`fa ${estaEditando ? 'fa-times' : 'fa-trash'}`}></i>
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })
                                  ) : (
                                    <tr>
                                      <td colSpan={puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie ? 3 : 2} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                                        No hay causas registradas. {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && 'Haz clic en "Agregar Causa" para comenzar.'}
                                      </td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Controles Preventivos asociados a causas (se mantiene la funcionalidad existente) */}
                          {analisisBowtie?.causas && analisisBowtie.causas.length > 0 && analisisBowtie.causas.some(c => c.controles_preventivos && c.controles_preventivos.length > 0) && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#17a2b8', marginBottom: '0.5rem' }}>
                                Controles Preventivos por Causa:
                              </div>
                              {analisisBowtie.causas.map((causa, index) => (
                                causa.controles_preventivos && causa.controles_preventivos.length > 0 && (
                                  <div key={index} style={{ marginBottom: '0.5rem', fontSize: '12px', color: '#495057' }}>
                                    <strong>{causa.codigo || `CA${index + 1}`}:</strong> {causa.controles_preventivos.map(cp => cp.descripcion).join(', ')}
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                          
                            {/* Botones Agregar y Guardar al final de la tabla de Causas */}
                          {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  // Obtener códigos existentes
                                  const codigosExistentes = (analisisBowtie.causas || [])
                                    .map(c => c.codigo)
                                    .filter(c => c && c.match(/^CA\d+$/i))
                                    .map(c => {
                                      const match = c.match(/^CA(\d+)$/i);
                                      return match ? parseInt(match[1]) : 0;
                                    })
                                    .filter(n => n > 0);
                                  
                                  // Encontrar el siguiente número disponible
                                  let siguienteNumero = 1;
                                  while (codigosExistentes.includes(siguienteNumero)) {
                                    siguienteNumero++;
                                  }
                                  
                                  const nuevoCodigo = `CA${siguienteNumero}`;
                                  const nuevasCausas = [...(analisisBowtie.causas || []), { codigo: nuevoCodigo, descripcion: '', controles_preventivos: [] }];
                                  setAnalisisBowtie({...analisisBowtie, causas: nuevasCausas});
                                }}
                                style={{
                                  background: '#17a2b8',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}
                              >
                                <i className="fa fa-plus"></i> Agregar Causa
                              </button>
                              <button
                                onClick={guardarCausas}
                                disabled={guardandoCausas}
                                style={{
                                  background: guardandoCausas ? '#6c757d' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1.5rem',
                                  borderRadius: '6px',
                                  cursor: guardandoCausas ? 'not-allowed' : 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  opacity: guardandoCausas ? 0.7 : 1
                                }}
                                title="Guardar cambios de Causas"
                              >
                                <i className={`fa ${guardandoCausas ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {guardandoCausas ? 'Guardando...' : 'Guardar Causas'}
                              </button>
                            </div>
                          )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Lado Derecho: Consecuencias y Controles Mitigadores */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{
                          background: 'white',
                          padding: '1.5rem',
                          borderRadius: '8px',
                          border: '2px solid #FF8C00',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '2px solid #FF8C00'
                          }}>
                            <h3 style={{ margin: 0, color: '#FF8C00', fontSize: '18px', fontWeight: '700' }}>
                              <i className="fa fa-arrow-right" style={{ marginRight: '8px' }}></i>
                              Consecuencias
                            </h3>
                                <button
                              onClick={() => setTablasBowtieMinimizadas(prev => ({ ...prev, consecuencias: !prev.consecuencias }))}
                                  style={{
                                background: 'transparent',
                                    border: 'none',
                                color: '#FF8C00',
                                    cursor: 'pointer',
                                fontSize: '16px',
                                padding: '0.25rem 0.5rem'
                                  }}
                              title={tablasBowtieMinimizadas.consecuencias ? 'Expandir tabla' : 'Minimizar tabla'}
                                >
                              <i className={`fa ${tablasBowtieMinimizadas.consecuencias ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                                </button>
                          </div>

                          {/* Tabla de Consecuencias */}
                          {!tablasBowtieMinimizadas.consecuencias && (
                            <>
                          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                              <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #FF8C00' }}>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '80px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 101 }}>N°</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Evento no deseado</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Consecuencia</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Categoría</th>
                                  {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: '700', color: '#FF8C00', width: '50px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}></th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {analisisBowtie?.consecuencias && analisisBowtie.consecuencias.length > 0 ? (
                                  analisisBowtie.consecuencias.map((consecuencia, index) => {
                                    const codigo = consecuencia.codigo || `CO${index + 1}`;
                                    const estaGuardada = !!consecuencia.id;
                                    const estaEditando = consecuenciasEditando && consecuenciasEditando.has(consecuencia.id) || (!estaGuardada);
                                    const puedeEditar = puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie;
                                    
                                    return (
                                      <tr key={`consecuencia-${consecuencia.id || `temp-${index}`}-${index}`} style={{ borderBottom: '1px solid #dee2e6', lineHeight: '1.3' }}>
                                        <td style={{ padding: '0.35rem 0.5rem', background: '#f8f9fa', fontWeight: '600', color: '#495057', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={codigo}
                                              onChange={(e) => {
                                                const nuevoCodigo = e.target.value.toUpperCase().trim();
                                                if (nuevoCodigo === '' || nuevoCodigo.match(/^CO\d+$/)) {
                                                  const nuevasConsecuencias = [...analisisBowtie.consecuencias];
                                                  nuevasConsecuencias[index] = {...nuevasConsecuencias[index], codigo: nuevoCodigo};
                                                  setAnalisisBowtie({...analisisBowtie, consecuencias: nuevasConsecuencias});
                                                }
                                              }}
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>
                                              {codigo}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <textarea
                                              value={consecuencia.evento_no_deseado || ''}
                                              onChange={(e) => {
                                                const nuevasConsecuencias = [...analisisBowtie.consecuencias];
                                                nuevasConsecuencias[index] = {...nuevasConsecuencias[index], evento_no_deseado: e.target.value};
                                                setAnalisisBowtie({...analisisBowtie, consecuencias: nuevasConsecuencias});
                                              }}
                                              placeholder="Evento no deseado..."
                                              style={{
                                                width: '100%',
                                                minHeight: '35px',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                lineHeight: '1.4',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                                              {consecuencia.evento_no_deseado || 'Sin evento no deseado'}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <textarea
                                              value={consecuencia.descripcion || ''}
                                              onChange={(e) => {
                                                const nuevasConsecuencias = [...analisisBowtie.consecuencias];
                                                nuevasConsecuencias[index] = {...nuevasConsecuencias[index], descripcion: e.target.value};
                                                setAnalisisBowtie({...analisisBowtie, consecuencias: nuevasConsecuencias});
                                              }}
                                              placeholder="Descripción de la consecuencia..."
                                              style={{
                                                width: '100%',
                                                minHeight: '35px',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                lineHeight: '1.4',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                                              {consecuencia.descripcion || 'Sin descripción'}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={consecuencia.categoria || ''}
                                              onChange={(e) => {
                                                const nuevasConsecuencias = [...analisisBowtie.consecuencias];
                                                nuevasConsecuencias[index] = {...nuevasConsecuencias[index], categoria: e.target.value};
                                                setAnalisisBowtie({...analisisBowtie, consecuencias: nuevasConsecuencias});
                                              }}
                                              placeholder="Ej: SSO"
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057' }}>
                                              {consecuencia.categoria || 'Sin categoría'}
                                            </div>
                                          )}
                                        </td>
                                        {puedeEditar && (
                                          <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                            {estaGuardada && !estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  if (!consecuenciasEditando) {
                                                    setConsecuenciasEditando(new Set());
                                                  }
                                                  setConsecuenciasEditando(prev => new Set(prev).add(consecuencia.id));
                                                }}
                                                style={{
                                                  background: '#17a2b8',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Editar consecuencia"
                                              >
                                                <i className="fa fa-pencil"></i>
                                              </button>
                                            ) : estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  if (consecuenciasEditando) {
                                                    setConsecuenciasEditando(prev => {
                                                      const newSet = new Set(prev);
                                                      newSet.delete(consecuencia.id);
                                                      return newSet;
                                                    });
                                                    cargarAnalisisBowtie(carpetaActual.id);
                                                  }
                                                }}
                                                style={{
                                                  background: '#6c757d',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Cancelar edición"
                                              >
                                                <i className="fa fa-times"></i>
                                              </button>
                                            ) : null}
                                            {estaGuardada && !estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  const nuevasConsecuencias = analisisBowtie.consecuencias.filter((_, i) => i !== index);
                                                  setAnalisisBowtie({...analisisBowtie, consecuencias: nuevasConsecuencias});
                                                }}
                                                style={{
                                                  background: '#dc3545',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px'
                                                }}
                                                title="Eliminar consecuencia"
                                              >
                                                <i className="fa fa-trash"></i>
                                              </button>
                                            ) : !estaGuardada ? (
                                              <button
                                                onClick={() => {
                                                  const nuevasConsecuencias = analisisBowtie.consecuencias.filter((_, i) => i !== index);
                                                  setAnalisisBowtie({...analisisBowtie, consecuencias: nuevasConsecuencias});
                                                }}
                                                style={{
                                                  background: '#dc3545',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px'
                                                }}
                                                title="Eliminar consecuencia"
                                              >
                                                <i className="fa fa-trash"></i>
                                              </button>
                                            ) : null}
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie ? 5 : 4} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d', fontSize: '12px' }}>
                                      No hay consecuencias registradas. {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && 'Haz clic en "Agregar Consecuencia" para comenzar.'}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Controles Mitigadores asociados a consecuencias (se mantiene la funcionalidad existente) */}
                          {analisisBowtie?.consecuencias && analisisBowtie.consecuencias.length > 0 && analisisBowtie.consecuencias.some(c => c.controles_mitigadores && c.controles_mitigadores.length > 0) && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#FF8C00', marginBottom: '0.5rem' }}>
                                Controles Mitigadores por Consecuencia:
                              </div>
                              {analisisBowtie.consecuencias.map((consecuencia, index) => (
                                consecuencia.controles_mitigadores && consecuencia.controles_mitigadores.length > 0 && (
                                  <div key={index} style={{ marginBottom: '0.5rem', fontSize: '12px', color: '#495057' }}>
                                    <strong>{consecuencia.codigo || `CO${index + 1}`}:</strong> {consecuencia.controles_mitigadores.map(cm => cm.descripcion).join(', ')}
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                          
                            {/* Botones Agregar y Guardar al final de la tabla de Consecuencias */}
                          {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  // Obtener códigos existentes
                                  const codigosExistentes = (analisisBowtie.consecuencias || [])
                                    .map(c => c.codigo)
                                    .filter(c => c && c.match(/^CO\d+$/i))
                                    .map(c => {
                                      const match = c.match(/^CO(\d+)$/i);
                                      return match ? parseInt(match[1]) : 0;
                                    })
                                    .filter(n => n > 0);
                                  
                                  // Encontrar el siguiente número disponible
                                  let siguienteNumero = 1;
                                  while (codigosExistentes.includes(siguienteNumero)) {
                                    siguienteNumero++;
                                  }
                                  
                                  const nuevoCodigo = `CO${siguienteNumero}`;
                                  const nuevasConsecuencias = [...(analisisBowtie.consecuencias || []), { 
                                    codigo: nuevoCodigo, 
                                    descripcion: '', 
                                    evento_no_deseado: '',
                                    categoria: '',
                                    controles_mitigadores: [] 
                                  }];
                                  setAnalisisBowtie({...analisisBowtie, consecuencias: nuevasConsecuencias});
                                }}
                                style={{
                                  background: '#FF8C00',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}
                              >
                                <i className="fa fa-plus"></i> Agregar Consecuencia
                              </button>
                              <button
                                onClick={guardarConsecuencias}
                                disabled={guardandoConsecuencias}
                                style={{
                                  background: guardandoConsecuencias ? '#6c757d' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1.5rem',
                                  borderRadius: '6px',
                                  cursor: guardandoConsecuencias ? 'not-allowed' : 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  opacity: guardandoConsecuencias ? 0.7 : 1
                                }}
                                title="Guardar cambios de Consecuencias"
                              >
                                <i className={`fa ${guardandoConsecuencias ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {guardandoConsecuencias ? 'Guardando...' : 'Guardar Consecuencias'}
                              </button>
                            </div>
                          )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tablas de Controles Preventivos y Mitigadores */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1.5rem',
                      marginTop: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Tabla de Controles Críticos Preventivos */}
                        <div style={{
                          background: 'white',
                          padding: '1.5rem',
                          borderRadius: '8px',
                          border: '2px solid #28a745',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '2px solid #28a745'
                          }}>
                            <h3 style={{ margin: 0, color: '#28a745', fontSize: '18px', fontWeight: '700' }}>
                              <i className="fa fa-shield-alt" style={{ marginRight: '8px' }}></i>
                              Controles Críticos Preventivos
                            </h3>
                                <button
                            onClick={() => setTablasBowtieMinimizadas(prev => ({ ...prev, controles_preventivos_criticos: !prev.controles_preventivos_criticos }))}
                                  style={{
                              background: 'transparent',
                                    border: 'none',
                              color: '#28a745',
                                    cursor: 'pointer',
                              fontSize: '16px',
                              padding: '0.25rem 0.5rem'
                                  }}
                            title={tablasBowtieMinimizadas.controles_preventivos_criticos ? 'Expandir tabla' : 'Minimizar tabla'}
                                  >
                            <i className={`fa ${tablasBowtieMinimizadas.controles_preventivos_criticos ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                                  </button>
                          </div>

                        {!tablasBowtieMinimizadas.controles_preventivos_criticos && (
                          <>
                          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                              <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #28a745' }}>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#28a745', width: '80px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 101 }}>Código</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#28a745', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Controles Críticos Preventivos</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#28a745', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Causas</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#28a745', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Criticidad</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#28a745', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Jerarquía</th>
                                  {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: '700', color: '#28a745', width: '50px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}></th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {analisisBowtie?.controles_preventivos && analisisBowtie.controles_preventivos.length > 0 ? (
                                  analisisBowtie.controles_preventivos.map((control, index) => {
                                    const codigo = control.codigo || `CCP${index + 1}`;
                                    const estaGuardado = !!control.id; // Si tiene ID, está guardado en BD
                                    const estaEditando = controlesPreventivosEditando.has(control.id) || (!estaGuardado); // Nuevo control siempre editable
                                    const puedeEditar = puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie;
                                    
                                    return (
                                      <tr key={`control-preventivo-${control.id || `temp-${index}`}-${index}`} style={{ borderBottom: '1px solid #dee2e6', lineHeight: '1.3' }}>
                                        <td style={{ padding: '0.35rem 0.5rem', background: '#f8f9fa', fontWeight: '600', color: '#495057', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={codigo}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_preventivos];
                                                nuevosControles[index] = {...nuevosControles[index], codigo: e.target.value};
                                                setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                                              }}
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>
                                              {codigo}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <textarea
                                              value={control.descripcion || ''}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_preventivos];
                                                nuevosControles[index] = {...nuevosControles[index], descripcion: e.target.value};
                                                setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                                              }}
                                              placeholder="Descripción del control preventivo..."
                                              style={{
                                                width: '100%',
                                                minHeight: '35px',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                lineHeight: '1.4',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                                              {control.descripcion || 'Sin descripción'}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={(control.causas_asociadas || []).map(ca => ca.codigo || `CA${ca.index + 1}`).join(' - ') || ''}
                                              onChange={(e) => {
                                                // Parsear códigos de causas separados por guiones
                                                const codigosCausas = e.target.value.split('-').map(c => c.trim()).filter(c => c);
                                                const causasAsociadas = codigosCausas.map(codigo => {
                                                  const causaIndex = analisisBowtie.causas.findIndex(c => (c.codigo || `CA${analisisBowtie.causas.indexOf(c) + 1}`) === codigo);
                                                  return causaIndex >= 0 ? { codigo, index: causaIndex } : { codigo };
                                                });
                                                const nuevosControles = [...analisisBowtie.controles_preventivos];
                                                nuevosControles[index] = {...nuevosControles[index], causas_asociadas: causasAsociadas};
                                                setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                                              }}
                                              placeholder="CA1 - CA2 - CA3..."
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057' }}>
                                              {(control.causas_asociadas || []).map(ca => ca.codigo || `CA${ca.index + 1}`).join(' - ') || 'Sin asociar'}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={control.criticidad || ''}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_preventivos];
                                                nuevosControles[index] = {...nuevosControles[index], criticidad: e.target.value};
                                                setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                                              }}
                                              placeholder="Ej: Crítico, No crítico"
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057' }}>
                                              {control.criticidad || ''}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={control.jerarquia || ''}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_preventivos];
                                                nuevosControles[index] = {...nuevosControles[index], jerarquia: e.target.value};
                                                setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                                              }}
                                              placeholder="Ej: Aislamiento, Administrativo"
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057' }}>
                                              {control.jerarquia || 'Sin jerarquía'}
                                            </div>
                                          )}
                                        </td>
                                        {puedeEditar && (
                                          <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                            {estaGuardado && !estaEditando ? (
                                              <>
                                                <button
                                                  onClick={() => {
                                                    setModalVerDimensiones({
                                                      control: control,
                                                      tipo: 'preventivo'
                                                    });
                                                  }}
                                                  style={{
                                                    background: '#ffc107',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.35rem 0.5rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    marginRight: '0.25rem'
                                                  }}
                                                  title="Ver dimensiones, preguntas y evidencias"
                                                >
                                                  <i className="fa fa-search"></i>
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setModalDimensionesPreventivo({
                                                      controlId: control.id,
                                                      controlIndex: index,
                                                      control: control,
                                                      tipo: 'preventivo'
                                                    });
                                                  }}
                                                  style={{
                                                    background: '#6f42c1',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.35rem 0.5rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    marginRight: '0.25rem'
                                                  }}
                                                  title="Gestionar dimensiones, preguntas y evidencias"
                                                >
                                                  <i className="fa fa-list-ul"></i>
                                                </button>
                                              <button
                                                onClick={() => {
                                                  if (!controlesPreventivosEditando) {
                                                    setControlesPreventivosEditando(new Set());
                                                  }
                                                  setControlesPreventivosEditando(prev => new Set(prev).add(control.id));
                                                }}
                                                style={{
                                                  background: '#17a2b8',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Editar control"
                                              >
                                                <i className="fa fa-pencil"></i>
                                              </button>
                                              </>
                                            ) : estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  if (controlesPreventivosEditando) {
                                                    setControlesPreventivosEditando(prev => {
                                                      const newSet = new Set(prev);
                                                      newSet.delete(control.id);
                                                      return newSet;
                                                    });
                                                    cargarAnalisisBowtie(carpetaActual.id);
                                                  }
                                                }}
                                                style={{
                                                  background: '#6c757d',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Cancelar edición"
                                              >
                                                <i className="fa fa-times"></i>
                                              </button>
                                            ) : null}
                                            {estaGuardado && !estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  const nuevosControles = analisisBowtie.controles_preventivos.filter((_, i) => i !== index);
                                                  setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                                                }}
                                                style={{
                                                  background: '#dc3545',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px'
                                                }}
                                                title="Eliminar control"
                                              >
                                                <i className="fa fa-trash"></i>
                                              </button>
                                            ) : !estaGuardado ? (
                                              <button
                                                onClick={() => {
                                                  const nuevosControles = analisisBowtie.controles_preventivos.filter((_, i) => i !== index);
                                                  setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                                                }}
                                                style={{
                                                  background: '#dc3545',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px'
                                                }}
                                                title="Eliminar control"
                                              >
                                                <i className="fa fa-trash"></i>
                                              </button>
                                            ) : null}
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d', fontSize: '12px' }}>
                                      No hay controles preventivos registrados. {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && 'Haz clic en "Agregar Control" para comenzar.'}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Botones Agregar y Guardar al final de la tabla de Controles Preventivos */}
                          {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                              onClick={() => {
                                // Obtener códigos existentes
                                const codigosExistentes = (analisisBowtie.controles_preventivos || [])
                                  .map(c => c.codigo)
                                  .filter(c => c && c.match(/^CCP\d+$/i))
                                  .map(c => {
                                    const match = c.match(/^CCP(\d+)$/i);
                                    return match ? parseInt(match[1]) : 0;
                                  })
                                  .filter(n => n > 0);
                                
                                // Encontrar el siguiente número disponible
                                let siguienteNumero = 1;
                                while (codigosExistentes.includes(siguienteNumero)) {
                                  siguienteNumero++;
                                }
                                
                                const nuevoCodigo = `CCP${siguienteNumero}`;
                                const nuevosControles = [...(analisisBowtie.controles_preventivos || []), { 
                                  codigo: nuevoCodigo, 
                                  descripcion: '', 
                                  criticidad: '',
                                  jerarquia: '',
                                  causas_asociadas: [] 
                                }];
                                setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                              }}
                              style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}
                            >
                              <i className="fa fa-plus"></i> Agregar Control
                            </button>
                              <button
                                onClick={guardarControlesPreventivos}
                                disabled={guardandoControlesPreventivos}
                                style={{
                                  background: guardandoControlesPreventivos ? '#6c757d' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1.5rem',
                                  borderRadius: '6px',
                                  cursor: guardandoControlesPreventivos ? 'not-allowed' : 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  opacity: guardandoControlesPreventivos ? 0.7 : 1
                                }}
                                title="Guardar cambios de Controles Preventivos"
                              >
                                <i className={`fa ${guardandoControlesPreventivos ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {guardandoControlesPreventivos ? 'Guardando...' : 'Guardar Controles Preventivos'}
                              </button>
                            </div>
                          )}
                            </>
                          )}
                        </div>

                        {/* Tabla de Controles Preventivos Generales */}
                        <div style={{
                          background: 'white',
                          padding: '1.5rem',
                          borderRadius: '8px',
                          border: '2px solid #0d6efd',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '2px solid #0d6efd'
                          }}>
                            <h3 style={{ margin: 0, color: '#0d6efd', fontSize: '18px', fontWeight: '700' }}>
                              <i className="fa fa-clipboard-list" style={{ marginRight: '8px' }}></i>
                              CONTROLES PREVENTIVOS
                            </h3>
                            <button
                              onClick={() => setTablasBowtieMinimizadas(prev => ({ ...prev, controles_preventivos_generales: !prev.controles_preventivos_generales }))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#0d6efd',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '0.25rem 0.5rem'
                              }}
                              title={tablasBowtieMinimizadas.controles_preventivos_generales ? 'Expandir tabla' : 'Minimizar tabla'}
                            >
                              <i className={`fa ${tablasBowtieMinimizadas.controles_preventivos_generales ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                            </button>
                          </div>
                          {!tablasBowtieMinimizadas.controles_preventivos_generales && (
                            <>
                              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                  <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #0d6efd' }}>
                                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#0d6efd', width: '80px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 101 }}>Código</th>
                                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#0d6efd', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Nombre Control</th>
                                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#0d6efd', width: '200px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Consecuencias</th>
                                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#0d6efd', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Criticidad</th>
                                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#0d6efd', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Jerarquía</th>
                                      {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: '700', color: '#0d6efd', width: '50px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}></th>
                                      )}
                                </tr>
                              </thead>
                              <tbody>
                                {analisisBowtie?.controles_preventivos_generales && analisisBowtie.controles_preventivos_generales.length > 0 ? (
                                      analisisBowtie.controles_preventivos_generales.map((control, index) => {
                                        const codigo = control.codigo || `CP${index + 1}`;
                                        const estaGuardado = !!control.id;
                                        const estaEditando = controlesPreventivosGeneralesEditando.has(control.id) || !estaGuardado;
                                        const puedeEditar = puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie;
                                        return (
                                          <tr key={`control-preventivo-general-${control.id || `temp-${index}`}-${index}`} style={{ borderBottom: '1px solid #dee2e6', lineHeight: '1.3' }}>
                                            <td style={{ padding: '0.35rem 0.5rem', background: '#f8f9fa', fontWeight: '600', color: '#495057', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={codigo}
                                              onChange={(e) => {
                                                const nuevoCodigo = e.target.value.trim();
                                                
                                                // Validar que el código no esté duplicado
                                                const controles = analisisBowtie.controles_preventivos_generales || [];
                                                const codigoDuplicado = controles.some((c, i) => 
                                                  i !== index && c.codigo && c.codigo.trim().toUpperCase() === nuevoCodigo.toUpperCase()
                                                );
                                                
                                                if (codigoDuplicado && nuevoCodigo !== '') {
                                                  alert(`El código "${nuevoCodigo}" ya existe. Los códigos deben ser únicos.`);
                                                  return;
                                                }
                                                
                                                const nuevosControles = [...analisisBowtie.controles_preventivos_generales];
                                                nuevosControles[index] = { ...nuevosControles[index], codigo: nuevoCodigo };
                                                setAnalisisBowtie({ ...analisisBowtie, controles_preventivos_generales: nuevosControles });
                                              }}
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>
                                              {codigo}
                                            </div>
                                          )}
                                      </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <textarea
                                              value={control.nombre_control || ''}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_preventivos_generales];
                                                nuevosControles[index] = { ...nuevosControles[index], nombre_control: e.target.value };
                                                setAnalisisBowtie({ ...analisisBowtie, controles_preventivos_generales: nuevosControles });
                                              }}
                                              placeholder="Nombre o descripción del control preventivo..."
                                              style={{
                                                width: '100%',
                                                minHeight: '35px',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                lineHeight: '1.4',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                                        {control.nombre_control || 'Sin nombre'}
                                            </div>
                                          )}
                                      </td>
                                            <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <textarea
                                              value={control.consecuencias || ''}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_preventivos_generales];
                                                nuevosControles[index] = { ...nuevosControles[index], consecuencias: e.target.value };
                                                setAnalisisBowtie({ ...analisisBowtie, controles_preventivos_generales: nuevosControles });
                                              }}
                                              placeholder="Consecuencias asociadas..."
                                              style={{
                                                width: '100%',
                                                minHeight: '35px',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                lineHeight: '1.4',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057', whiteSpace: 'pre-line' }}>
                                              {control.consecuencias || 'Sin consecuencias registradas'}
                                            </div>
                                          )}
                                      </td>
                                            <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                              {puedeEditar && estaEditando ? (
                                                <input
                                                  type="text"
                                                  value={control.criticidad || ''}
                                                  onChange={(e) => {
                                                    const nuevosControles = [...analisisBowtie.controles_preventivos_generales];
                                                    nuevosControles[index] = { ...nuevosControles[index], criticidad: e.target.value };
                                                    setAnalisisBowtie({ ...analisisBowtie, controles_preventivos_generales: nuevosControles });
                                                  }}
                                                  placeholder="Ej: Crítico, Medio..."
                                                  style={{
                                                    width: '100%',
                                                    padding: '0.25rem 0.4rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ced4da',
                                                    fontSize: '12px'
                                                  }}
                                                />
                                              ) : (
                                                <div style={{ fontSize: '12px', color: '#495057' }}>
                                        {control.criticidad || 'Sin criticidad'}
                                                </div>
                                              )}
                                      </td>
                                            <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                              {puedeEditar && estaEditando ? (
                                                <input
                                                  type="text"
                                                  value={control.jerarquia || ''}
                                                  onChange={(e) => {
                                                    const nuevosControles = [...analisisBowtie.controles_preventivos_generales];
                                                    nuevosControles[index] = { ...nuevosControles[index], jerarquia: e.target.value };
                                                    setAnalisisBowtie({ ...analisisBowtie, controles_preventivos_generales: nuevosControles });
                                                  }}
                                                  placeholder="Ej: Aislamiento, Administrativo"
                                                  style={{
                                                    width: '100%',
                                                    padding: '0.25rem 0.4rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ced4da',
                                                    fontSize: '12px'
                                                  }}
                                                />
                                              ) : (
                                                <div style={{ fontSize: '12px', color: '#495057' }}>
                                        {control.jerarquia || 'Sin jerarquía'}
                                                </div>
                                              )}
                                      </td>
                                            {puedeEditar && (
                                              <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                            {estaGuardado && !estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  if (!controlesPreventivosGeneralesEditando) {
                                                    setControlesPreventivosGeneralesEditando(new Set());
                                                  }
                                                  setControlesPreventivosGeneralesEditando(prev => new Set(prev).add(control.id));
                                                }}
                                                style={{
                                                  background: '#17a2b8',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Editar control"
                                              >
                                                <i className="fa fa-pencil"></i>
                                              </button>
                                            ) : estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  if (controlesPreventivosGeneralesEditando) {
                                                    setControlesPreventivosGeneralesEditando(prev => {
                                                      const newSet = new Set(prev);
                                                      newSet.delete(control.id);
                                                      return newSet;
                                                    });
                                                    cargarAnalisisBowtie(carpetaActual.id);
                                                  }
                                                }}
                                                style={{
                                                  background: '#6c757d',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Cancelar edición"
                                              >
                                                <i className="fa fa-times"></i>
                                              </button>
                                            ) : null}
                                            <button
                                              onClick={() => {
                                                const nuevosControles = analisisBowtie.controles_preventivos_generales.filter((_, i) => i !== index);
                                                setAnalisisBowtie({ ...analisisBowtie, controles_preventivos_generales: nuevosControles });
                                              }}
                                              style={{
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                              }}
                                              title="Eliminar control"
                                            >
                                              <i className="fa fa-trash"></i>
                                              </button>
                                            </td>
                                            )}
                                    </tr>
                                        );
                                      })
                                ) : (
                                  <tr>
                                        <td colSpan={puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d', fontSize: '12px' }}>
                                          No hay controles preventivos generales registrados. {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && 'Haz clic en "Agregar Control" para comenzar.'}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                              {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  const controles = analisisBowtie.controles_preventivos_generales || [];
                                  
                                  // Verificar que no haya duplicados antes de agregar
                                  const codigosExistentes = controles
                                    .map(c => c.codigo)
                                    .filter(c => c && c.trim() !== '');
                                  
                                  // Generar código único
                                  const codigosCP = codigosExistentes
                                    .filter(c => c.match(/^CP\d+$/i))
                                    .map(c => {
                                      const match = c.match(/^CP(\d+)$/i);
                                      return match ? parseInt(match[1]) : 0;
                                    })
                                    .filter(n => n > 0);
                                  
                                  let siguienteNumero = 1;
                                  while (codigosCP.includes(siguienteNumero)) {
                                    siguienteNumero++;
                                  }
                                  const nuevoCodigo = `CP${siguienteNumero}`;
                                  
                                  // Verificar que el nuevo código no esté duplicado
                                  if (codigosExistentes.includes(nuevoCodigo)) {
                                    alert(`El código ${nuevoCodigo} ya existe. Por favor, elimine los duplicados primero.`);
                                    return;
                                  }
                                  
                                  const nuevosControles = [...controles, {
                                    codigo: nuevoCodigo,
                                    nombre_control: '',
                                    consecuencias: '',
                                    criticidad: '',
                                    jerarquia: ''
                                  }];
                                  setAnalisisBowtie({...analisisBowtie, controles_preventivos_generales: nuevosControles});
                                }}
                                style={{
                                  background: '#0d6efd',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}
                              >
                                  <i className="fa fa-plus"></i> Agregar Control
                                </button>
                                <button
                                  onClick={guardarControlesPreventivosGenerales}
                                  disabled={guardandoControlesPreventivosGenerales}
                                  style={{
                                    background: guardandoControlesPreventivosGenerales ? '#6c757d' : '#0d6efd',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1.5rem',
                                    borderRadius: '6px',
                                    cursor: guardandoControlesPreventivosGenerales ? 'not-allowed' : 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    opacity: guardandoControlesPreventivosGenerales ? 0.7 : 1
                                  }}
                                  title="Guardar cambios de Controles Preventivos"
                                >
                                  <i className={`fa ${guardandoControlesPreventivosGenerales ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {guardandoControlesPreventivosGenerales ? 'Guardando...' : 'Guardar Controles Preventivos'}
                                </button>
                              </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Tabla de Controles Críticos Mitigadores */}
                        <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #FF8C00',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem',
                          paddingBottom: '0.75rem',
                          borderBottom: '2px solid #FF8C00'
                        }}>
                          <h3 style={{ margin: 0, color: '#FF8C00', fontSize: '18px', fontWeight: '700' }}>
                            <i className="fa fa-shield-alt" style={{ marginRight: '8px' }}></i>
                            Controles Críticos Mitigadores
                          </h3>
                            <button
                            onClick={() => setTablasBowtieMinimizadas(prev => ({ ...prev, controles_mitigadores_criticos: !prev.controles_mitigadores_criticos }))}
                              style={{
                              background: 'transparent',
                                border: 'none',
                              color: '#FF8C00',
                                cursor: 'pointer',
                              fontSize: '16px',
                              padding: '0.25rem 0.5rem'
                              }}
                            title={tablasBowtieMinimizadas.controles_mitigadores_criticos ? 'Expandir tabla' : 'Minimizar tabla'}
                            >
                            <i className={`fa ${tablasBowtieMinimizadas.controles_mitigadores_criticos ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                            </button>
                        </div>

                        {!tablasBowtieMinimizadas.controles_mitigadores_criticos && (
                          <>
                        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #FF8C00' }}>
                                <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '80px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 101 }}>Código</th>
                                <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Controles Críticos Mitigadores</th>
                                <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Consecuencias</th>
                                <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Criticidad</th>
                                <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Jerarquía</th>
                                {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: '700', color: '#FF8C00', width: '50px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}></th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {analisisBowtie?.controles_mitigadores && analisisBowtie.controles_mitigadores.length > 0 ? (
                                analisisBowtie.controles_mitigadores.map((control, index) => {
                                  const codigo = control.codigo || `CCM${index + 1}`;
                                  const estaGuardado = !!control.id; // Si tiene ID, está guardado en BD
                                  const estaEditando = controlesMitigadoresEditando.has(control.id) || (!estaGuardado); // Nuevo control siempre editable
                                  const puedeEditar = canEditFiles(user) && analisisBowtie;
                                  
                                  return (
                                    <tr key={`control-mitigador-${control.id || `temp-${index}`}-${index}`} style={{ borderBottom: '1px solid #dee2e6', lineHeight: '1.3' }}>
                                      <td style={{ padding: '0.35rem 0.5rem', background: '#f8f9fa', fontWeight: '600', color: '#495057', verticalAlign: 'top' }}>
                                        {puedeEditar && estaEditando ? (
                                          <input
                                            type="text"
                                            value={codigo}
                                            onChange={(e) => {
                                              const nuevosControles = [...analisisBowtie.controles_mitigadores];
                                              nuevosControles[index] = {...nuevosControles[index], codigo: e.target.value};
                                              setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                                            }}
                                            style={{
                                              width: '100%',
                                              padding: '0.25rem 0.4rem',
                                              borderRadius: '4px',
                                              border: '1px solid #ced4da',
                                              fontSize: '12px',
                                              fontWeight: '600'
                                            }}
                                          />
                                        ) : (
                                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>
                                            {codigo}
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                        {puedeEditar && estaEditando ? (
                                          <textarea
                                            value={control.descripcion || ''}
                                            onChange={(e) => {
                                              const nuevosControles = [...analisisBowtie.controles_mitigadores];
                                              nuevosControles[index] = {...nuevosControles[index], descripcion: e.target.value};
                                              setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                                            }}
                                            placeholder="Descripción del control mitigador..."
                                            style={{
                                              width: '100%',
                                              minHeight: '35px',
                                              padding: '0.35rem 0.5rem',
                                              borderRadius: '4px',
                                              border: '1px solid #ced4da',
                                              fontSize: '12px',
                                              lineHeight: '1.4',
                                              resize: 'vertical',
                                              fontFamily: 'inherit'
                                            }}
                                          />
                                        ) : (
                                          <div style={{ fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                                            {control.descripcion || 'Sin descripción'}
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                        {puedeEditar && estaEditando ? (
                                          <input
                                            type="text"
                                            value={(control.consecuencias_asociadas || []).map(co => co.codigo || `CO${co.index + 1}`).join(' - ') || ''}
                                            onChange={(e) => {
                                              // Parsear códigos de consecuencias separados por guiones
                                              const codigosConsecuencias = e.target.value.split('-').map(c => c.trim()).filter(c => c);
                                              const consecuenciasAsociadas = codigosConsecuencias.map(codigo => {
                                                const consecuenciaIndex = analisisBowtie.consecuencias.findIndex(c => (c.codigo || `CO${analisisBowtie.consecuencias.indexOf(c) + 1}`) === codigo);
                                                return consecuenciaIndex >= 0 ? { codigo, index: consecuenciaIndex } : { codigo };
                                              });
                                              const nuevosControles = [...analisisBowtie.controles_mitigadores];
                                              nuevosControles[index] = {...nuevosControles[index], consecuencias_asociadas: consecuenciasAsociadas};
                                              setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                                            }}
                                            placeholder="CO1 - CO2 - CO3..."
                                            style={{
                                              width: '100%',
                                              padding: '0.25rem 0.4rem',
                                              borderRadius: '4px',
                                              border: '1px solid #ced4da',
                                              fontSize: '12px'
                                            }}
                                          />
                                        ) : (
                                          <div style={{ fontSize: '12px', color: '#495057' }}>
                                            {(control.consecuencias_asociadas || []).map(co => co.codigo || `CO${co.index + 1}`).join(' - ') || 'Sin asociar'}
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                        {puedeEditar && estaEditando ? (
                                          <input
                                            type="text"
                                            value={control.criticidad || ''}
                                            onChange={(e) => {
                                              const nuevosControles = [...analisisBowtie.controles_mitigadores];
                                              nuevosControles[index] = {...nuevosControles[index], criticidad: e.target.value};
                                              setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                                            }}
                                            placeholder="Ej: Crítico, No crítico"
                                            style={{
                                              width: '100%',
                                              padding: '0.25rem 0.4rem',
                                              borderRadius: '4px',
                                              border: '1px solid #ced4da',
                                              fontSize: '12px'
                                            }}
                                          />
                                        ) : (
                                          <div style={{ fontSize: '12px', color: '#495057' }}>
                                            {control.criticidad || 'Sin criticidad'}
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                        {puedeEditar && estaEditando ? (
                                          <input
                                            type="text"
                                            value={control.jerarquia || ''}
                                            onChange={(e) => {
                                              const nuevosControles = [...analisisBowtie.controles_mitigadores];
                                              nuevosControles[index] = {...nuevosControles[index], jerarquia: e.target.value};
                                              setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                                            }}
                                            placeholder="Ej: Aislamiento, Administrativo"
                                            style={{
                                              width: '100%',
                                              padding: '0.25rem 0.4rem',
                                              borderRadius: '4px',
                                              border: '1px solid #ced4da',
                                              fontSize: '12px'
                                            }}
                                          />
                                        ) : (
                                          <div style={{ fontSize: '12px', color: '#495057' }}>
                                            {control.jerarquia || 'Sin jerarquía'}
                                          </div>
                                        )}
                                      </td>
                                      {puedeEditar && (
                                        <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                          {estaGuardado && !estaEditando ? (
                                            <>
                                              <button
                                                onClick={() => {
                                                  setModalVerDimensiones({
                                                    control: control,
                                                    tipo: 'mitigador'
                                                  });
                                                }}
                                                style={{
                                                  background: '#ffc107',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Ver dimensiones, preguntas y evidencias"
                                              >
                                                <i className="fa fa-search"></i>
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setModalDimensionesMitigador({
                                                    controlId: control.id,
                                                    controlIndex: index,
                                                    control: control,
                                                    tipo: 'mitigador'
                                                  });
                                                }}
                                                style={{
                                                  background: '#6f42c1',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Gestionar dimensiones, preguntas y evidencias"
                                              >
                                                <i className="fa fa-list-ul"></i>
                                              </button>
                                            <button
                                              onClick={() => {
                                                if (!controlesMitigadoresEditando) {
                                                  setControlesMitigadoresEditando(new Set());
                                                }
                                                setControlesMitigadoresEditando(prev => new Set(prev).add(control.id));
                                              }}
                                              style={{
                                                background: '#17a2b8',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                marginRight: '0.25rem'
                                              }}
                                              title="Editar control"
                                            >
                                              <i className="fa fa-pencil"></i>
                                            </button>
                                            </>
                                          ) : estaEditando ? (
                                            <button
                                              onClick={() => {
                                                if (controlesMitigadoresEditando) {
                                                  setControlesMitigadoresEditando(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(control.id);
                                                    return newSet;
                                                  });
                                                  cargarAnalisisBowtie(carpetaActual.id);
                                                }
                                              }}
                                              style={{
                                                background: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                marginRight: '0.25rem'
                                              }}
                                              title="Cancelar edición"
                                            >
                                              <i className="fa fa-times"></i>
                                            </button>
                                          ) : null}
                                          {estaGuardado && !estaEditando ? (
                                            <button
                                              onClick={() => {
                                                const nuevosControles = analisisBowtie.controles_mitigadores.filter((_, i) => i !== index);
                                                setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                                              }}
                                              style={{
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                              }}
                                              title="Eliminar control"
                                            >
                                              <i className="fa fa-trash"></i>
                                            </button>
                                          ) : !estaGuardado ? (
                                            <button
                                              onClick={() => {
                                                const nuevosControles = analisisBowtie.controles_mitigadores.filter((_, i) => i !== index);
                                                setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                                              }}
                                              style={{
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                              }}
                                              title="Eliminar control"
                                            >
                                              <i className="fa fa-trash"></i>
                                            </button>
                                          ) : null}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d', fontSize: '12px' }}>
                                    No hay controles mitigadores registrados. {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && 'Haz clic en "Agregar Control" para comenzar.'}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Botones Agregar y Guardar al final de la tabla de Controles Mitigadores */}
                        {canEditFiles(user) && analisisBowtie && (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                              onClick={() => {
                                // Obtener códigos existentes
                                const codigosExistentes = (analisisBowtie.controles_mitigadores || [])
                                  .map(c => c.codigo)
                                  .filter(c => c && c.match(/^CCM\d+$/i))
                                  .map(c => {
                                    const match = c.match(/^CCM(\d+)$/i);
                                    return match ? parseInt(match[1]) : 0;
                                  })
                                  .filter(n => n > 0);
                                
                                // Encontrar el siguiente número disponible
                                let siguienteNumero = 1;
                                while (codigosExistentes.includes(siguienteNumero)) {
                                  siguienteNumero++;
                                }
                                
                                const nuevoCodigo = `CCM${siguienteNumero}`;
                                const nuevosControles = [...(analisisBowtie.controles_mitigadores || []), { 
                                  codigo: nuevoCodigo, 
                                  descripcion: '', 
                                  criticidad: '',
                                  jerarquia: '',
                                  consecuencias_asociadas: [] 
                                }];
                                setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                              }}
                              style={{
                                background: '#FF8C00',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}
                            >
                              <i className="fa fa-plus"></i> Agregar Control
                            </button>
                            <button
                              onClick={guardarControlesMitigadores}
                              disabled={guardandoControlesMitigadores}
                              style={{
                                background: guardandoControlesMitigadores ? '#6c757d' : '#FF8C00',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1.5rem',
                                borderRadius: '6px',
                                cursor: guardandoControlesMitigadores ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                opacity: guardandoControlesMitigadores ? 0.7 : 1
                              }}
                              title="Guardar cambios de Controles Mitigadores"
                            >
                              <i className={`fa ${guardandoControlesMitigadores ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {guardandoControlesMitigadores ? 'Guardando...' : 'Guardar Controles Mitigadores'}
                            </button>
                          </div>
                        )}
                            </>
                        )}
                      </div>

                        {/* Tabla de Controles Mitigadores Generales */}
                        <div style={{
                          background: 'white',
                          padding: '1.5rem',
                          borderRadius: '8px',
                          border: '2px solid #6610f2',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '2px solid #6610f2'
                          }}>
                            <h3 style={{ margin: 0, color: '#6610f2', fontSize: '18px', fontWeight: '700' }}>
                              <i className="fa fa-clipboard-check" style={{ marginRight: '8px' }}></i>
                              CONTROLES MITIGADORES
                            </h3>
                            <button
                              onClick={() => setTablasBowtieMinimizadas(prev => ({ ...prev, controles_mitigadores_generales: !prev.controles_mitigadores_generales }))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#6610f2',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '0.25rem 0.5rem'
                              }}
                              title={tablasBowtieMinimizadas.controles_mitigadores_generales ? 'Expandir tabla' : 'Minimizar tabla'}
                            >
                              <i className={`fa ${tablasBowtieMinimizadas.controles_mitigadores_generales ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                            </button>
                    </div>
                          {!tablasBowtieMinimizadas.controles_mitigadores_generales && (
                            <>
                              <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #6610f2' }}>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#6610f2', width: '80px' }}>Código</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#6610f2' }}>Nombre Control</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#6610f2', width: '200px' }}>Consecuencias</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#6610f2', width: '120px' }}>Criticidad</th>
                                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', color: '#6610f2', width: '120px' }}>Jerarquía</th>
                                  {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: '700', color: '#6610f2', width: '50px' }}></th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {analisisBowtie?.controles_mitigadores_generales && analisisBowtie.controles_mitigadores_generales.length > 0 ? (
                                  analisisBowtie.controles_mitigadores_generales.map((control, index) => {
                                    const codigo = control.codigo || `CM${index + 1}`;
                                    const estaGuardado = !!control.id;
                                    const estaEditando = controlesMitigadoresGeneralesEditando.has(control.id) || !estaGuardado;
                                    const puedeEditar = puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie;
                                    return (
                                      <tr key={`control-mitigador-general-${control.id || `temp-${index}`}-${index}`} style={{ borderBottom: '1px solid #dee2e6', lineHeight: '1.3' }}>
                                        <td style={{ padding: '0.35rem 0.5rem', background: '#f8f9fa', fontWeight: '600', color: '#495057', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={codigo}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_mitigadores_generales];
                                                nuevosControles[index] = { ...nuevosControles[index], codigo: e.target.value };
                                                setAnalisisBowtie({ ...analisisBowtie, controles_mitigadores_generales: nuevosControles });
                                              }}
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>
                                              {codigo}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <textarea
                                              value={control.nombre_control || ''}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_mitigadores_generales];
                                                nuevosControles[index] = { ...nuevosControles[index], nombre_control: e.target.value };
                                                setAnalisisBowtie({ ...analisisBowtie, controles_mitigadores_generales: nuevosControles });
                                              }}
                                              placeholder="Nombre o descripción del control mitigador..."
                                              style={{
                                                width: '100%',
                                                minHeight: '35px',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                lineHeight: '1.4',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                                              {control.nombre_control || 'Sin nombre'}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <textarea
                                              value={control.consecuencias || ''}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_mitigadores_generales];
                                                nuevosControles[index] = { ...nuevosControles[index], consecuencias: e.target.value };
                                                setAnalisisBowtie({ ...analisisBowtie, controles_mitigadores_generales: nuevosControles });
                                              }}
                                              placeholder="Consecuencias asociadas..."
                                              style={{
                                                width: '100%',
                                                minHeight: '35px',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px',
                                                lineHeight: '1.4',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057', whiteSpace: 'pre-line' }}>
                                              {control.consecuencias || 'Sin consecuencias registradas'}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={control.criticidad || ''}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_mitigadores_generales];
                                                nuevosControles[index] = { ...nuevosControles[index], criticidad: e.target.value };
                                                setAnalisisBowtie({ ...analisisBowtie, controles_mitigadores_generales: nuevosControles });
                                              }}
                                              placeholder="Ej: Crítico, Medio..."
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057' }}>
                                              {control.criticidad || ''}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.5rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="text"
                                              value={control.jerarquia || ''}
                                              onChange={(e) => {
                                                const nuevosControles = [...analisisBowtie.controles_mitigadores_generales];
                                                nuevosControles[index] = { ...nuevosControles[index], jerarquia: e.target.value };
                                                setAnalisisBowtie({ ...analisisBowtie, controles_mitigadores_generales: nuevosControles });
                                              }}
                                              placeholder="Jerarquía del control..."
                                              style={{
                                                width: '100%',
                                                padding: '0.25rem 0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                fontSize: '12px'
                                              }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '12px', color: '#495057' }}>
                                              {control.jerarquia || 'Sin jerarquía'}
                                            </div>
                                          )}
                                        </td>
                                        {puedeEditar && (
                                          <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                            {estaGuardado && !estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  if (!controlesMitigadoresGeneralesEditando) {
                                                    setControlesMitigadoresGeneralesEditando(new Set());
                                                  }
                                                  setControlesMitigadoresGeneralesEditando(prev => new Set(prev).add(control.id));
                                                }}
                                                style={{
                                                  background: '#17a2b8',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Editar control"
                                              >
                                                <i className="fa fa-pencil"></i>
                                              </button>
                                            ) : estaEditando ? (
                                              <button
                                                onClick={() => {
                                                  if (controlesMitigadoresGeneralesEditando) {
                                                    setControlesMitigadoresGeneralesEditando(prev => {
                                                      const newSet = new Set(prev);
                                                      newSet.delete(control.id);
                                                      return newSet;
                                                    });
                                                    cargarAnalisisBowtie(carpetaActual.id);
                                                  }
                                                }}
                                                style={{
                                                  background: '#6c757d',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  marginRight: '0.25rem'
                                                }}
                                                title="Cancelar edición"
                                              >
                                                <i className="fa fa-times"></i>
                                              </button>
                                            ) : null}
                                            <button
                                              onClick={() => {
                                                const nuevosControles = analisisBowtie.controles_mitigadores_generales.filter((_, i) => i !== index);
                                                setAnalisisBowtie({ ...analisisBowtie, controles_mitigadores_generales: nuevosControles });
                                              }}
                                              style={{
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.35rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                              }}
                                              title="Eliminar control"
                                            >
                                              <i className="fa fa-trash"></i>
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={canEditFiles(user) && analisisBowtie ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d', fontSize: '12px' }}>
                                      No hay controles mitigadores generales registrados. {canEditFiles(user) && analisisBowtie && 'Haz clic en "Agregar Control" para comenzar.'}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          {puedeEditarBowtie(user, rutaNavegacion) && analisisBowtie && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  const controles = analisisBowtie.controles_mitigadores_generales || [];
                                  const codigosExistentes = controles
                                    .map(c => c.codigo)
                                    .filter(c => c && c.match(/^CM\d+$/i))
                                    .map(c => {
                                      const match = c.match(/^CM(\d+)$/i);
                                      return match ? parseInt(match[1]) : 0;
                                    })
                                    .filter(n => n > 0);
                                  let siguienteNumero = 1;
                                  while (codigosExistentes.includes(siguienteNumero)) {
                                    siguienteNumero++;
                                  }
                                  const nuevoCodigo = `CM${siguienteNumero}`;
                                  const nuevosControles = [...controles, {
                                    codigo: nuevoCodigo,
                                    nombre_control: '',
                                    consecuencias: '',
                                    criticidad: '',
                                    jerarquia: ''
                                  }];
                                  setAnalisisBowtie({...analisisBowtie, controles_mitigadores_generales: nuevosControles});
                                }}
                                style={{
                                  background: '#6610f2',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}
                              >
                                <i className="fa fa-plus"></i> Agregar Control
                              </button>
                              <button
                                onClick={guardarControlesMitigadoresGenerales}
                                disabled={guardandoControlesMitigadoresGenerales}
                                style={{
                                  background: guardandoControlesMitigadoresGenerales ? '#6c757d' : '#6610f2',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1.5rem',
                                  borderRadius: '6px',
                                  cursor: guardandoControlesMitigadoresGenerales ? 'not-allowed' : 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  opacity: guardandoControlesMitigadoresGenerales ? 0.7 : 1
                                }}
                                title="Guardar cambios de Controles Mitigadores"
                              >
                                <i className={`fa ${guardandoControlesMitigadoresGenerales ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {guardandoControlesMitigadoresGenerales ? 'Guardando...' : 'Guardar Controles Mitigadores'}
                              </button>
                            </div>
                          )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pestaña Archivos */}
            {pestañaActiva === 'archivos' && (
              <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ margin: 0, color: '#17a2b8' }}>
                Archivos en "{carpetaActual.nombre}"
              </h2>
              <button
                onClick={abrirModalParticipantes}
                style={{
                  background: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(10, 110, 189, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#085a9d';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(10, 110, 189, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#17a2b8';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(10, 110, 189, 0.2)';
                }}
                title="Ver participantes de la carpeta"
              >
                <i className="fa fa-users"></i>
                Participantes
              </button>
            </div>
            {canUploadFiles(user) && (
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.onchange = async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;
                    
                    // Inicializar estado de subida
                    setArchivosSubiendo(files.map(f => ({ nombre: f.name, progreso: 0, estado: 'subiendo' })));
                    setUploadProgress({ visible: true, total: files.length, completados: 0, progresoGeneral: 0 });
                    
                    // Subir archivos uno por uno con barra de progreso
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      try {
                        await subirArchivoConProgreso(file, carpetaActual.id, user.id, i, files.length);
                        // Pequeña pausa entre archivos para evitar problemas
                        await new Promise(resolve => setTimeout(resolve, 200));
                      } catch (error) {
                        console.error(`Error subiendo archivo ${file.name}:`, error);
                      }
                    }
                    
                    // Esperar un momento para asegurar que los archivos estén disponibles
                    setTimeout(() => {
                      cargarArchivos(carpetaActual.id);
                      // No cerrar automáticamente, dejar que el usuario cierre cuando vea que todo está completo
                    }, 1000);
                  };
                  input.click();
                }}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa fa-upload"></i> Subir Archivos
              </button>
            )}
          </div>
          {archivos.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
              <p style={{ margin: 0 }}>No hay archivos en esta carpeta</p>
              {canUploadFiles(user) && (
                <div style={{ marginTop: '10px' }}>
                  Haz clic en "Subir Archivos" para agregar archivos a esta carpeta.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {archivos.map((archivo) => (
                <div
                  key={archivo.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {(() => {
                        const iconoInfo = obtenerIconoArchivo(archivo.nombre_original, archivo.tipo_mime);
                        return (
                          <i className={`fa ${iconoInfo.icono}`} style={{ fontSize: '24px', color: iconoInfo.color }}></i>
                        );
                      })()}
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#17a2b8' }}>
                          {archivo.nombre_original}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          <span><i className="fa fa-user"></i> {archivo.subido_por_nombre}</span>
                          <span style={{ marginLeft: '15px' }}>
                            <i className="fa fa-calendar"></i> {formatearFechaHora(archivo.subido_en)}
                          </span>
                          {archivo.tamaño && (
                            <span style={{ marginLeft: '15px' }}>
                              <i className="fa fa-hdd"></i> {(archivo.tamaño / 1024).toFixed(2)} KB
                            </span>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {canDownloadFiles(user) && (
                      <>
                        <button
                          onClick={() => {
                            setArchivoPreview(archivo);
                          }}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Previsualizar archivo"
                        >
                          <i className="fa fa-eye"></i>
                        </button>
                        <button
                          onClick={() => {
                            // Construir URL correctamente (evitar duplicación de /api/)
                            let urlDescarga = archivo.ruta_archivo;
                            if (!urlDescarga.startsWith('http')) {
                              if (urlDescarga.startsWith('/api/')) {
                                // En desarrollo, usar el servidor PHP directamente (no el proxy de React)
                                if (process.env.NODE_ENV === 'development') {
                                  urlDescarga = 'http://localhost/rcritico' + urlDescarga;
                                } else {
                                  const origin = window.location.origin;
                                  urlDescarga = origin + urlDescarga;
                                }
                              } else {
                                urlDescarga = `${API_BASE}${urlDescarga.startsWith('/') ? '' : '/'}${urlDescarga}`;
                              }
                            }
                            window.open(urlDescarga, '_blank');
                          }}
                          style={{
                            background: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Descargar archivo"
                        >
                          <i className="fa fa-download"></i>
                        </button>
                      </>
                    )}
                    {canDeleteFiles(user) && (
                      <button
                        onClick={async () => {
                          const mensaje = `¿Estás seguro de eliminar el archivo "${archivo.nombre_original}"?\n\n` +
                                         `⚠️ ADVERTENCIA: Esta acción eliminará:\n` +
                                         `• El archivo de la base de datos\n` +
                                         `• El archivo físico del servidor\n\n` +
                                         `Esta acción NO se puede deshacer.`;
                          
                          if (window.confirm(mensaje)) {
                            try {
                              const res = await fetch(`${API_BASE}/archivos/archivos.php?id=${archivo.id}&usuario_id=${user.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json'
                                },
                                mode: 'cors'
                              });
                              
                              // Verificar el tipo de contenido de la respuesta
                              const contentType = res.headers.get('content-type');
                              let data;
                              
                              if (contentType && contentType.includes('application/json')) {
                                data = await res.json();
                              } else {
                                const text = await res.text();
                                try {
                                  data = JSON.parse(text);
                                } catch (e) {
                                  throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
                                }
                              }
                              
                              if (data.success) {
                                // Mostrar mensaje informativo
                                const mensajeExito = `Archivo "${archivo.nombre_original}" eliminado exitosamente.`;
                                if (data.archivo_fisico_eliminado === false) {
                                  alert(mensajeExito + '\n\nNota: El archivo físico no se pudo eliminar del servidor, pero se eliminó de la base de datos.');
                                } else {
                                  alert(mensajeExito);
                                }
                                
                                // Recargar lista de archivos
                                cargarArchivos(carpetaActual.id);
                              } else {
                                alert('Error al eliminar archivo: ' + (data.error || 'Error desconocido'));
                              }
                            } catch (error) {
                              console.error('Error eliminando archivo:', error);
                              alert('Error al eliminar archivo: ' + (error.message || 'Error de conexión'));
                            }
                          }
                        }}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Eliminar archivo"
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
              </>
            )}

            {/* Pestaña Linea Base */}
            {pestañaActiva === 'linea_base' && (
              <div>
                {!carpetaActual ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                    <i className="fa fa-chart-line" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                    <p>Selecciona una carpeta para ver su línea base</p>
                  </div>
                ) : cargandoLineaBase ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#17a2b8' }}></i>
                    <p style={{ marginTop: '1rem', color: '#666' }}>Cargando línea base...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      border: '2px solid #17a2b8',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '2px solid #17a2b8'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <h3 style={{
                            margin: 0,
                            color: '#17a2b8',
                            fontSize: '18px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <i className="fa fa-chart-line"></i>
                            Línea Base - {carpetaActual.nombre}
                          </h3>
                          {rutaNavegacion.length === 2 && promedioPonderacionActual !== null && promedioPonderacionActual !== undefined && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '14px',
                              color: '#666'
                            }}>
                              <span style={{ fontWeight: '600' }}>Promedio de Ponderación:</span>
                              <span style={{
                                background: promedioPonderacionActual >= 80 ? '#e8f5e9' : promedioPonderacionActual >= 50 ? '#fff9c4' : '#ffebee',
                                color: promedioPonderacionActual >= 80 ? '#2e7d32' : promedioPonderacionActual >= 50 ? '#f57f17' : '#c62828',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontWeight: '700',
                                fontSize: '15px'
                              }}>
                                {typeof promedioPonderacionActual === 'number' ? promedioPonderacionActual.toFixed(1) : '0.0'}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={exportarLineaBaseExcel}
                            style={{
                              background: '#1d6f42',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            title="Exportar a Excel"
                          >
                            <i className="fa fa-file-excel"></i> Exportar Excel
                          </button>
                          {canEditFiles(user) && (
                            <button
                              onClick={guardarLineaBase}
                              disabled={guardandoLineaBase}
                              style={{
                                background: guardandoLineaBase ? '#6c757d' : '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1.5rem',
                                borderRadius: '6px',
                                cursor: guardandoLineaBase ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                opacity: guardandoLineaBase ? 0.7 : 1
                              }}
                              title='Guardar línea base'
                            >
                              <i className={`fa ${guardandoLineaBase ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {guardandoLineaBase ? 'Guardando...' : 'Guardar Línea Base'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                        {(() => {
                          // Determinar si estamos en el primer nivel (rutaNavegacion.length === 1)
                          const esPrimerNivel = rutaNavegacion.length === 1;
                          
                          // Calcular rowspan para cada grupo de control (mismo código)
                          const calcularRowspans = () => {
                            const rowspans = {};
                            const gruposPorCodigo = {};
                            
                            lineaBase.forEach((item, index) => {
                              const codigo = item.codigo || '';
                              if (!gruposPorCodigo[codigo]) {
                                gruposPorCodigo[codigo] = [];
                              }
                              gruposPorCodigo[codigo].push(index);
                            });
                            
                            Object.keys(gruposPorCodigo).forEach(codigo => {
                              const indices = gruposPorCodigo[codigo];
                              indices.forEach((index, posicionEnGrupo) => {
                                if (posicionEnGrupo === 0) {
                                  rowspans[index] = indices.length;
                                } else {
                                  rowspans[index] = 0; // No renderizar esta celda
                                }
                              });
                            });
                            
                            return rowspans;
                          };
                          
                          const rowspans = lineaBase && lineaBase.length > 0 ? calcularRowspans() : {};
                          
                          // Anchos de columnas según el nivel
                          const anchoCodigo = esPrimerNivel ? '70px' : '80px';
                          const anchoControl = esPrimerNivel ? '180px' : '300px'; // Aumentado significativamente para nivel 2 para evitar cortes de texto
                          const anchoDimension = esPrimerNivel ? '100px' : '150px'; // Aumentado para mejor separación
                          const anchoPregunta = esPrimerNivel ? '250px' : '150px';
                          const anchoEvidencia = esPrimerNivel ? '300px' : '150px';
                          const minWidthTabla = esPrimerNivel ? '900px' : '2000px';
                          
                          return (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: minWidthTabla, tableLayout: 'auto' }}>
                              <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #17a2b8' }}>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: anchoCodigo, position: 'sticky', left: 0, top: 0, background: '#f8f9fa', zIndex: 101 }}>Código</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: anchoControl, minWidth: anchoControl, position: 'sticky', left: anchoCodigo, top: 0, background: '#f8f9fa', zIndex: 101 }}>Controles Críticos Preventivos</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: anchoDimension, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Dimensión</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: anchoPregunta, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Pregunta</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: anchoEvidencia, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Evidencia</th>
                                  {!esPrimerNivel && (
                                    <>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Verificador Responsable</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Fecha Verificación</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '180px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Implementado Estándar de Desempeño (SI / NO / NA)</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Acción a Ejecutar</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Responsable Cierre de Acción</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Fecha de Cierre</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '100px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Criticidad</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>% Avance Implementación Acción</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '200px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Nombre Dueño Control Crítico Técnico (CODELCO VP)</th>
                                      {(user.rol === 'super_admin' || user.rol === 'admin') && (
                                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#17a2b8', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Validación/Observaciones</th>
                                      )}
                                      {(user.rol === 'super_admin' || user.rol === 'admin') && (
                                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#17a2b8', width: '100px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Ponderación</th>
                                      )}
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#17a2b8', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Último Usuario que Editó</th>
                                      {canEditFiles(user) && (
                                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#17a2b8', width: '100px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Acciones</th>
                                      )}
                                    </>
                                  )}
                                </tr>
                              </thead>
                          <tbody>
                            {lineaBase && lineaBase.length > 0 ? (
                              lineaBase.map((item, index) => {
                                const estaEditando = lineaBaseEditando.has(item.id || `temp-${index}`);
                                const puedeEditar = canEditFiles(user);
                                const esPrimerNivel = rutaNavegacion.length === 1;
                                
                                const tieneObservaciones = item.estado_validacion === 'con_observaciones';
                                
                                return (
                                  <tr key={`linea-base-${item.id || `temp-${index}`}-${index}`} style={{ 
                                    borderBottom: '1px solid #dee2e6',
                                    backgroundColor: tieneObservaciones ? '#fff3cd' : 'transparent',
                                    borderLeft: tieneObservaciones ? '4px solid #ffc107' : 'none'
                                  }}>
                                    <td style={{ padding: '0.4rem', background: '#f8f9fa', fontWeight: '600', color: '#495057', position: 'sticky', left: 0, zIndex: 5 }}>
                                      <div>{item.codigo || ''}</div>
                                    </td>
                                    {rowspans[index] !== 0 && (
                                      <td 
                                        rowSpan={rowspans[index] || 1} 
                                        style={{ 
                                          padding: '0.4rem', 
                                          verticalAlign: 'middle', 
                                          position: 'sticky', 
                                          left: esPrimerNivel ? '70px' : '80px', 
                                          background: 'white', 
                                          zIndex: 5,
                                          borderRight: '1px solid #dee2e6',
                                          width: anchoControl,
                                          maxWidth: anchoControl,
                                          minWidth: anchoControl,
                                          wordWrap: 'break-word',
                                          overflowWrap: 'break-word',
                                          overflow: 'visible',
                                          whiteSpace: 'normal',
                                          textOverflow: 'clip'
                                        }}
                                      >
                                        <div style={{ 
                                          fontSize: '11px', 
                                          lineHeight: '1.4', 
                                          wordWrap: 'break-word', 
                                          overflowWrap: 'break-word',
                                          whiteSpace: 'normal',
                                          overflow: 'visible',
                                          width: '100%',
                                          maxWidth: '100%'
                                        }}>
                                          {item.control_critico_preventivo || ''}
                                        </div>
                                      </td>
                                    )}
                                    <td style={{ 
                                      padding: '0.4rem', 
                                      verticalAlign: 'top',
                                      width: anchoDimension,
                                      minWidth: anchoDimension,
                                      maxWidth: anchoDimension
                                    }}>
                                      {renderDimensionCell(item.dimension)}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {renderPreguntaCell(item.pregunta)}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <textarea
                                          value={item.evidencia || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBase];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], evidencia: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBase(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px', minHeight: '60px', resize: 'vertical' }}
                                          placeholder="Ingrese las evidencias (puede separar múltiples evidencias con Enter o punto y coma)"
                                        />
                                      ) : (
                                        renderEvidenciaCell(item.evidencia)
                                      )}
                                    </td>
                                    {!esPrimerNivel && (
                                      <>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <select
                                              value={item.verificador_responsable || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBase];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], verificador_responsable: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBase(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                            >
                                              <option value="">Seleccionar</option>
                                              {usuariosParticipantesCarpeta.map((usuario) => (
                                                <option key={usuario.usuario_id} value={usuario.usuario_nombre || usuario.usuario_email}>
                                                  {usuario.usuario_nombre || usuario.usuario_email}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <div>{item.verificador_responsable || ''}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <input
                                          type="date"
                                          value={item.fecha_verificacion || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBase];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], fecha_verificacion: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBase(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                        />
                                      ) : (
                                        <div>{item.fecha_verificacion || ''}</div>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <select
                                          value={item.implementado_estandar_desempeno || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBase];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], implementado_estandar_desempeno: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBase(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                        >
                                          <option value="">Seleccionar</option>
                                          <option value="SI">SI</option>
                                          <option value="NO">NO</option>
                                          <option value="NA">NA</option>
                                        </select>
                                      ) : (
                                        <div>{item.implementado_estandar_desempeno || ''}</div>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <textarea
                                          value={item.accion_a_ejecutar || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBase];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], accion_a_ejecutar: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBase(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', minHeight: '50px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px', resize: 'vertical' }}
                                        />
                                      ) : (
                                        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>{item.accion_a_ejecutar || ''}</div>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <select
                                          value={item.responsable_cierre_accion || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBase];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], responsable_cierre_accion: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBase(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                        >
                                          <option value="">Seleccionar</option>
                                          {usuariosParticipantesCarpeta.map((usuario) => (
                                            <option key={usuario.usuario_id} value={usuario.usuario_nombre || usuario.usuario_email}>
                                              {usuario.usuario_nombre || usuario.usuario_email}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <div>{item.responsable_cierre_accion || ''}</div>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <input
                                          type="date"
                                          value={item.fecha_cierre || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBase];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], fecha_cierre: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBase(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                        />
                                      ) : (
                                        <div>{item.fecha_cierre || ''}</div>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <select
                                          value={item.criticidad || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBase];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], criticidad: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBase(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                        >
                                          <option value="">Seleccionar</option>
                                          <option value="Alta">Alta</option>
                                          <option value="Media">Media</option>
                                          <option value="Baja">Baja</option>
                                        </select>
                                      ) : (
                                        <div>{item.criticidad || ''}</div>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={item.porcentaje_avance_implementacion_accion || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBase];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], porcentaje_avance_implementacion_accion: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBase(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                        />
                                      ) : (
                                        <div>{item.porcentaje_avance_implementacion_accion ? `${item.porcentaje_avance_implementacion_accion}%` : ''}</div>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <select
                                          value={item.nombre_dueno_control_critico_tecnico || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBase];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], nombre_dueno_control_critico_tecnico: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBase(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                        >
                                          <option value="">Seleccionar</option>
                                          {usuariosParticipantesCarpeta.map((usuario) => (
                                            <option key={usuario.usuario_id} value={usuario.usuario_nombre || usuario.usuario_email}>
                                              {usuario.usuario_nombre || usuario.usuario_email}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <div>{item.nombre_dueno_control_critico_tecnico || ''}</div>
                                      )}
                                    </td>
                                    {(user.rol === 'super_admin' || user.rol === 'admin') && (
                                      <td style={{ padding: '0.4rem', verticalAlign: 'top', textAlign: 'center' }}>
                                        {user.rol === 'super_admin' ? (
                                          <button
                                            onClick={() => {
                                              setModalValidacionObservacion({ itemIndex: index, tipo: 'preventivo', item });
                                            }}
                                            style={{
                                              background: item.estado_validacion === 'validado' ? '#28a745' : item.estado_validacion === 'con_observaciones' ? '#ffc107' : '#6c757d',
                                              color: 'white',
                                              border: 'none',
                                              padding: '0.35rem 0.6rem',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontSize: '11px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              gap: '0.3rem',
                                              minWidth: '100px'
                                            }}
                                            title={item.estado_validacion === 'validado' ? 'Validado' : item.estado_validacion === 'con_observaciones' ? 'Con Observaciones - Click para ver' : 'Agregar Validación/Observaciones'}
                                          >
                                            {item.estado_validacion === 'validado' ? (
                                              <>
                                                <i className="fa fa-check-circle"></i> Validado
                                              </>
                                            ) : item.estado_validacion === 'con_observaciones' ? (
                                              <>
                                                <i className="fa fa-exclamation-triangle"></i> Observaciones
                                              </>
                                            ) : (
                                              <>
                                                <i className="fa fa-comment"></i> Validar
                                              </>
                                            )}
                                          </button>
                                        ) : (
                                          <div
                                            style={{
                                              background: item.estado_validacion === 'validado' ? '#28a745' : item.estado_validacion === 'con_observaciones' ? '#ffc107' : '#6c757d',
                                              color: 'white',
                                              border: 'none',
                                              padding: '0.35rem 0.6rem',
                                              borderRadius: '4px',
                                              fontSize: '11px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              gap: '0.3rem',
                                              minWidth: '100px',
                                              cursor: 'not-allowed',
                                              opacity: 0.7
                                            }}
                                            title="Solo super_admin puede validar"
                                          >
                                            {item.estado_validacion === 'validado' ? (
                                              <>
                                                <i className="fa fa-check-circle"></i> Validado
                                              </>
                                            ) : item.estado_validacion === 'con_observaciones' ? (
                                              <>
                                                <i className="fa fa-exclamation-triangle"></i> Observaciones
                                              </>
                                            ) : (
                                              <>
                                                <i className="fa fa-comment"></i> Validar
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    )}
                                    {(user.rol === 'super_admin' || user.rol === 'admin') && (
                                      <td style={{ padding: '0.4rem', verticalAlign: 'top', textAlign: 'center' }}>
                                        <div style={{
                                          fontSize: '13px',
                                          fontWeight: '700',
                                          color: item.estado_validacion === 'validado' ? '#28a745' : '#6c757d',
                                          padding: '0.35rem 0.6rem',
                                          borderRadius: '4px',
                                          background: item.estado_validacion === 'validado' ? '#d4edda' : '#e9ecef',
                                          display: 'inline-block'
                                        }}>
                                          {item.estado_validacion === 'validado' ? '100%' : '0%'}
                                        </div>
                                      </td>
                                    )}
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top', fontSize: '10px', color: '#6c757d' }}>
                                          {formatearUltimoUsuarioEdito(item.ultimo_usuario_edito)}
                                        </td>
                                        {puedeEditar && (
                                          <td style={{ padding: '0.4rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            {!estaEditando ? (
                                              <>
                                                <button
                                                  onClick={() => {
                                                    setLineaBaseEditando(prev => new Set([...prev, item.id || `temp-${index}`]));
                                                  }}
                                                  style={{
                                                    background: '#17a2b8',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    marginRight: '0.25rem'
                                                  }}
                                                  title="Editar"
                                                >
                                                  <i className="fa fa-edit"></i> Editar
                                                </button>
                                                <button
                                                  onClick={async () => {
                                                    if (window.confirm('¿Está seguro que desea eliminar este registro de la base de datos? Esta acción no se puede deshacer.')) {
                                                      // Si el registro tiene ID, eliminarlo de la base de datos
                                                      if (item.id) {
                                                        try {
                                                          const res = await fetch(`${API_BASE}/archivos/carpeta_linea_base.php`, {
                                                            method: 'DELETE',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                              id: item.id,
                                                              carpeta_id: carpetaActual.id
                                                            })
                                                          });
                                                          
                                                          const data = await res.json();
                                                          if (data.success) {
                                                            // Recargar los datos desde la base de datos
                                                            await cargarLineaBase(carpetaActual.id);
                                                            mostrarNotificacion('✓ Registro eliminado correctamente', 'success');
                                                          } else {
                                                            mostrarNotificacion('✗ Error al eliminar: ' + (data.error || 'Error desconocido'), 'error', 5000);
                                                          }
                                                        } catch (error) {
                                                          console.error('Error eliminando registro:', error);
                                                          mostrarNotificacion('✗ Error al eliminar el registro', 'error', 5000);
                                                        }
                                                      } else {
                                                        // Si no tiene ID, solo eliminarlo del estado local
                                                        const nuevaLineaBase = lineaBase.filter((_, i) => i !== index);
                                                        setLineaBase(nuevaLineaBase);
                                                      }
                                                    }
                                                  }}
                                                  style={{
                                                    background: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px'
                                                  }}
                                                  title="Eliminar registro de la base de datos"
                                                >
                                                  <i className="fa fa-trash"></i> Eliminar
                                                </button>
                                              </>
                                            ) : estaEditando ? (
                                              <>
                                                <button
                                                  onClick={async () => {
                                                    try {
                                                      await guardarLineaBase();
                                                      setLineaBaseEditando(prev => {
                                                        const nuevo = new Set(prev);
                                                        nuevo.delete(item.id || `temp-${index}`);
                                                        return nuevo;
                                                      });
                                                    } catch (error) {
                                                      console.error('Error al guardar:', error);
                                                    }
                                                  }}
                                                  disabled={guardandoLineaBase}
                                                  style={{
                                                    background: guardandoLineaBase ? '#6c757d' : '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: '4px',
                                                    cursor: guardandoLineaBase ? 'not-allowed' : 'pointer',
                                                    fontSize: '11px',
                                                    marginRight: '0.25rem'
                                                  }}
                                                  title="Guardar"
                                                >
                                                  <i className={`fa ${guardandoLineaBase ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> Guardar
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setLineaBaseEditando(prev => {
                                                      const nuevo = new Set(prev);
                                                      nuevo.delete(item.id || `temp-${index}`);
                                                      return nuevo;
                                                    });
                                                    // Recargar datos para cancelar cambios
                                                    cargarLineaBase(carpetaActual.id);
                                                  }}
                                                  style={{
                                                    background: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px'
                                                  }}
                                                  title="Cancelar"
                                                >
                                                  <i className="fa fa-times"></i> Cancelar
                                                </button>
                                              </>
                                            ) : null}
                                          </td>
                                        )}
                                      </>
                                    )}
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={esPrimerNivel ? 5 : (canEditFiles(user) ? ((user.rol === 'super_admin' || user.rol === 'admin') ? 17 : 15) : ((user.rol === 'super_admin' || user.rol === 'admin') ? 16 : 14))} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                                  No hay controles preventivos en BOWTIE. Primero debes agregar controles críticos preventivos en la pestaña BOWTIE.
                                </td>
                              </tr>
                            )}
                          </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Segunda Tabla: Línea Base Controles Críticos Mitigadores */}
                    <div style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      border: '2px solid #FF8C00',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      marginTop: '2rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '2px solid #FF8C00'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <h3 style={{
                            margin: 0,
                            color: '#FF8C00',
                            fontSize: '18px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <i className="fa fa-shield-alt"></i>
                            Línea Base - Controles Críticos Mitigadores
                          </h3>
                          {rutaNavegacion.length === 2 && promedioPonderacionActual !== null && promedioPonderacionActual !== undefined && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '14px',
                              color: '#666'
                            }}>
                              <span style={{ fontWeight: '600' }}>Promedio de Ponderación:</span>
                              <span style={{
                                background: promedioPonderacionActual >= 80 ? '#e8f5e9' : promedioPonderacionActual >= 50 ? '#fff9c4' : '#ffebee',
                                color: promedioPonderacionActual >= 80 ? '#2e7d32' : promedioPonderacionActual >= 50 ? '#f57f17' : '#c62828',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontWeight: '700',
                                fontSize: '15px'
                              }}>
                                {typeof promedioPonderacionActual === 'number' ? promedioPonderacionActual.toFixed(1) : '0.0'}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={exportarLineaBaseMitigadoresExcel}
                            style={{
                              background: '#1d6f42',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            title="Exportar a Excel"
                          >
                            <i className="fa fa-file-excel"></i> Exportar Excel
                          </button>
                          {canEditFiles(user) && (
                            <button
                              onClick={guardarLineaBaseMitigadores}
                              disabled={guardandoLineaBaseMitigadores}
                              style={{
                                background: guardandoLineaBaseMitigadores ? '#6c757d' : '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1.5rem',
                                borderRadius: '6px',
                                cursor: guardandoLineaBaseMitigadores ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                opacity: guardandoLineaBaseMitigadores ? 0.7 : 1
                              }}
                              title="Guardar línea base mitigadores"
                            >
                              <i className={`fa ${guardandoLineaBaseMitigadores ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {guardandoLineaBaseMitigadores ? 'Guardando...' : 'Guardar Línea Base Mitigadores'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                        {(() => {
                          // Determinar si estamos en el primer nivel (rutaNavegacion.length === 1)
                          const esPrimerNivel = rutaNavegacion.length === 1;
                          
                          // Calcular rowspan para cada grupo de control mitigador (mismo código)
                          const calcularRowspansMitigadores = () => {
                            const rowspans = {};
                            const gruposPorCodigo = {};
                            
                            lineaBaseMitigadores.forEach((item, index) => {
                              const codigo = item.codigo || '';
                              if (!gruposPorCodigo[codigo]) {
                                gruposPorCodigo[codigo] = [];
                              }
                              gruposPorCodigo[codigo].push(index);
                            });
                            
                            Object.keys(gruposPorCodigo).forEach(codigo => {
                              const indices = gruposPorCodigo[codigo];
                              indices.forEach((index, posicionEnGrupo) => {
                                if (posicionEnGrupo === 0) {
                                  rowspans[index] = indices.length;
                                } else {
                                  rowspans[index] = 0; // No renderizar esta celda
                                }
                              });
                            });
                            
                            return rowspans;
                          };
                          
                          const rowspansMitigadores = lineaBaseMitigadores && lineaBaseMitigadores.length > 0 ? calcularRowspansMitigadores() : {};
                          
                          // Anchos de columnas según el nivel
                          const anchoCodigo = esPrimerNivel ? '70px' : '80px';
                          const anchoControl = esPrimerNivel ? '180px' : '300px'; // Aumentado significativamente para nivel 2 para evitar cortes de texto
                          const anchoDimension = esPrimerNivel ? '100px' : '150px'; // Aumentado para mejor separación
                          const anchoPregunta = esPrimerNivel ? '250px' : '150px';
                          const anchoEvidencia = esPrimerNivel ? '300px' : '150px';
                          const minWidthTabla = esPrimerNivel ? '900px' : '2000px';
                          
                          return (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: minWidthTabla, tableLayout: 'auto' }}>
                              <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #FF8C00' }}>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: anchoCodigo, position: 'sticky', left: 0, top: 0, background: '#f8f9fa', zIndex: 101 }}>Código</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: anchoControl, minWidth: anchoControl, position: 'sticky', left: anchoCodigo, top: 0, background: '#f8f9fa', zIndex: 101 }}>Controles Críticos Mitigadores</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: anchoDimension, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Dimensión</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: anchoPregunta, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Pregunta</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: anchoEvidencia, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Evidencia</th>
                                  {!esPrimerNivel && (
                                    <>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Verificador Responsable</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Fecha Verificación</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '180px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Implementado Estándar de Desempeño (SI / NO / NA)</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Acción a Ejecutar</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Responsable Cierre de Acción</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Fecha de Cierre</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '100px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Criticidad</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>% Avance Implementación Acción</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '200px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Nombre Dueño Control Crítico Técnico (CODELCO VP)</th>
                                      {(user.rol === 'super_admin' || user.rol === 'admin') && (
                                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#FF8C00', width: '120px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Validación/Observaciones</th>
                                      )}
                                      {(user.rol === 'super_admin' || user.rol === 'admin') && (
                                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#FF8C00', width: '100px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Ponderación</th>
                                      )}
                                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '700', color: '#FF8C00', width: '150px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Último Usuario que Editó</th>
                                      {canEditFiles(user) && (
                                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#FF8C00', width: '100px', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 100 }}>Acciones</th>
                                      )}
                                    </>
                                  )}
                                </tr>
                              </thead>
                          <tbody>
                            {lineaBaseMitigadores && lineaBaseMitigadores.length > 0 ? (
                              lineaBaseMitigadores.map((item, index) => {
                                const estaEditando = lineaBaseMitigadoresEditando.has(item.id || `temp-${index}`);
                                const puedeEditar = canEditFiles(user);
                                const tieneObservaciones = item.estado_validacion === 'con_observaciones';
                                
                                return (
                                  <tr key={`linea-base-mitigador-${item.id || `temp-${index}`}-${index}`} style={{ 
                                    borderBottom: '1px solid #dee2e6',
                                    backgroundColor: tieneObservaciones ? '#fff3cd' : 'transparent',
                                    borderLeft: tieneObservaciones ? '4px solid #ffc107' : 'none'
                                  }}>
                                    <td style={{ padding: '0.4rem', background: '#f8f9fa', fontWeight: '600', color: '#495057', position: 'sticky', left: 0, zIndex: 5 }}>
                                      <div>{item.codigo || ''}</div>
                                    </td>
                                    {rowspansMitigadores[index] !== 0 && (
                                      <td 
                                        rowSpan={rowspansMitigadores[index] || 1} 
                                        style={{ 
                                          padding: '0.4rem', 
                                          verticalAlign: 'middle', 
                                          position: 'sticky', 
                                          left: esPrimerNivel ? '70px' : '80px', 
                                          background: 'white', 
                                          zIndex: 5,
                                          borderRight: '1px solid #dee2e6',
                                          width: anchoControl,
                                          maxWidth: anchoControl,
                                          minWidth: anchoControl,
                                          wordWrap: 'break-word',
                                          overflowWrap: 'break-word',
                                          overflow: 'visible',
                                          whiteSpace: 'normal',
                                          textOverflow: 'clip'
                                        }}
                                      >
                                        <div style={{ 
                                          fontSize: '11px', 
                                          lineHeight: '1.4', 
                                          wordWrap: 'break-word', 
                                          overflowWrap: 'break-word',
                                          whiteSpace: 'normal',
                                          overflow: 'visible',
                                          width: '100%',
                                          maxWidth: '100%'
                                        }}>
                                          {item.control_critico_mitigador || ''}
                                        </div>
                                      </td>
                                    )}
                                    <td style={{ 
                                      padding: '0.4rem', 
                                      verticalAlign: 'top',
                                      width: anchoDimension,
                                      minWidth: anchoDimension,
                                      maxWidth: anchoDimension
                                    }}>
                                      {renderDimensionCell(item.dimension)}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {renderPreguntaCell(item.pregunta)}
                                    </td>
                                    <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                      {puedeEditar && estaEditando ? (
                                        <textarea
                                          value={item.evidencia || ''}
                                          onChange={(e) => {
                                            const nuevaLineaBase = [...lineaBaseMitigadores];
                                            nuevaLineaBase[index] = {...nuevaLineaBase[index], evidencia: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                            setLineaBaseMitigadores(nuevaLineaBase);
                                          }}
                                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px', minHeight: '60px', resize: 'vertical' }}
                                          placeholder="Ingrese las evidencias (puede separar múltiples evidencias con Enter o punto y coma)"
                                        />
                                      ) : (
                                        renderEvidenciaCell(item.evidencia)
                                      )}
                                    </td>
                                    {!esPrimerNivel && (
                                      <>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <select
                                              value={item.verificador_responsable || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBaseMitigadores];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], verificador_responsable: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBaseMitigadores(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                            >
                                              <option value="">Seleccionar</option>
                                              {usuariosParticipantesCarpeta.map((usuario) => (
                                                <option key={usuario.usuario_id} value={usuario.usuario_nombre || usuario.usuario_email}>
                                                  {usuario.usuario_nombre || usuario.usuario_email}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <div>{item.verificador_responsable || ''}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="date"
                                              value={item.fecha_verificacion || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBaseMitigadores];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], fecha_verificacion: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBaseMitigadores(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                            />
                                          ) : (
                                            <div>{item.fecha_verificacion || ''}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <select
                                              value={item.implementado_estandar_desempeno || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBaseMitigadores];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], implementado_estandar_desempeno: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBaseMitigadores(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                            >
                                              <option value="">Seleccionar</option>
                                              <option value="SI">SI</option>
                                              <option value="NO">NO</option>
                                              <option value="NA">NA</option>
                                            </select>
                                          ) : (
                                            <div>{item.implementado_estandar_desempeno || ''}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <textarea
                                              value={item.accion_a_ejecutar || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBaseMitigadores];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], accion_a_ejecutar: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBaseMitigadores(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', minHeight: '50px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px', resize: 'vertical' }}
                                            />
                                          ) : (
                                            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>{item.accion_a_ejecutar || ''}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <select
                                              value={item.responsable_cierre_accion || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBaseMitigadores];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], responsable_cierre_accion: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBaseMitigadores(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                            >
                                              <option value="">Seleccionar</option>
                                              {usuariosParticipantesCarpeta.map((usuario) => (
                                                <option key={usuario.usuario_id} value={usuario.usuario_nombre || usuario.usuario_email}>
                                                  {usuario.usuario_nombre || usuario.usuario_email}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <div>{item.responsable_cierre_accion || ''}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="date"
                                              value={item.fecha_cierre || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBaseMitigadores];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], fecha_cierre: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBaseMitigadores(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                            />
                                          ) : (
                                            <div>{item.fecha_cierre || ''}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <select
                                              value={item.criticidad || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBaseMitigadores];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], criticidad: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBaseMitigadores(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                            >
                                              <option value="">Seleccionar</option>
                                              <option value="Alta">Alta</option>
                                              <option value="Media">Media</option>
                                              <option value="Baja">Baja</option>
                                            </select>
                                          ) : (
                                            <div>{item.criticidad || ''}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={item.porcentaje_avance_implementacion_accion || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBaseMitigadores];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], porcentaje_avance_implementacion_accion: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBaseMitigadores(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                            />
                                          ) : (
                                            <div>{item.porcentaje_avance_implementacion_accion ? `${item.porcentaje_avance_implementacion_accion}%` : ''}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>
                                          {puedeEditar && estaEditando ? (
                                            <select
                                              value={item.nombre_dueno_control_critico_tecnico || ''}
                                              onChange={(e) => {
                                                const nuevaLineaBase = [...lineaBaseMitigadores];
                                                nuevaLineaBase[index] = {...nuevaLineaBase[index], nombre_dueno_control_critico_tecnico: e.target.value, ultimo_usuario_edito: obtenerUltimoUsuarioEditoString(user)};
                                                setLineaBaseMitigadores(nuevaLineaBase);
                                              }}
                                              style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '11px' }}
                                            >
                                              <option value="">Seleccionar</option>
                                              {usuariosParticipantesCarpeta.map((usuario) => (
                                                <option key={usuario.usuario_id} value={usuario.usuario_nombre || usuario.usuario_email}>
                                                  {usuario.usuario_nombre || usuario.usuario_email}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <div>{item.nombre_dueno_control_critico_tecnico || ''}</div>
                                          )}
                                        </td>
                                        {(user.rol === 'super_admin' || user.rol === 'admin') && (
                                          <td style={{ padding: '0.4rem', verticalAlign: 'top', textAlign: 'center' }}>
                                            {user.rol === 'super_admin' ? (
                                              <button
                                                onClick={() => {
                                                  setModalValidacionObservacion({ itemIndex: index, tipo: 'mitigador', item });
                                                }}
                                                style={{
                                                  background: item.estado_validacion === 'validado' ? '#28a745' : item.estado_validacion === 'con_observaciones' ? '#ffc107' : '#6c757d',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.6rem',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  gap: '0.3rem',
                                                  minWidth: '100px'
                                                }}
                                                title={item.estado_validacion === 'validado' ? 'Validado' : item.estado_validacion === 'con_observaciones' ? 'Con Observaciones - Click para ver' : 'Agregar Validación/Observaciones'}
                                              >
                                                {item.estado_validacion === 'validado' ? (
                                                  <>
                                                    <i className="fa fa-check-circle"></i> Validado
                                                  </>
                                                ) : item.estado_validacion === 'con_observaciones' ? (
                                                  <>
                                                    <i className="fa fa-exclamation-triangle"></i> Observaciones
                                                  </>
                                                ) : (
                                                  <>
                                                    <i className="fa fa-comment"></i> Validar
                                                  </>
                                                )}
                                              </button>
                                            ) : (
                                              <div
                                                style={{
                                                  background: item.estado_validacion === 'validado' ? '#28a745' : item.estado_validacion === 'con_observaciones' ? '#ffc107' : '#6c757d',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '0.35rem 0.6rem',
                                                  borderRadius: '4px',
                                                  fontSize: '11px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  gap: '0.3rem',
                                                  minWidth: '100px',
                                                  cursor: 'not-allowed',
                                                  opacity: 0.7
                                                }}
                                                title="Solo super_admin puede validar"
                                              >
                                                {item.estado_validacion === 'validado' ? (
                                                  <>
                                                    <i className="fa fa-check-circle"></i> Validado
                                                  </>
                                                ) : item.estado_validacion === 'con_observaciones' ? (
                                                  <>
                                                    <i className="fa fa-exclamation-triangle"></i> Observaciones
                                                  </>
                                                ) : (
                                                  <>
                                                    <i className="fa fa-comment"></i> Validar
                                                  </>
                                                )}
                                              </div>
                                            )}
                                          </td>
                                        )}
                                        {(user.rol === 'super_admin' || user.rol === 'admin') && (
                                          <td style={{ padding: '0.4rem', verticalAlign: 'top', textAlign: 'center' }}>
                                            <div style={{
                                              fontSize: '13px',
                                              fontWeight: '700',
                                              color: item.estado_validacion === 'validado' ? '#28a745' : '#6c757d',
                                              padding: '0.35rem 0.6rem',
                                              borderRadius: '4px',
                                              background: item.estado_validacion === 'validado' ? '#d4edda' : '#e9ecef',
                                              display: 'inline-block'
                                            }}>
                                              {item.estado_validacion === 'validado' ? '100%' : '0%'}
                                            </div>
                                          </td>
                                        )}
                                        <td style={{ padding: '0.4rem', verticalAlign: 'top', fontSize: '10px', color: '#6c757d' }}>
                                          {formatearUltimoUsuarioEdito(item.ultimo_usuario_edito)}
                                        </td>
                                        {puedeEditar && (
                                          <td style={{ padding: '0.4rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        {!estaEditando ? (
                                          <>
                                            <button
                                              onClick={() => {
                                                setLineaBaseMitigadoresEditando(prev => new Set([...prev, item.id || `temp-${index}`]));
                                              }}
                                              style={{
                                                background: '#FF8C00',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                marginRight: '0.25rem'
                                              }}
                                              title="Editar"
                                            >
                                              <i className="fa fa-edit"></i> Editar
                                            </button>
                                            <button
                                              onClick={async () => {
                                                if (window.confirm('¿Está seguro que desea eliminar este registro de la base de datos? Esta acción no se puede deshacer.')) {
                                                  // Si el registro tiene ID, eliminarlo de la base de datos
                                                  if (item.id) {
                                                    try {
                                                      const res = await fetch(`${API_BASE}/archivos/carpeta_linea_base_mitigadores.php`, {
                                                        method: 'DELETE',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                          id: item.id,
                                                          carpeta_id: carpetaActual.id
                                                        })
                                                      });
                                                      
                                                      const data = await res.json();
                                                      if (data.success) {
                                                        // Recargar los datos desde la base de datos
                                                        await cargarLineaBaseMitigadores(carpetaActual.id);
                                                        alert('Registro eliminado correctamente');
                                                      } else {
                                                        alert('Error al eliminar: ' + (data.error || 'Error desconocido'));
                                                      }
                                                    } catch (error) {
                                                      console.error('Error eliminando registro:', error);
                                                      alert('Error al eliminar el registro');
                                                    }
                                                  } else {
                                                    // Si no tiene ID, solo eliminarlo del estado local
                                                    const nuevaLineaBase = lineaBaseMitigadores.filter((_, i) => i !== index);
                                                    setLineaBaseMitigadores(nuevaLineaBase);
                                                  }
                                                }
                                              }}
                                              style={{
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                              }}
                                              title="Eliminar registro de la base de datos"
                                            >
                                              <i className="fa fa-trash"></i> Eliminar
                                            </button>
                                          </>
                                        ) : estaEditando ? (
                                          <>
                                            <button
                                              onClick={async () => {
                                                try {
                                                  await guardarLineaBaseMitigadores();
                                                  setLineaBaseMitigadoresEditando(prev => {
                                                    const nuevo = new Set(prev);
                                                    nuevo.delete(item.id || `temp-${index}`);
                                                    return nuevo;
                                                  });
                                                } catch (error) {
                                                  console.error('Error al guardar:', error);
                                                }
                                              }}
                                              disabled={guardandoLineaBaseMitigadores}
                                              style={{
                                                background: guardandoLineaBaseMitigadores ? '#6c757d' : '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '4px',
                                                cursor: guardandoLineaBaseMitigadores ? 'not-allowed' : 'pointer',
                                                fontSize: '11px',
                                                marginRight: '0.25rem'
                                              }}
                                              title="Guardar"
                                            >
                                              <i className={`fa ${guardandoLineaBaseMitigadores ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> Guardar
                                            </button>
                                            <button
                                              onClick={() => {
                                                setLineaBaseMitigadoresEditando(prev => {
                                                  const nuevo = new Set(prev);
                                                  nuevo.delete(item.id || `temp-${index}`);
                                                  return nuevo;
                                                });
                                                // Recargar datos para cancelar cambios
                                                cargarLineaBaseMitigadores(carpetaActual.id);
                                              }}
                                              style={{
                                                background: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                              }}
                                              title="Cancelar"
                                            >
                                              <i className="fa fa-times"></i> Cancelar
                                            </button>
                                          </>
                                        ) : null}
                                          </td>
                                        )}
                                      </>
                                    )}
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={esPrimerNivel ? 5 : (canEditFiles(user) ? ((user.rol === 'super_admin' || user.rol === 'admin') ? 17 : 15) : ((user.rol === 'super_admin' || user.rol === 'admin') ? 16 : 14))} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                                  No hay controles mitigadores en BOWTIE. Primero debes agregar controles críticos mitigadores en la pestaña BOWTIE.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal para VER Dimensiones, Preguntas y Evidencias (Solo lectura) */}
            {modalVerDimensiones && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '2rem'
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setModalVerDimensiones(null);
                }
              }}
              >
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  width: '1000px'
                }}
                onClick={(e) => e.stopPropagation()}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid #ffc107'
                  }}>
                    <h3 style={{
                      margin: 0,
                      color: '#ffc107',
                      fontSize: '20px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fa fa-search"></i>
                      Ver Dimensiones, Preguntas y Evidencias - {modalVerDimensiones.control?.codigo || 'Control'}
                    </h3>
                    <button
                      onClick={() => setModalVerDimensiones(null)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      <i className="fa fa-times"></i> Cerrar
                    </button>
                  </div>

                  {modalVerDimensiones.control?.dimensiones && modalVerDimensiones.control.dimensiones.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {modalVerDimensiones.control.dimensiones.map((dimension, dimIndex) => (
                        <div key={`ver-dimension-${dimIndex}`} style={{
                          border: '2px solid #ffc107',
                          borderRadius: '8px',
                          padding: '1.5rem',
                          background: '#fffbf0'
                        }}>
                          <div style={{
                            marginBottom: '1rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '1px solid #ffc107'
                          }}>
                            <h4 style={{
                              margin: 0,
                              color: '#ffc107',
                              fontSize: '16px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="fa fa-layer-group"></i>
                              Dimensión: {dimension.nombre || 'Sin nombre'}
                            </h4>
                          </div>

                          {dimension.preguntas && dimension.preguntas.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {dimension.preguntas.map((pregunta, pregIndex) => (
                                <div key={`ver-pregunta-${dimIndex}-${pregIndex}`} style={{
                                  border: '1px solid #dee2e6',
                                  borderRadius: '6px',
                                  padding: '1rem',
                                  background: 'white'
                                }}>
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: '#6c757d',
                                      marginBottom: '0.5rem'
                                    }}>
                                      Pregunta {pregIndex + 1}:
                                    </div>
                                    <div style={{
                                      fontSize: '14px',
                                      color: '#495057',
                                      lineHeight: '1.6',
                                      padding: '0.75rem',
                                      background: '#f8f9fa',
                                      borderRadius: '4px',
                                      border: '1px solid #e9ecef'
                                    }}>
                                      {pregunta.texto || 'Sin pregunta definida'}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: '#6c757d',
                                      marginBottom: '0.5rem'
                                    }}>
                                      Evidencia:
                                    </div>
                                    <div style={{
                                      fontSize: '13px',
                                      color: '#495057',
                                      lineHeight: '1.6',
                                      padding: '0.75rem',
                                      background: '#f8f9fa',
                                      borderRadius: '4px',
                                      border: '1px solid #e9ecef',
                                      whiteSpace: 'pre-wrap'
                                    }}>
                                      {pregunta.evidencia || 'Sin evidencia definida'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{
                              padding: '1rem',
                              textAlign: 'center',
                              color: '#6c757d',
                              fontSize: '13px',
                              fontStyle: 'italic'
                            }}>
                              No hay preguntas definidas para esta dimensión
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#6c757d',
                      fontSize: '14px'
                    }}>
                      <i className="fa fa-info-circle" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ffc107' }}></i>
                      <p>No hay dimensiones definidas para este control.</p>
                      <p style={{ fontSize: '12px', marginTop: '0.5rem' }}>Use el botón de gestión (ícono de lista) para agregar dimensiones, preguntas y evidencias.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal para gestionar Dimensiones, Preguntas y Evidencias */}
            {(modalDimensionesPreventivo || modalDimensionesMitigador) && (() => {
              const modal = modalDimensionesPreventivo || modalDimensionesMitigador;
              const controlActual = modal.tipo === 'preventivo' 
                ? analisisBowtie?.controles_preventivos?.[modal.controlIndex]
                : analisisBowtie?.controles_mitigadores?.[modal.controlIndex];
              const dimensiones = controlActual?.dimensiones || [];
              const normalizarTipoDimension = (valor) => {
                if (!valor) return '';
                const texto = valor.toString().trim().toUpperCase();
                if (texto === 'DISENO') return 'DISEÑO';
                if (texto === 'IMPLEMENTACION') return 'IMPLEMENTACIÓN';
                if (texto === 'ENTRENAMIENTO') return 'ENTRENAMIENTO';
                return texto;
              };
              const dimensionesConIndice = dimensiones.map((dimension, index) => ({
                dimension,
                index
              }));
              const dimensionesFiltradas = dimensionesConIndice.filter(({ dimension }) => {
                const tipoNormalizado = normalizarTipoDimension(dimension.nombre);
                if (filtroTipoDimension === 'TODAS') {
                  return true;
                }
                if (filtroTipoDimension === 'OTRAS') {
                  return tipoNormalizado !== 'DISEÑO' && tipoNormalizado !== 'IMPLEMENTACIÓN' && tipoNormalizado !== 'ENTRENAMIENTO';
                }
                return tipoNormalizado === filtroTipoDimension;
              });
              const agregarDimension = (tipoClave) => {
                const nombreDimension = tipoClave === 'OTRAS' ? '' : tipoClave;
                const nuevaDimension = {
                  id: null,
                  nombre: nombreDimension,
                  preguntas: []
                };
                const nuevosControles = modal.tipo === 'preventivo'
                  ? [...analisisBowtie.controles_preventivos]
                  : [...analisisBowtie.controles_mitigadores];
                nuevosControles[modal.controlIndex] = {
                  ...controlActual,
                  dimensiones: [...dimensiones, nuevaDimension]
                };
                if (modal.tipo === 'preventivo') {
                  setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                } else {
                  setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                }
                setFiltroTipoDimension(nombreDimension ? nombreDimension : 'OTRAS');
              };
              const opcionesFiltroDimensiones = [
                { valor: 'TODAS', etiqueta: 'Todas' },
                { valor: 'DISEÑO', etiqueta: 'Diseño' },
                { valor: 'IMPLEMENTACIÓN', etiqueta: 'Implementación' },
                { valor: 'ENTRENAMIENTO', etiqueta: 'Entrenamiento' },
                { valor: 'OTRAS', etiqueta: 'Sin tipo' }
              ];
              const mensajeSinDimensiones = filtroTipoDimension === 'TODAS'
                ? 'Aún no se han registrado dimensiones para este control.'
                : `No hay dimensiones registradas para el filtro seleccionado (${filtroTipoDimension.toLowerCase()}).`;
              const renderTarjetaDimension = (dimension, dimIndex) => (
                <div key={`dimension-${dimIndex}`} style={{
                  border: '2px solid #17a2b8',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  background: '#f8f9fa'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <select
                      value={normalizarTipoDimension(dimension.nombre) || ''}
                      onChange={(e) => {
                        const nuevosControles = modal.tipo === 'preventivo'
                          ? [...analisisBowtie.controles_preventivos]
                          : [...analisisBowtie.controles_mitigadores];
                        const nuevasDimensiones = [...dimensiones];
                        nuevasDimensiones[dimIndex] = {...dimension, nombre: normalizarTipoDimension(e.target.value)};
                        nuevosControles[modal.controlIndex] = {
                          ...controlActual,
                          dimensiones: nuevasDimensiones
                        };
                        if (modal.tipo === 'preventivo') {
                          setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                        } else {
                          setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '2px solid #17a2b8',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginRight: '1rem',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Seleccionar dimensión</option>
                      <option value="DISEÑO">DISEÑO</option>
                      <option value="IMPLEMENTACIÓN">IMPLEMENTACIÓN</option>
                      <option value="ENTRENAMIENTO">ENTRENAMIENTO</option>
                    </select>
                    <button
                      onClick={() => {
                        const nuevosControles = modal.tipo === 'preventivo'
                          ? [...analisisBowtie.controles_preventivos]
                          : [...analisisBowtie.controles_mitigadores];
                        const nuevasDimensiones = dimensiones.filter((_, i) => i !== dimIndex);
                        nuevosControles[modal.controlIndex] = {
                          ...controlActual,
                          dimensiones: nuevasDimensiones
                        };
                        if (modal.tipo === 'preventivo') {
                          setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                        } else {
                          setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                        }
                      }}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <i className="fa fa-trash"></i> Eliminar
                    </button>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      onClick={() => {
                        const nuevaPregunta = {
                          id: null,
                          texto: '',
                          evidencia: ''
                        };
                        const nuevosControles = modal.tipo === 'preventivo'
                          ? [...analisisBowtie.controles_preventivos]
                          : [...analisisBowtie.controles_mitigadores];
                        const nuevasDimensiones = [...dimensiones];
                        nuevasDimensiones[dimIndex] = {
                          ...dimension,
                          preguntas: [...(dimension.preguntas || []), nuevaPregunta]
                        };
                        nuevosControles[modal.controlIndex] = {
                          ...controlActual,
                          dimensiones: nuevasDimensiones
                        };
                        if (modal.tipo === 'preventivo') {
                          setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                        } else {
                          setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                        }
                      }}
                      style={{
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <i className="fa fa-plus"></i> Agregar Pregunta
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(dimension.preguntas || []).map((pregunta, pregIndex) => (
                      <div key={`pregunta-${dimIndex}-${pregIndex}`} style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        padding: '1rem',
                        background: 'white'
                      }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#495057' }}>
                            Pregunta:
                          </label>
                          <textarea
                            value={pregunta.texto || ''}
                            onChange={(e) => {
                              const nuevosControles = modal.tipo === 'preventivo'
                                ? [...analisisBowtie.controles_preventivos]
                                : [...analisisBowtie.controles_mitigadores];
                              const nuevasDimensiones = [...dimensiones];
                              const nuevasPreguntas = [...(dimension.preguntas || [])];
                              nuevasPreguntas[pregIndex] = {...pregunta, texto: e.target.value};
                              nuevasDimensiones[dimIndex] = {
                                ...dimension,
                                preguntas: nuevasPreguntas
                              };
                              nuevosControles[modal.controlIndex] = {
                                ...controlActual,
                                dimensiones: nuevasDimensiones
                              };
                              if (modal.tipo === 'preventivo') {
                                setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                              } else {
                                setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                              }
                            }}
                            placeholder="Escriba la pregunta aquí..."
                            style={{
                              width: '100%',
                              minHeight: '60px',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #ced4da',
                              fontSize: '13px',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#495057' }}>
                            Evidencia:
                          </label>
                          <textarea
                            value={pregunta.evidencia || ''}
                            onChange={(e) => {
                              const nuevosControles = modal.tipo === 'preventivo'
                                ? [...analisisBowtie.controles_preventivos]
                                : [...analisisBowtie.controles_mitigadores];
                              const nuevasDimensiones = [...dimensiones];
                              const nuevasPreguntas = [...(dimension.preguntas || [])];
                              nuevasPreguntas[pregIndex] = {...pregunta, evidencia: e.target.value};
                              nuevasDimensiones[dimIndex] = {
                                ...dimension,
                                preguntas: nuevasPreguntas
                              };
                              nuevosControles[modal.controlIndex] = {
                                ...controlActual,
                                dimensiones: nuevasDimensiones
                              };
                              if (modal.tipo === 'preventivo') {
                                setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                              } else {
                                setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                              }
                            }}
                            placeholder="Detalle la evidencia asociada..."
                            style={{
                              width: '100%',
                              minHeight: '60px',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #ced4da',
                              fontSize: '13px',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                          <button
                            onClick={() => {
                              const nuevosControles = modal.tipo === 'preventivo'
                                ? [...analisisBowtie.controles_preventivos]
                                : [...analisisBowtie.controles_mitigadores];
                              const nuevasDimensiones = [...dimensiones];
                              const nuevasPreguntas = (dimension.preguntas || []).filter((_, i) => i !== pregIndex);
                              nuevasDimensiones[dimIndex] = {
                                ...dimension,
                                preguntas: nuevasPreguntas
                              };
                              nuevosControles[modal.controlIndex] = {
                                ...controlActual,
                                dimensiones: nuevasDimensiones
                              };
                              if (modal.tipo === 'preventivo') {
                                setAnalisisBowtie({...analisisBowtie, controles_preventivos: nuevosControles});
                              } else {
                                setAnalisisBowtie({...analisisBowtie, controles_mitigadores: nuevosControles});
                              }
                            }}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fa fa-trash"></i> Eliminar Pregunta
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
              
              return (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                  padding: '2rem'
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setModalDimensionesPreventivo(null);
                    setModalDimensionesMitigador(null);
                    setFiltroTipoDimension('TODAS');
                  }
                }}
                >
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    width: '1200px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      paddingBottom: '1rem',
                      borderBottom: '2px solid #17a2b8'
                    }}>
                      <h3 style={{
                        margin: 0,
                        color: '#17a2b8',
                        fontSize: '20px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <i className="fa fa-list-ul"></i>
                        Gestionar Dimensiones, Preguntas y Evidencias - {controlActual?.codigo || 'Control'}
                      </h3>
                      <button
                        onClick={() => {
                          setModalDimensionesPreventivo(null);
                          setModalDimensionesMitigador(null);
                          setFiltroTipoDimension('TODAS');
                        }}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        <i className="fa fa-times"></i> Cerrar
                      </button>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                        {opcionesFiltroDimensiones.map((opcion) => (
                          <button
                            key={opcion.valor}
                            onClick={() => setFiltroTipoDimension(opcion.valor)}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              border: '2px solid #17a2b8',
                              background: filtroTipoDimension === opcion.valor ? '#17a2b8' : '#f8f9fa',
                              color: filtroTipoDimension === opcion.valor ? 'white' : '#495057',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: filtroTipoDimension === opcion.valor ? 700 : 500
                            }}
                          >
                            {opcion.etiqueta}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button
                          onClick={() => agregarDimension('DISEÑO')}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          <i className="fa fa-plus"></i> Agregar Dimensión - Diseño
                        </button>
                        <button
                          onClick={() => agregarDimension('IMPLEMENTACIÓN')}
                          style={{
                            background: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          <i className="fa fa-plus"></i> Agregar Dimensión - Implementación
                        </button>
                        <button
                          onClick={() => agregarDimension('ENTRENAMIENTO')}
                          style={{
                            background: '#ffc107',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          <i className="fa fa-plus"></i> Agregar Dimensión - Entrenamiento
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {dimensionesFiltradas.length > 0 ? (
                        dimensionesFiltradas.map(({ dimension, index: dimIndex }) => 
                          renderTarjetaDimension(dimension, dimIndex)
                        )
                      ) : (
                        <div style={{
                          padding: '1.25rem',
                          border: '1px dashed #ced4da',
                          borderRadius: '6px',
                          textAlign: 'center',
                          color: '#6c757d',
                          fontSize: '13px'
                        }}>
                          {mensajeSinDimensiones}
                        </div>
                      )}
                    </div>

                    <div style={{
                      marginTop: '2rem',
                      paddingTop: '1rem',
                      borderTop: '2px solid #dee2e6',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '1rem'
                    }}>
                      <button
                        onClick={() => {
                          setModalDimensionesPreventivo(null);
                          setModalDimensionesMitigador(null);
                        }}
                        style={{
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          // Guardar los cambios en el control
                          if (modal.tipo === 'preventivo') {
                            await guardarControlesPreventivos();
                          } else {
                            await guardarControlesMitigadores();
                          }
                          setModalDimensionesPreventivo(null);
                          setModalDimensionesMitigador(null);
                        }}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        <i className="fa fa-save"></i> Guardar Cambios
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Pestaña Guía Controles Críticos */}
            {pestañaActiva === 'guia' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Sección: ¿Cuándo y dónde debemos utilizar estos controles? */}
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #17a2b8',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <h3 style={{
                      margin: 0,
                      marginBottom: '1.5rem',
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#17a2b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '0.75rem',
                      borderBottom: '3px solid #17a2b8'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '40px',
                        background: '#17a2b8',
                        borderRadius: '2px'
                      }}></div>
                      ¿CUÁNDO Y DÓNDE DEBEMOS UTILIZAR ESTOS CONTROLES?
                    </h3>
                    
                    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                      {/* Línea vertical conectora */}
                      <div style={{
                        position: 'absolute',
                        left: '24px',
                        top: '0',
                        bottom: '0',
                        width: '2px',
                        background: '#17a2b8',
                        opacity: '0.3'
                      }}></div>
                      
                      {/* Punto 1: ART */}
                      <div style={{ marginBottom: '2rem', position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-2rem',
                          top: '0',
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          border: '3px solid #17a2b8',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: '#17a2b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '14px'
                          }}>
                            ART
                          </div>
                        </div>
                        <div style={{
                          background: '#f8f9fa',
                          padding: '1rem 1rem 1rem 3rem',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}>
                          <p style={{ margin: 0, fontSize: '14px', color: '#495057', lineHeight: '1.7' }}>
                            Durante la elaboración del <strong>Análisis del Riesgo del Trabajo (ART)</strong>, al momento de identificar los Riesgos Críticos y sus controles respectivos, asociados a las tareas a ejecutar (Rutinarias, No Rutinarias, Críticas y Emergencias).
                          </p>
                        </div>
                      </div>

                      {/* Punto 2: Investigación */}
                      <div style={{ marginBottom: '2rem', position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-2rem',
                          top: '0',
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          border: '3px solid #17a2b8',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <i className="fa fa-search" style={{ fontSize: '20px', color: '#17a2b8' }}></i>
                        </div>
                        <div style={{
                          background: '#f8f9fa',
                          padding: '1rem 1rem 1rem 3rem',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}>
                          <p style={{ margin: 0, fontSize: '14px', color: '#495057', lineHeight: '1.7' }}>
                            Como elemento de soporte para los procesos de <strong>investigación de Eventos Significativos</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Punto 3: Charlas de seguridad */}
                      <div style={{ marginBottom: '2rem', position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-2rem',
                          top: '0',
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          border: '3px solid #17a2b8',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <i className="fa fa-comments" style={{ fontSize: '20px', color: '#17a2b8' }}></i>
                        </div>
                        <div style={{
                          background: '#f8f9fa',
                          padding: '1rem 1rem 1rem 3rem',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}>
                          <p style={{ margin: 0, fontSize: '14px', color: '#495057', lineHeight: '1.7' }}>
                            Apoyo para reforzar los Controles Críticos durante las <strong>charlas de seguridad de inicio de turno</strong> u otras.
                          </p>
                        </div>
                      </div>

                      {/* Punto 4: Capacitación */}
                      <div style={{ marginBottom: '2rem', position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-2rem',
                          top: '0',
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          border: '3px solid #17a2b8',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <i className="fa fa-graduation-cap" style={{ fontSize: '20px', color: '#17a2b8' }}></i>
                        </div>
                        <div style={{
                          background: '#f8f9fa',
                          padding: '1rem 1rem 1rem 3rem',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}>
                          <p style={{ margin: 0, fontSize: '14px', color: '#495057', lineHeight: '1.7' }}>
                            Contenido para actividades de <strong>capacitación y entrenamiento SSO</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Punto 5: Estándares */}
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-2rem',
                          top: '0',
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          border: '3px solid #17a2b8',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <i className="fa fa-cogs" style={{ fontSize: '20px', color: '#17a2b8' }}></i>
                        </div>
                        <div style={{
                          background: '#f8f9fa',
                          padding: '1rem 1rem 1rem 3rem',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}>
                          <p style={{ margin: 0, fontSize: '14px', color: '#495057', lineHeight: '1.7' }}>
                            Complemento para la elaboración de <strong>estándares de proceso, procedimientos y/o instructivos de trabajo</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección: Preguntas Transversales para Todos los Riesgos */}
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #dc3545',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <h3 style={{
                      margin: 0,
                      marginBottom: '1rem',
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#0a3265',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '0.75rem',
                      borderBottom: '3px solid #0a3265'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '40px',
                        background: '#0a3265',
                        borderRadius: '2px'
                      }}></div>
                      PREGUNTAS TRANSVERSALES PARA TODOS LOS RIESGOS
                    </h3>
                    
                    {/* Banner informativo */}
                    <div style={{
                      background: '#dc3545',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      marginBottom: '1.5rem',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fa fa-info-circle" style={{ fontSize: '16px' }}></i>
                      Las siguientes preguntas son transversales. Responda siempre, independiente del Riesgo Crítico al que esté expuesto.
                    </div>

                    {/* Tabla de preguntas */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginTop: '1rem'
                    }}>
                      {/* Columna Supervisor */}
                      <div style={{
                        background: '#0a3265',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: '#0a3265',
                          color: 'white',
                          padding: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontWeight: '700',
                          fontSize: '16px'
                        }}>
                          <i className="fa fa-clipboard" style={{ fontSize: '18px' }}></i>
                          SUPERVISOR(A)
                        </div>
                        <div style={{
                          background: 'white',
                          padding: '1rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                          }}>
                            {/* Pregunta 1 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿El trabajo que asignaré cuenta con un estándar, procedimiento y/o Instructivo específico?
                              </p>
                            </div>

                            {/* Pregunta 2 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿El personal que asignaré para realizar el trabajo, cuenta con las capacitaciones, certificaciones, competencias, salud compatible y/o acreditaciones requeridas?
                              </p>
                            </div>

                            {/* Pregunta 3 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿Durante la planificación del trabajo, me aseguro de solicitar los permisos para ingresar a las áreas, intervenir equipos y/o interactuar con energías?
                              </p>
                            </div>

                            {/* Pregunta 4 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿Verifiqué que el personal cuenta con los elementos requeridos para realizar la segregación y señalización del área de trabajo, según diseño?
                              </p>
                            </div>

                            {/* Pregunta 5 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿El personal que asignaré para realizar el trabajo conoce el protocolo de emergencia del área?
                              </p>
                            </div>

                            {/* Pregunta 6 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿El personal a mi cargo cuenta con sistema de comunicación de acuerdo al protocolo de emergencia del área?
                              </p>
                            </div>

                            {/* Pregunta 7 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿El personal que asignaré para realizar el trabajo, cuenta con los EPPs definidos en el procedimiento de trabajo?
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Columna Trabajador */}
                      <div style={{
                        background: '#0a3265',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: '#0a3265',
                          color: 'white',
                          padding: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontWeight: '700',
                          fontSize: '16px'
                        }}>
                          <i className="fa fa-cogs" style={{ fontSize: '18px' }}></i>
                          TRABAJADOR(A)
                        </div>
                        <div style={{
                          background: 'white',
                          padding: '1rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                          }}>
                            {/* Pregunta 1 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿Conozco el estándar, procedimiento y/o Instructivo específico del trabajo que ejecutaré?
                              </p>
                            </div>

                            {/* Pregunta 2 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿Cuento con las competencias y salud compatible para ejecutar el trabajo?
                              </p>
                            </div>

                            {/* Pregunta 3 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿Cuento con la autorización para ingresar al área a ejecutar el trabajo?
                              </p>
                            </div>

                            {/* Pregunta 4 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿Segregué y señalicé el área de trabajo con los elementos según diseño?
                              </p>
                            </div>

                            {/* Pregunta 5 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿Conozco y estoy entrenado en el procedimiento de emergencia del área de trabajo?
                              </p>
                            </div>

                            {/* Pregunta 6 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿Conozco el número de teléfono o frecuencia radial para dar aviso en caso de emergencia, según protocolo del área?
                              </p>
                            </div>

                            {/* Pregunta 7 */}
                            <div style={{
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#495057',
                                lineHeight: '1.6',
                                fontWeight: '500'
                              }}>
                                ¿Uso los EPPs definidos para el trabajo y se encuentran en buenas condiciones?
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección: ¿Qué son los Controles Críticos? */}
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #FF8C00',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <h3 style={{
                      margin: 0,
                      marginBottom: '1rem',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#FF8C00',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fa fa-question-circle" style={{ color: '#FF8C00' }}></i>
                      ¿Qué son los Controles Críticos?
                    </h3>
                    <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.8' }}>
                      <p style={{ marginBottom: '1rem' }}>
                        Los <strong>Controles Críticos</strong> son medidas de seguridad específicas y esenciales que deben estar presentes y funcionando correctamente para prevenir o mitigar eventos no deseados que puedan resultar en lesiones graves, fatalidades o daños significativos.
                      </p>
                      <p style={{ marginBottom: '1rem' }}>
                        Estos controles son identificados mediante un análisis de riesgo que considera la probabilidad y severidad de los eventos peligrosos asociados a cada actividad o proceso.
                      </p>
                    </div>
                  </div>

                  {/* Sección: Tipos de Controles */}
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #17a2b8',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <h3 style={{
                      margin: 0,
                      marginBottom: '1rem',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#17a2b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fa fa-shield-alt" style={{ color: '#17a2b8' }}></i>
                      Tipos de Controles Críticos
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* Control Preventivo */}
                      <div style={{
                        background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)',
                        padding: '1rem',
                        borderRadius: '6px',
                        border: '2px solid #17a2b8'
                      }}>
                        <h4 style={{
                          margin: 0,
                          marginBottom: '0.75rem',
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#0c5460',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <i className="fa fa-check-circle" style={{ color: '#17a2b8' }}></i>
                          Control Preventivo
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#0c5460', lineHeight: '1.6' }}>
                          Medidas implementadas <strong>antes</strong> de iniciar la actividad para prevenir que ocurra el evento no deseado. Estos controles eliminan o reducen la probabilidad de que el riesgo se materialice.
                        </p>
                      </div>

                      {/* Control Mitigador */}
                      <div style={{
                        background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)',
                        padding: '1rem',
                        borderRadius: '6px',
                        border: '2px solid #8B4513'
                      }}>
                        <h4 style={{
                          margin: 0,
                          marginBottom: '0.75rem',
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#8B4513',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <i className="fa fa-exclamation-triangle" style={{ color: '#8B4513' }}></i>
                          Control Mitigador
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#8B4513', lineHeight: '1.6' }}>
                          Medidas implementadas para <strong>reducir las consecuencias</strong> si el evento no deseado ocurre. Estos controles minimizan el impacto y la severidad del evento.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sección: Roles y Responsabilidades */}
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #808080',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <h3 style={{
                      margin: 0,
                      marginBottom: '1rem',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#808080',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fa fa-users" style={{ color: '#808080' }}></i>
                      Roles y Responsabilidades
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* Supervisor */}
                      <div style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '6px',
                        border: '2px solid #FF8C00'
                      }}>
                        <h4 style={{
                          margin: 0,
                          marginBottom: '0.75rem',
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#FF8C00',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <i className="fa fa-user-tie" style={{ fontSize: '18px' }}></i>
                          Supervisor
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '13px', color: '#495057', lineHeight: '1.8' }}>
                          <li>Verificar que los controles preventivos estén implementados antes de autorizar el inicio de la actividad</li>
                          <li>Supervisar el cumplimiento de los controles durante la ejecución del trabajo</li>
                          <li>Validar la efectividad de los controles mitigadores</li>
                          <li>Detener la actividad si algún control crítico está ausente o fallido</li>
                          <li>Documentar y reportar desviaciones en los controles</li>
                        </ul>
                      </div>

                      {/* Trabajador */}
                      <div style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '6px',
                        border: '2px solid #8B4513'
                      }}>
                        <h4 style={{
                          margin: 0,
                          marginBottom: '0.75rem',
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#8B4513',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <i className="fa fa-hard-hat" style={{ fontSize: '18px' }}></i>
                          Trabajador
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '13px', color: '#495057', lineHeight: '1.8' }}>
                          <li>Conocer y comprender los controles críticos de su actividad</li>
                          <li>Verificar la presencia y funcionamiento de los controles antes de iniciar</li>
                          <li>Aplicar correctamente los controles preventivos y mitigadores</li>
                          <li>Detener el trabajo si identifica que un control crítico está ausente o fallido</li>
                          <li>Notificar inmediatamente al supervisor sobre cualquier desviación</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Sección: Procedimiento de Acción */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #8B4513',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <h3 style={{
                      margin: 0,
                      marginBottom: '1rem',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#8B4513',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fa fa-exclamation-circle" style={{ fontSize: '20px' }}></i>
                      Procedimiento cuando un Control Crítico está Ausente o Fallido
                    </h3>
                    <div style={{ fontSize: '14px', color: '#8B4513', lineHeight: '1.8' }}>
                      <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        <li style={{ marginBottom: '0.75rem' }}>
                          <strong>DETENER LA ACTIVIDAD</strong> inmediatamente. No continuar trabajando sin el control crítico.
                        </li>
                        <li style={{ marginBottom: '0.75rem' }}>
                          <strong>APLICAR TARJETA VERDE</strong> para indicar que la actividad está detenida por una desviación en los controles críticos.
                        </li>
                        <li style={{ marginBottom: '0.75rem' }}>
                          <strong>NOTIFICAR AL SUPERVISOR</strong> de manera inmediata sobre la situación identificada.
                        </li>
                        <li style={{ marginBottom: '0.75rem' }}>
                          <strong>EVALUAR LA DESVIACIÓN</strong> junto con el supervisor para determinar las acciones correctivas necesarias.
                        </li>
                        <li style={{ marginBottom: '0.75rem' }}>
                          <strong>NORMALIZAR EL CONTROL</strong> ausente o fallido antes de reanudar la actividad.
                        </li>
                        <li>
                          <strong>DOCUMENTAR</strong> la desviación, las acciones tomadas y la verificación del control antes de continuar.
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* Sección: Preguntas de Verificación */}
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #17a2b8',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <h3 style={{
                      margin: 0,
                      marginBottom: '1rem',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#17a2b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fa fa-clipboard-check" style={{ color: '#17a2b8' }}></i>
                      Preguntas de Verificación
                    </h3>
                    <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.8' }}>
                      <p style={{ marginBottom: '1rem' }}>
                        Cada control crítico tiene asociadas <strong>preguntas de verificación</strong> que deben ser respondidas antes y durante la ejecución del trabajo. Estas preguntas ayudan a:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Confirmar que el control está presente y funcionando correctamente</li>
                        <li>Validar que se cumplen los requisitos específicos del control</li>
                        <li>Identificar cualquier desviación o condición insegura</li>
                        <li>Documentar la verificación del control</li>
                      </ul>
                      <p style={{ marginTop: '1rem', marginBottom: 0, fontStyle: 'italic', color: '#6c757d' }}>
                        <strong>Importante:</strong> Si la respuesta a cualquier pregunta de verificación es negativa o no se puede confirmar, el control se considera ausente o fallido y se debe seguir el procedimiento de acción descrito anteriormente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña Información del Riesgo Crítico */}
            {pestañaActiva === 'riesgo' && (
              <div>

                {informacionRiesgo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Mensaje informativo sobre permisos */}
                    {!canEditFiles(user) && (
                      <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        color: '#856404',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <i className="fa fa-info-circle"></i>
                        <span>Solo administradores pueden editar la información de riesgo crítico. Esta información está asociada a la carpeta <strong>{carpetaActual.nombre}</strong>.</span>
                      </div>
                    )}
                    
                    {/* Evento No Deseado y Evento de Riesgo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {/* Evento No Deseado */}
                      <div style={{
                        background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)',
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #ffc107'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                          <div style={{ fontWeight: '700', color: '#856404', fontSize: '11px', textTransform: 'uppercase' }}>
                            EVENTO NO DESEADO:
                          </div>
                          {canEditFiles(user) && (
                            <button
                              onClick={() => {
                                if (editandoTabla.evento_no_deseado) {
                                  guardarInformacionRiesgo();
                                  setEditandoTabla({...editandoTabla, evento_no_deseado: false});
                                } else {
                                  setEditandoTabla({...editandoTabla, evento_no_deseado: true});
                                }
                              }}
                              style={{
                                background: editandoTabla.evento_no_deseado ? '#28a745' : '#ffc107',
                                color: editandoTabla.evento_no_deseado ? 'white' : '#856404',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <i className={`fa fa-${editandoTabla.evento_no_deseado ? 'save' : 'edit'}`}></i>
                              {editandoTabla.evento_no_deseado ? 'Guardar' : 'Editar'}
                            </button>
                          )}
                        </div>
                        {editandoTabla.evento_no_deseado ? (
                          <textarea
                            value={informacionRiesgo.evento_no_deseado}
                            onChange={(e) => setInformacionRiesgo({...informacionRiesgo, evento_no_deseado: e.target.value})}
                            style={{
                              width: '100%',
                              minHeight: '50px',
                              padding: '0.5rem',
                              border: '1px solid #ffc107',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontFamily: 'inherit',
                              resize: 'vertical'
                            }}
                            placeholder="Ej: CONTACTO CON ENERGÍA ELÉCTRICA"
                          />
                        ) : (
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#856404' }}>
                            {informacionRiesgo.evento_no_deseado || 'No especificado'}
                          </div>
                        )}
                      </div>

                      {/* Evento de Riesgo */}
                      <div style={{
                        background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)',
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #17a2b8'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                          <div style={{ fontWeight: '700', color: '#0c5460', fontSize: '11px', textTransform: 'uppercase' }}>
                            EVENTO DE RIESGO:
                          </div>
                          {canEditFiles(user) && (
                            <button
                              onClick={() => {
                                if (editandoTabla.evento_riesgo) {
                                  guardarInformacionRiesgo();
                                  setEditandoTabla({...editandoTabla, evento_riesgo: false});
                                } else {
                                  setEditandoTabla({...editandoTabla, evento_riesgo: true});
                                }
                              }}
                              style={{
                                background: editandoTabla.evento_riesgo ? '#28a745' : '#17a2b8',
                                color: editandoTabla.evento_riesgo ? 'white' : 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <i className={`fa fa-${editandoTabla.evento_riesgo ? 'save' : 'edit'}`}></i>
                              {editandoTabla.evento_riesgo ? 'Guardar' : 'Editar'}
                            </button>
                          )}
                        </div>
                        {editandoTabla.evento_riesgo ? (
                          <textarea
                            value={informacionRiesgo.evento_riesgo}
                            onChange={(e) => setInformacionRiesgo({...informacionRiesgo, evento_riesgo: e.target.value})}
                            style={{
                              width: '100%',
                              minHeight: '50px',
                              padding: '0.5rem',
                              border: '1px solid #17a2b8',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontFamily: 'inherit',
                              resize: 'vertical'
                            }}
                            placeholder="Ej: INTERACCIÓN CON ENERGÍA ELÉCTRICA"
                          />
                        ) : (
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0c5460' }}>
                            {informacionRiesgo.evento_riesgo || 'No especificado'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Función para renderizar controles */}
                    {(() => {
                      const renderizarControles = (rol, rolLabel, rolColor) => (
                        <div key={rol} style={{
                          background: '#ffffff',
                          padding: '0',
                          borderRadius: '8px',
                          border: `1px solid ${rolColor}`,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          overflow: 'hidden'
                        }}>
                          {/* Header del Rol */}
                          <div style={{
                            background: '#495057',
                            color: 'white',
                            padding: '0.625rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: `2px solid ${rolColor}`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className={`fa fa-${rol === 'supervisor' ? 'user-tie' : 'hard-hat'}`} style={{ fontSize: '16px' }}></i>
                              <span style={{ fontWeight: '700', fontSize: '14px', letterSpacing: '0.3px' }}>{rolLabel.toUpperCase()}</span>
                            </div>
                            <i className="fa fa-clipboard-check" style={{ fontSize: '14px', opacity: '0.8' }}></i>
                          </div>

                          <div style={{ padding: '1rem' }}>
                            {/* Control Preventivo */}
                            <div style={{ marginBottom: '1.25rem' }}>
                              {/* Header con botón de editar/agregar */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                              }}>
                                <div style={{
                                  background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '4px',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  color: 'white'
                                }}>
                                  CONTROL PREVENTIVO
                                </div>
                                {canEditFiles(user) && (
                                  <button
                                    onClick={() => {
                                      const key = `${rol}_preventivo`;
                                      if (editandoTabla[key]) {
                                        // Guardar cambios
                                        guardarInformacionRiesgo();
                                        setEditandoTabla({...editandoTabla, [key]: false});
                                      } else {
                                        // Activar edición
                                        setEditandoTabla({...editandoTabla, [key]: true});
                                      }
                                    }}
                                    style={{
                                      background: editandoTabla[`${rol}_preventivo`] ? '#28a745' : '#17a2b8',
                                      color: 'white',
                                      border: 'none',
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    <i className={`fa fa-${editandoTabla[`${rol}_preventivo`] ? 'save' : 'edit'}`}></i>
                                    {editandoTabla[`${rol}_preventivo`] ? 'Guardar' : 'Editar'}
                                  </button>
                                )}
                              </div>
                              
                              {/* Tabla de Controles Preventivos */}
                              <div style={{
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                marginBottom: '0.75rem'
                              }}>
                                {/* Header de la tabla */}
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: '60px 1fr 1fr',
                                  background: '#17a2b8',
                                  borderBottom: '1px solid #138496',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  color: 'white'
                                }}>
                                  <div style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.3)' }}>N°</div>
                                  <div style={{ padding: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.3)' }}>CONTROL PREVENTIVO</div>
                                  <div style={{ padding: '0.5rem' }}>PREGUNTAS</div>
                                </div>
                                
                                {/* Filas de controles */}
                                {informacionRiesgo[`controles_${rol}`]?.preventivos?.length > 0 ? (
                                  informacionRiesgo[`controles_${rol}`].preventivos.map((control, index) => (
                                    <div 
                                      key={`preventivo-${index}`}
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: '60px 1fr 1fr',
                                        borderBottom: index < informacionRiesgo[`controles_${rol}`].preventivos.length - 1 ? '1px solid #dee2e6' : 'none',
                                        background: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                                        transition: 'background 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!editandoTabla[`${rol}_preventivo`]) {
                                          e.currentTarget.style.background = '#e7f3ff';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!editandoTabla[`${rol}_preventivo`]) {
                                          e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                                        }
                                      }}
                                    >
                                      {/* Columna N° */}
                                      <div style={{
                                        padding: '0.75rem 0.5rem',
                                        textAlign: 'center',
                                        borderRight: '1px solid #dee2e6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f8f9fa',
                                        fontWeight: '700',
                                        color: '#17a2b8',
                                        fontSize: '14px'
                                      }}>
                                        {editandoTabla[`${rol}_preventivo`] ? (
                                          <input
                                            type="text"
                                            value={control.numero || ''}
                                            onChange={(e) => actualizarControl(rol, 'preventivos', index, 'numero', e.target.value)}
                                            style={{
                                              width: '100%',
                                              padding: '4px',
                                              border: '1px solid #ced4da',
                                              borderRadius: '4px',
                                              fontSize: '12px',
                                              textAlign: 'center',
                                              fontWeight: '700'
                                            }}
                                            placeholder="01"
                                          />
                                        ) : (
                                          control.numero || `0${index + 1}`
                                        )}
                                      </div>
                                      
                                      {/* Columna Descripción del Control */}
                                      <div style={{ 
                                        padding: '0.75rem', 
                                        borderRight: '1px solid #dee2e6',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}>
                                        {editandoTabla[`${rol}_preventivo`] ? (
                                          <textarea
                                            value={control.descripcion || ''}
                                            onChange={(e) => actualizarControl(rol, 'preventivos', index, 'descripcion', e.target.value)}
                                            style={{
                                              width: '100%',
                                              minHeight: '50px',
                                              padding: '6px',
                                              border: '1px solid #ced4da',
                                              borderRadius: '4px',
                                              fontSize: '13px',
                                              resize: 'vertical',
                                              fontFamily: 'inherit'
                                            }}
                                            placeholder="Ej: Identificación y corte efectivo de todas las fuentes de energía."
                                          />
                                        ) : (
                                          <div style={{ fontSize: '13px', color: '#212529', lineHeight: '1.5', width: '100%', fontWeight: '500' }}>
                                            {control.descripcion || 'Sin descripción'}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Columna Pregunta */}
                                      <div style={{ padding: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                        {editandoTabla[`${rol}_preventivo`] ? (
                                          <div style={{ width: '100%', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                            <textarea
                                              value={control.pregunta || ''}
                                              onChange={(e) => actualizarControl(rol, 'preventivos', index, 'pregunta', e.target.value)}
                                              style={{
                                                width: '100%',
                                                minHeight: '50px',
                                                padding: '6px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                              placeholder="Ej: Eléctrico: ¿La identificación y señalización de los puntos para el corte de energía se encuentran definidos en el procedimiento y/o mapa de energías?"
                                            />
                                            <button
                                              onClick={() => eliminarControl(rol, 'preventivos', index)}
                                              style={{
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 10px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                flexShrink: 0,
                                                height: 'fit-content'
                                              }}
                                              title="Eliminar control"
                                            >
                                              <i className="fa fa-trash"></i>
                                            </button>
                                          </div>
                                        ) : (
                                          <div style={{ fontSize: '13px', color: '#212529', lineHeight: '1.5', width: '100%' }}>
                                            {control.pregunta || 'Sin pregunta'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6c757d', fontSize: '13px', gridColumn: '1 / -1' }}>
                                    No hay controles preventivos registrados
                                  </div>
                                )}
                              </div>
                              
                              {editandoTabla[`${rol}_preventivo`] && (
                                <button
                                  onClick={() => agregarControl(rol, 'preventivos')}
                                  style={{
                                    background: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#138496';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#17a2b8';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                  }}
                                >
                                  <i className="fa fa-plus"></i> Agregar Control Preventivo
                                </button>
                              )}
                            </div>

                            {/* Control Mitigador */}
                            <div>
                              {/* Header con botón de editar/agregar */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                              }}>
                                <div style={{
                                  background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '4px',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  color: '#856404'
                                }}>
                                  CONTROL MITIGADOR
                                </div>
                                {canEditFiles(user) && (
                                  <button
                                    onClick={() => {
                                      const key = `${rol}_mitigador`;
                                      if (editandoTabla[key]) {
                                        // Guardar cambios
                                        guardarInformacionRiesgo();
                                        setEditandoTabla({...editandoTabla, [key]: false});
                                      } else {
                                        // Activar edición
                                        setEditandoTabla({...editandoTabla, [key]: true});
                                      }
                                    }}
                                    style={{
                                      background: editandoTabla[`${rol}_mitigador`] ? '#28a745' : '#ffc107',
                                      color: editandoTabla[`${rol}_mitigador`] ? 'white' : '#856404',
                                      border: 'none',
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    <i className={`fa fa-${editandoTabla[`${rol}_mitigador`] ? 'save' : 'edit'}`}></i>
                                    {editandoTabla[`${rol}_mitigador`] ? 'Guardar' : 'Editar'}
                                  </button>
                                )}
                              </div>
                              
                              {/* Tabla de Controles Mitigadores */}
                              <div style={{
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                marginBottom: '0.75rem'
                              }}>
                                {/* Header de la tabla */}
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: '60px 1fr 1fr',
                                  background: '#ffc107',
                                  borderBottom: '1px solid #ff9800',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  color: '#856404'
                                }}>
                                  <div style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid rgba(133,100,4,0.3)' }}>N°</div>
                                  <div style={{ padding: '0.5rem', borderRight: '1px solid rgba(133,100,4,0.3)' }}>CONTROL MITIGADOR</div>
                                  <div style={{ padding: '0.5rem' }}>PREGUNTAS</div>
                                </div>
                                
                                {/* Filas de controles */}
                                {informacionRiesgo[`controles_${rol}`]?.mitigadores?.length > 0 ? (
                                  informacionRiesgo[`controles_${rol}`].mitigadores.map((control, index) => (
                                    <div 
                                      key={`mitigador-${index}`}
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: '60px 1fr 1fr',
                                        borderBottom: index < informacionRiesgo[`controles_${rol}`].mitigadores.length - 1 ? '1px solid #dee2e6' : 'none',
                                        background: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                                        transition: 'background 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!editandoTabla[`${rol}_mitigador`]) {
                                          e.currentTarget.style.background = '#fff8e1';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!editandoTabla[`${rol}_mitigador`]) {
                                          e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                                        }
                                      }}
                                    >
                                      {/* Columna N° */}
                                      <div style={{
                                        padding: '0.75rem 0.5rem',
                                        textAlign: 'center',
                                        borderRight: '1px solid #dee2e6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f8f9fa',
                                        fontWeight: '700',
                                        color: '#17a2b8',
                                        fontSize: '14px'
                                      }}>
                                        {editandoTabla[`${rol}_mitigador`] ? (
                                          <input
                                            type="text"
                                            value={control.numero || ''}
                                            onChange={(e) => actualizarControl(rol, 'mitigadores', index, 'numero', e.target.value)}
                                            style={{
                                              width: '100%',
                                              padding: '4px',
                                              border: '1px solid #ced4da',
                                              borderRadius: '4px',
                                              fontSize: '12px',
                                              textAlign: 'center',
                                              fontWeight: '700'
                                            }}
                                            placeholder="05"
                                          />
                                        ) : (
                                          control.numero || `0${index + 1}`
                                        )}
                                      </div>
                                      
                                      {/* Columna Descripción del Control */}
                                      <div style={{ 
                                        padding: '0.75rem', 
                                        borderRight: '1px solid #dee2e6',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}>
                                        {editandoTabla[`${rol}_mitigador`] ? (
                                          <textarea
                                            value={control.descripcion || ''}
                                            onChange={(e) => actualizarControl(rol, 'mitigadores', index, 'descripcion', e.target.value)}
                                            style={{
                                              width: '100%',
                                              minHeight: '50px',
                                              padding: '6px',
                                              border: '1px solid #ced4da',
                                              borderRadius: '4px',
                                              fontSize: '13px',
                                              resize: 'vertical',
                                              fontFamily: 'inherit'
                                            }}
                                            placeholder="Ej: Protecciones en sistemas eléctricos de baja, media y alta tensión"
                                          />
                                        ) : (
                                          <div style={{ fontSize: '13px', color: '#212529', lineHeight: '1.5', width: '100%', fontWeight: '500' }}>
                                            {control.descripcion || 'Sin descripción'}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Columna Pregunta */}
                                      <div style={{ padding: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                        {editandoTabla[`${rol}_mitigador`] ? (
                                          <div style={{ width: '100%', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                            <textarea
                                              value={control.pregunta || ''}
                                              onChange={(e) => actualizarControl(rol, 'mitigadores', index, 'pregunta', e.target.value)}
                                              style={{
                                                width: '100%',
                                                minHeight: '50px',
                                                padding: '6px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                              }}
                                              placeholder="Ej: Eléctrico: ¿Las protecciones eléctricas de los equipos a intervenir se encuentran con sus mantenciones al día?"
                                            />
                                            <button
                                              onClick={() => eliminarControl(rol, 'mitigadores', index)}
                                              style={{
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 10px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                flexShrink: 0,
                                                height: 'fit-content'
                                              }}
                                              title="Eliminar control"
                                            >
                                              <i className="fa fa-trash"></i>
                                            </button>
                                          </div>
                                        ) : (
                                          <div style={{ fontSize: '13px', color: '#212529', lineHeight: '1.5', width: '100%' }}>
                                            {control.pregunta || 'Sin pregunta'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6c757d', fontSize: '13px', gridColumn: '1 / -1' }}>
                                    No hay controles mitigadores registrados
                                  </div>
                                )}
                              </div>
                              
                              {editandoTabla[`${rol}_mitigador`] && (
                                <button
                                  onClick={() => agregarControl(rol, 'mitigadores')}
                                  style={{
                                    background: '#ffc107',
                                    color: '#856404',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ff9800';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#ffc107';
                                    e.currentTarget.style.color = '#856404';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                  }}
                                >
                                  <i className="fa fa-plus"></i> Agregar Control Mitigador
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );

                      return (
                        <>
                          {renderizarControles('supervisor', 'Supervisor', '#17a2b8')}
                          {renderizarControles('trabajador', 'Trabajador', '#28a745')}
                        </>
                      );
                    })()}

                    {/* Información para Chatbot */}
                    <div style={{
                      background: '#f8f9fa',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #dee2e6'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: '700', color: '#495057', fontSize: '13px' }}>
                          <i className="fa fa-robot" style={{ marginRight: '6px' }}></i>
                          Información para Chatbot (Texto completo del riesgo crítico)
                        </div>
                        {canEditFiles(user) && (
                          <button
                            onClick={() => {
                              if (editandoTabla.informacion_riesgo) {
                                guardarInformacionRiesgo();
                                setEditandoTabla({...editandoTabla, informacion_riesgo: false});
                              } else {
                                setEditandoTabla({...editandoTabla, informacion_riesgo: true});
                              }
                            }}
                            style={{
                              background: editandoTabla.informacion_riesgo ? '#28a745' : '#6c757d',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <i className={`fa fa-${editandoTabla.informacion_riesgo ? 'save' : 'edit'}`}></i>
                            {editandoTabla.informacion_riesgo ? 'Guardar' : 'Editar'}
                          </button>
                        )}
                      </div>
                      {editandoTabla.informacion_riesgo ? (
                        <textarea
                          value={informacionRiesgo.informacion_riesgo}
                          onChange={(e) => setInformacionRiesgo({...informacionRiesgo, informacion_riesgo: e.target.value})}
                          style={{
                            width: '100%',
                            minHeight: '150px',
                            padding: '0.625rem',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                          placeholder="Ingrese toda la información del riesgo crítico en formato texto plano. Esta información será utilizada por el chatbot para responder preguntas sobre este riesgo crítico."
                        />
                      ) : (
                        <div style={{ fontSize: '13px', color: '#495057', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {informacionRiesgo.informacion_riesgo || 'No hay información disponible para el chatbot'}
                        </div>
                      )}
                    </div>

                    {/* Mensaje de advertencia */}
                    <div style={{
                      background: '#f8d7da',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #dc3545',
                      color: '#721c24'
                    }}>
                      <div style={{ fontWeight: '700', marginBottom: '0.375rem', fontSize: '13px' }}>
                        <i className="fa fa-exclamation-circle" style={{ marginRight: '6px' }}></i>
                        IMPORTANTE
                      </div>
                      <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                        Si un Control Crítico no está presente, detenga la actividad. Luego, aplique tarjeta verde y notifique al supervisor para evaluar la desviación y juntos normalizar el control ausente o fallido.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                    <i className="fa fa-exclamation-triangle" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ffc107' }}></i>
                    <p>No hay información de riesgo crítico disponible para esta carpeta.</p>
                    {canEditFiles(user) && (
                      <button
                        onClick={() => {
                          setInformacionRiesgo({
                            evento_no_deseado: '',
                            evento_riesgo: '',
                            controles_supervisor: { preventivos: [], mitigadores: [] },
                            controles_trabajador: { preventivos: [], mitigadores: [] },
                            informacion_riesgo: ''
                          });
                          setEditandoTabla({
                            evento_no_deseado: true,
                            evento_riesgo: false,
                            supervisor_preventivo: false,
                            supervisor_mitigador: false,
                            trabajador_preventivo: false,
                            trabajador_mitigador: false,
                            informacion_riesgo: false
                          });
                        }}
                        style={{
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          marginTop: '1rem'
                        }}
                      >
                        <i className="fa fa-plus" style={{ marginRight: '8px' }}></i>
                        Agregar Información de Riesgo Crítico
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pestaña Foro */}
            {pestañaActiva === 'foro' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ margin: 0, color: '#17a2b8' }}>
                      <i className="fa fa-comments" style={{ marginRight: '8px' }}></i>
                      Foro de "{carpetaActual.nombre}"
                    </h2>
                    <button
                      onClick={abrirModalParticipantes}
                      style={{
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(10, 110, 189, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#085a9d';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(10, 110, 189, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#17a2b8';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(10, 110, 189, 0.2)';
                      }}
                      title="Ver participantes de la carpeta"
                    >
                      <i className="fa fa-users"></i>
                      Participantes
                    </button>
                  </div>
                </div>

                {/* Formulario para nuevo mensaje */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: '2px solid #e9ecef'
                }}>
                  {mensajeRespondiendo && (
                    <div style={{
                      background: '#e7f3ff',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      marginBottom: '0.75rem',
                      borderLeft: '4px solid #17a2b8',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          Respondiendo a:
                        </div>
                        <div style={{ fontSize: '13px', color: '#17a2b8', fontWeight: '500' }}>
                          {mensajeRespondiendo.usuario_nombre}: {mensajeRespondiendo.mensaje.substring(0, 50)}...
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMensajeRespondiendo(null);
                          setRespuestaMensaje('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '0 8px'
                        }}
                      >
                        <i className="fa fa-times"></i>
                      </button>
                    </div>
                  )}
                  <textarea
                    value={mensajeRespondiendo ? respuestaMensaje : nuevoMensaje}
                    onChange={(e) => mensajeRespondiendo ? setRespuestaMensaje(e.target.value) : setNuevoMensaje(e.target.value)}
                    placeholder={mensajeRespondiendo ? "Escribe tu respuesta..." : "Escribe un mensaje en el foro..."}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      marginBottom: '0.75rem'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#17a2b8';
                      e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={crearMensaje}
                    disabled={mensajeRespondiendo ? !respuestaMensaje.trim() : !nuevoMensaje.trim()}
                    style={{
                      background: mensajeRespondiendo ? (respuestaMensaje.trim() ? 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)' : '#ccc') : (nuevoMensaje.trim() ? 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)' : '#ccc'),
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: (mensajeRespondiendo ? respuestaMensaje.trim() : nuevoMensaje.trim()) ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fa fa-paper-plane"></i>
                    {mensajeRespondiendo ? 'Enviar Respuesta' : 'Publicar Mensaje'}
                  </button>
                </div>

                {/* Lista de mensajes */}
                {mensajesForo.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#999'
                  }}>
                    <i className="fa fa-comments" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                    <p style={{ fontSize: '16px', margin: 0 }}>
                      No hay mensajes en el foro aún.
                    </p>
                    <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                      Sé el primero en iniciar una conversación.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {mensajesForo.map((mensaje) => (
                      <div
                        key={mensaje.id}
                        id={`mensaje-${mensaje.id}`}
                        style={{
                          background: '#ffffff',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          padding: '1rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#17a2b8';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 110, 189, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e9ecef';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}>
                              {mensaje.usuario_nombre ? mensaje.usuario_nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#17a2b8', fontSize: '14px' }}>
                                {mensaje.usuario_nombre || 'Usuario'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {formatearFechaHora(mensaje.creado_en)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              // Abrir formulario inline de respuesta
                              setRespuestasAbiertas(prev => ({
                                ...prev,
                                [mensaje.id]: prev[mensaje.id] !== undefined ? undefined : ''
                              }));
                              // También mantener compatibilidad con el formulario superior
                              setMensajeRespondiendo(mensaje);
                            }}
                            style={{
                              background: respuestasAbiertas[mensaje.id] !== undefined ? '#17a2b8' : 'none',
                              border: '1px solid #17a2b8',
                              color: respuestasAbiertas[mensaje.id] !== undefined ? 'white' : '#17a2b8',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (respuestasAbiertas[mensaje.id] === undefined) {
                                e.target.style.background = '#17a2b8';
                                e.target.style.color = 'white';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (respuestasAbiertas[mensaje.id] === undefined) {
                                e.target.style.background = 'none';
                                e.target.style.color = '#17a2b8';
                              }
                            }}
                          >
                            <i className="fa fa-reply" style={{ marginRight: '4px' }}></i>
                            {respuestasAbiertas[mensaje.id] !== undefined ? 'Ocultar respuesta' : 'Responder'}
                          </button>
                        </div>
                        <div style={{
                          color: '#212529',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          marginBottom: mensaje.respuestas && mensaje.respuestas.length > 0 ? '1rem' : '0'
                        }}>
                          {mensaje.mensaje}
                        </div>
                        {/* Formulario de respuesta inline */}
                        {respuestasAbiertas[mensaje.id] !== undefined && (
                          <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            border: '2px solid #17a2b8'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                              <i className="fa fa-reply" style={{ color: '#17a2b8' }}></i>
                              <span style={{ fontSize: '13px', color: '#17a2b8', fontWeight: '600' }}>
                                Respondiendo a {mensaje.usuario_nombre || 'Usuario'}
                              </span>
                            </div>
                            <textarea
                              value={respuestasAbiertas[mensaje.id] || ''}
                              onChange={(e) => {
                                setRespuestasAbiertas(prev => ({
                                  ...prev,
                                  [mensaje.id]: e.target.value
                                }));
                              }}
                              placeholder="Escribe tu respuesta..."
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '6px',
                                fontSize: '14px',
                                minHeight: '80px',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                marginBottom: '0.75rem'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#17a2b8';
                                e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '#e0e0e0';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setRespuestasAbiertas(prev => {
                                    const nuevas = { ...prev };
                                    delete nuevas[mensaje.id];
                                    return nuevas;
                                  });
                                }}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  border: '2px solid #6c757d',
                                  background: 'white',
                                  color: '#6c757d',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#6c757d';
                                  e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'white';
                                  e.target.style.color = '#6c757d';
                                }}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => {
                                  const texto = respuestasAbiertas[mensaje.id]?.trim();
                                  if (texto) {
                                    crearMensaje(mensaje.id, texto);
                                  }
                                }}
                                disabled={!respuestasAbiertas[mensaje.id]?.trim()}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: respuestasAbiertas[mensaje.id]?.trim() ? 'linear-gradient(135deg, #17a2b8 0%, #8B4513 100%)' : '#ccc',
                                  color: 'white',
                                  cursor: respuestasAbiertas[mensaje.id]?.trim() ? 'pointer' : 'not-allowed',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <i className="fa fa-paper-plane"></i>
                                Enviar Respuesta
                              </button>
                            </div>
                          </div>
                        )}

                        {mensaje.respuestas && mensaje.respuestas.length > 0 && (
                          <div style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid #e9ecef'
                          }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.75rem', fontWeight: '600' }}>
                              <i className="fa fa-reply" style={{ marginRight: '4px' }}></i>
                              {mensaje.respuestas.length} {mensaje.respuestas.length === 1 ? 'respuesta' : 'respuestas'}
                            </div>
                            {mensaje.respuestas.map((respuesta) => (
                              <div
                                key={respuesta.id}
                                style={{
                                  background: '#f8f9fa',
                                  padding: '0.75rem',
                                  borderRadius: '6px',
                                  marginBottom: '0.5rem',
                                  borderLeft: '3px solid #17a2b8'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                  <div style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    fontSize: '12px'
                                  }}>
                                    {respuesta.usuario_nombre ? respuesta.usuario_nombre.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: '#17a2b8', fontSize: '13px' }}>
                                      {respuesta.usuario_nombre || 'Usuario'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                      {formatearFechaHora(respuesta.creado_en)}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ color: '#495057', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                  {respuesta.mensaje}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pestaña Tareas */}
            {pestañaActiva === 'tareas' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ margin: 0, color: '#17a2b8' }}>
                      <i className="fa fa-tasks" style={{ marginRight: '8px' }}></i>
                      Tareas y Recordatorios
                    </h2>
                    <button
                      onClick={abrirModalParticipantes}
                      style={{
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(10, 110, 189, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#085a9d';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(10, 110, 189, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#17a2b8';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(10, 110, 189, 0.2)';
                      }}
                      title="Ver participantes de la carpeta"
                    >
                      <i className="fa fa-users"></i>
                      Participantes
                    </button>
                  </div>
                  <button
                    onClick={() => setModalCrearTarea(true)}
                    style={{
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)'
                    }}
                  >
                    <i className="fa fa-plus"></i>
                    Nueva Tarea
                  </button>
                </div>

                {tareas.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#999'
                  }}>
                    <i className="fa fa-tasks" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                    <p style={{ fontSize: '16px', margin: 0 }}>
                      No hay tareas asignadas aún.
                    </p>
                    <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                      Crea una nueva tarea para comenzar a organizar el trabajo.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {tareas.map((tarea) => {
                      const coloresPrioridad = {
                        urgente: { bg: '#dc3545', color: '#fff' },
                        alta: { bg: '#fd7e14', color: '#fff' },
                        media: { bg: '#ffc107', color: '#000' },
                        baja: { bg: '#6c757d', color: '#fff' }
                      };
                      const coloresEstado = {
                        pendiente: { bg: '#6c757d', color: '#fff' },
                        en_progreso: { bg: '#17a2b8', color: '#fff' },
                        completada: { bg: '#28a745', color: '#fff' },
                        cancelada: { bg: '#dc3545', color: '#fff' }
                      };
                      const prioridad = coloresPrioridad[tarea.prioridad] || coloresPrioridad.media;
                      const estado = coloresEstado[tarea.estado] || coloresEstado.pendiente;
                      
                      return (
                        <div
                          key={tarea.id}
                          id={`tarea-${tarea.id}`}
                          style={{
                            background: tarea.estado === 'completada' && tarea.estado_validacion === 'validada' ? '#f8f9fa' : 
                                       tarea.estado === 'completada' && tarea.estado_validacion === 'pendiente' ? '#fff3cd' : '#ffffff',
                            border: tarea.estado === 'completada' && tarea.estado_validacion === 'pendiente' ? '2px solid #ffc107' : '2px solid #e9ecef',
                            borderRadius: '8px',
                            padding: '1rem',
                            opacity: tarea.estado === 'completada' && tarea.estado_validacion === 'validada' ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                            boxShadow: tarea.estado === 'completada' && tarea.estado_validacion === 'pendiente' ? '0 2px 8px rgba(255, 193, 7, 0.3)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (tarea.estado !== 'completada' || tarea.estado_validacion === 'pendiente') {
                              e.currentTarget.style.borderColor = tarea.estado === 'completada' && tarea.estado_validacion === 'pendiente' ? '#ffc107' : '#17a2b8';
                              e.currentTarget.style.boxShadow = tarea.estado === 'completada' && tarea.estado_validacion === 'pendiente' 
                                ? '0 2px 8px rgba(255, 193, 7, 0.4)' 
                                : '0 2px 8px rgba(10, 110, 189, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = tarea.estado === 'completada' && tarea.estado_validacion === 'pendiente' ? '#ffc107' : '#e9ecef';
                            e.currentTarget.style.boxShadow = tarea.estado === 'completada' && tarea.estado_validacion === 'pendiente' 
                              ? '0 2px 8px rgba(255, 193, 7, 0.3)' 
                              : 'none';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, color: '#17a2b8', fontSize: '16px', fontWeight: '600' }}>
                                  {tarea.titulo}
                                </h3>
                                <span style={{
                                  background: prioridad.bg,
                                  color: prioridad.color,
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>
                                  {tarea.prioridad}
                                </span>
                                <span style={{
                                  background: estado.bg,
                                  color: estado.color,
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>
                                  {tarea.estado === 'en_progreso' ? 'En Progreso' : tarea.estado === 'completada' ? 'Completada' : tarea.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                                </span>
                              </div>
                              {tarea.descripcion && (
                                <div style={{ color: '#495057', fontSize: '14px', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                                  {tarea.descripcion}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '12px', color: '#666' }}>
                                <span>
                                  <i className="fa fa-user" style={{ marginRight: '4px' }}></i>
                                  Creada por: {tarea.creador_nombre || 'Usuario'}
                                </span>
                                {tarea.asignados && tarea.asignados.length > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>
                                      <i className="fa fa-user-check" style={{ marginRight: '4px' }}></i>
                                      Asignada a:
                                    </span>
                                    {tarea.asignados.map((a, idx) => (
                                      <span key={a.usuario_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        {a.usuario_nombre}
                                        {/* Botón para quitar usuario (solo para el creador) */}
                                        {tarea.creado_por === user.id && (
                                          <button
                                            onClick={() => quitarUsuarioDeTarea(tarea.id, a.usuario_id)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              color: '#dc3545',
                                              cursor: 'pointer',
                                              padding: '2px 4px',
                                              fontSize: '10px',
                                              borderRadius: '3px'
                                            }}
                                            title="Quitar usuario de la tarea"
                                          >
                                            <i className="fa fa-times"></i>
                                          </button>
                                        )}
                                        {idx < tarea.asignados.length - 1 && ','}
                                      </span>
                                    ))}
                                    {/* Botón para invitar más usuarios (solo para el creador) */}
                                    {tarea.creado_por === user.id && (
                                      <button
                                        onClick={() => setModalInvitarUsuarioTarea(tarea.id)}
                                        style={{
                                          background: '#17a2b8',
                                          color: 'white',
                                          border: 'none',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '10px',
                                          fontWeight: '500',
                                          marginLeft: '4px'
                                        }}
                                        title="Invitar usuario a la tarea"
                                      >
                                        <i className="fa fa-user-plus" style={{ marginRight: '2px' }}></i>
                                        Invitar
                                      </button>
                                    )}
                                  </div>
                                )}
                                {(!tarea.asignados || tarea.asignados.length === 0) && tarea.asignado_nombre && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>
                                      <i className="fa fa-user-check" style={{ marginRight: '4px' }}></i>
                                      Asignada a: {tarea.asignado_nombre}
                                    </span>
                                    {tarea.creado_por === user.id && (
                                      <button
                                        onClick={() => setModalInvitarUsuarioTarea(tarea.id)}
                                        style={{
                                          background: '#17a2b8',
                                          color: 'white',
                                          border: 'none',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '10px',
                                          fontWeight: '500'
                                        }}
                                        title="Invitar usuario a la tarea"
                                      >
                                        <i className="fa fa-user-plus" style={{ marginRight: '2px' }}></i>
                                        Invitar
                                      </button>
                                    )}
                                  </div>
                                )}
                                {(!tarea.asignados || tarea.asignados.length === 0) && !tarea.asignado_nombre && tarea.creado_por === user.id && (
                                  <button
                                    onClick={() => setModalInvitarUsuarioTarea(tarea.id)}
                                    style={{
                                      background: '#17a2b8',
                                      color: 'white',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      fontWeight: '500'
                                    }}
                                    title="Invitar usuario a la tarea"
                                  >
                                    <i className="fa fa-user-plus" style={{ marginRight: '4px' }}></i>
                                    Invitar usuario
                                  </button>
                                )}
                                {tarea.fecha_vencimiento && (
                                  <span>
                                    <i className="fa fa-calendar-times" style={{ marginRight: '4px' }}></i>
                                    Vence: {formatearFechaHora(tarea.fecha_vencimiento)}
                                  </span>
                                )}
                                {tarea.recordatorio_en && (
                                  <span>
                                    <i className="fa fa-bell" style={{ marginRight: '4px' }}></i>
                                    Recordatorio: {formatearFechaHora(tarea.recordatorio_en)}
                                  </span>
                                )}
                                {/* Mostrar estado de validación */}
                                {tarea.estado === 'completada' && tarea.estado_validacion && (
                                  <span style={{
                                    background: tarea.estado_validacion === 'validada' ? '#28a745' : 
                                               tarea.estado_validacion === 'rechazada' ? '#dc3545' : '#ffc107',
                                    color: '#fff',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                  }}>
                                    <i className={`fa fa-${tarea.estado_validacion === 'validada' ? 'check-circle' : 
                                                   tarea.estado_validacion === 'rechazada' ? 'times-circle' : 'clock'}`} 
                                       style={{ marginRight: '4px' }}></i>
                                    {tarea.estado_validacion === 'validada' ? 'Validada' : 
                                     tarea.estado_validacion === 'rechazada' ? 'Rechazada' : 'Pendiente Validación'}
                                  </span>
                                )}
                                {tarea.estado === 'completada' && tarea.estado_validacion === 'validada' && tarea.validador_nombre && (
                                  <span>
                                    <i className="fa fa-check-circle" style={{ marginRight: '4px', color: '#28a745' }}></i>
                                    Validada por: {tarea.validador_nombre} {tarea.validada_en && `(${formatearFechaHora(tarea.validada_en)})`}
                                  </span>
                                )}
                                {tarea.motivo_rechazo && (
                                  <div style={{ 
                                    marginTop: '0.5rem', 
                                    padding: '0.5rem', 
                                    background: '#fff3cd', 
                                    border: '1px solid #ffc107',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: '#856404'
                                  }}>
                                    <strong>Motivo de rechazo:</strong> {tarea.motivo_rechazo}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Botones de acción según el estado y el usuario */}
                            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                              {/* Botones para el asignado: iniciar y completar */}
                              {tarea.estado !== 'completada' && tarea.estado !== 'cancelada' && 
                               ((tarea.asignados && tarea.asignados.some(a => a.usuario_id === user.id)) ||
                                (!tarea.asignados && tarea.asignado_a === user.id) ||
                                user.rol === 'super_admin' || user.rol === 'admin') && (
                                <>
                                  {tarea.estado === 'pendiente' && (
                                    <button
                                      onClick={() => actualizarEstadoTarea(tarea.id, 'en_progreso')}
                                      style={{
                                        background: '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                      }}
                                    >
                                      Iniciar
                                    </button>
                                  )}
                                  {tarea.estado === 'en_progreso' && (
                                    <button
                                      onClick={() => actualizarEstadoTarea(tarea.id, 'completada')}
                                      style={{
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                      }}
                                    >
                                      Completar
                                    </button>
                                  )}
                                </>
                              )}
                              
                              {/* Botones para el creador: validar o rechazar tareas completadas */}
                              {tarea.estado === 'completada' && 
                               tarea.estado_validacion === 'pendiente' &&
                               (tarea.creado_por === user.id || user.rol === 'super_admin' || user.rol === 'admin') && (
                                <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                                  <button
                                    onClick={() => validarTarea(tarea.id, 'validada')}
                                    style={{
                                      background: '#28a745',
                                      color: 'white',
                                      border: 'none',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '500'
                                    }}
                                  >
                                    <i className="fa fa-check" style={{ marginRight: '4px' }}></i>
                                    Validar
                                  </button>
                                  <button
                                    onClick={() => {
                                      const motivo = window.prompt('Motivo del rechazo (opcional):', '');
                                      if (motivo !== null) {
                                        validarTarea(tarea.id, 'rechazada', motivo);
                                      }
                                    }}
                                    style={{
                                      background: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '500'
                                    }}
                                  >
                                    <i className="fa fa-times" style={{ marginRight: '4px' }}></i>
                                    Rechazar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Sección de comentarios */}
                          <div style={{ marginTop: '1rem', borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>
                                <i className="fa fa-comments" style={{ marginRight: '6px' }}></i>
                                {tarea.cantidad_comentarios || 0} {tarea.cantidad_comentarios === 1 ? 'comentario' : 'comentarios'}
                              </div>
                              <button
                                onClick={() => setTareaExpandida(tareaExpandida === tarea.id ? null : tarea.id)}
                                style={{
                                  background: 'none',
                                  border: '1px solid #17a2b8',
                                  color: '#17a2b8',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                {tareaExpandida === tarea.id ? (
                                  <>
                                    <i className="fa fa-chevron-up" style={{ marginRight: '4px' }}></i>
                                    Ocultar
                                  </>
                                ) : (
                                  <>
                                    <i className="fa fa-chevron-down" style={{ marginRight: '4px' }}></i>
                                    Ver comentarios
                                  </>
                                )}
                              </button>
                            </div>
                            
                            {/* Comentarios expandidos */}
                            {tareaExpandida === tarea.id && (
                              <div>
                                {/* Lista de comentarios */}
                                {tarea.comentarios && tarea.comentarios.length > 0 && (
                                  <div style={{ marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                                    {tarea.comentarios.map((comentario) => (
                                      <div
                                        key={comentario.id}
                                        style={{
                                          background: '#f8f9fa',
                                          padding: '0.75rem',
                                          borderRadius: '6px',
                                          marginBottom: '0.5rem',
                                          borderLeft: '3px solid #17a2b8'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                          <div style={{
                                            width: '30px',
                                            height: '30px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            fontWeight: '600',
                                            fontSize: '12px'
                                          }}>
                                            {comentario.usuario_nombre ? comentario.usuario_nombre.charAt(0).toUpperCase() : 'U'}
                                          </div>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#17a2b8', fontSize: '13px' }}>
                                              {comentario.usuario_nombre || 'Usuario'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                              {formatearFechaHora(comentario.creado_en)}
                                            </div>
                                          </div>
                                        </div>
                                        <div style={{
                                          color: '#212529',
                                          fontSize: '13px',
                                          lineHeight: '1.6',
                                          whiteSpace: 'pre-wrap'
                                        }}>
                                          {comentario.comentario}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Formulario para agregar comentario */}
                                {/* Verificar que el usuario puede comentar (creador o asignado) */}
                                {(tarea.creado_por === user.id || 
                                  (tarea.asignados && tarea.asignados.some(a => a.usuario_id === user.id)) ||
                                  (!tarea.asignados && tarea.asignado_a === user.id) ||
                                  user.rol === 'super_admin' || user.rol === 'admin') && (
                                  <div>
                                    <textarea
                                      placeholder="Escribe un comentario sobre el progreso de esta tarea..."
                                      value={nuevoComentario[tarea.id] || ''}
                                      onChange={(e) => setNuevoComentario(prev => ({
                                        ...prev,
                                        [tarea.id]: e.target.value
                                      }))}
                                      style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        padding: '10px',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        boxSizing: 'border-box',
                                        marginBottom: '0.5rem'
                                      }}
                                      onFocus={(e) => {
                                        e.target.style.borderColor = '#17a2b8';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                                      }}
                                      onBlur={(e) => {
                                        e.target.style.borderColor = '#e0e0e0';
                                        e.target.style.boxShadow = 'none';
                                      }}
                                    />
                                    <button
                                      onClick={() => crearComentario(tarea.id)}
                                      disabled={!nuevoComentario[tarea.id]?.trim()}
                                      style={{
                                        background: nuevoComentario[tarea.id]?.trim() ? '#17a2b8' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: nuevoComentario[tarea.id]?.trim() ? 'pointer' : 'not-allowed',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      <i className="fa fa-paper-plane" style={{ marginRight: '6px' }}></i>
                                      Agregar comentario
                                    </button>
                                  </div>
                                )}
                                
                                {/* Sección de archivos adjuntos */}
                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}>
                                  <div style={{ fontSize: '13px', color: '#666', fontWeight: '600', marginBottom: '0.75rem' }}>
                                    <i className="fa fa-paperclip" style={{ marginRight: '6px' }}></i>
                                    Archivos adjuntos ({adjuntosTarea[tarea.id]?.length || 0})
                                  </div>
                                  
                                  {/* Lista de adjuntos */}
                                  {adjuntosTarea[tarea.id] && adjuntosTarea[tarea.id].length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                      {adjuntosTarea[tarea.id].map((adjunto) => (
                                        <div
                                          key={adjunto.id}
                                          style={{
                                            background: '#f8f9fa',
                                            padding: '0.75rem',
                                            borderRadius: '6px',
                                            marginBottom: '0.5rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: '1px solid #e9ecef'
                                          }}
                                        >
                                          <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                              <i className="fa fa-file" style={{ color: '#17a2b8', fontSize: '16px' }}></i>
                                              <span style={{ fontWeight: '600', color: '#17a2b8', fontSize: '13px' }}>
                                                {adjunto.nombre_original}
                                              </span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#666', marginLeft: '24px' }}>
                                              Subido por {adjunto.usuario_nombre || 'Usuario'} • {formatearFechaHora(adjunto.creado_en)}
                                              {adjunto.tamano && (
                                                <span> • {(adjunto.tamano / 1024).toFixed(2)} KB</span>
                                              )}
                                            </div>
                                            {adjunto.descripcion && (
                                              <div style={{ fontSize: '12px', color: '#495057', marginTop: '4px', marginLeft: '24px' }}>
                                                {adjunto.descripcion}
                                              </div>
                                            )}
                                          </div>
                                          <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                              onClick={() => descargarAdjunto(adjunto)}
                                              style={{
                                                background: '#17a2b8',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                              }}
                                              title="Descargar archivo"
                                            >
                                              <i className="fa fa-download"></i>
                                            </button>
                                            {(adjunto.usuario_id === user.id || user.rol === 'super_admin' || user.rol === 'admin') && (
                                              <button
                                                onClick={() => eliminarAdjunto(adjunto.id, tarea.id)}
                                                style={{
                                                  background: '#dc3545',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '6px 12px',
                                                  borderRadius: '6px',
                                                  cursor: 'pointer',
                                                  fontSize: '12px',
                                                  fontWeight: '500'
                                                }}
                                                title="Eliminar archivo"
                                              >
                                                <i className="fa fa-trash"></i>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Formulario para adjuntar archivo */}
                                  {/* Verificar que el usuario puede adjuntar (creador o asignado) */}
                                  {(tarea.creado_por === user.id || 
                                    (tarea.asignados && tarea.asignados.some(a => a.usuario_id === user.id)) ||
                                    (!tarea.asignados && tarea.asignado_a === user.id) ||
                                    user.rol === 'super_admin' || user.rol === 'admin') && (
                                    <div>
                                      <input
                                        type="file"
                                        id={`adjunto-${tarea.id}`}
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                          const archivo = e.target.files[0];
                                          if (archivo) {
                                            const descripcion = window.prompt('Descripción del archivo (opcional):', '');
                                            subirAdjuntoTarea(tarea.id, archivo, descripcion || '');
                                            // Resetear el input
                                            e.target.value = '';
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => document.getElementById(`adjunto-${tarea.id}`).click()}
                                        disabled={subiendoAdjunto[tarea.id]}
                                        style={{
                                          background: subiendoAdjunto[tarea.id] ? '#ccc' : '#28a745',
                                          color: 'white',
                                          border: 'none',
                                          padding: '8px 16px',
                                          borderRadius: '6px',
                                          cursor: subiendoAdjunto[tarea.id] ? 'not-allowed' : 'pointer',
                                          fontSize: '13px',
                                          fontWeight: '500',
                                          transition: 'all 0.2s ease',
                                          width: '100%'
                                        }}
                                      >
                                        {subiendoAdjunto[tarea.id] ? (
                                          <>
                                            <i className="fa fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                                            Subiendo...
                                          </>
                                        ) : (
                                          <>
                                            <i className="fa fa-paperclip" style={{ marginRight: '6px' }}></i>
                                            Adjuntar archivo
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Crear Carpeta */}
      {modalCrearCarpeta && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 50, 101, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white',
            padding: 0,
            borderRadius: '16px',
            width: '90%',
            maxWidth: '550px',
            boxShadow: '0 20px 60px rgba(10, 50, 101, 0.3)',
            border: '2px solid #17a2b8',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header con gradiente */}
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)',
              padding: '1rem 1.5rem',
              color: 'white',
              boxShadow: '0 2px 10px rgba(10, 110, 189, 0.3)'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.2rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa fa-folder-plus" style={{ fontSize: '1.1rem' }}></i>
                Crear Nueva Carpeta
              </h2>
            </div>

            {/* Contenido del formulario */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontWeight: '600',
                  color: '#17a2b8',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Nombre <span style={{ color: '#dc3545' }}>*</span>
                </label>
              <input
                type="text"
                value={nuevaCarpeta.nombre}
                onChange={(e) => setNuevaCarpeta({ ...nuevaCarpeta, nombre: e.target.value })}
                style={{
                  width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#17a2b8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                }}
                placeholder="Nombre de la carpeta"
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontWeight: '600',
                  color: '#17a2b8',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Descripción
                </label>
              <textarea
                value={nuevaCarpeta.descripcion}
                onChange={(e) => setNuevaCarpeta({ ...nuevaCarpeta, descripcion: e.target.value })}
                style={{
                  width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                  fontSize: '14px',
                    minHeight: '70px',
                    resize: 'vertical',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#17a2b8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                }}
                placeholder="Descripción de la carpeta (opcional)"
              />
            </div>

            {/* Campo de carga de icono */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: '600',
                color: '#17a2b8',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <i className="fa fa-image" style={{ marginRight: '6px' }}></i>
                Icono de la Carpeta <span style={{ fontWeight: '400', fontSize: '0.75rem', color: '#666' }}>(Opcional)</span>
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Validar tamaño (máximo 2MB)
                      if (file.size > 2 * 1024 * 1024) {
                        alert('El icono no debe superar los 2MB');
                        e.target.value = '';
                        return;
                      }
                      // Crear preview
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setIconoPreview(reader.result);
                      };
                      reader.readAsDataURL(file);
                      // Guardar el archivo para subirlo después
                      setNuevaCarpeta({ ...nuevaCarpeta, icono_file: file });
                    }
                  }}
                  style={{ display: 'none' }}
                  id="icono-input-crear"
                />
                <label
                  htmlFor="icono-input-crear"
                  style={{
                    padding: '8px 16px',
                    border: '2px dashed #17a2b8',
                    borderRadius: '6px',
                    background: '#f0f7ff',
                    color: '#17a2b8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e0f0ff';
                    e.target.style.borderColor = '#8B4513';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f0f7ff';
                    e.target.style.borderColor = '#17a2b8';
                  }}
                >
                  <i className="fa fa-upload"></i>
                  {iconoPreview ? 'Cambiar Icono' : 'Seleccionar Icono'}
                </label>
                {iconoPreview && (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={iconoPreview} 
                      alt="Preview" 
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        border: '2px solid #17a2b8',
                        background: 'white',
                        padding: '4px'
                      }}
                    />
                    <button
                      onClick={() => {
                        setIconoPreview(null);
                        setNuevaCarpeta({ ...nuevaCarpeta, icono_file: null });
                        document.getElementById('icono-input-crear').value = '';
                      }}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#666' }}>
                Formatos soportados: PNG, JPG, SVG. Tamaño máximo: 2MB. Recomendado: 64x64px o 128x128px
              </p>
            </div>
            
            {/* Selector de colores solo para super_admin */}
            {user && user.rol === 'super_admin' && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '8px', 
                  border: '2px solid #e0e0e0',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '10px', 
                    fontWeight: '600', 
                    color: '#17a2b8',
                    fontSize: '0.9rem'
                  }}>
                    <i className="fa fa-palette" style={{ marginRight: '8px', fontSize: '0.95rem' }}></i>
                    Colores Personalizados <span style={{ fontWeight: '400', fontSize: '0.8rem', color: '#666', marginLeft: '5px' }}>(Opcional)</span>
                </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>Color Primario</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={nuevaCarpeta.color_primario || '#F2A900'}
                        onChange={(e) => {
                          const primario = e.target.value;
                          setNuevaCarpeta({ 
                            ...nuevaCarpeta, 
                            color_primario: primario,
                            color_secundario: nuevaCarpeta.color_secundario || generarColorSecundario(primario)
                          });
                        }}
                        style={{
                            width: '45px',
                            height: '38px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <input
                        type="text"
                        value={nuevaCarpeta.color_primario || ''}
                        onChange={(e) => {
                          const primario = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(primario) || primario === '') {
                            setNuevaCarpeta({ 
                              ...nuevaCarpeta, 
                              color_primario: primario,
                              color_secundario: nuevaCarpeta.color_secundario || (primario ? generarColorSecundario(primario) : '')
                            });
                          }
                        }}
                        placeholder="#F2A900"
                        style={{
                          flex: 1,
                            padding: '8px 10px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#17a2b8';
                            e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#ddd';
                            e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                  <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>Color Secundario</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={nuevaCarpeta.color_secundario || '#FFC947'}
                        onChange={(e) => setNuevaCarpeta({ ...nuevaCarpeta, color_secundario: e.target.value })}
                        style={{
                            width: '45px',
                            height: '38px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <input
                        type="text"
                        value={nuevaCarpeta.color_secundario || ''}
                        onChange={(e) => {
                          const secundario = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(secundario) || secundario === '') {
                            setNuevaCarpeta({ ...nuevaCarpeta, color_secundario: secundario });
                          }
                        }}
                        placeholder="#FFC947"
                        style={{
                          flex: 1,
                            padding: '8px 10px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#17a2b8';
                            e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#ddd';
                            e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '10px',
                  paddingTop: '10px',
                    borderTop: '2px solid #e0e0e0'
                }}>
                  <button
                    onClick={() => {
                      const coloresAuto = obtenerColoresCarpeta(nuevaCarpeta.nombre || 'Carpeta', Date.now());
                      setNuevaCarpeta({ 
                        ...nuevaCarpeta, 
                        color_primario: coloresAuto.primary,
                        color_secundario: coloresAuto.secondary
                      });
                    }}
                    style={{
                      padding: '6px 12px',
                        border: '2px solid #17a2b8',
                        borderRadius: '6px',
                      background: 'white',
                        color: '#17a2b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#17a2b8';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(10, 110, 189, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#17a2b8';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                    title="Usar color automático basado en el nombre"
                  >
                      <i className="fa fa-magic"></i>
                    Auto
                  </button>
                  <button
                    onClick={() => setNuevaCarpeta({ ...nuevaCarpeta, color_primario: '', color_secundario: '' })}
                    style={{
                      padding: '6px 12px',
                        border: '2px solid #dc3545',
                        borderRadius: '6px',
                      background: 'white',
                        color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#dc3545';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(220, 53, 69, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#dc3545';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                    title="Limpiar colores personalizados"
                  >
                      <i className="fa fa-eraser"></i>
                    Limpiar
                  </button>
                </div>
                {nuevaCarpeta.color_primario && nuevaCarpeta.color_secundario && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: `linear-gradient(135deg, ${nuevaCarpeta.color_primario} 0%, ${nuevaCarpeta.color_secundario} 100%)`,
                    borderRadius: '6px',
                    textAlign: 'center',
                    color: '#ffffff',
                    fontSize: '12px',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                  }}>
                      <i className="fa fa-eye" style={{ marginRight: '6px' }}></i>
                    Vista Previa
                  </div>
                )}
              </div>
            )}
            </div>
            
            {/* Footer con botones */}
            <div style={{ 
              padding: '1rem 1.5rem',
              borderTop: '2px solid #e9ecef',
              background: '#f8f9fa',
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setModalCrearCarpeta(false);
                  setNuevaCarpeta({ nombre: '', descripcion: '', color_primario: '', color_secundario: '', icono_url: '' });
                  setIconoPreview(null);
                }}
                style={{
                  padding: '10px 18px',
                  border: '2px solid #6c757d',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6c757d';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(108, 117, 125, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#6c757d';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearCarpeta}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #17a2b8 0%, #8B4513 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(10, 110, 189, 0.3)',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #8B4513 0%, #17a2b8 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(10, 110, 189, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #17a2b8 0%, #8B4513 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(10, 110, 189, 0.3)';
                }}
              >
                <i className="fa fa-plus" style={{ marginRight: '6px' }}></i>
                Crear Carpeta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Carpeta */}
      {modalEditarCarpeta && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 50, 101, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to { 
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
          <div style={{
            background: 'white',
            padding: 0,
            borderRadius: '16px',
            width: '90%',
            maxWidth: '550px',
            boxShadow: '0 20px 60px rgba(10, 50, 101, 0.3)',
            border: '2px solid #17a2b8',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header con gradiente */}
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)',
              padding: '1rem 1.5rem',
              color: 'white',
              boxShadow: '0 2px 10px rgba(10, 110, 189, 0.3)'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.2rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa fa-folder-open" style={{ fontSize: '1.1rem' }}></i>
                Editar Carpeta
              </h2>
            </div>

            {/* Contenido del formulario */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontWeight: '600',
                  color: '#17a2b8',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Nombre <span style={{ color: '#dc3545' }}>*</span>
                </label>
              <input
                type="text"
                value={modalEditarCarpeta.nombre}
                onChange={(e) => setModalEditarCarpeta({ ...modalEditarCarpeta, nombre: e.target.value })}
                style={{
                  width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#17a2b8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontWeight: '600',
                  color: '#17a2b8',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Descripción
                </label>
              <textarea
                value={modalEditarCarpeta.descripcion || ''}
                onChange={(e) => setModalEditarCarpeta({ ...modalEditarCarpeta, descripcion: e.target.value })}
                style={{
                  width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                  fontSize: '14px',
                    minHeight: '70px',
                    resize: 'vertical',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#17a2b8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Agrega una descripción opcional para esta carpeta..."
              />
            </div>
            
            {/* Selector de colores solo para super_admin */}
            {user && user.rol === 'super_admin' && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '8px', 
                  border: '2px solid #e0e0e0',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '10px', 
                    fontWeight: '600', 
                    color: '#17a2b8',
                    fontSize: '0.9rem'
                  }}>
                    <i className="fa fa-palette" style={{ marginRight: '8px', fontSize: '0.95rem' }}></i>
                    Colores Personalizados <span style={{ fontWeight: '400', fontSize: '0.8rem', color: '#666', marginLeft: '5px' }}>(Opcional)</span>
                </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>Color Primario</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={modalEditarCarpeta.color_primario || '#F2A900'}
                        onChange={(e) => {
                          const primario = e.target.value;
                          setModalEditarCarpeta({ 
                            ...modalEditarCarpeta, 
                            color_primario: primario,
                            color_secundario: modalEditarCarpeta.color_secundario || generarColorSecundario(primario)
                          });
                        }}
                        style={{
                            width: '45px',
                            height: '38px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <input
                        type="text"
                        value={modalEditarCarpeta.color_primario || ''}
                        onChange={(e) => {
                          const primario = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(primario) || primario === '') {
                            setModalEditarCarpeta({ 
                              ...modalEditarCarpeta, 
                              color_primario: primario,
                              color_secundario: modalEditarCarpeta.color_secundario || (primario ? generarColorSecundario(primario) : '')
                            });
                          }
                        }}
                        placeholder="#F2A900"
                        style={{
                          flex: 1,
                            padding: '8px 10px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#17a2b8';
                            e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#ddd';
                            e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                  <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>Color Secundario</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={modalEditarCarpeta.color_secundario || '#FFC947'}
                        onChange={(e) => setModalEditarCarpeta({ ...modalEditarCarpeta, color_secundario: e.target.value })}
                        style={{
                            width: '45px',
                            height: '38px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <input
                        type="text"
                        value={modalEditarCarpeta.color_secundario || ''}
                        onChange={(e) => {
                          const secundario = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(secundario) || secundario === '') {
                            setModalEditarCarpeta({ ...modalEditarCarpeta, color_secundario: secundario });
                          }
                        }}
                        placeholder="#FFC947"
                        style={{
                          flex: 1,
                            padding: '8px 10px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#17a2b8';
                            e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#ddd';
                            e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '10px',
                  paddingTop: '10px',
                    borderTop: '2px solid #e0e0e0'
                }}>
                  <button
                    onClick={() => {
                      const coloresAuto = obtenerColoresCarpeta(modalEditarCarpeta.nombre || 'Carpeta', modalEditarCarpeta.id);
                      setModalEditarCarpeta({ 
                        ...modalEditarCarpeta, 
                        color_primario: coloresAuto.primary,
                        color_secundario: coloresAuto.secondary
                      });
                    }}
                    style={{
                      padding: '6px 12px',
                        border: '2px solid #17a2b8',
                        borderRadius: '6px',
                      background: 'white',
                        color: '#17a2b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#17a2b8';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(10, 110, 189, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#17a2b8';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                    title="Usar color automático basado en el nombre"
                  >
                      <i className="fa fa-magic"></i>
                    Auto
                  </button>
                  <button
                    onClick={() => setModalEditarCarpeta({ ...modalEditarCarpeta, color_primario: '', color_secundario: '' })}
                    style={{
                      padding: '6px 12px',
                        border: '2px solid #dc3545',
                        borderRadius: '6px',
                      background: 'white',
                        color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#dc3545';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(220, 53, 69, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#dc3545';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                    title="Limpiar colores personalizados"
                  >
                      <i className="fa fa-eraser"></i>
                    Limpiar
                  </button>
                </div>
                {modalEditarCarpeta.color_primario && modalEditarCarpeta.color_secundario && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: `linear-gradient(135deg, ${modalEditarCarpeta.color_primario} 0%, ${modalEditarCarpeta.color_secundario} 100%)`,
                    borderRadius: '6px',
                    textAlign: 'center',
                    color: '#ffffff',
                    fontSize: '12px',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                  }}>
                      <i className="fa fa-eye" style={{ marginRight: '6px' }}></i>
                    Vista Previa
                  </div>
                )}
              </div>
            )}
            </div>
            
            {/* Footer con botones */}
            <div style={{ 
              padding: '1rem 1.5rem',
              borderTop: '2px solid #e9ecef',
              background: '#f8f9fa',
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => setModalEditarCarpeta(null)}
                style={{
                  padding: '10px 18px',
                  border: '2px solid #6c757d',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6c757d';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(108, 117, 125, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#6c757d';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEditarCarpeta}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #17a2b8 0%, #8B4513 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(10, 110, 189, 0.3)',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #8B4513 0%, #17a2b8 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(10, 110, 189, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #17a2b8 0%, #8B4513 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(10, 110, 189, 0.3)';
                }}
              >
                <i className="fa fa-save" style={{ marginRight: '6px' }}></i>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Invitar Usuario a Tarea */}
      {modalInvitarUsuarioTarea && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={() => setModalInvitarUsuarioTarea(null)}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            animation: 'slideUp 0.3s ease',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #17a2b8 100%)',
              padding: '1rem 1.5rem',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                <i className="fa fa-user-plus" style={{ marginRight: '8px' }}></i>
                Invitar Usuario a la Tarea
              </h3>
              <button
                onClick={() => setModalInvitarUsuarioTarea(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1
            }}>
              {usuariosAsignados && usuariosAsignados.length > 0 ? (
                <div>
                  <p style={{ marginBottom: '1rem', color: '#666', fontSize: '14px' }}>
                    Selecciona un usuario de la carpeta para invitarlo a esta tarea:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {usuariosAsignados
                      .filter(u => {
                        // Filtrar usuarios que ya están asignados a la tarea
                        const tarea = tareas.find(t => t.id === modalInvitarUsuarioTarea);
                        if (!tarea) return true;
                        if (tarea.asignados && tarea.asignados.some(a => a.usuario_id === u.usuario_id)) {
                          return false; // Ya está asignado
                        }
                        if (!tarea.asignados && tarea.asignado_a === u.usuario_id) {
                          return false; // Ya está asignado (legacy)
                        }
                        return true;
                      })
                      .map((usuario) => (
                        <button
                          key={usuario.usuario_id}
                          onClick={() => invitarUsuarioATarea(modalInvitarUsuarioTarea, usuario.usuario_id)}
                          style={{
                            padding: '12px',
                            border: '2px solid #e9ecef',
                            borderRadius: '8px',
                            background: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#17a2b8';
                            e.currentTarget.style.background = '#f0f7ff';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e9ecef';
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #17a2b8 0%, #17a2b8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '16px'
                          }}>
                            {usuario.usuario_nombre ? usuario.usuario_nombre.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#17a2b8', fontSize: '14px' }}>
                              {usuario.usuario_nombre || 'Usuario'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {usuario.usuario_email || ''}
                            </div>
                          </div>
                          <i className="fa fa-user-plus" style={{ color: '#17a2b8', fontSize: '18px' }}></i>
                        </button>
                      ))}
                  </div>
                  {usuariosAsignados.filter(u => {
                    const tarea = tareas.find(t => t.id === modalInvitarUsuarioTarea);
                    if (!tarea) return false;
                    if (tarea.asignados && tarea.asignados.some(a => a.usuario_id === u.usuario_id)) {
                      return false;
                    }
                    if (!tarea.asignados && tarea.asignado_a === u.usuario_id) {
                      return false;
                    }
                    return true;
                  }).length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#999'
                    }}>
                      <i className="fa fa-info-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
                      <p style={{ margin: 0 }}>
                        Todos los usuarios de la carpeta ya están asignados a esta tarea.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#999'
                }}>
                  <i className="fa fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
                  <p style={{ margin: 0 }}>
                    No hay usuarios asignados a esta carpeta.
                  </p>
                  <p style={{ marginTop: '0.5rem', fontSize: '13px' }}>
                    Primero debes asignar usuarios a la carpeta desde "Asignar Usuarios".
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '2px solid #e9ecef',
              background: '#f8f9fa',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setModalInvitarUsuarioTarea(null)}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #6c757d',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6c757d';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#6c757d';
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Usuarios */}
      {modalAsignarUsuario && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 50, 101, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white',
            padding: 0,
            borderRadius: '16px',
            width: '90%',
            maxWidth: '650px',
            maxHeight: '85vh',
            boxShadow: '0 20px 60px rgba(10, 50, 101, 0.3)',
            border: '2px solid #17a2b8',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header con gradiente */}
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)',
              padding: '1rem 1.5rem',
              color: 'white',
              boxShadow: '0 2px 10px rgba(10, 110, 189, 0.3)'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.2rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa fa-users" style={{ fontSize: '1.1rem' }}></i>
                Asignar Usuarios a "{modalAsignarUsuario.nombre}"
              </h2>
            </div>

            {/* Contenido scrollable */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
            {/* Usuarios ya asignados */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '0.95rem', 
                  marginBottom: '10px',
                  color: '#17a2b8',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <i className="fa fa-user-check" style={{ fontSize: '0.9rem' }}></i>
                  Usuarios Asignados
                </h3>
              {usuariosAsignados.length === 0 ? (
                  <div style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '8px',
                    border: '2px dashed #dee2e6'
                  }}>
                    <i className="fa fa-user-times" style={{ fontSize: '2rem', color: '#adb5bd', marginBottom: '8px' }}></i>
                    <p style={{ color: '#6c757d', fontSize: '13px', margin: 0, fontWeight: '500' }}>
                      No hay usuarios asignados
                    </p>
                  </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {usuariosAsignados.map((ua) => (
                    <div key={ua.usuario_id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        borderRadius: '8px',
                        border: '2px solid #e9ecef',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#17a2b8';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 110, 189, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e9ecef';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: '600', 
                            fontSize: '14px',
                            color: '#212529',
                            marginBottom: '4px'
                          }}>
                            {ua.usuario_nombre}
                        </div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '6px' }}>
                            <i className="fa fa-envelope" style={{ marginRight: '4px', fontSize: '0.85rem' }}></i>
                            {ua.usuario_email}
                          </div>
                          <div style={{ fontSize: '11px', color: '#495057', marginBottom: '4px' }}>
                            <i className="fa fa-user-tag" style={{ marginRight: '4px', fontSize: '0.85rem' }}></i>
                            {ua.usuario_rol}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            gap: '8px', 
                            flexWrap: 'wrap',
                            marginTop: '6px',
                            paddingTop: '6px',
                            borderTop: '1px solid #e9ecef'
                          }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '3px 6px',
                              borderRadius: '4px',
                              background: ua.puede_ver ? '#d4edda' : '#f8d7da',
                              color: ua.puede_ver ? '#155724' : '#721c24',
                              fontWeight: '600'
                            }}>
                              <i className={`fa fa-${ua.puede_ver ? 'check' : 'times'}`} style={{ marginRight: '2px', fontSize: '0.75rem' }}></i>
                              Ver
                            </span>
                            <span style={{
                              fontSize: '10px',
                              padding: '3px 6px',
                              borderRadius: '4px',
                              background: ua.puede_subir ? '#d4edda' : '#f8d7da',
                              color: ua.puede_subir ? '#155724' : '#721c24',
                              fontWeight: '600'
                            }}>
                              <i className={`fa fa-${ua.puede_subir ? 'check' : 'times'}`} style={{ marginRight: '2px', fontSize: '0.75rem' }}></i>
                              Subir
                            </span>
                            <span style={{
                              fontSize: '10px',
                              padding: '3px 6px',
                              borderRadius: '4px',
                              background: ua.puede_editar ? '#d4edda' : '#f8d7da',
                              color: ua.puede_editar ? '#155724' : '#721c24',
                              fontWeight: '600'
                            }}>
                              <i className={`fa fa-${ua.puede_editar ? 'check' : 'times'}`} style={{ marginRight: '2px', fontSize: '0.75rem' }}></i>
                              Editar
                            </span>
                            <span style={{
                              fontSize: '10px',
                              padding: '3px 6px',
                              borderRadius: '4px',
                              background: ua.puede_eliminar ? '#d4edda' : '#f8d7da',
                              color: ua.puede_eliminar ? '#155724' : '#721c24',
                              fontWeight: '600'
                            }}>
                              <i className={`fa fa-${ua.puede_eliminar ? 'check' : 'times'}`} style={{ marginRight: '2px', fontSize: '0.75rem' }}></i>
                              Eliminar
                            </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleQuitarUsuario(ua.usuario_id)}
                        style={{
                            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                          color: 'white',
                          border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                          cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            boxShadow: '0 2px 6px rgba(220, 53, 69, 0.3)',
                            transition: 'all 0.2s ease',
                            marginLeft: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, #c82333 0%, #dc3545 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 10px rgba(220, 53, 69, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 6px rgba(220, 53, 69, 0.3)';
                          }}
                        >
                          <i className="fa fa-times" style={{ marginRight: '4px' }}></i>
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agregar nuevo usuario */}
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '8px',
                border: '2px solid #e0e0e0'
              }}>
                <h3 style={{ 
                  fontSize: '0.95rem', 
                  marginBottom: '10px',
                  color: '#17a2b8',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <i className="fa fa-user-plus" style={{ fontSize: '0.9rem' }}></i>
                  Agregar Usuario
                </h3>
              <select
                id="select-usuario-asignar"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '12px',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#17a2b8';
                  e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Selecciona un usuario</option>
                {usuarios
                  .filter(u => {
                    // Filtrar usuarios ya asignados
                    if (usuariosAsignados.find(ua => ua.usuario_id === u.id)) {
                      return false;
                    }
                    // Si el usuario actual es admin, solo mostrar trabajadores
                    if (user && user.rol === 'admin' && u.rol !== 'trabajador') {
                      return false;
                    }
                    return true;
                  })
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.email}) - {u.rol}
                    </option>
                  ))}
              </select>
                <div style={{ 
                  marginBottom: '12px',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '2px solid #e0e0e0'
                }}>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#17a2b8',
                    fontWeight: '600',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    <i className="fa fa-key" style={{ marginRight: '4px' }}></i>
                    Permisos
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    >
                      <input 
                        type="checkbox" 
                        id="permiso-ver" 
                        defaultChecked
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: '#17a2b8'
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#212529', fontWeight: '500' }}>
                        <i className="fa fa-eye" style={{ marginRight: '5px', color: '#17a2b8', fontSize: '0.85rem' }}></i>
                        Puede ver
                      </span>
                </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    >
                      <input 
                        type="checkbox" 
                        id="permiso-subir"
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: '#17a2b8'
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#212529', fontWeight: '500' }}>
                        <i className="fa fa-upload" style={{ marginRight: '5px', color: '#17a2b8', fontSize: '0.85rem' }}></i>
                        Puede subir archivos
                      </span>
                </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    >
                      <input 
                        type="checkbox" 
                        id="permiso-editar"
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: '#17a2b8'
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#212529', fontWeight: '500' }}>
                        <i className="fa fa-edit" style={{ marginRight: '5px', color: '#17a2b8', fontSize: '0.85rem' }}></i>
                        Puede editar
                      </span>
                </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    >
                      <input 
                        type="checkbox" 
                        id="permiso-eliminar"
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: '#17a2b8'
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#212529', fontWeight: '500' }}>
                        <i className="fa fa-trash" style={{ marginRight: '5px', color: '#17a2b8', fontSize: '0.85rem' }}></i>
                        Puede eliminar
                      </span>
                </label>
                  </div>
              </div>
              <button
                onClick={() => {
                  const select = document.getElementById('select-usuario-asignar');
                  const usuarioId = select.value;
                  if (!usuarioId) {
                    alert('Selecciona un usuario');
                    return;
                  }
                  handleAsignarUsuario(parseInt(usuarioId), {
                    ver: document.getElementById('permiso-ver').checked,
                    subir: document.getElementById('permiso-subir').checked,
                    editar: document.getElementById('permiso-editar').checked,
                    eliminar: document.getElementById('permiso-eliminar').checked
                  });
                  select.value = '';
                  document.getElementById('permiso-ver').checked = true;
                  document.getElementById('permiso-subir').checked = false;
                  document.getElementById('permiso-editar').checked = false;
                  document.getElementById('permiso-eliminar').checked = false;
                }}
                style={{
                  width: '100%',
                    padding: '10px 18px',
                  border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #20c997 0%, #28a745 100%)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                  }}
                >
                  <i className="fa fa-user-plus" style={{ marginRight: '6px' }}></i>
                Asignar Usuario
              </button>
              </div>
            </div>

            {/* Footer con botón cerrar */}
            <div style={{ 
              padding: '1rem 1.5rem',
              borderTop: '2px solid #e9ecef',
              background: '#f8f9fa',
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => setModalAsignarUsuario(null)}
                style={{
                  padding: '10px 18px',
                  border: '2px solid #6c757d',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6c757d';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(108, 117, 125, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#6c757d';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <i className="fa fa-times" style={{ marginRight: '6px' }}></i>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Tarea */}
      {modalCrearTarea && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 50, 101, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white',
            padding: 0,
            borderRadius: '16px',
            width: '90%',
            maxWidth: '550px',
            boxShadow: '0 20px 60px rgba(10, 50, 101, 0.3)',
            border: '2px solid #17a2b8',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header con gradiente */}
            <div style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              padding: '1rem 1.5rem',
              color: 'white',
              boxShadow: '0 2px 10px rgba(40, 167, 69, 0.3)'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.2rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa fa-tasks" style={{ fontSize: '1.1rem' }}></i>
                Nueva Tarea
              </h2>
            </div>

            {/* Contenido del formulario */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontWeight: '600',
                  color: '#17a2b8',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Título <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  value={nuevaTarea.titulo}
                  onChange={(e) => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#17a2b8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Título de la tarea"
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontWeight: '600',
                  color: '#17a2b8',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Descripción
                </label>
                <textarea
                  value={nuevaTarea.descripcion}
                  onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '70px',
                    resize: 'vertical',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#17a2b8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Descripción de la tarea (opcional)"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontWeight: '600',
                    color: '#17a2b8',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Asignar a
                  </label>
                  <div style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '8px',
                    background: 'white'
                  }}>
                    {usuariosAsignados.length === 0 ? (
                      <div style={{ padding: '8px', color: '#999', fontSize: '14px', textAlign: 'center' }}>
                        No hay usuarios asignados a esta carpeta
                      </div>
                    ) : (
                      usuariosAsignados.map(u => (
                        <label
                          key={u.usuario_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            marginBottom: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            checked={nuevaTarea.asignados_a?.includes(u.usuario_id) || false}
                            onChange={(e) => {
                              const currentAsignados = nuevaTarea.asignados_a || [];
                              if (e.target.checked) {
                                setNuevaTarea({
                                  ...nuevaTarea,
                                  asignados_a: [...currentAsignados, u.usuario_id]
                                });
                              } else {
                                setNuevaTarea({
                                  ...nuevaTarea,
                                  asignados_a: currentAsignados.filter(id => id !== u.usuario_id)
                                });
                              }
                            }}
                            style={{
                              marginRight: '8px',
                              cursor: 'pointer',
                              width: '16px',
                              height: '16px'
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#333' }}>
                            {u.usuario_nombre} ({u.usuario_email})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {nuevaTarea.asignados_a && nuevaTarea.asignados_a.length > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#17a2b8' }}>
                      {nuevaTarea.asignados_a.length} {nuevaTarea.asignados_a.length === 1 ? 'usuario seleccionado' : 'usuarios seleccionados'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontWeight: '600',
                    color: '#17a2b8',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Prioridad
                  </label>
                  <select
                    value={nuevaTarea.prioridad}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, prioridad: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#17a2b8';
                      e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontWeight: '600',
                    color: '#17a2b8',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="datetime-local"
                    value={nuevaTarea.fecha_vencimiento}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, fecha_vencimiento: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#17a2b8';
                      e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontWeight: '600',
                    color: '#17a2b8',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Recordatorio
                  </label>
                  <input
                    type="datetime-local"
                    value={nuevaTarea.recordatorio_en}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, recordatorio_en: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#17a2b8';
                      e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Footer con botones */}
            <div style={{ 
              padding: '1rem 1.5rem',
              borderTop: '2px solid #e9ecef',
              background: '#f8f9fa',
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setModalCrearTarea(false);
                  setNuevaTarea({
                    titulo: '',
                    descripcion: '',
                    asignado_a: null,
                    fecha_vencimiento: '',
                    prioridad: 'media',
                    recordatorio_en: ''
                  });
                }}
                style={{
                  padding: '10px 18px',
                  border: '2px solid #6c757d',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6c757d';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(108, 117, 125, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#6c757d';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={crearTarea}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #20c997 0%, #28a745 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                }}
              >
                <i className="fa fa-plus" style={{ marginRight: '6px' }}></i>
                Crear Tarea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Progreso de Subida */}
      {uploadProgress && uploadProgress.visible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            minWidth: '400px',
            maxWidth: '600px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#17a2b8' }}>
              Subiendo archivos ({uploadProgress.completados}/{uploadProgress.total})
            </h3>
            
            {/* Barra de progreso general */}
            <div style={{
              width: '100%',
              height: '25px',
              background: '#e0e0e0',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{
                width: `${uploadProgress.progresoGeneral || 0}%`,
                height: '100%',
                background: '#28a745',
                transition: 'width 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {uploadProgress.progresoGeneral || 0}%
              </div>
            </div>
            
            {/* Lista de archivos */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {archivosSubiendo.map((archivo, idx) => (
                <div key={idx} style={{
                  marginBottom: '15px',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#17a2b8' }}>
                      {archivo.nombre}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: archivo.estado === 'completado' ? '#28a745' : 
                             archivo.estado === 'error' ? '#dc3545' : '#666'
                    }}>
                      {archivo.estado === 'completado' ? '✓ Completado' :
                       archivo.estado === 'error' ? '✗ Error' : 'Subiendo...'}
                    </span>
                  </div>
                  
                  {/* Barra de progreso individual */}
                  {archivo.estado === 'subiendo' && (
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${archivo.progreso}%`,
                        height: '100%',
                        background: '#17a2b8',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  )}
                  
                  {archivo.estado === 'error' && archivo.error && (
                    <div style={{
                      fontSize: '12px',
                      color: '#dc3545',
                      marginTop: '5px'
                    }}>
                      {archivo.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Botón cerrar (solo cuando todos estén completos) */}
            {uploadProgress.completados === uploadProgress.total && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setUploadProgress(null);
                    setArchivosSubiendo([]);
                    cargarArchivos(carpetaActual.id);
                  }}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    background: '#17a2b8',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Previsualizar Archivo */}
      {archivoPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: previewMaximizado ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: previewMaximizado ? '0' : '20px',
          transition: 'all 0.3s ease'
        }}
        onClick={() => {
          if (!previewMaximizado) {
            setArchivoPreview(null);
          }
        }}
        >
          <div style={{
            background: 'white',
            borderRadius: previewMaximizado ? '0' : '12px',
            padding: previewMaximizado ? '0' : '20px',
            maxWidth: previewMaximizado ? '100%' : '90%',
            maxHeight: previewMaximizado ? '100vh' : '90%',
            width: previewMaximizado ? '100%' : '100%',
            height: previewMaximizado ? '100vh' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: previewMaximizado ? 'none' : '0 10px 40px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '15px'
            }}>
              <h2 style={{ margin: 0, color: '#17a2b8', fontSize: '18px' }}>
                {archivoPreview.nombre_original}
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setPreviewMaximizado(!previewMaximizado)}
                  style={{
                    background: previewMaximizado ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  title={previewMaximizado ? 'Restaurar tamaño' : 'Maximizar'}
                >
                  <i className={`fa ${previewMaximizado ? 'fa-compress' : 'fa-expand'}`}></i>
                  {previewMaximizado ? 'Restaurar' : 'Maximizar'}
                </button>
                <button
                  onClick={() => {
                    // Construir URL correctamente (evitar duplicación de /api/)
                    let urlDescarga = archivoPreview.ruta_archivo;
                    if (!urlDescarga.startsWith('http')) {
                      if (urlDescarga.startsWith('/api/')) {
                        // En desarrollo, usar el servidor PHP directamente (no el proxy de React)
                        if (process.env.NODE_ENV === 'development') {
                          urlDescarga = 'http://localhost/rcritico' + urlDescarga;
                        } else {
                          const origin = window.location.origin;
                          urlDescarga = origin + urlDescarga;
                        }
                      } else {
                        urlDescarga = `${API_BASE}${urlDescarga.startsWith('/') ? '' : '/'}${urlDescarga}`;
                      }
                    }
                    window.open(urlDescarga, '_blank');
                  }}
                  style={{
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Descargar archivo"
                >
                  <i className="fa fa-download"></i> Descargar
                </button>
                <button
                  onClick={() => {
                    setArchivoPreview(null);
                    setPreviewMaximizado(false);
                  }}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa fa-times"></i> Cerrar
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              minHeight: previewMaximizado ? 'calc(100vh - 120px)' : '400px',
              height: previewMaximizado ? 'calc(100vh - 120px)' : 'auto',
              background: '#f8f9fa',
              borderRadius: previewMaximizado ? '0' : '8px',
              padding: previewMaximizado ? '10px' : '20px',
              transition: 'all 0.3s ease'
            }}>
              {(() => {
                const extension = archivoPreview.nombre_original.split('.').pop().toLowerCase();
                const tipoMime = archivoPreview.tipo_mime || '';
                
                // Construir URL correctamente (evitar duplicación de /api/)
                let urlArchivo = archivoPreview.ruta_archivo;
                if (!urlArchivo.startsWith('http')) {
                  // Si la ruta ya comienza con /api/, construir desde el servidor PHP directamente
                  if (urlArchivo.startsWith('/api/')) {
                    // En desarrollo, usar el servidor PHP directamente (no el proxy de React)
                    if (process.env.NODE_ENV === 'development') {
                      urlArchivo = 'http://localhost/rcritico' + urlArchivo;
                    } else {
                      const origin = window.location.origin;
                      urlArchivo = origin + urlArchivo;
                    }
                  } else {
                    urlArchivo = `${API_BASE}${urlArchivo.startsWith('/') ? '' : '/'}${urlArchivo}`;
                  }
                }
                
                // URL codificada para visores externos
                const urlArchivoCodificada = encodeURIComponent(urlArchivo);

                // PDF
                if (extension === 'pdf' || tipoMime.includes('pdf')) {
                  return (
                    <div style={{ 
                      width: '100%', 
                      height: previewMaximizado ? 'calc(100vh - 120px)' : '600px',
                      minHeight: previewMaximizado ? 'calc(100vh - 120px)' : '600px',
                      display: 'flex', 
                      flexDirection: 'column' 
                    }}>
                      {pdfLoading && (
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#f5f5f5',
                          borderRadius: '8px'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <i className="fa fa-spinner fa-spin" style={{ fontSize: '48px', color: '#17a2b8', marginBottom: '15px' }}></i>
                            <p style={{ color: '#666' }}>Cargando PDF...</p>
                          </div>
                        </div>
                      )}
                      
                      {pdfError && (
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#fff3cd',
                          borderRadius: '8px',
                          padding: '20px'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <i className="fa fa-exclamation-triangle" style={{ fontSize: '48px', color: '#856404', marginBottom: '15px' }}></i>
                            <p style={{ color: '#856404', marginBottom: '15px' }}>{pdfError}</p>
                            <button
                              onClick={() => pdfViewUrl && window.open(pdfViewUrl, '_blank')}
                              disabled={!pdfViewUrl}
                              style={{
                                padding: '10px 20px',
                                background: pdfViewUrl ? '#17a2b8' : '#9abec6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: pdfViewUrl ? 'pointer' : 'not-allowed'
                              }}
                            >
                              Abrir en nueva ventana
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {!pdfLoading && !pdfError && pdfPages.length > 0 && (
                        <div style={{ 
                          width: '100%',
                          height: previewMaximizado ? '100%' : 'auto',
                          maxHeight: previewMaximizado ? '100%' : '600px',
                          overflowY: 'auto', 
                          background: '#525252',
                          borderRadius: previewMaximizado ? '0' : '8px',
                          padding: previewMaximizado ? '20px' : '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: previewMaximizado ? '20px' : '15px'
                        }}>
                          {pdfPages.map(({ canvasData, pageNum, width, height }) => {
                            // Componente interno para manejar el ref del canvas
                            const CanvasContainer = ({ canvas, pageNum, width, height }) => {
                              const containerRef = React.useRef(null);
                              
                              React.useEffect(() => {
                                if (containerRef.current && canvas) {
                                  // Limpiar contenido previo
                                  containerRef.current.innerHTML = '';
                                  
                                  // Crear un nuevo canvas y copiar el contenido usando drawImage
                                  const newCanvas = document.createElement('canvas');
                                  newCanvas.width = canvas.width;
                                  newCanvas.height = canvas.height;
                                  const ctx = newCanvas.getContext('2d');
                                  
                                  // Copiar el contenido del canvas original al nuevo
                                  ctx.drawImage(canvas, 0, 0);
                                  
                                  containerRef.current.appendChild(newCanvas);
                                }
                                
                                // Cleanup
                                return () => {
                                  if (containerRef.current) {
                                    containerRef.current.innerHTML = '';
                                  }
                                };
                              }, [canvas]);
                              
                              return (
                                <div 
                                  ref={containerRef}
                                  style={{ 
                                    background: 'white', 
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                    marginBottom: '15px',
                                    display: 'inline-block'
                                  }}
                                />
                              );
                            };
                            
                            return <CanvasContainer key={pageNum} canvas={canvasData} pageNum={pageNum} width={width} height={height} />;
                          })}
                        </div>
                      )}
                      
                      {!pdfLoading && !pdfError && pdfPages.length > 0 && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#999', 
                          textAlign: 'center', 
                          marginTop: '8px',
                          padding: '5px',
                          background: '#f8f9fa',
                          borderRadius: '4px'
                        }}>
                          <div style={{ marginBottom: '3px' }}>
                            {pdfPages.length} {pdfPages.length === 1 ? 'página' : 'páginas'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Word Documents (.doc, .docx)
                if (['doc', 'docx'].includes(extension) || tipoMime.includes('word') || tipoMime.includes('document')) {
                  // Verificar si estamos en localhost (los visores externos no funcionan con localhost)
                  const isLocalhost = urlArchivo.includes('localhost') || urlArchivo.includes('127.0.0.1');
                  
                  return (
                    <div style={{ width: '100%', height: '600px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ 
                        padding: '10px', 
                        background: isLocalhost ? '#fff3cd' : '#e3f2fd', 
                        borderRadius: '5px',
                        fontSize: '14px',
                        color: isLocalhost ? '#856404' : '#FF8C00'
                      }}>
                        <i className="fa fa-file-word" style={{ marginRight: '8px' }}></i>
                        {isLocalhost 
                          ? 'Los visores externos no funcionan con localhost. Usa "Descargar" para abrir el archivo.'
                          : 'Previsualizando documento Word usando visor embebido'
                        }
                      </div>
                      {!isLocalhost && (
                        <iframe
                          src={`https://view.officeapps.live.com/op/embed.aspx?src=${urlArchivoCodificada}`}
                          style={{
                            width: '100%',
                            flex: 1,
                            border: 'none',
                            borderRadius: '8px',
                            minHeight: '500px'
                          }}
                          title={archivoPreview.nombre_original}
                        />
                      )}
                      {isLocalhost && (
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#f8f9fa',
                          borderRadius: '8px'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <i className="fa fa-file-word" style={{ fontSize: '64px', color: '#FF8C00', marginBottom: '20px' }}></i>
                            <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
                              {archivoPreview.nombre_original}
                            </div>
                            <div style={{ fontSize: '14px', color: '#999' }}>
                              Haz clic en "Descargar" para abrir el archivo
                            </div>
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                        Si el documento no se muestra, haz clic en "Descargar" para abrirlo en tu aplicación
                      </div>
                    </div>
                  );
                }

                // PowerPoint Presentations (.ppt, .pptx)
                if (['ppt', 'pptx'].includes(extension) || tipoMime.includes('presentation') || tipoMime.includes('powerpoint')) {
                  // Verificar si estamos en localhost (los visores externos no funcionan con localhost)
                  const isLocalhost = urlArchivo.includes('localhost') || urlArchivo.includes('127.0.0.1');
                  
                  return (
                    <div style={{ width: '100%', height: '600px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ 
                        padding: '10px', 
                        background: isLocalhost ? '#fff3cd' : '#fff3e0', 
                        borderRadius: '5px',
                        fontSize: '14px',
                        color: isLocalhost ? '#856404' : '#e65100'
                      }}>
                        <i className="fa fa-file-powerpoint" style={{ marginRight: '8px' }}></i>
                        {isLocalhost 
                          ? 'Los visores externos no funcionan con localhost. Usa "Descargar" para abrir el archivo.'
                          : 'Previsualizando presentación PowerPoint usando visor embebido'
                        }
                      </div>
                      {!isLocalhost && (
                        <iframe
                          src={`https://view.officeapps.live.com/op/embed.aspx?src=${urlArchivoCodificada}`}
                          style={{
                            width: '100%',
                            flex: 1,
                            border: 'none',
                            borderRadius: '8px',
                            minHeight: '500px'
                          }}
                          title={archivoPreview.nombre_original}
                        />
                      )}
                      {isLocalhost && (
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#f8f9fa',
                          borderRadius: '8px'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <i className="fa fa-file-powerpoint" style={{ fontSize: '64px', color: '#e65100', marginBottom: '20px' }}></i>
                            <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
                              {archivoPreview.nombre_original}
                            </div>
                            <div style={{ fontSize: '14px', color: '#999' }}>
                              Haz clic en "Descargar" para abrir el archivo
                            </div>
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                        Si la presentación no se muestra, haz clic en "Descargar" para abrirla en tu aplicación
                      </div>
                    </div>
                  );
                }

                // Imágenes
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension) || tipoMime.startsWith('image/')) {
                  return (
                    <img
                      src={urlArchivo}
                      alt={archivoPreview.nombre_original}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="text-align: center; color: #666;">No se puede previsualizar este tipo de imagen</div>';
                      }}
                    />
                  );
                }

                // Texto plano
                if (['txt', 'csv', 'log', 'json', 'xml', 'html', 'css', 'js'].includes(extension) || tipoMime.startsWith('text/')) {
                  return (
                    <iframe
                      src={urlArchivo}
                      style={{
                        width: '100%',
                        height: '600px',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'white'
                      }}
                      title={archivoPreview.nombre_original}
                    />
                  );
                }

                // Video
                if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension) || tipoMime.startsWith('video/')) {
                  return (
                    <video
                      controls
                      style={{
                        maxWidth: '100%',
                        maxHeight: '600px',
                        borderRadius: '8px'
                      }}
                    >
                      <source src={urlArchivo} type={tipoMime} />
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  );
                }

                // Audio
                if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension) || tipoMime.startsWith('audio/')) {
                  return (
                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <audio controls style={{ width: '100%', maxWidth: '500px' }}>
                        <source src={urlArchivo} type={tipoMime} />
                        Tu navegador no soporta la reproducción de audio.
                      </audio>
                    </div>
                  );
                }

                // Por defecto, mostrar información y opción de descarga
                return (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666'
                  }}>
                    <i className="fa fa-file" style={{ fontSize: '64px', color: '#17a2b8', marginBottom: '20px' }}></i>
                    <div style={{ fontSize: '18px', marginBottom: '10px', color: '#17a2b8' }}>
                      No se puede previsualizar este tipo de archivo
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                      Tipo: {tipoMime || extension.toUpperCase()}
                    </div>
                    <button
                      onClick={() => {
                        window.open(urlArchivo, '_blank');
                      }}
                      style={{
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      <i className="fa fa-download"></i> Descargar para abrir
                    </button>
                  </div>
                );
              })()}
            </div>

            <div style={{
              marginTop: '15px',
              paddingTop: '15px',
              borderTop: '1px solid #e0e0e0',
              fontSize: '12px',
              color: '#666',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <div>
                <span><i className="fa fa-user"></i> {archivoPreview.subido_por_nombre}</span>
                <span style={{ marginLeft: '15px' }}>
                  <i className="fa fa-calendar"></i> {formatearFechaHora(archivoPreview.subido_en)}
                </span>
                {archivoPreview.tamaño && (
                  <span style={{ marginLeft: '15px' }}>
                    <i className="fa fa-hdd"></i> {(archivoPreview.tamaño / 1024).toFixed(2)} KB
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Participantes */}
      {modalVerParticipantes && carpetaActual && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 50, 101, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setModalVerParticipantes(false);
          }
        }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to { 
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
          <div style={{
            background: 'white',
            padding: 0,
            borderRadius: '16px',
            width: '90%',
            maxWidth: '600px',
            boxShadow: '0 20px 60px rgba(10, 50, 101, 0.3)',
            border: '2px solid #17a2b8',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header con gradiente */}
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)',
              padding: '1rem 1.5rem',
              color: 'white',
              boxShadow: '0 2px 10px rgba(10, 110, 189, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.2rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa fa-users" style={{ fontSize: '1.1rem' }}></i>
                Participantes de "{carpetaActual.nombre}"
              </h2>
              <button
                onClick={() => setModalVerParticipantes(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Cerrar"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            {/* Contenido scrollable */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {cargandoParticipantes ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#666'
                }}>
                  <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#17a2b8' }}></i>
                  <div>Cargando participantes...</div>
                </div>
              ) : participantesCarpeta.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#666'
                }}>
                  <i className="fa fa-users" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ccc' }}></i>
                  <div style={{ fontSize: '1rem', fontWeight: '500', color: '#999' }}>
                    No hay participantes asignados a esta carpeta
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {participantesCarpeta.map((participante) => (
                    <div
                      key={participante.id}
                      style={{
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e9ecef';
                        e.currentTarget.style.borderColor = '#17a2b8';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 110, 189, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '45px',
                          height: '45px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.2rem',
                          fontWeight: '600',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(10, 110, 189, 0.3)'
                        }}>
                          {participante.usuario_nombre ? participante.usuario_nombre.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#17a2b8',
                            fontSize: '15px',
                            marginBottom: '4px'
                          }}>
                            {participante.usuario_nombre || 'Usuario sin nombre'}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#666',
                            marginBottom: '2px'
                          }}>
                            <i className="fa fa-envelope" style={{ marginRight: '6px', color: '#17a2b8' }}></i>
                            {participante.usuario_email || 'Sin email'}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#999',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '6px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              background: '#e9ecef',
                              color: '#495057',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              <i className="fa fa-user-tag" style={{ marginRight: '4px' }}></i>
                              {participante.usuario_rol || 'Sin rol'}
                            </span>
                            {participante.asignador_nombre && (
                              <span style={{
                                fontSize: '11px',
                                color: '#6c757d'
                              }}>
                                Asignado por: {participante.asignador_nombre}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Permisos */}
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e0e0e0',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        {participante.puede_ver && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#d4edda',
                            color: '#155724',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fa fa-eye"></i>
                            Ver
                          </span>
                        )}
                        {participante.puede_subir && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#d1ecf1',
                            color: '#0c5460',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fa fa-upload"></i>
                            Subir
                          </span>
                        )}
                        {participante.puede_editar && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#fff3cd',
                            color: '#856404',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fa fa-edit"></i>
                            Editar
                          </span>
                        )}
                        {participante.puede_eliminar && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#f8d7da',
                            color: '#721c24',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fa fa-trash"></i>
                            Eliminar
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer con botón cerrar */}
            <div style={{ 
              padding: '1rem 1.5rem',
              borderTop: '2px solid #e9ecef',
              background: '#f8f9fa',
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '13px',
                color: '#666',
                fontWeight: '500'
              }}>
                {participantesCarpeta.length > 0 && (
                  <span>
                    <i className="fa fa-users" style={{ marginRight: '6px', color: '#17a2b8' }}></i>
                    {participantesCarpeta.length} {participantesCarpeta.length === 1 ? 'participante' : 'participantes'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setModalVerParticipantes(false)}
                style={{
                  padding: '10px 18px',
                  border: '2px solid #6c757d',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6c757d';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(108, 117, 125, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#6c757d';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <i className="fa fa-times" style={{ marginRight: '6px' }}></i>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validación/Observaciones */}
      {modalValidacionObservacion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 50, 101, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setModalValidacionObservacion(null);
          }
        }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to { 
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
          <div style={{
            background: 'white',
            padding: 0,
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(10, 50, 101, 0.3)',
            border: '2px solid #17a2b8',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #FF8C00 100%)',
              padding: '1rem 1.5rem',
              color: 'white',
              boxShadow: '0 2px 10px rgba(10, 110, 189, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.2rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa fa-check-circle" style={{ fontSize: '1.1rem' }}></i>
                Validación/Observaciones
              </h2>
              <button
                onClick={() => setModalValidacionObservacion(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Cerrar"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            {/* Contenido */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Selección de Estado */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Estado:
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => {
                      const currentItem = modalValidacionObservacion.tipo === 'preventivo' 
                        ? lineaBase[modalValidacionObservacion.itemIndex]
                        : lineaBaseMitigadores[modalValidacionObservacion.itemIndex];
                      const nuevoEstado = currentItem.estado_validacion === 'validado' ? null : 'validado';
                      // Calcular ponderación: 100% si validado, 0% si null
                      const nuevaPonderacion = nuevoEstado === 'validado' ? 100 : 0;
                      
                      if (modalValidacionObservacion.tipo === 'preventivo') {
                        const nuevaLineaBase = [...lineaBase];
                        nuevaLineaBase[modalValidacionObservacion.itemIndex] = {
                          ...nuevaLineaBase[modalValidacionObservacion.itemIndex],
                          estado_validacion: nuevoEstado,
                          comentario_validacion: nuevoEstado === null ? '' : nuevaLineaBase[modalValidacionObservacion.itemIndex].comentario_validacion || '',
                          usuario_validacion: nuevoEstado ? obtenerUltimoUsuarioEditoString(user) : '',
                          fecha_validacion: nuevoEstado ? new Date().toISOString().slice(0, 19).replace('T', ' ') : '',
                          ponderacion: nuevaPonderacion
                        };
                        setLineaBase(nuevaLineaBase);
                        setModalValidacionObservacion({ ...modalValidacionObservacion, item: nuevaLineaBase[modalValidacionObservacion.itemIndex] });
                      } else {
                        const nuevaLineaBase = [...lineaBaseMitigadores];
                        nuevaLineaBase[modalValidacionObservacion.itemIndex] = {
                          ...nuevaLineaBase[modalValidacionObservacion.itemIndex],
                          estado_validacion: nuevoEstado,
                          comentario_validacion: nuevoEstado === null ? '' : nuevaLineaBase[modalValidacionObservacion.itemIndex].comentario_validacion || '',
                          usuario_validacion: nuevoEstado ? obtenerUltimoUsuarioEditoString(user) : '',
                          fecha_validacion: nuevoEstado ? new Date().toISOString().slice(0, 19).replace('T', ' ') : '',
                          ponderacion: nuevaPonderacion
                        };
                        setLineaBaseMitigadores(nuevaLineaBase);
                        setModalValidacionObservacion({ ...modalValidacionObservacion, item: nuevaLineaBase[modalValidacionObservacion.itemIndex] });
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      background: modalValidacionObservacion.item.estado_validacion === 'validado' ? '#28a745' : 'white',
                      color: modalValidacionObservacion.item.estado_validacion === 'validado' ? 'white' : '#28a745',
                      borderColor: '#28a745'
                    }}
                    onMouseEnter={(e) => {
                      if (modalValidacionObservacion.item.estado_validacion !== 'validado') {
                        e.currentTarget.style.background = '#d4edda';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (modalValidacionObservacion.item.estado_validacion !== 'validado') {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <i className={`fa fa-${modalValidacionObservacion.item.estado_validacion === 'validado' ? 'check-circle' : 'circle'}`}></i>
                    Validado
                  </button>
                  <button
                    onClick={() => {
                      const currentItem = modalValidacionObservacion.tipo === 'preventivo' 
                        ? lineaBase[modalValidacionObservacion.itemIndex]
                        : lineaBaseMitigadores[modalValidacionObservacion.itemIndex];
                      const nuevoEstado = currentItem.estado_validacion === 'con_observaciones' ? null : 'con_observaciones';
                      // Calcular ponderación: 0% si observaciones o null
                      const nuevaPonderacion = 0;
                      
                      if (modalValidacionObservacion.tipo === 'preventivo') {
                        const nuevaLineaBase = [...lineaBase];
                        nuevaLineaBase[modalValidacionObservacion.itemIndex] = {
                          ...nuevaLineaBase[modalValidacionObservacion.itemIndex],
                          estado_validacion: nuevoEstado,
                          comentario_validacion: nuevoEstado === null ? '' : nuevaLineaBase[modalValidacionObservacion.itemIndex].comentario_validacion || '',
                          usuario_validacion: nuevoEstado ? obtenerUltimoUsuarioEditoString(user) : '',
                          fecha_validacion: nuevoEstado ? new Date().toISOString().slice(0, 19).replace('T', ' ') : '',
                          ponderacion: nuevaPonderacion
                        };
                        setLineaBase(nuevaLineaBase);
                        setModalValidacionObservacion({ ...modalValidacionObservacion, item: nuevaLineaBase[modalValidacionObservacion.itemIndex] });
                      } else {
                        const nuevaLineaBase = [...lineaBaseMitigadores];
                        nuevaLineaBase[modalValidacionObservacion.itemIndex] = {
                          ...nuevaLineaBase[modalValidacionObservacion.itemIndex],
                          estado_validacion: nuevoEstado,
                          comentario_validacion: nuevoEstado === null ? '' : nuevaLineaBase[modalValidacionObservacion.itemIndex].comentario_validacion || '',
                          usuario_validacion: nuevoEstado ? obtenerUltimoUsuarioEditoString(user) : '',
                          fecha_validacion: nuevoEstado ? new Date().toISOString().slice(0, 19).replace('T', ' ') : '',
                          ponderacion: nuevaPonderacion
                        };
                        setLineaBaseMitigadores(nuevaLineaBase);
                        setModalValidacionObservacion({ ...modalValidacionObservacion, item: nuevaLineaBase[modalValidacionObservacion.itemIndex] });
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      background: modalValidacionObservacion.item.estado_validacion === 'con_observaciones' ? '#ffc107' : 'white',
                      color: modalValidacionObservacion.item.estado_validacion === 'con_observaciones' ? '#856404' : '#ffc107',
                      borderColor: '#ffc107'
                    }}
                    onMouseEnter={(e) => {
                      if (modalValidacionObservacion.item.estado_validacion !== 'con_observaciones') {
                        e.currentTarget.style.background = '#fff3cd';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (modalValidacionObservacion.item.estado_validacion !== 'con_observaciones') {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <i className={`fa fa-${modalValidacionObservacion.item.estado_validacion === 'con_observaciones' ? 'exclamation-triangle' : 'exclamation-circle'}`}></i>
                    Con Observaciones
                  </button>
                </div>
              </div>

              {/* Comentarios (solo si tiene observaciones) */}
              {modalValidacionObservacion.item.estado_validacion === 'con_observaciones' && (
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '14px'
                  }}>
                    Comentarios de Observaciones:
                  </label>
                  <textarea
                    value={modalValidacionObservacion.item.comentario_validacion || ''}
                    onChange={(e) => {
                      if (modalValidacionObservacion.tipo === 'preventivo') {
                        const nuevaLineaBase = [...lineaBase];
                        nuevaLineaBase[modalValidacionObservacion.itemIndex] = {
                          ...nuevaLineaBase[modalValidacionObservacion.itemIndex],
                          comentario_validacion: e.target.value
                        };
                        setLineaBase(nuevaLineaBase);
                        setModalValidacionObservacion({ ...modalValidacionObservacion, item: nuevaLineaBase[modalValidacionObservacion.itemIndex] });
                      } else {
                        const nuevaLineaBase = [...lineaBaseMitigadores];
                        nuevaLineaBase[modalValidacionObservacion.itemIndex] = {
                          ...nuevaLineaBase[modalValidacionObservacion.itemIndex],
                          comentario_validacion: e.target.value
                        };
                        setLineaBaseMitigadores(nuevaLineaBase);
                        setModalValidacionObservacion({ ...modalValidacionObservacion, item: nuevaLineaBase[modalValidacionObservacion.itemIndex] });
                      }
                    }}
                    placeholder="Ingrese los comentarios de las observaciones..."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #ced4da',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}

              {/* Mostrar comentarios existentes si hay observaciones */}
              {modalValidacionObservacion.item.estado_validacion === 'con_observaciones' && modalValidacionObservacion.item.comentario_validacion && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#fff3cd',
                  borderRadius: '8px',
                  border: '1px solid #ffc107'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#856404',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    <i className="fa fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                    Comentarios Actuales:
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#856404',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {modalValidacionObservacion.item.comentario_validacion}
                  </div>
                  {modalValidacionObservacion.item.usuario_validacion && (
                    <div style={{
                      fontSize: '11px',
                      color: '#856404',
                      marginTop: '0.5rem',
                      fontStyle: 'italic'
                    }}>
                      Por: {modalValidacionObservacion.item.usuario_validacion.split('|')[0]} - {modalValidacionObservacion.item.fecha_validacion ? new Date(modalValidacionObservacion.item.fecha_validacion).toLocaleString('es-CL') : ''}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ 
              padding: '1rem 1.5rem',
              borderTop: '2px solid #e9ecef',
              background: '#f8f9fa',
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setModalValidacionObservacion(null)}
                style={{
                  padding: '10px 18px',
                  border: '2px solid #6c757d',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6c757d';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(108, 117, 125, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#6c757d';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <i className="fa fa-times" style={{ marginRight: '6px' }}></i>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito - Eliminación de Carpeta (Compacto) */}
      {modalEliminacionExito && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={() => setModalEliminacionExito(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '0',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease-out',
              border: '1px solid #e5e7eb'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header compacto */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'white'
            }}>
              {/* Icono de éxito compacto */}
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                <i className="fa fa-check-circle" style={{ color: 'white' }}></i>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: '0',
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '1.3'
                }}>
                  Carpeta eliminada exitosamente
                </h3>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  opacity: 0.95,
                  fontWeight: '400'
                }}>
                  {modalEliminacionExito.nombre}
                </p>
              </div>
            </div>

            {/* Contenido compacto */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              {/* Estadísticas en línea */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                justifyContent: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 1rem',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}>
                  <i className="fa fa-file" style={{ color: '#3b82f6', fontSize: '14px' }}></i>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e40af'
                  }}>
                    {modalEliminacionExito.archivos} archivo{modalEliminacionExito.archivos !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 1rem',
                  background: '#fff7ed',
                  borderRadius: '8px',
                  border: '1px solid #fed7aa'
                }}>
                  <i className="fa fa-folder" style={{ color: '#f59e0b', fontSize: '14px' }}></i>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#92400e'
                  }}>
                    {modalEliminacionExito.subcarpetas} subcarpeta{modalEliminacionExito.subcarpetas !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Botón de aceptar compacto */}
              <button
                onClick={() => setModalEliminacionExito(null)}
                style={{
                  width: '100%',
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <i className="fa fa-check" style={{ fontSize: '12px' }}></i>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sistema de Notificaciones Toast */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {notificaciones.map((notificacion) => {
          const colores = {
            success: { bg: '#10b981', icon: 'fa-check-circle', border: '#059669' },
            error: { bg: '#ef4444', icon: 'fa-exclamation-circle', border: '#dc2626' },
            warning: { bg: '#f59e0b', icon: 'fa-exclamation-triangle', border: '#d97706' },
            info: { bg: '#3b82f6', icon: 'fa-info-circle', border: '#2563eb' }
          };
          
          const color = colores[notificacion.tipo] || colores.success;
          
          return (
            <div
              key={notificacion.id}
              style={{
                background: color.bg,
                color: 'white',
                padding: '14px 18px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                minWidth: '300px',
                maxWidth: '450px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                pointerEvents: 'auto',
                animation: 'slideInRight 0.3s ease-out',
                borderLeft: `4px solid ${color.border}`,
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-4px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              <i 
                className={`fa ${color.icon}`} 
                style={{ 
                  fontSize: '20px', 
                  flexShrink: 0,
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                }}
              ></i>
              <div style={{ 
                flex: 1, 
                fontSize: '14px', 
                fontWeight: '500',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                {notificacion.mensaje}
              </div>
              <button
                onClick={() => setNotificaciones(prev => prev.filter(n => n.id !== notificacion.id))}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '4px',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
          );
        })}
      </div>

      {/* Estilos de animación para las notificaciones */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default GestorArchivos;

