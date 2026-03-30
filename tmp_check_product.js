
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

async function checkProduct() {
    console.log('🔍 Buscando "connie" en la base de datos...');

    const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, is_published, is_active, image_url')
        .ilike('name', '%connie%');

    if (pError) {
        console.error('Error buscando productos:', pError);
        return;
    }

    if (!products || products.length === 0) {
        console.log('❌ No se encontró ningún producto con "connie" en el nombre.');
        return;
    }

    for (const prod of products) {
        console.log(`\n📦 Producto: ${prod.name} (ID: ${prod.id})`);
        console.log(`   - Publicado: ${prod.is_published}`);
        console.log(`   - Activo: ${prod.is_active}`);
        console.log(`   - Imagen: ${prod.image_url}`);

        const { data: variants, error: vError } = await supabase
            .from('product_variants')
            .select('size, stock')
            .eq('product_id', prod.id);

        if (vError) {
            console.error('   Error buscando variantes:', vError);
        } else {
            const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
            console.log(`   - Variantes: ${variants.length}`);
            console.log(`   - Stock Total: ${totalStock}`);
            variants.forEach(v => {
                console.log(`     * Talle ${v.size}: ${v.stock}`);
            });
        }
    }
}

checkProduct().catch(console.error);
