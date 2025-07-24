const fs = require('fs');
const path = require('path');

console.log('🔧 Preparando deploy con correcciones de ajuste.js...\n');

// Verificar archivos críticos
const archivosCriticos = [
  'src/ajuste.js',
  'src/config.js',
  'api/centros_costo.php',
  'api/proyectos.php',
  'api/regiones.php',
  'api/editar_centro_costo.php',
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

console.log('\n📝 Cambios realizados en ajuste.js:');
console.log('✅ Agregada validación de tipos para proyecto_id y region_id');
console.log('✅ Corregidas referencias de IDs (proyecto_id, region_id)');
console.log('✅ Agregados logs de depuración');
console.log('✅ Mejorado manejo de errores');

console.log('\n📝 Cambios realizados en PHP:');
console.log('✅ Asegurado que IDs sean números en centros_costo.php');
console.log('✅ Asegurado que IDs sean números en proyectos.php');
console.log('✅ Asegurado que IDs sean números en regiones.php');

console.log('\n🚀 Pasos para deploy:');
console.log('1. Ejecutar: npm run build');
console.log('2. Subir la carpeta build/ a cPanel');
console.log('3. Subir los archivos PHP de api/ a cPanel');
console.log('4. Verificar que las rutas estén correctas');

console.log('\n🔧 Para probar localmente:');
console.log('1. Ejecutar: npm start');
console.log('2. Abrir http://localhost:3000');
console.log('3. Ir a Ajuste y probar crear centro de costo');
console.log('4. Revisar la consola del navegador para logs de depuración');

console.log('\n⚠️  Notas importantes:');
console.log('- Los logs de depuración están activos en ajuste.js');
console.log('- Se pueden remover después de confirmar que funciona');
console.log('- Verificar que la base de datos tenga los IDs correctos');

console.log('\n✅ Preparación completada!'); 