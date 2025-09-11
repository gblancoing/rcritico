import React from 'react';
import './EstadoRevisionKPI.css';

// Componente de Tarjeta KPI de Estado de Revisión Optimizada
const EstadoRevisionKPI = ({ datos }) => {
  const { revisado = 1327, porRevisar = 119, pendientes = 17 } = datos || {};
  const total = revisado + porRevisar + pendientes;
  const porcentajeRevisado = total > 0 ? (revisado / total) * 100 : 0;
  const porcentajeUniverso = 47; // Dato de ejemplo

  return (
    <div className="kpi-card kpi-revision">
      {/* Botón de información */}
      <button 
        className="kpi-info-btn"
        title="Ver información detallada del estado de revisión"
      >
        <i className="fa fa-search"></i>
      </button>
      
      {/* Icono y título en columna - Título DEBAJO de la lupa */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
        <div className="kpi-icon">
          <i className="fa fa-search" style={{fontSize: '0.9rem'}}></i>
        </div>
        <h3 style={{ 
          fontSize: '0.55rem', 
          margin: 0, 
          textAlign: 'center', 
          lineHeight: '1.1',
          color: '#16355D',
          fontWeight: '700'
        }}>
          ESTADO<br />REVISIÓN
        </h3>
      </div>
      
      {/* Contenido */}
      <div className="kpi-content">
        {/* Métricas principales - Optimizadas para evitar desbordamiento */}
        <div className="revision-metrics">
          <div className="revision-metric revisado">
            <div className="metric-value">{revisado}</div>
            <div className="metric-label">REVISADO</div>
          </div>
          <div className="revision-metric por-revisar">
            <div className="metric-value">{porRevisar}</div>
            <div className="metric-label">SIN RESPONDER</div>
          </div>
          <div className="revision-metric pendientes">
            <div className="metric-value">{pendientes}</div>
            <div className="metric-label">PENDIENTE</div>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="revision-progress">
          <div 
            className="revision-progress-bar" 
            style={{ width: `${porcentajeRevisado}%` }}
          ></div>
        </div>
        
        {/* Detalles de porcentaje */}
        <div className="revision-details">
          <span className="revisado">Revisado: {revisado} ({porcentajeRevisado.toFixed(0)}%)</span>
          <span className="no-revisado">No Revisado: {porRevisar + pendientes} ({(100 - porcentajeRevisado).toFixed(0)}%)</span>
        </div>
        
        {/* Información del universo */}
        <div className="revision-universo">
          {porcentajeUniverso}% del universo
        </div>
      </div>
    </div>
  );
};

export default EstadoRevisionKPI;
