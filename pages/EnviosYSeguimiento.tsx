import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin, Clock, Search, Package, AlertCircle, Store } from 'lucide-react';

const EnviosYSeguimiento: React.FC = () => {
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
                <span className="text-[10px] font-black tracking-[0.4em] text-black uppercase">Shams — Envíos</span>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

                {/* Título */}
                <div className="text-center">
                    <p className="text-black text-[10px] font-black tracking-[0.5em] uppercase mb-4">Logística</p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
                        Envíos y<br /><span className="text-black italic">Seguimiento</span>
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-xs tracking-[0.2em] font-medium leading-relaxed max-w-md mx-auto uppercase">
                        Trabajamos con Correo Argentino para llegar a cada rincón del país de forma rápida y segura.
                    </p>
                </div>

                {/* Métodos de envío */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <Truck size={18} className="text-black" />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em]">Métodos de Envío</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 rounded-2xl bg-white/5 border border-[var(--color-border)] hover:border-[#C4956A]/30 transition-all">
                            <Truck size={20} className="text-black mb-4" strokeWidth={1.5} />
                            <h3 className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text)] mb-2">Envío a Domicilio</h3>
                            <p className="text-[var(--color-text-muted)] text-[10px] leading-relaxed">El cartero entrega el paquete directamente en la dirección que indiques.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-[var(--color-border)] hover:border-[#C4956A]/30 transition-all">
                            <MapPin size={20} className="text-black mb-4" strokeWidth={1.5} />
                            <h3 className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text)] mb-2">Retiro en Correo</h3>
                            <p className="text-[var(--color-text-muted)] text-[10px] leading-relaxed">Elegí la sucursal de Correo Argentino más cercana. Ideal si no estás en casa durante el día.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[#C4956A]/5 border border-[#C4956A]/20 hover:border-[#C4956A]/50 transition-all">
                            <Store size={20} className="text-black mb-4" strokeWidth={1.5} />
                            <h3 className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text)] mb-2">Retiro en Local</h3>
                            <p className="text-[var(--color-text-muted)] text-[10px] leading-relaxed">Retirá tu pedido en cualquiera de nuestros locales en Rosario. ¡Sin costo de envío!</p>
                        </div>
                    </div>
                </div>

                {/* Retiro en locales */}
                <div className="p-8 rounded-3xl bg-white/5 border border-[var(--color-border)]">
                    <div className="flex items-center gap-3 mb-6">
                        <Store size={18} className="text-black" />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em]">Nuestros Locales de Retiro</h2>
                    </div>
                    <p className="text-[var(--color-text-muted)] text-xs leading-relaxed mb-6">
                        Si preferís evitar el envío, podés retirar tu pedido en cualquiera de nuestros locales en Rosario sin costo adicional. Al finalizar la compra, seleccioná <span className="text-[var(--color-text)] font-bold">"Retiro en Tienda"</span> y elegí el local que más te convenga.
                    </p>
                    <div className="space-y-3">
                        {[
                            { name: 'PERRAMUS-SHAMS (LA FAVORITA)', address: 'Córdoba 1101, Rosario', schedule: 'Lun a Sáb 10:00–20:00' },
                            { name: 'PERRAMUS-HUNTER (SHOPPING DEL SIGLO)', address: 'Pte. Roca 844, Rosario (Local 110)', schedule: 'Lun a Dom 9:00–20:00' },
                            { name: 'PERRAMUS - HUNTER - NAUTICA (Fisherton Plaza)', address: 'Alberto J. Paz 1065 bis, Rosario', schedule: 'Lun a Dom 10:00–20:00' },
                            { name: 'PERRAMUS-HUNTER (PLAZA PRINGLES)', address: 'Córdoba 1543, Rosario', schedule: 'Lun a Vie 9:30–19:30 | Sáb 9:30–19:00' },
                            { name: 'SHAMS - ROSARIO', address: 'Córdoba 1646, Rosario', schedule: 'Lun a Vie 9:30–19:30 | Sáb 9:30–19:00' },
                            { name: 'MONACLE TIENDA', address: 'Pte Roca 871, Rosario', schedule: 'Lun a Sáb 10:00–20:00' },
                        ].map((local) => (
                            <div key={local.name} className="flex items-start gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
                                <MapPin size={12} className="text-black mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text)]">{local.name}</p>
                                    <p className="text-[var(--color-text-muted)] text-[9px] mt-0.5">{local.address} — {local.schedule}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tiempos de entrega */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <Clock size={18} className="text-black" />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em]">Tiempos de Entrega</h2>
                    </div>
                    <p className="text-[var(--color-text-muted)] text-xs leading-relaxed mb-6">
                        Una vez confirmado el pago, despachamos tu pedido en un plazo de <span className="text-[var(--color-text)] font-bold">24 a 48 horas hábiles</span>.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-white/5 border border-[var(--color-border)]">
                            <p className="text-black text-[9px] font-black tracking-[0.4em] uppercase mb-2">Rosario y alrededores</p>
                            <p className="text-2xl font-black text-[var(--color-text)]">2–4 días</p>
                            <p className="text-[var(--color-text-muted)] text-[10px] mt-1 uppercase tracking-wider">Hábiles</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-[var(--color-border)]">
                            <p className="text-black text-[9px] font-black tracking-[0.4em] uppercase mb-2">Resto del país</p>
                            <p className="text-2xl font-black text-[var(--color-text)]">3–7 días</p>
                            <p className="text-[var(--color-text-muted)] text-[10px] mt-1 uppercase tracking-wider">Hábiles</p>
                        </div>
                    </div>
                </div>

                {/* Seguimiento */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <Search size={18} className="text-black" />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em]">Cómo Hacer el Seguimiento</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { num: '01', title: 'Email de Confirmación', desc: 'Una vez despachado tu paquete, recibirás un email con tu Número de Seguimiento (Tracking Number).' },
                            { num: '02', title: 'Ingresá al Portal', desc: 'Accedé a la sección de Seguimiento de Envíos de Correo Argentino.' },
                            { num: '03', title: 'Ingresá el Código', desc: 'Pegá el código alfanumérico que te enviamos y verás el estado actual y la fecha estimada de entrega.' },
                        ].map((step) => (
                            <div key={step.num} className="flex gap-5 p-5 rounded-2xl bg-white/5 border border-[var(--color-border)]">
                                <span className="text-black/40 text-2xl font-black shrink-0">{step.num}</span>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text)] mb-1">{step.title}</p>
                                    <p className="text-[var(--color-text-muted)] text-[10px] leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <a
                            href="https://www.correoargentino.com.ar/seguimiento-de-envios"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C4956A] text-black font-black text-[10px] tracking-[0.3em] uppercase hover:bg-white transition-all shadow-[0_10px_30px_rgba(196,149,106,0.3)]"
                        >
                            <Package size={14} />
                            SEGUÍ TU PEDIDO AQUÍ
                        </a>
                    </div>
                </div>

                {/* Aviso importante */}
                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                    <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-2">Importante</p>
                        <p className="text-[var(--color-text-muted)] text-[10px] leading-relaxed">
                            Correo Argentino realiza una visita al domicilio. Si no hay nadie, el paquete permanecerá en la sucursal más cercana durante <strong className="text-[var(--color-text)]">5 días hábiles</strong> para que puedas retirarlo antes de que sea devuelto a nuestro depósito.<br /><br />
                            Si el código de seguimiento no figura de inmediato, no te preocupes — puede tardar algunas horas en impactar en el sistema del correo.
                        </p>
                    </div>
                </div>

                <div className="w-full h-px bg-white/10" />
                <div className="text-center opacity-40">
                    <p className="text-[10px] font-black tracking-[0.4em] text-[var(--color-text-muted)] uppercase">Shams — Rosario, Santa Fe, Argentina</p>
                </div>
            </div>
        </div>
    );
};

export default EnviosYSeguimiento;
