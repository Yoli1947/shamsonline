
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nksmphozttipzpdrxhft.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rc21waG96dHRpcHpwZHJ4aGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTY0NTIsImV4cCI6MjA4NjE5MjQ1Mn0.NikzUUWBpgah3vDmAcjyzjQRNdMpziy0sLDoYgWMfqY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseSizes() {
    console.log('--- Shifting Sizes for TIPO 1 Products (XXS->XS, XS->S, S->M, etc.) ---');

    // 1. Get all products with size_type = '1'
    const { data: products, error: pError } = await supabase
        .from('products')
        .select('id')
        .eq('size_type', '1');

    if (pError) {
        console.error('Error fetching products:', pError);
        return;
    }

    console.log(`Found ${products.length} products with TIPO 1.`);

    const productIds = products.map(p => p.id);

    // We process in chunks or all at once if not too many
    // Let's do a mapping in reverse to avoid collision if we were doing it one by one, 
    // but here we are updating specific variants.

    const sizeMap = {
        '4XL': '5XL',
        '3XL': '4XL',
        '2XL': '3XL',
        'XL': '2XL',
        'L': 'XL',
        'M': 'L',
        'S': 'M',
        'XS': 'S',
        'XXS': 'XS'
    };

    const reverseSizes = ['4XL', '3XL', '2XL', 'XL', 'L', 'M', 'S', 'XS', 'XXS'];

    let totalUpdated = 0;

    for (const oldSize of reverseSizes) {
        const newSize = sizeMap[oldSize];
        console.log(`Updating ${oldSize} to ${newSize}...`);

        const { data, error } = await supabase
            .from('product_variants')
            .update({ size: newSize })
            .in('product_id', productIds)
            .eq('size', oldSize)
            .select('id');

        if (error) {
            console.error(`Error updating ${oldSize}:`, error);
        } else {
            const count = data ? data.length : 0;
            console.log(`Updated ${count} variants.`);
            totalUpdated += count;
        }
    }

    console.log(`Done. Total variants updated: ${totalUpdated}`);
}

fixDatabaseSizes();
