
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X, RefreshCw } from 'lucide-react'
import { getSeasons, saveSeasons, createSeason, deleteSeason } from '../../lib/admin'

export default function Seasons() {
    const [seasons, setSeasons] = useState([])
    const [loading, setLoading] = useState(true)
    const [newSeason, setNewSeason] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadSeasons()
    }, [])

    async function loadSeasons() {
        setLoading(true)
        try {
            const data = await getSeasons()
            setSeasons(data)
        } catch (error) {
            console.error('Error loading seasons:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newSeason.trim()) return
        
        setIsSaving(true)
        try {
            const updated = await createSeason(newSeason.trim())
            setSeasons(updated)
            setNewSeason('')
        } catch (error) {
            alert('Error al crear temporada: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (name) => {
        if (!confirm(`¿Seguro que deseas eliminar la temporada "${name}"?`)) return
        
        setIsSaving(true)
        try {
            const updated = await deleteSeason(name)
            setSeasons(updated)
        } catch (error) {
            alert('Error al eliminar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="admin-title" style={{ margin: 0 }}>Gestión de Temporadas</h1>
                <button onClick={loadSeasons} className="admin-btn admin-btn-secondary" disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* Crear Nueva */}
            <div className="admin-card">
                <h3 style={{ fontFamily: 'Syncopate, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', marginTop: 0, color: '#C4956A' }}>Nueva Temporada</h3>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block', color: '#999' }}>Nombre de la Temporada</label>
                        <input
                            className="admin-input"
                            placeholder="Ej: Invierno 2024, Verano 2025..."
                            value={newSeason}
                            onChange={e => setNewSeason(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving || !newSeason.trim()} style={{ height: '48px' }}>
                        <Plus size={16} /> Agregar
                    </button>
                </form>
            </div>

            {/* Lista */}
            <div className="admin-table-container" style={{ marginTop: '2rem' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Temporada</th>
                            <th style={{ width: '100px', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Cargando temporadas...</td></tr>
                        ) : seasons.length === 0 ? (
                            <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No hay temporadas definidas.</td></tr>
                        ) : (
                            seasons.map((season, index) => (
                                <tr key={index}>
                                    <td style={{ fontWeight: 600, fontSize: '1rem' }}>{season}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button 
                                            onClick={() => handleDelete(season)} 
                                            className="admin-btn admin-btn-danger" 
                                            style={{ padding: '0.5rem' }} 
                                            disabled={isSaving}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
