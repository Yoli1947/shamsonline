import { supabase, handleSupabaseError } from './supabase'

// ==================
// PRODUCTOS
// ==================

/**
 * Obtener todos los productos con filtros opcionales
 */
export async function getProducts({
    brandSlug = null,
    categorySlug = null,
    isOnSale = null,
    isFeatured = null,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc'
} = {}) {
    let query = supabase
        .from('products')
        .select(`
      *,
      brand:brands(id, name, slug),
      category:categories(id, name, slug),
      images:product_images(id, url, alt_text, is_primary, sort_order),
      variants:product_variants(id, size, color, color_code, stock, sku)
    `)
        .eq('is_active', true)
        .eq('is_published', true)
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1)

    if (brandSlug) {
        query = query.eq('brand.slug', brandSlug)
    }

    if (categorySlug) {
        query = query.eq('category.slug', categorySlug)
    }

    if (isOnSale !== null) {
        query = query.eq('is_on_sale', isOnSale)
    }

    if (isFeatured !== null) {
        query = query.eq('is_featured', isFeatured)
    }

    const { data, error, count } = await query

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return { products: data || [], count }
}

/**
 * Obtener un producto por slug
 */
export async function getProductBySlug(slug) {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      brand:brands(id, name, slug),
      category:categories(id, name, slug),
      images:product_images(id, url, alt_text, is_primary, sort_order),
      variants:product_variants(id, size, color, color_code, stock, sku, price_adjustment)
    `)
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('is_published', true)
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Obtener un producto por ID
 */
export async function getProductById(id) {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      brand:brands(id, name, slug),
      category:categories(id, name, slug),
      images:product_images(id, url, alt_text, is_primary, sort_order),
      variants:product_variants(id, size, color, color_code, stock, sku, price_adjustment)
    `)
        .eq('id', id)
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Buscar productos por término
 */
export async function searchProducts(term, limit = 20) {
    const { data, error } = await supabase
        .from('products')
        .select(`
      id, name, slug, price, sale_price,
      brand:brands(name),
      images:product_images(url).limit(1)
    `)
        .eq('is_active', true)
        .eq('is_published', true)
        .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(limit)

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data || []
}

// ==================
// MARCAS
// ==================

export async function getBrands() {
    const baseQuery = () => supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)

    let { data, error } = await baseQuery().order('sort_order', { ascending: true }).order('name')

    if (error && (error.message.includes('sort_order') || error.code === 'PGRST204')) {
        ({ data, error } = await baseQuery().order('name'))
    }

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data || []
}

export async function getBrandBySlug(slug) {
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

// ==================
// CATEGORÍAS
// ==================

export async function getCategories() {
    const baseQuery = () => supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)

    let { data, error } = await baseQuery().order('sort_order', { ascending: true }).order('name')

    if (error && (error.message.includes('sort_order') || error.code === 'PGRST204')) {
        ({ data, error } = await baseQuery().order('name'))
    }

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data || []
}

// ==================
// CONFIGURACIÓN DEL SITIO
// ==================

export async function getSiteSettings() {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    // Convertir array a objeto key-value
    return (data || []).reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
    }, {})
}

export async function getSiteSetting(key) {
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single()

    if (error) {
        return null
    }

    return data?.value
}
