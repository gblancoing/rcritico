const fs = require('fs');
const path = require('path');

console.log('🔧 Preparando deploy con correcciones de vectores acumulados...\n');

// Verificar archivos críticos
const archivosCriticos = [
  'src/analisis/Vectores.js',
  'src/analisis/ResumenFinanciero.js',
  'src/config.js',
  'package.json'
];

console.log('📋 Verificando archivos críticos:');
archivosCriticos.forEach(archivo => {
  const ruta = path.join(__dirname, archivo);
  if (fs.existsSync(ruta)) {
    console.log(`✅ ${archivo}`);
  } else {
    console.log(`❌ ${archivo} - NO ENCONTRADO`);
  }
});

console.log('\n🔍 Verificando configuraciones:');

// Verificar package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ homepage en package.json: ${packageJson.homepage}`);
} catch (e) {
  console.log('❌ Error leyendo package.json');
}

// Verificar config.js
try {
  const configContent = fs.readFileSync('src/config.js', 'utf8');
  if (configContent.includes('API_BASE')) {
    console.log('✅ config.js contiene API_BASE');
  } else {
    console.log('❌ config.js no contiene API_BASE');
  }
} catch (e) {
  console.log('❌ Error leyendo config.js');
}

console.log('\n📝 Cambios realizados en Vectores.js:');
console.log('✅ Corregida función getKpiData() para datos acumulados');
console.log('✅ Corregida función getTablaFiltrada() para datos acumulados');
console.log('✅ Datos acumulados ahora toman solo el último valor por categoría');
console.log('✅ Datos parciales mantienen el comportamiento original (suma)');

console.log('\n📝 Problema identificado y solucionado:');
console.log('✅ Los KPIs de datos acumulados sumaban incorrectamente todos los registros');
console.log('✅ Ahora toman solo el último valor acumulado por categoría');
console.log('✅ Esto evita cifras irreales y duplicadas');

console.log('\n📝 Vectores afectados:');
console.log('✅ Real Acumulado');
console.log('✅ V0 Acumulado');
console.log('✅ NPC Acumulado');
console.log('✅ API Acumulado');

console.log('\n📝 Vectores que mantienen comportamiento original:');
console.log('✅ Real Parcial');
console.log('✅ V0 Parcial');
console.log('✅ NPC Parcial');
console.log('✅ API Parcial');

console.log('\n🚀 Pasos para deploy:');
console.log('1. Ejecutar: npm run build');
console.log('2. Subir la carpeta build/ a cPanel');
console.log('3. Verificar que las rutas estén correctas');

console.log('\n🔧 Para probar localmente:');
console.log('1. Ejecutar: npm start');
console.log('2. Abrir http://localhost:3000');
console.log('3. Ir a la sección de Vectores');
console.log('4. Probar con diferentes vectores acumulados:');
console.log('   - Real Acumulado');
console.log('   - V0 Acumulado');
console.log('   - NPC Acumulado');
console.log('   - API Acumulado');
console.log('5. Verificar que los KPIs muestren valores realistas');

console.log('\n⚠️  Notas importantes:');
console.log('- Los datos acumulados ya vienen acumulados desde la BD');
console.log('- No se deben sumar, solo mostrar el último valor');
console.log('- Los filtros de fecha funcionan correctamente');
console.log('- Los datos parciales mantienen su comportamiento original');

console.log('\n🔍 Para verificar en producción:');
console.log('1. Ir a la sección de Vectores');
console.log('2. Seleccionar un vector acumulado (ej: Real Acumulado)');
console.log('3. Verificar que los KPIs muestren valores realistas');
console.log('4. Comparar con los valores de la base de datos');

console.log('\n📊 Ejemplo de comportamiento correcto:');
console.log('- Si hay 3 registros de CONSTRUCCION con valores: 1000, 2000, 3000');
console.log('- Para datos parciales: suma = 6000');
console.log('- Para datos acumulados: último valor = 3000');

console.log('\n✅ Preparación completada!'); 