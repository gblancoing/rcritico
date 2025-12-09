import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const PresentacionesStaff = ({ proyectoId, sidebarCollapsed }) => {
  const [presentaciones, setPresentaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrearPresentacion, setModalCrearPresentacion] = useState(false);
  const [modalVerPresentacion, setModalVerPresentacion] = useState(null);
  const [nuevaPresentacion, setNuevaPresentacion] = useState({
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    audiencia: '',
    presentador: '',
    tipo: 'PowerPoint'
  });

  // Cargar presentaciones (simulado por ahora)
  useEffect(() => {
    cargarPresentaciones();
  }, [proyectoId]);

  const cargarPresentaciones = () => {
    setLoading(true);
    // Simulación de datos - Aquí conectarías con la API real
    setTimeout(() => {
      setPresentaciones([
        {
          id: 1,
          titulo: 'Avance Mensual - Octubre 2024',
          descripcion: 'Presentación de avance físico y financiero del proyecto',
          fecha: '2024-10-25',
          audiencia: 'Directorio',
          presentador: 'Gerente de Proyecto',
          tipo: 'PowerPoint',
          diapositivas: 32,
          estado: 'Presentado',
          portada: '/img/imagen_jej.jpg'
        },
        {
          id: 2,
          titulo: 'Análisis de Riesgos Q4',
          descripcion: 'Identificación y mitigación de riesgos del cuarto trimestre',
          fecha: '2024-11-05',
          audiencia: 'Staff Técnico',
          presentador: 'Jefe de Control',
          tipo: 'PDF',
          diapositivas: 24,
          estado: 'Programado',
          portada: '/img/muro.jpg'
        },
        {
          id: 3,
          titulo: 'Kick-off Meeting 2025',
          descripcion: 'Presentación de planificación estratégica para el año 2025',
          fecha: '2024-12-15',
          audiencia: 'Equipo Completo',
          presentador: 'PMO',
          tipo: 'PowerPoint',
          diapositivas: 45,
          estado: 'En Preparación',
          portada: '/img/fondo-codelco.png'
        }
      ]);
      setLoading(false);
    }, 500);
  };

  const handleCrearPresentacion = () => {
    // Aquí conectarías con la API para crear la presentación
    const presentacionNueva = {
      id: presentaciones.length + 1,
      ...nuevaPresentacion,
      diapositivas: 0,
      estado: 'En Preparación',
      portada: '/img/fondo-codelco.png'
    };
    
    setPresentaciones([...presentaciones, presentacionNueva]);
    setModalCrearPresentacion(false);
    setNuevaPresentacion({
      titulo: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      audiencia: '',
      presentador: '',
      tipo: 'PowerPoint'
    });
  };

  const handleEliminarPresentacion = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta presentación?')) {
      setPresentaciones(presentaciones.filter(p => p.id !== id));
    }
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'Presentado':
        return '#10b981';
      case 'Programado':
        return '#3b82f6';
      case 'En Preparación':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'PowerPoint':
        return '📊';
      case 'PDF':
        return '📄';
      case 'Keynote':
        return '🎯';
      default:
        return '📋';
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
        Cargando presentaciones...
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
            <i className="fa fa-chalkboard-teacher" style={{ color: '#0a6ebd' }}></i>
            Presentaciones Staff
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#718096'
          }}>
            Gestión de presentaciones ejecutivas y técnicas del proyecto
          </p>
        </div>
        <button
          onClick={() => setModalCrearPresentacion(true)}
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
          Nueva Presentación
        </button>
      </div>

      {/* Grid de Presentaciones */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {presentaciones.map((presentacion) => (
          <div
            key={presentacion.id}
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
            onClick={() => setModalVerPresentacion(presentacion)}
          >
            {/* Portada */}
            <div style={{
              height: '160px',
              background: `linear-gradient(135deg, rgba(10, 110, 189, 0.9), rgba(10, 50, 101, 0.95)), url(${presentacion.portada || '/img/fondo-codelco.png'})`,
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
                {getTipoIcon(presentacion.tipo)}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                color: getEstadoColor(presentacion.estado)
              }}>
                {presentacion.estado}
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
                {presentacion.titulo}
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
                {presentacion.descripcion}
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
                  <span>{new Date(presentacion.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-users" style={{ color: '#0a6ebd', width: '14px' }}></i>
                  <span>{presentacion.audiencia}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-user" style={{ color: '#0a6ebd', width: '14px' }}></i>
                  <span>{presentacion.presentador}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-file-powerpoint" style={{ color: '#0a6ebd', width: '14px' }}></i>
                  <span>{presentacion.diapositivas} diapositivas</span>
                </div>
              </div>

              {/* Acciones */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Función de descargar no implementada');
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
                  <i className="fa fa-download"></i> Descargar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminarPresentacion(presentacion.id);
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

      {/* Mensaje si no hay presentaciones */}
      {presentaciones.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#2d3748' }}>
            No hay presentaciones registradas
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#718096' }}>
            Comienza agregando tu primera presentación del proyecto
          </p>
          <button
            onClick={() => setModalCrearPresentacion(true)}
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
            <i className="fa fa-plus-circle"></i> Crear Primera Presentación
          </button>
        </div>
      )}

      {/* Modal Crear Presentación */}
      {modalCrearPresentacion && (
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
        onClick={() => setModalCrearPresentacion(false)}
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
                Nueva Presentación
              </h2>
              <button
                onClick={() => setModalCrearPresentacion(false)}
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
                  Título de la Presentación *
                </label>
                <input
                  type="text"
                  value={nuevaPresentacion.titulo}
                  onChange={(e) => setNuevaPresentacion({ ...nuevaPresentacion, titulo: e.target.value })}
                  placeholder="Ej: Avance Mensual Octubre 2024"
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
                  value={nuevaPresentacion.descripcion}
                  onChange={(e) => setNuevaPresentacion({ ...nuevaPresentacion, descripcion: e.target.value })}
                  placeholder="Describe el contenido de la presentación..."
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
                    value={nuevaPresentacion.fecha}
                    onChange={(e) => setNuevaPresentacion({ ...nuevaPresentacion, fecha: e.target.value })}
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
                    value={nuevaPresentacion.tipo}
                    onChange={(e) => setNuevaPresentacion({ ...nuevaPresentacion, tipo: e.target.value })}
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
                    <option value="PowerPoint">PowerPoint</option>
                    <option value="PDF">PDF</option>
                    <option value="Keynote">Keynote</option>
                    <option value="Google Slides">Google Slides</option>
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
                  Audiencia *
                </label>
                <input
                  type="text"
                  value={nuevaPresentacion.audiencia}
                  onChange={(e) => setNuevaPresentacion({ ...nuevaPresentacion, audiencia: e.target.value })}
                  placeholder="Ej: Directorio, Staff Técnico, Cliente"
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
                  Presentador *
                </label>
                <input
                  type="text"
                  value={nuevaPresentacion.presentador}
                  onChange={(e) => setNuevaPresentacion({ ...nuevaPresentacion, presentador: e.target.value })}
                  placeholder="Nombre del presentador"
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
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '2px solid #f3f4f6'
            }}>
              <button
                onClick={() => setModalCrearPresentacion(false)}
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
                onClick={handleCrearPresentacion}
                disabled={!nuevaPresentacion.titulo || !nuevaPresentacion.fecha || !nuevaPresentacion.audiencia || !nuevaPresentacion.presentador}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: nuevaPresentacion.titulo && nuevaPresentacion.fecha && nuevaPresentacion.audiencia && nuevaPresentacion.presentador
                    ? 'linear-gradient(135deg, #0a6ebd 0%, #0a3265 100%)'
                    : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: nuevaPresentacion.titulo && nuevaPresentacion.fecha && nuevaPresentacion.audiencia && nuevaPresentacion.presentador
                    ? 'pointer'
                    : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa fa-check-circle"></i> Crear Presentación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Presentación */}
      {modalVerPresentacion && (
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
        onClick={() => setModalVerPresentacion(null)}
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
              background: `linear-gradient(135deg, rgba(10, 110, 189, 0.9), rgba(10, 50, 101, 0.95)), url(${modalVerPresentacion.portada || '/img/fondo-codelco.png'})`,
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
                onClick={() => setModalVerPresentacion(null)}
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
                {getTipoIcon(modalVerPresentacion.tipo)}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '8px 18px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: '600',
                color: getEstadoColor(modalVerPresentacion.estado)
              }}>
                {modalVerPresentacion.estado}
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
                {modalVerPresentacion.titulo}
              </h2>

              <p style={{
                margin: '0 0 24px 0',
                fontSize: '15px',
                color: '#718096',
                lineHeight: '1.6'
              }}>
                {modalVerPresentacion.descripcion}
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
                    {new Date(modalVerPresentacion.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Audiencia</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-users" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {modalVerPresentacion.audiencia}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Presentador</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-user" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {modalVerPresentacion.presentador}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Diapositivas</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-file-powerpoint" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {modalVerPresentacion.diapositivas} slides
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
                <button
                  onClick={() => alert('Función de visualizar no implementada')}
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
                >
                  <i className="fa fa-eye"></i> Ver Presentación
                </button>
                <button
                  onClick={() => alert('Función de descargar no implementada')}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentacionesStaff;

