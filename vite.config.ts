import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    base: '/',
    server: {
      port: 3002,
      host: '0.0.0.0',
      proxy: {
        '/v1/shamsonline-cdn': {
          target: process.env.VITE_SUPABASE_URL || 'https://PLACEHOLDER.supabase.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/v1\/shamsonline-cdn/, ''),
          secure: false
        }
      }
    },
    plugins: [react()],
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            // React core — siempre necesario
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Supabase — carga junto con Store
            'vendor-supabase': ['@supabase/supabase-js'],
            // Animaciones — solo páginas públicas
            'vendor-motion': ['framer-motion'],
            // Admin-only: xlsx, dnd-kit — solo se descarga al entrar al admin
            'vendor-admin': ['xlsx', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
