/**
 * diagnose-categories.js
 * Muestra la estructura real de categorías en la DB
 * Uso: node scripts/diagnose-categories.js
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

let envConfig = {}
try {
    const envFile = fs.readFileSync(envPath, 'utf8')
    envFile.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=')
        const value = rest.join('=')
        if (key && value) envConfig[key.trim()] = value.trim()
    })
} catch { }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function diagnose() {
    const { data: cats } = await supabase.from('categories').select('*').order('name')

    const parents = cats.filter(c => !c.parent_id)
    const children = cats.filter(c => c.parent_id)

    console.log('\n📁 CATEGORÍAS PADRE (sin parent_id):')
    parents.forEach(p => console.log(`  [${p.id}] ${p.name}`))

    console.log('\n📂 SUBCATEGORÍAS (con parent_id):')
    parents.forEach(parent => {
        const kids = children.filter(c => c.parent_id === parent.id)
        if (kids.length > 0) {
            console.log(`\n  ▸ ${parent.name}:`)
            kids.forEach(k => console.log(`      - ${k.name} [${k.id}]`))
        }
    })

    const orphans = children.filter(c => !parents.find(p => p.id === c.parent_id))
    if (orphans.length > 0) {
        console.log('\n⚠️  SUBCATEGORÍAS SIN PADRE CONOCIDO:')
        orphans.forEach(o => console.log(`  - ${o.name} (parent_id: ${o.parent_id})`))
    }

    // Mostrar qué categorías tienen los productos de Hunter
    console.log('\n🏷️  CATEGORÍAS DE PRODUCTOS HUNTER:')
    const { data: hunterProds } = await supabase
        .from('products')
        .select('name, sku, category:categories(id, name, parent_id)')
        .ilike('name', '%hunter%')
        .limit(10)

    if (!hunterProds?.length) {
        // Buscar por marca
        const { data: byBrand } = await supabase
            .from('products')
            .select('name, sku, brand:brands(name), category:categories(id, name, parent_id)')
            .eq('is_published', true)
            .limit(300)
        const hunterByBrand = (byBrand || []).filter(p => p.brand?.name?.toLowerCase() === 'hunter')
        hunterByBrand.slice(0, 10).forEach(p => {
            const catParent = p.category?.parent_id ? parents.find(pa => pa.id === p.category.parent_id)?.name : 'sin padre'
            console.log(`  - ${p.name} | cat: ${p.category?.name || 'null'} | padre: ${catParent}`)
        })
    } else {
        hunterProds.forEach(p => {
            const catParent = p.category?.parent_id ? parents.find(pa => pa.id === p.category.parent_id)?.name : 'sin padre'
            console.log(`  - ${p.name} | cat: ${p.category?.name || 'null'} | padre: ${catParent}`)
        })
    }
}

diagnose()
