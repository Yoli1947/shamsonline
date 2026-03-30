
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

// Leer .env
const env = {};
try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).forEach(line => {
            const index = line.indexOf('=');
            if (index !== -1) {
                const key = line.substring(0, index).trim();
                const value = line.substring(index + 1).trim().replace(/^['"](.*)['"]$/, '$1');
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

async function checkSettings() {
    console.log('🔍 Obteniendo configuración del sitio...');

    const { data: settings, error } = await supabase
        .from('site_settings')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('⚙️ Configuración encontrada:');
    settings.forEach(s => {
        console.log(` - ${s.key}: ${s.value} (Actualizado: ${s.updated_at})`);
    });
}

checkSettings().catch(console.error);
