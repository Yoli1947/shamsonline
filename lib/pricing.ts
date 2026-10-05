import { Product } from '../types';

/**
 * Precio de crédito/débito y de transferencia/efectivo para un producto.
 *
 * El precio de transferencia es SIEMPRE el de crédito menos el % configurado,
 * igual que lo que cobra el checkout. Antes, si el producto tenía un sale_price
 * legado, se mostraba ese valor como precio de transferencia (ej. -26%), que
 * no coincidía con lo que después se cobraba.
 */
export function getProductPricing(product: Product, transferDiscount: number) {
    const isOnSale = !!product.compareAtPrice && product.compareAtPrice > product.originalPrice;

    const creditPrice = isOnSale
        ? product.originalPrice
        : (product.originalPrice > product.price ? product.originalPrice : (product.price || 0));

    const transferPrice = Math.round(creditPrice * (1 - transferDiscount / 100));

    const discountPct = creditPrice > 0 ? Math.round((creditPrice - transferPrice) / creditPrice * 100) : 0;
    const saleDiscountPct = isOnSale ? Math.round((1 - product.originalPrice / product.compareAtPrice!) * 100) : 0;

    return { isOnSale, creditPrice, transferPrice, discountPct, saleDiscountPct };
}
