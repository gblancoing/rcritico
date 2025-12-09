import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const ArbolCarpetas = ({ proyectoId, user, sidebarCollapsed }) => {
  const [carpetas, setCarpetas] = useState([]);
  const [usuariosPorCarpeta, setUsuariosPorCarpeta] = useState({});
  const [carpetasExpandidas, setCarpetasExpandidas] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [nivelMaximo, setNivelMaximo] = useState(3); // Hasta tercera cascada

  useEffect(() => {
    if (proyectoId) {
      cargarCarpetas();
    }
  }, [proyectoId, user]);

  const cargarCarpetas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        proyecto_id: proyectoId,
        todas: '1'
      });
      
      if (user && user.id) {
        params.append('usuario_id', user.id);
      }
      
      const res = await fetch(`${API_BASE}/archivos/carpetas.php?${params}`);
      const data = await res.json();
      const carpetasData = Array.isArray(data) ? data : [];
      setCarpetas(carpetasData);
      
      // Cargar usuarios para cada carpeta
      await cargarUsuariosPorCarpeta(carpetasData);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      setCarpetas([]);
    }
    setLoading(false);
  };

  const cargarUsuariosPorCarpeta = async (carpetasData) => {
    const usuariosMap = {};
    
    for (const carpeta of carpetasData) {
      try {
        const res = await fetch(`${API_BASE}/archivos/carpeta_usuarios.php?carpeta_id=${carpeta.id}`);
        if (res.ok) {
          const usuarios = await res.json();
          usuariosMap[carpeta.id] = Array.isArray(usuarios) ? usuarios : [];
        }
      } catch (error) {
        console.error(`Error cargando usuarios para carpeta ${carpeta.id}:`, error);
        usuariosMap[carpeta.id] = [];
      }
    }
    
    setUsuariosPorCarpeta(usuariosMap);
  };

  const construirArbol = () => {
    const carpetaMap = new Map();
    const raices = [];
    
    carpetas.forEach(carpeta => {
      carpetaMap.set(carpeta.id, { ...carpeta, hijos: [] });
    });
    
    carpetas.forEach(carpeta => {
      if (carpeta.carpeta_padre_id === null || carpeta.carpeta_padre_id === 0) {
        raices.push(carpetaMap.get(carpeta.id));
      } else {
        const padre = carpetaMap.get(carpeta.carpeta_padre_id);
        if (padre) {
          padre.hijos.push(carpetaMap.get(carpeta.id));
        }
      }
    });
    
    const ordenarHijos = (nodo) => {
      if (nodo.hijos && nodo.hijos.length > 0) {
        nodo.hijos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        nodo.hijos.forEach(ordenarHijos);
      }
    };
    
    raices.forEach(ordenarHijos);
    raices.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    return raices;
  };

  const toggleExpandir = (carpetaId) => {
    const nuevas = new Set(carpetasExpandidas);
    if (nuevas.has(carpetaId)) {
      nuevas.delete(carpetaId);
    } else {
      nuevas.add(carpetaId);
    }
    setCarpetasExpandidas(nuevas);
  };

  const renderizarNodo = (carpeta, nivel = 0) => {
    if (nivel >= nivelMaximo) return null;
    
    const tieneHijos = carpeta.hijos && carpeta.hijos.length > 0;
    const estaExpandida = carpetasExpandidas.has(carpeta.id);
    const usuarios = usuariosPorCarpeta[carpeta.id] || [];
    
    const colorPrimario = carpeta.color_primario || '#0a6ebd';
    
    return (
      <div key={carpeta.id} style={{ marginBottom: '0.375rem' }}>
        {/* Nodo de carpeta */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.375rem',
          marginLeft: `${nivel * 1.5}rem`,
          position: 'relative'
        }}>
          {/* Línea vertical de conexión */}
          {nivel > 0 && (
            <div style={{
              position: 'absolute',
              left: '-1.125rem',
              top: '0',
              width: '1px',
              height: '100%',
              background: `linear-gradient(180deg, ${colorPrimario}40 0%, ${colorPrimario}20 100%)`,
              zIndex: 0
            }}></div>
          )}
          
          {/* Línea horizontal de conexión */}
          {nivel > 0 && (
            <div style={{
              position: 'absolute',
              left: '-1.125rem',
              top: '0.875rem',
              width: '1.125rem',
              height: '1px',
              background: `${colorPrimario}60`,
              zIndex: 1
            }}></div>
          )}
          
          {/* Botón expandir/colapsar */}
          {tieneHijos && (
            <button
              onClick={() => toggleExpandir(carpeta.id)}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '3px',
                border: `1px solid ${colorPrimario}40`,
                background: estaExpandida ? `${colorPrimario}15` : 'transparent',
                color: colorPrimario,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                flexShrink: 0,
                marginTop: '1px',
                transition: 'all 0.2s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.target.style.background = `${colorPrimario}25`;
                e.target.style.borderColor = colorPrimario;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = estaExpandida ? `${colorPrimario}15` : 'transparent';
                e.target.style.borderColor = `${colorPrimario}40`;
              }}
            >
              <i className={`fa fa-chevron-${estaExpandida ? 'down' : 'right'}`}></i>
            </button>
          )}
          
          {!tieneHijos && (
            <div style={{
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: `${colorPrimario}60`
              }}></div>
            </div>
          )}
          
          {/* Contenedor de carpeta */}
          <div style={{
            flex: 1,
            background: '#ffffff',
            border: `1px solid ${colorPrimario}30`,
            borderLeft: `3px solid ${colorPrimario}`,
            borderRadius: '6px',
            padding: '0.5rem 0.625rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            position: 'relative',
            zIndex: 2
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 2px 6px ${colorPrimario}20`;
            e.currentTarget.style.borderColor = `${colorPrimario}50`;
            e.currentTarget.style.transform = 'translateX(2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            e.currentTarget.style.borderColor = `${colorPrimario}30`;
            e.currentTarget.style.transform = 'translateX(0)';
          }}
          >
            {/* Header de carpeta */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: usuarios.length > 0 ? '0.375rem' : '0'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: `${colorPrimario}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colorPrimario,
                fontSize: '11px',
                flexShrink: 0,
                border: `1px solid ${colorPrimario}25`
              }}>
                <i className="fa fa-folder"></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0a3265',
                  marginBottom: carpeta.descripcion ? '1px' : '0',
                  lineHeight: '1.3'
                }}>
                  {carpeta.nombre}
                </div>
                {carpeta.descripcion && (
                  <div style={{
                    fontSize: '10px',
                    color: '#6c757d',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {carpeta.descripcion}
                  </div>
                )}
              </div>
            </div>
            
            {/* Usuarios participantes */}
            {usuarios.length > 0 && (
              <div style={{
                marginTop: '0.375rem',
                paddingTop: '0.375rem',
                borderTop: `1px solid ${colorPrimario}15`
              }}>
                <div style={{
                  fontSize: '9px',
                  fontWeight: '600',
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  marginBottom: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <i className="fa fa-users" style={{ fontSize: '8px' }}></i>
                  {usuarios.length} {usuarios.length === 1 ? 'participante' : 'participantes'}
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem'
                }}>
                  {usuarios.slice(0, 5).map((usuario) => (
                    <div
                      key={usuario.id}
                      style={{
                        padding: '0.125rem 0.375rem',
                        background: `${colorPrimario}10`,
                        borderRadius: '8px',
                        fontSize: '9px',
                        color: colorPrimario,
                        fontWeight: '500',
                        border: `1px solid ${colorPrimario}20`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        lineHeight: '1.4'
                      }}
                      title={`${usuario.usuario_nombre} (${usuario.usuario_email})`}
                    >
                      <i className="fa fa-user" style={{ fontSize: '7px' }}></i>
                      <span style={{
                        maxWidth: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {usuario.usuario_nombre}
                      </span>
                    </div>
                  ))}
                  {usuarios.length > 5 && (
                    <div style={{
                      padding: '0.125rem 0.375rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '9px',
                      color: '#6c757d',
                      fontWeight: '500',
                      border: '1px solid #e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      +{usuarios.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {usuarios.length === 0 && (
              <div style={{
                fontSize: '9px',
                color: '#adb5bd',
                fontStyle: 'italic',
                marginTop: '0.25rem'
              }}>
                Sin participantes
              </div>
            )}
          </div>
        </div>
        
        {/* Renderizar hijos si está expandida */}
        {tieneHijos && estaExpandida && (
          <div style={{ marginTop: '0.375rem' }}>
            {carpeta.hijos.map(hijo => renderizarNodo(hijo, nivel + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#666'
      }}>
        <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
        <p>Cargando estructura de carpetas...</p>
      </div>
    );
  }

  const arbol = construirArbol();

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '700',
            color: '#0a3265',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            letterSpacing: '-0.3px'
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
              <i className="fa fa-sitemap" style={{ color: '#0a6ebd', fontSize: '14px' }}></i>
            </div>
            Distribución de Carpetas
          </h1>
          
          {/* Selector de nivel máximo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <label style={{
              fontSize: '11px',
              color: '#6c757d',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Niveles:
            </label>
            <select
              value={nivelMaximo}
              onChange={(e) => setNivelMaximo(parseInt(e.target.value))}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid #e9ecef',
                fontSize: '11px',
                color: '#495057',
                background: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Árbol de carpetas */}
      {arbol.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <i className="fa fa-folder-open" style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#adb5bd' }}></i>
          <p style={{ fontSize: '13px', margin: 0 }}>No hay carpetas disponibles en este proyecto.</p>
        </div>
      ) : (
        <div style={{
          position: 'relative',
          padding: '0.5rem 0'
        }}>
          {arbol.map(raiz => renderizarNodo(raiz, 0))}
        </div>
      )}
    </div>
  );
};

export default ArbolCarpetas;

