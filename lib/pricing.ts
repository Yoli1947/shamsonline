import { Product } from '../types';

/**
 * Precio de crédito/débito y de transferencia para un producto.
 *
 * Cuando el producto está en SALE (compareAtPrice != null), el precio de
 * transferencia se calcula siempre sobre el price vigente (ya con el SALE
 * aplicado) al % configurado — ignorando cualquier sale_price legado, para
 * no aplicar el descuento dos veces.
 */
export function getProductPricing(product: Product, transferDiscount: number) {
    const isOnSale = !!product.compareAtPrice && product.compareAtPrice > product.originalPrice;

    const creditPrice = isOnSale
        ? product.originalPrice
        : (product.originalPrice > product.price ? product.originalPrice : (product.price || 0));

    const transferPrice = isOnSale
        ? Math.round(product.originalPrice * (1 - transferDiscount / 100))
        : (product.originalPrice > product.price
            ? product.price
            : Math.round((product.price || 0) * (1 - transferDiscount / 100)));

    const discountPct = creditPrice > 0 ? Math.round((creditPrice - transferPrice) / creditPrice * 100) : 0;
    const saleDiscountPct = isOnSale ? Math.round((1 - product.originalPrice / product.compareAtPrice!) * 100) : 0;

    return { isOnSale, creditPrice, transferPrice, discountPct, saleDiscountPct };
}
