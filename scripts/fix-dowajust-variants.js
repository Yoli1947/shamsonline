import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rsvcgduyogqljwzbohkz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'REMOVED_SECRET';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDowajustVariants() {
    // 1. Buscar el producto
    const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', '%dowajust%')
        .ilike('name', '%negro%');

    if (pError) { console.error('Error buscando producto:', pError); return; }
    if (!products || products.length === 0) { console.error('No se encontró el producto Dowajust Boot Negro'); return; }

    const product = products[0];
    console.log(`Producto encontrado: ${product.name} (id: ${product.id})`);

    // 2. Borrar variantes actuales
    const { error: delError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', product.id);

    if (delError) { console.error('Error borrando variantes:', delError); return; }
    console.log('Variantes anteriores eliminadas.');

    // 3. Insertar variantes correctas
    const newVariants = [
        { product_id: product.id, size: '42', color: 'Negro', stock: 5 },
        { product_id: product.id, size: '43', color: 'Negro', stock: 6 },
        { product_id: product.id, size: '44', color: 'Negro', stock: 3 },
        { product_id: product.id, size: '45', color: 'Negro', stock: 2 },
    ];

    const { error: insError } = await supabase
        .from('product_variants')
        .insert(newVariants);

    if (insError) { console.error('Error insertando variantes:', insError); return; }
    console.log('✓ Variantes actualizadas correctamente:');
    newVariants.forEach(v => console.log(`  Talle ${v.size}: ${v.stock} unidades`));
}

fixDowajustVariants();
