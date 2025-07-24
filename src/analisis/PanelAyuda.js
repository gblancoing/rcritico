import React, { useState, useEffect } from 'react';
import './PanelAyuda.css';
import { API_BASE } from '../config';

const PanelAyuda = ({ categoriaSeleccionada, onCerrar }) => {
  const [categoriasInfo, setCategoriasInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarDescripcionLarga, setMostrarDescripcionLarga] = useState({});
  const [cerrando, setCerrando] = useState(false);

  const handleCerrar = () => {
    setCerrando(true);
    setTimeout(() => {
      onCerrar();
      setCerrando(false);
    }, 300);
  };

  useEffect(() => {
    const cargarCategoriasInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/categoria_vp_info.php`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Convertir el array a un objeto con cat_vp como clave
          const categoriasObj = {};
          data.categorias.forEach(cat => {
            categoriasObj[cat.cat_vp] = cat;
          });
          setCategoriasInfo(categoriasObj);
        } else {
          throw new Error(data.error || 'Error al cargar información de categorías');
        }
      } catch (err) {
        console.error('Error cargando información de categorías:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarCategoriasInfo();
  }, []);

  const toggleDescripcionLarga = (catVp) => {
    setMostrarDescripcionLarga(prev => ({
      ...prev,
      [catVp]: !prev[catVp]
    }));
  };

  const obtenerColorCategoria = (catVp) => {
    const colores = {
      'MO': '#2E8B57', // Verde
      'IC': '#4682B4', // Azul
      'EM': '#DAA520', // Dorado
      'IE': '#8B4513', // Marrón
      'SC': '#32CD32', // Verde claro
      'AD': '#FF6347', // Rojo
      'CL': '#9370DB', // Púrpura
      'CT': '#FF4500'  // Naranja
    };
    return colores[catVp] || '#666';
  };

  const obtenerIconoCategoria = (catVp) => {
    const iconos = {
      'MO': 'fa-hammer',
      'IC': 'fa-users',
      'EM': 'fa-cogs',
      'IE': 'fa-drafting-compass',
      'SC': 'fa-tools',
      'AD': 'fa-briefcase',
      'CL': 'fa-exclamation-triangle',
      'CT': 'fa-shield-alt'
    };
    return iconos[catVp] || 'fa-tag';
  };

  if (loading) {
    return (
      <div className={`panel-ayuda ${cerrando ? 'cerrando' : ''}`}>
        <div className="panel-header">
          <h3><i className="fa fa-question-circle"></i> Ayuda - Categorías VP</h3>
          <button className="cerrar-btn" onClick={handleCerrar}>
            <i className="fa fa-times"></i>
          </button>
        </div>
        <div className="panel-content">
          <div className="loading-spinner">
            <i className="fa fa-spinner fa-spin"></i>
            <p>Cargando información de categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`panel-ayuda ${cerrando ? 'cerrando' : ''}`}>
        <div className="panel-header">
          <h3><i className="fa fa-question-circle"></i> Ayuda - Categorías VP</h3>
          <button className="cerrar-btn" onClick={handleCerrar}>
            <i className="fa fa-times"></i>
          </button>
        </div>
        <div className="panel-content">
          <div className="error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`panel-ayuda ${cerrando ? 'cerrando' : ''}`}>
      <div className="panel-header">
        <h3><i className="fa fa-question-circle"></i> Ayuda - Categorías VP</h3>
        <button className="cerrar-btn" onClick={handleCerrar}>
          <i className="fa fa-times"></i>
        </button>
      </div>
      
      <div className="panel-content">
        <div className="ayuda-intro">
          <p>
            <i className="fa fa-info-circle"></i>
            <strong>Información de Categorías VP:</strong> Esta sección explica el significado y propósito de cada categoría VP mostrada en el dashboard.
          </p>
        </div>

        <div className="categorias-lista">
          {Object.entries(categoriasInfo).map(([catVp, info]) => (
            <div 
              key={catVp} 
              className={`categoria-info ${categoriaSeleccionada === catVp ? 'seleccionada' : ''}`}
              style={{ borderLeftColor: obtenerColorCategoria(catVp) }}
            >
              <div className="categoria-header">
                <div className="categoria-icono">
                  <i className={`fa ${obtenerIconoCategoria(catVp)}`}></i>
                </div>
                <div className="categoria-titulo">
                  <h4>{catVp}</h4>
                  <span className="categoria-nombre">{info.descripcion_corta}</span>
                </div>
                <div className="categoria-tipo">
                  <span className="tipo-badge">{info.categoria_ipa}</span>
                </div>
              </div>

              <div className="categoria-detalles">
                <div className="detalle-grupo">
                  <label><i className="fa fa-bullseye"></i> Propósito:</label>
                  <p>{info.Propósito}</p>
                </div>

                <div className="detalle-grupo">
                  <label><i className="fa fa-tag"></i> Descripción:</label>
                  <div className="descripcion-toggle">
                    <p className={mostrarDescripcionLarga[catVp] ? 'descripcion-larga' : 'descripcion-corta'}>
                      {mostrarDescripcionLarga[catVp] ? info.descripcion_larga : info.descripcion_corta}
                    </p>
                    <button 
                      className="toggle-btn"
                      onClick={() => toggleDescripcionLarga(catVp)}
                    >
                      <i className={`fa ${mostrarDescripcionLarga[catVp] ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      {mostrarDescripcionLarga[catVp] ? 'Ver menos' : 'Ver más'}
                    </button>
                  </div>
                </div>

                <div className="detalle-grupo">
                  <label><i className="fa fa-calendar"></i> Última actualización:</label>
                  <p>{new Date(info.updated_at).toLocaleDateString('es-CL')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ayuda-footer">
          <div className="leyenda-colores">
            <h5><i className="fa fa-palette"></i> Leyenda de Colores:</h5>
            <div className="colores-grid">
              <div className="color-item">
                <span className="color-muestra" style={{ backgroundColor: '#2E8B57' }}></span>
                <span>Directo</span>
              </div>
              <div className="color-item">
                <span className="color-muestra" style={{ backgroundColor: '#4682B4' }}></span>
                <span>Indirecto</span>
              </div>
              <div className="color-item">
                <span className="color-muestra" style={{ backgroundColor: '#9370DB' }}></span>
                <span>Costos Especiales</span>
              </div>
              <div className="color-item">
                <span className="color-muestra" style={{ backgroundColor: '#FF4500' }}></span>
                <span>Contingencias</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelAyuda; 