const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando cPanel para React Router...\n');

// Verificar que existe el build
const buildPath = path.join(__dirname, 'build');
const indexHtmlPath = path.join(buildPath, 'index.html');

if (!fs.existsSync(buildPath)) {
    console.error('❌ Error: No existe la carpeta build/');
    console.log('💡 Ejecuta: npm run build');
    process.exit(1);
}

if (!fs.existsSync(indexHtmlPath)) {
    console.error('❌ Error: No existe build/index.html');
    console.log('💡 Ejecuta: npm run build');
    process.exit(1);
}

console.log('✅ Build encontrado');

// Crear backup del index.php actual
const currentIndexPath = path.join(__dirname, 'index.php');
const backupIndexPath = path.join(__dirname, 'index_backup.php');

if (fs.existsSync(currentIndexPath)) {
    fs.copyFileSync(currentIndexPath, backupIndexPath);
    console.log('✅ Backup creado: index_backup.php');
}

// Copiar el router final como index.php
const finalRouterPath = path.join(__dirname, 'cpanel_final.php');
if (fs.existsSync(finalRouterPath)) {
    fs.copyFileSync(finalRouterPath, currentIndexPath);
    console.log('✅ Router final aplicado como index.php');
} else {
    console.error('❌ Error: No existe cpanel_final.php');
    process.exit(1);
}

// Copiar .htaccess específico para cPanel
const htaccessPath = path.join(__dirname, '.htaccess_cpanel');
const finalHtaccessPath = path.join(__dirname, '.htaccess');
if (fs.existsSync(htaccessPath)) {
    fs.copyFileSync(htaccessPath, finalHtaccessPath);
    console.log('✅ .htaccess específico para cPanel aplicado');
} else {
    console.error('❌ Error: No existe .htaccess_cpanel');
    process.exit(1);
}

// Lista de archivos y carpetas para subir
const filesToUpload = [
    'index.php',
    '.htaccess',
    'api/',
    'build/',
    'web.config',
    '_redirects',
    'test_routing.php'
];

console.log('\n📁 Archivos para subir a cPanel:');
filesToUpload.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            console.log(`   📂 ${file}/`);
        } else {
            console.log(`   📄 ${file}`);
        }
    } else {
        console.log(`   ❌ ${file} (no encontrado)`);
    }
});

console.log('\n🎯 Instrucciones de configuración:');
console.log('\n1. Sube todos los archivos listados arriba a tu cPanel');
console.log('2. Asegúrate de que los permisos sean correctos:');
console.log('   - Archivos: 644');
console.log('   - Carpetas: 755');
console.log('\n3. Verifica que mod_rewrite esté habilitado en cPanel:');
console.log('   - cPanel > Software > MultiPHP Manager');
console.log('   - Verificar que mod_rewrite esté activado');
console.log('\n4. Prueba las siguientes URLs:');
console.log('   - https://tudominio.com/test_routing.php');
console.log('   - https://tudominio.com/');
console.log('   - https://tudominio.com/usuarios');
console.log('   - https://tudominio.com/proyecto/1');
console.log('   - https://tudominio.com/api/usuarios.php');
console.log('\n5. Prueba actualizar la página (F5) en cualquier ruta');

console.log('\n🔧 Si el problema persiste:');
console.log('1. Verifica los logs de error en cPanel:');
console.log('   - cPanel > Logs > Error Logs');
console.log('   - Busca mensajes que empiecen con "CPANEL FINAL ROUTER"');
console.log('\n2. Contacta al soporte de tu hosting para:');
console.log('   - Verificar que mod_rewrite esté habilitado');
console.log('   - Confirmar que .htaccess esté permitido');
console.log('   - Verificar la configuración del servidor');

console.log('\n📋 Configuración aplicada:');
console.log('- Router final: cpanel_final.php → index.php');
console.log('- .htaccess específico para cPanel');
console.log('- Configuración de CORS y cache');
console.log('- Manejo de archivos estáticos y API');

console.log('\n✅ Configuración completada!'); 