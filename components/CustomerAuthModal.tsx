import React, { useState } from 'react';
import { X, Mail, Lock, User, ChevronRight, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CustomerAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: { email: string; name: string }) => void;
}

const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, signup } = useAuth();
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (isLogin) {
                // Login REAL con Supabase
                await login(email, password, false);
                onLoginSuccess({ email, name: email.split('@')[0] });
                onClose();
            } else {
                // Registro REAL con Supabase
                const signUpResult = await signup(email, password, name);

                // Aplicamos el promo de 10% IMMEDIATAMENTE al registrarse
                localStorage.setItem('shams_promo_10', 'true');

                // Si Supabase permite el login inmediato tras registro (configuración por defecto)
                // el AuthContext detectará el cambio. Si no, forzamos un login o mostramos mensaje de éxito.
                if (signUpResult?.session) {
                    onLoginSuccess({ email, name });
                    onClose();
                } else {
                    setSuccessMsg('¡Registro exitoso! Ya podés disfrutar de tu 10% de descuento. Iniciá sesión para continuar.');
                    setTimeout(() => setIsLogin(true), 3000);
                }
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            setError(err.message || "Error de autenticación. Verificá tus datos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#2C1810]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div
                style={{ position: 'relative', width: '100%', maxWidth: '448px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #e0e0e0', cursor: 'pointer', color: '#000' }}
                >
                    <X size={18} />
                </button>

                {/* Promo Banner */}
                <div style={{ backgroundColor: '#000', borderBottom: '1px solid #222', padding: '16px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <Gift color="#fff" size={22} style={{ marginBottom: '4px' }} />
                        <h3 style={{ color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '14px' }}>
                            10% OFF EN TU PRIMERA COMPRA
                        </h3>
                        <p style={{ color: '#aaa', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                            Registrate o iniciá sesión para reclamarlo
                        </p>
                    </div>
                </div>

                 {/* Form Content */}
                <div className="p-8">
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '0.2em', color: '#000', textTransform: 'uppercase' }}>
                            {isLogin ? 'BIENVENIDO/A' : 'UNITE AL CLUB'}
                        </h2>
                        <p style={{ color: '#666', fontSize: '11px', marginTop: '8px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                            {isLogin ? 'Ingresá a tu cuenta para continuar' : 'Completá tus datos para acceder'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                         {!isLogin && (
                            <div className="relative group">
                                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#999' }}>
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="NOMBRE COMPLETO"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{ width: '100%', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', padding: '12px 16px 12px 48px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#000', outline: 'none', textTransform: 'uppercase' as const }}
                                />
                            </div>
                        )}

                         <div className="relative group">
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#999' }}>
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                placeholder="CORREO ELECTRÓNICO"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', padding: '12px 16px 12px 48px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#000', outline: 'none', textTransform: 'uppercase' as const }}
                            />
                        </div>

                         <div className="relative group">
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#999' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="CONTRASEÑA"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', padding: '12px 16px 12px 48px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#000', outline: 'none' }}
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-[10px] text-center font-bold tracking-widest uppercase bg-red-500/10 p-3 rounded-none border border-red-500/20">
                                {error}
                            </p>
                        )}
                        {successMsg && (
                            <p style={{ fontSize: '10px', textAlign: 'center', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: '#f0f0f0', padding: '12px', border: '1px solid #e0e0e0', color: '#000' }}>
                                {successMsg}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ marginTop: '8px', width: '100%', backgroundColor: '#000', color: '#fff', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 900, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
                        >
                            {loading ? 'PROCESANDO...' : isLogin ? 'INGRESAR AL CLUB' : 'CREAR CUENTA'}
                            {!loading && <ChevronRight size={16} strokeWidth={3} />}
                        </button>
                    </form>

                     <div className="mt-8 text-center border-t border-[var(--color-border)] pt-6">
                        <p className="text-[var(--color-text-muted)] text-[10px] tracking-widest uppercase font-medium">
                            {isLogin ? '¿NO TIENES CUENTA?' : '¿YA ESTÁS REGISTRADO?'}
                        </p>
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            style={{ marginTop: '8px', color: '#000', background: 'none', border: 'none', fontSize: '12px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '8px auto 0' }}
                        >
                            {isLogin ? 'REGISTRATE AQUÍ' : 'INICIÁ SESIÓN'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerAuthModal;
