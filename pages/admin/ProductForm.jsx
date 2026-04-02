import { useState, useEffect, useRef } from 'react'
import { Upload, X, Plus, Trash2, Loader } from 'lucide-react'
import { createProduct, updateProduct, getProductVariants, createVariant, updateVariantStock, uploadImage, addProductImage, saveProductVariants, getSizeCurves, getSeasons } from '../../lib/admin'
import { getBrands, getCategories } from '../../lib/api'
import { COLOR_MAP, SIZE_ORDER } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

export default function ProductForm({ product, onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false)
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])
    const [seasons, setSeasons] = useState([])
    const [sizeCurves, setSizeCurves] = useState([]) // New state for size curves
    const [permError, setPermError] = useState(false)
    const [catSearch, setCatSearch] = useState('')
    const [showCatResults, setShowCatResults] = useState(false)
    const catRef = useRef(null)

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        brandId: '',
        categoryId: '',
        price: '',
        salePrice: '',
        sku: '',
        providerSku: '',
        season: '',
        provider: '',
        sizeType: '',
        subFamily: '',
        costPrice: '',
        observations: '',
        externalUrl: '',
        isPublished: true,
        images: [] // Array of { id, url, file, isNew }
    })

    // Drag State
    const [draggedItemIndex, setDraggedItemIndex] = useState(null)

    // Gender State
    const [gender, setGender] = useState('')

    // Variants State (Default variants if new)
    const [variants, setVariants] = useState([
        { size: 'S', color: 'Negro', stock: 0 },
        { size: 'M', color: 'Negro', stock: 0 },
        { size: 'L', color: 'Negro', stock: 0 },
        { size: 'XL', color: 'Negro', stock: 0 },
        { size: '2XL', color: 'Negro', stock: 0 },
        { size: '3XL', color: 'Negro', stock: 0 }
    ])

    useEffect(() => {
        loadDependencies()
        if (product) {
            loadProductData()
        }
    }, [product])

    async function loadDependencies() {
        try {
            // Carga defensiva: Si falla una, no rompe la otra
            const [brandsData, categoriesData, curvesData, seasonsData] = await Promise.all([
                getBrands().catch(err => {
                    console.error('Error loading brands:', err)
                    return []
                }),
                getCategories().catch(err => {
                    console.error('Error loading categories:', err)
                    return []
                }),
                getSizeCurves().catch(err => {
                    console.error('Error loading size curves:', err)
                    return []
                }),
                getSeasons().catch(err => {
                    console.error('Error loading seasons:', err)
                    return []
                })
            ])
            setBrands(brandsData || [])
            setSizeCurves(curvesData || [])
            setSeasons(seasonsData || [])

            // Organize categories hierarchically
            const hierarchical = (categoriesData || []).map(cat => {
                const parent = (categoriesData || []).find(p => p.id === cat.parent_id);
                return {
                    ...cat,
                    displayName: cat.name,
                    parentName: parent ? parent.name : ''
                };
            }).sort((a, b) => a.displayName.localeCompare(b.displayName));

            setCategories(hierarchical)

            // Si ambos fallan o están vacíos, no bloqueamos, solo logueamos
            if ((!brandsData || brandsData.length === 0) && (!categoriesData || categoriesData.length === 0)) {
                console.warn("Advertencia: No se encontraron marcas ni categorías.")
            }
        } catch (error) {
            console.error('Error loading dependencies:', error)
            // No seteamos permError para permitir intentar usar el formulario
        }
    }

    async function loadProductData() {
        setFormData({
            name: product.name,
            description: product.description || '',
            brandId: product.brand?.id || product.brand_id || '',
            categoryId: product.category?.id || product.category_id || '',
            price: product.price,
            salePrice: product.sale_price || '',
            sku: product.sku || '',
            providerSku: product.provider_sku || '',
            season: product.season || '',
            provider: product.provider || '',
            sizeType: product.size_type || '',
            subFamily: product.sub_family || '',
            costPrice: product.cost_price || '',
            observations: product.observations || '',
            externalUrl: product.external_url || '',
            isPublished: product.is_published ?? true,
            images: product.images?.map(img => ({ id: img.id, url: img.url, isNew: false, color: img.alt_text })) || []
        })

        // Initialize Gender from features
        const features = product.features || []
        if (features.includes('Hombre')) setGender('Hombre')
        else if (features.includes('Mujer')) setGender('Mujer')
        else if (features.includes('Unisex')) setGender('Unisex')
        else setGender('')

        if (product.variants && product.variants.length > 0) {
            // Mapear variantes para asegurar estructura
            const mappedVariants = product.variants.map(v => ({
                id: v.id,
                size: v.size,
                color: v.color,
                color_code: v.color_code || COLOR_MAP[v.color?.toLowerCase().trim()] || '',
                stock: v.stock
            })).sort((a, b) => {
                const sizeA = String(a.size).toUpperCase();
                const sizeB = String(b.size).toUpperCase();
                const indexA = SIZE_ORDER.indexOf(sizeA);
                const indexB = SIZE_ORDER.indexOf(sizeB);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return sizeA.localeCompare(sizeB);
            })
            setVariants(mappedVariants)
        } else {
            // Si es edición pero no tiene variantes, traemos las del server o dejamos default
            try {
                const fetchedVariants = await getProductVariants(product.id)
                if (fetchedVariants.length > 0) {
                    setVariants(fetchedVariants)
                }
            } catch (err) {
                console.error("Error fetching variants:", err)
            }
        }
        if (product.category_id || product.categoryId || product.category?.id) {
            const catId = product.category_id || product.categoryId || product.category?.id;
            const catObj = categories.find(c => c.id === catId);
            if (catObj) setCatSearch(catObj.displayName);
        }
    }

    // Actualizar nombre de categoría cuando carguen las dependencias
    useEffect(() => {
        if (categories.length > 0 && (product?.category_id || product?.categoryId || product?.category?.id)) {
            const catId = product.category_id || product.categoryId || product.category?.id;
            const catObj = categories.find(c => String(c.id) === String(catId));
            if (catObj) setCatSearch(catObj.displayName);
        }
    }, [categories, product])

    // Category & Gender Auto-Selection based on Name
    useEffect(() => {
        if (!formData.name) return // Don't auto-change if name empty

        const nameLower = formData.name.toLowerCase()

        // Dictionary of keywords to Categories
        const keywordMap = [
            { keywords: ['botas de lluvia', 'bota de lluvia', 'bota goma', 'hunter'], category: ['botas de lluvia'] },
            { keywords: ['piloto', 'trench', 'impermeable', 'trew'], category: ['pilotos', 'piloto'] },
            { keywords: ['campera', 'camperon', 'parka', 'rompeviento', 'abrigo', 'saco'], category: ['camperas', 'campera', 'abrigos'] },
            { keywords: ['chaleco'], category: ['campera/chaleco', 'chalecos', 'campera'] },
            { keywords: ['remera', 'chomba', 'polo', 't-shirt', 'musculosa', 'top'], category: ['remeras', 'chombas', 'remera', 'chomba'] },
            { keywords: ['pantalon', 'jean', 'denim', 'cargo', 'jogger', 'babucha', 'legging', 'calza'], category: ['pantalones', 'jeans', 'pantalon'] },
            { keywords: ['bermuda', 'short', 'traje de baño', 'malla'], category: ['bermudas', 'shorts', 'trajes de baño'] },
            { keywords: ['buzo', 'hoodie', 'canguro', 'polar', 'micropolar'], category: ['buzos', 'abrigos'] },
            { keywords: ['camisa', 'blusa'], category: ['camisas', 'blusas'] },
            { keywords: ['vestido', 'falda', 'mono', 'jardinero', 'enterito'], category: ['vestidos', 'faldas', 'monos'] },
            { keywords: ['sweater', 'pullover', 'cardigan', 'tejido'], category: ['sweaters', 'tejidos'] },
            { keywords: ['zapatilla', 'botita', 'sneaker', 'calzado', 'zapato', 'bota', 'borcego'], category: ['calzado', 'zapatillas'] },
            { keywords: ['accesorio', 'cinto', 'cinturon', 'gorra', 'gorro', 'bufanda', 'cuello', 'billetera', 'mochila', 'cartera', 'bolso', 'perfume'], category: ['accesorios', 'varios'] },
            { keywords: ['boxer', 'slip', 'bombacha', 'corpiño', 'lenceria', 'ropa interior', 'media', 'soquete'], category: ['ropa interior', 'accesorios'] }
        ];

        // 1. Auto-Category
        if (!formData.categoryId) {
            for (const item of keywordMap) {
                if (item.keywords.some(k => nameLower.includes(k))) {
                    const matchedCat = categories.find(c => {
                        const nameMatch = item.category.some(catKey => c.name.toLowerCase().includes(catKey));

                        // Filter by currently selected gender if available
                        if (gender && gender !== 'Unisex' && c.parentName) {
                            return nameMatch && c.parentName.toUpperCase() === gender.toUpperCase();
                        }
                        return nameMatch;
                    });

                    if (matchedCat) {
                        setFormData(prev => ({ ...prev, categoryId: matchedCat.id }));
                        setCatSearch(matchedCat.displayName);

                        // Also assign gender from category parent if possible
                        if (!gender) {
                            if (matchedCat.parentName === 'MUJER') setGender('Mujer');
                            else if (matchedCat.parentName === 'HOMBRE') setGender('Hombre');
                        }
                        break; // Stop after first match
                    }
                }
            }
        }

        // 2. Auto-Gender based on Keywords (if gender not set)
        if (!gender) {
            if (nameLower.includes('mujer') || nameLower.includes('woman') || nameLower.includes('dama') || nameLower.includes('femenino')) {
                setGender('Mujer');
            } else if (nameLower.includes('hombre') || nameLower.includes('man') || nameLower.includes('caballero') || nameLower.includes('masculino')) {
                setGender('Hombre');
            } else if (nameLower.includes('unisex') || nameLower.includes('niño') || nameLower.includes('kids')) {
                // Optional: Handle kids/unisex logic if needed
                setGender('Unisex');
            }
        }
    }, [formData.name, categories]);

    // Close category search on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (catRef.current && !catRef.current.contains(event.target)) {
                setShowCatResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [catRef]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            const newImages = files.map(file => {
                // Auto-detect color from filename
                // Pattern: looks for common color names in the file name
                // e.g., "foto_remera_rojo.jpg" -> "Rojo"
                let detectedColor = '';
                const nameLower = file.name.toLowerCase();

                // Common colors dictionary (can be expanded)
                const commonColors = [
                    'negro', 'blanco', 'azul', 'rojo', 'verde', 'amarillo',
                    'gris', 'beige', 'marron', 'rosa', 'naranja', 'violeta',
                    'bordo', 'celeste', 'fucsia', 'turquesa', 'camel', 'natural',
                    'habano', 'tostado', 'marino', 'francia', 'petroleo', 'oliva',
                    'militar', 'benetton', 'ladrillo', 'crema', 'plata', 'oro'
                ];

                for (const color of commonColors) {
                    // Check if filename contains the color name surrounded by separators or at start/end
                    // Basic check: includes
                    if (nameLower.includes(color)) {
                        // Capitalize first letter
                        detectedColor = color.charAt(0).toUpperCase() + color.slice(1);
                        break;
                    }
                }

                // If no color detected from filename, try to use the most frequent color in variants if exists
                if (!detectedColor && variants.length > 0) {
                    // This is a simple heuristic: if there is only one color in variants, assume image is that color
                    const variantColors = [...new Set(variants.map(v => v.color).filter(Boolean))];
                    if (variantColors.length === 1) {
                        detectedColor = variantColors[0];
                    }
                }

                return {
                    file,
                    url: URL.createObjectURL(file),
                    isNew: true,
                    color: detectedColor // Assigned automatically
                };
            })
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages]
            }))
        }
    }

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    // --- DRAG AND DROP HANDLERS ---
    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index)
        // Set effect allowed
        e.dataTransfer.effectAllowed = 'move'
        // Ghost image transparency (optional, browser handles this mostly)
        e.target.style.opacity = '0.4'
    }

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1'
        setDraggedItemIndex(null)
    }

    const handleDragOver = (e) => {
        e.preventDefault() // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e, dropIndex) => {
        e.preventDefault()

        if (draggedItemIndex === null || draggedItemIndex === dropIndex) return

        setFormData(prev => {
            const newImages = [...prev.images]
            const [draggedItem] = newImages.splice(draggedItemIndex, 1)
            newImages.splice(dropIndex, 0, draggedItem)
            return { ...prev, images: newImages }
        })
    }

    const makePrimary = (index) => {
        if (index === 0) return
        setFormData(prev => {
            const newImages = [...prev.images]
            const [item] = newImages.splice(index, 1)
            newImages.unshift(item)
            return { ...prev, images: newImages }
        })
    }

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants]

        // Auto-fix 2X -> 2XL
        if (field === 'size' && value.toUpperCase() === '2X') {
            value = '2XL';
        }

        // If it's color, we don't normalize during typing to avoid blocking the user
        let updatedVariant = { ...newVariants[index], [field]: value }

        // Auto-set color_code if color name matches COLOR_MAP and color_code is empty or we are changing the name
        if (field === 'color') {
            const hex = COLOR_MAP[value.toLowerCase().trim()]
            if (hex) {
                updatedVariant.color_code = hex
            }
        }

        newVariants[index] = updatedVariant
        setVariants(newVariants)
    }

    const addVariant = () => {
        setVariants([...variants, { size: '', color: '', color_code: '', stock: 0 }])
    }

    const sortVariants = () => {
        const sorted = [...variants].sort((a, b) => {
            const sizeA = String(a.size).toUpperCase();
            const sizeB = String(b.size).toUpperCase();
            const indexA = SIZE_ORDER.indexOf(sizeA);
            const indexB = SIZE_ORDER.indexOf(sizeB);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            // If sizes are same or not in order, sort by color
            if (sizeA === sizeB) {
                return String(a.color).localeCompare(String(b.color));
            }
            return sizeA.localeCompare(sizeB);
        });
        setVariants(sorted);
    }

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Construct features array with gender
            const features = []
            if (gender) features.push(gender)

            // 2. Datos base del producto
            const productData = {
                name: formData.name,
                description: formData.description,
                brandId: formData.brandId || null,
                categoryId: formData.categoryId || null,
                price: parseFloat(formData.price),
                salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
                sku: formData.sku,
                providerSku: formData.providerSku,
                season: formData.season,
                provider: formData.provider,
                sizeType: formData.sizeType,
                subFamily: formData.subFamily,
                gender: gender,
                costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
                observations: formData.observations,
                externalUrl: formData.externalUrl,
                isPublished: formData.isPublished,
                features: features // Add features to payload
            }

            // 3. Guardar Producto
            let savedProduct
            if (product) {
                savedProduct = await updateProduct(product.id, productData)
            } else {
                savedProduct = await createProduct(productData)
            }

            const productId = savedProduct.id

            // 4. Gestionar Imágenes (Re-sincronizar todas para mantener el orden)
            // Primero borramos las relaciones existentes para este producto
            // Assuming supabase is available or add it to imports if needed
            await supabase.from('product_images').delete().eq('product_id', productId)

            // Luego subimos las nuevas y re-insertamos todas en el nuevo orden
            for (let i = 0; i < formData.images.length; i++) {
                const img = formData.images[i]
                let finalUrl = img.url

                if (img.isNew) {
                    finalUrl = await uploadImage(img.file)
                }

                await addProductImage(productId, finalUrl, i === 0, img.color, i)
            }

            // 5. Guardar Variantes
            if (variants && variants.length > 0) {
                await saveProductVariants(productId, variants)
            }

            onSuccess()
        } catch (error) {
            console.error(error)
            alert('Error al guardar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    // Calculate discount percentage
    const discountPercent = (formData.price && formData.salePrice)
        ? Math.round(((parseFloat(formData.price) - parseFloat(formData.salePrice)) / parseFloat(formData.price)) * 100)
        : 0

    return (
        <form className="product-form" onSubmit={handleSubmit}>
            <div className="product-form__layout">
                {/* COLUMNA IZQUIERDA: Imagen y Resumen Visual */}
                <div className="product-form__sidebar">
                    <div className="form-section-sidebar">
                        <label className="label-premium">Fotos del Producto ({formData.images.length})</label>
                        <div className="images-grid-premium">
                            {formData.images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`image-item-premium ${idx === 0 ? 'is-primary' : ''} ${draggedItemIndex === idx ? 'dragging' : ''}`}
                                    title={idx === 0 ? 'Imagen Principal (Arrastra para reordenar)' : 'Arrastra para reordenar'}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    onClick={() => makePrimary(idx)}
                                >
                                    <img
                                        src={img.url}
                                        alt={`Preview ${idx}`}
                                        style={{ cursor: 'move' }}
                                    />

                                    <div className="image-color-tag">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <select
                                                value={img.color || ''}
                                                onChange={(e) => {
                                                    const newImages = [...formData.images];
                                                    newImages[idx].color = e.target.value;
                                                    setFormData({ ...formData, images: newImages });
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="premium-image-select"
                                            >
                                                <option value="">Elegir...</option>
                                                {/* Extract all unique colors from variants, non-empty */}
                                                {Array.from(new Set(variants.map(v => v.color?.trim()).filter(Boolean))).map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Otro..."
                                                value={img.color || ''}
                                                onChange={(e) => {
                                                    const newImages = [...formData.images];
                                                    newImages[idx].color = e.target.value;
                                                    setFormData({ ...formData, images: newImages });
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    background: 'rgba(0,0,0,0.8)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'white',
                                                    fontSize: '7px',
                                                    padding: '2px',
                                                    width: '56px',
                                                    borderRadius: '2px'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="remove-image-btn compact"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(idx);
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                    {idx === 0 && <span className="primary-badge border-glow">PRINCIPAL</span>}
                                </div>
                            ))}
                            <div className="upload-placeholder-premium" onClick={() => document.getElementById('fileInput').click()}>
                                <Plus size={20} />
                                <span>AÑADIR</span>
                            </div>
                        </div>
                        <input id="fileInput" type="file" accept="image/*" onChange={handleImageChange} hidden multiple />
                    </div>

                    <div className="form-section-sidebar">
                        <label className="label-premium">Vista Previa de Venta</label>
                        <div className="product-form__summary-card">
                            <span className="summary-brand">{formData.brandId ? brands.find(b => b.id === formData.brandId)?.name : 'Sin Marca'}</span>
                            <h4 className="summary-name">{formData.name || 'Nombre del Producto'}</h4>
                            <div className="summary-prices">
                                {formData.salePrice ? (
                                    <>
                                        <span className="price-sale">${formData.salePrice}</span>
                                        <span className="price-list">${formData.price}</span>
                                        <span className="badge-discount">-{discountPercent}%</span>
                                    </>
                                ) : (
                                    <span className="price-regular">${formData.price || '0'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Datos Detallados */}
                <div className="product-form__main">
                    {/* Información Básica */}
                    <div className="form-section">
                        <h3>Datos del Producto</h3>
                        <div style={{ marginBottom: 16 }}>
                            <label className="label-premium">Nombre del Artículo</label>
                            <input
                                className="input-premium"
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Ej: Campera Hunter Impermeable"
                            />
                        </div>
                        <div className="form-grid-2">
                            <div>
                                <label className="label-premium">Marca</label>
                                <select
                                    className="input-premium"
                                    value={formData.brandId}
                                    onChange={e => setFormData({ ...formData, brandId: e.target.value })}
                                >
                                    <option value="">Seleccionar Marca...</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div ref={catRef} style={{ position: 'relative' }}>
                                <label className="label-premium">Categoría (Escribe para buscar...)</label>
                                <input
                                    className="input-premium"
                                    type="text"
                                    placeholder="Ej: Hombre, Bermudas..."
                                    value={catSearch}
                                    onChange={(e) => {
                                        setCatSearch(e.target.value)
                                        setShowCatResults(true)
                                        if (e.target.value === '') {
                                            setFormData({ ...formData, categoryId: '' })
                                        }
                                    }}
                                    onFocus={() => setShowCatResults(true)}
                                />
                                {showCatResults && (
                                    <div className="search-results-dropdown">
                                        {categories
                                            .filter(c => {
                                                const matchesSearch = c.displayName.toLowerCase().includes(catSearch.toLowerCase()) ||
                                                    (c.parentName && c.parentName.toLowerCase().includes(catSearch.toLowerCase()));

                                                // Link Gender -> Category: Filter keys based on selected Gender
                                                let matchesGender = true;
                                                if (gender && gender !== 'Unisex') {
                                                    if (c.parentName) {
                                                        matchesGender = c.parentName.toUpperCase() === gender.toUpperCase();
                                                    }
                                                }
                                                return matchesSearch && matchesGender;
                                            })
                                            .map(c => (
                                                <div
                                                    key={c.id}
                                                    className="search-result-item"
                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                    onClick={() => {
                                                        setFormData({ ...formData, categoryId: c.id });
                                                        setCatSearch(c.displayName);
                                                        setShowCatResults(false);

                                                        // Smart Gender Assignment
                                                        if (c.parentName === 'MUJER') setGender('Mujer');
                                                        else if (c.parentName === 'HOMBRE') setGender('Hombre');
                                                    }}
                                                >
                                                    <span style={{ fontWeight: '600' }}>{c.displayName}</span>
                                                    {c.parentName && (
                                                        <span style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase' }}>
                                                            {c.parentName}
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        }
                                        {categories.filter(c =>
                                            c.displayName.toLowerCase().includes(catSearch.toLowerCase()) ||
                                            (c.parentName && c.parentName.toLowerCase().includes(catSearch.toLowerCase()))
                                        ).length === 0 && (
                                                <div className="search-result-empty">No se encontró esa categoría</div>
                                            )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="label-premium">Género</label>
                                <select
                                    className="input-premium"
                                    value={gender}
                                    onChange={e => {
                                        setGender(e.target.value);
                                        // Reset category when gender changes so user picks a matching one
                                        setFormData(prev => ({ ...prev, categoryId: '' }));
                                        setCatSearch('');
                                    }}
                                >
                                    <option value="">Seleccionar Género...</option>
                                    <option value="Hombre">Hombre</option>
                                    <option value="Mujer">Mujer</option>
                                    <option value="Unisex">Unisex</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-premium">Temporada</label>
                                <input
                                    className="input-premium"
                                    type="text"
                                    list="seasons-list"
                                    value={formData.season}
                                    onChange={e => setFormData({ ...formData, season: e.target.value })}
                                    placeholder="Seleccionar o escribir temporada..."
                                />
                                <datalist id="seasons-list">
                                    {seasons.map((s, idx) => (
                                        <option key={idx} value={s} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                            <div>
                                <label className="label-premium">Código Interno (SKU)</label>
                                <input
                                    className="input-premium"
                                    type="text"
                                    value={formData.sku}
                                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="Ej: CAM-HUN-001"
                                />
                            </div>
                            <div>
                                <label className="label-premium">Código Proveedor</label>
                                <input
                                    className="input-premium"
                                    type="text"
                                    value={formData.providerSku}
                                    onChange={e => setFormData({ ...formData, providerSku: e.target.value })}
                                    placeholder="Ej: PRV-9988"
                                />
                            </div>
                        </div>

                        <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                            <div>
                                <label className="label-premium">Proveedor</label>
                                <input
                                    className="input-premium"
                                    type="text"
                                    value={formData.provider}
                                    onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                    placeholder="Nombre del proveedor"
                                />
                            </div>
                            <div>
                                <label className="label-premium">Sub-Familia / Sub-Categoría</label>
                                <input
                                    className="input-premium"
                                    type="text"
                                    value={formData.subFamily}
                                    onChange={e => setFormData({ ...formData, subFamily: e.target.value })}
                                    placeholder="Ej: Remeras de Algodón"
                                />
                            </div>
                        </div>

                        <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                            <div>
                                <label className="label-premium">Tipo de Talle (Curva)</label>
                                <select
                                    className="input-premium"
                                    value={formData.sizeType}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, sizeType: val });
                                        
                                        // Auto-generate variants based on selected curve if it's a new product or empty variants
                                        const selectedCurve = sizeCurves.find(c => c.name === val || c.id === val);
                                        if (selectedCurve && (variants.length === 0 || (variants.length === 6 && variants[0].size === 'S' && variants[0].stock === 0))) {
                                            const newVars = selectedCurve.sizes.map(s => ({
                                                size: s,
                                                color: 'Negro', // Default color
                                                stock: 0
                                            }));
                                            setVariants(newVars);
                                        }
                                    }}
                                >
                                    <option value="">Seleccionar Curva...</option>
                                    {sizeCurves.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '1.5rem' }}>
                                <label className="label-premium" style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isPublished}
                                        onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                                        style={{ width: '18px', height: '18px', accentColor: '#DCDCDC' }}
                                    />
                                    Publicar en la tienda
                                </label>
                            </div>
                        </div>
                    </div>
                    {/* Precios */}
                    <div className="form-section">
                        <h3>Precios y Costos</h3>
                        <div className="form-grid-3">
                            <div>
                                <label className="label-premium">Costo de Compra</label>
                                <div className="input-with-icon">
                                    <span className="input-icon">$</span>
                                    <input
                                        className="input-premium has-icon"
                                        type="number"
                                        value={formData.costPrice}
                                        onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label-premium">Precio de Lista</label>
                                <div className="input-with-icon">
                                    <span className="input-icon">$</span>
                                    <input
                                        className="input-premium has-icon"
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label-premium">Precio de Oferta</label>
                                <div className="input-with-icon">
                                    <span className="input-icon">$</span>
                                    <input
                                        className="input-premium has-icon"
                                        type="number"
                                        value={formData.salePrice}
                                        onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                                        min="0"
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>
                        </div>
                        {
                            formData.salePrice && parseFloat(formData.price) > 0 && (
                                <div className="discount-preview">
                                    Descuento aplicado: <span className="highlight">-{discountPercent}%</span> sobre el precio de lista.
                                </div>
                            )
                        }
                    </div >

                    {/* Descripción */}
                    < div className="form-section" >
                        <h3>Descripción</h3>
                        <textarea
                            className="input-premium"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalles del producto, materiales, etc..."
                            style={{ resize: 'none' }}
                        />
                        <div style={{ marginTop: '1rem' }}>
                            <label className="label-premium">Observaciones Internas</label>
                            <textarea
                                className="input-premium"
                                rows={2}
                                value={formData.observations}
                                onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                placeholder="Notas para el equipo, detalles del proveedor..."
                                style={{ resize: 'none' }}
                            />
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <label className="label-premium">URL Externa / Referencia</label>
                            <input
                                className="input-premium"
                                type="text"
                                value={formData.externalUrl}
                                onChange={e => setFormData({ ...formData, externalUrl: e.target.value })}
                                placeholder="Enlace a catálogo original o web oficial"
                            />
                        </div>
                    </div >

                    {/* Variantes */}
                    < div className="form-section" >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <h3>Talles y Colores</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={sortVariants} className="btn-add-variant" style={{ background: 'var(--color-background-alt)', color: '#999', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    ORDENAR TALLES
                                </button>
                                <button type="button" onClick={addVariant} className="btn-add-variant">
                                    <Plus size={14} /> AGREGAR VARIANTE
                                </button>
                            </div>
                        </div>
                        <div className="variants-grid-header">
                            <div style={{ flex: 1 }}>TALLE</div>
                            <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                COLOR
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (variants.length > 0) {
                                            const firstColor = variants[0].color;
                                            setVariants(variants.map(v => ({ ...v, color: firstColor })));
                                        }
                                    }}
                                    title="Aplicar primer color a todos"
                                    style={{ background: 'none', border: 'none', color: '#DCDCDC', cursor: 'pointer', padding: 0, fontSize: '10px' }}
                                >
                                    (Copiar a todos)
                                </button>
                            </div>
                            <div style={{ flex: 1 }}>STOCK</div>
                            <div style={{ width: 40 }}></div>
                        </div>

                        <div className="variants-list">
                            {variants.map((variant, index) => (
                                <div key={index} className="variant-row-premium">
                                    <div style={{ flex: 1 }}>
                                        <input
                                            className="input-premium compact"
                                            value={variant.size}
                                            onChange={e => handleVariantChange(index, 'size', e.target.value)}
                                            placeholder="Talle"
                                        />
                                    </div>
                                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <input
                                            className="input-premium compact"
                                            value={variant.color}
                                            onChange={e => handleVariantChange(index, 'color', e.target.value)}
                                            placeholder="Color (ej: Negro, Azul...)"
                                            list="color-suggestions"
                                            style={{ flex: 1 }}
                                        />
                                        <div className="color-picker-wrapper" style={{ position: 'relative', width: '24px', height: '24px' }}>
                                            <input
                                                type="color"
                                                value={variant.color_code || COLOR_MAP[variant.color?.toLowerCase().trim()] || '#ffffff'}
                                                onChange={e => handleVariantChange(index, 'color_code', e.target.value)}
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    opacity: 0,
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                    height: '100%'
                                                }}
                                            />
                                            <div
                                                className="color-preview-circle"
                                                style={{
                                                    backgroundColor: variant.color_code || COLOR_MAP[variant.color?.toLowerCase().trim()] || '#eee',
                                                    width: '24px',
                                                    height: '24px',
                                                    border: '1px solid rgba(255,255,255,0.2)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="number"
                                            className="input-premium compact"
                                            value={variant.stock}
                                            onChange={e => handleVariantChange(index, 'stock', e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeVariant(index)} className="btn-remove-variant">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <datalist id="color-suggestions">
                            {Object.keys(COLOR_MAP).sort().map(c => (
                                <option key={c} value={c.charAt(0).toUpperCase() + c.slice(1)} />
                            ))}
                        </datalist>
                    </div >
                </div >
            </div >

            {/* Acciones */}
            < div className="modal-actions-premium" >
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <Loader className="spin" size={16} /> : (product ? 'Guardar Cambios' : 'Crear Producto')}
                </button>
            </div >
        </form >
    )
}
