const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 PREPARACIÓN COMPLETA PARA PRODUCCIÓN');
console.log('=====================================\n');

// 1. Verificar que existe el directorio node_modules
console.log('📦 1. Verificando dependencias...');
if (!fs.existsSync('node_modules')) {
    console.log('⚠️  Instalando dependencias...');
    execSync('npm install', { stdio: 'inherit' });
}
console.log('✅ Dependencias verificadas\n');

// 2. Generar build de producción
console.log('🏗️  2. Generando build de producción...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build generado exitosamente\n');
} catch (error) {
    console.error('❌ Error al generar build:', error.message);
    process.exit(1);
}

// 3. Crear archivo de configuración para producción
console.log('⚙️  3. Configurando archivos para producción...');

// Función para actualizar archivos PHP con configuración condicional de errores
const updatePhpDebugging = (filePath) => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Patrón para encontrar configuraciones de debugging
        const debugPattern = /^\s*(ini_set\('display_errors',\s*1\);?\s*$\n^\s*ini_set\('display_startup_errors',\s*1\);?\s*$\n^\s*error_reporting\(E_ALL\);?\s*$)/gm;
        
        // Reemplazo condicional
        const conditionalDebug = `// Configuración de errores solo para desarrollo
if (in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) || 
    strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false) {
    // Solo mostrar errores en desarrollo local
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    // En producción, ocultar errores
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}`;

        if (content.match(debugPattern)) {
            content = content.replace(debugPattern, conditionalDebug);
            fs.writeFileSync(filePath, content);
            console.log(`   ✅ ${filePath} actualizado`);
        }
    }
};

// Archivos PHP a actualizar
const phpFiles = [
    'api/login.php',
    'api/proyectos.php',
    'api/proyecto.php',
    'api/regiones.php',
    'api/tablas_disponibles.php',
    'api/test_conexion.php'
];

phpFiles.forEach(updatePhpDebugging);

// 4. Verificar configuración de base de datos
console.log('\n🗄️  4. Verificando configuración de base de datos...');
const configPath = 'api/config.php';
if (fs.existsSync(configPath)) {
    console.log('✅ Archivo de configuración encontrado');
    console.log('⚠️  IMPORTANTE: Verifica las credenciales de producción en api/config.php');
} else {
    console.log('❌ Archivo api/config.php no encontrado');
}

// 5. Crear checklist de deploy
console.log('\n📋 5. Creando checklist de deploy...');
const deployChecklist = `# 📋 CHECKLIST DE DEPLOY A PRODUCCIÓN

## ✅ Pre-Deploy (Completado automáticamente)
- [x] Build de React generado
- [x] Configuraciones de debugging actualizadas
- [x] Archivos de configuración verificados

## 🎯 Deploy Manual (Debe hacer el usuario)
- [ ] **Base de Datos:**
  - [ ] Crear base de datos en cPanel
  - [ ] Importar: \`Respaldo BD_16-07-2025.sql\`
  - [ ] Verificar credenciales en \`api/config.php\`

- [ ] **Archivos a Subir:**
  - [ ] \`index.php\` (archivo principal)
  - [ ] Carpeta \`api/\` (backend completo)
  - [ ] Carpeta \`build/\` (frontend compilado)
  - [ ] \`web.config\` (configuración IIS)
  - [ ] \`_redirects\` (configuración de rutas)

- [ ] **Verificaciones Post-Deploy:**
  - [ ] Acceso al sitio web funciona
  - [ ] Login de usuarios funciona
  - [ ] Importación de archivos funciona
  - [ ] Visualización de datos funciona

## 🔗 URLs Importantes
- **Sitio web:** https://financiero.jej664caren.cl
- **API Test:** https://financiero.jej664caren.cl/api/test_conexion.php
- **Login:** https://financiero.jej664caren.cl/api/login.php

## 📞 Soporte
Si hay problemas, verificar:
1. Logs del servidor web
2. Credenciales de base de datos
3. Permisos de archivos (755 para directorios, 644 para archivos)
`;

fs.writeFileSync('DEPLOY_CHECKLIST.md', deployChecklist);
console.log('✅ Checklist creado: DEPLOY_CHECKLIST.md\n');

// 6. Crear archivo .htaccess para Apache
console.log('🔧 6. Creando configuración de servidor...');
const htaccess = `# Apache Configuration for React Router
RewriteEngine On

# Handle Angular and React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/).*$ /index.html [L]

# PHP Error handling in production
php_flag display_errors Off
php_flag display_startup_errors Off
php_value error_reporting 0

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# Cache optimization
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>`;

fs.writeFileSync('.htaccess', htaccess);
console.log('✅ .htaccess creado para Apache\n');

// 7. Verificar archivos críticos
console.log('🔍 7. Verificación final de archivos...');
const criticalFiles = [
    'index.php',
    'build/index.html',
    'api/config.php',
    'api/db.php',
    'api/login.php',
    'web.config',
    '_redirects',
    '.htaccess'
];

let allFilesOk = true;
criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - FALTANTE`);
        allFilesOk = false;
    }
});

console.log('\n🎉 PREPARACIÓN COMPLETA!');
console.log('=======================');

if (allFilesOk) {
    console.log('✅ Todos los archivos están listos para producción');
    console.log('📖 Revisa DEPLOY_CHECKLIST.md para los siguientes pasos');
    console.log('🚀 El proyecto está listo para subir a: https://financiero.jej664caren.cl');
} else {
    console.log('⚠️  Algunos archivos críticos faltan. Revisa la lista anterior.');
}

console.log('\n📁 Archivos que debes subir al servidor:');
console.log('   📄 index.php');
console.log('   📁 api/ (carpeta completa)');
console.log('   📁 build/ (carpeta completa)');
console.log('   📄 web.config');
console.log('   📄 _redirects');
console.log('   📄 .htaccess');
console.log('   📄 Respaldo BD_16-07-2025.sql (para importar en cPanel)'); 