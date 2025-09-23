// ARCHIVO TEMPORAL DE DEBUG PARA ECD
// Este archivo nos ayudará a identificar exactamente dónde está el problema

console.log('🔍 INICIANDO DEBUG ECD - ARCHIVO TEMPORAL');

// Función para debuggear paso a paso
const debugECD = async (proyectoId, fechaCorte, API_BASE) => {
  console.log('🚀 === DEBUG ECD INICIADO ===');
  console.log('📋 Parámetros:', { proyectoId, fechaCorte, API_BASE });
  
  try {
    // PASO 1: Obtener datos de real_parcial
    console.log('📊 PASO 1: Obteniendo datos real_parcial...');
    const realResponse = await fetch(`${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=real_parcial`);
    const realData = await realResponse.json();
    console.log('✅ Real data:', {
      success: realData.success,
      datosLength: realData.datos?.length || 0,
      primerRegistro: realData.datos?.[0],
      ultimoRegistro: realData.datos?.[realData.datos?.length - 1]
    });

    // PASO 2: Obtener datos de api_parcial
    console.log('📊 PASO 2: Obteniendo datos api_parcial...');
    const apiResponse = await fetch(`${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=api_parcial`);
    const apiData = await apiResponse.json();
    console.log('✅ API data:', {
      success: apiData.success,
      datosLength: apiData.datos?.length || 0,
      primerRegistro: apiData.datos?.[0],
      ultimoRegistro: apiData.datos?.[apiData.datos?.length - 1]
    });

    // PASO 3: Calcular totales acumulados
    console.log('📊 PASO 3: Calculando totales acumulados...');
    const calcularTotalAcumulado = (datos, fechaLimite) => {
      return datos
        .filter(row => row.periodo <= fechaLimite)
        .reduce((total, row) => total + (Number(row.monto) || 0), 0);
    };

    const calcularTotalCompleto = (datos) => {
      return datos.reduce((total, row) => total + (Number(row.monto) || 0), 0);
    };

    const AC = calcularTotalAcumulado(realData.datos || [], fechaCorte);
    const PV = calcularTotalAcumulado(apiData.datos || [], fechaCorte);
    const BAC = calcularTotalCompleto(apiData.datos || []);

    console.log('💰 Valores calculados:', {
      AC: AC.toFixed(2),
      PV: PV.toFixed(2),
      BAC: BAC.toFixed(2),
      AC_Millones: (AC / 1000000).toFixed(2) + 'M',
      PV_Millones: (PV / 1000000).toFixed(2) + 'M',
      BAC_Millones: (BAC / 1000000).toFixed(2) + 'M'
    });

    // PASO 4: Obtener avance físico
    console.log('📊 PASO 4: Obteniendo avance físico...');
    let porcentajeAvanceFisico = 0;
    try {
      const avanceResponse = await fetch(`${API_BASE}/obtener_avance_fisico.php?proyecto_id=${proyectoId}&fecha=${fechaCorte}`);
      const avanceData = await avanceResponse.json();
      console.log('🔍 Respuesta avance físico:', avanceData);
      
      if (avanceData.success && avanceData.avance_fisico !== null) {
        porcentajeAvanceFisico = avanceData.avance_fisico / 100;
        console.log('✅ Avance físico obtenido:', {
          valorOriginal: avanceData.avance_fisico,
          porcentajeDecimal: porcentajeAvanceFisico,
          porcentajeFormateado: (porcentajeAvanceFisico * 100).toFixed(2) + '%'
        });
      } else {
        console.log('⚠️ No se pudo obtener avance físico, intentando fallback...');
        // Fallback con NPC
        const npcResponse = await fetch(`${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=npc_parcial`);
        const npcData = await npcResponse.json();
        if (npcData.success) {
          const NPC = calcularTotalAcumulado(npcData.datos || [], fechaCorte);
          porcentajeAvanceFisico = BAC > 0 ? NPC / BAC : 0;
          console.log('🔄 Fallback NPC:', {
            NPC: NPC,
            BAC: BAC,
            porcentajeCalculado: (porcentajeAvanceFisico * 100).toFixed(2) + '%'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error obteniendo avance físico:', error);
    }

    // PASO 5: Calcular EV y SPI
    console.log('📊 PASO 5: Calculando EV y SPI...');
    const EV = BAC * porcentajeAvanceFisico;
    const SPI = PV !== 0 ? EV / PV : 0;

    console.log('📈 Indicadores EVM:', {
      EV: EV.toFixed(2),
      SPI: SPI.toFixed(3),
      EV_Millones: (EV / 1000000).toFixed(2) + 'M'
    });

    // PASO 6: Obtener duración planificada
    console.log('📊 PASO 6: Obteniendo duración planificada...');
    let duracionPlanificada = 12; // Valor por defecto
    try {
      const duracionResponse = await fetch(`${API_BASE}/calcular_ecd_b.php?proyecto_id=${proyectoId}&fecha_filtro=${fechaCorte}`);
      const duracionData = await duracionResponse.json();
      console.log('🔍 Respuesta duración:', duracionData);
      
      if (duracionData.success && duracionData.duracion_planificada) {
        duracionPlanificada = duracionData.duracion_planificada;
        console.log('✅ Duración planificada obtenida:', duracionPlanificada);
      } else {
        console.log('⚠️ Usando duración por defecto:', duracionPlanificada);
      }
    } catch (error) {
      console.error('❌ Error obteniendo duración:', error);
    }

    // PASO 7: Calcular ECD(a)
    console.log('📊 PASO 7: Calculando ECD(a)...');
    let ecdA = 0;
    if (SPI > 0) {
      ecdA = duracionPlanificada / Math.max(SPI, 0.01);
      console.log('✅ ECD(a) calculado:', {
        formula: `${duracionPlanificada} / ${SPI}`,
        resultado: ecdA,
        resultadoRedondeado: Math.round(ecdA)
      });
    } else {
      console.log('❌ No se puede calcular ECD(a): SPI = 0');
    }

    // PASO 8: Obtener otras metodologías ECD
    console.log('📊 PASO 8: Obteniendo otras metodologías ECD...');
    const apisECD = ['calcular_ecd_c.php', 'calcular_ecd_d.php'];
    const resultadosECD = {};
    
    for (const api of apisECD) {
      try {
        const response = await fetch(`${API_BASE}/${api}?proyecto_id=${proyectoId}&fecha_filtro=${fechaCorte}`);
        const data = await response.json();
        const letra = api.split('_')[2].split('.')[0];
        const valor = data[`ecd_${letra}`];
        
        console.log(`🔍 ${api}:`, {
          success: data.success,
          valor: valor,
          tieneValor: valor && !isNaN(valor) && isFinite(valor) && valor > 0
        });
        
        resultadosECD[letra] = valor;
      } catch (error) {
        console.error(`❌ Error en ${api}:`, error);
      }
    }

    // RESUMEN FINAL
    console.log('🎯 === RESUMEN FINAL DEBUG ===');
    console.log('📊 Indicadores EVM:', {
      AC: AC.toFixed(2),
      PV: PV.toFixed(2),
      EV: EV.toFixed(2),
      BAC: BAC.toFixed(2),
      SPI: SPI.toFixed(3),
      porcentajeAvanceFisico: (porcentajeAvanceFisico * 100).toFixed(2) + '%'
    });
    console.log('📅 Duración planificada:', duracionPlanificada);
    console.log('🎯 ECD(a):', ecdA > 0 ? Math.round(ecdA) + ' meses' : 'N/A');
    console.log('📋 Otras metodologías:', resultadosECD);

    return {
      AC, PV, EV, BAC, SPI, duracionPlanificada, ecdA, resultadosECD
    };

  } catch (error) {
    console.error('❌ ERROR GENERAL EN DEBUG:', error);
    return null;
  }
};

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugECD };
} else {
  window.debugECD = debugECD;
}

console.log('✅ ARCHIVO DEBUG ECD CARGADO');
