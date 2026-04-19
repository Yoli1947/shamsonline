
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BrandMarquee from './components/BrandMarquee';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import FavoritesDrawer from './components/FavoritesDrawer';
import ProductDetail from './components/ProductDetail';
// import { PRODUCTS } from './constants'; // Removed static products
// ... (previous imports)
import { getAllProducts, getBrands, getCategories, getLastSyncDate, getProductBySku } from './lib/admin'; // Import DB function
import { supabase } from './lib/supabase';
import { createOrder } from './lib/orders';
import { Product, CartItem } from './types';
import { Filter, Loader, X, Ruler, Trash2, Tag, Search, Users, Mail, Phone, MapPin, HelpCircle, ShoppingBag, Instagram, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import CheckoutModal from './components/CheckoutModal';
import CustomerAuthModal from './components/CustomerAuthModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import { SIZE_ORDER, sortSizes } from './lib/constants';
import NewsletterModal from './components/NewsletterModal';
import { useAuth } from './context/AuthContext';
import { useSettings } from './context/SettingsContext';
import StoreLocationsModal from './components/StoreLocationsModal';

// Categorías que no deben aparecer en navegación, filtros ni en la grilla general
// Categorías que no deben aparecer en navegación, filtros ni en la grilla general (Antiguo, ahora se usa el campo is_active de la DB)
const EXCLUDED_CATS: string[] = ['cafeteria', 'cafetería'];

const Store: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [customer, setCustomer] = useState<{ email: string; name: string } | null>(null);
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [isLocationsOpen, setIsLocationsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { sku: skuParam } = useParams<{ sku?: string }>();
    const { settings } = useSettings();

    const openProduct = (product: Product) => {
        setSelectedProduct(product);
        if (product.sku) {
            navigate(`/producto/${product.sku}`, { replace: true });
        }
    };

    const closeProduct = () => {
        setSelectedProduct(null);
        navigate('/', { replace: true });
    };

    useEffect(() => {
        try {
            const storedFavorites = localStorage.getItem('shams_favorites');
            if (storedFavorites) {
                setFavorites(JSON.parse(storedFavorites));
            }
            const storedCustomer = localStorage.getItem('shams_customer');
            if (storedCustomer) {
                setCustomer(JSON.parse(storedCustomer));
            }
        } catch (e) {
            console.error('Failed to load favorites', e);
        }
    }, []);

    const toggleFavorite = (productId: string) => {
        setFavorites(prev => {
            const next = prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId];
            try {
                localStorage.setItem('shams_favorites', JSON.stringify(next));
            } catch (e) {
                console.error('Failed to save favorites', e);
            }
            return next;
        });
    };

    // Filtros sincronizados con la URL
    const selectedBrand = searchParams.get('marca');
    const selectedGender = searchParams.get('genero');
    const selectedCategory = searchParams.get('categoria');
    const selectedOrder = searchParams.get('orden');

    const brandsScrollRef = useRef<HTMLDivElement>(null);
    const [brandsScrollPos, setBrandsScrollPos] = useState(0);

    const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
    const [isSizeFilterOpen, setIsSizeFilterOpen] = useState(false);
    const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
    const [isGenderFilterOpen, setIsGenderFilterOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [isOrderFilterOpen, setIsOrderFilterOpen] = useState(false);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [footerEmail, setFooterEmail] = useState('');
    const [footerSubStatus, setFooterSubStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [successOrderData, setSuccessOrderData] = useState<{
        order: any;
        bankDetails: any;
        whatsappNumber: string;
        whatsappMsg: string;
    } | null>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [brands, setBrands] = useState<any[]>([]);

    const [categoriesByGender, setCategoriesByGender] = useState<{ Mujer: any[], Hombre: any[] }>({ Mujer: [], Hombre: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Función auxiliar para mapear base de datos a UI
    const mapProductsToUI = (dbProducts: any[]) => {
        const cleanProductName = (name: string) => {
            if (!name) return 'Sin Nombre';
            let cleaned = name;
            cleaned = cleaned.replace(/\s*\d+X\d+\s*/gi, ' ');
            cleaned = cleaned.replace(/\bPROMO\b|\bPROMOCIÓN\b|\bPROMOCION\b/gi, ' ');
            cleaned = cleaned.replace(/\s*[\(\[]\s*([a-z0-9]{1,4})\s*[\)\]]\s*/gi, ' ');
            return cleaned.replace(/\s+/g, ' ').trim();
        };

        const mapped = dbProducts.map((p: any) => {
            const GENDER_VALUES = ['Mujer', 'Hombre', 'Unisex'];
            let features = p.features || [];
            if (p.gender) {
                // Si tiene género en DB, reemplazar cualquier género viejo en features
                features = features.filter((f: string) => !GENDER_VALUES.includes(f));
                const normalizedGender = p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase();
                features.push(normalizedGender);
            }
            // Si gender es null, conservar el género que ya estaba en features

            const galleryImages: any[] = [];
            if (p.images && p.images.length > 0) {
                p.images.forEach((img: any) => galleryImages.push({ url: img.url, color: img.alt_text || 'Principal' }));
            }

            const legacyUrls = [p.image_url, p.image_url_2, p.image_url_3, p.image_url_4].filter(Boolean);
            legacyUrls.forEach(url => {
                if (!galleryImages.some(gi => gi.url === url)) {
                    galleryImages.push({ url, color: 'Principal' });
                }
            });

            return {
                id: p.id,
                name: cleanProductName(p.name),
                brand: p.brand?.name || 'SHAMS',
                price: p.sale_price && p.sale_price < p.price ? p.sale_price : p.price,
                originalPrice: p.price,
                image: galleryImages[0]?.url || 'https://via.placeholder.com/400x500?text=No+Image',
                images: galleryImages.map(gi => gi.url),
                imageObjects: galleryImages,
                category: p.category?.name || 'General',
                description: p.description || '',
                features: features,
                variants: p.variants,
                is_published: p.is_published,
                is_active: p.is_active,
                sort_order: p.sort_order,
                brandCardUrl: p.brand?.card_image_url,
                is_featured: p.is_featured,
                sku: p.sku || null
            };
        });

        return mapped.sort((a, b) => {
            const sortA = a.sort_order || 99999;
            const sortB = b.sort_order || 99999;
            if (sortA !== sortB) {
                return sortA - sortB;
            }
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
        });
    };

    const [isProductDeepLinkLoading, setIsProductDeepLinkLoading] = useState(!!skuParam);

    // Deep-linking: Handle deep links when SKU is in URL (instant load)
    useEffect(() => {
        if (!skuParam) {
            setIsProductDeepLinkLoading(false);
            return;
        }
        
        // Si ya está cargado en el catálogo global (por ejemplo, desde caché), lo usamos de ahí
        if (products.length > 0) {
            const foundInCatalog = products.find(p => p.sku === skuParam);
            if (foundInCatalog) {
                console.log("Direct-link: Encontrado en catálogo local/caché", skuParam);
                setSelectedProduct(foundInCatalog);
                setIsProductDeepLinkLoading(false);
                return;
            }
        }

        // Si no está, lo buscamos específicamente por SKU de forma inmediata
        async function fetchDeepLinkedProduct() {
            console.log("Direct-link: Iniciando búsqueda en base de datos para SKU:", skuParam);
            setIsProductDeepLinkLoading(true);
            try {
                const dbProd = await getProductBySku(skuParam!);
                if (dbProd) {
                    console.log("Direct-link: Producto encontrado en DB:", dbProd.name);
                    const mapped = mapProductsToUI([dbProd]);
                    const productToInject = mapped[0];

                    // Validar que no sea un producto de prueba
                    const isTestProduct = productToInject.name?.toLowerCase().includes('prueba') || productToInject.name?.toLowerCase().includes('test');
                    if (isTestProduct) {
                        console.warn("Direct-link: Intento de acceder a producto de prueba bloqueado.");
                        navigate('/', { replace: true });
                        setIsProductDeepLinkLoading(false);
                        return;
                    }

                    setSelectedProduct(productToInject);

                    
                    // Inyectar el producto en el estado global para que no aparezca "vacío" el fondo
                    setProducts(prev => {
                        if (prev.some(p => p.id === productToInject.id)) return prev;
                        return [productToInject, ...prev];
                    });
                } else {
                    console.warn("Direct-link: Producto no encontrado en DB para SKU:", skuParam);
                    // Si no existe, limpiamos la URL y dejamos que cargue la tienda normalmente
                    navigate('/', { replace: true });
                }
            } catch (err) {
                console.error("Direct-link: Error fetching product:", err);
            } finally {
                setIsProductDeepLinkLoading(false);
            }
        }

        fetchDeepLinkedProduct();
    }, [skuParam]); // SÓLO depende de skuParam para evitar bucles al inyectar productos

    // Load products, brands and categories from Supabase
    useEffect(() => {
        let isMounted = true;
        const timeout = setTimeout(() => {
            if (isMounted && loading) {
                console.warn("Store: [TIMEOUT] Carga lenta detectada.");
                setError(null); // No mostramos error, dejamos que siga intentando o use caché
                setLoading(false);
            }
        }, 8000); // 8s margin (much shorter)

        async function fetchRemainingData(offset = 20, lastSyncTs = 0) {
            if (!isMounted) return;
            try {
                // Traemos los productos en lotes más pequeños para evitar AbortError
                const CHUNK_SIZE = 100;
                let currentOffset = offset;
                let hasMore = true;

                while (hasMore && isMounted) {
                    console.log(`Cargando lote de productos: ${currentOffset} a ${currentOffset + CHUNK_SIZE}...`);
                    const { products: chunk, count } = await getAllProducts(1, CHUNK_SIZE, '', currentOffset, true, lastSyncTs);

                    if (!chunk || chunk.length === 0) {
                        hasMore = false;
                        break;
                    }

                    const mappedChunk = mapProductsToUI(chunk);
                    setProducts(prev => {
                        const prevMap = new Map(prev.map(p => [p.id, p]));
                        let changed = false;
                        const updated = prev.map(p => {
                            const fresh = mappedChunk.find(x => x.id === p.id);
                            if (fresh && (fresh.is_featured !== p.is_featured || fresh.sort_order !== p.sort_order)) {
                                changed = true;
                                return fresh;
                            }
                            return p;
                        });
                        const newOnes = mappedChunk.filter(p => !prevMap.has(p.id));
                        if (newOnes.length > 0) { changed = true; updated.push(...newOnes); }
                        return changed ? updated : prev;
                    });

                    currentOffset += CHUNK_SIZE;
                    if (count && currentOffset >= count) hasMore = false;

                    // Pequeño respiro para el navegador
                    await new Promise(r => setTimeout(r, 100));
                }
                console.log("Carga completa del catálogo finalizada.");

                // Actualizar caché al final del barrido completo
                setProducts(current => {
                    try { localStorage.setItem('shams_products_v13', JSON.stringify(current)); localStorage.setItem('shams_cache_ts_v5', Date.now().toString()); } catch {}
                    return current;
                });

            } catch (error) {
                console.error('Error fetching background data:', error);
            }
        }

        async function fetchInitialData(retries = 3) {
            if (!isMounted) return;

            // Limpiar versiones viejas del caché para liberar espacio
            ['v1','v2','v3','v4','v5','v6'].forEach(v => {
                localStorage.removeItem(`shams_products_${v}`);
                localStorage.removeItem(`shams_cache_ts_${v}`);
            });

            try {
                setLoading(true);

                const CACHE_TTL = 15 * 60 * 1000;

                // Mostrar caché INMEDIATAMENTE sin esperar red
                try {
                    const cachedTs = localStorage.getItem('shams_cache_ts_v5');
                    const cachedTsNum = cachedTs ? parseInt(cachedTs) : 0;
                    const cachedProducts = JSON.parse(localStorage.getItem('shams_products_v13') || '[]');
                    const cachedBrands = JSON.parse(localStorage.getItem('shams_brands_v4') || '[]');
                    const cachedCategories = JSON.parse(localStorage.getItem('shams_categories_v4') || '[]');

                    if (cachedProducts.length > 0) {
                        setBrands(cachedBrands);
                        const mujerParent = cachedCategories.find((c: any) => c.name === 'MUJER');
                        const hombreParent = cachedCategories.find((c: any) => c.name === 'HOMBRE');
                        setCategoriesByGender({
                            Mujer: cachedCategories.filter((c: any) => c.parent_id === mujerParent?.id),
                            Hombre: cachedCategories.filter((c: any) => c.parent_id === hombreParent?.id)
                        });
                        setAvailableCategories(Array.from(new Set(cachedCategories.filter((c: any) => c.parent_id !== null).map((c: any) => c.name))));
                        setProducts(cachedProducts);
                        setLoading(false);
                        clearTimeout(timeout);

                        // Validar en background si el caché sigue vigente
                        if ((Date.now() - cachedTsNum) < CACHE_TTL) {
                            const lastSyncStr = await getLastSyncDate();
                            const lastSyncTs = lastSyncStr ? (isNaN(Number(lastSyncStr)) ? new Date(lastSyncStr).getTime() : parseInt(lastSyncStr)) : 0;
                            if (cachedTsNum >= lastSyncTs) {
                                setTimeout(() => fetchRemainingData(0, lastSyncTs), 1000);
                                return;
                            }
                        }
                        // Caché viejo: recargar en background silencioso
                        const lastSyncStr2 = await getLastSyncDate();
                        const lastSyncTs2 = lastSyncStr2 ? (isNaN(Number(lastSyncStr2)) ? new Date(lastSyncStr2).getTime() : parseInt(lastSyncStr2)) : 0;
                        setTimeout(() => fetchRemainingData(0, lastSyncTs2), 100);
                        return;
                    }
                } catch (e) {
                    console.warn('Error reading cache:', e);
                }

                // Sin caché: cargar desde red
                const lastSyncStr = await getLastSyncDate();
                const lastSyncTs = lastSyncStr ? (isNaN(Number(lastSyncStr)) ? new Date(lastSyncStr).getTime() : parseInt(lastSyncStr)) : 0;

                const [productsRes, brandsRes, categoriesRes] = await Promise.all([
                    getAllProducts(1, 40, '', 0, true, lastSyncTs),
                    getBrands(lastSyncTs),
                    getCategories(lastSyncTs)
                ]);

                const dbProducts = productsRes.products || [];
                const dbBrands = brandsRes || [];
                const dbCategories = categoriesRes || [];

                if (!isMounted) return;

                setBrands(dbBrands);
                const mujerParent = dbCategories.find((c: any) => c.name === 'MUJER');
                const hombreParent = dbCategories.find((c: any) => c.name === 'HOMBRE');

                setCategoriesByGender({
                    Mujer: dbCategories.filter((c: any) => c.parent_id === mujerParent?.id && !EXCLUDED_CATS.includes(c.name?.toLowerCase().trim())),
                    Hombre: dbCategories.filter((c: any) => c.parent_id === hombreParent?.id && !EXCLUDED_CATS.includes(c.name?.toLowerCase().trim()))
                });

                const allCategories = Array.from(new Set(dbCategories.filter((c: any) => c.parent_id !== null && !EXCLUDED_CATS.includes(c.name?.toLowerCase().trim())).map((c: any) => c.name?.trim()))).filter(Boolean) as string[];
                setAvailableCategories(allCategories);

                const sortedProducts = mapProductsToUI(dbProducts);
                setProducts(sortedProducts);
                
                try {
                    localStorage.setItem('shams_products_v13', JSON.stringify(sortedProducts));
                    localStorage.setItem('shams_brands_v4', JSON.stringify(dbBrands));
                    localStorage.setItem('shams_categories_v4', JSON.stringify(dbCategories));
                    localStorage.setItem('shams_cache_ts_v5', Date.now().toString());
                } catch {}

                setLoading(false);
                clearTimeout(timeout);
                setTimeout(() => fetchRemainingData(20, lastSyncTs), 500);

            } catch (error: any) {
                console.error('Error fetching data:', error);
                if (isMounted) setError(error.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchInitialData();
        return () => { isMounted = false; clearTimeout(timeout); };
    }, []);

    // Scroll al inicio cuando cambian los filtros principales
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [selectedCategory, selectedBrand, selectedGender]);

    // Handle openFilter URL parameter (from Navbar or other links)
    useEffect(() => {
        const openFilter = searchParams.get('openFilter');
        if (openFilter === 'categoria') {
            setIsCategoryFilterOpen(true);
            setIsBrandFilterOpen(false);
            setIsSizeFilterOpen(false);
            setIsGenderFilterOpen(false);
            setIsOrderFilterOpen(false);
            
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('openFilter');
            navigate(`/?${newParams.toString()}#new`, { replace: true });
        }
    }, [searchParams, navigate]);

    // Extract available sizes from products - Filtered by current gender selection
    useEffect(() => {
        if (products.length > 0) {
            const sizes = new Set<string>();

            // Filter products to extract sizes only from the current gender if one is selected
            const relevantProducts = products.filter(p =>
                !selectedGender ||
                p.features?.includes(selectedGender) ||
                p.features?.some(f => f?.toLowerCase() === selectedGender?.toLowerCase())
            );

            relevantProducts.forEach(p => {
                p.variants?.forEach(v => {
                    if (v.stock > 0 && v.size) {
                        sizes.add(v.size.toUpperCase().trim());
                    }
                });
            });

            const sortedSizes = Array.from(sizes).sort(sortSizes);
            setAvailableSizes(sortedSizes);
        }
    }, [products, selectedGender]);

    // Calculate available genders for the selected brand
    const availableGendersForBrand = React.useMemo(() => {
        if (!selectedBrand) return ['Hombre', 'Mujer', 'Unisex'];

        const genders = new Set<string>();
        products.forEach(p => {
            if (p.brand?.toLowerCase() === selectedBrand.toLowerCase()) {
                if (p.features?.includes('Mujer')) genders.add('Mujer');
                if (p.features?.includes('Hombre')) genders.add('Hombre');
                if (p.features?.includes('Unisex')) genders.add('Unisex');
            }
        });

        if (genders.size === 0) return ['Hombre', 'Mujer', 'Unisex'];

        return ['Hombre', 'Mujer', 'Unisex'].filter(g => genders.has(g));
    }, [products, selectedBrand]);

    const addToCart = (product: Product, size?: string, color?: string) => {
        const variant = product.variants?.find(v =>
            (size ? v.size === size : true) &&
            (color ? v.color === color : true)
        ) || product.variants?.[0];

        // Find the image that matches the selected color
        const colorImage = color && product.imageObjects?.find(
            img => img.color?.trim().toLowerCase() === color.trim().toLowerCase()
        )?.url;

        setCart(prev => {
            const existing = prev.find(item =>
                item.id === product.id &&
                item.selectedSize === size &&
                item.selectedColor === color
            );

            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && item.selectedSize === size && item.selectedColor === color)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            const creditPrice = (product.originalPrice > product.price) ? product.originalPrice : product.price;

            return [...prev, {
                ...product,
                price: creditPrice,
                image: colorImage || product.image, // Use color-specific image if found
                quantity: 1,
                selectedSize: size || variant?.size,
                selectedColor: color || variant?.color,
                selectedColorCode: variant?.color_code,
                variantId: variant?.id
            }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id: string, size?: string, color?: string) => {
        setCart(prev => prev.filter(item =>
            !(item.id === id && item.selectedSize === size && item.selectedColor === color)
        ));
    };

    const updateQuantity = (id: string, delta: number, size?: string, color?: string) => {
        setCart(prev => prev.map(item => {
            if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleFooterSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!footerEmail || footerSubStatus !== 'idle') return;
        setFooterSubStatus('loading');
        try {
            await supabase.from('newsletter_subscribers').insert({ email: footerEmail });
            await supabase.functions.invoke('send-welcome-email', {
                body: { email: footerEmail }
            });
        } catch (_) { /* Si falla o no existe tabla, igual mostramos éxito visualmente */ }
        localStorage.setItem('shams_promo_10', 'true');
        localStorage.setItem('shams_newsletter_v8', 'true');
        setFooterSubStatus('success');
    };

    const decrementLocalStock = (purchasedItems: any[]) => {
        setProducts(prev => prev.map(p => {
            const bought = purchasedItems.find(i => i.productId === p.id);
            if (!bought) return p;
            return {
                ...p,
                variants: p.variants?.map((v: any) =>
                    v.id === bought.variantId
                        ? { ...v, stock: Math.max(0, (v.stock || 0) - bought.quantity) }
                        : v
                )
            };
        }));
    };

    const handleCheckoutConfirm = async (formData: any) => {
        try {
            const hasPromo = localStorage.getItem('shams_promo_10') === 'true' && !formData.promoAlreadyUsed;
            const orderItems = cart.map(item => ({
                productId: item.id,
                variantId: item.variantId,
                name: item.name,
                brand: item.brand,
                image: item.image,
                price: item.price,
                quantity: item.quantity,
                size: item.selectedSize || 'U',
                color: item.selectedColor || ''
            }));

            const order = await createOrder({ ...formData, hasPromo }, orderItems);

            // Si es envío a domicilio, crear el envío en Correo Argentino (sin bloquear el flujo)
            if (formData.shippingMethod === 'envio') {
                const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
                fetch(`${functionsUrl}/correo-import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_id: order.id,
                        order_number: order.order_number,
                        customer: {
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            email: formData.email,
                            phone: formData.phone,
                            dni: formData.dni,
                        },
                        shipping: {
                            address: formData.address,
                            addressNumber: formData.addressNumber,
                            floor: formData.floor,
                            apartment: formData.apartment,
                            city: formData.city,
                            province: formData.province,
                            postalCode: formData.postalCode,
                        },
                    }),
                }).catch(e => console.warn('correo-import error (no crítico):', e));
            }

            const itemsText = orderItems
                .map(i => `• ${i.name} (T: ${i.size}) x${i.quantity} — $${i.price.toLocaleString('es-AR')}`)
                .join('\n');

            const shippingLine = order.shipping_method === 'retiro'
                ? ''
                : ((order.shipping_cost || 0) === 0
                    ? 'Envío: *GRATIS* ✅'
                    : `Envío: *$${(order.shipping_cost || 0).toLocaleString('es-AR')}*`);

            if (formData.paymentMethod === 'mercadopago') {
                // Crear preferencia de Mercado Pago y redirigir
                const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

                const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                const res = await fetch(`${functionsUrl}/create-mp-preference`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                        order_id: order.id,
                        order_number: order.order_number,
                        customer: {
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            email: formData.email,
                            phone: formData.phone,
                            dni: formData.dni,
                        },
                        total: order.total,
                        items: orderItems,
                    }),
                });

                let mpData: any = {};
                try {
                    mpData = await res.json();
                } catch {
                    throw new Error(`Error HTTP ${res.status}: respuesta inválida del servidor`);
                }
                console.error('MP response:', res.status, mpData);
                if (!mpData.init_point) {
                    const detail = mpData.detail ? JSON.stringify(mpData.detail) : '';
                    throw new Error(mpData.error || `Error MP ${res.status}${detail ? ': ' + detail : ''}`);
                }

                decrementLocalStock(orderItems);
                setCart([]);
                setIsCheckoutOpen(false);
                localStorage.removeItem('shams_products_v13');
                localStorage.removeItem('shams_promo_10');
                window.location.href = mpData.init_point;
            } else if (formData.paymentMethod === 'transferencia') {
                const transferDiscount = settings.transfer_discount || 15;
                const bankHolder = settings.bank_holder || 'YOLANDA TERUZ';
                const bankCbu = settings.bank_cbu || '0070233320000006212542';
                const bankAlias = settings.bank_alias || '';
                const bankName = settings.bank_name || 'Banco Galicia';

                const whatsappNumber = settings.whatsapp_number || '5493412175258';

                const deliveryInfo = formData.shippingMethod === 'retiro'
                    ? `📍 Retiro en local`
                    : `📬 Envío a: ${formData.address} ${formData.addressNumber}${formData.apartment ? ` ${formData.apartment}` : ''}, ${formData.city}, ${formData.province} (CP: ${formData.postalCode})`;

                const msg = [
                    `🏦 *NUEVO PEDIDO #${order.order_number} — TRANSFERENCIA*`,
                    `━━━━━━━━━━━━━━━━━━━━━━`,
                    ``,
                    `👤 *Cliente:* ${formData.firstName} ${formData.lastName}`,
                    `📧 *Email:* ${formData.email}`,
                    `📱 *Teléfono:* ${formData.phone || '-'}`,
                    `🪪 *DNI:* ${formData.dni || '-'}`,
                    ``,
                    `*📦 PRODUCTOS:*`,
                    itemsText,
                    ``,
                    `──────────────────────`,
                    `Subtotal: $${order.subtotal.toLocaleString('es-AR')}`,
                    ...(order.discount > 0 ? [`Descuento 15% transf.: -$${order.discount.toLocaleString('es-AR')}`] : []),
                    ...(shippingLine ? [shippingLine] : []),
                    ``,
                    `💰 *TOTAL A ABONAR: $${order.total.toLocaleString('es-AR')}*`,
                    ``,
                    `──────────────────────`,
                    `*📋 DATOS PARA LA TRANSFERENCIA:*`,
                    `🏦 Banco: ${bankName}`,
                    `👤 Titular: ${bankHolder}`,
                    `🔢 CBU: ${bankCbu}`,
                    ...(bankAlias ? [`📲 Alias: ${bankAlias}`] : []),
                    ``,
                    `──────────────────────`,
                    deliveryInfo,
                    ``,
                    `⚠️ *Por favor, primero confirmame si mi talle está en stock. Una vez que confirmes, hago la transferencia y te mando el comprobante por este chat. ¡Gracias!*`,
                ].join('\n');

                setSuccessOrderData({
                    order,
                    bankDetails: {
                        holder: bankHolder,
                        cbu: bankCbu,
                        alias: bankAlias,
                        bank: bankName
                    },
                    whatsappNumber,
                    whatsappMsg: msg
                });

                // Intento de redirección automática (algunos navegadores pueden bloquearlo, para eso está el modal de respaldo)
                setTimeout(() => {
                    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
                    window.open(waUrl, '_blank');
                }, 100);

                decrementLocalStock(orderItems);
                setCart([]);
                setIsCheckoutOpen(false);
                if (localStorage.getItem('shams_promo_10') === 'true' && !formData.promoAlreadyUsed) {
                    localStorage.setItem('shams_promo_10', 'used'); // Marcar como usado
                }

            } else {
                // Efectivo
                const whatsappNumber = settings.whatsapp_number || '5493412175258';
                const msg = [
                    `💵 *REGISTRO DE PEDIDO #${order.order_number} (EFECTIVO)*`,
                    ``,
                    `¡Hola! Hemos registrado tu pedido en *Shams* para abono en efectivo.`,
                    ``,
                    `*📦 Detalle del pedido:*`,
                    itemsText,
                    ``,
                    `Subtotal: $${order.subtotal.toLocaleString('es-AR')}`,
                    ...(shippingLine ? [shippingLine] : []),
                    `*💰 TOTAL A ABONAR: $${order.total.toLocaleString('es-AR')}*`,
                    ``,
                    `Nos pondremos en contacto contigo para coordinar el pago y el ${order.shipping_method === 'retiro' ? 'retiro' : 'envío'}. ¡Gracias!`,
                ].join('\n');

                setSuccessOrderData({
                    order,
                    bankDetails: {
                        holder: '',
                        cbu: '',
                        alias: '',
                        bank: ''
                    },
                    whatsappNumber,
                    whatsappMsg: msg
                });

                // Intento de redirección automática
                setTimeout(() => {
                    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
                    window.open(waUrl, '_blank');
                }, 100);

                decrementLocalStock(orderItems);
                setCart([]);
                setIsCheckoutOpen(false);
                if (localStorage.getItem('shams_promo_10') === 'true' && !formData.promoAlreadyUsed) {
                    localStorage.setItem('shams_promo_10', 'used'); // Marcar como usado
                }
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    // Mejores descuentos por marca (solo para la sección de inicio)
    const brandDiscounts = useMemo(() => {
        const map = new Map<string, { brand: string; bestDiscount: number; image: string; count: number }>();
        products.forEach(p => {
            if (!p.brand || p.is_published === false || p.is_active === false) return;
            if (!p.originalPrice || p.originalPrice <= p.price) return;
            const hasValidImage = p.image && !p.image.includes('placeholder') && !p.image.includes('No+Image');
            if (!hasValidImage) return;
            const discountPct = Math.round((p.originalPrice - p.price) / p.originalPrice * 100);
            if (discountPct < 5) return;
            const existing = map.get(p.brand);
            if (!existing) {
                map.set(p.brand, { brand: p.brand, bestDiscount: discountPct, image: p.image, count: 1 });
            } else {
                map.set(p.brand, {
                    brand: p.brand,
                    bestDiscount: Math.max(existing.bestDiscount, discountPct),
                    image: discountPct > existing.bestDiscount ? p.image : existing.image,
                    count: existing.count + 1
                });
            }
        });
        return Array.from(map.values())
            .filter(b => b.count >= 1)
            .sort((a, b) => b.bestDiscount - a.bestDiscount)
            .slice(0, 12);
    }, [products]);

    const filteredProducts = useMemo(() => products.filter(p => {
        // Filter: Solo productos publicados y activos
        if (p.is_published === false || p.is_active === false) return false;

        // Filter: Ocultar productos de prueba o test
        const testKeywords = ['prueba', 'test', 'demo', 'asdf', 'qwer', 'aaaa', 'zxcv'];
        const isTestProduct = testKeywords.some(kw => p.name?.toLowerCase().includes(kw));
        const isDummyPrice = (p.price || 0) < 50; // Productos con precio simbólico
        if (isTestProduct || isDummyPrice) return false;



        // Filter: Ocultar productos sin stock o sin variantes cargadas
        if (!p.variants || p.variants.length === 0) return false;
        const totalStock = p.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        if (totalStock === 0) return false;

        // Filter: Solo productos con foto (opcional si queremos que siempre se vea algo)
        const hasValidImage = p.image &&
            !p.image.includes('placeholder') &&
            !p.image.includes('No+Image') &&
            p.image !== 'https://via.placeholder.com/400x500?text=No+Image';

        // Categoría Cafetería check
        const isCafeteriaProduct = p.category?.toLowerCase() === 'cafeteria';
        const isCafeteriaFilterActive = selectedCategory?.toLowerCase() === 'cafeteria';

        // Filter by Category
        const matchesCategory = !selectedCategory || selectedCategory === 'Todos' ||
            p.category?.toLowerCase() === selectedCategory.toLowerCase();
        
        // Excluir categorías de la lista negra global SOLO si no hay un filtro de marca o categoría activo
        if (!selectedCategory && !selectedBrand && p.category && EXCLUDED_CATS.includes(p.category.toLowerCase().trim())) {
            return false;
        }

        // Filter by Brand
        const matchesBrand = !selectedBrand ||
            p.brand?.toLowerCase() === selectedBrand.toLowerCase();

        // Filter by Gender
        const productGenders = (p.features || []).map((f: string) => f?.toLowerCase());
        const isUnisex = productGenders.includes('unisex');
        const matchesGender = !selectedGender || isCafeteriaFilterActive || (() => {
            if (isCafeteriaProduct) return false;
            const g = selectedGender.toLowerCase();
            // Unisex aparece en Hombre, Mujer y Unisex
            if (isUnisex && (g === 'hombre' || g === 'mujer' || g === 'unisex')) return true;
            // Coincidencia directa con el género seleccionado
            return productGenders.includes(g);
        })() || (p.brand?.toLowerCase() === 'cibeles' && selectedGender === 'Mujer');

        // Filter by Search Query
        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
        const matchesSearch = searchQuery.trim() === '' || searchTerms.every(term =>
            p.name.toLowerCase().includes(term) ||
            (p.brand && p.brand.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term))
        );

        // Filter by Size
        const matchesSize = !selectedSize || p.variants?.some(v => v.size.toUpperCase().trim() === selectedSize && v.stock > 0);

        // Si tenemos fotos, filtramos por fotos. Si NO hay productos con fotos, dejamos pasar los sin foto para que el usuario vea la data.
        const totalWithPhotos = products.filter(prod => prod.image && !prod.image.includes('placeholder')).length;
        const finalImageCheck = (totalWithPhotos > 0) ? hasValidImage : true;

        if (!(finalImageCheck && matchesCategory && matchesBrand && matchesGender && matchesSearch && matchesSize)) return false;

        return true;
    }).sort((a, b) => {
        if (!selectedOrder) return 0;

        const discountA = a.originalPrice > 0 ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discountB = b.originalPrice > 0 ? (b.originalPrice - b.price) / b.originalPrice : 0;

        if (selectedOrder === 'descuento-mayor') {
            return discountB - discountA;
        } else if (selectedOrder === 'descuento-menor') {
            return discountA - discountB;
        }
        
        // Orden por defecto if no extra order is chosen
        const sortA = a.sort_order || 99999;
        const sortB = b.sort_order || 99999;
        if (sortA !== sortB) {
            return sortA - sortB;
        }
        return (a.name || '').localeCompare(b.name || '');
    }), [products, selectedCategory, selectedBrand, selectedGender, searchQuery, selectedSize, selectedOrder]);

    // Note: The full-screen loading blocker was removed here to allow instant FCP.

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 text-center">
                <div className="max-w-md">
                    <X className="text-red-500 mx-auto mb-6" size={48} />
                    <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Interferencia de Red</h2>
                    <p className="text-zinc-500 mb-8 uppercase text-[10px] tracking-widest leading-loose">
                        La conexión fue interrumpida (AbortError). Esto suele ocurrir si un antivirus, firewall o extensión está bloqueando la base de datos. <br /><br />
                        Intenta: <br />
                        1. Refrescar con Ctrl + F5<br />
                        2. Usar una ventana Incógnito<br />
                        3. Desactivar extensiones de bloqueo
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-white text-black px-8 py-3 rounded-none font-black uppercase tracking-widest text-xs hover:bg-[#e0e0e0] transition-all"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative selection:bg-black selection:text-white bg-[var(--color-background)] text-[var(--color-text)]">
            <Navbar
                cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
                onOpenCart={() => setIsCartOpen(true)}
                favoritesCount={favorites.length}
                onOpenFavorites={() => setIsFavoritesOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categoriesByGender={categoriesByGender}
                brands={brands}
                onOpenAuth={() => setIsAuthOpen(true)}
                customerName={customer?.name}
            />

            <main>
                {(loading || (skuParam && !selectedProduct && isProductDeepLinkLoading)) && !selectedProduct ? (
                    <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
                        <Loader className="animate-spin text-black mb-4" size={48} />
                        <span className="text-[10px] font-black tracking-[0.5em] text-[#999] uppercase animate-pulse">
                            {isProductDeepLinkLoading ? "Buscando artículo..." : "Sincronizando Inventario..."}
                        </span>
                    </div>
                ) : (
                    <>
                        {!selectedBrand && !selectedGender && !selectedCategory && !skuParam && !selectedProduct && !window.location.pathname.includes('/producto/') && (
                            <>
                                <Hero />
                                <div id="brands">
                                    <BrandMarquee />
                                </div>
                        {brandDiscounts.length > 0 && (
                            <section className="py-10 px-4 md:px-12 max-w-screen-2xl mx-auto">
                                <div className="mb-6 px-1">
                                    <span className="text-[#999] uppercase tracking-[0.4em] text-[10px] block mb-2 font-bold">DESCUENTOS ACTIVOS</span>
                                    <h2 className="font-heading text-2xl md:text-4xl font-bold tracking-tighter text-[var(--color-text)]">
                                        MODELOS MÁS PEDIDOS <span className="text-[var(--color-text)] italic">ESTA SEMANA</span>
                                    </h2>
                                </div>
                                <div className="relative">
                                    {/* Gradiente izquierda — sutil */}
                                    {brandsScrollPos > 20 && (
                                        <div className="absolute left-0 top-0 bottom-4 w-10 bg-gradient-to-r from-white/70 to-transparent z-10 pointer-events-none" />
                                    )}
                                    {/* Gradiente derecha — sutil */}
                                    <div className="absolute right-0 top-0 bottom-4 w-10 bg-gradient-to-l from-white/70 to-transparent z-10 pointer-events-none" />
                                    {/* Flecha izquierda */}
                                    {brandsScrollPos > 20 && (
                                        <button
                                            onClick={() => { brandsScrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' }); }}
                                            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-none bg-white border-2 border-[var(--color-text)]/20 flex items-center justify-center text-[var(--color-text)] active:scale-95 transition-all shadow-xl"
                                        >
                                            <ChevronLeft size={22} strokeWidth={2.5} />
                                        </button>
                                    )}
                                    {/* Flecha derecha */}
                                    <button
                                        onClick={() => { brandsScrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' }); }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-none bg-white border-2 border-[var(--color-text)]/20 flex items-center justify-center text-[var(--color-text)] active:scale-95 transition-all shadow-xl"
                                    >
                                        <ChevronRight size={22} strokeWidth={2.5} />
                                    </button>
                                    <div
                                        ref={brandsScrollRef}
                                        onScroll={(e) => setBrandsScrollPos((e.target as HTMLDivElement).scrollLeft)}
                                        className="flex gap-3 md:gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                                    >
                                    {brandDiscounts.map(({ brand, image }) => {
                                        const params = new URLSearchParams(searchParams);
                                        params.set('marca', brand);
                                        const displayImage = (() => { try { const m: Record<string,string> = JSON.parse(settings.brand_featured_images || '{}'); return m[brand] || image; } catch(_) { return image; } })();
                                        return (
                                            <button
                                                key={brand}
                                                onClick={() => navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true })}
                                                className="shrink-0 relative group w-36 md:w-48 rounded-none overflow-hidden border border-[var(--color-text)]/10 hover:border-black/40 transition-all duration-300 hover:scale-[1.02]"
                                            >
                                                <div className="aspect-[3/4] relative">
                                                    <img
                                                        src={displayImage}
                                                        alt={brand}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                                                        <p className="text-white font-black text-xs md:text-sm uppercase tracking-widest truncate leading-tight">{brand}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* Collection Section */}
                <section 
                    className={`pb-32 px-0.5 md:px-12 max-w-screen-2xl mx-auto ${(selectedBrand || selectedGender || selectedCategory) ? 'pt-44 md:pt-52' : 'pt-4'}`} 
                    id="new"
                    style={{ scrollMarginTop: '200px' }}
                >
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 px-1.5 md:px-0 gap-6 md:gap-10">
                        <div className="pt-0">
                            <span className="text-[#999] uppercase tracking-[0.4em] text-[10px] block mb-2 font-bold">
                                {selectedBrand === 'PERRAMUS' ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-8 h-[1px] bg-[#ccc]"></span>
                                        OPORTUNIDAD ÚNICA
                                        <span className="w-8 h-[1px] bg-[#ccc]"></span>
                                    </span>
                                ) : (selectedBrand || isBrandFilterOpen ? 'COLECCIÓN EXCLUSIVA' : '')}
                            </span>
                            <h2 className="font-heading text-lg md:text-2xl font-bold tracking-tighter text-[var(--color-text)] leading-tight mt-6 md:mt-10">
                                {selectedBrand ? (
                                    <div className="flex flex-col items-start leading-tight animate-in fade-in slide-in-from-left-8 duration-700 mt-2">
                                        <span className="text-2xl md:text-4xl font-black text-[var(--color-text)] tracking-[0.1em] uppercase">
                                            {selectedBrand}
                                        </span>
                                    </div>
                                ) : selectedCategory ? (
                                    <div className="flex flex-col items-start leading-tight animate-in fade-in slide-in-from-left-8 duration-700 mt-2">
                                        <span className="text-2xl md:text-4xl font-black text-[var(--color-text)] tracking-[0.1em] uppercase">
                                            {selectedCategory.toLowerCase() === 'cafeteria' ? 'SPECIALITY COFFEE' : selectedCategory}
                                        </span>
                                    </div>
                                ) : selectedGender ? (
                                    <div className="flex flex-col items-start leading-tight animate-in fade-in slide-in-from-left-8 duration-700 mt-2">
                                        <span className="text-2xl md:text-4xl font-black text-[var(--color-text)] tracking-[0.1em] uppercase">
                                            {selectedGender}
                                        </span>
                                    </div>
                                ) : (
                                    <>ÚLTIMOS <span className="text-[var(--color-text)] italic">INGRESOS</span></>
                                )}
                            </h2>
                        </div>
                    </div>

                    {/* Barra de Filtros Sticky y Compacta - Diseño Premium */}
                    <div className="sticky top-[105px] md:top-[130px] z-[90] w-full bg-white backdrop-blur-md py-4 px-3 md:px-6 mb-6 md:mb-8 border-y border-[var(--color-text)]/5 shadow-[0_15px_35px_rgba(0,0,0,0.04)]">
                        <div className="flex flex-col gap-2 md:gap-3">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-end gap-3 md:gap-4">
                                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full xl:w-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                    <button
                                        onClick={() => { setIsBrandFilterOpen(!isBrandFilterOpen); setIsCategoryFilterOpen(false); setIsSizeFilterOpen(false); setIsGenderFilterOpen(false); setIsOrderFilterOpen(false); }}
                                        className={`flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-2.5 rounded-none border transition-all text-[10px] md:text-xs font-black tracking-[0.1em] md:tracking-[0.15em] uppercase whitespace-nowrap shrink-0 active:scale-95 ${isBrandFilterOpen || selectedBrand
                                            ? 'bg-black text-white border-black shadow-[0_5px_15px_rgba(0,0,0,0.2)]'
                                            : 'border-black/10 text-black/60 hover:border-black/30 hover:bg-black/5'
                                            }`}
                                    >
                                        <Tag size={10} className={isBrandFilterOpen || selectedBrand ? 'text-white' : ''} />
                                        <span>{selectedBrand || 'MARCA'}</span>
                                    </button>

                                    <button
                                        onClick={() => { setIsCategoryFilterOpen(!isCategoryFilterOpen); setIsBrandFilterOpen(false); setIsSizeFilterOpen(false); setIsGenderFilterOpen(false); setIsOrderFilterOpen(false); }}
                                        className={`flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-2.5 rounded-none border transition-all text-[10px] md:text-xs font-black tracking-[0.1em] md:tracking-[0.15em] uppercase whitespace-nowrap shrink-0 active:scale-95 ${isCategoryFilterOpen || selectedCategory
                                            ? 'bg-black text-white border-black shadow-[0_5px_15px_rgba(0,0,0,0.2)]'
                                            : 'border-black/10 text-black/60 hover:border-black/30 hover:bg-black/5'
                                            }`}
                                    >
                                        <Filter size={10} className={isCategoryFilterOpen || selectedCategory ? 'text-white' : ''} />
                                        <span>{selectedCategory || 'CATEGORÍA'}</span>
                                    </button>

                                    <button
                                        onClick={() => { setIsGenderFilterOpen(!isGenderFilterOpen); setIsBrandFilterOpen(false); setIsCategoryFilterOpen(false); setIsSizeFilterOpen(false); setIsOrderFilterOpen(false); }}
                                        className={`flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-2.5 rounded-none border transition-all text-[10px] md:text-xs font-black tracking-[0.1em] md:tracking-[0.15em] uppercase whitespace-nowrap shrink-0 active:scale-95 ${isGenderFilterOpen || selectedGender
                                            ? 'bg-black text-white border-black shadow-[0_5px_15px_rgba(0,0,0,0.2)]'
                                            : 'border-black/10 text-black/60 hover:border-black/30 hover:bg-black/5'
                                            }`}
                                    >
                                        <Users size={10} className={isGenderFilterOpen || selectedGender ? 'text-white' : ''} />
                                        <span>{selectedGender || 'GÉNERO'}</span>
                                    </button>

                                    <button
                                        onClick={() => { setIsSizeFilterOpen(!isSizeFilterOpen); setIsBrandFilterOpen(false); setIsCategoryFilterOpen(false); setIsGenderFilterOpen(false); setIsOrderFilterOpen(false); }}
                                        className={`flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-2.5 rounded-none border transition-all text-[10px] md:text-xs font-black tracking-[0.1em] md:tracking-[0.15em] uppercase whitespace-nowrap shrink-0 active:scale-95 ${isSizeFilterOpen || selectedSize
                                            ? 'bg-black text-white border-black shadow-[0_5px_15px_rgba(0,0,0,0.2)]'
                                            : 'border-black/10 text-black/60 hover:border-black/30 hover:bg-black/5'
                                            }`}
                                    >
                                        <Ruler size={10} className={isSizeFilterOpen || selectedSize ? 'text-white' : ''} />
                                        <span>{selectedSize ? `TALLE: ${selectedSize}` : 'TALLE'}</span>
                                    </button>

                                    <button
                                        onClick={() => { setIsOrderFilterOpen(!isOrderFilterOpen); setIsBrandFilterOpen(false); setIsCategoryFilterOpen(false); setIsGenderFilterOpen(false); setIsSizeFilterOpen(false); }}
                                        className={`flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-2.5 rounded-none border transition-all text-[10px] md:text-xs font-black tracking-[0.1em] md:tracking-[0.15em] uppercase whitespace-nowrap shrink-0 active:scale-95 ${isOrderFilterOpen || selectedOrder
                                            ? 'bg-black text-white border-black shadow-[0_5px_15px_rgba(0,0,0,0.2)]'
                                            : 'border-black/10 text-black/60 hover:border-black/30 hover:bg-black/5'
                                            }`}
                                    >
                                        <Tag size={10} className={isOrderFilterOpen || selectedOrder ? 'text-white' : ''} />
                                        <span>{selectedOrder === 'descuento-mayor' ? '% MAYOR OFF' : selectedOrder === 'descuento-menor' ? '% MENOR OFF' : 'ORDENAR'}</span>
                                    </button>

                                    {(selectedBrand || selectedSize || selectedCategory || searchQuery || selectedOrder) && (
                                        <button
                                            onClick={() => {
                                                const params = new URLSearchParams(searchParams);
                                                params.delete('categoria');
                                                params.delete('marca');
                                                params.delete('orden');
                                                params.delete('search');
                                                navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true });
                                                setSelectedSize(null);
                                                setSearchQuery('');
                                                setIsBrandFilterOpen(false);
                                                setIsSizeFilterOpen(false);
                                                setIsCategoryFilterOpen(false);
                                                setIsGenderFilterOpen(false);
                                                setIsOrderFilterOpen(false);
                                            }}
                                            className="group flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-none border border-black text-black text-[9px] md:text-sm font-black tracking-[0.1em] md:tracking-[0.2em] uppercase transition-all hover:bg-black hover:text-white whitespace-nowrap shrink-0"
                                        >
                                            <Trash2 size={12} className="group-hover:rotate-12 transition-transform" />
                                            <span>BORRAR</span>
                                        </button>
                                    )}
                                </div>

                                {/* Expandable Gender Filter Panel */}
                                {isGenderFilterOpen && (
                                    <div className="absolute top-[110%] left-0 right-0 p-6 bg-white border border-black/5 rounded-none w-full xl:w-[550px] z-[50] shadow-[0_30px_100px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-4 duration-500 xl:left-auto xl:right-0">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-[10px] font-black tracking-[0.3em] text-[#999] uppercase">SELECCIONAR GÉNERO</h4>
                                            {selectedGender && (
                                                <button
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams);
                                                        params.delete('genero');
                                                        navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true });
                                                        setIsGenderFilterOpen(false);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-none bg-red-500/10 text-red-500 text-[9px] font-black tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 uppercase"
                                                >
                                                    <X size={12} /> QUITAR FILTRO
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {['Mujer', 'Hombre', 'Unisex'].map(gender => (
                                                <button
                                                    key={gender}
                                                    onClick={() => {
                                                        const newGender = selectedGender === gender ? '' : gender;
                                                        const params = new URLSearchParams(searchParams);
                                                        if (newGender) params.set('genero', newGender);
                                                        else params.delete('genero');
                                                        navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true });
                                                        setIsGenderFilterOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 rounded-none border transition-all text-[11px] font-black tracking-[0.2em] uppercase ${selectedGender === gender
                                                        ? 'bg-black text-white border-black'
                                                        : 'border-[var(--color-text)]/5 text-[var(--color-text)] hover:bg-black/5 hover:border-[var(--color-text)]/20 hover:pl-6'
                                                        }`}
                                                >
                                                    {gender}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Expandable Brand Filter Panel */}
                                {isBrandFilterOpen && (
                                    <div className="absolute top-[110%] left-0 right-0 p-6 bg-white border border-black/5 rounded-none w-full xl:w-[550px] z-[50] shadow-[0_30px_100px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-4 duration-500 xl:left-auto xl:right-0">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-[10px] font-black tracking-[0.3em] text-[#999] uppercase">SELECCIONAR MARCA</h4>
                                            {selectedBrand && (
                                                <button
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams);
                                                        params.delete('marca');
                                                        navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true });
                                                        setIsBrandFilterOpen(false);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-none bg-red-500/10 text-red-500 text-[9px] font-black tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 uppercase"
                                                >
                                                    <X size={12} /> QUITAR FILTRO
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {brands
                                                .filter(brand => {
                                                    if (selectedGender && selectedGender.toUpperCase() === 'HOMBRE') {
                                                        const allowed = ['PERRAMUS', 'NAUTICA', 'HUNTER'];
                                                        return allowed.includes(brand.name.toUpperCase());
                                                    }
                                                    return true;
                                                })
                                                .map(brand => (
                                                    <button
                                                        key={brand.id}
                                                        onClick={() => {
                                                            const newBrand = selectedBrand === brand.name ? '' : brand.name;
                                                            const params = new URLSearchParams(searchParams);
                                                            if (newBrand) params.set('marca', newBrand);
                                                            else params.delete('marca');
                                                            navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true });
                                                            setIsBrandFilterOpen(false);
                                                        }}
                                                        className={`w-full px-4 py-3 flex items-center justify-between rounded-none text-left border transition-all uppercase group ${selectedBrand === brand.name
                                                            ? 'bg-black text-white border-black'
                                                            : 'bg-black/5 text-[var(--color-text)] border-[var(--color-text)]/10 hover:border-black/30 hover:bg-black/10'
                                                            }`}
                                                        title={brand.name}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            {brand.logo_url && (
                                                                <div className="w-8 h-8 rounded-none bg-white flex items-center justify-center p-1 border border-white/20 shrink-0">
                                                                    <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                                                                </div>
                                                            )}
                                                            <span className="text-[10px] font-black tracking-[0.1em] text-left">{brand.name}</span>
                                                        </div>
                                                        {selectedBrand === brand.name ? (
                                                            <X size={12} className="shrink-0" />
                                                        ) : (
                                                            <div className="w-1.5 h-1.5 shrink-0 rounded-none bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Size Filter Panel */}
                                {isSizeFilterOpen && (
                                    <div className="absolute top-[110%] left-0 right-0 p-6 bg-white border border-black/5 rounded-none w-full xl:w-[450px] z-[50] shadow-[0_30px_100px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-4 duration-500 xl:left-auto xl:right-0">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-[10px] font-black tracking-[0.3em] text-[#999] uppercase">SELECCIONAR TALLE</h4>
                                            {selectedSize && (
                                                <button
                                                    onClick={() => { setSelectedSize(null); setIsSizeFilterOpen(false); }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-none bg-red-500/10 text-red-500 text-[9px] font-black tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 uppercase"
                                                >
                                                    <X size={12} /> QUITAR FILTRO
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {availableSizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => { setSelectedSize(selectedSize === size ? null : size); setIsSizeFilterOpen(false); }}
                                                    className={`min-w-[45px] h-10 flex items-center justify-center rounded-none text-[10px] font-black border transition-all ${selectedSize === size
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-black/5 text-[var(--color-text)] border-[var(--color-text)]/10 hover:border-black/30 hover:bg-black/10'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Category Filter Panel */}
                                {isCategoryFilterOpen && (
                                    <div className="absolute top-[110%] left-0 right-0 p-6 bg-white border border-black/5 rounded-none w-full xl:w-[550px] z-[50] shadow-[0_30px_100px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-4 duration-500 xl:left-auto xl:right-0">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-[10px] font-black tracking-[0.3em] text-[#999] uppercase">SELECCIONAR CATEGORÍA</h4>
                                            {selectedCategory && (
                                                <button
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams);
                                                        params.delete('categoria');
                                                        navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true });
                                                        setIsCategoryFilterOpen(false);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-none bg-red-500/10 text-red-500 text-[9px] font-black tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 uppercase"
                                                >
                                                    <X size={12} /> QUITAR FILTRO
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {availableCategories.filter(cat => {
                                                if (!selectedGender) return true;
                                                const c = cat.toUpperCase();
                                                const hasHombre = c.includes('HOMBRE');
                                                const hasMujer = c.includes('MUJER');
                                                // Categorías que no pertenecen a ningún género
                                                const soloMujer = ['CAMISAS/BLUSAS/TOP','VESTIDOS, FALDAS Y MONOS','SACOS'].map(x => x.toUpperCase());
                                                const sinGenero = ['ACCESORIOS'].map(x => x.toUpperCase());
                                                if (selectedGender === 'Hombre') return hasHombre || (!hasHombre && !hasMujer && !soloMujer.includes(c) && !sinGenero.includes(c));
                                                if (selectedGender === 'Mujer') return hasMujer || (!hasHombre && !hasMujer && !sinGenero.includes(c));
                                                return !hasHombre && !hasMujer;
                                            }).map(category => (
                                                <button
                                                    key={category}
                                                    onClick={() => {
                                                        const newCat = selectedCategory === category ? '' : category;
                                                        const params = new URLSearchParams(searchParams);
                                                        if (newCat) params.set('categoria', newCat);
                                                        else params.delete('categoria');
                                                        navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true });
                                                        setIsCategoryFilterOpen(false);
                                                    }}
                                                    className={`w-full px-4 py-2.5 flex items-center justify-between rounded-none text-[10px] font-black border transition-all uppercase tracking-[0.15em] group ${selectedCategory === category
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-black/5 text-[var(--color-text)] border-[var(--color-text)]/10 hover:border-black/30 hover:bg-black/10'
                                                        }`}
                                                >
                                                    <span>{category}</span>
                                                    {selectedCategory === category && <X size={12} />}
                                                    {selectedCategory !== category && (
                                                        <div className="w-1.5 h-1.5 rounded-none bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sort Order Filter Panel */}
                                {isOrderFilterOpen && (
                                    <div className="absolute top-[110%] left-0 right-0 p-4 bg-white border border-black/5 rounded-none w-full xl:w-[350px] z-[50] shadow-[0_30px_100px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-4 duration-500 xl:left-auto xl:right-0">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-[9px] font-black tracking-[0.2em] text-[#999] uppercase">ORDENAR POR</h4>
                                            {selectedOrder && (
                                                <button
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams);
                                                        params.delete('orden');
                                                        navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true });
                                                        setIsOrderFilterOpen(false);
                                                    }}
                                                    className="text-[8px] font-black text-red-500 uppercase hover:text-white transition-colors"
                                                >
                                                    REINICIAR
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {[
                                                { id: 'descuento-mayor', label: '% MAYOR DESCUENTO' },
                                                { id: 'descuento-menor', label: '% MENOR DESCUENTO' }
                                            ].map(option => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams);
                                                        params.set('orden', option.id);
                                                        navigate(`/?${params.toString()}`, { replace: true, preventScrollReset: true });
                                                        setIsOrderFilterOpen(false);
                                                    }}
                                                    className={`w-full px-4 py-3 flex items-center justify-between rounded-none text-[9px] font-black border transition-all uppercase tracking-[0.1em] ${selectedOrder === option.id
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white text-[var(--color-text)] border-[var(--color-text)]/20 hover:border-black'
                                                        }`}
                                                >
                                                    <span>{option.label}</span>
                                                    {selectedOrder === option.id && <X size={10} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-32 opacity-50 min-h-[50vh]">
                            <p className="text-xl font-bold tracking-[0.2em] uppercase mb-4 text-[var(--color-text)]">No se encontraron productos</p>
                            <p className="text-[var(--color-text)] italic tracking-widest text-sm uppercase font-medium">Intenta con otros filtros de búsqueda.</p>
                        </div>
                    ) : (
                        (!selectedBrand && !selectedGender && !selectedCategory && !searchQuery) ? (
                            <div className="flex flex-col gap-6 md:gap-16">
                                {/* Featured Products Large Cards (admin-selected) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 sm:gap-2">
                                    {(filteredProducts.filter(p => p.is_featured).length > 0
                                        ? filteredProducts.filter(p => p.is_featured).slice(0, 3)
                                        : filteredProducts.slice(0, 3)
                                    ).map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => openProduct(product)}
                                            className="group relative w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[var(--color-background-alt)] block"
                                        >
                                            <img
                                                src={(product.images && product.images.length > 0) ? product.images[0] : product.image || ''}
                                                alt={product.name}
                                                className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105"
                                            />
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                            
                                            {/* Shopping Bag Button at bottom center */}
                                            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex justify-center w-full">
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.15)] transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                                                    <ShoppingBag size={18} className="text-black" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Rest of the Catalog */}
                                {filteredProducts.filter(p => !p.is_featured).length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-center mb-8 mt-4 md:mt-0">
                                            <span className="text-[var(--color-text)] uppercase tracking-[0.4em] text-[10px] md:text-xs block font-bold px-8 py-2 border-y border-[var(--color-text)]/20">
                                                CATÁLOGO GENERAL
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5 sm:gap-6 gap-y-4 sm:gap-y-12 min-h-[50vh]">
                                            {filteredProducts.filter(p => !p.is_featured).sort((a, b) => {
                                                const isBottom = (p: any) => {
                                                    const cat = (p.category?.name || '').toUpperCase();
                                                    return cat.includes('ACCESORIO') || cat.includes('CALZADO') || cat.includes('BOLSO') || cat.includes('CARTERA') ? 1 : 0;
                                                };
                                                return isBottom(a) - isBottom(b);
                                            }).map(product => (
                                                <ProductCard key={product.id} product={product} onAddToCart={addToCart} onOpenDetail={(p) => openProduct(p)} isFavorite={favorites.includes(product.id)} onToggleFavorite={toggleFavorite} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                {selectedCategory?.toLowerCase() === 'cafeteria' && (
                                    <div style={{ position: 'relative', width: '100%', minHeight: '180px', marginBottom: '2rem', background: '#1a2a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', fontFamily: "'Playfair Display', Georgia, serif", color: 'white', fontSize: 'clamp(2.2rem, 10vw, 4rem)', fontWeight: 400, letterSpacing: '0.15em' }}>
                                            <span>M</span>
                                            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span>O</span>
                                                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                                    <svg viewBox="0 0 40 40" width="48%" height="48%" fill="none">
                                                        <ellipse cx="20" cy="20" rx="14" ry="10" fill="white" transform="rotate(-30 20 20)"/>
                                                        <path d="M20 10.5 Q26 20 20 29.5" stroke="#1a2a1a" strokeWidth="2" fill="none" strokeLinecap="round" transform="rotate(-30 20 20)"/>
                                                    </svg>
                                                </span>
                                            </span>
                                            <span>NACLE</span>
                                        </div>
                                        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.55rem, 2.5vw, 0.8rem)', letterSpacing: '0.4em', marginTop: '0.5rem' }}>
                                            SPECIALITY COFFEE
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5 sm:gap-6 gap-y-4 sm:gap-y-12 min-h-[50vh]">
                                    {filteredProducts.sort((a, b) => {
                                        const isBottom = (p: any) => {
                                            const cat = (p.category?.name || '').toUpperCase();
                                            return cat.includes('ACCESORIO') || cat.includes('CALZADO') || cat.includes('BOLSO') || cat.includes('CARTERA') ? 1 : 0;
                                        };
                                        return isBottom(a) - isBottom(b);
                                    }).map(product => (
                                        <ProductCard key={product.id} product={product} onAddToCart={addToCart} onOpenDetail={(p) => openProduct(p)} isFavorite={favorites.includes(product.id)} onToggleFavorite={toggleFavorite} />
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </section>
                </>
                )}
            </main>


                {/* Footer */}
                <footer className="py-24 px-6 bg-[var(--color-background-alt)] relative overflow-hidden text-[var(--color-text)] border-t border-[var(--color-border)]">
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-black/5 blur-[120px] rounded-none" />
                    <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20 relative z-10">
                        <div>
                            <h1 className="font-heading text-3xl font-black tracking-[0.6em] mb-12 uppercase">SHAMS</h1>

                            <div className="space-y-6">
                                <h5 className="text-[11px] font-semibold tracking-[0.5em] text-[#999] mb-6 uppercase">Contacto</h5>
                                <div className="space-y-5">
                                    <a href="mailto:admteruzyolanda@gmail.com" className="flex items-center gap-4 group">
                                        <Mail size={16} strokeWidth={1.5} className="text-[var(--color-text-muted)] group-hover:text-black transition-colors" />
                                        <span className="text-[10px] font-medium tracking-[0.2em] text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors uppercase">admteruzyolanda@gmail.com</span>
                                    </a>
                                    <a href="https://wa.me/5493412175258" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                                        <Phone size={16} strokeWidth={1.5} className="text-[var(--color-text-muted)] group-hover:text-[#25D366] transition-colors" />
                                        <span className="text-[10px] font-medium tracking-[0.2em] text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors uppercase">3412175258</span>
                                    </a>
                                    <button
                                        onClick={() => setIsLocationsOpen(true)}
                                        className="flex items-center gap-4 group w-full text-left"
                                    >
                                        <MapPin size={16} strokeWidth={1.5} className="text-[var(--color-text-muted)] group-hover:text-black transition-colors" />
                                        <span className="text-[10px] font-medium tracking-[0.2em] text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors uppercase">Locales</span>
                                    </button>

                                    <a href="https://instagram.com/shamsrosario" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                                        <Instagram size={16} strokeWidth={1.5} className="text-[var(--color-text-muted)] group-hover:text-[#E4405F] transition-colors" />
                                        <span className="text-[10px] font-medium tracking-[0.2em] text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors uppercase">Instagram</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-[11px] font-semibold tracking-[0.5em] text-[#999] mb-10 uppercase">POLÍTICAS</h5>
                            <ul className="space-y-6 text-[10px] font-medium tracking-[0.3em] text-[var(--color-text-muted)] uppercase">
                                <li><Link to="/como-comprar" className="hover:text-[var(--color-text)] transition-colors">CÓMO COMPRAR</Link></li>
                                <li><Link to="/envios" className="hover:text-[var(--color-text)] transition-colors">ENVÍOS Y SEGUIMIENTO</Link></li>
                                <li><Link to="/preguntas-frecuentes" className="hover:text-[var(--color-text)] transition-colors">FORMAS DE PAGO</Link></li>
                                <li><Link to="/politicas-de-privacidad" className="hover:text-[var(--color-text)] transition-colors">POLÍTICAS DE PRIVACIDAD</Link></li>
                                <li><Link to="/arrepentimiento" className="hover:text-[var(--color-text)] transition-colors">ARREPENTIMIENTO DE COMPRA</Link></li>
                                <li><Link to="/preguntas-frecuentes" className="hover:text-[var(--color-text)] transition-colors">PREGUNTAS FRECUENTES</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="text-[11px] font-semibold tracking-[0.5em] text-[#999] mb-10 uppercase">COMUNIDAD</h5>
                            <p className="text-[11px] text-[var(--color-text-muted)] mb-8 tracking-[0.2em] font-medium uppercase">Sé el primero en acceder a los "Drops" exclusivos.</p>
                            {footerSubStatus === 'success' ? (
                                <div className="flex items-center gap-3 py-4 border-b border-[#e0e0e0]">
                                    <span className="text-black text-lg">✓</span>
                                    <span className="text-[10px] font-semibold tracking-[0.3em] text-black uppercase">¡Bienvenido! 10% OFF en tu primera compra</span>
                                </div>
                            ) : (
                                <form onSubmit={handleFooterSubscribe} className="flex border-b border-[var(--color-border)] pb-4 group focus-within:border-black/40 transition-colors">
                                    <input
                                        type="email"
                                        value={footerEmail}
                                        onChange={e => setFooterEmail(e.target.value)}
                                        placeholder="TU EMAIL"
                                        required
                                        className="bg-transparent text-[10px] font-medium tracking-[0.3em] w-full focus:outline-none placeholder:text-[var(--color-text-muted)]/50 text-[var(--color-text)] uppercase"
                                    />
                                    <button
                                        type="submit"
                                        disabled={footerSubStatus === 'loading'}
                                        className="text-[10px] font-semibold tracking-[0.4em] text-[#999] hover:text-[var(--color-text)] transition-colors disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {footerSubStatus === 'loading' ? '...' : 'UNIRSE'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="mt-24 pt-10 border-t border-[var(--color-border)] text-center space-y-3">
                        <p className="text-[10px] text-[var(--color-text-muted)] tracking-[0.4em] font-medium uppercase">
                            AGUSTIN MASOERO — CUIT: 20-29140387-6 — RESPONSABLE INSCRIPTO
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] tracking-[0.3em] font-medium uppercase">
                            Córdoba 1543, Rosario, Santa Fe
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)]/60 tracking-[0.8em] font-medium uppercase">ESTABLISHED 2026 — ROSARIO / SANTA FE</p>
                        <a
                            href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-[8px] text-[var(--color-text-muted)] hover:text-black tracking-[0.2em] font-medium uppercase transition-colors"
                        >
                            Defensa del Consumidor
                        </a>
                        <p className="text-[8px] text-[#999] tracking-[0.2em] font-medium mb-4">Diseño web Vince</p>
                        
                        <div className="flex justify-center pt-2">
                             <a
                                href="https://qr.afip.gob.ar/?qr=20291403876"
                                target="_F960AFIPInfo"
                                rel="noopener noreferrer"
                                title="Datos Fiscales — ARCA"
                                className="opacity-40 hover:opacity-100 transition-opacity"
                            >
                                <img
                                    src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg"
                                    alt="QR ARCA"
                                    className="w-7 h-7 mx-auto"
                                />
                            </a>
                        </div>
                    </div>
                </footer>

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cart}
                onRemove={removeFromCart}
                onUpdateQty={updateQuantity}
                onCheckout={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                }}
            />

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onConfirm={handleCheckoutConfirm}
                total={cart.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0)}
            />

            {successOrderData && (
                <OrderSuccessModal
                    order={successOrderData.order}
                    bankDetails={successOrderData.bankDetails}
                    whatsappNumber={successOrderData.whatsappNumber}
                    whatsappMsg={successOrderData.whatsappMsg}
                    onClose={() => setSuccessOrderData(null)}
                />
            )}

            <CustomerAuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onLoginSuccess={(user) => setCustomer(user)}
            />

            <StoreLocationsModal
                isOpen={isLocationsOpen}
                onClose={() => setIsLocationsOpen(false)}
            />

            <FavoritesDrawer
                isOpen={isFavoritesOpen}
                onClose={() => setIsFavoritesOpen(false)}
                favorites={products.filter(p => favorites.includes(p.id))}
                onRemoveFavorite={toggleFavorite}
                onOpenDetail={(p) => openProduct(p)}
            />

            {
                selectedProduct && (
                    <ProductDetail
                        product={selectedProduct}
                        isOpen={!!selectedProduct}
                        onClose={() => closeProduct()}
                        onAddToCart={(p, size, color) => {
                            addToCart(p, size, color);
                            setTimeout(() => {
                                closeProduct();
                                setIsCartOpen(true);
                            }, 800);
                        }}
                        isFavorite={favorites.includes(selectedProduct.id)}
                        onToggleFavorite={toggleFavorite}
                    />
                )
            }
            <NewsletterModal />
        </div >
    );
};

export default Store;
