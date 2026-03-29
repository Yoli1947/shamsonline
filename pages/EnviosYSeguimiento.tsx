import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin, Clock, Search, Package, AlertCircle, Store } from 'lucide-react';

const s = {
    page: { minHeight: '100vh', backgroundColor: '#ffffff', color: '#000000' } as React.CSSProperties,
    header: { borderBottom: '1px solid #e5e5e5', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky' as const, top: 0, backgroundColor: '#ffffff', zIndex: 50 },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' as const },
    content: { maxWidth: '768px', margin: '0 auto', padding: '64px 24px', display: 'flex', flexDirection: 'column' as const, gap: '64px' },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
    sectionTitleText: { fontSize: '13px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.3em', color: '#000' },
    card: { padding: '24px', border: '1px solid #e5e5e5', backgroundColor: '#fafafa' },
    cardTitle: { fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#000', marginBottom: '8px' },
    cardText: { fontSize: '12px', color: '#666', lineHeight: 1.7 },
    label: { fontSize: '9px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: '#999', marginBottom: '4px' },
    big: { fontSize: '28px', fontWeight: 900, color: '#000', lineHeight: 1 },
};

const EnviosYSeguimiento: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={s.page}>
            <div style={s.header}>
                <button onClick={() => navigate(-1)} style={s.backBtn}>
                    <ArrowLeft size={16} /> Volver
                </button>
                <span style={{ color: '#ccc' }}>|</span>
                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', color: '#000', textTransform: 'uppercase' }}>Shams — Envíos</span>
            </div>

            <div style={s.content}>
                {/* Título */}
                <div style={{ textAlign: 'center' }}>
                    <p style={{ ...s.label, marginBottom: '16px' }}>Logística</p>
                    <h1 style={{ fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '24px', color: '#000' }}>
                        Envíos y<br /><span style={{ fontStyle: 'italic' }}>Seguimiento</span>
                    </h1>
                    <p style={{ color: '#666', fontSize: '11px', letterSpacing: '0.2em', lineHeight: 1.8, textTransform: 'uppercase', maxWidth: '480px', margin: '0 auto' }}>
                        Trabajamos con Correo Argentino para llegar a cada rincón del país de forma rápida y segura.
                    </p>
                </div>

                {/* Métodos de envío */}
                <div>
                    <div style={s.sectionTitle}>
                        <Truck size={18} color="#000" />
                        <span style={s.sectionTitleText}>Métodos de Envío</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {[
                            { icon: Truck, title: 'Envío a Domicilio', desc: 'El cartero entrega el paquete directamente en la dirección que indiques.' },
                            { icon: MapPin, title: 'Retiro en Correo', desc: 'Elegí la sucursal de Correo Argentino más cercana. Ideal si no estás en casa durante el día.' },
                            { icon: Store, title: 'Retiro en Local', desc: 'Retirá tu pedido en cualquiera de nuestros locales en Rosario. ¡Sin costo de envío!' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} style={s.card}>
                                <Icon size={20} color="#000" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
                                <p style={s.cardTitle}>{title}</p>
                                <p style={s.cardText}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Retiro en locales */}
                <div style={{ ...s.card, padding: '32px' }}>
                    <div style={s.sectionTitle}>
                        <Store size={18} color="#000" />
                        <span style={s.sectionTitleText}>Nuestros Locales de Retiro</span>
                    </div>
                    <p style={{ ...s.cardText, marginBottom: '24px' }}>
                        Si preferís evitar el envío, podés retirar tu pedido en cualquiera de nuestros locales en Rosario sin costo adicional. Al finalizar la compra, seleccioná <strong>"Retiro en Tienda"</strong> y elegí el local que más te convenga.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {[
                            { name: 'PERRAMUS-SHAMS (LA FAVORITA)', address: 'Córdoba 1101, Rosario', schedule: 'Lun a Sáb 10:00–20:00' },
                            { name: 'PERRAMUS-HUNTER (SHOPPING DEL SIGLO)', address: 'Pte. Roca 844, Rosario (Local 110)', schedule: 'Lun a Dom 9:00–20:00' },
                            { name: 'PERRAMUS - HUNTER - NAUTICA (Fisherton Plaza)', address: 'Alberto J. Paz 1065 bis, Rosario', schedule: 'Lun a Dom 10:00–20:00' },
                            { name: 'PERRAMUS-HUNTER (PLAZA PRINGLES)', address: 'Córdoba 1543, Rosario', schedule: 'Lun a Vie 9:30–19:30 | Sáb 9:30–19:00' },
                            { name: 'SHAMS - ROSARIO', address: 'Córdoba 1646, Rosario', schedule: 'Lun a Vie 9:30–19:30 | Sáb 9:30–19:00' },
                            { name: 'MONACLE TIENDA', address: 'Pte Roca 871, Rosario', schedule: 'Lun a Sáb 10:00–20:00' },
                        ].map((local, i, arr) => (
                            <div key={local.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #e5e5e5' : 'none' }}>
                                <MapPin size={12} color="#000" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#000' }}>{local.name}</p>
                                    <p style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{local.address} — {local.schedule}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tiempos de entrega */}
                <div>
                    <div style={s.sectionTitle}>
                        <Clock size={18} color="#000" />
                        <span style={s.sectionTitleText}>Tiempos de Entrega</span>
                    </div>
                    <p style={{ ...s.cardText, marginBottom: '24px' }}>
                        Una vez confirmado el pago, despachamos tu pedido en un plazo de <strong>24 a 48 horas hábiles</strong>.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {[
                            { zone: 'Rosario y alrededores', days: '2–4 días' },
                            { zone: 'Resto del país', days: '3–7 días' },
                        ].map(({ zone, days }) => (
                            <div key={zone} style={s.card}>
                                <p style={s.label}>{zone}</p>
                                <p style={s.big}>{days}</p>
                                <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Hábiles</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seguimiento */}
                <div>
                    <div style={s.sectionTitle}>
                        <Search size={18} color="#000" />
                        <span style={s.sectionTitleText}>Cómo Hacer el Seguimiento</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { num: '01', title: 'Email de Confirmación', desc: 'Una vez despachado tu paquete, recibirás un email con tu Número de Seguimiento.' },
                            { num: '02', title: 'Ingresá al Portal', desc: 'Accedé a la sección de Seguimiento de Envíos de Correo Argentino.' },
                            { num: '03', title: 'Ingresá el Código', desc: 'Pegá el código alfanumérico que te enviamos y verás el estado y la fecha estimada de entrega.' },
                        ].map((step) => (
                            <div key={step.num} style={{ display: 'flex', gap: '20px', padding: '20px', border: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}>
                                <span style={{ fontSize: '22px', fontWeight: 900, color: '#ccc', flexShrink: 0 }}>{step.num}</span>
                                <div>
                                    <p style={s.cardTitle}>{step.title}</p>
                                    <p style={s.cardText}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <a
                            href="https://www.correoargentino.com.ar/seguimiento-de-envios"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', backgroundColor: '#000', color: '#fff', fontWeight: 900, fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none' }}
                        >
                            <Package size={14} />
                            SEGUÍ TU PEDIDO AQUÍ
                        </a>
                    </div>
                </div>

                {/* Aviso importante */}
                <div style={{ padding: '24px', border: '1px solid #e5e5e5', backgroundColor: '#fafafa', display: 'flex', gap: '16px' }}>
                    <AlertCircle size={18} color="#000" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#000', marginBottom: '8px' }}>Importante</p>
                        <p style={s.cardText}>
                            Correo Argentino realiza una visita al domicilio. Si no hay nadie, el paquete permanecerá en la sucursal más cercana durante <strong>5 días hábiles</strong> para que puedas retirarlo.<br /><br />
                            Si el código de seguimiento no figura de inmediato, puede tardar algunas horas en impactar en el sistema del correo.
                        </p>
                    </div>
                </div>

                <div style={{ textAlign: 'center', opacity: 0.4, paddingTop: '16px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', color: '#666', textTransform: 'uppercase' }}>Shams — Rosario, Santa Fe, Argentina</p>
                </div>
            </div>
        </div>
    );
};

export default EnviosYSeguimiento;
