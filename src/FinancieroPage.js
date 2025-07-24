import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './MasterPage.css';
import { API_BASE } from './config';

const menuOpciones = [
  { label: 'Resumen', icon: 'fa-chart-pie' },
  { label: 'Ingresos', icon: 'fa-arrow-down' },
  { label: 'Egresos', icon: 'fa-arrow-up' },
  { label: 'Reportes', icon: 'fa-file-alt' },
];

const FinancieroPage = ({ user, centros }) => {
  const navigate = useNavigate();
  const { centroId, proyectoId } = useParams();
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);

  // Buscar el centro de costo seleccionado
  const centro = centros?.find(c => String(c.id) === String(centroId));

  useEffect(() => {
    const fetchProyecto = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/proyectos.php`);
        const data = await res.json();
        const encontrado = data.find(p => String(p.id) === String(proyectoId));
        setProyecto(encontrado);
      } catch (e) {
        setProyecto(null);
      }
      setLoading(false);
    };
    fetchProyecto();
  }, [proyectoId]);

  // Si no hay centro, volver al master
  if (!centro) {
    return (
      <div className="main-bg">
        <div className="content-card" style={{textAlign:'center'}}>
          <h2>Centro de costo no encontrado</h2>
          <button className="selector-ir-btn" onClick={() => navigate('/')}>Volver</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{padding: '2rem'}}>Cargando proyecto...</div>;
  if (!proyecto) return <div style={{padding: '2rem'}}>Proyecto no encontrado.</div>;

  return (
    <div className="main-bg">
      <nav className="navbar">
        <div className="navbar-left">
          <img src="/controlcantidad/img/logo-codelco.png" alt="Logo" className="navbar-logo" />
          <span className="navbar-title">Financiero - {centro.nombre}</span>
          <div className="financiero-menu-opts-navbar">
            {menuOpciones.map(opt => (
              <button key={opt.label} className="financiero-menu-btn-navbar">
                <i className={`fa ${opt.icon}`}></i> {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="navbar-user">
          <button className="selector-ir-btn" style={{marginRight:'1.2rem'}} onClick={() => navigate('/')}>Volver</button>
          <i className="fa fa-user-circle"></i> {user?.nombre} ({user?.rol})
          <button className="logout-btn" onClick={() => { 
            localStorage.removeItem('user'); 
            localStorage.removeItem('centros'); 
            window.location.href = '/financiero/';
          }}>Cerrar sesión</button>
        </div>
      </nav>
      <div className="financiera-card">
        <h3>Bienvenido al módulo financiero de {centro.nombre}</h3>
        <p>Proyecto: {centro.descripcion}</p>
        <div className="financiera-placeholder">
          <i className="fa fa-chart-line"></i> [Aquí irá la interfaz financiera real]
        </div>
      </div>
      {/* Eliminar la tarjeta flotante de información del proyecto aquí */}
    </div>
  );
};

export default FinancieroPage; 