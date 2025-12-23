<?php
// Reporte HTML moderno y ejecutivo - Vista previa antes de generar PDF
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Ejecutivo: <?php echo htmlspecialchars($proyecto['nombre']); ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <?php
    // Determinar la ruta base del proyecto desde la URL
    $request_uri = $_SERVER['REQUEST_URI'] ?? '';
    $base_path = '';
    if (strpos($request_uri, '/rcritico/') !== false) {
        $base_path = '/rcritico';
    }
    
    // Ruta de la imagen de fondo
    $fondo_url = $base_path . '/public/img/muro.jpg';
    ?>
    <style>
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
                background: white;
            }
            .no-print {
                display: none !important;
            }
            .container {
                box-shadow: none;
            }
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #1a1a1a;
            line-height: 1.5;
            background: #f5f7fa;
            padding: 15px;
            padding-bottom: 40px;
        }
        
        .container {
            max-width: 1100px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #0a6ebd 0%, #005288 100%);
            background-image: url('<?php echo htmlspecialchars($fondo_url); ?>');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            color: white;
            padding: 35px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(10, 110, 189, 0.45);
            z-index: 0;
        }
        
        .header > * {
            position: relative;
            z-index: 1;
        }
        
        .header .logo {
            font-size: 42px;
            font-weight: 800;
            letter-spacing: 3px;
            margin-bottom: 5px;
        }
        
        .header img {
            max-height: 70px;
            margin-bottom: 15px;
            filter: brightness(0) invert(1);
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        
        .header .subtitle {
            font-size: 14px;
            font-weight: 400;
            opacity: 0.95;
            margin-bottom: 20px;
            letter-spacing: 0.5px;
        }
        
        .header .project-name {
            font-size: 24px;
            font-weight: 700;
            color: #FF8C00;
            margin: 15px 0 10px 0;
        }
        
        .header .meta-info {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 15px;
        }
        
        .action-buttons {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        }
        
        .btn {
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 3px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 18px rgba(0,0,0,0.2);
        }
        
        .btn-pdf {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
        }
        
        .btn-print {
            background: linear-gradient(135deg, #0a6ebd 0%, #005288 100%);
            color: white;
        }
        
        .btn i {
            font-size: 16px;
        }
        
        .content {
            padding: 30px 40px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            color: #2c3e50;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 3px solid #FF8C00;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-title i {
            color: #FF8C00;
            font-size: 20px;
        }
        
        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #0a6ebd;
            padding: 15px 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        
        .info-box h3 {
            color: #0a6ebd;
            margin-bottom: 12px;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .info-box p {
            margin: 6px 0;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .info-box strong {
            color: #2c3e50;
            font-weight: 600;
            min-width: 100px;
            display: inline-block;
        }
        
        .indicators-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 25px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .indicators-table thead {
            background: #f8f9fa;
        }
        
        .indicators-table th {
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
        }
        
        .indicators-table th:first-child {
            padding-left: 20px;
        }
        
        .indicators-table th:last-child {
            padding-right: 20px;
        }
        
        .indicators-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #f1f3f5;
            font-size: 14px;
            vertical-align: middle;
        }
        
        .indicators-table td:first-child {
            padding-left: 20px;
            font-weight: 500;
            color: #2c3e50;
        }
        
        .indicators-table td:last-child {
            padding-right: 20px;
        }
        
        .indicators-table tbody tr:hover {
            background: #f8f9fa;
        }
        
        .indicators-table tbody tr:last-child td {
            border-bottom: none;
        }
        
        .indicator-value {
            font-weight: 700;
            font-size: 16px;
        }
        
        .indicator-value.blue {
            color: #0a6ebd;
        }
        
        .indicator-value.green {
            color: #10b981;
        }
        
        .indicator-value.orange {
            color: #FF8C00;
        }
        
        .indicator-value.red {
            color: #ef4444;
        }
        
        .indicator-value.gray {
            color: #6c757d;
        }
        
        .progress-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .progress-bar-wrapper {
            flex: 1;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        }
        
        .progress-bar {
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
            min-width: 2px;
        }
        
        .progress-bar.blue {
            background: linear-gradient(90deg, #0a6ebd 0%, #005288 100%);
        }
        
        .progress-bar.green {
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        }
        
        .progress-bar.orange {
            background: linear-gradient(90deg, #FF8C00 0%, #ff7700 100%);
        }
        
        .progress-bar.red {
            background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }
        
        .progress-label {
            font-size: 12px;
            font-weight: 600;
            min-width: 45px;
            text-align: right;
        }
        
        .progress-label.blue {
            color: #0a6ebd;
        }
        
        .progress-label.green {
            color: #10b981;
        }
        
        .progress-label.orange {
            color: #FF8C00;
        }
        
        .progress-label.red {
            color: #ef4444;
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
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
        
        .table-section {
            margin-top: 25px;
        }
        
        .table-section table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .table-section thead {
            background: linear-gradient(135deg, #0a6ebd 0%, #005288 100%);
            color: white;
        }
        
        .table-section th {
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .table-section td {
            padding: 10px 15px;
            border-bottom: 1px solid #f1f3f5;
            font-size: 14px;
        }
        
        .table-section tbody tr:hover {
            background: #f8f9fa;
        }
        
        .table-section tbody tr:last-child td {
            border-bottom: none;
        }
        
        .footer {
            margin-top: 40px;
            padding: 20px 40px;
            background: #f8f9fa;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            line-height: 1.6;
        }
        
        .footer p {
            margin: 4px 0;
        }
        
        .icon-header {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="action-buttons no-print">
        <a href="generar_reporte_pdf.php?proyecto_id=<?php echo $proyecto['proyecto_id']; ?>&pdf=1&_t=<?php echo time(); ?>&_r=<?php echo rand(1000, 9999); ?>" 
           class="btn btn-pdf" 
           target="_blank">
            <i class="fas fa-file-pdf"></i> Generar PDF
        </a>
        <button class="btn btn-print" onclick="window.print()">
            <i class="fas fa-print"></i> Imprimir
        </button>
    </div>

    <div class="container">
        <!-- Portada -->
        <div class="header">
            <?php
            // Ruta del logo - usar ruta relativa desde la raíz del proyecto
            $logo_url = $base_path . '/public/img/logo-codelco.png';
            
            // Verificar si existe físicamente
            $logo_path_absolute = ($_SERVER['DOCUMENT_ROOT'] ?? '') . $logo_url;
            $logo_exists = file_exists($logo_path_absolute);
            
            // Si no existe, intentar rutas alternativas
            if (!$logo_exists) {
                $alt_paths = [
                    __DIR__ . '/../../public/img/logo-codelco.png',
                    dirname(dirname(__DIR__)) . '/public/img/logo-codelco.png',
                ];
                foreach ($alt_paths as $alt_path) {
                    if (file_exists($alt_path)) {
                        $doc_root = $_SERVER['DOCUMENT_ROOT'] ?? '';
                        $logo_url = str_replace($doc_root, '', $alt_path);
                        $logo_url = str_replace('\\', '/', $logo_url);
                        if ($logo_url[0] !== '/') {
                            $logo_url = '/' . $logo_url;
                        }
                        $logo_exists = true;
                        break;
                    }
                }
            }
            ?>
            <?php if ($logo_exists): ?>
                <img src="<?php echo htmlspecialchars($logo_url); ?>" alt="CODELCO" style="max-height: 70px; margin-bottom: 15px; filter: brightness(0) invert(1);">
            <?php else: ?>
                <div class="logo">CODELCO</div>
            <?php endif; ?>
            <div class="subtitle">Sistema de Control de Riesgos Críticos</div>
            <div class="project-name"><?php echo htmlspecialchars($proyecto['nombre']); ?></div>
            <div class="meta-info">
                ID: <?php echo $proyecto['proyecto_id']; ?> | Fecha: <?php echo date('d/m/Y H:i:s'); ?>
            </div>
        </div>

        <div class="content">
            <!-- Resumen Ejecutivo -->
            <div class="section">
                <div class="section-title">
                    <i class="fas fa-chart-line"></i>
                    RESUMEN EJECUTIVO
                </div>
                
                <div class="info-box">
                    <h3>
                        <i class="fas fa-info-circle"></i>
                        Información del Proyecto
                    </h3>
                    <p>
                        <strong>Nombre:</strong> 
                        <?php echo htmlspecialchars($proyecto['nombre']); ?> | 
                        <strong>ID:</strong> 
                        <?php echo $proyecto['proyecto_id']; ?>
                    </p>
                    <?php if (isset($proyecto['descripcion']) && $proyecto['descripcion']): ?>
                    <p>
                        <strong>Descripción:</strong> 
                        <?php echo htmlspecialchars($proyecto['descripcion']); ?>
                    </p>
                    <?php endif; ?>
                </div>
                
                <table class="indicators-table">
                    <thead>
                        <tr>
                            <th>
                                <span class="icon-header">
                                    <i class="fas fa-chart-pie"></i>
                                    INDICADOR
                                </span>
                            </th>
                            <th>
                                <span class="icon-header">
                                    <i class="fas fa-list"></i>
                                    VALOR
                                </span>
                            </th>
                            <th>
                                <span class="icon-header">
                                    <i class="fas fa-percent"></i>
                                    % AVANCE
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $avance_general = $promedio_general;
                        $avance_class = $avance_general >= 80 ? 'green' : ($avance_general >= 50 ? 'orange' : 'red');
                        ?>
                        <tr>
                            <td><strong>Avance General</strong></td>
                            <td>
                                <span class="indicator-value blue"><?php echo number_format($avance_general, 2); ?>%</span>
                            </td>
                            <td>
                                <div class="progress-container">
                                    <div class="progress-bar-wrapper">
                                        <div class="progress-bar <?php echo $avance_class; ?>" style="width: <?php echo min($avance_general, 100); ?>%"></div>
                                    </div>
                                    <span class="progress-label <?php echo $avance_class; ?>"><?php echo number_format($avance_general, 1); ?>%</span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Total Carpetas</strong></td>
                            <td>
                                <span class="indicator-value blue"><?php echo $kpis['total_carpetas'] ?? 0; ?></span>
                            </td>
                            <td>
                                <span style="color: #9ca3af;">-</span>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Total Controles</strong></td>
                            <td>
                                <span class="indicator-value blue"><?php echo $kpis['total_controles'] ?? 0; ?></span>
                            </td>
                            <td>
                                <span style="color: #9ca3af;">-</span>
                            </td>
                        </tr>
                        <?php
                        $controles_validados = $kpis['controles_validados'] ?? 0;
                        $total_controles = $kpis['total_controles'] ?? 0;
                        $porcentaje_validados = $total_controles > 0 ? ($controles_validados / $total_controles) * 100 : 0;
                        ?>
                        <tr>
                            <td><strong>Controles Validados</strong></td>
                            <td>
                                <span class="indicator-value green"><?php echo $controles_validados; ?></span>
                            </td>
                            <td>
                                <div class="progress-container">
                                    <div class="progress-bar-wrapper">
                                        <div class="progress-bar green" style="width: <?php echo min($porcentaje_validados, 100); ?>%"></div>
                                    </div>
                                    <span class="progress-label green"><?php echo number_format($porcentaje_validados, 1); ?>%</span>
                                </div>
                            </td>
                        </tr>
                        <?php
                        $controles_obs = $kpis['controles_observaciones'] ?? 0;
                        $porcentaje_obs = $total_controles > 0 ? ($controles_obs / $total_controles) * 100 : 0;
                        ?>
                        <tr>
                            <td><strong>Controles con Observaciones</strong></td>
                            <td>
                                <span class="indicator-value orange"><?php echo $controles_obs; ?></span>
                            </td>
                            <td>
                                <div class="progress-container">
                                    <div class="progress-bar-wrapper">
                                        <div class="progress-bar orange" style="width: <?php echo min($porcentaje_obs, 100); ?>%"></div>
                                    </div>
                                    <span class="progress-label orange"><?php echo number_format($porcentaje_obs, 1); ?>%</span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Usuarios Activos</strong></td>
                            <td>
                                <span class="indicator-value gray"><?php echo $kpis['usuarios_activos'] ?? 0; ?></span>
                            </td>
                            <td>
                                <span style="color: #9ca3af;">-</span>
                            </td>
                        </tr>
                        <?php
                        $avance_empresas = floatval($kpis['avance_global_empresas'] ?? 0);
                        $avance_emp_class = $avance_empresas >= 80 ? 'green' : ($avance_empresas >= 50 ? 'orange' : 'red');
                        ?>
                        <tr>
                            <td><strong>Avance Global por Empresa</strong></td>
                            <td>
                                <span class="indicator-value blue"><?php echo number_format($avance_empresas, 2); ?>%</span>
                            </td>
                            <td>
                                <div class="progress-container">
                                    <div class="progress-bar-wrapper">
                                        <div class="progress-bar <?php echo $avance_emp_class; ?>" style="width: <?php echo min($avance_empresas, 100); ?>%"></div>
                                    </div>
                                    <span class="progress-label <?php echo $avance_emp_class; ?>"><?php echo number_format($avance_empresas, 1); ?>%</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Avance por Empresa -->
            <?php if (!empty($kpis['avance_por_empresa']) && is_array($kpis['avance_por_empresa'])): ?>
            <div class="section table-section">
                <div class="section-title">
                    <i class="fas fa-building"></i>
                    AVANCE POR EMPRESA
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th>Avance</th>
                            <th>Controles</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($kpis['avance_por_empresa'] as $empresa): 
                            $avance = floatval($empresa['avance_promedio'] ?? 0);
                            $badge_class = $avance >= 80 ? 'badge-success' : ($avance >= 50 ? 'badge-warning' : 'badge-danger');
                        ?>
                        <tr>
                            <td><strong><?php echo htmlspecialchars($empresa['empresa'] ?? 'Sin nombre'); ?></strong></td>
                            <td>
                                <span class="badge <?php echo $badge_class; ?>">
                                    <?php echo number_format($avance, 1); ?>%
                                </span>
                            </td>
                            <td><?php echo $empresa['total_controles'] ?? 0; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>

            <!-- Resumen por Riesgo Crítico -->
            <?php if (!empty($carpetas_data['carpetas']) && is_array($carpetas_data['carpetas'])): ?>
            <div class="section table-section">
                <div class="section-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    RESUMEN POR RIESGO CRÍTICO
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Riesgo Crítico</th>
                            <th>Avance</th>
                            <th>Empresas</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($carpetas_data['carpetas'] as $carpeta_nivel1): 
                            $promedio_rc = floatval($carpeta_nivel1['promedio_ponderacion'] ?? 0);
                            $badge_class_rc = $promedio_rc >= 80 ? 'badge-success' : ($promedio_rc >= 50 ? 'badge-warning' : 'badge-danger');
                            $num_empresas = !empty($carpeta_nivel1['subcarpetas']) ? count($carpeta_nivel1['subcarpetas']) : 0;
                            $estado_text = $promedio_rc >= 80 ? 'Completo' : ($promedio_rc >= 50 ? 'En Progreso' : 'Pendiente');
                        ?>
                        <tr>
                            <td><strong><?php echo htmlspecialchars($carpeta_nivel1['nombre'] ?? 'Sin nombre'); ?></strong></td>
                            <td>
                                <span class="badge <?php echo $badge_class_rc; ?>">
                                    <?php echo number_format($promedio_rc, 1); ?>%
                                </span>
                            </td>
                            <td><?php echo $num_empresas; ?></td>
                            <td><?php echo $estado_text; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>

            <!-- Pie de página -->
            <div class="footer">
                <p>
                    <i class="fas fa-info-circle" style="color: #0a6ebd; margin-right: 6px;"></i>
                    Sistema de Control de Riesgos Críticos - Codelco
                </p>
                <p>
                    Reporte generado automáticamente el <?php echo date('d/m/Y H:i:s'); ?>
                </p>
            </div>
        </div>
    </div>

    <script>
        if (window.location.search.includes('autoprint=1')) {
            window.onload = function() {
                window.print();
            };
        }
    </script>
</body>
</html>
