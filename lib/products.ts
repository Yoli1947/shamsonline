// Mapea productos crudos de Supabase (con sus joins de brand/category/images/variants)
// al shape de Product que usa el storefront. Extraído de Store.tsx para poder
// reutilizarlo en otras páginas (ej. SaleLastChance) sin duplicar la lógica.
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
            brand: p.brand?.name || 'MULTIBRAND',
            price: p.sale_price && p.sale_price < p.price ? p.sale_price : p.price,
            originalPrice: p.price,
            compareAtPrice: p.compare_at_price && p.compare_at_price > p.price ? p.compare_at_price : null,
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
