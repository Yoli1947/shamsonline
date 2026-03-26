# Supabase — Base de datos Shams Outlet

## Estructura

```
supabase/
├── migrations/          # Migraciones de schema (ejecutar en orden)
│   ├── 20240210_create_size_curves.sql
│   └── 20260226_fix_rls_admin_only.sql
│
├── scripts/             # Scripts de mantenimiento y correcciones puntuales
│   ├── SECURE_PRODUCTION.sql       — Políticas RLS de producción
│   ├── GIFT_CARDS_MIGRATION.sql    — Creación de tabla gift_cards
│   ├── UPDATE_SCHEMA_V2.sql        — Extensiones al schema original
│   ├── FIX_PEDIDOS_RLS.sql         — Permisos de la tabla orders
│   ├── FIX_RLS_ROLES.sql           — Roles de usuario
│   ├── FIX_USER_ROLES_RLS.sql      — Políticas de user_roles
│   ├── CREAR_ADMINISTRADOR.sql     — Asignar rol admin a un usuario
│   ├── RESETEAR_CLAVE.sql          — Reset de contraseña de admin
│   └── ... (otros scripts de fix y mantenimiento)
│
└── README.md            # Este archivo
```

## Cómo ejecutar

1. **Migrations** → deben ejecutarse **en orden** en el SQL Editor de Supabase Dashboard
2. **Scripts** → ejecutar individualmente según necesidad; **leer el contenido antes de ejecutar**

## Acceso al SQL Editor

[Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/nksmphozttipzpdrxhft/sql)

## Scripts clave de seguridad

| Script | Propósito | ¿Ejecutado? |
|--------|-----------|-------------|
| `migrations/20260226_fix_rls_admin_only.sql` | RLS con `is_admin()` — solo admins pueden hacer CRUD | Pendiente |
| `SECURE_PRODUCTION.sql` | Políticas generales de producción | ✓ |
| `FIX_PEDIDOS_RLS.sql` | Permisos de tabla orders | Pendiente |

## Notas

- Los archivos en `scripts/` son correcciones puntuales, **no** migraciones idempotentes.
- Antes de ejecutar cualquier `RESET_*` o `DELETE_*`, hacer backup de los datos.
