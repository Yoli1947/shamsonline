
import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, Save, X, RotateCcw } from 'lucide-react'
import { getSizeCurves, createSizeCurve, updateSizeCurve, deleteSizeCurve } from '../../lib/admin'
import { SIZE_HEADERS, detectSizeType } from '../../utils/tallesLogic'
import { SIZE_ORDER } from '../../lib/constants'

export default function Sizes() {
    const [curves, setCurves] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [newItem, setNewItem] = useState({ name: '', sizes: '' }) // sizes as string for input
    const [editItem, setEditItem] = useState({ name: '', sizes: '' })

    useEffect(() => {
        loadCurves()
    }, [])

    async function loadCurves() {
        setLoading(true)
        try {
            const data = await getSizeCurves()
            setCurves(data)
        } catch (error) {
            console.error('Error loading curves:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleImportDefaults = async () => {
        if (!confirm('¿Deseas importar las 8 curvas por defecto? Se agregarán a la lista.')) return

        setLoading(true)
        try {
            const promises = SIZE_HEADERS.map((sizes, index) => {
                // Filter empty strings
                const cleanSizes = sizes.filter(s => s !== '')
                return createSizeCurve({
                    name: `Curva Estándar ${index + 1} (${detectSizeType(cleanSizes[0])})`,
                    sizes: cleanSizes
                })
            })
            await Promise.all(promises)
            await loadCurves()
            alert('Curvas importadas correctamente.')
        } catch (error) {
            alert('Error al importar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar esta curva?')) return
        try {
            await deleteSizeCurve(id)
            setCurves(curves.filter(c => c.id !== id))
        } catch (error) {
            alert('Error: ' + error.message)
        }
    }

    const startEdit = (curve) => {
        setEditingId(curve.id)
        setEditItem({ name: curve.name, sizes: curve.sizes.join(', ') })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditItem({ name: '', sizes: '' })
    }

    const saveEdit = async () => {
        try {
            const sizesArray = editItem.sizes.split(',').map(s => s.trim()).filter(s => s !== '')
            const updated = await updateSizeCurve(editingId, {
                name: editItem.name,
                sizes: sizesArray
            })
            setCurves(curves.map(c => c.id === editingId ? updated : c))
            cancelEdit()
        } catch (error) {
            alert('Error al actualizar: ' + error.message)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            const sizesArray = newItem.sizes.split(',').map(s => s.trim()).filter(s => s !== '')
            const created = await createSizeCurve({
                name: newItem.name,
                sizes: sizesArray
            })
            setCurves([...curves, created])
            setNewItem({ name: '', sizes: '' })
        } catch (error) {
            alert('Error al crear: ' + error.message)
        }
    }

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="admin-title" style={{ margin: 0 }}>Gestión de Talles</h1>
                <button onClick={handleImportDefaults} className="admin-btn admin-btn-secondary">
                    <RotateCcw size={16} />
                    Importar Predeterminados
                </button>
            </div>

            {/* Crear Nueva */}
            <div className="admin-card">
                <h3 style={{ fontFamily: 'Syncopate, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', marginTop: 0, color: '#C4956A' }}>Nueva Curva de Talles</h3>
                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block', color: '#999' }}>Nombre Referencia</label>
                        <input
                            className="admin-input"
                            placeholder="Ej: Camisas Hombre"
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block', color: '#999' }}>Talles (separados por coma)</label>
                        <input
                            className="admin-input"
                            placeholder="S, M, L, XL"
                            value={newItem.sizes}
                            onChange={e => setNewItem({ ...newItem, sizes: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary" style={{ marginBottom: '2px' }}>
                        <Plus size={16} /> Crear
                    </button>
                </form>
            </div>

            {/* Lista */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Nombre</th>
                            <th style={{ width: '50%' }}>Talles</th>
                            <th style={{ width: '20%', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Cargando curvas de talles...</td></tr>
                        ) : curves.length === 0 ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No hay curvas de talles definidas.</td></tr>
                        ) : (
                            curves.map(curve => (
                                <tr key={curve.id}>
                                    {editingId === curve.id ? (
                                        <>
                                            <td>
                                                <input
                                                    className="admin-input"
                                                    value={editItem.name}
                                                    onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="admin-input"
                                                    value={editItem.sizes}
                                                    onChange={e => setEditItem({ ...editItem, sizes: e.target.value })}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button onClick={saveEdit} className="admin-btn admin-btn-primary" style={{ padding: '0.5rem' }} title="Guardar">
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={cancelEdit} className="admin-btn admin-btn-danger" style={{ padding: '0.5rem' }} title="Cancelar">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ fontWeight: 600 }}>{curve.name}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {[...curve.sizes].sort((a, b) => {
                                                        const indexA = SIZE_ORDER.indexOf(String(a).toUpperCase());
                                                        const indexB = SIZE_ORDER.indexOf(String(b).toUpperCase());
                                                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                                        if (indexA !== -1) return -1;
                                                        if (indexB !== -1) return 1;
                                                        return String(a).localeCompare(String(b));
                                                    }).map((s, i) => (
                                                        <span key={i} className="admin-badge admin-badge-neutral">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button onClick={() => startEdit(curve)} className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem' }} title="Editar">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(curve.id)} className="admin-btn admin-btn-danger" style={{ padding: '0.5rem' }} title="Eliminar">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
