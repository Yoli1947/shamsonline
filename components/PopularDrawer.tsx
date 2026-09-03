import React from 'react';
import { X } from 'lucide-react';
import { Product } from '../types';

interface PopularDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onOpenDetail: (product: Product) => void;
}

const PopularDrawer: React.FC<PopularDrawerProps> = ({ isOpen, onClose, products, onOpenDetail }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-start">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-sm h-full bg-white flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.25)] animate-in slide-in-from-left duration-500">

                <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-black">Más populares</h2>
                    <button onClick={onClose} className="text-black/60 hover:text-black transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {products.length === 0 ? (
                        <div className="h-full flex items-center justify-center px-8 text-center">
                            <p className="text-black/40 text-sm uppercase tracking-widest">Todavía no hay productos destacados</p>
                        </div>
                    ) : (
                        products.map((item, idx) => (
                            <div
                                key={item.id}
                                onClick={() => { onClose(); onOpenDetail(item); }}
                                className="flex items-center gap-4 px-6 py-4 border-b border-black/5 cursor-pointer hover:bg-black/[0.02] transition-colors"
                            >
                                <div className="relative flex-shrink-0">
                                    <span className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-red-500 text-white text-[11px] font-black flex items-center justify-center rounded-none">
                                        {idx + 1}
                                    </span>
                                    <div className="w-16 h-20 bg-[#f5f5f5] overflow-hidden">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-black">${(item.price || 0).toLocaleString()}</p>
                                    <p className="text-[11px] text-black/50 uppercase tracking-wide truncate">{item.name}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PopularDrawer;
