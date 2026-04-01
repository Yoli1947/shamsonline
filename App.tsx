import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

// Carga inmediata: Store principal y widgets siempre visibles
import Store from './Store';
import WhatsAppButton from './components/WhatsAppButton';
import BackToTopButton from './components/BackToTopButton';

// Carga diferida: admin y páginas secundarias (solo se descargan cuando se navega a ellas)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Products = lazy(() => import('./pages/admin/Products'));
const Stock = lazy(() => import('./pages/admin/Stock'));
const Brands = lazy(() => import('./pages/admin/Brands'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const Seasons = lazy(() => import('./pages/admin/Seasons'));
const Sizes = lazy(() => import('./pages/admin/Sizes'));
const Images = lazy(() => import('./pages/admin/Images'));
const Promotions = lazy(() => import('./pages/admin/Promotions'));
const GiftCards = lazy(() => import('./pages/admin/GiftCards'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const ProductOrder = lazy(() => import('./pages/admin/ProductOrder'));
const BrandImages = lazy(() => import('./pages/admin/BrandImages'));
const UltimosIngresos = lazy(() => import('./pages/admin/UltimosIngresos'));
const BrandsPage = lazy(() => import('./pages/BrandPage'));
const FuturistPreview = lazy(() => import('./pages/FuturistPreview'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Arrepentimiento = lazy(() => import('./pages/Arrepentimiento'));
const ComoComprar = lazy(() => import('./pages/ComoComprar'));
const EnviosYSeguimiento = lazy(() => import('./pages/EnviosYSeguimiento'));
const PreguntasFrecuentes = lazy(() => import('./pages/PreguntasFrecuentes'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const GiftCardPage = lazy(() => import('./pages/GiftCardPage'));

const ScrollToTop = () => {
  const location = useLocation();
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelector('.admin-content')?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);
  return null;
};

// Muestra widgets solo en páginas públicas
const PublicFloatingWidgets = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return (
    <>
      <WhatsAppButton />
      <BackToTopButton />
    </>
  );
};

// Fallback mientras se carga un chunk diferido
const PageLoader = () => (
  <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#E5D5C5] border-t-[#DCDCDC] rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Store Route */}
            <Route path="/" element={<Store />} />
            <Route path="/marcas" element={<BrandsPage />} />
            <Route path="/preview" element={<FuturistPreview />} />
            <Route path="/politicas-de-privacidad" element={<PrivacyPolicy />} />
            <Route path="/arrepentimiento" element={<Arrepentimiento />} />
            <Route path="/como-comprar" element={<ComoComprar />} />
            <Route path="/envios" element={<EnviosYSeguimiento />} />
            <Route path="/preguntas-frecuentes" element={<PreguntasFrecuentes />} />
            <Route path="/gift-cards" element={<GiftCardPage />} />
            <Route path="/orden/exito" element={<OrderSuccess />} />
            <Route path="/orden/pendiente" element={<OrderSuccess />} />

            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes (Protected) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="productos" element={<Products />} />
              <Route path="stock" element={<Stock />} />
              <Route path="marcas" element={<Brands />} />
              <Route path="categorias" element={<Categories />} />
              <Route path="temporadas" element={<Seasons />} />
              <Route path="talles" element={<Sizes />} />
              <Route path="promociones" element={<Promotions />} />
              <Route path="imagenes" element={<Images />} />
              <Route path="gift-cards" element={<GiftCards />} />
              <Route path="pedidos" element={<Orders />} />
              <Route path="clientes" element={<Customers />} />
              <Route path="configuracion" element={<Settings />} />
              <Route path="orden-productos" element={<ProductOrder />} />
              <Route path="ultimos-ingresos" element={<UltimosIngresos />} />
              <Route path="imagenes-marcas" element={<BrandImages />} />
            </Route>
          </Routes>
        </Suspense>
        <PublicFloatingWidgets />
      </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
