const fs = require('fs');
const path = require('path');

console.log('🔧 Preparando deploy con correcciones de acceso por perfil...\n');

// Verificar archivos críticos
const archivosCriticos = [
  'src/CentrosPorRegion.js',
  'src/UsuariosPage.js',
  'src/config.js',
  'api/usuarios.php',
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
console.log('✅ Admin sin centros asignados ahora ve todas las regiones');
console.log('✅ Agregados logs de depuración para identificar problemas');
console.log('✅ Mejorado manejo de casos edge');

console.log('\n📝 Problemas identificados y solucionados:');
console.log('✅ Usuario admin no veía regiones por filtro incorrecto');
console.log('✅ Filtro basado en centros de costo era muy restrictivo');
console.log('✅ Falta de logs para depurar problemas de acceso');

console.log('\n🚀 Pasos para deploy:');
console.log('1. Ejecutar: npm run build');
console.log('2. Subir la carpeta build/ a cPanel');
console.log('3. Subir los archivos PHP de api/ a cPanel');
console.log('4. Verificar que las rutas estén correctas');

console.log('\n🔧 Para probar localmente:');
console.log('1. Ejecutar: npm start');
console.log('2. Abrir http://localhost:3000');
console.log('3. Loguearse como admin y verificar:');
console.log('   - Que se muestren las regiones');
console.log('   - Que se puedan expandir las regiones');
console.log('   - Que se muestren los proyectos');
console.log('4. Revisar la consola del navegador para logs de depuración');

console.log('\n⚠️  Notas importantes:');
console.log('- Los usuarios admin ahora ven todas las regiones');
console.log('- Los logs de depuración están activos');
console.log('- Se pueden remover los logs después de confirmar que funciona');
console.log('- Verificar que el usuario admin tenga los permisos correctos en la BD');

console.log('\n🔍 Para verificar en producción:');
console.log('1. Loguearse como admin');
console.log('2. Ir a la página de Proyectos');
console.log('3. Verificar que se muestren las regiones');
console.log('4. Revisar la consola del navegador para logs');

console.log('\n✅ Preparación completada!'); 