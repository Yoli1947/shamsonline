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
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#000000' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid #e5e5e5', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 50 }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' }}
                >
                    <ArrowLeft size={16} />
                    Volver
                </button>
                <span style={{ color: '#ccc' }}>|</span>
                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', color: '#000', textTransform: 'uppercase' }}>Shams — Guía de Compra</span>
            </div>

            <div style={{ maxWidth: '768px', margin: '0 auto', padding: '64px 24px' }}>
                {/* Título */}
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <p style={{ color: '#999', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: '16px' }}>Paso a paso</p>
                    <h1 style={{ fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '24px', color: '#000' }}>
                        Cómo<br /><span style={{ fontStyle: 'italic' }}>Comprar</span>
                    </h1>
                    <p style={{ color: '#666', fontSize: '11px', letterSpacing: '0.2em', lineHeight: 1.8, textTransform: 'uppercase' }}>
                        Seguí estos simples pasos para realizar tu compra en Shams.
                    </p>
                </div>

                {/* Steps */}
                <div style={{ position: 'relative' }}>
                    {/* Línea vertical conectora */}
                    <div style={{ position: 'absolute', left: '32px', top: 0, bottom: 0, width: '1px', backgroundColor: '#e5e5e5', display: 'block' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isRight = index % 2 !== 0;
                            return (
                                <div
                                    key={step.number}
                                    style={{ display: 'flex', alignItems: 'flex-start', gap: '40px', flexDirection: isRight ? 'row-reverse' : 'row' }}
                                >
                                    {/* Ícono */}
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div style={{ width: '64px', height: '64px', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                                            <Icon size={22} color="#000" strokeWidth={1.5} />
                                        </div>
                                        <span style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', backgroundColor: '#000', color: '#fff', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {index + 1}
                                        </span>
                                    </div>

                                    {/* Texto */}
                                    <div style={{ flex: 1, paddingBottom: '32px', textAlign: isRight ? 'right' : 'left' }}>
                                        <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.5em', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>{step.number}</p>
                                        <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#000', marginBottom: '8px' }}>
                                            {step.title}
                                        </h3>
                                        <p style={{ color: '#666', fontSize: '12px', lineHeight: 1.7, letterSpacing: '0.05em', maxWidth: '320px' }}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CTA */}
                <div style={{ marginTop: '80px', textAlign: 'center', padding: '40px', border: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}>
                    <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.5em', color: '#000', textTransform: 'uppercase', marginBottom: '12px' }}>¿Tenés dudas?</p>
                    <p style={{ color: '#666', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px' }}>Escribinos por WhatsApp y te ayudamos</p>
                    <a
                        href="https://wa.me/5493412175258"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-block', padding: '16px 40px', backgroundColor: '#000', color: '#fff', fontWeight: 900, fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase', textDecoration: 'none' }}
                    >
                        CONSULTAR POR WHATSAPP
                    </a>
                </div>

                <div style={{ width: '100%', height: '1px', backgroundColor: '#e5e5e5', margin: '64px 0 40px' }} />
                <div style={{ textAlign: 'center', opacity: 0.4 }}>
                    <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', color: '#666', textTransform: 'uppercase' }}>Shams — Rosario, Santa Fe, Argentina</p>
                </div>
            </div>
        </div>
    );
};

export default ComoComprar;
