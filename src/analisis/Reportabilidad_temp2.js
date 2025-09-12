            {/* GrÃ¡fico de Tendencias FÃ­sicas */}
            <div style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e3e6f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{
                color: '#16355D',
                marginBottom: '20px',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ðŸ“ˆ Tendencias FÃ­sicas (Enero 2025 - {hasta20 ? new Date(hasta20 + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Actual'})
              </h4>
              
              <div style={{
                height: '300px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                position: 'relative',
                overflow: 'hidden',
                padding: '20px',
                width: '100%'
              }}>
                {/* Generar datos mensuales para el grÃ¡fico fÃ­sico */}
                {(() => {
                  // Generar meses desde enero 2025 hasta el mes seleccionado
                  const meses = [];
                  const fechaInicio = new Date('2025-01-01');
                  let fechaFin;
                  
                  if (hasta20) {
                    const [aÃ±o, mes] = hasta20.split('-');
                    fechaFin = new Date(parseInt(aÃ±o), parseInt(mes), 0); // Ãšltimo dÃ­a del mes seleccionado
                  } else {
                    fechaFin = new Date();
                  }
                  
                  let fechaActual = new Date(fechaInicio);
                  while (fechaActual <= fechaFin) {
                    const mesNombre = fechaActual.toLocaleDateString('es-ES', { month: 'short' });
                    const periodo = fechaActual.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
                    
                    meses.push({
                      mes: mesNombre,
                      periodo: periodo,
                      fecha: new Date(fechaActual)
                    });
                    
                    fechaActual.setMonth(fechaActual.getMonth() + 1);
                  }
                  
                  console.log('ðŸ“Š Meses generados para grÃ¡fico fÃ­sico:', meses);
                  console.log('ðŸ“Š Valores reales de la tabla fÃ­sica:', {
                    proyeccionFisica,
                    realFisica,
                    hasta20
                  });
                  
                  // Generar datos del grÃ¡fico fÃ­sico - listo para valores correctos
                  const datosFisicos = meses.map((mes, index) => {
                    // TODO: Reemplazar con valores reales cuando se proporcionen
                    // Por ahora usar valores de ejemplo para mantener la estructura del grÃ¡fico
                    const proyeccion = 0; // SerÃ¡ reemplazado con valores reales
                    const real = 0;       // SerÃ¡ reemplazado con valores reales
                    
                    return {
                      mes: mes.mes,
                      periodo: mes.periodo,
                      proyeccion: proyeccion,
                      real: real,
                      desviacion: proyeccion !== 0 ? ((real - proyeccion) / proyeccion) * 100 : 0
                    };
                  });
                  
                  console.log('ðŸ“Š GrÃ¡fico fÃ­sico listo - estructura mantenida, esperando valores correctos');
                  
                  if (datosFisicos.length === 0) {
                    return (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#6c757d',
                        fontSize: '14px'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>ðŸ“ˆ</div>
                        <strong>No hay datos disponibles para el perÃ­odo seleccionado</strong>
                      </div>
                    );
                  }
                  
                  const minValor = Math.min(...datosFisicos.map(d => Math.min(d.proyeccion, d.real)));
                  const maxValor = Math.max(...datosFisicos.map(d => Math.max(d.proyeccion, d.real)));
                  const range = maxValor - minValor || 0.1; // Evitar divisiÃ³n por cero
                  
                  const chartWidth = 100;
                  const chartHeight = 200;
                  const chartTop = 20;
                  const chartBottom = 40;
                  
                  return (
                    <>
                      {/* LÃ­neas de cuadrÃ­cula horizontales */}
                      {[0, 25, 50, 75, 100].map((value, index) => (
                        <div key={`grid-h-fis-${value}`} style={{
                          position: 'absolute',
                          left: '40px',
                          right: '40px',
                          top: `${chartTop + (index * chartHeight / 4)}px`,
                          height: '1px',
                          backgroundColor: '#e9ecef',
                          opacity: '0.5'
                        }}></div>
                      ))}
                      
                      {/* LÃ­neas de cuadrÃ­cula verticales */}
                      {datosFisicos.map((_, index) => {
                        const x = (index * chartWidth / datosFisicos.length) + (chartWidth / datosFisicos.length * 0.5);
                        return (
                          <div key={`grid-v-fis-${index}`} style={{
                            position: 'absolute',
                            left: `${x}%`,
                            top: `${chartTop}px`,
                            bottom: `${chartBottom}px`,
                            width: '1px',
                            backgroundColor: '#e9ecef',
                            opacity: '0.3'
                          }}></div>
                        );
                      })}
                      
                      {/* LÃ­neas de tendencia */}
                      <svg style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                      }}>
                        {/* LÃ­nea de proyecciÃ³n */}
                        <polyline
                          points={datosFisicos.map((dato, index) => {
                            const x = (index * chartWidth / datosFisicos.length) + (chartWidth / datosFisicos.length * 0.5);
                            const y = chartTop + chartHeight - ((dato.proyeccion - minValor) / range) * chartHeight;
                            return `${x}%,${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#17a2b8"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.8"
                        />
                        
                        {/* LÃ­nea de real */}
                        <polyline
                          points={datosFisicos.map((dato, index) => {
                            const x = (index * chartWidth / datosFisicos.length) + (chartWidth / datosFisicos.length * 0.5);
                            const y = chartTop + chartHeight - ((dato.real - minValor) / range) * chartHeight;
                            return `${x}%,${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#fd7e14"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.8"
                        />
                      </svg>
                      
                      {/* Puntos de datos */}
                      {datosFisicos.map((dato, index) => {
                        const x = (index * chartWidth / datosFisicos.length) + (chartWidth / datosFisicos.length * 0.5);
                        
                        // Punto de proyecciÃ³n
                        const yProyeccion = chartTop + chartHeight - ((dato.proyeccion - minValor) / range) * chartHeight;
                        // Punto de real
                        const yReal = chartTop + chartHeight - ((dato.real - minValor) / range) * chartHeight;
                        
                        return (
                          <div key={`points-fis-${index}`}>
                            {/* Punto de proyecciÃ³n */}
                            <div style={{
                              position: 'absolute',
                              left: `${x}%`,
                              top: `${yProyeccion}px`,
                              width: '12px',
                              height: '12px',
                              backgroundColor: '#ffffff',
                              border: '3px solid #17a2b8',
                              borderRadius: '50%',
                              transform: 'translate(-50%, -50%)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              cursor: 'pointer'
                            }} title={`${dato.mes} 2025\nProyecciÃ³n: ${dato.proyeccion.toFixed(2)}%\nReal: ${dato.real.toFixed(2)}%`}></div>
                            
                            {/* Punto de real */}
                            <div style={{
                              position: 'absolute',
                              left: `${x}%`,
                              top: `${yReal}px`,
                              width: '12px',
                              height: '12px',
                              backgroundColor: '#ffffff',
                              border: '3px solid #fd7e14',
                              borderRadius: '50%',
                              transform: 'translate(-50%, -50%)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              cursor: 'pointer'
                            }} title={`${dato.mes} 2025\nProyecciÃ³n: ${dato.proyeccion.toFixed(2)}%\nReal: ${dato.real.toFixed(2)}%`}></div>
                          </div>
                        );
                      })}
                      
                      {/* Etiquetas de meses */}
                      {datosFisicos.map((dato, index) => {
                        const x = (index * chartWidth / datosFisicos.length) + (chartWidth / datosFisicos.length * 0.5);
                        
                        return (
                          <div key={`label-fis-${index}`} style={{
                            position: 'absolute',
                            left: `${x}%`,
                            bottom: '10px',
                            textAlign: 'center',
                            transform: 'translateX(-50%)',
                            fontSize: '11px',
                            color: '#6c757d',
                            fontWeight: '600'
                          }}>
                            {dato.mes}
                          </div>
                        );
                      })}
                      
                      {/* Etiquetas eje Y */}
                      {(() => {
                        const step = range / 4;
                        const labels = [];
                        for (let i = 0; i <= 4; i++) {
                          labels.push((minValor + (step * i)).toFixed(1));
                        }
                        return labels.map((label, index) => (
                          <div key={`y-fis-${index}`} style={{
                            position: 'absolute',
                            left: '10px',
                            top: `${chartTop + chartHeight - (index * chartHeight / 4)}px`,
                            fontSize: '10px',
                            color: '#6c757d',
                            fontWeight: 'bold',
                            transform: 'translateY(-50%)'
                          }}>
                            {label}%
                          </div>
                        ));
                      })()}
                    </>
                  );
                })()}
              </div>
              
              {/* Leyenda del grÃ¡fico fÃ­sico */}
              <div style={{
                marginTop: '15px',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '3px', backgroundColor: '#17a2b8', borderRadius: '2px' }}></div>
                  <span><strong>ProyecciÃ³n</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '3px', backgroundColor: '#fd7e14', borderRadius: '2px' }}></div>
                  <span><strong>Real</strong></span>
                </div>
              </div>
            </div>

            {/* GrÃ¡fico de Tendencias Financieras */}
            <div style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e3e6f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{
                color: '#16355D',
                marginBottom: '20px',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ðŸ’° Tendencias Financieras (Diciembre 2024 - {hasta20 ? new Date(hasta20 + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Enero 2025'})
              </h4>
              
              <div style={{
                height: '300px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                position: 'relative',
                overflow: 'hidden',
                padding: '20px',
                width: '100%'
              }}>
                {cargandoGraficoFinanciero ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '10px',
                    color: '#6c757d',
                    fontSize: '14px'
                  }}>
                    <span style={{ animation: 'spin 1s linear infinite' }}>âŸ³</span>
                    <span>Cargando datos financieros...</span>
                  </div>
                ) : datosGraficoFinanciero.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#6c757d',
                    fontSize: '14px',
                    marginTop: '100px'
                  }}>
                    No hay datos disponibles para el perÃ­odo seleccionado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={datosGraficoFinanciero.map(dato => ({
                        mes: dato.mes,
                        proyeccion: dato.proyeccion,
                        real: dato.real
                      }))}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ccc' }}
                        tickLine={{ stroke: '#ccc' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ccc' }}
                        tickLine={{ stroke: '#ccc' }}
                        tickFormatter={(value) => `${value.toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value.toFixed(1)}M USD`, name === 'proyeccion' ? 'ProyecciÃ³n' : 'Real']}
                        labelFormatter={(label) => `Mes: ${label}`}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="proyeccion"
                        stroke="#28a745"
                        strokeWidth={3}
                        dot={{ 
                          fill: '#28a745', 
                          strokeWidth: 2, 
                          stroke: '#fff',
                          r: 6
                        }}
                        activeDot={{ 
                          r: 8, 
                          stroke: '#28a745', 
                          strokeWidth: 2,
                          fill: '#fff'
                        }}
                        name="ProyecciÃ³n"
                      />
                      <Line
                        type="monotone"
                        dataKey="real"
                        stroke="#dc3545"
                        strokeWidth={3}
                        dot={{ 
                          fill: '#dc3545', 
                          strokeWidth: 2, 
                          stroke: '#fff',
                          r: 6
                        }}
                        activeDot={{ 
                          r: 8, 
                          stroke: '#dc3545', 
                          strokeWidth: 2,
                          fill: '#fff'
                        }}
                        name="Real"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
                          position: 'absolute',
                          left: '40px',
                          right: '40px',
                          top: `${chartTop + (index * chartHeight / 4)}px`,
                          height: '1px',
                          backgroundColor: '#e9ecef',
                          opacity: '0.5'
                        }}></div>
                      ))}
                      
                      {/* LÃ­neas de cuadrÃ­cula verticales */}
                      {datosFinancieros.map((_, index) => {
                        const x = (index * chartWidth / datosFinancieros.length) + (chartWidth / datosFinancieros.length * 0.5);
                        return (
                          <div key={`grid-v-fin-${index}`} style={{
                            position: 'absolute',
                            left: `${x}%`,
                            top: `${chartTop}px`,
                            bottom: `${chartBottom}px`,
                            width: '1px',
                            backgroundColor: '#e9ecef',
                            opacity: '0.3'
                          }}></div>
                        );
                      })}
                      
                      {/* SVG para las lÃ­neas del grÃ¡fico */}
                      <svg style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                      }}>
                        {/* LÃ­nea de proyecciÃ³n */}
                        <polyline
                          points={datosFinancieros.map((dato, index) => {
                            const x = (index * chartWidth / datosFinancieros.length) + (chartWidth / datosFinancieros.length * 0.5);
                            const y = chartTop + chartHeight - ((dato.proyeccion - minValor) / range) * chartHeight;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#28a745"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.9"
                        />
                        
                        {/* LÃ­nea de real */}
                        <polyline
                          points={datosFinancieros.map((dato, index) => {
                            const x = (index * chartWidth / datosFinancieros.length) + (chartWidth / datosFinancieros.length * 0.5);
                            const y = chartTop + chartHeight - ((dato.real - minValor) / range) * chartHeight;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#dc3545"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.9"
                        />
                      </svg>
                      
                      {/* Puntos de datos */}
                      {datosFinancieros.map((dato, index) => {
                        const x = (index * chartWidth / datosFinancieros.length) + (chartWidth / datosFinancieros.length * 0.5);
                        
                        // Punto de proyecciÃ³n
                        const yProyeccion = chartTop + chartHeight - ((dato.proyeccion - minValor) / range) * chartHeight;
                        // Punto de real
                        const yReal = chartTop + chartHeight - ((dato.real - minValor) / range) * chartHeight;
                        
                        return (
                          <div key={`points-fin-${index}`}>
                            {/* Punto de proyecciÃ³n */}
                            <div style={{
                              position: 'absolute',
                              left: `${x}%`,
                              top: `${yProyeccion}px`,
                              width: '10px',
                              height: '10px',
                              backgroundColor: '#28a745',
                              borderRadius: '50%',
                              border: '3px solid #ffffff',
                              transform: 'translate(-50%, -50%)',
                              cursor: 'pointer',
                              boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
                              zIndex: 10
                            }}
                            title={`${dato.mes} 2025\nProyecciÃ³n: ${dato.proyeccion.toFixed(1)}M USD\nReal: ${dato.real.toFixed(1)}M USD`}
                            ></div>
                            
                            {/* Punto de real */}
                            <div style={{
                              position: 'absolute',
                              left: `${x}%`,
                              top: `${yReal}px`,
                              width: '10px',
                              height: '10px',
                              backgroundColor: '#dc3545',
                              borderRadius: '50%',
                              border: '3px solid #ffffff',
                              transform: 'translate(-50%, -50%)',
                              cursor: 'pointer',
                              boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
                              zIndex: 10
                            }}
                            title={`${dato.mes} 2025\nProyecciÃ³n: ${dato.proyeccion.toFixed(1)}M USD\nReal: ${dato.real.toFixed(1)}M USD`}
                            ></div>
                          </div>
                        );
                      })}
                      
                      {/* Etiquetas de meses */}
                      {datosFinancieros.map((dato, index) => {
                        const x = (index * chartWidth / datosFinancieros.length) + (chartWidth / datosFinancieros.length * 0.5);
                        
                        return (
                          <div key={`label-fin-${index}`} style={{
                            position: 'absolute',
                            left: `${x}%`,
                            bottom: '10px',
                            transform: 'translateX(-50%)',
                            fontSize: '10px',
                            color: '#6c757d',
                            fontWeight: 'bold'
                          }}>
                            {dato.mes}
                          </div>
                        );
                      })}
                      
                      {/* Etiquetas del eje Y */}
                      {(() => {
                        const labels = [];
                        for (let i = 0; i <= 4; i++) {
                          const value = minValor + (range * i / 4);
                          labels.push(value.toFixed(1) + 'M');
                        }
                        return labels.map((label, index) => (
                          <div key={`y-fin-${index}`} style={{
                            position: 'absolute',
                            left: '10px',
                            top: `${chartTop + chartHeight - (index * chartHeight / 4)}px`,
                            fontSize: '10px',
                            color: '#6c757d',
                            fontWeight: 'bold',
                            transform: 'translateY(-50%)'
                          }}>
                            {label}
                          </div>
                        ));
                      })()}
                    </>
                  );
                })()}
              </div>
              
              {/* Leyenda del grÃ¡fico financiero */}
              <div style={{
                marginTop: '15px',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '3px', backgroundColor: '#28a745', borderRadius: '2px' }}></div>
                  <span><strong>ProyecciÃ³n</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '3px', backgroundColor: '#dc3545', borderRadius: '2px' }}></div>
                  <span><strong>Real</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* AcordeÃ³n del Glosario TÃ©cnico - Predictividad */}
          <div style={{ 
            marginTop: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'hidden'
          }}>
            {/* BotÃ³n del acordeÃ³n */}
            <button
              onClick={() => setMostrarGlosarioPredictividad(!mostrarGlosarioPredictividad)}
              style={{
                width: '100%',
                padding: '15px 20px',
                backgroundColor: mostrarGlosarioPredictividad ? '#16355D' : '#ffffff',
                color: mostrarGlosarioPredictividad ? '#ffffff' : '#16355D',
                border: 'none',
                borderRadius: mostrarGlosarioPredictividad ? '0' : '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease',
                boxShadow: mostrarGlosarioPredictividad ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!mostrarGlosarioPredictividad) {
                  e.target.style.backgroundColor = '#e3f2fd';
                  e.target.style.color = '#16355D';
                }
              }}
              onMouseLeave={(e) => {
                if (!mostrarGlosarioPredictividad) {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.color = '#16355D';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              ðŸ“š GLOSARIO TÃ‰CNICO - PREDICTIVIDAD
              </span>
              <span style={{ 
                fontSize: '18px',
                transition: 'transform 0.3s ease',
                transform: mostrarGlosarioPredictividad ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                â–¼
              </span>
            </button>
            
            {/* Contenido del acordeÃ³n */}
            {mostrarGlosarioPredictividad && (
              <div style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #dee2e6',
                animation: 'slideDown 0.3s ease-out'
              }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  ðŸ’° PREDICCIÃ“N FINANCIERA
                </h5>
                <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                  <li><strong>ProyecciÃ³n:</strong> Valor planificado segÃºn proyecciones financieras (USD). Representa la expectativa de gasto para el perÃ­odo.</li>
                  <li><strong>Real:</strong> EjecuciÃ³n financiera real desde la tabla real_parcial (USD). Refleja el desembolso efectivo.</li>
                  <li><strong>DesviaciÃ³n:</strong> Diferencia porcentual entre Real y ProyecciÃ³n = ((Real - ProyecciÃ³n) / ProyecciÃ³n) Ã— 100.</li>
                </ul>
              </div>
              
              <div>
                <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  ðŸ“ˆ PREDICCIÃ“N FÃSICA
                </h5>
                <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                  <li><strong>ProyecciÃ³n:</strong> Meta de avance fÃ­sico planificada segÃºn tabla predictividad (%). Objetivo operacional esperado.</li>
                  <li><strong>Real:</strong> Avance fÃ­sico real desde la tabla av_fisico_real.api_parcial (%). Progreso efectivo alcanzado.</li>
                  <li><strong>DesviaciÃ³n:</strong> Diferencia porcentual entre Real y ProyecciÃ³n = ((Real - ProyecciÃ³n) / ProyecciÃ³n) Ã— 100.</li>
                </ul>
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#e3f2fd', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #2196f3',
              marginBottom: '15px'
            }}>
              <h5 style={{ color: '#1565c0', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                ðŸŽ¯ MÃ‰TRICAS DE PREDICTIVIDAD
              </h5>
              <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                <li><strong>PrecisiÃ³n:</strong> Indicador de exactitud de las proyecciones = 100% - |DesviaciÃ³n|. Valores {'>'}95% indican excelente predictibilidad.</li>
                <li><strong>Nota:</strong> CalificaciÃ³n basada en la precisiÃ³n de las predicciones.</li>
              </ul>
            </div>
            
            {/* Layout de Mitad y Mitad: Reglas de PonderaciÃ³n + Fuentes de Datos */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginBottom: '15px'
            }}>
              {/* Reglas de PonderaciÃ³n de Notas - Predictividad */}
              <div style={{
                backgroundColor: '#fff3e0', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid #ffb74d',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h5 style={{ color: '#e65100', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                    ðŸ“‹ REGLAS DE PONDERACIÃ“N DE NOTAS - PREDICTIVIDAD
                  </h5>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '15px',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <h6 style={{ color: '#bf360c', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                        ðŸŸ¢ NOTAS EXCELENTES (4.0 - 5.0)
                      </h6>
                      <ul style={{ margin: 0, paddingLeft: '15px', color: '#bf360c', fontSize: '12px', lineHeight: '1.3' }}>
                        <li><strong>5.0 (Excelente):</strong> PrecisiÃ³n â‰¥ 95%</li>
                        <li><strong>4.0 (Bueno):</strong> PrecisiÃ³n 90% - 95%</li>
                      </ul>
                    </div>
                    <div>
                      <h6 style={{ color: '#f57c00', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                        ðŸŸ¡ NOTAS REGULARES (2.0 - 3.0)
                      </h6>
                      <ul style={{ margin: 0, paddingLeft: '15px', color: '#f57c00', fontSize: '12px', lineHeight: '1.3' }}>
                        <li><strong>3.0 (Regular):</strong> PrecisiÃ³n 75% - 90%</li>
                        <li><strong>2.0 (Deficiente):</strong> PrecisiÃ³n 60% - 75%</li>
                      </ul>
                    </div>
                  </div>
                  <div style={{ 
                    backgroundColor: '#ffebee', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: '1px solid #ef5350',
                    marginBottom: '12px'
                  }}>
                    <h6 style={{ color: '#c62828', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                      ðŸ”´ NOTA CRÃTICA (1.0)
                    </h6>
                    <ul style={{ margin: 0, paddingLeft: '15px', color: '#c62828', fontSize: '12px', lineHeight: '1.3' }}>
                      <li><strong>1.0 (CrÃ­tico):</strong> PrecisiÃ³n {'<'} 60%</li>
                    </ul>
                  </div>
                </div>
                
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#f1f8e9', 
                  borderRadius: '6px', 
                  border: '1px solid #8bc34a',
                  fontSize: '12px',
                  color: '#33691e'
                }}>
                  <strong>ðŸ’¡ InterpretaciÃ³n:</strong> La precisiÃ³n mide quÃ© tan acertadas fueron las proyecciones. Una precisiÃ³n {'>'}95% significa que las predicciones fueron muy cercanas a la realidad, mientras que {'<'}60% indica que las proyecciones requieren revisiÃ³n inmediata.
                </div>
              </div>
              
              {/* PerÃ­odos de AnÃ¡lisis */}
              <div style={{ 
                backgroundColor: '#e8f5e8', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid #4caf50',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <h5 style={{ color: '#2e7d32', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                  ðŸ“… PERÃODOS DE ANÃLISIS
                </h5>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px'
                }}>
                  {/* PerÃ­odo del Mes */}
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #28a745'
                  }}>
                    <h6 style={{ color: '#155724', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      ðŸ“Š PerÃ­odo del Mes
                    </h6>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', lineHeight: '1.3' }}>
                      AnÃ¡lisis mensual especÃ­fico (actual o filtrado por fechas)
                    </p>
                  </div>
                  
                  {/* PerÃ­odo Acumulado */}
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #28a745'
                  }}>
                    <h6 style={{ color: '#155724', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      ðŸ“ˆ PerÃ­odo Acumulado
                    </h6>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', lineHeight: '1.3' }}>
                      Sumatoria desde enero hasta el mes de anÃ¡lisis
                    </p>
                  </div>
                  
                  {/* PerÃ­odo Anual */}
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #28a745'
                  }}>
                    <h6 style={{ color: '#155724', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      ðŸ“… PerÃ­odo Anual
                    </h6>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', lineHeight: '1.3' }}>
                      AnÃ¡lisis completo del aÃ±o (actual o filtrado)
                    </p>
                  </div>
                </div>
                
                {/* Espaciador para igualar altura con el panel izquierdo */}
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: 'transparent',
                  fontSize: '12px',
                  color: 'transparent'
                }}>
                  Espaciador para igualar altura
                </div>
              </div>
            </div>
          </div>
          )}
          </div>

          {/* AnÃ¡lisis DinÃ¡mico - Predictividad */}
          {proyeccionFinanciera > 0 && realFinanciera > 0 && proyeccionFisica !== 0 && realFisica > 0 && (
            <div>
              {/* AcordeÃ³n del AnÃ¡lisis Ejecutivo */}
            <div style={{ 
              backgroundColor: '#fff3cd', 
              borderRadius: '8px', 
              border: '2px solid #ffc107',
              overflow: 'hidden',
              marginTop: '20px'
            }}>
              {/* BotÃ³n del acordeÃ³n */}
              <button
                onClick={() => setMostrarAnalisisEjecutivo(!mostrarAnalisisEjecutivo)}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  backgroundColor: mostrarAnalisisEjecutivo ? '#856404' : '#fff3cd',
                  color: mostrarAnalisisEjecutivo ? '#ffffff' : '#856404',
                  border: 'none',
                  borderRadius: mostrarAnalisisEjecutivo ? '0' : '8px',
                  cursor: 'pointer',
                fontSize: '16px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  boxShadow: mostrarAnalisisEjecutivo ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!mostrarAnalisisEjecutivo) {
                    e.target.style.backgroundColor = '#ffc107';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!mostrarAnalisisEjecutivo) {
                    e.target.style.backgroundColor = '#fff3cd';
                    e.target.style.color = '#856404';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                ðŸ“Š ANÃLISIS EJECUTIVO - PREDICTIVIDAD DEL PROYECTO
                </span>
                <span style={{ 
                  fontSize: '18px',
                  transition: 'transform 0.3s ease',
                  transform: mostrarAnalisisEjecutivo ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  â–¼
                </span>
              </button>
              
              {/* Contenido del acordeÃ³n */}
              {mostrarAnalisisEjecutivo && (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid #ffc107',
                  animation: 'slideDown 0.3s ease-out'
                }}>
              
              {(() => {
                // Obtener datos de desviaciÃ³n
                const desviacionFinanciera = calcularDesviacionFinanciera();
                const desviacionFisica = calcularDesviacionFisica();
                
                // Calcular precisiÃ³n de predicciones
                const precisionFinanciera = Math.abs(100 - Math.abs(desviacionFinanciera.porcentaje));
                const precisionFisica = Math.abs(100 - Math.abs(desviacionFisica.porcentaje));
                
                // Determinar estado general de predictividad
                const getEstadoPredictividad = () => {
                  const precisionPromedio = (precisionFinanciera + precisionFisica) / 2;
                  
                  if (precisionPromedio >= 95) {
                    return { texto: 'EXCELENTE', color: '#28a745', icono: 'ðŸŸ¢' };
                  } else if (precisionPromedio >= 85) {
                    return { texto: 'BUENA', color: '#17a2b8', icono: 'ðŸ”µ' };
                  } else if (precisionPromedio >= 75) {
                    return { texto: 'REGULAR', color: '#ffc107', icono: 'ðŸŸ¡' };
                  } else if (precisionPromedio >= 60) {
                    return { texto: 'REQUIERE MEJORA', color: '#fd7e14', icono: 'ðŸŸ ' };
                  } else {
                    return { texto: 'CRÃTICA', color: '#dc3545', icono: 'ðŸ”´' };
                  }
                };
                
                const estadoPredictividad = getEstadoPredictividad();
                
                return (
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {/* Estado General de Predictividad */}
                    <div style={{ 
                      marginBottom: '15px', 
                      padding: '10px', 
                      backgroundColor: estadoPredictividad.color + '20',
                      borderRadius: '6px',
                      border: `1px solid ${estadoPredictividad.color}`
                    }}>
                      <strong style={{ color: estadoPredictividad.color }}>
                        {estadoPredictividad.icono} 
                          PRECISIÃ“N DE PREDICCIONES:
                        {estadoPredictividad.texto}
                      </strong>
                    </div>
                    
                    {/* AnÃ¡lisis por dimensiones */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                      <div>
                        <h6 style={{ color: '#856404', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                            ðŸ’° PREDICCIÃ“N FINANCIERA
                        </h6>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <div><strong>Proyectado:</strong> USD {proyeccionFinanciera.toLocaleString()}</div>
                          <div><strong>Ejecutado:</strong> USD {realFinanciera.toLocaleString()}</div>
                          <div>
                            <strong>
                              <CustomTooltip content="FÃ³rmula: ((Real - Proyectado) / Proyectado) Ã— 100">
                                DesviaciÃ³n:
                              </CustomTooltip>
                            </strong> 
                            <span style={{ 
                              color: desviacionFinanciera.esPositiva ? '#dc3545' : desviacionFinanciera.esNegativa ? '#28a745' : '#666',
                              fontWeight: 'bold'
                            }}>
                              {desviacionFinanciera.esPositiva ? '+' : ''}{desviacionFinanciera.porcentaje}%
                            </span>
                          </div>
                          <div>
                            <strong>
                              <CustomTooltip content="FÃ³rmula: 100% - |DesviaciÃ³n|">
                                PrecisiÃ³n:
                              </CustomTooltip>
                            </strong> 
                            <span style={{ 
                              color: precisionFinanciera >= 95 ? '#28a745' : precisionFinanciera >= 85 ? '#17a2b8' : precisionFinanciera >= 75 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {precisionFinanciera.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h6 style={{ color: '#856404', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                            ðŸ“ˆ PREDICCIÃ“N FÃSICA
                        </h6>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <div><strong>Proyectado:</strong> {proyeccionFisica.toFixed(2)}%</div>
                          <div><strong>Ejecutado:</strong> {realFisica.toFixed(2)}%</div>
                          <div>
                            <strong>
                                                          <CustomTooltip content="FÃ³rmula: ((Real - Proyectado) / Proyectado) Ã— 100">
                              DesviaciÃ³n:
                            </CustomTooltip>
                            </strong> 
                            <span style={{ 
                              color: desviacionFisica.esPositiva ? '#dc3545' : desviacionFisica.esNegativa ? '#28a745' : '#666',
                              fontWeight: 'bold'
                            }}>
                              {desviacionFisica.esPositiva ? '+' : ''}{desviacionFisica.porcentaje}%
                            </span>
                          </div>
                          <div>
                            <strong>
                                                          <CustomTooltip content="FÃ³rmula: 100% - |DesviaciÃ³n|">
                              PrecisiÃ³n:
                            </CustomTooltip>
                            </strong> 
                            <span style={{ 
                              color: precisionFisica >= 95 ? '#28a745' : precisionFisica >= 85 ? '#17a2b8' : precisionFisica >= 75 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {precisionFisica.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicadores clave */}
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '12px', 
                      borderRadius: '6px',
                      border: '1px solid #dee2e6',
                      marginBottom: '15px'
                    }}>
                      <h6 style={{ color: '#856404', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                        ðŸŽ¯ INDICADORES CLAVE DE PREDICTIVIDAD
                      </h6>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px' }}>
                        <div>
                          <strong>
                            PrecisiÃ³n Promedio:
                            <span 
                              title={`ðŸ§® CÃLCULO DE PRECISIÃ“N PROMEDIO:

ðŸ“Š FÃ“RMULA:
PrecisiÃ³n Promedio = (PrecisiÃ³n Financiera + PrecisiÃ³n FÃ­sica) / 2

ðŸ“ˆ CÃLCULO DE CADA PRECISIÃ“N:
â€¢ PrecisiÃ³n = 100% - |DesviaciÃ³n|

ðŸ“‹ EJEMPLO CON TUS DATOS:
â€¢ DesviaciÃ³n Financiera: ${typeof desviacionFinanciera.porcentaje === 'number' ? desviacionFinanciera.porcentaje.toFixed(2) : desviacionFinanciera.porcentaje}%
â€¢ PrecisiÃ³n Financiera: 100% - |${typeof desviacionFinanciera.porcentaje === 'number' ? desviacionFinanciera.porcentaje.toFixed(2) : desviacionFinanciera.porcentaje}%| = ${typeof precisionFinanciera === 'number' ? precisionFinanciera.toFixed(2) : precisionFinanciera}%

â€¢ DesviaciÃ³n FÃ­sica: ${typeof desviacionFisica.porcentaje === 'number' ? desviacionFisica.porcentaje.toFixed(2) : desviacionFisica.porcentaje}%
â€¢ PrecisiÃ³n FÃ­sica: 100% - |${typeof desviacionFisica.porcentaje === 'number' ? desviacionFisica.porcentaje.toFixed(2) : desviacionFisica.porcentaje}%| = ${typeof precisionFisica === 'number' ? precisionFisica.toFixed(2) : precisionFisica}%

ðŸŽ¯ RESULTADO:
PrecisiÃ³n Promedio = (${typeof precisionFinanciera === 'number' ? precisionFinanciera.toFixed(2) : precisionFinanciera}% + ${typeof precisionFisica === 'number' ? precisionFisica.toFixed(2) : precisionFisica}%) / 2 = ${((precisionFinanciera + precisionFisica) / 2).toFixed(1)}%

ðŸ’¡ INTERPRETACIÃ“N:
â€¢ 95-100%: Excelente precisiÃ³n
â€¢ 85-94%: Buena precisiÃ³n
â€¢ 75-84%: PrecisiÃ³n regular
â€¢ 60-74%: Requiere mejora
â€¢ <60%: PrecisiÃ³n crÃ­tica`}
                              style={{ 
                                cursor: 'help', 
                                color: '#007bff', 
                                marginLeft: '5px',
                                fontSize: '11px'
                              }}
                            >
                              â„¹ï¸
                            </span>
                          </strong> 
                          <span style={{ 
                            color: (precisionFinanciera + precisionFisica) / 2 >= 95 ? '#28a745' : (precisionFinanciera + precisionFisica) / 2 >= 85 ? '#17a2b8' : (precisionFinanciera + precisionFisica) / 2 >= 75 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {((precisionFinanciera + precisionFisica) / 2).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <strong>CalificaciÃ³n Financiera:</strong> 
                          <span style={{ 
                            color: calcularNota(desviacionFinanciera.porcentaje).color,
                            fontWeight: 'bold'
                          }}>
                            {calcularNota(desviacionFinanciera.porcentaje).numero}/5
                          </span>
                        </div>
                        <div>
                          <strong>CalificaciÃ³n FÃ­sica:</strong> 
                          <span style={{ 
                            color: calcularNotaFisica(desviacionFisica.porcentaje).color,
                            fontWeight: 'bold'
                          }}>
                            {calcularNotaFisica(desviacionFisica.porcentaje).numero}/5
                          </span>
                        </div>
                        <div>
                          <strong>Confianza del Modelo:</strong> 
                          <span style={{ 
                            color: (precisionFinanciera + precisionFisica) / 2 >= 90 ? '#28a745' : (precisionFinanciera + precisionFisica) / 2 >= 80 ? '#17a2b8' : '#ffc107',
                            fontWeight: 'bold'
                          }}>
                            {(precisionFinanciera + precisionFisica) / 2 >= 90 ? 'ALTA' : (precisionFinanciera + precisionFisica) / 2 >= 80 ? 'MEDIA' : 'BAJA'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recomendaciones */}
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '10px', 
                      backgroundColor: '#d1ecf1', 
                      borderRadius: '6px',
                      border: '1px solid #bee5eb',
                      fontSize: '12px',
                      color: '#0c5460'
                    }}>
                      <strong>ðŸ’¡ INSIGHTS DE PREDICTIVIDAD:</strong>
                      {(() => {
                        const precisionPromedio = (precisionFinanciera + precisionFisica) / 2;
                        
                        if (precisionPromedio >= 95) {
                          return ' El modelo de predicciÃ³n muestra excelente precisiÃ³n. Las proyecciones son altamente confiables para la planificaciÃ³n futura.';
                        } else if (precisionPromedio >= 85) {
                          return ' El modelo de predicciÃ³n tiene buena precisiÃ³n. Se recomienda monitorear tendencias para mejorar la exactitud.';
                        } else if (precisionPromedio >= 75) {
                          return ' La precisiÃ³n del modelo es regular. Se sugiere revisar los parÃ¡metros de predicciÃ³n y ajustar el modelo.';
                        } else if (precisionPromedio >= 60) {
                          return ' La precisiÃ³n requiere mejora significativa. Se necesita recalibrar el modelo de predicciÃ³n con datos mÃ¡s recientes.';
                        } else {
                          return ' La precisiÃ³n es crÃ­tica. Se requiere una revisiÃ³n completa del modelo de predicciÃ³n y sus algoritmos.';
                        }
                      })()}
                    </div>
                  </div>
                );
              })()}
                </div>
              )}
            </div>
            </div>
          )}

      </div>
    </div>
  );
  };



  // Componente para el reporte de Eficiencia del Gasto
  const ReporteEficienciaGasto = ({ data, proyectoId, fechaDesde, fechaHasta, filtroDescripcion }) => {
    const [datosEficiencia, setDatosEficiencia] = useState([]);
    const [cargando, setCargando] = useState(false); // Cambiado a false para evitar carga inicial innecesaria
    const [error, setError] = useState('');
    const [cacheDatos, setCacheDatos] = useState(new Map()); // Cache para evitar consultas repetidas
    const [mostrarGlosario, setMostrarGlosario] = useState(false); // Estado para el acordeÃ³n del glosario



    // FunciÃ³n para obtener datos financieros (V0 y Real) - PARCIALES con cache
    const obtenerDatosFinancieros = async (periodo, fechaInicio = null, fechaFin = null, filtroDescripcion = null) => {
      try {
        // Crear clave de cache Ãºnica
        const cacheKey = `${proyectoId}-${periodo}-${fechaInicio}-${fechaFin}-${filtroDescripcion}`;
        
        // Verificar si los datos estÃ¡n en cache
        if (cacheDatos.has(cacheKey)) {
          console.log('ðŸš€ Usando datos del cache para:', cacheKey);
          return cacheDatos.get(cacheKey);
        }
        
        console.log('ðŸ” DEBUG obtenerDatosFinancieros - ParÃ¡metros recibidos:', {
          periodo,
          fechaInicio,
          fechaFin,
          filtroDescripcion
        });
        
        // Determinar el perÃ­odo a consultar
        let periodoAConsultar;
        let nombrePeriodo;
        
        if (periodo === 'mes') {
          // Determinar el perÃ­odo a consultar para el mes
          if (fechaInicio) {
            // Usar la fecha de inicio pasada como parÃ¡metro
            const [aÃ±o, mes] = fechaInicio.split('-');
            const fechaFiltro = new Date(parseInt(aÃ±o), parseInt(mes) - 1, 1);
            periodoAConsultar = fechaFiltro.toISOString().slice(0, 7) + '-01';
            nombrePeriodo = fechaFiltro.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
          } else {
            // Sin fecha de inicio - usar el mes actual
            const mesActual = new Date().toISOString().slice(0, 7);
            periodoAConsultar = mesActual + '-01';
            nombrePeriodo = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
          }
        } else if (periodo === 'acumulado') {
          // Acumulado estÃ¡ndar: desde enero hasta el mes actual
          periodoAConsultar = null; // Se manejarÃ¡ con periodo_desde y periodo_hasta
        } else if (periodo === 'filtrado') {
          // Acumulado con filtros: desde enero hasta el mes final del filtro
          periodoAConsultar = null; // Se manejarÃ¡ con periodo_desde y periodo_hasta
        } else {
          // Para anual, usar las fechas de filtro si estÃ¡n disponibles
          periodoAConsultar = null; // Se manejarÃ¡ con periodo_desde y periodo_hasta
        }
        
        let urlV0 = `${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=v0_parcial`;
        let urlReal = `${API_BASE}/datos_financieros.php?proyecto_id=${proyectoId}&tabla=real_parcial`;
        
        if (periodoAConsultar) {
          urlV0 += `&periodo=${periodoAConsultar}`;
          urlReal += `&periodo=${periodoAConsultar}`;
        } else if (periodo === 'acumulado') {
          // Para acumulado, traer todos los datos y filtrar en el frontend
          console.log('ðŸ” Acumulado: trayendo todos los datos para filtrar en frontend');
        } else if (periodo === 'filtrado' && fechaInicio && fechaFin) {
          // Para acumulado filtrado, traer todos los datos y filtrar en el frontend
          console.log('ðŸ” Filtrado: trayendo todos los datos para filtrar en frontend');
        } else if (periodo === 'anual') {
          // Para anual, traer todos los datos y filtrar por aÃ±o completo
          console.log('ðŸ” Anual: trayendo todos los datos para filtrar por aÃ±o completo');
        }
        
        console.log('ðŸ” Consultando datos financieros:', periodoAConsultar || 'sin filtro de perÃ­odo');
        console.log('ðŸ“… PerÃ­odo a consultar:', periodoAConsultar);
        console.log('ðŸ“… Nombre del perÃ­odo:', nombrePeriodo);
        console.log('ðŸ“ DescripciÃ³n filtrada:', filtroDescripcion);
        console.log('URL V0:', urlV0);
        console.log('URL Real Parcial:', urlReal);

        const [responseV0, responseReal] = await Promise.all([
          fetch(urlV0),
          fetch(urlReal)
        ]);

        const dataV0 = await responseV0.json();
        const dataReal = await responseReal.json();

        console.log('ðŸ“Š Datos V0 Parcial:', dataV0);
        console.log('ðŸ“Š Datos Real Parcial:', dataReal);
        console.log('ðŸ“Š Cantidad de registros V0:', dataV0.success ? dataV0.datos.length : 0);
        console.log('ðŸ“Š Cantidad de registros Real:', dataReal.success ? dataReal.datos.length : 0);
        
        // Debug adicional: mostrar las fechas de los datos recibidos
        if (dataV0.success && dataV0.datos.length > 0) {
          const fechasV0 = dataV0.datos.map(item => item.periodo).sort();
          console.log('ðŸ“… Fechas V0 recibidas:', fechasV0.slice(0, 5), '...', fechasV0.slice(-5));
          console.log('ðŸ“… Primera fecha V0:', fechasV0[0]);
          console.log('ðŸ“… Ãšltima fecha V0:', fechasV0[fechasV0.length - 1]);
        }
        
        if (dataReal.success && dataReal.datos.length > 0) {
          const fechasReal = dataReal.datos.map(item => item.periodo).sort();
          console.log('ðŸ“… Fechas Real recibidas:', fechasReal.slice(0, 5), '...', fechasReal.slice(-5));
          console.log('ðŸ“… Primera fecha Real:', fechasReal[0]);
          console.log('ðŸ“… Ãšltima fecha Real:', fechasReal[fechasReal.length - 1]);
        }

        // Obtener PLAN V. O. 2025 (KUSD) y GASTO REAL (KUSD)
        let planV0 = 0;
        let gastoReal = 0;
        
                  if (dataV0.success && dataV0.datos.length > 0) {
            if (periodo === 'acumulado') {
              // Filtrar datos desde enero hasta el mes actual
              const aÃ±oActual = new Date().getFullYear();
              const mesActual = new Date().getMonth() + 1;
              const fechaInicioAcumulado = `${aÃ±oActual}-01-01`;
              const fechaFinAcumulado = `${aÃ±oActual}-${mesActual.toString().padStart(2, '0')}-31`;
              
              const datosFiltrados = dataV0.datos.filter(item => {
                const itemFecha = new Date(item.periodo);
                const inicio = new Date(fechaInicioAcumulado);
                const fin = new Date(fechaFinAcumulado);
                return itemFecha >= inicio && itemFecha <= fin;
              });
              
              planV0 = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
              console.log('ðŸ’° Plan V0 (acumulado desde enero hasta mes actual):', planV0);
            } else if (periodo === 'filtrado' && fechaInicio && fechaFin) {
              // Filtrar datos desde enero hasta el mes final del filtro
              console.log('ðŸ” DEBUG - Procesando perÃ­odo filtrado');
              console.log('ðŸ” DEBUG - fechaFin original:', fechaFin, 'tipo:', typeof fechaFin);
              
              const [aÃ±oFin, mesFin] = fechaFin.split('-');
              const fechaInicioAcumulado = `${aÃ±oFin}-01-01`;
              
              // Calcular el Ãºltimo dÃ­a del mes correctamente
              const ultimoDiaDelMes = new Date(parseInt(aÃ±oFin), parseInt(mesFin), 0).getDate();
              const fechaFinAcumulado = `${aÃ±oFin}-${mesFin}-${ultimoDiaDelMes}`;
              
              console.log('ðŸ” DEBUG - DescomposiciÃ³n de fechaFin:', { aÃ±oFin, mesFin, ultimoDiaDelMes });
              console.log('ðŸ” DEBUG - Fechas calculadas:', { fechaInicioAcumulado, fechaFinAcumulado });
              console.log('ðŸ” Filtrado V0 - Datos totales:', dataV0.datos.length);
              console.log('ðŸ” Filtrado V0 - ParÃ¡metros recibidos:', { fechaInicio, fechaFin });
              
              const datosFiltrados = dataV0.datos.filter(item => {
                const itemFecha = new Date(item.periodo);
                const inicio = new Date(fechaInicioAcumulado);
                const fin = new Date(fechaFinAcumulado);
                const estaEnRango = itemFecha >= inicio && itemFecha <= fin;
                
                if (estaEnRango) {
                  console.log('ðŸ“… Item incluido:', item.periodo, 'monto:', item.monto);
                } else {
                  console.log('âŒ Item excluido:', item.periodo, 'monto:', item.monto, 'fecha item:', itemFecha, 'inicio:', inicio, 'fin:', fin);
                }
                
                return estaEnRango;
              });
              
              console.log('ðŸ” Filtrado V0 - Registros filtrados:', datosFiltrados.length);
              console.log('ðŸ” Filtrado V0 - Montos individuales:', datosFiltrados.map(item => ({ periodo: item.periodo, monto: item.monto })));
              planV0 = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
              console.log('ðŸ’° Plan V0 (acumulado filtrado):', planV0);
            } else if (periodo === 'anual') {
              // Filtrar datos del aÃ±o completo usando las fechas pasadas como parÃ¡metros
              let aÃ±oAConsultar;
              if (fechaInicio && fechaFin) {
                // Usar las fechas pasadas como parÃ¡metros
                const [aÃ±o] = fechaInicio.split('-');
                aÃ±oAConsultar = parseInt(aÃ±o);
              } else {
                // Sin fechas, usar el aÃ±o actual
                aÃ±oAConsultar = new Date().getFullYear();
              }
              
              const fechaInicioAnual = `${aÃ±oAConsultar}-01-01`;
              const fechaFinAnual = `${aÃ±oAConsultar}-12-31`;
              
              const datosFiltrados = dataV0.datos.filter(item => {
                const itemFecha = new Date(item.periodo);
                const inicio = new Date(fechaInicioAnual);
                const fin = new Date(fechaFinAnual);
                return itemFecha >= inicio && itemFecha <= fin;
              });
              
              planV0 = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
              console.log('ðŸ’° Plan V0 (anual):', planV0, 'para aÃ±o', aÃ±oAConsultar);
            } else {
              // Mes especÃ­fico - sumar todos los montos
              planV0 = dataV0.datos.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
              console.log('ðŸ’° Plan V0 (mes especÃ­fico):', planV0);
            }
          }

        // Obtener gasto real desde la tabla real_parcial
        if (dataReal.success && dataReal.datos.length > 0) {
          if (periodo === 'acumulado') {
            // Filtrar datos desde enero hasta el mes actual
            const aÃ±oActual = new Date().getFullYear();
            const mesActual = new Date().getMonth() + 1;
            const fechaInicioAcumulado = `${aÃ±oActual}-01-01`;
            const fechaFinAcumulado = `${aÃ±oActual}-${mesActual.toString().padStart(2, '0')}-31`;
            
            const datosFiltrados = dataReal.datos.filter(item => {
              const itemFecha = new Date(item.periodo);
              const inicio = new Date(fechaInicioAcumulado);
              const fin = new Date(fechaFinAcumulado);
              return itemFecha >= inicio && itemFecha <= fin;
            });
            
            gastoReal = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('ðŸ’° Gasto Real (acumulado desde enero hasta mes actual):', gastoReal);
          } else if (periodo === 'filtrado' && fechaInicio && fechaFin) {
            // Filtrar datos desde enero hasta el mes final del filtro
            console.log('ðŸ” DEBUG - Procesando perÃ­odo filtrado (Real)');
            console.log('ðŸ” DEBUG - fechaFin original (Real):', fechaFin, 'tipo:', typeof fechaFin);
            
            const [aÃ±oFin, mesFin] = fechaFin.split('-');
            const fechaInicioAcumulado = `${aÃ±oFin}-01-01`;
            
            // Calcular el Ãºltimo dÃ­a del mes correctamente
            const ultimoDiaDelMes = new Date(parseInt(aÃ±oFin), parseInt(mesFin), 0).getDate();
            const fechaFinAcumulado = `${aÃ±oFin}-${mesFin}-${ultimoDiaDelMes}`;
            
            console.log('ðŸ” DEBUG - DescomposiciÃ³n de fechaFin (Real):', { aÃ±oFin, mesFin, ultimoDiaDelMes });
            console.log('ðŸ” DEBUG - Fechas calculadas (Real):', { fechaInicioAcumulado, fechaFinAcumulado });
            console.log('ðŸ” Filtrado Real - Datos totales:', dataReal.datos.length);
            console.log('ðŸ” Filtrado Real - ParÃ¡metros recibidos:', { fechaInicio, fechaFin });
            
            const datosFiltrados = dataReal.datos.filter(item => {
              const itemFecha = new Date(item.periodo);
              const inicio = new Date(fechaInicioAcumulado);
              const fin = new Date(fechaFinAcumulado);
              const estaEnRango = itemFecha >= inicio && itemFecha <= fin;
              
              if (estaEnRango) {
                console.log('ðŸ“… Item incluido:', item.periodo, 'monto:', item.monto);
              } else {
                console.log('âŒ Item excluido:', item.periodo, 'monto:', item.monto, 'fecha item:', itemFecha, 'inicio:', inicio, 'fin:', fin);
              }
              
              return estaEnRango;
            });
            
            console.log('ðŸ” Filtrado Real - Registros filtrados:', datosFiltrados.length);
            console.log('ðŸ” Filtrado Real - Montos individuales:', datosFiltrados.map(item => ({ periodo: item.periodo, monto: item.monto })));
            gastoReal = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('ðŸ’° Gasto Real (acumulado filtrado):', gastoReal);
          } else if (periodo === 'anual') {
            // Filtrar datos del aÃ±o completo usando las fechas pasadas como parÃ¡metros
            let aÃ±oAConsultar;
            if (fechaInicio && fechaFin) {
              // Usar las fechas pasadas como parÃ¡metros
              const [aÃ±o] = fechaInicio.split('-');
              aÃ±oAConsultar = parseInt(aÃ±o);
            } else {
              // Sin fechas, usar el aÃ±o actual
              aÃ±oAConsultar = new Date().getFullYear();
            }
            
            const fechaInicioAnual = `${aÃ±oAConsultar}-01-01`;
            const fechaFinAnual = `${aÃ±oAConsultar}-12-31`;
            
            const datosFiltrados = dataReal.datos.filter(item => {
              const itemFecha = new Date(item.periodo);
              const inicio = new Date(fechaInicioAnual);
              const fin = new Date(fechaFinAnual);
              return itemFecha >= inicio && itemFecha <= fin;
            });
            
            gastoReal = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('ðŸ’° Gasto Real (anual):', gastoReal, 'para aÃ±o', aÃ±oAConsultar);
          } else {
            // Mes especÃ­fico - sumar todos los montos
            gastoReal = dataReal.datos.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            console.log('ðŸ’° Gasto Real (mes especÃ­fico):', gastoReal);
          }
        }

        // CUMPLI. (A)(%) = (GASTO REAL / PLAN V. O.) * 100
        const cumplimientoA = planV0 > 0 ? (gastoReal / planV0) * 100 : 0;
        console.log('ðŸ“ˆ Cumplimiento A:', cumplimientoA);

        const resultado = {
          planV0: planV0,
          gastoReal: gastoReal,
          cumplimientoA: cumplimientoA
        };
        
        // Guardar en cache
        setCacheDatos(prevCache => {
          const newCache = new Map(prevCache);
          newCache.set(cacheKey, resultado);
          console.log('ðŸ’¾ Datos guardados en cache para:', cacheKey);
          return newCache;
        });
        
        return resultado;
      } catch (error) {
        console.error('âŒ Error obteniendo datos financieros:', error);
        return { planV0: 0, gastoReal: 0, cumplimientoA: 0 };
      }
    };

    // FunciÃ³n para obtener datos de PROG. V0 desde av_fisico_v0
    const obtenerDatosCumplimientoFisico = async (periodo, fechaInicio = null, fechaFin = null) => {
      try {
        console.log('ðŸ” Debug - obtenerDatosCumplimientoFisico:', { periodo, fechaInicio, fechaFin });
        
        // Construir la URL para consultar la tabla av_fisico_v0
        let url = `${API_BASE}/eficiencia_gasto/avance_fisico_v0.php?proyecto_id=${proyectoId}`;
        
        // Aplicar filtros de fecha segÃºn el perÃ­odo
        if (periodo === 'mes') {
          // Determinar el perÃ­odo a consultar para el mes
          if (fechaInicio) {
            // Usar la fecha de inicio pasada como parÃ¡metro
            const [aÃ±o, mes] = fechaInicio.split('-');
            const fechaFiltro = new Date(parseInt(aÃ±o), parseInt(mes) - 1, 1);
            const mesFiltro = fechaFiltro.toISOString().slice(0, 7);
            url += `&periodo_desde=${mesFiltro}-01&periodo_hasta=${mesFiltro}-31`;
          } else {
            // Sin fecha de inicio - usar el mes actual
            const mesActual = new Date().toISOString().slice(0, 7);
            url += `&periodo_desde=${mesActual}-01&periodo_hasta=${mesActual}-31`;
          }
        } else if (periodo === 'acumulado') {
          // Acumulado estÃ¡ndar: desde enero hasta el mes actual
          const aÃ±oActual = new Date().getFullYear();
          const mesActual = new Date().getMonth() + 1;
          const fechaInicioAcumulado = `${aÃ±oActual}-01-01`;
          const fechaFinAcumulado = `${aÃ±oActual}-${mesActual.toString().padStart(2, '0')}-31`;
          url += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
          console.log('ðŸ” Acumulado fÃ­sico: desde', fechaInicioAcumulado, 'hasta', fechaFinAcumulado);
        } else if (periodo === 'filtrado') {
          // Acumulado con filtros: desde enero hasta el mes final del filtro
          if (fechaInicio && fechaFin) {
            const [aÃ±oFin, mesFin] = fechaFin.split('-');
            const fechaInicioAcumulado = `${aÃ±oFin}-01-01`;
            const fechaFinAcumulado = `${aÃ±oFin}-${mesFin}-31`;
            url += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
            console.log('ðŸ” Filtrado fÃ­sico: desde', fechaInicioAcumulado, 'hasta', fechaFinAcumulado);
          }
        } else if (periodo === 'anual') {
          // Determinar el aÃ±o a consultar usando las fechas pasadas como parÃ¡metros
          let aÃ±oAConsultar;
          if (fechaInicio && fechaFin) {
            // Usar las fechas pasadas como parÃ¡metros
            const [aÃ±o] = fechaInicio.split('-');
            aÃ±oAConsultar = parseInt(aÃ±o);
          } else {
            // Sin fechas, usar el aÃ±o actual
            aÃ±oAConsultar = new Date().getFullYear();
          }
          
          const fechaInicioAnual = `${aÃ±oAConsultar}-01-01`;
          const fechaFinAnual = `${aÃ±oAConsultar}-12-31`;
          url += `&periodo_desde=${fechaInicioAnual}&periodo_hasta=${fechaFinAnual}`;
          console.log('ðŸ” Anual fÃ­sico: desde', fechaInicioAnual, 'hasta', fechaFinAnual, 'para aÃ±o', aÃ±oAConsultar);
        }

        console.log('ðŸ” Consultando datos de PROG. V0 desde av_fisico_v0:');
        console.log('URL:', url);

        const response = await fetch(url);
        console.log('ðŸ“¡ Response status:', response.status);
        console.log('ðŸ“¡ Response ok:', response.ok);
        
        const data = await response.json();
        console.log('ðŸ“Š Datos PROG. V0:', data);
        console.log('ðŸ“Š Estructura de respuesta:', {
          success: data.success,
          datos: data.datos,
          total: data.total,
          hasData: data.datos && data.datos.length > 0
        });

        if (data.success && data.datos && data.datos.length > 0) {
          console.log('ðŸ” Procesando datos encontrados...');
          console.log('ðŸ“Š Primeros 3 registros:', data.datos.slice(0, 3));
          
          // Obtener valores de api_parcial de la tabla av_fisico_v0
          let proyeccionV0 = 0;
          
          // PROG. V. O. 2025 (%) = sumar todos los valores api_parcial del perÃ­odo
          proyeccionV0 = data.datos.reduce((sum, item) => {
            const valor = parseFloat(item.api_parcial) || 0;
            console.log(`ðŸ“Š Item ${item.periodo}: api_parcial = ${item.api_parcial} -> parseFloat = ${valor}`);
            return sum + valor;
          }, 0);
          
          // Convertir a porcentaje: el valor ya estÃ¡ en decimal (0.0071 = 0.71%)
          // Solo multiplicamos por 100 para mostrarlo como porcentaje
          proyeccionV0 = proyeccionV0 * 100;
          
          console.log('ðŸ“ˆ ProyecciÃ³n V0 (suma de api_parcial):', proyeccionV0);
          console.log('ðŸ“ˆ ProyecciÃ³n V0 convertida a porcentaje: %', proyeccionV0.toFixed(2));

          // Ahora consultar av_fisico_real para obtener el Avance Fisico
          console.log('ðŸ” Consultando av_fisico_real para Avance Fisico...');
          let avanceFisico = 0;
          
          try {
            // Construir URL para av_fisico_real con los mismos filtros
            let urlReal = `${API_BASE}/eficiencia_gasto/avance_fisico_real.php?proyecto_id=${proyectoId}`;
            
            // Aplicar los mismos filtros de fecha
            if (periodo === 'mes') {
              if (fechaInicio) {
                const [aÃ±o, mes] = fechaInicio.split('-');
                const fechaFiltro = new Date(parseInt(aÃ±o), parseInt(mes) - 1, 1);
                const mesFiltro = fechaFiltro.toISOString().slice(0, 7);
                urlReal += `&periodo_desde=${mesFiltro}-01&periodo_hasta=${mesFiltro}-31`;
              } else {
                const mesActual = new Date().toISOString().slice(0, 7);
                urlReal += `&periodo_desde=${mesActual}-01&periodo_hasta=${mesActual}-31`;
              }
            } else if (periodo === 'acumulado') {
              const aÃ±oActual = new Date().getFullYear();
              const mesActual = new Date().getMonth() + 1;
              const fechaInicioAcumulado = `${aÃ±oActual}-01-01`;
              const fechaFinAcumulado = `${aÃ±oActual}-${mesActual.toString().padStart(2, '0')}-31`;
              urlReal += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
            } else if (periodo === 'filtrado') {
              if (fechaInicio && fechaFin) {
                const [aÃ±oFin, mesFin] = fechaFin.split('-');
                const fechaInicioAcumulado = `${aÃ±oFin}-01-01`;
                const fechaFinAcumulado = `${aÃ±oFin}-${mesFin}-31`;
                urlReal += `&periodo_desde=${fechaInicioAcumulado}&periodo_hasta=${fechaFinAcumulado}`;
              }
            } else if (periodo === 'anual') {
              let aÃ±oAConsultar;
              if (fechaInicio && fechaFin) {
                const [aÃ±o] = fechaInicio.split('-');
                aÃ±oAConsultar = parseInt(aÃ±o);
              } else {
                aÃ±oAConsultar = new Date().getFullYear();
              }
              
              const fechaInicioAnual = `${aÃ±oAConsultar}-01-01`;
              const fechaFinAnual = `${aÃ±oAConsultar}-12-31`;
              urlReal += `&periodo_desde=${fechaInicioAnual}&periodo_hasta=${fechaFinAnual}`;
            }

            console.log('ðŸ” URL av_fisico_real:', urlReal);
            
            const responseReal = await fetch(urlReal);
            const dataReal = await responseReal.json();
            
            console.log('ðŸ“Š Datos av_fisico_real:', dataReal);
            
            if (dataReal.success && dataReal.datos && dataReal.datos.length > 0) {
              // Sumar todos los valores api_parcial del perÃ­odo
              avanceFisico = dataReal.datos.reduce((sum, item) => {
                const valor = parseFloat(item.api_parcial) || 0;
                console.log(`ðŸ“Š Item Real ${item.periodo}: api_parcial = ${item.api_parcial} -> parseFloat = ${valor}`);
                return sum + valor;
              }, 0);
              
              // Convertir a porcentaje
              avanceFisico = avanceFisico * 100;
              
              console.log('ðŸ“ˆ Avance Fisico (suma de api_parcial):', avanceFisico);
              console.log('ðŸ“ˆ Avance Fisico convertido a porcentaje: %', avanceFisico.toFixed(2));
            } else {
              console.log('âš ï¸ No se encontraron datos en av_fisico_real');
              avanceFisico = 0;
            }
          } catch (error) {
            console.error('âŒ Error consultando av_fisico_real:', error);
            avanceFisico = 0;
          }

          // Calcular cumplimiento B: (AVANC. FÃSICO / PROG. V. O.) * 100
          let cumplimientoB = 0;
          if (proyeccionV0 > 0) {
            cumplimientoB = (avanceFisico / proyeccionV0) * 100;
          }
          console.log('ðŸ“ˆ Cumplimiento B calculado: %', cumplimientoB.toFixed(2));
          
          return {
            proyeccionV0: proyeccionV0,    // Valor real de av_fisico_v0
            avanceFisico: avanceFisico,    // Valor real de av_fisico_real
            cumplimientoB: cumplimientoB   // CÃ¡lculo correcto
          };
        } else {
          console.log('âŒ No se encontraron datos o respuesta invÃ¡lida');
          console.log('âŒ data.success:', data.success);
          console.log('âŒ data.datos:', data.datos);
          console.log('âŒ data.total:', data.total);
          
          return {
            proyeccionV0: 0,      // Sin datos (ya estÃ¡ en porcentaje)
            avanceFisico: 0,      // Sin datos (ya estÃ¡ en porcentaje)
            cumplimientoB: 0      // Sin cÃ¡lculo
          };
        }
              } catch (error) {
          console.error('âŒ Error en obtenerDatosCumplimientoFisico:', error);
          return { proyeccionV0: 0, avanceFisico: null, cumplimientoB: 0 };
        }
    };

    // FunciÃ³n para calcular la eficiencia del gasto
    const calcularEficienciaGasto = (cumplimientoB, cumplimientoA) => {
      if (cumplimientoA <= 0) return 0;
      // EFICIEN. GASTO (%) = (CUMPLI. (B)(%)) / (CUMPLI. (A)(%))
      return (cumplimientoB / cumplimientoA) * 100;
    };

    // FunciÃ³n para calcular la nota segÃºn la polÃ­tica de la imagen
    const calcularNota = (eficiencia) => {
      // PolÃ­tica de notas segÃºn la imagen:
      // < 80% = 1
      // 90% = 2  
      // 100% = 3
      // 105% = 4
      // > 110% = 5
      if (eficiencia < 80) return 1.00;
      if (eficiencia === 90) return 2.00;
      if (eficiencia === 100) return 3.00;
      if (eficiencia === 105) return 4.00;
      if (eficiencia > 110) return 5.00;
      
      // Para valores entre rangos, usar la nota mÃ¡s cercana
      if (eficiencia >= 80 && eficiencia < 90) return 1.00;
      if (eficiencia > 90 && eficiencia < 100) return 2.00;
      if (eficiencia > 100 && eficiencia < 105) return 3.00;
      if (eficiencia > 105 && eficiencia <= 110) return 4.00;
      
      return 1.00; // Valor por defecto
    };

    // Cargar datos cuando el componente se monta (optimizado con debounce)
    useEffect(() => {
      // Solo cargar si hay proyectoId (fechaHasta es opcional)
      if (!proyectoId) {
        console.log('âš ï¸ No se cargan datos: falta proyectoId');
        return;
      }
      
      console.log('âœ… Condiciones cumplidas para cargar datos:', {
        proyectoId,
        fechaHasta,
        fechaDesde,
        filtroDescripcion
      });
      
      // Debounce para evitar mÃºltiples llamadas
      const timeoutId = setTimeout(async () => {
      const cargarDatosEficiencia = async () => {
          console.log('ðŸš€ INICIANDO carga de datos de eficiencia:', {
            proyectoId,
            fechaDesde,
            fechaHasta,
            filtroDescripcion
          });
          
        setCargando(true);
        setError('');

        try {
          // Determinar los perÃ­odos basados en los filtros de fecha
          let periodos = [];
          
          // Determinar el perÃ­odo del mes (siempre el primer perÃ­odo)
          let nombrePeriodoMes;
          let tipoPeriodoMes = 'mes';
          let fechaMesFiltro = null;
          
          if (fechaDesde && fechaHasta) {
            // Si hay filtros, verificar si es el mismo mes
            if (fechaDesde === fechaHasta) {
              // Caso 1: Filtros del mismo mes (ej: Julio 2025, Julio 2025)
              const [aÃ±o, mes] = fechaDesde.split('-');
              const fechaFiltro = new Date(parseInt(aÃ±o), parseInt(mes) - 1, 1);
              const mesNombre = fechaFiltro.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const aÃ±oNumero = fechaFiltro.getFullYear();
              nombrePeriodoMes = `PERIODO ${mesNombre}-${aÃ±oNumero}`;
              tipoPeriodoMes = 'mes';
              fechaMesFiltro = fechaDesde; // Usar la fecha del filtro
            } else {
              // Caso 2: Filtros de rango - usar el mes final del filtro
              const [aÃ±oFin, mesFin] = fechaHasta.split('-');
              const fechaFin = new Date(parseInt(aÃ±oFin), parseInt(mesFin) - 1, 1);
              const mesNombre = fechaFin.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const aÃ±oNumero = fechaFin.getFullYear();
              nombrePeriodoMes = `PERIODO ${mesNombre}-${aÃ±oNumero}`;
              tipoPeriodoMes = 'mes';
              fechaMesFiltro = fechaHasta; // Usar la fecha final del filtro
            }
          } else if (fechaHasta) {
            // Caso 3: Solo fecha hasta (ej: -----------, Julio 2025)
            const [aÃ±o, mes] = fechaHasta.split('-');
            const fechaFiltro = new Date(parseInt(aÃ±o), parseInt(mes) - 1, 1);
            const mesNombre = fechaFiltro.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const aÃ±oNumero = fechaFiltro.getFullYear();
            nombrePeriodoMes = `PERIODO ${mesNombre}-${aÃ±oNumero}`;
            tipoPeriodoMes = 'mes';
            fechaMesFiltro = fechaHasta; // Usar la fecha hasta
          } else {
            // Caso 4: Sin filtros - mes actual
            const mesActual = new Date();
            const mesNombre = mesActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const aÃ±oNumero = mesActual.getFullYear();
            nombrePeriodoMes = `PERIODO ${mesNombre}-${aÃ±oNumero}`;
            tipoPeriodoMes = 'mes';
            fechaMesFiltro = mesActual.toISOString().slice(0, 7); // Usar mes actual
          }
          
          // Determinar el perÃ­odo acumulado (segundo perÃ­odo)
          let nombrePeriodoAcumulado;
          let tipoPeriodoAcumulado = 'acumulado';
          let fechaAcumuladoInicio = null;
          let fechaAcumuladoFin = null;
          
          // Si solo tenemos fechaHasta, establecer fechaDesde como enero del mismo aÃ±o
          let fechaDesdeAjustada = fechaDesde;
          if (!fechaDesde && fechaHasta) {
            const [aÃ±o] = fechaHasta.split('-');
            fechaDesdeAjustada = `${aÃ±o}-01`;
            console.log('ðŸ” Debug - Solo fechaHasta detectada, estableciendo fechaDesde como:', fechaDesdeAjustada);
          }
          
          console.log('ðŸ” Debug - Fechas para acumulado:', { fechaDesde, fechaHasta, fechaDesdeAjustada });
          
          if (fechaDesdeAjustada && fechaHasta) {
            console.log('ðŸ” Debug - Detectando tipo de filtro:', { fechaDesdeAjustada, fechaHasta, esMismoMes: fechaDesdeAjustada === fechaHasta });
            
            // Si hay filtros, verificar si es el mismo mes o rango
            if (fechaDesdeAjustada === fechaHasta) {
              // Caso 1: Mismo mes (ej: Agosto 2025, Agosto 2025) - acumulado desde enero hasta el mes del filtro
              const [aÃ±o, mes] = fechaDesdeAjustada.split('-');
              const mesNombre = new Date(parseInt(aÃ±o), parseInt(mes) - 1, 1).toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const aÃ±oNumero = parseInt(aÃ±o);
              nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesNombre}. ${aÃ±oNumero}`;
              fechaAcumuladoInicio = `${aÃ±o}-01-01`;
              fechaAcumuladoFin = fechaDesdeAjustada;
              tipoPeriodoAcumulado = 'filtrado';
              console.log('ðŸ” Debug - Mismo mes detectado, acumulado desde enero hasta el mes del filtro:', nombrePeriodoAcumulado);
            } else {
              // Caso 2: Rango de fechas (ej: Enero 2025, Julio 2025) - acumulado desde enero hasta julio
              const [aÃ±oFin, mesFin] = fechaHasta.split('-');
              const fechaFin = new Date(parseInt(aÃ±oFin), parseInt(mesFin) - 1, 1);
              const mesFinNombre = fechaFin.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
              const aÃ±oNumero = parseInt(aÃ±oFin);
              
              nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesFinNombre}. ${aÃ±oNumero}`;
              fechaAcumuladoInicio = `${aÃ±oFin}-01-01`;
              fechaAcumuladoFin = fechaHasta;
              tipoPeriodoAcumulado = 'filtrado';
              console.log('ðŸ” Debug - Rango de fechas detectado, acumulado desde enero hasta el mes final:', { 
                nombrePeriodoAcumulado, 
                tipoPeriodoAcumulado,
                fechaAcumuladoInicio,
                fechaAcumuladoFin
              });
            }
          } else if (fechaHasta) {
            // Caso 3: Solo fecha hasta (ej: -----------, Julio 2025) - acumulado desde enero hasta julio
            const [aÃ±o, mes] = fechaHasta.split('-');
            const fechaFin = new Date(parseInt(aÃ±o), parseInt(mes) - 1, 1);
            const mesFinNombre = fechaFin.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const aÃ±oNumero = parseInt(aÃ±o);
            
            nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesFinNombre}. ${aÃ±oNumero}`;
            fechaAcumuladoInicio = `${aÃ±o}-01-01`;
            fechaAcumuladoFin = fechaHasta;
            tipoPeriodoAcumulado = 'filtrado';
            console.log('ðŸ” Debug - Solo fecha hasta, acumulado desde enero hasta el mes especificado:', nombrePeriodoAcumulado);
          } else {
            // Caso 4: Sin filtros - acumulado desde enero hasta mes actual
            const mesActual = new Date();
            const mesNombre = mesActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
            const aÃ±oNumero = mesActual.getFullYear();
            nombrePeriodoAcumulado = `PERIODO DESDE ENE. - ${mesNombre}. ${aÃ±oNumero}`;
            fechaAcumuladoInicio = `${aÃ±oNumero}-01-01`;
            fechaAcumuladoFin = mesActual.toISOString().slice(0, 7);
          }
          
          // Determinar el perÃ­odo anual (tercer perÃ­odo)
          let nombrePeriodoAnual = 'PERIODO AÃ‘O 2025';
          let aÃ±oAnual = null;
          
          if (fechaDesde && fechaHasta) {
            // Si hay filtros, usar el aÃ±o del filtro
            if (fechaDesde === fechaHasta) {
              // Caso 1: Mismo mes - usar el aÃ±o del filtro
              const [aÃ±o] = fechaDesde.split('-');
              nombrePeriodoAnual = `PERIODO AÃ‘O ${aÃ±o}`;
              aÃ±oAnual = parseInt(aÃ±o);
            } else {
              // Caso 2: Rango de fechas - usar el aÃ±o del filtro final
              const [aÃ±oFin] = fechaHasta.split('-');
              nombrePeriodoAnual = `PERIODO AÃ‘O ${aÃ±oFin}`;
              aÃ±oAnual = parseInt(aÃ±oFin);
            }
          } else if (fechaHasta) {
            // Caso 3: Solo fecha hasta - usar el aÃ±o de la fecha hasta
            const [aÃ±o] = fechaHasta.split('-');
            nombrePeriodoAnual = `PERIODO AÃ‘O ${aÃ±o}`;
            aÃ±oAnual = parseInt(aÃ±o);
          } else {
            // Caso 4: Sin filtros - usar el aÃ±o actual
            const aÃ±oActual = new Date().getFullYear();
            nombrePeriodoAnual = `PERIODO AÃ‘O ${aÃ±oActual}`;
            aÃ±oAnual = aÃ±oActual;
          }
          
          // Construir los perÃ­odos
          periodos = [
            { 
              nombre: nombrePeriodoMes, 
              tipo: tipoPeriodoMes, 
              fechaInicio: fechaMesFiltro, 
              fechaFin: fechaMesFiltro 
            },
            { 
              nombre: nombrePeriodoAcumulado, 
              tipo: tipoPeriodoAcumulado, 
              fechaInicio: fechaAcumuladoInicio, 
              fechaFin: fechaAcumuladoFin 
            },
            { 
              nombre: nombrePeriodoAnual, 
              tipo: 'anual',
              fechaInicio: `${aÃ±oAnual}-01-01`,
              fechaFin: `${aÃ±oAnual}-12-31`
            }
          ];

          console.log('ðŸ” Debug - PerÃ­odos construidos:', periodos);

          const datosCompletos = [];

          for (const periodo of periodos) {
            console.log('ðŸ” Debug - Procesando perÃ­odo:', { 
              nombre: periodo.nombre, 
              tipo: periodo.tipo, 
              fechaInicio: periodo.fechaInicio, 
              fechaFin: periodo.fechaFin 
            });
            
            // Debug especÃ­fico para el perÃ­odo acumulado
            if (periodo.nombre.includes('ENE. - JUNIO')) {
              console.log('ðŸ” DEBUG ESPECÃFICO - PerÃ­odo ENE-JUNIO detectado');
              console.log('ðŸ” DEBUG ESPECÃFICO - fechaInicio:', periodo.fechaInicio);
              console.log('ðŸ” DEBUG ESPECÃFICO - fechaFin:', periodo.fechaFin);
              console.log('ðŸ” DEBUG ESPECÃFICO - tipo:', periodo.tipo);
            }
            
            // Obtener datos financieros
            const datosFinancieros = await obtenerDatosFinancieros(periodo.tipo, periodo.fechaInicio, periodo.fechaFin, filtroDescripcion);
            
            // Obtener datos de cumplimiento fÃ­sico
            const datosFisicos = await obtenerDatosCumplimientoFisico(periodo.tipo, periodo.fechaInicio, periodo.fechaFin);
            
            console.log('ðŸ” Debug - Resultados para', periodo.nombre, ':', {
              financieros: datosFinancieros,
              fisicos: datosFisicos
            });
            
            // Calcular eficiencia del gasto
            const eficienciaGasto = calcularEficienciaGasto(
              datosFisicos.cumplimientoB, 
              datosFinancieros.cumplimientoA
            );

            // Calcular nota
            const nota = calcularNota(eficienciaGasto);

            datosCompletos.push({
              periodo: periodo.nombre,
              planV0: datosFinancieros.planV0,
              gastoReal: datosFinancieros.gastoReal,
              cumplimientoA: datosFinancieros.cumplimientoA,
              proyeccionV0: datosFisicos.proyeccionV0,
              avanceFisico: datosFisicos.avanceFisico,
              cumplimientoB: datosFisicos.cumplimientoB,
              eficienciaGasto: eficienciaGasto,
              nota: nota
            });
          }

          console.log('ðŸ“Š DATOS COMPLETOS obtenidos:', {
            cantidadPeriodos: periodos.length,
            datosCompletos: datosCompletos,
            cantidadDatos: datosCompletos.length
          });

          setDatosEficiencia(datosCompletos);
        } catch (error) {
          console.error('Error cargando datos de eficiencia:', error);
          setError('Error al cargar los datos de eficiencia del gasto');
        } finally {
          setCargando(false);
        }
      };

        cargarDatosEficiencia();
      }, 300); // Debounce de 300ms
      
      // Cleanup del timeout
      return () => clearTimeout(timeoutId);
    }, [proyectoId, fechaDesde, fechaHasta, filtroDescripcion]);



    if (cargando) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '30vh',
          fontSize: '16px',
          color: '#16355D',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderRadius: '8px',
          border: '1px solid #e3e6f0',
          margin: '20px 0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              marginBottom: '10px',
              animation: 'spin 1s linear infinite'
            }}>
              âš¡
            </div>
            <div>Actualizando datos...</div>
          </div>
            </div>
      );
    }

    if (error) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#dc3545'
        }}>
          {error}
            </div>
      );
    }

    // Debug: Verificar estado de los datos
    console.log('ðŸ” DEBUG ReporteEficienciaGasto:', {
      datosEficiencia: datosEficiencia,
      length: datosEficiencia.length,
      proyectoId,
      fechaDesde,
      fechaHasta,
      filtroDescripcion,
      cargando,
      error
    });

    if (datosEficiencia.length === 0) {
      return (
            <div style={{
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#16355D',
              textAlign: 'center'
            }}>
          <div style={{ marginBottom: '20px' }}>
            ðŸ“Š No hay datos disponibles para generar el reporte de eficiencia del gasto
            </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            AsegÃºrate de que existan datos en las tablas de vectores y cumplimiento fÃ­sico para el proyecto seleccionado.
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
            Debug: proyectoId={proyectoId}, fechaHasta={fechaHasta}, cargando={cargando ? 'SÃ­' : 'No'}
          </div>
        </div>
      );
    }

    return (
    <div style={{ width: '100%', padding: '20px' }}>
        <h3 style={{ color: '#16355D', marginBottom: '20px', textAlign: 'center' }}>
          EFICIENCIA DEL GASTO FÃSICO - FINANCIERO
        </h3>
        
        {/* Filtros compactos */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Campo Desde oculto */}
          <div style={{ display: 'none' }}>
            <label style={{ color: '#060270', fontWeight: 600, fontSize: 12 }}>Desde:</label>
            <input
              type="month"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              style={{
                border: '1px solid #1d69db',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 12,
                outline: 'none',
                width: '140px'
              }}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e3e6f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ 
                color: '#FF6B35', 
                fontWeight: 700, 
                fontSize: 13,
                letterSpacing: '0.5px'
              }} title="Filtro principal que ajusta automÃ¡ticamente Desde, Hasta y DescripciÃ³n">
                Seleccione PerÃ­odo:
              </label>
            <input
              type="month"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              style={{
                  border: '2px solid #FF6B35',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 12,
                outline: 'none',
                  width: '140px',
                  backgroundColor: '#FFF5F2',
                  fontWeight: 600,
                  color: '#16355D',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FF4500';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#FF6B35';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          
          {/* Campo DescripciÃ³n oculto */}
          <div style={{ display: 'none' }}>
            <label style={{ color: '#060270', fontWeight: 600, fontSize: 12 }}>DescripciÃ³n:</label>
            <select
              value={filtroDescripcion}
              onChange={e => setFiltroDescripcion(e.target.value)}
              style={{
                border: '1px solid #1d69db',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 12,
                outline: 'none',
                width: '160px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Todas</option>
              {descripcionesDisponibles.map((descripcion, index) => (
                <option key={index} value={descripcion}>
                  {descripcion}
                </option>
              ))}
            </select>
          </div>
          
          {(fechaDesde || fechaHasta || filtroDescripcion) && (
            <button
              onClick={() => {
                setFechaDesde('');
                setFechaHasta('');
                setFiltroDescripcion('');
              }}
              style={{
                background: '#FF8C00',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Limpiar filtros"
            >
              ðŸ§¹
            </button>
          )}
        </div>
        
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#16355D', color: 'white' }}>
                <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd' }}>
                  AVANCES
                </th>
                <th colSpan="3" style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd' }}>
                  AVANCE FINANCIERO
                </th>
                <th colSpan="3" style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd' }}>
                  AVANCE FÃSICO
                </th>
                <th colSpan="2" style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd' }}>
                  EFICIENCIA
                </th>
              </tr>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#16355D',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  PERÃODOS
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#16355D',
                  color: 'white'
                }}>
                  Plan V0
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#ffc107',
                  color: 'black'
                }}>
                  Gasto Real
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  <CustomTooltip 
                    content="ðŸ“Š CUMPLIMIENTO FINANCIERO - FÃ³rmula: (Gasto Real Ã· Plan V0) Ã— 100. Eficiencia presupuestaria: >100% = sobre ejecuciÃ³n, <100% = sub ejecuciÃ³n."
                    position="top"
                  >
                    <span style={{ 
                      cursor: 'help', 
                      borderBottom: '2px dotted rgba(255,255,255,0.7)',
                      paddingBottom: '2px',
                      transition: 'all 0.2s ease',
                      ':hover': {
                        borderBottomColor: 'rgba(255,255,255,1)'
                      }
                    }}>
                      Cumpli. Financiero (%)
                    </span>
                  </CustomTooltip>
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#16355D',
                  color: 'white'
                }}>
                  Prog. V0
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#ffc107',
                  color: 'black'
                }}>
                  Avance Fisico
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  <CustomTooltip 
                    content="ðŸ“‹ CUMPLIMIENTO FÃSICO - FÃ³rmula: (Avance FÃ­sico Ã· Prog. V0) Ã— 100. Eficiencia operacional: >100% = adelanto fÃ­sico, <100% = retraso fÃ­sico."
                    position="top"
                  >
                    <span style={{ 
                      cursor: 'help', 
                      borderBottom: '2px dotted rgba(255,255,255,0.7)',
                      paddingBottom: '2px',
                      transition: 'all 0.2s ease'
                    }}>
                      Cumpli. FÃ­sico (%)
                    </span>
                  </CustomTooltip>
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  <CustomTooltip 
                    content="ðŸŽ¯ EFICIENCIA DEL GASTO - FÃ³rmula: (Cumpli. FÃ­sico Ã· Cumpli. Financiero) Ã— 100. Ãndice clave: >100% = mayor eficiencia fÃ­sica, <100% = menor eficiencia fÃ­sica."
                    position="top"
                  >
                    <span style={{ 
                      cursor: 'help', 
                      borderBottom: '2px dotted rgba(255,255,255,0.7)',
                      paddingBottom: '2px',
                      transition: 'all 0.2s ease'
                    }}>
                      EFICIEN. GASTO (%)
                    </span>
                  </CustomTooltip>
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '1px solid #ddd', 
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white'
                }}>
                  <CustomTooltip 
                    content="â­ CALIFICACIÃ“N - Sistema de evaluaciÃ³n: 5.0 (>110% Excelente), 4.0 (105-110% Bueno), 3.0 (100-105% Regular), 2.0 (90-100% Deficiente), 1.0 (<90% CrÃ­tico)."
                    position="top"
                  >
                    <span style={{ 
                      cursor: 'help', 
                      borderBottom: '2px dotted rgba(255,255,255,0.7)',
                      paddingBottom: '2px',
                      transition: 'all 0.2s ease'
                    }}>
                      NOTA
                    </span>
                  </CustomTooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {datosEficiencia.map((fila, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {fila.periodo}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}>
                    {fila.planV0.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}>
                    {fila.gastoReal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {fila.cumplimientoA.toFixed(2)}%
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}>
                    {fila.proyeccionV0 !== null ? `${fila.proyeccionV0.toFixed(2)}%` : ''}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}>
                    {fila.avanceFisico !== null ? `${fila.avanceFisico.toFixed(2)}%` : ''}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {fila.cumplimientoB !== null ? `${fila.cumplimientoB.toFixed(2)}%` : ''}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: fila.eficienciaGasto >= 150 ? '#28a745' : fila.eficienciaGasto >= 100 ? '#ffc107' : '#dc3545'
                  }}>
                    {fila.eficienciaGasto.toFixed(2)}%
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: fila.nota >= 4 ? '#28a745' : fila.nota >= 3 ? '#ffc107' : '#dc3545'
                  }}>
                    {fila.nota.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>

        {/* AcordeÃ³n del Glosario TÃ©cnico */}
        <div style={{ 
          marginTop: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          overflow: 'hidden'
        }}>
          {/* BotÃ³n del acordeÃ³n */}
          <button
            onClick={() => setMostrarGlosario(!mostrarGlosario)}
            style={{
              width: '100%',
              padding: '15px 20px',
              backgroundColor: mostrarGlosario ? '#16355D' : '#ffffff',
              color: mostrarGlosario ? '#ffffff' : '#16355D',
              border: 'none',
              borderRadius: mostrarGlosario ? '0' : '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease',
              boxShadow: mostrarGlosario ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!mostrarGlosario) {
                e.target.style.backgroundColor = '#e3f2fd';
                e.target.style.color = '#16355D';
              }
            }}
            onMouseLeave={(e) => {
              if (!mostrarGlosario) {
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.color = '#16355D';
              }
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            ðŸ“Š GLOSARIO TÃ‰CNICO - EFICIENCIA DEL GASTO
            </span>
            <span style={{ 
              fontSize: '18px',
              transition: 'transform 0.3s ease',
              transform: mostrarGlosario ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              â–¼
            </span>
          </button>
          
          {/* Contenido del acordeÃ³n */}
          {mostrarGlosario && (
            <div style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #dee2e6',
              animation: 'slideDown 0.3s ease-out'
            }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
            <div>
              <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                ðŸ’° AVANCE FINANCIERO
              </h5>
              <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                <li><strong>Plan V0:</strong> Presupuesto planificado segÃºn VersiÃ³n 0 (USD). Representa la proyecciÃ³n financiera base del proyecto.</li>
                <li><strong>Gasto Real:</strong> EjecuciÃ³n financiera real ejecutada en el perÃ­odo analizado (USD). Refleja el desembolso efectivo.</li>
                <li><strong>Cumpli (%):</strong> Porcentaje de cumplimiento financiero = (Gasto Real / Plan V0) Ã— 100. Indica la eficiencia presupuestaria.</li>
              </ul>
            </div>
            
            <div>
              <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                ðŸ“ˆ AVANCE FÃSICO
              </h5>
              <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
                <li><strong>Prog. V0:</strong> ProyecciÃ³n fÃ­sica planificada segÃºn VersiÃ³n 0 (%). Meta de avance fÃ­sico esperado.</li>
                <li><strong>Avance Fisico:</strong> Avance fÃ­sico real alcanzado en el perÃ­odo (%). Progreso efectivo de las actividades.</li>
                <li><strong>Cumpli (%):</strong> Porcentaje de cumplimiento fÃ­sico = (Avance FÃ­sico / Prog. V0) Ã— 100. Eficiencia operacional.</li>
              </ul>
            </div>
          </div>
          
            <div style={{
            backgroundColor: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #dee2e6',
            marginBottom: '15px'
          }}>
            <h5 style={{ color: '#16355D', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
              ðŸŽ¯ MÃ‰TRICAS DE EFICIENCIA
            </h5>
            <ul style={{ margin: 0, paddingLeft: '15px', color: '#555', fontSize: '13px', lineHeight: '1.4' }}>
              <li><strong>Eficien. Gasto (%):</strong> Ãndice de eficiencia del gasto = (Cumpli. FÃ­sico / Cumpli. Financiero) Ã— 100. Valores {'>'}100% indican mayor eficiencia fÃ­sica vs financiera.</li>
              <li><strong>Nota:</strong> CalificaciÃ³n basada en la eficiencia del gasto: 5.0 (Excelente), 4.0 (Bueno), 3.0 (Regular), 2.0 (Deficiente), 1.0 (CrÃ­tico).</li>
            </ul>
          </div>
          
          {/* Layout de Dos Columnas: Reglas de Notas + PerÃ­odos de AnÃ¡lisis */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '15px'
          }}>
            {/* Columna Izquierda: Reglas de PonderaciÃ³n de Notas */}
            <div style={{
              backgroundColor: '#e3f2fd', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #2196f3'
            }}>
              <h5 style={{ color: '#1565c0', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                ðŸ“‹ REGLAS DE PONDERACIÃ“N DE NOTAS
              </h5>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px',
                marginBottom: '12px'
              }}>
                <div>
                  <h6 style={{ color: '#1976d2', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    ðŸŸ¢ EXCELENTES (4.0-5.0)
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '12px', color: '#1565c0', fontSize: '11px', lineHeight: '1.3' }}>
                    <li><strong>5.0:</strong> {'>'} 110%</li>
                    <li><strong>4.0:</strong> 105% - 110%</li>
                  </ul>
                </div>
                <div>
                  <h6 style={{ color: '#ff9800', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    ðŸŸ¡ REGULARES (2.0-3.0)
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '12px', color: '#f57c00', fontSize: '11px', lineHeight: '1.3' }}>
                    <li><strong>3.0:</strong> 100% - 105%</li>
                    <li><strong>2.0:</strong> 90% - 100%</li>
                  </ul>
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#fff3e0', 
                padding: '8px', 
                borderRadius: '6px', 
                border: '1px solid #ffb74d',
                marginBottom: '8px'
              }}>
                <h6 style={{ color: '#e65100', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  ðŸ”´ CRÃTICO (1.0)
                </h6>
                <ul style={{ margin: 0, paddingLeft: '12px', color: '#bf360c', fontSize: '11px', lineHeight: '1.3' }}>
                  <li><strong>1.0:</strong> {'<'} 90%</li>
                </ul>
              </div>
              <div style={{ 
                padding: '6px 10px', 
                backgroundColor: '#f1f8e9', 
                borderRadius: '6px', 
                border: '1px solid #8bc34a',
                fontSize: '11px',
                color: '#33691e'
              }}>
                <strong>ðŸ’¡</strong> {'>'}100% = Buena gestiÃ³n, {'<'}100% = Requiere atenciÃ³n
              </div>
            </div>

            {/* Columna Derecha: PerÃ­odos de AnÃ¡lisis */}
            <div style={{
              backgroundColor: '#e8f5e8', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #28a745'
            }}>
              <h5 style={{ color: '#155724', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                ðŸ“… PERÃODOS DE ANÃLISIS
              </h5>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: '8px'
              }}>
                <div style={{
                  backgroundColor: '#f1f8e9',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #66bb6a'
                }}>
                  <h6 style={{ color: '#2e7d32', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    ðŸ“Š PerÃ­odo del Mes
                  </h6>
                  <p style={{ margin: 0, fontSize: '11px', color: '#388e3c', lineHeight: '1.3' }}>
                    AnÃ¡lisis mensual especÃ­fico (actual o filtrado por fechas)
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#f1f8e9',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #66bb6a'
                }}>
                  <h6 style={{ color: '#2e7d32', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    ðŸ“ˆ PerÃ­odo Acumulado
                  </h6>
                  <p style={{ margin: 0, fontSize: '11px', color: '#388e3c', lineHeight: '1.3' }}>
                    Sumatoria desde enero hasta el mes de anÃ¡lisis
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#f1f8e9',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #66bb6a'
                }}>
                  <h6 style={{ color: '#2e7d32', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    ðŸ—“ï¸ PerÃ­odo Anual
                  </h6>
                  <p style={{ margin: 0, fontSize: '11px', color: '#388e3c', lineHeight: '1.3' }}>
                    AnÃ¡lisis completo del aÃ±o (actual o filtrado)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* AnÃ¡lisis DinÃ¡mico */}
          {datosEficiencia.length > 0 && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '15px', 
              borderRadius: '8px', 
              border: '2px solid #ffc107',
              marginTop: '15px'
            }}>
              <h5 style={{ 
                color: '#856404', 
                marginBottom: '12px', 
                fontSize: '14px', 
              fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ðŸ“Š ANÃLISIS EJECUTIVO - ESTADO ACTUAL DEL PROYECTO
              </h5>
              
              {(() => {
                // Obtener datos del perÃ­odo actual (primera fila)
                const periodoActual = datosEficiencia[0];
                const periodoAcumulado = datosEficiencia[1];
                
                // AnÃ¡lisis financiero
                const eficienciaFinanciera = periodoActual.cumplimientoA;
                const eficienciaFisica = periodoActual.cumplimientoB;
                const eficienciaGasto = periodoActual.eficienciaGasto;
                
                // AnÃ¡lisis de tendencias (comparar mes actual vs mes anterior)
                // Para simplificar, usamos la diferencia entre el mes actual y el acumulado como indicador de tendencia
                const tendenciaFinanciera = periodoActual.cumplimientoA - 100; // Diferencia vs 100% (meta)
                const tendenciaFisica = periodoActual.cumplimientoB - 100; // Diferencia vs 100% (meta)
                
                // Determinar estado general
                const getEstadoGeneral = () => {
                  if (eficienciaGasto >= 150 && eficienciaFinanciera >= 100 && eficienciaFisica >= 100) {
                    return { texto: 'EXCELENTE', color: '#28a745', icono: 'ðŸŸ¢' };
                  } else if (eficienciaGasto >= 100 && eficienciaFinanciera >= 90 && eficienciaFisica >= 90) {
                    return { texto: 'BUENO', color: '#17a2b8', icono: 'ðŸ”µ' };
                  } else if (eficienciaGasto >= 80 && eficienciaFinanciera >= 80 && eficienciaFisica >= 80) {
                    return { texto: 'REGULAR', color: '#ffc107', icono: 'ðŸŸ¡' };
                  } else if (eficienciaGasto >= 60) {
                    return { texto: 'REQUIERE ATENCIÃ“N', color: '#fd7e14', icono: 'ðŸŸ ' };
                  } else {
                    return { texto: 'CRÃTICO', color: '#dc3545', icono: 'ðŸ”´' };
                  }
                };
                
                const estadoGeneral = getEstadoGeneral();
                
                return (
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {/* Estado General */}
                    <div style={{ 
                      marginBottom: '12px', 
                      padding: '8px', 
                      backgroundColor: estadoGeneral.color + '20',
                      borderRadius: '6px',
                      border: `1px solid ${estadoGeneral.color}`
                    }}>
                      <strong style={{ color: estadoGeneral.color }}>
                        {estadoGeneral.icono} ESTADO GENERAL: {estadoGeneral.texto}
                      </strong>
            </div>
                    
                    {/* AnÃ¡lisis por dimensiones */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                      <div>
                        <h6 style={{ color: '#856404', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          ðŸ’° EFICIENCIA FINANCIERA
                        </h6>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          <div><strong>Planificado:</strong> {periodoActual.planV0.toLocaleString()} USD</div>
                          <div><strong>Ejecutado:</strong> {periodoActual.gastoReal.toLocaleString()} USD</div>
                          <div><strong>Cumplimiento:</strong> 
                            <span style={{ 
                              color: eficienciaFinanciera >= 100 ? '#28a745' : eficienciaFinanciera >= 90 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {eficienciaFinanciera.toFixed(1)}%
                            </span>
          </div>
                        </div>
      </div>

                      <div>
                        <h6 style={{ color: '#856404', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          ðŸ“ˆ EFICIENCIA FÃSICA
                        </h6>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          <div><strong>Planificado:</strong> {periodoActual.proyeccionV0 !== null ? `${periodoActual.proyeccionV0.toFixed(2)}%` : 'N/A'}</div>
                          <div><strong>Ejecutado:</strong> {periodoActual.avanceFisico !== null ? `${periodoActual.avanceFisico.toFixed(2)}%` : 'N/A'}</div>
                          <div><strong>Cumplimiento:</strong> 
                            <span style={{ 
                              color: eficienciaFisica >= 100 ? '#28a745' : eficienciaFisica >= 90 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {eficienciaFisica !== null ? `${eficienciaFisica.toFixed(1)}%` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicadores clave */}
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '10px', 
                      borderRadius: '6px',
                      border: '1px solid #dee2e6'
                    }}>
                      <h6 style={{ color: '#856404', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                        ðŸŽ¯ INDICADORES CLAVE
                      </h6>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                        <div>
                          <strong>Eficiencia del Gasto:</strong> 
                          <span style={{ 
                            color: eficienciaGasto >= 150 ? '#28a745' : eficienciaGasto >= 100 ? '#17a2b8' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {eficienciaGasto.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <strong>CalificaciÃ³n:</strong> 
                          <span style={{ 
                            color: periodoActual.nota >= 4 ? '#28a745' : periodoActual.nota >= 3 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {periodoActual.nota.toFixed(1)}/5.0
                          </span>
                        </div>
                        <div>
                          <strong>Desv. vs Meta Financiera:</strong> 
                          <span style={{ 
                            color: tendenciaFinanciera > 0 ? '#28a745' : tendenciaFinanciera < 0 ? '#dc3545' : '#666',
                            fontWeight: 'bold'
                          }}>
                            {tendenciaFinanciera > 0 ? '+' : ''}{tendenciaFinanciera.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <strong>Desv. vs Meta FÃ­sica:</strong> 
                          <span style={{ 
                            color: tendenciaFisica > 0 ? '#28a745' : tendenciaFisica < 0 ? '#dc3545' : '#666',
                            fontWeight: 'bold'
                          }}>
                            {tendenciaFisica > 0 ? '+' : ''}{tendenciaFisica.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recomendaciones */}
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '8px', 
                      backgroundColor: '#d1ecf1', 
                      borderRadius: '6px',
                      border: '1px solid #bee5eb',
                      fontSize: '11px',
                      color: '#0c5460'
                    }}>
                      <strong>ðŸ’¡ INSIGHTS:</strong>
                      {eficienciaGasto >= 150 ? 
                        ' El proyecto muestra excelente eficiencia operacional con avance fÃ­sico superior al financiero.' :
                        eficienciaGasto >= 100 ? 
                        ' El proyecto mantiene un balance adecuado entre avance fÃ­sico y financiero.' :
                        eficienciaGasto >= 80 ? 
                        ' Se recomienda revisar la ejecuciÃ³n fÃ­sica para mejorar la eficiencia del gasto.' :
                        ' Se requiere intervenciÃ³n inmediata para optimizar la ejecuciÃ³n fÃ­sica y financiera.'
                      }
                                         </div>
                   </div>
                 );
               })()}
             </div>
           )}
            </div>
          )}
        </div>
          
          {/* Indicador de filtros aplicados */}
          {(fechaDesde || fechaHasta) && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '6px',
              border: '1px solid #2196f3',
              fontSize: '14px',
              color: '#1976d2'
            }}>
              <strong>ðŸ” Filtros aplicados:</strong> 
              {fechaDesde && ` Desde: ${fechaDesde}`}
              {fechaHasta && ` Hasta: ${fechaHasta}`}
            </div>
          )}
    </div>
  );
  };










    return (
    <div style={{
      position: 'absolute',
      left: anchoSidebarIzquierdo + 32,
      top: ALTURA_BARRA_SUPERIOR,
      width: `calc(100vw - ${anchoSidebarIzquierdo}px - ${anchoSidebarDerecho}px - 32px)`,
      height: alturaAreaTrabajo,
      margin: 0,
      padding: 0,
      overflowX: 'hidden',
      background: '#f8f9fb',
      transition: 'width 0.3s cubic-bezier(.4,1.3,.5,1), left 0.3s cubic-bezier(.4,1.3,.5,1)',
      boxSizing: 'border-box',
      zIndex: 1,
    }}>


      



      {/* Contenido del reporte */}
      <div style={{ padding: '0 20px' }}>
        {renderContenidoReporte()}
      </div>

      {/* Sidebar derecho */}
      <SidebarDerecho 
        seleccion={seleccion} 
        setSeleccion={setSeleccion} 
        sidebarVisible={sidebarVisible} 
        setSidebarVisible={setSidebarVisible} 
      />
    </div>
  );
};

// Componente para el reporte de LÃ­neas Bases - Real/Proyectado
const ReporteLineasBases = ({ proyectoId }) => {
  // Estados para las 5 tablas
  const [tablaReal, setTablaReal] = useState([]);
  const [tablaNpc, setTablaNpc] = useState([]);
  const [tablaPoa, setTablaPoa] = useState([]);
  const [tablaV0, setTablaV0] = useState([]);
  const [tablaApi, setTablaApi] = useState([]);
  
  // Estados para importaciÃ³n
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [importando, setImportando] = useState(false);
  const [tablaSeleccionada, setTablaSeleccionada] = useState('av_fisico_real');
  const [mensajeImportacion, setMensajeImportacion] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('info');
  const fileInputRef = useRef(null);

  // Estados para filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroVector, setFiltroVector] = useState('');
  
  // Estado para controlar quÃ© tabla mostrar
  const [tablaVisualizar, setTablaVisualizar] = useState('todas');
  
  // Estado para fecha de Ãºltima importaciÃ³n
  const [ultimaImportacion, setUltimaImportacion] = useState(null);

  // Cargar datos de las tablas
  const cargarDatosTabla = async (tabla, setter) => {
    try {
    if (!proyectoId) return;
    
      const response = await fetch(`${API_BASE}/${tabla}.php?proyecto_id=${proyectoId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setter(data.data);
      } else {
        setter([]);
      }
    } catch (error) {
      console.error(`Error cargando datos de ${tabla}:`, error);
      setter([]);
    }
  };

  // Cargar todas las tablas al montar el componente
  useEffect(() => {
    if (proyectoId) {
      cargarDatosTabla('av_fisico_real', setTablaReal);
      cargarDatosTabla('av_fisico_npc', setTablaNpc);
      cargarDatosTabla('av_fisico_poa', setTablaPoa);
      cargarDatosTabla('av_fisico_v0', setTablaV0);
      cargarDatosTabla('av_fisico_api', setTablaApi);
    }
  }, [proyectoId]);

  // FunciÃ³n para manejar la selecciÃ³n de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setArchivoSeleccionado(file);
      setExcelData([]);
      setMensajeImportacion('');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (data.length > 1) {
            const headers = data[0];
            const rows = data.slice(1).map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });
            setExcelData(rows);
            setMensajeImportacion(`âœ… Archivo cargado: ${rows.length} filas de datos`);
            setTipoMensaje('success');
          }
        } catch (error) {
          setMensajeImportacion('âŒ Error al leer el archivo Excel');
          setTipoMensaje('error');
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // FunciÃ³n para convertir fecha de Excel a MySQL
  const excelDateToMysql = (excelDate) => {
    if (!excelDate) return null;
    
    if (typeof excelDate === 'string') {
      // Remover " real" del final si existe
      const cleanDate = excelDate.replace(/\s+real$/i, '');
      
      // Si es DD-MM-YYYY
      if (/^\d{2}-\d{2}-\d{4}$/.test(cleanDate)) {
        const [day, month, year] = cleanDate.split('-');
        return `${year}-${month}-${day}`;
      }
      
      // Si es YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        return cleanDate;
      }
      
      // Intentar parsear como fecha estÃ¡ndar
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    if (typeof excelDate === 'number') {
      // Si es un nÃºmero (fecha de Excel), convertirla
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  };

  // FunciÃ³n para normalizar claves
  const normalizeKeys = (row) => {
    const normalized = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      normalized[normalizedKey] = row[key];
    });
    return normalized;
  };

  // FunciÃ³n para mapear filas de Excel segÃºn la tabla seleccionada
  const mapExcelRow = (row) => {
    const normalizedRow = normalizeKeys(row);
    
    // FunciÃ³n para limpiar ID (remover "real" del final)
    const cleanId = (id) => {
      if (typeof id === 'string') {
        return id.replace(/real$/i, '');
      }
      return id;
    };
    
    // FunciÃ³n para limpiar porcentajes
    const cleanPercentage = (value) => {
      if (!value) return 0;
      
      let cleanValue = String(value).trim();
      
      // Remover sÃ­mbolo de porcentaje
      const hasPercentage = cleanValue.includes('%');
      cleanValue = cleanValue.replace('%', '');
      
      // Convertir coma a punto
      cleanValue = cleanValue.replace(',', '.');
      
      const numValue = parseFloat(cleanValue);
      if (isNaN(numValue)) return 0;
      
      // Si tenÃ­a sÃ­mbolo de porcentaje, convertir a decimal (dividir por 100)
      if (hasPercentage) {
        return Math.min(numValue / 100, 9.9999); // MÃ¡ximo para DECIMAL(5,4)
      }
      
      // Si no tenÃ­a sÃ­mbolo de porcentaje, asumir que ya es decimal
      return Math.min(numValue, 9.9999); // MÃ¡ximo para DECIMAL(5,4)
    };
    
    const baseMapping = {
      proyecto_id: proyectoId,
      periodo: excelDateToMysql(normalizedRow.periodo || normalizedRow.fecha),
      vector: normalizedRow.vector || '',
      ie_parcial: cleanPercentage(normalizedRow.ie_parcial || normalizedRow.ie || 0),
      ie_acumulado: cleanPercentage(normalizedRow.ie_acumulado || normalizedRow.ie_acum || 0),
      em_parcial: cleanPercentage(normalizedRow.em_parcial || normalizedRow.em || 0),
      em_acumulado: cleanPercentage(normalizedRow.em_acumulado || normalizedRow.em_acum || 0),
      mo_parcial: cleanPercentage(normalizedRow.mo_parcial || normalizedRow.mo || 0),
      mo_acumulado: cleanPercentage(normalizedRow.mo_acumulado || normalizedRow.mo_acum || 0),
      api_parcial: cleanPercentage(normalizedRow.api_parcial || normalizedRow.api || 0),
      api_acum: cleanPercentage(normalizedRow.api_acum || normalizedRow.api_acumulado || 0)
    };

    // Agregar el ID especÃ­fico segÃºn la tabla
    switch (tablaSeleccionada) {
      case 'av_fisico_real':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_real || ''), ...baseMapping };
      case 'av_fisico_npc':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_npc || ''), ...baseMapping };
      case 'av_fisico_poa':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_poa || ''), ...baseMapping };
      case 'av_fisico_v0':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_v0 || ''), ...baseMapping };
      case 'av_fisico_api':
        return { id: cleanId(normalizedRow.id || normalizedRow.id_av_api || ''), ...baseMapping };
      default:
        return baseMapping;
    }
  };

  // FunciÃ³n para importar datos
  const handleImportar = async () => {
    if (!excelData || excelData.length === 0) {
      setMensajeImportacion('âŒ No hay datos para importar');
      setTipoMensaje('error');
      return;
    }

    setImportando(true);
    try {
      const mappedData = excelData.map(mapExcelRow);
      
      // Debug: mostrar los datos mapeados
      console.log('Datos mapeados:', mappedData);
      
      const response = await fetch(`${API_BASE}/importaciones/importar_av_real_proyectado.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: mappedData,
          tabla: tablaSeleccionada,
          proyecto_id: proyectoId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMensajeImportacion(`âœ… ImportaciÃ³n exitosa: ${result.inserted} registros importados`);
        setTipoMensaje('success');
        
        // Actualizar fecha de Ãºltima importaciÃ³n
        setUltimaImportacion(new Date().toLocaleString('es-ES'));
        
        // Recargar datos de la tabla correspondiente
        switch (tablaSeleccionada) {
          case 'av_fisico_real':
            cargarDatosTabla('av_fisico_real', setTablaReal);
            break;
          case 'av_fisico_npc':
            cargarDatosTabla('av_fisico_npc', setTablaNpc);
            break;
          case 'av_fisico_poa':
            cargarDatosTabla('av_fisico_poa', setTablaPoa);
            break;
          case 'av_fisico_v0':
            cargarDatosTabla('av_fisico_v0', setTablaV0);
            break;
          case 'av_fisico_api':
            cargarDatosTabla('av_fisico_api', setTablaApi);
            break;
        }
        
        // Limpiar archivo
        setArchivoSeleccionado(null);
        setExcelData([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        let errorMessage = result.error || 'Error desconocido';
        if (result.errores && Array.isArray(result.errores)) {
          errorMessage += '\n\nErrores especÃ­ficos:\n' + result.errores.join('\n');
        }
        setMensajeImportacion(`âŒ Error en la importaciÃ³n: ${errorMessage}`);
        setTipoMensaje('error');
      }
    } catch (error) {
      setMensajeImportacion(`âŒ Error de conexiÃ³n: ${error.message}`);
      setTipoMensaje('error');
    }
    setImportando(false);
  };

  // FunciÃ³n para obtener datos filtrados
  const getDatosFiltrados = (datos) => {
    let filtrados = datos;
    
    // Debug: mostrar informaciÃ³n de filtrado
    if (fechaDesde || fechaHasta) {
      console.log('ðŸ” Debug - Filtros aplicados:', { fechaDesde, fechaHasta, datosOriginales: datos.length });
    }
    
    if (fechaDesde) {
      filtrados = filtrados.filter(row => {
        if (!row.periodo) return false;
        
        // FunciÃ³n para convertir fecha a formato ISO para comparaciÃ³n
        const convertirFechaAISO = (fechaStr) => {
          if (!fechaStr) return null;
          
          // Si ya estÃ¡ en formato ISO (YYYY-MM-DD), usar directamente
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return fechaStr;
          }
          
          // Si estÃ¡ en formato DD-MM-YYYY, convertir a ISO
          if (fechaStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [dia, mes, aÃ±o] = fechaStr.split('-');
            return `${aÃ±o}-${mes}-${dia}`;
          }
          
          // Para otros formatos, intentar parsear correctamente
          const fecha = new Date(fechaStr);
          if (isNaN(fecha.getTime())) {
            console.warn('âš ï¸ Fecha invÃ¡lida en filtrado:', fechaStr);
            return null;
          }
          
          return fecha.toISOString().split('T')[0];
        };
        
        const fechaRowISO = convertirFechaAISO(row.periodo);
        const fechaDesdeISO = convertirFechaAISO(fechaDesde);
        
        if (!fechaRowISO || !fechaDesdeISO) {
          console.warn('Fecha invÃ¡lida detectada:', { periodo: row.periodo, fechaDesde });
          return false;
        }
        
        const cumpleFiltro = fechaRowISO >= fechaDesdeISO;
        
        // Debug: mostrar comparaciÃ³n de fechas
        if (fechaDesde && fechaHasta) {
          console.log('ðŸ” Debug - ComparaciÃ³n fecha:', {
            periodo: row.periodo,
            fechaRowISO: fechaRowISO,
            fechaDesdeISO: fechaDesdeISO,
            cumpleFiltro
          });
        }
        
        return cumpleFiltro;
      });
    }
    
    if (fechaHasta) {
      filtrados = filtrados.filter(row => {
        if (!row.periodo) return false;
        
        // FunciÃ³n para convertir fecha a formato ISO para comparaciÃ³n
        const convertirFechaAISO = (fechaStr) => {
          if (!fechaStr) return null;
          
          // Si ya estÃ¡ en formato ISO (YYYY-MM-DD), usar directamente
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return fechaStr;
          }
          
          // Si estÃ¡ en formato DD-MM-YYYY, convertir a ISO
          if (fechaStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [dia, mes, aÃ±o] = fechaStr.split('-');
            return `${aÃ±o}-${mes}-${dia}`;
          }
          
          // Para otros formatos, intentar parsear correctamente
          const fecha = new Date(fechaStr);
          if (isNaN(fecha.getTime())) {
            console.warn('âš ï¸ Fecha invÃ¡lida en filtrado:', fechaStr);
            return null;
          }
          
          return fecha.toISOString().split('T')[0];
        };
        
        const fechaRowISO = convertirFechaAISO(row.periodo);
        const fechaHastaISO = convertirFechaAISO(fechaHasta);
        
        if (!fechaRowISO || !fechaHastaISO) {
          console.warn('Fecha invÃ¡lida detectada:', { periodo: row.periodo, fechaHasta });
          return false;
        }
        
        const cumpleFiltro = fechaRowISO <= fechaHastaISO;
        
        // Debug: mostrar comparaciÃ³n de fechas
        if (fechaDesde && fechaHasta) {
          console.log('ðŸ” Debug - ComparaciÃ³n fecha HASTA:', {
            periodo: row.periodo,
            fechaRowISO: fechaRowISO,
            fechaHastaISO: fechaHastaISO,
            cumpleFiltro
          });
        }
        
        return cumpleFiltro;
      });
    }
    
    if (filtroVector) {
      filtrados = filtrados.filter(row => row.vector === filtroVector);
    }
    
    // Debug: mostrar resultado final del filtrado
    if (fechaDesde || fechaHasta) {
      console.log('ðŸ” Debug - Resultado filtrado:', { 
        datosOriginales: datos.length, 
        datosFiltrados: filtrados.length,
        filtros: { fechaDesde, fechaHasta, filtroVector }
      });
    }
    
    return filtrados;
  };

  // Obtener vectores Ãºnicos para el filtro
  const obtenerVectoresUnicos = () => {
    const todosLosDatos = [...tablaReal, ...tablaNpc, ...tablaPoa, ...tablaV0, ...tablaApi];
    const vectores = [...new Set(todosLosDatos.map(row => row.vector).filter(v => v))];
    return vectores.sort();
  };

  // Obtener datos de la tabla seleccionada para visualizar
  const obtenerDatosTablaSeleccionada = () => {
    switch (tablaVisualizar) {
      case 'real':
        return getDatosFiltrados(tablaReal);
      case 'npc':
        return getDatosFiltrados(tablaNpc);
      case 'poa':
        return getDatosFiltrados(tablaPoa);
      case 'v0':
        return getDatosFiltrados(tablaV0);
      case 'api':
        return getDatosFiltrados(tablaApi);
      case 'todas':
      default:
        // Ordenar segÃºn preferencia: REAL, V0, NPC, API, POA
        const datosOrdenados = [
          ...getDatosFiltrados(tablaReal).map(row => ({ ...row, tipo: 'REAL' })),
          ...getDatosFiltrados(tablaV0).map(row => ({ ...row, tipo: 'V0' })),
          ...getDatosFiltrados(tablaNpc).map(row => ({ ...row, tipo: 'NPC' })),
          ...getDatosFiltrados(tablaApi).map(row => ({ ...row, tipo: 'API' })),
          ...getDatosFiltrados(tablaPoa).map(row => ({ ...row, tipo: 'POA' }))
        ];
        return datosOrdenados;
    }
  };

  // FunciÃ³n para obtener la fecha actual formateada
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const aÃ±o = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${aÃ±o}-${mes}-${dia}`;
  };

  // FunciÃ³n para obtener la posiciÃ³n de la lÃ­nea de corte
  const obtenerPosicionLineaCorte = () => {
    const datosGrafica = prepararDatosCurvaS();
    if (datosGrafica.length === 0) return null;
    
    const fechaActual = obtenerFechaActual();
    
    // Debug: mostrar informaciÃ³n
    console.log('Datos de la grÃ¡fica:', datosGrafica.map(d => d.periodo));
    console.log('Fecha actual:', fechaActual);
    
    // Buscar si existe un perÃ­odo exacto para hoy
    const periodoExacto = datosGrafica.find(dato => dato.periodo === fechaActual);
    if (periodoExacto) {
      console.log('PerÃ­odo exacto encontrado:', fechaActual);
      return fechaActual;
    }
    
    // Si no existe, buscar el perÃ­odo mÃ¡s cercano a la fecha actual
    const fechaActualObj = new Date(fechaActual);
    let periodoMasCercano = null;
    let diferenciaMinima = Infinity;
    
    datosGrafica.forEach(dato => {
      const fechaDato = new Date(dato.periodo);
      const diferencia = Math.abs(fechaActualObj - fechaDato);
      if (diferencia < diferenciaMinima) {
        diferenciaMinima = diferencia;
        periodoMasCercano = dato.periodo;
      }
    });
    
    console.log('PerÃ­odo mÃ¡s cercano encontrado:', periodoMasCercano);
    return periodoMasCercano;
  };

  // FunciÃ³n para obtener el porcentaje de la fecha de corte "HOY"
  const obtenerPorcentajeHoy = (tipo) => {
    // Si hay una tabla especÃ­fica seleccionada, solo mostrar el porcentaje de esa tabla
    if (tablaVisualizar !== 'todas' && tablaVisualizar !== tipo) {
      return 0;
    }
    
    const datosGrafica = prepararDatosCurvaS();
    const periodoHoy = obtenerPosicionLineaCorte();
    
    if (!periodoHoy || datosGrafica.length === 0) return 0;
    
    const datosHoy = datosGrafica.find(dato => dato.periodo === periodoHoy);
    if (!datosHoy) return 0;
    
    switch (tipo) {
      case 'real': return datosHoy.real || 0;
      case 'v0': return datosHoy.v0 || 0;
      case 'npc': return datosHoy.npc || 0;
      case 'api': return datosHoy.api || 0;
      case 'poa': return datosHoy.poa || 0;
      default: return 0;
    }
  };

  // FunciÃ³n para preparar datos de la Curva S
  const prepararDatosCurvaS = () => {
    const datosReal = getDatosFiltrados(tablaReal);
    const datosV0 = getDatosFiltrados(tablaV0);
    const datosNpc = getDatosFiltrados(tablaNpc);
    const datosApi = getDatosFiltrados(tablaApi);
    const datosPoa = getDatosFiltrados(tablaPoa);

    // Filtrar datos segÃºn la tabla seleccionada
    let datosParaGrafica = [];
    if (tablaVisualizar === 'real') {
      datosParaGrafica = datosReal;
    } else if (tablaVisualizar === 'v0') {
      datosParaGrafica = datosV0;
    } else if (tablaVisualizar === 'npc') {
      datosParaGrafica = datosNpc;
    } else if (tablaVisualizar === 'api') {
      datosParaGrafica = datosApi;
    } else if (tablaVisualizar === 'poa') {
      datosParaGrafica = datosPoa;
    } else {
      // Para 'todas' o cualquier otro valor, usar todos los datos
      datosParaGrafica = [...datosReal, ...datosV0, ...datosNpc, ...datosApi, ...datosPoa];
    }

    // Obtener todos los perÃ­odos Ãºnicos
    const todosLosPeriodos = new Set();
    datosParaGrafica.forEach(row => {
      if (row.periodo) {
        todosLosPeriodos.add(row.periodo);
      }
    });

    // Ordenar perÃ­odos
    const periodosOrdenados = Array.from(todosLosPeriodos).sort();

    // Crear datos para la grÃ¡fica usando api_acum de cada tabla
    const datosGrafica = periodosOrdenados.map(periodo => {
      const realData = datosReal.find(row => row.periodo === periodo);
      const v0Data = datosV0.find(row => row.periodo === periodo);
      const npcData = datosNpc.find(row => row.periodo === periodo);
      const apiData = datosApi.find(row => row.periodo === periodo);
      const poaData = datosPoa.find(row => row.periodo === periodo);

      const datosBase = {
        periodo: periodo,
        fecha: new Date(periodo),
        real: realData ? parseFloat(realData.api_acum || 0) * 100 : 0,
        v0: v0Data ? parseFloat(v0Data.api_acum || 0) * 100 : 0,
        npc: npcData ? parseFloat(npcData.api_acum || 0) * 100 : 0,
        api: apiData ? parseFloat(apiData.api_acum || 0) * 100 : 0,
        poa: poaData ? parseFloat(poaData.api_acum || 0) * 100 : 0
      };

      // Si se seleccionÃ³ una tabla especÃ­fica, solo mostrar esa lÃ­nea
      if (tablaVisualizar !== 'todas') {
        const datosFiltrados = { ...datosBase };
        // Poner en 0 las lÃ­neas que no estÃ¡n seleccionadas
        if (tablaVisualizar !== 'real') datosFiltrados.real = 0;
        if (tablaVisualizar !== 'v0') datosFiltrados.v0 = 0;
        if (tablaVisualizar !== 'npc') datosFiltrados.npc = 0;
        if (tablaVisualizar !== 'api') datosFiltrados.api = 0;
        if (tablaVisualizar !== 'poa') datosFiltrados.poa = 0;
        return datosFiltrados;
      }

      return datosBase;
    });

    return datosGrafica;
  };

    return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#16355D', margin: 0 }}>
          LÃ­neas Bases - Real/Proyectado
        </h2>
        
        {ultimaImportacion && (
          <div style={{ 
            background: '#e8f5e8', 
            padding: '8px 12px', 
            borderRadius: '6px', 
            border: '1px solid #4caf50',
            fontSize: '12px',
            color: '#2e7d32'
          }}>
            <span style={{ fontWeight: 'bold' }}>ðŸ“… Ãšltima importaciÃ³n:</span> {ultimaImportacion}
          </div>
        )}
      </div>

      {/* SecciÃ³n de importaciÃ³n */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ color: '#16355D', marginBottom: '15px' }}>Importar Datos</h3>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Seleccionar Tabla:
            </label>
            <select
              value={tablaSeleccionada}
              onChange={(e) => setTablaSeleccionada(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="av_fisico_real">Real</option>
              <option value="av_fisico_npc">NPC</option>
              <option value="av_fisico_poa">POA</option>
              <option value="av_fisico_v0">V0</option>
              <option value="av_fisico_api">API</option>
            </select>
      </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Archivo Excel:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            />
          </div>
          
          <button
            onClick={handleImportar}
            disabled={importando || !archivoSeleccionado}
            style={{
              background: importando ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: importando ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {importando ? 'Importando...' : 'Importar'}
          </button>
        </div>

        {mensajeImportacion && (
      <div style={{ 
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: tipoMensaje === 'success' ? '#d4edda' : '#f8d7da',
            color: tipoMensaje === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${tipoMensaje === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {mensajeImportacion}
      </div>
        )}
        
        {ultimaImportacion && (
          <div style={{ 
            marginTop: '10px',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7',
            fontSize: '12px'
          }}>
            <span style={{ fontWeight: 'bold' }}>ðŸ“… Ãšltima importaciÃ³n:</span> {ultimaImportacion}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ color: '#16355D', marginBottom: '10px' }}>Filtros</h4>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '12px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '12px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Vector:</label>
            <select
              value={filtroVector}
              onChange={(e) => setFiltroVector(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '12px',
                minWidth: '120px'
              }}
            >
              <option value="">Todos los vectores</option>
              {obtenerVectoresUnicos().map((vector, index) => (
                <option key={index} value={vector}>{vector}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => {
              setFechaDesde('');
              setFechaHasta('');
              setFiltroVector('');
            }}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Selector de tabla para visualizar */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ color: '#16355D', marginBottom: '15px' }}>Seleccionar Tabla para Visualizar</h4>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTablaVisualizar('todas')}
            style={{
              background: tablaVisualizar === 'todas' ? '#16355D' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Todas las Tablas
          </button>
          
          <button
            onClick={() => setTablaVisualizar('real')}
            style={{
              background: tablaVisualizar === 'real' ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo Real
          </button>
          
          <button
            onClick={() => setTablaVisualizar('npc')}
            style={{
              background: tablaVisualizar === 'npc' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo NPC
          </button>
          
          <button
            onClick={() => setTablaVisualizar('poa')}
            style={{
              background: tablaVisualizar === 'poa' ? '#ffc107' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo POA
          </button>
          
          <button
            onClick={() => setTablaVisualizar('v0')}
            style={{
              background: tablaVisualizar === 'v0' ? '#17a2b8' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo V0
          </button>
          
          <button
            onClick={() => setTablaVisualizar('api')}
            style={{
              background: tablaVisualizar === 'api' ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Solo API
          </button>
        </div>
      </div>

      {/* Resumen de datos */}
        <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>Real</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {obtenerPorcentajeHoy('real').toFixed(2)}%
        </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
            borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>NPC</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {obtenerPorcentajeHoy('npc').toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>POA</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
            {obtenerPorcentajeHoy('poa').toFixed(2)}%
        </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>V0</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
            {obtenerPorcentajeHoy('v0').toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h5 style={{ color: '#16355D', marginBottom: '10px' }}>API</h5>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
            {obtenerPorcentajeHoy('api').toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>API Acumulado</div>
        </div>
      </div>

      {/* GrÃ¡fico Curva S */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #dee2e6',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: '#16355D', marginBottom: '15px', textAlign: 'center' }}>
          ðŸ“ˆ Curva S - API Acumulado {tablaVisualizar === 'todas' ? '(Real, V0, NPC, API, POA)' : `(${tablaVisualizar.toUpperCase()})`}
        </h4>
        
        {prepararDatosCurvaS().length > 0 ? (
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prepararDatosCurvaS()} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="periodo" 
                  stroke="#666"
                  fontSize={10}
                  tick={{ fill: '#666' }}
                  type="category"
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    // Formatear fecha de YYYY-MM-DD a MM/YY
                    const parts = value.split('-');
                    const month = parts[1];
                    const year = parts[0].slice(-2);
                    return `${month}/${year}`;
                  }}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={11}
                  tick={{ fill: '#666' }}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  domain={[0, 100]}
                  label={{ value: 'API Acumulado (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      // Formatear fecha de YYYY-MM-DD a MM/YYYY
                      const parts = label.split('-');
                      const month = parts[1];
                      const year = parts[0];
                      const periodoFormateado = `${month}/${year}`;
                      
                      return (
                        <div style={{
                          background: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          padding: '12px',
                          fontSize: '12px',
                          fontFamily: 'Arial, sans-serif'
                        }}>
                          <div style={{
                            borderBottom: '1px solid #eee',
                            paddingBottom: '8px',
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            color: '#333',
                            fontSize: '13px'
                          }}>
                            PerÃ­odo: {periodoFormateado}
                          </div>
                          
                          {payload.map((entry, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              backgroundColor: `${entry.color}10`
                            }}>
                              <span style={{ 
                                color: entry.color, 
                                fontWeight: '600',
                                fontSize: '11px'
                              }}>
                                {entry.name.toUpperCase()}:
                              </span>
                              <span style={{ 
                                fontWeight: 'bold',
                                color: '#333',
                                fontSize: '11px',
                                backgroundColor: `${entry.color}20`,
                                padding: '1px 4px',
                                borderRadius: '2px'
                              }}>
                                {entry.value.toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                
                {/* LÃ­neas de cada vector - Orden: REAL, V0, NPC, API, POA */}
                <Line 
                  type="monotone" 
                  dataKey="real" 
                  stroke="#28a745" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="REAL"
                />
                <Line 
                  type="monotone" 
                  dataKey="v0" 
                  stroke="#17a2b8" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="V0"
                />
                <Line 
                  type="monotone" 
                  dataKey="npc" 
                  stroke="#007bff" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="NPC"
                />
                <Line 
                  type="monotone" 
                  dataKey="api" 
                  stroke="#dc3545" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="API"
                />
                <Line 
                  type="monotone" 
                  dataKey="poa" 
                  stroke="#ffc107" 
                  strokeWidth={1.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  name="POA"
                />
                
                {/* LÃ­nea vertical de corte - fecha actual */}
                {obtenerPosicionLineaCorte() && (
                  <ReferenceLine 
                    x={obtenerPosicionLineaCorte()} 
                    stroke="#ff6b35" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{
                      value: "HOY",
                      position: "top",
                      fill: "#ff6b35",
                      fontSize: 10,
                      fontWeight: "bold"
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#6c757d',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p>No hay datos suficientes para mostrar la Curva S.</p>
            <p>Importa datos de Real, V0, NPC y API para visualizar la grÃ¡fica de API Acumulado.</p>
          </div>
        )}
      </div>

      {/* Tabla de datos */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #dee2e6',
        overflowX: 'auto'
      }}>
        <h4 style={{ color: '#16355D', marginBottom: '15px' }}>
          Datos de {tablaVisualizar === 'todas' ? 'Todas las Tablas' : 
                     tablaVisualizar === 'real' ? 'Real' :
                     tablaVisualizar === 'npc' ? 'NPC' :
                     tablaVisualizar === 'poa' ? 'POA' :
                     tablaVisualizar === 'v0' ? 'V0' : 'API'}
          ({obtenerDatosTablaSeleccionada().length} registros)
        </h4>
        
        {obtenerDatosTablaSeleccionada().length > 0 ? (
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{ 
                background: '#16355D', 
                color: 'white',
                position: 'sticky',
                top: 0
              }}>
                {tablaVisualizar === 'todas' && (
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                    Tipo
                  </th>
                )}

                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                  Vector
                </th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                  PerÃ­odo
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  IE Parcial
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  IE Acumulado
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  EM Parcial
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  EM Acumulado
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  MO Parcial
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  MO Acumulado
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  API Parcial
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  API Acumulado
                </th>
              </tr>
            </thead>
            <tbody>
              {obtenerDatosTablaSeleccionada().map((row, index) => (
                <tr key={index} style={{ 
                  background: index % 2 === 0 ? '#f8f9fa' : '#fff',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  {tablaVisualizar === 'todas' && (
                    <td style={{ 
                      padding: '8px', 
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      color: row.tipo === 'REAL' ? '#28a745' :
                             row.tipo === 'V0' ? '#17a2b8' :
                             row.tipo === 'NPC' ? '#007bff' : '#dc3545'
                    }}>
                      {row.tipo}
                    </td>
                  )}
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                    {row.vector || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                    {row.periodo ? (() => {
                      // Debug: mostrar el valor original del perÃ­odo
                      console.log('ðŸ” Debug - PerÃ­odo original:', row.periodo, 'Tipo:', typeof row.periodo);
                      
                      // FunciÃ³n para formatear fecha correctamente
                      const formatearFecha = (fechaStr) => {
                        if (!fechaStr) return '-';
                        
                        // Si estÃ¡ en formato ISO (YYYY-MM-DD), parsear correctamente
                        if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                          const [aÃ±o, mes, dia] = fechaStr.split('-');
                          // Crear fecha usando el constructor que no tiene problemas de zona horaria
                          const fecha = new Date(parseInt(aÃ±o), parseInt(mes) - 1, parseInt(dia));
                          console.log('ðŸ” Debug - ISO parseado:', fechaStr, '->', fecha.toLocaleDateString('es-ES'));
                          return fecha.toLocaleDateString('es-ES');
                        }
                        
                        // Si estÃ¡ en formato DD-MM-YYYY, convertir a ISO
                        if (fechaStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
                          const [dia, mes, aÃ±o] = fechaStr.split('-');
                          const fecha = new Date(parseInt(aÃ±o), parseInt(mes) - 1, parseInt(dia));
                          console.log('ðŸ” Debug - DD-MM-YYYY parseado:', fechaStr, '->', fecha.toLocaleDateString('es-ES'));
                          return fecha.toLocaleDateString('es-ES');
                        }
                        
                        // Para otros formatos, intentar parsear directamente
                        const fecha = new Date(fechaStr);
                        if (isNaN(fecha.getTime())) {
                          console.warn('âš ï¸ Fecha invÃ¡lida:', fechaStr);
                          return fechaStr; // Mostrar el valor original si no se puede parsear
                        }
                        
                        return fecha.toLocaleDateString('es-ES');
                      };
                      
                      const fechaFormateada = formatearFecha(row.periodo);
                      console.log('ðŸ” Debug - Fecha formateada:', fechaFormateada);
                      return fechaFormateada;
                    })() : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.ie_parcial ? `${(parseFloat(row.ie_parcial) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.ie_acumulado ? `${(parseFloat(row.ie_acumulado) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.em_parcial ? `${(parseFloat(row.em_parcial) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.em_acumulado ? `${(parseFloat(row.em_acumulado) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.mo_parcial ? `${(parseFloat(row.mo_parcial) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.mo_acumulado ? `${(parseFloat(row.mo_acumulado) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.api_parcial ? `${(parseFloat(row.api_parcial) * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {row.api_acum ? `${(parseFloat(row.api_acum) * 100).toFixed(2)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#6c757d',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p>No hay datos disponibles para mostrar.</p>
            <p>Importa archivos Excel o selecciona otra tabla para visualizar datos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportabilidad; 
