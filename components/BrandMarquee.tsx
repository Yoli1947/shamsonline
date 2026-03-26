
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const BrandMarquee: React.FC = () => {
  const [brands, setBrands] = useState<{ name: string, logo_url: string | null }[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function fetchBrands() {
      const { data } = await supabase
        .from('brands')
        .select('name, logo_url')
        .eq('is_active', true)
        .order('name');

      if (data) {
        setBrands(data.map(b => ({ name: b.name, logo_url: b.logo_url })));
      }
    }
    fetchBrands();
  }, []);

  const handleBrandClick = (brandName: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('marca', brandName);
    // Navegamos al ancla #new para que vea los productos filtrados
    navigate(`/?${params.toString()}#new`, { replace: true });

    // Pequeño scroll suave por si el ancla no es suficiente
    const element = document.getElementById('new');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Display default text if specific brands aren't loaded or available
  const displayItems = brands.length > 0 ? brands : [{ name: 'SHAMS', logo_url: null }];

  return (
    <div className="py-4 md:py-6 border-y border-[var(--color-border)] overflow-hidden bg-white relative z-10">
      <div className="animate-marquee flex items-center min-w-full">
        {[...displayItems, ...displayItems, ...displayItems, ...displayItems].map((brand, idx) => (
          <div
            key={idx}
            className="flex items-center px-2 md:px-3 group shrink-0"
            onClick={() => handleBrandClick(brand.name)}
          >
            <span className="text-[10px] md:text-sm font-medium px-4 py-2 md:px-6 md:py-2.5 rounded-none border border-[#C4956A]/40 bg-white/60 text-[var(--color-text-muted)] transition-all duration-300 group-hover:bg-[#C4956A] group-hover:text-white group-hover:border-[#C4956A] group-hover:scale-110 cursor-pointer whitespace-nowrap uppercase tracking-widest">
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandMarquee;
