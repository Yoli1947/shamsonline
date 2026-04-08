
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length > 0) env[key.trim()] = val.join('=').trim().replace(/^['"](.*)['"]$/, '$1');
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function unify() {
    console.log('Buscando marcas...');
    const { data: brands } = await supabase.from('brands').select('id, name');
    
    const lasOreiro = brands.find(b => b.name.toUpperCase().includes('LAS OREIRO'));
    const oreiroLove = brands.find(b => b.name.toUpperCase().includes('OREIRO LOVE'));

    if (!lasOreiro || !oreiroLove) {
        console.log('No se encontraron ambas marcas.');
        console.log('Marcas encontradas:', brands.map(b => b.name));
        return;
    }

    console.log(`Unificando ${lasOreiro.name} (${lasOreiro.id}) -> ${oreiroLove.name} (${oreiroLove.id})`);

    const { count, error } = await supabase
        .from('products')
        .update({ brand_id: oreiroLove.id })
        .eq('brand_id', lasOreiro.id);

    if (error) {
        console.error('Error actualizando productos:', error);
    } else {
        console.log(`¡Éxito! Se actualizaron ${count} productos.`);
        
        // Opcional: Desactivar la marca vieja
        await supabase.from('brands').delete().eq('id', lasOreiro.id);
        console.log('Marca "LAS OREIRO" eliminada.');
    }
}

unify();
