import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ajuste.css';
import '../styles/Navbar.css';
import Navbar from '../components/Navbar';
import SidebarAjustes from '../SidebarAjustes';
import { API_BASE } from '../config';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrador' },
  { value: 'trabajador', label: 'Trabajador' },
  { value: 'visita', label: 'Visita' },
  { value: 'visita_sin_permiso', label: 'Visita Sin Permiso' }
];

const Ajuste = ({ user }) => {
  const navigate = useNavigate();
  
  // Estados generales
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  
  // Datos de backend
  const [centros, setCentros] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [contratos, setContratos] = useState([]);
  
  // Modales
  const [showFormProyecto, setShowFormProyecto] = useState(false);
  const [showFormCentro, setShowFormCentro] = useState(false);
  const [showFormUsuario, setShowFormUsuario] = useState(false);
  const [showFormEmpresa, setShowFormEmpresa] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [modalEliminarUsuario, setModalEliminarUsuario] = useState(null); // { id, nombre } o null
  const [passwordEliminar, setPasswordEliminar] = useState('');
  const [errorPasswordEliminar, setErrorPasswordEliminar] = useState('');
  
  // Formularios
  const [formProyecto, setFormProyecto] = useState({ nombre: '', descripcion: '', region_id: '' });
  const [formCentro, setFormCentro] = useState({ nombre: '', descripcion: '', proyecto_id: '' });
  const [formUsuario, setFormUsuario] = useState({
    nombre: '', email: '', password: '', rol: 'trabajador',
    region_id: '', proyecto_id: '', centro_costo_id: '', empresa_id: '', aprobado: 1
  });
  const [formEmpresa, setFormEmpresa] = useState({
    nombre: '',
    rut: '',
    direccion: '',
    telefono: '',
    email: '',
    contacto_nombre: '',
    contacto_telefono: '',
    contacto_email: '',
    regiones: [],
    proyectos: []
  });
  
  // Estados para cascada de selects
  const [crearProyectosFiltrados, setCrearProyectosFiltrados] = useState([]);
  const [proyectosFiltradosEmpresa, setProyectosFiltradosEmpresa] = useState([]);
  const [crearCentrosFiltrados, setCrearCentrosFiltrados] = useState([]);
  const [crearEmpresasFiltradas, setCrearEmpresasFiltradas] = useState([]);
  const [editProyectosFiltrados, setEditProyectosFiltrados] = useState([]);
  const [editCentrosFiltrados, setEditCentrosFiltrados] = useState([]);

  // Control de acceso
  if (!user || (user.rol !== 'super_admin' && user.rol !== 'admin')) {
    return (
      <div className="main-bg">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="usuarios-acceso-denegado">
          <h2>Acceso denegado</h2>
          <p>No tienes permisos para acceder a los ajustes del sistema.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cascadas para crear usuario
  useEffect(() => {
    if (formUsuario.region_id) {
      const proyectosDeRegion = proyectos.filter(p => String(p.region_id) === String(formUsuario.region_id));
      setCrearProyectosFiltrados(proyectosDeRegion);
      if (formUsuario.proyecto_id && !proyectosDeRegion.find(p => String(p.proyecto_id) === String(formUsuario.proyecto_id))) {
        setFormUsuario(f => ({...f, proyecto_id: '', centro_costo_id: ''}));
      }
    } else {
      setCrearProyectosFiltrados([]);
    }
  }, [formUsuario.region_id, proyectos]);

  useEffect(() => {
    if (formUsuario.proyecto_id) {
      const centrosDeProyecto = centros.filter(c => String(c.proyecto_id) === String(formUsuario.proyecto_id));
      setCrearCentrosFiltrados(centrosDeProyecto);
      // Solo limpiar centro_costo_id si está editando y el centro no existe en los filtrados
      // No limpiar si está en modo edición y el centro ya estaba asignado
      if (formUsuario.centro_costo_id && centrosDeProyecto.length > 0 && !centrosDeProyecto.find(c => String(c.id) === String(formUsuario.centro_costo_id))) {
        setFormUsuario(f => ({...f, centro_costo_id: ''}));
      }
      
      // Filtrar empresas según el proyecto seleccionado
      const empresasDelProyecto = empresas.filter(e => 
        e.proyectos && e.proyectos.some(p => String(p.proyecto_id) === String(formUsuario.proyecto_id))
      );
      setCrearEmpresasFiltradas(empresasDelProyecto);
      // Solo limpiar empresa_id si está editando y la empresa no existe en los filtrados
      if (formUsuario.empresa_id && empresasDelProyecto.length > 0 && !empresasDelProyecto.find(e => e.empresa_id === formUsuario.empresa_id)) {
        setFormUsuario(f => ({...f, empresa_id: ''}));
      }
    } else {
      setCrearCentrosFiltrados([]);
      setCrearEmpresasFiltradas([]);
      // Solo limpiar si NO está en modo edición (cuando editingItem es null)
      // Si está editando, mantener los valores aunque no haya proyecto seleccionado
      if (!editingItem) {
        setFormUsuario(f => ({...f, centro_costo_id: '', empresa_id: ''}));
      }
    }
  }, [formUsuario.proyecto_id, centros, empresas, editingItem]);

  // Filtrar proyectos según las regiones seleccionadas en el formulario de empresa
  useEffect(() => {
    if (!proyectos || proyectos.length === 0) {
      setProyectosFiltradosEmpresa([]);
      return;
    }

    if (formEmpresa.regiones && formEmpresa.regiones.length > 0) {
      // Filtrar proyectos que pertenecen a las regiones seleccionadas
      const proyectosFiltrados = proyectos.filter(p => 
        formEmpresa.regiones.includes(p.region_id)
      );
      setProyectosFiltradosEmpresa(proyectosFiltrados);
      
      // Remover proyectos que ya no están en las regiones seleccionadas
      const proyectosValidos = formEmpresa.proyectos.filter(proyectoId => {
        const proyecto = proyectos.find(p => p.proyecto_id === proyectoId);
        return proyecto && formEmpresa.regiones.includes(proyecto.region_id);
      });
      
      // Solo actualizar si hay cambios para evitar loops infinitos
      if (proyectosValidos.length !== formEmpresa.proyectos.length) {
        setFormEmpresa(prev => ({...prev, proyectos: proyectosValidos}));
      }
    } else {
      setProyectosFiltradosEmpresa([]);
      // Limpiar proyectos si no hay regiones seleccionadas
      if (formEmpresa.proyectos && formEmpresa.proyectos.length > 0) {
        setFormEmpresa(prev => ({...prev, proyectos: []}));
      }
    }
  }, [formEmpresa.regiones, proyectos, formEmpresa.proyectos.length]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resCentros, resProyectos, resRegiones, resUsuarios, resEmpresas] = await Promise.all([
        fetch(`${API_BASE}/centros_costo.php`),
        fetch(`${API_BASE}/proyectos.php`),
        fetch(`${API_BASE}/regiones.php`),
        fetch(`${API_BASE}/usuarios.php`),
        fetch(`${API_BASE}/empresas/empresas.php`).catch(() => ({ json: async () => [] })) // Manejar si no existe aún
      ]);
      
      const dataCentros = await resCentros.json();
      const dataProyectos = await resProyectos.json();
      const dataRegiones = await resRegiones.json();
      const dataUsuarios = await resUsuarios.json();
      const dataEmpresas = await resEmpresas.json();
      
      setCentros(Array.isArray(dataCentros) ? dataCentros : []);
      setProyectos(Array.isArray(dataProyectos) ? dataProyectos : []);
      setRegiones(Array.isArray(dataRegiones) ? dataRegiones : []);
      setUsuarios(Array.isArray(dataUsuarios) ? dataUsuarios : []);
      setEmpresas(Array.isArray(dataEmpresas) ? dataEmpresas : []);
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
    setLoading(false);
  };

  function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('centros');
    window.location.href = '/';
  }

  const showStatusMessage = (message, type = 'success') => {
    setStatusMessage({ message, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSidebarNavigation = (view) => {
    setCurrentView(view);
  };

  // Funciones de proyectos
  const handleSubmitProyecto = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `${API_BASE}/proyectos.php`
        : `${API_BASE}/proyectos.php`;
      const method = 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formProyecto)
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showStatusMessage(editingItem ? 'Proyecto actualizado correctamente' : 'Proyecto agregado correctamente');
          setShowFormProyecto(false);
          setEditingItem(null);
          setFormProyecto({ nombre: '', descripcion: '', region_id: '' });
          cargarDatos();
        }
      }
    } catch (error) {
      showStatusMessage('Error al procesar proyecto', 'error');
    }
  };

  const handleSubmitCentro = async (e) => {
    e.preventDefault();
    try {
      const proyectoId = parseInt(formCentro.proyecto_id);
      if (isNaN(proyectoId)) {
        showStatusMessage('Proyecto inválido', 'error');
        return;
      }
      const response = await fetch(`${API_BASE}/centros_costo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: formCentro.nombre, 
          descripcion: formCentro.descripcion, 
          proyecto_id: proyectoId 
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showStatusMessage(editingItem ? 'Centro de costo actualizado correctamente' : 'Centro de costo agregado correctamente');
          setShowFormCentro(false);
          setEditingItem(null);
          setFormCentro({ nombre: '', descripcion: '', proyecto_id: '' });
          cargarDatos();
        }
      }
    } catch (error) {
      showStatusMessage('Error al procesar centro de costo', 'error');
    }
  };

  const handleSubmitUsuario = async (e) => {
    e.preventDefault();
    
    const esEdicionUsuario = Boolean(showFormUsuario && editingItem);
    const requiereCentro = !['visita', 'visita_sin_permiso'].includes(formUsuario.rol);
    
    if (!formUsuario.nombre || !formUsuario.email) {
      showStatusMessage('Nombre y correo son obligatorios', 'error');
      return;
    }

    if (!esEdicionUsuario && !formUsuario.password) {
      showStatusMessage('Debes definir una contraseña para el nuevo usuario', 'error');
      return;
    }

    if (requiereCentro && !formUsuario.centro_costo_id) {
      showStatusMessage('Selecciona un centro de costo para este rol', 'error');
      return;
    }

    try {
      const payload = {
        nombre: formUsuario.nombre,
        email: formUsuario.email,
        rol: formUsuario.rol,
        aprobado: Number(formUsuario.aprobado),
        password: formUsuario.password || undefined,
        region_id: formUsuario.region_id ? parseInt(formUsuario.region_id) : null,
        proyecto_id: formUsuario.proyecto_id ? parseInt(formUsuario.proyecto_id) : null,
        centro_costo_id: requiereCentro && formUsuario.centro_costo_id
          ? parseInt(formUsuario.centro_costo_id)
          : null,
        empresa_id: formUsuario.empresa_id || null
      };

      let endpoint = `${API_BASE}/crear_usuario.php`;

      if (esEdicionUsuario) {
        endpoint = `${API_BASE}/editar_usuario.php`;
        payload.id = editingItem.id;
        if (!formUsuario.password) {
          delete payload.password;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showStatusMessage(esEdicionUsuario ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        setShowFormUsuario(false);
        setEditingItem(null);
        setFormUsuario({ nombre: '', email: '', password: '', rol: 'trabajador', region_id: '', proyecto_id: '', centro_costo_id: '', empresa_id: '', aprobado: 1 });
        cargarDatos();
      } else {
        const mensajeError = data?.error || 'No se pudo procesar la solicitud';
        showStatusMessage(mensajeError, 'error');
      }
    } catch (error) {
      console.error('Error al procesar usuario:', error);
      showStatusMessage('Error al procesar usuario', 'error');
    }
  };

  const handleEditProyecto = (proyecto) => {
    setEditingItem(proyecto);
    setFormProyecto({
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      region_id: proyecto.region_id
    });
    setShowFormProyecto(true);
  };

  const handleEditCentro = (centro) => {
    setEditingItem(centro);
    setFormCentro({
      nombre: centro.nombre,
      descripcion: centro.descripcion,
      proyecto_id: centro.proyecto_id
    });
    setShowFormCentro(true);
  };

  const handleEditUsuario = (usuario) => {
    setEditingItem(usuario);
    console.log('Editando usuario completo:', usuario); // Debug
    
    // Usar centro_costo_id_real si existe, sino centro_costo_id
    const centroCostoId = usuario.centro_costo_id_real || usuario.centro_costo_id;
    
    setFormUsuario({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '',
      rol: usuario.rol || 'trabajador',
      region_id: (usuario.region_id !== null && usuario.region_id !== undefined) ? String(usuario.region_id) : '',
      proyecto_id: (usuario.proyecto_id !== null && usuario.proyecto_id !== undefined) ? String(usuario.proyecto_id) : '',
      centro_costo_id: (centroCostoId !== null && centroCostoId !== undefined) ? String(centroCostoId) : '',
      empresa_id: usuario.empresa_id || '',
      aprobado: usuario.aprobado !== undefined && usuario.aprobado !== null ? usuario.aprobado : 1
    });
    
    console.log('Formulario configurado:', {
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      rol: usuario.rol || 'trabajador',
      region_id: (usuario.region_id !== null && usuario.region_id !== undefined) ? String(usuario.region_id) : '',
      proyecto_id: (usuario.proyecto_id !== null && usuario.proyecto_id !== undefined) ? String(usuario.proyecto_id) : '',
      centro_costo_id: (centroCostoId !== null && centroCostoId !== undefined) ? String(centroCostoId) : '',
      empresa_id: usuario.empresa_id || '',
      aprobado: usuario.aprobado !== undefined && usuario.aprobado !== null ? usuario.aprobado : 1
    }); // Debug
    
    setShowFormUsuario(true);
  };

  const handleDeleteCentro = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este centro de costo?')) return;
    try {
      const response = await fetch(`${API_BASE}/eliminar_centro_costo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showStatusMessage('Centro de costo eliminado');
          cargarDatos();
        }
      }
    } catch (error) {
      showStatusMessage('Error al eliminar', 'error');
    }
  };

  // Funciones de empresas
  const handleSubmitEmpresa = async (e) => {
    e.preventDefault();
    if (!formEmpresa.nombre || !formEmpresa.rut || formEmpresa.rut.trim() === '') {
      showStatusMessage('El nombre y el RUT son obligatorios', 'error');
      return;
    }
    
    try {
      const url = `${API_BASE}/empresas/empresas.php`;
      const method = editingItem ? 'PUT' : 'POST';
      const payload = {
        ...formEmpresa,
        empresa_id: editingItem ? editingItem.empresa_id : undefined // empresa_id es el RUT
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showStatusMessage(editingItem ? 'Empresa actualizada correctamente' : 'Empresa agregada correctamente');
          setShowFormEmpresa(false);
          setEditingItem(null);
          setFormEmpresa({
            nombre: '',
            rut: '',
            direccion: '',
            telefono: '',
            email: '',
            contacto_nombre: '',
            contacto_telefono: '',
            contacto_email: '',
            regiones: [],
            proyectos: []
          });
          cargarDatos();
        } else {
          showStatusMessage(data.error || 'Error al procesar empresa', 'error');
        }
      } else {
        const errorData = await response.json();
        showStatusMessage(errorData.error || 'Error al procesar empresa', 'error');
      }
    } catch (error) {
      showStatusMessage('Error al procesar empresa', 'error');
      console.error('Error:', error);
    }
  };

  const handleEditEmpresa = (empresa) => {
    setEditingItem(empresa);
    setFormEmpresa({
      nombre: empresa.nombre || '',
      rut: empresa.empresa_id || empresa.rut || '', // empresa_id es el RUT
      direccion: empresa.direccion || '',
      telefono: empresa.telefono || '',
      email: empresa.email || '',
      contacto_nombre: empresa.contacto_nombre || '',
      contacto_telefono: empresa.contacto_telefono || '',
      contacto_email: empresa.contacto_email || '',
      regiones: empresa.regiones ? empresa.regiones.map(r => r.region_id) : [],
      proyectos: empresa.proyectos ? empresa.proyectos.map(p => p.proyecto_id) : []
    });
    setShowFormEmpresa(true);
  };

  const handleDeleteEmpresa = async (empresaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta empresa? Se eliminarán todas sus relaciones con regiones y proyectos.')) return;
    try {
      const response = await fetch(`${API_BASE}/empresas/empresas.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id: empresaId }) // empresa_id es el RUT
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showStatusMessage('Empresa eliminada correctamente');
          cargarDatos();
        } else {
          showStatusMessage(data.error || 'Error al eliminar empresa', 'error');
        }
      }
    } catch (error) {
      showStatusMessage('Error al eliminar empresa', 'error');
    }
  };

  // Abrir modal de confirmación para eliminar usuario
  const handleDeleteUsuario = (usuario) => {
    setModalEliminarUsuario({ id: usuario.id, nombre: usuario.nombre });
    setPasswordEliminar('');
    setErrorPasswordEliminar('');
  };

  // Confirmar eliminación con contraseña
  const handleConfirmarEliminarUsuario = async () => {
    if (!modalEliminarUsuario) return;
    
    if (!passwordEliminar) {
      setErrorPasswordEliminar('Por favor, ingrese la contraseña de confirmación');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/usuarios/eliminar_usuario.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: modalEliminarUsuario.id,
          password_confirmacion: passwordEliminar,
          usuario_que_elimina_id: user.id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showStatusMessage('Usuario eliminado correctamente');
          cargarDatos();
          setModalEliminarUsuario(null);
          setPasswordEliminar('');
          setErrorPasswordEliminar('');
        } else {
          setErrorPasswordEliminar(data.error || 'Error al eliminar usuario');
        }
      } else {
        const data = await response.json();
        setErrorPasswordEliminar(data.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      setErrorPasswordEliminar('Error de red al eliminar usuario.');
    }
  };

  // Cerrar modal de eliminación
  const handleCerrarModalEliminar = () => {
    setModalEliminarUsuario(null);
    setPasswordEliminar('');
    setErrorPasswordEliminar('');
  };

  const getProyectoNombre = (proyectoId) => {
    const proyecto = proyectos.find(p => String(p.proyecto_id) === String(proyectoId));
    return proyecto ? proyecto.nombre : 'N/A';
  };

  const getRegionNombre = (regionId) => {
    const region = regiones.find(r => String(r.region_id) === String(regionId));
    return region ? region.nombre : 'N/A';
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCentros = [...centros].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    if (sortConfig.key === 'proyecto_id') {
      aValue = getProyectoNombre(a.proyecto_id);
      bValue = getProyectoNombre(b.proyecto_id);
    } else if (sortConfig.key === 'region_id') {
      aValue = getRegionNombre(a.region_id);
      bValue = getRegionNombre(b.region_id);
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedProyectos = [...proyectos].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    if (sortConfig.key === 'region_id') {
      aValue = getRegionNombre(a.region_id);
      bValue = getRegionNombre(b.region_id);
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedEmpresas = [...empresas].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    if (sortConfig.key === 'empresa_id') {
      // Para RUT, comparar como string
      aValue = String(a.empresa_id || a.rut || '');
      bValue = String(b.empresa_id || b.rut || '');
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const usuariosFiltrados = user.rol === 'admin' 
    ? usuarios.filter(u => String(u.centro_costo_id) === String(user.centro_costo_id))
    : usuarios;

  if (loading) {
    return (
      <div className="main-bg">
        <div className="content-card" style={{textAlign: 'center', padding: '3rem'}}>
          <div className="loading-spinner"></div>
          <span>Cargando datos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="main-bg">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="ajuste-layout">
        {/* Sidebar usando el componente existente del proyecto */}
        {!sidebarHidden && (
          <SidebarAjustes
            seleccionado={currentView}
            onNavigate={handleSidebarNavigation}
            onCollapsedChange={setSidebarCollapsed}
            collapsed={sidebarCollapsed}
            user={user}
          />
        )}

        {/* Contenido principal */}
        <main className={`ajuste-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="ajuste-container">
              <h1 className="ajuste-titulo">PANEL PRINCIPAL DE AJUSTES</h1>
              
              {/* Indicadores Clave */}
              <div className="dashboard-kpis">
                <div className="kpi-card">
                  <div className="kpi-icon proyectos">
                    <i className="fa fa-pie-chart"></i>
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-number">{proyectos.length}</div>
                    <div className="kpi-label">Proyectos Activos</div>
                  </div>
                </div>
                
                <div className="kpi-card">
                  <div className="kpi-icon centros">
                    <i className="fa fa-file-text"></i>
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-number">{centros.length}</div>
                    <div className="kpi-label">Centros de Costo</div>
                  </div>
                </div>
                
                <div className="kpi-card">
                  <div className="kpi-icon empresas">
                    <i className="fa fa-building"></i>
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-number">{empresas.length}</div>
                    <div className="kpi-label">Empresas Contratistas</div>
                  </div>
                </div>
                
                <div className="kpi-card">
                  <div className="kpi-icon regiones">
                    <i className="fa fa-map-marker"></i>
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-number">{regiones.length}</div>
                    <div className="kpi-label">Regiones</div>
                  </div>
                </div>
                
                <div className="kpi-card">
                  <div className="kpi-icon usuarios">
                    <i className="fa fa-users"></i>
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-number">{usuarios.length}</div>
                    <div className="kpi-label">Usuarios</div>
                  </div>
                </div>

                <div className="kpi-card status-card">
                  <div className="kpi-icon status">
                    <i className="fa fa-check-circle"></i>
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-status">SISTEMA OPERATIVO</div>
                    <div className="kpi-label">Estado: Activo</div>
                  </div>
                </div>
              </div>

              {/* Accesos Rápidos */}
              <div className="dashboard-quick-access">
                <h3 className="quick-access-title">ACCESOS RÁPIDOS</h3>
                <div className="quick-access-grid">
                  <div 
                    className="quick-access-card"
                    onClick={() => handleSidebarNavigation('proyectos')}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="quick-access-icon" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>
                      <i className="fa fa-pie-chart"></i>
                    </div>
                    <div className="quick-access-title-card">Gestionar Proyectos</div>
                    <div className="quick-access-count">{proyectos.length} proyectos</div>
                  </div>
                  
                  <div 
                    className="quick-access-card"
                    onClick={() => handleSidebarNavigation('centros-costo')}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="quick-access-icon" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>
                      <i className="fa fa-file-text"></i>
                    </div>
                    <div className="quick-access-title-card">Gestionar Centros de Costo</div>
                    <div className="quick-access-count">{centros.length} centros</div>
                  </div>
                  
                  <div 
                    className="quick-access-card"
                    onClick={() => handleSidebarNavigation('empresas')}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="quick-access-icon" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>
                      <i className="fa fa-building"></i>
                    </div>
                    <div className="quick-access-title-card">Gestionar Empresas</div>
                    <div className="quick-access-count">{empresas.length} empresas</div>
                  </div>
                  
                  <div 
                    className="quick-access-card"
                    onClick={() => handleSidebarNavigation('usuarios')}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="quick-access-icon" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>
                      <i className="fa fa-users"></i>
                    </div>
                    <div className="quick-access-title-card">Administrar Usuarios</div>
                    <div className="quick-access-count">{usuarios.length} usuarios</div>
                  </div>
                </div>
              </div>

              {statusMessage && (
                <div className={`ajuste-feedback ${statusMessage.type}`}>
                  <i className={`fa fa-${statusMessage.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                  {statusMessage.message}
                </div>
              )}
            </div>
          )}

          {/* Centros de Costo View */}
          {currentView === 'centros-costo' && (
            <div className="ajuste-container">
              <h1 className="ajuste-titulo">GESTIÓN DE CENTROS DE COSTO</h1>
              
              <div className="ajuste-botones">
                <button 
                  className="ajuste-btn centro"
                  onClick={() => {
                    setEditingItem(null);
                    setFormCentro({ nombre: '', descripcion: '', proyecto_id: '' });
                    setShowFormCentro(true);
                  }}
                >
                  + AGREGAR CENTRO DE COSTO
                </button>
              </div>

              <div className="usuarios-table-wrapper">
                <table className="usuarios-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('id')} style={{cursor: 'pointer'}}>
                        ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('nombre')} style={{cursor: 'pointer'}}>
                        NOMBRE {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('descripcion')} style={{cursor: 'pointer'}}>
                        DESCRIPCIÓN {sortConfig.key === 'descripcion' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('proyecto_id')} style={{cursor: 'pointer'}}>
                        PROYECTO {sortConfig.key === 'proyecto_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('region_id')} style={{cursor: 'pointer'}}>
                        REGIÓN {sortConfig.key === 'region_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCentros.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem'}}>
                          No hay centros de costo disponibles
                        </td>
                      </tr>
                    ) : (
                      sortedCentros.map(centro => (
                        <tr key={centro.id}>
                          <td>{centro.id}</td>
                          <td>{centro.nombre}</td>
                          <td>{centro.descripcion}</td>
                          <td>{centro.proyecto_nombre || getProyectoNombre(centro.proyecto_id)}</td>
                          <td>{centro.region_nombre || 'N/A'}</td>
                          <td>
                            <button 
                              className="usuarios-accion-btn"
                              onClick={() => handleEditCentro(centro)}
                              title="Editar centro de costo"
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                            <button 
                              className="usuarios-accion-btn usuarios-eliminar-btn"
                              onClick={() => handleDeleteCentro(centro.id)}
                              title="Eliminar centro de costo"
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Proyectos View */}
          {currentView === 'proyectos' && (
            <div className="ajuste-container">
              <h1 className="ajuste-titulo">GESTIÓN DE PROYECTOS</h1>
              
              <div className="ajuste-botones">
                <button 
                  className="ajuste-btn proyecto"
                  onClick={() => {
                    setEditingItem(null);
                    setFormProyecto({ nombre: '', descripcion: '', region_id: '' });
                    setShowFormProyecto(true);
                  }}
                >
                  + AGREGAR PROYECTO
                </button>
              </div>

              <div className="usuarios-table-wrapper">
                <table className="usuarios-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('proyecto_id')} style={{cursor: 'pointer'}}>
                        ID {sortConfig.key === 'proyecto_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('nombre')} style={{cursor: 'pointer'}}>
                        NOMBRE {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('descripcion')} style={{cursor: 'pointer'}}>
                        DESCRIPCIÓN {sortConfig.key === 'descripcion' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('region_id')} style={{cursor: 'pointer'}}>
                        REGIÓN {sortConfig.key === 'region_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProyectos.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem'}}>
                          No hay proyectos disponibles
                        </td>
                      </tr>
                    ) : (
                      sortedProyectos.map(proyecto => (
                        <tr key={proyecto.proyecto_id}>
                          <td>{proyecto.proyecto_id}</td>
                          <td>{proyecto.nombre}</td>
                          <td>{proyecto.descripcion}</td>
                          <td>{getRegionNombre(proyecto.region_id)}</td>
                          <td>
                            <button 
                              className="usuarios-accion-btn"
                              onClick={() => handleEditProyecto(proyecto)}
                              title="Editar proyecto"
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empresas View */}
          {currentView === 'empresas' && (
            <div className="ajuste-container">
              <h1 className="ajuste-titulo">GESTIÓN DE EMPRESAS CONTRATISTAS</h1>
              
              <div className="ajuste-botones">
                <button 
                  className="ajuste-btn empresa"
                  onClick={() => {
                    setEditingItem(null);
                    setFormEmpresa({
                      nombre: '',
                      rut: '',
                      direccion: '',
                      telefono: '',
                      email: '',
                      contacto_nombre: '',
                      contacto_telefono: '',
                      contacto_email: '',
                      regiones: [],
                      proyectos: []
                    });
                    setShowFormEmpresa(true);
                  }}
                >
                  + AGREGAR EMPRESA
                </button>
              </div>

              <div className="usuarios-table-wrapper">
                <table className="usuarios-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('empresa_id')} style={{cursor: 'pointer'}}>
                        RUT {sortConfig.key === 'empresa_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('nombre')} style={{cursor: 'pointer'}}>
                        NOMBRE {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>CONTACTO</th>
                      <th>REGIÓN(ES)</th>
                      <th>PROYECTO(S)</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEmpresas.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem'}}>
                          No hay empresas registradas
                        </td>
                      </tr>
                    ) : (
                      sortedEmpresas.map(empresa => (
                        <tr key={empresa.empresa_id}>
                          <td style={{fontWeight: '600', color: '#0a6ebd'}}>{empresa.empresa_id || empresa.rut || '-'}</td>
                          <td style={{fontWeight: '600'}}>{empresa.nombre}</td>
                          <td>
                            {empresa.contacto_nombre ? (
                              <div>
                                <div style={{fontWeight: '500'}}>{empresa.contacto_nombre}</div>
                                {empresa.contacto_email && (
                                  <div style={{fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem'}}>
                                    <i className="fa fa-envelope" style={{marginRight: '0.25rem'}}></i>
                                    {empresa.contacto_email}
                                  </div>
                                )}
                                {empresa.contacto_telefono && (
                                  <div style={{fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem'}}>
                                    <i className="fa fa-phone" style={{marginRight: '0.25rem'}}></i>
                                    {empresa.contacto_telefono}
                                  </div>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                          <td>
                            {empresa.regiones && empresa.regiones.length > 0 ? (
                              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                                {empresa.regiones.map((r) => (
                                  <span key={r.region_id} style={{
                                    display: 'inline-block',
                                    padding: '0.35rem 0.75rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                                  }}>
                                    {r.nombre}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Sin regiones</span>
                            )}
                          </td>
                          <td>
                            {empresa.proyectos && empresa.proyectos.length > 0 ? (
                              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                                {empresa.proyectos.map((p) => (
                                  <span key={p.proyecto_id} style={{
                                    display: 'inline-block',
                                    padding: '0.35rem 0.75rem',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
                                  }}>
                                    {p.nombre}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Sin proyectos</span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="usuarios-accion-btn"
                              onClick={() => handleEditEmpresa(empresa)}
                              title="Editar empresa"
                              style={{marginRight: '0.5rem'}}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                            <button 
                              className="usuarios-accion-btn usuarios-eliminar-btn"
                              onClick={() => handleDeleteEmpresa(empresa.empresa_id)}
                              title="Eliminar empresa"
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contratos View */}
          {currentView === 'contratos' && (
            <div className="ajuste-container">
              <h1 className="ajuste-titulo">GESTIÓN DE CONTRATOS</h1>
              <div style={{textAlign: 'center', padding: '3rem', color: '#666'}}>
                <i className="fa fa-file-text" style={{fontSize: '4rem', marginBottom: '1rem', color: '#10b981'}}></i>
                <p style={{fontSize: '1.2rem'}}>Funcionalidad en desarrollo</p>
              </div>
            </div>
          )}

          {/* Usuarios View */}
          {currentView === 'usuarios' && (
            <div className="ajuste-container">
              <h1 className="ajuste-titulo">ADMINISTRACIÓN DE USUARIOS</h1>
              
              <div className="ajuste-botones">
                <button 
                  className="ajuste-btn usuario"
                  onClick={() => {
                    setEditingItem(null);
                    let initialRegionId = '';
                    if (user.rol === 'admin') {
                      initialRegionId = user.region_id;
                    } else if (user.rol === 'super_admin' && regiones.length > 0) {
                      initialRegionId = regiones[0].region_id;
                    }
                    setFormUsuario({
                      nombre: '',
                      email: '',
                      password: '',
                      rol: 'trabajador',
                      region_id: initialRegionId,
                      proyecto_id: user.rol === 'admin' ? user.proyecto_id : '',
                      centro_costo_id: user.rol === 'admin' ? user.centro_costo_id : '',
                      empresa_id: '',
                      aprobado: 1
                    });
                    setShowFormUsuario(true);
                  }}
                >
                  + AGREGAR USUARIO
                </button>
              </div>

              <div className="usuarios-table-wrapper">
                <table className="usuarios-table">
                  <thead>
                    <tr>
                      <th>NOMBRE</th>
                      <th>EMAIL</th>
                      <th>ROL</th>
                      <th>CENTRO DE COSTO</th>
                      <th>PROYECTO</th>
                      <th>REGIÓN</th>
                      <th>APROBADO</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem'}}>
                          No hay usuarios disponibles
                        </td>
                      </tr>
                    ) : (
                      usuariosFiltrados.map(u => (
                        <tr key={u.id}>
                          <td>{u.nombre}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`rol-badge rol-${u.rol}`}>
                              {u.rol}
                            </span>
                          </td>
                          <td>{u.centro_costo_nombre || '-'}</td>
                          <td>{u.proyecto_nombre || '-'}</td>
                          <td>{u.region_nombre || '-'}</td>
                          <td>
                            <span className={`estado-badge ${u.aprobado ? 'aprobado' : 'pendiente'}`}>
                              {u.aprobado ? 'Aprobado' : 'Pendiente'}
                            </span>
                          </td>
                          <td>
                            {(user.rol === 'super_admin' || (user.rol === 'admin' && ['trabajador', 'visita_sin_permiso'].includes(u.rol))) && (
                              <>
                                <button 
                                  className="usuarios-accion-btn"
                                  onClick={() => handleEditUsuario(u)}
                                  title="Editar usuario"
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                                {user.rol === 'super_admin' && (
                                  <button 
                                    className="usuarios-accion-btn usuarios-eliminar-btn"
                                    onClick={() => handleDeleteUsuario(u)}
                                    title="Eliminar usuario"
                                  >
                                    <i className="fa fa-trash"></i>
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Configuración View */}
          {currentView === 'configuracion' && (
            <div className="ajuste-container">
              <h1 className="ajuste-titulo">CONFIGURACIÓN GENERAL DEL SISTEMA</h1>
              <div style={{textAlign: 'center', padding: '3rem', color: '#666'}}>
                <i className="fa fa-cog" style={{fontSize: '4rem', marginBottom: '1rem', color: '#607d8b'}}></i>
                <p style={{fontSize: '1.2rem'}}>Funcionalidad en desarrollo</p>
              </div>
            </div>
          )}

          {/* Backup View */}
          {currentView === 'backup' && (
            <div className="ajuste-container">
              <h1 className="ajuste-titulo">BACKUP & RESTORE</h1>
              <div style={{textAlign: 'center', padding: '3rem', color: '#666'}}>
                <i className="fa fa-database" style={{fontSize: '4rem', marginBottom: '1rem', color: '#607d8b'}}></i>
                <p style={{fontSize: '1.2rem'}}>Funcionalidad en desarrollo</p>
              </div>
            </div>
          )}

          {/* Seguridad View */}
          {currentView === 'seguridad' && (
            <div className="ajuste-container">
              <h1 className="ajuste-titulo">CONFIGURACIÓN DE SEGURIDAD</h1>
              <div style={{textAlign: 'center', padding: '3rem', color: '#666'}}>
                <i className="fa fa-shield" style={{fontSize: '4rem', marginBottom: '1rem', color: '#607d8b'}}></i>
                <p style={{fontSize: '1.2rem'}}>Funcionalidad en desarrollo</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Proyecto */}
      {showFormProyecto && (
        <div className="usuarios-modal-bg">
          <div className="usuarios-modal">
            <h3>{editingItem ? 'Editar Proyecto' : 'Agregar Nuevo Proyecto'}</h3>
            <form className="usuarios-modal-form" onSubmit={handleSubmitProyecto}>
              <label>
                <i className="fa fa-building" style={{marginRight: '0.5rem'}}></i>
                Nombre del Proyecto:
                <input type="text" value={formProyecto.nombre} onChange={(e) => setFormProyecto({...formProyecto, nombre: e.target.value})} required placeholder="Ingresa el nombre del proyecto" />
              </label>
              <label>
                <i className="fa fa-info-circle" style={{marginRight: '0.5rem'}}></i>
                Descripción:
                <textarea value={formProyecto.descripcion} onChange={(e) => setFormProyecto({...formProyecto, descripcion: e.target.value})} required placeholder="Describe el proyecto" />
              </label>
              <label>
                <i className="fa fa-map-marker" style={{marginRight: '0.5rem'}}></i>
                Región:
                <select value={formProyecto.region_id} onChange={(e) => setFormProyecto({...formProyecto, region_id: e.target.value})} required>
                  <option value="">Seleccionar región</option>
                  {regiones.map(region => (
                    <option key={region.region_id} value={region.region_id}>{region.nombre}</option>
                  ))}
                </select>
              </label>
              <div className="usuarios-modal-actions">
                <button type="submit" className="usuarios-accion-btn">
                  <i className="fa fa-save" style={{marginRight: '0.3rem'}}></i>
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button type="button" className="usuarios-accion-btn" onClick={() => { setShowFormProyecto(false); setEditingItem(null); }}>
                  <i className="fa fa-times" style={{marginRight: '0.3rem'}}></i>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Centro de Costo */}
      {showFormCentro && (
        <div className="usuarios-modal-bg">
          <div className="usuarios-modal">
            <h3>{editingItem ? 'Editar Centro de Costo' : 'Agregar Nuevo Centro de Costo'}</h3>
            <form className="usuarios-modal-form" onSubmit={handleSubmitCentro}>
              <label>
                <i className="fa fa-sitemap" style={{marginRight: '0.5rem'}}></i>
                Nombre:
                <input type="text" value={formCentro.nombre} onChange={(e) => setFormCentro({...formCentro, nombre: e.target.value})} required placeholder="Ingresa el nombre" />
              </label>
              <label>
                <i className="fa fa-info-circle" style={{marginRight: '0.5rem'}}></i>
                Descripción:
                <textarea value={formCentro.descripcion} onChange={(e) => setFormCentro({...formCentro, descripcion: e.target.value})} required placeholder="Describe el centro de costo" />
              </label>
              <label>
                <i className="fa fa-building" style={{marginRight: '0.5rem'}}></i>
                Proyecto:
                <select value={formCentro.proyecto_id} onChange={(e) => setFormCentro({...formCentro, proyecto_id: e.target.value})} required>
                  <option value="">Seleccionar proyecto</option>
                  {proyectos.map(proyecto => (
                    <option key={proyecto.proyecto_id} value={proyecto.proyecto_id}>{proyecto.nombre}</option>
                  ))}
                </select>
              </label>
              <label>
                <i className="fa fa-map-marker" style={{marginRight: '0.5rem'}}></i>
                Región:
                <input type="text" value={formCentro.proyecto_id ? (regiones.find(r => String(r.region_id) === String(proyectos.find(p => String(p.proyecto_id) === String(formCentro.proyecto_id))?.region_id))?.nombre || '') : ''} readOnly style={{background:'#f5f5f5'}} />
              </label>
              <div className="usuarios-modal-actions">
                <button type="submit" className="usuarios-accion-btn">
                  <i className="fa fa-save" style={{marginRight: '0.3rem'}}></i>
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button type="button" className="usuarios-accion-btn" onClick={() => { setShowFormCentro(false); setEditingItem(null); }}>
                  <i className="fa fa-times" style={{marginRight: '0.3rem'}}></i>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Usuario */}
      {showFormUsuario && (
        <div className="usuarios-modal-bg">
          <div className="usuarios-modal usuarios-modal-lg">
            <div className="usuarios-modal-header">
              <h3>{editingItem ? 'Editar usuario' : 'Crear nuevo usuario'}</h3>
              <p>{editingItem ? 'Actualiza los datos del colaborador y su centro asignado.' : 'Completa la información para dar acceso al colaborador.'}</p>
            </div>
            <form className="usuarios-modal-form" onSubmit={handleSubmitUsuario}>
              <div className="usuarios-form-grid">
                <label className="usuarios-field">
                  <span>Nombre</span>
                  <input
                    type="text"
                    value={formUsuario.nombre}
                    onChange={e => setFormUsuario(f => ({...f, nombre: e.target.value}))}
                    autoComplete="name"
                    placeholder="Ej: Juan Soto"
                    required
                  />
                </label>
                <label className="usuarios-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formUsuario.email}
                    onChange={e => setFormUsuario(f => ({...f, email: e.target.value}))}
                    autoComplete="username"
                    placeholder="correo@empresa.cl"
                    required
                  />
                </label>
                <label className="usuarios-field">
                  <span>Contraseña</span>
                  <input
                    type="password"
                    value={formUsuario.password}
                    placeholder={editingItem ? 'Deja en blanco para mantener' : '********'}
                    onChange={e => setFormUsuario(f => ({...f, password: e.target.value}))}
                    autoComplete={editingItem ? 'off' : 'new-password'}
                  />
                  <small className="usuarios-helper">
                    {editingItem
                      ? 'Si dejas el campo vacío la contraseña actual se mantendrá.'
                      : 'Debe tener al menos 8 caracteres.'}
                  </small>
                </label>
                <label className="usuarios-field">
                  <span>Rol</span>
                  <select
                    value={formUsuario.rol}
                    onChange={e => setFormUsuario(f => ({...f, rol: e.target.value, centro_costo_id: '' }))}
                    disabled={user.rol === 'admin'}
                  >
                    {user.rol === 'admin'
                      ? <option value="trabajador">Trabajador</option>
                      : (
                        <>
                          <option value="">Seleccionar rol</option>
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </>
                      )}
                  </select>
                </label>
                <label className="usuarios-field">
                  <span>Región</span>
                  <select
                    value={formUsuario.region_id || ''}
                    onChange={e => setFormUsuario(f => ({...f, region_id: e.target.value, proyecto_id: '', centro_costo_id: '', empresa_id: ''}))}
                    disabled={user.rol === 'admin'}
                  >
                    {user.rol === 'admin'
                      ? <option value={user.region_id}>{user.region_nombre}</option>
                      : (
                        <>
                          <option value="">Seleccionar región</option>
                          {regiones.map(r => (<option key={r.region_id} value={r.region_id}>{r.nombre}</option>))}
                        </>
                      )}
                  </select>
                </label>
                <label className="usuarios-field">
                  <span>Proyecto</span>
                  <select
                    value={formUsuario.proyecto_id || ''}
                    onChange={e => setFormUsuario(f => ({...f, proyecto_id: e.target.value, centro_costo_id: '', empresa_id: ''}))}
                    disabled={user.rol === 'admin' || !formUsuario.region_id}
                  >
                    {user.rol === 'admin'
                      ? <option value={user.proyecto_id}>{user.proyecto_nombre}</option>
                      : (
                        <>
                          <option value="">Seleccionar proyecto</option>
                          {crearProyectosFiltrados.map(p => (<option key={p.proyecto_id} value={p.proyecto_id}>{p.nombre}</option>))}
                        </>
                      )}
                  </select>
                </label>
                <label className="usuarios-field">
                  <span>Centro de costo</span>
                  <select
                    value={formUsuario.centro_costo_id || ''}
                    onChange={e => setFormUsuario(f => ({...f, centro_costo_id: e.target.value}))}
                    disabled={user.rol === 'admin' || !formUsuario.proyecto_id}
                  >
                    {user.rol === 'admin'
                      ? <option value={user.centro_costo_id}>{user.centro_costo_nombre}</option>
                      : (
                        <>
                          <option value="">Seleccionar centro</option>
                          {crearCentrosFiltrados.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                        </>
                      )}
                  </select>
                </label>
                <label className="usuarios-field">
                  <span>Empresa Contratista</span>
                  <select
                    value={formUsuario.empresa_id || ''}
                    onChange={e => setFormUsuario(f => ({...f, empresa_id: e.target.value}))}
                    disabled={!formUsuario.proyecto_id}
                  >
                    <option value="">Seleccionar empresa (opcional)</option>
                    {crearEmpresasFiltradas.map(e => (
                      <option key={e.empresa_id} value={e.empresa_id}>
                        {e.nombre} {e.empresa_id ? `(${e.empresa_id})` : ''}
                      </option>
                    ))}
                  </select>
                  {!formUsuario.proyecto_id && (
                    <small className="usuarios-helper" style={{color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem'}}>
                      Selecciona un proyecto primero
                    </small>
                  )}
                </label>
                <label className="usuarios-field">
                  <span>Aprobado</span>
                  <select
                    value={formUsuario.aprobado}
                    onChange={e => setFormUsuario(f => ({...f, aprobado: parseInt(e.target.value)}))}
                  >
                    <option value={1}>Sí</option>
                    <option value={0}>No</option>
                  </select>
                </label>
              </div>
              <div className="usuarios-modal-actions">
                <button type="submit" className="usuarios-accion-btn">
                  <i className="fa fa-save" style={{marginRight: '0.3rem'}}></i>
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" className="usuarios-accion-btn" onClick={() => { setShowFormUsuario(false); setEditingItem(null); }}>
                  <i className="fa fa-times" style={{marginRight: '0.3rem'}}></i>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar usuario */}
      {modalEliminarUsuario && (
        <div className="usuarios-modal-overlay" onClick={handleCerrarModalEliminar}>
          <div className="usuarios-modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: '#c62828',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fa fa-exclamation-triangle"></i>
              Confirmar eliminación
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#495057' }}>
              ¿Estás seguro de que deseas eliminar al usuario <strong>{modalEliminarUsuario.nombre}</strong>?
            </p>
            <p style={{ margin: '0 0 1rem 0', color: '#6c757d', fontSize: '13px' }}>
              Esta acción es irreversible. Para confirmar, ingrese la contraseña especial:
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#495057' }}>
                Contraseña de confirmación:
              </label>
              <input
                type="password"
                value={passwordEliminar}
                onChange={(e) => {
                  setPasswordEliminar(e.target.value);
                  setErrorPasswordEliminar('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmarEliminarUsuario();
                  }
                }}
                placeholder="Ingrese la contraseña especial"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${errorPasswordEliminar ? '#c62828' : '#ced4da'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
              {errorPasswordEliminar && (
                <p style={{ 
                  margin: '0.5rem 0 0 0', 
                  color: '#c62828', 
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <i className="fa fa-exclamation-circle"></i>
                  {errorPasswordEliminar}
                </p>
              )}
            </div>
            <div className="usuarios-modal-actions">
              <button 
                className="usuarios-accion-btn" 
                style={{
                  background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)'
                }}
                onClick={handleConfirmarEliminarUsuario}
              >
                <i className="fa fa-trash" style={{marginRight: '0.3rem'}}></i>
                Confirmar eliminación
              </button>
              <button 
                className="usuarios-accion-btn" 
                style={{background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'}}
                onClick={handleCerrarModalEliminar}
              >
                <i className="fa fa-times" style={{marginRight: '0.3rem'}}></i>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Empresa */}
      {showFormEmpresa && (
        <div className="usuarios-modal-bg" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowFormEmpresa(false);
            setEditingItem(null);
          }
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(10, 50, 101, 0.2)',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e5e7eb',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header con colores de la app */}
            <div style={{
              background: 'linear-gradient(135deg, #0a6ebd 0%, #005288 100%)',
              padding: '1rem 1.5rem',
              color: 'white',
              boxShadow: '0 2px 8px rgba(10, 110, 189, 0.3)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <i className="fa fa-building" style={{fontSize: '1.2rem'}}></i>
                <h3 style={{margin: 0, fontSize: '1.1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  {editingItem ? 'Editar Empresa' : 'Nueva Empresa'}
                </h3>
              </div>
            </div>

            {/* Contenido del formulario compacto */}
            <form onSubmit={handleSubmitEmpresa} style={{
              padding: '1.25rem',
              overflowY: 'auto',
              flex: 1,
              background: '#fff'
            }}>
              {/* Información Principal */}
              <div style={{marginBottom: '1rem'}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <i className="fa fa-info-circle" style={{color: '#0a6ebd', fontSize: '0.9rem'}}></i>
                  <h4 style={{margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Información Principal
                  </h4>
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem'}}>
                  <label style={{gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      Nombre de la Empresa <span style={{color: '#ef4444'}}>*</span>
                    </span>
                    <input
                      type="text"
                      value={formEmpresa.nombre}
                      onChange={(e) => setFormEmpresa({...formEmpresa, nombre: e.target.value})}
                      required
                      placeholder="Ej: Empresa Constructora S.A."
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: '#fff'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0a6ebd';
                        e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </label>

                  <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      RUT <span style={{color: '#ef4444'}}>*</span>
                    </span>
                    <input
                      type="text"
                      value={formEmpresa.rut}
                      onChange={(e) => setFormEmpresa({...formEmpresa, rut: e.target.value})}
                      required
                      placeholder="12345678-9"
                      disabled={editingItem ? true : false}
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: editingItem ? '#f3f4f6' : '#fff',
                        cursor: editingItem ? 'not-allowed' : 'text'
                      }}
                      onFocus={(e) => {
                        if (!editingItem) {
                          e.target.style.borderColor = '#0a6ebd';
                          e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {editingItem && (
                      <small style={{color: '#6b7280', fontSize: '0.75rem', marginTop: '-0.15rem'}}>
                        El RUT no se puede modificar
                      </small>
                    )}
                  </label>

                  <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      Teléfono
                    </span>
                    <input
                      type="tel"
                      value={formEmpresa.telefono}
                      onChange={(e) => setFormEmpresa({...formEmpresa, telefono: e.target.value})}
                      placeholder="+56 9 1234 5678"
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: '#fff'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0a6ebd';
                        e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </label>

                  <label style={{gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      Email
                    </span>
                    <input
                      type="email"
                      value={formEmpresa.email}
                      onChange={(e) => setFormEmpresa({...formEmpresa, email: e.target.value})}
                      placeholder="empresa@ejemplo.com"
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: '#fff'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0a6ebd';
                        e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </label>

                  <label style={{gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      Dirección
                    </span>
                    <textarea
                      value={formEmpresa.direccion}
                      onChange={(e) => setFormEmpresa({...formEmpresa, direccion: e.target.value})}
                      placeholder="Dirección completa"
                      rows="2"
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: '#fff',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0a6ebd';
                        e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Datos de Contacto */}
              <div style={{marginBottom: '1rem'}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <i className="fa fa-user" style={{color: '#0a6ebd', fontSize: '0.9rem'}}></i>
                  <h4 style={{margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Datos de Contacto
                  </h4>
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem'}}>
                  <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      Nombre del Contacto
                    </span>
                    <input
                      type="text"
                      value={formEmpresa.contacto_nombre}
                      onChange={(e) => setFormEmpresa({...formEmpresa, contacto_nombre: e.target.value})}
                      placeholder="Nombre completo"
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: '#fff'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0a6ebd';
                        e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </label>

                  <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      Teléfono del Contacto
                    </span>
                    <input
                      type="tel"
                      value={formEmpresa.contacto_telefono}
                      onChange={(e) => setFormEmpresa({...formEmpresa, contacto_telefono: e.target.value})}
                      placeholder="+56 9 1234 5678"
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: '#fff'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0a6ebd';
                        e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </label>

                  <label style={{gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      Email del Contacto
                    </span>
                    <input
                      type="email"
                      value={formEmpresa.contacto_email}
                      onChange={(e) => setFormEmpresa({...formEmpresa, contacto_email: e.target.value})}
                      placeholder="contacto@empresa.com"
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: '#fff'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0a6ebd';
                        e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Servicios */}
              <div style={{marginBottom: '1rem'}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <i className="fa fa-map-marked-alt" style={{color: '#0a6ebd', fontSize: '0.9rem'}}></i>
                  <h4 style={{margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Servicios
                  </h4>
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem'}}>
                  <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      Regiones
                    </span>
                    <select
                      multiple
                      value={formEmpresa.regiones.map(r => String(r))}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                        setFormEmpresa({...formEmpresa, regiones: selected});
                      }}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.5rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#fff',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0a6ebd';
                        e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {regiones.length === 0 ? (
                        <option disabled>No hay regiones disponibles</option>
                      ) : (
                        regiones.map(region => (
                          <option key={region.region_id} value={region.region_id}>
                            {region.nombre}
                          </option>
                        ))
                      )}
                    </select>
                    <small style={{color: '#6b7280', fontSize: '0.75rem', marginTop: '-0.15rem'}}>
                      Ctrl/Cmd para múltiple selección
                    </small>
                  </label>

                  <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#0a6ebd', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                      Proyectos
                    </span>
                    <select
                      multiple
                      value={formEmpresa.proyectos.map(p => String(p))}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                        setFormEmpresa({...formEmpresa, proyectos: selected});
                      }}
                      disabled={!formEmpresa.regiones || formEmpresa.regiones.length === 0}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.5rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: (!formEmpresa.regiones || formEmpresa.regiones.length === 0) ? '#f3f4f6' : '#fff',
                        cursor: (!formEmpresa.regiones || formEmpresa.regiones.length === 0) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: (!formEmpresa.regiones || formEmpresa.regiones.length === 0) ? 0.6 : 1
                      }}
                      onFocus={(e) => {
                        if (formEmpresa.regiones && formEmpresa.regiones.length > 0) {
                          e.target.style.borderColor = '#0a6ebd';
                          e.target.style.boxShadow = '0 0 0 3px rgba(10, 110, 189, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {(!formEmpresa.regiones || formEmpresa.regiones.length === 0) ? (
                        <option disabled>Selecciona regiones primero</option>
                      ) : proyectosFiltradosEmpresa.length === 0 ? (
                        <option disabled>Sin proyectos disponibles</option>
                      ) : (
                        proyectosFiltradosEmpresa.map(proyecto => (
                          <option key={proyecto.proyecto_id} value={proyecto.proyecto_id}>
                            {proyecto.nombre}
                          </option>
                        ))
                      )}
                    </select>
                    <small style={{color: (!formEmpresa.regiones || formEmpresa.regiones.length === 0) ? '#9ca3af' : '#6b7280', fontSize: '0.75rem', marginTop: '-0.15rem'}}>
                      {(!formEmpresa.regiones || formEmpresa.regiones.length === 0) 
                        ? 'Selecciona regiones primero'
                        : 'Ctrl/Cmd para múltiple selección'}
                    </small>
                  </label>
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb',
                marginTop: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFormEmpresa(false);
                    setEditingItem(null);
                    setFormEmpresa({
                      nombre: '',
                      rut: '',
                      direccion: '',
                      telefono: '',
                      email: '',
                      contacto_nombre: '',
                      contacto_telefono: '',
                      contacto_email: '',
                      regiones: [],
                      proyectos: []
                    });
                  }}
                  style={{
                    padding: '0.6rem 1.25rem',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '6px',
                    background: '#fff',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f3f4f6';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.borderColor = '#cbd5e1';
                  }}
                >
                  <i className="fa fa-times" style={{marginRight: '0.4rem'}}></i>
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.25rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #0a6ebd 0%, #005288 100%)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(10, 110, 189, 0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #ff6600 0%, #e55a00 100%)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(255, 102, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #0a6ebd 0%, #005288 100%)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(10, 110, 189, 0.3)';
                  }}
                >
                  <i className="fa fa-save" style={{marginRight: '0.4rem'}}></i>
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ajuste;
