import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const ControlFotografico = ({ proyectoId, sidebarCollapsed }) => {
  const [albumes, setAlbumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrearAlbum, setModalCrearAlbum] = useState(false);
  const [modalVerAlbum, setModalVerAlbum] = useState(null);
  const [nuevoAlbum, setNuevoAlbum] = useState({
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    ubicacion: '',
    responsable: ''
  });

  // Cargar álbumes (simulado por ahora)
  useEffect(() => {
    cargarAlbumes();
  }, [proyectoId]);

  const cargarAlbumes = () => {
    setLoading(true);
    // Simulación de datos - Aquí conectarías con la API real
    setTimeout(() => {
      setAlbumes([
        {
          id: 1,
          nombre: 'Avance Estructural Octubre 2024',
          descripcion: 'Registro fotográfico del avance estructural',
          fecha: '2024-10-15',
          ubicacion: 'Sector A - Fundaciones',
          responsable: 'Juan Pérez',
          cantidad_fotos: 45,
          portada: '/img/imagen_jej.jpg'
        },
        {
          id: 2,
          nombre: 'Inspección de Seguridad',
          descripcion: 'Inspección mensual de condiciones de seguridad',
          fecha: '2024-10-20',
          ubicacion: 'Todas las áreas',
          responsable: 'María González',
          cantidad_fotos: 28,
          portada: '/img/muro.jpg'
        }
      ]);
      setLoading(false);
    }, 500);
  };

  const handleCrearAlbum = () => {
    // Aquí conectarías con la API para crear el álbum
    const albumNuevo = {
      id: albumes.length + 1,
      ...nuevoAlbum,
      cantidad_fotos: 0,
      portada: '/img/fondo-codelco.png'
    };
    
    setAlbumes([...albumes, albumNuevo]);
    setModalCrearAlbum(false);
    setNuevoAlbum({
      nombre: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      ubicacion: '',
      responsable: ''
    });
  };

  const handleEliminarAlbum = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este álbum?')) {
      setAlbumes(albumes.filter(a => a.id !== id));
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
        Cargando álbumes fotográficos...
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
        borderRadius: '8px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderLeft: '4px solid #0a6ebd'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '22px', 
              fontWeight: '600',
              color: '#0a3265',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fa fa-camera" style={{ fontSize: '20px', color: '#0a6ebd' }}></i>
              Control Fotográfico
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#718096' }}>
              Gestiona y organiza el registro fotográfico del proyecto
            </p>
          </div>
          <button
            onClick={() => setModalCrearAlbum(true)}
            style={{
              background: '#0a6ebd',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(10, 110, 189, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => {
              e.target.style.background = '#0856a0';
              e.target.style.boxShadow = '0 4px 12px rgba(10, 110, 189, 0.4)';
            }}
            onMouseOut={e => {
              e.target.style.background = '#0a6ebd';
              e.target.style.boxShadow = '0 2px 8px rgba(10, 110, 189, 0.3)';
            }}
          >
            <i className="fa fa-plus-circle" style={{ fontSize: '16px' }}></i>
            Crear Álbum
          </button>
        </div>
      </div>

      {/* Grid de Álbumes */}
      {albumes.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <i className="fa fa-images" style={{ fontSize: '80px', color: '#cbd5e0', marginBottom: '24px' }}></i>
          <h3 style={{ color: '#2d3748', marginBottom: '12px' }}>No hay álbumes fotográficos</h3>
          <p style={{ color: '#718096', marginBottom: '24px' }}>
            Comienza creando tu primer álbum para organizar las fotografías del proyecto
          </p>
          <button
            onClick={() => setModalCrearAlbum(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            <i className="fa fa-plus-circle" style={{ marginRight: '8px' }}></i>
            Crear Primer Álbum
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {albumes.map((album) => (
            <div
              key={album.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
              }}
              onClick={() => setModalVerAlbum(album)}
            >
              {/* Imagen de portada */}
              <div style={{
                height: '160px',
                background: `linear-gradient(135deg, rgba(10, 110, 189, 0.85) 0%, rgba(10, 50, 101, 0.85) 100%), url(${process.env.PUBLIC_URL + album.portada})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '16px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0a6ebd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="fa fa-images"></i>
                  {album.cantidad_fotos}
                </div>
              </div>

              {/* Contenido */}
              <div style={{ padding: '16px' }}>
                <h3 style={{
                  margin: '0 0 6px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#2d3748',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {album.nombre}
                </h3>
                
                <p style={{
                  margin: '0 0 12px 0',
                  fontSize: '13px',
                  color: '#718096',
                  height: '36px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {album.descripcion}
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#4a5568',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa fa-calendar" style={{ color: '#0a6ebd', width: '14px', fontSize: '12px' }}></i>
                    <span>{new Date(album.fecha).toLocaleDateString('es-ES', { 
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa fa-map-marker-alt" style={{ color: '#0a6ebd', width: '14px', fontSize: '12px' }}></i>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{album.ubicacion}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa fa-user" style={{ color: '#0a6ebd', width: '14px', fontSize: '12px' }}></i>
                    <span>{album.responsable}</span>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  gap: '6px'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalVerAlbum(album);
                    }}
                    style={{
                      flex: 1,
                      background: '#0a6ebd',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.target.style.background = '#0856a0'}
                    onMouseOut={e => e.target.style.background = '#0a6ebd'}
                  >
                    <i className="fa fa-eye" style={{ marginRight: '6px' }}></i>
                    Ver
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarAlbum(album.id);
                    }}
                    style={{
                      background: '#fff',
                      color: '#dc3545',
                      border: '1px solid #dc3545',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => {
                      e.target.style.background = '#dc3545';
                      e.target.style.color = 'white';
                    }}
                    onMouseOut={e => {
                      e.target.style.background = '#fff';
                      e.target.style.color = '#dc3545';
                    }}
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Álbum */}
      {modalCrearAlbum && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '20px'
        }}
        onClick={() => setModalCrearAlbum(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <i className="fa fa-plus-circle" style={{ color: '#667eea' }}></i>
                Crear Nuevo Álbum
              </h2>
              <button
                onClick={() => setModalCrearAlbum(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  color: '#a0aec0',
                  cursor: 'pointer',
                  padding: '0',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  e.target.style.background = '#f7fafc';
                  e.target.style.color = '#2d3748';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#a0aec0';
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Nombre del álbum */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2d3748'
                }}>
                  <i className="fa fa-tag" style={{ marginRight: '8px', color: '#667eea' }}></i>
                  Nombre del Álbum *
                </label>
                <input
                  type="text"
                  value={nuevoAlbum.nombre}
                  onChange={e => setNuevoAlbum({ ...nuevoAlbum, nombre: e.target.value })}
                  placeholder="Ej: Avance Estructural Octubre 2024"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#667eea'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2d3748'
                }}>
                  <i className="fa fa-align-left" style={{ marginRight: '8px', color: '#667eea' }}></i>
                  Descripción
                </label>
                <textarea
                  value={nuevoAlbum.descripcion}
                  onChange={e => setNuevoAlbum({ ...nuevoAlbum, descripcion: e.target.value })}
                  placeholder="Describe el propósito de este álbum..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#667eea'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Fecha y Ubicación */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2d3748'
                  }}>
                    <i className="fa fa-calendar" style={{ marginRight: '8px', color: '#667eea' }}></i>
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={nuevoAlbum.fecha}
                    onChange={e => setNuevoAlbum({ ...nuevoAlbum, fecha: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#667eea'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2d3748'
                  }}>
                    <i className="fa fa-map-marker-alt" style={{ marginRight: '8px', color: '#667eea' }}></i>
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={nuevoAlbum.ubicacion}
                    onChange={e => setNuevoAlbum({ ...nuevoAlbum, ubicacion: e.target.value })}
                    placeholder="Ej: Sector A - Fundaciones"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#667eea'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Responsable */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2d3748'
                }}>
                  <i className="fa fa-user" style={{ marginRight: '8px', color: '#667eea' }}></i>
                  Responsable
                </label>
                <input
                  type="text"
                  value={nuevoAlbum.responsable}
                  onChange={e => setNuevoAlbum({ ...nuevoAlbum, responsable: e.target.value })}
                  placeholder="Nombre del responsable"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#667eea'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Botones */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '12px'
              }}>
                <button
                  onClick={() => setModalCrearAlbum(false)}
                  style={{
                    flex: 1,
                    background: '#fff',
                    color: '#4a5568',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => {
                    e.target.style.background = '#f7fafc';
                    e.target.style.borderColor = '#cbd5e0';
                  }}
                  onMouseOut={e => {
                    e.target.style.background = '#fff';
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleCrearAlbum}
                  disabled={!nuevoAlbum.nombre}
                  style={{
                    flex: 1,
                    background: nuevoAlbum.nombre ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#cbd5e0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: nuevoAlbum.nombre ? 'pointer' : 'not-allowed',
                    boxShadow: nuevoAlbum.nombre ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => {
                    if (nuevoAlbum.nombre) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                    }
                  }}
                  onMouseOut={e => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = nuevoAlbum.nombre ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none';
                  }}
                >
                  <i className="fa fa-check-circle" style={{ marginRight: '8px' }}></i>
                  Crear Álbum
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Álbum */}
      {modalVerAlbum && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '20px'
        }}
        onClick={() => setModalVerAlbum(null)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '900px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: '32px' }}>
              <button
                onClick={() => setModalVerAlbum(null)}
                style={{
                  float: 'right',
                  background: 'none',
                  border: 'none',
                  fontSize: '32px',
                  color: '#a0aec0',
                  cursor: 'pointer',
                  padding: '0',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  e.target.style.background = '#f7fafc';
                  e.target.style.color = '#2d3748';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#a0aec0';
                }}
              >
                ×
              </button>
              
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '32px',
                fontWeight: '700',
                color: '#2d3748'
              }}>
                {modalVerAlbum.nombre}
              </h2>
              
              <p style={{
                margin: '0 0 20px 0',
                fontSize: '16px',
                color: '#718096'
              }}>
                {modalVerAlbum.descripcion}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                padding: '20px',
                background: '#f7fafc',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa fa-calendar" style={{ fontSize: '20px', color: '#667eea' }}></i>
                  <div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>Fecha</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#2d3748' }}>
                      {new Date(modalVerAlbum.fecha).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa fa-map-marker-alt" style={{ fontSize: '20px', color: '#667eea' }}></i>
                  <div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>Ubicación</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#2d3748' }}>
                      {modalVerAlbum.ubicacion}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa fa-user" style={{ fontSize: '20px', color: '#667eea' }}></i>
                  <div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>Responsable</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#2d3748' }}>
                      {modalVerAlbum.responsable}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa fa-images" style={{ fontSize: '20px', color: '#667eea' }}></i>
                  <div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>Fotografías</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#2d3748' }}>
                      {modalVerAlbum.cantidad_fotos} fotos
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Área de fotos (placeholder) */}
            <div style={{ marginTop: '32px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#2d3748' }}>
                  Fotografías del Álbum
                </h3>
                <button
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa fa-upload"></i>
                  Subir Fotos
                </button>
              </div>

              {modalVerAlbum.cantidad_fotos === 0 ? (
                <div style={{
                  background: '#f7fafc',
                  border: '2px dashed #cbd5e0',
                  borderRadius: '12px',
                  padding: '60px',
                  textAlign: 'center'
                }}>
                  <i className="fa fa-image" style={{ fontSize: '60px', color: '#cbd5e0', marginBottom: '16px' }}></i>
                  <p style={{ color: '#718096', margin: 0 }}>
                    No hay fotografías en este álbum
                  </p>
                  <p style={{ color: '#a0aec0', fontSize: '14px', marginTop: '8px' }}>
                    Haz clic en "Subir Fotos" para agregar imágenes
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Aquí irían las miniaturas de las fotos */}
                  <div style={{
                    aspectRatio: '1',
                    background: '#f7fafc',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#cbd5e0',
                    fontSize: '40px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.target.style.background = '#edf2f7'}
                  onMouseOut={e => e.target.style.background = '#f7fafc'}
                  >
                    <i className="fa fa-image"></i>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlFotografico;

