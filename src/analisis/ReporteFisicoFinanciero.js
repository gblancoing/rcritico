import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const ReporteFisicoFinanciero = ({ proyectoId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [proyectoInfo, setProyectoInfo] = useState(null);
  const [datos, setDatos] = useState(null);

  // Lógica para obtener la información del proyecto
  const cargarProyecto = async () => {
    if (!proyectoId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/proyecto.php?id=${proyectoId}`);
      if (response.ok) {
        const data = await response.json();
        if (!data.error) {
          setProyectoInfo(data);
        }
      }
    } catch (err) {
      console.error('Error al cargar proyecto:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProyecto();
  }, [proyectoId]);

  if (loading) return (
    <div style={{padding: '2rem', textAlign: 'center'}}>
      <i className="fa fa-spinner fa-spin"></i> Cargando...
    </div>
  );

  if (error) {
    return (
      <div style={{padding: '2rem', textAlign: 'center'}}>
        <i className="fa fa-exclamation-triangle" style={{color: '#e74c3c'}}></i>
        Error: {error}
      </div>
    );
  }

  return (
    <div 
      className="reporte-fisico-financiero"
      style={{
        transform: 'scale(0.8)',
        transformOrigin: 'top left',
        width: '125%',
        maxWidth: '100vw', // Nunca exceder el viewport width
        minHeight: '125vh',
        overflow: 'auto', // Scroll si es necesario
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
        color: 'white',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '600' }}>
          <i className="fa fa-chart-area" style={{ marginRight: '10px' }}></i>
          Reporte Físico - Financiero
        </h2>
        <p style={{ margin: '0', opacity: 0.9, fontSize: '16px' }}>
          Proyecto: {proyectoInfo?.nombre || `ID: ${proyectoId}`} - Análisis de avance físico vs financiero
        </p>
      </div>

      {/* Contenido principal */}
      <div style={{
        padding: '20px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#003366' }}>
          🏗️ Análisis Universidad Físico - Financiero
        </h3>
        <p style={{ 
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.5',
          margin: '0'
        }}>
          Esta sección permitirá analizar el avance físico versus el avance financiero completos para identificar 
          la eficiencia del gasto físico vs financiero actual.
        </p>
      </div>

      {/* Cards de métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', color: '#28a745', marginBottom: '10px' }}>
            <i className="fa fa-chart-line"></i>
          </div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#495057' }}>Avance Físico</h4>
          <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>Medición de progreso real del proyecto</p>
        </div>

        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', color: '#007bff', marginBottom: '10px' }}>
            <i className="fa fa-money-bill-wave"></i>
          </div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#495057' }}>Avance Financiero</h4>
          <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>Inversión ejecutada vs planificada</p>
        </div>

        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', color: '#ffc107', marginBottom: '10px' }}>
            <i className="fa fa-percentage"></i>
          </div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#495057' }}>Eficiencia</h4>
          <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>Relación físico/financiero</p>
        </div>
      </div>

      {/* Información adicional de desarrollo */}
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ 
          margin: '0 0 10px 0',
          fontSize: '16px',
          color: '#856404'
        }}>
          ⚠️ En Desarrollo
        </h4>
        <p style={{ 
          color: '#856404',
          fontSize: '14px',
          lineHeight: '1.4',
          margin: '0'
        }}>
          Esta funcionalidad está siendo desarrollada. Pronto podrás visualizar:
        </p>
        <ul style={{ 
          color: '#856404',
          fontSize: '14px',
          lineHeight: '1.5',
          margin: '8px 0 0 0',
          paddingLeft: '20px'
        }}>
          <li>Gráficos de evolución física versus financiera.</li>
          <li>Análisis de eficiencia de gastos.</li>
          <li>Comparación de indicadores clave.</li>
          <li>Reportes dinámicos con filtros.</li>
        </ul>
      </div>
    </div>
  );
};

export default ReporteFisicoFinanciero;