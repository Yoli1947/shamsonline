
import React from 'react';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { useSettings } from '../context/SettingsContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string, size?: string, color?: string) => void;
  onUpdateQty: (id: string, delta: number, size?: string, color?: string) => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onRemove, onUpdateQty, onCheckout }) => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const transferDiscount = settings.transfer_discount || 15;
  const rawTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasPromo = localStorage.getItem('shams_promo_10') === 'true';
  const total = hasPromo ? rawTotal * 0.9 : rawTotal;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md h-full bg-[var(--color-background)] border-l border-[var(--color-border)] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-500">

        {/* Header */}
        <div className="p-8 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-background-alt)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-none bg-[#C4956A]/10 flex items-center justify-center border border-[#C4956A]/20">
              <ShoppingBag size={20} className="text-[#C4956A]" />
            </div>
            <h2 className="font-heading text-lg font-bold tracking-[0.2em] text-[var(--color-text)] uppercase">Tu Carrito</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all hover:rotate-90 duration-300">
            <X size={28} />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="h-24 w-24 rounded-none bg-[var(--color-background-alt)] flex items-center justify-center mb-8 border border-[var(--color-border)] relative">
                <ShoppingBag size={40} className="text-[var(--color-text-muted)]/30" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#C4956A] rounded-none blur-sm opacity-50" />
              </div>
              <p className="text-[var(--color-text-muted)] text-sm font-medium tracking-widest leading-relaxed uppercase opacity-60">Tu selección está vacía</p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/#new');
                }}
                className="mt-10 px-8 py-3 bg-[#2C1810] text-white font-black text-[10px] tracking-[0.4em] rounded-none hover:bg-[#C4956A] hover:scale-105 transition-all uppercase"
              >
                Explorar Colección
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 rounded-none bg-[var(--color-background-alt)]/50 border border-[var(--color-border)] group hover:bg-[var(--color-background-alt)] transition-all duration-300">
                <div className="h-24 w-20 rounded-none overflow-hidden flex-shrink-0 border border-[var(--color-border)] bg-white">
                  <img src={item.image} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.name} />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text)] leading-tight">{item.name}</h3>
                      <button
                        onClick={() => onRemove(item.id, item.selectedSize, item.selectedColor)}
                        className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-[9px] text-[#C4956A] font-black uppercase tracking-[0.2em]">{item.brand}</p>
                      {(item.selectedSize || item.selectedColor || (item as any).isGiftCard) && (
                        <div className="flex flex-col gap-1 border-l border-[var(--color-border)] pl-3">
                          {(item as any).isGiftCard ? (
                            <>
                              <span className="text-[10px] text-[var(--color-text-muted)] font-bold tracking-wider">
                                PARA: <span className="text-[var(--color-text)]">{(item as any).recipientName}</span>
                              </span>
                              <span className="text-[10px] text-[var(--color-text-muted)] font-bold tracking-wider">
                                DE: <span className="text-[var(--color-text)]">{(item as any).senderName}</span>
                              </span>
                            </>
                          ) : (
                            <>
                              {item.selectedSize && (
                                <span className="text-[10px] text-[var(--color-text-muted)] font-bold tracking-wider">
                                  TALLE: <span className="text-[var(--color-text)]">{item.selectedSize}</span>
                                </span>
                              )}
                              {item.selectedColor && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[var(--color-text-muted)] font-bold tracking-wider uppercase">COLOR:</span>
                                  <div
                                    className="w-3 h-3 rounded-none border border-[var(--color-border)] shadow-sm"
                                    style={{ backgroundColor: item.selectedColorCode || '#CCCCCC' }}
                                    title={item.selectedColor}
                                  />
                                  <span className="text-[10px] text-[var(--color-text)] font-bold uppercase">{item.selectedColor}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                   <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 bg-white border border-[var(--color-border)] rounded-none px-4 py-1.5 shadow-sm">
                      <button onClick={() => onUpdateQty(item.id, -1, item.selectedSize, item.selectedColor)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-lg font-light">-</button>
                      <span className="text-xs font-black w-4 text-center text-[var(--color-text)]">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, 1, item.selectedSize, item.selectedColor)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-lg font-light">+</button>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      {item.originalPrice > item.price && (
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12px] text-[var(--color-text-muted)] font-bold tracking-wider">
                            ${((item.originalPrice || 0) * (item.quantity || 1)).toLocaleString()}
                          </span>
                          <span className="text-[9px] bg-[#C4956A]/10 text-[#C4956A] border border-[#C4956A]/20 px-1.5 py-0.5 rounded-none font-black">
                            -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                          </span>
                        </div>
                      )}
                       <span className="text-base font-bold text-[var(--color-text)] tracking-widest">
                        ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

         {/* Footer */}
        {items.length > 0 && (
          <div className="p-8 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-2xl">
            <div className="flex flex-col gap-3 mb-6">
              {/* Precio Total */}
              <div className="flex justify-between items-center px-1">
                <span className="text-[var(--color-text-muted)] text-[10px] tracking-[0.4em] font-black uppercase">Total</span>
                <span className="text-[var(--color-text)] text-3xl font-bold tracking-tighter">${(total || 0).toLocaleString()}</span>
              </div>
               {hasPromo && (
                <span className="text-[10px] text-[#C4956A] font-bold tracking-widest text-center uppercase">+ 10% OFF CÓDIGO PROMO APLICADO</span>
              )}
            </div>

             <div className="flex flex-col gap-3">
              <button
                onClick={onCheckout}
                className="w-full bg-[#C4956A] text-white py-6 rounded-none font-black text-xs tracking-[0.4em] hover:brightness-110 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 uppercase"
              >
                FINALIZAR COMPRA <ArrowRight size={20} />
              </button>

               <button
                onClick={onClose}
                className="w-full bg-white text-[var(--color-text)] py-6 rounded-none font-black text-xs tracking-[0.4em] border border-[var(--color-border)] hover:bg-[var(--color-background-alt)] transition-all flex items-center justify-center gap-3 active:scale-95 uppercase"
              >
                SEGUIR COMPRANDO
              </button>
            </div>
            <p className="text-center text-zinc-600 text-[8px] font-bold tracking-[0.3em] mt-6 uppercase">Transacción encriptada de 256 bits</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
