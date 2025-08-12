import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProyectoPage.css';
import CustomSidebar from './Sidebar';
import ResumenFinanciero from './analisis/ResumenFinanciero';
import ReporteFactorial from './analisis/ReporteFactorial';
import ReporteFisicoFinanciero from './analisis/ReporteFisicoFinanciero';
import EficienciaGasto from './analisis/EficienciaGasto';
import VectoresRealProyectado from './analisis/VectoresRealProyectado';
import Vectores from './analisis/Vectores';
import Reportabilidad from './analisis/Reportabilidad';
import GestionProyecto from './analisis/GestionProyecto';
import EstructuraCuentas from './analisis/estructura_cuentas';
import { API_BASE } from './config';

const ProyectoPage = () => {
  const { proyectoId } = useParams();
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [analisisSeleccionado, setAnalisisSeleccionado] = useState('resumen');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [panelAyudaAbierto, setPanelAyudaAbierto] = useState(false);

  // Simulación de usuario (puedes reemplazar por props o contexto si lo tienes)
  const user = JSON.parse(localStorage.getItem('user')) || { nombre: 'Usuario', rol: 'usuario' };
  const centros = JSON.parse(localStorage.getItem('centros')) || [];

  useEffect(() => {
    const fetchProyecto = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/proyecto.php?id=${proyectoId}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setProyecto(data);
      } catch (e) {
        console.error('Error cargando proyecto:', e);
        setProyecto(null);
      }
      setLoading(false);
    };
    fetchProyecto();
  }, [proyectoId]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('centros');
    // Redirigir a la página de login
    window.location.href = '/financiero/';
  };

  const handleUsuariosClick = (event) => {
    event.preventDefault();
    navigate('/usuarios');
  };

  const handleAjusteClick = (event) => {
    event.preventDefault();
    navigate('/ajuste');
  };

  const handleInicioClick = (event) => {
    event.preventDefault();
    navigate('/');
  };

  const handleProyectosClick = (event) => {
    event.preventDefault();
    navigate('/centros-por-region');
  };

  if (loading) return <div style={{padding: '2rem'}}>Cargando proyecto...</div>;
  if (!proyecto) return <div style={{padding: '2rem'}}>Proyecto no encontrado.</div>;

  const renderAnalisis = () => {
    switch (analisisSeleccionado) {
      case 'resumen':
        return <ResumenFinanciero proyectoId={proyectoId} />;
      case 'factorial':
        return <ReporteFactorial proyectoId={proyectoId} />;
      case 'fisico':
        return <ReporteFisicoFinanciero proyectoId={proyectoId} />;
      case 'eficiencia':
        return <EficienciaGasto proyectoId={proyectoId} />;
      case 'vectores_rp':
        return <VectoresRealProyectado proyectoId={proyectoId} />;
      case 'vectores':
        return <Vectores proyectoId={proyectoId} />;
      case 'reportabilidad':
        return <Reportabilidad proyectoId={proyectoId} />;
      case 'gestion':
        return <GestionProyecto proyectoId={proyectoId} />;
      case 'estructura':
        return <EstructuraCuentas />;
      default:
        return <ResumenFinanciero proyectoId={proyectoId} />;
    }
  };

  return (
    <div className="main-bg">
      <nav className="navbar">
        <div className="navbar-left">
          <img src={process.env.PUBLIC_URL + '/img/logo-codelco.png'} alt="Logo" className="navbar-logo" />
          <span className="navbar-title">Control Proyectos Financieros - Codelco</span>
        </div>
        <div className="navbar-menu">
          <a className="navbar-link" onClick={handleInicioClick} style={{cursor: 'pointer'}}>
            <i className="fa fa-home"></i> Inicio
          </a>
          <a className="navbar-link" onClick={handleUsuariosClick} style={{cursor: 'pointer'}}>
            <i className="fa fa-users"></i> Usuarios
          </a>
          <a className="navbar-link" onClick={handleProyectosClick} style={{cursor: 'pointer'}}>
            <i className="fa fa-building"></i> Proyectos
          </a>
          <a className="navbar-link" onClick={handleAjusteClick} style={{cursor: 'pointer'}}>
            <i className="fa fa-question-circle"></i> Ayuda
          </a>
        </div>
        <div className="navbar-user">
          <i className="fa fa-user-circle"></i> {user.nombre} ({user.rol})
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>
      
      <div className="proyecto-layout">
        <CustomSidebar 
          seleccionado={analisisSeleccionado} 
          onSelect={setAnalisisSeleccionado} 
          proyecto={proyecto}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div className={`proyecto-analisis-content ${sidebarCollapsed ? 'sidebar-minimizado' : ''} ${panelAyudaAbierto ? 'panel-ayuda-abierto' : ''}`}>
          {renderAnalisis()}
        </div>
      </div>
    </div>
  );
};

export default ProyectoPage;
