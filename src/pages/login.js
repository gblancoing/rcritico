import React, { useState } from 'react';
import './Login.css'; // Crea este archivo para los estilos
import { LOGIN_URL } from '../config';
import ForgotPassword from './ForgotPassword';

const Login = ({ setUser, setCentros }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setEstado('');
    setLoading(true);

    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Respuesta no válida del servidor: ' + text.substring(0, 200));
        }
      }

      if (!response.ok) {
        // Si la respuesta no es OK, mostrar el mensaje de error
        if (data && data.message) {
          setEstado(data.message);
        } else {
          setEstado(`Error HTTP ${response.status}: ${data.status || 'Error desconocido'}`);
        }
        console.error('Error en login:', response.status, data);
      } else if (data.status === 'success') {
        setUser(data.user);
        setCentros(data.centros);
        setEstado('Login exitoso');
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('centros', JSON.stringify(data.centros));
      } else if (data.status === 'pending') {
        setEstado('Usuario pendiente de aprobación. Espera autorización de un administrador.');
      } else {
        setEstado(data.message || 'Error de login');
        console.error('Error en login:', data);
      }
    } catch (error) {
      console.error('Error en login:', error);
      setEstado('Error de conexión con el servidor: ' + (error.message || 'Error desconocido'));
    }
    setLoading(false);
  };

  // Si se debe mostrar el formulario de recuperación de contraseña
  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
  }

  return (
    <div
      className="login-bg"
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
      <form className="login-form" onSubmit={handleLogin}>
        <img src={process.env.PUBLIC_URL + "/img/JEJ.png"} alt="JEJ Ingeniería" className="login-logo" />
        <h2>Iniciar Sesión</h2>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        {estado && <div className="login-status">{estado}</div>}
        <div className="login-links">
          ¿No tienes cuenta? <a href="#">Regístrate aquí</a><br />
          <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </form>
    </div>
  );
};

export default Login;
