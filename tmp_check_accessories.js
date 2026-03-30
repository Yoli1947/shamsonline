
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccessories() {
    console.log('🔍 Buscando categoría "ACCESORIOS"...');

    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .ilike('name', '%ACCESORIOS%');

    if (catError) {
        console.error('Error cargando categorías:', catError);
        return;
    }

    if (!categories || categories.length === 0) {
        console.log('⚠️ No se encontró ninguna categoría con nombre "ACCESORIOS".');
        return;
    }

    for (const cat of categories) {
        console.log(`\n📂 Categoría: "${cat.name}" (ID: ${cat.id}, Slug: ${cat.slug}, Active: ${cat.is_active})`);
        
        // Contar productos en esta categoría
        const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id);
            
        console.log(`   📦 Total productos vinculados: ${count || 0}`);
        
        // Ver algunos productos
        if (count > 0) {
            const { data: sampleProducts } = await supabase
                .from('products')
                .select('name, is_published, is_active')
                .eq('category_id', cat.id)
                .limit(5);
            
            console.log('   🖼️ Muestra de productos:');
            sampleProducts.forEach(p => console.log(`     - [${p.is_published ? 'Pub' : 'NoPub'}|${p.is_active ? 'Act' : 'NoAct'}] ${p.name}`));
        }
    }
    
    // Buscar si hay productos con "ACCESORIOS" en el nombre pero sin categoría o en otra
    console.log('\n🔍 Buscando productos que menciones "ACCESORIOS" en su nombre o descripción...');
    const { data: textMatchProducts } = await supabase
        .from('products')
        .select('name, category_id')
        .or('name.ilike.%ACCESORIOS%,description.ilike.%ACCESORIOS%')
        .limit(10);
        
    if (textMatchProducts?.length > 0) {
        console.log('   📄 Se encontraron productos con "ACCESORIOS" en el texto:');
        textMatchProducts.forEach(p => console.log(`     - ${p.name} (Category ID: ${p.category_id || 'NULL'})`));
    } else {
        console.log('   No se encontraron productos por texto.');
    }
}

checkAccessories().catch(console.error);
