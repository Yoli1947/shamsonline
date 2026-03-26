
export const COLOR_MAP = {
    'negro': '#000000', 'black': '#000000',
    'blanco': '#FFFFFF', 'white': '#FFFFFF',
    'rojo': '#FF0000', 'red': '#FF0000',
    'azul': '#0000FF', 'blue': '#0000FF',
    'verde': '#008000', 'green': '#008000',
    'amarillo': '#FFFF00', 'yellow': '#FFFF00',
    'gris': '#808080', 'grey': '#808080',
    'gray': '#808080',
    'rosa': '#FFC0CB', 'pink': '#FFC0CB',
    'violeta': '#8B00FF', 'purple': '#800080',
    'marron': '#8B4513', 'brown': '#A52A2A',
    'naranja': '#FFA500', 'orange': '#FFA500',
    'beige': '#F5F5DC', 'celeste': '#87CEEB',
    'crema': '#FFFDD0', 'camel': '#C19A6B',
    'bordeaux': '#800020', 'bordó': '#800020',
    'marino': '#000080', 'navy': '#000080',
    'jean': '#5f9ea0', 'denim': '#1560bd',
    'crudo': '#f5f5dc', 'militar': '#4b5320',
    'fucsia': '#FF00FF', 'oro': '#FFD700', 'plata': '#C0C0C0',
    'lima': '#BEFD2C', 'lime': '#BEFD2C'
};

export const SIZE_ORDER = [
    'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '3X',
    'XXXXL', '4XL', '4X', '5XL',
    '20', '22', '24', '26', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
    '0', '1', '2', '3', '4', '5', '6', '7',
    'U', 'UNICO'
];

export const sortSizes = (a, b) => {
    const sizeA = String(a).toUpperCase().trim();
    const sizeB = String(b).toUpperCase().trim();
    
    const normalize = (s) => {
        if (s === '2X') return '2XL';
        if (s === '3X') return '3XL';
        if (s === '4X') return '4XL';
        if (s === 'XXL') return '2XL';
        if (s === 'XXXL') return '3XL';
        return s;
    };
    
    const nA = normalize(sizeA);
    const nB = normalize(sizeB);

    const indexA = SIZE_ORDER.indexOf(nA);
    const indexB = SIZE_ORDER.indexOf(nB);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    const numA = parseFloat(nA);
    const numB = parseFloat(nB);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    
    return nA.localeCompare(nB);
};
