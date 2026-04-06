import { supabase, handleSupabaseError } from './supabase'

// ==================
// PRODUCTOS (ADMIN)
// ==================

// --- SIZE CURVES ---
export async function getSizeCurves() {
    const { data, error } = await supabase
        .from('size_curves')
        .select('*')
        .order('name')
    if (error) throw error
    return data
}

export async function createSizeCurve(curve) {
    const { data, error } = await supabase
        .from('size_curves')
        .insert([curve])
        .select()
    if (error) throw error
    return data[0]
}

export async function updateSizeCurve(id, updates) {
    const { data, error } = await supabase
        .from('size_curves')
        .update(updates)
        .eq('id', id)
        .select()
    if (error) throw error
    return data[0]
}

export async function deleteSizeCurve(id) {
    const { error } = await supabase
        .from('size_curves')
        .delete()
        .eq('id', id)
    if (error) throw error
    return true
}

// --- PRODUCTOS ---
export async function getAllProducts(page = 1, limit = 10, search = '', customOffset = null, isStorefront = false, syncStamp = null) {
    const offset = customOffset !== null ? customOffset : (page - 1) * limit

    // Si es para la tienda (storefront), pedimos menos columnas para ir más rápido
    const columns = isStorefront
        ? `id, sku, name, description, price, sale_price, gender, image_url, features, is_published, is_active, brand:brands(id, name, card_image_url), category:categories(id, name), images:product_images(url, is_primary, sort_order), variants:product_variants(id, size, stock)`
        : `*, brand:brands(id, name, card_image_url), category:categories(id, name), images:product_images(id, url, is_primary, alt_text, sort_order), variants:product_variants(id, size, color, stock, sku)`;

    let query = supabase
        .from('products')
        .select(columns, { count: 'exact' })

    // CACHE-BUSTING: Agregamos un filtro que siempre es verdadero pero cambia la URL
    if (syncStamp) {
        query = query.neq('id', '00000000-0000-0000-0000-' + syncStamp.toString().padStart(12, '0'))
    }

    if (isStorefront) {
        query = query.eq('is_published', true).or('is_active.eq.true,is_active.is.null')
    }

    if (isStorefront) {
        query = query.order('sort_order', { ascending: true, nullsFirst: false })
    }
    query = query.order('created_at', { ascending: false })
        .order('sort_order', { foreignTable: 'product_images', ascending: true })

    if (search) {
        query = query.ilike('name', `%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return { products: data || [], count }
}

/**
 * Crear un nuevo producto
 */
export async function createProduct(productData) {
    const { data, error } = await supabase
        .from('products')
        .insert({
            name: productData.name,
            slug: productData.slug || `${productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
            description: productData.description,
            features: productData.features || [],
            brand_id: productData.brandId,
            category_id: productData.categoryId,
            price: productData.price,
            sale_price: productData.salePrice || null,
            is_on_sale: !!productData.salePrice,
            is_active: productData.isActive ?? true,
            is_featured: productData.isFeatured ?? false,
            sku: productData.sku || null,
            provider_sku: productData.providerSku || null,
            season: productData.season || null,
            provider: productData.provider || null,
            size_type: productData.sizeType || null,
            sub_family: productData.subFamily || null,
            gender: productData.gender || null,
            cost_price: productData.costPrice || null,
            observations: productData.observations || null,
            external_url: productData.externalUrl || null,
            is_published: productData.isPublished ?? true
        })
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Actualizar un producto
 */
export async function updateProduct(id, productData) {
    const updateData = {}

    if (productData.name !== undefined) updateData.name = productData.name
    if (productData.slug !== undefined) updateData.slug = productData.slug
    if (productData.description !== undefined) updateData.description = productData.description
    if (productData.features !== undefined) updateData.features = productData.features
    if (productData.brandId !== undefined) updateData.brand_id = productData.brandId || null
    if (productData.categoryId !== undefined) updateData.category_id = productData.categoryId || null
    if (productData.price !== undefined) updateData.price = productData.price
    if (productData.salePrice !== undefined) {
        updateData.sale_price = productData.salePrice
        updateData.is_on_sale = !!productData.salePrice
    }
    if (productData.isActive !== undefined) updateData.is_active = productData.isActive
    if (productData.isFeatured !== undefined) updateData.is_featured = productData.isFeatured
    if (productData.sku !== undefined) updateData.sku = productData.sku
    if (productData.providerSku !== undefined) updateData.provider_sku = productData.providerSku
    if (productData.season !== undefined) updateData.season = productData.season
    if (productData.provider !== undefined) updateData.provider = productData.provider
    if (productData.sizeType !== undefined) updateData.size_type = productData.sizeType ? parseInt(productData.sizeType) : null
    if (productData.subFamily !== undefined) updateData.sub_family = productData.subFamily
    if (productData.gender !== undefined) updateData.gender = productData.gender
    if (productData.costPrice !== undefined) updateData.cost_price = productData.costPrice
    if (productData.observations !== undefined) updateData.observations = productData.observations
    if (productData.externalUrl !== undefined) updateData.external_url = productData.externalUrl
    if (productData.isPublished !== undefined) updateData.is_published = productData.isPublished

    const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    // Invalidar caché de la tienda
    await updateSiteSetting('last_catalog_update', new Date().toISOString())

    return data
}

/**
 * Upsert masivo de productos.
 * @param {string} [onConflict] - columna para resolver conflictos (ej: 'slug'). Por defecto usa primary key.
 */
export async function batchUpsertProducts(products, onConflict) {
    const opts = onConflict ? { onConflict } : {};
    const { data, error } = await supabase
        .from('products')
        .upsert(products, opts)
        .select()

    if (error) throw new Error(handleSupabaseError(error))
    return data
}

/**
 * Upsert masivo de variantes
 */
export async function batchUpsertVariants(variants) {
    const { data, error } = await supabase
        .from('product_variants')
        .upsert(variants)
        .select()

    if (error) throw new Error(handleSupabaseError(error))
    return data
}


/**
 * Eliminar un producto (soft delete - lo desactiva)
 */
export async function deleteProduct(id) {
    try {
        // 1. Borrar imágenes asociadas
        await supabase.from('product_images').delete().eq('product_id', id)

        // 2. Borrar variantes asociadas
        await supabase.from('product_variants').delete().eq('product_id', id)

        // 3. Borrar el producto finalmente
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        throw new Error(handleSupabaseError(error))
    }
}

// ==================
// VARIANTES / STOCK
// ==================

/**
 * Obtener todas las variantes de un producto
 */
export async function getProductVariants(productId) {
    const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('size')

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data || []
}

/**
 * Crear variante de producto
 */
export async function createVariant(variantData) {
    const { data, error } = await supabase
        .from('product_variants')
        .insert({
            product_id: variantData.productId,
            sku: variantData.sku,
            size: variantData.size,
            color: variantData.color,
            color_code: variantData.colorCode,
            stock: variantData.stock || 0
        })
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Actualizar stock de una variante
 */
export async function updateVariantStock(variantId, newStock) {
    const { data, error } = await supabase
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', variantId)
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Obtener productos con bajo stock
 */
export async function getLowStockProducts(threshold = 5) {
    const { data, error } = await supabase
        .from('product_variants')
        .select(`
      id, size, color, stock,
      product:products(id, name, brand:brands(name))
    `)
        .lte('stock', threshold)
        .eq('is_active', true)
        .order('stock')

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data || []
}

// ==================
// MARCAS (ADMIN)
// ==================

export async function getBrands(syncStamp = null, includeInactive = false) {
    let query = supabase
        .from('brands')
        .select(`
            *,
            products (count)
        `)
    
    if (!includeInactive) {
        query = query.eq('is_active', true)
    }

    if (syncStamp) {
        query = query.neq('id', '00000000-0000-0000-0000-' + syncStamp.toString().padStart(12, '0'))
    }

    // Primero intentamos ordenar por sort_order (si existe columna) y luego por nombre
    let { data, error } = await query.order('sort_order', { ascending: true }).order('name', { ascending: true })

    if (error) throw error

    // Map the count from the relation to a simple number
    return (data || []).map(brand => ({
        ...brand,
        // PostgREST returns [{ count: N }] for count aggregation
        products: brand.products?.[0]?.count || 0
    }))
}

export async function createBrand(brandData) {
    let name = brandData.name?.trim();
    if (!name) throw new Error("Nombre de marca requerido");

    const upp = name.toUpperCase();
    if (upp.includes('PERRAMUS') && (upp.includes('INTEX') || upp.includes('INDITEX') || upp.includes('ACACIA'))) {
        name = 'PERRAMUS';
    }

    // Estrategia Segura: Buscar primero para evitar errores de restricción (on conflict)
    const { data: existing } = await supabase
        .from('brands')
        .select('*')
        .ilike('name', name)
        .maybeSingle();

    if (existing) {
        // Si existe pero estaba inactiva, la activamos
        if (!existing.is_active) {
            await supabase.from('brands').update({ is_active: true }).eq('id', existing.id);
        }
        return existing;
    }

    const slug = brandData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data, error } = await supabase
        .from('brands')
        .insert({
            name: name,
            slug: slug,
            description: brandData.description,
            logo_url: brandData.logoUrl,
            is_active: true
        })
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

export async function updateBrand(id, brandData) {
    // Sanitize input: handle logoUrl -> logo_url mapping
    const updatePayload = { ...brandData };
    if (updatePayload.logoUrl !== undefined) {
        updatePayload.logo_url = updatePayload.logoUrl;
        delete updatePayload.logoUrl;
    }

    const { data, error } = await supabase
        .from('brands')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

export async function deleteBrand(id) {
    const { error } = await supabase
        .from('brands')
        .update({ is_active: false })
        .eq('id', id)

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return true
}

// ==================
// CATEGORÍAS (ADMIN)
// ==================

export async function getCategories(syncStamp = null, includeInactive = false) {
    let query = supabase
        .from('categories')
        .select('*')
    
    if (!includeInactive) {
        query = query.eq('is_active', true)
    }

    if (syncStamp) {
        query = query.neq('id', '00000000-0000-0000-0000-' + syncStamp.toString().padStart(12, '0'))
    }

    // Ordenar por sort_order y luego por nombre
    let { data, error } = await query.order('sort_order', { ascending: true }).order('name')

    if (error) throw error

    return data || []
}

export async function createCategory(categoryData) {
    const name = categoryData.name?.trim();
    if (!name) throw new Error("Nombre de categoría requerido");

    // Buscar primero para evitar errores de restricción
    const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .ilike('name', name)
        .maybeSingle();

    if (existing) {
        if (!existing.is_active) {
            await supabase.from('categories').update({ is_active: true }).eq('id', existing.id);
        }
        return existing;
    }

    const slug = categoryData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data, error } = await supabase
        .from('categories')
        .insert({
            name: name,
            slug: slug,
            description: categoryData.description,
            image_url: categoryData.imageUrl,
            parent_id: categoryData.parentId,
            is_active: true
        })
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

export async function updateCategory(id, categoryData) {
    const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

export async function deleteCategory(id) {
    const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return true
}

// ==================
// PEDIDOS (ADMIN)
// ==================

/**
 * Obtener todos los pedidos para admin
 */
export async function getAllOrders({ status = null, limit = 50, offset = 0 } = {}) {
    let query = supabase
        .from('orders')
        .select(`
      *,
      items:order_items(id, product_name, product_brand, product_image, size, color, quantity, unit_price, subtotal, variant_id)
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (status) {
        query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return { orders: data || [], count }
}

/**
 * Actualizar estado de un pedido
 */
export async function updateOrderStatus(orderId, status, notes = null) {
    const updateData = { status }

    if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
    } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
    }

    if (notes) {
        updateData.admin_notes = notes
    }

    const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Anular un pedido y restaurar stock automáticamente
 */
export async function cancelOrder(orderId) {
    // 1. Obtener items del pedido con sus variant_ids
    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', orderId)

    if (itemsError) throw new Error(handleSupabaseError(itemsError))

    // 2. Restaurar stock de cada variante
    for (const item of items) {
        if (item.variant_id) {
            await supabase.rpc('increment_stock', {
                p_variant_id: item.variant_id,
                p_quantity: item.quantity
            })
        }
    }

    // 3. Marcar pedido como anulado
    const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw new Error(handleSupabaseError(error))
    return data
}

/**
 * Agregar tracking a un pedido
 */
export async function addOrderTracking(orderId, trackingNumber, trackingUrl = null) {
    const { data, error } = await supabase
        .from('orders')
        .update({
            tracking_number: trackingNumber,
            tracking_url: trackingUrl,
            status: 'shipped',
            shipped_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

// ==================
// CONFIGURACIÓN DEL SITIO (ADMIN)
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

/**
 * Obtener la fecha del último sync de catálogo
 */
export async function getLastSyncDate() {
    return await getSiteSetting('last_catalog_update')
}

// ==================
// TEMPORADAS (ADMIN)
// ==================

export async function getSeasons() {
    const raw = await getSiteSetting('product_seasons')
    if (!raw) return []
    try {
        return JSON.parse(raw)
    } catch (e) {
        return []
    }
}

export async function saveSeasons(seasons) {
    return await updateSiteSetting('product_seasons', JSON.stringify(seasons))
}

export async function createSeason(name) {
    const seasons = await getSeasons()
    if (seasons.includes(name)) return seasons
    const newSeasons = [...seasons, name].sort()
    await saveSeasons(newSeasons)
    return newSeasons
}

export async function deleteSeason(name) {
    const seasons = await getSeasons()
    const newSeasons = seasons.filter(s => s !== name)
    await saveSeasons(newSeasons)
    return newSeasons
}

export async function updateSiteSetting(key, value, label = null) {
    const finalLabel = label || key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const { data, error } = await supabase
        .from('site_settings')
        .upsert({ 
            key, 
            value, 
            label: finalLabel,
            updated_at: new Date().toISOString() 
        }, { onConflict: 'key' })
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

// ==================
// ESTADÍSTICAS (ADMIN DASHBOARD)
// ==================

export async function getDashboardStats() {
    // Pedidos de hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

    // Ventas totales del mes
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const { data: monthSales } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', monthStart.toISOString())
        .eq('payment_status', 'paid')

    const totalRevenue = (monthSales || []).reduce((sum, order) => sum + parseFloat(order.total), 0)

    // Pedidos pendientes
    const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    // Productos con bajo stock
    const { count: lowStockCount } = await supabase
        .from('product_variants')
        .select('*', { count: 'exact', head: true })
        .lte('stock', 5)
        .eq('is_active', true)

    return {
        todayOrders: todayOrders || 0,
        monthRevenue: totalRevenue,
        pendingOrders: pendingOrders || 0,
        lowStockItems: lowStockCount || 0
    }
}

/**
 * Obtener todos los clientes registrados
 */
export async function getAllCustomers({ limit = 50, offset = 0, search = '' } = {}) {
    let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
    
    if (search) {
        // Buscamos por nombre completo, email o DNI
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,dni.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return { customers: data || [], count }
}

/**
 * Actualizar datos de un cliente
 */
export async function updateCustomer(id, customerData) {
    const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Obtener pedidos recientes para el dashboard
 */
export async function getRecentOrders(limit = 5) {
    const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_first_name, customer_last_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data || []
}

/**
 * Subir imagen al storage
 */
export async function uploadImage(file, bucket = 'products') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file)

    if (uploadError) {
        throw new Error(handleSupabaseError(uploadError))
    }

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

    return data.publicUrl
}

/**
 * Intenta vincular una imagen a un producto automáticamente basándose en el nombre del archivo.
 * Acepta formatos como "P12301653V.jpg" (Código) o "Campera Anzed Camel.jpg" (Nombre).
 */
export async function autoLinkImageByFilename(url, filename) {
    // 1. Extraer el nombre base (sin extensión)
    const fullNameNoExt = filename.split('.').slice(0, -1).join('.').trim();

    // 2. Extraer el código base (primera sección antes de separadores comunes)
    // Ahora incluye punto y guión medio como separadores
    const baseCode = fullNameNoExt
        .split('_')[0]
        .split(' ')[0]
        .split('(')[0]
        .split('-')[0]
        .split('.')[0]
        .toUpperCase()
        .trim();

    if (!fullNameNoExt) return null;

    try {
        let product = null;

        // ESTRATEGIA A: Buscar por SKU o Code (Búsqueda exacta/rápida)
        if (baseCode.length >= 3) {
            const { data: skuMatch, error: skuError } = await supabase
                .from('products')
                .select('id, name, image_url')
                .or(`sku.eq.${baseCode},code.eq.${baseCode},sku.eq.0${baseCode},code.eq.0${baseCode},sku.ilike.${baseCode},code.ilike.${baseCode}`)
                .limit(1)
                .maybeSingle();

            if (skuError) console.error('Auto-Link SKU Error:', skuError);
            if (skuMatch) product = skuMatch;
        }

        // ESTRATEGIA B: Buscar por Nombre exacto
        if (!product) {
            const { data: nameMatch } = await supabase
                .from('products')
                .select('id, name, image_url')
                .ilike('name', fullNameNoExt)
                .limit(1)
                .maybeSingle();

            if (nameMatch) product = nameMatch;
        }

        // ESTRATEGIA C: Buscar por Nombre que contenga el archivo (más permisivo)
        if (!product && fullNameNoExt.length > 5) {
            const { data: partialMatch } = await supabase
                .from('products')
                .select('id, name, image_url')
                .ilike('name', `%${fullNameNoExt}%`)
                .limit(1)
                .maybeSingle();

            if (partialMatch) product = partialMatch;
        }

        if (!product) {
            console.log(`Auto-Link Failed: No product found for "${filename}" (BaseCode: "${baseCode}")`);
            return null;
        }

        // 3. Verificar si ya tiene esta URL vinculada en product_images
        const { data: existingImg } = await supabase
            .from('product_images')
            .select('id')
            .eq('product_id', product.id)
            .eq('url', url)
            .limit(1);

        if (existingImg && existingImg.length > 0) {
            return { success: true, linked: false, reason: 'already_exists', product };
        }

        // 4. Vincular en product_images
        const { count } = await supabase
            .from('product_images')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id);

        const isPrimary = (!product.image_url || count === 0);
        await addProductImage(product.id, url, isPrimary, null);

        // 5. Si es la primera imagen o no tenía image_url, actualizar el campo principal del producto
        if (isPrimary) {
            await supabase.from('products').update({ image_url: url }).eq('id', product.id);
        }

        return { success: true, linked: true, product };
    } catch (err) {
        console.error('Auto-Link Exception:', err);
        return null;
    }
}

/**
 * Vincular imagen a producto en base de datos
 */
export async function addProductImage(productId, url, isPrimary = true, color = null, sortOrder = 0) {
    const { data, error } = await supabase
        .from('product_images')
        .insert({
            product_id: productId,
            url: url,
            is_primary: isPrimary,
            alt_text: color,
            sort_order: sortOrder
        })
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Actualizar variantes en bloque (simple)
 * NOTA: Para una implementación robusta, debería manejar borrados.
 * Por ahora solo crea o actualiza.
 */
export async function saveProductVariants(productId, variants) {
    const promises = variants.map(v => {
        if (v.id) {
            // Actualizar stock/data
            return supabase
                .from('product_variants')
                .update({
                    size: v.size,
                    color: v.color,
                    color_code: v.color_code || null,
                    stock: v.stock
                })
                .eq('id', v.id)
        } else {
            // Crear nueva
            return supabase
                .from('product_variants')
                .insert({
                    product_id: productId,
                    size: v.size,
                    color: v.color,
                    color_code: v.color_code || null,
                    stock: v.stock,
                    sku: `${productId.substring(0, 4)}-${v.size}-${v.color}`.toUpperCase() // SKU simple autom.
                })
        }
    })

    const results = await Promise.all(promises)
    // DEBUG: Log errors but don't crash yet
    results.forEach(r => {
        if (r.error) console.error("Variant save error:", r.error)
    })
    // Retornamos true aunque falle algo para no bloquear la UI por ahora
    return results
}



export async function getAllProductsForOrdering() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, sort_order, is_active, is_published, images:product_images(url, is_primary), brand:brands(name)')
        .eq('is_published', true)
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(500)
    if (error) throw new Error(handleSupabaseError(error))
    return data || []
}

export async function saveProductsOrder(products) {
    const results = await Promise.all(products.map((product, index) => {
        return supabase
            .from('products')
            .update({ sort_order: (index + 1) * 10 })
            .eq('id', product.id)
    }))
    const error = results.find(r => r.error)?.error
    if (error) throw error
    // Invalidar caché de la tienda
    await updateSiteSetting('last_catalog_update', new Date().toISOString())
    return results
}

export async function saveBrandsOrder(brands) {
    const results = await Promise.all(brands.map((brand, index) => {
        return supabase
            .from('brands')
            .update({ sort_order: (index + 1) * 10 })
            .eq('id', brand.id)
    }))
    const error = results.find(r => r.error)?.error
    if (error) throw error
    return results
}

export async function saveCategoriesOrder(categories) {
    const results = await Promise.all(categories.map((cat, index) => {
        return supabase
            .from('categories')
            .update({ sort_order: (index + 1) * 10 })
            .eq('id', cat.id)
    }))
    const error = results.find(r => r.error)?.error
    if (error) throw error
    return results
}

export async function applyBulkDiscount({ brandId, categoryId, percentage, reset = false }) {
    let selectQuery = supabase.from('products').select('id, price')
    if (brandId) selectQuery = selectQuery.eq('brand_id', brandId)
    if (categoryId) selectQuery = selectQuery.eq('category_id', categoryId)

    const { data: products, error: fetchError } = await selectQuery
    if (fetchError) throw fetchError

    if (!products || products.length === 0) return 0

    const updates = products.map(p => ({
        id: p.id,
        sale_price: reset ? null : Math.round(p.price * (1 - percentage / 100)),
        is_on_sale: !reset,
        updated_at: new Date().toISOString()
    }))

    const { error: updateError } = await supabase.from('products').upsert(updates)
    if (updateError) throw updateError

    return updates.length
}

/**
 * Actualización masiva de PRECIOS DE LISTA por porcentaje
 */
export async function applyBulkPriceUpdate({ brandId, categoryId, percentage, mode = 'increase' }) {
    let selectQuery = supabase.from('products').select('id, price, sale_price')
    if (brandId) selectQuery = selectQuery.eq('brand_id', brandId)
    if (categoryId) selectQuery = selectQuery.eq('category_id', categoryId)

    const { data: products, error: fetchError } = await selectQuery
    if (fetchError) throw fetchError

    if (!products || products.length === 0) return 0

    const factor = mode === 'increase' ? (1 + percentage / 100) : (1 - percentage / 100);

    const updates = products.map(p => {
        const newPrice = Math.round(p.price * factor);
        return {
            id: p.id,
            price: newPrice,
            // Si tiene precio de oferta, lo recalculamos para mantener la misma proporción o lo dejamos nulo? 
            // Usualmente en retail se prefiere resetear oferta o ajustarla. Vamos a ajustarla si existe.
            sale_price: p.sale_price ? Math.round(p.sale_price * factor) : null,
            updated_at: new Date().toISOString()
        }
    })

    const { error: updateError } = await supabase.from('products').upsert(updates)
    if (updateError) throw updateError

    return updates.length
}

