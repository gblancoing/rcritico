import React, { useEffect, useState } from 'react';
import './ajuste.css';
import { API_BASE } from './config';
import { useNavigate } from 'react-router-dom';

const Ajuste = ({ user }) => {
  const [centros, setCentros] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mainFeedback, setMainFeedback] = useState(null);

  // Modales
  const [modalProyecto, setModalProyecto] = useState(false);
  const [modalCentro, setModalCentro] = useState(false);

  // Formulario proyecto
  const [proyNombre, setProyNombre] = useState('');
  const [proyDesc, setProyDesc] = useState('');
  const [proyRegionId, setProyRegionId] = useState('');
  const [proyFeedback, setProyFeedback] = useState(null);

  // Formulario centro de costo
  const [centroNombre, setCentroNombre] = useState('');
  const [centroDesc, setCentroDesc] = useState('');
  const [centroProyectoId, setCentroProyectoId] = useState('');
  const [centroFeedback, setCentroFeedback] = useState(null);

  // Estado para modal de edición
  const [editCentro, setEditCentro] = useState(null);
  const [editForm, setEditForm] = useState({ id: '', nombre: '', descripcion: '', proyecto_id: '' });
  const [editFeedback, setEditFeedback] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCentros();
    fetchProyectos();
    fetchRegiones();
  }, []);

  const fetchCentros = async () => {
    try {
      const res = await fetch(`${API_BASE}/centros_costo.php`);
      const data = await res.json();
      setCentros(Array.isArray(data) ? data : []);
    } catch (e) {
      setCentros([]);
    }
  };

  const fetchProyectos = async () => {
    try {
      const res = await fetch(`${API_BASE}/proyectos.php`);
      const data = await res.json();
      setProyectos(Array.isArray(data) ? data : []);
    } catch (e) {
      setProyectos([]);
    }
  };

  const fetchRegiones = async () => {
    try {
      const res = await fetch(`${API_BASE}/regiones.php`);
      const data = await res.json();
      setRegiones(Array.isArray(data) ? data : []);
    } catch (e) {
      setRegiones([]);
    }
  };

  // Obtener región del proyecto seleccionado (para centro de costo)
  const regionNombreCentro = centroProyectoId
    ? (regiones.find(r => String(r.region_id) === String(proyectos.find(p => String(p.proyecto_id) === String(centroProyectoId))?.region_id))?.nombre || '')
    : '';

  // Guardar nuevo proyecto
  const handleGuardarProyecto = async (e) => {
    e.preventDefault();
    setProyFeedback(null);
    if (!proyNombre.trim() || !proyRegionId) {
      setProyFeedback({ type: 'error', msg: 'Completa todos los campos.' });
      return;
    }
    
    // Verificar que region_id sea un número
    const regionId = parseInt(proyRegionId);
    if (isNaN(regionId)) {
      setProyFeedback({ type: 'error', msg: 'Región inválida.' });
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/proyectos.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: proyNombre, 
          descripcion: proyDesc, 
          region_id: regionId 
        })
      });
      const data = await res.json();
      if (data.success) {
        setModalProyecto(false);
        setMainFeedback({ type: 'success', msg: 'Proyecto agregado correctamente. Ahora debes asignarle al menos un centro de costo para que aparezca en la tabla.' });
        setProyNombre(''); setProyDesc(''); setProyRegionId('');
        fetchProyectos();
        fetchCentros();
      } else {
        setProyFeedback({ type: 'error', msg: data.error || 'No se pudo agregar.' });
      }
    } catch (e) {
      setProyFeedback({ type: 'error', msg: 'Error de red.' });
    }
    setLoading(false);
  };

  // Guardar nuevo centro de costo
  const handleGuardarCentro = async (e) => {
    e.preventDefault();
    setCentroFeedback(null);
    if (!centroNombre.trim() || !centroProyectoId) {
      setCentroFeedback({ type: 'error', msg: 'Completa todos los campos.' });
      return;
    }
    
    // Verificar que proyecto_id sea un número
    const proyectoId = parseInt(centroProyectoId);
    if (isNaN(proyectoId)) {
      setCentroFeedback({ type: 'error', msg: 'Proyecto inválido.' });
      return;
    }
    
    // Debug: mostrar los datos que se van a enviar
    console.log('Datos a enviar:', {
      nombre: centroNombre,
      descripcion: centroDesc,
      proyecto_id: proyectoId,
      tipo_proyecto_id: typeof proyectoId
    });
    
    setLoading(true);
    try {
      const requestBody = { 
        nombre: centroNombre, 
        descripcion: centroDesc, 
        proyecto_id: proyectoId 
      };
      
      const res = await fetch(`${API_BASE}/centros_costo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();
      if (data.success) {
        setModalCentro(false);
        setMainFeedback({ type: 'success', msg: 'Centro de costo agregado correctamente.' });
        setCentroNombre(''); setCentroDesc(''); setCentroProyectoId('');
        fetchCentros();
      } else {
        setCentroFeedback({ type: 'error', msg: data.error || 'No se pudo agregar.' });
      }
    } catch (e) {
      console.error('Error en la petición:', e);
      setCentroFeedback({ type: 'error', msg: 'Error de red.' });
    }
    setLoading(false);
  };

  // Eliminar centro de costo
  const handleEliminarCentro = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este centro de costo?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/eliminar_centro_costo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        fetchCentros();
      } else {
        alert(data.error || 'No se pudo eliminar');
      }
    } catch (e) {
      alert('Error de red al eliminar');
    }
    setLoading(false);
  };

  // Abrir modal de edición
  const handleEditarCentro = (centro) => {
    setEditCentro(centro);
    setEditForm({
      id: centro.id,
      nombre: centro.nombre,
      descripcion: centro.descripcion,
      proyecto_id: centro.proyecto_id || ''
    });
    setEditFeedback(null);
  };

  // Guardar edición
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setEditFeedback(null);
    if (!editForm.nombre.trim() || !editForm.proyecto_id) {
      setEditFeedback({ type: 'error', msg: 'Completa todos los campos.' });
      return;
    }
    
    // Verificar que proyecto_id sea un número
    const proyectoId = parseInt(editForm.proyecto_id);
    if (isNaN(proyectoId)) {
      setEditFeedback({ type: 'error', msg: 'Proyecto inválido.' });
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/editar_centro_costo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          proyecto_id: proyectoId
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditCentro(null);
        fetchCentros();
      } else {
        setEditFeedback({ type: 'error', msg: data.error || 'No se pudo editar.' });
      }
    } catch (e) {
      setEditFeedback({ type: 'error', msg: 'Error de red.' });
    }
    setLoading(false);
  };

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

  if (!user || user.rol !== 'super_admin') {
    return (
      <div className="main-bg">
        <div className="usuarios-acceso-denegado">
          <h2>Acceso denegado</h2>
          <p>Solo el usuario super_admin puede acceder a los ajustes principales.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-bg">
      <nav className="navbar">
        <div className="navbar-left">
          <img src={process.env.PUBLIC_URL + '/img/logo-codelco.png'} alt="Logo" className="navbar-logo" />
          <span className="navbar-title">Ajustes Principales</span>
        </div>
        <div className="navbar-menu">
          <a className="navbar-link" onClick={handleInicioClick} style={{cursor: 'pointer'}}>
            <i className="fa fa-home"></i> Inicio
          </a>
          <a className="navbar-link" onClick={handleProyectosClick} style={{cursor: 'pointer'}}>
            <i className="fa fa-building"></i> Proyectos
          </a>
          <a className="navbar-link" onClick={handleUsuariosClick} style={{cursor: 'pointer'}}>
            <i className="fa fa-users"></i> Usuarios
          </a>
          <a className="navbar-link" onClick={handleAjusteClick} style={{cursor: 'pointer'}}>
            <i className="fa fa-cog"></i> Ajuste
          </a>
        </div>
        <div className="navbar-user">
          <i className="fa fa-user-circle"></i> {user.nombre} ({user.rol})
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>
      <div className="main-content">
        <h2 className="ajuste-titulo">Centros de Costo Existentes</h2>
        <div className="ajuste-botones">
          <button className="ajuste-btn proyecto" onClick={()=>setModalProyecto(true)}>
            <i className="fa fa-plus" style={{marginRight: '0.5rem'}}></i>
            Agregar Proyecto
          </button>
          <button className="ajuste-btn centro" onClick={()=>{
            console.log('Abriendo modal centro de costo');
            console.log('Proyectos disponibles:', proyectos);
            setModalCentro(true);
          }}>
            <i className="fa fa-plus" style={{marginRight: '0.5rem'}}></i>
            Agregar Centro de Costo
          </button>
        </div>
        {mainFeedback && (
          <div className={`ajuste-feedback ${mainFeedback.type}`}>
            <i className={`fa ${mainFeedback.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{marginRight: '0.5rem'}}></i>
            {mainFeedback.msg}
            <button style={{float:'right', background:'none', border:'none', color:'inherit', cursor:'pointer', marginLeft: '0.5rem'}} onClick={()=>setMainFeedback(null)}>
              <i className="fa fa-times"></i>
            </button>
          </div>
        )}
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Proyecto</th>
              <th>Región</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {centros.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nombre}</td>
                <td>{c.descripcion}</td>
                <td>{c.proyecto_nombre || '-'}</td>
                <td>{c.region_nombre || '-'}</td>
                <td>
                  <button 
                    className="usuarios-accion-btn" 
                    onClick={()=>handleEditarCentro(c)}
                    title="Editar centro de costo"
                  >
                    <i className="fa fa-edit"></i>
                  </button>
                  <button 
                    className="usuarios-accion-btn usuarios-eliminar-btn" 
                    onClick={()=>handleEliminarCentro(c.id)}
                    title="Eliminar centro de costo"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal Proyecto */}
        {modalProyecto && (
          <div className="usuarios-modal-bg">
            <div className="usuarios-modal">
              <h3>Agregar Proyecto</h3>
              <form onSubmit={handleGuardarProyecto} className="usuarios-modal-form">
                <label>
                  <i className="fa fa-building" style={{marginRight: '0.5rem'}}></i>
                  Nombre:
                  <input type="text" value={proyNombre} onChange={e=>setProyNombre(e.target.value)} required />
                </label>
                <label>
                  <i className="fa fa-info-circle" style={{marginRight: '0.5rem'}}></i>
                  Descripción:
                  <input type="text" value={proyDesc} onChange={e=>setProyDesc(e.target.value)} />
                </label>
                <label>
                  <i className="fa fa-map-marker" style={{marginRight: '0.5rem'}}></i>
                  Región:
                  <select value={proyRegionId} onChange={e=>setProyRegionId(e.target.value)} required>
                    <option value="">Selecciona una región</option>
                    {regiones.map(r=>(<option key={r.region_id} value={r.region_id}>{r.nombre}</option>))}
                  </select>
                </label>
                {proyFeedback && <div style={{color: proyFeedback.type==='error'?'#b71c1c':'#1b5e20', marginTop:8}}>{proyFeedback.msg}</div>}
                <div className="usuarios-modal-actions">
                  <button className="usuarios-accion-btn" type="submit">
                    <i className="fa fa-save" style={{marginRight: '0.3rem'}}></i>
                    Guardar
                  </button>
                  <button className="usuarios-accion-btn" type="button" onClick={()=>setModalProyecto(false)}>
                    <i className="fa fa-times" style={{marginRight: '0.3rem'}}></i>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Centro de Costo */}
        {modalCentro && (
          <div className="usuarios-modal-bg">
            <div className="usuarios-modal">
              <h3>Agregar Centro de Costo</h3>
              <form onSubmit={handleGuardarCentro} className="usuarios-modal-form">
                <label>
                  <i className="fa fa-sitemap" style={{marginRight: '0.5rem'}}></i>
                  Nombre:
                  <input type="text" value={centroNombre} onChange={e=>setCentroNombre(e.target.value)} required />
                </label>
                <label>
                  <i className="fa fa-info-circle" style={{marginRight: '0.5rem'}}></i>
                  Descripción:
                  <input type="text" value={centroDesc} onChange={e=>setCentroDesc(e.target.value)} />
                </label>
                <label>
                  <i className="fa fa-building" style={{marginRight: '0.5rem'}}></i>
                  Proyecto:
                  <select value={centroProyectoId} onChange={e=>{
                    console.log('Cambiando proyecto:', e.target.value, 'Tipo:', typeof e.target.value);
                    setCentroProyectoId(e.target.value);
                  }} required>
                    <option value="">Selecciona un proyecto</option>
                    {proyectos.map(p=>(<option key={p.proyecto_id} value={p.proyecto_id}>{p.nombre}</option>))}
                  </select>
                </label>
                <label>
                  <i className="fa fa-map-marker" style={{marginRight: '0.5rem'}}></i>
                  Región:
                  <input type="text" value={regionNombreCentro} readOnly style={{background:'#f5f5f5'}} />
                </label>
                {centroFeedback && <div style={{color: centroFeedback.type==='error'?'#b71c1c':'#1b5e20', marginTop:8}}>{centroFeedback.msg}</div>}
                <div className="usuarios-modal-actions">
                  <button className="usuarios-accion-btn" type="submit">
                    <i className="fa fa-save" style={{marginRight: '0.3rem'}}></i>
                    Guardar
                  </button>
                  <button className="usuarios-accion-btn" type="button" onClick={()=>setModalCentro(false)}>
                    <i className="fa fa-times" style={{marginRight: '0.3rem'}}></i>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de edición */}
        {editCentro && (
          <div className="usuarios-modal-bg">
            <div className="usuarios-modal">
              <h3>Editar Centro de Costo</h3>
              <form onSubmit={handleGuardarEdicion} className="usuarios-modal-form">
                <label>
                  <i className="fa fa-sitemap" style={{marginRight: '0.5rem'}}></i>
                  Nombre:
                  <input type="text" value={editForm.nombre} onChange={e=>setEditForm(f=>({...f, nombre:e.target.value}))} required />
                </label>
                <label>
                  <i className="fa fa-info-circle" style={{marginRight: '0.5rem'}}></i>
                  Descripción:
                  <input type="text" value={editForm.descripcion} onChange={e=>setEditForm(f=>({...f, descripcion:e.target.value}))} />
                </label>
                <label>
                  <i className="fa fa-building" style={{marginRight: '0.5rem'}}></i>
                  Proyecto:
                  <select value={editForm.proyecto_id} onChange={e=>setEditForm(f=>({...f, proyecto_id:e.target.value}))} required>
                    <option value="">Selecciona un proyecto</option>
                    {proyectos.map(p=>(<option key={p.proyecto_id} value={p.proyecto_id}>{p.nombre}</option>))}
                  </select>
                </label>
                <label>
                  <i className="fa fa-map-marker" style={{marginRight: '0.5rem'}}></i>
                  Región:
                  <input type="text" value={editForm.proyecto_id ? (regiones.find(r => String(r.region_id) === String(proyectos.find(p => String(p.proyecto_id) === String(editForm.proyecto_id))?.region_id))?.nombre || '') : ''} readOnly style={{background:'#f5f5f5'}} />
                </label>
                {editFeedback && <div style={{color: editFeedback.type==='error'?'#b71c1c':'#1b5e20', marginTop:8}}>{editFeedback.msg}</div>}
                <div className="usuarios-modal-actions">
                  <button className="usuarios-accion-btn" type="submit">
                    <i className="fa fa-save" style={{marginRight: '0.3rem'}}></i>
                    Guardar
                  </button>
                  <button className="usuarios-accion-btn" type="button" onClick={()=>setEditCentro(null)}>
                    <i className="fa fa-times" style={{marginRight: '0.3rem'}}></i>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ajuste; 