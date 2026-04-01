import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, User, Mail, Phone, MessageSquare, ChevronRight, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PRESET_AMOUNTS = [100000, 150000, 200000, 300000, 500000];

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function generateOrderNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GC-${ts}-${rand}`;
}

const GiftCardPage: React.FC = () => {
    const navigate = useNavigate();
    const [isGift, setIsGift] = useState(false);
    const [amount, setAmount] = useState(200000);
    const [customAmount, setCustomAmount] = useState('200000');
    const [useCustom, setUseCustom] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Datos del comprador
    const [buyerName, setBuyerName] = useState('');
    const [buyerEmail, setBuyerEmail] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');

    // Datos del destinatario (si es regalo)
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [message, setMessage] = useState('');

    const effectiveAmount = useCustom ? Number(customAmount.replace(/\D/g, '')) : amount;

    const handleAmountSelect = (val: number) => {
        setAmount(val);
        setCustomAmount(val.toString());
        setUseCustom(true);
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setCustomAmount(raw);
        setUseCustom(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()) {
            setError('Completá tus datos de contacto.');
            return;
        }
        if (effectiveAmount < 100000) {
            setError('El monto mínimo es $100.000.');
            return;
        }
        if (isGift && !recipientName.trim()) {
            setError('Ingresá el nombre del destinatario.');
            return;
        }
        if (isGift && recipientPhone && !/^\+54/.test(recipientPhone.trim())) {
            setError('El teléfono del destinatario debe comenzar con +54 (ej: +5493413001234).');
            return;
        }

        setLoading(true);
        try {
            const orderNumber = generateOrderNumber();
            const nameParts = buyerName.trim().split(' ');
            const firstName = nameParts[0] || buyerName;
            const lastName = nameParts.slice(1).join(' ') || '-';

            // 1. Crear la orden en Supabase
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    order_number: orderNumber,
                    customer_first_name: firstName,
                    customer_last_name: lastName,
                    customer_email: buyerEmail.trim(),
                    customer_phone: buyerPhone.trim(),
                    shipping_method: 'retiro',
                    shipping_address: 'GIFT CARD DIGITAL',
                    shipping_city: '-',
                    shipping_province: '-',
                    shipping_postal_code: '0000',
                    subtotal: effectiveAmount,
                    shipping_cost: 0,
                    discount: 0,
                    total: effectiveAmount,
                    payment_method: 'mercadopago',
                    status: 'pending',
                    payment_status: 'pending',
                })
                .select()
                .single();

            if (orderError) throw new Error(orderError.message);

            // Insertar item de gift card
            await supabase.from('order_items').insert({
                order_id: order.id,
                product_id: null,
                variant_id: null,
                product_name: `Gift Card $${effectiveAmount.toLocaleString('es-AR')}`,
                product_brand: 'SHAMS',
                product_image: null,
                size: 'ÚNICO',
                color: null,
                unit_price: effectiveAmount,
                quantity: 1,
                subtotal: effectiveAmount,
                // Datos extra de gift card almacenados en metadata
                type: 'gift_card',
                product_type: 'gift_card',
                is_gift: isGift,
                recipient_name: isGift ? recipientName.trim() : null,
                recipient_phone: isGift && recipientPhone ? recipientPhone.trim() : null,
                recipient_email: isGift && recipientEmail ? recipientEmail.trim() : null,
                sender_name: buyerName.trim(),
                message: message.trim() || null,
            });

            // 2. Crear preferencia de MercadoPago
            const mpRes = await fetch(`${FUNCTIONS_URL}/create-mp-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    order_id: order.id,
                    order_number: order.order_number,
                    customer: {
                        firstName,
                        lastName,
                        email: buyerEmail.trim(),
                        phone: buyerPhone.trim(),
                    },
                    total: effectiveAmount,
                    items: [{
                        name: `Gift Card Shams $${effectiveAmount.toLocaleString('es-AR')}`,
                        price: effectiveAmount,
                        quantity: 1,
                    }],
                }),
            });

            const mpData = await mpRes.json();
            if (!mpData.init_point) throw new Error(mpData.error || 'No se pudo crear el link de pago.');

            // 3. Redirigir a MercadoPago
            window.location.href = mpData.init_point;

        } catch (err: any) {
            setError(err.message || 'Ocurrió un error. Intentá de nuevo.');
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0',
        padding: '12px 16px 12px 48px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#000',
        outline: 'none',
        textTransform: 'uppercase',
    };
    const iconStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        paddingLeft: '16px',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
        color: '#999',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#000' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid #e5e5e5', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 50 }}>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 transition-colors text-xs font-black tracking-widest uppercase"
                    style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowLeft size={16} />
                    Volver
                </button>
                <span style={{ color: '#ccc' }}>|</span>
                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', color: '#000', textTransform: 'uppercase' }}>Gift Cards</span>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-16">

                {/* Título */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Gift size={32} color="#000" style={{ margin: '0 auto 16px' }} />
                    <h1 style={{ fontSize: '40px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '12px' }}>
                        Gift Card<br /><span style={{ fontStyle: 'italic' }}>Shams</span>
                    </h1>
                    <p style={{ color: '#666', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', lineHeight: 1.8 }}>
                        El regalo perfecto. El destinatario la recibe por WhatsApp al instante.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* SECCIÓN: Monto */}
                    <div>
                        <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#999', marginBottom: '12px' }}>Monto de la Gift Card</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                            {PRESET_AMOUNTS.map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleAmountSelect(val)}
                                    style={{
                                        padding: '12px 8px',
                                        border: effectiveAmount === val ? '2px solid #000' : '1px solid #e0e0e0',
                                        backgroundColor: effectiveAmount === val ? '#000' : '#fff',
                                        color: effectiveAmount === val ? '#fff' : '#000',
                                        fontWeight: 900,
                                        fontSize: '11px',
                                        letterSpacing: '0.05em',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    ${(val / 1000).toLocaleString('es-AR')} MIL
                                </button>
                            ))}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="OTRO MONTO (MÍN. $100.000)"
                                value={useCustom && customAmount !== '' ? `$${Number(customAmount).toLocaleString('es-AR')}` : ''}
                                onChange={handleCustomAmountChange}
                                onFocus={() => setUseCustom(true)}
                                style={{
                                    width: '100%',
                                    backgroundColor: useCustom ? '#f5f5f5' : '#fafafa',
                                    border: useCustom ? '2px solid #000' : '1px solid #e0e0e0',
                                    padding: '12px 16px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    letterSpacing: '0.1em',
                                    color: '#000',
                                    outline: 'none',
                                    textTransform: 'uppercase',
                                }}
                            />
                        </div>
                        {effectiveAmount > 0 && effectiveAmount < 100000 && (
                            <p style={{ fontSize: '9px', color: '#c00', marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                                El monto mínimo es $100.000
                            </p>
                        )}
                    </div>

                    {/* SECCIÓN: Para quién */}
                    <div>
                        <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#999', marginBottom: '12px' }}>¿Para quién es?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                                { val: false, label: 'Para mí' },
                                { val: true, label: 'Para regalar' },
                            ].map(opt => (
                                <button
                                    key={String(opt.val)}
                                    type="button"
                                    onClick={() => setIsGift(opt.val)}
                                    style={{
                                        padding: '14px',
                                        border: isGift === opt.val ? '2px solid #000' : '1px solid #e0e0e0',
                                        backgroundColor: isGift === opt.val ? '#000' : '#fff',
                                        color: isGift === opt.val ? '#fff' : '#666',
                                        fontWeight: 900,
                                        fontSize: '11px',
                                        letterSpacing: '0.15em',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SECCIÓN: Datos del destinatario (si es regalo) */}
                    {isGift && (
                        <div style={{ padding: '24px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#999', marginBottom: '4px' }}>Datos del destinatario</p>

                            <div style={{ position: 'relative' }}>
                                <div style={iconStyle}><User size={16} /></div>
                                <input required type="text" placeholder="NOMBRE DEL DESTINATARIO *" value={recipientName}
                                    onChange={e => setRecipientName(e.target.value)} style={inputStyle} />
                            </div>

                            <div style={{ position: 'relative' }}>
                                <div style={iconStyle}><Phone size={16} /></div>
                                <input type="text" placeholder="+5493413001234 (PARA WHATSAPP)" value={recipientPhone}
                                    onChange={e => setRecipientPhone(e.target.value)} style={inputStyle} />
                            </div>

                            <div style={{ position: 'relative' }}>
                                <div style={iconStyle}><Mail size={16} /></div>
                                <input type="email" placeholder="EMAIL DEL DESTINATARIO (OPCIONAL)" value={recipientEmail}
                                    onChange={e => setRecipientEmail(e.target.value)} style={inputStyle} />
                            </div>

                            <div style={{ position: 'relative' }}>
                                <div style={{ ...iconStyle, top: '12px', bottom: 'auto' }}><MessageSquare size={16} /></div>
                                <textarea
                                    placeholder="MENSAJE PERSONAL (OPCIONAL)"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={3}
                                    style={{ ...inputStyle, paddingTop: '12px', resize: 'none', paddingLeft: '48px' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN: Tus datos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#999' }}>Tus datos de contacto</p>

                        <div style={{ position: 'relative' }}>
                            <div style={iconStyle}><User size={16} /></div>
                            <input required type="text" placeholder="TU NOMBRE COMPLETO *" value={buyerName}
                                onChange={e => setBuyerName(e.target.value)} style={inputStyle} />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <div style={iconStyle}><Mail size={16} /></div>
                            <input required type="email" placeholder="TU EMAIL *" value={buyerEmail}
                                onChange={e => setBuyerEmail(e.target.value)} style={inputStyle} />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <div style={iconStyle}><Phone size={16} /></div>
                            <input required type="tel" placeholder="TU TELÉFONO *" value={buyerPhone}
                                onChange={e => setBuyerPhone(e.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p style={{ backgroundColor: '#fff0f0', border: '1px solid #fca5a5', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#c00', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {error}
                        </p>
                    )}

                    {/* Resumen + Botón */}
                    <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#999' }}>Total a pagar</p>
                                <p style={{ fontSize: '32px', fontWeight: 900, color: '#000', lineHeight: 1 }}>
                                    ${effectiveAmount.toLocaleString('es-AR')}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '9px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Envío</p>
                                <p style={{ fontSize: '11px', fontWeight: 900, color: '#000' }}>Gratis</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || effectiveAmount < 100000}
                            style={{
                                width: '100%',
                                backgroundColor: effectiveAmount < 100000 ? '#ccc' : '#000',
                                color: '#fff',
                                border: 'none',
                                padding: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                fontWeight: 900,
                                fontSize: '12px',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                cursor: loading || effectiveAmount < 100000 ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {loading ? (
                                <Loader size={18} className="animate-spin" />
                            ) : (
                                <>Pagar con Mercado Pago <ChevronRight size={18} strokeWidth={3} /></>
                            )}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '9px', color: '#999', marginTop: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                            Pago seguro · La gift card se envía por WhatsApp tras la confirmación
                        </p>
                    </div>
                </form>

                <div style={{ marginTop: '64px', textAlign: 'center', opacity: 0.4 }}>
                    <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', color: '#666', textTransform: 'uppercase' }}>Shams — Rosario, Santa Fe, Argentina</p>
                </div>
            </div>
        </div>
    );
};

export default GiftCardPage;
