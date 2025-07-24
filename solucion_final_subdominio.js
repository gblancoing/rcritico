const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Aplicando solución final para subdominio...\n');

// Verificar que estamos en el directorio correcto
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Error: No se encontró package.json');
    process.exit(1);
}

console.log('✅ package.json encontrado');

// Verificar que la homepage esté configurada correctamente
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (packageJson.homepage !== 'https://financiero.jej664caren.cl') {
    console.error('❌ Error: La homepage no está configurada correctamente');
    console.log('💡 La homepage debe ser: https://financiero.jej664caren.cl');
    console.log('💡 Actual: ' + packageJson.homepage);
    process.exit(1);
}

console.log('✅ Homepage configurada correctamente: ' + packageJson.homepage);

// Eliminar build anterior si existe
const buildPath = path.join(__dirname, 'build');
if (fs.existsSync(buildPath)) {
    console.log('🗑️ Eliminando build anterior...');
    fs.rmSync(buildPath, { recursive: true, force: true });
    console.log('✅ Build anterior eliminado');
}

// Generar nuevo build
console.log('🔨 Generando nuevo build...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build generado correctamente');
} catch (error) {
    console.error('❌ Error al generar el build:', error.message);
    process.exit(1);
}

// Verificar que el build se generó correctamente
if (!fs.existsSync(buildPath)) {
    console.error('❌ Error: El build no se generó');
    process.exit(1);
}

const indexHtmlPath = path.join(buildPath, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
    console.error('❌ Error: index.html no se generó');
    process.exit(1);
}

console.log('✅ index.html generado correctamente');

// Verificar contenido del index.html
const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Buscar referencias a archivos CSS y JS
const cssMatches = indexContent.match(/href="[^"]*\.css[^"]*"/g);
const jsMatches = indexContent.match(/src="[^"]*\.js[^"]*"/g);

console.log('\n📄 Verificando referencias en index.html:');
console.log('Referencias CSS encontradas:');
if (cssMatches) {
    cssMatches.forEach(match => {
        console.log(`  - ${match}`);
        if (match.includes('/financiero/')) {
            console.log(`    ⚠️ ADVERTENCIA: Contiene /financiero/ extra`);
        } else {
            console.log(`    ✅ URL correcta`);
        }
    });
} else {
    console.log('  - No se encontraron referencias CSS');
}

console.log('Referencias JS encontradas:');
if (jsMatches) {
    jsMatches.forEach(match => {
        console.log(`  - ${match}`);
        if (match.includes('/financiero/')) {
            console.log(`    ⚠️ ADVERTENCIA: Contiene /financiero/ extra`);
        } else {
            console.log(`    ✅ URL correcta`);
        }
    });
} else {
    console.log('  - No se encontraron referencias JS');
}

// Crear directorio para subdominio
const subdominioDir = path.join(__dirname, 'subdominio_solucion_final');
if (fs.existsSync(subdominioDir)) {
    fs.rmSync(subdominioDir, { recursive: true, force: true });
}
fs.mkdirSync(subdominioDir);
console.log('\n✅ Directorio subdominio_solucion_final/ creado');

// Copiar .htaccess específico para LiteSpeed
const htaccessPath = path.join(__dirname, '.htaccess_litespeed_subdominio');
const finalHtaccessPath = path.join(subdominioDir, '.htaccess');
if (fs.existsSync(htaccessPath)) {
    fs.copyFileSync(htaccessPath, finalHtaccessPath);
    console.log('✅ .htaccess específico para LiteSpeed copiado');
} else {
    console.error('❌ Error: No existe .htaccess_litespeed_subdominio');
    process.exit(1);
}

// Lista de archivos y carpetas para copiar
const filesToCopy = [
    'index.php',
    'web.config',
    '_redirects',
    'api/',
    'build/',
    'test_routing.php',
    'test_archivos.php'
];

console.log('\n📁 Copiando archivos para subdominio:');
filesToCopy.forEach(file => {
    const sourcePath = path.join(__dirname, file);
    const destPath = path.join(subdominioDir, file);
    
    if (fs.existsSync(sourcePath)) {
        const stats = fs.statSync(sourcePath);
        if (stats.isDirectory()) {
            copyDirectory(sourcePath, destPath);
            console.log(`   📂 ${file}/ copiado`);
        } else {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`   📄 ${file} copiado`);
        }
    } else {
        console.log(`   ❌ ${file} (no encontrado)`);
    }
});

function copyDirectory(source, destination) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }
    
    const files = fs.readdirSync(source);
    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);
        
        const stats = fs.statSync(sourcePath);
        if (stats.isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    });
}

// Crear archivo de instrucciones finales
const instruccionesFinales = `# SOLUCIÓN FINAL PARA SUBDOMINIO

## 🌐 Subdominio: financiero.jej664caren.cl

## 📁 Archivos Preparados
Todos los archivos necesarios están en la carpeta 'subdominio_solucion_final/'

## 🚀 Pasos para Desplegar

### 1. Subir archivos al servidor
Subir TODOS los archivos de la carpeta 'subdominio_solucion_final/' al directorio del subdominio:
/public_html/financiero.jej664caren.cl/

### 2. Verificar permisos
- Archivos: 644
- Carpetas: 755
- .htaccess: 644

### 3. Probar URLs
- https://financiero.jej664caren.cl/test_routing.php
- https://financiero.jej664caren.cl/test_archivos.php
- https://financiero.jej664caren.cl/

### 4. Probar actualización (F5)
- Navegar a cualquier ruta
- Presionar F5
- Debe funcionar sin error 404

## ✅ Configuración Aplicada
- Homepage: https://financiero.jej664caren.cl
- Router PHP corregido para subdominio
- .htaccess específico para LiteSpeed
- Build regenerado con URLs correctas
- Archivos estáticos en build/static/

## 🔧 Si hay problemas
1. Verificar que todos los archivos estén subidos
2. Verificar permisos (644/755)
3. Verificar que .htaccess esté presente
4. Contactar soporte del hosting para habilitar mod_rewrite

## 📞 Soporte
Si necesitas ayuda, contacta al soporte del hosting con:
- URL del subdominio: https://financiero.jej664caren.cl
- Error específico
- Logs de error
- Solicitar habilitar mod_rewrite en LiteSpeed
`;

fs.writeFileSync(path.join(subdominioDir, 'INSTRUCCIONES_FINALES.md'), instruccionesFinales);
console.log('✅ Instrucciones finales creadas');

console.log('\n📋 Resumen de archivos para subdominio:');
const subdominioFiles = fs.readdirSync(subdominioDir);
subdominioFiles.forEach(file => {
    const filePath = path.join(subdominioDir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
        console.log(`   📂 ${file}/`);
    } else {
        console.log(`   📄 ${file}`);
    }
});

console.log('\n🎯 Próximos pasos:');
console.log('1. Subir TODOS los archivos de subdominio_solucion_final/ al servidor');
console.log('2. Reemplazar completamente los archivos en el subdominio');
console.log('3. Verificar permisos (644/755)');
console.log('4. Probar: https://financiero.jej664caren.cl/');
console.log('5. Verificar que F5 funcione en todas las rutas');

console.log('\n📋 URLs esperadas después de la corrección:');
console.log('- CSS: https://financiero.jej664caren.cl/static/css/main.xxxxx.css');
console.log('- JS: https://financiero.jej664caren.cl/static/js/main.xxxxx.js');

console.log('\n🚨 IMPORTANTE:');
console.log('- El .htaccess es CRÍTICO para que funcione');
console.log('- Si no funciona, contactar soporte del hosting');
console.log('- Solicitar habilitar mod_rewrite en LiteSpeed');

console.log('\n✅ Solución final preparada!');
console.log('📁 Todos los archivos están en: subdominio_solucion_final/'); 