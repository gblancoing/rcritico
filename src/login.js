import React, { useState } from 'react';
import './Login.css'; // Crea este archivo para los estilos
import { LOGIN_URL } from './config';

const Login = ({ setUser, setCentros }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(false);

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

      const data = await response.json();

      if (data.status === 'success') {
        setUser(data.user);
        setCentros(data.centros);
        setEstado('Login exitoso');
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('centros', JSON.stringify(data.centros));
      } else if (data.status === 'pending') {
        setEstado('Usuario pendiente de aprobación. Espera autorización.');
      } else {
        setEstado(data.message || 'Error de login');
      }
    } catch (error) {
      setEstado('Error de conexión con el servidor');
    }
    setLoading(false);
  };

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
        <img src={process.env.PUBLIC_URL + "/img/logo-codelco.png"} alt="Codelco" className="login-logo" />
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
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
