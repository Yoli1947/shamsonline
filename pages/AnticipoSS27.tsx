import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { Loader } from 'lucide-react';
import { getAllProducts } from '../lib/admin';
import { mapProductsToUI } from '../lib/products';
import { usePageSEO } from '../lib/seo';
import { Product } from '../types';

const PRODUCTS_PAGE_SIZE = 24;

const AnticipoSS27: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [visibleCount, setVisibleCount] = useState(PRODUCTS_PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

    usePageSEO({
        title: 'Anticipo SS27 — Multibrand Rosario',
        description: 'Un adelanto de la próxima colección primavera/verano en Multibrand Rosario.',
    });

    useEffect(() => {
        try {
            const stored = localStorage.getItem('shams_favorites');
            if (stored) setFavorites(JSON.parse(stored));
        } catch (e) {
            console.error('Failed to load favorites', e);
        }
    }, []);

    const toggleFavorite = (productId: string) => {
        setFavorites(prev => {
            const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
            try { localStorage.setItem('shams_favorites', JSON.stringify(next)); } catch (e) { console.error('Failed to save favorites', e); }
            return next;
        });
    };

    // Carga el catálogo completo: primero muestra el caché de la tienda si existe
    // (carga instantánea), y en paralelo trae la versión fresca de la DB paginando
    // en chunks (igual que hace Store.tsx al arrancar).
    useEffect(() => {
        let isMounted = true;

        try {
            const cached = JSON.parse(localStorage.getItem('shams_products_v19') || '[]');
            if (cached.length > 0) {
                setProducts(cached);
                setLoading(false);
            }
        } catch (e) {
            console.warn('Error leyendo caché de productos:', e);
        }

        async function load() {
            try {
                const CHUNK_SIZE = 250;
                let offset = 0;
                let all: any[] = [];
                let hasMore = true;
                while (hasMore && isMounted) {
                    const { products: chunk } = await getAllProducts(1, CHUNK_SIZE, '', offset, true);
                    if (!chunk || chunk.length === 0) { hasMore = false; break; }
                    all = all.concat(chunk);
                    offset += CHUNK_SIZE;
                    hasMore = chunk.length === CHUNK_SIZE;
                }
                if (isMounted && all.length > 0) {
                    setProducts(mapProductsToUI(all));
                }
            } catch (e) {
                console.error('Error cargando Anticipo SS27:', e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        load();
        return () => { isMounted = false; };
    }, []);

    // Curaduría manual: solo entran los productos marcados como "Anticipo SS27"
    // en el panel de admin (is_anticipo_ss27), no depende de stock/descuento.
    const anticipoProducts = useMemo(() => {
        return products.filter(p => {
            if (!(p as any).isAnticipoSS27) return false;
            if (p.is_published === false || p.is_active === false) return false;
            const hasValidImage = p.image && !p.image.includes('placeholder') && !p.image.includes('No+Image');
            if (!hasValidImage) return false;
            return true;
        });
    }, [products]);

    // Auto-carga silenciosa al acercarse al final de la grilla (mismo patrón que
    // las colecciones filtradas en Store.tsx).
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                setVisibleCount(v => v + PRODUCTS_PAGE_SIZE);
            }
        }, { rootMargin: '600px' });
        observer.observe(el);
        return () => observer.disconnect();
    });

    const visibleProducts = anticipoProducts.slice(0, visibleCount);

    return (
        <div className="min-h-screen relative selection:bg-black selection:text-white bg-[var(--color-background)] text-[var(--color-text)] overflow-x-hidden">
            <Navbar
                cartCount={0}
                onOpenCart={() => {}}
                favoritesCount={favorites.length}
                onOpenFavorites={() => {}}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenAuth={() => {}}
                products={products}
                onSelectProduct={(p) => navigate(`/producto/${p.sku}`)}
            />

            <main className="relative px-4 md:px-12 max-w-screen-2xl mx-auto z-10" style={{ paddingTop: 'calc(var(--navbar-height, 220px) + 16px)' }}>
                <header className="mb-12 text-center max-w-4xl mx-auto">
                    <span className="text-[var(--color-text-muted)] uppercase tracking-[0.8em] text-[10px] font-black mb-6 block">
                        PRIMAVERA / VERANO 2027
                    </span>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[var(--color-text)] mb-8 uppercase italic leading-tight">
                        Anticipo
                    </h1>
                    <div className="w-24 h-[1px] bg-black mx-auto" />
                </header>

                {loading && anticipoProducts.length === 0 ? (
                    <div className="flex h-96 items-center justify-center">
                        <Loader className="animate-spin text-[var(--color-text)] opacity-20" size={48} />
                    </div>
                ) : anticipoProducts.length === 0 ? (
                    <div className="text-center py-32 opacity-50 min-h-[50vh]">
                        <p className="text-xl font-bold tracking-[0.2em] uppercase mb-4 text-[var(--color-text)]">Todavía no hay nada cargado</p>
                        <p className="text-[var(--color-text)] italic tracking-widest text-sm uppercase font-medium">Volvé a intentar más tarde.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5 sm:gap-6 gap-y-4 sm:gap-y-12 min-h-[50vh] pb-24">
                            {visibleProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={() => navigate(`/producto/${product.sku}`)}
                                    onOpenDetail={(p) => navigate(`/producto/${p.sku}`)}
                                    isFavorite={favorites.includes(product.id)}
                                    onToggleFavorite={toggleFavorite}
                                />
                            ))}
                        </div>
                        {visibleCount < anticipoProducts.length && (
                            <div ref={sentinelRef} className="flex justify-center py-12">
                                <Loader className="animate-spin text-black/30" size={24} />
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AnticipoSS27;
