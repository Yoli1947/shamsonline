import React, { useState, useEffect } from 'react';
import { getBrands } from '../lib/admin';
import Navbar from '../components/Navbar';
import { Loader, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Import supabase client directly for custom query

const BrandPage: React.FC = () => {
    const [brands, setBrands] = useState<any[]>([]);
    const [brandImages, setBrandImages] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // 1. Get Brands
                const dbBrands = await getBrands();

                // 2. Get Representative Images for Brands
                // We fetch products with images, order by creation (newest first).
                // We limit to 500 to cover most active brands.
                const { data: products } = await supabase
                    .from('products')
                    .select('brand_id, image_url')
                    .not('image_url', 'is', null)
                    .neq('image_url', '')
                    .order('created_at', { ascending: false })
                    .limit(500);

                // Map brand_id -> image_url (takes the first/newest one found)
                const imageMap: Record<string, string> = {};
                if (products) {
                    products.forEach((p: any) => {
                        if (p.brand_id && !imageMap[p.brand_id]) {
                            imageMap[p.brand_id] = p.image_url;
                        }
                    });
                }

                setBrandImages(imageMap);
                setBrands(dbBrands);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="min-h-screen relative selection:bg-black selection:text-white bg-[var(--color-background)] text-[var(--color-text)] overflow-hidden">
            {/* Background elements - More subtle luxury */}
            <div className="fixed inset-0 bg-[var(--color-background)] pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] hidden pointer-events-none" />

            <Navbar
                cartCount={0}
                onOpenCart={() => {}}
                favoritesCount={0}
                onOpenFavorites={() => {}}
                searchQuery=""
                onSearchChange={() => {}}
                onOpenAuth={() => {}}
            />

            <main className="relative pt-4 px-0.5 md:px-12 max-w-screen-2xl mx-auto z-10">
                <header className="mb-8 text-center max-w-4xl mx-auto">
                    <span className="text-[var(--color-text-muted)] uppercase tracking-[0.8em] text-[10px] font-black mb-6 block animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        CURATED SELECTION
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[var(--color-text)] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 uppercase italic">
                        MARCAS <span className="text-[var(--color-text-muted)]">SELECTAS</span>
                    </h1>
                    <div className="w-24 h-[1px] bg-white mx-auto mb-8" />
                </header>

                {loading ? (
                    <div className="flex h-96 items-center justify-center">
                        <Loader className="animate-spin text-[var(--color-text)] opacity-20" size={48} />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0.5 md:gap-8 pb-48">
                        {brands.map((brand, index) => (
                            <div
                                key={brand.id}
                                onClick={() => navigate(`/?marca=${encodeURIComponent(brand.name)}#new`)}
                                className="group relative aspect-[2/3] md:aspect-[4/5] rounded-sm md:rounded-none bg-white border border-[var(--color-border)] overflow-hidden transition-all duration-700 cursor-pointer animate-in fade-in slide-in-from-bottom-12"
                                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                            >
                                {/* Sharp Image Background */}
                                {(brand.card_image_url || brandImages[brand.id]) ? (
                                    <img
                                        src={brand.card_image_url || brandImages[brand.id]}
                                        alt={brand.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-white flex items-center justify-center">
                                        <span className="text-[10px] tracking-[0.5em] text-[var(--color-text-muted)] font-black uppercase">SHAMS ARCHIVE</span>
                                    </div>
                                )}

                                {/* Gradient Bottom Overlay - Minimal to keep image sharp */}
                                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />

                                {/* Hover Reveal Overlay */}
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Editorial Content */}
                                <div className="absolute inset-0 p-3 md:p-6 flex flex-col justify-end">
                                    <div className="relative overflow-hidden pb-2 md:pb-1">
                                        <span className="block text-[8px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.4em] text-[var(--color-text-muted)] uppercase mb-1 md:mb-2 transform transition-transform duration-500 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                            EXPLORAR COLECCIÓN
                                        </span>
                                        <h3 className="text-[13px] md:text-3xl font-black text-white tracking-widest md:tracking-wider uppercase transition-all duration-700 group-hover:text-zinc-200 break-words leading-normal mt-1 md:mt-0">
                                            {brand.name}
                                        </h3>
                                        {/* Luxury Underline */}
                                        <div className="w-12 h-[1px] bg-white mt-3 md:mt-6 transition-all duration-700 group-hover:w-full opacity-50 group-hover:opacity-100" />
                                    </div>
                                </div>

                                {/* Minimalist Corner Accent */}
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0">
                                    <ArrowRight size={20} className="text-[var(--color-text)]" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default BrandPage;
