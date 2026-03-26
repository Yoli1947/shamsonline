import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

// Leer .env
const env = {};
try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                env[key] = value;
            }
        });
    }
} catch (e) {
    console.warn('No se pudo leer .env');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan las llaves de Supabase en el .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fullAppBackup() {
    console.log('🚀 Iniciando BACKUP COMPLETO de la aplicación...\n');

    // Crear carpeta _BACKUPS si no existe
    const rootBackup = path.resolve(__dirname, '../_BACKUPS');
    if (!fs.existsSync(rootBackup)) fs.mkdirSync(rootBackup);

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const folderName = `BACKUP_COMPLETO_${timestamp}`;
    const backupPath = path.join(rootBackup, folderName);

    fs.mkdirSync(backupPath);

    // ========================================
    // 1. BACKUP DE BASE DE DATOS
    // ========================================
    console.log('📊 PASO 1: Respaldando base de datos...');
    const dbBackupPath = path.join(backupPath, 'database');
    fs.mkdirSync(dbBackupPath);

    const tables = [
        'brands',
        'categories',
        'products',
        'product_variants',
        'product_images',
        'site_settings',
        'size_curves',
        'orders',
        'order_items'
    ];

    for (const table of tables) {
        process.stdout.write(`  🔹 ${table}... `);
        try {
            const { data, error } = await supabase.from(table).select('*');

            if (error) {
                console.log('❌ ERROR');
                console.error(error);
            } else {
                fs.writeFileSync(
                    path.join(dbBackupPath, `${table}.json`),
                    JSON.stringify(data, null, 2)
                );
                console.log(`✅ (${data.length} registros)`);
            }
        } catch (err) {
            console.log(`⚠️ SKIP (${err.message})`);
        }
    }

    // ========================================
    // 2. BACKUP DE CÓDIGO FUENTE
    // ========================================
    console.log('\n📁 PASO 2: Respaldando código fuente...');
    const codeBackupPath = path.join(backupPath, 'codigo');
    fs.mkdirSync(codeBackupPath);

    const projectRoot = path.resolve(__dirname, '..');

    // Directorios y archivos a respaldar
    const itemsToBackup = [
        'components',
        'context',
        'lib',
        'pages',
        'public',
        'scripts',
        'src',
        'types',
        'package.json',
        'package-lock.json',
        'vite.config.ts',
        'tsconfig.json',
        'index.html',
        'App.tsx',
        'Store.tsx',
        'main.tsx',
        'index.css',
        'tailwind.config.js',
        'postcss.config.js'
    ];

    function copyRecursive(src, dest) {
        if (!fs.existsSync(src)) return;

        const stats = fs.statSync(src);

        if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

            const files = fs.readdirSync(src);
            files.forEach(file => {
                // Ignorar node_modules, .git, dist, etc.
                if (['node_modules', '.git', 'dist', '_BACKUPS', '.vite'].includes(file)) return;

                copyRecursive(
                    path.join(src, file),
                    path.join(dest, file)
                );
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    for (const item of itemsToBackup) {
        const srcPath = path.join(projectRoot, item);
        const destPath = path.join(codeBackupPath, item);

        if (fs.existsSync(srcPath)) {
            process.stdout.write(`  📄 ${item}... `);
            try {
                copyRecursive(srcPath, destPath);
                console.log('✅');
            } catch (err) {
                console.log(`⚠️ ERROR: ${err.message}`);
            }
        }
    }

    // ========================================
    // 3. BACKUP DE CONFIGURACIÓN
    // ========================================
    console.log('\n⚙️  PASO 3: Respaldando configuración...');
    const configBackupPath = path.join(backupPath, 'configuracion');
    fs.mkdirSync(configBackupPath);

    // Guardar .env (sin valores sensibles expuestos)
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envSafe = envContent.split('\n').map(line => {
            if (line.includes('SUPABASE') || line.includes('KEY') || line.includes('SECRET')) {
                const [key] = line.split('=');
                return `${key}=***OCULTO***`;
            }
            return line;
        }).join('\n');

        fs.writeFileSync(path.join(configBackupPath, 'env-template.txt'), envSafe);
        console.log('  ✅ Plantilla .env guardada (sin claves sensibles)');
    }

    // Crear archivo README con información del backup
    const readmeContent = `# BACKUP COMPLETO - TIENDA SHAMS
Fecha: ${now.toLocaleString('es-AR')}
Timestamp: ${timestamp}

## Contenido del Backup

### 📊 Base de Datos (/database)
- ${tables.length} tablas exportadas en formato JSON
- Incluye productos, categorías, marcas, variantes, imágenes, pedidos, etc.

### 📁 Código Fuente (/codigo)
- Todos los componentes React
- Páginas del admin y tienda
- Librerías y utilidades
- Configuración de Vite/TypeScript
- Archivos de estilos

### ⚙️ Configuración (/configuracion)
- Plantilla de variables de entorno (.env)
- NOTA: Las claves sensibles están ocultas por seguridad

## Cómo Restaurar

### Base de Datos:
1. Ir a Supabase Dashboard
2. Usar los archivos JSON en /database para restaurar cada tabla
3. O usar el script de restauración si está disponible

### Código:
1. Copiar el contenido de /codigo a un nuevo directorio
2. Ejecutar: npm install
3. Configurar .env con las claves correctas
4. Ejecutar: npm run dev

## Notas Importantes
- Este backup NO incluye node_modules (reinstalar con npm install)
- Las claves de API deben configurarse manualmente en .env
- Verificar que las versiones de dependencias sean compatibles

---
Generado automáticamente por backup-app.js
`;

    fs.writeFileSync(path.join(backupPath, 'README.md'), readmeContent);

    // ========================================
    // 4. RESUMEN FINAL
    // ========================================
    console.log('\n✅ BACKUP COMPLETO FINALIZADO!');
    console.log(`\n📍 Ubicación: ${backupPath}`);
    console.log(`\n📊 Contenido:`);
    console.log(`   - Base de datos: ${tables.length} tablas`);
    console.log(`   - Código fuente completo`);
    console.log(`   - Configuración y README`);
    console.log(`\n💡 Tip: Comprime la carpeta manualmente y guárdala en un lugar seguro`);
    console.log(`   (USB, Google Drive, Dropbox, etc.)`);
}

fullAppBackup().catch(console.error);
