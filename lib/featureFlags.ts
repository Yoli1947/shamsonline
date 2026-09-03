// Interruptores temporales, reversibles en un minuto (cambiar el valor y recompilar).
// No borrar el código que dependen de esto — es más rápido volver a prender el flag
// que reconstruir la función más adelante.

// Venta de Gift Cards online: reactivada (2026-09-02) junto con el rediseño de
// GiftCardPage.tsx. Requiere que la migración 20260902_add_gift_card_fields_to_order_items.sql
// esté aplicada en la base remota (agrega recipient_name/message/etc. a order_items) —
// si no, el pedido se crea pero la gift card se emite sin destinatario ni mensaje.
export const GIFT_CARDS_ENABLED = true;

// Pago con Nave (Naranja X / Banco Galicia): oculto en el checkout porque el
// backend (create-nave-preference) todavía apunta a la API sandbox de Nave,
// no a producción. Para reactivar: confirmar que el backend ya usa la URL
// de producción, cambiar a `true` y volver a compilar.
export const NAVE_ENABLED = false;
