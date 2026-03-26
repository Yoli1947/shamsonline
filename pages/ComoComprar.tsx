import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Ruler, ShoppingCart, MousePointer, ClipboardList, CreditCard, Mail } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: Search,
        title: 'Seleccioná un producto',
        description: 'Navegá la tienda y hacé clic en el producto que te guste para ver más información, fotos y talles disponibles.',
    },
    {
        number: '02',
        icon: Ruler,
        title: 'Elegí el talle y el color',
        description: 'Dentro de cada producto vas a encontrar los talles y colores disponibles. Seleccioná el que más te convenga.',
    },
    {
        number: '03',
        icon: ShoppingCart,
        title: 'Agregalo al carrito',
        description: 'Hacé clic en el botón "COMPRAR" para sumarlo a tu carrito. Podés seguir eligiendo más productos antes de finalizar.',
    },
    {
        number: '04',
        icon: MousePointer,
        title: 'Iniciá tu compra',
        description: 'Cuando termines de elegir, hacé clic en el ícono del carrito y luego en "FINALIZAR COMPRA" para continuar.',
    },
    {
        number: '05',
        icon: ClipboardList,
        title: 'Completá tus datos',
        description: 'Ingresá tu nombre, email, teléfono y DNI. Si querés envío a domicilio, también completá tu dirección.',
    },
    {
        number: '06',
        icon: CreditCard,
        title: 'Elegí cómo pagar',
        description: 'Podés abonar con Mercado Pago (tarjetas, cuotas), transferencia bancaria (15% OFF) o efectivo en local (15% OFF).',
    },
    {
        number: '07',
        icon: Mail,
        title: '¡Listo! Revisá tu WhatsApp',
        description: 'Recibirás la confirmación de tu pedido por WhatsApp y email con todos los detalles de tu compra.',
    },
];

const ComoComprar: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] selection:bg-black selection:text-white">
            {/* Header */}
            <div className="border-b border-[var(--color-border)] px-6 py-5 flex items-center gap-4 sticky top-0 bg-[var(--color-background)]/95 backdrop-blur-sm z-50">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-xs font-black tracking-widest uppercase"
                >
                    <ArrowLeft size={16} />
                    Volver
                </button>
                <span className="text-[var(--color-text)]/20">|</span>
                <span className="text-[10px] font-black tracking-[0.4em] text-black uppercase">Shams — Guía de Compra</span>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Título */}
                <div className="text-center mb-20">
                    <p className="text-black text-[10px] font-black tracking-[0.5em] uppercase mb-4">Paso a paso</p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
                        Cómo<br /><span className="text-black italic">Comprar</span>
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-xs tracking-[0.2em] font-medium leading-relaxed max-w-md mx-auto uppercase">
                        Seguí estos simples pasos para realizar tu compra en Shams.
                    </p>
                </div>

                {/* Steps */}
                <div className="relative">
                    {/* Línea vertical conectora */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#C4956A]/40 via-[#C4956A]/10 to-transparent hidden md:block" />

                    <div className="space-y-6">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isRight = index % 2 !== 0;
                            return (
                                <div
                                    key={step.number}
                                    className={`flex items-start gap-6 md:gap-10 ${isRight ? 'md:flex-row-reverse' : ''}`}
                                >
                                    {/* Ícono circular */}
                                    <div className="relative shrink-0">
                                        <div className="w-16 h-16 rounded-full bg-[#C4956A]/10 border border-[#C4956A]/30 flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(196,149,106,0.1)]">
                                            <Icon size={22} className="text-black" strokeWidth={1.5} />
                                        </div>
                                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#C4956A] text-black text-[9px] font-black flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                    </div>

                                    {/* Texto */}
                                    <div className={`flex-1 pb-8 ${isRight ? 'md:text-right' : ''}`}>
                                        <p className="text-[9px] font-black tracking-[0.5em] text-black/50 uppercase mb-1">{step.number}</p>
                                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-[var(--color-text)] mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-[var(--color-text-muted)] text-[11px] md:text-xs leading-relaxed tracking-wider font-medium max-w-sm">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-20 text-center p-10 rounded-3xl bg-[#C4956A]/5 border border-[#C4956A]/20">
                    <p className="text-[10px] font-black tracking-[0.5em] text-black uppercase mb-3">¿Tenés dudas?</p>
                    <p className="text-[var(--color-text-muted)] text-xs tracking-[0.2em] uppercase mb-6">Escribinos por WhatsApp y te ayudamos</p>
                    <a
                        href="https://wa.me/5493412175258"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-10 py-4 rounded-full bg-[#C4956A] text-black font-black text-[10px] tracking-[0.4em] uppercase hover:bg-white transition-all shadow-[0_10px_30px_rgba(196,149,106,0.3)]"
                    >
                        CONSULTAR POR WHATSAPP
                    </a>
                </div>

                <div className="w-full h-px bg-white/10 mt-16 mb-10" />
                <div className="text-center opacity-40">
                    <p className="text-[10px] font-black tracking-[0.4em] text-[var(--color-text-muted)] uppercase">Shams — Rosario, Santa Fe, Argentina</p>
                </div>
            </div>
        </div>
    );
};

export default ComoComprar;
