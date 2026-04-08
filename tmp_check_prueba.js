
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

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan las llaves de Supabase en el .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPrueba() {
    console.log('🔍 Buscando "prueba" en la base de datos...');

    const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, is_published, is_active, category_id, category:categories(name)')
        .ilike('name', '%prueba%');

    if (pError) {
        console.error('Error buscando productos:', pError);
        return;
    }

    if (!products || products.length === 0) {
        console.log('❌ No se encontró ningún producto con "prueba" en el nombre.');
        
        console.log('🔍 Buscando productos en la categoría "cafeteria"...');
        const { data: catProds, error: cError } = await supabase
            .from('products')
            .select('id, name, is_published, is_active, category:categories(name)')
            .eq('category.name', 'cafeteria');
            
        if (catProds) {
             catProds.forEach(p => console.log(`- ${p.name} (${p.category?.name})`));
        }
        return;
    }

    for (const prod of products) {
        console.log(`\n📦 Producto: ${prod.name} (ID: ${prod.id})`);
        console.log(`   - Categoría: ${prod.category?.name}`);
        console.log(`   - Publicado: ${prod.is_published}`);
        console.log(`   - Activo: ${prod.is_active}`);
    }
}

checkPrueba().catch(console.error);
