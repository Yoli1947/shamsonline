import { Outlet, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Boxes,
    Tags,
    Percent,
    ShoppingCart,
    Settings,
    LogOut,
    Menu,
    X,
    Eye,
    Ruler,
    ImageIcon,
    GripVertical,
    Camera,
    Plus,
    Star,
    User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './AdminLayout.css';

export default function AdminLayout() {
    const { user, logout, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const content = document.querySelector('.admin-content');
        if (content) content.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname]);

    if (loading) {
        return <div className="admin-loading">Cargando...</div>;
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/admin/login" replace />;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/productos', icon: Package, label: 'Productos' },
        { path: '/admin/productos?new=true', icon: Plus, label: 'Crear Artículo', action: 'new' },
        { path: '/admin/stock', icon: Boxes, label: 'Stock' },
        { path: '/admin/marcas', icon: Tags, label: 'Marcas' },
        { path: '/admin/categorias', icon: Tags, label: 'Categorías' },
        { path: '/admin/temporadas', icon: Tags, label: 'Temporadas' },
        { path: '/admin/talles', icon: Ruler, label: 'Talles' },
        { path: '/admin/pedidos', icon: ShoppingCart, label: 'Pedidos' },
        { path: '/admin/clientes', icon: User, label: 'Clientes' },
        { path: '/admin/promociones', icon: Percent, label: 'Promociones Vigentes' },
        { path: '/admin/imagenes', icon: ImageIcon, label: 'Carga de Fotos' },
        { path: '/admin/orden-productos', icon: GripVertical, label: 'Orden Productos' },
        { path: '/admin/ultimos-ingresos', icon: Star, label: 'Últimos Ingresos' },
        { path: '/admin/imagenes-marcas', icon: Camera, label: 'Imágenes Marcas' },
        { path: '/admin/configuracion', icon: Settings, label: 'Configuración' },
    ];

    return (
        <div className="admin-layout">
            <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : 'desktop-closed'}`}>
                <div className="admin-sidebar__header">
                    <h1 className="admin-sidebar__logo" style={{ fontWeight: 900, letterSpacing: '0.5em' }}>SHAMS</h1>
                    <span className="admin-sidebar__badge">ADMIN</span>
                    <button className="admin-sidebar__close" onClick={() => setSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="admin-sidebar__nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar__footer">
                    <button className="admin-sidebar__link" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {sidebarOpen && (
                <div className="admin-overlay md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <div className={`admin-main ${!sidebarOpen ? 'full-width' : ''}`}>
                <header className="admin-header">
                    <button className="admin-header__menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-header__view-store">
                            <Eye size={18} />
                            <span>Ver Tienda</span>
                        </a>
                        <div className="admin-header__user">
                            <span>{user?.email || 'Admin'}</span>
                        </div>
                    </div>
                </header>

                <AutoUnifyOreiro user={user} />

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

const AutoUnifyOreiro = ({ user }) => {
    useEffect(() => {
        const runUnify = async () => {
            if (localStorage.getItem('shams_oreiro_unified_v3')) return;
            if (!user || user.role !== 'admin') return;
            
            try {
                const { data: allBrands } = await supabase.from('brands').select('id, name');
                const oreiroLove = allBrands?.find(b => b.name.toUpperCase().includes('OREIRO LOVE'));
                const lasOreiro = allBrands?.find(b => b.name.toUpperCase().includes('LAS OREIRO'));

                if (oreiroLove) {
                   if (lasOreiro) {
                       await supabase.from('products').update({ brand_id: oreiroLove.id }).eq('brand_id', lasOreiro.id);
                       await supabase.from('brands').delete().eq('id', lasOreiro.id);
                   }
                   await supabase.from('products').update({ brand_id: oreiroLove.id }).or('provider.ilike.%OREIRO%,provider.ilike.%ALLBRAND%');
                   localStorage.setItem('shams_oreiro_unified_v3', 'true');
                }
            } catch (e) {
                console.error('Auto-unify error:', e);
            }
        };
        runUnify();
    }, [user]);
    return null;
};
