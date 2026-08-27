import { useEffect } from 'react';

const SITE_NAME = 'Multibrand Rosario';
const SITE_URL = 'https://multibrandrosario.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

interface PageSEOOptions {
    title: string;
    description?: string;
    path?: string; // ej: "/marcas/perramus". Default: la ruta actual del navegador.
    image?: string;
    noindex?: boolean;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setCanonical(href: string) {
    let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

/**
 * Setea título, descripción, canonical y OG/Twitter tags para la página actual.
 * Como el sitio es una SPA sin SSR, esto corre en el cliente en cada cambio de página.
 */
export function usePageSEO({ title, description, path, image, noindex }: PageSEOOptions) {
    useEffect(() => {
        // Si el título ya viene compuesto (tiene "|" o ya menciona el nombre del sitio), lo dejamos tal cual.
        const fullTitle = title.includes('|') || title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
        document.title = fullTitle;

        const canonicalPath = path ?? (window.location.pathname + window.location.search.replace(/[?&](utm_[^&]+|fbclid|gclid)=[^&]*/g, ''));
        const canonicalUrl = canonicalPath === '/' || canonicalPath === '' ? `${SITE_URL}/` : `${SITE_URL}${canonicalPath}`;

        setCanonical(canonicalUrl);

        if (description) {
            setMetaTag('name', 'description', description);
            setMetaTag('property', 'og:description', description);
            setMetaTag('name', 'twitter:description', description);
        }

        setMetaTag('property', 'og:title', fullTitle);
        setMetaTag('property', 'og:url', canonicalUrl);
        setMetaTag('property', 'og:type', 'website');
        setMetaTag('property', 'og:site_name', SITE_NAME);
        setMetaTag('property', 'og:image', image || DEFAULT_IMAGE);
        setMetaTag('name', 'twitter:card', 'summary_large_image');
        setMetaTag('name', 'twitter:title', fullTitle);
        setMetaTag('name', 'twitter:image', image || DEFAULT_IMAGE);

        const robotsEl = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
        if (noindex) {
            setMetaTag('name', 'robots', 'noindex, nofollow');
        } else if (robotsEl) {
            robotsEl.setAttribute('content', 'index, follow');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, description, path, image, noindex]);
}

export { SITE_NAME, SITE_URL };
