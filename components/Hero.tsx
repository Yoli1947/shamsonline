import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    image: "/banners/perramus-banner.jpg",
    title: "MULTIBRAND / PERRAMUS",
    subtitle: "WINTER SALE",
    description: "Calidad y diseño de vanguardia. Descubrí la Winter Sale de Perramus en Multibrand.",
    objectPosition: "center",
    letterbox: true,
    split: { overlaySrc: "/banners/perramus-sale.png" },
    hideOverlayText: true,
    grayscale: true
  },
  {
    image: "/banners/hunter-22.webp",
    title: "MULTIBRAND / HUNTER",
    subtitle: "COLECCIÓN EXCLUSIVA",
    description: "Resiliencia y estilo icónico para el aire libre. La sofisticación de las botas Hunter en Multibrand.",
    objectPosition: "center",
    logo: true,
    shrinkMobile: true
  },
  {
    image: "/banners/nautica-banner.webp",
    title: "MULTIBRAND / NAUTICA",
    subtitle: "AUTUMN / WINTER 2026",
    description: "Herencia náutica, mirada contemporánea.",
    objectPosition: "right",
    letterbox: true,
    captionLogo: "/banners/nautica-logo.png",
    hideOverlayText: true,
    bgColor: "bg-white",
    captionDark: true
  }
];

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const timer = setInterval(nextSlide, isMobile ? 2500 : 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const scrollToCollection = () => {
    const section = document.getElementById('new');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-[90vh] md:h-[100vh] w-full flex flex-col items-center justify-center overflow-hidden pt-12 md:pt-0 group bg-black">
      
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 flex items-center justify-center transition-all duration-[1000ms] ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
          } ${(slide as any).bgColor || 'bg-black'}`}
        >
          {(slide as any).letterbox ? (
            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-6 md:gap-10 px-4 ${(slide as any).bgColor || 'bg-black'}`}>
              <div className="relative w-full aspect-[4/3] md:aspect-[1920/636]">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: slide.objectPosition,
                    filter: (slide as any).grayscale ? 'grayscale(1)' : undefined
                  }}
                />
                {(slide as any).split && (
                  <div
                    className="absolute top-0 left-0 h-full flex items-center justify-center overflow-hidden"
                    style={{ width: '32.8%', backgroundColor: '#3a0a0a' }}
                  >
                    <img
                      src={(slide as any).split.overlaySrc}
                      alt={`${slide.title} — Sale`}
                      className="h-full w-auto"
                    />
                  </div>
                )}
                {/* Texto y marca superpuestos sobre la imagen (lado de la foto, no sobre el panel izquierdo) */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-4 text-center px-3 py-3"
                  style={{ paddingLeft: '32.8%' }}
                >
                  {(slide as any).captionLogo ? (
                    <img
                      src={(slide as any).captionLogo}
                      alt={slide.title}
                      className="h-6 md:h-11 drop-shadow-lg"
                    />
                  ) : (
                    <h2 className="font-serif font-bold text-xl sm:text-2xl md:text-6xl text-white tracking-tight drop-shadow-2xl">
                      {slide.title.split(' / ')[1]}
                    </h2>
                  )}
                  <p className="text-white text-[9px] md:text-sm tracking-[0.2em] uppercase font-light max-w-[220px] md:max-w-xl drop-shadow-2xl leading-relaxed">
                    {slide.description}
                  </p>
                  <button
                    onClick={scrollToCollection}
                    className="mt-1 md:mt-3 bg-white text-black px-5 py-2.5 md:px-10 md:py-4 rounded-none font-bold text-[8px] md:text-xs tracking-[0.3em] md:tracking-[0.4em] hover:bg-black hover:text-white transition-all flex items-center gap-2 md:gap-3 shadow-2xl uppercase border border-white/20 group relative z-[70] cursor-pointer"
                  >
                    VER COLECCIÓN <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={slide.image}
              alt={slide.title}
              className={`w-full transition-all duration-1000 ${
                (slide as any).objectFit === 'contain' ? 'object-contain' : 'object-cover'
              } ${
                (slide as any).shrinkMobile ? 'aspect-[4/3] md:aspect-auto md:h-full' : 'h-full'
              }`}
              style={{
                objectPosition: slide.objectPosition,
                filter: `contrast(1.08) brightness(1.05) saturate(1.02)`,
                imageRendering: 'auto',
                transform: `scale(${(slide as any).imageScale ?? 1})`
              }}
            />
          )}

        </div>
      ))}

      {/* Content Area */}
      {!(slides[currentSlide] as any).hideOverlayText && (
      <div className="relative z-[60] text-center px-4 md:px-6 max-w-5xl mt-12 md:mt-16">

        {/* Animated Slide Content */}
        <div key={currentSlide} className="animate-in fade-in slide-in-from-bottom-8 duration-1000">

          {/* Tag */}
          <div className="inline-block px-5 py-2 border border-white/30 rounded-none mb-8 backdrop-blur-md bg-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
            <span className="text-[10px] tracking-[0.5em] uppercase text-white font-black flex items-center gap-3">
              {slides[currentSlide].subtitle}
            </span>
          </div>

          {/* Title */}
          {(slides[currentSlide] as any).logo ? (
            <div className="mb-6 flex justify-center">
              <div className="inline-block bg-white border-4 border-[#E2001A] px-8 py-3 md:px-14 md:py-5 shadow-2xl">
                <span className="text-black font-black text-3xl md:text-7xl tracking-tight uppercase">
                  {slides[currentSlide].title.split(' / ')[1]}
                </span>
              </div>
            </div>
          ) : (
            <h2 className="font-heading text-4xl md:text-8xl font-black mb-6 leading-tight tracking-[0.3em] text-white uppercase drop-shadow-2xl">
              {slides[currentSlide].title.split(' / ')[1]}
            </h2>
          )}

          {/* Description */}
          <p className="text-white/90 text-sm md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed tracking-widest drop-shadow-xl italic">
            {slides[currentSlide].description}
          </p>

          {/* Button */}
          <button
            onClick={scrollToCollection}
            className="bg-white text-black px-12 py-4 md:px-16 md:py-5 rounded-none font-bold text-[11px] md:text-xs tracking-[0.5em] hover:bg-black hover:text-white transition-all flex items-center gap-4 mx-auto shadow-2xl uppercase border border-white/20 group relative z-[70] cursor-pointer"
          >
            VER COLECCIÓN <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
      )}

      {/* Manual Transition Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-50 p-3 text-white/30 hover:text-white transition-all opacity-0 group-hover:opacity-100 transform active:scale-95"
      >
        <ChevronLeft size={48} strokeWidth={1} />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-50 p-3 text-white/30 hover:text-white transition-all opacity-0 group-hover:opacity-100 transform active:scale-95"
      >
        <ChevronRight size={48} strokeWidth={1} />
      </button>

      {/* Progress Dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex gap-6">
        {slides.map((_, i) => {
          const dark = (slides[currentSlide] as any).captionDark;
          return (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`transition-all duration-700 h-[2px] ${
                i === currentSlide
                  ? (dark ? 'w-16 bg-black' : 'w-16 bg-white')
                  : (dark ? 'w-8 bg-black/20 hover:bg-black/50' : 'w-8 bg-white/20 hover:bg-white/50')
              }`}
            />
          );
        })}
      </div>

      {/* Sideways Text decoration */}
      <div className="absolute left-8 bottom-24 hidden xl:block z-40 opacity-40">
        <span className={`text-[10px] uppercase tracking-[0.7em] font-black flex items-center gap-3 ${(slides[currentSlide] as any).captionDark ? 'text-black' : 'text-white'}`} style={{ writingMode: 'vertical-rl' }}>
          FW / COLLECTION / 2026
        </span>
      </div>

    </div>
  );
};

export default Hero;



