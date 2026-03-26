# Brief: Sistema de Importación Excel — shamsonline

## Contexto del proyecto

E-commerce de indumentaria construido con Next.js + Supabase.
El panel admin permite importar una planilla Excel para sincronizar productos, precios y stock.

**Stack:** Next.js, Supabase (PostgreSQL), biblioteca `xlsx` para parseo, React.

---

## Archivos clave

| Archivo | Rol |
|---|---|
| `pages/admin/Stock.jsx` | Toda la lógica de import (frontend + procesamiento) |
| `lib/admin.js` | Funciones de acceso a Supabase (`batchUpsertProducts`, `batchUpsertVariants`) |
| `lib/constants.js` | `COLOR_MAP` (nombre → hex) y `SIZE_ORDER` (orden de talles) |
| `lib/supabase.js` | Cliente Supabase |

---

## Tablas en Supabase

### `products`
Columnas relevantes al import:
- `id`, `slug` — identificadores internos
- `sku` — código principal (mayor prioridad en deduplicación)
- `code` — código secundario
- `provider_sku` — código del proveedor (menor prioridad)
- `name` — nombre del producto
- `brand_id` → FK a `brands(id, name)`
- `category_id` → FK a `categories(id, name)`
- `gender` — string: `'Mujer'`, `'Hombre'`, `'Unisex'`
- `features` — array JSON (incluye el género)
- `price` — precio de venta
- `sale_price` — precio oferta (protegido, ver reglas abajo)
- `cost_price` — precio de costo
- `provider` — nombre del proveedor
- `size_type` — número 1-9 (define la curva de talles)
- `season` — temporada/colección
- `is_published` — booleano
- `is_active` — booleano

### `product_variants`
- `id`, `product_id` → FK a products
- `size` — string (ej: `'M'`, `'42'`, `'U'`)
- `color` — string (ej: `'negro'`)
- `color_code` — hex derivado del COLOR_MAP (ej: `'#000000'`)
- `stock` — número entero
- `sku` — código de variante

### `site_settings`
- Guarda lista de temporadas disponibles (se actualiza automáticamente si el Excel trae una temporada nueva)

### `brands` / `categories`
- Se crean automáticamente si no existen al hacer el import

---

## Columnas del Excel y su mapeo

### Identificación del producto
| Columna Excel | Campo DB | Notas |
|---|---|---|
| `CODIGO` / `CODIGO INTERNO` / `ARTICULO` | `sku` | Clave principal |
| `CODIGO PROVEEDOR` | `provider_sku` | Clave secundaria |

### Datos del producto
| Columna Excel | Campo DB | Notas |
|---|---|---|
| `DESCRIPCION` / `PRODUCTO` | `name` | |
| `MARCA` | `brand_id` | Busca en `brands`, crea si no existe |
| `FAMILIA/CATEGORIA` / `CATEGORIA` | `category_id` | Busca en `categories`, crea si no existe |
| `GENERO` / `Género` | `gender`, `features` | Valores: Mujer/Hombre/Unisex |
| `PROVEEDOR` | `provider` | |
| `TIPO TALLE` | `size_type` | Número 1-9, define la curva de talles |
| `TEMPORADA` / `Temporada` / `season` | `season` | Si es nueva se agrega a site_settings |
| `PRECIO` | `price` | Ver regla de protección abajo |
| `COSTO` | `cost_price` | |
| `PRECIO OFERTA` | *(no sobreescribe)* | Ignorado si ya existe sale_price |
| `PUBLICADO` | `is_published` | SI → true, NO → false |

### Stock (variantes)

**Formato multi-talle:**
| Columna | Descripción |
|---|---|
| `COLOR` | Color de la variante |
| `STOCK_T01` a `STOCK_T12` | Stock por posición de talle según TIPO TALLE |

**Formato talle único:**
| Columna | Descripción |
|---|---|
| `TALLE` / `talle` | Talle específico |
| `STOCK` / `stock` | Cantidad |

---

## Curvas de talles (TIPO TALLE)

```
TIPO 1: XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL
TIPO 2: 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45
TIPO 3: 36, 38, 40, 42, 44, 46, 48, 50, 52, 54
TIPO 4: 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54
TIPO 5: 44, 46, 48, 50, 52, 54, 56, 58, 60
TIPO 6: 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34
TIPO 7: U (talle único)
TIPO 8: 0, 1, 2, 3, 4, 5, 6, 7
TIPO 9: 20, 22, 24, 26, 28, 30, 32, 36
```

`STOCK_T01` = primera posición de la curva, `STOCK_T02` = segunda, etc.

---

## Reglas de negocio importantes

### 1. Deduplicación de productos
Prioridad de matching al buscar producto existente:
1. `sku` (mayor prioridad)
2. `code`
3. `provider_sku` (menor prioridad)

Si no se encuentra → se crea producto nuevo.

### 2. Protección de precios oferta
- Si un producto ya tiene `sale_price`, el `PRECIO` del Excel se guarda como `price` (referencia) **pero el `sale_price` existente NO se toca**.
- La columna `PRECIO OFERTA` del Excel nunca sobreescribe el `sale_price` de la DB.

### 3. Creación automática de marcas/categorías
Si `MARCA` o `CATEGORIA` no existen en la DB, se crean automáticamente.

### 4. Temporadas
Si la temporada del Excel no existe en `site_settings`, se agrega automáticamente.

### 5. Procesamiento en chunks
- Productos: chunks de 100
- Variantes: chunks de 500
Esto evita timeouts en imports grandes.

---

## Dos modos de import

### Modo 1: Import completo
Función: `handleFileUpload()` en `Stock.jsx`
- Actualiza producto completo (nombre, marca, categoría, precio, etc.)
- Crea o actualiza variantes (talle, color, stock)
- Crea productos/marcas/categorías que no existen

### Modo 2: Solo stock
Función: `handleUpdateStockOnly()` en `Stock.jsx`
- Solo actualiza el campo `stock` en `product_variants`
- No toca ningún dato del producto
- Matching por SKU + talle + color

---

## Funciones de la API (lib/admin.js)

```js
// Upsert masivo de productos
batchUpsertProducts(products, onConflict)
// onConflict: 'id' para update, 'slug' para insert nuevo

// Upsert masivo de variantes
batchUpsertVariants(variants)
// Usa upsert nativo de Supabase, sin onConflict explícito
```

---

## Formatos de archivo aceptados

`.xlsx`, `.xls`, `.csv`

---

## COLOR_MAP (nombre → hex)

```
negro → #000000, blanco → #FFFFFF, rojo → #FF0000,
azul → #0000FF, verde → #008000, amarillo → #FFFF00,
gris → #808080, rosa → #FFC0CB, violeta → #8B00FF,
marron → #8B4513, naranja → #FFA500, beige → #F5F5DC,
celeste → #87CEEB, crema → #FFFDD0, camel → #C19A6B,
bordeaux → #800020, marino → #000080, jean → #5f9ea0,
fucsia → #FF00FF, oro → #FFD700, plata → #C0C0C0, etc.
```

---

## Template de Excel (estructura esperada)

Columnas en orden:
`CODIGO | CODIGO PROVEEDOR | DESCRIPCION | TEMPORADA | MARCA | PROVEEDOR | TIPO TALLE | COLOR | FAMILIA/CATEGORIA | SUB-FAMILIA | GENERO | COSTO | PRECIO | PRECIO OFERTA | STOCK_T01 | STOCK_T02 | ... | STOCK_T12 | OBSERVACION | URL | PUBLICADO`

---

## Lo que NO hace el import

- No elimina productos ni variantes existentes (solo upsert)
- No actualiza imágenes
- No modifica descripciones largas
- No toca `sale_price` si ya existe
- No borra stock de variantes que no aparezcan en el Excel
