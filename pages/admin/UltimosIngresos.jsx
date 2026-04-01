import React, { useState, useEffect } from 'react';
import { Search, X, CheckCircle2, Loader, Star } from 'lucide-react';
import { getAllProductsForOrdering, updateProduct } from '../../lib/admin';

export default function UltimosIngresos() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [savedId, setSavedId] = useState(null);

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getAllProductsForOrdering();
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const brands = React.useMemo(() => {
        const map = new Map();
        for (const p of products) {
            if (p.brand?.name && !map.has(p.brand.name)) map.set(p.brand.name, p.brand.name);
        }
        return Array.from(map.keys()).sort();
    }, [products]);

    const toggleFeatured = async (product) => {
        const newVal = !product.is_featured;
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: newVal } : p));
        setSaving(product.id);
        try {
            await updateProduct(product.id, { isFeatured: newVal });
            setSavedId(product.id);
            setTimeout(() => setSavedId(null), 1500);
        } catch (e) {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: !newVal } : p));
            alert('Error: ' + e.message);
        } finally {
            setSaving(null);
        }
    };

    const filtered = products.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.brand?.name?.toLowerCase().includes(q);
        const matchBrand = !selectedBrand || p.brand?.name === selectedBrand;
        return matchSearch && matchBrand;
    });

    const featured = products.filter(p => p.is_featured);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--color-text)]">Últimos Ingresos</h1>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">
                    Hacé click en un producto para agregarlo o quitarlo de la sección "Últimos Ingresos" de la tienda.
                </p>
            </div>

            {/* Seleccionados */}
            <div className="mb-6 p-4 bg-black/5 border border-black/10 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <Star size={14} fill="currentColor" className="text-amber-500" />
                    <span className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wide">
                        En portada ({featured.length})
                    </span>
                </div>
                {featured.length === 0 ? (
                    <p className="text-[var(--color-text-muted)] text-xs">Ningún producto seleccionado. La tienda mostrará todos los productos.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {featured.map(p => (
                            <button
                                key={p.id}
                                onClick={() => toggleFeatured(p)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[11px] font-bold rounded-lg hover:bg-red-600 transition-all group"
                                title="Click para quitar"
                            >
                                {p.name}
                                <X size={10} className="opacity-60 group-hover:opacity-100" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white border border-[var(--color-border)] rounded-xl py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:border-black transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={selectedBrand}
                    onChange={e => setSelectedBrand(e.target.value)}
                    className="bg-white border border-[var(--color-border)] rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-black transition-all min-w-[180px]"
                >
                    <option value="">Todas las marcas</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader size={32} className="animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {filtered.map(product => {
                        const image = product.images?.find(i => i.is_primary)?.url || product.images?.[0]?.url;
                        const isFeatured = product.is_featured;
                        const isSaving = saving === product.id;
                        const justSaved = savedId === product.id;
                        return (
                            <div
                                key={product.id}
                                onClick={() => !isSaving && toggleFeatured(product)}
                                className={`relative bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all select-none
                                    ${isFeatured ? 'border-black shadow-lg' : 'border-[var(--color-border)] hover:border-black hover:shadow-md'}
                                `}
                            >
                                {/* Badge */}
                                <div className={`absolute top-2 right-2 z-10 transition-all ${isFeatured ? 'opacity-100' : 'opacity-0'}`}>
                                    {isSaving ? (
                                        <Loader size={16} className="animate-spin text-white drop-shadow" />
                                    ) : justSaved ? (
                                        <CheckCircle2 size={18} className="text-white drop-shadow" fill="black" />
                                    ) : (
                                        <Star size={18} fill="#F59E0B" className="text-amber-400 drop-shadow" />
                                    )}
                                </div>

                                {/* Overlay al hacer click */}
                                {!isFeatured && (
                                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all z-10 flex items-center justify-center">
                                        <div className="opacity-0 hover:opacity-100 bg-black text-white text-[10px] font-bold px-2 py-1 rounded transition-all">
                                            + AGREGAR
                                        </div>
                                    </div>
                                )}

                                {isFeatured && (
                                    <div className="absolute bottom-0 left-0 right-0 z-10 bg-black text-white text-[9px] font-black text-center py-1 uppercase tracking-widest">
                                        En portada ✕ quitar
                                    </div>
                                )}

                                <div className="aspect-[3/4] bg-gray-100">
                                    {image ? (
                                        <img src={image} alt={product.name} className="w-full h-full object-cover pointer-events-none" loading="lazy" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                                    )}
                                </div>
                                <div className={`p-2 ${isFeatured ? 'pb-6' : ''}`}>
                                    <p className="text-[11px] font-bold uppercase truncate">{product.name}</p>
                                    {product.brand?.name && (
                                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest truncate">{product.brand.name}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-16 text-[var(--color-text-muted)]">No se encontraron productos.</div>
            )}
        </div>
    );
}
