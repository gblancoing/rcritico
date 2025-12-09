import React, { useState } from 'react';
import './ForgotPassword.css';

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEstado('');
    setLoading(true);

    try {
      const response = await fetch('/api/forgot_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

            if (data.status === 'success') {
                setEmailSent(true);
                if (data.show_link) {
                    setEstado('El email no se pudo enviar, pero puedes usar este enlace para restablecer tu contraseña');
                    setResetLink(data.reset_link);
                } else {
                    setEstado('Si el email está registrado y activo, recibirás un enlace para restablecer tu contraseña');
                }
            } else {
        // Mostrar mensaje específico según el tipo de error
        if (data.message && data.message.includes('aprobada')) {
          setEstado('❌ Tu cuenta aún no ha sido aprobada por un administrador');
        } else if (data.message && data.message.includes('formato')) {
          setEstado('❌ Formato de email inválido');
        } else {
          setEstado(data.message || '❌ Error al procesar la solicitud');
        }
      }
    } catch (error) {
      setEstado('Error de conexión con el servidor');
    }
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div 
        className="forgot-password-container"
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: `url(${process.env.PUBLIC_URL}/img/fondo-codelco.png) center center/cover no-repeat`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <div className="forgot-password-form">
          <img src={process.env.PUBLIC_URL + "/img/JEJ.png"} alt="JEJ Ingeniería" className="login-logo" />
          <h2>Email Enviado</h2>
          <div className="success-message">
            <p>Si el email <strong>{email}</strong> está registrado y activo en nuestro sistema, recibirás un enlace para restablecer tu contraseña.</p>
            <p><strong>Requisitos:</strong> Solo usuarios registrados y aprobados pueden recuperar su contraseña.</p>
            <p>Revisa tu bandeja de entrada y también la carpeta de spam.</p>
          </div>
          <button 
            type="button" 
            onClick={onBackToLogin}
            className="back-button"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="forgot-password-container"
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: `url(${process.env.PUBLIC_URL}/img/fondo-codelco.png) center center/cover no-repeat`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <div className="forgot-password-form">
        <img src={process.env.PUBLIC_URL + "/img/JEJ.png"} alt="JEJ Ingeniería" className="login-logo" />
        <h2>Recuperar Contraseña</h2>
        <p className="forgot-password-description">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.<br/>
          <strong>Solo usuarios registrados y activos pueden usar esta función.</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </button>
          {estado && <div className="login-status">{estado}</div>}
          
          {resetLink && (
            <div className="reset-link-container">
              <h3>🔗 Enlace de Recuperación:</h3>
              <div className="reset-link-box">
                <p><strong>Haz clic en el enlace para restablecer tu contraseña:</strong></p>
                <a href={resetLink} target="_blank" rel="noopener noreferrer" className="reset-link-button">
                  Restablecer Contraseña
                </a>
                <p className="reset-link-url">{resetLink}</p>
              </div>
            </div>
          )}
        </form>
        <div className="login-links">
          <a href="#" onClick={onBackToLogin}>← Volver al Login</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
