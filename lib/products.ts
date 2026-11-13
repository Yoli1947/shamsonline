// Mapea productos crudos de Supabase (con sus joins de brand/category/images/variants)
// al shape de Product que usa el storefront. Extraído de Store.tsx para poder
// reutilizarlo en otras páginas (ej. SaleLastChance) sin duplicar la lógica.

// Cuántos días se considera "ingreso reciente" para mostrarlo primero en la tienda.
const RECENT_DAYS = 30;

export function mapProductsToUI(dbProducts: any[]) {
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
            // La DB no garantiza el orden de las fotos embebidas: la principal va
            // primero y el resto respeta el orden que se definió en el admin.
            [...p.images]
                .sort((a: any, b: any) => {
                    if (!!a.is_primary !== !!b.is_primary) return a.is_primary ? -1 : 1;
                    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
                })
                .forEach((img: any) => galleryImages.push({ url: img.url, color: img.alt_text || 'Principal', isPrimary: !!img.is_primary }));
        }

        const legacyUrls = [p.image_url, p.image_url_2, p.image_url_3, p.image_url_4].filter(Boolean);
        legacyUrls.forEach(url => {
            if (!galleryImages.some(gi => gi.url === url)) {
                galleryImages.push({ url, color: 'Principal', isPrimary: false });
            }
        });

        // La "imagen principal" que se marca a mano en el editor de producto
        // (ProductForm.jsx, is_primary) es la que debe mostrarse como foto de
        // portada en toda la tienda — típicamente la del modelo con la prenda
        // puesta, a diferencia de fotos planas/de detalle que vienen después.
        const primaryImage = galleryImages.find(gi => gi.isPrimary);

        return {
            id: p.id,
            name: cleanProductName(p.name),
            brand: p.brand?.name || 'MULTIBRAND',
            price: p.sale_price && p.sale_price < p.price ? p.sale_price : p.price,
            originalPrice: p.price,
            compareAtPrice: p.compare_at_price && p.compare_at_price > p.price ? p.compare_at_price : null,
            image: primaryImage?.url || galleryImages[0]?.url || 'https://via.placeholder.com/400x500?text=No+Image',
            images: galleryImages.map(gi => gi.url),
            imageObjects: galleryImages,
            category: p.category?.name || 'General',
            description: p.description || '',
            features: features,
            variants: p.variants,
            is_published: p.is_published,
            is_active: p.is_active,
            sort_order: p.sort_order,
            createdAt: p.created_at || null,
            season: p.season || null,
            brandCardUrl: p.brand?.card_image_url,
            is_featured: p.is_featured,
            isSalePick: !!p.is_sale_pick,
            isAnticipoSS27: !!p.is_anticipo_ss27,
            sku: p.sku || null
        };
    });

    return mapped.sort(compareStoreProducts);
}

type SortableProduct = { createdAt?: string | null; sort_order?: number; name?: string };

// Orden por defecto de la tienda:
//  1. Ingresos de los últimos RECENT_DAYS días, del más nuevo al más viejo
//     (van antes que el orden manual: si no, los sort_order viejos los tapan).
//  2. Orden manual (sort_order) del admin.
//  3. El resto, del más nuevo al más viejo.
export function isRecentProduct(p: SortableProduct) {
    const recentSince = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();
    return !!p.createdAt && p.createdAt >= recentSince;
}

export function compareStoreProducts(a: SortableProduct, b: SortableProduct) {
    const recentA = isRecentProduct(a);
    const recentB = isRecentProduct(b);
    if (recentA !== recentB) return recentA ? -1 : 1;

    if (!recentA) {
        const sortA = a.sort_order || 99999;
        const sortB = b.sort_order || 99999;
        if (sortA !== sortB) return sortA - sortB;
    }
    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
        return a.createdAt < b.createdAt ? 1 : -1;
    }
    return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
}

// Accesorios (gorras, bolsos, mochilas, paraguas...): van después de la ropa y
// el calzado. En el storefront `category` es el nombre (string).
export function isAccessoryProduct(p: { category?: any }) {
    const cat = String((typeof p.category === 'string' ? p.category : p.category?.name) || '').toUpperCase();
    return cat.includes('ACCESORIO') || cat.includes('BOLSO') || cat.includes('CARTERA');
}

// Temporada de verano (PV25, PV26, PV27...).
export function isSummerProduct(p: { season?: string | null }) {
    return (p.season || '').toUpperCase().startsWith('PV');
}

// Grupo de la grilla: 0 ropa/calzado de verano o nuevos, 1 accesorios nuevos,
// 2 ropa/calzado del resto, 3 accesorios del resto.
export function getStoreTier(p: SortableProduct & { category?: any; season?: string | null }) {
    if (isAccessoryProduct(p)) return isRecentProduct(p) ? 1 : 3;
    return isRecentProduct(p) || isSummerProduct(p) ? 0 : 2;
}

// Marcas que van primero dentro de la ropa/calzado nuevos.
const PRIORITY_BRANDS = ['PERRAMUS', 'HUNTER'];
export function isPriorityBrand(p: { brand?: any }) {
    const brand = String((typeof p.brand === 'string' ? p.brand : p.brand?.name) || '').toUpperCase();
    return PRIORITY_BRANDS.includes(brand);
}

// Shorts (no las botas "Original Short" de Hunter).
export function isShortProduct(p: { name?: string; category?: any }) {
    const name = (p.name || '').toUpperCase();
    const cat = String((typeof p.category === 'string' ? p.category : p.category?.name) || '').toUpperCase();
    return /\bSHORTS?\b/.test(name) && !/\bBOOTS?\b/.test(name) && !cat.includes('CALZADO');
}

// Orden dentro de la ropa/calzado nuevos: primero Perramus, después Hunter,
// después sus shorts, después las demás marcas (Nautica...).
export function getNewArrivalRank(p: { brand?: any; name?: string; category?: any }) {
    if (!isPriorityBrand(p)) return 3;
    if (isShortProduct(p)) return 2;
    const brand = String((typeof p.brand === 'string' ? p.brand : p.brand?.name) || '').toUpperCase();
    return brand === 'PERRAMUS' ? 0 : 1;
}

// Ordena la ropa/calzado de verano o nuevos según getNewArrivalRank, pero
// intercalando Perramus y Hunter: dos Perramus, un Hunter, y así.
export function orderNewArrivals<T extends { brand?: any; name?: string; category?: any }>(items: T[]): T[] {
    const byRank = (r: number) => items.filter(p => getNewArrivalRank(p) === r);
    const perramus = byRank(0);
    const hunter = byRank(1);
    const mixed: T[] = [];
    while (perramus.length || hunter.length) {
        mixed.push(...perramus.splice(0, 2), ...hunter.splice(0, 1));
    }
    return [...mixed, ...byRank(2), ...byRank(3)];
}

// Cada color de un artículo es un producto aparte cuyo SKU solo cambia en las
// letras finales (ej. P11101051H habano, P11101051V verde). El "código base"
// es el SKU sin esas letras.
export const getBaseSku = (sku?: string | null) => {
    const match = sku?.trim().match(/^(.*\d)[A-Za-z]+$/);
    return match && /\d{4,}/.test(match[1]) ? match[1] : null;
};

// Línea de producto: primera palabra significativa del nombre, sin la marca
// (ej. "HUNTER SCUBA JOGGER NEGRO" -> "SCUBA").
const BRAND_WORDS = new Set(['HUNTER', 'PERRAMUS', 'NAUTICA']);
const getProductLine = (name?: string) =>
    (name || '').toUpperCase().split(/\s+/).find(w => w.length > 1 && !BRAND_WORDS.has(w)) || '';

// Reordena mezclando: evita que los colores del mismo artículo queden en la
// misma fila (ventana de 4) y que dos productos de la misma línea queden
// pegados. Respeta el orden original todo lo posible: en cada lugar pone el
// primer producto pendiente que no choque; si todos chocan, el primero.
export function spreadSimilarProducts<T extends { sku?: string | null; name?: string; id?: string }>(items: T[]): T[] {
    const ARTICLE_WINDOW = 4;
    const LINE_WINDOW = 1;
    const pending = items.map(item => ({
        item,
        article: getBaseSku(item.sku) || item.sku || item.id || '',
        line: getProductLine(item.name),
    }));
    const result: typeof pending = [];
    while (pending.length) {
        const recentArticles = result.slice(-ARTICLE_WINDOW).map(p => p.article);
        const recentLines = result.slice(-LINE_WINDOW).map(p => p.line);
        let idx = pending.findIndex(p => !recentArticles.includes(p.article) && !recentLines.includes(p.line));
        if (idx === -1) idx = pending.findIndex(p => !recentArticles.includes(p.article));
        if (idx === -1) idx = 0;
        result.push(pending.splice(idx, 1)[0]);
    }
    return result.map(p => p.item);
}

// Descuento "real" de SALE: solo cuenta cuando el producto tiene compareAtPrice
// (el precio tachado + "-X% OFF" que se ve en la tarjeta). No cuenta el precio
// más bajo por sale_price (mecanismo legado) ni el descuento genérico por
// transferencia, que se aplican a casi todo el catálogo y no son una oferta
// puntual del producto.
export function getDiscountPct(p: any): number {
    const isOnSale = !!p.compareAtPrice && p.compareAtPrice > p.originalPrice;
    if (!isOnSale) return 0;
    return Math.round((1 - p.originalPrice / p.compareAtPrice) * 100);
}

// Prendas que vienen con travel bag (bolsa para guardarlas). Se detecta por la
// descripción: "travel bag" o una "bolsa" que en la misma frase habla de
// guardar la prenda, hacerla packable o viajes ("Bolsa para guardar prenda",
// "bolsa para hacer la prenda packable", "Bolsa packable para viajes"...).
const TRAVEL_BAG_RE = /travel\s*bag|\bbolsa\b[^.\n]{0,40}(guard|packable|viaje)/i;
export function hasTravelBag(p: { description?: string | null }) {
    return TRAVEL_BAG_RE.test(p.description || '');
}

// Prendas de lino (o con lino en la composición). Se busca en la descripción
// sin el nombre, porque "LINO" también se usa como nombre de color.
export function hasLinen(p: { name?: string; description?: string | null }) {
    let text = p.description || '';
    if (p.name) text = text.split(p.name).join(' ');
    return /\blino\b/i.test(text);
}

// Prendas reversibles (lo dice la descripción).
export function isReversible(p: { description?: string | null }) {
    return /\breversible\b/i.test(p.description || '');
}

// Prendas con mangas, abrigo, chaleco o campera interna desmontable. No
// cuentan la capucha, la correa, la pechera, el cuello ni el borde de piel de
// la capucha, ni lo que solo "simula" ser desmontable (Betim).
const DETACHABLE_RE = /mangas\s+y\s+capucha\s+desmontables|(manga|abrigo|chaleco|campera interna|abrigo de piel)s?\b((?!capucha)[^.\n]){0,40}?desmontables?/i;
export function isDetachable(p: { name?: string; description?: string | null }) {
    let text = p.description || '';
    if (p.name) text = text.split(p.name).join(' ');
    return DETACHABLE_RE.test(text);
}

// Prendas de fibras naturales: lo dice la descripción ("fibras vegetales y
// naturales", "fibra natural") o son de ramio. "linen feel" no es lino real.
export function hasNaturalFibers(p: { name?: string; description?: string | null }) {
    const text = (p.description || '').replace(/linen feel/gi, '');
    return /fibras?\s+(\w+\s+y\s+)?naturale?s?\b/i.test(text) || /\bramio\b/i.test(text);
}
