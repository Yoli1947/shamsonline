import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    image: "/banner laste.jpg",
    title: "SHAMS / PERRAMUS",
    subtitle: "COLECCIÓN FW26",
    description: "Calidad y diseño de vanguardia. Descubrí lo último de Perramus en nuestra tienda.",
    objectPosition: "center"
  },
  {
    image: "/armesto banner.jpg",
    title: "SHAMS / ARMESTO",
    subtitle: "ALTA SASTRERÍA",
    description: "Experimentá el arte de la sastrería a medida. Estilo impecable y elegancia contemporánea.",
    objectPosition: "50% 20%",
    objectFit: "cover",
    imageScale: 1.1
  },
  {
    image: "/maxg/maxg banner.jpg",
    title: "SHAMS / MAXG",
    subtitle: "COLECCIÓN FW26",
    description: "Inspiración urbana y tecnológica. La colección de MAXG redefine el abrigo contemporáneo con un diseño audaz y exclusivo.",
    objectPosition: "center",
    objectFit: "contain",
    bgColor: "bg-[#f2f2f2]"
  },
  {
    image: "/hero-banner-cibeles.jpg",
    title: "SHAMS / CIBELES",
    subtitle: "NUEVA TEMPORADA",
    description: "Lo mejor de Cibeles para esta temporada. Elegancia y exclusividad en cada detalle.",
    objectPosition: "top"
  },
  {
    image: "/hero-banner-hunter.jpg",
    title: "SHAMS / HUNTER",
    subtitle: "COLECCIÓN EXCLUSIVA",
    description: "Resiliencia y estilo icónico para el aire libre. La sofisticación de las botas Hunter en Shams.",
    objectPosition: "center"
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
          className={`absolute inset-0 transition-all duration-[1000ms] ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
          } ${(slide as any).bgColor || 'bg-black'}`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className={`w-full h-full transition-all duration-1000 ${
              (slide as any).objectFit === 'contain' ? 'object-contain' : 'object-cover'
            }`}
            style={{
              objectPosition: slide.objectPosition,
              filter: `contrast(1.08) brightness(1.05) saturate(1.02)`,
              imageRendering: 'auto',
              transform: `scale(${(slide as any).imageScale ?? 1})`
            }}
          />
          
        </div>
      ))}

      {/* Content Area */}
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
          <h2 className="font-heading text-4xl md:text-8xl font-black mb-6 leading-tight tracking-[0.3em] text-white uppercase drop-shadow-2xl">
            {slides[currentSlide].title.split(' / ')[1]}
          </h2>

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
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`transition-all duration-700 h-[2px] ${
              i === currentSlide ? 'w-16 bg-white' : 'w-8 bg-white/20 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Sideways Text decoration */}
      <div className="absolute left-8 bottom-24 hidden xl:block z-40 opacity-40">
        <span className="text-[10px] uppercase tracking-[0.7em] text-white font-black flex items-center gap-3" style={{ writingMode: 'vertical-rl' }}>
          FW / COLLECTION / 2026
        </span>
      </div>

    </div>
  );
};

export default Hero;


