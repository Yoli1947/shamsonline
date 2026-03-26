import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Loader, Save, Trash2, Plus, Search, X, Upload,
    Image as ImageIcon, GripVertical, Eye, EyeOff
} from 'lucide-react';
import { uploadImage, saveBrandsOrder } from '../../lib/admin';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableRow = ({ brand, index, onEdit, onDelete, onToggleActive, isSearchActive }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: brand.id, disabled: isSearchActive });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`hover:bg-white transition-colors group ${isDragging ? 'bg-[var(--color-background-alt)]' : ''}`}
        >
            <td className="p-4 text-center">
                {!isSearchActive ? (
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-2 text-[var(--color-text-muted)] hover:text-[#C4956A] transition-colors"
                    >
                        <GripVertical size={20} />
                    </div>
                ) : (
                    <span className="text-zinc-600 text-xs">--</span>
                )}
            </td>
            <td className="p-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-[var(--color-border)]">
                    {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                    ) : (
                        <ImageIcon className="text-[var(--color-text-muted)]" size={20} />
                    )}
                </div>
            </td>
            <td className="p-4">
                <div className="w-24 h-12 bg-[var(--color-background-alt)] rounded-lg flex items-center justify-center overflow-hidden border border-[var(--color-border)]">
                    {brand.card_image_url ? (
                        <img src={brand.card_image_url} alt={brand.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Sin Foto</span>
                    )}
                </div>
            </td>
            <td className="p-4">
                <span
                    className="font-bold text-lg cursor-pointer hover:text-[#C4956A] transition-colors"
                    onClick={() => onEdit(brand)}
                >
                    {brand.name}
                </span>
            </td>
            <td className="p-4 text-[var(--color-text-muted)] text-sm font-mono">
                {brand.slug}
            </td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onToggleActive(brand)}
                        className={`p-2 rounded-lg transition-all ${brand.is_active
                            ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                            : 'text-zinc-600 hover:text-[var(--color-text-muted)] hover:bg-zinc-500/10'
                            }`}
                        title={brand.is_active ? 'Ocultar de la tienda' : 'Mostrar en la tienda'}
                    >
                        {brand.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                        onClick={() => onEdit(brand)}
                        className="p-2 text-[var(--color-text-muted)] hover:text-[#C4956A] hover:bg-[#C4956A]/10 rounded-lg transition-all"
                        title="Editar"
                    >
                        <Save size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(brand.id)}
                        className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Eliminar"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const Brands = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formName, setFormName] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [cardPreviewUrl, setCardPreviewUrl] = useState('');
    const [selectedCardFile, setSelectedCardFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error', null
    const [message, setMessage] = useState('');

    const fileInputRef = useRef(null);
    const cardInputRef = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Cargar marcas ordenadas por sort_order
    const fetchBrands = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true }); // Secondary sort

        if (error) console.error(error);
        else setBrands(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleOpenModal = (brand = null) => {
        setStatus(null);
        setMessage('');
        if (brand) {
            setEditingBrand(brand);
            setFormName(brand.name);
            setPreviewUrl(brand.logo_url || '');
            setCardPreviewUrl(brand.card_image_url || '');
        } else {
            setEditingBrand(null);
            setFormName('');
            setPreviewUrl('');
            setCardPreviewUrl('');
        }
        setSelectedFile(null);
        setSelectedCardFile(null);
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCardFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedCardFile(file);
            setCardPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formName.trim()) return;

        setSaving(true);
        setStatus(null);
        try {
            let logoUrl = previewUrl;
            let cardImageUrl = cardPreviewUrl;

            // Upload new images if selected
            if (selectedFile) {
                logoUrl = await uploadImage(selectedFile, 'products');
            }
            if (selectedCardFile) {
                cardImageUrl = await uploadImage(selectedCardFile, 'products');
            }

            const slug = formName.toLowerCase()
                .replace(/[áàâä]/g, 'a').replace(/[éèêë]/g, 'e')
                .replace(/[íìîï]/g, 'i').replace(/[óòôö]/g, 'o')
                .replace(/[úùûü]/g, 'u').replace(/ñ/g, 'n')
                .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

            if (editingBrand) {
                // Al editar: solo actualizamos name e imágenes, NO el slug (para evitar conflictos)
                const updatePayload = {
                    name: formName,
                    logo_url: logoUrl,
                    card_image_url: cardImageUrl,
                    is_active: true
                };
                // Solo actualizar slug si el nombre realmente cambió
                if (formName !== editingBrand.name) {
                    updatePayload.slug = slug;
                }
                const { error } = await supabase
                    .from('brands')
                    .update(updatePayload)
                    .eq('id', editingBrand.id);
                if (error) throw error;
            } else {
                // Al crear: usar slug único con timestamp si hay conflicto
                const maxOrder = brands.length > 0 ? Math.max(...brands.map(b => b.sort_order || 0)) : 0;
                const { error } = await supabase
                    .from('brands')
                    .insert({
                        name: formName,
                        logo_url: logoUrl,
                        card_image_url: cardImageUrl,
                        slug: slug,
                        is_active: true,
                        sort_order: maxOrder + 10
                    });
                if (error) {
                    if (error.code === '23505') {
                        // Slug duplicado: agregar timestamp para hacerlo único
                        const uniqueSlug = `${slug}-${Date.now()}`;
                        const { error: error2 } = await supabase
                            .from('brands')
                            .insert({
                                name: formName,
                                logo_url: logoUrl,
                                card_image_url: cardImageUrl,
                                slug: uniqueSlug,
                                is_active: true,
                                sort_order: maxOrder + 10
                            });
                        if (error2) throw error2;
                    } else {
                        throw error;
                    }
                }
            }

            setStatus('success');
            setMessage('Marca guardada correctamente');
            fetchBrands();
            // We don't close immediately so the user sees the success state as requested
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage(error.message.includes('card_image_url')
                ? 'Falta configurar la base de datos. Por favor contacta al soporte o ejecuta el script SQL.'
                : 'Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = brands.findIndex((brand) => brand.id === active.id);
        const newIndex = brands.findIndex((brand) => brand.id === over.id);

        const newBrands = arrayMove(brands, oldIndex, newIndex);
        setBrands(newBrands);

        try {
            await saveBrandsOrder(newBrands);
        } catch (e) {
            console.error("Error al guardar orden:", e);
            alert("Error al guardar el nuevo orden: " + (e.message || "Error desconocido"));
            fetchBrands(); // Revertir en caso de error
        }
    };

    const deleteBrand = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar esta marca?')) return;
        const { error } = await supabase.from('brands').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        else fetchBrands();
    };

    const handleToggleActive = async (brand) => {
        const newState = !brand.is_active;
        const { error } = await supabase
            .from('brands')
            .update({ is_active: newState })
            .eq('id', brand.id);
        if (error) {
            alert('Error: ' + error.message);
        } else {
            // Update locally without refetch for instant feedback
            setBrands(prev => prev.map(b =>
                b.id === brand.id ? { ...b, is_active: newState } : b
            ));
        }
    };

    const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-6 bg-[var(--color-background)] min-h-screen text-[var(--color-text)]">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Administrar Marcas</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#C4956A] text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#8B6F5E] transition-all transform hover:scale-105"
                >
                    <Plus size={20} /> Nueva Marca
                </button>
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-3 text-[var(--color-text-muted)]" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar marca..."
                        className="w-full pl-10 p-2 border rounded-lg bg-white border-[var(--color-border)] text-[var(--color-text)] focus:border-[#C4956A] outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {search && (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)] italic">* El reordenamiento está desactivado mientras buscas.</p>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader className="animate-spin text-[#C4956A]" size={48} /></div>
            ) : (
                <div className="bg-white rounded-xl overflow-hidden border border-[var(--color-border)] shadow-xl">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <table className="w-full text-left">
                            <thead className="bg-[var(--color-background)]/50 text-[var(--color-text-muted)] uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4 w-24 text-center">Mover</th>
                                    <th className="p-4 w-24">Logo</th>
                                    <th className="p-4 w-32">Carta</th>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Slug</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                <SortableContext
                                    items={filteredBrands.map(b => b.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {filteredBrands.map((brand, index) => (
                                        <SortableRow
                                            key={brand.id}
                                            brand={brand}
                                            index={index}
                                            onEdit={handleOpenModal}
                                            onDelete={deleteBrand}
                                            onToggleActive={handleToggleActive}
                                            isSearchActive={!!search}
                                        />
                                    ))}
                                </SortableContext>
                            </tbody>
                        </table>
                    </DndContext>
                </div>
            )}

            {/* Modal de Marca */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal modal--small">
                        <div className="modal__header">
                            <h2 className="text-black font-black uppercase tracking-tighter">
                                {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="modal__close">
                                <X size={24} />
                            </button>
                        </div>

                        {status === 'success' ? (
                            <div className="p-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <Save size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-black uppercase">¡LISTO!</h3>
                                    <p className="text-zinc-600 font-medium mt-2">{message}</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full bg-[var(--color-background)] text-[var(--color-text)] py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[var(--color-background-alt)] transition-all shadow-xl transform hover:scale-105 active:scale-95"
                                >
                                    TERMINAR Y CERRAR
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="modal__form space-y-6">
                                {status === 'error' && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded animate-in fade-in slide-in-from-top-2">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <X className="h-5 w-5 text-red-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-red-700 font-bold">
                                                    {message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="modal__field">
                                    <label className="text-[var(--color-text-muted)] font-bold uppercase text-[10px] tracking-widest mb-2 block">Logo (Icono Blanco)</label>
                                    <div
                                        className="relative group cursor-pointer aspect-video bg-zinc-100 rounded-xl border-2 border-dashed border-zinc-300 overflow-hidden flex flex-col items-center justify-center hover:border-[#C4956A]/50 transition-all"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                                        ) : (
                                            <>
                                                <Upload className="text-[var(--color-text-muted)] mb-2 group-hover:text-[#C4956A] transition-colors" size={32} />
                                                <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest">Click para subir logo</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        {previewUrl && (
                                            <div className="absolute inset-0 bg-[var(--color-background)]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        fileInputRef.current?.click();
                                                    }}
                                                    className="bg-white/20 hover:bg-white/40 p-2 rounded-lg text-[var(--color-text)] transition-all"
                                                >
                                                    <Upload size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewUrl('');
                                                        setSelectedFile(null);
                                                    }}
                                                    className="bg-red-500/50 hover:bg-red-500/80 p-2 rounded-lg text-[var(--color-text)] transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic">* Se muestra en filtros y listas pequeñas.</p>
                                </div>

                                <div className="modal__field">
                                    <label className="text-[var(--color-text-muted)] font-bold uppercase text-[10px] tracking-widest mb-2 block">Foto de Portada (Carta)</label>
                                    <div
                                        className="relative group cursor-pointer aspect-video bg-zinc-100 rounded-xl border-2 border-dashed border-zinc-300 overflow-hidden flex flex-col items-center justify-center hover:border-[#C4956A]/50 transition-all"
                                        onClick={() => cardInputRef.current?.click()}
                                    >
                                        {cardPreviewUrl ? (
                                            <img src={cardPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Upload className="text-[var(--color-text-muted)] mb-2 group-hover:text-[#C4956A] transition-colors" size={32} />
                                                <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest text-center">Click para subir foto de fondo</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={cardInputRef}
                                            onChange={handleCardFileChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        {cardPreviewUrl && (
                                            <div className="absolute inset-0 bg-[var(--color-background)]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        cardInputRef.current?.click();
                                                    }}
                                                    className="bg-white/20 hover:bg-white/40 p-2 rounded-lg text-[var(--color-text)] transition-all"
                                                >
                                                    <Upload size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCardPreviewUrl('');
                                                        setSelectedCardFile(null);
                                                    }}
                                                    className="bg-red-500/50 hover:bg-red-500/80 p-2 rounded-lg text-[var(--color-text)] transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic">* Se usa como fondo de la carta en la sección de marcas.</p>
                                </div>

                                <div className="modal__field">
                                    <label className="text-[var(--color-text-muted)] font-bold uppercase text-[10px] tracking-widest mb-2 block">Nombre de la Marca</label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full border border-zinc-200 rounded-xl p-3 text-black focus:border-[#C4956A] outline-none font-bold bg-white"
                                        placeholder="Ej: PERRAMUS"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="flex flex-col gap-3 pt-6 border-t border-zinc-100">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full bg-[#C4956A] text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#8B6F5E] disabled:opacity-50 transition-all transform active:scale-95 shadow-[0_10px_20px_rgba(196,149,106,0.2)]"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader className="animate-spin" size={20} />
                                                <span>GUARDANDO...</span>
                                            </>
                                        ) : (
                                            <>
                                                {editingBrand ? <Save size={20} /> : <Plus size={20} />}
                                                <span>{editingBrand ? 'ACTUALIZAR DATOS' : 'CREAR MARCA'}</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="w-full bg-zinc-100 text-[var(--color-text-muted)] py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all text-xs"
                                    >
                                        CANCELAR Y VOLVER
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Brands;
