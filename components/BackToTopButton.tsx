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
            aria-label="Volver arriba"
            style={{
                position: 'fixed',
                bottom: '28px',
                left: '28px',
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                background: '#ffffff',
                color: '#000000',
                border: '1px solid #e0e0e0',
                borderRadius: '0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                opacity: 0.7,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
        >
            <ArrowUp size={16} />
        </button>
    );
};

export default BackToTopButton;
