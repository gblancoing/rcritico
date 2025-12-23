import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const InformesStockholders = ({ proyectoId, sidebarCollapsed }) => {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrearInforme, setModalCrearInforme] = useState(false);
  const [modalVerInforme, setModalVerInforme] = useState(null);
  const [nuevoInforme, setNuevoInforme] = useState({
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    periodo: '',
    destinatarios: '',
    tipo: 'Ejecutivo'
  });
  
  // Parámetros de personalización del reporte
  const [parametrosReporte, setParametrosReporte] = useState({
    incluirPortada: true,
    incluirResumenEjecutivo: true,
    incluirKPIs: true,
    incluirAvancePorEmpresa: true,
    incluirResumenRiesgos: true,
    incluirInformacionProyecto: true,
    nivelDetalle: 'normal', // 'basico', 'normal', 'detallado'
    formato: 'pdf' // 'pdf', 'html'
  });

  // Cargar informes desde la API
  useEffect(() => {
    if (proyectoId) {
      cargarInformes();
    }
  }, [proyectoId]);

  const cargarInformes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/stockholders/informes.php?proyecto_id=${proyectoId}`);
      if (response.ok) {
        const data = await response.json();
        setInformes(data);
      } else {
        console.error('Error cargando informes');
        setInformes([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setInformes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearInforme = async () => {
    try {
      // Generar URL del reporte personalizado
      const params = new URLSearchParams({
        proyecto_id: proyectoId,
        pdf: parametrosReporte.formato === 'pdf' ? '1' : '0',
        ...Object.entries(parametrosReporte).reduce((acc, [key, value]) => {
          if (typeof value === 'boolean') {
            acc[key] = value ? '1' : '0';
          } else {
            acc[key] = value;
          }
          return acc;
        }, {})
      });
      
      const rutaReporte = `/rcritico/api/dashboard/generar_reporte_pdf.php?${params.toString()}`;
      
      const response = await fetch(`${API_BASE}/stockholders/informes.php?proyecto_id=${proyectoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...nuevoInforme,
          ruta_pdf: rutaReporte,
          parametros_reporte: parametrosReporte
        })
      });
      
      if (response.ok) {
        const informeCreado = await response.json();
        setInformes([informeCreado, ...informes]);
        setModalCrearInforme(false);
        setNuevoInforme({
          titulo: '',
          descripcion: '',
          fecha: new Date().toISOString().split('T')[0],
          periodo: '',
          destinatarios: '',
          tipo: 'Ejecutivo'
        });
        setParametrosReporte({
          incluirPortada: true,
          incluirResumenEjecutivo: true,
          incluirKPIs: true,
          incluirAvancePorEmpresa: true,
          incluirResumenRiesgos: true,
          incluirInformacionProyecto: true,
          nivelDetalle: 'normal',
          formato: 'pdf'
        });
        alert('Informe creado correctamente');
      } else {
        const error = await response.json();
        alert('Error al crear el informe: ' + (error.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el informe');
    }
  };

  const handleEliminarInforme = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este informe?')) {
      try {
        const response = await fetch(`${API_BASE}/stockholders/informes.php?id=${id}&proyecto_id=${proyectoId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setInformes(informes.filter(i => i.id !== id));
          alert('Informe eliminado correctamente');
        } else {
          const error = await response.json();
          alert('Error al eliminar el informe: ' + (error.error || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el informe');
      }
    }
  };

  const handleAsociarReporteEjecutivo = async (informeId) => {
    if (window.confirm('¿Deseas asociar el reporte ejecutivo del proyecto a este informe?')) {
      try {
        const response = await fetch(`${API_BASE}/stockholders/asociar_reporte.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            informe_id: informeId,
            proyecto_id: proyectoId
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          // Recargar informes para ver el cambio
          cargarInformes();
          alert('Reporte ejecutivo asociado correctamente');
        } else {
          const error = await response.json();
          alert('Error al asociar el reporte: ' + (error.error || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al asociar el reporte ejecutivo');
      }
    }
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'Publicado':
        return '#10b981';
      case 'En Revisión':
        return '#f59e0b';
      case 'Borrador':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'Ejecutivo':
        return '📊';
      case 'Técnico':
        return '📈';
      case 'Financiero':
        return '💰';
      default:
        return '📄';
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
        color: '#0a3265'
      }}>
        Cargando informes...
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderLeft: '4px solid #0a6ebd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            margin: '0 0 6px 0',
            fontSize: '22px',
            fontWeight: '600',
            color: '#0a3265',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fa fa-file-chart-line" style={{ color: '#0a6ebd' }}></i>
            Informes Stockholders
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#718096'
          }}>
            Reportes ejecutivos y técnicos para accionistas e inversionistas
          </p>
        </div>
        <button
          onClick={() => setModalCrearInforme(true)}
          style={{
            background: 'linear-gradient(135deg, #0a6ebd 0%, #0a3265 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(10, 110, 189, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(10, 110, 189, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 110, 189, 0.3)';
          }}
        >
          <i className="fa fa-plus-circle"></i>
          Nuevo Informe
        </button>
      </div>

      {/* Grid de Informes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {informes.map((informe) => (
          <div
            key={informe.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
            }}
            onClick={() => setModalVerInforme(informe)}
          >
            {/* Portada */}
            <div style={{
              height: '160px',
              background: `linear-gradient(135deg, rgba(10, 110, 189, 0.9), rgba(10, 50, 101, 0.95)), url(${informe.portada || '/img/fondo-codelco.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '8px'
              }}>
                {getTipoIcon(informe.tipo)}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                color: getEstadoColor(informe.estado)
              }}>
                {informe.estado}
              </div>
            </div>

            {/* Contenido */}
            <div style={{ padding: '16px' }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#2d3748',
                lineHeight: '1.3'
              }}>
                {informe.titulo}
              </h3>

              <p style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: '#718096',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {informe.descripcion}
              </p>

              {/* Información adicional */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '12px',
                color: '#4a5568',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-calendar" style={{ color: '#0a6ebd', width: '14px' }}></i>
                  <span>{new Date(informe.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-clock" style={{ color: '#0a6ebd', width: '14px' }}></i>
                  <span>{informe.periodo}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-users" style={{ color: '#0a6ebd', width: '14px' }}></i>
                  <span>{informe.destinatarios}</span>
                </div>
                {informe.ruta_pdf && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                    <i className="fa fa-check-circle" style={{ width: '14px' }}></i>
                    <span>Reporte ejecutivo asociado</span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0',
                flexWrap: 'wrap'
              }}>
                {informe.ruta_pdf ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Si la ruta ya incluye el dominio completo, usarla directamente
                      // Si es relativa, construir la URL completa
                      let url = informe.ruta_pdf;
                      if (url.startsWith('/')) {
                        // Ruta relativa, usar API_BASE si no incluye /rcritico
                        if (!url.startsWith('/rcritico')) {
                          url = `${API_BASE}${url}`;
                        } else {
                          // Ya incluye /rcritico, construir URL completa
                          // Si estamos en puerto de React (3000, 3001, etc.), usar localhost sin puerto (puerto 80)
                          const port = window.location.port;
                          if (port && (port === '3000' || port === '3001' || port === '3002')) {
                            url = `http://localhost${url}`;
                          } else {
                            // Usar el host actual
                            const protocol = window.location.protocol;
                            const host = window.location.host;
                            url = `${protocol}//${host}${url}`;
                          }
                        }
                      }
                      window.open(url, '_blank');
                    }}
                    style={{
                      flex: 1,
                      background: '#f0f9ff',
                      color: '#0a6ebd',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#dbeafe'}
                    onMouseOut={e => e.currentTarget.style.background = '#f0f9ff'}
                  >
                    <i className="fa fa-download"></i> Ver PDF
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAsociarReporteEjecutivo(informe.id);
                    }}
                    style={{
                      flex: 1,
                      background: '#fff7ed',
                      color: '#f59e0b',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#ffedd5'}
                    onMouseOut={e => e.currentTarget.style.background = '#fff7ed'}
                  >
                    <i className="fa fa-link"></i> Asociar Reporte
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminarInforme(informe.id);
                  }}
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}
                >
                  <i className="fa fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si no hay informes */}
      {informes.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#2d3748' }}>
            No hay informes registrados
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#718096' }}>
            Comienza agregando tu primer informe para stockholders
          </p>
          <button
            onClick={() => setModalCrearInforme(true)}
            style={{
              background: '#0a6ebd',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <i className="fa fa-plus-circle"></i> Crear Primer Informe
          </button>
        </div>
      )}

      {/* Modal Crear Informe */}
      {modalCrearInforme && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setModalCrearInforme(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '540px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: '#0a3265'
              }}>
                Nuevo Informe
              </h2>
              <button
                onClick={() => setModalCrearInforme(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Título del Informe *
                </label>
                <input
                  type="text"
                  value={nuevoInforme.titulo}
                  onChange={(e) => setNuevoInforme({ ...nuevoInforme, titulo: e.target.value })}
                  placeholder="Ej: Informe Trimestral Q4 2024"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0a6ebd'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Descripción
                </label>
                <textarea
                  value={nuevoInforme.descripcion}
                  onChange={(e) => setNuevoInforme({ ...nuevoInforme, descripcion: e.target.value })}
                  placeholder="Describe el contenido del informe..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0a6ebd'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={nuevoInforme.fecha}
                    onChange={(e) => setNuevoInforme({ ...nuevoInforme, fecha: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Tipo *
                  </label>
                  <select
                    value={nuevoInforme.tipo}
                    onChange={(e) => setNuevoInforme({ ...nuevoInforme, tipo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Ejecutivo">Ejecutivo</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Financiero">Financiero</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Periodo *
                </label>
                <input
                  type="text"
                  value={nuevoInforme.periodo}
                  onChange={(e) => setNuevoInforme({ ...nuevoInforme, periodo: e.target.value })}
                  placeholder="Ej: Q4 2024, Noviembre 2024"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Destinatarios *
                </label>
                <input
                  type="text"
                  value={nuevoInforme.destinatarios}
                  onChange={(e) => setNuevoInforme({ ...nuevoInforme, destinatarios: e.target.value })}
                  placeholder="Ej: Accionistas, Board of Directors"
                  placeholder="Ej: Accionistas, Board of Directors"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Sección de Personalización del Reporte */}
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
              }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0a3265',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fa fa-cog"></i>
                  Personalización del Reporte
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Secciones a incluir */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#4b5563'
                    }}>
                      Secciones a Incluir:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { key: 'incluirPortada', label: 'Portada', icon: 'fa-file' },
                        { key: 'incluirResumenEjecutivo', label: 'Resumen Ejecutivo', icon: 'fa-chart-line' },
                        { key: 'incluirKPIs', label: 'Indicadores Clave (KPIs)', icon: 'fa-chart-pie' },
                        { key: 'incluirAvancePorEmpresa', label: 'Avance por Empresa', icon: 'fa-building' },
                        { key: 'incluirResumenRiesgos', label: 'Resumen por Riesgo Crítico', icon: 'fa-exclamation-triangle' },
                        { key: 'incluirInformacionProyecto', label: 'Información del Proyecto', icon: 'fa-info-circle' }
                      ].map(seccion => (
                        <label key={seccion.key} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '6px',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#ffffff'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            checked={parametrosReporte[seccion.key]}
                            onChange={(e) => setParametrosReporte({
                              ...parametrosReporte,
                              [seccion.key]: e.target.checked
                            })}
                            style={{ cursor: 'pointer' }}
                          />
                          <i className={`fa ${seccion.icon}`} style={{ color: '#0a6ebd', width: '16px' }}></i>
                          <span style={{ fontSize: '13px', color: '#374151' }}>{seccion.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Nivel de detalle */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#4b5563'
                    }}>
                      Nivel de Detalle:
                    </label>
                    <select
                      value={parametrosReporte.nivelDetalle}
                      onChange={(e) => setParametrosReporte({
                        ...parametrosReporte,
                        nivelDetalle: e.target.value
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="basico">Básico (Solo resumen)</option>
                      <option value="normal">Normal (Resumen + KPIs principales)</option>
                      <option value="detallado">Detallado (Todas las métricas y análisis)</option>
                    </select>
                  </div>

                  {/* Formato */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#4b5563'
                    }}>
                      Formato de Salida:
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['pdf', 'html'].map(formato => (
                        <label key={formato} style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px',
                          border: `2px solid ${parametrosReporte.formato === formato ? '#0a6ebd' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          background: parametrosReporte.formato === formato ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                          <input
                            type="radio"
                            name="formato"
                            value={formato}
                            checked={parametrosReporte.formato === formato}
                            onChange={(e) => setParametrosReporte({
                              ...parametrosReporte,
                              formato: e.target.value
                            })}
                            style={{ cursor: 'pointer' }}
                          />
                          <i className={`fa fa-file-${formato === 'pdf' ? 'pdf' : 'code'}`} style={{ color: '#0a6ebd' }}></i>
                          <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>{formato}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '2px solid #f3f4f6'
            }}>
              <button
                onClick={() => setModalCrearInforme(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'}
                onMouseOut={e => e.currentTarget.style.background = '#f3f4f6'}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearInforme}
                disabled={!nuevoInforme.titulo || !nuevoInforme.fecha || !nuevoInforme.periodo || !nuevoInforme.destinatarios}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: nuevoInforme.titulo && nuevoInforme.fecha && nuevoInforme.periodo && nuevoInforme.destinatarios
                    ? 'linear-gradient(135deg, #0a6ebd 0%, #0a3265 100%)'
                    : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: nuevoInforme.titulo && nuevoInforme.fecha && nuevoInforme.periodo && nuevoInforme.destinatarios
                    ? 'pointer'
                    : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa fa-check-circle"></i> Crear Informe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Informe */}
      {modalVerInforme && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setModalVerInforme(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '0',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con portada */}
            <div style={{
              height: '200px',
              background: `linear-gradient(135deg, rgba(10, 110, 189, 0.9), rgba(10, 50, 101, 0.95)), url(${modalVerInforme.portada || '/img/fondo-codelco.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              padding: '24px'
            }}>
              <button
                onClick={() => setModalVerInforme(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  fontSize: '24px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                ×
              </button>

              <div style={{ fontSize: '64px', marginBottom: '12px' }}>
                {getTipoIcon(modalVerInforme.tipo)}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '8px 18px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: '600',
                color: getEstadoColor(modalVerInforme.estado)
              }}>
                {modalVerInforme.estado}
              </div>
            </div>

            {/* Contenido */}
            <div style={{ padding: '32px' }}>
              <h2 style={{
                margin: '0 0 12px 0',
                fontSize: '24px',
                fontWeight: '700',
                color: '#0a3265'
              }}>
                {modalVerInforme.titulo}
              </h2>

              <p style={{
                margin: '0 0 24px 0',
                fontSize: '15px',
                color: '#718096',
                lineHeight: '1.6'
              }}>
                {modalVerInforme.descripcion}
              </p>

              {/* Detalles */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Fecha</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-calendar" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {new Date(modalVerInforme.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Periodo</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-clock" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {modalVerInforme.periodo}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Destinatarios</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-users" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {modalVerInforme.destinatarios}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Páginas</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-file-pdf" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {modalVerInforme.paginas} páginas
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '24px',
                borderTop: '2px solid #f3f4f6'
              }}>
                {modalVerInforme.ruta_pdf ? (
                  <>
                    <button
                      onClick={() => {
                        // Construir URL del PDF
                        let url = modalVerInforme.ruta_pdf;
                        if (url.startsWith('/')) {
                          // Ruta relativa, construir URL completa
                          if (!url.startsWith('/rcritico')) {
                            url = `${API_BASE}${url}`;
                          } else {
                            // Ya incluye /rcritico, construir URL completa
                            // Si estamos en puerto de React (3000, 3001, etc.), usar localhost sin puerto (puerto 80)
                            const port = window.location.port;
                            if (port && (port === '3000' || port === '3001' || port === '3002')) {
                              url = `http://localhost${url}`;
                            } else {
                              // Usar el host actual
                              const protocol = window.location.protocol;
                              const host = window.location.host;
                              url = `${protocol}//${host}${url}`;
                            }
                          }
                        }
                        // Abrir en nueva pestaña
                        window.open(url, '_blank');
                      }}
                      style={{
                        flex: 1,
                        padding: '14px',
                        background: 'linear-gradient(135deg, #0a6ebd 0%, #0a3265 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(135deg, #0a5aa8 0%, #0a2855 100%)'}
                      onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, #0a6ebd 0%, #0a3265 100%)'}
                    >
                      <i className="fa fa-eye"></i> Ver Informe
                    </button>
                    <button
                      onClick={() => {
                        // Construir URL del PDF
                        let url = modalVerInforme.ruta_pdf;
                        if (url.startsWith('/')) {
                          // Ruta relativa, construir URL completa
                          if (!url.startsWith('/rcritico')) {
                            url = `${API_BASE}${url}`;
                          } else {
                            // Ya incluye /rcritico, construir URL completa
                            // Si estamos en puerto de React (3000, 3001, etc.), usar localhost sin puerto (puerto 80)
                            const port = window.location.port;
                            if (port && (port === '3000' || port === '3001' || port === '3002')) {
                              url = `http://localhost${url}`;
                            } else {
                              // Usar el host actual
                              const protocol = window.location.protocol;
                              const host = window.location.host;
                              url = `${protocol}//${host}${url}`;
                            }
                          }
                        }
                        // Forzar descarga agregando parámetro o usando download
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `reporte_${modalVerInforme.titulo.replace(/\s+/g, '_')}_${modalVerInforme.fecha}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      style={{
                        padding: '14px 20px',
                        background: '#f0f9ff',
                        color: '#0a6ebd',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#dbeafe'}
                      onMouseOut={e => e.currentTarget.style.background = '#f0f9ff'}
                    >
                      <i className="fa fa-download"></i>
                    </button>
                  </>
                ) : (
                  <div style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    No hay reporte asociado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InformesStockholders;

