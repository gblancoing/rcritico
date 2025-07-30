import React, { useState, useEffect, useRef } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, CircularProgress } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// REGISTRO DE MODULOS AG GRID
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { API_BASE, buildAppUrl } from '../config';

export default function EstructuraCuentas() {
  // Estado para la tabla 1
  const [rowData1, setRowData1] = useState([
    { id: 1, descripcion: 'Prueba 1' },
    { id: 2, descripcion: 'Prueba 2' }
  ]);

  // Columnas para la tabla 1
  const columnDefs1 = [
    { headerName: 'ID', field: 'id', width: 120, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, sortable: true }
  ];

  // Configuración por defecto de AgGrid
  const defaultColDef = {
    sortable: true,
    resizable: true,
    // NO filter, NO floatingFilter
  };

  // Fetch de datos para la tabla 1
  useEffect(() => {
    const apiUrl = buildAppUrl('api/analisis/campo1_area.php');
    fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setRowData1(data);
        else throw new Error('Datos no válidos');
      })
      .catch(err => {
        console.error('Error al cargar datos:', err);
        setRowData1([
          { id: 1, descripcion: 'Área Norte' },
          { id: 2, descripcion: 'Área Sur' },
          { id: 3, descripcion: 'Área Este' },
          { id: 4, descripcion: 'Área Oeste' },
          { id: 5, descripcion: 'Área Central' }
        ]);
      });
  }, []);

  console.log('rowData1:', rowData1);

  const gridRef = useRef();

  // Estado y columnas para Campo 1 - AREA
  const [rowDataArea, setRowDataArea] = useState([]);
  const [columnDefsArea] = useState([
    { headerName: 'ID', field: 'id', width: 100, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, sortable: true }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/analisis/campo1_area.php`)
      .then(res => res.json())
      .then(data => setRowDataArea(data))
      .catch(() => setRowDataArea([]));
  }, []);

  // Estado y columnas para Responsables OBS
  const [rowDataResponsables, setRowDataResponsables] = useState([]);
  const [columnDefsResponsables] = useState([
    { headerName: 'ID', field: 'id', width: 100, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, sortable: true }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/analisis/responsables_obs.php`)
      .then(res => res.json())
      .then(data => setRowDataResponsables(data))
      .catch(() => setRowDataResponsables([]));
  }, []);

  // Estado y columnas para Paquetes
  const [rowDataPaquetes, setRowDataPaquetes] = useState([]);
  const [columnDefsPaquetes] = useState([
    { headerName: 'ID', field: 'id', width: 100, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, sortable: true }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/analisis/paquetes.php`)
      .then(res => res.json())
      .then(data => setRowDataPaquetes(data))
      .catch(() => setRowDataPaquetes([]));
  }, []);

  // Estado y columnas para Adquisiciones VP
  const [rowDataAdquisiciones, setRowDataAdquisiciones] = useState([]);
  const [columnDefsAdquisiciones] = useState([
    { headerName: 'ID', field: 'id', width: 100, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, sortable: true }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/analisis/adquisiciones_vp.php`)
      .then(res => res.json())
      .then(data => setRowDataAdquisiciones(data))
      .catch(() => setRowDataAdquisiciones([]));
  }, []);

  // Estado y columnas para Adquisiciones Agenciadas
  const [rowDataAgenciadas, setRowDataAgenciadas] = useState([]);
  const [columnDefsAgenciadas] = useState([
    { headerName: 'ID', field: 'id', width: 100, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, sortable: true }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/analisis/adquissiciones_agenciadas.php`)
      .then(res => res.json())
      .then(data => setRowDataAgenciadas(data))
      .catch(() => setRowDataAgenciadas([]));
  }, []);

  // Estado y columnas para Contratos de Servicios
  const [rowDataContratos, setRowDataContratos] = useState([]);
  const [columnDefsContratos] = useState([
    { headerName: 'ID', field: 'id', width: 100, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, sortable: true }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/analisis/contratos_servicios.php`)
      .then(res => res.json())
      .then(data => setRowDataContratos(data))
      .catch(() => setRowDataContratos([]));
  }, []);

  // Estado y columnas para Campo 3 - FASE (Operación)
  const [rowDataFase, setRowDataFase] = useState([]);
  const [columnDefsFase] = useState([
    { headerName: 'ID', field: 'id', width: 100, sortable: true },
    { headerName: 'Categoría', field: 'categoria', flex: 1, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 2, sortable: true }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/analisis/campo3_fase.php`)
      .then(res => res.json())
      .then(data => setRowDataFase(data))
      .catch(() => setRowDataFase([]));
  }, []);

  // Estado y columnas para Campo 4 - Etapa
  const [rowDataEtapa, setRowDataEtapa] = useState([]);
  const [columnDefsEtapa] = useState([
    { headerName: 'ID', field: 'id', width: 100, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, sortable: true }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/analisis/campo4_etapa.php`)
      .then(res => res.json())
      .then(data => setRowDataEtapa(data))
      .catch(() => setRowDataEtapa([]));
  }, []);

  // Estado y columnas para Campo 5 - Disciplina
  const [rowDataDisciplina, setRowDataDisciplina] = useState([]);
  const [columnDefsDisciplina] = useState([
    { headerName: 'ID', field: 'id', width: 100, sortable: true },
    { headerName: 'Descripción', field: 'descripcion', flex: 1, sortable: true }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/analisis/campo5_disciplina.php`)
      .then(res => res.json())
      .then(data => setRowDataDisciplina(data))
      .catch(() => setRowDataDisciplina([]));
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', mt: 7 }}>
      <Box sx={{
        background: '#e3f2fd',
        borderRadius: 2,
        boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
        maxWidth: 900,
        mx: 'auto',
        mt: 5,
        mb: 2,
        p: 2.5,
        color: '#0a3265',
        fontSize: 16,
        fontWeight: 400,
      }}>
        <b>Importancia de la estructura de cuentas de costos:</b> La correcta definición y organización de las cuentas de costos es fundamental para el control eficiente y el análisis financiero de los proyectos. Esta estructura permite clasificar, cruzar y analizar los datos principales del proyecto, facilitando la toma de decisiones y la automatización de reportes clave para la gestión y éxito del proyecto.
      </Box>
      {/* Tabla 1 */}
      <Accordion
        sx={{
          background: '#e3f2fd',
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
          mb: 1.2,
          '& .MuiAccordionSummary-root': {
            minHeight: 36,
            paddingY: 0.2,
            paddingX: 1.2,
          },
          '& .MuiAccordionSummary-content': {
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#0a3265',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiAccordionDetails-root': {
            padding: 1.2,
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<FolderIcon sx={{ color: '#fbc02d', mr: 1, fontSize: 20 }} />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0a3265', display: 'flex', alignItems: 'center' }}>
            Campo 1 - ÁREA (Facility)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: '#fff', borderRadius: 2, p: 2 }}>
          <div style={{ width: '100%', minWidth: 400 }}>
            <div className="ag-theme-alpine legacy custom-codelco-theme" style={{ height: 350, width: '100%', fontSize: 15 }}>
              <AgGridReact
                ref={gridRef}
                key={rowData1.length}
                rowData={rowData1}
                columnDefs={columnDefs1}
                defaultColDef={{
                  sortable: true,
                  resizable: true,
                  // NO filter, NO floatingFilter
                }}
                pagination={true}
                paginationPageSize={10}
                domLayout="autoHeight"
                animateRows={true}
                suppressRowClickSelection={true}
                suppressCellFocus={true}
                rowSelection="single"
                overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
                quickFilterText=""
              />
            </div>
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Tabla 2 */}
      <Accordion
        sx={{
          background: '#e3f2fd',
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
          mb: 1.2,
          '& .MuiAccordionSummary-root': {
            minHeight: 36,
            paddingY: 0.2,
            paddingX: 1.2,
          },
          '& .MuiAccordionSummary-content': {
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#0a3265',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiAccordionDetails-root': {
            padding: 1.2,
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<FolderIcon sx={{ color: '#fbc02d', mr: 1, fontSize: 20 }} />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0a3265', display: 'flex', alignItems: 'center' }}>
            Responsable (OBS)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: '#fff', borderRadius: 2, p: 2 }}>
          <div className="ag-theme-alpine legacy custom-codelco-theme" style={{ height: 350, width: '100%', fontSize: 15 }}>
            <AgGridReact
              rowData={rowDataResponsables}
              columnDefs={columnDefsResponsables}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={10}
              domLayout="autoHeight"
              animateRows={true}
              suppressRowClickSelection={true}
              suppressCellFocus={true}
              rowSelection="single"
              overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
            />
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Tabla 3 */}
      <Accordion
        sx={{
          background: '#e3f2fd',
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
          mb: 1.2,
          '& .MuiAccordionSummary-root': {
            minHeight: 36,
            paddingY: 0.2,
            paddingX: 1.2,
          },
          '& .MuiAccordionSummary-content': {
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#0a3265',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiAccordionDetails-root': {
            padding: 1.2,
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<FolderIcon sx={{ color: '#fbc02d', mr: 1, fontSize: 20 }} />}
          aria-controls="panel3-content"
          id="panel3-header"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0a3265', display: 'flex', alignItems: 'center' }}>
            Tipo de Paquete
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: '#fff', borderRadius: 2, p: 2 }}>
          <div className="ag-theme-alpine legacy custom-codelco-theme" style={{ width: '100%', fontSize: 15 }}>
            <AgGridReact
              rowData={rowDataPaquetes}
              columnDefs={columnDefsPaquetes}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={15}
              domLayout="autoHeight"  // <-- Esto es clave
              animateRows={true}
              suppressRowClickSelection={true}
              suppressCellFocus={true}
              rowSelection="single"
              overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
            />
          </div>
        </AccordionDetails>
      </Accordion>



      {/* Tabla 4 */}
      <Accordion
        sx={{
          background: '#e3f2fd',
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
          mb: 1.2,
          '& .MuiAccordionSummary-root': {
            minHeight: 36,
            paddingY: 0.2,
            paddingX: 1.2,
          },
          '& .MuiAccordionSummary-content': {
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#0a3265',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiAccordionDetails-root': {
            padding: 1.2,
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<FolderIcon sx={{ color: '#fbc02d', mr: 1, fontSize: 20 }} />}
          aria-controls="panel4-content"
          id="panel4-header"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0a3265', display: 'flex', alignItems: 'center' }}>
            Adquisiciones VP
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: '#fff', borderRadius: 2, p: 2 }}>
          <div className="ag-theme-alpine legacy custom-codelco-theme" style={{ width: '100%', fontSize: 15 }}>
            <AgGridReact
              rowData={rowDataAdquisiciones}
              columnDefs={columnDefsAdquisiciones}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={15}
              domLayout="autoHeight"
              animateRows={true}
              suppressRowClickSelection={true}
              suppressCellFocus={true}
              rowSelection="single"
              overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
            />
          </div>
        </AccordionDetails>
      </Accordion>




      {/* Tabla 5 */}
      <Accordion
        sx={{
          background: '#e3f2fd',
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
          mb: 1.2,
          '& .MuiAccordionSummary-root': {
            minHeight: 36,
            paddingY: 0.2,
            paddingX: 1.2,
          },
          '& .MuiAccordionSummary-content': {
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#0a3265',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiAccordionDetails-root': {
            padding: 1.2,
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<FolderIcon sx={{ color: '#fbc02d', mr: 1, fontSize: 20 }} />}
          aria-controls="panel5-content"
          id="panel5-header"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0a3265', display: 'flex', alignItems: 'center' }}>
            Adquisiciones Agenciadas
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: '#fff', borderRadius: 2, p: 2 }}>
          <div className="ag-theme-alpine legacy custom-codelco-theme" style={{ width: '100%', fontSize: 15 }}>
            <AgGridReact
              rowData={rowDataAgenciadas}
              columnDefs={columnDefsAgenciadas}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={15}
              domLayout="autoHeight"
              animateRows={true}
              suppressRowClickSelection={true}
              suppressCellFocus={true}
              rowSelection="single"
              overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
            />
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Tabla 6 */}
      <Accordion
        sx={{
          background: '#e3f2fd',
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
          mb: 1.2,
          '& .MuiAccordionSummary-root': {
            minHeight: 36,
            paddingY: 0.2,
            paddingX: 1.2,
          },
          '& .MuiAccordionSummary-content': {
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#0a3265',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiAccordionDetails-root': {
            padding: 1.2,
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<FolderIcon sx={{ color: '#fbc02d', mr: 1, fontSize: 20 }} />}
          aria-controls="panel6-content"
          id="panel6-header"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0a3265', display: 'flex', alignItems: 'center' }}>
            Contratos de Servicios
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: '#fff', borderRadius: 2, p: 2 }}>
          <div className="ag-theme-alpine legacy custom-codelco-theme" style={{ width: '100%', fontSize: 15 }}>
            <AgGridReact
              rowData={rowDataContratos}
              columnDefs={columnDefsContratos}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={15}
              domLayout="autoHeight"
              animateRows={true}
              suppressRowClickSelection={true}
              suppressCellFocus={true}
              rowSelection="single"
              overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
            />
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Tabla 7 */}
      <Accordion
        sx={{
          background: '#e3f2fd',
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
          mb: 1.2,
          '& .MuiAccordionSummary-root': {
            minHeight: 36,
            paddingY: 0.2,
            paddingX: 1.2,
          },
          '& .MuiAccordionSummary-content': {
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#0a3265',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiAccordionDetails-root': {
            padding: 1.2,
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<FolderIcon sx={{ color: '#fbc02d', mr: 1, fontSize: 20 }} />}
          aria-controls="panel7-content"
          id="panel7-header"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0a3265', display: 'flex', alignItems: 'center' }}>
            Campo 3 - FASE (Operación)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: '#fff', borderRadius: 2, p: 2 }}>
          <div className="ag-theme-alpine legacy custom-codelco-theme" style={{ width: '100%', fontSize: 15 }}>
            <AgGridReact
              rowData={rowDataFase}
              columnDefs={columnDefsFase}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={15}
              domLayout="autoHeight"
              animateRows={true}
              suppressRowClickSelection={true}
              suppressCellFocus={true}
              rowSelection="single"
              overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
            />
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Tabla 8 */}
      <Accordion
        sx={{
          background: '#e3f2fd',
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
          mb: 1.2,
          '& .MuiAccordionSummary-root': {
            minHeight: 36,
            paddingY: 0.2,
            paddingX: 1.2,
          },
          '& .MuiAccordionSummary-content': {
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#0a3265',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiAccordionDetails-root': {
            padding: 1.2,
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<FolderIcon sx={{ color: '#fbc02d', mr: 1, fontSize: 20 }} />}
          aria-controls="panel8-content"
          id="panel8-header"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0a3265', display: 'flex', alignItems: 'center' }}>
            Campo 4 - Etapa
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: '#fff', borderRadius: 2, p: 2 }}>
          <div className="ag-theme-alpine legacy custom-codelco-theme" style={{ width: '100%', fontSize: 15 }}>
            <AgGridReact
              rowData={rowDataEtapa}
              columnDefs={columnDefsEtapa}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={15}
              domLayout="autoHeight"
              animateRows={true}
              suppressRowClickSelection={true}
              suppressCellFocus={true}
              rowSelection="single"
              overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
            />
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Tabla 9 */}
      <Accordion
        sx={{
          background: '#e3f2fd',
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(10,50,101,0.07)',
          mb: 1.2,
          '& .MuiAccordionSummary-root': {
            minHeight: 36,
            paddingY: 0.2,
            paddingX: 1.2,
          },
          '& .MuiAccordionSummary-content': {
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#0a3265',
            alignItems: 'center',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiAccordionDetails-root': {
            padding: 1.2,
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<FolderIcon sx={{ color: '#fbc02d', mr: 1, fontSize: 20 }} />}
          aria-controls="panel9-content"
          id="panel9-header"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0a3265', display: 'flex', alignItems: 'center' }}>
            Campo 5 - Disciplina (Commodity) 
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: '#fff', borderRadius: 2, p: 2 }}>
          <div className="ag-theme-alpine legacy custom-codelco-theme" style={{ width: '100%', fontSize: 15 }}>
            <AgGridReact
              rowData={rowDataDisciplina}
              columnDefs={columnDefsDisciplina}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={15}
              domLayout="autoHeight"
              animateRows={true}
              suppressRowClickSelection={true}
              suppressCellFocus={true}
              rowSelection="single"
              overlayNoRowsTemplate={'<span style="color:#888">No hay datos para mostrar</span>'}
            />
          </div>
        </AccordionDetails>
      </Accordion>

    </Box>
  );
}
