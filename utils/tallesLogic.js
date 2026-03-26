/**
 * Lógica reutilizable para detección y manejo de curvas de talles.
 * Copia este archivo a tu nuevo proyecto (ej: src/utils/tallesLogic.js).
 */

// Definición de las 8 curvas de talles (Columnas 1-12)
export const SIZE_HEADERS = [
    ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '', '', ''],         // TIPO 1
    ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], // TIPO 2
    ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '', ''],     // TIPO 3
    ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'], // TIPO 4
    ['44', '46', '48', '50', '52', '54', '56', '58', '60', '', '', ''],       // TIPO 5
    ['23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'], // TIPO 6
    ['U', '', '', '', '', '', '', '', '', '', '', ''],                         // TIPO 7
    ['0', '1', '2', '3', '4', '5', '6', '7', '', '', '', ''],                 // TIPO 8
    ['20', '22', '24', '26', '28', '30', '32', '36', '', '', '', ''],         // TIPO 9
];

// Función para detectar el tipo de curva basada en el primer talle (TALLE01)
export const detectSizeType = (talle1) => {
    if (!talle1) return '';
    const t = String(talle1).trim().toUpperCase();

    // TIPO 1: Letras (XS...4XL)
    if (['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '2X', '3X', '4X'].includes(t)) return 'TIPO 1';

    // TIPO 7: Unico
    if (t === 'U') return 'TIPO 7';

    // TIPO 8: Números cortos (0-7)
    if (['0', '1', '2', '3', '4', '5', '6', '7'].includes(t) && t.length === 1) return 'TIPO 8';

    // Tipos Numéricos
    const num = parseInt(t);
    if (isNaN(num)) return '';

    if (num === 20) return 'TIPO 9'; // Pantalones 20...36
    if (num === 23) return 'TIPO 6'; // Calzado/Niños
    if (num === 32) return 'TIPO 4'; // Dama Pares wide range
    if (num === 34) return 'TIPO 2'; // Dama Corrido
    if (num === 36) return 'TIPO 3'; // Dama Pares standard
    if (num === 44) return 'TIPO 5'; // Talles Grandes

    return ''; // No reconocido
};

/**
 * Ejemplo de uso:
 * import { detectSizeType, SIZE_HEADERS } from './utils/tallesLogic';
 * 
 * const talle1 = "36";
 * const tipo = detectSizeType(talle1); // Retorna "TIPO 3"
 * 
 * // Para obtener los headers correspondientes:
 * // TIPO 1 -> index 0, TIPO 2 -> index 1, etc.
 * const typeIndex = parseInt(tipo.replace('TIPO ', '')) - 1;
 * const headers = SIZE_HEADERS[typeIndex]; // ['36', '38', ...]
 */
