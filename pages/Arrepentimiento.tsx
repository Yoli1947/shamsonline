import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, ChevronDown, Info } from 'lucide-react';

const Arrepentimiento: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [formData, setFormData] = useState({
        motivo: '',
        nombre: '',
        email: '',
        telefono: '',
        comentario: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        const motivoTexto: Record<string, string> = {
            arrepentimiento: 'Arrepentimiento de compra',
            talle: 'El talle no es el correcto',
            fallado: 'El producto llegó fallado',
            otro: 'Otro motivo',
        };

        const msg = [
            `📋 *SOLICITUD DE ARREPENTIMIENTO DE COMPRA*`,
            ``,
            `*Motivo:* ${motivoTexto[formData.motivo] || formData.motivo}`,
            `*Nombre:* ${formData.nombre}`,
            `*Email:* ${formData.email}`,
            `*Teléfono:* ${formData.telefono}`,
            `*Comentario:* ${formData.comentario}`,
            ``,
            `_Solicitud enviada desde shamsonline.com.ar_`,
        ].join('\n');

        // Enviar por WhatsApp a la tienda
        window.open(`https://wa.me/5493412175258?text=${encodeURIComponent(msg)}`, '_blank');

        // También abrir email
        const subject = encodeURIComponent('Solicitud de Arrepentimiento de Compra — Shams Online');
        const body = encodeURIComponent(msg.replace(/\*/g, ''));
        window.open(`mailto:admteruzyolanda@gmail.com?subject=${subject}&body=${body}`, '_blank');

        setStatus('success');
    };

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
                <span className="text-[10px] font-black tracking-[0.4em] text-black uppercase">Botón de Arrepentimiento</span>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Título */}
                <div className="text-center mb-16">
                    <p className="text-black text-[10px] font-black tracking-[0.5em] uppercase mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700">Ley de Defensa del Consumidor</p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 relative inline-block animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        Arrepentimiento<br /><span className="text-black italic text-3xl md:text-5xl">De Compra</span>
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-xs md:text-sm tracking-[0.2em] font-medium leading-relaxed max-w-xl mx-auto uppercase animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                        Tenés derecho a revocar la compra dentro de los 10 días hábiles de recibido el producto o celebrado el contrato.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
                    {/* Información */}
                    <div className="md:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-8 duration-700 delay-300">
                        <div className="p-6 rounded-3xl bg-white/5 border border-[var(--color-border)] backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C4956A]/5 blur-2xl rounded-full" />
                            <Info className="text-black mb-4" size={24} />
                            <h3 className="text-[11px] font-black tracking-[0.3em] text-[var(--color-text)] uppercase mb-4">Información Importante</h3>
                            <p className="text-[var(--color-text-muted)] text-[10px] leading-relaxed tracking-wider font-bold uppercase">
                                El producto debe encontrarse sin uso y en las mismas condiciones en que fue recibido, incluyendo el packaging original.
                            </p>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="md:col-span-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-400">
                        {status === 'success' ? (
                            <div className="text-center py-20 px-8 rounded-[2.5rem] bg-[#C4956A]/5 border border-[#C4956A]/20 backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                                <CheckCircle2 className="text-black mx-auto mb-6" size={64} strokeWidth={1} />
                                <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Solicitud Recibida</h2>
                                <p className="text-[var(--color-text-muted)] text-[10px] tracking-[0.3em] font-black uppercase leading-loose mb-8">
                                    Hemos recibido tu pedido de arrepentimiento. Un asesor se pondrá en contacto con vos vía email para indicarte los pasos a seguir.
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-10 py-4 rounded-full bg-white text-black font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#C4956A] transition-all shadow-2xl hover:shadow-[#C4956A]/40"
                                >
                                    Volver al Inicio
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Motivo */}
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-black tracking-[0.4em] text-[var(--color-text-muted)] group-focus-within:text-black transition-colors uppercase">MOTIVO *</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.motivo}
                                            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                            className="w-full bg-white/5 border border-[var(--color-border)] rounded-2xl py-4 px-6 text-[11px] font-black tracking-[0.2em] text-[var(--color-text)] focus:outline-none focus:border-[#C4956A] transition-all appearance-none cursor-pointer hover:bg-white/[0.07] uppercase"
                                        >
                                            <option value="" className="bg-white">SELECCIONÁ UN MOTIVO</option>
                                            <option value="arrepentimiento" className="bg-white">ARREPENTIMIENTO DE COMPRA</option>
                                            <option value="talle" className="bg-white">EL TALLE NO ES EL CORRECTO</option>
                                            <option value="fallado" className="bg-white">EL PRODUCTO LLEGÓ FALLADO</option>
                                            <option value="otro" className="bg-white">OTRO MOTIVO</option>
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {/* Nombre Completo */}
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-black tracking-[0.4em] text-[var(--color-text-muted)] group-focus-within:text-black transition-colors uppercase">NOMBRE COMPLETO *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="TU NOMBRE COMPLETO"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full bg-white/5 border border-[var(--color-border)] rounded-2xl py-4 px-6 text-[11px] font-black tracking-[0.2em] text-[var(--color-text)] focus:outline-none focus:border-[#C4956A] transition-all placeholder:text-zinc-800 uppercase"
                                    />
                                </div>

                                {/* Email */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-black tracking-[0.4em] text-[var(--color-text-muted)] group-focus-within:text-black transition-colors uppercase">EMAIL *</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="TU@EMAIL.COM"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-white/5 border border-[var(--color-border)] rounded-2xl py-4 px-6 text-[11px] font-black tracking-[0.2em] text-[var(--color-text)] focus:outline-none focus:border-[#C4956A] transition-all placeholder:text-zinc-800 uppercase"
                                        />
                                    </div>

                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-black tracking-[0.4em] text-[var(--color-text-muted)] group-focus-within:text-black transition-colors uppercase">TELÉFONO *</label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="11 0000 0000"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            className="w-full bg-white/5 border border-[var(--color-border)] rounded-2xl py-4 px-6 text-[11px] font-black tracking-[0.2em] text-[var(--color-text)] focus:outline-none focus:border-[#C4956A] transition-all placeholder:text-zinc-800 uppercase"
                                        />
                                    </div>
                                </div>

                                {/* Comentario */}
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-black tracking-[0.4em] text-[var(--color-text-muted)] group-focus-within:text-black transition-colors uppercase">COMENTARIO *</label>
                                    <textarea
                                        required
                                        placeholder="DEJÁ TU COMENTARIO"
                                        rows={4}
                                        value={formData.comentario}
                                        onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                                        className="w-full bg-white/5 border border-[var(--color-border)] rounded-2xl py-4 px-6 text-[11px] font-black tracking-[0.2em] text-[var(--color-text)] focus:outline-none focus:border-[#C4956A] transition-all placeholder:text-zinc-800 resize-none uppercase"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-5 rounded-2xl bg-[#C4956A] text-black font-black text-xs tracking-[0.5em] uppercase hover:bg-white transition-all shadow-[0_10px_30px_rgba(196,149,106,0.3)] hover:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {status === 'loading' ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
                                        <Send size={14} className={`group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform ${status === 'loading' ? 'animate-pulse' : ''}`} />
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="w-full h-px bg-white/10 mt-20 mb-12" />

                {/* Footer del Formulario */}
                <div className="text-center opacity-40">
                    <p className="text-[10px] font-black tracking-[0.4em] text-[var(--color-text-muted)] uppercase">Shams — Rosario, Santa Fe, Argentina</p>
                </div>
            </div>
        </div>
    );
};

export default Arrepentimiento;
