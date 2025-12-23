<?php
// Este archivo se incluye cuando TCPDF no está disponible
// Genera un HTML que se puede imprimir como PDF desde el navegador
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte del Proyecto: <?php echo htmlspecialchars($proyecto['nombre']); ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @media print {
            @page {
                size: A4;
                margin: 1cm;
            }
            body {
                margin: 0;
                padding: 5px;
            }
            .no-print {
                display: none !important;
            }
            .page-break {
                page-break-after: always;
            }
        }
        
        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1a1a1a;
            line-height: 1.5;
            background: #f5f7fa;
            padding: 15px;
            font-size: 11px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        /* Header compacto */
        .header {
            background: linear-gradient(135deg, #002B7F 0%, #0a6ebd 100%);
            color: white;
            padding: 25px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
            letter-spacing: 2px;
        }
        
        .header h2 {
            font-size: 14px;
            font-weight: 400;
            margin-bottom: 15px;
            opacity: 0.9;
        }
        
        .header .project-info {
            font-size: 12px;
            margin-top: 10px;
        }
        
        .header .project-name {
            font-size: 18px;
            font-weight: 600;
            color: #F2A900;
            margin: 8px 0;
        }
        
        /* Secciones compactas */
        .section {
            padding: 20px 30px;
            margin-bottom: 15px;
            background: white;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #002B7F;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 3px solid #F2A900;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .section-title i {
            font-size: 18px;
            color: #F2A900;
        }
        
        /* KPIs compactos en tabla */
        .kpi-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .kpi-table th {
            background: #f8f9fa;
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #dee2e6;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            color: #495057;
        }
        
        .kpi-table td {
            padding: 10px 12px;
            border: 1px solid #dee2e6;
            font-size: 11px;
        }
        
        .kpi-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .kpi-value {
            font-size: 16px;
            font-weight: 700;
            color: #002B7F;
        }
        
        .kpi-value.primary { color: #0a6ebd; }
        .kpi-value.success { color: #28a745; }
        .kpi-value.warning { color: #ffc107; }
        .kpi-value.danger { color: #dc3545; }
        
        /* Tablas comparativas */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10px;
        }
        
        table thead {
            background: linear-gradient(135deg, #002B7F 0%, #0a6ebd 100%);
            color: white;
        }
        
        table th {
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        table td {
            padding: 8px;
            border-bottom: 1px solid #e9ecef;
            font-size: 10px;
        }
        
        table tbody tr:hover {
            background: #f8f9fa;
        }
        
        table tbody tr:last-child td {
            border-bottom: none;
        }
        
        /* Badges compactos */
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .badge-success {
            background: #d4edda;
            color: #155724;
        }
        
        .badge-warning {
            background: #fff3cd;
            color: #856404;
        }
        
        .badge-danger {
            background: #f8d7da;
            color: #721c24;
        }
        
        /* Progress bars compactos */
        .progress-container {
            margin: 5px 0;
        }
        
        .progress-bar-wrapper {
            height: 18px;
            background: #e9ecef;
            border-radius: 9px;
            overflow: hidden;
            position: relative;
        }
        
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #0a6ebd 0%, #17a2b8 100%);
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 6px;
            color: white;
            font-weight: 700;
            font-size: 9px;
        }
        
        .progress-bar.success { background: linear-gradient(90deg, #28a745 0%, #20c997 100%); }
        .progress-bar.warning { background: linear-gradient(90deg, #ffc107 0%, #ff9800 100%); }
        .progress-bar.danger { background: linear-gradient(90deg, #dc3545 0%, #c82333 100%); }
        
        /* Tabla comparativa de empresas */
        .comparative-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10px;
        }
        
        .comparative-table th {
            background: #002B7F;
            color: white;
            padding: 10px 8px;
            text-align: center;
            font-weight: 600;
            font-size: 10px;
        }
        
        .comparative-table th:first-child {
            text-align: left;
        }
        
        .comparative-table td {
            padding: 8px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        
        .comparative-table td:first-child {
            text-align: left;
            font-weight: 600;
        }
        
        .comparative-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        /* Print button */
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .print-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(220, 53, 69, 0.5);
        }
        
        /* Footer compacto */
        .footer {
            background: #f8f9fa;
            padding: 15px 30px;
            text-align: center;
            border-top: 2px solid #e9ecef;
            color: #6c757d;
            font-size: 9px;
        }
        
        /* Info compacta */
        .info-compact {
            background: #f8f9fa;
            border-left: 3px solid #0a6ebd;
            padding: 10px 15px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 10px;
        }
        
        /* Resumen ejecutivo */
        .executive-summary {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .executive-summary h4 {
            color: #002B7F;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .executive-summary p {
            font-size: 10px;
            color: #495057;
            margin: 3px 0;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">
        <i class="fas fa-print"></i> Imprimir / Guardar PDF
    </button>

    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>CODELCO</h1>
            <h2>Sistema de Control de Riesgos Críticos</h2>
            <div class="project-name"><?php echo htmlspecialchars($proyecto['nombre']); ?></div>
            <div class="project-info">
                <span>ID: <?php echo $proyecto['proyecto_id']; ?></span> | 
                <span>Fecha: <?php echo date('d/m/Y H:i:s'); ?></span>
            </div>
        </div>

        <!-- Resumen Ejecutivo -->
        <div class="section">
            <div class="section-title">
                <i class="fas fa-chart-line"></i>
                RESUMEN EJECUTIVO
            </div>
            
            <div class="executive-summary">
                <h4><i class="fas fa-info-circle"></i> Información del Proyecto</h4>
                <p><strong>Nombre:</strong> <?php echo htmlspecialchars($proyecto['nombre']); ?> | <strong>ID:</strong> <?php echo $proyecto['proyecto_id']; ?></p>
                <?php if (isset($proyecto['descripcion']) && $proyecto['descripcion']): ?>
                <p><strong>Descripción:</strong> <?php echo htmlspecialchars($proyecto['descripcion']); ?></p>
                <?php endif; ?>
            </div>
            
            <!-- Tabla de KPIs -->
            <table class="kpi-table">
                <thead>
                    <tr>
                        <th><i class="fas fa-chart-pie"></i> Indicador</th>
                        <th><i class="fas fa-chart-bar"></i> Valor</th>
                        <th><i class="fas fa-percentage"></i> Avance</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Avance General</strong></td>
                        <td><span class="kpi-value primary"><?php echo number_format($promedio_general, 2); ?>%</span></td>
                        <td>
                            <div class="progress-container">
                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar <?php 
                                        $class = 'danger';
                                        if ($promedio_general >= 80) $class = 'success';
                                        elseif ($promedio_general >= 50) $class = 'warning';
                                        echo $class;
                                    ?>" style="width: <?php echo $promedio_general; ?>%;">
                                        <?php echo number_format($promedio_general, 1); ?>%
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Total Carpetas</strong></td>
                        <td><span class="kpi-value"><?php echo number_format($kpis['total_carpetas'] ?? 0); ?></span></td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td><strong>Total Controles</strong></td>
                        <td><span class="kpi-value"><?php echo number_format($kpis['total_controles'] ?? 0); ?></span></td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td><strong>Controles Validados</strong></td>
                        <td><span class="kpi-value success"><?php echo number_format($kpis['controles_validados'] ?? 0); ?></span></td>
                        <td>
                            <?php 
                            $total = $kpis['total_controles'] ?? 1;
                            $validados = $kpis['controles_validados'] ?? 0;
                            $porc_validados = $total > 0 ? ($validados / $total) * 100 : 0;
                            ?>
                            <div class="progress-container">
                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar success" style="width: <?php echo $porc_validados; ?>%;">
                                        <?php echo number_format($porc_validados, 1); ?>%
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Controles con Observaciones</strong></td>
                        <td><span class="kpi-value warning"><?php echo number_format($kpis['controles_observaciones'] ?? 0); ?></span></td>
                        <td>
                            <?php 
                            $observaciones = $kpis['controles_observaciones'] ?? 0;
                            $porc_obs = $total > 0 ? ($observaciones / $total) * 100 : 0;
                            ?>
                            <div class="progress-container">
                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar warning" style="width: <?php echo $porc_obs; ?>%;">
                                        <?php echo number_format($porc_obs, 1); ?>%
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Usuarios Activos</strong></td>
                        <td><span class="kpi-value"><?php echo number_format($kpis['usuarios_activos'] ?? 0); ?></span></td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td><strong>Avance Global por Empresa</strong></td>
                        <td><span class="kpi-value primary"><?php echo number_format($kpis['avance_global_empresas'] ?? 0, 2); ?>%</span></td>
                        <td>
                            <div class="progress-container">
                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar primary" style="width: <?php echo $kpis['avance_global_empresas'] ?? 0; ?>%;">
                                        <?php echo number_format($kpis['avance_global_empresas'] ?? 0, 1); ?>%
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Comparativa de Empresas -->
        <?php if (!empty($kpis['avance_por_empresa']) && is_array($kpis['avance_por_empresa'])): ?>
        <div class="section page-break">
            <div class="section-title">
                <i class="fas fa-building"></i>
                COMPARATIVA DE AVANCE POR EMPRESA
            </div>
            
            <table class="comparative-table">
                <thead>
                    <tr>
                        <th>Empresa</th>
                        <th>Avance (%)</th>
                        <th>Controles</th>
                        <th>Estado</th>
                        <th>Progreso</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    // Ordenar por avance descendente
                    $empresas_ordenadas = $kpis['avance_por_empresa'];
                    usort($empresas_ordenadas, function($a, $b) {
                        return floatval($b['avance_promedio'] ?? 0) <=> floatval($a['avance_promedio'] ?? 0);
                    });
                    foreach ($empresas_ordenadas as $empresa): 
                        $avance = floatval($empresa['avance_promedio'] ?? 0);
                        $badge_class = $avance >= 80 ? 'badge-success' : ($avance >= 50 ? 'badge-warning' : 'badge-danger');
                        $progress_class = $avance >= 80 ? 'success' : ($avance >= 50 ? 'warning' : 'danger');
                        $estado = $avance >= 80 ? 'Completo' : ($avance >= 50 ? 'En Progreso' : 'Pendiente');
                    ?>
                    <tr>
                        <td><strong><?php echo htmlspecialchars($empresa['empresa'] ?? 'Sin nombre'); ?></strong></td>
                        <td><strong style="font-size: 12px; color: #002B7F;"><?php echo number_format($avance, 1); ?>%</strong></td>
                        <td><?php echo number_format($empresa['total_controles'] ?? 0); ?></td>
                        <td><span class="badge <?php echo $badge_class; ?>"><?php echo $estado; ?></span></td>
                        <td>
                            <div class="progress-container">
                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar <?php echo $progress_class; ?>" style="width: <?php echo $avance; ?>%;">
                                        <?php echo number_format($avance, 0); ?>%
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>

        <!-- Comparativa de Riesgos Críticos -->
        <?php if (!empty($carpetas_data['carpetas']) && is_array($carpetas_data['carpetas'])): ?>
        <div class="section page-break">
            <div class="section-title">
                <i class="fas fa-exclamation-triangle"></i>
                COMPARATIVA DE RIESGOS CRÍTICOS (RC)
            </div>
            
            <table class="comparative-table">
                <thead>
                    <tr>
                        <th>Riesgo Crítico</th>
                        <th>Avance (%)</th>
                        <th>Empresas</th>
                        <th>Estado</th>
                        <th>Progreso</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    // Ordenar por avance descendente
                    $carpetas_ordenadas = $carpetas_data['carpetas'];
                    usort($carpetas_ordenadas, function($a, $b) {
                        return floatval($b['promedio_ponderacion'] ?? 0) <=> floatval($a['promedio_ponderacion'] ?? 0);
                    });
                    foreach ($carpetas_ordenadas as $carpeta_nivel1): 
                        $promedio_rc = floatval($carpeta_nivel1['promedio_ponderacion'] ?? 0);
                        $badge_class_rc = $promedio_rc >= 80 ? 'badge-success' : ($promedio_rc >= 50 ? 'badge-warning' : 'badge-danger');
                        $progress_class_rc = $promedio_rc >= 80 ? 'success' : ($promedio_rc >= 50 ? 'warning' : 'danger');
                        $estado_rc = $promedio_rc >= 80 ? 'Completo' : ($promedio_rc >= 50 ? 'En Progreso' : 'Pendiente');
                        $num_empresas = !empty($carpeta_nivel1['subcarpetas']) ? count($carpeta_nivel1['subcarpetas']) : 0;
                    ?>
                    <tr>
                        <td><strong><?php echo htmlspecialchars($carpeta_nivel1['nombre']); ?></strong></td>
                        <td><strong style="font-size: 12px; color: #002B7F;"><?php echo number_format($promedio_rc, 2); ?>%</strong></td>
                        <td><?php echo $num_empresas; ?></td>
                        <td><span class="badge <?php echo $badge_class_rc; ?>"><?php echo $estado_rc; ?></span></td>
                        <td>
                            <div class="progress-container">
                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar <?php echo $progress_class_rc; ?>" style="width: <?php echo $promedio_rc; ?>%;">
                                        <?php echo number_format($promedio_rc, 0); ?>%
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <!-- Detalle de Empresas por RC -->
        <?php foreach ($carpetas_data['carpetas'] as $carpeta_nivel1): ?>
            <?php if (!empty($carpeta_nivel1['subcarpetas']) && is_array($carpeta_nivel1['subcarpetas'])): ?>
            <div class="section">
                <div class="section-title">
                    <i class="fas fa-list"></i>
                    <?php echo strtoupper(htmlspecialchars($carpeta_nivel1['nombre'])); ?> - Empresas
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th>Avance (%)</th>
                            <th>Estado</th>
                            <th>Progreso</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        // Ordenar empresas por avance
                        $subcarpetas_ordenadas = $carpeta_nivel1['subcarpetas'];
                        usort($subcarpetas_ordenadas, function($a, $b) {
                            return floatval($b['promedio_ponderacion'] ?? 0) <=> floatval($a['promedio_ponderacion'] ?? 0);
                        });
                        foreach ($subcarpetas_ordenadas as $subcarpeta): 
                            $avance_emp = floatval($subcarpeta['promedio_ponderacion'] ?? 0);
                            $badge_class_emp = $avance_emp >= 80 ? 'badge-success' : ($avance_emp >= 50 ? 'badge-warning' : 'badge-danger');
                            $progress_class_emp = $avance_emp >= 80 ? 'success' : ($avance_emp >= 50 ? 'warning' : 'danger');
                            $estado_emp = $avance_emp >= 80 ? 'Completo' : ($avance_emp >= 50 ? 'En Progreso' : 'Pendiente');
                        ?>
                        <tr>
                            <td><?php echo htmlspecialchars($subcarpeta['nombre'] ?? 'Sin nombre'); ?></td>
                            <td><strong><?php echo number_format($avance_emp, 2); ?>%</strong></td>
                            <td><span class="badge <?php echo $badge_class_emp; ?>"><?php echo $estado_emp; ?></span></td>
                            <td>
                                <div class="progress-container">
                                    <div class="progress-bar-wrapper">
                                        <div class="progress-bar <?php echo $progress_class_emp; ?>" style="width: <?php echo $avance_emp; ?>%;">
                                            <?php echo number_format($avance_emp, 0); ?>%
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        <?php endforeach; ?>
        <?php endif; ?>

        <!-- Footer -->
        <div class="footer">
            <p style="font-weight: 600; color: #002B7F; margin-bottom: 5px;">
                <i class="fas fa-shield-alt"></i> Sistema de Control de Riesgos Críticos - Codelco
            </p>
            <p>Reporte generado automáticamente el <?php echo date('d/m/Y H:i:s'); ?></p>
        </div>
    </div>

    <script>
        // Auto-imprimir si se solicita
        if (window.location.search.includes('autoprint=1')) {
            window.onload = function() {
                setTimeout(() => window.print(), 500);
            };
        }
    </script>
</body>
</html>
