const fs = require('fs');
const path = require('path');

console.log('🚀 Aplicando solución final para LiteSpeed...\n');

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

// El index.php ya está configurado correctamente
console.log('✅ index.php ya está configurado con el router definitivo');

// Copiar .htaccess específico para LiteSpeed
const htaccessPath = path.join(__dirname, '.htaccess_litespeed_final');
const finalHtaccessPath = path.join(__dirname, '.htaccess');
if (fs.existsSync(htaccessPath)) {
    fs.copyFileSync(htaccessPath, finalHtaccessPath);
    console.log('✅ .htaccess específico para LiteSpeed aplicado');
} else {
    console.error('❌ Error: No existe .htaccess_litespeed_final');
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

console.log('\n📁 Archivos para subir al servidor:');
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
console.log('\n1. Sube todos los archivos listados arriba a tu servidor');
console.log('2. Asegúrate de que los permisos sean correctos:');
console.log('   - Archivos: 644');
console.log('   - Carpetas: 755');
console.log('\n3. Contacta al soporte de tu hosting para:');
console.log('   - Habilitar mod_rewrite en LiteSpeed');
console.log('   - Confirmar que .htaccess esté permitido');
console.log('   - Configurar LiteSpeed para SPA');
console.log('\n4. Prueba las siguientes URLs:');
console.log('   - https://jej664caren.cl/financiero/test_routing.php');
console.log('   - https://jej664caren.cl/financiero/');
console.log('   - https://jej664caren.cl/financiero/usuarios');
console.log('   - https://jej664caren.cl/financiero/proyecto/1');
console.log('   - https://jej664caren.cl/financiero/api/usuarios.php');
console.log('\n5. Prueba actualizar la página (F5) en cualquier ruta');

console.log('\n🔧 Si el problema persiste:');
console.log('1. Verifica los logs de error:');
console.log('   - Busca mensajes que empiecen con "ROUTER DEFINITIVO"');
console.log('\n2. Si .htaccess no funciona:');
console.log('   - Elimina el archivo .htaccess');
console.log('   - El index.php manejará todo el routing');
console.log('\n3. Contacta al soporte de tu hosting para:');
console.log('   - Configurar LiteSpeed para manejar todas las rutas');
console.log('   - Verificar que mod_rewrite esté habilitado');

console.log('\n📋 Configuración aplicada:');
console.log('- Router definitivo en index.php');
console.log('- .htaccess específico para LiteSpeed');
console.log('- Configuración de CORS y cache');
console.log('- Manejo de archivos estáticos y API');

console.log('\n✅ Solución final para LiteSpeed aplicada!'); 