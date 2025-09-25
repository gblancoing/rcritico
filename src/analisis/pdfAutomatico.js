// Función para generar PDF automático con análisis de IEAC y ECD
export const handleGenerarPDFAutomatico = async (datosIEAC, datosECD, proyectoId, fechaCorte, valorBAC, plazoControlECD, datosTabla, datosCostoGanado, jsPDF) => {
    try {
      // Verificar que tenemos datos necesarios
      if (!datosIEAC || datosIEAC.length === 0 || !datosECD || datosECD.metodologiaA === 0) {
        alert('No hay datos suficientes para generar el reporte PDF. Asegúrese de que los datos IEAC y ECD estén cargados.');
        return;
      }
  
      console.log('Generando PDF Automático con análisis IEAC y ECD');
      
      // Generar PDF automático
      const doc = new jsPDF();
      
      // Configuración de colores profesionales
      const colors = {
        primary: [25, 50, 100],     // Azul oscuro profesional
        success: [56, 161, 105],    // Verde éxito
        warning: [237, 137, 54],    // Naranja advertencia
        danger: [220, 53, 69],      // Rojo peligro
        dark: [45, 55, 72],         // Gris oscuro
        light: [247, 250, 252],     // Gris claro
        gold: [255, 193, 7]         // Dorado para destacados
      };
  
      // Función para obtener la fecha actual formateada
      const obtenerFechaActual = () => {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      };
  
      // ===== PÁGINA 1: MARCO TEÓRICO Y METODOLOGÍA =====
      
      // Fondo con patrón sutil
      doc.setFillColor(240, 245, 250);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Header profesional
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE AUTOMÁTICO EVM', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('CODELCO - Análisis de Líneas Bases', 105, 32, { align: 'center' });
     
      let y = 60;
  
      // MARCO TEÓRICO
      doc.setTextColor(...colors.dark);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('MARCO TEÓRICO Y METODOLOGÍA', 20, y);
      y += 15;
  
      // Configuración de Distribución Beta
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('1. CONFIGURACIÓN DE DISTRIBUCIÓN BETA', 20, y);
      y += 8;
  
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
      
      doc.text('La Distribución Beta es fundamental en la gestión de proyectos porque:', 20, y);
      y += 4;
      doc.text('• Permite modelar la incertidumbre en estimaciones de tiempo y costo', 25, y);
      y += 4;
      doc.text('• Proporciona un rango probabilístico (optimista, más probable, pesimista)', 25, y);
      y += 4;
      doc.text('• Facilita la toma de decisiones basada en análisis de riesgo', 25, y);
      y += 4;
      doc.text('• Mejora la precisión de las proyecciones de finalización', 25, y);
      y += 8;
  
      // Importancia de IEAC
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('2. IMPORTANCIA DE IEAC (ESTIMACIÓN AL COMPLETAR)', 20, y);
      y += 8;
  
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
      
      doc.text('IEAC es crucial para la gestión de proyectos porque:', 20, y);
      y += 4;
      doc.text('• Predice el costo total del proyecto basado en el rendimiento actual', 25, y);
      y += 4;
      doc.text('• Permite identificar desviaciones de costo antes de que sean críticas', 25, y);
      y += 4;
      doc.text('• Facilita la toma de decisiones correctivas oportunas', 25, y);
      y += 4;
      doc.text('• Proporciona múltiples metodologías para diferentes escenarios', 25, y);
      y += 4;
      doc.text('• Es esencial para el control presupuestario y la planificación financiera', 25, y);
      y += 8;
  
      // Importancia de ECD
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('3. IMPORTANCIA DE ECD (ESTIMACIÓN DE COMPLETAR)', 20, y);
      y += 8;
  
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
      
      doc.text('ECD es fundamental para la gestión de cronogramas porque:', 20, y);
      y += 4;
      doc.text('• Proyecta cuándo se completará el proyecto basado en tendencias actuales', 25, y);
      y += 4;
      doc.text('• Proporciona un rango de fechas de finalización (optimista a pesimista)', 25, y);
      y += 4;
      doc.text('• Permite identificar riesgos de retraso antes de que ocurran', 25, y);
      y += 4;
      doc.text('• Facilita la planificación de recursos y la gestión de stakeholders', 25, y);
      y += 4;
      doc.text('• Es clave para la gestión proactiva del cronograma', 25, y);
      y += 8;
  
      // Importancia del Costo Ganado
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('4. IMPORTANCIA DEL COSTO GANADO (EARNED VALUE)', 20, y);
      y += 8;
  
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
      
      doc.text('El Costo Ganado es esencial porque:', 20, y);
      y += 4;
      doc.text('• Mide el valor real del trabajo completado en términos monetarios', 25, y);
      y += 4;
      doc.text('• Permite comparar el progreso real vs. el progreso planificado', 25, y);
      y += 4;
      doc.text('• Facilita el cálculo de índices de rendimiento (CPI, SPI)', 25, y);
      y += 4;
      doc.text('• Proporciona una base objetiva para evaluar la eficiencia del proyecto', 25, y);
      y += 4;
      doc.text('• Es fundamental para el análisis de valor ganado (EVM)', 25, y);
      y += 8;
  
      // Análisis de Curva S
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('5. ANÁLISIS DE CURVA S', 20, y);
      y += 8;
  
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
      
      doc.text('La Curva S representa:', 20, y);
      y += 4;
      doc.text('• La evolución acumulada del progreso del proyecto en el tiempo', 25, y);
      y += 4;
      doc.text('• La comparación entre avance planificado vs. avance real', 25, y);
      y += 4;
      doc.text('• Las tendencias de rendimiento y eficiencia del proyecto', 25, y);
      y += 4;
      doc.text('• Los puntos de inflexión y cambios en la velocidad de ejecución', 25, y);
      y += 4;
      doc.text('• La base para proyecciones futuras de IEAC y ECD', 25, y);
      y += 8;
  
      // ===== PÁGINA 2: RESUMEN EJECUTIVO =====
      doc.addPage();
  
      // Header segunda página
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN EJECUTIVO DEL PROYECTO', 105, 20, { align: 'center' });
  
      y = 50;
  
      // Información básica del proyecto
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.dark);
      doc.text('Información del Proyecto:', 20, y);
      y += 6;
  
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Proyecto ID: ${proyectoId}`, 25, y);
      y += 4;
      doc.text(`• Fecha de corte: ${fechaCorte || 'No definida'}`, 25, y);
      y += 4;
      doc.text(`• BAC Total: $${(valorBAC/1000000).toFixed(2)}M`, 25, y);
      y += 4;
      doc.text(`• Plazo Control ECD: ${plazoControlECD} meses`, 25, y);
      y += 12;
  
      // Análisis IEAC
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('ANÁLISIS IEAC (ESTIMACIÓN AL COMPLETAR)', 20, y);
      y += 8;
  
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
      
      // Calcular estadísticas IEAC
      const valoresIEAC = datosIEAC.map(item => item.valor).filter(v => v > 0);
      const promedioIEAC = valoresIEAC.length > 0 ? valoresIEAC.reduce((sum, val) => sum + val, 0) / valoresIEAC.length : 0;
      const maximoIEAC = valoresIEAC.length > 0 ? Math.max(...valoresIEAC) : 0;
      const minimoIEAC = valoresIEAC.length > 0 ? Math.min(...valoresIEAC) : 0;
      const rangoIEAC = maximoIEAC - minimoIEAC;
  
      doc.text('1. ESTADÍSTICAS IEAC:', 20, y);
      y += 4;
      doc.text(`   • Promedio IEAC: $${(promedioIEAC/1000000).toFixed(2)}M`, 25, y);
      y += 4;
      doc.text(`   • IEAC Mínimo: $${(minimoIEAC/1000000).toFixed(2)}M`, 25, y);
      y += 4;
      doc.text(`   • IEAC Máximo: $${(maximoIEAC/1000000).toFixed(2)}M`, 25, y);
      y += 4;
      doc.text(`   • Rango de Variación: $${(rangoIEAC/1000000).toFixed(2)}M`, 25, y);
      y += 8;
  
      // Análisis de variación IEAC
      const variacionIEAC = promedioIEAC - valorBAC;
      const porcentajeVariacionIEAC = (variacionIEAC / valorBAC) * 100;
  
      doc.text('2. ANÁLISIS DE VARIACIÓN:', 20, y);
      y += 4;
      doc.text(`   • Variación vs BAC: $${(variacionIEAC/1000000).toFixed(2)}M`, 25, y);
      y += 4;
      doc.text(`   • Porcentaje de Variación: ${porcentajeVariacionIEAC.toFixed(1)}%`, 25, y);
      y += 4;
      
      // Interpretación
      if (porcentajeVariacionIEAC > 10) {
        doc.setTextColor(...colors.danger);
        doc.text(`   • Estado: SOBRECOSTO CRÍTICO (>10%)`, 25, y);
      } else if (porcentajeVariacionIEAC > 5) {
        doc.setTextColor(...colors.warning);
        doc.text(`   • Estado: SOBRECOSTO MODERADO (5-10%)`, 25, y);
      } else if (porcentajeVariacionIEAC < -5) {
        doc.setTextColor(...colors.success);
        doc.text(`   • Estado: AHORRO SIGNIFICATIVO (<-5%)`, 25, y);
      } else {
        doc.setTextColor(...colors.success);
        doc.text(`   • Estado: DENTRO DE PRESUPUESTO (±5%)`, 25, y);
      }
      y += 8;
  
      // Análisis ECD
      doc.setTextColor(...colors.dark);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('ANÁLISIS ECD (ESTIMACIÓN DE COMPLETAR)', 20, y);
      y += 8;
  
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
  
      // Calcular estadísticas ECD
      const valoresECD = [
        datosECD.metodologiaA || 0,
        datosECD.metodologiaB || 0,
        datosECD.metodologiaC || 0,
        datosECD.metodologiaD || 0,
        datosECD.metodologiaE || 0,
        datosECD.metodologiaF || 0,
        datosECD.metodologiaG || 0,
        datosECD.metodologiaH || 0
      ].filter(v => v > 0);
  
      const promedioECD = valoresECD.length > 0 ? valoresECD.reduce((sum, val) => sum + val, 0) / valoresECD.length : 0;
      const maximoECD = valoresECD.length > 0 ? Math.max(...valoresECD) : 0;
      const minimoECD = valoresECD.length > 0 ? Math.min(...valoresECD) : 0;
      const rangoECD = maximoECD - minimoECD;
  
      const duracionPlanificadaAPI = datosECD.duracionPlanificada || 74;
  
      doc.text('1. PROYECCIÓN DE FINALIZACIÓN DEL PROYECTO:', 20, y);
      y += 4;
      doc.text(`   • Meses Mínimo (Optimista): ${minimoECD.toFixed(1)} meses`, 25, y);
      y += 4;
      doc.text(`   • Meses Máximo (Pesimista): ${maximoECD.toFixed(1)} meses`, 25, y);
      y += 4;
      doc.text(`   • Promedio (Más Probable): ${promedioECD.toFixed(1)} meses`, 25, y);
      y += 4;
      doc.text(`   • Rango de Incertidumbre: ${rangoECD.toFixed(1)} meses`, 25, y);
      y += 8;
  
      doc.text('2. CONTEXTO DE LA PROYECCIÓN:', 20, y);
      y += 4;
      doc.text(`   • Plazo Control (Mes Actual): ${plazoControlECD} meses`, 25, y);
      y += 4;
      doc.text(`   • Duración Planificada API: ${duracionPlanificadaAPI} meses`, 25, y);
      y += 4;
      doc.text(`   • Proyección vs Planificado: ${((promedioECD - duracionPlanificadaAPI)/duracionPlanificadaAPI * 100).toFixed(1)}%`, 25, y);
      y += 8;
  
      // Análisis de la proyección vs planificado
      const variacionVsPlanificado = promedioECD - duracionPlanificadaAPI;
      const porcentajeVariacionVsPlanificado = (variacionVsPlanificado / duracionPlanificadaAPI) * 100;
  
      doc.text('3. ANÁLISIS DE LA PROYECCIÓN:', 20, y);
      y += 4;
      
      if (porcentajeVariacionVsPlanificado > 10) {
        doc.setTextColor(...colors.warning);
        doc.text(`   • Estado: PROYECCIÓN INDICA POSIBLE EXTENSIÓN (>10%)`, 25, y);
        y += 4;
        doc.text(`   • Significado: Las tendencias sugieren que el proyecto podría tomar más tiempo`, 25, y);
        y += 4;
        doc.text(`   • Recomendación: Monitorear tendencias y evaluar optimizaciones`, 25, y);
      } else if (porcentajeVariacionVsPlanificado > 5) {
        doc.setTextColor(...colors.warning);
        doc.text(`   • Estado: PROYECCIÓN INDICA LIGERA EXTENSIÓN (5-10%)`, 25, y);
        y += 4;
        doc.text(`   • Significado: Proyección sugiere ligera extensión del cronograma`, 25, y);
        y += 4;
        doc.text(`   • Recomendación: Continuar monitoreo y optimizar procesos`, 25, y);
      } else if (porcentajeVariacionVsPlanificado < -10) {
        doc.setTextColor(...colors.success);
        doc.text(`   • Estado: PROYECCIÓN INDICA FINALIZACIÓN ANTICIPADA (<-10%)`, 25, y);
        y += 4;
        doc.text(`   • Significado: Las tendencias sugieren finalización antes de lo planificado`, 25, y);
        y += 4;
        doc.text(`   • Recomendación: Mantener eficiencia y considerar oportunidades adicionales`, 25, y);
      } else {
        doc.setTextColor(...colors.success);
        doc.text(`   • Estado: PROYECCIÓN ALINEADA CON PLANIFICACIÓN (±10%)`, 25, y);
        y += 4;
        doc.text(`   • Significado: Proyección consistente con la duración planificada`, 25, y);
        y += 4;
        doc.text(`   • Recomendación: Continuar con la gestión actual del proyecto`, 25, y);
      }
      y += 12;
  
      // Recomendaciones
      doc.setTextColor(...colors.dark);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('RECOMENDACIONES EJECUTIVAS', 20, y);
      y += 8;
  
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
  
      // Recomendaciones basadas en análisis
      doc.text('1. GESTIÓN DE COSTOS:', 20, y);
      y += 4;
      if (porcentajeVariacionIEAC > 10) {
        doc.text('   • Implementar controles de costo más estrictos', 25, y);
        y += 4;
        doc.text('   • Revisar contratos y negociar mejores precios', 25, y);
        y += 4;
        doc.text('   • Considerar reducción de alcance si es necesario', 25, y);
      } else if (porcentajeVariacionIEAC > 5) {
        doc.text('   • Monitorear tendencias de costo semanalmente', 25, y);
        y += 4;
        doc.text('   • Implementar medidas preventivas de control', 25, y);
      } else {
        doc.text('   • Mantener controles actuales de gestión de costo', 25, y);
        y += 4;
        doc.text('   • Continuar con el buen desempeño financiero', 25, y);
      }
      y += 8;
  
      doc.text('2. GESTIÓN DE CRONOGRAMA:', 20, y);
      y += 4;
      if (porcentajeVariacionVsPlanificado > 10) {
        doc.text('   • Monitorear tendencias de avance semanalmente', 25, y);
        y += 4;
        doc.text('   • Evaluar oportunidades de optimización de procesos', 25, y);
        y += 4;
        doc.text('   • Considerar ajustes en recursos si la tendencia persiste', 25, y);
      } else if (porcentajeVariacionVsPlanificado > 5) {
        doc.text('   • Continuar monitoreo regular del progreso', 25, y);
        y += 4;
        doc.text('   • Identificar áreas de mejora en eficiencia', 25, y);
      } else {
        doc.text('   • Mantener ritmo actual de ejecución', 25, y);
        y += 4;
        doc.text('   • Continuar con el buen desempeño proyectado', 25, y);
      }
      y += 8;
  
      // ===== PÁGINA 3: ANÁLISIS DETALLADO DE LÍNEAS BASES =====
      // SIEMPRE iniciar en una nueva página
      if (datosTabla && datosTabla.length > 0) {
        doc.addPage();
  
        // Header tercera página
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, 210, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS DETALLADO DE LÍNEAS BASES', 105, 20, { align: 'center' });
  
        y = 50;
  
        doc.setTextColor(...colors.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
  
        // Análisis de avance físico real vs planificado
        const datosConAvance = datosTabla.filter(row => row.api_acum_real !== null && row.api_acum !== null);
        if (datosConAvance.length > 0) {
          const ultimoPeriodo = datosConAvance[datosConAvance.length - 1];
          const avanceRealActual = ultimoPeriodo.api_acum_real || 0;
          const avancePlanificadoActual = ultimoPeriodo.api_acum || 0;
          const diferenciaAvance = avanceRealActual - avancePlanificadoActual;
  
          doc.text('1. ANÁLISIS DE AVANCE FÍSICO:', 20, y);
          y += 4;
          doc.text(`   • Avance Físico Real Actual: ${(avanceRealActual * 100).toFixed(1)}%`, 25, y);
          y += 4;
          doc.text(`   • Avance Físico Planificado Actual: ${(avancePlanificadoActual * 100).toFixed(1)}%`, 25, y);
          y += 4;
          doc.text(`   • Diferencia de Avance: ${(diferenciaAvance * 100).toFixed(1)}%`, 25, y);
          y += 4;
          
          if (diferenciaAvance > 0.05) {
            doc.setTextColor(...colors.success);
            doc.text(`   • Estado: ADELANTADO SIGNIFICATIVAMENTE (>5%)`, 25, y);
          } else if (diferenciaAvance > 0.02) {
            doc.setTextColor(...colors.success);
            doc.text(`   • Estado: ADELANTADO MODERADAMENTE (2-5%)`, 25, y);
          } else if (diferenciaAvance < -0.05) {
            doc.setTextColor(...colors.danger);
            doc.text(`   • Estado: RETRASADO SIGNIFICATIVAMENTE (<-5%)`, 25, y);
          } else if (diferenciaAvance < -0.02) {
            doc.setTextColor(...colors.warning);
            doc.text(`   • Estado: RETRASADO MODERADAMENTE (-2% a -5%)`, 25, y);
          } else {
            doc.setTextColor(...colors.success);
            doc.text(`   • Estado: DENTRO DE CRONOGRAMA (±2%)`, 25, y);
          }
          y += 8;
        }
  
        // Análisis de IEAC promedio
        const datosConIEAC = datosTabla.filter(row => row.ieac_avg !== null && row.ieac_avg > 0);
        if (datosConIEAC.length > 0) {
          const ultimoIEAC = datosConIEAC[datosConIEAC.length - 1].ieac_avg;
          const variacionIEACvsBAC = ultimoIEAC - valorBAC;
          const porcentajeVariacionIEACvsBAC = (variacionIEACvsBAC / valorBAC) * 100;
  
          doc.setTextColor(...colors.dark);
          doc.text('2. ANÁLISIS IEAC PROMEDIO:', 20, y);
          y += 4;
          doc.text(`   • IEAC Promedio Actual: $${(ultimoIEAC/1000000).toFixed(2)}M`, 25, y);
          y += 4;
          doc.text(`   • BAC Original: $${(valorBAC/1000000).toFixed(2)}M`, 25, y);
          y += 4;
          doc.text(`   • Variación IEAC vs BAC: $${(variacionIEACvsBAC/1000000).toFixed(2)}M`, 25, y);
          y += 4;
          doc.text(`   • Porcentaje de Variación: ${porcentajeVariacionIEACvsBAC.toFixed(1)}%`, 25, y);
          y += 4;
          
          if (porcentajeVariacionIEACvsBAC > 10) {
            doc.setTextColor(...colors.danger);
            doc.text(`   • Estado: SOBRECOSTO CRÍTICO EN CURSO (>10%)`, 25, y);
          } else if (porcentajeVariacionIEACvsBAC > 5) {
            doc.setTextColor(...colors.warning);
            doc.text(`   • Estado: SOBRECOSTO MODERADO EN CURSO (5-10%)`, 25, y);
          } else if (porcentajeVariacionIEACvsBAC < -5) {
            doc.setTextColor(...colors.success);
            doc.text(`   • Estado: AHORRO SIGNIFICATIVO EN CURSO (<-5%)`, 25, y);
          } else {
            doc.setTextColor(...colors.success);
            doc.text(`   • Estado: DENTRO DE PRESUPUESTO EN CURSO (±5%)`, 25, y);
          }
          y += 8;
        }
  
        // Análisis de Costo Ganado
        if (datosCostoGanado && Object.keys(datosCostoGanado).length > 0) {
          const valoresCostoGanado = Object.values(datosCostoGanado).filter(v => v > 0);
          if (valoresCostoGanado.length > 0) {
            const ultimoCostoGanado = valoresCostoGanado[valoresCostoGanado.length - 1];
            const promedioCostoGanado = valoresCostoGanado.reduce((sum, val) => sum + val, 0) / valoresCostoGanado.length;
            const eficienciaCostoGanado = (ultimoCostoGanado / valorBAC) * 100;
  
            doc.setTextColor(...colors.dark);
            doc.text('3. ANÁLISIS COSTO GANADO:', 20, y);
            y += 4;
            doc.text(`   • Costo Ganado Actual: $${(ultimoCostoGanado/1000000).toFixed(2)}M`, 25, y);
            y += 4;
            doc.text(`   • Promedio Costo Ganado: $${(promedioCostoGanado/1000000).toFixed(2)}M`, 25, y);
            y += 4;
            doc.text(`   • Eficiencia Costo Ganado: ${eficienciaCostoGanado.toFixed(1)}%`, 25, y);
            y += 4;
            
            if (eficienciaCostoGanado > 80) {
              doc.setTextColor(...colors.success);
              doc.text(`   • Estado: ALTA EFICIENCIA DE VALOR GANADO (>80%)`, 25, y);
            } else if (eficienciaCostoGanado > 60) {
              doc.setTextColor(...colors.success);
              doc.text(`   • Estado: BUENA EFICIENCIA DE VALOR GANADO (60-80%)`, 25, y);
            } else if (eficienciaCostoGanado > 40) {
              doc.setTextColor(...colors.warning);
              doc.text(`   • Estado: EFICIENCIA MODERADA DE VALOR GANADO (40-60%)`, 25, y);
            } else {
              doc.setTextColor(...colors.danger);
              doc.text(`   • Estado: BAJA EFICIENCIA DE VALOR GANADO (<40%)`, 25, y);
            }
            y += 8;
          }
        }
  
        // CONCLUSIÓN FINAL DEL GRÁFICO CURVA S
        doc.setTextColor(...colors.dark);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('CONCLUSIÓN FINAL DEL GRÁFICO CURVA S:', 20, y);
        y += 8;
  
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.dark);
        
        // Generar conclusión basada en los análisis
        let conclusionCurvaS = [];
        
        if (datosConAvance.length > 0) {
          const ultimoPeriodo = datosConAvance[datosConAvance.length - 1];
          const avanceRealActual = ultimoPeriodo.api_acum_real || 0;
          const avancePlanificadoActual = ultimoPeriodo.api_acum || 0;
          const diferenciaAvance = avanceRealActual - avancePlanificadoActual;
          
          if (diferenciaAvance > 0.05) {
            conclusionCurvaS.push('• La curva S muestra un proyecto significativamente adelantado en avance físico');
            conclusionCurvaS.push('• El rendimiento supera las expectativas planificadas');
          } else if (diferenciaAvance > 0.02) {
            conclusionCurvaS.push('• La curva S indica un proyecto moderadamente adelantado');
            conclusionCurvaS.push('• El progreso está por encima del cronograma planificado');
          } else if (diferenciaAvance < -0.05) {
            conclusionCurvaS.push('• La curva S revela retrasos significativos en el avance');
            conclusionCurvaS.push('• Se requiere atención inmediata para recuperar el cronograma');
          } else if (diferenciaAvance < -0.02) {
            conclusionCurvaS.push('• La curva S muestra retrasos moderados');
            conclusionCurvaS.push('• Se recomienda monitoreo intensivo para evitar mayores desviaciones');
          } else {
            conclusionCurvaS.push('• La curva S indica un proyecto dentro del cronograma planificado');
            conclusionCurvaS.push('• El rendimiento está alineado con las expectativas');
          }
        }
  
        if (datosConIEAC.length > 0) {
          const ultimoIEAC = datosConIEAC[datosConIEAC.length - 1].ieac_avg;
          const variacionIEACvsBAC = ultimoIEAC - valorBAC;
          const porcentajeVariacionIEACvsBAC = (variacionIEACvsBAC / valorBAC) * 100;
          
          if (porcentajeVariacionIEACvsBAC > 10) {
            conclusionCurvaS.push('• La proyección de costos indica sobrecosto crítico en curso');
            conclusionCurvaS.push('• Se requiere intervención inmediata para controlar los costos');
          } else if (porcentajeVariacionIEACvsBAC > 5) {
            conclusionCurvaS.push('• La proyección muestra sobrecosto moderado que requiere monitoreo');
            conclusionCurvaS.push('• Se recomienda implementar medidas preventivas');
          } else if (porcentajeVariacionIEACvsBAC < -5) {
            conclusionCurvaS.push('• La proyección indica ahorro significativo en el proyecto');
            conclusionCurvaS.push('• El proyecto está generando valor adicional');
          } else {
            conclusionCurvaS.push('• La proyección de costos está dentro del presupuesto planificado');
            conclusionCurvaS.push('• El control financiero es efectivo');
          }
        }
  
        if (datosCostoGanado && Object.keys(datosCostoGanado).length > 0) {
          const valoresCostoGanado = Object.values(datosCostoGanado).filter(v => v > 0);
          if (valoresCostoGanado.length > 0) {
            const ultimoCostoGanado = valoresCostoGanado[valoresCostoGanado.length - 1];
            const eficienciaCostoGanado = (ultimoCostoGanado / valorBAC) * 100;
            
            if (eficienciaCostoGanado > 80) {
              conclusionCurvaS.push('• El valor ganado demuestra alta eficiencia en la ejecución');
              conclusionCurvaS.push('• El proyecto está generando valor superior al esperado');
            } else if (eficienciaCostoGanado > 60) {
              conclusionCurvaS.push('• El valor ganado muestra buena eficiencia en la ejecución');
              conclusionCurvaS.push('• El proyecto está cumpliendo con las expectativas de valor');
            } else if (eficienciaCostoGanado > 40) {
              conclusionCurvaS.push('• El valor ganado presenta eficiencia moderada');
              conclusionCurvaS.push('• Se recomienda optimizar los procesos de ejecución');
            } else {
              conclusionCurvaS.push('• El valor ganado indica baja eficiencia en la ejecución');
              conclusionCurvaS.push('• Se requiere revisión integral de los procesos');
            }
          }
        }
  
        conclusionCurvaS.forEach(punto => {
          doc.text(punto, 25, y);
          y += 4;
        });
        y += 8;
      }
  
      // ===== PÁGINA 4: DETALLES TÉCNICOS =====
      doc.addPage();
  
      // Header cuarta página
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES TÉCNICOS - METODOLOGÍAS', 105, 20, { align: 'center' });
  
      y = 50;
  
      // Detalles IEAC
      doc.setTextColor(...colors.dark);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('METODOLOGÍAS IEAC DETALLADAS', 20, y);
      y += 10;
  
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      datosIEAC.forEach((item, index) => {
        // Verificar espacio suficiente para el contenido + pie de página (margen de 40px)
        if (y > 220) {
          doc.addPage();
          y = 30;
        }
        
        doc.text(`${index + 1}. ${item.metodologia}:`, 20, y);
        y += 4;
        doc.text(`   Fórmula: ${item.formula}`, 25, y);
        y += 4;
        doc.text(`   Valor: $${(item.valor/1000000).toFixed(2)}M`, 25, y);
        y += 4;
        doc.text(`   Descripción: ${item.descripcion}`, 25, y);
        y += 8;
      });
  
      // Detalles ECD
      if (y > 200) {
        doc.addPage();
        y = 30;
      }
  
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('METODOLOGÍAS ECD DETALLADAS', 20, y);
      y += 10;
  
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
  
      const metodologiasECD = [
        { nombre: 'ECD(a)', valor: datosECD.metodologiaA, formula: 'Duración Planificada / SPI' },
        { nombre: 'ECD(b)', valor: datosECD.metodologiaB, formula: 'Plazo Control + Por Ganar / PV1m' },
        { nombre: 'ECD(c)', valor: datosECD.metodologiaC, formula: 'Plazo Control + Por Ganar / PV3m' },
        { nombre: 'ECD(d)', valor: datosECD.metodologiaD, formula: 'Plazo Control + Por Ganar / PV6m' },
        { nombre: 'ECD(e)', valor: datosECD.metodologiaE, formula: 'Plazo Control + Por Ganar / PV12m' },
        { nombre: 'ECD(f)', valor: datosECD.metodologiaF, formula: 'Plazo Control + Por Ganar / EV1m' },
        { nombre: 'ECD(g)', valor: datosECD.metodologiaG, formula: 'Plazo Control + Por Ganar / EV3m' },
        { nombre: 'ECD(h)', valor: datosECD.metodologiaH, formula: 'Plazo Control + Por Ganar / EV6m' }
      ];
  
      metodologiasECD.forEach((metodologia, index) => {
        // Verificar espacio suficiente para el contenido + pie de página (margen de 40px)
        if (y > 220) {
          doc.addPage();
          y = 30;
        }
        
        if (metodologia.valor && metodologia.valor > 0) {
          doc.text(`${index + 1}. ${metodologia.nombre}:`, 20, y);
          y += 4;
          doc.text(`   Fórmula: ${metodologia.formula}`, 25, y);
          y += 4;
          doc.text(`   Valor: ${metodologia.valor.toFixed(1)} meses`, 25, y);
          y += 8;
        }
      });
  
      // Agregar espacio final para el pie de página
      y += 20;
      
      // Verificar si necesitamos una nueva página para el pie de página
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
  
      // Pie de página profesional
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, 190, y);
      y += 8;
      
      // Información del pie de página
      doc.text(`Reporte generado automáticamente el ${obtenerFechaActual()}`, 20, y);
      doc.text(`Proyecto ID: ${proyectoId} | Fecha de Corte: ${fechaCorte}`, 20, y + 4);
      doc.text('Sistema de Gestión de Proyectos - Análisis EVM', 20, y + 8);
      
      // Guardar PDF
      const nombreArchivo = `reporte_automatico_evm_proyecto_${proyectoId}_${obtenerFechaActual()}.pdf`;
      doc.save(nombreArchivo);
  
      console.log('PDF Automático generado exitosamente');
  
    } catch (error) {
      console.error('Error generando PDF automático:', error);
      alert('Error al generar el reporte PDF. Por favor, intente nuevamente.');
    }
  };