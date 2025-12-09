import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProyectoPage.css';
import '../styles/ContentLayoutZoom.css';
import '../styles/Navbar.css';
import Navbar from '../components/Navbar';
import CustomSidebar from '../Sidebar';
import ArbolCarpetas from '../components/ArbolCarpetas';
import PresentacionesStaff from '../analisis/PresentacionesStaff';
import InformesStockholders from '../analisis/InformesStockholders';
import Planos from '../analisis/Planos';
import RCA from '../analisis/RCA';
import GestorArchivos from '../components/GestorArchivos';
import ControlTareas from '../components/ControlTareas';
import ResumenComentarios from '../components/ResumenComentarios';
import Dashboard from '../components/Dashboard';
import { API_BASE } from '../config';
import { canAccessProject } from '../utils/permissions';

const ProyectoPage = () => {
  const { proyectoId } = useParams();
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [analisisSeleccionado, setAnalisisSeleccionado] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // const [panelAyudaAbierto, setPanelAyudaAbierto] = useState(false); // Panel de ayuda removido

  // Simulación de usuario (puedes reemplazar por props o contexto si lo tienes)
  const user = JSON.parse(localStorage.getItem('user')) || { nombre: 'Usuario', rol: 'usuario' };
  const centros = JSON.parse(localStorage.getItem('centros')) || [];

  useEffect(() => {
    const fetchProyecto = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/proyectos/proyecto.php?id=${proyectoId}`);
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
    window.location.href = '/';
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
  
  // Verificar permisos de acceso al proyecto
  if (!canAccessProject(user, proyectoId)) {
    return (
      <div className="main-bg">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="content-card" style={{textAlign: 'center', marginTop: '4rem'}}>
          <h2>Acceso Restringido</h2>
          <p>No tienes permisos para acceder a este proyecto.</p>
          <p>Contacta a un administrador si necesitas acceso.</p>
          <button className="selector-ir-btn" onClick={() => navigate('/centros-por-region')}>
            Volver a Proyectos
          </button>
        </div>
      </div>
    );
  }

  const renderAnalisis = () => {
    // Si es gestor_archivos o una carpeta específica
    if (analisisSeleccionado === 'gestor_archivos') {
      return <GestorArchivos 
        proyectoId={proyectoId} 
        centroCostoId={centros.length > 0 ? centros[0].id : null}
        user={user}
        sidebarCollapsed={sidebarCollapsed} 
      />;
    }
    
    if (analisisSeleccionado && analisisSeleccionado.startsWith('carpeta_')) {
      const carpetaId = analisisSeleccionado.replace('carpeta_', '');
      return <GestorArchivos 
        proyectoId={proyectoId} 
        centroCostoId={centros.length > 0 ? centros[0].id : null}
        carpetaId={carpetaId}
        user={user}
        sidebarCollapsed={sidebarCollapsed} 
      />;
    }
    
    switch (analisisSeleccionado) {
      case 'dashboard':
        return <Dashboard 
          proyectoId={proyectoId} 
          proyecto={proyecto}
          user={user} 
          sidebarCollapsed={sidebarCollapsed}
          onNavigateToCarpeta={(carpetaId) => {
            // Navegar a la carpeta específica
            setAnalisisSeleccionado(`carpeta_${carpetaId}`);
          }}
        />;
      case 'control_tareas':
        return <ControlTareas 
          proyectoId={proyectoId} 
          user={user} 
          sidebarCollapsed={sidebarCollapsed}
          onNavigateToCarpeta={(carpetaId, tareaId) => {
            // Navegar a la carpeta y opcionalmente a una tarea específica
            setAnalisisSeleccionado(`carpeta_${carpetaId}`);
            // Guardar el tareaId en sessionStorage para que GestorArchivos lo use
            if (tareaId) {
              sessionStorage.setItem('tareaIdToOpen', tareaId);
            }
          }}
        />;
      case 'resumen_comentarios':
        return <ResumenComentarios 
          proyectoId={proyectoId} 
          user={user} 
          sidebarCollapsed={sidebarCollapsed}
          onNavigateToCarpeta={(carpetaId, mensajeId) => {
            // Navegar a la carpeta y opcionalmente a un mensaje específico
            setAnalisisSeleccionado(`carpeta_${carpetaId}`);
            // Guardar el mensajeId en sessionStorage para que GestorArchivos lo use
            if (mensajeId) {
              sessionStorage.setItem('mensajeIdToOpen', mensajeId);
            }
          }}
        />;
      case 'arbol_carpetas':
        return <ArbolCarpetas proyectoId={proyectoId} user={user} sidebarCollapsed={sidebarCollapsed} />;
      case 'presentaciones_staff':
        return <PresentacionesStaff proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'informes_stockholders':
        return <InformesStockholders proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'planos':
        return <Planos proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      case 'rca':
        return <RCA proyectoId={proyectoId} sidebarCollapsed={sidebarCollapsed} />;
      default:
        return <GestorArchivos 
          proyectoId={proyectoId} 
          centroCostoId={centros.length > 0 ? centros[0].id : null}
          user={user}
          sidebarCollapsed={sidebarCollapsed} 
        />;
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
          user={user}
        />
        <div className={`proyecto-analisis-content ${sidebarCollapsed ? 'sidebar-minimizado' : ''}`}>
          {renderAnalisis()}
        </div>
      </div>
    </div>
  );
};

export default ProyectoPage;
