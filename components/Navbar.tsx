import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, User, X, Heart, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categoriesByGender?: {
    Mujer: any[];
    Hombre: any[];
  };
  brands?: any[];
  onOpenAuth: () => void;
  customerName?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  favoritesCount,
  onOpenFavorites,
  searchQuery,
  onSearchChange,
  categoriesByGender,
  brands,
  onOpenAuth,
  customerName,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-md border-b border-[var(--color-border)] px-4 md:px-8 py-4 shadow-sm"
      style={{ backgroundColor: 'var(--color-background)', opacity: 1 }}
    >
      {/* Two-row layout: Centered Logo above, Links and icons below */}
      <div className="flex flex-col items-center w-full gap-4 md:gap-6">
        
        {/* TOP ROW: Centered Logo */}
        <div className="w-full flex justify-center">
          <div
            onClick={() => navigate('/')}
            className="group relative cursor-pointer"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <h1
              className="font-heading text-3xl md:text-5xl font-bold tracking-[0.35em] md:tracking-[0.4em] whitespace-nowrap uppercase"
              style={{ color: '#000000' }}
            >
              SHAMS
            </h1>
            <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#000000] group-hover:w-full transition-all duration-500 ease-out" />
          </div>
        </div>

        {/* BOTTOM ROW: Navigation Links (Desktop) and Actions */}
        <div className="flex items-center justify-between w-full relative">
          
          {/* Mobile menu button (Hamburger) - Absolute left on mobile */}
          <button
            className="md:hidden hover:text-[var(--color-text)] transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* Desktop Links (Centered) */}
          <div className="hidden md:flex items-center gap-8 lg:gap-12 absolute left-1/2 -translate-x-1/2">
            <button
              className="hover:text-black transition-all uppercase text-[10px] lg:text-[12px] font-normal tracking-[0.12em] border-b border-transparent hover:border-black/5 pb-0.5"
              style={{ color: '#666666' }}
              onClick={() => navigate('/marcas')}
            >
              MARCAS
            </button>
            <button
              className="hover:text-black transition-all uppercase text-[10px] lg:text-[12px] font-normal tracking-[0.12em] border-b border-transparent hover:border-black/5 pb-0.5"
              style={{ color: '#666666' }}
              onClick={() => navigate('/?genero=Mujer#new')}
            >
              MUJER
            </button>
            <button
              className="hover:text-black transition-all uppercase text-[10px] lg:text-[12px] font-normal tracking-[0.12em] border-b border-transparent hover:border-black/5 pb-0.5"
              style={{ color: '#666666' }}
              onClick={() => navigate('/?genero=Hombre#new')}
            >
              HOMBRE
            </button>
            <button
              className="hover:text-black transition-all uppercase text-[10px] lg:text-[12px] font-normal tracking-[0.12em] border-b border-transparent hover:border-black/5 pb-0.5"
              style={{ color: '#666666' }}
              onClick={() => navigate('/?categoria=Accesorios#new')}
            >
              ACCESORIOS
            </button>
            <a
              href="https://www.shamsoutlet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-all uppercase text-[10px] lg:text-[12px] font-normal tracking-[0.12em] border-b border-transparent hover:border-black/5 pb-0.5"
              style={{ color: '#666666' }}
            >
              OUTLET
            </a>
            {isAdmin && (
              <button
                className="flex items-center gap-2 hover:text-black transition-all font-normal uppercase text-[10px] lg:text-[12px] border-l border-zinc-200 pl-8 ml-4 tracking-[0.12em]"
                style={{ color: '#666666' }}
                onClick={() => navigate('/admin/login')}
              >
                <Settings size={14} className="animate-spin-slow opacity-40" />
                PANEL
              </button>
            )}
          </div>

          {/* RIGHT - Actions (Desktop & Mobile) */}
          <div className="flex items-center gap-3 lg:gap-5 justify-end flex-1 md:flex-none md:ml-auto">
            {/* Animated Search */}
            <div className="flex items-center">
              <div
                className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-36 md:w-48 opacity-100 overflow-visible' : 'w-0 opacity-0 overflow-hidden'}`}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="BUSCAR..."
                  className="bg-transparent border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-widest focus:outline-none w-full pb-1"
                  style={{ color: 'var(--color-text)' }}
                  autoFocus={isSearchOpen}
                />
              </div>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`hover:text-[#C4956A] transition-colors p-2 ${isSearchOpen ? 'text-[#C4956A]' : ''}`}
                style={{ color: 'var(--color-text)' }}
              >
                <Search size={20} />
              </button>
            </div>

            {/* Auth */}
            <button
              onClick={onOpenAuth}
              className="hover:text-[#C4956A] transition-colors"
              style={{ color: 'var(--color-text)' }}
              title={customerName ? `Hola, ${customerName}` : 'Cuenta'}
            >
              <User size={20} />
            </button>

            {/* Favorites */}
            <button
              onClick={onOpenFavorites}
              className="relative hover:text-red-500 transition-colors p-2"
              style={{ color: 'var(--color-text)' }}
            >
              <Heart size={20} className={favoritesCount > 0 ? 'fill-red-500 text-red-500' : ''} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-black h-4 w-4 flex items-center justify-center rounded-none font-sans">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={onOpenCart}
              className="relative hover:text-[#C4956A] transition-colors p-2"
              style={{ color: 'var(--color-text)' }}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C4956A] text-white text-[8px] font-black h-4 w-4 flex items-center justify-center rounded-none font-sans">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 bg-[#2C1810]/40 backdrop-blur-sm z-[110] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`fixed top-0 left-0 bottom-0 w-[65vw] max-w-sm border-r border-[var(--color-border)] p-6 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ backgroundColor: 'var(--color-background)' }}
          onClick={e => e.stopPropagation()}
          onTouchStart={e => {
            (e.currentTarget as any).touchStartX = e.touches[0].clientX;
          }}
          onTouchEnd={e => {
            const startX = (e.currentTarget as any).touchStartX;
            if (!startX) return;
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) setIsMobileMenuOpen(false);
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-12 pb-6 border-b border-[var(--color-border)]" style={{ color: 'var(--color-text)' }}>
            <h2 className="font-heading text-xl font-bold tracking-[0.3em] text-[var(--color-text)]">MENÚ</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-screen flex items-center justify-center rounded-none border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'INICIO', action: () => navigate('/') },
              { label: 'MARCAS', action: () => navigate('/marcas') },
              { label: 'MUJER', action: () => navigate('/?genero=Mujer#new') },
              { label: 'HOMBRE', action: () => navigate('/?genero=Hombre#new') },
              { label: 'ACCESORIOS', action: () => navigate('/?categoria=Accesorios#new') },
            ].map((item, index) => (
              <button
                key={index}
                className="group relative flex items-center justify-between w-full text-left py-2 font-medium tracking-[0.2em] uppercase text-xl hover:text-[var(--color-text)] transition-all"
                style={{ color: 'var(--color-text)' }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  item.action();
                }}
              >
                <span>{item.label}</span>
                <span className="mb-8 h-[2px] bg-[#C4956A] transform origin-right scale-x-0 transition-transform group-hover:scale-x-100" style={{ color: 'var(--color-text)' }} />
              </button>
            ))}
            <a
              href="https://www.shamsoutlet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-between w-full text-left py-2 font-medium tracking-[0.2em] uppercase text-xl hover:text-[#C4956A] transition-all"
              style={{ color: 'var(--color-text)' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>OUTLET</span>
            </a>

            {isAdmin && (
              <button
                className="group relative flex items-center justify-between w-full text-left py-4 font-medium tracking-[0.2em] uppercase text-xl border-t border-[var(--color-border)] mt-4"
                style={{ color: 'var(--color-accent)' }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/admin/login');
                }}
              >
                <span>PANEL DE CONTROL</span>
                <Settings size={20} />
              </button>
            )}
          </div>

          <div className="mt-auto pt-8 border-t border-[#E5D5C5] text-center" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-[12px] font-black tracking-[0.6em]" style={{ color: 'var(--color-text)' }}>SHAMS</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
