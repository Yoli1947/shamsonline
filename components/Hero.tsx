import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    image: "/banners/perramus-verano-foto.jpg",
    title: "MULTIBRAND / PERRAMUS",
    subtitle: "DÍA DE LA MADRE",
    description: "Regalale Perramus en su día.",
    fullVideo: "/banners/perramus-dia-de-la-madre.mp4",
    hideOverlayText: true
  },
  {
    image: "/banners/hunter-kate.webp",
    title: "MULTIBRAND / HUNTER",
    subtitle: "COLECCIÓN EXCLUSIVA",
    description: "Resiliencia y estilo icónico para el aire libre. La sofisticación de las botas Hunter en Multibrand.",
    // Foto 4:3: en desktop se corre el recorte hacia arriba para no cortar la
    // cara; en celular se centra en la modelo (está a la derecha de la foto).
    objectPosition: "62% 30%",
    logo: true,
    // El bloque de texto va a la izquierda (desktop) / abajo (celular) para no
    // tapar a la modelo ni las botas.
    overlayAlign: 'left'
  },
  {
    image: "/banners/nautica-verano-2027.webp",
    title: "MULTIBRAND / NAUTICA",
    subtitle: "SUMMER 2027",
    description: "Herencia náutica. Una nueva forma de vivir el verano.",
    objectPosition: "85% center",
    letterbox: true,
    mobileAspect: "3/4",
    // La imagen ya trae su propio texto en el panel blanco: no se superpone
    // logo/descripción, solo el botón debajo de ese texto.
    ownText: true,
    hideOverlayText: true,
    bgColor: "bg-white",
    captionDark: true
  }
];

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    // El slide con video necesita más tiempo: el archivo tarda unos segundos en
    // empezar a reproducirse, y con la duración normal (4s) rotaba antes de que
    // se llegara a ver.
    const current = slides[currentSlide] as any;
    const hasVideo = !!current?.split?.videoSrc;
    const duration = current?.fullVideo ? (isMobile ? 9000 : 12000)
      : hasVideo ? (isMobile ? 7000 : 10000) : (isMobile ? 2500 : 4000);
    const timer = setTimeout(nextSlide, duration);
    return () => clearTimeout(timer);
  }, [nextSlide, currentSlide]);

  const scrollToCollection = () => {
    // El Hero solo se muestra en la home "pelada" (sin filtro activo), donde
    // la grilla de productos (#new) no existe todavía — hay que navegar a la
    // colección de la marca del slide actual, no solo scrollear.
    const brand = slides[currentSlide].title.split(' / ')[1];
    navigate(`/?marca=${encodeURIComponent(brand)}#new`);
  };

  return (
    <div className="relative h-[calc(90vh-var(--navbar-height,220px))] md:h-[calc(100vh-var(--navbar-height,220px))] w-full flex flex-col items-center justify-center overflow-hidden pt-12 md:pt-0 group bg-black">
      
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 flex items-center justify-center transition-all duration-[1000ms] ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
          } ${(slide as any).bgColor || 'bg-black'}`}
        >
          {(slide as any).fullVideo ? (
            <div className="absolute inset-0">
              <video
                src={(slide as any).fullVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-10 md:bottom-16 flex flex-col items-center gap-2 md:gap-3 text-center px-4 z-20">
                <p className="text-white text-[10px] md:text-sm font-bold uppercase tracking-[0.35em] drop-shadow-lg">
                  Perramus
                </p>
                <h2 className="font-serif font-bold text-white uppercase tracking-tight text-3xl sm:text-4xl md:text-6xl drop-shadow-2xl">
                  {slide.subtitle}
                </h2>
                <p className="text-white text-[10px] md:text-sm tracking-[0.2em] uppercase font-light drop-shadow-2xl">
                  {slide.description}
                </p>
                <button
                  onClick={scrollToCollection}
                  className="mt-2 md:mt-4 bg-white text-black px-6 py-3 md:px-12 md:py-4 rounded-none font-bold text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.4em] ver-coleccion-btn transition-all flex items-center gap-2 md:gap-3 shadow-2xl uppercase border border-white/20 group relative z-[70] cursor-pointer"
                >
                  SHOP NOW <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          ) : (slide as any).letterbox ? (
            <div className={`absolute inset-0 flex flex-col items-center justify-start md:justify-center pt-4 md:pt-0 gap-6 md:gap-10 px-4 ${(slide as any).bgColor || 'bg-black'}`}>
              <div className={`relative w-full ${(slide as any).mobileAspect === '3/4' || (slide as any).split ? 'aspect-[3/4]' : 'aspect-[4/3]'} ${(slide as any).desktopAspect === '3/2' ? 'md:aspect-[3/2]' : 'md:aspect-[1920/636]'}`}>
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full"
                  style={{
                    position: (slide as any).split ? 'absolute' : undefined,
                    top: 0,
                    left: (slide as any).split && (slide as any).split.side !== 'right' ? undefined : 0,
                    right: (slide as any).split && (slide as any).split.side === 'right' ? undefined : 0,
                    width: (slide as any).split ? `calc(100% - ${(slide as any).split.width || '32.8%'})` : '100%',
                    objectFit: (slide as any).imageFit || 'cover',
                    objectPosition: slide.objectPosition,
                    filter: (slide as any).grayscale ? 'grayscale(1)' : undefined
                  }}
                />
                {(slide as any).split && (
                  <div
                    className={`absolute top-0 h-full flex items-center justify-center overflow-hidden ${(slide as any).split.side === 'right' ? 'right-0' : 'left-0'}`}
                    style={{ width: (slide as any).split.width || '32.8%', backgroundColor: '#3a0a0a' }}
                  >
                    {(slide as any).split.videoSrc ? (
                      <video
                        src={(slide as any).split.videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={(slide as any).split.overlaySrc}
                        alt={`${slide.title} — Sale`}
                        className="h-full w-auto"
                      />
                    )}
                    {(slide as any).split.wordmark && (
                      <span className="absolute inset-0 flex items-center justify-center px-2 pointer-events-none">
                        <span className="font-serif font-bold text-white uppercase tracking-tight text-2xl sm:text-4xl md:text-5xl text-center drop-shadow-2xl">
                          {(slide as any).split.wordmark}
                        </span>
                      </span>
                    )}
                  </div>
                )}
                {/* Bloque editorial sobre el lado de la foto (kicker + título + subtítulo + marca + CTA) */}
                {(slide as any).captionOverlay && (
                  <div
                    className="absolute inset-0 flex items-center z-20 pointer-events-none"
                    style={{ width: (slide as any).split ? `calc(100% - ${(slide as any).split.width || '32.8%'})` : '100%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                    <div className="relative z-10 text-white px-6 md:px-10 max-w-[85%] md:max-w-md">
                      <p className="text-[11px] md:text-sm font-light tracking-[0.2em] uppercase mb-2 md:mb-3 opacity-90">
                        {(slide as any).captionOverlay.kicker}
                      </p>
                      <h3 className="font-black text-2xl md:text-5xl uppercase leading-[1.05] mb-1 tracking-tight">
                        {(slide as any).captionOverlay.title}
                      </h3>
                      <p className="italic font-light text-sm md:text-xl mb-3 md:mb-5 opacity-90">
                        {(slide as any).captionOverlay.subtitle}
                      </p>
                      <div className="w-10 h-[1px] bg-white/50 mb-3 md:mb-5" />
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-1">
                        {(slide as any).captionOverlay.brand}
                      </p>
                      <p className="text-[9px] md:text-[11px] uppercase tracking-[0.1em] opacity-70 mb-4 md:mb-6">
                        {(slide as any).captionOverlay.chapter}
                      </p>
                      <button
                        onClick={scrollToCollection}
                        className="pointer-events-auto text-sm md:text-lg font-bold uppercase tracking-[0.25em] border-b border-white pb-1 hover:opacity-70 transition-opacity cursor-pointer"
                      >
                        {(slide as any).captionOverlay.cta}
                      </button>
                    </div>
                  </div>
                )}
                {/* Texto y marca superpuestos sobre la imagen (lado de la foto, no sobre el panel izquierdo) */}
                {(slide as any).ownText && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-[16%] md:left-[21.4%] z-20">
                    <button
                      onClick={scrollToCollection}
                      className="bg-black text-white px-6 py-3 md:px-10 md:py-3.5 rounded-none font-bold text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.4em] transition-all flex items-center gap-2 md:gap-3 shadow-xl uppercase group cursor-pointer whitespace-nowrap hover:bg-[#1f2a44]"
                    >
                      SHOP NOW <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                )}
                {!(slide as any).split && !(slide as any).ownText && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-4 text-center px-3 py-3"
                  >
                    {(slide as any).captionLogo ? (
                      <img
                        src={(slide as any).captionLogo}
                        alt={slide.title}
                        className="h-9 md:h-14 drop-shadow-lg"
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
                      className="mt-1 md:mt-3 bg-white text-black px-6 py-3 md:px-12 md:py-4 rounded-none font-bold text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.4em] ver-coleccion-btn transition-all flex items-center gap-2 md:gap-3 shadow-2xl uppercase border border-white/20 group relative z-[70] cursor-pointer"
                    >
                      SHOP NOW <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                )}
                {/* Para slides con split (imagen + video): solo el botón, abajo de la imagen.
                    Si el slide ya tiene su propio bloque editorial (captionOverlay), ese trae
                    su propio CTA y no hace falta este botón aparte. */}
                {(slide as any).split && !(slide as any).captionOverlay && (
                  <div
                    className={`absolute top-[68%] md:top-auto md:bottom-6 flex justify-center ${(slide as any).split.side === 'right' ? 'left-0' : 'right-0'}`}
                    style={{ width: `calc(100% - ${(slide as any).split.width || '32.8%'})` }}
                  >
                    <button
                      onClick={scrollToCollection}
                      className="bg-white text-black px-6 py-3 md:px-12 md:py-4 rounded-none font-bold text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.4em] ver-coleccion-btn transition-all flex items-center gap-2 md:gap-3 shadow-2xl uppercase border border-white/20 group relative z-[70] cursor-pointer"
                    >
                      SHOP NOW <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                )}
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
      {!(slides[currentSlide] as any).hideOverlayText && (() => {
        const alignLeft = (slides[currentSlide] as any).overlayAlign === 'left';
        return (
      <div className={`relative z-[60] text-center px-4 md:px-6 ${alignLeft
        ? 'mt-auto mb-24 md:mb-0 md:mt-0 md:self-start md:ml-[6%] md:text-left max-w-xl'
        : 'max-w-5xl mt-12 md:mt-16'}`}>

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
            <div className={`mb-6 flex justify-center ${alignLeft ? 'md:justify-start' : ''}`}>
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
          <p className={`text-white/90 text-sm md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed tracking-widest drop-shadow-xl italic ${alignLeft ? 'md:mx-0' : ''}`}>
            {slides[currentSlide].description}
          </p>

          {/* Button */}
          <button
            onClick={scrollToCollection}
            className={`bg-white text-black px-12 py-4 md:px-16 md:py-5 rounded-none font-bold text-[11px] md:text-xs tracking-[0.5em] ver-coleccion-btn transition-all flex items-center gap-4 mx-auto shadow-2xl uppercase border-2 border-[#E2001A] group relative z-[70] cursor-pointer ${alignLeft ? 'md:mx-0' : ''}`}
          >
            SHOP NOW <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
        );
      })()}

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



