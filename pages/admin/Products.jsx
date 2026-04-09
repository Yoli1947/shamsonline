
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Image, X, Check, Loader, RefreshCw, UploadCloud, Maximize2, Minimize2, Star } from 'lucide-react'
import { getAllProducts, deleteProduct, updateProduct, saveProductVariants, uploadImage, getSeasons } from '../../lib/admin'
import { supabase } from '../../lib/supabase'
import { getBrands, getCategories } from '../../lib/api'
import { SIZE_ORDER } from '../../lib/constants'
import ProductForm from './ProductForm'
import './Products.css'

export default function Products() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [selectedBrandId, setSelectedBrandId] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState('')
    const [selectedSeasons, setSelectedSeasons] = useState([])
    const [filterPhoto, setFilterPhoto] = useState('all') // 'all', 'with', 'without'
    const [filterVisibility, setFilterVisibility] = useState('all') // 'all', 'visible', 'hidden'
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])
    const [seasons, setSeasons] = useState([])
    const [searchParams, setSearchParams] = useSearchParams()

    const [selectedIds, setSelectedIds] = useState(new Set())
    const [bulkDiscountValue, setBulkDiscountValue] = useState('')
    const [isSavingAll, setIsSavingAll] = useState(false)

    useEffect(() => {
        loadProducts()
        loadDependencies()

        // Si viene ?new=true por URL, abrir modal de creación
        if (searchParams.get('new') === 'true') {
            openNewProduct()
        }
    }, [refreshTrigger, searchParams])

    async function loadDependencies() {
        try {
            const [b, cRaw, s] = await Promise.all([getBrands(), getCategories(), getSeasons()])
            setBrands(b)
            setSeasons(s)

            const hierarchical = (cRaw || [])
                .filter(cat => cat.parent_id === '00000000-0000-0000-0000-000000000003')
                .map(cat => ({ ...cat, displayName: cat.name, parentName: 'GENERAL' }))
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

            setCategories(hierarchical)
        } catch (error) {
            console.error('Error loading deps:', error)
        }
    }

    async function loadProducts() {
        try {
            setLoading(true)
            const { products: data } = await getAllProducts(1, 5000)
            setProducts(data)
        } catch (error) {
            console.error('Error loading products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSuccess = () => {
        setShowModal(false)
        setSearchParams({}) // Limpiar el parámetro ?new=true si existe
        setRefreshTrigger(prev => prev + 1)
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return

        try {
            await deleteProduct(id)
            setRefreshTrigger(prev => prev + 1)
        } catch (error) {
            alert('Error al eliminar producto')
        }
    }

    const openNewProduct = () => {
        setEditingProduct(null)
        setShowModal(true)
    }

    const openEditProduct = (product) => {
        setEditingProduct(product)
        setShowModal(true)
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(price || 0)
    }

    const toggleFeatured = async (product) => {
        const newVal = !product.is_featured
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: newVal } : p))
        try {
            await updateProduct(product.id, { isFeatured: newVal })
        } catch (e) {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: !newVal } : p))
            alert('Error al actualizar: ' + e.message)
        }
    }

    const handleInlineChange = (productId, field, value, variantIndex = null) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;

            if (variantIndex !== null && p.variants) {
                const newVariants = [...p.variants];
                newVariants[variantIndex] = { ...newVariants[variantIndex], [field]: value };
                return { ...p, variants: newVariants, hasChanges: true };
            }

            if (field === 'primary_image') {
                const newImages = [...(p.images || [])];
                if (newImages[0]) {
                    newImages[0] = { ...newImages[0], url: value };
                } else {
                    newImages.push({ url: value, is_primary: true });
                }
                return { ...p, images: newImages, hasChanges: true };
            }

            if (field === 'category_id') {
                const selectedCat = categories.find(c => c.id === value);
                let features = p.features || [];
                let gender = p.gender;
                if (selectedCat) {
                    if (selectedCat.parentName === 'MUJER') {
                        features = ['Mujer'];
                        gender = 'Mujer';
                    } else if (selectedCat.parentName === 'HOMBRE') {
                        features = ['Hombre'];
                        gender = 'Hombre';
                    }
                }
                return { ...p, [field]: value, features: features, gender: gender, hasChanges: true };
            }

            if (field === 'name') {
                const nameLower = value.toLowerCase();
                let updates = {};

                // 1. Auto-Category
                if (nameLower.includes('campera') && !p.category_id) {
                    const camperaCat = categories.find(c =>
                        c.name.toLowerCase() === 'camperas' ||
                        c.name.toLowerCase() === 'campera'
                    );
                    if (camperaCat) {
                        updates.category_id = camperaCat.id;
                        updates.category = { id: camperaCat.id, name: camperaCat.name };
                    }
                }

                // 2. Auto-Gender & Features
                let existingGender = p.gender || (p.features && p.features[0]);
                if (!existingGender) {
                    if (nameLower.includes('mujer')) {
                        updates.gender = 'Mujer';
                        updates.features = ['Mujer'];
                    } else if (nameLower.includes('hombre')) {
                        updates.gender = 'Hombre';
                        updates.features = ['Hombre'];
                    }
                }

                return { ...p, [field]: value, ...updates, hasChanges: true };
            }

            // Campo: precio de lista / actual
            if (field === 'price') {
                return { ...p, price: parseFloat(value) || 0, hasChanges: true };
            }

            // Campo virtual: porcentaje de descuento — calcula sale_price desde price
            if (field === 'discount_pct') {
                const pct = parseFloat(value) || 0;
                const basePrice = parseFloat(p.price) || 0;
                if (pct > 0 && pct < 100 && basePrice > 0) {
                    const newSalePrice = Math.round(basePrice * (1 - pct / 100));
                    return { ...p, sale_price: newSalePrice, hasChanges: true };
                } else {
                    return { ...p, sale_price: null, hasChanges: true };
                }
            }

            if (field === 'gender') {
                return { 
                    ...p, 
                    gender: value, 
                    features: value ? [value] : [], 
                    hasChanges: true 
                };
            }

            if (field === 'features') {
                const head = Array.isArray(value) ? value[0] : value;
                return { 
                    ...p, 
                    features: Array.isArray(value) ? value : (value ? [value] : []), 
                    gender: head || null,
                    hasChanges: true 
                };
            }

            return { ...p, [field]: value, hasChanges: true };
        }))
    }

    const handleImageUpload = async (file, productId) => {
        if (!file) return;

        try {
            // Show some loading indication?
            const url = await uploadImage(file, 'products');
            handleInlineChange(productId, 'primary_image', url);
        } catch (error) {
            alert('Error al subir imagen: ' + error.message);
        }
    }

    const saveInlineRow = async (product) => {
        if (product.saving) return

        setProducts(prev => prev.map(p =>
            p.id === product.id ? { ...p, saving: true } : p
        ))

        try {
            // 1. Update basic product data
            await updateProduct(product.id, {
                name: product.name,
                brandId: product.brand_id || product.brand?.id,
                categoryId: product.category_id || product.category?.id,
                features: product.features || [],
                gender: product.gender || null,
                price: parseFloat(product.price),
                salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
                sortOrder: product.sort_order ? parseInt(product.sort_order) : null
            })

            // 2. Update variants if they exist
            if (product.variants && product.variants.length > 0) {
                await saveProductVariants(product.id, product.variants)
            }

            // 3. Update primary image if changed
            if (product.images?.[0]) {
                const img = product.images[0];
                if (img.id) {
                    await supabase.from('product_images')
                        .update({ url: img.url, alt_text: img.alt_text })
                        .eq('id', img.id);
                } else {
                    // New image
                    await supabase.from('product_images')
                        .insert({
                            product_id: product.id,
                            url: img.url || '',
                            is_primary: true
                        });
                }
            }

            setProducts(prev => prev.map(p =>
                p.id === product.id ? { ...p, hasChanges: false, saving: false } : p
            ))

            setRefreshTrigger(prev => prev + 1)
        } catch (error) {
            console.error(error)
            alert('Error al guardar cambios: ' + error.message)
            setProducts(prev => prev.map(p =>
                p.id === product.id ? { ...p, saving: false } : p
            ))
        }
    }


    const calculateDiscount = (price, salePrice) => {
        const p = parseFloat(price)
        const s = parseFloat(salePrice)
        if (!p || !s || s >= p) return 0
        return Math.round(((p - s) / p) * 100)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const toggleSelectProduct = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const applyBulkDiscount = () => {
        if (selectedIds.size === 0) return;
        const pct = parseFloat(bulkDiscountValue);
        if (isNaN(pct) || pct < 0 || pct > 100) {
            alert('Por favor ingresa un porcentaje válido (0-100)');
            return;
        }

        setProducts(prev => prev.map(p => {
            if (!selectedIds.has(p.id)) return p;
            const price = parseFloat(p.price) || 0;
            const newSalePrice = pct === 0 ? null : Math.round(price * (1 - pct / 100));
            return {
                ...p,
                sale_price: newSalePrice,
                hasChanges: true
            };
        }));

        setBulkDiscountValue('');
        setSelectedIds(new Set());
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`⚠️ ¿ESTÁS SEGURO DE ELIMINAR ${selectedIds.size} PRODUCTOS?\n\nEsta acción no se puede deshacer.`)) return;

        try {
            setLoading(true);
            const idsToDelete = Array.from(selectedIds);

            // Delete sequentially or in parallel? Parallel is faster but might hit limits.
            // Let's do parallel in chunks of 5
            const chunkSize = 5;
            for (let i = 0; i < idsToDelete.length; i += chunkSize) {
                const chunk = idsToDelete.slice(i, i + chunkSize);
                await Promise.all(chunk.map(id => deleteProduct(id)));
            }

            alert(`¡${selectedIds.size} productos eliminados correctamente!`);
            setSelectedIds(new Set());
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error(error);
            alert('Error al eliminar productos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        const changedProducts = products.filter(p => p.hasChanges);
        if (changedProducts.length === 0) return;

        if (!confirm(`¿Estás seguro de guardar los cambios en ${changedProducts.length} productos?`)) return;

        setIsSavingAll(true);
        try {
            for (const product of changedProducts) {
                await updateProduct(product.id, {
                    name: product.name,
                    brandId: product.brand_id || product.brand?.id,
                    categoryId: product.category_id || product.category?.id,
                    features: product.features || [],
                    gender: product.gender || null,
                    price: parseFloat(product.price),
                    salePrice: product.sale_price ? parseFloat(product.sale_price) : null
                });
            }
            alert('¡Cambios guardados con éxito!');
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert('Error al guardar cambios masivos: ' + error.message);
        } finally {
            setIsSavingAll(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const searchLower = searchTerm.toLowerCase();

        // Filter by Search Term
        const nameMatch = (p.name || '').toLowerCase().includes(searchLower);
        const brandMatch = (p.brand?.name || '').toLowerCase().includes(searchLower);
        const skuMatch = (p.sku || '').toLowerCase().includes(searchLower);
        const providerSkuMatch = (p.provider_sku || '').toLowerCase().includes(searchLower);
        const variantSkuMatch = p.variants?.some(v => (v.sku || '').toLowerCase().includes(searchLower));
        const matchesSearch = nameMatch || brandMatch || skuMatch || providerSkuMatch || variantSkuMatch;

        // Filter by Brand ID
        const currentBrandId = p.brand_id || p.brand?.id;
        const matchesBrand = !selectedBrandId || String(currentBrandId) === String(selectedBrandId);

        // Filter by Photo
        const hasPhoto = (p.images && p.images.length > 0) || p.image_url || p.image_url_2 || p.image_url_3 || p.image_url_4;
        const matchesPhoto = filterPhoto === 'all' ||
            (filterPhoto === 'with' && hasPhoto) ||
            (filterPhoto === 'without' && !hasPhoto);

        // Filter by Category ID
        const currentCategoryId = p.category_id || p.category?.id;
        const matchesCategory = !selectedCategoryId || String(currentCategoryId) === String(selectedCategoryId);

        // Filter by Season
        const matchesSeason = !selectedSeasons.length || selectedSeasons.includes(p.season);

        // Filter by Visibility
        const matchesVisibility = filterVisibility === 'all' ||
            (filterVisibility === 'visible' && p.is_published !== false) ||
            (filterVisibility === 'hidden' && p.is_published === false);

        return matchesSearch && matchesBrand && matchesPhoto && matchesCategory && matchesSeason && matchesVisibility;
    })

    const { stats, filteredStats } = useMemo(() => {
        const calculateStats = (list) => {
            const hasPhoto = (p) => (p.images && p.images.length > 0) || p.image_url || p.image_url_2 || p.image_url_3 || p.image_url_4;
            const withPhoto = list.filter(hasPhoto).length;
            return {
                total: list.length,
                withPhoto,
                withoutPhoto: list.length - withPhoto
            };
        };
        return {
            stats: calculateStats(products),
            filteredStats: calculateStats(filteredProducts)
        };
    }, [products, filteredProducts]);

    // Calculate total stock from variants
    const getStock = (product) => {
        return product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0
    }

    if (loading && products.length === 0) {
        return <div className="admin-loading">Cargando productos...</div>
    }

    return (
        <div className={`products-admin ${isFullscreen ? 'products-admin--fullscreen' : ''}`} style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div>
                        <h1 className="admin-title" style={{ margin: 0 }}>Productos</h1>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <p style={{ color: '#666', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                TOTAL: <span style={{ color: '#000' }}>{stats.total}</span>
                            </p>
                            <p style={{ color: '#666', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                CON FOTO: <span style={{ color: '#10b981' }}>{stats.withPhoto}</span>
                            </p>
                            <p style={{ color: '#666', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                SIN FOTO: <span style={{ color: '#ef4444' }}>{stats.withoutPhoto}</span>
                            </p>
                            {searchTerm || selectedBrandId || selectedCategoryId || selectedSeasons.length > 0 ? (
                                <p style={{ color: '#c4956a', fontSize: '0.75rem', fontWeight: 'bold', borderLeft: '1px solid #ddd', paddingLeft: '1rem' }}>
                                    FILTRADOS: {filteredStats.total} ({filteredStats.withPhoto} c/foto | {filteredStats.withoutPhoto} s/foto)
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="admin-btn admin-btn-secondary"
                        style={{
                            height: '40px',
                            padding: '0 15px',
                            fontSize: '11px',
                            background: isFullscreen ? '#DCDCDC' : 'rgba(255,255,255,0.05)',
                            color: 'var(--color-text)',
                            border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            fontWeight: '800'
                        }}
                        title={isFullscreen ? 'Salir de Pantalla Completa' : 'Ver en Pantalla Completa'}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        {isFullscreen ? 'SALIR' : 'PANTALLA COMPLETA'}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {products.some(p => p.hasChanges) && (
                        <button
                            className="admin-btn"
                            onClick={handleSaveAll}
                            disabled={isSavingAll}
                            style={{ background: '#10b981', color: 'var(--color-text)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isSavingAll ? <Loader size={18} className="spin" /> : <Check size={18} />}
                            GUARDAR TODO ({products.filter(p => p.hasChanges).length})
                        </button>
                    )}
                    <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        Actualizar
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={openNewProduct}>
                        <Plus size={18} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="admin-card" style={{
                    padding: '1rem 1.5rem',
                    marginBottom: '1rem',
                    background: '#DCDCDC10',
                    border: '1px solid #DCDCDC30',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#DCDCDC' }}>
                            {selectedIds.size} SELECCIONADOS
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#666' }}>% DESCUENTO:</span>
                            <input
                                type="number"
                                className="admin-input"
                                value={bulkDiscountValue}
                                onChange={(e) => setBulkDiscountValue(e.target.value)}
                                placeholder="Ej: 20"
                                style={{ width: '80px', height: '36px', textAlign: 'center' }}
                            />
                        </div>
                        <button
                            className="admin-btn"
                            onClick={applyBulkDiscount}
                            style={{ background: '#DCDCDC', color: '#000', height: '36px' }}
                        >
                            APLICAR A TODOS
                        </button>
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 1rem' }}></div>
                        <button
                            className="admin-btn"
                            onClick={handleBulkDelete}
                            style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.3)', height: '36px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Trash2 size={16} />
                            ELIMINAR ({selectedIds.size})
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            style={{ background: 'transparent', color: '#666', border: 'none', fontSize: '10px', fontWeight: '800', cursor: 'pointer', marginLeft: '1rem' }}
                        >
                            CANCELAR
                        </button>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="admin-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
                    <Search size={20} color="#999" />
                    <input
                        className="admin-input"
                        type="text"
                        placeholder="Buscar por nombre, SKU o marca..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', padding: '0', boxShadow: 'none', background: 'transparent', fontSize: '1rem', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '800', whiteSpace: 'nowrap' }}>FOTOS:</span>
                    <select
                        className="admin-input"
                        value={filterPhoto}
                        onChange={(e) => setFilterPhoto(e.target.value)}
                        style={{
                            background: '#fff',
                            border: '2px solid #DCDCDC',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontSize: '0.875rem',
                            color: '#000',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Ver Todos</option>
                        <option value="with">Con Foto ✅</option>
                        <option value="without">Sin Foto ❌</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '800', whiteSpace: 'nowrap' }}>VISIBILIDAD:</span>
                    <select
                        className="admin-input"
                        value={filterVisibility}
                        onChange={(e) => setFilterVisibility(e.target.value)}
                        style={{
                            background: '#fff',
                            border: '2px solid #DCDCDC',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontSize: '0.875rem',
                            color: '#000',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Todos</option>
                        <option value="visible">Visibles 👁️</option>
                        <option value="hidden">Ocultos 🚫</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '800', whiteSpace: 'nowrap' }}>FILTRAR POR MARCA:</span>
                    <select
                        className="admin-input"
                        value={selectedBrandId}
                        onChange={(e) => setSelectedBrandId(e.target.value)}
                        style={{
                            background: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontSize: '0.875rem',
                            color: '#000',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">Todas las marcas</option>
                        {brands.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '800', whiteSpace: 'nowrap' }}>CATEGORÍA:</span>
                    <select
                        className="admin-input"
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        style={{
                            background: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontSize: '0.875rem',
                            color: '#000',
                            maxWidth: '180px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">Todas</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.displayName} {c.parentName ? `(${c.parentName})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

            </div>
            
            <div className="admin-card" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '800', whiteSpace: 'nowrap' }}>TEMPORADAS:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {seasons.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (selectedSeasons.includes(s)) {
                                        setSelectedSeasons(selectedSeasons.filter(item => item !== s))
                                    } else {
                                        setSelectedSeasons([...selectedSeasons, s])
                                    }
                                }}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    border: '1px solid',
                                    borderColor: selectedSeasons.includes(s) ? '#DCDCDC' : 'rgba(255,255,255,0.1)',
                                    background: selectedSeasons.includes(s) ? '#DCDCDC10' : 'transparent',
                                    color: selectedSeasons.includes(s) ? '#DCDCDC' : '#666',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {s}
                            </button>
                        ))}
                        {selectedSeasons.length > 0 && (
                            <button
                                onClick={() => setSelectedSeasons([])}
                                style={{
                                    marginLeft: '10px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    color: '#ff4444',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase'
                                }}
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size > 0 && selectedIds.size === filteredProducts.length}
                                    onChange={toggleSelectAll}
                                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                />
                            </th>
                            <th style={{ width: '80px' }}>Imagen</th>
                            <th style={{ width: '45px', textAlign: 'center' }}>Orden</th>
                            <th style={{ width: '320px' }}>Producto</th>
                            <th style={{ width: '130px' }}>Cód. Fábrica</th>
                            <th style={{ width: '150px' }}>Marca</th>
                            <th style={{ width: '150px' }}>Categoría</th>
                            <th style={{ width: '120px' }}>Género</th>
                            <th style={{ width: '120px', textAlign: 'center' }}>Precio Actual</th>
                            <th style={{ width: '75px', textAlign: 'center' }}>%</th>
                            <th style={{ width: '130px' }}>Precio de Descuento</th>
                            <th style={{ width: '150px' }}>Color (Principal)</th>
                            <th style={{ width: '180px' }}>Stock</th>
                            <th style={{ textAlign: 'right', width: '120px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className={product.hasChanges ? 'row-has-changes' : ''} style={{ background: selectedIds.has(product.id) ? 'rgba(196, 149, 106, 0.05)' : '' }}>
                                <td style={{ textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(product.id)}
                                        onChange={() => toggleSelectProduct(product.id)}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                        <div className="admin-table-img-container" style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden' }}>
                                            <label htmlFor={`upload-${product.id}`} style={{ cursor: 'pointer', display: 'block', width: '100%', height: '100%' }}>
                                                {product.images?.[0] || product.image_url ? (
                                                    <img
                                                        src={product.images?.[0]?.url || product.image_url}
                                                        alt={product.name}
                                                        className="admin-table-img"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            const parent = e.target.parentElement;
                                                            if (parent) {
                                                                parent.classList.add('broken-img');
                                                                const fallback = document.createElement('div');
                                                                fallback.style.cssText = 'width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#ff6b6b; background:rgba(255,107,107,0.1)';
                                                                fallback.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                                                parent.appendChild(fallback);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="admin-table-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', width: '100%', height: '100%', background: '#f5f5f5' }}>
                                                        <Image size={24} />
                                                    </div>
                                                )}

                                                {/* Hover overlay */}
                                                <div className="img-hover-overlay" style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'rgba(196,149,106,0.2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s'
                                                }}>
                                                    <UploadCloud size={20} color="currentColor" />
                                                </div>
                                            </label>

                                            <input
                                                type="file"
                                                id={`upload-${product.id}`}
                                                style={{ display: 'none' }}
                                                accept="image/*"
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <input
                                        type="number"
                                        className="inline-stock-input"
                                        style={{ 
                                            width: '45px', 
                                            textAlign: 'center', 
                                            fontSize: '0.8rem', 
                                            fontWeight: 'bold', 
                                            background: product.sort_order ? 'rgba(196, 149, 106, 0.1)' : 'rgba(255,255,255,0.03)',
                                            color: product.sort_order ? '#c4956a' : 'inherit',
                                            border: product.sort_order ? '1px solid rgba(196, 149, 106, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                                        }}
                                        value={product.sort_order || ''}
                                        onChange={(e) => handleInlineChange(product.id, 'sort_order', e.target.value)}
                                        placeholder="-"
                                        title="Orden de aparición (1, 2, 3...) - Los 3 primeros aparecen en el banner principal"
                                    />
                                </td>
                                <td>
                                    <input
                                        className="inline-text-input"
                                        value={product.name}
                                        onChange={(e) => handleInlineChange(product.id, 'name', e.target.value)}
                                        placeholder="Nombre..."
                                    />
                                    <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '2px' }}>
                                        SKU: {product.sku || product.code || 'S/N'}
                                    </div>
                                </td>
                                <td>
                                    <input
                                        className="inline-text-input"
                                        style={{ color: '#DCDCDC', fontWeight: 'bold' }}
                                        value={product.provider_sku || ''}
                                        onChange={(e) => handleInlineChange(product.id, 'provider_sku', e.target.value)}
                                        placeholder="Cód. Fab..."
                                    />
                                </td>
                                <td>
                                    <select
                                        className="inline-select"
                                        value={product.brand_id || product.brand?.id || ''}
                                        onChange={(e) => handleInlineChange(product.id, 'brand_id', e.target.value)}
                                    >
                                        <option value="">-</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </td>
                                <td>
                                    <select
                                        className="inline-select"
                                        value={product.category_id || product.category?.id || ''}
                                        onChange={(e) => handleInlineChange(product.id, 'category_id', e.target.value)}
                                        style={{ width: '100%', fontSize: '0.75rem' }}
                                    >
                                        <option value="">-</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select
                                        className="inline-select"
                                        value={product.gender || ''}
                                        onChange={(e) => handleInlineChange(product.id, 'gender', e.target.value)}
                                    >
                                        <option value="">-</option>
                                        <option value="Hombre">Hombre</option>
                                        <option value="Mujer">Mujer</option>
                                        <option value="Unisex">Unisex</option>
                                    </select>
                                </td>
                                {/* PRECIO ACTUAL: precio base / lista */}
                                <td style={{ textAlign: 'center' }}>
                                    <div className="inline-input-container">
                                        <span className="currency-symbol">$</span>
                                        <input
                                            type="number"
                                            className="inline-price-input"
                                            style={{ fontWeight: '600' }}
                                            value={product.price || ''}
                                            placeholder="Precio..."
                                            onChange={(e) => handleInlineChange(product.id, 'price', e.target.value)}
                                            title="Precio actual de lista"
                                        />
                                    </div>
                                </td>
                                {/* %: el usuario lo escribe, se calcula el precio de descuento */}
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <input
                                                type="number"
                                                className="inline-stock-input"
                                                style={{
                                                    width: '44px',
                                                    textAlign: 'center',
                                                    color: calculateDiscount(product.price, product.sale_price) > 0 ? '#f59e0b' : '#555',
                                                    fontWeight: 'bold',
                                                    background: calculateDiscount(product.price, product.sale_price) > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                                                    border: calculateDiscount(product.price, product.sale_price) > 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.1)'
                                                }}
                                                value={calculateDiscount(product.price, product.sale_price) || ''}
                                                onChange={(e) => handleInlineChange(product.id, 'discount_pct', e.target.value)}
                                                step="1"
                                                min="0"
                                                max="99"
                                                placeholder="0"
                                                title="Ingresá el % y se calcula el precio de descuento automáticamente"
                                            />
                                            <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>%</span>
                                        </div>
                                        {calculateDiscount(product.price, product.sale_price) > 0 && (
                                            <span style={{ fontSize: '8px', color: '#f59e0b', fontWeight: '800' }}>
                                                -{calculateDiscount(product.price, product.sale_price)}% OFF
                                            </span>
                                        )}
                                    </div>
                                </td>
                                {/* PRECIO DE DESCUENTO: precio con descuento aplicado */}
                                <td>
                                    <div className="inline-input-container">
                                        <span className="currency-symbol" style={{ color: '#10b981' }}>$</span>
                                        <input
                                            type="number"
                                            className="inline-price-input highlight"
                                            style={{ color: '#10b981', fontWeight: '700' }}
                                            value={product.sale_price || ''}
                                            placeholder="Con descuento..."
                                            onChange={(e) => handleInlineChange(product.id, 'sale_price', e.target.value)}
                                            title="Precio con descuento aplicado"
                                        />
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {Array.from(new Set(product.variants?.map(v => v.color).filter(Boolean) || [])).map(color => (
                                            <span
                                                key={color}
                                                className="admin-badge"
                                                style={{
                                                    background: 'var(--color-background-alt)',
                                                    fontSize: '9px',
                                                    padding: '2px 6px',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                {color}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {getStock(product) > 0 ? (
                                        <span className="admin-badge admin-badge-success" style={{ fontSize: '11px', padding: '4px 8px' }}>
                                            {getStock(product)}
                                        </span>
                                    ) : (
                                        <span className="admin-badge admin-badge-danger" style={{ fontSize: '10px' }}>AGOTADO</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        {product.hasChanges && (
                                            <button
                                                className="admin-btn admin-btn-success"
                                                onClick={() => saveInlineRow(product)}
                                                disabled={product.saving}
                                                style={{ padding: '0.5rem' }}
                                                title="Guardar Todo"
                                            >
                                                {product.saving ? <Loader className="spin" size={16} /> : <Check size={16} />}
                                            </button>
                                        )}
                                        <button
                                            className="admin-btn"
                                            onClick={() => toggleFeatured(product)}
                                            title={product.is_featured ? 'Quitar de Últimos Ingresos' : 'Agregar a Últimos Ingresos'}
                                            style={{ padding: '0.5rem', color: product.is_featured ? '#F59E0B' : '#9CA3AF', background: product.is_featured ? '#FEF3C7' : undefined }}
                                        >
                                            <Star size={16} fill={product.is_featured ? '#F59E0B' : 'none'} />
                                        </button>
                                        <button
                                            className="admin-btn admin-btn-secondary"
                                            onClick={() => openEditProduct(product)}
                                            title="Editar completo"
                                            style={{ padding: '0.5rem' }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="admin-btn admin-btn-danger"
                                            onClick={() => handleDelete(product.id)}
                                            title="Eliminar"
                                            style={{ padding: '0.5rem' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                    No se encontraron productos que coincidan con tu búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal premium-modal">
                        <div className="modal-header-premium">
                            <h2>
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="modal-close-btn"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <ProductForm
                            product={editingProduct}
                            onSuccess={handleSuccess}
                            onCancel={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}

            {/* Botón volver arriba */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: 9999,
                }}
                title="Volver arriba"
            >
                ↑
            </button>
        </div>
    )
}
