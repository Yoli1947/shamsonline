import { useState, useEffect } from 'react'
import { Search, AlertTriangle, Plus, Minus, Download, Upload, FileSpreadsheet, Loader, Maximize2, Minimize2, Trash2 } from 'lucide-react'
import { getAllProducts, updateVariantStock, createProduct, updateProduct, deleteProduct, createBrand, createCategory, getBrands, getCategories, saveProductVariants, batchUpsertProducts, batchUpsertVariants, getSeasons, createSeason, updateSiteSetting } from '../../lib/admin'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { COLOR_MAP, SIZE_ORDER } from '../../lib/constants'
import './Stock.css'

// Definición global de curvas para evitar re-creación en cada renderizado
const GLOBAL_SIZE_HEADERS = [
    ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '', '', ''],         // TIPO 1
    ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], // TIPO 2
    ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '', ''],     // TIPO 3
    ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'], // TIPO 4
    ['44', '46', '48', '50', '52', '54', '56', '58', '60', '', '', ''],       // TIPO 5
    ['23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'], // TIPO 6
    ['U', '', '', '', '', '', '', '', '', '', '', ''],                         // TIPO 7
    ['0', '1', '2', '3', '4', '5', '6', '7', '', '', '', ''],                 // TIPO 8
    ['20', '22', '24', '26', '28', '30', '32', '36', '', '', '', ''],         // TIPO 9
];

export default function Stock() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLow, setFilterLow] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])
    const [showSqlHelp, setShowSqlHelp] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [selectedBrandId, setSelectedBrandId] = useState('')
    const [selectedSeasons, setSelectedSeasons] = useState([])
    const [filterPhoto, setFilterPhoto] = useState('all') // 'all', 'with', 'without'
    const [visibleCount, setVisibleCount] = useState(50) // Paginación inicial
    const [seasons, setSeasons] = useState([]) // All seasons list

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true)
                const [productsRes, brandsRes, categoriesRes, seasonsRes] = await Promise.all([
                    getAllProducts(1, 5000),
                    getBrands(),
                    getCategories(),
                    getSeasons()
                ])
                setProducts(productsRes.products)
                setBrands(brandsRes)
                setCategories(categoriesRes)
                setSeasons(seasonsRes)
            } catch (error) {
                console.error('Error loading stock:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [refreshTrigger])

    const handleUpdateStock = async (variantId, newStock) => {
        try {
            await updateVariantStock(variantId, newStock)
            // Actualización local rápida
            setProducts(prev => prev.map(p => ({
                ...p,
                variants: p.variants?.map(v => v.id === variantId ? { ...v, stock: newStock } : v)
            })))
        } catch (error) {
            alert('Error al actualizar stock')
        }
    }

    const handleUpdateProduct = async (productId, field, value) => {
        try {
            const updates = {}
            if (field === 'price' || field === 'cost_price') {
                updates[field] = parseFloat(value) || 0
            } else {
                updates[field] = value
            }

            await updateProduct(productId, updates)

            // Actualización local
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p))
        } catch (error) {
            console.error('Error updating product:', error)
            alert('Error al actualizar: ' + error.message)
        }
    }

    const handleDeleteProduct = async (productId, name) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar "${name}"? Esta acción borrará también todas sus variantes y fotos.`)) {
            return
        }

        try {
            await deleteProduct(productId)
            setProducts(prev => prev.filter(p => p.id !== productId))
        } catch (error) {
            console.error('Error deleting product:', error)
            alert('Error al eliminar: ' + error.message)
        }
    }

    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)

    const handleUpdateStockOnly = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setIsImporting(true)
        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)

                console.log('Actualizando Solo Stock con', data.length, 'filas')

                // REFRESCAR PRODUCTOS antes de empezar para tener TODOS los de la DB y no duplicar
                let allLatestProducts = [];
                let page = 1;
                const pageSize = 5000;
                while (true) {
                    const { products: fetched } = await getAllProducts(page, pageSize);
                    allLatestProducts = allLatestProducts.concat(fetched);
                    if (fetched.length < pageSize) break;
                    page++;
                }

                // Diccionario para búsqueda rápida
                const productLookup = {}
                const nameLookup = {} // Fallback por nombre

                allLatestProducts.forEach(p => {
                    const keysToP = [p.sku, p.code, p.provider_sku];
                    keysToP.forEach(k => {
                        if (k) {
                            const trimmed = k.toString().toUpperCase().trim();
                            productLookup[trimmed] = p;
                            productLookup[trimmed.replace(/^0+/, '')] = p;
                        }
                    });
                    if (p.name) {
                        const n = p.name.toString().toUpperCase().trim();
                        nameLookup[n] = p;
                        const cleanName = n.split('(')[0].trim();
                        nameLookup[cleanName] = p;
                    }
                })

                // Validate columns for debugging
                let detectedColumns = [];
                if (data.length > 0) {
                    detectedColumns = Object.keys(data[0]);
                    console.log('Stock Update - Columnas detectadas:', detectedColumns);
                }

                const variantsToUpdate = []
                let foundCount = 0
                let notFoundCount = 0

                for (const row of data) {
                    // Buscar SKU en varias posibles columnas
                    let rawSku = (
                        row['CODIGO'] ||
                        row['CODIGO INTERNO'] ||
                        row['CODIGO PROVEEDOR'] ||
                        row['Codigo'] ||
                        row['ARTICULO'] ||
                        row.sku ||
                        ''
                    ).toString().trim().toUpperCase()

                    if (!rawSku) continue

                    const sku = rawSku.replace(/^0+/, '') || rawSku
                    const desc = (row.DESCRIPCION || row.description || row.NOMBRE || row.nombre || '').toString().toUpperCase().trim()

                    // ESTRICTO: Match solo por código (SKU)
                    let prod = productLookup[sku] || productLookup[rawSku]

                    if (!prod) {
                        notFoundCount++
                        continue
                    }

                    const color = (row.COLOR || row.color || '').toString().trim() || '-'
                    const sizeType = parseInt(row['TIPO TALLE'] || row['Tipo Talle'] || prod.size_type)

                    if (!isNaN(sizeType) && sizeType >= 1 && sizeType <= 9) {
                        const headers = GLOBAL_SIZE_HEADERS[sizeType - 1]
                        for (let j = 1; j <= 12; j++) {
                            // Probar ambos formatos: STOCK_T01 y STOCK_T1
                            const colLong = `STOCK_T${j.toString().padStart(2, '0')}`
                            const colShort = `STOCK_T${j}`
                            const stockVal = row[colLong] !== undefined ? row[colLong] : row[colShort]

                            if (stockVal === undefined) continue

                            const stock = parseInt(stockVal)
                            const size = headers[j - 1]
                            if (size && !isNaN(stock)) {
                                // Buscador de variante súper permisivo
                                let existingV = prod.variants?.find(v => {
                                    const vSize = v.size.toString().toLowerCase()
                                    const vColor = (v.color || '-').toString().toLowerCase()
                                    const rowSize = size.toString().toLowerCase()
                                    const rowColor = color.toString().toLowerCase()

                                    // Coincidencia exacta de talla y (color incluido o es '-' o es el único color)
                                    const sizeMatch = vSize === rowSize
                                    const colorMatch = vColor.includes(rowColor) || rowColor.includes(vColor) || rowColor === '-'

                                    return sizeMatch && colorMatch
                                })

                                // Segundo intento: Si la talla coincide y el producto solo tiene un color, usar ese
                                if (!existingV && prod.variants) {
                                    const sameSizeVars = prod.variants.filter(v => v.size.toString().toLowerCase() === size.toString().toLowerCase())
                                    if (sameSizeVars.length === 1) {
                                        existingV = sameSizeVars[0]
                                    }
                                }

                                if (existingV) {
                                    variantsToUpdate.push({
                                        id: existingV.id,
                                        product_id: prod.id,
                                        size: existingV.size,
                                        color: existingV.color,
                                        stock: stock
                                    })
                                    foundCount++
                                } else if (stock > 0) {
                                    console.log(`Missed Variant: ${prod.name} | Size: ${size} | Color: ${color} | Stock: ${stock}`)
                                }
                            }
                        }
                    } else {
                        // Formato columna única (TALLE y STOCK)
                        let size = (row.TALLE || row.talle || '').toString().trim()
                        if (size.toUpperCase() === '2X') size = '2XL';
                        const stockVal = row.STOCK !== undefined ? row.STOCK : row.stock
                        const stock = parseInt(stockVal)

                        if (size && !isNaN(stock)) {
                            let existingV = prod.variants?.find(v => {
                                const vSize = v.size.toString().toLowerCase()
                                const vColor = (v.color || '-').toString().toLowerCase()
                                const rowSize = size.toString().toLowerCase()
                                const rowColor = color.toString().toLowerCase()
                                return vSize === rowSize && (vColor.includes(rowColor) || rowColor.includes(vColor) || rowColor === '-')
                            })

                            if (!existingV && prod.variants) {
                                const sameSizeVars = prod.variants.filter(v => v.size.toString().toLowerCase() === size.toString().toLowerCase())
                                if (sameSizeVars.length === 1) existingV = sameSizeVars[0]
                            }

                            if (existingV) {
                                variantsToUpdate.push({
                                    id: existingV.id,
                                    product_id: prod.id,
                                    size: existingV.size,
                                    color: existingV.color,
                                    stock: stock
                                })
                                foundCount++
                            } else if (stock > 0) {
                                console.log(`Missed Variant (Single Col): ${prod.name} | Size: ${size} | Color: ${color} | Stock: ${stock}`)
                            }
                        }
                    }
                }

                if (variantsToUpdate.length > 0) {
                    const chunkSize = 500
                    for (let i = 0; i < variantsToUpdate.length; i += chunkSize) {
                        await batchUpsertVariants(variantsToUpdate.slice(i, i + chunkSize))
                    }
                    alert(`✅ Stock actualizado: ${foundCount} variantes modificadas. ${notFoundCount > 0 ? `(${notFoundCount} productos no encontrados en DB)` : ''}`)
                    setRefreshTrigger(p => p + 1)
                } else {
                    const headersStr = detectedColumns.join(', ');
                    alert(`⚠️ No se encontraron variantes para actualizar.\n\nColumnas detectadas: ${headersStr}\n\nAsegúrese de que el archivo tenga 'CODIGO' y columnas de stock (STOCK o STOCK_Txx).`);
                }
            } catch (err) {
                console.error(err)
                alert('❌ Error al actualizar stock: ' + (err.message || 'Error desconocido'))
            } finally {
                setIsImporting(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Limpiar el input para permitir seleccionar el mismo archivo si falla
        const target = e.target;

        setIsImporting(true)
        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)

                console.log(`🚀 Iniciando importación de ${data.length} filas...`);

                const [latestBrands, latestCategories] = await Promise.all([getBrands(), getCategories()])
                let brandMap = Object.fromEntries(latestBrands.map(b => [b.name.toUpperCase().trim(), b.id]))
                let categoryMap = Object.fromEntries(latestCategories.map(c => [c.name.toUpperCase().trim(), c.id]))

                // Identificar padres de género para categorización automática
                const mujerParentId = latestCategories.find(c => c.name.toUpperCase() === 'MUJER')?.id;
                const hombreParentId = latestCategories.find(c => c.name.toUpperCase() === 'HOMBRE')?.id;

                console.log(`🚀 Iniciando importación de ${data.length} filas...`);

                // REFRESCAR PRODUCTOS antes de empezar para tener TODOS los de la DB y no duplicar
                let allLatestProducts = [];
                let page = 1;
                const pageSize = 5000;
                while (true) {
                    const { products: fetched } = await getAllProducts(page, pageSize);
                    allLatestProducts = allLatestProducts.concat(fetched);
                    if (fetched.length < pageSize) break;
                    page++;
                }

                // Diccionario para búsqueda rápida de productos con prioridad sku > code > provider_sku
                // (evita colisiones donde un provider_sku coincide con el sku de otro producto)
                const productLookup = {};
                const lookupPriority = {};
                const addToLookup = (key, p, priority) => {
                    if (!key) return;
                    const k = key.toString().toUpperCase().trim();
                    const kClean = k.replace(/^0+/, '') || k;
                    [k, kClean].forEach(kk => {
                        if ((lookupPriority[kk] || 0) < priority) {
                            productLookup[kk] = p;
                            lookupPriority[kk] = priority;
                        }
                    });
                };
                allLatestProducts.forEach(p => {
                    addToLookup(p.provider_sku, p, 1); // menor prioridad
                    addToLookup(p.code, p, 2);
                    addToLookup(p.sku, p, 3);          // mayor prioridad
                });

                const productsToUpsert = []
                const rowsWithProducts = []
                // Validate columns
                if (data.length > 0) {
                    const firstRow = data[0];
                    const columns = Object.keys(firstRow);
                    console.log('Columnas detectadas en Excel:', columns);
                }

                for (const row of data) {
                    const rawSku = (row['CODIGO'] || row['codigo'] || row['CODIGO INTERNO'] || row['Codigo'] || row['ARTICULO'] || row.sku || '').toString().trim().toUpperCase()
                    if (!rawSku) continue // ESTRICTO: Si no hay código, lo saltamos.

                    const skuClean = rawSku.replace(/^0+/, '') || rawSku
                    const rawName = (row.DESCRIPCION || row.PRODUCTO || row.producto || 'Sin Nombre').toString().trim()

                    const existingP = productLookup[rawSku] || productLookup[skuClean]

                    // Asignar el SKU que vamos a usar. Si existe usamos el de DB preferentemente para no perder el link
                    const sku = existingP?.sku || existingP?.code || rawSku;

                    let brandName = (row.MARCA || '').toString().trim().toUpperCase()
                    let categoryName = (row['FAMILIA/CATEGORIA'] || row.CATEGORIA || '').toString().trim().toUpperCase()
                    let excelGender = (row['GENERO'] || row['Género'] || row.gender || '').toString().trim().toUpperCase()

                    // Normalización de Perramus
                    if (brandName.includes('PERRAMUS') && (brandName.includes('INTEX') || brandName.includes('INDITEX') || brandName.includes('ACACIA'))) {
                        brandName = 'PERRAMUS'
                    }

                    // 1. Manejar Marca sin crear (solo mapear si existe)
                    let effectiveBrandId = existingP?.brand_id || null;
                    if (brandName && brandMap[brandName]) {
                        effectiveBrandId = brandMap[brandName];
                    }

                    // 2. Manejar Género (Literal del Excel o el actual)
                    let effectiveGender = existingP?.gender || null;
                    if (excelGender === 'MUJER') effectiveGender = 'Mujer';
                    else if (excelGender === 'HOMBRE') effectiveGender = 'Hombre';
                    else if (excelGender === 'UNISEX') effectiveGender = 'Unisex';

                    // 3. Manejar Categoría sin crear
                    let effectiveCategoryId = existingP?.category_id || null;
                    if (categoryName && categoryMap[categoryName]) {
                        effectiveCategoryId = categoryMap[categoryName];
                    }

                    // Sincronizar Features con Género
                    let effectiveFeatures = existingP?.features || [];
                    if (effectiveGender && !effectiveFeatures.includes(effectiveGender)) {
                        effectiveFeatures = [...new Set([...effectiveFeatures, effectiveGender])];
                    }

                    const price = parseFloat(row['PRECIO'] || 0);
                    // Regla estricta: nunca usar PRECIO OFERTA

                    const newProviderSku = row['CODIGO PROVEEDOR'] || row['Código Proveedor'] || '';
                    const newCost = parseFloat(row['COSTO'] || 0);
                    const newProvider = (row['PROVEEDOR'] || row['proveedor'] || '').toString().trim().toUpperCase().includes('PERRAMUS') ? 'PERRAMUS' : (row['PROVEEDOR'] || row['proveedor'] || '').toString().trim();
                    const newSizeType = (row['TIPO TALLE'] || existingP?.size_type || '').toString();
                    const publishedRaw = (row['PUBLICADO']?.toString() || '').trim().toUpperCase();
                    const hasPublishedColumn = publishedRaw !== '';
                    const isPublished = publishedRaw !== 'NO';
                    const newSeason = (row['TEMPORADA'] || row['Temporada'] || row['season'] || '').toString().trim();

                    // 4. Si existe, actualizar desde un clon para enviar objeto completo a Supabase y evitar errores NOT NULL
                    if (existingP?.id) {
                        const updates = { ...existingP };
                        delete updates.brand;
                        delete updates.category;
                        delete updates.images;
                        delete updates.variants;

                        let hasChanges = false;

                        if (existingP.name !== rawName && rawName !== 'Sin Nombre') { updates.name = rawName; hasChanges = true; }
                        if (existingP.name !== sku) { hasChanges = true; } // deduplication by name/slug
                        if (effectiveBrandId && existingP.brand_id !== effectiveBrandId) { updates.brand_id = effectiveBrandId; hasChanges = true; }
                        if (effectiveCategoryId && existingP.category_id !== effectiveCategoryId) { updates.category_id = effectiveCategoryId; hasChanges = true; }
                        if (existingP.gender !== effectiveGender && effectiveGender) { updates.gender = effectiveGender; hasChanges = true; }

                        // Compare arrays for features
                        const sortedFeaturesExisting = [...(existingP.features || [])].sort().join(',');
                        const sortedFeaturesNew = [...effectiveFeatures].sort().join(',');
                        if (sortedFeaturesExisting !== sortedFeaturesNew && effectiveFeatures.length > 0) { updates.features = effectiveFeatures; hasChanges = true; }

                        // REGLA: El Excel actualiza el "Precio Anterior" (Referencia), 
                        // pero NO debe cambiar el "Precio de Oferta" (lo que se cobra).
                        if (price > 0 && Math.abs((existingP.price || 0) - price) > 0.01) {
                            const currentSelling = existingP.sale_price || existingP.price;

                            updates.price = price;
                            // Si el producto ya tiene un precio asignado, mantenemos el precio de venta actual como oferta
                            if (currentSelling > 0) {
                                updates.sale_price = currentSelling;
                            }
                            hasChanges = true;
                        }
                        // Actualizar cost_price si cambió
                        if (newCost > 0 && Math.abs((existingP.cost_price || 0) - newCost) > 0.01) { updates.cost_price = newCost; hasChanges = true; }

                        // Actualizar SKU si cambió
                        if (rawSku && existingP.sku !== rawSku) { updates.sku = rawSku; hasChanges = true; }

                        // Solo cambiar visibilidad si el Excel lo indica explícitamente (columna PUBLICADO con valor)
                        if (hasPublishedColumn && existingP.is_published !== isPublished) { updates.is_published = isPublished; hasChanges = true; }

                        if (hasChanges) {
                            productsToUpsert.push(updates);
                        }
                    } else {
                        // Producto NUEVO
                        productsToUpsert.push({
                            name: rawName,
                            slug: `${sku}-${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.substring(0, 100),
                            sku: rawSku || null,
                            brand_id: effectiveBrandId,
                            category_id: effectiveCategoryId,
                            gender: effectiveGender,
                            features: effectiveFeatures,
                            price: price,
                            cost_price: newCost || null,
                            is_published: isPublished,
                            is_active: true
                        });
                    }

                    rowsWithProducts.push({ row, sku, rawName })
                }

                // Collect all new seasons from Excel and save them to site_settings
                const excelSeasons = [...new Set(data.map(row => 
                    (row['TEMPORADA'] || row['Temporada'] || row['season'] || '').toString().trim()
                ).filter(Boolean))];
                
                if (excelSeasons.length > 0) {
                    const currentSeasons = await getSeasons();
                    const mergedSeasons = [...new Set([...currentSeasons, ...excelSeasons])].sort();
                    if (mergedSeasons.length > currentSeasons.length) {
                        await updateSiteSetting('product_seasons', JSON.stringify(mergedSeasons));
                        console.log('Nuevas temporadas agregadas desde Excel:', excelSeasons);
                    }
                }

                if (productsToUpsert.length === 0 && data.length > 0) {
                    console.log('No detectaron cambios en la data de los productos, comprobaremos el stock.');
                }


                // 1. Deduplicar Productos por slug
                const uniqueProductsMap = new Map();
                productsToUpsert.forEach(p => {
                    const key = (p.slug || p.name || '').toUpperCase().trim();
                    uniqueProductsMap.set(key, p);
                });
                const finalProductsToUpsert = Array.from(uniqueProductsMap.values());

                // Separar Creación de Actualización
                const toCreate = finalProductsToUpsert.filter(p => !p.id);
                const toUpdate = finalProductsToUpsert.filter(p => !!p.id);

                // Rescatar productos en toCreate cuyo slug ya existe en DB → moverlos a toUpdate con su id real
                // Esto sucede cuando el lookup falla por colisión de claves pero el producto sí existe
                const slugLookup = {};
                allLatestProducts.forEach(p => { if (p.slug) slugLookup[p.slug] = p; });

                const rescuedToUpdate = [];
                const trueToCreate = toCreate.filter(p => {
                    const existing = p.slug ? slugLookup[p.slug] : null;
                    if (existing) {
                        rescuedToUpdate.push({ ...p, id: existing.id });
                        return false;
                    }
                    return true;
                });

                // Rescate adicional por SKU: cubre casos donde productLookup no encontró el producto
                // (ej: el slug en DB difiere del slug generado, colisiones de clave, etc.)
                const skuDirectLookup = {};
                allLatestProducts.forEach(p => {
                    if (p.sku) skuDirectLookup[p.sku.toUpperCase().trim()] = p;
                    if (p.code) {
                        const ck = p.code.toUpperCase().trim();
                        if (!skuDirectLookup[ck]) skuDirectLookup[ck] = p;
                    }
                });

                const rescuedBySkuToUpdate = [];
                let pendingCreate = trueToCreate.filter(p => {
                    const key = (p.sku || '').toUpperCase().trim();
                    if (!key) return true;
                    const existing = skuDirectLookup[key];
                    if (existing) {
                        rescuedBySkuToUpdate.push({ ...p, id: existing.id, slug: existing.slug });
                        return false;
                    }
                    return true;
                });

                // ULTRA-RESCUE: Consultar la DB directamente por los SKUs que siguen sin ID.
                // Esto garantiza que aunque allLatestProducts estuviera incompleto, no creamos duplicados.
                if (pendingCreate.length > 0) {
                    const skusToVerify = [...new Set(pendingCreate.map(p => (p.sku || '').trim()).filter(Boolean))];
                    const ultraFoundMap = {};
                    const batchSize = 100;
                    for (let bi = 0; bi < skusToVerify.length; bi += batchSize) {
                        const batch = skusToVerify.slice(bi, bi + batchSize);
                        const { data: bySkuRows } = await supabase.from('products').select('id,sku,code,slug').in('sku', batch);
                        const { data: byCodeRows } = await supabase.from('products').select('id,sku,code,slug').in('code', batch);
                        [...(bySkuRows || []), ...(byCodeRows || [])].forEach(p => {
                            if (p.sku && !ultraFoundMap[p.sku.toUpperCase().trim()]) ultraFoundMap[p.sku.toUpperCase().trim()] = p;
                            if (p.code && !ultraFoundMap[p.code.toUpperCase().trim()]) ultraFoundMap[p.code.toUpperCase().trim()] = p;
                        });
                    }
                    const ultraRescued = [];
                    pendingCreate = pendingCreate.filter(p => {
                        const key = (p.sku || '').toUpperCase().trim();
                        const found = ultraFoundMap[key];
                        if (found) {
                            ultraRescued.push({ ...p, id: found.id, slug: found.slug });
                            return false;
                        }
                        return true;
                    });
                    if (ultraRescued.length > 0) {
                        console.warn(`⚠️ Ultra-rescatados (no estaban en caché local): ${ultraRescued.map(p => p.sku).join(', ')}`);
                        rescuedBySkuToUpdate.push(...ultraRescued);
                    }
                }

                const allToUpdate = [...toUpdate, ...rescuedToUpdate, ...rescuedBySkuToUpdate];
                const finalTrueToCreate = pendingCreate;

                console.log(`📦 Procesando: ${finalTrueToCreate.length} nuevos, ${toUpdate.length} actualizados, ${rescuedToUpdate.length + rescuedBySkuToUpdate.length} rescatados`);
                if (finalTrueToCreate.length > 0) {
                    console.log('🆕 Nuevos productos a crear:', finalTrueToCreate.map(p => p.sku).join(', '));
                }

                const savedProducts = [];
                const productChunkSize = 100;

                // Procesar Actualizaciones — usar onConflict:'id' para garantizar UPDATE, no INSERT
                for (let i = 0; i < allToUpdate.length; i += productChunkSize) {
                    const chunk = allToUpdate.slice(i, i + productChunkSize);
                    try {
                        const savedChunk = await batchUpsertProducts(chunk, 'id');
                        savedProducts.push(...savedChunk);
                    } catch (e) {
                        throw new Error(`[Actualizar productos] ${e.message} | SKUs: ${chunk.map(p => p.sku).join(', ')}`);
                    }
                }

                // Procesar Verdaderos Nuevos — usar onConflict:'slug' para evitar duplicados de slug
                for (let i = 0; i < finalTrueToCreate.length; i += productChunkSize) {
                    const chunk = finalTrueToCreate.slice(i, i + productChunkSize);
                    try {
                        const savedChunk = await batchUpsertProducts(chunk, 'slug');
                        savedProducts.push(...savedChunk);
                    } catch (e) {
                        throw new Error(`[Crear productos] ${e.message} | SKUs: ${chunk.map(p => p.sku).join(', ')}`);
                    }
                }

                const createdCount = finalTrueToCreate.length;
                const updatedCount = allToUpdate.length;

                // Actualizar lookup con los productos guardados (ahora tienen ID si eran nuevos)
                const finalProductLookup = {}
                savedProducts.forEach(p => {
                    if (p.sku) finalProductLookup[p.sku.toUpperCase()] = p
                    if (p.name) finalProductLookup[p.name.toUpperCase()] = p
                })

                // 3. Prepare Variants (Deduplicadas)
                const variantsMap = new Map();
                rowsWithProducts.forEach(({ row, sku, rawName }) => {
                    const skuClean = sku.replace(/^0+/, '') || sku;
                    const prod = finalProductLookup[sku.toUpperCase()] || finalProductLookup[skuClean.toUpperCase()];
                    if (!prod) return

                    const sizeType = parseInt(row['TIPO TALLE'] || prod.size_type)
                    const color = (row.COLOR || '').toString().trim() || '-'

                    // Buscar variantes existentes en el estado inicial para obtener IDs
                    const existingP = productLookup[sku.toUpperCase()] || productLookup[skuClean.toUpperCase()]
                    const existingVariants = existingP?.variants || []

                    const addVariantToMap = (size, stock) => {
                        const vKey = `${prod.id}|${size.toLowerCase()}|${color.toLowerCase()}`;
                        const existingV = existingVariants.find(v =>
                            v.size.toLowerCase() === size.toLowerCase() &&
                            v.color.toLowerCase() === color.toLowerCase()
                        );

                        const vPayload = {
                            product_id: prod.id,
                            size,
                            color,
                            stock,
                            color_code: COLOR_MAP[color.toLowerCase()] || null
                        };

                        if (existingV?.id) {
                            vPayload.id = existingV.id;
                        }

                        variantsMap.set(vKey, vPayload);
                    };

                    if (!isNaN(sizeType) && sizeType >= 1 && sizeType <= 9) {
                        const headers = GLOBAL_SIZE_HEADERS[sizeType - 1]
                        for (let j = 1; j <= 12; j++) {
                            const col = `STOCK_T${j.toString().padStart(2, '0')}`
                            if (row[col] === undefined) continue

                            const stock = parseInt(row[col])
                            const size = headers[j - 1]
                            if (size && !isNaN(stock)) {
                                addVariantToMap(size, stock);
                            }
                        }
                    } else {
                        // Single column format
                        let size = (row.TALLE || row.talle || '').toString().trim()
                        if (size.toUpperCase() === '2X') size = '2XL';
                        const stock = parseInt(row.STOCK || row.stock)
                        if (size && !isNaN(stock)) {
                            addVariantToMap(size, stock);
                        }
                    }
                })

                const finalVariantsToUpsert = Array.from(variantsMap.values());

                // --- SOLUCIÓN: Separar Variantes Nuevas de Existentes ---
                const variantsToCreate = finalVariantsToUpsert.filter(v => !v.id);
                const variantsToUpdate = finalVariantsToUpsert.filter(v => !!v.id);

                console.log(`📦 Sincronizando stock: ${variantsToCreate.length} nuevas y ${variantsToUpdate.length} existentes...`);

                // 4. Upsert Variants in chunks 
                const chunkSize = 500

                // Actualizar existentes
                for (let i = 0; i < variantsToUpdate.length; i += chunkSize) {
                    try {
                        await batchUpsertVariants(variantsToUpdate.slice(i, i + chunkSize))
                    } catch (e) {
                        throw new Error(`[PASO 3 - actualizar variantes] ${e.message}`);
                    }
                }

                // Insertar nuevas
                for (let i = 0; i < variantsToCreate.length; i += chunkSize) {
                    try {
                        await batchUpsertVariants(variantsToCreate.slice(i, i + chunkSize))
                    } catch (e) {
                        throw new Error(`[PASO 4 - crear variantes] ${e.message}`);
                    }
                }

                if (window.confirm(`✅ IMPORTACIÓN EXITOSA\n\n- Productos: ${createdCount} nuevos / ${updatedCount} actualizados\n- Variantes de stock: ${finalVariantsToUpsert.length}\n\n¿Recargar página para ver los cambios?`)) {
                    window.location.reload();
                } else {
                    setRefreshTrigger(p => p + 1);
                }

                // Reset del input para permitir misma selección
                if (target) target.value = '';

            } catch (err) {
                console.error(err)
                alert('❌ Error al procesar: ' + (err.message || 'Error desconocido'))
                if (target) target.value = '';
            } finally {
                setIsImporting(false)
            }
        }
        reader.readAsBinaryString(file)
    }



    const downloadTemplate = () => {
        setIsExporting(true);
        try {
            console.log('Generando plantilla de stock multitalle...');

            const templateData = [];

            products.forEach(product => {
                // Agrupar por color para el formato multitalle
                const colors = [...new Set(product.variants?.map(v => v.color) || ['-'])];

                colors.forEach(color => {
                    const row = {
                        'CODIGO': product.sku || product.code || '',
                        'CODIGO PROVEEDOR': product.provider_sku || '',
                        'DESCRIPCION': product.name,
                        'TEMPORADA': product.season || '',
                        'MARCA': product.brand?.name || '',
                        'PROVEEDOR': product.provider || '',
                        'TIPO TALLE': product.size_type || '',
                        'COLOR': color,
                        'FAMILIA/CATEGORIA': product.category?.name || '',
                        'SUB-FAMILIA': product.sub_family || '',
                        'GENERO': product.gender || '',
                        'COSTO': product.cost_price || 0,
                        'PRECIO': product.price || 0,
                        'PRECIO OFERTA': product.sale_price || 0
                    };

                    // Añadir columnas de stock T01-T12
                    const sizeType = parseInt(product.size_type);
                    const currentSizes = (sizeType >= 1 && sizeType <= 9) ? GLOBAL_SIZE_HEADERS[sizeType - 1] : [];

                    for (let i = 1; i <= 12; i++) {
                        const colName = `STOCK_T${i.toString().padStart(2, '0')}`;
                        const sizeName = currentSizes[i - 1];

                        if (sizeName) {
                            const variant = product.variants?.find(v =>
                                v.color === color && v.size.toLowerCase() === sizeName.toLowerCase()
                            );
                            row[colName] = variant ? variant.stock : 0;
                        } else {
                            row[colName] = '';
                        }
                    }

                    row['OBSERVACION'] = product.observations || '';
                    row['URL'] = product.external_url || '';
                    row['PUBLICADO'] = product.is_published !== false ? 'SI' : 'NO';

                    templateData.push(row);
                });
            });

            if (templateData.length === 0) {
                templateData.push({ 'DESCRIPCION': 'Producto Ejemplo', 'COLOR': 'Negro', 'STOCK_T01': 0 });
            }

            const ws = XLSX.utils.json_to_sheet(templateData);

            // Ajustar anchos
            const colWidths = [
                { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 15 },
                { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
                { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
            ];
            for (let i = 0; i < 12; i++) colWidths.push({ wch: 8 }); // T01-T12
            colWidths.push({ wch: 30 }, { wch: 30 }, { wch: 10 });

            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Stock_Shams");

            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blobData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const fileName = `Plantilla_Stock_Shams_${new Date().toISOString().split('T')[0]}.xlsx`;

            const url = window.URL.createObjectURL(blobData);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error al descargar:', error);
            alert('No se pudo generar la planilla. Intenta de nuevo.');
        } finally {
            setIsExporting(false);
        }
    };

    const getTotalStock = (variants) => variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
    const hasLowStock = (variants) => variants?.some(v => v.stock <= 2) || false

    const filteredProducts = products.filter(p => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (p.name || '').toLowerCase().includes(searchLower) ||
            (p.brand?.name || '').toLowerCase().includes(searchLower) ||
            (p.sku || '').toLowerCase().includes(searchLower) ||
            (p.code || '').toLowerCase().includes(searchLower) ||
            (p.provider_sku || '').toLowerCase().includes(searchLower) ||
            (p.variants || []).some(v => (v.sku || '').toLowerCase().includes(searchLower));

        const currentBrandId = p.brand_id || p.brand?.id;
        const matchesBrand = !selectedBrandId || String(currentBrandId) === String(selectedBrandId);

        const matchesFilter = !filterLow || hasLowStock(p.variants)

        const hasPhoto = p.image_url || p.image_url_2 || p.image_url_3 || p.image_url_4 || (p.images && p.images.length > 0)
        const matchesPhoto = filterPhoto === 'all' ||
            (filterPhoto === 'with' && hasPhoto) ||
            (filterPhoto === 'without' && !hasPhoto)

        const matchesSeason = !selectedSeasons.length || selectedSeasons.includes(p.season);

        return matchesSearch && matchesBrand && matchesFilter && matchesPhoto && matchesSeason
    })

    const totalLowStock = products.filter(p => hasLowStock(p.variants)).length

    if (loading && products.length === 0) {
        return <div className="admin-loading"><Loader className="animate-spin" /> Cargando inventario...</div>
    }

    return (
        <div className={`stock-admin ${isFullscreen ? 'stock-admin--fullscreen' : ''}`}>
            <div className="stock-admin__header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1>Gestión de Inventario (Filtrado)</h1>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="admin-btn admin-btn-secondary"
                            style={{
                                height: '32px',
                                padding: '0 12px',
                                fontSize: '10px',
                                background: isFullscreen ? '#DCDCDC' : 'transparent',
                                color: 'var(--color-text)'
                            }}
                            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Ver en Pantalla Completa'}
                        >
                            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            {isFullscreen ? 'SALIR' : 'PANTALLA COMPLETA'}
                        </button>
                    </div>
                    <p>Sincronización en tiempo real con la tienda</p>
                </div>
                <div className="stock-admin__header-btns">
                    <button
                        onClick={downloadTemplate}
                        className="admin-btn admin-btn-secondary"
                        style={{ gap: '8px' }}
                        disabled={isExporting}
                    >
                        {isExporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                        {isExporting ? 'Exportando...' : 'Descargar Plantilla'}
                    </button>

                    <label
                        className={`admin-btn admin-btn-primary ${isImporting ? 'opacity-50 cursor-wait' : ''}`}
                        style={{ gap: '8px', cursor: isImporting ? 'wait' : 'pointer' }}
                    >
                        {isImporting ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                        {isImporting ? 'Procesando...' : 'SUBIR NUEVA PLANILLA / SINCRONIZAR'}
                        <input
                            type="file"
                            hidden
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                            disabled={isImporting}
                        />
                    </label>
                </div>
            </div>

            {/* SQL HELP BOX */}
            {showSqlHelp && (
                <div className="admin-card" style={{ marginBottom: '2rem', border: '2px solid #3b82f6', background: '#eff6ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={20} /> PASO FINAL: Configurar Permisos en Supabase
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: '#1e40af', marginTop: '0.5rem' }}>
                                Para que la carga de Excel funcione, debés copiar el siguiente código y pegarlo en tu **SQL Editor** de Supabase:
                            </p>
                        </div>
                        <button className="admin-btn admin-btn-secondary" onClick={() => setShowSqlHelp(false)}>Cerrar Ayuda</button>
                    </div>
                    <div style={{ marginTop: '1rem', background: '#1e293b', color: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', fontSize: '12px', maxHeight: '200px', overflowY: 'auto', position: 'relative' }}>
                        <pre id="sql-code">
                            {`-- COPIAR Y PEGAR EN SUPABASE:
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access for admins" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for brands" ON brands FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for categories" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for variants" ON product_variants FOR ALL TO authenticated USING (true);`}
                        </pre>
                        <button
                            className="admin-btn admin-btn-primary"
                            style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', padding: '4px 8px' }}
                            onClick={() => {
                                const code = document.getElementById('sql-code').innerText;
                                navigator.clipboard.writeText(code);
                                alert('¡Código copiado al portapapeles!');
                            }}
                        >
                            Copiar Código
                        </button>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                        1. Entrá a [Supabase](https://supabase.com/dashboard) <br />
                        2. Entrá a tu proyecto y buscá el icono **SQL Editor** a la izquierda. <br />
                        3. Pegá el código de arriba y dale al botón **Run**.
                    </p>
                </div>
            )}

            {/* Warning if low stock */}
            {totalLowStock > 0 && (
                <div className="stock-admin__warning" style={{ margin: '1rem 0', padding: '1rem', borderRadius: '1rem', background: '#fff5f5', border: '1px solid #ffc1c1', color: '#c53030', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertTriangle size={20} />
                    <span style={{ fontWeight: 600 }}>Hay {totalLowStock} productos con artículos casi agotados.</span>
                </div>
            )}

            {/* Filters */}
            <div className="stock-admin__filters">
                <div className="stock-admin__search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar producto o marca..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1 }}
                    />
                </div>

                <div className="stock-admin__photo-filter" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '800' }}>FOTOS:</span>
                    <select
                        className="stock-input"
                        value={filterPhoto}
                        onChange={(e) => setFilterPhoto(e.target.value)}
                        style={{
                            height: '36px',
                            padding: '0 12px',
                            borderRadius: '8px',
                            background: '#fff',
                            border: '2px solid #DCDCDC', // Borde celeste para resaltar
                            color: '#000',
                            minWidth: '130px',
                            fontWeight: 'bold'
                        }}
                    >
                        <option value="all">Ver Todos</option>
                        <option value="with">Con Foto ✅</option>
                        <option value="without">Sin Foto ❌</option>
                    </select>
                </div>

                <div className="stock-admin__brand-filter" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '800' }}>MARCA:</span>
                    <select
                        className="stock-input"
                        value={selectedBrandId}
                        onChange={(e) => setSelectedBrandId(e.target.value)}
                        style={{
                            height: '36px',
                            padding: '0 12px',
                            borderRadius: '8px',
                            background: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#000',
                            minWidth: '150px'
                        }}
                    >
                        <option value="">Todas las marcas</option>
                        {brands.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
                <label className="stock-admin__filter-low" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input
                        type="checkbox"
                        checked={filterLow}
                        onChange={(e) => setFilterLow(e.target.checked)}
                    />
                    Solo bajo stock
                </label>
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

            {/* Stock List - SpreadSheet View */}
            <div className="stock-spreadsheet-container">
                <table className="admin-table spreadsheet-table">
                    <thead>
                        <tr style={{ background: '#111' }}>
                            <th style={{ padding: '8px 4px', textAlign: 'left', minWidth: '70px', fontSize: '10px' }}> SKU</th>
                            <th style={{ padding: '8px 4px', textAlign: 'left', minWidth: '80px', fontSize: '10px' }}>C. FAB</th>
                            <th style={{ padding: '8px 4px', textAlign: 'left', minWidth: '180px', fontSize: '10px' }}>PRODUCTO</th>
                            <th style={{ padding: '8px 4px', textAlign: 'left', minWidth: '100px', fontSize: '10px' }}>MARCA</th>
                            <th style={{ padding: '8px 4px', textAlign: 'left', minWidth: '80px', fontSize: '10px' }}>PRECIO</th>
                            <th style={{ padding: '8px 4px', textAlign: 'left', minWidth: '80px', fontSize: '10px' }}>COLOR</th>
                            <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: '10px' }}>T.T.</th>
                            {/* Columnas de Talles dinámicas */}
                            {[...Array(12).keys()].map(i => (
                                <th key={i} style={{ padding: '4px', textAlign: 'center', fontSize: '9px', background: '#222', minWidth: '35px' }}>T{i + 1}</th>
                            ))}
                            <th style={{ padding: '8px 4px', textAlign: 'right', background: '#1a1a1a', minWidth: '60px', fontSize: '10px' }}>TOTAL</th>
                            <th style={{ padding: '8px 4px', textAlign: 'center', width: '40px', fontSize: '10px' }}>X</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.slice(0, visibleCount).map((product) => {
                            const variantsByColor = (product.variants || []).reduce((acc, v) => {
                                const colorKey = v.color || '-';
                                if (!acc[colorKey]) acc[colorKey] = [];
                                acc[colorKey].push(v);
                                return acc;
                            }, {});

                            const colors = Object.keys(variantsByColor);
                            if (colors.length === 0) colors.push('-');

                            return colors.map((color, colorIdx) => {
                                const colorVariants = variantsByColor[color] || [];
                                const totalColorStock = colorVariants.reduce((sum, v) => sum + v.stock, 0);
                                const sizeType = parseInt(product.size_type);

                                return (
                                    <tr key={`${product.id}-${color}`} style={{ borderBottom: '1px solid #222' }}>
                                        {colorIdx === 0 ? (
                                            <>
                                                <td style={{ padding: '2px 4px' }}>
                                                    <input
                                                        className="stock-input"
                                                        style={{ width: '100%', textAlign: 'left', height: '22px', fontSize: '10px' }}
                                                        value={product.sku || product.code || ''}
                                                        onChange={(e) => handleUpdateProduct(product.id, 'sku', e.target.value)}
                                                    />
                                                </td>
                                                <td style={{ padding: '2px 4px' }}>
                                                    <input
                                                        className="stock-input"
                                                        style={{ width: '100%', textAlign: 'left', height: '22px', fontSize: '10px', color: '#DCDCDC' }}
                                                        value={product.provider_sku || ''}
                                                        onChange={(e) => handleUpdateProduct(product.id, 'provider_sku', e.target.value)}
                                                    />
                                                </td>
                                                <td style={{ padding: '2px 4px' }}>
                                                    <input
                                                        className="stock-input"
                                                        style={{ width: '100%', textAlign: 'left', fontWeight: 600, height: '22px', fontSize: '10px' }}
                                                        value={product.name}
                                                        onChange={(e) => handleUpdateProduct(product.id, 'name', e.target.value)}
                                                    />
                                                </td>
                                                <td style={{ padding: '2px 4px' }}>
                                                    <select
                                                        className="stock-input"
                                                        style={{ width: '100%', textAlign: 'left', height: '22px', fontSize: '10px' }}
                                                        value={product.brand?.id || ''}
                                                        onChange={(e) => handleUpdateProduct(product.id, 'brandId', e.target.value)}
                                                    >
                                                        <option value="">Marca...</option>
                                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                    </select>
                                                </td>
                                                <td style={{ padding: '2px 4px' }}>
                                                    <input
                                                        type="number"
                                                        className="stock-input"
                                                        style={{ width: '100%', textAlign: 'right', fontWeight: 700, color: '#DCDCDC', height: '22px', fontSize: '10px' }}
                                                        value={product.price || 0}
                                                        onChange={(e) => handleUpdateProduct(product.id, 'price', e.target.value)}
                                                    />
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td colSpan="4" style={{ background: 'rgba(255,255,255,0.01)' }}></td>
                                            </>
                                        )}
                                        <td style={{ padding: '2px 4px', borderLeft: '1px solid #222' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR_MAP[color.toLowerCase()] || '#444' }} />
                                                {color.substring(0, 10)}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', color: '#DCDCDC', fontWeight: 700, fontSize: '10px' }}>{product.size_type || '-'}</td>

                                        {[...Array(12).keys()].map(i => {
                                            const sizeName = (sizeType >= 1 && sizeType <= 8) ? GLOBAL_SIZE_HEADERS[sizeType - 1][i] : null;
                                            const variant = sizeName ? colorVariants.find(cv => cv.size.toLowerCase() === sizeName.toLowerCase()) : null;

                                            if (!sizeName && (sizeType >= 1 && sizeType <= 8)) return <td key={i} style={{ background: '#050505' }}></td>;

                                            return (
                                                <td key={i} style={{ padding: '1px', textAlign: 'center' }}>
                                                    {variant ? (
                                                        <input
                                                            type="number"
                                                            className="stock-input"
                                                            style={{ width: '32px', height: '22px', fontSize: '10px', padding: '0', border: '1px solid #333' }}
                                                            value={variant.stock}
                                                            onChange={(e) => handleUpdateStock(variant.id, parseInt(e.target.value) || 0)}
                                                        />
                                                    ) : (
                                                        <span style={{ color: '#222', fontSize: '9px' }}>-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 800, fontSize: '10px', color: totalColorStock > 0 ? '#22c55e' : '#666' }}>
                                            {totalColorStock}
                                        </td>
                                        <td style={{ padding: '1px', textAlign: 'center' }}>
                                            {colorIdx === 0 && (
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                                    className="admin-btn-danger"
                                                    style={{ width: '22px', height: '22px', padding: 0, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="X"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
                {visibleCount < filteredProducts.length && (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <button className="admin-btn admin-btn-secondary" onClick={() => setVisibleCount(prev => prev + 50)}>
                            Cargar más productos ({filteredProducts.length - visibleCount} restantes)
                        </button>
                    </div>
                )}
            </div>
        </div >
    )
}
