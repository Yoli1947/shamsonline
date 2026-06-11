import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllOrders, updateOrderStatus, cancelOrder, removeOrderItem, updatePaymentStatus, deleteCancelledOrders } from '../../lib/admin'
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

function OrderRow({ order, onStatusChange, onCancel, onItemRemoved }) {
    const [expanded, setExpanded] = useState(false)
    const [changingStatus, setChangingStatus] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [confirmCancel, setConfirmCancel] = useState(false)
    const [removingItemId, setRemovingItemId] = useState(null)
    const [removeError, setRemoveError] = useState(null)
    const [updatingPayment, setUpdatingPayment] = useState(false)

    const handlePaymentStatus = async (e, newStatus) => {
        e.stopPropagation()
        setUpdatingPayment(true)
        try {
            await updatePaymentStatus(order.id, newStatus)
            onItemRemoved()
        } finally {
            setUpdatingPayment(false)
        }
    }

    const handleRemoveItem = async (e, itemId) => {
        e.stopPropagation()
        setRemovingItemId(itemId)
        setRemoveError(null)
        try {
            await removeOrderItem(order.id, itemId)
            onItemRemoved()
        } catch (err) {
            setRemoveError(err.message)
        } finally {
            setRemovingItemId(null)
        }
    }

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
                <tr style={{ background: '#f1f3f5' }}>
                    <td colSpan={7} style={{ padding: '12px 16px 20px' }}>

                        {/* Fila superior: artículos + totales */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                            {/* Artículos */}
                            <div style={{ flex: 2, minWidth: 260 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 6 }}>ARTÍCULOS</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {removeError && (
                                        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '6px 12px', marginBottom: 6, fontSize: 12, color: '#b91c1c' }}>
                                            {removeError}
                                        </div>
                                    )}
                                    {order.items?.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', opacity: removingItemId === item.id ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                                            {item.product_image && (
                                                <img src={item.product_image} alt={item.product_name} style={{ width: 36, height: 46, objectFit: 'cover', borderRadius: 4 }} loading="lazy" />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{item.product_name}</div>
                                                <div style={{ color: '#6b7280', fontSize: 11 }}>
                                                    {item.product_brand} {item.size && `· Talle ${item.size}`} {item.color && `· ${item.color}`}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: 13 }}>
                                                <div style={{ fontWeight: 700, color: '#111827' }}>{fmt(item.subtotal)}</div>
                                                <div style={{ color: '#6b7280', fontSize: 11 }}>x{item.quantity} · {fmt(item.unit_price)} c/u</div>
                                            </div>
                                            <button
                                                onClick={(e) => handleRemoveItem(e, item.id)}
                                                disabled={removingItemId !== null}
                                                title="Eliminar artículo"
                                                style={{
                                                    marginLeft: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                                                    border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
                                                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: removingItemId !== null ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700, flexShrink: 0
                                                }}
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totales */}
                            <div style={{ flex: 1, minWidth: 200, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 10 }}>RESUMEN</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280' }}>Subtotal</span>
                                        <span style={{ color: '#111827', fontWeight: 600 }}>{fmt(order.subtotal || order.total)}</span>
                                    </div>
                                    {Number(order.discount) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#10B981' }}>Descuento</span>
                                            <span style={{ color: '#10B981', fontWeight: 700 }}>− {fmt(order.discount)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280' }}>Envío</span>
                                        <span style={{ color: '#111827', fontWeight: 600 }}>{Number(order.shipping_cost) > 0 ? fmt(order.shipping_cost) : 'Sin cargo'}</span>
                                    </div>
                                    <div style={{ borderTop: '2px solid #111827', marginTop: 4, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#111827', fontWeight: 800, fontSize: 14 }}>TOTAL</span>
                                        <span style={{ color: '#111827', fontWeight: 800, fontSize: 16 }}>{fmt(order.total)}</span>
                                    </div>
                                    <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 4 }}>MÉTODO DE PAGO</div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', textTransform: 'capitalize' }}>{order.payment_method}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info cliente */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 10 }}>
                            {[
                                { label: 'CLIENTE', value: `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim() },
                                { label: 'EMAIL', value: order.customer_email },
                                { label: 'TELÉFONO', value: order.customer_phone },
                                { label: 'DNI', value: order.customer_dni },
                            ].filter(f => f.value).map(({ label, value }) => (
                                <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</div>
                                </div>
                            ))}
                            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', flex: 1 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 2 }}>ENVÍO</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                                    {order.shipping_address
                                        ? `${order.shipping_address} ${order.shipping_number}, ${order.shipping_city}, ${order.shipping_province}`
                                        : 'Retiro en local'}
                                </div>
                            </div>
                            {order.admin_notes && (
                                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#D97706', marginBottom: 2 }}>NOTA</div>
                                    <div style={{ fontSize: 13, color: '#92400E' }}>{order.admin_notes}</div>
                                </div>
                            )}
                        </div>

                        {/* Acciones */}
                        {order.status !== 'cancelled' && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                {order.payment_status !== 'paid' && (
                                    <button
                                        onClick={(e) => handlePaymentStatus(e, 'paid')}
                                        disabled={updatingPayment}
                                        style={{
                                            background: 'rgba(16,185,129,0.15)', color: '#059669',
                                            border: '1px solid rgba(16,185,129,0.4)',
                                            padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            cursor: updatingPayment ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {updatingPayment ? 'Guardando...' : '✓ Marcar como Pagado'}
                                    </button>
                                )}
                                {order.payment_status === 'paid' && (
                                    <button
                                        onClick={(e) => handlePaymentStatus(e, 'pending')}
                                        disabled={updatingPayment}
                                        style={{
                                            background: 'rgba(245,158,11,0.1)', color: '#D97706',
                                            border: '1px solid rgba(245,158,11,0.3)',
                                            padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            cursor: updatingPayment ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {updatingPayment ? 'Guardando...' : '↩ Marcar como Pendiente'}
                                    </button>
                                )}
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
    const [searchParams] = useSearchParams()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState(null)
    const [search, setSearch] = useState(searchParams.get('email') || '')
    const [total, setTotal] = useState(0)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const loadOrders = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { orders: data, count } = await getAllOrders({ status: filter, limit: 200 })
            setOrders(data)
            setTotal(count || 0)
        } catch (e) {
            if (e.name === 'AbortError') return
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

    const handleDeleteCancelled = async () => {
        setDeleting(true)
        try {
            await deleteCancelledOrders()
            setShowDeleteModal(false)
            await loadOrders()
        } finally {
            setDeleting(false)
        }
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

    const cancelledCount = orders.filter(o => o.status === 'cancelled').length

    return (
        <div style={{ color: 'var(--color-text)', fontFamily: 'inherit' }}>

            {/* Modal eliminar anulados */}
            {showDeleteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <div style={{ fontSize: 32, marginBottom: 12, textAlign: 'center' }}>🗑️</div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', textAlign: 'center', margin: '0 0 8px' }}>Eliminar pedidos anulados</h2>
                        <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>
                            Se van a eliminar permanentemente <strong style={{ color: '#EF4444' }}>{cancelledCount} pedidos anulados</strong> y todos sus artículos. Esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteCancelled}
                                disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14, opacity: deleting ? 0.7 : 1 }}
                            >
                                {deleting ? 'Eliminando...' : 'Sí, eliminar todo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.05em', margin: 0 }}>PEDIDOS</h1>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>{total} pedidos en total</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                    >
                        🗑 Eliminar anulados
                    </button>
                    <button
                        onClick={loadOrders}
                        style={{ background: 'var(--color-background-alt)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                    >
                        <RefreshCw size={14} /> Actualizar
                    </button>
                </div>
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
                                    onItemRemoved={loadOrders}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
