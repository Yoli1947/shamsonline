import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, ShoppingBag, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, ExternalLink, TrendingUp, Eye, Plus, Package, Boxes } from 'lucide-react'
import { getDashboardStats, getRecentOrders } from '../../lib/admin'
import './Dashboard.css'

export default function Dashboard() {
    const [stats, setStats] = useState({
        todayOrders: 0,
        monthRevenue: 0,
        pendingOrders: 0,
        lowStockItems: 0
    })
    const [recentOrders, setRecentOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadDashboardData() {
            try {
                const [statsData, ordersData] = await Promise.all([
                    getDashboardStats(),
                    getRecentOrders()
                ])
                setStats(statsData)
                setRecentOrders(ordersData)
            } catch (error) {
                console.error('Error loading dashboard:', error)
            } finally {
                setLoading(false)
            }
        }

        loadDashboardData()
    }, [])

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'success'
            case 'pending': return 'warning'
            case 'cancelled': return 'error'
            default: return 'default'
        }
    }

    if (loading) return <div className="dashboard-loading">Cargando estadísticas...</div>

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <h1>Dashboard</h1>
                <p>Resumen de actividad de la tienda</p>
            </div>

            {/* Stats Grid */}
            <div className="dashboard__grid">
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--blue">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-card__info">
                        <h3>Ventas del Mes</h3>
                        <p className="stat-card__value">{formatCurrency(stats.monthRevenue)}</p>
                        <span className="stat-card__trend stat-card__trend--up">
                            <ArrowUpRight size={16} /> Este mes
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--green">
                        <BarChart3 size={24} />
                    </div>
                    <div className="stat-card__info">
                        <h3>Pedidos Hoy</h3>
                        <p className="stat-card__value">{stats.todayOrders}</p>
                        <span className="stat-card__subtext">Nuevos pedidos</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--orange">
                        <Users size={24} />
                    </div>
                    <div className="stat-card__info">
                        <h3>Pendientes</h3>
                        <p className="stat-card__value">{stats.pendingOrders}</p>
                        <span className="stat-card__trend stat-card__trend--neutral">
                            Por despachar
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--red">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-card__info">
                        <h3>Bajo Stock</h3>
                        <p className="stat-card__value">{stats.lowStockItems}</p>
                        <span className="stat-card__trend stat-card__trend--down">
                            <ArrowDownRight size={16} /> Productos
                        </span>
                    </div>
                </div>
            </div>

            {/* Google Analytics */}
            <div style={{ margin: '24px 0', padding: '20px 24px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(251,188,5,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={20} color="#FBBC05" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--color-text)' }}>Google Analytics</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Visitantes, páginas vistas y comportamiento en tiempo real</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <a
                            href="https://analytics.google.com/analytics/web/#/p/reports/realtime"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(251,188,5,0.1)', border: '1px solid rgba(251,188,5,0.3)', borderRadius: '8px', color: '#FBBC05', fontSize: '12px', fontWeight: '700', textDecoration: 'none', cursor: 'pointer' }}
                        >
                            <Eye size={14} /> Tiempo Real
                        </a>
                        <a
                            href="https://analytics.google.com/analytics/web/#/p/reports/overview"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.3)', borderRadius: '8px', color: '#4285F4', fontSize: '12px', fontWeight: '700', textDecoration: 'none', cursor: 'pointer' }}
                        >
                            <BarChart3 size={14} /> Ver Estadísticas <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            </div>

            <div className="dashboard__content">
                {/* Acciones Rápidas */}
                <div className="dashboard__section" style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Acciones Rápidas</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        <Link to="/admin/productos?new=true" className="quick-action-card" style={{ textDecoration: 'none' }}>
                            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '15px', fontWeight: '800', color: '#111', letterSpacing: '0.05em' }}>NUEVO ARTÍCULO</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#666', marginTop: '4px' }}>Carga manual paso a paso</span>
                                </div>
                            </div>
                        </Link>

                        <Link to="/admin/stock" className="quick-action-card" style={{ textDecoration: 'none' }}>
                            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                                    <Boxes size={24} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '15px', fontWeight: '800', color: '#111', letterSpacing: '0.05em' }}>CARGA MASIVA</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#666', marginTop: '4px' }}>Importar desde Excel de Stock</span>
                                </div>
                            </div>
                        </Link>

                        <Link to="/admin/productos" className="quick-action-card" style={{ textDecoration: 'none' }}>
                            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                                    <Package size={24} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '15px', fontWeight: '800', color: '#111', letterSpacing: '0.05em' }}>LISTADO TOTAL</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#666', marginTop: '4px' }}>Ver y editar catálogo completo</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
                {/* Recent Orders */}
                <div className="dashboard__section">
                    <h2>Pedidos Recientes</h2>
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Cliente</th>
                                    <th>Estado</th>
                                    <th>Total</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>#{order.order_number}</td>
                                            <td>{order.customer_first_name} {order.customer_last_name}</td>
                                            <td>
                                                <span className={`status-badge status-badge--${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>{formatCurrency(order.total)}</td>
                                            <td>{formatDate(order.created_at)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center">No hay pedidos recientes</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
