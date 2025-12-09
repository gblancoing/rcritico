import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const RCA = ({ proyectoId, sidebarCollapsed }) => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrearDocumento, setModalCrearDocumento] = useState(false);
  const [modalVerDocumento, setModalVerDocumento] = useState(null);
  const [nuevoDocumento, setNuevoDocumento] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'RCA',
    organismo: '',
    numero_resolucion: ''
  });

  // Cargar documentos (simulado por ahora)
  useEffect(() => {
    cargarDocumentos();
  }, [proyectoId]);

  const cargarDocumentos = () => {
    setLoading(true);
    // Simulación de datos - Aquí conectarías con la API real
    setTimeout(() => {
      setDocumentos([
        {
          id: 1,
          codigo: 'RCA-001',
          nombre: 'Resolución de Calificación Ambiental Principal',
          descripcion: 'RCA aprobada por el Servicio de Evaluación Ambiental para el proyecto',
          fecha: '2023-06-15',
          tipo: 'RCA',
          organismo: 'Servicio de Evaluación Ambiental (SEA)',
          numero_resolucion: 'RES-2023-045',
          estado: 'Vigente',
          vencimiento: '2028-06-15',
          portada: '/img/imagen_jej.jpg'
        },
        {
          id: 2,
          codigo: 'DIA-001',
          nombre: 'Declaración de Impacto Ambiental',
          descripcion: 'DIA presentada ante la autoridad ambiental con medidas de mitigación',
          fecha: '2023-03-20',
          tipo: 'DIA',
          organismo: 'SEA - Región Metropolitana',
          numero_resolucion: 'DIA-2023-012',
          estado: 'Aprobado',
          vencimiento: '2026-03-20',
          portada: '/img/muro.jpg'
        },
        {
          id: 3,
          codigo: 'PAS-001',
          nombre: 'Permiso Ambiental Sectorial - Agua',
          descripcion: 'PAS para extracción y uso de recursos hídricos',
          fecha: '2024-01-10',
          tipo: 'PAS',
          organismo: 'Dirección General de Aguas (DGA)',
          numero_resolucion: 'PAS-AGUA-2024-003',
          estado: 'En Trámite',
          vencimiento: null,
          portada: '/img/fondo-codelco.png'
        }
      ]);
      setLoading(false);
    }, 500);
  };

  const handleCrearDocumento = () => {
    // Aquí conectarías con la API para crear el documento
    const documentoNuevo = {
      id: documentos.length + 1,
      ...nuevoDocumento,
      estado: 'En Trámite',
      vencimiento: null,
      portada: '/img/fondo-codelco.png'
    };
    
    setDocumentos([...documentos, documentoNuevo]);
    setModalCrearDocumento(false);
    setNuevoDocumento({
      codigo: '',
      nombre: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'RCA',
      organismo: '',
      numero_resolucion: ''
    });
  };

  const handleEliminarDocumento = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      setDocumentos(documentos.filter(d => d.id !== id));
    }
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'Vigente':
        return '#10b981';
      case 'Aprobado':
        return '#3b82f6';
      case 'En Trámite':
        return '#f59e0b';
      case 'Rechazado':
        return '#ef4444';
      case 'Vencido':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'RCA':
        return '🌿';
      case 'DIA':
        return '📋';
      case 'EIA':
        return '📊';
      case 'PAS':
        return '💧';
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
        Cargando documentos RCA...
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
        borderLeft: '4px solid #10b981',
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
            <i className="fa fa-leaf" style={{ color: '#10b981' }}></i>
            Documentos RCA
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#718096'
          }}>
            Gestión de Resoluciones de Calificación Ambiental y permisos asociados
          </p>
        </div>
        <button
          onClick={() => setModalCrearDocumento(true)}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          }}
        >
          <i className="fa fa-plus-circle"></i>
          Nuevo Documento
        </button>
      </div>

      {/* Grid de Documentos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {documentos.map((documento) => (
          <div
            key={documento.id}
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
            onClick={() => setModalVerDocumento(documento)}
          >
            {/* Portada */}
            <div style={{
              height: '160px',
              background: `linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.95)), url(${documento.portada || '/img/fondo-codelco.png'})`,
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
                {getTipoIcon(documento.tipo)}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                color: getEstadoColor(documento.estado)
              }}>
                {documento.estado}
              </div>
            </div>

            {/* Contenido */}
            <div style={{ padding: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{
                  background: '#d1fae5',
                  color: '#065f46',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  {documento.codigo}
                </span>
                <span style={{
                  background: '#f0fdf4',
                  color: '#16a34a',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {documento.tipo}
                </span>
              </div>

              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#2d3748',
                lineHeight: '1.3'
              }}>
                {documento.nombre}
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
                {documento.descripcion}
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
                  <i className="fa fa-calendar" style={{ color: '#10b981', width: '14px' }}></i>
                  <span>{new Date(documento.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-building" style={{ color: '#10b981', width: '14px' }}></i>
                  <span style={{ fontSize: '11px' }}>{documento.organismo}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-hashtag" style={{ color: '#10b981', width: '14px' }}></i>
                  <span>{documento.numero_resolucion}</span>
                </div>
                {documento.vencimiento && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa fa-clock" style={{ color: '#10b981', width: '14px' }}></i>
                    <span>Vence: {new Date(documento.vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
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
                    background: '#d1fae5',
                    color: '#065f46',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#a7f3d0'}
                  onMouseOut={e => e.currentTarget.style.background = '#d1fae5'}
                >
                  <i className="fa fa-download"></i> Descargar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminarDocumento(documento.id);
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

      {/* Mensaje si no hay documentos */}
      {documentos.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌿</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#2d3748' }}>
            No hay documentos registrados
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#718096' }}>
            Comienza agregando el primer documento ambiental del proyecto
          </p>
          <button
            onClick={() => setModalCrearDocumento(true)}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <i className="fa fa-plus-circle"></i> Crear Primer Documento
          </button>
        </div>
      )}

      {/* Modal Crear Documento */}
      {modalCrearDocumento && (
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
        onClick={() => setModalCrearDocumento(false)}
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
                Nuevo Documento RCA
              </h2>
              <button
                onClick={() => setModalCrearDocumento(false)}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Código *
                  </label>
                  <input
                    type="text"
                    value={nuevoDocumento.codigo}
                    onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, codigo: e.target.value })}
                    placeholder="RCA-001"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
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
                    Tipo *
                  </label>
                  <select
                    value={nuevoDocumento.tipo}
                    onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, tipo: e.target.value })}
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
                    <option value="RCA">RCA</option>
                    <option value="DIA">DIA</option>
                    <option value="EIA">EIA</option>
                    <option value="PAS">PAS</option>
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
                  Nombre del Documento *
                </label>
                <input
                  type="text"
                  value={nuevoDocumento.nombre}
                  onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, nombre: e.target.value })}
                  placeholder="Ej: Resolución de Calificación Ambiental"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
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
                  value={nuevoDocumento.descripcion}
                  onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, descripcion: e.target.value })}
                  placeholder="Describe el documento..."
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
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
                  Fecha *
                </label>
                <input
                  type="date"
                  value={nuevoDocumento.fecha}
                  onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, fecha: e.target.value })}
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
                  Organismo Emisor *
                </label>
                <input
                  type="text"
                  value={nuevoDocumento.organismo}
                  onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, organismo: e.target.value })}
                  placeholder="Ej: Servicio de Evaluación Ambiental"
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
                  Número de Resolución *
                </label>
                <input
                  type="text"
                  value={nuevoDocumento.numero_resolucion}
                  onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, numero_resolucion: e.target.value })}
                  placeholder="Ej: RES-2024-001"
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
                onClick={() => setModalCrearDocumento(false)}
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
                onClick={handleCrearDocumento}
                disabled={!nuevoDocumento.codigo || !nuevoDocumento.nombre || !nuevoDocumento.fecha || !nuevoDocumento.organismo || !nuevoDocumento.numero_resolucion}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: nuevoDocumento.codigo && nuevoDocumento.nombre && nuevoDocumento.fecha && nuevoDocumento.organismo && nuevoDocumento.numero_resolucion
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: nuevoDocumento.codigo && nuevoDocumento.nombre && nuevoDocumento.fecha && nuevoDocumento.organismo && nuevoDocumento.numero_resolucion
                    ? 'pointer'
                    : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa fa-check-circle"></i> Crear Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Documento */}
      {modalVerDocumento && (
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
        onClick={() => setModalVerDocumento(null)}
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
              background: `linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.95)), url(${modalVerDocumento.portada || '/img/fondo-codelco.png'})`,
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
                onClick={() => setModalVerDocumento(null)}
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
                {getTipoIcon(modalVerDocumento.tipo)}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '8px 18px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: '600',
                color: getEstadoColor(modalVerDocumento.estado)
              }}>
                {modalVerDocumento.estado}
              </div>
            </div>

            {/* Contenido */}
            <div style={{ padding: '32px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{
                  background: '#d1fae5',
                  color: '#065f46',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  {modalVerDocumento.codigo}
                </span>
                <span style={{
                  background: '#f0fdf4',
                  color: '#16a34a',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {modalVerDocumento.tipo}
                </span>
              </div>

              <h2 style={{
                margin: '0 0 12px 0',
                fontSize: '24px',
                fontWeight: '700',
                color: '#0a3265'
              }}>
                {modalVerDocumento.nombre}
              </h2>

              <p style={{
                margin: '0 0 24px 0',
                fontSize: '15px',
                color: '#718096',
                lineHeight: '1.6'
              }}>
                {modalVerDocumento.descripcion}
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
                    <i className="fa fa-calendar" style={{ color: '#10b981', marginRight: '8px' }}></i>
                    {new Date(modalVerDocumento.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>N° Resolución</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-hashtag" style={{ color: '#10b981', marginRight: '8px' }}></i>
                    {modalVerDocumento.numero_resolucion}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  gridColumn: '1 / -1'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Organismo</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-building" style={{ color: '#10b981', marginRight: '8px' }}></i>
                    {modalVerDocumento.organismo}
                  </div>
                </div>

                {modalVerDocumento.vencimiento && (
                  <div style={{
                    background: '#fef3c7',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #fbbf24',
                    gridColumn: '1 / -1'
                  }}>
                    <div style={{ fontSize: '12px', color: '#78350f', marginBottom: '4px' }}>Vencimiento</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#78350f' }}>
                      <i className="fa fa-clock" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
                      {new Date(modalVerDocumento.vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                )}
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
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className="fa fa-eye"></i> Ver Documento
                </button>
                <button
                  onClick={() => alert('Función de descargar no implementada')}
                  style={{
                    padding: '14px 20px',
                    background: '#d1fae5',
                    color: '#065f46',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#a7f3d0'}
                  onMouseOut={e => e.currentTarget.style.background = '#d1fae5'}
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

export default RCA;

