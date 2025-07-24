const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Regenerando build con tooltips corregidos...\n');

try {
  // Verificar que estamos en el directorio correcto
  if (!fs.existsSync('package.json')) {
    console.error('❌ Error: No se encontró package.json. Asegúrate de estar en el directorio del proyecto.');
    process.exit(1);
  }

  console.log('📦 Ejecutando npm run build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Build completado exitosamente');
  console.log('🎯 Tooltips corregidos:');
  console.log('   - Z-index aumentado a 9999');
  console.log('   - Opacidad mejorada a 0.95');
  console.log('   - Pointer-events: none agregado');
  console.log('   - Transiciones suavizadas');
  
  // Verificar que el build se creó correctamente
  if (fs.existsSync('build/index.html')) {
    console.log('\n📁 Archivos generados:');
    const buildFiles = fs.readdirSync('build');
    buildFiles.forEach(file => {
      const stats = fs.statSync(path.join('build', file));
      if (stats.isDirectory()) {
        console.log(`   📂 ${file}/`);
      } else {
        console.log(`   📄 ${file}`);
      }
    });
    
    console.log('\n🚀 Build listo para subir al servidor');
    console.log('💡 Recuerda ejecutar: node solucion_final_subdominio.js');
    
  } else {
    console.error('❌ Error: No se generó el archivo build/index.html');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
} 