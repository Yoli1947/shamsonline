
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

async function check() {
    console.log('Buscando productos por proveedor...');
    const { data: products, error } = await supabase
        .from('products')
        .select('name, provider, brand(name)')
        .order('provider');

    if (error) {
        console.error(error);
        return;
    }

    const providers = {};
    products.forEach(p => {
        const prov = p.provider || 'S/N';
        if (!providers[prov]) providers[prov] = [];
        providers[prov].push(`${p.name} (Marca: ${p.brand?.name || 'S/N'})`);
    });

    console.log('Proveedores encontrados:');
    Object.keys(providers).forEach(k => {
        if (k.toUpperCase().includes('OREIRO') || k.toUpperCase().includes('ALLBRAND')) {
            console.log(` - Proveedor: ${k} (${providers[k].length} productos)`);
            providers[k].slice(0, 5).forEach(p => console.log(`   * ${p}`));
        }
    });

    const { data: brands } = await supabase.from('brands').select('id, name');
    console.log('Marcas Oreiro:');
    brands.filter(b => b.name.toUpperCase().includes('OREIRO')).forEach(b => console.log(` - ${b.name} (${b.id})`));
}

check();
