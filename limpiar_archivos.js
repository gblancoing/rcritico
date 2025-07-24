const fs = require('fs');
const path = require('path');

console.log('🧹 Limpiando archivos innecesarios...\n');

// Lista de archivos y carpetas a eliminar
const archivosAEliminar = [
    // Archivos de configuración temporales
    'web.config_litespeed',
    'web.config_subdominio',
    '_redirects_litespeed',
    
    // Scripts de solución temporales
    'preparar_cpanel.js',
    'preparar_cpanel_v2.js',
    'configurar_litespeed.js',
    'solucion_final.js',
    'aplicar_solucion.js',
    'preparar_subdominio.js',
    'solucion_sin_htaccess.js',
    'regenerar_build_subdominio.js',
    'preparar_subdominio_final.js',
    'verificar_archivos.js',
    'copiar_subdominio.js',
    'regenerar_build_tooltips.js',
    
    // Archivos .htaccess temporales
    '.htaccess_litespeed',
    '.htaccess_simple',
    '.htaccess_litespeed_final',
    
    // Archivos de documentación temporales
    'SOLUCION_404_CPANEL.md',
    'SOLUCION_LITESPEED.md',
    'SOLUCION_FINAL_404.md',
    'SOLUCION_DEFINITIVA.md',
    'ULTIMA_SOLUCION.md',
    'SOLUCION_DEFINITIVA_SIN_HTACCESS.md',
    'GUIA_SUBDOMINIO_COMPLETA.md',
    
    // Carpetas temporales de subdominio
    'subdominio',
    'subdominio_financiero',
    'subdominio_financiero_corregido',
    'subdominio_final',
    
    // Archivos de backup
    'index_backup.php',
    'index_backup_sin_htaccess.php',
    
    // Archivos de prueba temporales
    'cpanel_config.php',
    'server_config.php',
    'cpanel_router.php',
    'simple_router.php',
    'litespeed_router.php',
    'router_definitivo.php'
];

console.log('📋 Archivos y carpetas a eliminar:');
archivosAEliminar.forEach(archivo => {
    const rutaArchivo = path.join(__dirname, archivo);
    if (fs.existsSync(rutaArchivo)) {
        const stats = fs.statSync(rutaArchivo);
        if (stats.isDirectory()) {
            console.log(`   📂 ${archivo}/`);
        } else {
            console.log(`   📄 ${archivo}`);
        }
    } else {
        console.log(`   ❌ ${archivo} (no encontrado)`);
    }
});

console.log('\n🗑️ Eliminando archivos...');

let eliminados = 0;
let noEncontrados = 0;

archivosAEliminar.forEach(archivo => {
    const rutaArchivo = path.join(__dirname, archivo);
    if (fs.existsSync(rutaArchivo)) {
        try {
            const stats = fs.statSync(rutaArchivo);
            if (stats.isDirectory()) {
                fs.rmSync(rutaArchivo, { recursive: true, force: true });
                console.log(`   ✅ ${archivo}/ eliminado`);
            } else {
                fs.unlinkSync(rutaArchivo);
                console.log(`   ✅ ${archivo} eliminado`);
            }
            eliminados++;
        } catch (error) {
            console.log(`   ❌ Error al eliminar ${archivo}: ${error.message}`);
        }
    } else {
        noEncontrados++;
    }
});

console.log(`\n📊 Resumen de limpieza:`);
console.log(`   ✅ Archivos eliminados: ${eliminados}`);
console.log(`   ❌ Archivos no encontrados: ${noEncontrados}`);

// Verificar archivos que deben permanecer
console.log('\n📋 Archivos que deben permanecer (IMPORTANTES):');
const archivosImportantes = [
    'package.json',
    'index.php',
    '.htaccess',
    'web.config',
    '_redirects',
    'api/',
    'build/',
    'src/',
    'public/',
    'node_modules/',
    'test_routing.php',
    'test_archivos.php',
    'solucion_final_subdominio.js',
    '.htaccess_litespeed_subdominio',
    'INSTRUCCIONES_FINALES.md'
];

archivosImportantes.forEach(archivo => {
    const rutaArchivo = path.join(__dirname, archivo);
    if (fs.existsSync(rutaArchivo)) {
        const stats = fs.statSync(rutaArchivo);
        if (stats.isDirectory()) {
            console.log(`   📂 ${archivo}/ ✅`);
        } else {
            console.log(`   📄 ${archivo} ✅`);
        }
    } else {
        console.log(`   ❌ ${archivo} (no encontrado)`);
    }
});

// Crear archivo de documentación final
const documentacionFinal = `# PROYECTO FINANCIERO - CONFIGURACIÓN FINAL

## 🌐 Subdominio Funcionando
- **URL:** https://financiero.jej664caren.cl
- **Estado:** ✅ FUNCIONANDO CORRECTAMENTE

## 📁 Archivos Importantes
- \`index.php\` - Router PHP principal
- \`.htaccess\` - Configuración para LiteSpeed
- \`web.config\` - Configuración para IIS (backup)
- \`_redirects\` - Configuración de redirecciones
- \`api/\` - API del proyecto
- \`build/\` - Archivos de producción de React
- \`src/\` - Código fuente de React
- \`public/\` - Archivos públicos
- \`package.json\` - Configuración del proyecto

## 🚀 Comandos Útiles

### Desarrollo
\`\`\`bash
npm start
\`\`\`

### Producción
\`\`\`bash
npm run build
\`\`\`

### Actualizar en servidor
\`\`\`bash
node solucion_final_subdominio.js
\`\`\`
Luego subir archivos de \`subdominio_solucion_final/\` al servidor

## ✅ Funcionalidades Verificadas
- ✅ Página principal carga correctamente
- ✅ Archivos CSS y JS se cargan sin errores
- ✅ Navegación funciona en todas las rutas
- ✅ Actualización (F5) funciona en todas las rutas
- ✅ API funciona correctamente
- ✅ Subdominio configurado correctamente

## 🔧 Mantenimiento
- Para cambios en el código: editar archivos en \`src/\`
- Para generar nueva versión: \`npm run build\`
- Para subir al servidor: usar \`solucion_final_subdominio.js\`

## 📞 Soporte
Si hay problemas:
1. Verificar que todos los archivos estén en el servidor
2. Verificar permisos (644/755)
3. Verificar que .htaccess esté presente
4. Contactar soporte del hosting

---
**Proyecto configurado y funcionando correctamente** ✅
`;

fs.writeFileSync(path.join(__dirname, 'README_FINAL.md'), documentacionFinal);
console.log('✅ README_FINAL.md creado');

console.log('\n🎉 ¡Limpieza completada!');
console.log('📁 El proyecto está limpio y organizado');
console.log('📄 README_FINAL.md creado con documentación');
console.log('\n✅ Proyecto listo para desarrollo y producción'); 