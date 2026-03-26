
import React, { useState, useEffect } from 'react';
import { X, Mail, Gift, CheckCircle2, Cake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const NewsletterModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    useEffect(() => {
        const hasSeenNewsletter = localStorage.getItem('shams_newsletter_v8');
        if (!hasSeenNewsletter) {
            const timer = setTimeout(() => setIsOpen(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('shams_newsletter_v8', 'true');
    };

    const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
        if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5);
        if (v.length > 10) v = v.slice(0, 10);
        setBirthday(v);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        // Convertir DD/MM/AAAA → AAAA-MM-DD para la DB
        const birthdayISO = birthday.length === 10
            ? birthday.split('/').reverse().join('-')
            : birthday || null;
        try {
            await supabase.from('newsletter_subscribers').insert({
                email,
                birthday: birthdayISO,
            });

            // Enviar email de bienvenida
            await supabase.functions.invoke('send-welcome-email', {
                body: { email }
            });
        } catch (_) {}

        localStorage.setItem('shams_promo_10', 'true');
        localStorage.setItem('shams_newsletter_v8', 'true');
        setStatus('success');
        setTimeout(() => setIsOpen(false), 2500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-2xl bg-[#050505] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row min-h-[420px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-40 w-8 h-8 flex items-center justify-center rounded-none bg-black/60 text-white hover:bg-[#C4956A] transition-all border border-white/10 shadow-lg"
                        >
                            <X size={16} />
                        </button>

                        {/* Visual Side */}
                        <div className="w-full md:w-5/12 relative bg-[#111] h-64 md:h-full flex flex-col shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10" />
                            <img
                                src="/newsletter_shams.png"
                                alt="Shams Couple"
                                className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 z-0"
                            />
                            <div className="relative z-20 p-6 md:p-8 flex flex-col justify-end h-full">
                                <span className="text-[#C4956A] text-[8px] md:text-[10px] font-black tracking-[0.4em] uppercase mb-1 md:mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">CLUB SHAMS</span>
                                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-[0.9] uppercase italic drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
                                    VESTÍ EL <br /> <span className="text-[#C4956A] drop-shadow-[0_0_15px_rgba(196,149,106,0.8)] brightness-125">ÉXITO</span>
                                </h2>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden bg-[#050505]">
                            {/* Success Overlay */}
                            <AnimatePresence>
                                {status === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute inset-0 z-20 bg-[#050505] flex flex-col items-center justify-center text-center p-8"
                                    >
                                        <div className="w-16 h-16 rounded-none bg-[#C4956A]/20 flex items-center justify-center mb-4 border border-[#C4956A]/40">
                                            <CheckCircle2 size={32} className="text-[#C4956A]" />
                                        </div>
                                        <h3 className="text-xl font-black text-white tracking-[0.1em] uppercase mb-2">¡EXCELENTE!</h3>
                                        <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-6">
                                            Tu descuento ya está activo en tu carrito.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C4956A]/10 border border-[#C4956A]/20 rounded-none mb-6">
                                    <Gift size={12} className="text-[#C4956A]" />
                                    <span className="text-[#C4956A] text-[9px] font-black tracking-[0.2em] uppercase">10% OFF BIENVENIDA</span>
                                </div>

                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 leading-tight">
                                    UNITE AL <span className="text-[#C4956A] drop-shadow-[0_0_15px_rgba(196,149,106,0.4)]">PREMIUM</span>
                                </h2>
                                <p className="text-white/40 text-[10px] md:text-xs font-medium tracking-widest uppercase mb-6 leading-relaxed max-w-xs">
                                    Últimas tendencias y beneficios exclusivos directo a tu email.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-3">
                                    {/* Email */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#C4956A] transition-colors">
                                            <Mail size={16} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            autoComplete="email"
                                            placeholder="CORREO@EJEMPLO.COM"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-none py-3 pl-12 pr-4 text-[10px] font-bold tracking-[0.2em] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C4956A] focus:bg-white/10 transition-all uppercase"
                                        />
                                    </div>

                                    {/* Cumpleaños */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#C4956A] transition-colors">
                                            <Cake size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="bday"
                                            placeholder="DD/MM/AAAA"
                                            value={birthday}
                                            onChange={handleBirthdayChange}
                                            maxLength={10}
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-none pl-12 pr-4 text-sm font-bold text-white/60 placeholder:text-white/20 focus:outline-none focus:border-[#C4956A] focus:bg-white/10 transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full bg-[#C4956A] text-black font-black py-4 rounded-none text-[10px] tracking-[0.3em] uppercase flex items-center justify-center gap-2 hover:bg-white hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(196,149,106,0.2)]"
                                    >
                                        {status === 'loading' ? (
                                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-none animate-spin" />
                                        ) : (
                                            'QUIERO MI BENEFICIO'
                                        )}
                                    </button>
                                </form>

                                <button
                                    onClick={handleClose}
                                    className="w-full mt-4 text-white/20 hover:text-white text-[8px] font-black tracking-[0.4em] uppercase transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4956A]/5 blur-[100px] rounded-none -z-0 pointer-events-none" />
                        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-[#C4956A]/10 blur-[60px] rounded-none -z-0 pointer-events-none animate-pulse" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NewsletterModal;
