-- =====================================================
-- CONSULTAS SQL PARA PROBAR PROYECCIÓN FÍSICA
-- =====================================================

-- 1. VERIFICAR DATOS SIN FILTRO
SELECT 
    SUM(porcentaje_predicido) as total_sin_filtro,
    COUNT(*) as registros_sin_filtro,
    MIN(periodo_cierre_real) as fecha_minima,
    MAX(periodo_cierre_real) as fecha_maxima
FROM predictividad 
WHERE proyecto_id = 1;

-- 2. CONSULTA PARA JUNIO 2025 (MES ESPECÍFICO)
SELECT 
    SUM(porcentaje_predicido) as total_junio_2025,
    COUNT(*) as registros_junio_2025
FROM predictividad 
WHERE proyecto_id = 1 
AND YEAR(periodo_cierre_real) = 2025 
AND MONTH(periodo_cierre_real) = 6;

-- 3. VER REGISTROS ESPECÍFICOS DE JUNIO 2025
SELECT 
    id_predictivo,
    proyecto_id,
    periodo_prediccion,
    periodo_cierre_real,
    porcentaje_predicido,
    valor_real_porcentaje
FROM predictividad 
WHERE proyecto_id = 1 
AND YEAR(periodo_cierre_real) = 2025 
AND MONTH(periodo_cierre_real) = 6;

-- 4. CONSULTA PARA ENERO A JUNIO 2025 (RANGO)
SELECT 
    SUM(porcentaje_predicido) as total_enero_a_junio_2025,
    COUNT(*) as registros_enero_a_junio_2025
FROM predictividad 
WHERE proyecto_id = 1 
AND periodo_cierre_real >= '2025-01-01' 
AND periodo_cierre_real <= '2025-06-30';

-- 5. VER TODOS LOS REGISTROS DE ENERO A JUNIO 2025
SELECT 
    id_predictivo,
    proyecto_id,
    periodo_prediccion,
    periodo_cierre_real,
    porcentaje_predicido,
    valor_real_porcentaje
FROM predictividad 
WHERE proyecto_id = 1 
AND periodo_cierre_real >= '2025-01-01' 
AND periodo_cierre_real <= '2025-06-30'
ORDER BY periodo_cierre_real;

-- 6. VER TODOS LOS REGISTROS DISPONIBLES
SELECT 
    id_predictivo,
    proyecto_id,
    periodo_prediccion,
    periodo_cierre_real,
    porcentaje_predicido,
    valor_real_porcentaje
FROM predictividad 
WHERE proyecto_id = 1
ORDER BY periodo_cierre_real;

-- 7. CONSULTA EXACTA QUE USA EL BACKEND (MES ESPECÍFICO)
-- Esta es la consulta que debería ejecutar cuando seleccionas junio 2025
SELECT 
    SUM(porcentaje_predicido) as total_proyeccion_fisica,
    COUNT(*) as total_registros,
    MIN(periodo_cierre_real) as periodo_minimo,
    MAX(periodo_cierre_real) as periodo_maximo
FROM predictividad 
WHERE proyecto_id = 1
AND YEAR(periodo_cierre_real) = 2025 
AND MONTH(periodo_cierre_real) = 6;

-- 8. CONSULTA EXACTA QUE USA EL BACKEND (RANGO)
-- Esta es la consulta que debería ejecutar cuando seleccionas enero a junio 2025
SELECT 
    SUM(porcentaje_predicido) as total_proyeccion_fisica,
    COUNT(*) as total_registros,
    MIN(periodo_cierre_real) as periodo_minimo,
    MAX(periodo_cierre_real) as periodo_maximo
FROM predictividad 
WHERE proyecto_id = 1
AND periodo_cierre_real >= '2025-01-01' 
AND periodo_cierre_real <= '2025-06-30'; 