import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, parent_id');
  if (error) {
    console.error('Error fetching categories:', error);
    return;
  }
  console.log('Categories:');
  console.log(JSON.stringify(data, null, 2));
}

listCategories();
