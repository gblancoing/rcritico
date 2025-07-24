const fs = require('fs');
const path = require('path');

console.log('🚀 Preparando proyecto para producción en cPanel...');

// Verificar que existe el build
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
    console.error('❌ Error: No se encontró la carpeta build/');
    console.log('💡 Ejecuta primero: npm run build');
    process.exit(1);
}

// Verificar archivos críticos
const criticalFiles = [
    'index.php',
    'api/config.php',
    'api/db.php',
    'build/index.html',
    'web.config'
];

console.log('📋 Verificando archivos críticos...');
criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - NO ENCONTRADO`);
    }
});

// Verificar y copiar _redirects si es necesario
const redirectsSource = path.join(__dirname, 'public', '_redirects');
const redirectsDest = path.join(__dirname, '_redirects');

if (fs.existsSync(redirectsSource)) {
    if (!fs.existsSync(redirectsDest)) {
        fs.copyFileSync(redirectsSource, redirectsDest);
        console.log('✅ _redirects (copiado desde public/)');
    } else {
        console.log('✅ _redirects');
    }
} else {
    // Crear _redirects si no existe
    const redirectsContent = `# Manejo de rutas para React Router
# Redirigir todas las rutas que no sean archivos estáticos a index.html
/*    /index.html   200

# Redirigir peticiones de API a la carpeta api
/api/*    /api/:splat    200`;
    
    fs.writeFileSync(redirectsDest, redirectsContent);
    console.log('✅ _redirects (creado)');
}

// Crear archivo de configuración de ejemplo para producción
const configExample = `<?php
// Configuración de la base de datos según el entorno
function getDbConfig() {
    // Detectar si estamos en desarrollo local o producción
    $isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']) || 
               strpos($_SERVER['HTTP_HOST'], 'localhost') !== false;
    
    if ($isLocal) {
        // Configuración para desarrollo local (XAMPP)
        return [
            'host' => 'localhost',
            'user' => 'root',
            'pass' => '',
            'dbname' => 'financiero'
        ];
    } else {
        // IMPORTANTE: Cambiar estos valores según tu configuración de cPanel
        return [
            'host' => 'localhost',
            'user' => 'jejcatvn', // Cambiar por tu usuario de base de datos
            'pass' => '+T2v9jtSZS', // Cambiar por tu contraseña de base de datos
            'dbname' => 'jejcatvn_financiero' // Cambiar por el nombre de tu base de datos
        ];
    }
}

// Función para obtener la configuración de la URL base
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $script_name = $_SERVER['SCRIPT_NAME'];
    $base_path = dirname($script_name);
    
    return $protocol . '://' . $host . $base_path;
}

// Función para obtener la ruta de la API
function getApiUrl() {
    $base_url = getBaseUrl();
    return $base_url . '/api';
}
?>`;

console.log('📝 Creando archivo de configuración de ejemplo...');
fs.writeFileSync(path.join(__dirname, 'api/config.example.php'), configExample);

// Crear lista de archivos para subir
const filesToUpload = [
    'index.php',
    'api/',
    'build/',
    'web.config',
    '_redirects',
    'README_CPANEL.md',
    'Respaldo BD_16-07-2025.sql'
];

console.log('\n📦 Archivos que debes subir a cPanel:');
filesToUpload.forEach(file => {
    console.log(`   📁 ${file}`);
});

console.log('\n🎯 Pasos para desplegar en cPanel:');
console.log('1. 📝 Editar api/config.php con tus credenciales de base de datos');
console.log('2. 📤 Subir todos los archivos listados arriba a tu directorio público');
console.log('3. 🗄️  Importar la base de datos desde Respaldo BD_16-07-2025.sql');
console.log('4. 🔗 Acceder a tu dominio para probar la aplicación');

console.log('\n✅ Proyecto preparado para producción!');
console.log('📖 Revisa README_CPANEL.md para instrucciones detalladas'); 