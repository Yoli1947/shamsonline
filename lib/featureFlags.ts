// Interruptores temporales, reversibles en un minuto (cambiar el valor y recompilar).
// No borrar el código que dependen de esto — es más rápido volver a prender el flag
// que reconstruir la función más adelante.

// Venta de Gift Cards online: bloqueada durante la mudanza de dominio, hasta hacer
// la compra de prueba con calma y con la migración ya cerrada. Nunca se vendió
// ninguna gift card online, así que bloquearla no afecta ventas existentes.
// Para reactivar: cambiar a `true` y volver a compilar.
export const GIFT_CARDS_ENABLED = false;

// Pago con Nave (Naranja X / Banco Galicia): oculto en el checkout porque el
// backend (create-nave-preference) todavía apunta a la API sandbox de Nave,
// no a producción. Para reactivar: confirmar que el backend ya usa la URL
// de producción, cambiar a `true` y volver a compilar.
export const NAVE_ENABLED = false;
