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

// Grupo de la grilla: 0 ropa/calzado nuevos, 1 accesorios nuevos,
// 2 ropa/calzado del resto, 3 accesorios del resto.
export function getStoreTier(p: SortableProduct & { category?: any }) {
    return (isRecentProduct(p) ? 0 : 2) + (isAccessoryProduct(p) ? 1 : 0);
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
