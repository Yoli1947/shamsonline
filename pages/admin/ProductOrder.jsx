import React, { useState, useEffect } from 'react';
import { GripVertical, Save, Search, X, CheckCircle2, Loader } from 'lucide-react';
import { getAllProductsForOrdering, saveProductsOrder } from '../../lib/admin';
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableCard = ({ product, isSearchActive }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: product.id,
        disabled: isSearchActive,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.4 : 1,
    };

    const image = product.images?.find(i => i.is_primary)?.url || product.images?.[0]?.url;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative bg-white border rounded-xl overflow-hidden group transition-all ${
                isDragging ? 'border-[#DCDCDC] shadow-[0_0_20px_rgba(196,149,106,0.3)]' : 'border-[var(--color-border)] hover:border-white/20'
            }`}
        >
            {/* Drag handle */}
            {!isSearchActive && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-[var(--color-background)]/60 text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical size={16} />
                </div>
            )}

            {/* Imagen */}
            <div className="aspect-[3/4] bg-[var(--color-background-alt)]">
                {image ? (
                    <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">Sin imagen</div>
                )}
            </div>

            {/* Info */}
            <div className="p-2">
                <p className="text-[var(--color-text)] text-[11px] font-bold uppercase truncate leading-tight">{product.name}</p>
                {product.brand?.name && (
                    <p className="text-[var(--color-text-muted)] text-[10px] uppercase tracking-widest truncate">{product.brand.name}</p>
                )}
            </div>
        </div>
    );
};

export default function ProductOrder() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [photoFilter, setPhotoFilter] = useState('todas');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    useEffect(() => {
        loadProducts();
    }, []);

    // Extraer marcas únicas con foto representativa (primer producto de cada marca)
    const brands = React.useMemo(() => {
        const map = new Map();
        for (const p of products) {
            const name = p.brand?.name;
            if (name && !map.has(name)) {
                const img = p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url;
                map.set(name, { name, img });
            }
        }
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [products]);

    useEffect(() => {
        let result = products;
        if (selectedBrand) {
            result = result.filter(p => p.brand?.name === selectedBrand);
        }
        if (photoFilter === 'con') {
            result = result.filter(p => p.images && p.images.length > 0);
        } else if (photoFilter === 'sin') {
            result = result.filter(p => !p.images || p.images.length === 0);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(q) || p.brand?.name?.toLowerCase().includes(q)
            );
        }
        setFilteredProducts(result);
    }, [search, selectedBrand, photoFilter, products]);

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

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const isFiltered = selectedBrand !== '' || photoFilter !== 'todas';

        if (isFiltered) {
            // Reordenar dentro del subconjunto filtrado y mergear de vuelta al array completo
            const oldFilteredIndex = filteredProducts.findIndex(p => p.id === active.id);
            const newFilteredIndex = filteredProducts.findIndex(p => p.id === over.id);
            const newFiltered = arrayMove(filteredProducts, oldFilteredIndex, newFilteredIndex);

            // Posiciones en el array completo que corresponden a los filtrados
            const filteredPositions = products
                .map((p, i) => filteredProducts.some(fp => fp.id === p.id) ? i : -1)
                .filter(i => i !== -1);

            const newProducts = [...products];
            filteredPositions.forEach((pos, i) => {
                newProducts[pos] = newFiltered[i];
            });
            setProducts(newProducts);
        } else {
            const oldIndex = products.findIndex(p => p.id === active.id);
            const newIndex = products.findIndex(p => p.id === over.id);
            setProducts(arrayMove(products, oldIndex, newIndex));
        }

        setHasChanges(true);
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveProductsOrder(products);
            setHasChanges(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
            alert('Error al guardar el orden');
        } finally {
            setSaving(false);
        }
    };

    const isDragDisabled = search.trim().length > 0;
    const isFiltered = selectedBrand !== '' || photoFilter !== 'todas';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Orden de Productos</h1>
                    <p className="text-[var(--color-text-muted)] text-sm mt-1">
                        Arrastrá los productos para definir el orden en que aparecen en la tienda.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                            <CheckCircle2 size={16} /> Orden guardado
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            hasChanges
                                ? 'bg-[#DCDCDC] text-black hover:bg-white'
                                : 'bg-white text-[var(--color-text-muted)] cursor-not-allowed'
                        }`}
                    >
                        {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar orden
                    </button>
                </div>
            </div>

            {/* Buscador + Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {/* Buscador */}
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white border border-[var(--color-border)] rounded-xl py-2.5 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#DCDCDC] transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filtro por marca */}
                <div className="relative">
                    <select
                        value={selectedBrand}
                        onChange={e => setSelectedBrand(e.target.value)}
                        className="appearance-none bg-white border border-[var(--color-border)] rounded-xl py-2.5 pl-4 pr-10 text-sm text-[var(--color-text)] focus:outline-none focus:border-[#DCDCDC] transition-all cursor-pointer min-w-[180px] [color-scheme:dark]"
                    >
                        <option value="">Todas las marcas ({products.length})</option>
                        {brands.map(brand => {
                            const count = products.filter(p => p.brand?.name === brand.name).length;
                            return (
                                <option key={brand.name} value={brand.name}>
                                    {brand.name} ({count})
                                </option>
                            );
                        })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)]">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10L6 8z"/></svg>
                    </div>
                </div>

                {/* Filtro por foto */}
                <div className="relative">
                    <select
                        value={photoFilter}
                        onChange={e => setPhotoFilter(e.target.value)}
                        className="appearance-none bg-white border border-[var(--color-border)] rounded-xl py-2.5 pl-4 pr-10 text-sm text-[var(--color-text)] focus:outline-none focus:border-[#DCDCDC] transition-all cursor-pointer min-w-[160px] [color-scheme:dark]"
                    >
                        <option value="todas">Todas las fotos</option>
                        <option value="con">Con foto</option>
                        <option value="sin">Sin foto</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)]">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10L6 8z"/></svg>
                    </div>
                </div>
            </div>

            {isDragDisabled && (
                <div className="mb-4 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-xs">
                    Búsqueda activa — el drag está desactivado. Borrá el texto para reordenar.
                </div>
            )}
            {!isDragDisabled && isFiltered && (
                <div className="mb-4 px-3 py-2 bg-[#DCDCDC]/10 border border-[#DCDCDC]/20 rounded-xl text-[#DCDCDC] text-xs">
                    Podés arrastrar para reordenar dentro del filtro seleccionado.
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader size={32} className="animate-spin text-[#DCDCDC]" />
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={filteredProducts.map(p => p.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {filteredProducts.map(product => (
                                <SortableCard
                                    key={product.id}
                                    product={product}
                                    isSearchActive={isDragDisabled}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-16 text-[var(--color-text-muted)]">No se encontraron productos.</div>
            )}

            <p className="text-zinc-600 text-xs mt-6 text-center">
                {products.length} productos en total
            </p>
        </div>
    );
}
