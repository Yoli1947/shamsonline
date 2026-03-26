
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

async function fullDataBackup() {
    console.log('🚀 Iniciando BackUp de datos de Supabase...');

    // Crear carpeta _BACKUPS/DATA si no existe
    const rootBackup = path.resolve(__dirname, '../_BACKUPS');
    if (!fs.existsSync(rootBackup)) fs.mkdirSync(rootBackup);

    const now = new Date();
    const folderName = `DATA_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const backupPath = path.join(rootBackup, folderName);

    fs.mkdirSync(backupPath);

    const tables = [
        'brands',
        'categories',
        'products',
        'product_variants',
        'product_images',
        'site_settings'
    ];

    for (const table of tables) {
        process.stdout.write(`🔹 Exportando tabla: ${table}... `);
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
            console.log('❌ ERROR');
            console.error(error);
        } else {
            fs.writeFileSync(path.join(backupPath, `${table}.json`), JSON.stringify(data, null, 2));
            console.log(`✅ (${data.length} registros)`);
        }
    }

    console.log(`\n🎉 Respaldo de datos completado en: ${backupPath}`);
}

fullDataBackup().catch(console.error);
