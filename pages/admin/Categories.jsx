import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, GripVertical, X, Loader, Upload, Image as ImageIcon, Tags, Eye, EyeOff } from 'lucide-react'
import {
    getBrands, createBrand, updateBrand, deleteBrand,
    getCategories, createCategory, updateCategory, deleteCategory, uploadImage,
    saveBrandsOrder, saveCategoriesOrder
} from '../../lib/admin'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Categories.css'

function SortableItem({ id, children }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
        opacity: isDragging ? 0.6 : 1,
        touchAction: 'none',
    };

    // Pass listeners and attributes to children so they can decide where the handle is
    return (
        <div ref={setNodeRef} style={style}>
            {React.cloneElement(children, { attributes, listeners })}
        </div>
    );
}

export default function Categories() {
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('marcas')
    const [subTab, setSubTab] = useState('mujer') // 'mujer', 'hombre', 'otros'

    // Modals & Forms
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState('')
    const [editingItem, setEditingItem] = useState(null)
    const [formValue, setFormValue] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState('')
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const [brandsData, categoriesData] = await Promise.all([
                    getBrands(null, true),
                    getCategories(null, true)
                ])
                setBrands(brandsData)
                setCategories(categoriesData)
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [refreshTrigger])

    // Derived Lists
    const menParent = categories.find(c => c.name?.toUpperCase() === 'HOMBRE');
    const womenParent = categories.find(c => c.name?.toUpperCase() === 'MUJER');

    const menCats = categories.filter(c => c.parent_id === menParent?.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const womenCats = categories.filter(c => c.parent_id === womenParent?.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const otherCats = categories.filter(c =>
        c.id !== menParent?.id &&
        c.id !== womenParent?.id &&
        c.parent_id !== menParent?.id &&
        c.parent_id !== womenParent?.id
    ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const getCurrentList = () => {
        if (activeTab === 'marcas') return brands;
        if (subTab === 'mujer') return womenCats;
        if (subTab === 'hombre') return menCats;
        return otherCats;
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        if (activeTab === 'marcas') {
            const oldIndex = brands.findIndex((b) => b.id === active.id);
            const newIndex = brands.findIndex((b) => b.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const newOrder = arrayMove(brands, oldIndex, newIndex);
            setBrands(newOrder);
            try {
                await saveBrandsOrder(newOrder);
            } catch (err) {
                console.error("Error saving brands:", err);
                alert("Error al guardar el nuevo orden de marcas: " + (err.message || "Error desconocido"));
                setRefreshTrigger(prev => prev + 1); // Revertir cambios
            }
        } else {
            const list = getCurrentList();
            const oldIndex = list.findIndex((c) => c.id === active.id);
            const newIndex = list.findIndex((c) => c.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            // Offset based on group
            let offset = 0;
            if (subTab === 'mujer') offset = 1000;
            else if (subTab === 'hombre') offset = 0;
            else offset = 2000;

            const newList = arrayMove(list, oldIndex, newIndex);

            // Optimistic Update
            const updatedSubList = newList.map((item, i) => ({ ...item, sort_order: offset + i }));
            const otherGlobalCats = categories.filter(c => !list.some(l => l.id === c.id));
            setCategories([...otherGlobalCats, ...updatedSubList]);

            // Save to DB
            try {
                await Promise.all(updatedSubList.map((cat) =>
                    updateCategory(cat.id, { sort_order: cat.sort_order })
                ));
            } catch (err) {
                console.error("Error saving category order:", err);
                alert("Error al guardar orden");
                setRefreshTrigger(prev => prev + 1); // Revert on failure
            }
        }
    };

    const openModal = (type, item = null) => {
        setModalType(type)
        setEditingItem(item)
        setFormValue(item?.name || '')
        setPreviewUrl(item?.logo_url || '')
        setSelectedFile(null)
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            let logoUrl = editingItem?.logo_url
            if (!previewUrl) logoUrl = null
            if (selectedFile) logoUrl = await uploadImage(selectedFile, 'products')

            if (modalType === 'marca') {
                if (editingItem) await updateBrand(editingItem.id, { name: formValue, logo_url: logoUrl })
                else await createBrand({ name: formValue, logoUrl })
            } else if (modalType === 'categoria') {
                let payload = { name: formValue }
                if (!editingItem) {
                    if (subTab === 'mujer' && womenParent) payload.parentId = womenParent.id;
                    if (subTab === 'hombre' && menParent) payload.parentId = menParent.id;
                }
                if (editingItem) await updateCategory(editingItem.id, payload)
                else await createCategory(payload)
            }
            setRefreshTrigger(prev => prev + 1)
            setShowModal(false)
        } catch (error) {
            alert('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async (type, item) => {
        const newState = !item.is_active;
        try {
            if (type === 'marca') {
                await updateBrand(item.id, { is_active: newState });
                setBrands(prev => prev.map(b => b.id === item.id ? { ...b, is_active: newState } : b));
            } else {
                await updateCategory(item.id, { is_active: newState });
                setCategories(prev => prev.map(c => c.id === item.id ? { ...c, is_active: newState } : c));
            }
        } catch (error) {
            alert('Error updating visibility: ' + error.message);
        }
    };

    const deleteItem = async (type, id) => {
        if (!confirm('¿Eliminar?')) return
        try {
            if (type === 'marca') await deleteBrand(id)
            else await deleteCategory(id)
            setRefreshTrigger(prev => prev + 1)
        } catch (error) {
            alert(error.message)
        }
    }

    const currentList = getCurrentList();

    const renderCategoryGroup = (title, list, groupSubTab) => (
        <div className="categories-admin__group" style={{ marginBottom: '3rem' }}>
            <div className="categories-admin__section-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#DCDCDC' }}>{title} ({list.length})</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setSubTab(groupSubTab);
                        openModal('categoria');
                    }}
                >
                    <Plus size={16} /> Nueva
                </button>
            </div>
            <div className="categories-admin__vertical-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => {
                        setSubTab(groupSubTab);
                        handleDragEnd(e);
                    }}
                >
                    <SortableContext
                        items={list.map(item => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {list.map((item) => (
                            <SortableItem key={item.id} id={item.id}>
                                <CategoryItem
                                    category={item}
                                    onEdit={() => openModal('categoria', item)}
                                    onToggle={() => handleToggleActive('categoria', item)}
                                    onDelete={() => deleteItem('categoria', item.id)}
                                />
                            </SortableItem>
                        ))}
                    </SortableContext>
                </DndContext>
                {list.length === 0 && <p className="text-[var(--color-text-muted)] text-sm py-4 italic">No hay categorías en este grupo.</p>}
            </div>
        </div>
    );

    return (
        <div className="categories-admin" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="categories-admin__header">
                <h1>Gestión de Inventario</h1>
                <p>Configurá el orden de tus categorías arrastrando cada una hacia arriba o abajo</p>
            </div>

            <div className="categories-admin__tabs">
                <button
                    className={`categories-admin__tab ${activeTab === 'categorias' ? 'categories-admin__tab--active' : ''}`}
                    onClick={() => setActiveTab('categorias')}
                >
                    Categorías (Por Género)
                </button>
                <button
                    className={`categories-admin__tab ${activeTab === 'marcas' ? 'categories-admin__tab--active' : ''}`}
                    onClick={() => setActiveTab('marcas')}
                >
                    Marcas
                </button>
            </div>

            <div className="categories-admin__content">
                {activeTab === 'marcas' ? (
                    <div className="categories-admin__section">
                        <div className="categories-admin__section-header">
                            <h2>Marcas ({brands.length})</h2>
                            <button className="btn btn-primary" onClick={() => openModal('marca')}>
                                <Plus size={16} /> Nueva Marca
                            </button>
                        </div>
                        <div className="categories-admin__list">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={brands.map(b => b.id)} strategy={rectSortingStrategy}>
                                    {brands.map((brand) => (
                                        <SortableItem key={brand.id} id={brand.id}>
                                            <BrandItem 
                                                brand={brand} 
                                                onEdit={() => openModal('marca', brand)} 
                                                onToggle={() => handleToggleActive('marca', brand)}
                                                onDelete={() => deleteItem('marca', brand.id)} 
                                            />
                                        </SortableItem>
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                ) : (
                    <div className="categories-admin__groups-container animate-in fade-in duration-500">
                        {renderCategoryGroup('Categorías Mujer', womenCats, 'mujer')}
                        {renderCategoryGroup('Categorías Hombre', menCats, 'hombre')}
                        {renderCategoryGroup('Otras Categorías', otherCats, 'otros')}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal modal--small">
                        <div className="modal__header">
                            <h2>{modalType === 'marca' ? 'Marca' : 'Categoría'}</h2>
                            <button className="modal__close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form className="modal__form" onSubmit={handleSubmit}>
                            <div className="modal__field">
                                <label>Nombre</label>
                                <input type="text" value={formValue} onChange={(e) => setFormValue(e.target.value)} required autoFocus />
                            </div>
                            {modalType === 'marca' && (
                                <div className="modal__field">
                                    <label>Logo (Opcional)</label>
                                    <input type="file" onChange={(e) => { const f = e.target.files[0]; if (f) { setSelectedFile(f); setPreviewUrl(URL.createObjectURL(f)); } }} />
                                    {previewUrl && <img src={previewUrl} className="h-10 object-contain mt-2" />}
                                </div>
                            )}
                            <div className="modal__actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function BrandItem({ brand, onEdit, onToggle, onDelete, attributes, listeners }) {
    return (
        <div className={`category-item ${brand.is_active === false ? 'category-item--inactive' : ''}`}>
            <div className="category-item__drag" {...attributes} {...listeners}>
                <GripVertical size={20} />
            </div>
            <div className="category-item__info">
                <span className="category-item__name">{brand.name}</span>
            </div>
            <div className="category-item__actions">
                <button 
                    onClick={onToggle} 
                    className={brand.is_active === false ? 'text-zinc-500' : 'text-green-500'}
                    title={brand.is_active === false ? "Mostrar en tienda" : "Ocultar de tienda"}
                >
                    {brand.is_active === false ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={onEdit}><Edit size={14} /></button>
                <button onClick={onDelete} className="text-red-500"><Trash2 size={14} /></button>
            </div>
        </div>
    );
}

function CategoryItem({ category, onEdit, onToggle, onDelete, attributes, listeners }) {
    return (
        <div className={`category-item ${category.is_active === false ? 'category-item--inactive' : ''}`}>
            <div className="category-item__drag bg-white border border-[var(--color-border)]" {...attributes} {...listeners}>
                <GripVertical size={20} />
            </div>
            <div className="category-item__info">
                <span className="category-item__name">{category.name}</span>
            </div>
            <div className="category-item__actions">
                <button 
                    onClick={onToggle} 
                    className={category.is_active === false ? 'text-zinc-500' : 'text-green-500'}
                    title={category.is_active === false ? "Mostrar en tienda" : "Ocultar de tienda"}
                >
                    {category.is_active === false ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={onEdit}><Edit size={14} /></button>
                <button onClick={onDelete} className="text-red-500"><Trash2 size={14} /></button>
            </div>
        </div>
    );
}

