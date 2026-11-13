import React from 'react';
import { RefreshCw, Leaf } from 'lucide-react';
import { hasTravelBag, hasLinen, isReversible, isDetachable, hasNaturalFibers } from '../lib/products';

// Etiquetas de características de la prenda (Travel bag, Lino, Fibras
// naturales, Reversible, Desmontable).
// Se usan en las tarjetas de la grilla y en los carruseles del inicio; van
// dentro de una columna flex posicionada por quien las usa.
const ProductBadges: React.FC<{ product: { name?: string; description?: string | null } }> = ({ product }) => (
  <>
    {hasTravelBag(product) && (
      <span className="w-11 h-11 md:w-12 md:h-12 bg-[#3a3a3a]/90 flex flex-col items-center justify-center leading-none shadow-sm" style={{ borderRadius: "9999px" }} title="Incluye travel bag">
        <span className="text-white text-[10px] md:text-[11px] font-medium">Travel</span>
        <span className="text-[#F5C518] text-[10px] md:text-[11px] font-medium">bag</span>
      </span>
    )}
    {hasLinen(product) && (
      <span className="self-start flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm" style={{ borderRadius: "9999px" }} title="Prenda de lino">
        <svg width="16" height="12" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--color-text)]" aria-hidden="true">
          <path d="M16 13c-3-1-5-4-4-7 1-2 4-2 5 0 1-2 4-2 5 0 1 3-1 6-4 7" />
          <path d="M16 13c-2 2-6 3-8 1-2-2-1-5 1-5" />
          <path d="M16 13c2 2 6 3 8 1 2-2 1-5-1-5" />
          <path d="M16 13v8" />
        </svg>
        <span className="text-[8px] md:text-[9px] font-semibold tracking-[0.15em] text-[var(--color-text)]">LINO</span>
      </span>
    )}
    {hasNaturalFibers(product) && (
      <span className="self-start flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm" style={{ borderRadius: "9999px" }} title="Fibras naturales">
        <Leaf size={12} className="stroke-[1.5px] text-[var(--color-text)]" aria-hidden="true" />
        <span className="text-[8px] md:text-[9px] font-semibold tracking-[0.15em] text-[var(--color-text)]">FIBRAS NATURALES</span>
      </span>
    )}
    {isReversible(product) && (
      <span className="self-start flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm" style={{ borderRadius: "9999px" }} title="Prenda reversible">
        <RefreshCw size={12} className="stroke-[1.5px] text-[var(--color-text)]" aria-hidden="true" />
        <span className="text-[8px] md:text-[9px] font-semibold tracking-[0.15em] text-[var(--color-text)]">REVERSIBLE</span>
      </span>
    )}
    {isDetachable(product) && (
      <span className="self-start flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm" style={{ borderRadius: "9999px" }} title="Prenda desmontable">
        <svg width="10" height="14" viewBox="0 0 20 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-[var(--color-text)]" aria-hidden="true">
          <path d="M10 1v6" />
          <path d="M6 3h3M11 5h3M6 7h3" />
          <path d="M10 7l-5 9M10 7l5 9" />
          <rect x="7" y="17" width="6" height="10" rx="2" />
        </svg>
        <span className="text-[8px] md:text-[9px] font-semibold tracking-[0.15em] text-[var(--color-text)]">DESMONTABLE</span>
      </span>
    )}
  </>
);

export default ProductBadges;
