import React, { useState } from 'react';

// 📷 CAMBIAR ESTE USUARIO por el de Instagram de la tienda
const INSTAGRAM_USERNAME = 'perramusrosario';

const InstagramButton: React.FC = () => {
    const [hovered, setHovered] = useState(false);

    // Deep link oficial de Instagram para abrir un DM directo con la cuenta
    const url = `https://ig.me/m/${INSTAGRAM_USERNAME}`;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label="Contactar por Instagram"
            style={{
                position: 'fixed',
                bottom: '92px',
                right: '28px',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                color: '#fff',
                borderRadius: '50px',
                padding: hovered ? '12px 20px 12px 16px' : '14px',
                boxShadow: '0 4px 24px rgba(188,24,136,0.45)',
                textDecoration: 'none',
                fontFamily: 'inherit',
                fontWeight: 800,
                fontSize: '13px',
                letterSpacing: '0.05em',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: hovered ? '220px' : '52px',
            }}
        >
            {/* Instagram SVG Icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="white"
                style={{ flexShrink: 0 }}
            >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>

            {/* Texto que aparece al hover */}
            <span style={{
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
                fontSize: '13px',
            }}>
                Escribinos
            </span>
        </a>
    );
};

export default InstagramButton;
