import React, { useState, useEffect } from 'react';
import './ResetPassword.css';

const ResetPassword = ({ token, onBackToLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  useEffect(() => {
    if (!token) {
      setEstado('Token de recuperación no válido');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEstado('');

    // Validaciones
    if (password.length < 6) {
      setEstado('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setEstado('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reset_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setPasswordReset(true);
        setEstado('Contraseña restablecida exitosamente');
      } else {
        setEstado(data.message || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      setEstado('Error de conexión con el servidor');
    }
    setLoading(false);
  };

  if (passwordReset) {
    return (
      <div 
        className="reset-password-container"
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
        <div className="reset-password-form">
          <img src={process.env.PUBLIC_URL + "/img/JEJ.png"} alt="JEJ Ingeniería" className="login-logo" />
          <h2>Contraseña Restablecida</h2>
          <div className="success-message">
            <p>Tu contraseña ha sido restablecida exitosamente.</p>
            <p>Ahora puedes iniciar sesión con tu nueva contraseña.</p>
          </div>
          <button 
            type="button" 
            onClick={onBackToLogin}
            className="back-button"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="reset-password-container"
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
      <div className="reset-password-form">
        <img src={process.env.PUBLIC_URL + "/img/JEJ.png"} alt="JEJ Ingeniería" className="login-logo" />
        <h2>Nueva Contraseña</h2>
        <p className="reset-password-description">
          Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoFocus
            minLength="6"
          />
          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength="6"
          />
          <button type="submit" disabled={loading || !token}>
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
          {estado && <div className="login-status">{estado}</div>}
        </form>
        <div className="login-links">
          <a href="#" onClick={onBackToLogin}>← Volver al Login</a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
