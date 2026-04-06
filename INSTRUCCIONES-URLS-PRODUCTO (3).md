# Instrucciones: URLs individuales por producto
# Para: Administrador/Desarrollador de shamsonline.com.ar y shamsoutlet.com
# Fecha: 2026-04-05

---

## Contexto

La tienda actualmente muestra productos en un modal/popup sin cambiar la URL. Necesitamos que cada producto tenga su propia URL para poder compartir links directos de compra desde la agente de ventas (Sofía).

## Formato de URL

```
https://shamsonline.com.ar/producto/{SKU}
```

Ejemplo: `https://shamsonline.com.ar/producto/P22301203N`

Se usa el campo `sku` de la tabla `products` en Supabase (ya existe).

---

## Cambios técnicos (4 cambios simples)

### 1. Configurar el hosting

El servidor/hosting debe servir `index.html` en todas las rutas (fallback SPA). Si no se hace esto, las URLs de producto dan error 404.

- Si usás Supabase Hosting: configurar en `supabase/config.toml`
- Si usás Netlify: agregar archivo `_redirects` con `/* /index.html 200`
- Si usás Vercel: agregar en `vercel.json` la regla de rewrite
- Si usás Nginx: agregar `try_files $uri $uri/ /index.html`

### 2. Al abrir el modal de un producto

Actualizar la URL sin recargar la página:

```js
// Agregar esta línea en la función que abre el modal del producto
window.history.pushState({}, '', `/producto/${producto.sku}`);
```

### 3. Al cerrar el modal

Restaurar la URL original:

```js
// Agregar esta línea en la función que cierra el modal
window.history.pushState({}, '', '/');
```

### 4. Al iniciar la app

Leer la URL y si contiene `/producto/SKU`, abrir ese producto automáticamente:

```js
// Agregar al inicio de la aplicación (cuando se carga por primera vez)
const match = window.location.pathname.match(/^\/producto\/(.+)$/);
if (match) {
  const sku = match[1];
  // Buscar el producto en Supabase por SKU
  // Si existe: abrir el modal de ese producto automáticamente
  // Si no existe: mostrar la tienda normalmente
}
```

---

## Cómo debe funcionar después del cambio

| Situación | Comportamiento |
|-----------|---------------|
| Navegación normal por la tienda | Igual que hoy, nada cambia |
| Click en un producto | El modal se abre Y la URL cambia a `/producto/SKU` |
| Cerrar el modal | La URL vuelve a `/` |
| Alguien visita un link directo | La tienda carga y abre el producto automáticamente |
| El SKU en la URL no existe | Muestra la tienda normalmente |
| Copiar y compartir la URL | La persona que recibe el link ve ese producto abierto |

---

## Lo que NO cambia

- El diseño y la apariencia de la tienda no cambian
- El modal de producto funciona exactamente igual
- El carrito, el checkout y el proceso de compra no se modifican
- La navegación y los filtros de productos funcionan igual
- La conexión con Supabase y la tabla `products` no cambia
- Los usuarios que entran por `shamsonline.com.ar` ven la tienda igual que hoy
- El único cambio visible es que la URL del navegador refleja el producto que se está mirando

---

## Para qué se necesita

La agente de ventas con IA (Sofía) atiende clientes por WhatsApp y chat web. Cuando un cliente quiere comprar un producto, Sofía necesita mandar un link directo para que el cliente haga click y compre.

Sin URLs por producto, Sofía tiene que derivar al WhatsApp de la tienda y el cliente pierde el impulso de compra.

Con URLs por producto, el flujo es:
1. Sofía recomienda un producto al cliente
2. Le manda el link: `shamsonline.com.ar/producto/P22301203N`
3. El cliente hace click y ve el producto listo para comprar
4. El cliente selecciona talle y paga

---

## Beneficios adicionales (SEO)

- Cada producto puede aparecer en resultados de Google
- Links compartidos en redes sociales muestran la imagen y descripción del producto
- Se puede agregar un sitemap.xml con todas las URLs de productos

---

## Checklist

- [ ] Configurar fallback SPA en el hosting (index.html para todas las rutas)
- [ ] Agregar `history.pushState('/producto/SKU')` al abrir modal
- [ ] Agregar `history.pushState('/')` al cerrar modal
- [ ] Leer URL al iniciar la app y abrir producto si corresponde
- [ ] Manejar caso de SKU no encontrado
- [ ] Probar que un link directo abre el producto correcto (navegador incógnito)
- [ ] Repetir los mismos cambios para shamsoutlet.com
