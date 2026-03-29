import { useState, useEffect, useCallback } from 'react'
import { getAllOrders, updateOrderStatus, cancelOrder } from '../../lib/admin'
import { Search, ChevronDown, ChevronUp, Package, Truck, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

const STATUS_CONFIG = {
    pending:    { label: 'Pendiente',    color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    processing: { label: 'En proceso',   color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    shipped:    { label: 'Enviado',      color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
    delivered:  { label: 'Entregado',    color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    cancelled:  { label: 'Anulado',      color: '#EF4444', bg: 'rgba(239,68,68,0.15)'  },
    refunded:   { label: 'Reembolsado',  color: '#6B7280', bg: 'rgba(107,114,128,0.15)'},
}

const PAYMENT_CONFIG = {
    pending:    { label: 'Pendiente',   color: '#F59E0B' },
    paid:       { label: 'Pagado',      color: '#10B981' },
    failed:     { label: 'Fallido',     color: '#EF4444' },
    refunded:   { label: 'Reembolsado', color: '#6B7280' },
}

const FILTERS = [
    { value: null,         label: 'Todos' },
    { value: 'pending',    label: 'Pendientes' },
    { value: 'processing', label: 'En proceso' },
    { value: 'shipped',    label: 'Enviados' },
    { value: 'delivered',  label: 'Entregados' },
    { value: 'cancelled',  label: 'Anulados' },
]

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
    return (
        <span style={{
            background: cfg.bg, color: cfg.color,
            padding: '3px 10px', borderRadius: 20, fontSize: 11,
            fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap'
        }}>
            {cfg.label}
        </span>
    )
}

function OrderRow({ order, onStatusChange, onCancel }) {
    const [expanded, setExpanded] = useState(false)
    const [changingStatus, setChangingStatus] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [confirmCancel, setConfirmCancel] = useState(false)

    const canCancel = !['cancelled', 'refunded', 'delivered'].includes(order.status)

    const handleStatusChange = async (newStatus) => {
        setChangingStatus(true)
        try {
            await onStatusChange(order.id, newStatus)
        } finally {
            setChangingStatus(false)
        }
    }

    const handleCancel = async () => {
        setCancelling(true)
        try {
            await onCancel(order.id)
            setConfirmCancel(false)
        } finally {
            setCancelling(false)
        }
    }

    const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
    const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

    return (
        <>
            <tr
                onClick={() => setExpanded(e => !e)}
                style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#DCDCDC', fontSize: 13 }}>
                    {order.order_number}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{order.customer_first_name} {order.customer_last_name}</div>
                    <div style={{ color: '#9ca3af', fontSize: 11 }}>{order.customer_email}</div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: '#9ca3af' }}>{fmtDate(order.created_at)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>{fmt(order.total)}</td>
                <td style={{ padding: '14px 16px' }}><StatusBadge status={order.status} /></td>
                <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: PAYMENT_CONFIG[order.payment_status]?.color || '#9ca3af', fontSize: 12, fontWeight: 600 }}>
                        {PAYMENT_CONFIG[order.payment_status]?.label || order.payment_status}
                    </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {expanded ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
                </td>
            </tr>

            {expanded && (
                <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <td colSpan={7} style={{ padding: '0 16px 20px' }}>
                        {/* Items */}
                        <div style={{ marginTop: 12, marginBottom: 16 }}>
                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>ARTÍCULOS</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {order.items?.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px' }}>
                                        {item.product_image && (
                                            <img src={item.product_image} alt={item.product_name} style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 4 }} loading="lazy" />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{item.product_name}</div>
                                            <div style={{ color: '#9ca3af', fontSize: 11 }}>
                                                {item.product_brand} {item.size && `· Talle ${item.size}`} {item.color && `· ${item.color}`}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: 13 }}>
                                            <div style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</div>
                                            <div style={{ color: '#9ca3af', fontSize: 11 }}>x{item.quantity} · {fmt(item.unit_price)} c/u</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Info envío */}
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16, fontSize: 12, color: '#9ca3af' }}>
                            <div>
                                <span style={{ color: '#6b7280', fontWeight: 700 }}>ENVÍO: </span>
                                {order.shipping_address
                                    ? `${order.shipping_address} ${order.shipping_number}, ${order.shipping_city}, ${order.shipping_province}`
                                    : 'Retiro en local'}
                            </div>
                            <div><span style={{ color: '#6b7280', fontWeight: 700 }}>PAGO: </span>{order.payment_method}</div>
                            {order.customer_phone && <div><span style={{ color: '#6b7280', fontWeight: 700 }}>TEL: </span>{order.customer_phone}</div>}
                            {order.admin_notes && <div><span style={{ color: '#6b7280', fontWeight: 700 }}>NOTA: </span>{order.admin_notes}</div>}
                        </div>

                        {/* Acciones */}
                        {order.status !== 'cancelled' && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>CAMBIAR ESTADO:</span>
                                {Object.entries(STATUS_CONFIG)
                                    .filter(([s]) => s !== 'cancelled' && s !== 'refunded' && s !== order.status)
                                    .map(([s, cfg]) => (
                                        <button
                                            key={s}
                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(s) }}
                                            disabled={changingStatus}
                                            style={{
                                                background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
                                                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                cursor: 'pointer', opacity: changingStatus ? 0.5 : 1
                                            }}
                                        >
                                            {cfg.label}
                                        </button>
                                    ))
                                }

                                {canCancel && !confirmCancel && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmCancel(true) }}
                                        style={{
                                            marginLeft: 'auto', background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                                            border: '1px solid rgba(239,68,68,0.3)', padding: '5px 14px',
                                            borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        Anular pedido
                                    </button>
                                )}

                                {confirmCancel && (
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>¿Confirmar anulación? Se restaurará el stock.</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCancel() }}
                                            disabled={cancelling}
                                            style={{
                                                background: '#EF4444', color: '#FFF', border: 'none',
                                                padding: '5px 14px', borderRadius: 20, fontSize: 11,
                                                fontWeight: 700, cursor: 'pointer'
                                            }}
                                        >
                                            {cancelling ? 'Anulando...' : 'Sí, anular'}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setConfirmCancel(false) }}
                                            style={{
                                                background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer'
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    )
}

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState(null)
    const [search, setSearch] = useState('')
    const [total, setTotal] = useState(0)

    const loadOrders = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { orders: data, count } = await getAllOrders({ status: filter, limit: 200 })
            setOrders(data)
            setTotal(count || 0)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => { loadOrders() }, [loadOrders])

    const handleStatusChange = async (orderId, newStatus) => {
        await updateOrderStatus(orderId, newStatus)
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }

    const handleCancel = async (orderId) => {
        await cancelOrder(orderId)
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
    }

    const filtered = orders.filter(o => {
        if (!search) return true
        const s = search.toLowerCase()
        return (
            o.order_number?.toLowerCase().includes(s) ||
            o.customer_email?.toLowerCase().includes(s) ||
            `${o.customer_first_name} ${o.customer_last_name}`.toLowerCase().includes(s)
        )
    })

    return (
        <div style={{ color: 'var(--color-text)', fontFamily: 'inherit' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.05em', margin: 0 }}>PEDIDOS</h1>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>{total} pedidos en total</p>
                </div>
                <button
                    onClick={loadOrders}
                    style={{ background: 'var(--color-background-alt)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                >
                    <RefreshCw size={14} /> Actualizar
                </button>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                    <button
                        key={String(f.value)}
                        onClick={() => setFilter(f.value)}
                        style={{
                            padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                            background: filter === f.value ? '#8B6F5E' : 'rgba(255,255,255,0.07)',
                            color: filter === f.value ? '#000' : '#9ca3af',
                            transition: 'all 0.2s'
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Buscador */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por N° pedido, cliente o email..."
                    style={{
                        width: '100%', background: 'var(--color-background-alt)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '10px 12px 10px 36px', color: 'var(--color-text)', fontSize: 13,
                        outline: 'none', boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Tabla */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Cargando pedidos...</div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#EF4444' }}>{error}</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
                    <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div>No hay pedidos {filter ? `con estado "${STATUS_CONFIG[filter]?.label}"` : ''}</div>
                </div>
            ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                {['N° Pedido', 'Cliente', 'Fecha', 'Total', 'Estado', 'Pago', ''].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 700, letterSpacing: '0.08em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(order => (
                                <OrderRow
                                    key={order.id}
                                    order={order}
                                    onStatusChange={handleStatusChange}
                                    onCancel={handleCancel}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
