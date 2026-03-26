
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import BrandMarquee from '../components/BrandMarquee';
import ProductCard from '../components/ProductCard';
import ProductDetail from '../components/ProductDetail';
import CartDrawer from '../components/CartDrawer';
import { Product, CartItem } from '../types';
import { Filter, ArrowRight } from 'lucide-react';

// Mock products based on the "Copy of Copy" ZIP constants
const PREVIEW_PRODUCTS: Product[] = [
    {
        id: 'c1',
        name: 'Classic Trench 2024',
        brand: 'Perramus',
        price: 185000,
        originalPrice: 245000,
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
        category: 'Abrigos',
        description: 'Iconic protection with a futuristic silhouette. Water-resistant tech fabric.'
    },
    {
        id: 'c2',
        name: 'Cyber Original Tall Boots',
        brand: 'Hunter',
        price: 120000,
        originalPrice: 180000,
        image: 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?q=80&w=1000&auto=format&fit=crop',
        category: 'Calzado',
        description: 'Matte finish waterproof boots for the modern urban explorer.'
    },
    {
        id: 'c3',
        name: 'Regatta Tech Jacket',
        brand: 'Nautica',
        price: 95000,
        originalPrice: 140000,
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
        category: 'Abrigos',
        description: 'Wind-resistant sailing heritage reinvented for the street.'
    },
    {
        id: 'c4',
        name: 'Glitz Evening Dress',
        brand: 'Las Oreiro',
        price: 155000,
        originalPrice: 220000,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop',
        category: 'Vestidos',
        description: 'Pure elegance with a touch of Argentine fire. Premium silk blend.'
    }
];

const FuturistPreview: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    return (
        <div className="min-h-screen relative selection:bg-[#C4956A] selection:text-white bg-[#080808] text-white overflow-x-hidden">
            {/* Professional CSS Overrides */}
            <style>{`
                @font-face { font-family: 'Syncopate'; src: url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&display=swap'); }
                .font-heading { font-family: 'Syncopate', sans-serif; }
                .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
                .bg-vibrant-gradient { background: linear-gradient(135deg, #C4956A 0%, #E5D5C5 100%); }
                .text-vibrant { background: linear-gradient(135deg, #C4956A 0%, #E5D5C5 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .bg-blob { position: fixed; width: 800px; height: 800px; border-radius: 50%; filter: blur(140px); z-index: -2; opacity: 0.25; pointer-events: none; animation: drift 20s infinite alternate; }
                .blob-1 { top: -200px; right: -100px; background: #C4956A; animation-delay: 0s; }
                .blob-2 { bottom: -200px; left: -100px; background: #E5D5C5; animation-delay: -5s; }
                .noise { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: url('https://grainy-gradients.vercel.app/noise.svg'); opacity: 0.01; pointer-events: none; z-index: 9999; }
                .outline-text { -webkit-text-stroke: 1px rgba(255,255,255,0.05); color: transparent; }
                body::before { content: ""; position: fixed; inset: 0; background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 40px 40px; z-index: -1; pointer-events: none; }
                @keyframes drift { from { transform: translate(0, 0) scale(1); } to { transform: translate(100px, 50px) scale(1.1); } }
                @keyframes scroll-anim { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
            `}</style>

            <div className="noise" />
            <div className="bg-blob blob-1" />
            <div className="bg-blob blob-2" />

            <Navbar
                cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
                onOpenCart={() => setIsCartOpen(true)}
                favoritesCount={0}
                onOpenFavorites={() => {}}
                searchQuery=""
                onSearchChange={() => {}}
                onOpenAuth={() => {}}
            />

            <main>
                {/* PREVIEW HERO (from Copy of Copy ZIP) */}
                <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://images.unsplash.com/photo-1520699918507-3c3e05c46b0c?q=100&w=3000&auto=format&fit=crop"
                            alt="Fashion District"
                            className="w-full h-full object-cover transition-all duration-1000 scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#080808] via-transparent to-[#C4956A]/30" />
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                            <span className="font-heading text-[20vw] font-black text-white/[0.03] leading-none tracking-tighter outline-text">
                                ROSARIO
                            </span>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C4956A] to-transparent opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
                    </div>

                    <div className="relative z-10 text-center px-6 max-w-5xl mt-20">
                        <div className="inline-block px-5 py-2 border border-[#C4956A]/50 rounded-full mb-8 backdrop-blur-3xl bg-white/5 group overflow-hidden">
                            <span className="text-[10px] tracking-[0.6em] uppercase text-[#C4956A] font-black flex items-center gap-3">
                                <span className="h-1 w-1 rounded-full bg-[#E5D5C5] animate-pulse" />
                                DIRECTO DESDE ROSARIO (PREVIEW)
                            </span>
                        </div>
                        <h2 className="font-heading text-6xl md:text-9xl font-black mb-8 leading-[0.8] tracking-tighter text-white">
                            SHAMS <br /> <span className="text-vibrant italic">OUTLET</span>
                        </h2>
                        <p className="text-zinc-300 text-sm md:text-base max-w-3xl mx-auto mb-10 font-black leading-relaxed tracking-wider uppercase">
                            Primeras marcas. Precios imbatibles. <br />
                            <span className="text-white">Encontrá lo mejor de Perramus, Hunter, Nautica, Armesto, Blaque, Las Oreiro y más.</span>
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button className="bg-vibrant-gradient text-white px-14 py-5 rounded-full font-bold text-[10px] tracking-[0.3em] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_15px_40px_rgba(46,91,255,0.5)] uppercase">
                                PROBAR DISEÑO ZIP <ArrowRight size={16} />
                            </button>
                            <button className="glass border-white/10 hover:bg-white/10 transition-all text-white px-14 py-5 rounded-full font-bold text-[10px] tracking-[0.3em] shadow-xl uppercase">
                                VER MARCAS
                            </button>
                        </div>
                    </div>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                        <div className="w-[1.5px] h-14 bg-zinc-800 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[#C4956A] -translate-y-full animate-[scroll-anim_2s_infinite]" />
                        </div>
                    </div>
                </div>

                <BrandMarquee />

                <section className="py-40 px-6 md:px-12 max-w-screen-2xl mx-auto" id="new">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
                        <div>
                            <span className="text-[#C4956A] uppercase tracking-[0.6em] text-[10px] block mb-4 font-black">CURATED IN ROSARIO</span>
                            <h2 className="font-heading text-5xl md:text-8xl font-bold tracking-tighter text-white">LÍNEA <span className="text-vibrant italic">EXCLUSIVA</span></h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 mr-2 tracking-[0.3em] uppercase">
                                <Filter size={14} />
                                <span>FILTRO:</span>
                            </div>
                            <button className="px-8 py-3 rounded-full text-[9px] font-black tracking-[0.3em] uppercase bg-[#C4956A] text-white shadow-[0_10px_25px_rgba(46,91,255,0.4)]">TODOS</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
                        {PREVIEW_PRODUCTS.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={addToCart}
                                onOpenDetail={(p) => setSelectedProduct(p)}
                            />
                        ))}
                    </div>
                </section>

                <section className="py-52 px-6 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://images.unsplash.com/photo-1610450949065-1f2809da7f81?q=80&w=2000&auto=format&fit=crop')] opacity-5 bg-fixed bg-cover" />
                    <div className="max-w-6xl mx-auto text-center relative z-10">
                        <h3 className="font-heading text-4xl md:text-6xl font-bold mb-32 tracking-tighter text-white uppercase italic">
                            EL MANIFIESTO <span className="text-[#C4956A]">SHAMS</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                            {[
                                { title: 'ORIGEN GARANTIZADO', desc: 'Curaduría directa desde los distritos de moda más prestigiosos.', color: '#C4956A' },
                                { title: 'PRECIOS DE ARCHIVO', desc: 'Acceso exclusivo a piezas de colección con valor increíble.', color: '#FF4D00' },
                                { title: 'IA VANGUARDISTA', desc: 'Estilismo predictivo alimentado por tendencias globales.', color: '#E5D5C5' }
                            ].map((item, i) => (
                                <div key={i} className="glass p-14 rounded-[3.5rem] group hover:bg-white/5 hover:scale-[1.02] transition-all border-l-2" style={{ borderLeftColor: item.color }}>
                                    <h4 className="text-[13px] font-black tracking-[0.5em] mb-8 text-white uppercase">{item.title}</h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed font-black tracking-wide uppercase">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cart}
                onRemove={removeFromCart}
                onUpdateQty={updateQuantity}
                onCheckout={() => {}}
            />

            {selectedProduct && (
                <ProductDetail
                    product={selectedProduct}
                    isOpen={!!selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onAddToCart={addToCart}
                />
            )}
        </div>
    );
};

export default FuturistPreview;
