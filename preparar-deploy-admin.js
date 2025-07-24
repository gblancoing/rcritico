const fs = require('fs');
const path = require('path');

console.log('🔧 Preparando deploy con correcciones para usuarios admin...\n');

// Verificar archivos críticos
const archivosCriticos = [
  'src/CentrosPorRegion.js',
  'api/login.php',
  'src/config.js',
  'api/regiones.php',
  'api/proyectos.php',
  'api/centros_costo.php',
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

console.log('\n📝 Cambios realizados en CentrosPorRegion.js:');
console.log('✅ Corregida lógica de filtrado para usuarios admin');
console.log('✅ Admin ahora ve solo su región y proyecto asignado');
console.log('✅ Agregados logs de depuración detallados');
console.log('✅ Mejorado manejo de casos edge');

console.log('\n📝 Cambios realizados en login.php:');
console.log('✅ Agregada información completa del usuario (region_id, proyecto_id)');
console.log('✅ JOIN con tablas regiones y proyectos para obtener nombres');
console.log('✅ Soporte para usuarios admin y otros roles');
console.log('✅ Información de centro_costo_nombre, proyecto_nombre, region_nombre');

console.log('\n📝 Problemas identificados y solucionados:');
console.log('✅ Login no devolvía region_id y proyecto_id del admin');
console.log('✅ Filtro de regiones no funcionaba correctamente');
console.log('✅ Admin no veía su región asignada');

console.log('\n🚀 Pasos para deploy:');
console.log('1. Ejecutar: npm run build');
console.log('2. Subir la carpeta build/ a cPanel');
console.log('3. Subir los archivos PHP de api/ a cPanel');
console.log('4. Verificar que las rutas estén correctas');

console.log('\n🔧 Para probar localmente:');
console.log('1. Ejecutar: npm start');
console.log('2. Abrir http://localhost:3000');
console.log('3. Loguearse como admin y verificar:');
console.log('   - Que se muestre solo su región asignada');
console.log('   - Que se muestre solo su proyecto asignado');
console.log('   - Que se puedan expandir las regiones');
console.log('4. Revisar la consola del navegador para logs de depuración');

console.log('\n⚠️  Notas importantes:');
console.log('- El admin debe tener un centro de costo asignado en la BD');
console.log('- El centro de costo debe estar vinculado a un proyecto');
console.log('- El proyecto debe estar en una región');
console.log('- Los logs de depuración están activos');
console.log('- Se pueden remover los logs después de confirmar que funciona');

console.log('\n🔍 Para verificar en producción:');
console.log('1. Loguearse como admin (Dinko Galeno Dubravcic)');
console.log('2. Ir a la página de Proyectos (/centros-por-region)');
console.log('3. Verificar que se muestre "Región Metropolitana de Santiago"');
console.log('4. Verificar que se muestre "1 proyectos"');
console.log('5. Revisar la consola del navegador para logs');

console.log('\n📊 Verificación en base de datos:');
console.log('1. Verificar que el usuario admin esté en la tabla usuarios');
console.log('2. Verificar que tenga un registro en usuario_centro_costo');
console.log('3. Verificar que el centro_costo esté vinculado a un proyecto');
console.log('4. Verificar que el proyecto esté en una región');

console.log('\n✅ Preparación completada!'); 