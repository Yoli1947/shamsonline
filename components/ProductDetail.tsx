
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Check, ChevronDown, Heart } from 'lucide-react';
import { Product } from '../types';
import { COLOR_MAP, SIZE_ORDER, sortSizes } from '../lib/constants';
import { useSettings } from '../context/SettingsContext';

interface ProductDetailProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (p: Product, size?: string, color?: string) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, isOpen, onClose, onAddToCart, isFavorite, onToggleFavorite }) => {
    const { settings } = useSettings();
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const transferDiscount = settings.transfer_discount || 15;
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [added, setAdded] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
    const [isZooming, setIsZooming] = useState(false);
    const rafRef = useRef<number | null>(null);

    // Reset image index and selections when product or modal visibility changes
    useEffect(() => {
        if (isOpen) {
            const variantsWithStock = product.variants?.filter(v => (v.stock || 0) > 0) || [];
            setCurrentImgIndex(0);
            setSelectedSize('');
            setSelectedColor(variantsWithStock[0]?.color || '');
            setAdded(false);
        }
    }, [isOpen, product]);

    const totalStock = product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;
    const isOutOfStock = totalStock === 0;

    if (!isOpen) return null;

    // Simplified version: just all images from imageObjects if they exist
    const imageList = useMemo(() => {
        if (!product.imageObjects || product.imageObjects.length === 0) {
            return (product.images && product.images.length > 0 ? product.images : [product.image]).map(url => ({
                url,
                color: '',
                inStock: true
            }));
        }

        const colorStock = (product.variants || []).reduce((acc: Record<string, number>, v) => {
            const color = (v.color || '').trim().toLowerCase();
            acc[color] = (acc[color] || 0) + (v.stock || 0);
            return acc;
        }, {});

        // Debug log to ensure match
        // console.log('Color Stock:', colorStock);

        return product.imageObjects.map(img => {
            const colorKey = img.color?.trim().toLowerCase();
            const hasExplicitColorMatch = colorKey && colorStock[colorKey] !== undefined;

            return {
                url: img.url,
                color: img.color || '',
                inStock: hasExplicitColorMatch ? (colorStock[colorKey] > 0) : !isOutOfStock
            };
        }).sort((a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1));
    }, [product]);

    // Filter out images that are out of stock
    // Only show them if the ENTIRE product is out of stock (availableImages is empty)
    const availableImages = imageList.filter(img => img.inStock);
    const finalImageList = availableImages.length > 0 ? availableImages : imageList;

    const images = finalImageList.map(img => img.url);

    // ... (rest of filtering code for colors/sizes if needed)
    const variantsWithStock = product.variants?.filter(v => (v.stock || 0) > 0) || [];

    // Available colors (with codes for swatches)
    const colorOptions = useMemo(() => {
        const options: { name: string, code: string }[] = [];
        const seen = new Set();

        variantsWithStock.forEach(v => {
            if (v.color && !seen.has(v.color)) {
                seen.add(v.color);
                options.push({
                    name: v.color,
                    code: v.color_code || (COLOR_MAP as any)[v.color.toLowerCase().trim()] || '#CCCCCC'
                });
            }
        });
        return options;
    }, [variantsWithStock]);

    // Available sizes (filtered by color if one is selected)
    const sizes = useMemo(() => {
        let filteredVariants = variantsWithStock;
        if (selectedColor) {
            filteredVariants = variantsWithStock.filter(v => v.color === selectedColor);
        }
        const normalize = (s: string) => s?.toUpperCase() === '2X' ? '2XL' : s?.toUpperCase() === '3X' ? '3XL' : s?.toUpperCase() === '4X' ? '4XL' : s;
        return Array.from(new Set(filteredVariants.map(v => normalize(v.size))))
            .filter(Boolean)
            .sort(sortSizes);
    }, [variantsWithStock, selectedColor]);

    // Reset selected size if it's not available in the newly selected color
    useEffect(() => {
        if (selectedColor && selectedSize) {
            const isAvailable = variantsWithStock.some(v => v.color === selectedColor && v.size === selectedSize);
            if (!isAvailable) {
                setSelectedSize('');
            }
        }
    }, [selectedColor, variantsWithStock]);

    const handleAddToCart = () => {
        onAddToCart(product, selectedSize, selectedColor);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (rafRef.current) return; // skip si ya hay un frame pendiente
        const rect = e.currentTarget.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        rafRef.current = requestAnimationFrame(() => {
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;
            setZoomPos({ x, y });
            rafRef.current = null;
        });
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-[#2C1810]/40 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-[var(--color-background)] w-full max-w-5xl h-[100dvh] md:h-[750px] max-h-[100dvh] md:max-h-[95vh] rounded-none md:rounded-[1.5rem] flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in duration-300 border-0 md:border md:border-[var(--color-border)] overflow-y-auto overflow-x-hidden md:overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="fixed md:absolute top-4 right-4 z-20 bg-[var(--color-background)]/40 hover:bg-[var(--color-background-alt)] backdrop-blur-md border border-[#C4956A]/20 text-[var(--color-text)] p-2 rounded-none transition-all"
                >
                    <X size={20} />
                </button>

                <div className={`w-full md:w-[60%] h-[100dvh] md:h-full shrink-0 relative bg-white flex flex-col md:flex-row overflow-hidden ${isZooming ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}>
                    {/* Thumbnails (Side - Desktop) */}
                    {images.length > 1 && (
                        <div className="hidden md:flex flex-col w-[110px] h-full py-6 px-4 gap-4 overflow-y-auto bg-white border-r border-black/5 no-scrollbar relative">
                            {finalImageList.map((imgData, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImgIndex(idx)}
                                    className={`relative flex-shrink-0 w-full aspect-[3/4] rounded-sm overflow-hidden transition-all duration-300 ${currentImgIndex === idx ? 'ring-2 ring-black ring-offset-2' : 'opacity-60 hover:opacity-100'}`}
                                >
                                    <img
                                        src={imgData.url}
                                        alt="Thumb"
                                        loading="lazy"
                                        className={`w-full h-full object-cover ${imgData.inStock ? '' : 'grayscale'}`}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            const parent = target.parentElement as HTMLElement;
                                            if (parent) parent.style.display = 'none';
                                        }}
                                    />
                                    {!imgData.inStock && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                            <span className="text-[6px] font-black text-white bg-red-600 px-1 py-0.5 rounded leading-none uppercase">AGOTADO</span>
                                        </div>
                                    )}
                                </button>
                            ))}

                            {/* Down Arrow Indicator */}
                            {images.length > 4 && (
                                <div className="mt-auto pt-6 flex justify-center text-black/40 animate-bounce">
                                    <div className="flex flex-col items-center gap-0">
                                        <div className="w-[1px] h-4 bg-current"></div>
                                        <ChevronDown size={14} className="-mt-1" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        className="flex-1 relative overflow-hidden group flex items-center justify-center p-0"
                        onMouseMove={handleMouseMove}
                        onClick={() => setIsZooming(!isZooming)}
                        onTouchStart={(e) => {
                            (e.currentTarget as any).touchStartX = e.touches[0].clientX;
                        }}
                        onTouchEnd={(e) => {
                            const startX = (e.currentTarget as any).touchStartX;
                            if (!startX) return;
                            const endX = e.changedTouches[0].clientX;
                            const diff = startX - endX;
                            if (Math.abs(diff) > 40 && images.length > 1) {
                                if (diff > 0) {
                                    setCurrentImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
                                } else {
                                    setCurrentImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
                                }
                            }
                        }}
                    >
                        <img
                            src={images[currentImgIndex]}
                            alt={product.name}
                            className={`max-h-full max-w-full object-contain p-0 transition-transform duration-200 ${isZooming ? 'scale-[2.5]' : 'scale-100'} ${!finalImageList[currentImgIndex].inStock ? 'grayscale opacity-50' : ''}`}
                            style={isZooming ? {
                                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                            } : {}}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const container = target.parentElement as HTMLElement;
                                if (container) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-full h-full flex items-center justify-center text-zinc-800 flex-col gap-2';
                                    fallback.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-[8px] uppercase tracking-widest font-black opacity-30">Imagen no disponible</span>';
                                    container.appendChild(fallback);
                                }
                            }}
                        />

                        {!finalImageList[currentImgIndex].inStock && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                <div className="bg-red-600/90 text-white px-6 py-2 rounded-none font-black text-xs tracking-[0.3em] shadow-xl border border-white/20 uppercase backdrop-blur-sm">
                                    AGOTADO
                                </div>
                            </div>
                        )}

                        {/* Nav Arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
                                        setIsZooming(false);
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur text-black p-2 rounded-none shadow-lg hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
                                        setIsZooming(false);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur text-black p-2 rounded-none shadow-lg hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails (Bottom - Mobile Only) */}
                    {images.length > 1 && (
                        <div className="md:hidden h-20 p-3 flex gap-3 overflow-x-auto bg-zinc-100 border-t border-black/5">
                            {finalImageList.map((imgData, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImgIndex(idx)}
                                    className={`relative w-12 h-12 flex-shrink-0 rounded-none overflow-hidden border-2 transition-all ${currentImgIndex === idx ? 'border-black scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img
                                        src={imgData.url}
                                        alt="Thumb"
                                        loading="lazy"
                                        className={`w-full h-full object-cover ${imgData.inStock ? '' : 'grayscale'}`}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            const parent = target.parentElement as HTMLElement;
                                            if (parent) parent.style.display = 'none';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Info */}
                <div className="w-full md:w-[40%] p-6 md:p-8 md:overflow-y-auto flex flex-col bg-[var(--color-background)] min-h-[50vh]">
                    <div className="flex-1">
                        <div className="mb-1">
                            <span className="text-[#C4956A] uppercase tracking-[0.4em] text-[8px] font-black">{product.brand}</span>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="font-heading text-xl md:text-2xl font-bold tracking-tighter text-[var(--color-text)] uppercase leading-none break-words pr-4">{product.name}</h2>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onToggleFavorite) onToggleFavorite(product.id); }}
                                className={`transition-colors flex-shrink-0 ${isFavorite ? 'text-red-500' : 'text-[var(--color-text)]/20 hover:text-red-500'}`}
                            >
                                <Heart size={24} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
                            </button>
                        </div>

                        <div className="mb-4 space-y-2">
                            <div className="flex items-center gap-4">
                                <span className="text-xl md:text-2xl font-black text-[var(--color-text)] tracking-tighter">
                                    ${(product.originalPrice > product.price ? product.originalPrice : (product.price || 0)).toLocaleString()}
                                </span>
                                <span className="text-[11px] font-black tracking-widest text-[var(--color-text-muted)] uppercase mt-auto pb-1.5">Crédito / Débito</span>
                            </div>
                            {(() => {
                                const creditPrice = product.originalPrice > product.price ? product.originalPrice : (product.price || 0);
                                const transferPrice = product.originalPrice > product.price ? product.price : Math.round((product.price || 0) * 0.85);
                                const discountPct = Math.round((creditPrice - transferPrice) / creditPrice * 100);
                                return (
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tighter">
                                            ${transferPrice.toLocaleString()}
                                        </span>
                                        <span className="text-[11px] font-black tracking-widest text-emerald-500 uppercase mt-auto pb-1.5">Transferencia</span>
                                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-none text-[10px] font-black tracking-widest mt-auto mb-1.5">-{discountPct}%</span>
                                    </div>
                                );
                            })()}
                        </div>

                        <a
                            href={`https://wa.me/5493412175258?text=${encodeURIComponent(`Hola! Quería consultar por el pago vía transferencia de: ${product.name}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-none hover:bg-emerald-500/20 transition-all group"
                        >
                            <span className="w-2 h-2 bg-emerald-500 rounded-none group-hover:animate-pulse" />
                            <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">Consultar transferencia por WhatsApp</span>
                        </a>

                        <div className="h-px bg-white/5 w-full mb-4" />

                        {/* Stock status */}
                        {isOutOfStock && (
                            <div className="mb-6 p-4 bg-red-600/20 border border-red-600/40 rounded-none text-center">
                                <span className="text-red-500 text-xs font-black tracking-[0.3em] uppercase">
                                    ARTÍCULO AGOTADO
                                </span>
                            </div>
                        )}

                         {/* Color Display - Show name only as requested */}
                        {selectedColor && (
                            <div className="mb-6 flex items-center gap-3">
                                <span className="text-[10px] font-black tracking-[0.3em] text-[var(--color-text-muted)] uppercase">COLOR SELECCIONADO:</span>
                                <span className="text-[#C4956A] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-background-alt)] px-3 py-1.5 rounded-none border border-[var(--color-border)]">
                                    {selectedColor}
                                </span>
                            </div>
                        )}

                        {/* Color Selection - Hidden as per request, auto-selected in useEffect */}
                        {/* {colorOptions.length > 0 && (
                            <div className="mb-8">
                                <label className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase block mb-4">
                                    COLOR: <span className="text-[#C4956A] ml-2">{selectedColor || 'SELECCIONAR'}</span>
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {colorOptions.map((opt, idx) => {
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedColor(opt.name)}
                                                className={`w-10 h-10 rounded-none border-2 p-1 transition-all duration-300 ${selectedColor === opt.name ? 'border-[#C4956A] scale-110 shadow-[0_0_15px_rgba(196,149,106,0.4)]' : 'border-white/10 hover:border-white/30 hover:scale-105'}`}
                                                title={opt.name}
                                            >
                                                <div
                                                    className="w-full h-full rounded-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                                                    style={{ backgroundColor: opt.code }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )} */}

                         {/* Size Selection */}
                        {sizes.length > 0 && (
                            <div className="mb-8">
                                <label className="text-[11px] font-black tracking-[0.2em] text-[#C4956A] uppercase block mb-4">
                                    SELECCIONAR MI TALLE:
                                </label>
                                 <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                    {sizes.map((size, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedSize(String(size))}
                                            className={`h-14 flex items-center justify-center rounded-none border-2 text-[14px] font-black tracking-widest transition-all duration-300 ${selectedSize === String(size) ? 'bg-[#C4956A] text-white border-[#C4956A] scale-105' : 'bg-[var(--color-background-alt)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[#C4956A] hover:text-[#C4956A]'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                         <div className="mb-6">
                            <h4 className="text-[8px] font-black tracking-widest text-[var(--color-text-muted)] uppercase mb-2">Descripción</h4>
                            <p className="text-[var(--color-text-muted)] text-[11px] leading-relaxed tracking-wide font-medium whitespace-pre-line break-words">
                                {product.description || 'Este exclusivo artículo de Shams combina diseño premium con materiales de alta calidad.'}
                            </p>
                        </div>
                    </div>

                     <div className="pt-4 border-t border-[var(--color-border)] bg-[var(--color-background)] md:sticky md:bottom-0 mt-auto">
                        <button
                            onClick={handleAddToCart}
                            disabled={added || isOutOfStock || (sizes.length > 0 && !selectedSize)}
                            className={`w-full py-4 rounded-none flex items-center justify-center gap-3 font-black tracking-[0.2em] text-[10px] uppercase transition-all shadow-xl ${isOutOfStock
                                ? 'bg-[var(--color-background-alt)] text-[var(--color-text-muted)] cursor-not-allowed'
                                : added
                                    ? 'bg-emerald-500 text-white'
                                    : (sizes.length > 0 && !selectedSize)
                                        ? 'bg-[var(--color-background-alt)] text-[var(--color-text-muted)] cursor-not-allowed'
                                        : 'bg-[#C4956A] text-white hover:bg-[#2C1810] active:scale-[0.98]'
                                }`}
                        >
                            {isOutOfStock ? (
                                'AGOTADO'
                            ) : added ? (
                                <><Check size={18} /> ¡AGREGADO!</>
                            ) : (sizes.length > 0 && !selectedSize) ? (
                                'SELECCIONAR TALLE'
                            ) : (
                                <><ShoppingBag size={18} /> AÑADIR AL CARRITO</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
