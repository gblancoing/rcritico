import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const Planos = ({ proyectoId, sidebarCollapsed }) => {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrearPlano, setModalCrearPlano] = useState(false);
  const [modalVerPlano, setModalVerPlano] = useState(null);
  const [nuevoPlano, setNuevoPlano] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    disciplina: 'Arquitectura',
    escala: '1:100',
    revision: 'A'
  });

  // Cargar planos (simulado por ahora)
  useEffect(() => {
    cargarPlanos();
  }, [proyectoId]);

  const cargarPlanos = () => {
    setLoading(true);
    // Simulación de datos - Aquí conectarías con la API real
    setTimeout(() => {
      setPlanos([
        {
          id: 1,
          codigo: 'ARQ-001',
          nombre: 'Planta General - Nivel 1',
          descripcion: 'Planta arquitectónica general del primer nivel con distribución de espacios',
          fecha: '2024-10-15',
          disciplina: 'Arquitectura',
          escala: '1:100',
          revision: 'C',
          estado: 'Aprobado',
          formato: 'DWG',
          portada: '/img/imagen_jej.jpg'
        },
        {
          id: 2,
          codigo: 'EST-012',
          nombre: 'Estructura Fundaciones',
          descripcion: 'Plano estructural de fundaciones y cimentación',
          fecha: '2024-10-20',
          disciplina: 'Estructuras',
          escala: '1:50',
          revision: 'B',
          estado: 'En Revisión',
          formato: 'PDF',
          portada: '/img/muro.jpg'
        },
        {
          id: 3,
          codigo: 'INS-025',
          nombre: 'Instalaciones Eléctricas',
          descripcion: 'Diagrama unifilar y distribución de tableros eléctricos',
          fecha: '2024-11-05',
          disciplina: 'Instalaciones',
          escala: '1:75',
          revision: 'A',
          estado: 'Borrador',
          formato: 'DWG',
          portada: '/img/fondo-codelco.png'
        }
      ]);
      setLoading(false);
    }, 500);
  };

  const handleCrearPlano = () => {
    // Aquí conectarías con la API para crear el plano
    const planoNuevo = {
      id: planos.length + 1,
      ...nuevoPlano,
      estado: 'Borrador',
      formato: 'DWG',
      portada: '/img/fondo-codelco.png'
    };
    
    setPlanos([...planos, planoNuevo]);
    setModalCrearPlano(false);
    setNuevoPlano({
      codigo: '',
      nombre: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      disciplina: 'Arquitectura',
      escala: '1:100',
      revision: 'A'
    });
  };

  const handleEliminarPlano = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este plano?')) {
      setPlanos(planos.filter(p => p.id !== id));
    }
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'Aprobado':
        return '#10b981';
      case 'En Revisión':
        return '#f59e0b';
      case 'Borrador':
        return '#6b7280';
      case 'Rechazado':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getDisciplinaIcon = (disciplina) => {
    switch(disciplina) {
      case 'Arquitectura':
        return '🏗️';
      case 'Estructuras':
        return '🔩';
      case 'Instalaciones':
        return '⚡';
      case 'Mecánica':
        return '⚙️';
      default:
        return '📐';
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
        Cargando planos...
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
            <i className="fa fa-drafting-compass" style={{ color: '#0a6ebd' }}></i>
            Gestión de Planos
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#718096'
          }}>
            Control documental de planos técnicos y de ingeniería
          </p>
        </div>
        <button
          onClick={() => setModalCrearPlano(true)}
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
          Nuevo Plano
        </button>
      </div>

      {/* Grid de Planos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {planos.map((plano) => (
          <div
            key={plano.id}
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
            onClick={() => setModalVerPlano(plano)}
          >
            {/* Portada */}
            <div style={{
              height: '160px',
              background: `linear-gradient(135deg, rgba(10, 110, 189, 0.9), rgba(10, 50, 101, 0.95)), url(${plano.portada || '/img/fondo-codelco.png'})`,
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
                {getDisciplinaIcon(plano.disciplina)}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                color: getEstadoColor(plano.estado)
              }}>
                {plano.estado}
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
                  background: '#f0f9ff',
                  color: '#0a6ebd',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  {plano.codigo}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  fontWeight: '600'
                }}>
                  Rev. {plano.revision}
                </span>
              </div>

              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#2d3748',
                lineHeight: '1.3'
              }}>
                {plano.nombre}
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
                {plano.descripcion}
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
                  <span>{new Date(plano.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-layer-group" style={{ color: '#0a6ebd', width: '14px' }}></i>
                  <span>{plano.disciplina}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-ruler" style={{ color: '#0a6ebd', width: '14px' }}></i>
                  <span>Escala {plano.escala}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa fa-file" style={{ color: '#0a6ebd', width: '14px' }}></i>
                  <span>{plano.formato}</span>
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
                    handleEliminarPlano(plano.id);
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

      {/* Mensaje si no hay planos */}
      {planos.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📐</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#2d3748' }}>
            No hay planos registrados
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#718096' }}>
            Comienza agregando el primer plano técnico del proyecto
          </p>
          <button
            onClick={() => setModalCrearPlano(true)}
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
            <i className="fa fa-plus-circle"></i> Crear Primer Plano
          </button>
        </div>
      )}

      {/* Modal Crear Plano */}
      {modalCrearPlano && (
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
        onClick={() => setModalCrearPlano(false)}
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
                Nuevo Plano
              </h2>
              <button
                onClick={() => setModalCrearPlano(false)}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
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
                    value={nuevoPlano.codigo}
                    onChange={(e) => setNuevoPlano({ ...nuevoPlano, codigo: e.target.value })}
                    placeholder="ARQ-001"
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
                    Revisión *
                  </label>
                  <input
                    type="text"
                    value={nuevoPlano.revision}
                    onChange={(e) => setNuevoPlano({ ...nuevoPlano, revision: e.target.value })}
                    placeholder="A"
                    maxLength="2"
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

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Nombre del Plano *
                </label>
                <input
                  type="text"
                  value={nuevoPlano.nombre}
                  onChange={(e) => setNuevoPlano({ ...nuevoPlano, nombre: e.target.value })}
                  placeholder="Ej: Planta General - Nivel 1"
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
                  value={nuevoPlano.descripcion}
                  onChange={(e) => setNuevoPlano({ ...nuevoPlano, descripcion: e.target.value })}
                  placeholder="Describe el contenido del plano..."
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
                    value={nuevoPlano.fecha}
                    onChange={(e) => setNuevoPlano({ ...nuevoPlano, fecha: e.target.value })}
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
                    Escala *
                  </label>
                  <select
                    value={nuevoPlano.escala}
                    onChange={(e) => setNuevoPlano({ ...nuevoPlano, escala: e.target.value })}
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
                    <option value="1:25">1:25</option>
                    <option value="1:50">1:50</option>
                    <option value="1:75">1:75</option>
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="1:500">1:500</option>
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
                  Disciplina *
                </label>
                <select
                  value={nuevoPlano.disciplina}
                  onChange={(e) => setNuevoPlano({ ...nuevoPlano, disciplina: e.target.value })}
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
                  <option value="Arquitectura">Arquitectura</option>
                  <option value="Estructuras">Estructuras</option>
                  <option value="Instalaciones">Instalaciones</option>
                  <option value="Mecánica">Mecánica</option>
                  <option value="Civil">Civil</option>
                </select>
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
                onClick={() => setModalCrearPlano(false)}
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
                onClick={handleCrearPlano}
                disabled={!nuevoPlano.codigo || !nuevoPlano.nombre || !nuevoPlano.fecha}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: nuevoPlano.codigo && nuevoPlano.nombre && nuevoPlano.fecha
                    ? 'linear-gradient(135deg, #0a6ebd 0%, #0a3265 100%)'
                    : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: nuevoPlano.codigo && nuevoPlano.nombre && nuevoPlano.fecha
                    ? 'pointer'
                    : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa fa-check-circle"></i> Crear Plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Plano */}
      {modalVerPlano && (
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
        onClick={() => setModalVerPlano(null)}
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
              background: `linear-gradient(135deg, rgba(10, 110, 189, 0.9), rgba(10, 50, 101, 0.95)), url(${modalVerPlano.portada || '/img/fondo-codelco.png'})`,
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
                onClick={() => setModalVerPlano(null)}
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
                {getDisciplinaIcon(modalVerPlano.disciplina)}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '8px 18px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: '600',
                color: getEstadoColor(modalVerPlano.estado)
              }}>
                {modalVerPlano.estado}
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
                  background: '#f0f9ff',
                  color: '#0a6ebd',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  {modalVerPlano.codigo}
                </span>
                <span style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  fontWeight: '600'
                }}>
                  Revisión {modalVerPlano.revision}
                </span>
              </div>

              <h2 style={{
                margin: '0 0 12px 0',
                fontSize: '24px',
                fontWeight: '700',
                color: '#0a3265'
              }}>
                {modalVerPlano.nombre}
              </h2>

              <p style={{
                margin: '0 0 24px 0',
                fontSize: '15px',
                color: '#718096',
                lineHeight: '1.6'
              }}>
                {modalVerPlano.descripcion}
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
                    {new Date(modalVerPlano.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Disciplina</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-layer-group" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {modalVerPlano.disciplina}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Escala</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-ruler" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {modalVerPlano.escala}
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Formato</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    <i className="fa fa-file" style={{ color: '#0a6ebd', marginRight: '8px' }}></i>
                    {modalVerPlano.formato}
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
                  <i className="fa fa-eye"></i> Ver Plano
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

export default Planos;

