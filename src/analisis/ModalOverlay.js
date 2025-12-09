import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Componente Modal independiente para asegurar cobertura total
const ModalOverlay = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
      
      // Bloquear scroll del html
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      
      // Agregar clase al body
      document.body.classList.add('modal-open');
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      
      // Restaurar scroll del html
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      
      // Remover clase del body
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="modal-overlay-fullscreen"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647,
        padding: 0,
        margin: 0,
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '95%',
          maxWidth: '1400px',
          maxHeight: '95vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          transform: 'scale(0.8)',
          transformOrigin: 'center center',
          animation: 'modalFadeIn 0.3s ease-out'
        }}
      >
        {children}
      </div>
      
      {/* Estilos CSS globales */}
      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.7) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(0.8) translateY(0);
          }
        }
        
        .modal-overlay-fullscreen {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 2147483647 !important;
          margin: 0 !important;
          padding: 0 !important;
          background: rgba(0, 0, 0, 0.7) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
        }
        
        body.modal-open {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        html.modal-open {
          overflow: hidden !important;
          height: 100% !important;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ModalOverlay;
