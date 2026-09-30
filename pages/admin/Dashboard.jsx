import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, ShoppingBag, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, ExternalLink, TrendingUp, Eye, Plus, Package, Boxes } from 'lucide-react'
import { getDashboardStats, getRecentOrders, getVisitStats } from '../../lib/admin'
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
    const [visits, setVisits] = useState(null)
    const [visitsError, setVisitsError] = useState(false)

    // Se carga aparte para que un problema con las visitas no bloquee el resto del Dashboard.
    useEffect(() => {
        getVisitStats(30).then(setVisits).catch((error) => {
            console.error('Error loading visits:', error)
            setVisitsError(true)
        })
    }, [])

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

            {/* Visitas a la tienda (contador propio) */}
            <div style={{ margin: '24px 0', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                        <Eye size={20} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111' }}>Visitas a la tienda</h2>
                        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Personas distintas que entraron a multibrandrosario.com · contando desde el 30/09/2026</p>
                    </div>
                </div>

                {visitsError ? (
                    <p style={{ color: '#888', fontSize: '14px' }}>No se pudieron cargar las visitas. Probá recargar la página.</p>
                ) : !visits ? (
                    <p style={{ color: '#888', fontSize: '14px' }}>Cargando visitas...</p>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                            {[['Hoy', visits.today], ['Últimos 7 días', visits.last7], ['Últimos 30 días', visits.last30]].map(([label, v]) => (
                                <div key={label} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '16px 18px' }}>
                                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                                    <span style={{ display: 'block', fontSize: '32px', fontWeight: '800', color: '#111', lineHeight: 1.2, marginTop: '4px' }}>{v.visitors.toLocaleString('es-AR')}</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#666' }}>personas · {v.views.toLocaleString('es-AR')} páginas vistas</span>
                                </div>
                            ))}
                        </div>

                        {(() => {
                            const max = Math.max(1, ...visits.daily.map(d => d.visitors))
                            const fmtDay = (day) => new Date(`${day}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                            return (
                                <div style={{ marginBottom: '28px' }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#111', margin: '0 0 12px' }}>Personas por día (últimos 30 días)</h3>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '140px', borderBottom: '1px solid #eee' }}>
                                        {visits.daily.map(d => (
                                            <div
                                                key={d.day}
                                                title={`${fmtDay(d.day)}: ${d.visitors} personas, ${d.views} páginas vistas`}
                                                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
                                            >
                                                <div style={{ height: `${(d.visitors / max) * 100}%`, minHeight: d.visitors ? '3px' : 0, background: '#111', borderRadius: '3px 3px 0 0' }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginTop: '6px' }}>
                                        <span>{fmtDay(visits.daily[0].day)}</span>
                                        <span>Hoy</span>
                                    </div>
                                </div>
                            )
                        })()}

                        <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#111', margin: '0 0 12px' }}>Productos más vistos (últimos 30 días)</h3>
                        {visits.topProducts.length === 0 ? (
                            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Todavía no hay datos suficientes.</p>
                        ) : (
                            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#111' }}>
                                {visits.topProducts.map(p => (
                                    <li key={p.sku} style={{ padding: '4px 0' }}>
                                        <a href={`/producto/${p.sku}`} target="_blank" rel="noopener noreferrer" style={{ color: '#111', fontWeight: '600', textDecoration: 'none' }}>
                                            {p.name || p.sku}
                                        </a>
                                        <span style={{ color: '#888' }}> · {p.views} {p.views === 1 ? 'vista' : 'vistas'}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </>
                )}
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
