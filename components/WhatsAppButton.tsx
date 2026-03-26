import React, { useState } from 'react';

// 📱 CAMBIAR ESTE NÚMERO por el número de WhatsApp de la tienda
// Formato: código de país + número sin espacios ni guiones
// Ejemplo Argentina: 5491112345678
const WHATSAPP_NUMBER = '5493412175258';
const WHATSAPP_MESSAGE = '¡Hola! Quería hacerles una consulta sobre sus productos 😊';

const WhatsAppButton: React.FC = () => {
    const [hovered, setHovered] = useState(false);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label="Contactar por WhatsApp"
            style={{
                position: 'fixed',
                bottom: '28px',
                right: '28px',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#25D366',
                color: '#fff',
                borderRadius: '50px',
                padding: hovered ? '12px 20px 12px 16px' : '14px',
                boxShadow: '0 4px 24px rgba(37,211,102,0.45)',
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
            {/* WhatsApp SVG Icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                width="26"
                height="26"
                fill="white"
                style={{ flexShrink: 0 }}
            >
                <path d="M16.004 0C7.164 0 0 7.163 0 16c0 2.82.737 5.466 2.024 7.77L0 32l8.463-2.004A15.94 15.94 0 0 0 16.004 32C24.836 32 32 24.837 32 16S24.836 0 16.004 0zm0 29.3a13.27 13.27 0 0 1-6.772-1.848l-.485-.29-5.024 1.19 1.215-4.897-.317-.502A13.243 13.243 0 0 1 2.7 16c0-7.334 5.97-13.3 13.304-13.3S29.3 8.666 29.3 16 23.334 29.3 16.004 29.3zm7.29-9.965c-.4-.2-2.364-1.166-2.73-1.3-.365-.132-.632-.2-.9.2-.265.398-1.032 1.3-1.265 1.566-.232.265-.465.298-.865.1-.4-.2-1.688-.622-3.217-1.986-1.188-1.06-1.99-2.37-2.223-2.77-.232-.4-.025-.616.175-.815.18-.179.4-.465.598-.698.2-.232.266-.399.4-.665.132-.265.066-.498-.034-.698-.1-.2-.9-2.168-1.232-2.965-.325-.78-.655-.673-.9-.685-.232-.01-.498-.013-.764-.013-.265 0-.698.1-1.064.498-.365.4-1.397 1.366-1.397 3.331 0 1.965 1.43 3.864 1.63 4.131.2.265 2.81 4.29 6.81 6.02.952.41 1.696.655 2.275.838.956.304 1.826.261 2.515.158.767-.114 2.364-.967 2.697-1.9.332-.933.332-1.733.232-1.9-.098-.165-.364-.265-.764-.465z" />
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

export default WhatsAppButton;
