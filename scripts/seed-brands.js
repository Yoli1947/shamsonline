
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
        const [key, value] = line.split('=')
        if (key && value) {
            envConfig[key.trim()] = value.trim()
        }
    })
} catch (e) {
    console.log('No se pudo leer .env')
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Falta configuración de Supabase')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const BRANDS_TO_ADD = [
    'Perramus',
    'Hunter',
    'Nautica',
    'Armesto',
    'Blaque',
    'Las Oreiro',
    'Allo Martinez',
    'Victoria Tucci',
    'Vitamina',
    'Uma',
    'Besha',
    'Swim Days'
]

async function seedBrands() {
    console.log('🚀 Iniciando carga de marcas...')

    for (const name of BRANDS_TO_ADD) {
        const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')

        const { data: existing } = await supabase
            .from('brands')
            .select('id')
            .eq('name', name)
            .maybeSingle()

        if (existing) {
            console.log(`🟡 La marca "${name}" ya existe.`)
            continue
        }

        const { error } = await supabase
            .from('brands')
            .insert({
                name,
                slug,
                is_active: true
            })

        if (error) {
            console.error(`❌ Error al crear "${name}":`, error.message)
        } else {
            console.log(`✅ Marca creada: "${name}"`)
        }
    }

    console.log('🎉 ¡PROCESO TERMINADO!')
}

seedBrands()
