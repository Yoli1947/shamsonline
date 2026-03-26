import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Loader, Image as ImageIcon } from 'lucide-react';
import { getAllProductsForOrdering, getSiteSetting, updateSiteSetting } from '../../lib/admin';

export default function BrandImages() {
    const [brandGroups, setBrandGroups] = useState([]); // [{ name, products }]
    const [selected, setSelected] = useState({});       // { brandName: imageUrl }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const [products, setting] = await Promise.all([
                getAllProductsForOrdering(),
                getSiteSetting('brand_featured_images').catch(() => null),
            ]);

            // Agrupar productos por marca
            const map = new Map();
            for (const p of products) {
                const name = p.brand?.name;
                if (!name) continue;
                if (!map.has(name)) map.set(name, []);
                const imgs = p.images || [];
                const primary = imgs.find(i => i.is_primary)?.url || imgs[0]?.url;
                if (primary && !map.get(name).includes(primary)) {
                    map.get(name).push(...imgs.map(i => i.url).filter(Boolean));
                }
            }

            // Deduplicar imágenes por marca
            const groups = Array.from(map.entries())
                .map(([name, imgs]) => ({ name, images: [...new Set(imgs)] }))
                .filter(g => g.images.length > 0)
                .sort((a, b) => a.name.localeCompare(b.name));

            setBrandGroups(groups);

            // Cargar selección guardada
            let saved = {};
            if (setting?.value) {
                try { saved = JSON.parse(setting.value); } catch (_) {}
            }
            // Para marcas sin selección, usar la primera imagen
            const initial = {};
            for (const g of groups) {
                initial[g.name] = saved[g.name] || g.images[0];
            }
            setSelected(initial);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (brandName, imageUrl) => {
        setSelected(prev => ({ ...prev, [brandName]: imageUrl }));
        setHasChanges(true);
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSiteSetting('brand_featured_images', JSON.stringify(selected), 'Imágenes Destacadas por Marca');
            setHasChanges(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Imágenes de Marcas</h1>
                    <p className="text-[var(--color-text-muted)] text-sm mt-1">
                        Elegí qué foto aparece en cada marca en la sección "MODELOS MÁS PEDIDOS".
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                            <CheckCircle2 size={16} /> Guardado
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            hasChanges
                                ? 'bg-[#C4956A] text-black hover:bg-white'
                                : 'bg-white text-[var(--color-text-muted)] cursor-not-allowed'
                        }`}
                    >
                        {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader size={32} className="animate-spin text-[#C4956A]" />
                </div>
            ) : (
                <div className="space-y-10">
                    {brandGroups.map(group => (
                        <div key={group.name}>
                            {/* Brand header */}
                            <div className="flex items-center gap-3 mb-4">
                                {selected[group.name] && (
                                    <img
                                        src={selected[group.name]}
                                        alt={group.name}
                                        className="w-10 h-14 rounded-lg object-cover border-2 border-[#C4956A] shadow-[0_0_12px_rgba(196,149,106,0.3)]"
                                    />
                                )}
                                <div>
                                    <h2 className="text-[var(--color-text)] font-black text-sm uppercase tracking-widest">{group.name}</h2>
                                    <p className="text-[var(--color-text-muted)] text-xs">{group.images.length} foto{group.images.length !== 1 ? 's' : ''} disponibles</p>
                                </div>
                            </div>

                            {/* Image grid */}
                            <div className="flex flex-wrap gap-3 pb-3">
                                {group.images.map((url, idx) => {
                                    const isSelected = selected[group.name] === url;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelect(group.name, url)}
                                            className={`relative shrink-0 w-28 md:w-32 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                                                isSelected
                                                    ? 'border-[#C4956A] shadow-[0_0_16px_rgba(196,149,106,0.4)] scale-105 z-10'
                                                    : 'border-[var(--color-border)] hover:border-white/30'
                                            }`}
                                        >
                                            <img
                                                src={url}
                                                alt={`${group.name} ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-[#C4956A]/10 flex items-center justify-center">
                                                    <div className="bg-[#C4956A] rounded-full p-1 shadow-lg">
                                                        <CheckCircle2 size={18} className="text-black" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-3 border-b border-[var(--color-border)]" />
                        </div>
                    ))}

                    {brandGroups.length === 0 && (
                        <div className="text-center py-16 text-[var(--color-text-muted)]">
                            <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
                            No hay marcas con imágenes cargadas.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
