import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, CreditCard, Truck, RotateCcw, Shield, MapPin, MessageCircle, Ruler } from 'lucide-react';

const faqs = [
    {
        category: 'Pagos',
        icon: CreditCard,
        color: '#000000',
        questions: [
            {
                q: '¿Qué medios de pago aceptan?',
                a: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express) a través de Mercado Pago, transferencias bancarias y efectivo al retirar en nuestros locales.',
            },
            {
                q: '¿Puedo pagar en cuotas?',
                a: 'Sí. Con tarjeta de crédito podés pagar en cuotas según las promociones disponibles en Mercado Pago. Las cuotas y el interés dependen de tu banco y tarjeta.',
            },
            {
                q: '¿Es seguro ingresar mis datos de tarjeta?',
                a: 'Totalmente. El pago se procesa a través de Mercado Pago, plataforma certificada con encriptación SSL. Nunca almacenamos los datos de tu tarjeta en nuestro sistema.',
            },
        ],
    },
    {
        category: 'Envíos',
        icon: Truck,
        color: '#000000',
        questions: [
            {
                q: '¿Hacen envíos a todo el país?',
                a: 'Sí, enviamos a todo el territorio argentino a través de Correo Argentino.',
            },
            {
                q: '¿Cuánto tarda en llegar mi pedido?',
                a: 'Los tiempos estimados son:\n• Rosario y alrededores: 2 a 4 días hábiles\n• Interior de Santa Fe: 3 a 5 días hábiles\n• Resto del país: 5 a 10 días hábiles\nEstos tiempos son estimados y pueden variar según la zona.',
            },
            {
                q: '¿Cuánto cuesta el envío?',
                a: 'El costo de envío se calcula automáticamente al completar tu compra según el peso del paquete y tu ubicación. En algunos casos aplicamos envío bonificado.',
            },
            {
                q: '¿Cómo hago el seguimiento de mi pedido?',
                a: 'Una vez despachado tu pedido, te informamos el número de seguimiento por email. Podés rastrearlo en la página oficial de Correo Argentino: correoargentino.com.ar/seguimiento-de-envios',
            },
        ],
    },
    {
        category: 'Retiro en local',
        icon: MapPin,
        color: '#000000',
        questions: [
            {
                q: '¿Puedo retirar en local?',
                a: 'Sí. Al finalizar tu compra podés elegir "Retiro en local" como método de entrega. Tenemos varios puntos de retiro en Rosario. Te avisamos por WhatsApp o email cuando tu pedido está listo.',
            },
            {
                q: '¿Cuánto tarda en estar listo para retirar?',
                a: 'En general el pedido está listo para retirar en el mismo día o al día hábil siguiente de realizada la compra.',
            },
        ],
    },
    {
        category: 'Talles y productos',
        icon: Ruler,
        color: '#000000',
        questions: [
            {
                q: '¿Cómo elijo el talle correcto?',
                a: 'En cada producto vas a ver los talles disponibles (XS, S, M, L, XL, XXL o numéricos). Si tenés dudas, podés consultarnos por WhatsApp y te ayudamos a elegir el talle según tus medidas.',
            },
            {
                q: '¿Las fotos reflejan el color real del producto?',
                a: 'Hacemos todo lo posible para que las fotos sean fieles al color real. Sin embargo, el color puede variar ligeramente según la pantalla de tu dispositivo.',
            },
            {
                q: '¿Qué pasa si el producto no tiene stock?',
                a: 'Si un talle o color figura como agotado en la web, no tenemos stock disponible en ese momento. Podés consultarnos por WhatsApp por si hay reposición próxima.',
            },
        ],
    },
    {
        category: 'Cambios y devoluciones',
        icon: RotateCcw,
        color: '#000000',
        questions: [
            {
                q: '¿Puedo cambiar una prenda si no me queda bien?',
                a: 'Sí. Tenés 30 días desde la recepción del producto para solicitar un cambio. La prenda debe estar sin uso, con etiquetas originales y en perfectas condiciones. Contactanos por WhatsApp o email para coordinar.',
            },
            {
                q: '¿Cómo hago una devolución?',
                a: 'Podés ejercer tu derecho de arrepentimiento dentro de los 10 días hábiles desde que recibiste el producto, sin necesidad de dar explicaciones. Completá el formulario de arrepentimiento en nuestra web o contactanos por WhatsApp al 3412175258.',
            },
            {
                q: '¿Me devuelven el dinero si devuelvo un producto?',
                a: 'Sí, en caso de devolución por arrepentimiento reintegramos el importe abonado. El tiempo del reintegro depende del medio de pago utilizado.',
            },
        ],
    },
    {
        category: 'Seguridad y privacidad',
        icon: Shield,
        color: '#000000',
        questions: [
            {
                q: '¿Es seguro comprar en Shams?',
                a: 'Sí. Somos un comercio registrado (CUIT 27-05784065-5) que opera bajo la normativa de Defensa del Consumidor. Nuestros pagos están procesados por plataformas certificadas y tus datos están protegidos según nuestra Política de Privacidad.',
            },
            {
                q: '¿Para qué usan mis datos personales?',
                a: 'Tus datos se usan exclusivamente para procesar tu pedido, enviarte información sobre su estado y brindarte atención al cliente. No compartimos tus datos con terceros. Podés ver nuestra política completa en la sección de Políticas de Privacidad.',
            },
        ],
    },
    {
        category: 'Contacto',
        icon: MessageCircle,
        color: '#000000',
        questions: [
            {
                q: '¿Cómo me comunico con ustedes?',
                a: 'Podés contactarnos por:\n• WhatsApp: 341 217-5258 (lunes a sábado de 9 a 20 hs)\n• Email: admteruzyolanda@gmail.com\nRespondemos a la brevedad.',
            },
            {
                q: '¿En qué horario atienden?',
                a: 'Lunes a sábado de 9:00 a 20:00 hs. Los mensajes fuera de ese horario los respondemos al siguiente día hábil.',
            },
        ],
    },
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
    const [open, setOpen] = useState(false);
    return (
        <div
            className={`border overflow-hidden transition-all duration-300 ${open ? 'border-black/20 bg-black/[0.03]' : 'border-[var(--color-border)] bg-white hover:border-black/20'}`}
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
            >
                <span className="text-sm font-semibold text-[var(--color-text)] leading-snug">{q}</span>
                {open ? <ChevronUp size={16} className="shrink-0 text-black" /> : <ChevronDown size={16} className="shrink-0 text-[var(--color-text-muted)]" />}
            </button>
            {open && (
                <div className="px-5 pb-5">
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">{a}</p>
                </div>
            )}
        </div>
    );
};

export default function PreguntasFrecuentes() {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#000000' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e5', padding: '16px', position: 'sticky', top: 0, zIndex: 50 }}>
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-sm"
                    >
                        <ArrowLeft size={18} />
                        Volver
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Título */}
                <div className="mb-12 text-center">
                    <span className="text-black uppercase tracking-[0.4em] text-[10px] font-bold block mb-3">AYUDA</span>
                    <h1 className="font-heading text-4xl md:text-6xl font-black tracking-tighter text-[var(--color-text)] mb-4">
                        PREGUNTAS <span className="text-black italic">FRECUENTES</span>
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-sm max-w-md mx-auto">
                        Todo lo que necesitás saber sobre tus compras en Shams.
                    </p>
                </div>

                {/* Categorías */}
                <div className="space-y-10">
                    {faqs.map(({ category, icon: Icon, questions }) => (
                        <div key={category}>
                            <div className="flex items-center gap-3 mb-4">
                                <div style={{ width: '32px', height: '32px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={16} color="#000" />
                                </div>
                                <h2 style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#000' }}>
                                    {category}
                                </h2>
                            </div>
                            <div className="space-y-2">
                                {questions.map((faq) => (
                                    <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA WhatsApp */}
                <div className="mt-16 p-8 border border-[var(--color-border)] bg-white text-center">
                    <p className="text-[var(--color-text-muted)] text-sm mb-4">¿No encontraste la respuesta que buscabas?</p>
                    <a
                        href="https://wa.me/5493412175258"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-black text-white font-black px-6 py-3 text-sm uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                    >
                        <MessageCircle size={16} />
                        Escribinos por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
}
