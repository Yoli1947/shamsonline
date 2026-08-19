
import React from 'react';
import { Plus, Heart, Share2 } from 'lucide-react';
import { Product } from '../types';
import { COLOR_MAP } from '../lib/constants';
import { useSettings } from '../context/SettingsContext';
import { getProductPricing } from '../lib/pricing';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
  onOpenDetail: (p: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onOpenDetail, isFavorite = false, onToggleFavorite }) => {
  const { settings } = useSettings();
  const [hoverIndex, setHoverIndex] = React.useState(0);
  const transferDiscount = settings.transfer_discount || 15;

  const totalStock = product.variants?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 0;
  const isOutOfStock = totalStock === 0;

  const discount = product.originalPrice > 0 ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  const { isOnSale, saleDiscountPct } = getProductPricing(product, transferDiscount);

  const imageList = React.useMemo(() => {
    const baseImages = (product.images && product.images.length > 0 ? product.images : [product.image]).map(url => ({ url, color: '', inStock: !isOutOfStock }));
    if (!product.imageObjects || product.imageObjects.length === 0) return baseImages;

    const colorStock = (product.variants || []).reduce((acc: Record<string, number>, v) => {
      const color = (v.color || '').trim().toLowerCase();
      acc[color] = (acc[color] || 0) + (Number(v.stock) || 0);
      return acc;
    }, {});

    const hasInStockVariants = (color: string) => (colorStock[color.trim().toLowerCase()] || 0) > 0;

    const allImages = product.imageObjects.map(img => ({
      url: img.url,
      color: img.color || '',
      inStock: (img.color && colorStock[img.color.trim().toLowerCase()] !== undefined)
        ? hasInStockVariants(img.color)
        : !isOutOfStock
    })).sort((a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1));

    const availableImages = allImages.filter(img => img.inStock);
    return availableImages.length > 0 ? availableImages : allImages;
  }, [product, isOutOfStock]);

  const images = imageList.map(img => img.url);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = product.sku ? `${window.location.origin}/producto/${product.sku}` : window.location.href;
    const shareText = `Mirá este producto: ${product.name}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: shareText, url: shareUrl });
        return;
      }
    } catch (error) {
      // El usuario canceló la acción de compartir.
      return;
    }

    const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="group relative flex flex-col h-full">
      <div
        className="relative aspect-[2/3] md:aspect-[3/4] overflow-hidden rounded-sm md:rounded-none bg-[var(--color-background-alt)] border border-[var(--color-border)] neo-glow transition-all duration-700 shadow-sm cursor-zoom-in"
        onClick={() => onOpenDetail(product)}
        onTouchStart={(e) => {
          (e.currentTarget as any).touchStartX = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const startX = (e.currentTarget as any).touchStartX;
          if (!startX) return;
          const endX = e.changedTouches[0].clientX;
          const diff = startX - endX;

          if (Math.abs(diff) > 40 && images.length > 1) {
            e.stopPropagation();
            if (diff > 0) {
              setHoverIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
            } else {
              setHoverIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
            }
          }
        }}
      >
        <img
          src={images[hoverIndex]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement as HTMLElement;
            if (parent && !parent.querySelector('.fallback-img')) {
              const fallback = document.createElement('div');
              fallback.className = 'fallback-img absolute inset-0 flex items-center justify-center bg-[var(--color-background-alt)] text-[var(--color-text-muted)]/30';
              fallback.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
              parent.appendChild(fallback);
            }
          }}
        />

        {/* Carousel Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setHoverIndex(idx);
                }}
                className={`h-1 rounded-none transition-all duration-500 ${hoverIndex === idx ? 'w-6 bg-[#DCDCDC]' : 'w-1 bg-[#2C1810]/20'}`}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-2">
          <span className="bg-white/80 backdrop-blur-sm text-[var(--color-text)] text-[8px] md:text-[9px] px-3 py-1.5 md:px-4 rounded-none uppercase font-semibold tracking-[0.15em] border border-[var(--color-border)] shadow-sm">
            {product.brand}
          </span>
          {isOutOfStock && (
            <span className="bg-[#B5451B]/80 backdrop-blur-md text-white text-[8px] md:text-[9px] px-3 py-1.5 md:px-4 rounded-none font-semibold tracking-[0.15em]">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Favorites & Share Buttons */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col gap-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleFavorite) onToggleFavorite(product.id);
            }}
            className={`transition-all duration-300 ${isFavorite ? 'text-red-500' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            aria-label="Agregar a favoritos"
            title="Agregar a favoritos"
          >
            <div className={`p-2.5 rounded-none bg-white/80 backdrop-blur-md border border-[var(--color-border)] ${isFavorite ? 'bg-red-50 border-red-200' : ''}`}>
              <Heart size={18} className={`transition-colors ${isFavorite ? 'fill-red-500' : 'stroke-[1.5px]'}`} />
            </div>
          </button>
          <button
            onClick={handleShare}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all duration-300"
            aria-label="Compartir producto"
            title="Compartir producto"
          >
            <div className="p-2.5 rounded-none bg-white/80 backdrop-blur-md border border-[var(--color-border)]">
              <Share2 size={18} className="stroke-[1.5px]" />
            </div>
          </button>
        </div>

        {/* Floating Quick Add */}
        <div className="absolute bottom-6 right-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-30 hidden md:block">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail(product); }}
            className="bg-[#2C1810] text-white p-4 rounded-none shadow-2xl hover:bg-[#DCDCDC] transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="mt-4 md:mt-5 px-1 flex flex-col gap-3 flex-1">
        {/* Colors as circles */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {Array.from(new Set(product.variants.filter(v => (Number(v.stock) || 0) > 0).map(v => v.color))).filter(Boolean).map((color, idx) => {
              const colorStr = String(color);
              const colorKey = colorStr.toLowerCase().trim();
              const colorHex = (COLOR_MAP as any)[colorKey] || '#DCDCDC';
              return (
                <div key={idx} className="group/color relative">
                  <div
                    className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-none border border-[var(--color-border)] shadow-sm transition-all group-hover/color:scale-125 ring-offset-2 ring-offset-[#FAF7F2] group-hover/color:ring-1 ring-[#DCDCDC]"
                    style={{ backgroundColor: colorHex }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Model Name */}
        <div className="flex flex-col gap-1">
          <h3 className="text-[var(--color-text)]/80 font-medium text-[11px] md:text-[13px] tracking-wide uppercase leading-snug break-words group-hover:text-[var(--color-text)] transition-colors" title={product.name}>
            {product.name}
          </h3>
        </div>

        {/* Prices */}
        <div className="mt-auto pt-2 space-y-1.5">
          {isOnSale && (
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)] line-through tracking-tighter">
                ${product.compareAtPrice!.toLocaleString()}
              </span>
              <span className="text-[12px] font-black bg-red-600 text-white px-2 py-1 tracking-tighter uppercase">
                -{saleDiscountPct}% OFF
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[12px] md:text-[13px] font-bold text-[var(--color-text)] tracking-tighter leading-none">
              ${getProductPricing(product, transferDiscount).creditPrice.toLocaleString()}
            </span>
            <span className="text-[9px] font-medium text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">CRÉDITO / DÉBITO</span>
          </div>
          {(() => {
            const { creditPrice, transferPrice, discountPct } = getProductPricing(product, transferDiscount);
            return (
              <div className="bg-black/[0.03] p-2 mt-1 -mx-2 flex flex-col gap-1 border-l-2 border-black/10 hover:border-black transition-colors group/discount">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] md:text-[13px] font-black text-black tracking-tighter">
                      ${transferPrice.toLocaleString()}
                    </span>
                    <span className="text-[8px] md:text-[9px] font-black text-black/40 uppercase tracking-[0.2em] group-hover/discount:text-black transition-colors">
                      TRANSFERENCIA
                    </span>
                  </div>
                  {discountPct > 0 && (
                    <span className="text-[12px] font-black bg-red-600 text-white px-2 py-1 tracking-tighter uppercase">
                      -{discountPct}%
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onOpenDetail(product); }}
          className="mt-4 w-full py-4 rounded-none font-medium text-[11px] md:text-[12px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center bg-[#2C1810]/5 hover:bg-[#DCDCDC] text-[var(--color-text)] hover:text-white active:scale-[0.98] border border-[var(--color-border)] hover:border-[#DCDCDC] shadow-sm hover:shadow-md overflow-hidden relative group/btn"
        >
          <span className="relative z-10">EXPLORAR PIEZA</span>
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
