import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const Dashboard = ({ proyectoId, proyecto, user, sidebarCollapsed, onNavigateToCarpeta }) => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carpetasConPromedios, setCarpetasConPromedios] = useState([]);
  const [cargandoCarpetas, setCargandoCarpetas] = useState(true);
  const [promedioGeneral, setPromedioGeneral] = useState(null);
  const [carpetasExpandidas, setCarpetasExpandidas] = useState(new Set()); // IDs de carpetas expandidas

  useEffect(() => {
    if (proyectoId) {
      cargarKPIs();
      cargarCarpetasConPromedios();
    }
  }, [proyectoId, user]);

  const cargarCarpetasConPromedios = async () => {
    try {
      setCargandoCarpetas(true);
      const params = new URLSearchParams({
        proyecto_id: proyectoId
      });
      
      if (user && user.id) {
        params.append('usuario_id', user.id);
      }
      
      const res = await fetch(`${API_BASE}/dashboard/carpetas_con_promedios.php?${params}`);
      
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }
      
      const data = await res.json();
      // El backend ahora devuelve { carpetas: [...], promedio_general: ... }
      if (data.carpetas && Array.isArray(data.carpetas)) {
        setCarpetasConPromedios(data.carpetas);
        setPromedioGeneral(data.promedio_general);
      } else if (Array.isArray(data)) {
        // Compatibilidad con formato anterior
        setCarpetasConPromedios(data);
        setPromedioGeneral(null);
      } else {
        setCarpetasConPromedios([]);
        setPromedioGeneral(null);
      }
    } catch (err) {
      console.error('Error cargando carpetas con promedios:', err);
      setCarpetasConPromedios([]);
    } finally {
      setCargandoCarpetas(false);
    }
  };

  const cargarKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        proyecto_id: proyectoId
      });
      
      if (user && user.id) {
        params.append('usuario_id', user.id);
      }
      
      const res = await fetch(`${API_BASE}/dashboard/kpis.php?${params}`);
      
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }
      
      const data = await res.json();
      setKpis(data);
    } catch (err) {
      console.error('Error cargando KPIs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#666'
      }}>
        <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
        <p>Cargando indicadores del proyecto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#dc3545'
      }}>
        <i className="fa fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
        <p>Error al cargar los indicadores: {error}</p>
        <button
          onClick={cargarKPIs}
          style={{
            marginTop: '1rem',
            padding: '10px 20px',
            background: '#0a6ebd',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#666'
      }}>
        <p>No se pudieron cargar los indicadores.</p>
      </div>
    );
  }

  const tarjetaKPI = (titulo, valor, icono, color, subtitulo = null, tendencia = null) => (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
      borderRadius: '10px',
      padding: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      border: `1px solid #e9ecef`,
      borderLeft: `4px solid ${color}`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.1), 0 0 0 1px ${color}20`;
      e.currentTarget.style.borderLeftWidth = '5px';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)';
      e.currentTarget.style.borderLeftWidth = '4px';
    }}
    >
      {/* Fondo decorativo sutil */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
        borderRadius: '50%',
        zIndex: 0
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: 0,
              fontSize: '10px',
              color: '#6c757d',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: color,
                flexShrink: 0
              }}></div>
              {titulo}
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1.1',
              marginBottom: '0.35rem',
              letterSpacing: '-0.5px'
            }}>
              {valor}
            </div>
            {subtitulo && (
              <div style={{
                fontSize: '11px',
                color: '#6c757d',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="fa fa-circle" style={{ fontSize: '3px', color: color }}></i>
                {subtitulo}
              </div>
            )}
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            fontSize: '18px',
            flexShrink: 0,
            border: `1px solid ${color}20`,
            boxShadow: `inset 0 1px 2px ${color}10`
          }}>
            <i className={`fa ${icono}`}></i>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      padding: '1.25rem',
      background: '#ffffff',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e9ecef',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          left: 0,
          width: '60px',
          height: '2px',
          background: 'linear-gradient(90deg, #0a6ebd 0%, #005288 100%)',
          borderRadius: '2px 2px 0 0'
        }}></div>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: '#0a3265',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          letterSpacing: '-0.3px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0a6ebd15 0%, #0a6ebd08 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #0a6ebd20',
            flexShrink: 0
          }}>
            <i className="fa fa-chart-line" style={{ color: '#0a6ebd', fontSize: '16px' }}></i>
          </div>
          Dashboard del Proyecto
          {proyecto && (
            <>
              <span style={{ color: '#999', fontWeight: '400', fontSize: '16px' }}>•</span>
              <i className="fa fa-folder" style={{ color: '#F2A900', fontSize: '16px' }}></i>
              <span style={{ fontWeight: '600', fontSize: '18px' }}>{proyecto.nombre}</span>
              <span style={{ color: '#999', fontWeight: '400', fontSize: '14px' }}>ID: {proyecto.proyecto_id}</span>
              <span style={{ color: '#999', fontWeight: '400', fontSize: '14px' }}>Región: {proyecto.region_id}</span>
              {proyecto.descripcion && (
                <>
                  <span style={{ color: '#999', fontWeight: '400', fontSize: '16px' }}>•</span>
                  <span style={{ color: '#666', fontWeight: '400', fontSize: '14px' }}>{proyecto.descripcion}</span>
                </>
              )}
            </>
          )}
        </h1>
      </div>

      {/* KPIs Principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: sidebarCollapsed ? 'repeat(auto-fit, minmax(160px, 1fr))' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {tarjetaKPI(
          'Total de Carpetas',
          kpis.total_carpetas || 0,
          'fa-folder',
          '#0a6ebd',
          `${kpis.carpetas_activas || 0} activas`
        )}
        {tarjetaKPI(
          'Total de Archivos',
          kpis.total_archivos || 0,
          'fa-file',
          '#28a745',
          `${kpis.archivos_recientes || 0} subidos este mes`
        )}
        {tarjetaKPI(
          'Tareas Activas',
          kpis.tareas_activas || 0,
          'fa-tasks',
          '#ffc107',
          `${kpis.tareas_completadas || 0} completadas`
        )}
        {tarjetaKPI(
          'Tareas Vencidas',
          kpis.tareas_vencidas || 0,
          'fa-exclamation-triangle',
          '#dc3545',
          'Requieren atención'
        )}
        {tarjetaKPI(
          'Mensajes del Foro',
          kpis.total_mensajes || 0,
          'fa-comments',
          '#17a2b8',
          `${kpis.mensajes_recientes || 0} este mes`
        )}
        {tarjetaKPI(
          'Usuarios Activos',
          kpis.usuarios_activos || 0,
          'fa-users',
          '#6f42c1',
          `${kpis.total_usuarios || 0} totales`
        )}
      </div>

      {/* Carpetas con Promedios de Ponderación */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        borderRadius: '10px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #e9ecef',
        marginTop: '1.5rem',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)';
      }}
      >
        <h3 style={{
          margin: '0 0 1.25rem 0',
          fontSize: '12px',
          fontWeight: '700',
          color: '#0a3265',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #28a74515 0%, #28a74508 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #28a74520'
          }}>
            <i className="fa fa-percent" style={{ color: '#28a745', fontSize: '11px' }}></i>
          </div>
          Promedios de Ponderación por Carpeta
          {promedioGeneral !== null && promedioGeneral !== undefined && (
            <span style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: promedioGeneral >= 80 ? '#e8f5e9' : promedioGeneral >= 50 ? '#fff9c4' : '#ffebee',
              color: promedioGeneral >= 80 ? '#2e7d32' : promedioGeneral >= 50 ? '#f57f17' : '#c62828',
              fontWeight: '700',
              fontSize: '13px',
              minWidth: '80px',
              justifyContent: 'center'
            }}>
              <i className="fa fa-chart-line" style={{ fontSize: '10px' }}></i>
              Avance General: {typeof promedioGeneral === 'number' ? promedioGeneral.toFixed(2) : '0.00'}%
            </span>
          )}
        </h3>
        
        {cargandoCarpetas ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <i className="fa fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
            <p style={{ fontSize: '12px' }}>Cargando promedios...</p>
          </div>
        ) : carpetasConPromedios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999', fontSize: '12px' }}>
            No hay carpetas con promedios de ponderación disponibles.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '1rem'
          }}>
            {carpetasConPromedios.map((carpeta) => {
              const estaExpandida = carpetasExpandidas.has(carpeta.id);
              const tieneSubcarpetas = carpeta.subcarpetas && carpeta.subcarpetas.length > 0;
              
              return (
              <div key={carpeta.id} style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e9ecef',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#0a6ebd30';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = '#e9ecef';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: tieneSubcarpetas && estaExpandida ? '0.75rem' : '0'
                }}>
                  <div 
                    style={{ 
                      flex: 1,
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      // Si hay subcarpetas y se hace clic en el chevron, expandir/colapsar
                      // Si se hace clic en otra parte, navegar a la carpeta
                      const target = e.target;
                      const clickedChevron = target.classList.contains('fa-chevron-right') || 
                                           target.classList.contains('fa-chevron-down') ||
                                           (target.parentElement && (
                                             target.parentElement.classList.contains('fa-chevron-right') ||
                                             target.parentElement.classList.contains('fa-chevron-down')
                                           ));
                      
                      if (tieneSubcarpetas && clickedChevron) {
                        e.stopPropagation();
                        setCarpetasExpandidas(prev => {
                          const nuevo = new Set(prev);
                          if (nuevo.has(carpeta.id)) {
                            nuevo.delete(carpeta.id);
                          } else {
                            nuevo.add(carpeta.id);
                          }
                          return nuevo;
                        });
                      } else if (onNavigateToCarpeta) {
                        // Navegar a la carpeta (nivel 1)
                        onNavigateToCarpeta(carpeta.id);
                      }
                    }}
                  >
                    <h4 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#0a3265',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      {tieneSubcarpetas && (
                        <i 
                          className={`fa fa-chevron-${estaExpandida ? 'down' : 'right'}`} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarpetasExpandidas(prev => {
                              const nuevo = new Set(prev);
                              if (nuevo.has(carpeta.id)) {
                                nuevo.delete(carpeta.id);
                              } else {
                                nuevo.add(carpeta.id);
                              }
                              return nuevo;
                            });
                          }}
                          style={{ 
                            color: '#0a6ebd', 
                            fontSize: '10px',
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        ></i>
                      )}
                      <i className="fa fa-folder" style={{ color: '#0a6ebd', fontSize: '12px' }}></i>
                      {carpeta.nombre}
                    </h4>
                    {carpeta.descripcion && (
                      <p style={{
                        margin: 0,
                        fontSize: '11px',
                        color: '#6c757d',
                        marginTop: '2px'
                      }}>
                        {carpeta.descripcion}
                      </p>
                    )}
                  </div>
                  {carpeta.promedio_ponderacion !== null && carpeta.promedio_ponderacion !== undefined ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: carpeta.promedio_ponderacion >= 80 ? '#e8f5e9' : carpeta.promedio_ponderacion >= 50 ? '#fff9c4' : '#ffebee',
                      color: carpeta.promedio_ponderacion >= 80 ? '#2e7d32' : carpeta.promedio_ponderacion >= 50 ? '#f57f17' : '#c62828',
                      fontWeight: '700',
                      fontSize: '14px',
                      minWidth: '70px',
                      justifyContent: 'center'
                    }}>
                      <i className="fa fa-percent" style={{ fontSize: '10px' }}></i>
                      {typeof carpeta.promedio_ponderacion === 'number' ? carpeta.promedio_ponderacion.toFixed(1) : '0.0'}%
                    </div>
                  ) : (carpeta.subcarpetas && carpeta.subcarpetas.length > 0) ? (
                    // Si tiene subcarpetas pero no tiene promedio, mostrar 0% (cascada en 0%)
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: '#ffebee',
                      color: '#c62828',
                      fontWeight: '700',
                      fontSize: '14px',
                      minWidth: '70px',
                      justifyContent: 'center'
                    }}>
                      <i className="fa fa-percent" style={{ fontSize: '10px' }}></i>
                      0.0%
                    </div>
                  ) : null}
                </div>
                
                {/* Subcarpetas */}
                {tieneSubcarpetas && estaExpandida && (
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e9ecef',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    {carpeta.subcarpetas.map((subcarpeta) => (
                      <div 
                        key={subcarpeta.id} 
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          background: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #e9ecef',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                          if (onNavigateToCarpeta) {
                            // Navegar a la subcarpeta (nivel 2)
                            onNavigateToCarpeta(subcarpeta.id);
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#0a6ebd30';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#495057',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <i className="fa fa-folder-open" style={{ color: '#6c757d', fontSize: '10px' }}></i>
                            {subcarpeta.nombre}
                          </span>
                        </div>
                        {subcarpeta.promedio_ponderacion !== null && subcarpeta.promedio_ponderacion !== undefined ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            background: subcarpeta.promedio_ponderacion >= 80 ? '#e8f5e9' : subcarpeta.promedio_ponderacion >= 50 ? '#fff9c4' : '#ffebee',
                            color: subcarpeta.promedio_ponderacion >= 80 ? '#2e7d32' : subcarpeta.promedio_ponderacion >= 50 ? '#f57f17' : '#c62828',
                            fontWeight: '700',
                            fontSize: '12px',
                            minWidth: '60px',
                            justifyContent: 'center'
                          }}>
                            <i className="fa fa-percent" style={{ fontSize: '8px' }}></i>
                            {typeof subcarpeta.promedio_ponderacion === 'number' ? subcarpeta.promedio_ponderacion.toFixed(1) : '0.0'}%
                          </div>
                        ) : (
                          // Si es nivel 2 y no tiene promedio, mostrar 0% (está vacía)
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            background: '#ffebee',
                            color: '#c62828',
                            fontWeight: '700',
                            fontSize: '12px',
                            minWidth: '60px',
                            justifyContent: 'center'
                          }}>
                            <i className="fa fa-percent" style={{ fontSize: '8px' }}></i>
                            0.0%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

