import React, { useState, useEffect, useRef } from 'react';
import './GeminiChat.css';

const GeminiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const messagesEndRef = useRef(null);

  // Sugerencias iniciales por defecto
  const sugerenciasIniciales = [
    { icon: '📊', text: '¿Qué riesgos críticos hay?' },
    { icon: '🎯', text: 'Explícame el análisis Bowtie' },
    { icon: '🛡️', text: '¿Qué son los controles críticos?' },
    { icon: '📐', text: '¿Cuáles son las dimensiones de verificación?' },
    { icon: '📋', text: '¿Cómo funciona la línea base?' },
    { icon: '👥', text: '¿Qué roles hay en el sistema?' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar sugerencias al abrir el chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setSugerencias(sugerenciasIniciales);
    }
  }, [isOpen]);

  const handleSend = async (messageToSend = null) => {
    const messageText = messageToSend || input.trim();
    if (!messageText || loading) return;

    const userMessage = {
      role: 'user',
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSugerencias([]); // Limpiar sugerencias mientras carga
    setLoading(true);

    try {
      const response = await fetch('/api/gemini_chat.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText })
      });

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu mensaje.'
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Actualizar sugerencias si vienen en la respuesta
      if (data.sugerencias && data.sugerencias.length > 0) {
        setSugerencias(data.sugerencias.map(s => ({ icon: '💡', text: s })));
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Error al conectar con el servicio. Por favor intenta más tarde.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSugerenciaClick = (texto) => {
    handleSend(texto);
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          className="gemini-chat-toggle"
          onClick={() => setIsOpen(true)}
          title="Abrir chat de asistencia"
        >
          <i className="fa fa-comments"></i>
        </button>
      )}

      {/* Panel de chat */}
      {isOpen && (
        <div className="gemini-chat-container">
          <div className="gemini-chat-header">
            <div className="gemini-chat-title">
              <i className="fa fa-robot"></i>
              <span>Asistente Virtual</span>
            </div>
            <button
              className="gemini-chat-close"
              onClick={() => setIsOpen(false)}
              title="Cerrar chat"
            >
              <i className="fa fa-times"></i>
            </button>
          </div>

          <div className="gemini-chat-messages">
            {messages.length === 0 && (
              <div className="gemini-chat-welcome">
                <div className="gemini-welcome-icon">
                  <i className="fa fa-robot"></i>
                </div>
                <h3>¡Hola! Soy tu asistente de Riesgos Críticos</h3>
                <p>Puedo ayudarte con información sobre:</p>
                <ul className="gemini-capabilities">
                  <li>📊 Riesgos críticos del sistema</li>
                  <li>🎯 Análisis Bowtie</li>
                  <li>🛡️ Controles preventivos y mitigadores</li>
                  <li>📐 Dimensiones de verificación</li>
                </ul>
                <p className="gemini-prompt">Selecciona una opción o escribe tu pregunta:</p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`gemini-chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="gemini-chat-message-content">
                  {msg.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="gemini-chat-message assistant">
                <div className="gemini-chat-message-content">
                  <div className="gemini-chat-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sugerencias clickeables */}
            {!loading && sugerencias.length > 0 && (
              <div className="gemini-sugerencias-container">
                <div className="gemini-sugerencias-label">
                  <i className="fa fa-lightbulb-o"></i> Sugerencias:
                </div>
                <div className="gemini-sugerencias">
                  {sugerencias.map((sug, index) => (
                    <button
                      key={index}
                      className="gemini-sugerencia-btn"
                      onClick={() => handleSugerenciaClick(sug.text)}
                    >
                      <span className="gemini-sugerencia-icon">{sug.icon}</span>
                      <span className="gemini-sugerencia-text">{sug.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="gemini-chat-input-container">
            <input
              type="text"
              className="gemini-chat-input"
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button
              className="gemini-chat-send"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              <i className="fa fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiChat;
