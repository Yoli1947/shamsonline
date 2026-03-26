import { createClient } from '@supabase/supabase-js'

// Variables de entorno para Supabase (con fallback seguro)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Resolver la URL de Supabase de manera robusta
let resolvedUrl = supabaseUrl;

// Diagnóstico en consola para el desarrollador
if (typeof window !== 'undefined') {
    if (resolvedUrl.startsWith('/')) {
        resolvedUrl = window.location.origin + resolvedUrl;
    }
    console.log('[Supabase] Conectando a:', resolvedUrl);
    if (!supabaseAnonKey) console.error('[Supabase] ERROR: No hay clave VITE_SUPABASE_ANON_KEY configurada.');
}

// Crear cliente de Supabase
export const supabase = createClient(
    resolvedUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storageKey: 'sb-shams-outlet-v2-auth-token'
        },
        global: {
            headers: { 'x-application-name': 'shams-outlet-v2' }
        }
    }
)

// Helper para manejar errores de Supabase
export const handleSupabaseError = (error) => {
    console.error('Supabase error:', error)

    if (error?.code === 'PGRST116') {
        return 'No se encontraron resultados'
    }

    if (error?.code === '23505') {
        return 'Este registro ya existe'
    }

    if (error?.code === '23503') {
        return 'No se puede eliminar porque tiene registros relacionados'
    }

    return error?.message || 'Error desconocido'
}

// Verificar conexión
export const checkConnection = async () => {
    try {
        const { error } = await supabase.from('brands').select('count', { count: 'exact', head: true })
        return !error
    } catch {
        return false
    }
}

export default supabase
