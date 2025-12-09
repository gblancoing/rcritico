import React, { useState, useEffect, useRef } from 'react';
import './GeminiChat.css';

const GeminiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini_chat.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input.trim() })
      });

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu mensaje.'
      };

      setMessages(prev => [...prev, assistantMessage]);
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
                <i className="fa fa-robot" style={{ fontSize: '3rem', color: '#0a6ebd', marginBottom: '1rem' }}></i>
                <p>¡Hola! Soy tu asistente virtual.</p>
                <p>¿En qué puedo ayudarte hoy?</p>
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
              onClick={handleSend}
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

