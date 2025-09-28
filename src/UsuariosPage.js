import React, { useState, useEffect } from 'react';
import './UsuariosPage.css';
import './css/UsuariosPageZoom.css';
import './css/Navbar.css';
import Navbar from './components/Navbar';
import { API_BASE } from './config';
import { useNavigate } from 'react-router-dom';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrador' },
  { value: 'trabajador', label: 'Trabajador' },
  { value: 'visita', label: 'Visita' },
  { value: 'visita_sin_permiso', label: 'Visita Sin Permiso' }
];

const UsuariosPage = ({ user }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [centros, setCentros] = useState([]);
  // Estados para selects en cascada
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [selectedCentro, setSelectedCentro] = useState('');
  const [proyectos, setProyectos] = useState([]);
  const [proyectosFiltrados, setProyectosFiltrados] = useState([]);
  const [centrosFiltrados, setCentrosFiltrados] = useState([]);
  // Estados separados para el modal de creación
  const [crearProyectosFiltrados, setCrearProyectosFiltrados] = useState([]);
  const [crearCentrosFiltrados, setCrearCentrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [editUser, setEditUser] = useState(null); // usuario en edición
  const [editForm, setEditForm] = useState({});
  const [crearModal, setCrearModal] = useState(false);
  const [crearForm, setCrearForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'trabajador',
    region_id: '',
    proyecto_id: '',
    centro_costo_id: '',
    aprobado: 1
  });
  const navigate = useNavigate();

  // Estados para selects en cascada de edición
  const [editSelectedRegion, setEditSelectedRegion] = useState('');
  const [editSelectedProyecto, setEditSelectedProyecto] = useState('');
  const [editProyectosFiltrados, setEditProyectosFiltrados] = useState([]);
  const [editCentrosFiltrados, setEditCentrosFiltrados] = useState([]);

  // Control de acceso
  if (!user || user.rol === 'trabajador' || user.rol === 'visita' || user.rol === 'visita_sin_permiso' || !user.aprobado) {
    return (
      <div className="main-bg">
        <div className="usuarios-acceso-denegado">
          <h2>Acceso denegado</h2>
          <p>No tienes permisos para acceder a la administración de usuarios.</p>
        </div>
      </div>
    );
  }

  // Cargar regiones, proyectos y centros de costo al inicio
  useEffect(() => {
    const fetchRegiones = async () => {
      try {
        const res = await fetch(`${API_BASE}/regiones.php`);
        const data = await res.json();
        console.log('Regiones cargadas:', data);
        setRegiones(data);
      } catch (e) {
        console.error('Error cargando regiones:', e);
        setRegiones([]);
      }
    };
    const fetchProyectos = async () => {
      try {
        const timestamp = new Date().getTime();
        const res = await fetch(`${API_BASE}/proyectos.php?t=${timestamp}`);
        const data = await res.json();
        console.log('Proyectos cargados:', data);
        setProyectos(data);
      } catch (e) {
        console.error('Error cargando proyectos:', e);
        setProyectos([]);
      }
    };
    const fetchCentros = async () => {
      try {
        const timestamp = new Date().getTime();
        const res = await fetch(`${API_BASE}/centros_costo.php?t=${timestamp}`);
        const data = await res.json();
        console.log('Centros cargados:', data);
        setCentros(data);
      } catch (e) {
        console.error('Error cargando centros:', e);
        setCentros([]);
      }
    };
    fetchRegiones();
    fetchProyectos();
    fetchCentros();
  }, []);

  // Filtros en cascada para selects
  useEffect(() => {
    if (selectedRegion) {
      setProyectosFiltrados(proyectos.filter(p => String(p.region_id) === String(selectedRegion)));
      setSelectedProyecto('');
      setCentrosFiltrados([]);
      setSelectedCentro('');
      setCrearForm(f => ({...f, centro_costo_id: ''}));
    } else {
      setProyectosFiltrados([]);
      setCentrosFiltrados([]);
      setSelectedProyecto('');
      setSelectedCentro('');
      setCrearForm(f => ({...f, centro_costo_id: ''}));
    }
  }, [selectedRegion, proyectos]);

  useEffect(() => {
    if (selectedProyecto) {
      setCentrosFiltrados(centros.filter(c => String(c.proyecto_id) === String(selectedProyecto)));
      setSelectedCentro('');
      setCrearForm(f => ({...f, centro_costo_id: ''}));
    } else {
      setCentrosFiltrados([]);
      setSelectedCentro('');
      setCrearForm(f => ({...f, centro_costo_id: ''}));
    }
  }, [selectedProyecto, centros]);

  // Filtros en cascada para el modal de creación
  useEffect(() => {
    if (crearForm.region_id) {
      const proyectosDeRegion = proyectos.filter(p => String(p.region_id) === String(crearForm.region_id));
      setCrearProyectosFiltrados(proyectosDeRegion);
      // Limpiar proyecto y centro de costo si cambia la región
      if (crearForm.proyecto_id && !proyectosDeRegion.find(p => String(p.proyecto_id) === String(crearForm.proyecto_id))) {
        setCrearForm(f => ({...f, proyecto_id: '', centro_costo_id: ''}));
      }
    } else {
      setCrearProyectosFiltrados([]);
      setCrearForm(f => ({...f, proyecto_id: '', centro_costo_id: ''}));
    }
  }, [crearForm.region_id, proyectos]);

  useEffect(() => {
    if (crearForm.proyecto_id) {
      const centrosDeProyecto = centros.filter(c => String(c.proyecto_id) === String(crearForm.proyecto_id));
      setCrearCentrosFiltrados(centrosDeProyecto);
      // Limpiar centro de costo si cambia el proyecto
      if (crearForm.centro_costo_id && !centrosDeProyecto.find(c => String(c.id) === String(crearForm.centro_costo_id))) {
        setCrearForm(f => ({...f, centro_costo_id: ''}));
      }
    } else {
      setCrearCentrosFiltrados([]);
      setCrearForm(f => ({...f, centro_costo_id: ''}));
    }
  }, [crearForm.proyecto_id, centros]);

  // Filtros para la tabla
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/usuarios.php`;
      const params = [];
      if (selectedRegion) params.push(`region_id=${selectedRegion}`);
      if (selectedProyecto) params.push(`proyecto_id=${selectedProyecto}`);
      if (selectedCentro) params.push(`centro_costo_id=${selectedCentro}`);
      if (params.length > 0) url += '?' + params.join('&');
      const res = await fetch(url);
      const data = await res.json();
      setUsuarios(data);
    } catch (e) {
      setUsuarios([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line
  }, [selectedRegion, selectedProyecto, selectedCentro]);

  // Eliminar usuario (solo super_admin)
  const handleEliminarUsuario = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
      const response = await fetch(`${API_BASE}/eliminar_usuario.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.success) {
        // Actualiza la lista de usuarios (puedes volver a cargarla o filtrarla localmente)
        setUsuarios(usuarios.filter(u => u.id !== id));
      } else {
        alert('Error al eliminar usuario: ' + (data.error || 'Desconocido'));
      }
    } catch (error) {
      alert('Error de red al eliminar usuario.');
    }
  };

  // Abrir modal de edición
  const handleEditarUsuario = (usuario) => {
    setEditUser(usuario);
    setEditForm({
      id: usuario.id, // Agregar el ID del usuario
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      region_id: usuario.region_id,
      proyecto_id: usuario.proyecto_id,
      centro_costo_id: usuario.centro_costo_id,
      aprobado: usuario.aprobado
    });
  };

  // Guardar cambios de edición
  const handleGuardarEdicion = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/editar_usuario.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', msg: 'Usuario editado correctamente.' });
        setEditUser(null);
        fetchUsuarios();
      } else {
        setFeedback({ type: 'error', msg: data.error || 'No se pudo editar el usuario.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', msg: 'Error de red al editar usuario.' });
    }
    setLoading(false);
  };

  // Cerrar modal de edición
  const handleCerrarModal = () => {
    setEditUser(null);
  };

  // Abrir modal de creación
  const handleAbrirCrear = () => {
    let initialRegionId = '';
    if (user.rol === 'admin') {
      initialRegionId = user.region_id;
    } else if (user.rol === 'super_admin' && regiones.length > 0) {
      // Para super_admin, usar la primera región disponible
      initialRegionId = regiones[0].region_id;
    }
    
    const formData = {
      nombre: '',
      email: '',
      password: '',
      rol: 'trabajador',
      region_id: initialRegionId,
      proyecto_id: user.rol === 'admin' ? user.proyecto_id : '',
      centro_costo_id: user.rol === 'admin' ? user.centro_costo_id : '',
      aprobado: 1
    };
    setCrearForm(formData);
    // Limpiar los filtros en cascada para super_admin
    if (user.rol === 'super_admin') {
      setCrearProyectosFiltrados([]);
      setCrearCentrosFiltrados([]);
    }
    setCrearModal(true);
  };

  // Guardar nuevo usuario
  const handleGuardarNuevo = async () => {
    // Validar campos requeridos
    if (!crearForm.nombre || !crearForm.email || !crearForm.password || !crearForm.centro_costo_id) {
      setFeedback({ type: 'error', msg: 'Todos los campos son obligatorios.' });
      return;
    }
    
    // Validar que centro_costo_id sea un número válido
    if (isNaN(crearForm.centro_costo_id) || crearForm.centro_costo_id === '') {
      setFeedback({ type: 'error', msg: 'Centro de costo inválido.' });
      return;
    }
    
    setLoading(true);
    setFeedback(null);
    
    try {
      // Preparar datos para envío, asegurando tipos correctos
      const datosEnvio = {
        ...crearForm,
        centro_costo_id: parseInt(crearForm.centro_costo_id),
        region_id: crearForm.region_id ? parseInt(crearForm.region_id) : null,
        proyecto_id: crearForm.proyecto_id ? parseInt(crearForm.proyecto_id) : null
      };
      
      const res = await fetch(`${API_BASE}/crear_usuario.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEnvio)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setFeedback({ type: 'success', msg: 'Usuario creado correctamente.' });
        setCrearModal(false);
        fetchUsuarios();
      } else {
        setFeedback({ type: 'error', msg: data.error || 'No se pudo crear el usuario.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', msg: 'Error de red al crear usuario.' });
    }
    
    setLoading(false);
  };

  // Al abrir modal de edición, inicializar selects en cascada
  useEffect(() => {
    if (editUser) {
      // Buscar centro de costo, proyecto y región actuales
      const centro = centros.find(c => String(c.id) === String(editUser.centro_costo_id));
      const proyecto = centro ? proyectos.find(p => String(p.proyecto_id) === String(centro.proyecto_id)) : null;
      const region = proyecto ? regiones.find(r => String(r.region_id) === String(proyecto.region_id)) : null;
      setEditSelectedRegion(region ? region.region_id : '');
      setEditSelectedProyecto(proyecto ? proyecto.proyecto_id : '');
      setEditProyectosFiltrados(region ? proyectos.filter(p => String(p.region_id) === String(region.region_id)) : []);
      setEditCentrosFiltrados(proyecto ? centros.filter(c => String(c.proyecto_id) === String(proyecto.proyecto_id)) : []);
      setEditForm(f => ({
        ...f,
        centro_costo_id: centro ? centro.id : ''
      }));
    }
  }, [editUser, centros, proyectos, regiones]);

  // Cascada edición: al cambiar región
  useEffect(() => {
    if (editForm.region_id) {
      const proyectosDeRegion = proyectos.filter(p => String(p.region_id) === String(editForm.region_id));
      setEditProyectosFiltrados(proyectosDeRegion);
      // Limpiar proyecto y centro de costo si cambia la región
      if (editForm.proyecto_id && !proyectosDeRegion.find(p => String(p.proyecto_id) === String(editForm.proyecto_id))) {
        setEditForm(f => ({...f, proyecto_id: '', centro_costo_id: ''}));
      }
    } else {
      setEditProyectosFiltrados([]);
      setEditForm(f => ({...f, proyecto_id: '', centro_costo_id: ''}));
    }
  }, [editForm.region_id, proyectos]);

  // Cascada edición: al cambiar proyecto
  useEffect(() => {
    if (editForm.proyecto_id) {
      const centrosDeProyecto = centros.filter(c => String(c.proyecto_id) === String(editForm.proyecto_id));
      setEditCentrosFiltrados(centrosDeProyecto);
      // Limpiar centro de costo si cambia el proyecto
      if (editForm.centro_costo_id && !centrosDeProyecto.find(c => String(c.id) === String(editForm.centro_costo_id))) {
        setEditForm(f => ({...f, centro_costo_id: ''}));
      }
    } else {
      setEditCentrosFiltrados([]);
      setEditForm(f => ({...f, centro_costo_id: ''}));
    }
  }, [editForm.proyecto_id, centros]);

  // Supón que tienes el usuario actual en `user` y la lista de usuarios en `usuarios`
  let usuariosFiltrados = usuarios;

  if (user.rol === 'admin') {
    console.log('user.centro_costo_id:', user.centro_costo_id);
    console.log('usuarios:', usuarios.map(u => ({
      email: u.email,
      ucc_centro_costo_id: u.ucc_centro_costo_id
    })));
    usuariosFiltrados = usuarios.filter(
      u => String(u.centro_costo_id) === String(user.centro_costo_id)
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('centros');
    // Redirigir a la página de login
    window.location.href = '/financiero/';
  };

  const handleInicioClick = (event) => {
    event.preventDefault();
    navigate('/');
  };

  const handleProyectosClick = (event) => {
    event.preventDefault();
    navigate('/centros-por-region');
  };

  const handleUsuariosClick = (event) => {
    event.preventDefault();
    navigate('/usuarios');
  };

  const handleAjusteClick = (event) => {
    event.preventDefault();
    navigate('/ajuste');
  };



  return (
    <div className="main-bg">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="usuarios-container">
        <h2 className="usuarios-titulo">Administración de Usuarios</h2>
        {/* Botón Nuevo usuario */}
        {(user.rol === 'super_admin' || user.rol === 'admin') && (
          <div style={{textAlign: 'right', marginBottom: '1.5rem'}}>
            <button className="usuarios-nuevo-btn" onClick={handleAbrirCrear}>
              <i className="fa fa-plus" style={{marginRight: '0.5rem'}}></i>
              Nuevo Usuario
            </button>
          </div>
        )}
        <div className="usuarios-filtros">
          <div>
            <label htmlFor="region-select">
              <i className="fa fa-map-marker" style={{marginRight: '0.5rem'}}></i>
              Filtrar por región:
            </label>
            <select id="region-select" value={selectedRegion} onChange={e => { setSelectedRegion(e.target.value); }}>
              <option value="">Todas las regiones</option>
              {regiones.map(region => (
                <option key={region.region_id} value={region.region_id}>{region.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="proyecto-select">
              <i className="fa fa-building" style={{marginRight: '0.5rem'}}></i>
              Filtrar por proyecto:
            </label>
            <select id="proyecto-select" value={selectedProyecto} onChange={e => { setSelectedProyecto(e.target.value); }} disabled={!selectedRegion}>
              <option value="">Todos los proyectos</option>
              {proyectosFiltrados.map(proyecto => (
                <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="centro-select">
              <i className="fa fa-sitemap" style={{marginRight: '0.5rem'}}></i>
              Filtrar por centro de costo:
            </label>
            <select id="centro-select" value={selectedCentro} onChange={e => setSelectedCentro(e.target.value)} disabled={!selectedProyecto}>
              <option value="">Todos los centros</option>
              {centrosFiltrados.map(centro => (
                <option key={centro.id} value={centro.id}>{centro.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        {feedback && (
          <div className={`usuarios-feedback ${feedback.type}`}>
            <i className={`fa ${feedback.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{marginRight: '0.5rem'}}></i>
            {feedback.msg}
          </div>
        )}
        <div className="usuarios-table-wrapper">
          {loading ? (
            <div className="usuarios-loading">Cargando usuarios...</div>
          ) : (
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Centro de Costo</th>
                  <th>Proyecto</th>
                  <th>Región</th>
                  <th>Aprobado</th>
                  {(user.rol === 'admin' || user.rol === 'super_admin') && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map(u => (
                  <tr key={u.id + '-' + u.centro_costo_id}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>{u.rol}</td>
                    <td>{u.centro_costo_nombre || '-'}</td>
                    <td>{u.proyecto_nombre || '-'}</td>
                    <td>{u.region_nombre || '-'}</td>
                    <td>{u.aprobado ? 'Sí' : 'No'}</td>
                    {(user.rol === 'admin' || user.rol === 'super_admin') && (
                      <td>
                        {user.rol === 'super_admin' ||
                         (user.rol === 'admin' &&
                          ['trabajador', 'visita_sin_permiso'].includes(u.rol))
                         ? (
                            <>
                              <button 
                                className="usuarios-accion-btn" 
                                onClick={() => handleEditarUsuario(u)}
                                title="Editar usuario"
                              >
                                <i className="fa fa-edit"></i>
                              </button>
                              <button 
                                className="usuarios-accion-btn usuarios-eliminar-btn" 
                                onClick={() => handleEliminarUsuario(u.id)}
                                title="Eliminar usuario"
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            </>
                          )
                         : null}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal de edición */}
        {editUser && centros.length > 0 && proyectos.length > 0 && regiones.length > 0 && (
          <div className="usuarios-modal-bg">
            <div className="usuarios-modal">
              <h3>Editar usuario</h3>
              <div className="usuarios-modal-form">
                <label>Nombre:
                  <input type="text" value={editForm.nombre} onChange={e => setEditForm(f => ({...f, nombre: e.target.value}))} />
                </label>
                <label>Email:
                  <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} />
                </label>
                <label>Rol:
                  <select
                    value={editForm.rol}
                    onChange={e => setEditForm(f => ({...f, rol: e.target.value}))}
                    disabled={user.rol === 'admin'}
                  >
                    {user.rol === 'admin' ? (
                      <option value="trabajador">Trabajador</option>
                    ) : (
                      <>
                        <option value="trabajador">Trabajador</option>
                        <option value="visita">Visita</option>
                        <option value="admin">Admin</option>
                        {/* ...otros roles */}
                      </>
                    )}
                  </select>
                </label>
                <label>Región:
                  <select
                    value={user.rol === 'admin' ? user.region_id : editForm.region_id}
                    onChange={e => setEditForm(f => ({...f, region_id: e.target.value}))}
                    disabled={user.rol === 'admin'}
                  >
                    {user.rol === 'admin'
                      ? <option value={user.region_id}>{user.region_nombre}</option>
                      : (
                        <>
                          <option value="">Seleccionar región</option>
                          {regiones.map(r => <option key={r.region_id} value={r.region_id}>{r.nombre}</option>)}
                        </>
                      )
                    }
                  </select>
                </label>
                <label>Proyecto:
                  <select
                    value={user.rol === 'admin' ? user.proyecto_id : editForm.proyecto_id}
                    onChange={e => setEditForm(f => ({...f, proyecto_id: e.target.value}))}
                    disabled={user.rol === 'admin' || !editForm.region_id}
                  >
                    {user.rol === 'admin'
                      ? <option value={user.proyecto_id}>{user.proyecto_nombre}</option>
                      : (
                        <>
                          <option value="">Seleccionar proyecto</option>
                          {editProyectosFiltrados.map(p => <option key={p.proyecto_id} value={p.proyecto_id}>{p.nombre}</option>)}
                        </>
                      )
                    }
                  </select>
                </label>
                <label>Centro de Costo:
                  <select
                    value={user.rol === 'admin' ? user.centro_costo_id : editForm.centro_costo_id}
                    onChange={e => setEditForm(f => ({...f, centro_costo_id: e.target.value}))}
                    disabled={user.rol === 'admin' || !editForm.proyecto_id}
                  >
                    {user.rol === 'admin'
                      ? <option value={user.centro_costo_id}>{user.centro_costo_nombre}</option>
                      : (
                        <>
                          <option value="">Seleccionar centro de costo</option>
                          {editCentrosFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </>
                      )
                    }
                  </select>
                </label>
                <label>Aprobado:
                  <select value={editForm.aprobado} onChange={e => setEditForm(f => ({...f, aprobado: e.target.value}))}>
                    <option value={1}>Sí</option>
                    <option value={0}>No</option>
                  </select>
                </label>
              </div>
              <div className="usuarios-modal-actions">
                <button className="usuarios-accion-btn" onClick={handleGuardarEdicion}>
                  <i className="fa fa-save" style={{marginRight: '0.3rem'}}></i>
                  Guardar
                </button>
                <button className="usuarios-accion-btn" style={{background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'}} onClick={handleCerrarModal}>
                  <i className="fa fa-times" style={{marginRight: '0.3rem'}}></i>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal de creación */}
        {crearModal && (
          <div className="usuarios-modal-bg">
            <div className="usuarios-modal">
              <h3>Crear nuevo usuario</h3>

              <div className="usuarios-modal-form">
                <label>Nombre:
                  <input 
                    type="text" 
                    value={crearForm.nombre} 
                    onChange={e => setCrearForm(f => ({...f, nombre: e.target.value}))} 
                    autoComplete="name"
                  />
                </label>
                <label>Email:
                  <input 
                    type="email" 
                    value={crearForm.email} 
                    onChange={e => setCrearForm(f => ({...f, email: e.target.value}))} 
                    autoComplete="username"
                  />
                </label>
                <label>Password:
                  <input 
                    type="password" 
                    value={crearForm.password} 
                    onChange={e => setCrearForm(f => ({...f, password: e.target.value}))} 
                    autoComplete="new-password"
                  />
                </label>
                <label>Rol:
                  <select
                    value={crearForm.rol}
                    onChange={e => setCrearForm(f => ({...f, rol: e.target.value}))}
                    disabled={user.rol === 'admin'}
                  >
                    {user.rol === 'admin' ? (
                      <option value="trabajador">Trabajador</option>
                    ) : (
                      <>
                        <option value="trabajador">Trabajador</option>
                        <option value="visita">Visita</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="visita_sin_permiso">Visita Sin Permiso</option>
                      </>
                    )}
                  </select>
                </label>
                <label>Región:
                  <select
                    value={crearForm.region_id || user.region_id || ''}
                    onChange={e => setCrearForm(f => ({...f, region_id: e.target.value}))}
                    disabled={user.rol === 'admin'}
                  >
                    {user.rol === 'admin' ? (
                      <option value={user.region_id}>{user.region_nombre}</option>
                    ) : (
                      <>
                        <option value="">Seleccionar región</option>
                        {regiones.map(r => (
                          <option key={r.region_id} value={r.region_id}>{r.nombre}</option>
                        ))}
                      </>
                    )}
                  </select>
                </label>
                <label>Proyecto:
                  <select
                    value={crearForm.proyecto_id || ''}
                    onChange={e => {
                      const valorSeleccionado = e.target.value;
                      setCrearForm(prevForm => ({
                        ...prevForm,
                        proyecto_id: valorSeleccionado,
                        centro_costo_id: '' // Limpiar centro de costo al cambiar proyecto
                      }));
                    }}
                    disabled={user.rol === 'admin' || !crearForm.region_id}
                  >
                    {user.rol === 'admin' ? (
                      <option value={user.proyecto_id}>{user.proyecto_nombre}</option>
                    ) : (
                      <>
                        <option value="">Seleccionar proyecto</option>
                        {crearProyectosFiltrados.map(p => (
                          <option key={p.proyecto_id} value={p.proyecto_id}>
                            {p.nombre}
                          </option>
                        ))}
                        {/* Debug: mostrar cantidad de proyectos filtrados */}
                        {crearProyectosFiltrados.length === 0 && crearForm.region_id && (
                          <option disabled>No hay proyectos para esta región</option>
                        )}
                      </>
                    )}
                  </select>
                </label>
                <label>Centro de Costo:
                  <select
                    value={crearForm.centro_costo_id || ''}
                    onChange={e => setCrearForm(f => ({...f, centro_costo_id: e.target.value}))}
                    disabled={user.rol === 'admin' || !crearForm.proyecto_id}
                  >
                    {user.rol === 'admin' ? (
                      <option value={user.centro_costo_id}>{user.centro_costo_nombre}</option>
                    ) : (
                      <>
                        <option value="">Seleccionar centro de costo</option>
                        {crearCentrosFiltrados.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                        {/* Debug: mostrar cantidad de centros filtrados */}
                        {crearCentrosFiltrados.length === 0 && crearForm.proyecto_id && (
                          <option disabled>No hay centros para este proyecto</option>
                        )}
                      </>
                    )}
                  </select>
                </label>
                <label>Aprobado:
                  <select value={crearForm.aprobado} onChange={e => setCrearForm(f => ({...f, aprobado: parseInt(e.target.value)}))}>
                    <option value={1}>Sí</option>
                    <option value={0}>No</option>
                  </select>
                </label>
              </div>
              <div className="usuarios-modal-actions">
                <button 
                  className="usuarios-accion-btn" 
                  style={{background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)'}}
                  onClick={handleGuardarNuevo}
                  disabled={loading}
                >
                  <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-plus'}`} style={{marginRight: '0.3rem'}}></i>
                  {loading ? 'Creando...' : 'Crear'}
                </button>
                <button 
                  className="usuarios-accion-btn" 
                  style={{background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'}}
                  onClick={() => setCrearModal(false)}
                  disabled={loading}
                >
                  <i className="fa fa-times" style={{marginRight: '0.3rem'}}></i>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuariosPage;
