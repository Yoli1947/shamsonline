
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

async function checkBrands() {
    console.log('🔍 Obteniendo datos de las marcas...');

    const { data: brands, error } = await supabase
        .from('brands')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('⚙️ Marcas encontradas:');
    brands.forEach(b => {
        console.log(` - ${b.name}: logo_url="${b.logo_url || 'N/A'}", card_image_url="${b.card_image_url || 'N/A'}"`);
    });
}

checkBrands().catch(console.error);
