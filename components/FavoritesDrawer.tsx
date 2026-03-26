import React from 'react';
import { X, Heart, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';

interface FavoritesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    favorites: Product[];
    onRemoveFavorite: (id: string) => void;
    onOpenDetail: (product: Product) => void;
}

const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({ isOpen, onClose, favorites, onRemoveFavorite, onOpenDetail }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Overlay with blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-md h-full bg-[#080808] border-l border-white/10 flex flex-col shadow-[ -20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500">

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-none bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <Heart size={20} className="text-red-500 fill-red-500" />
                        </div>
                        <h2 className="font-heading text-lg font-bold tracking-[0.2em] text-white uppercase">Tus Favoritos</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-all hover:rotate-90 duration-300">
                        <X size={28} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {favorites.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-8">
                            <div className="h-24 w-24 rounded-none bg-white/5 flex items-center justify-center mb-8 border border-white/10 relative">
                                <Heart size={40} className="text-zinc-700" />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-none animate-pulse blur-sm" />
                            </div>
                            <p className="text-zinc-400 text-sm font-medium tracking-widest leading-relaxed uppercase opacity-60">No tienes productos guardados</p>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/#new');
                                }}
                                className="mt-10 px-8 py-3 bg-white text-black font-black text-[10px] tracking-[0.4em] rounded-none hover:bg-red-500 hover:text-white hover:scale-105 transition-all uppercase"
                            >
                                Explorar Colección
                            </button>
                        </div>
                    ) : (
                        favorites.map((item) => (
                            <div key={item.id} className="flex gap-4 p-4 rounded-none bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all duration-300 hover:border-white/10 cursor-pointer" onClick={() => { onClose(); onOpenDetail(item); }}>
                                <div className="h-24 w-20 rounded-none overflow-hidden flex-shrink-0 border border-white/10 bg-black">
                                    <img src={item.image} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.name} />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-[11px] font-black uppercase tracking-widest text-white leading-tight pr-4">{item.name}</h3>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemoveFavorite(item.id); }}
                                                className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <p className="text-[9px] text-red-500 font-black uppercase tracking-[0.2em]">{item.brand}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex flex-col items-end gap-0.5">
                                            {item.originalPrice > item.price && (
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[12px] text-zinc-400/60 line-through decoration-red-600 decoration-2 font-bold tracking-wider">
                                                        ${(item.originalPrice || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded-none font-black">
                                                        -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                                                    </span>
                                                </div>
                                            )}
                                            <span className="text-base font-bold text-white tracking-widest">
                                                ${(item.price || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoritesDrawer;
