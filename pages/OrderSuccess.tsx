import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowLeft, Package } from 'lucide-react';
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
    }>;
}

const OrderSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('oid');
    const mpStatus = searchParams.get('status'); // 'approved' from MP redirect
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                const { data } = await supabase
                    .from('orders')
                    .select('order_number, total, payment_status, shipping_method, customer_first_name, customer_last_name, customer_email, items:order_items(product_name, quantity, unit_price, size)')
                    .eq('id', orderId)
                    .single();

                if (data) setOrder(data as OrderData);
            } catch (err) {
                console.error('Error cargando pedido:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const isPaid = mpStatus === 'approved' || order?.payment_status === 'paid';

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
            {/* Header */}
            <div className="border-b border-[var(--color-border)] px-6 py-5 flex items-center gap-4 sticky top-0 bg-[var(--color-background)]/95 backdrop-blur-sm z-50">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-xs font-black tracking-widest uppercase"
                >
                    <ArrowLeft size={16} />
                    Volver a la tienda
                </button>
                <span className="text-[var(--color-text)]/20">|</span>
                <span className="text-[10px] font-black tracking-[0.4em] text-black uppercase">
                    Shams — Rosario
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full space-y-8">
                    {loading ? (
                        <div className="text-center">
                            <div className="w-10 h-10 border-2 border-white/20 border-t-[#C4956A] rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-[var(--color-text-muted)] text-sm">Cargando tu pedido...</p>
                        </div>
                    ) : (
                        <>
                            {/* Icono de éxito */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C4956A]/10 border border-[#C4956A]/30 mb-6">
                                    <CheckCircle size={40} className="text-black" />
                                </div>
                                <h1 className="text-3xl font-black uppercase tracking-widest mb-2">
                                    {isPaid ? '¡Pago exitoso!' : '¡Pedido recibido!'}
                                </h1>
                                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                                    {isPaid
                                        ? 'Tu pago fue procesado correctamente. Ya estamos preparando tu pedido.'
                                        : 'Tu pedido fue registrado. Te contactaremos para confirmar el pago.'}
                                </p>
                            </div>

                            {/* Detalles del pedido */}
                            {order && (
                                <div className="bg-white/5 border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Package size={18} className="text-black" />
                                        <h2 className="text-sm font-black uppercase tracking-widest">
                                            Pedido {order.order_number}
                                        </h2>
                                        <span className={`ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                            order.payment_status === 'paid' || isPaid
                                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                                : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                                        }`}>
                                            {order.payment_status === 'paid' || isPaid ? 'Pagado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    {/* Items */}
                                    {order.items && order.items.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm">
                                                    <div>
                                                        <span className="text-[var(--color-text)]">{item.product_name}</span>
                                                        <span className="text-[var(--color-text-muted)] text-xs ml-2">
                                                            T:{item.size} × {item.quantity}
                                                        </span>
                                                    </div>
                                                    <span className="text-zinc-300">
                                                        ${(item.unit_price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border)]">
                                        <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Total</span>
                                        <span className="text-xl font-black text-black">
                                            ${order.total.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Envío */}
                                    <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                                        <span>{order.shipping_method === 'retiro' ? '🏪 Retiro en local' : '📦 Envío a domicilio (Correo Argentino)'}</span>
                                    </div>
                                </div>
                            )}

                            {/* Próximos pasos */}
                            <div className="bg-white/5 border border-[var(--color-border)] rounded-2xl p-5 space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-3">¿Qué pasa ahora?</h3>
                                <div className="space-y-2 text-sm text-zinc-300">
                                    <div className="flex items-start gap-3">
                                        <span className="text-black font-black mt-0.5">1.</span>
                                        <span>Te contactaremos por WhatsApp para coordinar los detalles.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-black font-black mt-0.5">2.</span>
                                        <span>
                                            {order?.shipping_method === 'retiro'
                                                ? 'Cuando tu pedido esté listo, te avisamos para que pases a buscarlo.'
                                                : 'Preparamos y despachamos tu pedido por Correo Argentino.'}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-black font-black mt-0.5">3.</span>
                                        <span>Te enviamos el número de seguimiento cuando salga tu pedido.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botón volver */}
                            <button
                                onClick={() => navigate('/')}
                                className="w-full bg-[#C4956A] text-black font-black uppercase tracking-widest py-4 rounded-full hover:brightness-110 transition-all flex items-center justify-center gap-2"
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
