# Configuración de Supabase para ESTUDIO

Esta guía te ayudará a configurar Supabase para la tienda online.

## 1. Crear Proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com) y creá una cuenta
2. Hacé clic en **"New Project"**
3. Completá:
   - **Organization:** Tu organización
   - **Project name:** `estudio-tienda`
   - **Database Password:** (guardalo de forma segura)
   - **Region:** South America (São Paulo) - para mejor latencia en Argentina
4. Esperá a que se cree el proyecto (~2 minutos)

## 2. Obtener Credenciales

1. En el dashboard, andá a **Settings** → **API**
2. Copiá estos valores:
   - **Project URL** → Este es tu `VITE_SUPABASE_URL`
   - **anon public** → Este es tu `VITE_SUPABASE_ANON_KEY`

## 3. Configurar Variables de Entorno

1. Creá un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

2. Reiniciá el servidor de desarrollo (`npm run dev`)

## 4. Ejecutar el Esquema de Base de Datos

1. En Supabase, andá a **SQL Editor**
2. Hacé clic en **New Query**
3. Abrí el archivo `supabase/schema.sql` del proyecto
4. Copiá todo el contenido y pegalo en el editor
5. Hacé clic en **Run** (o Ctrl+Enter)

## 5. Configurar Storage (para imágenes)

1. En Supabase, andá a **Storage**
2. Hacé clic en **Create a new bucket**
3. Configurá:
   - **Name:** `products`
   - **Public bucket:** ✅ Sí
4. Repetí para crear el bucket `brands`

### Políticas de Storage

Ejecutá este SQL para permitir uploads desde el admin:

```sql
-- Política para ver imágenes públicamente
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id IN ('products', 'brands'));

-- Política para subir imágenes (solo autenticados)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('products', 'brands') 
  AND auth.role() = 'authenticated'
);
```

## 6. Configurar Autenticación Admin

Para el panel de administración, creá un usuario admin:

1. Andá a **Authentication** → **Users**
2. Hacé clic en **Add User** → **Create New User**
3. Email: `admin@estudio.com.ar`
4. Password: (contraseña segura)
5. Marcá **Auto Confirm User**

### Agregar rol de admin (opcional)

Ejecutá este SQL:

```sql
-- Crear tabla de perfiles de admin
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tu usuario como admin
INSERT INTO admin_profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'admin@estudio.com.ar';
```

## 7. Verificar Conexión

Una vez configurado, refrescá la página de la tienda. Si todo está bien:
- No deberías ver el warning de "Supabase no está configurado" en la consola
- Los productos deberían cargarse de la base de datos

## Estructura de Archivos

```
tienda/
├── .env                    # Credenciales (NO commitear)
├── .env.example            # Template de credenciales
├── supabase/
│   └── schema.sql          # Esquema de base de datos
└── src/
    └── lib/
        ├── supabase.js     # Cliente de Supabase
        ├── api.js          # Funciones para frontend público
        ├── orders.js       # Funciones para pedidos
        └── admin.js        # Funciones para panel admin
```

## Troubleshooting

### Error: "Invalid API key"
- Verificá que las variables de entorno estén bien copiadas
- Asegurate de reiniciar el servidor después de cambiar `.env`

### Error: "relation does not exist"
- Ejecutá el `schema.sql` en el SQL Editor de Supabase

### Las imágenes no cargan
- Verificá que los buckets de Storage sean públicos
- Verificá las políticas de Storage

## Próximos Pasos

1. ✅ Configurar Supabase
2. 🔲 Integrar Mercado Pago
3. 🔲 Configurar dominio
4. 🔲 Deploy a Vercel
