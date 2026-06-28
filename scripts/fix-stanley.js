/**
 * fix-stanley.js
 * Sin argumentos  → modo DRY-RUN: solo muestra qué cambiaría
 * Con --apply     → aplica los cambios en la DB
 *
 * Uso:
 *   node scripts/fix-stanley.js           (ver qué cambiaría)
 *   node scripts/fix-stanley.js --apply   (aplicar cambios)
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

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Falta configuración de Supabase en .env')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const DRY_RUN = !process.argv.includes('--apply')

async function fixStanley() {
    if (DRY_RUN) {
        console.log('🔎 MODO DRY-RUN — no se modificará nada en la DB\n')
    } else {
        console.log('⚡ MODO APPLY — se van a modificar registros en la DB\n')
    }

    // 1. Buscar marca Stanley
    const { data: stanleyBrand } = await supabase
        .from('brands').select('id, name').ilike('name', '%stanley%').maybeSingle()
    if (!stanleyBrand) { console.error('❌ Marca Stanley no encontrada en brands.'); process.exit(1) }
    console.log(`✅ Marca: "${stanleyBrand.name}" (id: ${stanleyBrand.id})`)

    // 2. Buscar categoría cafetería
    const { data: cafCat } = await supabase
        .from('categories').select('id, name').or('name.ilike.%cafet%,name.ilike.%coffee%').maybeSingle()
    if (!cafCat) { console.error('❌ Categoría cafetería/coffee no encontrada.'); process.exit(1) }
    console.log(`✅ Categoría: "${cafCat.name}" (id: ${cafCat.id})\n`)

    // 3. Buscar todos los productos con SKU que empieza con "ST" (Stanley)
    //    + los que tengan "stanley" en nombre/SKU/proveedor
    const { data: bySku, error: skuErr } = await supabase
        .from('products')
        .select('id, name, sku, brand_id, category_id, provider')
        .ilike('sku', 'ST%')

    if (skuErr) { console.error('❌ Error al buscar por SKU:', skuErr.message); process.exit(1) }

    const { data: byName } = await supabase
        .from('products')
        .select('id, name, sku, brand_id, category_id, provider')
        .or('name.ilike.%stanley%,provider.ilike.%stanley%')

    if (DRY_RUN) {
        console.log('📊 DIAGNÓSTICO:')
        console.log(`   SKU empieza con "ST": ${bySku?.length ?? 0}`)
        bySku?.forEach(p => console.log(`     - ${p.name} | SKU: ${p.sku} | marca actual: ${p.brand_id ?? 'null'}`))
        console.log(`   Con "stanley" en nombre/proveedor: ${byName?.length ?? 0}`)
        byName?.forEach(p => console.log(`     - ${p.name} | SKU: ${p.sku}`))
        console.log()
    }

    // Unir y deduplicar
    const all = [...(bySku || []), ...(byName || [])]
    const seen = new Set()
    const candidates = all.filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
    })

    const toUpdate = candidates.filter(p =>
        p.brand_id !== stanleyBrand.id || p.category_id !== cafCat.id
    )

    if (toUpdate.length === 0) {
        console.log('✅ No hay productos para actualizar — todo ya está correcto.')
        process.exit(0)
    }

    console.log(`📋 Productos que se van a actualizar (${toUpdate.length} en total):\n`)
    toUpdate.forEach(p => {
        const brandOk = p.brand_id === stanleyBrand.id ? '✅' : '🔄'
        const catOk = p.category_id === cafCat.id ? '✅' : '🔄'
        console.log(`  ${brandOk}${catOk} ${p.name} (SKU: ${p.sku || 'sin SKU'})`)
        if (p.brand_id !== stanleyBrand.id)   console.log(`       marca: ${p.brand_id ?? 'null'} → ${stanleyBrand.id}`)
        if (p.category_id !== cafCat.id)       console.log(`       categ: ${p.category_id ?? 'null'} → ${cafCat.id}`)
    })

    if (DRY_RUN) {
        console.log(`\n──────────────────────────────────────────────`)
        console.log(`Para aplicar los cambios, ejecutá:`)
        console.log(`  node scripts/fix-stanley.js --apply`)
        process.exit(0)
    }

    // 5. Aplicar cambios
    console.log('\n🔄 Aplicando cambios...')
    const ids = toUpdate.map(p => p.id)
    const { error: upErr } = await supabase
        .from('products')
        .update({ brand_id: stanleyBrand.id, category_id: cafCat.id })
        .in('id', ids)

    if (upErr) { console.error('❌ Error al actualizar:', upErr.message); process.exit(1) }

    console.log(`\n✅ ¡Listo! ${ids.length} productos actualizados.`)
    console.log('   Invalidá el caché del navegador (Ctrl+Shift+R) para ver los cambios.')
}

fixStanley()
