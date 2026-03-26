import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, ChevronRight, Gift } from 'lucide-react';
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
                className="relative w-full max-w-md bg-[var(--color-background)] border border-[var(--color-border)] rounded-none overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-none bg-[var(--color-background)]/80 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-background-alt)] transition-colors backdrop-blur-sm border border-[var(--color-border)]"
                >
                    <X size={18} />
                </button>

                {/* Promo Banner */}
                <div className="bg-[#C4956A]/10 border-b border-[#C4956A]/20 px-6 py-4 text-center relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center gap-1">
                        <Gift className="text-[#C4956A] mb-1" size={24} />
                        <h3 className="text-[var(--color-text)] font-black uppercase tracking-[0.2em] text-sm md:text-base">
                            10% OFF EN TU PRIMERA COMPRA
                        </h3>
                        <p className="text-[#C4956A] text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] opacity-90">
                            Registrate o iniciá sesión para reclamarlo
                        </p>
                    </div>
                </div>

                 {/* Form Content */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="font-heading text-2xl font-black tracking-[0.2em] text-[var(--color-text)] uppercase">
                            {isLogin ? 'BIENVENIDO/A' : 'UNITE AL CLUB'}
                        </h2>
                        <p className="text-[var(--color-text-muted)] text-xs mt-2 font-medium tracking-widest uppercase">
                            {isLogin ? 'Ingresá a tu cuenta para continuar' : 'Completá tus datos para acceder'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                         {!isLogin && (
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)]/60 group-focus-within:text-[#C4956A] transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="NOMBRE COMPLETO"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[var(--color-background-alt)] border border-[var(--color-border)] rounded-none py-3 pl-12 pr-4 text-xs font-bold tracking-widest text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:border-[#C4956A] focus:bg-[#E8D5C0] transition-all uppercase"
                                />
                            </div>
                        )}

                         <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)]/60 group-focus-within:text-[#C4956A] transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                placeholder="CORREO ELECTRÓNICO"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[var(--color-background-alt)] border border-[var(--color-border)] rounded-none py-3 pl-12 pr-4 text-xs font-bold tracking-widest text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:border-[#C4956A] focus:bg-[#E8D5C0] transition-all uppercase"
                            />
                        </div>

                         <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)]/60 group-focus-within:text-[#C4956A] transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="CONTRASEÑA"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[var(--color-background-alt)] border border-[var(--color-border)] rounded-none py-3 pl-12 pr-4 text-xs font-bold tracking-widest text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:border-[#C4956A] focus:bg-[#E8D5C0] transition-all"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-[10px] text-center font-bold tracking-widest uppercase bg-red-500/10 p-3 rounded-none border border-red-500/20">
                                {error}
                            </p>
                        )}
                        {successMsg && (
                            <p className="text-emerald-400 text-[10px] text-center font-bold tracking-widest uppercase bg-emerald-500/10 p-3 rounded-none border border-emerald-500/20">
                                {successMsg}
                            </p>
                        )}

                         <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full bg-[#2C1810] text-white hover:bg-[#C4956A] transition-all rounded-none py-4 flex items-center justify-center gap-2 font-black text-xs tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? 'PROCESANDO...' : isLogin ? 'INGRESAR AL CLUB' : 'CREAR CUENTA'}
                                {!loading && <ChevronRight size={16} strokeWidth={3} />}
                            </span>
                        </button>
                    </form>

                     <div className="mt-8 text-center border-t border-[var(--color-border)] pt-6">
                        <p className="text-[var(--color-text-muted)] text-[10px] tracking-widest uppercase font-medium">
                            {isLogin ? '¿NO TIENES CUENTA?' : '¿YA ESTÁS REGISTRADO?'}
                        </p>
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="mt-2 text-[var(--color-text)] hover:text-[#C4956A] text-xs font-black tracking-[0.2em] uppercase flex items-center justify-center gap-1 mx-auto transition-colors"
                        >
                            {isLogin ? 'REGISTRATE AQUÍ' : 'INICIÁ SESIÓN'}
                            <Sparkles size={14} className={isLogin ? "opacity-0" : "text-[#C4956A]"} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerAuthModal;
