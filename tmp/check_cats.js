require('dotenv').config();
const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .or('name.ilike.%CHALECO%,name.ilike.%CAMPERA%,name.ilike.%OTROS%');

    if (error) {
        console.error('Error fetching categories:', error);
        return;
    }

    console.log('Categories found:');
    data.forEach(c => {
        console.log(`- [${c.id}] ${c.name} (Parent: ${c.parent_id})`);
    });
}

checkCategories();
