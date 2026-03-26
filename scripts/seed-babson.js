
import { createClient } from '@supabase/supabase-js'
import process from 'process'

// Cargar variables de entorno manualmente porque no estamos usando dotenv y es un script simple
// IMPORTANTE: NO uses estas claves en producción real fuera de este script local seguro
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tu-url.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key'

// Nota: Para ejecutar este script necesitas pasar las variables de entorno o crear un archivo .env que node pueda leer (con dotenv).
// O mejor, leo el archivo .env localmente.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

let envConfig = {}
try {
    const envFile = fs.readFileSync(envPath, 'utf8')
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            envConfig[key.trim()] = value.trim()
        }
    })
} catch (e) {
    console.log('No se pudo leer .env, usando variables de proceso')
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function seedBabson() {
    console.log('🚀 Iniciando carga de producto "Babson"...')

    // 1. Buscar o Crear Marca: Perramus
    console.log('🔍 Buscando marca "Perramus"...')
    let { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('id')
        .eq('name', 'Perramus')
        .maybeSingle()

    if (!brand) {
        console.log('➕ Marca no encontrada. Creando "Perramus"...')
        const { data: newBrand, error: createBrandError } = await supabase
            .from('brands')
            .insert({ name: 'Perramus', slug: 'perramus', is_active: true })
            .select()
            .single()

        if (createBrandError) throw createBrandError
        brand = newBrand
        console.log('✅ Marca creada:', brand.id)
    } else {
        console.log('✅ Marca existente:', brand.id)
    }

    // 2. Buscar o Crear Categoría: Abrigos (Outerwear)
    console.log('🔍 Buscando categoría "Abrigos"...')
    let { data: category, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Abrigos')
        .maybeSingle()

    if (!category) {
        // Intentar buscar "Outerwear" por si acaso
        let { data: catOuter } = await supabase.from('categories').select('id').eq('name', 'Outerwear').maybeSingle()
        if (catOuter) {
            category = catOuter
            console.log('✅ Categoría "Outerwear" encontrada.')
        } else {
            console.log('➕ Categoría no encontrada. Creando "Abrigos"...')
            const { data: newCat, error: createCatError } = await supabase
                .from('categories')
                .insert({ name: 'Abrigos', slug: 'abrigos', is_active: true })
                .select()
                .single()

            if (createCatError) throw createCatError
            category = newCat
            console.log('✅ Categoría creada:', category.id)
        }
    } else {
        console.log('✅ Categoría existente:', category.id)
    }

    // 3. Insertar Producto: Babson
    const productData = {
        name: 'Babson',
        slug: 'babson-perramus', // Slug único
        description: 'Campera con bolsa para el guardado de la prenda. Acceso con cierre engomado negro. Bolsillos delanteros ocultos y puños ajustables.',
        price: 190000,          // Original price
        sale_price: 155000,     // Sale price
        is_on_sale: true,
        is_active: true,
        is_featured: true,
        brand_id: brand.id,
        category_id: category.id
    }

    console.log('📦 Insertando producto "Babson"...')

    // Verificar si ya existe para no duplicar
    const { data: existingProduct } = await supabase.from('products').select('id').eq('slug', productData.slug).maybeSingle()

    let productId
    if (existingProduct) {
        console.log('⚠️ El producto ya existe. Actualizando...')
        const { data: updated, error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id)
            .select()
            .single()
        if (updateError) throw updateError
        productId = updated.id
        console.log('✅ Producto actualizado:', productId)
    } else {
        const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single()
        if (createError) throw createError
        productId = newProduct.id
        console.log('✅ Producto creado:', productId)
    }

    // 4. Insertar Imagen
    const imageUrl = 'https://acdn.mitiendanube.com/stores/002/439/662/products/babson-off-white-frente1-2a6d7b4d1d6a4c6a6a16972233660346-640-0.webp'
    console.log('🖼️ Vinculando imagen...')

    // Borrar imágenes anteriores si es actualización para evitar duplicados visuales
    await supabase.from('product_images').delete().eq('product_id', productId)

    const { error: imgError } = await supabase
        .from('product_images')
        .insert({
            product_id: productId,
            url: imageUrl,
            is_primary: true
        })

    if (imgError) throw imgError
    console.log('✅ Imagen vinculada correctamente.')

    console.log('🎉 ¡PROCESO TERMINADO CON ÉXITO!')
}

seedBabson().catch(err => {
    console.error('❌ Error fatal:', err)
    process.exit(1)
})
