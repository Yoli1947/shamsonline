import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowLeft, Package, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrderData {
    order_number: string;
    total: number;
    payment_status: string;
    shipping_method: string;
    customer_first_name: string;
    customer_last_name: string;
    customer_email: string;
    items?: Array<{
        product_name: string;
        quantity: number;
        unit_price: number;
        size: string;
        type?: string;
        product_type?: string;
    }>;
}

interface GiftCardPurchase {
    status: string;
    public_code: string | null;
    card_url: string | null;
    amount: number;
    recipient_name: string | null;
    recipient_phone: string | null;
}

const OrderSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('oid');
    const mpStatus = searchParams.get('status');
    const [order, setOrder] = useState<OrderData | null>(null);
    const [gcPurchase, setGcPurchase] = useState<GiftCardPurchase | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) { setLoading(false); return; }

        const fetchOrder = async () => {
            try {
                const { data } = await supabase
                    .from('orders')
                    .select('order_number, total, payment_status, shipping_method, customer_first_name, customer_last_name, customer_email, items:order_items(product_name, quantity, unit_price, size, type, product_type)')
                    .eq('id', orderId)
                    .single();

                if (data) {
                    setOrder(data as OrderData);

                    // Si es orden de gift card, buscar el purchase
                    const isGcOrder = (data as any).items?.some(
                        (i: any) => i.type === 'gift_card' || i.product_type === 'gift_card'
                    );
                    if (isGcOrder) {
                        const { data: gc } = await supabase
                            .from('gift_card_purchases')
                            .select('status, public_code, card_url, amount, recipient_name, recipient_phone')
                            .eq('order_id', orderId)
                            .single();
                        if (gc) setGcPurchase(gc as GiftCardPurchase);
                    }
                }
            } catch (err) {
                console.error('Error cargando pedido:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const isPaid = mpStatus === 'approved' || order?.payment_status === 'paid';
    const isGiftCardOrder = order?.items?.some(i => i.type === 'gift_card' || i.product_type === 'gift_card');

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#000', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid #e5e5e5', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 50 }}>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 transition-colors text-xs font-black tracking-widest uppercase"
                    style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowLeft size={16} />
                    Volver a la tienda
                </button>
                <span style={{ color: '#ccc' }}>|</span>
                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', color: '#000', textTransform: 'uppercase' }}>Shams — Rosario</span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ maxWidth: '448px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '40px', height: '40px', border: '2px solid #e0e0e0', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                            <p style={{ color: '#666', fontSize: '14px' }}>Cargando tu pedido...</p>
                        </div>
                    ) : (
                        <>
                            {/* Icono de éxito */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', marginBottom: '24px' }}>
                                    {isGiftCardOrder ? <Gift size={40} color="#000" /> : <CheckCircle size={40} color="#000" />}
                                </div>
                                <h1 style={{ fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                                    {isGiftCardOrder ? '¡Gift Card enviada!' : isPaid ? '¡Pago exitoso!' : '¡Pedido recibido!'}
                                </h1>
                                <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.6 }}>
                                    {isGiftCardOrder
                                        ? 'El destinatario recibirá la gift card por WhatsApp en los próximos minutos.'
                                        : isPaid
                                            ? 'Tu pago fue procesado correctamente. Ya estamos preparando tu pedido.'
                                            : 'Tu pedido fue registrado. Te contactaremos para confirmar el pago.'}
                                </p>
                            </div>

                            {/* Estado de gift card */}
                            {isGiftCardOrder && (
                                <div style={{ padding: '24px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <Gift size={16} color="#000" />
                                        <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Estado de la Gift Card</span>
                                    </div>
                                    {!gcPurchase || gcPurchase.status === 'pending' ? (
                                        <p style={{ fontSize: '13px', color: '#666' }}>Procesando la emisión... Se enviará por WhatsApp en los próximos minutos.</p>
                                    ) : gcPurchase.status === 'issued' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <p style={{ fontSize: '13px', color: '#000', fontWeight: 700 }}>
                                                Gift Card emitida: <span style={{ letterSpacing: '0.1em' }}>{gcPurchase.public_code}</span>
                                            </p>
                                            {gcPurchase.recipient_name && (
                                                <p style={{ fontSize: '12px', color: '#666' }}>Destinatario: {gcPurchase.recipient_name}</p>
                                            )}
                                            {gcPurchase.recipient_phone && (
                                                <p style={{ fontSize: '12px', color: '#666' }}>Enviada por WhatsApp a: {gcPurchase.recipient_phone}</p>
                                            )}
                                            {gcPurchase.card_url && (
                                                <a href={gcPurchase.card_url} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: 'inline-block', marginTop: '8px', padding: '10px 20px', backgroundColor: '#000', color: '#fff', fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none' }}>
                                                    VER GIFT CARD
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '13px', color: '#c00' }}>Hubo un error al emitir la gift card. Nos comunicaremos contigo a la brevedad.</p>
                                    )}
                                </div>
                            )}

                            {/* Detalles del pedido (no gift card) */}
                            {order && !isGiftCardOrder && (
                                <div style={{ padding: '24px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <Package size={16} color="#000" />
                                        <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                                            Pedido {order.order_number}
                                        </span>
                                        <span style={{
                                            marginLeft: 'auto',
                                            fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                                            padding: '4px 10px',
                                            backgroundColor: isPaid || order.payment_status === 'paid' ? '#f0f0f0' : '#fffbe6',
                                            border: `1px solid ${isPaid || order.payment_status === 'paid' ? '#e0e0e0' : '#fbbf24'}`,
                                            color: isPaid || order.payment_status === 'paid' ? '#000' : '#b45309',
                                        }}>
                                            {isPaid || order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    {order.items && order.items.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e5e5e5' }}>
                                            {order.items.map((item, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                                    <div>
                                                        <span style={{ color: '#000' }}>{item.product_name}</span>
                                                        <span style={{ color: '#999', fontSize: '11px', marginLeft: '8px' }}>T:{item.size} × {item.quantity}</span>
                                                    </div>
                                                    <span style={{ color: '#000' }}>${(item.unit_price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', marginTop: '8px', borderTop: '1px solid #e5e5e5' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#666' }}>Total</span>
                                        <span style={{ fontSize: '22px', fontWeight: 900, color: '#000' }}>${order.total.toLocaleString()}</span>
                                    </div>

                                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                                        {order.shipping_method === 'retiro' ? '🏪 Retiro en local' : '📦 Envío a domicilio (Correo Argentino)'}
                                    </p>
                                </div>
                            )}

                            {/* Próximos pasos (no gift card) */}
                            {!isGiftCardOrder && (
                                <div style={{ padding: '20px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#999', marginBottom: '12px' }}>¿Qué pasa ahora?</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#444' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <span style={{ color: '#000', fontWeight: 900 }}>1.</span>
                                            <span>Te contactaremos por WhatsApp para coordinar los detalles.</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <span style={{ color: '#000', fontWeight: 900 }}>2.</span>
                                            <span>{order?.shipping_method === 'retiro'
                                                ? 'Cuando tu pedido esté listo, te avisamos para que pases a buscarlo.'
                                                : 'Preparamos y despachamos tu pedido por Correo Argentino.'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <span style={{ color: '#000', fontWeight: 900 }}>3.</span>
                                            <span>Te enviamos el número de seguimiento cuando salga tu pedido.</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Botón volver */}
                            <button
                                onClick={() => navigate('/')}
                                style={{ width: '100%', backgroundColor: '#000', color: '#fff', border: 'none', padding: '16px', fontWeight: 900, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <ShoppingBag size={18} />
                                Seguir comprando
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
