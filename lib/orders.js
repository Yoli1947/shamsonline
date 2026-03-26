import { supabase, handleSupabaseError } from './supabase'

/**
 * Crear un nuevo pedido
 */
export async function createOrder(orderData, items) {
    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    // Calcular costo de envío basado en el método seleccionado
    const isPickup = orderData.shippingMethod === 'retiro';
    const shippingCost = isPickup ? 0 : (orderData.shippingQuotedCost ?? (subtotal >= 100000 ? 0 : 15000));
    // Los precios publicados son precio en cuotas. Efectivo/Transf. tiene 15% OFF.
    const hasCashDiscount = orderData.paymentMethod === 'transferencia' || orderData.paymentMethod === 'efectivo';
    const hasPromo = orderData.hasPromo === true;
    const discountedSubtotal = Math.round(subtotal * (hasCashDiscount ? 0.85 : 1) * (hasPromo ? 0.9 : 1));
    const discount = subtotal - discountedSubtotal;
    const total = discountedSubtotal + shippingCost

    // Crear el pedido
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_email: orderData.email,
            customer_first_name: orderData.firstName,
            customer_last_name: orderData.lastName,
            customer_phone: orderData.phone,
            customer_dni: orderData.dni,
            shipping_address: isPickup ? 'RETIRO EN TIENDA' : orderData.address,
            shipping_number: isPickup ? '' : orderData.addressNumber,
            shipping_apartment: isPickup ? '' : (orderData.apartment || null),
            shipping_city: isPickup ? 'Rosario' : orderData.city,
            shipping_province: isPickup ? 'Santa Fe' : orderData.province,
            shipping_postal_code: isPickup ? '2000' : orderData.postalCode,
            shipping_method: orderData.shippingMethod || 'envio', // Nuevo campo
            subtotal,
            shipping_cost: shippingCost,
            discount,
            total,
            payment_method: orderData.paymentMethod || 'mercadopago',
            status: 'pending',
            payment_status: 'pending',
            ...(hasPromo && { first_promo_used: true })
        })
        .select()
        .single()

    if (orderError) {
        throw new Error(handleSupabaseError(orderError))
    }

    // Crear los items del pedido
    const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId || null,
        variant_id: item.variantId || null,
        product_name: item.name,
        product_brand: item.brand || null,
        product_image: item.image || null,
        size: item.size,
        color: item.color || null,
        unit_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) {
        // Si falla la inserción de items, eliminar el pedido
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error(handleSupabaseError(itemsError))
    }

    // Actualizar stock de las variantes
    for (const item of items) {
        if (item.variantId) {
            await supabase.rpc('decrement_stock', {
                p_variant_id: item.variantId,
                p_quantity: item.quantity
            })
        }
    }

    // Guardar/actualizar cliente en la tabla customers (no bloqueante)
    if (orderData.email) {
        supabase.from('customers').upsert({
            email: orderData.email,
            first_name: orderData.firstName || '',
            last_name: orderData.lastName || '',
            phone: orderData.phone || null,
            dni: orderData.dni || null,
        }, { onConflict: 'email', ignoreDuplicates: false })
        .catch(err => console.warn('customers upsert (no crítico):', err));
    }

    // Enviar email de confirmación (no bloqueante)
    supabase.functions.invoke('send-order-email', {
        body: { order, items: orderItems }
    }).catch(err => console.error("Error al disparar email:", err));

    return order
}

/**
 * Obtener un pedido por número
 */
export async function getOrderByNumber(orderNumber) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      items:order_items(*)
    `)
        .eq('order_number', orderNumber)
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Obtener pedidos de un cliente (por email)
 */
export async function getOrdersByEmail(email) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      id, order_number, status, payment_status, total, created_at,
      items:order_items(product_name, quantity, unit_price, product_image)
    `)
        .eq('customer_email', email)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data || []
}

/**
 * Actualizar estado de pago (para webhook de Mercado Pago)
 */
export async function updateOrderPayment(orderId, paymentData) {
    const { data, error } = await supabase
        .from('orders')
        .update({
            payment_status: paymentData.status,
            payment_id: paymentData.paymentId,
            status: paymentData.status === 'paid' ? 'processing' : 'pending',
            paid_at: paymentData.status === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', orderId)
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return data
}

/**
 * Verificar si el beneficio de primera compra ya fue utilizado (por email o DNI)
 */
export async function checkPromoAlreadyUsed(email, dni) {
    try {
        const { data, error } = await supabase.rpc('check_promo_used', {
            p_email: email || '',
            p_dni: dni || null
        });
        if (error) return false; // Si la función no existe aún, dejamos pasar
        return data === true;
    } catch {
        return false;
    }
}

/**
 * Crear solicitud de arrepentimiento/devolución
 */
export async function createReturnRequest(data) {
    const { data: request, error } = await supabase
        .from('return_requests')
        .insert({
            order_number: data.orderId,
            customer_email: data.email,
            reason: data.reason,
            details: data.details || null
        })
        .select()
        .single()

    if (error) {
        throw new Error(handleSupabaseError(error))
    }

    return request
}
