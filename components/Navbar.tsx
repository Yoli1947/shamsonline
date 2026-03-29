import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { ShoppingBag, Search, Menu, User, X, Heart, Settings, Gift } from 'lucide-react';
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
    <>
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
            <button
              className="hover:text-black transition-all uppercase text-[10px] lg:text-[12px] font-normal tracking-[0.12em] border-b border-transparent hover:border-black/5 pb-0.5"
              style={{ color: '#666666' }}
              onClick={() => navigate('/marcas')}
            >
              MARCAS
            </button>
            <button
              className="hover:text-black transition-all uppercase text-[10px] lg:text-[12px] font-normal tracking-[0.12em] border-b border-transparent hover:border-black/5 pb-0.5 flex items-center gap-1"
              style={{ color: '#666666' }}
              onClick={() => navigate('/gift-cards')}
            >
              <Gift size={12} />
              GIFT CARDS
            </button>
            <button
              className="hover:text-red-600 transition-all uppercase text-[10px] lg:text-[12px] font-bold tracking-[0.12em] border-b border-transparent hover:border-red-600/10 pb-0.5"
              style={{ color: '#d32f2f' }}
              onClick={() => window.open('https://shamsoutlet.com', '_blank')}
            >
              OUTLET
            </button>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  placeholder="BUSCAR..."
                  className="bg-transparent border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-widest focus:outline-none w-full pb-1"
                  style={{ color: 'var(--color-text)' }}
                  autoFocus={isSearchOpen}
                />
              </div>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`hover:text-black transition-colors p-2 ${isSearchOpen ? 'text-black' : ''}`}
                style={{ color: 'var(--color-text)' }}
              >
                <Search size={20} />
              </button>
            </div>

            {/* Auth */}
            <button
              onClick={onOpenAuth}
              className="hover:text-black transition-colors"
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
              className="relative hover:text-black transition-colors p-2"
              style={{ color: 'var(--color-text)' }}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-black h-4 w-4 flex items-center justify-center rounded-none font-sans">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>


    </nav>

    {isMobileMenuOpen && ReactDOM.createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#ffffff',
        zIndex: 99999,
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.3em', color: '#000' }}>MENÚ</span>
          <button onClick={() => setIsMobileMenuOpen(false)}
            style={{ padding: '8px 12px', fontSize: '20px', color: '#000', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            ✕
          </button>
        </div>

        {/* Links */}
        {[
          { label: 'INICIO', action: () => navigate('/') },
          { label: 'MUJER', action: () => navigate('/?genero=Mujer#new') },
          { label: 'HOMBRE', action: () => navigate('/?genero=Hombre#new') },
          { label: 'ACCESORIOS', action: () => navigate('/?categoria=Accesorios#new') },
          { label: 'MARCAS', action: () => navigate('/marcas') },
        ].map((item, index) => (
          <button key={index} onClick={() => { setIsMobileMenuOpen(false); item.action(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '18px 0', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', color: '#000', background: 'none', border: 'none', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
            {item.label}
          </button>
        ))}
        <button onClick={() => { setIsMobileMenuOpen(false); navigate('/gift-cards'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', padding: '18px 0', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', color: '#000', background: 'none', border: 'none', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
          <Gift size={18} />
          GIFT CARDS
        </button>
        <button onClick={() => { setIsMobileMenuOpen(false); window.open('https://shamsoutlet.com', '_blank'); }}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '18px 0', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', color: '#d32f2f', background: 'none', border: 'none', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
          OUTLET
        </button>
        {isAdmin && (
          <button onClick={() => { setIsMobileMenuOpen(false); navigate('/admin/login'); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '18px 0', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', color: '#888', background: 'none', border: 'none', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
            PANEL DE CONTROL
          </button>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '32px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5em', color: '#000' }}>SHAMS</span>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default Navbar;
