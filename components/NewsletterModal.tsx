
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
        const birthdayISO = birthday.length === 10
            ? birthday.split('/').reverse().join('-')
            : birthday || null;
        try {
            await supabase.from('newsletter_subscribers').insert({
                email,
                birthday: birthdayISO,
            });
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
                    style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{ position: 'relative', width: '100%', maxWidth: '672px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'row', minHeight: '420px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 40, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #e0e0e0', cursor: 'pointer', color: '#000' }}
                        >
                            <X size={16} />
                        </button>

                        {/* Visual Side - imagen con overlay oscuro (intencional) */}
                        <div style={{ width: '42%', position: 'relative', backgroundColor: '#111', flexShrink: 0 }} className="hidden md:block">
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent, rgba(0,0,0,0.3))', zIndex: 10 }} />
                            <img
                                src="/newsletter_shams.png"
                                alt="Shams"
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                            />
                            <div style={{ position: 'relative', zIndex: 20, padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                                <span style={{ color: '#fff', fontSize: '9px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>CLUB SHAMS</span>
                                <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', fontStyle: 'italic', lineHeight: 0.9 }}>
                                    VESTÍ EL <br /> ÉXITO
                                </h2>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div style={{ flex: 1, padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                            {/* Success Overlay */}
                            <AnimatePresence>
                                {status === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{ position: 'absolute', inset: 0, zIndex: 20, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px' }}
                                    >
                                        <div style={{ width: '64px', height: '64px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid #e0e0e0' }}>
                                            <CheckCircle2 size={32} color="#000" />
                                        </div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#000', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>¡EXCELENTE!</h3>
                                        <p style={{ color: '#666', fontSize: '10px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                                            Tu descuento ya está activo en tu carrito.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div style={{ position: 'relative', zIndex: 10 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
                                    <Gift size={12} color="#000" />
                                    <span style={{ color: '#000', fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}>10% OFF BIENVENIDA</span>
                                </div>

                                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#000', letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.1, textTransform: 'uppercase' }}>
                                    UNITE AL CLUB
                                </h2>
                                <p style={{ color: '#666', fontSize: '10px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px', lineHeight: 1.8 }}>
                                    Últimas tendencias y beneficios exclusivos directo a tu email.
                                </p>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Email */}
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#999' }}>
                                            <Mail size={16} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            autoComplete="email"
                                            placeholder="CORREO@EJEMPLO.COM"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={{ width: '100%', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', padding: '12px 16px 12px 48px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: '#000', outline: 'none', textTransform: 'uppercase' as const }}
                                        />
                                    </div>

                                    {/* Cumpleaños */}
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#999' }}>
                                            <Cake size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="bday"
                                            placeholder="DD/MM/AAAA (OPCIONAL)"
                                            value={birthday}
                                            onChange={handleBirthdayChange}
                                            maxLength={10}
                                            style={{ width: '100%', height: '48px', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', paddingLeft: '48px', paddingRight: '16px', fontSize: '11px', fontWeight: 700, color: '#000', outline: 'none' }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        style={{ width: '100%', backgroundColor: '#000', color: '#fff', border: 'none', padding: '16px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' as const, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        {status === 'loading' ? (
                                            <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        ) : (
                                            'QUIERO MI BENEFICIO'
                                        )}
                                    </button>
                                </form>

                                <button
                                    onClick={handleClose}
                                    style={{ width: '100%', marginTop: '16px', color: '#999', background: 'none', border: 'none', fontSize: '8px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase' as const, cursor: 'pointer' }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NewsletterModal;
