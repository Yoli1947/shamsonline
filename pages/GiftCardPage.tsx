import React, { useState } from 'react';
import { Gift, Mail, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';

const GIFT_AMOUNTS = [50000, 100000, 150000, 200000, 300000];

const GiftCardPage: React.FC = () => {
    const { addToCart } = useCart();
    const [amount, setAmount] = useState(GIFT_AMOUNTS[0]);
    const [formData, setFormData] = useState({
        senderName: '',
        senderEmail: '',
        recipientName: '',
        recipientEmail: '',
        message: ''
    });
    const [added, setAdded] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAdd = () => {
        if (!formData.senderName || !formData.senderEmail || !formData.recipientName || !formData.recipientEmail) {
            alert('Por favor completa los campos obligatorios (*)');
            return;
        }

        const giftCardProduct = {
            id: `gift-card-${Date.now()}`,
            name: `VIRTUAL GIFT CARD - $${amount.toLocaleString()}`,
            price: amount,
            originalPrice: amount,
            image: 'https://images.unsplash.com/photo-1549463599-242446c2243d?q=80&w=2070&auto=format&fit=crop', // Imagen genérica placeholder de regalo elegante
            brand: 'SHAMS',
            quantity: 1,
            size: 'ÚNICO',
            color: 'BLACK',
            isGiftCard: true,
            senderName: formData.senderName,
            senderEmail: formData.senderEmail,
            recipientName: formData.recipientName,
            recipientEmail: formData.recipientEmail,
            message: formData.message
        };

        addToCart(giftCardProduct);
        setAdded(true);
        setTimeout(() => setAdded(false), 3000);
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
            <Navbar
                // These props would normally come from an App-level state, 
                // but for now we define them or let them be optional
                cartCount={0}
                onOpenCart={() => { }}
                favoritesCount={0}
                onOpenFavorites={() => { }}
                searchQuery=""
                onSearchChange={() => { }}
                onOpenAuth={() => { }}
            />

            <main className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* LEFT: Gift Card Preview */}
                    <div className="space-y-8">
                        <div className="relative aspect-[16/10] bg-white rounded-3xl overflow-hidden border border-[var(--color-border)] shadow-2xl p-8 flex flex-col justify-between group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                            <div className="flex justify-between items-start">
                                <div className="font-heading text-2xl font-black tracking-[0.3em] text-[var(--color-text)]/90">
                                    SHAMS <span className="text-black">OUTLET</span>
                                </div>
                                <Gift className="text-black" size={40} />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">VIRTUAL GIFT CARD</h1>
                                <p className="text-[var(--color-text-muted)] tracking-[0.4em] text-xs uppercase">E-SHOPPING EXPERIENCE</p>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="text-3xl font-black text-black tracking-tighter">
                                    ${amount.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-[var(--color-text-muted)] font-mono">CODE: XXXX-XXXX-XXXX</div>
                            </div>
                        </div>

                        <div className="bg-white/50 rounded-2xl p-6 border border-[var(--color-border)] space-y-4">
                            <h3 className="font-black tracking-widest text-sm uppercase">DETALLE DEL PRODUCTO</h3>
                            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                                La Virtual Gift Card es la elección perfecta para sorprender a quien quieras. Con ella, quien la reciba podrá elegir entre todos los artículos de la colección disponible en nuestro e-shop. Fácil de usar y perfecta para cualquier ocasión. Válida por 60 días desde la fecha de envío.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: Form */}
                    <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-[var(--color-border)] p-8 md:p-10 space-y-8">
                        <h2 className="text-2xl font-black tracking-widest uppercase">CONFIGURA TU REGALO</h2>

                        {/* Amount Selector */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Selecciona el monto</label>
                            <div className="flex flex-wrap gap-2">
                                {GIFT_AMOUNTS.map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        className={`px-4 py-2 rounded-full border text-xs font-black tracking-widest transition-all ${amount === val
                                            ? 'bg-[#C4956A] border-[#C4956A] text-black scale-105'
                                            : 'border-[var(--color-border)] text-[var(--color-text)]/60 hover:border-white/30'
                                            }`}
                                    >
                                        ${val.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Nombre del Remitente *</label>
                                <input
                                    name="senderName"
                                    value={formData.senderName}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl p-4 text-sm focus:outline-none focus:border-[#C4956A] transition-colors"
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Correo del Remitente *</label>
                                <input
                                    name="senderEmail"
                                    value={formData.senderEmail}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl p-4 text-sm focus:outline-none focus:border-[#C4956A] transition-colors"
                                    placeholder="tu@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Nombre del Destinatario *</label>
                                <input
                                    name="recipientName"
                                    value={formData.recipientName}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl p-4 text-sm focus:outline-none focus:border-[#C4956A] transition-colors"
                                    placeholder="Nombre de quien recibe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Correo del Destinatario *</label>
                                <input
                                    name="recipientEmail"
                                    value={formData.recipientEmail}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl p-4 text-sm focus:outline-none focus:border-[#C4956A] transition-colors"
                                    placeholder="email@destinatario.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Mensaje Personalizado</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl p-4 text-sm focus:outline-none focus:border-[#C4956A] transition-colors resize-none"
                                placeholder="Escribe algo especial..."
                            />
                        </div>

                        <button
                            onClick={handleAdd}
                            disabled={added}
                            className={`w-full py-5 rounded-2xl font-black tracking-[0.3em] uppercase transition-all duration-500 flex items-center justify-center gap-3 ${added
                                ? 'bg-green-500 text-[var(--color-text)]'
                                : 'bg-white text-black hover:bg-[#C4956A] hover:shadow-[0_0_30px_rgba(196,149,106,0.4)]'
                                }`}
                        >
                            {added ? (
                                <>
                                    <Check size={20} />
                                    AÑADIDA AL CARRITO
                                </>
                            ) : (
                                <>
                                    AÑADIR AL CARRITO
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default GiftCardPage;
