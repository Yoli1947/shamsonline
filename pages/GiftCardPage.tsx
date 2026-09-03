import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePageSEO } from '../lib/seo';

const PRESET_AMOUNTS = [100000, 200000, 300000, 400000, 500000];
const MIN_AMOUNT = PRESET_AMOUNTS[0];
const MAX_AMOUNT = PRESET_AMOUNTS[PRESET_AMOUNTS.length - 1];

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Borrador del formulario: se guarda en este navegador para que si el
// comprador sale de la página (o se le corta) no tenga que volver a
// escribir todo. Se borra solo cuando el pedido se envía con éxito.
const DRAFT_KEY = 'shams_giftcard_draft_v1';

function loadDraft(): Record<string, any> {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function generateOrderNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GC-${ts}-${rand}`;
}

const GiftCardPage: React.FC = () => {
    const navigate = useNavigate();

    usePageSEO({
        title: 'Gift Card | Multibrand Rosario',
        description: 'Regalá una Gift Card de Multibrand Rosario: el destinatario la recibe al instante por WhatsApp.',
    });

    const [draft] = useState(loadDraft);

    const [amount, setAmount] = useState(draft.amount ?? PRESET_AMOUNTS[1]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [sendTiming, setSendTiming] = useState<'now' | 'later'>(draft.sendTiming ?? 'now');
    const [scheduledDate, setScheduledDate] = useState(draft.scheduledDate ?? '');

    // Remitente / destinatario (tal como se muestra en la tarjeta)
    const [senderName, setSenderName] = useState(draft.senderName ?? '');
    const [recipientName, setRecipientName] = useState(draft.recipientName ?? '');
    const [recipientEmail, setRecipientEmail] = useState(draft.recipientEmail ?? '');
    const [message, setMessage] = useState(draft.message ?? '');

    // Datos de contacto del comprador (necesarios para la orden y el pago)
    const [buyerEmail, setBuyerEmail] = useState(draft.buyerEmail ?? '');
    const [buyerPhone, setBuyerPhone] = useState(draft.buyerPhone ?? '');

    // Guardar el borrador en este navegador cada vez que cambia algo
    useEffect(() => {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({
                amount, sendTiming, scheduledDate, senderName, recipientName,
                recipientEmail, message, buyerEmail, buyerPhone,
            }));
        } catch { }
    }, [amount, sendTiming, scheduledDate, senderName, recipientName, recipientEmail, message, buyerEmail, buyerPhone]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!senderName.trim()) {
            setError('Ingresá tu nombre.');
            return;
        }
        if (!recipientName.trim()) {
            setError('Ingresá el nombre del destinatario.');
            return;
        }
        if (!buyerEmail.trim() || !buyerPhone.trim()) {
            setError('Completá tu email y teléfono de contacto.');
            return;
        }
        if (sendTiming === 'later' && !scheduledDate) {
            setError('Elegí una fecha para el envío programado.');
            return;
        }

        setLoading(true);
        try {
            const orderNumber = generateOrderNumber();
            const nameParts = senderName.trim().split(' ');
            const firstName = nameParts[0] || senderName;
            const lastName = nameParts.slice(1).join(' ') || '-';

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
                    subtotal: amount,
                    shipping_cost: 0,
                    discount: 0,
                    total: amount,
                    payment_method: 'mercadopago',
                    status: 'pending',
                    payment_status: 'pending',
                })
                .select()
                .single();

            if (orderError) throw new Error(orderError.message);

            await supabase.from('order_items').insert({
                order_id: order.id,
                product_id: null,
                variant_id: null,
                product_name: `Gift Card $${amount.toLocaleString('es-AR')}`,
                product_brand: 'MULTIBRAND',
                product_image: null,
                size: 'ÚNICO',
                color: null,
                unit_price: amount,
                quantity: 1,
                subtotal: amount,
                type: 'gift_card',
                product_type: 'gift_card',
                is_gift: true,
                recipient_name: recipientName.trim(),
                recipient_phone: null,
                recipient_email: recipientEmail.trim() || null,
                sender_name: senderName.trim(),
                message: message.trim() || null,
                scheduled_send_at: sendTiming === 'later' ? scheduledDate : null,
            });

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
                    total: amount,
                    items: [{
                        name: `Gift Card Multibrand $${amount.toLocaleString('es-AR')}`,
                        price: amount,
                        quantity: 1,
                    }],
                }),
            });

            const mpData = await mpRes.json();
            if (!mpData.init_point) throw new Error(mpData.error || 'No se pudo crear el link de pago.');

            try { localStorage.removeItem(DRAFT_KEY); } catch { }
            window.location.href = mpData.init_point;

        } catch (err: any) {
            setError(err.message || 'Ocurrió un error. Intentá de nuevo.');
            setLoading(false);
        }
    };

    const fieldStyle: React.CSSProperties = {
        width: '100%',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        padding: '9px 14px',
        fontSize: '12px',
        fontWeight: 500,
        color: '#000',
        outline: 'none',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '11px',
        fontWeight: 700,
        color: '#000',
        marginBottom: '6px',
        display: 'block',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#000' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid #e5e5e5', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 50 }}>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 transition-colors text-xs font-black tracking-widest uppercase"
                    style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowLeft size={16} />
                    Volver
                </button>
                <span style={{ color: '#ccc' }}>|</span>
                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', color: '#000', textTransform: 'uppercase' }}>Gift Card</span>
            </div>

            <form
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                    // Evita que Enter en un campo de texto (típico al aceptar una
                    // sugerencia de autocompletar del navegador, ej. en el email)
                    // dispare el envío del formulario sin que el usuario haya
                    // tocado "Agregar al Carrito".
                    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                        e.preventDefault();
                    }
                }}
                style={{ display: 'flex', flexWrap: 'wrap' }}
            >

                {/* Imagen de la tarjeta */}
                <div style={{ flex: '1 1 480px', minWidth: '320px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 32px' }}>
                    <div style={{ width: '100%', maxWidth: '520px', aspectRatio: '1.586 / 1', backgroundColor: '#111', borderRadius: '20px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px', boxShadow: '0 24px 55px rgba(0,0,0,0.25)' }}>
                        <p style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(18px, 3.2vw, 24px)', letterSpacing: '-0.01em' }}>
                            ${amount.toLocaleString('es-AR')}
                        </p>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(28px, 6vw, 40px)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '10px' }}>MULTIBRAND</p>
                            <p style={{ color: '#fff', opacity: 0.55, fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 600, letterSpacing: '0.15em' }}>
                                PERRAMUS · HUNTER · NAUTICA · MONACLE
                            </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.25em' }}>GIFT</span>
                            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.25em' }}>CARD</span>
                        </div>

                        {showPreview && (recipientName || message) && (
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px', gap: '6px' }}>
                                {recipientName && (
                                    <p style={{ color: '#fff', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 }}>Para {recipientName}</p>
                                )}
                                <p style={{ color: '#fff', fontSize: '18px', fontWeight: 900 }}>${amount.toLocaleString('es-AR')}</p>
                                {message && (
                                    <p style={{ color: '#fff', fontSize: '10px', lineHeight: 1.5, maxWidth: '260px' }}>{message}</p>
                                )}
                                {senderName && (
                                    <p style={{ color: '#fff', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6, marginTop: '6px' }}>De {senderName}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info + formulario */}
                <div style={{ flex: '1 1 420px', minWidth: '320px', padding: '14px 32px 20px' }}>

                    <h1 style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '3px' }}>Gift Card Multibrand</h1>
                    <p style={{ fontSize: '9px', color: '#999', letterSpacing: '0.05em', marginBottom: '8px' }}>SKU: GIFTCARD-MULTIBRAND</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '3px' }}>
                        ${MIN_AMOUNT.toLocaleString('es-AR')} – ${MAX_AMOUNT.toLocaleString('es-AR')}
                    </p>
                    <p style={{ fontSize: '9px', color: '#999', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Exclusivo online y también en tiendas físicas de Rosario
                    </p>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginBottom: '10px' }}>
                        <span style={{ ...labelStyle, marginBottom: '8px' }}>Valor de la Gift Card ARS</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {PRESET_AMOUNTS.map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={(e) => { setAmount(val); e.currentTarget.blur(); }}
                                    style={{
                                        padding: '8px 12px',
                                        border: amount === val ? '2px solid #000' : '1px solid #e0e0e0',
                                        backgroundColor: amount === val ? '#000' : '#fff',
                                        color: amount === val ? '#fff' : '#000',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ${val.toLocaleString('es-AR')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                        <div>
                            <label style={labelStyle}>Tu nombre</label>
                            <input required type="text" name="sender-name" autoComplete="name" placeholder="Nombre del remitente" value={senderName}
                                onChange={e => setSenderName(e.target.value)} style={fieldStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Nombre del destinatario</label>
                            <input required type="text" name="recipient-name" autoComplete="off" placeholder="Nombre del destinatario" value={recipientName}
                                onChange={e => setRecipientName(e.target.value)} style={fieldStyle} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label style={labelStyle}>Email del destinatario</label>
                        <input type="email" name="recipient-email" autoComplete="off" placeholder="Email del destinatario (opcional)" value={recipientEmail}
                            onChange={e => setRecipientEmail(e.target.value)} style={fieldStyle} />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label style={labelStyle}>Mensaje</label>
                        <textarea placeholder="Escribí tu mensaje" value={message} rows={2}
                            onChange={e => setMessage(e.target.value)} style={{ ...fieldStyle, resize: 'none' }} />
                    </div>

                    <button
                        type="button"
                        onClick={(e) => { setShowPreview(v => !v); e.currentTarget.blur(); }}
                        style={{ padding: '7px 16px', border: '1px solid #000', backgroundColor: showPreview ? '#000' : '#fff', color: showPreview ? '#fff' : '#000', fontSize: '11px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' }}
                    >
                        Vista Previa
                    </button>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginBottom: '10px' }}>
                        <span style={{ ...labelStyle, marginBottom: '6px' }}>Programar Envío</span>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: sendTiming === 'later' ? '10px' : 0 }}>
                            {[
                                { val: 'now' as const, label: 'Enviar Ahora' },
                                { val: 'later' as const, label: 'Enviar Después' },
                            ].map(opt => (
                                <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                                    <span style={{
                                        width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #000',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        {sendTiming === opt.val && <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#000' }} />}
                                    </span>
                                    <input type="radio" name="sendTiming" checked={sendTiming === opt.val} onChange={() => setSendTiming(opt.val)} style={{ display: 'none' }} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        {sendTiming === 'later' && (
                            <input
                                type="datetime-local"
                                value={scheduledDate}
                                onChange={e => setScheduledDate(e.target.value)}
                                style={fieldStyle}
                            />
                        )}
                    </div>

                    {/* Datos de contacto (necesarios para procesar el pago) */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={labelStyle}>Tus datos de contacto</span>
                        <div style={{ position: 'relative' }}>
                            <Mail size={14} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#999' }} />
                            <input required type="email" name="email" autoComplete="email" placeholder="Tu email" value={buyerEmail}
                                onChange={e => setBuyerEmail(e.target.value)} style={{ ...fieldStyle, paddingLeft: '36px' }} />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Phone size={14} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#999' }} />
                            <input required type="tel" name="tel" autoComplete="tel" placeholder="Tu teléfono" value={buyerPhone}
                                onChange={e => setBuyerPhone(e.target.value)} style={{ ...fieldStyle, paddingLeft: '36px' }} />
                        </div>
                    </div>

                    {error && (
                        <p style={{ backgroundColor: '#fff0f0', border: '1px solid #fca5a5', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#c00', marginBottom: '16px' }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            padding: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            fontWeight: 900,
                            fontSize: '12px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? <Loader size={18} className="animate-spin" /> : 'Agregar al Carrito'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '9px', color: '#999', marginTop: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Pago seguro con Mercado Pago · Se envía por WhatsApp tras la confirmación
                    </p>
                </div>
            </form>
        </div>
    );
};

export default GiftCardPage;
