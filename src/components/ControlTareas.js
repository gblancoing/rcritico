import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config';

const ControlTareas = ({ proyectoId, user, sidebarCollapsed, onNavigateToCarpeta }) => {
  const [tareas, setTareas] = useState([]);
  const [carpetas, setCarpetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [zoom, setZoom] = useState(1); // 1 = día, 2 = semana, 3 = mes
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const ganttRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (proyectoId) {
      cargarTareasProyecto();
      cargarCarpetasProyecto();
    }
  }, [proyectoId]);

  const cargarTareasProyecto = async () => {
    try {
      setLoading(true);
      // Obtener todas las carpetas del proyecto primero
      const resCarpetas = await fetch(`${API_BASE}/archivos/carpetas.php?proyecto_id=${proyectoId}&todas=1&usuario_id=${user.id}`);
      const carpetasData = await resCarpetas.json();
      
      if (!Array.isArray(carpetasData)) {
        setTareas([]);
        setLoading(false);
        return;
      }

      // Obtener tareas de todas las carpetas
      const todasLasTareas = [];
      for (const carpeta of carpetasData) {
        try {
          const resTareas = await fetch(`${API_BASE}/archivos/carpeta_tareas.php?carpeta_id=${carpeta.id}&usuario_id=${user.id}`);
          const tareasData = await resTareas.json();
          if (Array.isArray(tareasData)) {
            tareasData.forEach(tarea => {
              todasLasTareas.push({
                ...tarea,
                carpeta_nombre: carpeta.nombre,
                carpeta_id: carpeta.id
              });
            });
          }
        } catch (error) {
          console.error(`Error cargando tareas de carpeta ${carpeta.id}:`, error);
        }
      }

      setTareas(todasLasTareas);
      
      // Calcular fechas mínimas y máximas
      if (todasLasTareas.length > 0) {
        const fechas = todasLasTareas
          .map(t => [
            t.fecha_vencimiento ? new Date(t.fecha_vencimiento) : null,
            t.recordatorio_en ? new Date(t.recordatorio_en) : null,
            t.creado_en ? new Date(t.creado_en) : null
          ])
          .flat()
          .filter(f => f !== null);
        
        if (fechas.length > 0) {
          const minFecha = new Date(Math.min(...fechas.map(f => f.getTime())));
          const maxFecha = new Date(Math.max(...fechas.map(f => f.getTime())));
          minFecha.setDate(minFecha.getDate() - 7); // 7 días antes
          maxFecha.setDate(maxFecha.getDate() + 7); // 7 días después
          setFechaInicio(minFecha);
          setFechaFin(maxFecha);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setTareas([]);
      setLoading(false);
    }
  };

  const cargarCarpetasProyecto = async () => {
    try {
      const res = await fetch(`${API_BASE}/archivos/carpetas.php?proyecto_id=${proyectoId}&todas=1&usuario_id=${user.id}`);
      const data = await res.json();
      setCarpetas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      setCarpetas([]);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularPosicionX = (fecha) => {
    if (!fechaInicio || !fechaFin || !fecha) return 0;
    const fechaTarea = new Date(fecha);
    const totalDias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
    const diasDesdeInicio = Math.ceil((fechaTarea - fechaInicio) / (1000 * 60 * 60 * 24));
    const anchoDia = 100; // Ancho base por día
    return (diasDesdeInicio / totalDias) * (totalDias * anchoDia * zoom);
  };

  const calcularAnchoBarra = (fechaInicioTarea, fechaFinTarea) => {
    if (!fechaInicioTarea || !fechaFinTarea) return 50;
    const inicio = new Date(fechaInicioTarea);
    const fin = new Date(fechaFinTarea);
    const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return Math.max(50, dias * 100 * zoom);
  };

  const obtenerColorEstado = (estado, estadoValidacion) => {
    if (estado === 'completada') {
      if (estadoValidacion === 'validada') return '#28a745';
      if (estadoValidacion === 'rechazada') return '#dc3545';
      return '#ffc107'; // Pendiente validación
    }
    if (estado === 'en_progreso') return '#0a6ebd';
    if (estado === 'cancelada') return '#6c757d';
    return '#6c757d'; // pendiente
  };

  const obtenerColorPrioridad = (prioridad) => {
    const colores = {
      urgente: '#dc3545',
      alta: '#fd7e14',
      media: '#ffc107',
      baja: '#6c757d'
    };
    return colores[prioridad] || '#6c757d';
  };

  // Agrupar tareas por carpeta
  const tareasPorCarpeta = {};
  tareas.forEach(tarea => {
    const carpetaId = tarea.carpeta_id || 'sin_carpeta';
    if (!tareasPorCarpeta[carpetaId]) {
      tareasPorCarpeta[carpetaId] = {
        carpeta: carpetas.find(c => c.id === carpetaId) || { nombre: 'Sin Carpeta', id: carpetaId },
        tareas: []
      };
    }
    tareasPorCarpeta[carpetaId].tareas.push(tarea);
  });

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#0a6ebd' }}></i>
        <p>Cargando tareas del proyecto...</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.5rem',
      background: '#f8f9fa',
      minHeight: '100vh',
      marginTop: '51px'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#0a3265', fontSize: '24px', fontWeight: '600' }}>
            <i className="fa fa-tasks" style={{ marginRight: '10px' }}></i>
            Control de Tareas - Diagrama Gantt
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '14px' }}>
            Visualización tipo Primavera P6 de todas las tareas del proyecto
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#666', marginRight: '8px' }}>Zoom:</label>
          <select
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '2px solid #e9ecef',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="0.5">50%</option>
            <option value="1">100%</option>
            <option value="1.5">150%</option>
            <option value="2">200%</option>
          </select>
        </div>
      </div>

      {/* Contenedor Gantt */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Timeline Header */}
        <div
          ref={timelineRef}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#0a3265',
            color: 'white',
            padding: '1rem',
            overflowX: 'auto',
            borderBottom: '2px solid #F2A900'
          }}
        >
          {fechaInicio && fechaFin && (() => {
            const dias = [];
            const fechaActual = new Date(fechaInicio);
            while (fechaActual <= fechaFin) {
              dias.push(new Date(fechaActual));
              fechaActual.setDate(fechaActual.getDate() + 1);
            }
            return (
              <div style={{ display: 'flex', minWidth: `${dias.length * 100 * zoom}px` }}>
                {dias.map((dia, idx) => (
                  <div
                    key={idx}
                    style={{
                      minWidth: `${100 * zoom}px`,
                      textAlign: 'center',
                      borderRight: '1px solid rgba(255,255,255,0.2)',
                      padding: '4px'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: '600' }}>
                      {dia.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      {dia.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Lista de Tareas por Carpeta */}
        <div
          ref={ganttRef}
          style={{
            overflow: 'auto',
            maxHeight: 'calc(100vh - 250px)'
          }}
        >
          {Object.values(tareasPorCarpeta).map((grupo, grupoIdx) => (
            <div key={grupoIdx} style={{ borderBottom: '2px solid #e9ecef' }}>
              {/* Header de Carpeta */}
              <div style={{
                background: '#f8f9fa',
                padding: '0.75rem 1rem',
                fontWeight: '600',
                color: '#0a3265',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <i className="fa fa-folder" style={{ color: '#F2A900' }}></i>
                <span>{grupo.carpeta.nombre}</span>
                <span style={{ fontSize: '12px', color: '#666', fontWeight: '400' }}>
                  ({grupo.tareas.length} {grupo.tareas.length === 1 ? 'tarea' : 'tareas'})
                </span>
              </div>

              {/* Tareas de la Carpeta */}
              {grupo.tareas.map((tarea, tareaIdx) => {
                const fechaInicioTarea = tarea.fecha_vencimiento ? 
                  new Date(new Date(tarea.fecha_vencimiento).getTime() - 7 * 24 * 60 * 60 * 1000) : 
                  new Date(tarea.creado_en);
                const fechaFinTarea = tarea.fecha_vencimiento ? 
                  new Date(tarea.fecha_vencimiento) : 
                  new Date(new Date(tarea.creado_en).getTime() + 7 * 24 * 60 * 60 * 1000);
                
                const posX = calcularPosicionX(fechaInicioTarea);
                const ancho = calcularAnchoBarra(fechaInicioTarea, fechaFinTarea);
                const colorEstado = obtenerColorEstado(tarea.estado, tarea.estado_validacion);

                return (
                  <div
                    key={tarea.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '60px',
                      position: 'relative'
                    }}
                  >
                    {/* Información de la Tarea */}
                    <div 
                      style={{
                        minWidth: '300px',
                        maxWidth: '300px',
                        paddingRight: '1rem',
                        borderRight: '1px solid #e9ecef',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateToCarpeta) {
                          onNavigateToCarpeta(tarea.carpeta_id, tarea.id);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: obtenerColorPrioridad(tarea.prioridad)
                          }}
                        ></div>
                        <span style={{ fontWeight: '600', color: '#0a3265', fontSize: '14px' }}>
                          {tarea.titulo}
                        </span>
                        <i className="fa fa-external-link-alt" style={{ fontSize: '10px', color: '#0a6ebd', marginLeft: '4px' }}></i>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginLeft: '20px' }}>
                        <div>
                          <i className="fa fa-user" style={{ marginRight: '4px' }}></i>
                          {tarea.creador_nombre || 'Usuario'}
                        </div>
                        {tarea.asignados && tarea.asignados.length > 0 && (
                          <div>
                            <i className="fa fa-user-check" style={{ marginRight: '4px' }}></i>
                            {tarea.asignados.map(a => a.usuario_nombre).join(', ')}
                          </div>
                        )}
                        <div>
                          <span style={{
                            background: colorEstado,
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {tarea.estado === 'en_progreso' ? 'En Progreso' : 
                             tarea.estado === 'completada' ? 'Completada' : 
                             tarea.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                            {tarea.estado === 'completada' && tarea.estado_validacion === 'pendiente' && ' (Pend. Validación)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Barra Gantt */}
                    <div style={{
                      flex: 1,
                      position: 'relative',
                      height: '40px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      overflow: 'visible'
                    }}>
                      {fechaInicio && fechaFin && (
                        <>
                          {/* Barra de la tarea */}
                          <div
                            style={{
                              position: 'absolute',
                              left: `${posX}px`,
                              width: `${ancho}px`,
                              height: '32px',
                              background: colorEstado,
                              borderRadius: '4px',
                              top: '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 8px',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title={`${tarea.titulo}\n${formatearFecha(fechaInicioTarea)} - ${formatearFecha(fechaFinTarea)}\n\nClic para abrir la tarea`}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scaleY(1.1)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scaleY(1)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigateToCarpeta) {
                                onNavigateToCarpeta(tarea.carpeta_id, tarea.id);
                              }
                            }}
                          >
                            {ancho > 80 && (
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tarea.titulo.substring(0, Math.floor(ancho / 8))}
                              </span>
                            )}
                          </div>

                          {/* Marcador de fecha de vencimiento */}
                          {tarea.fecha_vencimiento && (
                            <div
                              style={{
                                position: 'absolute',
                                left: `${calcularPosicionX(new Date(tarea.fecha_vencimiento))}px`,
                                top: '0',
                                bottom: '0',
                                width: '2px',
                                background: '#dc3545',
                                zIndex: 5
                              }}
                              title={`Vence: ${formatearFechaHora(tarea.fecha_vencimiento)}`}
                            />
                          )}

                          {/* Marcador de recordatorio */}
                          {tarea.recordatorio_en && (
                            <div
                              style={{
                                position: 'absolute',
                                left: `${calcularPosicionX(new Date(tarea.recordatorio_en))}px`,
                                top: '0',
                                width: '0',
                                height: '0',
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '8px solid #ffc107',
                                zIndex: 5
                              }}
                              title={`Recordatorio: ${formatearFechaHora(tarea.recordatorio_en)}`}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {tareas.length === 0 && (
            <div style={{
              padding: '4rem',
              textAlign: 'center',
              color: '#999'
            }}>
              <i className="fa fa-tasks" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
              <p style={{ fontSize: '16px', margin: 0 }}>
                No hay tareas en el proyecto.
              </p>
              <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                Las tareas aparecerán aquí cuando se creen en las carpetas del proyecto.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        marginTop: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <strong style={{ color: '#0a3265', marginBottom: '0.5rem', display: 'block' }}>Estados:</strong>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '12px', background: '#6c757d', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '12px' }}>Pendiente</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '12px', background: '#0a6ebd', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '12px' }}>En Progreso</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '12px', background: '#28a745', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '12px' }}>Completada (Validada)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '12px', background: '#ffc107', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '12px' }}>Completada (Pend. Validación)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '12px', background: '#dc3545', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '12px' }}>Rechazada / Cancelada</span>
            </div>
          </div>
        </div>
        <div>
          <strong style={{ color: '#0a3265', marginBottom: '0.5rem', display: 'block' }}>Prioridades:</strong>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#dc3545' }}></div>
              <span style={{ fontSize: '12px' }}>Urgente</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fd7e14' }}></div>
              <span style={{ fontSize: '12px' }}>Alta</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffc107' }}></div>
              <span style={{ fontSize: '12px' }}>Media</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6c757d' }}></div>
              <span style={{ fontSize: '12px' }}>Baja</span>
            </div>
          </div>
        </div>
        <div>
          <strong style={{ color: '#0a3265', marginBottom: '0.5rem', display: 'block' }}>Marcadores:</strong>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '2px', height: '12px', background: '#dc3545' }}></div>
              <span style={{ fontSize: '12px' }}>Fecha Vencimiento</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #ffc107' }}></div>
              <span style={{ fontSize: '12px' }}>Recordatorio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlTareas;

