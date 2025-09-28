import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProyectoPage.css';
import './css/ContentLayoutZoom.css';
import './css/Navbar.css';
import Navbar from './components/Navbar';
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
  // const [panelAyudaAbierto, setPanelAyudaAbierto] = useState(false); // Panel de ayuda removido

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
        return <ResumenFinanciero proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'factorial':
        return <ReporteFactorial proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'fisico':
        return <ReporteFisicoFinanciero proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'eficiencia':
        return <EficienciaGasto proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'vectores_rp':
        return <VectoresRealProyectado proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'vectores':
        return <Vectores proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'reportabilidad':
        return <Reportabilidad proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'gestion':
        return <GestionProyecto proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'estructura':
        return <EstructuraCuentas sidebarCollapsed={sidebarCollapsed} />;
      default:
        return <ResumenFinanciero proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
    }
  };

  return (
    <div className="main-bg">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="proyecto-layout">
        <CustomSidebar 
          seleccionado={analisisSeleccionado} 
          onSelect={setAnalisisSeleccionado} 
          proyecto={proyecto}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div className={`proyecto-analisis-content ${sidebarCollapsed ? 'sidebar-minimizado' : ''}`}>
          {renderAnalisis()}
        </div>
      </div>
    </div>
  );
};

export default ProyectoPage;
