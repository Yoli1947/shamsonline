
import React from 'react';
import { Plus, Heart } from 'lucide-react';
import { Product } from '../types';
import { COLOR_MAP } from '../lib/constants';
import { useSettings } from '../context/SettingsContext';

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
                className={`h-1 rounded-none transition-all duration-500 ${hoverIndex === idx ? 'w-6 bg-[#C4956A]' : 'w-1 bg-[#2C1810]/20'}`}
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

        {/* Favorites Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(product.id);
          }}
          className={`absolute top-3 right-3 md:top-4 md:right-4 transition-all duration-300 z-20 ${isFavorite ? 'text-red-500' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
        >
          <div className={`p-2.5 rounded-none bg-white/80 backdrop-blur-md border border-[var(--color-border)] ${isFavorite ? 'bg-red-50 border-red-200' : ''}`}>
            <Heart size={18} className={`transition-colors ${isFavorite ? 'fill-red-500' : 'stroke-[1.5px]'}`} />
          </div>
        </button>

        {/* Floating Quick Add */}
        <div className="absolute bottom-6 right-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-30 hidden md:block">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail(product); }}
            className="bg-[#2C1810] text-white p-4 rounded-none shadow-2xl hover:bg-[#C4956A] transition-colors"
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
              const colorHex = (COLOR_MAP as any)[colorKey] || '#C4956A';
              return (
                <div key={idx} className="group/color relative">
                  <div
                    className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-none border border-[var(--color-border)] shadow-sm transition-all group-hover/color:scale-125 ring-offset-2 ring-offset-[#FAF7F2] group-hover/color:ring-1 ring-[#C4956A]"
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
          <div className="flex items-center gap-2">
            <span className="text-sm md:text-sm font-bold text-[var(--color-text)] tracking-tighter">
              ${(product.originalPrice > product.price ? product.originalPrice : (product.price || 0)).toLocaleString()}
            </span>
            <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-widest mt-1">CRÉDITO / DÉBITO</span>
          </div>
          {(() => {
            const creditPrice = product.originalPrice > product.price ? product.originalPrice : (product.price || 0);
            const transferPrice = product.originalPrice > product.price ? product.price : Math.round((product.price || 0) * 0.85);
            const discountPct = Math.round((creditPrice - transferPrice) / creditPrice * 100);
            return (
              <div className="flex flex-col items-start gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-xs font-bold text-emerald-700 tracking-tighter">
                    ${transferPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest mt-1">
                    TRANSFERENCIA {discountPct > 0 ? `${discountPct}% OFF` : ''}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onOpenDetail(product); }}
          className="mt-4 w-full py-4 rounded-none font-medium text-[11px] md:text-[12px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center bg-[#2C1810]/5 hover:bg-[#C4956A] text-[var(--color-text)] hover:text-white active:scale-[0.98] border border-[var(--color-border)] hover:border-[#C4956A] shadow-sm hover:shadow-md overflow-hidden relative group/btn"
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
