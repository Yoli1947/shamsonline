# Guía de Integración: EchoGiftCard en ShamsOnline.com.ar

## Contexto

EchoGiftCard.com es la plataforma central de emisión y gestión de gift cards del Grupo Perramus Shams. Esta guía explica cómo integrar la compra y el canje de gift cards en **shamsonline.com.ar**.

## Datos de la tienda

| Dato | Valor |
|------|-------|
| **Dominio** | shamsonline.com.ar |
| **Stack** | React 19 + Vite + TypeScript + Supabase |
| **Supabase project ref** | `rsvcgduyogqljwzbohkz` |
| **Edge Functions URL** | `https://rsvcgduyogqljwzbohkz.supabase.co/functions/v1/` |
| **Código fuente en VPS** | `/var/www/shamsonline/` |
| **Archivos compilados** | `/var/www/shamsonline/dist/` |
| **Servidor** | Nginx sirve archivos estáticos desde `/dist` |

## Lo que ya está hecho (no tocar)

- API externa de EchoGiftCard deployada y funcionando en `https://echogiftcard.com`
- 3 Edge Functions deployadas en Supabase de ShamsOnline:
  - `echo-issue-card` — emitir gift card
  - `echo-check-balance` — verificar saldo
  - `echo-redeem` — canjear gift card
- Tablas de tracking en Supabase: `gift_card_purchases` y `gift_card_redemptions`
- Secrets configurados: `ECHO_API_URL` y `ECHO_API_KEY`
- POS registrado en EchoGiftCard como "ShamsOnline.com.ar"

## Lo que hay que hacer

1. Crear página de compra de gift cards en el frontend
2. Crear componente de canje de gift card en el checkout
3. Actualizar el `mp-webhook` para emisión automática post-pago
4. Build y deploy

---

## Arquitectura

```
Cliente (browser en shamsonline.com.ar)
  │
  ├── Compra gift card ──→ Edge Function "echo-issue-card" ──→ EchoGiftCard API
  │                         (server-side, seguro)                /api/external/issue
  │
  ├── Verifica saldo ────→ Edge Function "echo-check-balance" → EchoGiftCard API
  │                         (server-side, seguro)                /api/external/balance
  │
  ├── Canjea en checkout → Edge Function "echo-redeem" ───────→ EchoGiftCard API
  │                         (server-side, seguro)                /api/external/redeem
  │
  └── Paga con MP ───────→ MercadoPago ──→ mp-webhook ────────→ EchoGiftCard API
                             (confirma pago)  (emite gift card)   /api/external/issue
```

El frontend NUNCA habla directo con EchoGiftCard. Siempre pasa por las Edge Functions.

---

## Parte 1: Página de compra de Gift Cards

### 1.1 Crear la página

Crear archivo: **`/var/www/shamsonline/pages/GiftCards.tsx`**

Esta página debe tener:

**Formulario:**
- Input numérico para el monto (mínimo $100.000, la API limita a máximo $10.000.000)
- Toggle o radio buttons: "Para mí" / "Para regalar"
- Si es regalo, mostrar campos adicionales:
  - Nombre del destinatario (texto)
  - Teléfono del destinatario (formato +54XXXXXXXXXX, para envío por WhatsApp)
  - Email del destinatario (opcional)
  - Mensaje personal (textarea, opcional)
- Botón "Comprar Gift Card"

**Flujo al hacer click en "Comprar":**

```typescript
// 1. Crear la orden en Supabase de ShamsOnline
const { data: order, error } = await supabase
  .from('orders')
  .insert({
    order_number: generateOrderNumber(), // tu función existente
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    items: [
      {
        type: 'gift_card',        // IMPORTANTE: este campo identifica que es gift card
        product_type: 'gift_card', // redundancia por compatibilidad
        title: 'Gift Card EchoGiftCard',
        quantity: 1,
        price: amount,             // el monto elegido por el cliente
        amount: amount,
        is_gift: isGift,
        recipient_name: recipientName || null,
        recipient_phone: recipientPhone || null,
        recipient_email: recipientEmail || null,
        sender_name: customer.name,
        message: personalMessage || null,
      }
    ],
    total: amount,
    status: 'pending',
    payment_status: 'pending',
  })
  .select()
  .single();

// 2. Crear preferencia de MercadoPago (Edge Function existente)
const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

const mpResponse = await fetch(`${FUNCTIONS_URL}/create-mp-preference`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    order_id: order.id,
    order_number: order.order_number,
    customer: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
    },
    total: amount,
  }),
});

const mpData = await mpResponse.json();

// 3. Redirigir a MercadoPago para pagar
window.location.href = mpData.init_point;
```

**Después del pago:**
- MercadoPago redirige al cliente a `/orden/exito?oid=ORDER_ID`
- En paralelo, MercadoPago llama al webhook `mp-webhook`
- El webhook detecta que la orden tiene items tipo `gift_card` y llama a EchoGiftCard
- EchoGiftCard genera la tarjeta y la envía por WhatsApp al destinatario

**Página de éxito:** En `/orden/exito`, si la orden es de tipo gift card, mostrar:

```
"¡Gift Card enviada! El destinatario recibirá la tarjeta por WhatsApp en los próximos minutos."
```

Para verificar si ya fue emitida:

```typescript
const { data: purchase } = await supabase
  .from('gift_card_purchases')
  .select('*')
  .eq('order_id', orderId)
  .single();

// purchase.status === 'issued'  → mostrar datos de la card
// purchase.status === 'pending' → mostrar "Procesando..."
// purchase.status === 'failed'  → mostrar "Hubo un error, nos comunicaremos contigo"
```

### 1.2 Agregar ruta en App.tsx

```typescript
import GiftCards from './pages/GiftCards';

// Dentro del Router:
<Route path="/gift-cards" element={<GiftCards />} />
```

### 1.3 Agregar link en la navegación

En el Navbar, agregar:

```typescript
<Link to="/gift-cards">Gift Cards</Link>
```

---

## Parte 2: Canje de Gift Card en el Checkout

### 2.1 Crear componente GiftCardInput

Crear archivo: **`/var/www/shamsonline/components/GiftCardInput.tsx`**

```typescript
import { useState } from 'react';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

interface GiftCardData {
  code: string;
  hash_token: string;
  current_balance: number;
  initial_balance: number;
  is_valid: boolean;
  status: string;
  amountToApply: number;
}

interface Props {
  orderTotal: number;
  onApply: (data: GiftCardData) => void;
  onRemove: () => void;
}

// ── VERIFICAR SALDO ──────────────────────────────────────────

async function checkBalance(code: string) {
  const res = await fetch(`${FUNCTIONS_URL}/echo-check-balance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  });

  const data = await res.json();

  if (!res.ok || !data.is_valid) {
    throw new Error(data.error || 'Gift card no válida');
  }

  return data;
}

// ── CANJEAR (descontar saldo) ────────────────────────────────
// IMPORTANTE: Llamar SOLO cuando la orden se confirma definitivamente

export async function redeemGiftCard(
  hashToken: string,
  amount: number,
  orderId: string
): Promise<{ success: boolean; new_balance: number; error?: string }> {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/echo-redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash_token: hashToken,
        amount: amount,
        order_id: orderId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, new_balance: 0, error: data.error };
    }

    return { success: true, new_balance: data.new_balance };
  } catch (err) {
    return { success: false, new_balance: 0, error: 'Error de conexión' };
  }
}
```

### 2.2 Integrar en CheckoutModal

En el componente de checkout existente (`CheckoutModal.tsx` o donde esté):

```typescript
import GiftCardInput, { redeemGiftCard } from './GiftCardInput';

// Estado:
const [giftCard, setGiftCard] = useState<GiftCardData | null>(null);

// Cálculos:
const orderTotal = cartTotal + shippingCost;
const giftCardDiscount = giftCard
  ? Math.min(giftCard.current_balance, orderTotal)
  : 0;
const remainingToPay = orderTotal - giftCardDiscount;

// En el JSX, antes del botón de pagar:
<GiftCardInput
  orderTotal={orderTotal}
  onApply={(data) => setGiftCard(data)}
  onRemove={() => setGiftCard(null)}
/>

{giftCard && (
  <div>
    <span>Gift Card ({giftCard.code}): -${giftCardDiscount.toLocaleString('es-AR')}</span>
  </div>
)}
<div>Total a pagar: ${remainingToPay.toLocaleString('es-AR')}</div>
```

### 2.3 Lógica de checkout con gift card

```typescript
async function handleCheckout() {
  // 1. Crear la orden en Supabase
  const order = await createOrder({
    items: cartItems,
    total: orderTotal,
    gift_card_discount: giftCardDiscount,
    gift_card_applied: giftCard ? {
      code: giftCard.code,
      hash_token: giftCard.hash_token,
      amount_to_deduct: giftCardDiscount,
    } : null,
    amount_to_charge_mp: remainingToPay,
  });

  if (remainingToPay > 0) {
    // 2A. Hay monto restante → pagar con MercadoPago
    // El canje de la gift card se hace en el mp-webhook cuando MP confirma
    const mp = await fetch(`${FUNCTIONS_URL}/create-mp-preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        order_number: order.order_number,
        customer,
        total: remainingToPay, // Solo el monto restante
      }),
    });
    const mpData = await mp.json();
    window.location.href = mpData.init_point;
  } else {
    // 2B. Gift card cubre todo → canjear ahora y marcar como pagada
    const result = await redeemGiftCard(
      giftCard.hash_token,
      giftCardDiscount,
      order.id
    );

    if (result.success) {
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'processing',
        paid_at: new Date().toISOString(),
        payment_method: 'gift_card',
      }).eq('id', order.id);

      navigate(`/orden/exito?oid=${order.id}`);
    } else {
      alert(`Error: ${result.error}. Intentá de nuevo.`);
    }
  }
}
```

---

## Parte 3: Actualizar mp-webhook

El webhook actual está en `/var/www/shamsonline/supabase/functions/mp-webhook/index.ts`.

Agregar este código **después** del bloque `case 'approved':` que actualiza la orden:

```typescript
if (mpStatus === 'approved') {
  const { data: order } = await supabase
    .from('orders')
    .select('id, items, customer_name, customer_email, customer_phone, gift_card_applied')
    .eq('order_number', orderNumber)
    .single();

  if (order) {
    const items = order.items || [];
    const echoApiUrl = Deno.env.get('ECHO_API_URL');
    const echoApiKey = Deno.env.get('ECHO_API_KEY');

    if (echoApiUrl && echoApiKey) {

      // A) Emitir gift cards compradas en esta orden
      const giftCardItems = items.filter(
        (item) => item.type === 'gift_card' || item.product_type === 'gift_card'
      );

      for (const item of giftCardItems) {
        const gcAmount = Number(item.price || item.amount);
        if (gcAmount < 100000) continue;

        const echoRes = await fetch(`${echoApiUrl}/api/external/issue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': echoApiKey,
          },
          body: JSON.stringify({
            amount: gcAmount,
            recipient_name: item.recipient_name || undefined,
            recipient_phone: item.recipient_phone || undefined,
            recipient_email: item.recipient_email || order.customer_email || undefined,
            sender_name: item.sender_name || order.customer_name || undefined,
            message: item.message || undefined,
            is_gift: Boolean(item.is_gift),
            external_order_id: order.id,
            idempotency_key: `shams-issue-${order.id}-gc-${items.indexOf(item)}`,
          }),
        });

        const echoData = await echoRes.json();

        if (echoRes.ok) {
          await supabase.from('gift_card_purchases').insert({
            order_id: order.id,
            echo_card_id: echoData.card_id,
            public_code: echoData.public_code,
            hash_token: echoData.hash_token,
            card_url: echoData.card_url,
            image_url: echoData.image_url,
            amount: gcAmount,
            recipient_name: item.recipient_name || null,
            recipient_phone: item.recipient_phone || null,
            is_gift: Boolean(item.is_gift),
            status: 'issued',
          });
          console.log(`Gift card emitida: ${echoData.public_code} por $${gcAmount}`);
        } else {
          console.error('Error emitiendo gift card:', echoData);
          await supabase.from('gift_card_purchases').insert({
            order_id: order.id,
            amount: gcAmount,
            status: 'failed',
            error_message: echoData.error || `HTTP ${echoRes.status}`,
          });
        }
      }

      // B) Canjear gift card aplicada al checkout (pago parcial)
      const gcApplied = order.gift_card_applied;
      if (gcApplied && gcApplied.hash_token && gcApplied.amount_to_deduct > 0) {
        await fetch(`${echoApiUrl}/api/external/redeem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': echoApiKey,
          },
          body: JSON.stringify({
            hash_token: gcApplied.hash_token,
            amount: gcApplied.amount_to_deduct,
            external_order_id: order.id,
            idempotency_key: `shams-redeem-${order.id}-${gcApplied.hash_token}`,
          }),
        });
        console.log(`Gift card canjeada: $${gcApplied.amount_to_deduct}`);
      }
    }
  }
}
```

### Deploy del webhook actualizado

```bash
export SUPABASE_ACCESS_TOKEN=<token>
cd /var/www/shamsonline
npx supabase functions deploy mp-webhook --no-verify-jwt --project-ref rsvcgduyogqljwzbohkz
```

---

## Parte 4: Referencia de Edge Functions

Las 3 Edge Functions ya están deployadas. Se llaman así desde el frontend:

```typescript
const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
// = "https://rsvcgduyogqljwzbohkz.supabase.co/functions/v1"
```

### echo-check-balance — Verificar saldo

```typescript
const res = await fetch(`${FUNCTIONS_URL}/echo-check-balance`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'ECHO-XXXX-XXXX' }),
});

// Respuesta exitosa:
{
  "public_code": "ECHO-AB12-CD34",
  "current_balance": 500000,
  "initial_balance": 500000,
  "status": "active",
  "card_type": "fixed_amount",
  "hash_token": "uuid-...",
  "expiry_date": "2027-03-28T...",
  "is_valid": true
}

// Errores:
{ "error": "Tarjeta no encontrada." }
{ "error": "Saldo Agotado." }
{ "error": "Tarjeta Expirada." }
{ "error": "Tarjeta Bloqueada." }
```

### echo-issue-card — Emitir gift card

```typescript
const res = await fetch(`${FUNCTIONS_URL}/echo-issue-card`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 500000,                      // REQUERIDO (mínimo 100000)
    order_id: 'uuid-de-la-orden',        // REQUERIDO
    recipient_name: 'María García',      // opcional
    recipient_phone: '+5493413001234',   // opcional (envía WhatsApp)
    recipient_email: 'maria@email.com',  // opcional
    sender_name: 'Juan Pérez',          // opcional
    message: '¡Feliz cumpleaños!',      // opcional
    is_gift: true,                       // opcional (default: false)
  }),
});

// Respuesta:
{
  "status": "issued",
  "card_id": "uuid-...",
  "public_code": "ECHO-AB12-CD34",
  "hash_token": "uuid-...",
  "card_url": "https://echogiftcard.com/v/uuid-...",
  "image_url": "https://..../uuid.jpg",
  "current_balance": 500000,
  "whatsapp_sent": true
}
```

### echo-redeem — Canjear (descontar saldo)

```typescript
const res = await fetch(`${FUNCTIONS_URL}/echo-redeem`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hash_token: 'uuid-del-hash-token',  // REQUERIDO
    amount: 350000,                      // REQUERIDO
    order_id: 'uuid-de-la-orden',        // REQUERIDO
  }),
});

// Respuesta:
{
  "status": "success",
  "new_balance": 150000,
  "card_status": "partially_used",
  "amount_charged": 350000
}

// Errores:
{ "error": "Saldo Insuficiente. Disponible: 100000" }
```

---

## Parte 5: Tablas de tracking (ya creadas)

### gift_card_purchases — Gift cards compradas en la tienda

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| order_id | UUID | ID de la orden |
| echo_card_id | TEXT | ID en EchoGiftCard |
| public_code | TEXT | ECHO-XXXX-XXXX |
| hash_token | TEXT | Token para canje |
| card_url | TEXT | URL de la gift card |
| image_url | TEXT | URL de la imagen |
| amount | NUMERIC | Monto |
| recipient_name | TEXT | Destinatario |
| recipient_phone | TEXT | Teléfono |
| status | TEXT | pending / issued / failed |

### gift_card_redemptions — Gift cards canjeadas en checkout

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| order_id | UUID | ID de la orden |
| public_code | TEXT | Código canjeado |
| hash_token | TEXT | Token |
| amount_applied | NUMERIC | Monto descontado |
| balance_after | NUMERIC | Saldo restante |
| idempotency_key | TEXT | Previene doble canje (UNIQUE) |
| status | TEXT | applied / refunded |

---

## Parte 6: Consideraciones importantes

- **Monto mínimo:** $100.000 ARS. La API rechaza montos menores.
- **WhatsApp:** Si se pone `recipient_phone`, EchoGiftCard envía la card por WhatsApp automáticamente. Formato: `+5493413001234` (sin 15, con código de país).
- **Idempotencia:** Todas las operaciones de dinero son seguras ante reintentos. Si se llama 2 veces con la misma key, la segunda retorna `already_processed` sin duplicar.
- **Timing del canje:** Llamar a `echo-redeem` SOLO cuando la orden se confirma. NO cuando el usuario "aplica" la card en el carrito.
- **Pago parcial:** Si la gift card no cubre todo, canjear en el `mp-webhook` después de que MP confirme el pago.
- **Moneda:** Todos los montos en ARS (pesos argentinos), sin decimales.
- **Seguridad:** NUNCA poner API keys de EchoGiftCard en el frontend. Las Edge Functions ya las manejan.

---

## Parte 7: Build y deploy

Después de hacer los cambios en el frontend:

```bash
cd /var/www/shamsonline
npm run build
```

Nginx sirve automáticamente desde `/var/www/shamsonline/dist/`, no hace falta reiniciar nada.

---

## Checklist

- [ ] Crear `pages/GiftCards.tsx` con formulario de compra
- [ ] Agregar ruta `/gift-cards` en `App.tsx`
- [ ] Agregar link "Gift Cards" en el Navbar
- [ ] Crear `components/GiftCardInput.tsx`
- [ ] Integrar `GiftCardInput` en el checkout (`CheckoutModal.tsx`)
- [ ] Manejar caso "gift card cubre todo" (sin MercadoPago)
- [ ] Manejar caso "pago parcial" (gift card + MercadoPago)
- [ ] Actualizar `mp-webhook` con lógica de emisión automática
- [ ] Deploy del webhook: `npx supabase functions deploy mp-webhook --no-verify-jwt --project-ref rsvcgduyogqljwzbohkz`
- [ ] `npm run build` para compilar el frontend
- [ ] Test: compra gift card → pago MP → emisión → WhatsApp
- [ ] Test: canje en checkout → verificar descuento de saldo
- [ ] Test: pago parcial → gift card + MP
