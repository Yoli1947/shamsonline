import { Outlet, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
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
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import './AdminLayout.css'

export default function AdminLayout() {
    const { user, logout, loading } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024)
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        document.querySelector('.admin-content')?.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname])

    // Mostrar loading mientras se verifica la sesión
    if (loading) {
        return <div className="admin-loading">Cargando...</div>
    }

    // Proteger ruta - redirigir si no está autenticado o no es admin
    if (!user || user.role !== 'admin') {
        return <Navigate to="/admin/login" replace />
    }

    const handleLogout = async () => {
        await logout()
        navigate('/admin/login')
    }

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
    ]

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : 'desktop-closed'}`}>
                <div className="admin-sidebar__header">
                    <h1 className="admin-sidebar__logo" style={{ fontWeight: 900, letterSpacing: '0.5em' }}>SHAMS</h1>
                    <span className="admin-sidebar__badge">ADMIN</span>
                    <button
                        className="admin-sidebar__close"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="admin-sidebar__nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
                            }
                            onClick={() => {
                                // On mobile, close always. On desktop, user asked for Full Screen when clicking buttons.
                                // We'll toggle it closed.
                                setSidebarOpen(false)
                            }}
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

            {/* Overlay for mobile (only if open and screen is small) */}
            {sidebarOpen && (
                <div
                    className="admin-overlay md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className={`admin-main ${!sidebarOpen ? 'full-width' : ''}`}>
                <header className="admin-header">
                    <button
                        className="admin-header__menu"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu size={24} color="var(--color-text)" />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-header__view-store"
                            title="Ver Tienda Online"
                        >
                            <Eye size={18} />
                            <span>Ver Tienda</span>
                        </a>
                        <div className="admin-header__user">
                            <span>{user?.email || 'Admin'}</span>
                        </div>
                    </div>
                </header>



                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
