import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [hovered, setHovered] = useState(false);
    const rafRef = useRef<number | null>(null);

    // Muestra el botón cuando el usuario scrollea hacia abajo
    useEffect(() => {
        const toggleVisibility = () => {
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
                setIsVisible(window.scrollY > 300);
                rafRef.current = null;
            });
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={scrollToTop}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label="Volver arriba"
            style={{
                position: 'fixed',
                bottom: '28px',
                left: '28px', // Posicionado a la inversa (izquierda) del botón de WhatsApp
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0a0a0a',
                color: '#C4956A',
                border: '1px solid rgba(196, 149, 106, 0.3)',
                borderRadius: '50px',
                padding: hovered ? '12px 20px 12px 16px' : '14px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 15px rgba(196,149,106,0.2)',
                backdropFilter: 'blur(10px)',
                fontFamily: 'inherit',
                fontWeight: 800,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: hovered ? '200px' : '52px',
                cursor: 'pointer'
            }}
        >
            <ArrowUp size={22} style={{ flexShrink: 0 }} />

            <span style={{
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
            }}>
                BACK TO TOP
            </span>
        </button>
    );
};

export default BackToTopButton;
