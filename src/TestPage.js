import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      background: '#f5f6fa',
      minHeight: '100vh'
    }}>
      <h1>🧪 Página de Prueba</h1>
      <p>¡La navegación está funcionando correctamente!</p>
      <button 
        onClick={() => navigate('/')}
        style={{
          background: '#0a6ebd',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          margin: '1rem'
        }}
      >
        Volver al Inicio
      </button>
    </div>
  );
};

export default TestPage; 