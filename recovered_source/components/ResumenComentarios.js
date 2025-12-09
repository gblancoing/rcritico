import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const ResumenComentarios = ({ proyectoId, user, sidebarCollapsed, onNavigateToCarpeta }) => {
  const [resumen, setResumen] = useState({
    carpetas: [],
    tareas: [],
    mensajes: [] // Todos los mensajes individuales
  });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'carpetas', 'tareas', 'mensajes'
  const [filtroCarpeta, setFiltroCarpeta] = useState('todas'); // 'todas' o ID de carpeta específica
  const [carpetasDisponibles, setCarpetasDisponibles] = useState([]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(() => {
    // Por defecto: hace 3 meses (más amplio para ver más mensajes)
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 3);
    return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  });
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(() => {
    // Por defecto: hoy
    return new Date().toISOString().split('T')[0];
  });
  const [mostrarTodosMensajes, setMostrarTodosMensajes] = useState(false); // Si es true, no filtra por fecha

  useEffect(() => {
    if (proyectoId) {
      cargarResumenComentarios();
    }
  }, [proyectoId]);

  const cargarResumenComentarios = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las carpetas del proyecto
      const resCarpetas = await fetch(`${API_BASE}/archivos/carpetas.php?proyecto_id=${proyectoId}&todas=1&usuario_id=${user.id}`);
      const carpetasData = await resCarpetas.json();
      
      if (!Array.isArray(carpetasData)) {
        setResumen({ carpetas: [], tareas: [], mensajes: [] });
        setLoading(false);
        return;
      }

      const carpetasConComentarios = [];
      const tareasConComentarios = [];
      const todosLosMensajes = [];
      const carpetasMap = {}; // Para mapear carpeta_id a nombre

      // Guardar todas las carpetas para el filtro
      setCarpetasDisponibles(carpetasData);

      // Procesar cada carpeta
      for (const carpeta of carpetasData) {
        carpetasMap[carpeta.id] = carpeta.nombre;
        
        try {
          // Obtener mensajes del foro
          const resMensajes = await fetch(`${API_BASE}/archivos/carpeta_mensajes.php?carpeta_id=${carpeta.id}&usuario_id=${user.id}`);
          const mensajesData = await resMensajes.json();
          
          if (Array.isArray(mensajesData) && mensajesData.length > 0) {
            const cantidadMensajes = mensajesData.length;
            const ultimoMensaje = mensajesData[mensajesData.length - 1];
            
            carpetasConComentarios.push({
              carpeta_id: carpeta.id,
              carpeta_nombre: carpeta.nombre,
              cantidad_mensajes: cantidadMensajes,
              ultimo_mensaje: ultimoMensaje,
              carpeta: carpeta
            });

            // Agregar todos los mensajes individuales con información de carpeta
            mensajesData.forEach(mensaje => {
              todosLosMensajes.push({
                ...mensaje,
                carpeta_id: carpeta.id,
                carpeta_nombre: carpeta.nombre
              });
            });
          }

          // Obtener tareas con comentarios
          const resTareas = await fetch(`${API_BASE}/archivos/carpeta_tareas.php?carpeta_id=${carpeta.id}&usuario_id=${user.id}`);
          const tareasData = await resTareas.json();
          
          if (Array.isArray(tareasData)) {
            for (const tarea of tareasData) {
              // Obtener comentarios de la tarea
              try {
                const resComentarios = await fetch(`${API_BASE}/archivos/carpeta_tarea_comentarios.php?tarea_id=${tarea.id}`);
                const comentariosData = await resComentarios.json();
                
                if (Array.isArray(comentariosData) && comentariosData.length > 0) {
                  const cantidadComentarios = comentariosData.length;
                  const ultimoComentario = comentariosData[comentariosData.length - 1];
                  
                  tareasConComentarios.push({
                    tarea_id: tarea.id,
                    tarea_titulo: tarea.titulo,
                    carpeta_id: carpeta.id,
                    carpeta_nombre: carpeta.nombre,
                    cantidad_comentarios: cantidadComentarios,
                    ultimo_comentario: ultimoComentario,
                    tarea: tarea
                  });
                }
              } catch (error) {
                console.error(`Error cargando comentarios de tarea ${tarea.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error procesando carpeta ${carpeta.id}:`, error);
        }
      }

      // Ordenar por fecha del último comentario/mensaje (más reciente primero)
      carpetasConComentarios.sort((a, b) => {
        const fechaA = new Date(a.ultimo_mensaje?.creado_en || 0);
        const fechaB = new Date(b.ultimo_mensaje?.creado_en || 0);
        return fechaB - fechaA;
      });

      tareasConComentarios.sort((a, b) => {
        const fechaA = new Date(a.ultimo_comentario?.creado_en || 0);
        const fechaB = new Date(b.ultimo_comentario?.creado_en || 0);
        return fechaB - fechaA;
      });

      // Ordenar mensajes por fecha (más reciente primero)
      todosLosMensajes.sort((a, b) => {
        const fechaA = new Date(a.creado_en || 0);
        const fechaB = new Date(b.creado_en || 0);
        return fechaB - fechaA;
      });

      setResumen({
        carpetas: carpetasConComentarios,
        tareas: tareasConComentarios,
        mensajes: todosLosMensajes
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando resumen de comentarios:', error);
      setResumen({ carpetas: [], tareas: [], mensajes: [] });
      setLoading(false);
    }
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncarTexto = (texto, maxLength) => {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#0a6ebd' }}></i>
        <p>Cargando resumen de comentarios...</p>
      </div>
    );
  }

  const totalCarpetas = resumen.carpetas.length;
  const totalTareas = resumen.tareas.length;
  const totalMensajes = resumen.mensajes.length;

  // Filtrar mensajes por carpeta y fecha
  const mensajesFiltrados = resumen.mensajes.filter(m => {
    // Filtro por carpeta
    if (filtroCarpeta !== 'todas' && m.carpeta_id !== parseInt(filtroCarpeta)) {
      return false;
    }
    
    // Filtro por fecha (solo si no está en modo "mostrar todos")
    if (!mostrarTodosMensajes && m.creado_en) {
      const fechaMensaje = new Date(m.creado_en);
      const fechaDesde = new Date(filtroFechaDesde);
      fechaDesde.setHours(0, 0, 0, 0);
      const fechaHasta = new Date(filtroFechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      
      if (fechaMensaje < fechaDesde || fechaMensaje > fechaHasta) {
        return false;
      }
    } else if (!m.creado_en) {
      // Si no tiene fecha, excluirlo del filtro
      return false;
    }
    
    return true;
  });

  // Calcular total considerando solo mensajes visibles (filtrados)
  const totalMensajesVisibles = mensajesFiltrados.length;
  const total = totalCarpetas + totalTareas + totalMensajesVisibles;

  return (
    <div style={{
      padding: '1.25rem',
      background: '#ffffff',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '1.25rem',
        paddingBottom: '0.875rem',
        borderBottom: '2px solid #e9ecef',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          left: 0,
          width: '50px',
          height: '2px',
          background: 'linear-gradient(90deg, #0a6ebd 0%, #005288 100%)',
          borderRadius: '2px 2px 0 0'
        }}></div>
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '700',
          color: '#0a3265',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          letterSpacing: '-0.3px',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0a6ebd15 0%, #0a6ebd08 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #0a6ebd20'
          }}>
            <i className="fa fa-comments" style={{ color: '#0a6ebd', fontSize: '14px' }}></i>
          </div>
          Resumen de Comentarios
        </h1>
        
        {/* Filtros */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFiltro('todos')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '4px',
                border: 'none',
                background: filtro === 'todos' ? '#0a6ebd' : '#f8f9fa',
                color: filtro === 'todos' ? 'white' : '#495057',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: filtro === 'todos' ? '700' : '500',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
              }}
            >
              Todos ({total})
            </button>
            <button
              onClick={() => setFiltro('carpetas')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '4px',
                border: 'none',
                background: filtro === 'carpetas' ? '#0a6ebd' : '#f8f9fa',
                color: filtro === 'carpetas' ? 'white' : '#495057',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: filtro === 'carpetas' ? '700' : '500',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <i className="fa fa-folder" style={{ fontSize: '9px' }}></i>
              Carpetas ({totalCarpetas})
            </button>
            <button
              onClick={() => setFiltro('tareas')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '4px',
                border: 'none',
                background: filtro === 'tareas' ? '#0a6ebd' : '#f8f9fa',
                color: filtro === 'tareas' ? 'white' : '#495057',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: filtro === 'tareas' ? '700' : '500',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <i className="fa fa-tasks" style={{ fontSize: '9px' }}></i>
              Tareas ({totalTareas})
            </button>
            <button
              onClick={() => setFiltro('mensajes')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '4px',
                border: 'none',
                background: filtro === 'mensajes' ? '#0a6ebd' : '#f8f9fa',
                color: filtro === 'mensajes' ? 'white' : '#495057',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: filtro === 'mensajes' ? '700' : '500',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <i className="fa fa-envelope" style={{ fontSize: '9px' }}></i>
              Mensajes ({mensajesFiltrados.length}{mensajesFiltrados.length !== totalMensajes ? `/${totalMensajes}` : ''})
            </button>
          </div>
          
          {/* Filtros adicionales (solo visible cuando se muestran mensajes) */}
          {(filtro === 'mensajes' || filtro === 'todos') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Filtro por carpeta */}
              {carpetasDisponibles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '10px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Carpeta:
                  </label>
                  <select
                    value={filtroCarpeta}
                    onChange={(e) => setFiltroCarpeta(e.target.value)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef',
                      fontSize: '11px',
                      cursor: 'pointer',
                      minWidth: '160px',
                      background: 'white'
                    }}
                  >
                    <option value="todas">Todas</option>
                    {carpetasDisponibles.map(carpeta => (
                      <option key={carpeta.id} value={carpeta.id}>
                        {carpeta.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Filtro por fecha */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '10px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Período:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    value={filtroFechaDesde}
                    onChange={(e) => setFiltroFechaDesde(e.target.value)}
                    max={filtroFechaHasta}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef',
                      fontSize: '10px',
                      cursor: 'pointer',
                      background: 'white'
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#6c757d' }}>a</span>
                  <input
                    type="date"
                    value={filtroFechaHasta}
                    onChange={(e) => setFiltroFechaHasta(e.target.value)}
                    min={filtroFechaDesde}
                    max={new Date().toISOString().split('T')[0]}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef',
                      fontSize: '10px',
                      cursor: 'pointer',
                      background: 'white'
                    }}
                  />
                  <button
                    onClick={() => {
                      const fecha = new Date();
                      fecha.setMonth(fecha.getMonth() - 3);
                      setFiltroFechaDesde(fecha.toISOString().split('T')[0]);
                      setFiltroFechaHasta(new Date().toISOString().split('T')[0]);
                      setMostrarTodosMensajes(false);
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #0a6ebd',
                      background: mostrarTodosMensajes ? '#0a6ebd' : 'white',
                      color: mostrarTodosMensajes ? 'white' : '#0a6ebd',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    title="Últimos 3 meses"
                  >
                    3 meses
                  </button>
                  <button
                    onClick={() => setMostrarTodosMensajes(!mostrarTodosMensajes)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #6c757d',
                      background: mostrarTodosMensajes ? '#6c757d' : 'white',
                      color: mostrarTodosMensajes ? 'white' : '#6c757d',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Todos
                  </button>
                </div>
                {mensajesFiltrados.length < resumen.mensajes.length && !mostrarTodosMensajes && (
                  <div style={{ fontSize: '9px', color: '#ff9800', fontWeight: '500' }}>
                    ({resumen.mensajes.length - mensajesFiltrados.length} ocultos)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {/* Carpetas con comentarios */}
        {(filtro === 'todos' || filtro === 'carpetas') && resumen.carpetas.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #0a6ebd 0%, #005288 100%)',
              padding: '0.625rem 1rem',
              color: 'white',
              fontWeight: '700',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <i className="fa fa-folder" style={{ fontSize: '11px' }}></i>
              Carpetas con Mensajes ({resumen.carpetas.length})
            </div>
            <div style={{ padding: '0.75rem' }}>
              {resumen.carpetas.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.625rem',
                    borderBottom: idx < resumen.carpetas.length - 1 ? '1px solid #e9ecef' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderRadius: '4px',
                    marginBottom: idx < resumen.carpetas.length - 1 ? '0.375rem' : '0',
                    background: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                  onClick={() => {
                    if (onNavigateToCarpeta) {
                      sessionStorage.setItem('abrirForoCarpeta', item.carpeta_id);
                      onNavigateToCarpeta(item.carpeta_id, null);
                    } else {
                      window.location.hash = `#carpeta_${item.carpeta_id}`;
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        <i className="fa fa-folder" style={{ color: '#F2A900', fontSize: '12px' }}></i>
                        <h3 style={{ margin: 0, color: '#0a3265', fontSize: '12px', fontWeight: '600', flex: 1, minWidth: 0 }}>
                          {item.carpeta_nombre}
                        </h3>
                        <span style={{
                          background: '#0a6ebd',
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '10px',
                          fontSize: '9px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.cantidad_mensajes}
                        </span>
                      </div>
                      {item.ultimo_mensaje && (
                        <div style={{
                          background: '#f8f9fa',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          marginLeft: '18px',
                          border: '1px solid #e9ecef'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <div style={{ fontSize: '10px', color: '#495057', fontWeight: '600' }}>
                              {item.ultimo_mensaje.usuario_nombre || 'Usuario'}
                            </div>
                            <div style={{ fontSize: '9px', color: '#6c757d' }}>
                              {formatearFechaHora(item.ultimo_mensaje.creado_en)}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#495057', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {truncarTexto(item.ultimo_mensaje.mensaje, 120)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tareas con comentarios */}
        {(filtro === 'todos' || filtro === 'tareas') && resumen.tareas.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              padding: '0.625rem 1rem',
              color: 'white',
              fontWeight: '700',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <i className="fa fa-tasks" style={{ fontSize: '11px' }}></i>
              Tareas con Comentarios ({resumen.tareas.length})
            </div>
            <div style={{ padding: '0.75rem' }}>
              {resumen.tareas.map((item, idx) => {
                const colorEstado = item.tarea.estado === 'completada' ? 
                  (item.tarea.estado_validacion === 'validada' ? '#28a745' : 
                   item.tarea.estado_validacion === 'rechazada' ? '#dc3545' : '#ffc107') :
                  item.tarea.estado === 'en_progreso' ? '#0a6ebd' :
                  item.tarea.estado === 'cancelada' ? '#6c757d' : '#6c757d';

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.625rem',
                      borderBottom: idx < resumen.tareas.length - 1 ? '1px solid #e9ecef' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderRadius: '4px',
                      marginBottom: idx < resumen.tareas.length - 1 ? '0.375rem' : '0',
                      background: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    onClick={() => {
                      window.location.hash = `#carpeta_${item.carpeta_id}`;
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                          <i className="fa fa-tasks" style={{ color: '#28a745', fontSize: '12px' }}></i>
                          <h3 style={{ margin: 0, color: '#0a3265', fontSize: '12px', fontWeight: '600', flex: 1, minWidth: 0 }}>
                            {item.tarea_titulo}
                          </h3>
                          <span style={{
                            background: colorEstado,
                            color: 'white',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '8px',
                            fontSize: '8px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.tarea.estado === 'en_progreso' ? 'En Progreso' : 
                             item.tarea.estado === 'completada' ? 'Completada' : 
                             item.tarea.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                          </span>
                          <span style={{
                            background: '#0a6ebd',
                            color: 'white',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '10px',
                            fontSize: '9px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.cantidad_comentarios}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#6c757d', marginLeft: '18px', marginBottom: '0.375rem' }}>
                          <i className="fa fa-folder" style={{ marginRight: '3px', fontSize: '9px' }}></i>
                          {item.carpeta_nombre}
                        </div>
                        {item.ultimo_comentario && (
                          <div style={{
                            background: '#f8f9fa',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            marginLeft: '18px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <div style={{ fontSize: '10px', color: '#495057', fontWeight: '600' }}>
                                {item.ultimo_comentario.usuario_nombre || 'Usuario'}
                              </div>
                              <div style={{ fontSize: '9px', color: '#6c757d' }}>
                                {formatearFechaHora(item.ultimo_comentario.creado_en)}
                              </div>
                            </div>
                            <div style={{ fontSize: '11px', color: '#495057', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {truncarTexto(item.ultimo_comentario.comentario, 120)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mensajes por Revisar */}
        {(filtro === 'todos' || filtro === 'mensajes') && mensajesFiltrados.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
              padding: '0.625rem 1rem',
              color: 'white',
              fontWeight: '700',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa fa-envelope" style={{ fontSize: '11px' }}></i>
                <span>Mensajes por Revisar ({mensajesFiltrados.length})</span>
              </div>
              {mensajesFiltrados.length < resumen.mensajes.length && (
                <div style={{ fontSize: '9px', opacity: 0.9 }}>
                  {resumen.mensajes.length} totales
                </div>
              )}
            </div>
            <div style={{ padding: '0.75rem' }}>
              {mensajesFiltrados.map((mensaje, idx) => (
                <div
                  key={mensaje.id}
                  style={{
                    padding: '0.625rem',
                    borderBottom: idx < mensajesFiltrados.length - 1 ? '1px solid #e9ecef' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderRadius: '4px',
                    marginBottom: idx < mensajesFiltrados.length - 1 ? '0.375rem' : '0',
                    background: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.transform = 'translateX(2px)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    if (onNavigateToCarpeta) {
                      sessionStorage.setItem('mensajeIdToOpen', mensaje.id);
                      onNavigateToCarpeta(mensaje.carpeta_id, mensaje.id);
                    } else {
                      window.location.hash = `#carpeta_${mensaje.carpeta_id}`;
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        <i className="fa fa-comment" style={{ color: '#17a2b8', fontSize: '11px' }}></i>
                        <div style={{ fontSize: '10px', color: '#495057', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px', flex: 1, minWidth: 0 }}>
                          <i className="fa fa-folder" style={{ color: '#F2A900', fontSize: '9px' }}></i>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mensaje.carpeta_nombre}
                          </span>
                        </div>
                        {mensaje.mensaje_padre_id && (
                          <span style={{
                            background: '#6c757d',
                            color: 'white',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '8px',
                            fontSize: '8px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap'
                          }}>
                            Respuesta
                          </span>
                        )}
                      </div>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        marginLeft: '16px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <div style={{ fontSize: '10px', color: '#495057', fontWeight: '600' }}>
                            {mensaje.usuario_nombre || 'Usuario'}
                          </div>
                          <div style={{ fontSize: '9px', color: '#6c757d' }}>
                            {formatearFechaHora(mensaje.creado_en)}
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#495057', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {truncarTexto(mensaje.mensaje, 150)}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginLeft: '0.5rem', fontSize: '14px', color: '#17a2b8', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      <i className="fa fa-external-link-alt"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sin resultados */}
        {total === 0 && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            <i className="fa fa-comments" style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.3 }}></i>
            <p style={{ fontSize: '13px', margin: 0, fontWeight: '500' }}>
              No hay comentarios o mensajes en el proyecto.
            </p>
            <p style={{ fontSize: '11px', marginTop: '0.5rem', color: '#adb5bd' }}>
              Los comentarios y mensajes del foro aparecerán aquí cuando se creen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumenComentarios;

